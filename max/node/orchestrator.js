"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const {validateRackSnapshot, validateAnalysisResult} = require("./validators");
const {PythonWorker} = require("./python_worker");
const {DiskCache, cacheRoot} = require("./cache");
const {RotatingLogger} = require("./logger");
const {coded} = require("./protocol");

function normalizeSourcePath(input) {
  if (typeof input !== "string" || !input.trim()) throw coded("INVALID_SOURCE_PATH", "Source path is empty.");
  const normalized = path.normalize(path.resolve(input));
  if (!path.isAbsolute(normalized)) throw coded("INVALID_SOURCE_PATH", "Source path must be absolute.");
  return normalized;
}
async function fingerprintSource(sourcePath, metadata) {
  const normalized = normalizeSourcePath(sourcePath); let stat;
  try { stat = await fs.promises.stat(normalized, {bigint: true}); } catch (error) { throw coded("SAMPLE_FILE_MISSING", `Sample file is not readable: ${path.basename(normalized)}`, {cause: error.code}); }
  if (!stat.isFile()) throw coded("SAMPLE_FILE_MISSING", "Sample path does not identify a regular file.");
  const parts = [normalized, stat.size.toString(), stat.mtimeNs.toString(), metadata.backendId, metadata.modelVersion, metadata.modelWeightsFingerprint, metadata.preprocessingVersion];
  return {sourceId: crypto.createHash("sha256").update(parts.join("\0")).digest("hex"), path: normalized, size: stat.size.toString(), mtimeNs: stat.mtimeNs.toString()};
}
function stripLiveData(region) {
  return {regionId: region.regionId, startFrame: region.source.startFrame, endFrame: region.source.endFrame};
}
async function groupRegions(snapshot, metadata) {
  validateRackSnapshot(snapshot); const byPath = new Map();
  for (const region of snapshot.regions) {
    const normalized = normalizeSourcePath(region.source.path);
    if (!byPath.has(normalized)) byPath.set(normalized, {path: normalized, sampleRateFromLive: region.source.sampleRate, regions: []});
    const group = byPath.get(normalized);
    if (group.sampleRateFromLive !== region.source.sampleRate) throw coded("SOURCE_SAMPLE_RATE_CONFLICT", "Live reported different sample rates for one source.");
    group.regions.push(stripLiveData(region));
  }
  const groups = [];
  for (const group of byPath.values()) { const fingerprint = await fingerprintSource(group.path, metadata); groups.push(Object.assign(group, {sourceId: fingerprint.sourceId})); }
  return groups;
}
function defaultSettings() {
  return {backend: "adtof", modelOptions: {device: "cpu", fps: 100, maxThreads: 2, thresholds: {kick: 0.22, snare: 0.24, tom: 0.32, hihat: 0.22, cymbal: 0.30}}, mappingOptions: {preToleranceMs: 35, postToleranceMs: 90, clusterMs: 18, multiLabel: true, fallbackEnabled: true, fallbackNormalizedFloor: 0.70}};
}

class Orchestrator {
  constructor(options = {}) {
    this.cache = options.cache || new DiskCache(); this.active = null; this.config = options.config || loadBackendConfig();
    this.logger = options.logger || new RotatingLogger(path.join(cacheRoot(), "slice-labeler.log"));
    this.workerFactory = options.workerFactory || (() => new PythonWorker({python: this.config.python, cwd: path.resolve(__dirname, "../../python"), logger: this.logger, env: {PYTHONPATH: path.resolve(__dirname, "../../python")}}));
    this.worker = null;
  }
  getWorker() { if (!this.config.python) throw coded("BACKEND_NOT_INSTALLED", "Configure a Python backend before analysis."); if (!this.worker) this.worker = this.workerFactory(); return this.worker; }
  async health(backend = "adtof", options = {}) { const id = crypto.randomUUID(); return this.getWorker().health(id, backend, options); }
  async analyze(snapshot, settings, onProgress) {
    const defaults = defaultSettings(); settings = settings || {};
    settings = Object.assign(defaults, settings, {modelOptions: Object.assign(defaults.modelOptions, settings.modelOptions || {}), mappingOptions: Object.assign(defaults.mappingOptions, settings.mappingOptions || {})});
    if (this.active) this.cancel(this.active.requestId);
    const requestId = crypto.randomUUID(); this.active = {requestId, cancelled: false};
    const health = await this.getWorker().health(`${requestId}:health`, settings.backend, settings.modelOptions);
    const metadata = {backendId: health.backendId, modelVersion: health.modelVersion, modelWeightsFingerprint: health.modelWeightsFingerprint || "unknown", preprocessingVersion: health.preprocessingVersion || "1"};
    const sources = await groupRegions(snapshot, metadata);
    const message = {schemaVersion: 1, type: "request", requestId, method: "analyze", params: {backend: settings.backend, modelOptions: settings.modelOptions, mappingOptions: settings.mappingOptions, sources}};
    const result = await this.getWorker().request(message, {timeoutMs: settings.perSourceTimeoutMs ? settings.perSourceTimeoutMs * Math.max(1, sources.length) : 300000 * Math.max(1, sources.length), onProgress});
    if (!this.active || this.active.requestId !== requestId || this.active.cancelled) throw coded("ANALYSIS_CANCELLED", "Analysis was cancelled or superseded.");
    validateAnalysisResult(result, requestId); this.active = null; return result;
  }
  cancel(requestId) { if (!this.active || this.active.requestId !== requestId) return false; this.active.cancelled = true; this.getWorker().cancel(requestId); return true; }
  async clearCache() { await this.cache.clear(); }
  async shutdown() { if (this.worker) await this.worker.shutdown(); }
}

function loadBackendConfig() {
  const candidates = [process.env.SLICE_LABELER_BACKEND_CONFIG, path.join(os.homedir(), ".slice-labeler", "backend-config.json")].filter(Boolean);
  for (const candidate of candidates) { try { const config = JSON.parse(fs.readFileSync(candidate, "utf8")); if (config.python) return config; } catch {} }
  return {python: process.env.SLICE_LABELER_PYTHON || null};
}

function installMaxHandlers() {
  let maxApi; try { maxApi = require("max-api"); } catch { return; }
  const orchestrator = new Orchestrator();
  const emit = (name, payload) => maxApi.outlet(name, JSON.stringify(payload));
  maxApi.addHandler("health", async (backend) => { try { emit("health", await orchestrator.health(backend || "adtof")); } catch (error) { emit("error", publicError(error)); } });
  maxApi.addHandler("analyze", async (dict) => { try { const payload = typeof dict === "string" ? JSON.parse(dict) : dict; emit("result", await orchestrator.analyze(payload.snapshot, payload.settings, (progress) => emit("progress", progress))); } catch (error) { emit("error", publicError(error)); } });
  maxApi.addHandler("cancel", () => { if (orchestrator.active) orchestrator.cancel(orchestrator.active.requestId); });
  maxApi.addHandler("clear_cache", async () => { await orchestrator.clearCache(); emit("cache_cleared", 1); });
  maxApi.addHandler("configure_python", async (python) => { if (orchestrator.worker) await orchestrator.worker.shutdown(); orchestrator.worker = null; orchestrator.config.python = String(python || ""); emit("python_configured", {ok: !!orchestrator.config.python}); });
  maxApi.addHandler("shutdown", async () => { await orchestrator.shutdown(); });
  process.on("SIGTERM", () => orchestrator.shutdown());
}
function publicError(error) { return {code: error.code || "INTERNAL_ERROR", message: error.message || "Unexpected error.", details: error.details}; }

if (require.main === module) installMaxHandlers();
module.exports = {Orchestrator, normalizeSourcePath, fingerprintSource, groupRegions, stripLiveData, defaultSettings, loadBackendConfig, publicError, installMaxHandlers};
