"use strict";

const {coded} = require("./protocol");

const CLASSES = new Set(["kick", "snare", "tom", "hihat", "cymbal", "unknown"]);
const DECISIONS = new Set(["matched_event", "activation_fallback", "unknown", "analysis_error"]);
const BACKEND_CLASSES = ["kick", "snare", "tom", "hihat", "cymbal"];

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw coded("INVALID_PAYLOAD", `${label} must be an object.`);
  return value;
}

function array(value, label) {
  if (!Array.isArray(value)) throw coded("INVALID_PAYLOAD", `${label} must be an array.`);
  return value;
}

function nonempty(value, label) {
  if (typeof value !== "string" || !value) throw coded("INVALID_PAYLOAD", `${label} must be a non-empty string.`);
  return value;
}

function string(value, label) {
  if (typeof value !== "string") throw coded("INVALID_PAYLOAD", `${label} must be a string.`);
  return value;
}

function integer(value, label, min, max) {
  if (!Number.isInteger(value) || (min != null && value < min) || (max != null && value > max)) {
    throw coded("INVALID_PAYLOAD", `${label} is out of range.`);
  }
  return value;
}

function finiteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw coded("INVALID_PAYLOAD", `${label} must be a finite number.`);
  return value;
}

function score(value, label) {
  finiteNumber(value, label);
  if (value < 0 || value > 1) throw coded("INVALID_ANALYSIS_RESULT", `${label} must be between 0 and 1.`);
  return value;
}

function validateBackendMetadata(backend, expected) {
  object(backend, "result.backend");
  if (backend.ok !== true) throw coded("INVALID_ANALYSIS_RESULT", "Analysis result backend is not healthy.");
  nonempty(backend.backendId, "result.backend.backendId");
  nonempty(backend.modelVersion, "result.backend.modelVersion");
  nonempty(backend.modelWeightsFingerprint, "result.backend.modelWeightsFingerprint");
  nonempty(backend.preprocessingVersion, "result.backend.preprocessingVersion");
  array(backend.classNames, "result.backend.classNames").forEach((className, index) => nonempty(className, `result.backend.classNames[${index}]`));
  if (backend.classNames.length !== BACKEND_CLASSES.length || backend.classNames.some((className, index) => className !== BACKEND_CLASSES[index])) {
    throw coded("BACKEND_CLASS_MAPPING_CHANGED", "The analysis result reported an unsupported class order.", {expected: BACKEND_CLASSES, actual: backend.classNames});
  }
  if (backend.message != null) string(backend.message, "result.backend.message");
  if (expected) {
    for (const key of ["backendId", "modelVersion", "modelWeightsFingerprint", "preprocessingVersion"]) {
      if (backend[key] !== expected[key]) throw coded("BACKEND_IDENTITY_CHANGED", `Analysis result backend ${key} changed after the health check.`);
    }
  }
  return backend;
}

function validateLiveRef(value, label) {
  object(value, label);
  string(value.displayName, `${label}.displayName`);
  string(value.sessionPath, `${label}.sessionPath`);
  if (value.sessionId != null) integer(value.sessionId, `${label}.sessionId`, 1);
}

function validateRackSnapshot(snapshot) {
  object(snapshot, "snapshot");
  if (snapshot.schemaVersion !== 1) throw coded("SCHEMA_VERSION_MISMATCH", "Rack snapshot schemaVersion must be 1.");
  nonempty(snapshot.jobId, "jobId");
  nonempty(snapshot.createdAt, "createdAt");
  if (!Number.isFinite(Date.parse(snapshot.createdAt))) throw coded("INVALID_PAYLOAD", "createdAt must be an ISO-8601 date-time.");
  validateLiveRef(snapshot.track, "track");
  validateLiveRef(snapshot.rack, "rack");
  array(snapshot.regions, "regions");
  array(snapshot.skippedPads, "skippedPads");

  const ids = new Set();
  snapshot.regions.forEach((region, index) => {
    const label = `regions[${index}]`;
    object(region, label);
    nonempty(region.regionId, `${label}.regionId`);
    if (ids.has(region.regionId)) throw coded("DUPLICATE_REGION_ID", `Duplicate regionId ${region.regionId}.`);
    ids.add(region.regionId);
    integer(region.padIndex, `${label}.padIndex`, 0, 127);
    integer(region.padNote, `${label}.padNote`, 0, 127);
    string(region.padDisplayName, `${label}.padDisplayName`);
    integer(region.chainSessionId, `${label}.chainSessionId`, 1);
    string(region.chainSessionPath, `${label}.chainSessionPath`);
    string(region.originalChainName, `${label}.originalChainName`);
    string(region.simplerSessionPath, `${label}.simplerSessionPath`);
    integer(region.playbackMode, `${label}.playbackMode`, 0, 2);
    array(region.warnings, `${label}.warnings`).forEach((warning, warningIndex) => string(warning, `${label}.warnings[${warningIndex}]`));

    object(region.source, `${label}.source`);
    nonempty(region.source.path, `${label}.source.path`);
    integer(region.source.sampleRate, `${label}.source.sampleRate`, 1);
    integer(region.source.lengthFrames, `${label}.source.lengthFrames`, 1);
    integer(region.source.startFrame, `${label}.source.startFrame`, 0);
    integer(region.source.endFrame, `${label}.source.endFrame`, 1);
    if (region.source.endFrame <= region.source.startFrame) throw coded("INVALID_REGION", `Region ${region.regionId} has an empty interval.`);
    if (region.source.endFrame > region.source.lengthFrames) throw coded("INVALID_REGION", `Region ${region.regionId} extends beyond the source length.`);
  });

  snapshot.skippedPads.forEach((skipped, index) => {
    const label = `skippedPads[${index}]`;
    object(skipped, label);
    integer(skipped.padNote, `${label}.padNote`, 0, 127);
    nonempty(skipped.reasonCode, `${label}.reasonCode`);
    nonempty(skipped.message, `${label}.message`);
  });
  return snapshot;
}

function validateAnalysisResult(result, expectedRequestId, expectedRegionIds, expectedBackend) {
  object(result, "result");
  if (result.schemaVersion !== 1 || result.type !== "result") throw coded("INVALID_ANALYSIS_RESULT", "Invalid analysis result envelope.");
  if (result.requestId !== expectedRequestId) throw coded("STALE_RESULT", "Analysis result belongs to another request.");
  validateBackendMetadata(result.backend, expectedBackend);
  array(result.predictions, "result.predictions");
  array(result.sourceErrors, "result.sourceErrors");

  const seen = new Set();
  result.predictions.forEach((prediction, index) => {
    const label = `predictions[${index}]`;
    object(prediction, label);
    nonempty(prediction.regionId, `${label}.regionId`);
    if (seen.has(prediction.regionId)) throw coded("DUPLICATE_PREDICTION_ID", `Duplicate prediction for ${prediction.regionId}.`);
    seen.add(prediction.regionId);
    array(prediction.classes, `${label}.classes`);
    if (!prediction.classes.length || prediction.classes.some((className) => !CLASSES.has(className))) {
      throw coded("INVALID_ANALYSIS_RESULT", "Prediction contains an unknown or empty class list.");
    }
    if (new Set(prediction.classes).size !== prediction.classes.length) {
      throw coded("INVALID_ANALYSIS_RESULT", "Prediction classes must not contain duplicates.");
    }
    if (prediction.classes.includes("unknown") && prediction.classes.length !== 1) {
      throw coded("INVALID_ANALYSIS_RESULT", "unknown must be the prediction's only class.");
    }
    object(prediction.scores, `${label}.scores`);
    for (const [className, value] of Object.entries(prediction.scores)) {
      if (!CLASSES.has(className) || className === "unknown") throw coded("INVALID_ANALYSIS_RESULT", `Prediction score has unknown class ${className}.`);
      score(value, `${label}.scores.${className}`);
    }
    array(prediction.matchedEvents, `${label}.matchedEvents`).forEach((event, eventIndex) => {
      const eventLabel = `${label}.matchedEvents[${eventIndex}]`;
      object(event, eventLabel);
      finiteNumber(event.timeSeconds, `${eventLabel}.timeSeconds`);
      if (event.timeSeconds < 0) throw coded("INVALID_ANALYSIS_RESULT", `${eventLabel}.timeSeconds must not be negative.`);
      array(event.classes, `${eventLabel}.classes`);
      if (!event.classes.length || event.classes.some((className) => !BACKEND_CLASSES.includes(className))) {
        throw coded("INVALID_ANALYSIS_RESULT", `${eventLabel}.classes contains an unknown or empty class list.`);
      }
      if (new Set(event.classes).size !== event.classes.length) throw coded("INVALID_ANALYSIS_RESULT", `${eventLabel}.classes contains a duplicate.`);
    });
    if (!DECISIONS.has(prediction.decision)) throw coded("INVALID_ANALYSIS_RESULT", "Prediction has an invalid decision.");
    score(prediction.topScore, `${label}.topScore`);
    const maximumScore = Math.max(0, ...Object.values(prediction.scores));
    if (Math.abs(prediction.topScore - maximumScore) > 1e-12) throw coded("INVALID_ANALYSIS_RESULT", `${label}.topScore does not match its scores.`);
    array(prediction.warnings, `${label}.warnings`).forEach((warning, warningIndex) => string(warning, `${label}.warnings[${warningIndex}]`));
  });

  result.sourceErrors.forEach((sourceError, index) => {
    const label = `sourceErrors[${index}]`;
    object(sourceError, label);
    nonempty(sourceError.sourceId, `${label}.sourceId`);
    nonempty(sourceError.code, `${label}.code`);
    nonempty(sourceError.message, `${label}.message`);
    if (sourceError.details != null) object(sourceError.details, `${label}.details`);
  });

  if (expectedRegionIds != null) {
    const expected = new Set(expectedRegionIds);
    if (expected.size !== expectedRegionIds.length) throw coded("DUPLICATE_REGION_ID", "Expected region IDs contain a duplicate.");
    for (const regionId of seen) {
      if (!expected.has(regionId)) throw coded("UNEXPECTED_PREDICTION_ID", `Worker returned unknown regionId ${regionId}.`);
    }
    for (const regionId of expected) {
      if (!seen.has(regionId)) throw coded("MISSING_PREDICTION", `Worker omitted regionId ${regionId}.`);
    }
  }
  return result;
}

function validateHealthResponse(health) {
  object(health, "health");
  if (health.schemaVersion !== 1 || health.type !== "health") throw coded("INVALID_HEALTH_RESPONSE", "Invalid backend health envelope.");
  if (health.ok !== true) throw coded("BACKEND_UNHEALTHY", health.message || "The backend is not ready.");
  nonempty(health.backendId, "health.backendId");
  nonempty(health.modelVersion, "health.modelVersion");
  nonempty(health.modelWeightsFingerprint, "health.modelWeightsFingerprint");
  nonempty(health.preprocessingVersion, "health.preprocessingVersion");
  array(health.classNames, "health.classNames").forEach((className, index) => nonempty(className, `health.classNames[${index}]`));
  if (health.classNames.length !== BACKEND_CLASSES.length || health.classNames.some((className, index) => className !== BACKEND_CLASSES[index])) {
    throw coded("BACKEND_CLASS_MAPPING_CHANGED", "The backend reported an unsupported class order.", {expected: BACKEND_CLASSES, actual: health.classNames});
  }
  return health;
}

module.exports = {validateRackSnapshot, validateAnalysisResult, validateHealthResponse, validateBackendMetadata};
