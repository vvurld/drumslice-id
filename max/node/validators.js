"use strict";

const {coded} = require("./protocol");
const CLASSES = new Set(["kick", "snare", "tom", "hihat", "cymbal", "unknown"]);

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw coded("INVALID_PAYLOAD", `${label} must be an object.`);
}
function nonempty(value, label) { if (typeof value !== "string" || !value) throw coded("INVALID_PAYLOAD", `${label} must be a non-empty string.`); }
function integer(value, label, min, max) { if (!Number.isInteger(value) || value < min || (max != null && value > max)) throw coded("INVALID_PAYLOAD", `${label} is out of range.`); }

function validateRackSnapshot(snapshot) {
  object(snapshot, "snapshot");
  if (snapshot.schemaVersion !== 1) throw coded("SCHEMA_VERSION_MISMATCH", "Rack snapshot schemaVersion must be 1.");
  nonempty(snapshot.jobId, "jobId"); object(snapshot.track, "track"); object(snapshot.rack, "rack");
  if (!Array.isArray(snapshot.regions) || !Array.isArray(snapshot.skippedPads)) throw coded("INVALID_PAYLOAD", "regions and skippedPads must be arrays.");
  const ids = new Set();
  snapshot.regions.forEach((region, index) => {
    object(region, `regions[${index}]`); nonempty(region.regionId, "regionId");
    if (ids.has(region.regionId)) throw coded("DUPLICATE_REGION_ID", `Duplicate regionId ${region.regionId}.`); ids.add(region.regionId);
    integer(region.padNote, "padNote", 0, 127); object(region.source, "source"); nonempty(region.source.path, "source.path");
    integer(region.source.sampleRate, "sampleRate", 1); integer(region.source.lengthFrames, "lengthFrames", 1);
    integer(region.source.startFrame, "startFrame", 0); integer(region.source.endFrame, "endFrame", 1);
    if (region.source.endFrame <= region.source.startFrame) throw coded("INVALID_REGION", `Region ${region.regionId} has an empty interval.`);
  });
  return snapshot;
}

function validateAnalysisResult(result, expectedRequestId) {
  object(result, "result");
  if (result.schemaVersion !== 1 || result.type !== "result") throw coded("INVALID_ANALYSIS_RESULT", "Invalid analysis result envelope.");
  if (result.requestId !== expectedRequestId) throw coded("STALE_RESULT", "Analysis result belongs to another request.");
  if (!Array.isArray(result.predictions)) throw coded("INVALID_ANALYSIS_RESULT", "predictions must be an array.");
  result.predictions.forEach((prediction) => {
    nonempty(prediction.regionId, "prediction.regionId");
    if (!Array.isArray(prediction.classes) || prediction.classes.some((c) => !CLASSES.has(c))) throw coded("INVALID_ANALYSIS_RESULT", "Prediction contains an unknown class.");
    if (!["matched_event", "activation_fallback", "unknown", "analysis_error"].includes(prediction.decision)) throw coded("INVALID_ANALYSIS_RESULT", "Prediction has an invalid decision.");
  });
  return result;
}

module.exports = {validateRackSnapshot, validateAnalysisResult};
