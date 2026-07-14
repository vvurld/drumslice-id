"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {spawnSync} = require("node:child_process");
const {
  decodePatcherChunk,
  embeddedFilenames,
  encodePlainPatcher,
  readContainer,
  writeContainer,
} = require("../../scripts/max_device_format");
const {buildBuffer, run} = require("../../scripts/build_max_device");
const {checkOutputs, createOutputs, writeOutputs} = require("../../scripts/build_max_js_bundle");
const {verify} = require("../../scripts/verify_max_device");
const ROOT = path.resolve(__dirname, "../..");

function documentWith({box = {}, dependencyCache = []} = {}) {
  return {
    patcher: {
      fileversion: 1,
      classnamespace: "box",
      openinpresentation: 1,
      boxes: [{box: {id: "button", maxclass: "textbutton", presentation: 1, ...box}}],
      lines: [],
      parameters: {button: ["Button", "Button", 0]},
      dependency_cache: dependencyCache,
    },
  };
}

function deviceBuffer(document, {collective = false} = {}) {
  let data = encodePlainPatcher(document);
  if (collective) data = Buffer.concat([Buffer.from("mx@c\0\0\0\x10\0\0\0\0\0\0\0\0", "binary"), data]);
  return writeContainer({
    version: 4,
    kind: "mmmm",
    chunks: [
      {name: "meta", data: Buffer.from([1, 0, 0, 0])},
      {name: "ptch", data},
    ],
  });
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, JSON.stringify(value), "utf8");
}

test("AMPF parser treats the device-kind FourCC as header and accepts trailing NUL", () => {
  const expected = documentWith();
  const parsed = readContainer(deviceBuffer(expected));
  assert.equal(parsed.version, 4);
  assert.equal(parsed.kind, "mmmm");
  assert.deepEqual(parsed.chunks.map(({name}) => name), ["meta", "ptch"]);
  assert.deepEqual(decodePatcherChunk(parsed.chunks[1].data).document, expected);
});

test("collective patch parser extracts only the first JSON document", () => {
  const expected = documentWith({box: {text: "braces { inside } a string"}});
  const trailing = Buffer.from("\0{\"embedded\":true}\0fnam\0\0\0\x14helper.js\0\0\0\0", "binary");
  const collective = Buffer.concat([
    Buffer.from("mx@c\0\0\0\x10\0\0\0\0\0\0\0\0", "binary"),
    encodePlainPatcher(expected),
    trailing,
  ]);
  const decoded = decodePatcherChunk(collective);
  assert.equal(decoded.collective, true);
  assert.deepEqual(decoded.document, expected);
  assert.deepEqual(embeddedFilenames(collective), ["helper.js"]);
});

test("development device builder applies source geometry and replaces the functional graph", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "drumslice-id-device-"));
  const templatePath = path.join(directory, "template.amxd");
  const sourcePath = path.join(directory, "source.maxpat");
  const outputPath = path.join(directory, "output.amxd");
  const template = documentWith({
    box: {text: "old"},
    dependencyCache: [{name: "old.js", bootpath: "/Users/person/project"}],
  });
  template.patcher.openrect = [0, 0, 0, 169];
  const source = documentWith({box: {text: "new", active: 0, presentation_rect: [1, 2, 3, 4]}});
  source.patcher.openrect = [0, 0, 0, 124];
  source.patcher.devicewidth = 560;
  fs.writeFileSync(templatePath, deviceBuffer(template));
  writeJson(sourcePath, source);

  fs.writeFileSync(outputPath, buildBuffer({templatePath, sourcePath}));
  const parsed = decodePatcherChunk(readContainer(fs.readFileSync(outputPath)).chunks[1].data).document;
  assert.deepEqual(parsed.patcher.openrect, source.patcher.openrect);
  assert.equal(parsed.patcher.devicewidth, 560);
  assert.deepEqual(parsed.patcher.boxes, source.patcher.boxes);
  assert.deepEqual(parsed.patcher.parameters, source.patcher.parameters);
  assert.deepEqual(parsed.patcher.dependency_cache, []);
  assert.doesNotThrow(() => run({check: true, templatePath: outputPath, sourcePath, outputPath}));
});

test("device verifier checks presentation/runtime attributes and development paths", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "drumslice-id-verify-"));
  const artifactPath = path.join(directory, "device.amxd");
  const sourcePath = path.join(directory, "source.maxpat");
  const source = documentWith({box: {active: 0, presentation_rect: [1, 2, 3, 4]}});
  writeJson(sourcePath, source);
  fs.writeFileSync(artifactPath, deviceBuffer(source));
  const result = verify({artifactPath, sourcePath});
  assert.equal(result.selfContained, false);

  const stale = documentWith({box: {active: 1, presentation_rect: [1, 2, 3, 4]}});
  fs.writeFileSync(artifactPath, deviceBuffer(stale));
  assert.throws(() => verify({artifactPath, sourcePath}), /stale or contains saved runtime state/);

  const leaked = documentWith({dependencyCache: [{name: "x.js", bootpath: "~/Documents/BREAKER/max"}]});
  writeJson(sourcePath, leaked);
  fs.writeFileSync(artifactPath, deviceBuffer(leaked));
  assert.throws(() => verify({artifactPath, sourcePath}), /development\/user paths/);
});

test("Max JavaScript bundle check is read-only and identifies every stale output", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "drumslice-id-bundles-"));
  for (const relative of [
    "max/javascript/live_value_helpers.js",
    "max/javascript/naming_engine.js",
    "max/javascript/live_controller.js",
    "max/javascript/results_controller.js",
    "max/javascript/settings_controller.js",
  ]) {
    fs.mkdirSync(path.dirname(path.join(directory, relative)), {recursive: true});
    fs.writeFileSync(path.join(directory, relative), `// ${relative}\n`, "utf8");
  }
  const outputs = createOutputs(directory);
  assert.equal(checkOutputs(outputs, directory).length, 6);
  writeOutputs(outputs);
  assert.deepEqual(checkOutputs(createOutputs(directory), directory), []);
  fs.appendFileSync(path.join(directory, "max/javascript/live_controller.js"), "// changed\n");
  assert.deepEqual(checkOutputs(createOutputs(directory), directory).sort(), [
    "max/patchers/drumslice_id_bundle.js",
    "max/patchers/drumslice_id_bundle_v2.js",
  ]);
});

test("release versions are aligned across runtimes", () => {
  const result = spawnSync(process.execPath, [path.join(ROOT, "scripts", "check_versions.js")], {cwd: ROOT, encoding: "utf8"});
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /"ok":true/);
});
