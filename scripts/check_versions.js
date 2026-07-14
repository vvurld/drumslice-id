#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const productVersion = read("VERSION").trim();
const pythonVersion = productVersion.replace(/-alpha\.(\d+)$/, "a$1");

assert.match(productVersion, /^\d+\.\d+\.\d+-alpha\.\d+$/, "VERSION must identify an alpha release");
assert.equal(JSON.parse(read("max/package-info.json")).version, productVersion);
assert.equal(JSON.parse(read("max/DrumSliceID.maxproj")).version, productVersion);
assert.equal(JSON.parse(read("max/node/package.json")).version, productVersion);

const pyprojectMatch = read("python/pyproject.toml").match(/^version\s*=\s*"([^"]+)"/m);
assert.ok(pyprojectMatch, "python/pyproject.toml has no version");
assert.equal(pyprojectMatch[1], pythonVersion);

const initMatch = read("python/drumslice_id_worker/__init__.py").match(/^__version__\s*=\s*"([^"]+)"/m);
assert.ok(initMatch, "Python package has no __version__");
assert.equal(initMatch[1], pythonVersion);

process.stdout.write(`${JSON.stringify({ok: true, productVersion, pythonVersion})}\n`);
