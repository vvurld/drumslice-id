"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {normalizeSourcePath, fingerprintSource, groupRegions, stripLiveData} = require("../../max/node/orchestrator");

const metadata = {backendId: "x", modelVersion: "1", modelWeightsFingerprint: "w", preprocessingVersion: "p"};

function snapshot(file) { return {schemaVersion: 1, jobId: "job", createdAt: new Date().toISOString(), track: {displayName: "t", sessionPath: "live_set tracks 0"}, rack: {displayName: "r", sessionId: 9, sessionPath: "live_set tracks 0 devices 1"}, skippedPads: [], regions: [0, 1].map((i) => ({regionId: `r${i}`, padIndex: i, padNote: 36 + i, padDisplayName: "slice", chainSessionId: 10 + i, chainSessionPath: `secret ${i}`, originalChainName: "slice", simplerSessionPath: `secret simpler ${i}`, playbackMode: 1, source: {path: file, sampleRate: 44100, lengthFrames: 100, startFrame: i * 10, endFrame: i * 10 + 10}, warnings: []}))}; }

test("normalizes paths with spaces and Unicode and groups one source", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl ünicode ")); const file = path.join(dir, "beat ü.wav"); fs.writeFileSync(file, "wave");
  assert.equal(normalizeSourcePath(file), path.resolve(file)); const groups = await groupRegions(snapshot(file), metadata);
  assert.equal(groups.length, 1); assert.equal(groups[0].regions.length, 2); assert.equal(groups[0].regions[0].chainSessionId, undefined);
});

test("fingerprints are stable and change with file metadata", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-fp-")); const file = path.join(dir, "a.wav"); fs.writeFileSync(file, "a");
  const first = await fingerprintSource(file, metadata); const second = await fingerprintSource(file, metadata); assert.equal(first.sourceId, second.sourceId);
  fs.appendFileSync(file, "b"); const third = await fingerprintSource(file, metadata); assert.notEqual(first.sourceId, third.sourceId);
});

test("missing files are rejected and Live fields are stripped", async () => {
  await assert.rejects(() => fingerprintSource("/definitely/missing.wav", metadata), {code: "SAMPLE_FILE_MISSING"});
  assert.deepEqual(stripLiveData(snapshot("/tmp/x").regions[0]), {regionId: "r0", startFrame: 0, endFrame: 10});
});
