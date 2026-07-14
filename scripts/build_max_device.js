#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  MIDI_EFFECT_KIND,
  encodePlainPatcher,
  readDevice,
  writeContainer,
} = require("./max_device_format");

const root = path.resolve(__dirname, "..");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeDevelopmentPatcher(templateDocument, sourceDocument) {
  if (!templateDocument?.patcher || !sourceDocument?.patcher) throw new Error("Template and source must contain patchers.");
  if (!Array.isArray(sourceDocument.patcher.boxes) || !Array.isArray(sourceDocument.patcher.lines)) {
    throw new Error("Source patcher graph is incomplete.");
  }
  const result = clone(templateDocument);
  const target = result.patcher;
  const source = sourceDocument.patcher;
  target.fileversion = source.fileversion;
  target.classnamespace = source.classnamespace;
  target.openinpresentation = source.openinpresentation || 0;
  target.boxes = clone(source.boxes);
  target.lines = clone(source.lines);
  target.parameters = clone(source.parameters || {});
  target.dependency_cache = [];
  target.autosave = 0;
  return result;
}

function buildBuffer({templatePath, sourcePath}) {
  const template = readDevice(templatePath);
  if (template.kind !== MIDI_EFFECT_KIND) throw new Error(`Template is not a Max MIDI Effect (${template.kind}).`);
  if (template.collective) throw new Error("A frozen/collective AMXD cannot be used as a development-device template.");
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const document = mergeDevelopmentPatcher(template.document, source);
  let replaced = false;
  const chunks = template.chunks.map((chunk) => {
    if (chunk.name !== "ptch") return {name: chunk.name, data: Buffer.from(chunk.data)};
    if (replaced) throw new Error("Template contains multiple ptch chunks.");
    replaced = true;
    return {name: "ptch", data: encodePlainPatcher(document)};
  });
  if (!replaced) throw new Error("Template contains no ptch chunk.");
  return writeContainer({version: template.version, kind: template.kind, chunks});
}

function writeAtomic(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  const temporary = `${filePath}.tmp-${process.pid}`;
  try {
    fs.writeFileSync(temporary, data);
    fs.renameSync(temporary, filePath);
  } finally {
    try { fs.unlinkSync(temporary); } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
}

function parseArguments(argv) {
  const options = {
    check: false,
    templatePath: path.join(root, "dist", "DrumSLICE ID.amxd"),
    sourcePath: path.join(root, "max", "patchers", "SliceLabeler.maxpat"),
    outputPath: path.join(root, "dist", "DrumSLICE ID.amxd"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (["--template", "--source", "--output"].includes(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${argument}.`);
      options[`${argument.slice(2)}Path`] = path.resolve(value);
      index += 1;
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function run(options) {
  const expected = buildBuffer(options);
  if (options.check) {
    let actual;
    try { actual = fs.readFileSync(options.outputPath); } catch (error) {
      if (error.code === "ENOENT") throw new Error(`Generated Max device is missing: ${options.outputPath}`);
      throw error;
    }
    if (!actual.equals(expected)) throw new Error("Generated Max device is stale; run node scripts/build_max_device.js.");
  } else writeAtomic(options.outputPath, expected);
  return {ok: true, checked: options.check, output: options.outputPath, bytes: expected.length};
}

if (require.main === module) {
  try {
    process.stdout.write(`${JSON.stringify(run(parseArguments(process.argv.slice(2))), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`DrumSLICE ID device build failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {buildBuffer, mergeDevelopmentPatcher, parseArguments, run, writeAtomic};
