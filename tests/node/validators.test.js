"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {validateRackSnapshot, validateAnalysisResult, validateHealthResponse} = require("../../max/node/validators");

function snapshot() {
  return {
    schemaVersion: 1,
    jobId: "job",
    createdAt: "2026-07-12T12:00:00.000Z",
    track: {displayName: "Track", sessionPath: "live_set tracks 0"},
    rack: {displayName: "Rack", sessionId: 10, sessionPath: "live_set tracks 0 devices 1"},
    regions: [{
      regionId: "region",
      padIndex: 0,
      padNote: 36,
      padDisplayName: "Slice 1",
      chainSessionId: 11,
      chainSessionPath: "live_set tracks 0 devices 1 drum_pads 0 chains 0",
      originalChainName: "Slice 1",
      simplerSessionPath: "live_set tracks 0 devices 1 drum_pads 0 chains 0 devices 0",
      playbackMode: 1,
      source: {path: "/tmp/source.wav", sampleRate: 44100, lengthFrames: 100, startFrame: 0, endFrame: 100},
      warnings: [],
    }],
    skippedPads: [],
  };
}

function prediction(regionId = "region") {
  return {
    regionId,
    classes: ["kick"],
    scores: {kick: 0.8},
    matchedEvents: [],
    decision: "matched_event",
    topScore: 0.8,
    warnings: [],
  };
}

const backend = {
  ok: true,
  backendId: "adtof",
  modelVersion: "1",
  modelWeightsFingerprint: "weights",
  preprocessingVersion: "1",
  classNames: ["kick", "snare", "tom", "hihat", "cymbal"],
  message: "Ready",
};

function result(predictions = [prediction()]) {
  return {schemaVersion: 1, type: "result", requestId: "request", backend: Object.assign({}, backend), predictions, sourceErrors: []};
}

test("rack validation enforces the normative fields and source bounds", () => {
  assert.equal(validateRackSnapshot(snapshot()).jobId, "job");
  const missing = snapshot(); delete missing.regions[0].chainSessionId;
  assert.throws(() => validateRackSnapshot(missing), {code: "INVALID_PAYLOAD"});
  const outOfBounds = snapshot(); outOfBounds.regions[0].source.endFrame = 101;
  assert.throws(() => validateRackSnapshot(outOfBounds), {code: "INVALID_REGION"});
});

test("analysis validation requires complete records with exact, unique region IDs", () => {
  assert.equal(validateAnalysisResult(result(), "request", ["region"]).predictions.length, 1);
  assert.throws(() => validateAnalysisResult(result([]), "request", ["region"]), {code: "MISSING_PREDICTION"});
  assert.throws(() => validateAnalysisResult(result([prediction("other")]), "request", ["region"]), {code: "UNEXPECTED_PREDICTION_ID"});
  assert.throws(() => validateAnalysisResult(result([prediction(), prediction()]), "request", ["region"]), {code: "DUPLICATE_PREDICTION_ID"});
  const incomplete = prediction(); delete incomplete.topScore;
  assert.throws(() => validateAnalysisResult(result([incomplete]), "request", ["region"]), {code: "INVALID_PAYLOAD"});
  const outOfRange = prediction(); outOfRange.scores.kick = 1.1;
  assert.throws(() => validateAnalysisResult(result([outOfRange]), "request", ["region"]), {code: "INVALID_ANALYSIS_RESULT"});
  const inconsistentTop = prediction(); inconsistentTop.topScore = 0.1;
  assert.throws(() => validateAnalysisResult(result([inconsistentTop]), "request", ["region"]), {code: "INVALID_ANALYSIS_RESULT"});
});

test("unknown is exclusive and health metadata is required", () => {
  const mixed = prediction(); mixed.classes = ["unknown", "kick"];
  assert.throws(() => validateAnalysisResult(result([mixed]), "request", ["region"]), {code: "INVALID_ANALYSIS_RESULT"});
  const health = {schemaVersion: 1, type: "health", requestId: "h", ok: true, backendId: "adtof", modelVersion: "1", modelWeightsFingerprint: "abc", preprocessingVersion: "1", classNames: ["kick", "snare", "tom", "hihat", "cymbal"]};
  assert.equal(validateHealthResponse(health).backendId, "adtof");
  const reordered = Object.assign({}, health, {classNames: ["snare", "kick", "tom", "hihat", "cymbal"]});
  assert.throws(() => validateHealthResponse(reordered), {code: "BACKEND_CLASS_MAPPING_CHANGED"});
  delete health.modelWeightsFingerprint;
  assert.throws(() => validateHealthResponse(health), {code: "INVALID_PAYLOAD"});
});

test("analysis backend metadata is complete and remains identical to the preflight health result", () => {
  const expected = Object.assign({}, backend);
  assert.equal(validateAnalysisResult(result(), "request", ["region"], expected).backend.backendId, "adtof");
  const missing = result(); delete missing.backend.modelWeightsFingerprint;
  assert.throws(() => validateAnalysisResult(missing, "request", ["region"], expected), {code: "INVALID_PAYLOAD"});
  const changed = result(); changed.backend.modelVersion = "other";
  assert.throws(() => validateAnalysisResult(changed, "request", ["region"], expected), {code: "BACKEND_IDENTITY_CHANGED"});
});

test("matched event and source error records are validated", () => {
  const valid = prediction(); valid.matchedEvents = [{timeSeconds: 0.01, classes: ["kick", "hihat"]}];
  const withSourceError = result([valid]);
  withSourceError.sourceErrors = [{sourceId: "source", code: "DECODE_FAILED", message: "Could not decode."}];
  assert.equal(validateAnalysisResult(withSourceError, "request", ["region"]).sourceErrors.length, 1);
  valid.matchedEvents[0].timeSeconds = -0.1;
  assert.throws(() => validateAnalysisResult(result([valid]), "request", ["region"]), {code: "INVALID_ANALYSIS_RESULT"});
  const malformedError = result(); malformedError.sourceErrors = [{sourceId: "source", message: "missing code"}];
  assert.throws(() => validateAnalysisResult(malformedError, "request", ["region"]), {code: "INVALID_PAYLOAD"});
});

test("the normative result schema requires the metadata enforced at runtime", () => {
  const schema = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../max/schemas/analysis_result.schema.json"), "utf8"));
  assert.deepEqual(schema.$defs.backend.required, ["ok", "backendId", "modelVersion", "classNames", "modelWeightsFingerprint", "preprocessingVersion"]);
  assert.equal(schema.properties.backend.$ref, "#/$defs/backend");
  assert.equal(schema.properties.sourceErrors.items.$ref, "#/$defs/sourceError");
  assert.equal(schema.$defs.prediction.properties.classes.uniqueItems, true);
});
