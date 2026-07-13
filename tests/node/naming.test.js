"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const naming = require("../../max/javascript/naming_engine");

test("canonical multi-label names and duplicate numbering", () => {
  const rows = [
    {regionId: "a", oldName: "Slice 1", classes: ["hihat", "kick"]},
    {regionId: "b", oldName: "Slice 2", classes: ["kick", "hihat"]},
    {regionId: "c", oldName: "Slice 3", classes: ["cymbal"]},
  ];
  assert.deepEqual(naming.generate(rows).map((row) => row.effectiveName), ["K+HH 01", "K+HH 02", "CY"]);
});

test("unknown can preserve original and edited names are never silently truncated", () => {
  const preserved = naming.generate([{regionId: "a", oldName: "  Keep   spacing exactly  ", classes: []}], {preserveUnknown: true})[0];
  assert.equal(preserved.effectiveName, "  Keep   spacing exactly  ");
  assert.equal(preserved.preserveOriginal, true);
  assert.equal(naming.validateUserName(" ").code, "EMPTY_NAME");
  assert.equal(naming.validateUserName("x".repeat(32), 31).code, "NAME_TOO_LONG");
  assert.equal(naming.validateUserName("🥁".repeat(31), 31).ok, true);
  assert.equal(naming.validateUserName("🥁".repeat(32), 31).code, "NAME_TOO_LONG");
});

test("duplicate indexes follow source/start/pad keys rather than incoming row order", () => {
  const rows = [
    {regionId: "later", sourceFingerprint: "b", sourceStartFrame: 20, padNote: 40, classes: ["kick"]},
    {regionId: "first", sourceFingerprint: "a", sourceStartFrame: 10, padNote: 38, classes: ["kick"]},
    {regionId: "middle", sourceFingerprint: "a", sourceStartFrame: 20, padNote: 39, classes: ["kick"]},
  ];
  assert.deepEqual(naming.generate(rows).map((row) => row.effectiveName), ["K 03", "K 01", "K 02"]);
});
