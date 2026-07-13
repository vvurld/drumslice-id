#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const {isDeepStrictEqual} = require("node:util");
const {embeddedFilenames, readDevice} = require("./max_device_format");

const root = path.resolve(__dirname, "..");

function semanticPatcher(document) {
  const patcher = document.patcher;
  if (!patcher || !Array.isArray(patcher.boxes) || !Array.isArray(patcher.lines)) throw new Error("Device patch JSON is incomplete.");
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const boxes = patcher.boxes.map(({box}) => clone(box))
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  const lines = patcher.lines.map(({patchline}) => clone(patchline))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return {
    openinpresentation: patcher.openinpresentation || 0,
    boxes,
    lines,
    parameters: clone(patcher.parameters || {}),
  };
}

function verify({artifactPath, sourcePath, requireSelfContained = false}) {
  const parsed = readDevice(artifactPath);
  const device = parsed.document;
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  assert.equal(isDeepStrictEqual(semanticPatcher(device), semanticPatcher(source)), true,
    "Generated AMXD patch graph is stale or contains saved runtime state.");

  const dependencies = (device.patcher.dependency_cache || []).map((entry) => ({name: entry.name, bootpath: entry.bootpath || ""}));
  const forbiddenPath = /(?:^|[\\/])Users[\\/]|Documents[\\/]BREAKER|Max for Live Devices[\\/]Slice Labeler Project/i;
  const leaked = dependencies.filter((entry) => forbiddenPath.test(entry.bootpath));
  assert.deepEqual(leaked, [], `Device dependency cache contains development/user paths: ${JSON.stringify(leaked)}`);
  assert.equal(forbiddenPath.test(parsed.patchChunk.data.toString("utf8")), false, "Device payload contains a development/user path.");

  const embeddedFiles = parsed.collective ? embeddedFilenames(parsed.patchChunk.data) : [];
  const embeddedSet = new Set(embeddedFiles.map((name) => path.basename(name).toLowerCase()));
  const missingEmbeddedDependencies = dependencies.map((entry) => entry.name)
    .filter((name) => !embeddedSet.has(path.basename(name).toLowerCase()));
  const selfContained = parsed.collective && embeddedFiles.length > 1 && missingEmbeddedDependencies.length === 0;
  if (requireSelfContained) assert.equal(selfContained, true,
    `Device is not self-contained; missing embedded dependencies: ${missingEmbeddedDependencies.join(", ") || "no embedded resources found"}.`);

  return {
    ok: true,
    artifact: artifactPath,
    bytes: fs.statSync(artifactPath).size,
    formatVersion: parsed.version,
    deviceKind: parsed.kind,
    chunks: parsed.chunks.map((chunk) => chunk.name),
    dependencies: dependencies.map((entry) => entry.name),
    embeddedFiles,
    missingEmbeddedDependencies,
    selfContained,
  };
}

function parseArguments(argv) {
  const positional = [];
  let requireSelfContained = false;
  for (const argument of argv) {
    if (argument === "--require-self-contained") requireSelfContained = true;
    else if (argument.startsWith("--")) throw new Error(`Unknown option: ${argument}`);
    else positional.push(argument);
  }
  if (positional.length > 2) throw new Error("Usage: verify_max_device.js [--require-self-contained] [artifact.amxd] [source.maxpat]");
  return {
    artifactPath: path.resolve(positional[0] || path.join(root, "dist", "Slice Labeler.amxd")),
    sourcePath: path.resolve(positional[1] || path.join(root, "max", "patchers", "SliceLabeler.maxpat")),
    requireSelfContained,
  };
}

if (require.main === module) {
  try {
    process.stdout.write(`${JSON.stringify(verify(parseArguments(process.argv.slice(2))), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`Slice Labeler device verification failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {parseArguments, semanticPatcher, verify};
