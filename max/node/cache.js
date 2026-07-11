"use strict";

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const os = require("os");
const crypto = require("crypto");

function cacheRoot() {
  if (process.env.SLICE_LABELER_CACHE_DIR) return path.resolve(process.env.SLICE_LABELER_CACHE_DIR);
  if (process.platform === "darwin") return path.join(os.homedir(), "Library", "Caches", "Slice Labeler");
  if (process.platform === "win32") return path.join(process.env.LOCALAPPDATA || os.homedir(), "Slice Labeler", "Cache");
  return path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache"), "slice-labeler");
}

class DiskCache {
  constructor(options = {}) { this.directory = options.directory || cacheRoot(); this.maxBytes = options.maxBytes || 512 * 1024 * 1024; }
  file(key) { return path.join(this.directory, `${key}.json`); }
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
  async clear() { await fsp.rm(this.directory, {recursive: true, force: true}); }
  async cleanup() {
    let names; try { names = await fsp.readdir(this.directory); } catch { return; }
    const files = (await Promise.all(names.filter((n) => n.endsWith(".json")).map(async (name) => { const file = path.join(this.directory, name); const stat = await fsp.stat(file); return {file, size: stat.size, atime: stat.atimeMs}; }))).sort((a, b) => a.atime - b.atime);
    let total = files.reduce((sum, item) => sum + item.size, 0);
    for (const item of files) { if (total <= this.maxBytes) break; await fsp.rm(item.file, {force: true}); total -= item.size; }
  }
}

module.exports = {DiskCache, cacheRoot};
