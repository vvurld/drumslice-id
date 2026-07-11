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
  assert.equal(naming.generate([{regionId: "a", oldName: "Keep me", classes: []}], {preserveUnknown: true})[0].effectiveName, "Keep me");
  assert.equal(naming.validateUserName(" ").code, "EMPTY_NAME");
  assert.equal(naming.validateUserName("x".repeat(32), 31).code, "NAME_TOO_LONG");
});
