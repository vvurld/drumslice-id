"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {DiskCache} = require("../../max/node/cache");
const {RotatingLogger} = require("../../max/node/logger");

test("corrupted cache entries are deleted", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-cache-")); const cache = new DiskCache({directory: dir});
  fs.writeFileSync(path.join(dir, "bad.json"), "not json"); assert.equal(await cache.get("bad"), null); assert.equal(fs.existsSync(path.join(dir, "bad.json")), false);
  await cache.set("good", {x: 1}); assert.deepEqual(await cache.get("good"), {x: 1});
});

test("logger rotates bounded files", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-log-")); const file = path.join(dir, "x.log"); const logger = new RotatingLogger(file, {maxBytes: 40, backups: 2});
  logger.info("x".repeat(50)); logger.info("again"); assert.equal(fs.existsSync(`${file}.1`), true);
});
