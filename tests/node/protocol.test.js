"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {JsonLineParser, validateEnvelope} = require("../../max/node/protocol");

test("JSON line parser accepts partial and multiple lines", () => {
  const messages = []; const errors = []; const parser = new JsonLineParser((m) => messages.push(m), (e) => errors.push(e));
  parser.push('{"a":1}\n{"a"'); parser.push(':2}\n');
  assert.deepEqual(messages, [{a: 1}, {a: 2}]); assert.equal(errors.length, 0);
});

test("protocol rejects malformed and stale-looking envelopes", () => {
  assert.throws(() => validateEnvelope({schemaVersion: 2, type: "result", requestId: "x"}), {code: "SCHEMA_VERSION_MISMATCH"});
});
