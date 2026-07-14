"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const {validateRackSnapshot, validateAnalysisResult, validateHealthResponse} = require("./validators");
const {PythonWorker} = require("./python_worker");
const {DiskCache, cacheRoot, workerCacheRoot} = require("./cache");
const {RotatingLogger} = require("./logger");
const {coded} = require("./protocol");

function normalizeSourcePath(input) {
  if (typeof input !== "string" || !input.trim()) throw coded("INVALID_SOURCE_PATH", "Source path is empty.");
  if (!path.isAbsolute(input)) throw coded("INVALID_SOURCE_PATH", "Source path must be absolute.");
  return path.normalize(path.resolve(input));
}

async function fingerprintSource(sourcePath, metadata) {
  const normalized = normalizeSourcePath(sourcePath);
  let stat;
  try {
    stat = await fs.promises.stat(normalized, {bigint: true});
  } catch (error) {
    throw coded("SAMPLE_FILE_MISSING", `Sample file is not readable: ${path.basename(normalized)}`, {cause: error.code});
  }
  if (!stat.isFile()) throw coded("SAMPLE_FILE_MISSING", "Sample path does not identify a regular file.");
  const parts = [
    normalized,
    stat.size.toString(),
    stat.mtimeNs.toString(),
    metadata.backendId,
    metadata.modelVersion,
    metadata.modelWeightsFingerprint,
    metadata.preprocessingVersion,
  ];
  return {
    sourceId: crypto.createHash("sha256").update(parts.join("\0")).digest("hex"),
    path: normalized,
    size: stat.size.toString(),
    mtimeNs: stat.mtimeNs.toString(),
  };
}

function stripLiveData(region) {
  return {
    regionId: region.regionId,
    startFrame: region.source.startFrame,
    endFrame: region.source.endFrame,
  };
}

function collectRegionGroups(snapshot) {
  validateRackSnapshot(snapshot);
  const byPath = new Map();
  for (const region of snapshot.regions) {
    const normalized = normalizeSourcePath(region.source.path);
    if (!byPath.has(normalized)) {
      byPath.set(normalized, {
        path: normalized,
        sampleRateFromLive: region.source.sampleRate,
        lengthFramesFromLive: region.source.lengthFrames,
        regions: [],
      });
    }
    const group = byPath.get(normalized);
    if (group.sampleRateFromLive !== region.source.sampleRate) {
      throw coded("SOURCE_SAMPLE_RATE_CONFLICT", "Live reported different sample rates for one source.");
    }
    if (group.lengthFramesFromLive !== region.source.lengthFrames) {
      throw coded("SOURCE_LENGTH_CONFLICT", "Live reported different lengths for one source.");
    }
    group.regions.push(stripLiveData(region));
  }
  return Array.from(byPath.values());
}

async function groupRegions(snapshot, metadata) {
  const groups = [];
  for (const group of collectRegionGroups(snapshot)) {
    const fingerprint = await fingerprintSource(group.path, metadata);
    groups.push(Object.assign(group, {sourceId: fingerprint.sourceId}));
  }
  return groups;
}

function preflightSourceId(sourcePath) {
  return `unreadable:${crypto.createHash("sha256").update(sourcePath).digest("hex")}`;
}

function analysisErrorPrediction(region, error) {
  return {
    regionId: region.regionId,
    classes: ["unknown"],
    scores: {},
    matchedEvents: [],
    decision: "analysis_error",
    topScore: 0,
    warnings: [error.message || "The source could not be analyzed."],
  };
}

async function prepareSources(snapshot, metadata) {
  const sources = [];
  const predictions = [];
  const sourceErrors = [];
  for (const group of collectRegionGroups(snapshot)) {
    try {
      const fingerprint = await fingerprintSource(group.path, metadata);
      sources.push(Object.assign(group, {sourceId: fingerprint.sourceId}));
    } catch (error) {
      const sourceId = preflightSourceId(group.path);
      sourceErrors.push({sourceId, code: error.code || "SAMPLE_FILE_MISSING", message: error.message || "The source is unreadable.", details: error.details});
      for (const region of group.regions) predictions.push(analysisErrorPrediction(region, error));
    }
  }
  return {sources, predictions, sourceErrors};
}

function defaultSettings() {
  return {
    backend: "adtof",
    modelOptions: {
      device: "cpu",
      fps: 100,
      maxThreads: 2,
      thresholds: {kick: 0.22, snare: 0.24, tom: 0.32, hihat: 0.22, cymbal: 0.30},
    },
    mappingOptions: {
      preToleranceMs: 35,
      postToleranceMs: 90,
      clusterMs: 18,
      multiLabel: true,
      fallbackEnabled: true,
      fallbackNormalizedFloor: 0.70,
    },
  };
}

function debugEnabled() {
  return process.env.DRUMSLICE_ID_DEBUG === "1" || process.env.SLICE_LABELER_DEBUG === "1";
}

function mergeSettings(input, allowMockBackend = debugEnabled()) {
  const defaults = defaultSettings();
  const settings = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const suppliedModel = settings.modelOptions && typeof settings.modelOptions === "object" && !Array.isArray(settings.modelOptions) ? settings.modelOptions : {};
  const suppliedMapping = settings.mappingOptions && typeof settings.mappingOptions === "object" && !Array.isArray(settings.mappingOptions) ? settings.mappingOptions : {};
  const suppliedThresholds = suppliedModel.thresholds && typeof suppliedModel.thresholds === "object" && !Array.isArray(suppliedModel.thresholds) ? suppliedModel.thresholds : {};
  const merged = Object.assign({}, defaults, settings, {
    modelOptions: Object.assign({}, defaults.modelOptions, suppliedModel, {
      thresholds: Object.assign({}, defaults.modelOptions.thresholds, suppliedThresholds),
    }),
    mappingOptions: Object.assign({}, defaults.mappingOptions, suppliedMapping),
  });
  if (!["adtof", "mock"].includes(merged.backend)) throw coded("INVALID_SETTINGS", "backend must be adtof or mock.");
  if (merged.backend === "mock" && allowMockBackend !== true) {
    throw coded("MOCK_BACKEND_DISABLED", "The mock backend is available only when the explicit DrumSLICE ID debug flag is enabled.");
  }
  const modelKeys = new Set(["device", "fps", "maxThreads", "weightsPath", "mockActivations", "thresholds"]);
  const unknownModelKeys = Object.keys(merged.modelOptions).filter((key) => !modelKeys.has(key));
  if (unknownModelKeys.length) throw coded("INVALID_SETTINGS", "modelOptions contains unknown settings.", {unknown: unknownModelKeys});
  if (merged.modelOptions.device !== "cpu" || merged.modelOptions.fps !== 100) throw coded("INVALID_SETTINGS", "Only the CPU backend at 100 FPS is supported.");
  if (!Number.isInteger(merged.modelOptions.maxThreads) || merged.modelOptions.maxThreads < 1 || merged.modelOptions.maxThreads > 8) {
    throw coded("INVALID_SETTINGS", "maxThreads must be an integer from 1 through 8.");
  }
  if (merged.modelOptions.weightsPath != null && (typeof merged.modelOptions.weightsPath !== "string" || !merged.modelOptions.weightsPath)) {
    throw coded("INVALID_SETTINGS", "weightsPath must be a non-empty string.");
  }
  if (merged.modelOptions.mockActivations != null && !Array.isArray(merged.modelOptions.mockActivations)) {
    throw coded("INVALID_SETTINGS", "mockActivations must be an array.");
  }
  const thresholdNames = ["kick", "snare", "tom", "hihat", "cymbal"];
  const unknownThresholds = Object.keys(merged.modelOptions.thresholds).filter((key) => !thresholdNames.includes(key));
  if (unknownThresholds.length) throw coded("INVALID_SETTINGS", "thresholds contains unknown classes.", {unknown: unknownThresholds});
  for (const className of thresholdNames) {
    const value = merged.modelOptions.thresholds[className];
    if (!Number.isFinite(value) || value <= 0 || value > 1) throw coded("INVALID_SETTINGS", `${className} threshold must be greater than 0 and at most 1.`);
  }
  const mappingKeys = new Set(["preToleranceMs", "postToleranceMs", "clusterMs", "multiLabel", "fallbackEnabled", "fallbackNormalizedFloor"]);
  const unknownMappingKeys = Object.keys(merged.mappingOptions).filter((key) => !mappingKeys.has(key));
  if (unknownMappingKeys.length) throw coded("INVALID_SETTINGS", "mappingOptions contains unknown settings.", {unknown: unknownMappingKeys});
  for (const key of ["preToleranceMs", "postToleranceMs", "clusterMs", "fallbackNormalizedFloor"]) {
    if (!Number.isFinite(merged.mappingOptions[key]) || merged.mappingOptions[key] < 0) throw coded("INVALID_SETTINGS", `${key} must be a non-negative finite number.`);
  }
  for (const key of ["multiLabel", "fallbackEnabled"]) {
    if (typeof merged.mappingOptions[key] !== "boolean") throw coded("INVALID_SETTINGS", `${key} must be boolean.`);
  }
  if (merged.perSourceTimeoutMs != null && (!Number.isFinite(merged.perSourceTimeoutMs) || merged.perSourceTimeoutMs <= 0)) {
    throw coded("INVALID_SETTINGS", "perSourceTimeoutMs must be positive.");
  }
  return merged;
}

function workerRuntimeOptions(config, logger, sourceRoot = path.resolve(__dirname, "../../python")) {
  const sourcePackage = path.join(sourceRoot, "drumslice_id_worker");
  const hasSourcePackage = fs.existsSync(sourcePackage);
  const options = {
    python: config.python,
    args: ["-m", config.workerModule || "drumslice_id_worker"],
    cwd: hasSourcePackage ? sourceRoot : os.homedir(),
    logger,
  };
  if (hasSourcePackage) {
    options.env = {
      PYTHONPATH: [sourceRoot, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter),
    };
  }
  return options;
}

function backendMetadata(health) {
  const metadata = Object.assign({}, health);
  delete metadata.schemaVersion;
  delete metadata.type;
  delete metadata.requestId;
  return metadata;
}

function cancellationError(context, superseded) {
  const error = coded("ANALYSIS_CANCELLED", superseded ? "Analysis was superseded by a newer request." : "Analysis was cancelled.", {superseded: !!superseded});
  error.requestId = context.requestId;
  error.jobId = context.jobId;
  error.superseded = !!superseded;
  return error;
}

function scopeError(error, context) {
  if (!error || typeof error !== "object") error = coded("INTERNAL_ERROR", String(error));
  if (!error.requestId) error.requestId = context.requestId;
  if (!error.jobId) error.jobId = context.jobId;
  return error;
}

class Orchestrator {
  constructor(options = {}) {
    this.cache = options.cache || new DiskCache({directory: workerCacheRoot()});
    this.active = null;
    this.config = options.config || loadBackendConfig();
    this.configFile = options.configFile || backendConfigPath();
    this.logger = options.logger || new RotatingLogger(path.join(cacheRoot(), "drumslice-id.log"));
    this.workerFactory = options.workerFactory || ((config) => new PythonWorker(workerRuntimeOptions(config, this.logger)));
    this.worker = null;
    this.candidateWorker = null;
    this.maintenance = null;
    this.stopping = false;
    this.shutdownPromise = null;
    this.workerDrain = null;
    this.allowMockBackend = options.allowMockBackend === true || debugEnabled();
  }

  assertAvailable() {
    if (this.stopping) throw coded("ORCHESTRATOR_SHUTTING_DOWN", "The backend service is shutting down.");
    if (this.maintenance) {
      throw coded("BACKEND_MAINTENANCE_BUSY", "Wait for the current backend maintenance operation to finish.", {operation: this.maintenance});
    }
  }

  getWorker() {
    if (!this.config.python) throw coded("BACKEND_NOT_INSTALLED", "Configure a Python backend before analysis.");
    if (!this.worker) this.worker = this.workerFactory(this.config);
    return this.worker;
  }

  async health(backend = "adtof", options = {}) {
    if (this.active) throw coded("BUSY_ANALYZING", "Wait for the active analysis before checking backend health.");
    this.assertAvailable();
    this.maintenance = "health";
    try {
      await this.waitForWorkerDrain();
      const id = crypto.randomUUID();
      return validateHealthResponse(await this.getWorker().health(id, backend, options));
    } finally {
      this.maintenance = null;
    }
  }

  isActive(context) {
    return !!this.active && this.active === context && !context.cancelled;
  }

  assertActive(context) {
    if (this.isActive(context)) return;
    throw cancellationError(context, !!this.active && this.active !== context);
  }

  async awaitContext(context, promise) {
    const outcome = await Promise.race([
      Promise.resolve(promise).then((value) => ({value})),
      context.cancellation.then(() => ({cancelled: true})),
    ]);
    if (outcome.cancelled) throw cancellationError(context, !!this.active && this.active !== context);
    this.assertActive(context);
    return outcome.value;
  }

  trackWorkerDrain(promise) {
    if (!promise || typeof promise.then !== "function") return;
    const drain = Promise.resolve(promise).catch((error) => {
      this.logger.error("cancelled Python worker recycle failed", {code: error.code, message: error.message});
    });
    this.workerDrain = drain;
    drain.then(() => { if (this.workerDrain === drain) this.workerDrain = null; });
  }

  async waitForWorkerDrain() {
    if (this.workerDrain) await this.workerDrain;
  }

  async analyze(snapshot, inputSettings, onProgress) {
    let signalCancellation;
    const context = {
      requestId: crypto.randomUUID(),
      jobId: snapshot && snapshot.jobId,
      cancelled: false,
      requestSubmitted: false,
      cancellation: new Promise((resolve) => { signalCancellation = resolve; }),
      signalCancellation: () => signalCancellation(),
    };
    let settings;
    try {
      validateRackSnapshot(snapshot);
      this.assertAvailable();
      settings = mergeSettings(inputSettings, this.allowMockBackend);
    } catch (error) {
      throw scopeError(error, context);
    }
    if (this.active) this.cancel(this.active.requestId);
    this.active = context;

    try {
      await this.awaitContext(context, this.workerDrain || Promise.resolve());
      const worker = this.getWorker();
      const health = validateHealthResponse(await this.awaitContext(context, worker.health(`${context.requestId}:health`, settings.backend, settings.modelOptions)));
      const metadata = {
        backendId: health.backendId,
        modelVersion: health.modelVersion,
        modelWeightsFingerprint: health.modelWeightsFingerprint,
        preprocessingVersion: health.preprocessingVersion,
      };
      const prepared = await this.awaitContext(context, prepareSources(snapshot, metadata));

      let workerResult;
      if (prepared.sources.length) {
        const message = {
          schemaVersion: 1,
          type: "request",
          requestId: context.requestId,
          method: "analyze",
          params: {
            backend: settings.backend,
            modelOptions: settings.modelOptions,
            mappingOptions: settings.mappingOptions,
            sources: prepared.sources,
          },
        };
        context.requestSubmitted = true;
        const timeoutPerSource = settings.perSourceTimeoutMs || 300000;
        workerResult = await this.awaitContext(context, worker.request(message, {
          timeoutMs: timeoutPerSource * prepared.sources.length,
          onProgress: (progress) => {
            if (this.isActive(context) && onProgress) onProgress(Object.assign({}, progress, {jobId: context.jobId, requestId: context.requestId}));
          },
        }));
      } else {
        workerResult = {
          schemaVersion: 1,
          type: "result",
          requestId: context.requestId,
          backend: backendMetadata(health),
          predictions: [],
          sourceErrors: [],
        };
      }

      this.assertActive(context);
      const result = Object.assign({}, workerResult, {
        predictions: (workerResult.predictions || []).concat(prepared.predictions),
        sourceErrors: (workerResult.sourceErrors || []).concat(prepared.sourceErrors),
      });
      validateAnalysisResult(result, context.requestId, snapshot.regions.map((region) => region.regionId), backendMetadata(health));
      return Object.assign({}, result, {jobId: context.jobId});
    } catch (error) {
      const superseded = !!this.active && this.active !== context;
      if (context.cancelled || superseded || (error && error.code === "ANALYSIS_CANCELLED")) throw cancellationError(context, superseded);
      throw scopeError(error, context);
    } finally {
      if (this.active === context) this.active = null;
    }
  }

  cancel(requestId) {
    if (!this.active || this.active.requestId !== requestId) return false;
    const context = this.active;
    context.cancelled = true;
    context.signalCancellation();
    if (context.requestSubmitted && this.worker) this.worker.cancel(requestId);
    if (this.worker && typeof this.worker.recycle === "function") this.trackWorkerDrain(this.worker.recycle());
    return true;
  }

  async configurePython(input) {
    if (this.active) throw coded("BUSY_ANALYZING", "Cancel the active analysis before changing the Python backend.");
    this.assertAvailable();
    this.maintenance = "configure_python";
    try {
      await this.waitForWorkerDrain();
      const python = await normalizePythonExecutable(input);
      const candidateConfig = Object.assign({}, this.config, {python, workerModule: "drumslice_id_worker"});
      const candidate = this.workerFactory(candidateConfig);
      this.candidateWorker = candidate;
      let health;
      let validatedConfig;
      try {
        health = validateHealthResponse(await candidate.health(crypto.randomUUID(), candidateConfig.backend || "adtof", {}));
        if (this.stopping) throw coded("ORCHESTRATOR_SHUTTING_DOWN", "The backend service began shutting down during configuration.");
        validatedConfig = {
          schemaVersion: 1,
          python,
          backend: health.backendId,
          modelVersion: health.modelVersion,
          modelWeightsFingerprint: health.modelWeightsFingerprint,
          preprocessingVersion: health.preprocessingVersion,
        };
        await persistBackendConfig(validatedConfig, this.configFile);
        if (this.stopping) throw coded("ORCHESTRATOR_SHUTTING_DOWN", "The backend service began shutting down during configuration.");
      } catch (error) {
        if (this.candidateWorker === candidate) {
          this.candidateWorker = null;
          try { await candidate.shutdown(); } catch {}
        }
        throw error;
      }

      const previous = this.worker;
      this.worker = candidate;
      this.candidateWorker = null;
      this.config = validatedConfig;
      if (previous && previous !== candidate) {
        try { await previous.shutdown(); }
        catch (error) { this.logger.error("previous Python worker shutdown failed", {code: error.code, message: error.message}); }
      }
      return health;
    } finally {
      this.maintenance = null;
    }
  }

  async clearCache() {
    if (this.active) throw coded("BUSY_ANALYZING", "Cancel the active analysis before clearing the cache.");
    this.assertAvailable();
    this.maintenance = "clear_cache";
    try { await this.waitForWorkerDrain(); await this.cache.clear(); }
    finally { this.maintenance = null; }
  }

  async shutdown() {
    if (this.shutdownPromise) return this.shutdownPromise;
    this.stopping = true;
    if (this.active) this.cancel(this.active.requestId);
    const workers = Array.from(new Set([this.worker, this.candidateWorker].filter(Boolean)));
    this.worker = null;
    this.candidateWorker = null;
    const drain = this.workerDrain;
    this.shutdownPromise = (async () => {
      const operations = workers.map((worker) => worker.shutdown());
      if (drain) operations.push(drain);
      const outcomes = await Promise.allSettled(operations);
      const failed = outcomes.find((outcome) => outcome.status === "rejected");
      if (failed) throw failed.reason;
    })();
    return this.shutdownPromise;
  }
}

async function normalizePythonExecutable(input) {
  if (typeof input !== "string") throw coded("INVALID_PYTHON_PATH", "Backend Python path must be a string.");
  let value = input.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  value = expandHomePath(value);
  if (!path.isAbsolute(value)) throw coded("INVALID_PYTHON_PATH", "Backend Python path must be absolute.");
  const normalized = path.normalize(value);
  let stat;
  try {
    stat = await fs.promises.stat(normalized);
    await fs.promises.access(normalized, process.platform === "win32" ? fs.constants.F_OK : fs.constants.X_OK);
  } catch (error) {
    throw coded("INVALID_PYTHON_PATH", "Backend Python executable is not readable and executable.", {cause: error.code});
  }
  if (!stat.isFile()) throw coded("INVALID_PYTHON_PATH", "Backend Python path does not identify a file.");
  return normalized;
}

function loadBackendConfig() {
  const candidates = [
    {file: process.env.DRUMSLICE_ID_BACKEND_CONFIG, legacy: false},
    {file: process.env.SLICE_LABELER_BACKEND_CONFIG, legacy: true},
    {file: path.join(os.homedir(), ".drumslice-id", "backend-config.json"), legacy: false},
    {file: path.join(os.homedir(), ".slice-labeler", "backend-config.json"), legacy: true},
  ].filter((candidate, index, all) => candidate.file && all.findIndex((item) => item.file === candidate.file) === index);
  for (const candidate of candidates) {
    try {
      const config = parseBackendConfig(fs.readFileSync(candidate.file, "utf8"));
      if (typeof config.python === "string" && config.python) {
        return Object.assign({}, config, {
          python: expandHomePath(config.python),
          workerModule: candidate.legacy ? "slice_labeler_worker" : "drumslice_id_worker",
        });
      }
    } catch {}
  }
  const python = process.env.DRUMSLICE_ID_PYTHON || process.env.SLICE_LABELER_PYTHON;
  return {python: python ? expandHomePath(python) : null, workerModule: "drumslice_id_worker"};
}

function backendConfigPath() {
  return process.env.DRUMSLICE_ID_BACKEND_CONFIG
    || process.env.SLICE_LABELER_BACKEND_CONFIG
    || path.join(os.homedir(), ".drumslice-id", "backend-config.json");
}

/*
 * Legacy environment names and ~/.slice-labeler are read-only migration
 * aliases. New configuration is always written with the DrumSLICE ID schema
 * and module name; installers rebuild virtual environments instead of moving
 * them because venv launchers contain absolute paths.
 */

function expandHomePath(value) {
  if (value === "~") return os.homedir();
  if (value.startsWith(`~${path.sep}`) || value.startsWith("~/") || value.startsWith("~\\")) return path.join(os.homedir(), value.slice(2));
  return value;
}

function parseBackendConfig(text) {
  return JSON.parse(String(text).replace(/^\uFEFF/, ""));
}

async function persistBackendConfig(config, target = backendConfigPath()) {
  const directory = path.dirname(target);
  const temp = `${target}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  const payload = Object.assign({schemaVersion: 1}, config, {python: config.python});
  await fs.promises.mkdir(directory, {recursive: true, mode: 0o700});
  try {
    await fs.promises.writeFile(temp, `${JSON.stringify(payload, null, 2)}\n`, {encoding: "utf8", mode: 0o600});
    await fs.promises.rename(temp, target);
  } catch (error) {
    try { await fs.promises.rm(temp, {force: true}); } catch {}
    throw coded("BACKEND_CONFIG_WRITE_FAILED", "The validated Python path could not be saved.", {cause: error.code});
  }
}

function maxAtomsToPath(atoms) {
  const parts = atoms.map((atom) => String(atom));
  if (parts[0] === "text") parts.shift();
  let value = parts.join(" ");
  if (value.startsWith("text ")) value = value.slice(5);
  return value;
}

function installMaxHandlers() {
  let maxApi;
  try { maxApi = require("max-api"); } catch { return; }
  const orchestrator = new Orchestrator();
  const emit = (name, payload) => maxApi.outlet(name, JSON.stringify(payload));

  maxApi.addHandler("health", async (backend) => {
    try { emit("health", await orchestrator.health(backend || "adtof")); }
    catch (error) { emit("error", publicError(error)); }
  });
  maxApi.addHandler("analyze", async (dict) => {
    let payload;
    let jobId;
    try {
      payload = typeof dict === "string" ? JSON.parse(dict) : dict;
      jobId = payload && payload.snapshot && payload.snapshot.jobId;
      const result = await orchestrator.analyze(payload.snapshot, payload.settings, (progress) => emit("progress", progress));
      emit("result", result);
    } catch (error) {
      if (error && error.code === "ANALYSIS_CANCELLED" && error.superseded) return;
      const response = publicError(error);
      if (!response.jobId && jobId) response.jobId = jobId;
      emit("error", response);
    }
  });
  maxApi.addHandler("cancel", () => {
    if (orchestrator.active) orchestrator.cancel(orchestrator.active.requestId);
  });
  maxApi.addHandler("clear_cache", async () => {
    try { await orchestrator.clearCache(); emit("cache_cleared", {ok: true}); }
    catch (error) { emit("error", publicError(error)); }
  });
  maxApi.addHandler("configure_python", async (...atoms) => {
    try {
      const health = await orchestrator.configurePython(maxAtomsToPath(atoms));
      emit("python_configured", {ok: true, health});
    } catch (error) {
      emit("error", publicError(error));
    }
  });
  maxApi.addHandler("shutdown", async () => {
    try { await orchestrator.shutdown(); }
    catch (error) { emit("error", publicError(error)); }
  });
  process.on("SIGTERM", () => { orchestrator.shutdown().catch(() => {}); });
}

function publicError(error) {
  const response = {
    code: error && error.code || "INTERNAL_ERROR",
    message: error && error.message || "Unexpected error.",
    details: error && error.details,
  };
  if (error && error.requestId) response.requestId = error.requestId;
  if (error && error.jobId) response.jobId = error.jobId;
  return response;
}

if (require.main === module) installMaxHandlers();

module.exports = {
  Orchestrator,
  normalizeSourcePath,
  normalizePythonExecutable,
  expandHomePath,
  fingerprintSource,
  groupRegions,
  prepareSources,
  stripLiveData,
  defaultSettings,
  mergeSettings,
  debugEnabled,
  workerRuntimeOptions,
  backendConfigPath,
  parseBackendConfig,
  persistBackendConfig,
  loadBackendConfig,
  maxAtomsToPath,
  publicError,
  installMaxHandlers,
};
