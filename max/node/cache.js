"use strict";

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const os = require("os");
const crypto = require("crypto");

function configuredCacheRoot() {
  return process.env.DRUMSLICE_ID_CACHE_DIR || process.env.SLICE_LABELER_CACHE_DIR || null;
}

function cacheRoot() {
  const override = configuredCacheRoot();
  if (override) return path.resolve(override);
  if (process.platform === "darwin") return path.join(os.homedir(), "Library", "Caches", "DrumSLICE ID");
  if (process.platform === "win32") return path.join(process.env.LOCALAPPDATA || os.homedir(), "DrumSLICE ID", "Cache");
  return path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache"), "drumslice-id");
}

function workerCacheRoot() {
  const root = cacheRoot();
  /* The Python worker uses a child directory by default, but treats an
     explicit override as the exact cache directory. Mirror that convention
     so Clear Cache removes activations without deleting the sibling log. */
  return configuredCacheRoot() ? root : path.join(root, "worker");
}

class DiskCache {
  constructor(options = {}) { this.directory = options.directory || cacheRoot(); this.maxBytes = options.maxBytes || 512 * 1024 * 1024; }
  file(key) { return path.join(this.directory, `${safeKey(key)}.json`); }
  async get(key) {
    const file = this.file(key);
    try { const data = JSON.parse(await fsp.readFile(file, "utf8")); await fsp.utimes(file, new Date(), new Date()); return data; }
    catch (error) { if (error.code !== "ENOENT") await fsp.rm(file, {force: true}); return null; }
  }
  async set(key, data) {
    await fsp.mkdir(this.directory, {recursive: true});
    const target = this.file(key); const temp = `${target}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
    await fsp.writeFile(temp, JSON.stringify(data), {encoding: "utf8", mode: 0o600}); await fsp.rename(temp, target); await this.cleanup();
  }
  async clear() {
    /* An explicit DRUMSLICE_ID_CACHE_DIR can be a shared directory that also
       contains the diagnostic log (or files owned by the user).  Remove only
       cache entries whose names we create, plus Numba's dedicated subtree;
       never recursively delete the configured root itself. */
    let entries;
    try { entries = await fsp.readdir(this.directory, {withFileTypes: true}); }
    catch (error) { if (error.code === "ENOENT") return; throw error; }
    const cacheFile = /^[0-9a-f]{64}(?:\.json(?:\.gz)?|\..*\.tmp)$/;
    await Promise.all(entries.map(async (entry) => {
      if (entry.name === "numba") {
        await fsp.rm(path.join(this.directory, entry.name), {recursive: true, force: true});
      } else if (cacheFile.test(entry.name)) {
        await fsp.rm(path.join(this.directory, entry.name), {force: true});
      }
    }));
    try { await fsp.rmdir(this.directory); }
    catch (error) { if (!["ENOENT", "ENOTEMPTY", "EEXIST"].includes(error.code)) throw error; }
  }
  async cleanup() {
    let names; try { names = await fsp.readdir(this.directory); } catch { return; }
    const files = (await Promise.all(names.filter((n) => n.endsWith(".json")).map(async (name) => { const file = path.join(this.directory, name); const stat = await fsp.stat(file); return {file, size: stat.size, atime: stat.atimeMs}; }))).sort((a, b) => a.atime - b.atime);
    let total = files.reduce((sum, item) => sum + item.size, 0);
    for (const item of files) { if (total <= this.maxBytes) break; await fsp.rm(item.file, {force: true}); total -= item.size; }
  }
}

function safeKey(key) {
  if (typeof key !== "string" || !key) throw new TypeError("Cache keys must be non-empty strings.");
  return /^[0-9a-f]{64}$/.test(key) ? key : crypto.createHash("sha256").update(key).digest("hex");
}

module.exports = {DiskCache, cacheRoot, workerCacheRoot, safeKey, configuredCacheRoot};
