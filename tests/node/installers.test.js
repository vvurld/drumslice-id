"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {spawnSync} = require("node:child_process");

const ROOT = path.resolve(__dirname, "../..");
const installScript = path.join(ROOT, "install.sh");
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    env: Object.assign({}, process.env, options.env || {}),
  });
}

function isolatedArguments(directory) {
  return [
    "--skip-backend",
    "--max-packages-dir", path.join(directory, "Max Packages"),
    "--user-library", path.join(directory, "User Library"),
    "--install-root", path.join(directory, "state"),
    "--config", path.join(directory, "config", "backend.json"),
  ];
}

test("macOS installer copies, verifies, and removes a repository-independent runtime", {skip: process.platform !== "darwin"}, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "drumslice-id-installer-test-"));
  const args = isolatedArguments(directory);
  const packageDirectory = path.join(directory, "Max Packages", "DrumSliceID");
  const device = path.join(directory, "User Library", "Presets", "MIDI Effects", "Max MIDI Effect", "DrumSLICE ID.amxd");
  const installedUninstaller = path.join(directory, "state", "uninstall.sh");
  try {
    const installed = run("/bin/bash", [installScript, ...args]);
    assert.equal(installed.status, 0, installed.stderr || installed.stdout);
    assert.equal(fs.statSync(packageDirectory).isDirectory(), true);
    assert.equal(fs.lstatSync(packageDirectory).isSymbolicLink(), false);
    assert.equal(
      fs.readFileSync(path.join(packageDirectory, "node", "orchestrator.js"), "utf8"),
      fs.readFileSync(path.join(ROOT, "max", "node", "orchestrator.js"), "utf8"),
    );
    assert.equal(sha256(device), sha256(path.join(ROOT, "dist", "DrumSLICE ID.amxd")));
    assert.equal((fs.statSync(installedUninstaller).mode & 0o111) !== 0, true);

    fs.writeFileSync(path.join(packageDirectory, "stale-runtime-file.txt"), "remove me\n");
    fs.writeFileSync(device, "damaged device\n");
    const repaired = run("/bin/bash", [installScript, ...args]);
    assert.equal(repaired.status, 0, repaired.stderr || repaired.stdout);
    assert.equal(fs.existsSync(path.join(packageDirectory, "stale-runtime-file.txt")), false);
    assert.equal(sha256(device), sha256(path.join(ROOT, "dist", "DrumSLICE ID.amxd")));

    const verified = run("/bin/bash", [installScript, "--verify-only", ...args]);
    assert.equal(verified.status, 0, verified.stderr || verified.stdout);
    assert.match(verified.stdout, /byte-identical to this checkout/);

    const removedRuntime = run("/bin/bash", [installedUninstaller]);
    assert.equal(removedRuntime.status, 0, removedRuntime.stderr || removedRuntime.stdout);
    assert.equal(fs.existsSync(packageDirectory), false);
    assert.equal(fs.existsSync(device), false);
    assert.equal(fs.existsSync(installedUninstaller), true, "default uninstall must preserve the reusable backend/uninstaller");

    const removedBackend = run("/bin/bash", [installedUninstaller, "--remove-backend"]);
    assert.equal(removedBackend.status, 0, removedBackend.stderr || removedBackend.stdout);
    assert.equal(fs.existsSync(path.join(directory, "state")), false);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test("macOS installer refuses to replace an unrecognized package", {skip: process.platform !== "darwin"}, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "drumslice-id-installer-safety-"));
  const unrelated = path.join(directory, "Max Packages", "DrumSliceID", "unrelated.txt");
  try {
    fs.mkdirSync(path.dirname(unrelated), {recursive: true});
    fs.writeFileSync(unrelated, "keep me\n");
    const result = run("/bin/bash", [installScript, ...isolatedArguments(directory)]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /not a recognized DrumSliceID package/);
    assert.equal(fs.readFileSync(unrelated, "utf8"), "keep me\n");
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test("macOS installer removes only recognized pre-rename runtime files", {skip: process.platform !== "darwin"}, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "drumslice-id-installer-migration-"));
  const legacyPackage = path.join(directory, "Max Packages", "SliceLabeler");
  const legacyDevice = path.join(directory, "User Library", "Presets", "MIDI Effects", "Max MIDI Effect", "Slice Labeler.amxd");
  try {
    fs.mkdirSync(legacyPackage, {recursive: true});
    fs.writeFileSync(path.join(legacyPackage, "package-info.json"), JSON.stringify({name: "SliceLabeler"}));
    fs.mkdirSync(path.dirname(legacyDevice), {recursive: true});
    fs.writeFileSync(legacyDevice, "legacy");
    const result = run("/bin/bash", [installScript, ...isolatedArguments(directory)]);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(fs.existsSync(legacyPackage), false);
    assert.equal(fs.existsSync(legacyDevice), false);
    assert.equal(fs.existsSync(path.join(directory, "Max Packages", "DrumSliceID")), true);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test("macOS backend download requires an explicit ADTOF acknowledgement", {skip: process.platform !== "darwin"}, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "drumslice-id-license-gate-"));
  try {
    const result = run("/bin/bash", [installScript,
      "--max-packages-dir", path.join(directory, "Max Packages"),
      "--user-library", path.join(directory, "User Library"),
      "--install-root", path.join(directory, "state"),
      "--config", path.join(directory, "config", "backend.json"),
    ], {env: {DRUMSLICE_ID_ACCEPT_ADTOF_LICENSE: "0"}});
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /requires --accept-adtof-license/);
    assert.equal(fs.existsSync(path.join(directory, "state")), false);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test("installer entry points expose concise usage without mutating the machine", {skip: process.platform !== "darwin"}, () => {
  for (const script of ["install.sh", "uninstall.sh"]) {
    const result = run("/bin/bash", [path.join(ROOT, script), "--help"]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Usage:/);
  }
});

test("Windows entry points retain backend, copy, verification, manifest, and safety contracts", () => {
  const install = fs.readFileSync(path.join(ROOT, "install.ps1"), "utf8");
  const uninstall = fs.readFileSync(path.join(ROOT, "uninstall.ps1"), "utf8");
  for (const token of ["setup_backend.ps1", "Copying the Max package", "Assert-TreesEqual", "install-manifest.json", "SkipBackend", "VerifyOnly", "AcceptAdtofLicense", "Test-DrumSliceIDPackage", "Test-LegacyPackage"]) {
    assert.equal(install.includes(token), true, `Windows installer is missing ${token}`);
  }
  for (const token of ["install-manifest.json", "RemoveBackend", "RemoveCache", "RemoveLegacy", "Test-DrumSliceIDPackage", "PSScriptRoot"]) {
    assert.equal(uninstall.includes(token), true, `Windows uninstaller is missing ${token}`);
  }
  assert.equal(install.includes("??"), false, "Windows PowerShell 5.1 does not support null-coalescing syntax");
  assert.equal(uninstall.includes("??"), false, "Windows PowerShell 5.1 does not support null-coalescing syntax");
});
