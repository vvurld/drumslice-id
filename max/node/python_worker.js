"use strict";

const {spawn} = require("child_process");
const {JsonLineParser, validateEnvelope, encode, coded} = require("./protocol");

class PythonWorker {
  constructor(options) {
    this.python = options.python; this.args = options.args || ["-m", "slice_labeler_worker"]; this.cwd = options.cwd;
    this.env = Object.assign({}, process.env, options.env || {}); this.logger = options.logger; this.child = null; this.pending = new Map(); this.crashes = new Map();
    this.startupTimeoutMs = options.startupTimeoutMs || 30000; this.healthTimeoutMs = options.healthTimeoutMs || 15000;
  }
  start() {
    if (this.child) return;
    this.child = spawn(this.python, this.args, {cwd: this.cwd, env: this.env, stdio: ["pipe", "pipe", "pipe"], windowsHide: true});
    const parser = new JsonLineParser((message) => this.onMessage(message), (error) => this.logger.error("worker protocol error", error));
    this.child.stdout.on("data", (chunk) => parser.push(chunk));
    this.child.stderr.on("data", (chunk) => this.logger.error("python stderr", {message: chunk.toString("utf8").slice(0, 4000)}));
    this.child.on("error", (error) => this.failAll(coded("WORKER_START_FAILED", error.message)));
    this.child.on("exit", (code, signal) => { this.child = null; this.onExit(code, signal); });
  }
  onMessage(raw) {
    let message; try { message = validateEnvelope(raw); } catch (error) { this.logger.error("invalid worker envelope", {code: error.code}); return; }
    const pending = this.pending.get(message.requestId); if (!pending) return;
    if (message.type === "progress") { if (pending.onProgress) pending.onProgress(message); return; }
    if (message.type === "result" || message.type === "health") { clearTimeout(pending.timer); this.pending.delete(message.requestId); pending.resolve(message); return; }
    if (message.type === "error") { clearTimeout(pending.timer); this.pending.delete(message.requestId); pending.reject(coded(message.code || "WORKER_ERROR", message.message || "Worker error", message.details)); }
  }
  request(message, options = {}) {
    this.start();
    const timeoutMs = options.timeoutMs || this.startupTimeoutMs;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(message.requestId); reject(coded("WORKER_TIMEOUT", "Python worker request timed out.")); }, timeoutMs);
      this.pending.set(message.requestId, {resolve, reject, timer, onProgress: options.onProgress, message, retries: 0});
      this.child.stdin.write(encode(message));
    });
  }
  health(requestId, backend, options) { return this.request({schemaVersion: 1, type: "health", requestId, backend, options}, {timeoutMs: this.healthTimeoutMs}); }
  cancel(requestId) { if (this.pending.has(requestId) && this.child) this.child.stdin.write(encode({schemaVersion: 1, type: "cancel", requestId})); }
  async shutdown() {
    if (!this.child) return; const child = this.child;
    try { child.stdin.write(encode({schemaVersion: 1, type: "shutdown", requestId: "shutdown"})); } catch {}
    setTimeout(() => { if (this.child === child) child.kill(); }, 2000).unref();
  }
  onExit(code, signal) {
    const error = coded("WORKER_CRASHED", `Python worker exited (${code == null ? signal : code}).`);
    const retry = [];
    for (const [requestId, pending] of this.pending) {
      if (pending.retries < 1 && pending.message.type === "request") { pending.retries += 1; retry.push(pending); }
      else { clearTimeout(pending.timer); this.pending.delete(requestId); pending.reject(error); }
    }
    if (retry.length) {
      this.start();
      for (const pending of retry) this.child.stdin.write(encode(pending.message));
    }
  }
  failAll(error) { for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(error); } this.pending.clear(); }
}

module.exports = {PythonWorker};
