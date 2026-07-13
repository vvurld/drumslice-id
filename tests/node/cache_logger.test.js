"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {DiskCache, cacheRoot, workerCacheRoot} = require("../../max/node/cache");
const {RotatingLogger} = require("../../max/node/logger");

test("corrupted cache entries are deleted", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-cache-")); const cache = new DiskCache({directory: dir});
  fs.writeFileSync(cache.file("bad"), "not json"); assert.equal(await cache.get("bad"), null); assert.equal(fs.existsSync(cache.file("bad")), false);
  await cache.set("good", {x: 1}); assert.deepEqual(await cache.get("good"), {x: 1});
  await cache.set("../escaped", {x: 2}); assert.deepEqual(await cache.get("../escaped"), {x: 2});
  assert.equal(fs.existsSync(path.join(dir, "..", "escaped.json")), false);
});

test("the default activation cache is isolated from sibling logs", () => {
  const previous = process.env.SLICE_LABELER_CACHE_DIR;
  delete process.env.SLICE_LABELER_CACHE_DIR;
  try { assert.equal(workerCacheRoot(), path.join(cacheRoot(), "worker")); }
  finally {
    if (previous == null) delete process.env.SLICE_LABELER_CACHE_DIR;
    else process.env.SLICE_LABELER_CACHE_DIR = previous;
  }
});

test("Clear Cache preserves logs and unrelated files in an explicit cache root", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-shared-cache-"));
  const cache = new DiskCache({directory: dir});
  const key = "a".repeat(64);
  fs.writeFileSync(path.join(dir, `${key}.json.gz`), "activation");
  fs.writeFileSync(path.join(dir, `${key}.deadbeef.tmp`), "temporary");
  fs.mkdirSync(path.join(dir, "numba"));
  fs.writeFileSync(path.join(dir, "numba", "compiled.nbc"), "compiled");
  fs.writeFileSync(path.join(dir, "slice-labeler.log"), "diagnostic");
  fs.writeFileSync(path.join(dir, "keep-me.txt"), "user data");

  await cache.clear();

  assert.equal(fs.existsSync(path.join(dir, `${key}.json.gz`)), false);
  assert.equal(fs.existsSync(path.join(dir, `${key}.deadbeef.tmp`)), false);
  assert.equal(fs.existsSync(path.join(dir, "numba")), false);
  assert.equal(fs.readFileSync(path.join(dir, "slice-labeler.log"), "utf8"), "diagnostic");
  assert.equal(fs.readFileSync(path.join(dir, "keep-me.txt"), "utf8"), "user data");
});

test("logger rotates bounded files", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-log-")); const file = path.join(dir, "x.log"); const logger = new RotatingLogger(file, {maxBytes: 40, backups: 2});
  logger.info("x".repeat(50)); logger.info("again"); assert.equal(fs.existsSync(`${file}.1`), true);
});
