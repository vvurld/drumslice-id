"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  Orchestrator,
  normalizeSourcePath,
  normalizePythonExecutable,
  expandHomePath,
  fingerprintSource,
  groupRegions,
  stripLiveData,
  maxAtomsToPath,
  workerRuntimeOptions,
  loadBackendConfig,
  parseBackendConfig,
  mergeSettings,
} = require("../../max/node/orchestrator");
const {coded} = require("../../max/node/protocol");

const metadata = {backendId: "x", modelVersion: "1", modelWeightsFingerprint: "w", preprocessingVersion: "p"};

function snapshot(file) { return {schemaVersion: 1, jobId: "job", createdAt: new Date().toISOString(), track: {displayName: "t", sessionPath: "live_set tracks 0"}, rack: {displayName: "r", sessionId: 9, sessionPath: "live_set tracks 0 devices 1"}, skippedPads: [], regions: [0, 1].map((i) => ({regionId: `r${i}`, padIndex: i, padNote: 36 + i, padDisplayName: "slice", chainSessionId: 10 + i, chainSessionPath: `secret ${i}`, originalChainName: "slice", simplerSessionPath: `secret simpler ${i}`, playbackMode: 1, source: {path: file, sampleRate: 44100, lengthFrames: 100, startFrame: i * 10, endFrame: i * 10 + 10}, warnings: []}))}; }

function health(requestId) {
  return {schemaVersion: 1, type: "health", requestId, ok: true, backendId: "adtof", modelVersion: "1", modelWeightsFingerprint: "weights", preprocessingVersion: "1", classNames: ["kick", "snare", "tom", "hihat", "cymbal"]};
}

function backendMetadata() {
  const value = health("unused");
  delete value.schemaVersion;
  delete value.type;
  delete value.requestId;
  return value;
}

function prediction(regionId, className = "kick") {
  return {regionId, classes: [className], scores: {[className]: 0.8}, matchedEvents: [], decision: "matched_event", topScore: 0.8, warnings: []};
}

test("normalizes paths with spaces and Unicode and groups one source", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl ünicode ")); const file = path.join(dir, "beat ü.wav"); fs.writeFileSync(file, "wave");
  assert.equal(normalizeSourcePath(file), path.resolve(file)); const groups = await groupRegions(snapshot(file), metadata);
  assert.equal(groups.length, 1); assert.equal(groups[0].regions.length, 2); assert.equal(groups[0].regions[0].chainSessionId, undefined);
});

test("fingerprints are stable and change with file metadata", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-fp-")); const file = path.join(dir, "a.wav"); fs.writeFileSync(file, "a");
  const first = await fingerprintSource(file, metadata); const second = await fingerprintSource(file, metadata); assert.equal(first.sourceId, second.sourceId);
  fs.appendFileSync(file, "b"); const third = await fingerprintSource(file, metadata); assert.notEqual(first.sourceId, third.sourceId);
});

test("missing files are rejected and Live fields are stripped", async () => {
  const missing = path.join(path.parse(process.cwd()).root, "definitely", "missing-drumslice-id.wav");
  await assert.rejects(() => fingerprintSource(missing, metadata), {code: "SAMPLE_FILE_MISSING"});
  assert.deepEqual(stripLiveData(snapshot("/tmp/x").regions[0]), {regionId: "r0", startFrame: 0, endFrame: 10});
});

test("relative source paths are rejected before they can resolve against Node's cwd", () => {
  assert.throws(() => normalizeSourcePath("relative.wav"), {code: "INVALID_SOURCE_PATH"});
});

test("settings merge nested thresholds and reject invalid backend options before health", () => {
  assert.equal(mergeSettings({modelOptions: {thresholds: {kick: 0.5}}}).modelOptions.thresholds.snare, 0.24);
  assert.throws(() => mergeSettings({modelOptions: {thresholds: {kick: 0}}}), {code: "INVALID_SETTINGS"});
  assert.throws(() => mergeSettings({modelOptions: {maxThreads: 99}}), {code: "INVALID_SETTINGS"});
  assert.throws(() => mergeSettings({backend: "mock"}, false), {code: "MOCK_BACKEND_DISABLED"});
  assert.equal(mergeSettings({backend: "mock"}, true).backend, "mock");
});

test("analysis continues valid sources and merges unreadable-source predictions", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-partial-"));
  const good = path.join(dir, "good.wav"); fs.writeFileSync(good, "wave");
  const mixed = snapshot(good); mixed.regions[1].source.path = path.join(dir, "missing.wav");
  let sentSources;
  const worker = {
    health: async (requestId) => health(requestId),
    request: async (message) => {
      sentSources = message.params.sources;
      return {schemaVersion: 1, type: "result", requestId: message.requestId, backend: backendMetadata(), predictions: [prediction("r0")], sourceErrors: []};
    },
    cancel() {},
    async shutdown() {},
  };
  const orchestrator = new Orchestrator({config: {python: "mock"}, workerFactory: () => worker, logger: {error() {}}});
  const result = await orchestrator.analyze(mixed);
  assert.equal(sentSources.length, 1);
  assert.equal(sentSources[0].lengthFramesFromLive, 100);
  assert.deepEqual(result.predictions.map((item) => [item.regionId, item.decision]), [["r0", "matched_event"], ["r1", "analysis_error"]]);
  assert.equal(result.sourceErrors[0].code, "SAMPLE_FILE_MISSING");
  assert.equal(result.jobId, "job");
});

test("cancelling during health prevents the analysis request and clears active state", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-cancel-health-"));
  const file = path.join(dir, "good.wav"); fs.writeFileSync(file, "wave");
  let resolveHealth;
  let healthId;
  let requestCalled = false;
  const worker = {
    health: (requestId) => { healthId = requestId; return new Promise((resolve) => { resolveHealth = resolve; }); },
    request: async () => { requestCalled = true; throw new Error("must not run"); },
    cancel() {},
    async shutdown() {},
  };
  const orchestrator = new Orchestrator({config: {python: "mock"}, workerFactory: () => worker, logger: {error() {}}});
  const pending = orchestrator.analyze(snapshot(file));
  while (!orchestrator.active || !resolveHealth) await new Promise((resolve) => setImmediate(resolve));
  orchestrator.cancel(orchestrator.active.requestId);
  const immediate = await Promise.race([
    pending.catch((error) => error),
    new Promise((resolve) => setTimeout(() => resolve("timed out"), 50)),
  ]);
  assert.notEqual(immediate, "timed out");
  assert.equal(immediate.code, "ANALYSIS_CANCELLED");
  resolveHealth(health(healthId));
  assert.equal(requestCalled, false);
  assert.equal(orchestrator.active, null);
});

test("Clear Cache waits for a cancelled worker to finish recycling", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-cancel-drain-"));
  const file = path.join(dir, "good.wav"); fs.writeFileSync(file, "wave");
  let resolveRequest;
  let resolveRecycle;
  let requestStarted = false;
  let cleared = false;
  const recycle = new Promise((resolve) => { resolveRecycle = resolve; });
  const worker = {
    health: async (requestId) => health(requestId),
    request: () => { requestStarted = true; return new Promise((resolve) => { resolveRequest = resolve; }); },
    cancel() {},
    recycle: () => recycle,
    async shutdown() {},
  };
  const cache = {clear: async () => { cleared = true; }};
  const orchestrator = new Orchestrator({config: {python: "mock"}, workerFactory: () => worker, cache, logger: {error() {}}});
  const pending = orchestrator.analyze(snapshot(file));
  while (!requestStarted) await new Promise((resolve) => setImmediate(resolve));
  orchestrator.cancel(orchestrator.active.requestId);
  await assert.rejects(pending, {code: "ANALYSIS_CANCELLED"});

  const clearing = orchestrator.clearCache();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(cleared, false);
  resolveRecycle();
  await clearing;
  assert.equal(cleared, true);
  resolveRequest({schemaVersion: 1, type: "result", requestId: "ignored"});
});

test("superseded progress is suppressed and the old cancellation is scoped", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-supersede-"));
  const file = path.join(dir, "good.wav"); fs.writeFileSync(file, "wave");
  const requests = new Map();
  const worker = {
    health: async (requestId) => health(requestId),
    request: (message, options) => new Promise((resolve, reject) => requests.set(message.requestId, {message, options, resolve, reject})),
    cancel: (requestId) => { const item = requests.get(requestId); if (item) item.reject(coded("ANALYSIS_CANCELLED", "cancelled")); },
    async shutdown() {},
  };
  const orchestrator = new Orchestrator({config: {python: "mock"}, workerFactory: () => worker, logger: {error() {}}});
  const progress = [];
  const firstSnapshot = snapshot(file); firstSnapshot.jobId = "first";
  const secondSnapshot = snapshot(file); secondSnapshot.jobId = "second";
  const first = orchestrator.analyze(firstSnapshot, null, (item) => progress.push(item));
  const firstOutcome = first.catch((error) => error);
  while (requests.size < 1) await new Promise((resolve) => setImmediate(resolve));
  const firstRequest = Array.from(requests.values())[0];
  const second = orchestrator.analyze(secondSnapshot, null, (item) => progress.push(item));
  while (requests.size < 2) await new Promise((resolve) => setImmediate(resolve));
  firstRequest.options.onProgress({schemaVersion: 1, type: "progress", requestId: firstRequest.message.requestId, completed: 1, total: 1});
  const firstError = await firstOutcome;
  assert.equal(firstError.code, "ANALYSIS_CANCELLED");
  assert.equal(firstError.superseded, true);
  assert.equal(firstError.jobId, "first");
  assert.equal(progress.length, 0);
  const secondRequest = Array.from(requests.values())[1];
  secondRequest.resolve({schemaVersion: 1, type: "result", requestId: secondRequest.message.requestId, backend: backendMetadata(), predictions: [prediction("r0"), prediction("r1")], sourceErrors: []});
  const result = await second;
  assert.equal(result.jobId, "second");
  assert.equal(orchestrator.active, null);
});

test("failed health clears active state", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-health-fail-"));
  const file = path.join(dir, "good.wav"); fs.writeFileSync(file, "wave");
  const worker = {health: async () => { throw coded("MODEL_LOAD_FAILED", "bad model"); }, cancel() {}, async shutdown() {}};
  const orchestrator = new Orchestrator({config: {python: "mock"}, workerFactory: () => worker, logger: {error() {}}});
  await assert.rejects(orchestrator.analyze(snapshot(file)), {code: "MODEL_LOAD_FAILED"});
  assert.equal(orchestrator.active, null);
});

test("Python path handling preserves spaces, expands home, and rejects relative paths", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl python "));
  const executable = path.join(dir, "python executable"); fs.writeFileSync(executable, "#!/bin/sh\n"); fs.chmodSync(executable, 0o700);
  assert.equal(await normalizePythonExecutable(executable), executable);
  assert.equal(maxAtomsToPath(["text", ...executable.split(" ")]), executable);
  assert.equal(expandHomePath("~/venv/bin/python"), path.join(os.homedir(), "venv", "bin", "python"));
  await assert.rejects(() => normalizePythonExecutable("python3"), {code: "INVALID_PYTHON_PATH"});
});

test("a copied Max package uses an existing cwd and does not inject a missing source PYTHONPATH", () => {
  const copiedPackageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sl-copied-package-"));
  const options = workerRuntimeOptions({python: "/venv/bin/python"}, {error() {}}, path.join(copiedPackageRoot, "missing-python-source"));
  assert.equal(options.cwd, os.homedir());
  assert.equal(options.env, undefined);
});

test("a legacy backend config selects the legacy module only for that existing environment", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "drumslice-id-legacy-config-"));
  const config = path.join(directory, "backend.json");
  fs.writeFileSync(config, JSON.stringify({schemaVersion: 1, python: "/legacy/python", backend: "adtof"}));
  const previousNew = process.env.DRUMSLICE_ID_BACKEND_CONFIG;
  const previousOld = process.env.SLICE_LABELER_BACKEND_CONFIG;
  delete process.env.DRUMSLICE_ID_BACKEND_CONFIG;
  process.env.SLICE_LABELER_BACKEND_CONFIG = config;
  try {
    const loaded = loadBackendConfig();
    assert.equal(loaded.workerModule, "slice_labeler_worker");
    const options = workerRuntimeOptions(loaded, {error() {}}, path.join(directory, "missing-source"));
    assert.deepEqual(options.args, ["-m", "slice_labeler_worker"]);
  } finally {
    if (previousNew == null) delete process.env.DRUMSLICE_ID_BACKEND_CONFIG;
    else process.env.DRUMSLICE_ID_BACKEND_CONFIG = previousNew;
    if (previousOld == null) delete process.env.SLICE_LABELER_BACKEND_CONFIG;
    else process.env.SLICE_LABELER_BACKEND_CONFIG = previousOld;
  }
});

test("a failed replacement health check preserves the prior worker and configuration", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-configure-"));
  const executable = path.join(dir, "python"); fs.writeFileSync(executable, "#!/bin/sh\n"); fs.chmodSync(executable, 0o700);
  let candidateShutdown = 0;
  const previous = {async shutdown() { throw new Error("previous worker must stay running"); }};
  const candidate = {health: async () => { throw coded("MODEL_LOAD_FAILED", "bad candidate"); }, async shutdown() { candidateShutdown += 1; }};
  const orchestrator = new Orchestrator({config: {python: "/old/python"}, workerFactory: () => candidate, logger: {error() {}}});
  orchestrator.worker = previous;
  await assert.rejects(() => orchestrator.configurePython(executable), {code: "MODEL_LOAD_FAILED"});
  assert.equal(orchestrator.worker, previous);
  assert.equal(orchestrator.config.python, "/old/python");
  assert.equal(candidateShutdown, 1);
});

test("backend config parsing accepts a UTF-8 BOM", () => {
  assert.deepEqual(parseBackendConfig(`\uFEFF{"schemaVersion":1,"python":"/python"}`), {schemaVersion: 1, python: "/python"});
});

test("a validated Python replacement is persisted atomically and old shutdown failure is non-fatal", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-configure-success-"));
  const executable = path.join(dir, "python"); fs.writeFileSync(executable, "#!/bin/sh\n"); fs.chmodSync(executable, 0o700);
  const configFile = path.join(dir, "config", "backend-config.json");
  const logs = [];
  const previous = {async shutdown() { throw coded("OLD_SHUTDOWN_FAILED", "old worker failed to stop"); }};
  const candidate = {health: async (requestId) => health(requestId), async shutdown() { throw new Error("candidate must remain running"); }};
  const orchestrator = new Orchestrator({config: {schemaVersion: 1, python: "/old/python", backend: "adtof"}, configFile, workerFactory: () => candidate, logger: {error: (...args) => logs.push(args)}});
  orchestrator.worker = previous;
  const configured = await orchestrator.configurePython(executable);
  assert.equal(configured.backendId, "adtof");
  assert.equal(orchestrator.worker, candidate);
  assert.equal(orchestrator.config.python, executable);
  assert.equal(JSON.parse(fs.readFileSync(configFile, "utf8")).python, executable);
  assert.equal(logs[0][0], "previous Python worker shutdown failed");
  assert.equal(fs.readdirSync(path.dirname(configFile)).some((name) => name.endsWith(".tmp")), false);
});

test("backend reconfiguration blocks a newly-started analysis until the worker swap is complete", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-configure-race-"));
  const executable = path.join(dir, "python"); fs.writeFileSync(executable, "#!/bin/sh\n"); fs.chmodSync(executable, 0o700);
  const sample = path.join(dir, "sample.wav"); fs.writeFileSync(sample, "wave");
  let finishHealth;
  const candidate = {
    health: (requestId) => new Promise((resolve) => { finishHealth = () => resolve(health(requestId)); }),
    async shutdown() {},
  };
  const orchestrator = new Orchestrator({
    config: {python: "/old/python"},
    configFile: path.join(dir, "backend-config.json"),
    workerFactory: () => candidate,
    logger: {error() {}},
  });
  const configuring = orchestrator.configurePython(executable);
  while (!finishHealth) await new Promise((resolve) => setImmediate(resolve));
  await assert.rejects(orchestrator.analyze(snapshot(sample)), {code: "BACKEND_MAINTENANCE_BUSY", jobId: "job"});
  assert.equal(orchestrator.active, null);
  finishHealth();
  await configuring;
  assert.equal(orchestrator.maintenance, null);
});

test("cache clearing cannot overlap analysis or another maintenance operation", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-clear-race-"));
  const sample = path.join(dir, "sample.wav"); fs.writeFileSync(sample, "wave");
  let finishClear;
  const cache = {clear: () => new Promise((resolve) => { finishClear = resolve; })};
  const orchestrator = new Orchestrator({config: {python: "mock"}, cache, workerFactory: () => { throw new Error("worker must not start"); }, logger: {error() {}}});
  const clearing = orchestrator.clearCache();
  while (!finishClear) await new Promise((resolve) => setImmediate(resolve));
  await assert.rejects(orchestrator.analyze(snapshot(sample)), {code: "BACKEND_MAINTENANCE_BUSY", jobId: "job"});
  await assert.rejects(orchestrator.clearCache(), {code: "BACKEND_MAINTENANCE_BUSY"});
  finishClear();
  await clearing;
  assert.equal(orchestrator.maintenance, null);
});

test("shutdown during backend configuration stops the candidate and prevents a late install", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sl-configure-shutdown-"));
  const executable = path.join(dir, "python"); fs.writeFileSync(executable, "#!/bin/sh\n"); fs.chmodSync(executable, 0o700);
  let rejectHealth;
  let candidateShutdowns = 0;
  const candidate = {
    health: () => new Promise((_resolve, reject) => { rejectHealth = reject; }),
    async shutdown() {
      candidateShutdowns += 1;
      rejectHealth(coded("WORKER_SHUTDOWN", "candidate stopped"));
    },
  };
  const previous = {shutdowns: 0, async shutdown() { this.shutdowns += 1; }};
  const orchestrator = new Orchestrator({
    config: {python: "/old/python"},
    configFile: path.join(dir, "backend-config.json"),
    workerFactory: () => candidate,
    logger: {error() {}},
  });
  orchestrator.worker = previous;
  const configuring = orchestrator.configurePython(executable);
  while (!rejectHealth) await new Promise((resolve) => setImmediate(resolve));
  await orchestrator.shutdown();
  await assert.rejects(configuring, {code: "WORKER_SHUTDOWN"});
  assert.equal(candidateShutdowns, 1);
  assert.equal(previous.shutdowns, 1);
  assert.equal(orchestrator.worker, null);
  assert.equal(orchestrator.candidateWorker, null);
  assert.equal(orchestrator.stopping, true);
  await assert.rejects(orchestrator.health(), {code: "ORCHESTRATOR_SHUTTING_DOWN"});
});
