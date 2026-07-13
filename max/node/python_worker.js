"use strict";

const {spawn} = require("child_process");
const {JsonLineParser, validateEnvelope, encode, coded} = require("./protocol");

class PythonWorker {
  constructor(options) {
    this.python = options.python;
    this.args = options.args || ["-m", "slice_labeler_worker"];
    this.cwd = options.cwd;
    this.env = Object.assign({}, process.env, options.env || {});
    this.logger = options.logger || {error() {}};
    this.child = null;
    this.pending = new Map();
    this.startupTimeoutMs = options.startupTimeoutMs || 30000;
    this.healthTimeoutMs = options.healthTimeoutMs || 15000;
    this.shutdownTimeoutMs = options.shutdownTimeoutMs || 2000;
    this.stopping = false;
    this.stopPromise = null;
    this.recyclePromise = null;
    this.recyclingChild = null;
  }

  start() {
    if (this.stopping) throw coded("WORKER_SHUTTING_DOWN", "Python worker is shutting down.");
    if (this.recyclePromise) throw coded("WORKER_RECYCLING", "Python worker is restarting after cancellation.");
    if (this.child) return this.child;

    let child;
    try {
      child = spawn(this.python, this.args, {
        cwd: this.cwd,
        env: this.env,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      });
    } catch (error) {
      throw coded("WORKER_START_FAILED", error.message);
    }

    this.child = child;
    const parser = new JsonLineParser(
      (message) => this.onMessage(message),
      (error) => this.logger.error("worker protocol error", error),
    );
    child.stdout.on("data", (chunk) => parser.push(chunk));
    child.stderr.on("data", (chunk) => this.logger.error("python stderr", {message: chunk.toString("utf8").slice(0, 4000)}));
    child.stdin.on("error", (error) => this.logger.error("python stdin error", {code: error.code, message: error.message}));
    child.once("error", (error) => this.onStartError(child, error));
    child.once("exit", (code, signal) => this.onExit(child, code, signal));
    return child;
  }

  onStartError(child, error) {
    if (this.child === child) this.child = null;
    this.failAll(coded("WORKER_START_FAILED", error.message));
  }

  onMessage(raw) {
    let message;
    try {
      message = validateEnvelope(raw);
    } catch (error) {
      this.logger.error("invalid worker envelope", {code: error.code});
      if (raw && typeof raw.requestId === "string" && this.pending.has(raw.requestId)) {
        this.rejectPending(raw.requestId, coded("INVALID_WORKER_RESPONSE", error.message, {cause: error.code}));
      }
      return;
    }

    const pending = this.pending.get(message.requestId);
    if (!pending) return;

    if (message.type === "progress") {
      if (pending.expectedType !== "result") {
        this.rejectPending(message.requestId, coded("UNEXPECTED_WORKER_MESSAGE", "Worker sent progress for a non-analysis request."));
      } else if (pending.onProgress) {
        try { pending.onProgress(message); }
        catch (error) { this.logger.error("progress callback failed", {message: error.message}); }
      }
      return;
    }

    if (message.type === "error") {
      this.rejectPending(message.requestId, coded(message.code || "WORKER_ERROR", message.message || "Worker error", message.details));
      return;
    }

    if (message.type !== pending.expectedType) {
      this.rejectPending(message.requestId, coded("UNEXPECTED_WORKER_MESSAGE", `Expected ${pending.expectedType} but received ${message.type}.`));
      return;
    }

    this.resolvePending(message.requestId, message);
  }

  request(message, options = {}) {
    if (this.pending.has(message.requestId)) {
      return Promise.reject(coded("DUPLICATE_REQUEST_ID", `Request ${message.requestId} is already pending.`));
    }

    let child;
    try {
      child = this.start();
    } catch (error) {
      return Promise.reject(error);
    }

    const timeoutMs = options.timeoutMs || this.startupTimeoutMs;
    const expectedType = message.type === "health" ? "health" : "result";
    return new Promise((resolve, reject) => {
      const pending = {
        resolve,
        reject,
        timer: null,
        onProgress: options.onProgress,
        message,
        expectedType,
        retries: 0,
        cancelled: false,
      };
      pending.timer = setTimeout(() => this.onTimeout(message.requestId), timeoutMs);
      this.pending.set(message.requestId, pending);
      this.writeMessage(child, message, message.requestId);
    });
  }

  writeMessage(child, message, requestId) {
    if (!child || child !== this.child || !child.stdin || child.stdin.destroyed || !child.stdin.writable) {
      this.rejectPending(requestId, coded("WORKER_NOT_RUNNING", "Python worker is not available."));
      return false;
    }
    let payload;
    try {
      payload = encode(message);
      child.stdin.write(payload, (error) => {
        if (!error) return;
        this.logger.error("python stdin write failed", {code: error.code, message: error.message});
        if (this.child === child) {
          try { child.kill(); } catch {}
        }
      });
      return true;
    } catch (error) {
      this.rejectPending(requestId, error.code ? error : coded("WORKER_WRITE_FAILED", error.message));
      return false;
    }
  }

  onTimeout(requestId) {
    const pending = this.pending.get(requestId);
    if (!pending) return;
    const child = this.child;
    this.pending.delete(requestId);
    clearTimeout(pending.timer);
    pending.cancelled = true;
    if (pending.message.type === "request") this.writeCancel(child, requestId);
    // Publish the recycle barrier before rejecting.  Promise continuations may
    // issue a new request immediately, and they must never write to the child
    // whose timeout just proved it unresponsive.
    if (this.child === child) this.recycle();
    pending.reject(coded("WORKER_TIMEOUT", "Python worker request timed out."));
  }

  health(requestId, backend, options) {
    return this.request(
      {schemaVersion: 1, type: "health", requestId, backend, options},
      {timeoutMs: this.healthTimeoutMs},
    );
  }

  cancel(requestId) {
    const pending = this.pending.get(requestId);
    if (!pending || pending.message.type !== "request") return false;
    pending.cancelled = true;
    this.writeCancel(this.child, requestId);
    this.rejectPending(requestId, coded("ANALYSIS_CANCELLED", "Analysis was cancelled."));
    return true;
  }

  recycle() {
    if (this.recyclePromise) return this.recyclePromise;
    const child = this.child;
    if (!child) return Promise.resolve();
    let resolveRecycle;
    const promise = new Promise((resolve) => { resolveRecycle = resolve; });
    this.recyclePromise = promise;
    this.recyclingChild = child;
    let finished = false;
    let timer = null;
    const done = () => {
      if (finished) return;
      finished = true;
      if (timer) clearTimeout(timer);
      if (this.child === child) this.child = null;
      if (this.recyclingChild === child) this.recyclingChild = null;
      if (this.recyclePromise === promise) this.recyclePromise = null;
      resolveRecycle();
    };
    child.once("close", done);
    if (child.exitCode != null || child.signalCode != null) {
      Promise.resolve().then(done);
      return promise;
    }
    timer = setTimeout(() => {
      try { child.kill("SIGKILL"); }
      catch { done(); }
    }, this.shutdownTimeoutMs);
    try { child.kill(); }
    catch { done(); }
    return promise;
  }

  waitForRecycle() {
    return this.recyclePromise || Promise.resolve();
  }

  writeCancel(child, requestId) {
    if (!child || child !== this.child || !child.stdin || child.stdin.destroyed || !child.stdin.writable) return false;
    try {
      child.stdin.write(encode({schemaVersion: 1, type: "cancel", requestId}), (error) => {
        if (error) this.logger.error("python cancel write failed", {code: error.code, message: error.message});
      });
      return true;
    } catch (error) {
      this.logger.error("python cancel write failed", {code: error.code, message: error.message});
      return false;
    }
  }

  async shutdown() {
    if (this.stopPromise) return this.stopPromise;
    this.stopping = true;
    const child = this.child;
    this.failAll(coded("WORKER_SHUTDOWN", "Python worker was shut down."));
    if (!child) return;

    this.stopPromise = new Promise((resolve) => {
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (this.child === child) this.child = null;
        resolve();
      };
      const timer = setTimeout(() => {
        try { child.kill(); } catch {}
      }, this.shutdownTimeoutMs);
      child.once("close", done);
      if (child.exitCode != null || child.signalCode != null) {
        done();
        return;
      }
      try {
        if (!child.stdin.destroyed && child.stdin.writable) {
          child.stdin.write(encode({schemaVersion: 1, type: "shutdown", requestId: "shutdown"}), (error) => {
            if (error) {
              try { child.kill(); } catch {}
            }
          });
        } else {
          child.kill();
        }
      } catch {
        try { child.kill(); } catch {}
      }
    });
    return this.stopPromise;
  }

  onExit(child, code, signal) {
    if (this.child === child) this.child = null;
    if (this.stopping) return;

    if (this.recyclingChild === child) {
      this.failAll(coded("WORKER_RECYCLED", "Python worker was restarted after cancellation."));
      return;
    }

    const error = coded("WORKER_CRASHED", `Python worker exited (${code == null ? signal : code}).`);
    const retry = [];
    for (const [requestId, pending] of this.pending) {
      if (!pending.cancelled && pending.retries < 1 && pending.message.type === "request") {
        pending.retries += 1;
        retry.push([requestId, pending]);
      } else {
        this.rejectPending(requestId, error);
      }
    }
    if (!retry.length) return;

    let replacement;
    try {
      replacement = this.start();
    } catch (startError) {
      this.failAll(startError);
      return;
    }
    for (const [requestId, pending] of retry) {
      if (this.pending.get(requestId) === pending) this.writeMessage(replacement, pending.message, requestId);
    }
  }

  resolvePending(requestId, value) {
    const pending = this.pending.get(requestId);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(requestId);
    pending.resolve(value);
  }

  rejectPending(requestId, error) {
    const pending = this.pending.get(requestId);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(requestId);
    pending.reject(error);
  }

  failAll(error) {
    for (const requestId of Array.from(this.pending.keys())) this.rejectPending(requestId, error);
  }
}

module.exports = {PythonWorker};
