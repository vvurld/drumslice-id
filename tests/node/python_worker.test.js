"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {PythonWorker} = require("../../max/node/python_worker");

const logger = {error() {}};
const analysisRequest = (requestId) => ({schemaVersion: 1, type: "request", requestId, method: "analyze", params: {}});
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitFor(predicate, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error("Timed out waiting for child-process state.");
    await wait(10);
  }
}

test("intentional shutdown rejects pending work, waits for exit, and never restarts it", async () => {
  const childCode = String.raw`
    let buffer = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      buffer += chunk;
      let newline;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1);
        if (!line) continue;
        if (JSON.parse(line).type === "shutdown") process.exit(0);
      }
    });
    setInterval(() => {}, 1000);
  `;
  const worker = new PythonWorker({python: process.execPath, args: ["-e", childCode], logger, shutdownTimeoutMs: 200});
  const rejection = assert.rejects(worker.request(analysisRequest("shutdown-request"), {timeoutMs: 2000}), {code: "WORKER_SHUTDOWN"});
  await waitFor(() => worker.child && worker.child.pid);
  const firstPid = worker.child.pid;
  await worker.shutdown();
  await rejection;
  await wait(50);
  assert.equal(worker.child, null);
  assert.equal(worker.pending.size, 0);
  assert.equal(worker.stopping, true);
  assert.equal(firstPid > 0, true);
});

test("a timeout cancels the request and recycles the unresponsive child", async () => {
  const childCode = "process.stdin.resume(); setInterval(() => {}, 1000);";
  const worker = new PythonWorker({python: process.execPath, args: ["-e", childCode], logger, shutdownTimeoutMs: 100});
  await assert.rejects(worker.request(analysisRequest("timeout-request"), {timeoutMs: 40}), {code: "WORKER_TIMEOUT"});
  assert.ok(worker.recyclePromise, "timeout must publish the recycle barrier before rejecting");
  await assert.rejects(worker.health("immediate-after-timeout", "adtof", {}), {code: "WORKER_RECYCLING"});
  await worker.waitForRecycle();
  assert.equal(worker.child, null);
  assert.equal(worker.pending.size, 0);
  await worker.shutdown();
});

test("shutdown force-kills a child that ignores the graceful message", async () => {
  const childCode = "process.stdin.resume(); setInterval(() => {}, 1000);";
  const worker = new PythonWorker({python: process.execPath, args: ["-e", childCode], logger, shutdownTimeoutMs: 30});
  const rejection = assert.rejects(worker.request(analysisRequest("forced-shutdown"), {timeoutMs: 2000}), {code: "WORKER_SHUTDOWN"});
  await waitFor(() => worker.child && worker.child.pid);
  await worker.shutdown();
  await rejection;
  assert.equal(worker.child, null);
});

test("spawn failure clears the dead child reference so a later check can retry", async () => {
  const worker = new PythonWorker({python: path.join(os.tmpdir(), "definitely-missing-drumslice-id-python"), logger, healthTimeoutMs: 200});
  await assert.rejects(worker.health("health-1", "adtof", {}), {code: "WORKER_START_FAILED"});
  await waitFor(() => worker.child === null);
  await assert.rejects(worker.health("health-2", "adtof", {}), {code: "WORKER_START_FAILED"});
  await waitFor(() => worker.child === null);
});

test("recycling terminates the current child and permits a clean restart", async () => {
  const childCode = String.raw`
    let buffer = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      buffer += chunk;
      let newline;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1);
        if (!line) continue;
        const message = JSON.parse(line);
        if (message.type === "health") process.stdout.write(JSON.stringify({schemaVersion: 1, type: "health", requestId: message.requestId, ok: true}) + "\n");
        else if (message.type === "shutdown") process.exit(0);
      }
    });
    setInterval(() => {}, 1000);
  `;
  const worker = new PythonWorker({python: process.execPath, args: ["-e", childCode], logger, shutdownTimeoutMs: 200});
  await worker.health("before-recycle", "adtof", {});
  const firstPid = worker.child.pid;
  await worker.recycle();
  assert.equal(worker.child, null);
  await worker.health("after-recycle", "adtof", {});
  assert.notEqual(worker.child.pid, firstPid);
  await worker.shutdown();
});

test("duplicate request IDs and response-type mismatches are rejected", async () => {
  const childCode = String.raw`
    let buffer = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      buffer += chunk;
      let newline;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1);
        if (!line) continue;
        const message = JSON.parse(line);
        if (message.type === "health") {
          process.stdout.write(JSON.stringify({schemaVersion: 1, type: "result", requestId: message.requestId}) + "\n");
        } else if (message.type === "shutdown") process.exit(0);
      }
    });
    setInterval(() => {}, 1000);
  `;
  const worker = new PythonWorker({python: process.execPath, args: ["-e", childCode], logger, shutdownTimeoutMs: 200});
  const first = worker.request(analysisRequest("duplicate"), {timeoutMs: 1000});
  await assert.rejects(worker.request(analysisRequest("duplicate"), {timeoutMs: 1000}), {code: "DUPLICATE_REQUEST_ID"});
  assert.equal(worker.cancel("duplicate"), true);
  await assert.rejects(first, {code: "ANALYSIS_CANCELLED"});
  await assert.rejects(worker.health("wrong-type", "adtof", {}), {code: "UNEXPECTED_WORKER_MESSAGE"});
  await worker.shutdown();
});

test("an unexpected crash retries one analysis request once", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "drumslice-id-worker-retry-"));
  const counter = path.join(directory, "count");
  const childCode = String.raw`
    const fs = require("fs");
    const counter = process.env.DRUMSLICE_ID_TEST_COUNTER;
    const launch = fs.existsSync(counter) ? Number(fs.readFileSync(counter, "utf8")) + 1 : 1;
    fs.writeFileSync(counter, String(launch));
    let buffer = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      buffer += chunk;
      let newline;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1);
        if (!line) continue;
        const message = JSON.parse(line);
        if (message.type === "request") {
          if (launch === 1) process.exit(17);
          process.stdout.write(JSON.stringify({schemaVersion: 1, type: "result", requestId: message.requestId}) + "\n");
        } else if (message.type === "shutdown") process.exit(0);
      }
    });
    setInterval(() => {}, 1000);
  `;
  const worker = new PythonWorker({
    python: process.execPath,
    args: ["-e", childCode],
    logger,
    env: {DRUMSLICE_ID_TEST_COUNTER: counter},
    shutdownTimeoutMs: 200,
  });
  const result = await worker.request(analysisRequest("retry"), {timeoutMs: 2000});
  assert.equal(result.type, "result");
  assert.equal(fs.readFileSync(counter, "utf8"), "2");
  await worker.shutdown();
});
