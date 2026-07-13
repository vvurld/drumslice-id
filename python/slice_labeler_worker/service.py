from __future__ import annotations

import math
import re
from numbers import Real
from pathlib import Path
from threading import Event, Lock
from typing import Callable

from .backends import create_backend
from .backends.base import CLASS_NAMES, ClassifierBackend, ModelOutput, validate_model_output
from .cache import ActivationCache
from .errors import WorkerError
from .events import cluster_events, extract_events
from .mapping import Region, map_regions


DEFAULT_THRESHOLDS = {"kick": 0.22, "snare": 0.24, "tom": 0.32, "hihat": 0.22, "cymbal": 0.30}
SOURCE_ID_PATTERN = re.compile(r"[0-9a-f]{64}")


class AnalysisService:
    def __init__(self, cache: ActivationCache | None = None) -> None:
        self.cache = cache or ActivationCache()
        self.backends: dict[tuple[str, str], ClassifierBackend] = {}
        self.backend_lock = Lock()
        self.inference_lock = Lock()

    def backend(self, backend_id: str, options: dict[str, object]) -> ClassifierBackend:
        # Thresholds affect mapping and maxThreads is process-global runtime
        # configuration; neither changes model identity or warrants retaining
        # another loaded model instance.
        key = (backend_id, repr(sorted((key, repr(value)) for key, value in options.items() if key not in {"thresholds", "maxThreads"})))
        with self.backend_lock:
            if key not in self.backends:
                self.backends[key] = create_backend(backend_id, options)
            return self.backends[key]

    def health(self, backend_id: str, options: dict[str, object]) -> dict[str, object]:
        validated_backend = _backend_id(backend_id)
        validated_options = _model_options(validated_backend, options)
        backend = self.backend(validated_backend, validated_options)
        # Model loading and Torch's process-global runtime configuration must
        # not overlap inference in another analysis thread.
        with self.inference_lock:
            _prepare_backend(backend, validated_options)
            return backend.health().as_dict()

    def analyze(
        self,
        params: dict[str, object],
        cancelled: Event,
        progress: Callable[[dict[str, object]], None],
    ) -> tuple[dict[str, object], list[dict[str, object]]]:
        backend_id, model_options, mapping_options, sources = _analysis_params(params)
        _raise_if_cancelled(cancelled)
        backend = self.backend(backend_id, model_options)
        while not self.inference_lock.acquire(timeout=0.05):
            _raise_if_cancelled(cancelled)
        try:
            _raise_if_cancelled(cancelled)
            _prepare_backend(backend, model_options)
            health = backend.health().as_dict()
        finally:
            self.inference_lock.release()
        _raise_if_cancelled(cancelled)
        thresholds = dict(DEFAULT_THRESHOLDS)
        configured = model_options.get("thresholds")
        if isinstance(configured, dict):
            thresholds.update(configured)
        predictions: list[dict[str, object]] = []
        source_errors: list[dict[str, object]] = []
        for index, source in enumerate(sources):
            _raise_if_cancelled(cancelled)
            source_id = source["sourceId"]
            regions_raw = source["regions"]
            progress({"phase": "inference", "sourceId": source_id, "completed": index, "total": len(sources), "message": f"Analyzing source {index + 1} of {len(sources)}"})
            try:
                output = self._output(source_id, Path(source["path"]), backend, model_options, cancelled)
                _raise_if_cancelled(cancelled)
                sample_rate = source["sampleRateFromLive"]
                region_scale = 1.0
                used_companion = output.metadata.get("audioSource") == "companion"
                if used_companion:
                    live_length_frames = source.get("lengthFramesFromLive")
                    if live_length_frames is None:
                        raise WorkerError(
                            "INVALID_SAMPLE_SOURCE",
                            "Live did not expose the full REX source length required for companion alignment.",
                        )
                    live_duration = live_length_frames / sample_rate
                    region_scale = output.source_duration / live_duration
                    if not 0.1 <= region_scale <= 10.0:
                        raise WorkerError(
                            "COMPANION_DURATION_MISMATCH",
                            "The matching companion audio has an incompatible duration.",
                            {"durationRatio": region_scale},
                        )
                    output.metadata["regionTimeScale"] = f"{region_scale:.9g}"
                regions = [
                    Region(
                        str(item["regionId"]),
                        round(item["startFrame"] * region_scale),
                        round(item["endFrame"] * region_scale),
                        sample_rate,
                    )
                    for item in regions_raw
                ]
                events = extract_events(output.activations, output.fps, output.class_names, thresholds)
                _raise_if_cancelled(cancelled)
                clusters = cluster_events(events, float(mapping_options.get("clusterMs", 18)))
                _raise_if_cancelled(cancelled)
                mapped = map_regions(regions, output, clusters, thresholds, mapping_options)
                if used_companion:
                    for prediction in mapped:
                        prediction.setdefault("warnings", []).append("Analyzed the matching companion audio for this REX source.")
                cache_warning = output.metadata.get("cacheWarning")
                if cache_warning:
                    for prediction in mapped:
                        prediction.setdefault("warnings", []).append(cache_warning)
                predictions.extend(mapped)
            except WorkerError as error:
                if error.code == "ANALYSIS_CANCELLED":
                    raise
                source_errors.append({"sourceId": source_id, **error.as_dict()})
                for region in regions_raw:
                    predictions.append({"regionId": region["regionId"], "classes": ["unknown"], "scores": {}, "matchedEvents": [], "decision": "analysis_error", "topScore": 0.0, "warnings": [error.message]})
            progress({"phase": "inference", "sourceId": source_id, "completed": index + 1, "total": len(sources), "message": f"Analyzed source {index + 1} of {len(sources)}"})
        _raise_if_cancelled(cancelled)
        return {"backend": health, "predictions": predictions, "sourceErrors": source_errors}, source_errors

    def _output(
        self,
        source_id: str,
        path: Path,
        backend: ClassifierBackend,
        model_options: dict[str, object],
        cancelled: Event,
    ) -> ModelOutput:
        while not self.inference_lock.acquire(timeout=0.05):
            _raise_if_cancelled(cancelled)
        try:
            _raise_if_cancelled(cancelled)
            _prepare_backend(backend, model_options)
            key_factory = getattr(backend, "cache_key", None)
            cache_key = key_factory(path, source_id) if callable(key_factory) else source_id
            try:
                cached = self.cache.get(cache_key)
            except (OSError, TypeError, ValueError):
                cached = None
            if cached is not None:
                try:
                    output = ModelOutput(
                        cached["fps"],
                        tuple(cached["classNames"]),
                        cached["activations"],
                        cached["sourceDuration"],
                        cached.get("metadata", {}),
                    )
                    return validate_model_output(output, tuple(backend.class_names))
                except (KeyError, TypeError, ValueError, WorkerError):
                    self.cache.delete(cache_key)
            output = validate_model_output(backend.analyze_file(path), tuple(backend.class_names))
            # A cancellation that arrived during an uninterruptible model call
            # must not repopulate a cache the user may be about to clear.
            _raise_if_cancelled(cancelled)
            try:
                self.cache.set(cache_key, {"fps": output.fps, "classNames": list(output.class_names), "activations": output.activations, "sourceDuration": output.source_duration, "metadata": output.metadata})
            except (OSError, TypeError, ValueError):
                output.metadata["cacheWarning"] = "Analysis succeeded, but the local activation cache could not be written."
            return output
        finally:
            self.inference_lock.release()


def _prepare_backend(backend: ClassifierBackend, options: dict[str, object]) -> None:
    prepare = getattr(backend, "prepare_inference", None)
    if callable(prepare):
        prepare(options)


def _analysis_params(
    params: dict[str, object],
) -> tuple[str, dict[str, object], dict[str, object], list[dict[str, object]]]:
    if not isinstance(params, dict):
        raise WorkerError("INVALID_ANALYSIS_REQUEST", "params must be an object.")
    backend_id = _backend_id(params.get("backend", "adtof"))
    model_options = _model_options(backend_id, params.get("modelOptions"))
    mapping_options = _mapping_options(params.get("mappingOptions"))
    raw_sources = params.get("sources")
    if not isinstance(raw_sources, list):
        raise WorkerError("INVALID_ANALYSIS_REQUEST", "sources must be an array.")
    region_ids: set[str] = set()
    sources = [_source(source, region_ids) for source in raw_sources]
    return backend_id, model_options, mapping_options, sources


def _backend_id(value: object) -> str:
    if not isinstance(value, str) or not value:
        raise WorkerError("INVALID_ANALYSIS_REQUEST", "backend must be a non-empty string.")
    return value


def _model_options(backend_id: str, value: object) -> dict[str, object]:
    if not isinstance(value, dict):
        raise WorkerError("INVALID_ANALYSIS_REQUEST", "modelOptions must be an object.")
    allowed = {"device", "fps", "maxThreads", "thresholds", "weightsPath", "mockActivations"}
    unknown = sorted(set(value) - allowed)
    if unknown:
        raise WorkerError("INVALID_ANALYSIS_REQUEST", "modelOptions contains unknown settings.", {"unknown": unknown})
    result = dict(value)
    if "device" in result and not isinstance(result["device"], str):
        raise WorkerError("INVALID_ANALYSIS_REQUEST", "device must be a string.")
    if "fps" in result:
        result["fps"] = _finite_number(result["fps"], "fps", positive=True)
        if backend_id == "adtof" and result["fps"] != 100.0:
            raise WorkerError("UNSUPPORTED_MODEL_FPS", "The pinned ADTOF model supports 100 activation frames per second.")
    if "maxThreads" in result:
        threads = _integer(result["maxThreads"], "maxThreads", minimum=1)
        result["maxThreads"] = min(8, threads)
    if "weightsPath" in result and (not isinstance(result["weightsPath"], str) or not result["weightsPath"]):
        raise WorkerError("INVALID_ANALYSIS_REQUEST", "weightsPath must be a non-empty string.")
    if "thresholds" in result:
        raw_thresholds = result["thresholds"]
        if not isinstance(raw_thresholds, dict):
            raise WorkerError("INVALID_ANALYSIS_REQUEST", "thresholds must be an object.")
        unknown_thresholds = sorted(set(raw_thresholds) - set(CLASS_NAMES))
        if unknown_thresholds:
            raise WorkerError("INVALID_ANALYSIS_REQUEST", "thresholds contains unknown classes.", {"unknown": unknown_thresholds})
        result["thresholds"] = {
            name: _finite_number(threshold, f"thresholds.{name}", positive=True, maximum=1.0)
            for name, threshold in raw_thresholds.items()
        }
    return result


def _mapping_options(value: object) -> dict[str, object]:
    if not isinstance(value, dict):
        raise WorkerError("INVALID_ANALYSIS_REQUEST", "mappingOptions must be an object.")
    allowed = {"preToleranceMs", "postToleranceMs", "clusterMs", "multiLabel", "fallbackEnabled", "fallbackNormalizedFloor"}
    unknown = sorted(set(value) - allowed)
    if unknown:
        raise WorkerError("INVALID_ANALYSIS_REQUEST", "mappingOptions contains unknown settings.", {"unknown": unknown})
    result = dict(value)
    for key in ("preToleranceMs", "postToleranceMs", "clusterMs"):
        if key in result:
            result[key] = _finite_number(result[key], key, minimum=0.0)
    if "fallbackNormalizedFloor" in result:
        result["fallbackNormalizedFloor"] = _finite_number(result["fallbackNormalizedFloor"], "fallbackNormalizedFloor", minimum=0.0)
    for key in ("multiLabel", "fallbackEnabled"):
        if key in result and not isinstance(result[key], bool):
            raise WorkerError("INVALID_ANALYSIS_REQUEST", f"{key} must be a boolean.")
    return result


def _source(value: object, region_ids: set[str]) -> dict[str, object]:
    if not isinstance(value, dict):
        raise WorkerError("INVALID_ANALYSIS_REQUEST", "Every source must be an object.")
    source_id = value.get("sourceId")
    if not isinstance(source_id, str) or SOURCE_ID_PATTERN.fullmatch(source_id) is None:
        raise WorkerError("INVALID_ANALYSIS_REQUEST", "sourceId must be a lowercase SHA-256 digest.")
    path = value.get("path")
    if not isinstance(path, str) or not path or not Path(path).is_absolute():
        raise WorkerError("INVALID_ANALYSIS_REQUEST", "Every source path must be a non-empty absolute path.")
    sample_rate = _integer(value.get("sampleRateFromLive"), "sampleRateFromLive", minimum=1)
    length = value.get("lengthFramesFromLive")
    if length is not None:
        length = _integer(length, "lengthFramesFromLive", minimum=1)
    raw_regions = value.get("regions")
    if not isinstance(raw_regions, list) or not raw_regions:
        raise WorkerError("INVALID_ANALYSIS_REQUEST", "Every source requires at least one region.")
    regions: list[dict[str, object]] = []
    for raw_region in raw_regions:
        if not isinstance(raw_region, dict):
            raise WorkerError("INVALID_ANALYSIS_REQUEST", "Every region must be an object.")
        region_id = raw_region.get("regionId")
        if not isinstance(region_id, str) or not region_id:
            raise WorkerError("INVALID_ANALYSIS_REQUEST", "Every region requires a non-empty regionId.")
        if region_id in region_ids:
            raise WorkerError("INVALID_ANALYSIS_REQUEST", "regionId values must be unique.", {"regionId": region_id})
        region_ids.add(region_id)
        start = _integer(raw_region.get("startFrame"), "startFrame", minimum=0)
        end = _integer(raw_region.get("endFrame"), "endFrame", minimum=1)
        if end <= start or (length is not None and end > length):
            raise WorkerError("INVALID_ANALYSIS_REQUEST", "A region has invalid source-frame bounds.", {"regionId": region_id})
        regions.append({"regionId": region_id, "startFrame": start, "endFrame": end})
    result: dict[str, object] = {
        "sourceId": source_id,
        "path": path,
        "sampleRateFromLive": sample_rate,
        "regions": regions,
    }
    if length is not None:
        result["lengthFramesFromLive"] = length
    return result


def _integer(value: object, label: str, minimum: int) -> int:
    number = _finite_number(value, label)
    if not number.is_integer() or number < minimum:
        raise WorkerError("INVALID_ANALYSIS_REQUEST", f"{label} must be an integer of at least {minimum}.")
    return int(number)


def _finite_number(
    value: object,
    label: str,
    *,
    positive: bool = False,
    minimum: float | None = None,
    maximum: float | None = None,
) -> float:
    if not isinstance(value, Real) or isinstance(value, bool) or not math.isfinite(float(value)):
        raise WorkerError("INVALID_ANALYSIS_REQUEST", f"{label} must be a finite number.")
    number = float(value)
    if positive and number <= 0.0:
        raise WorkerError("INVALID_ANALYSIS_REQUEST", f"{label} must be greater than zero.")
    if minimum is not None and number < minimum:
        raise WorkerError("INVALID_ANALYSIS_REQUEST", f"{label} must be at least {minimum}.")
    if maximum is not None and number > maximum:
        raise WorkerError("INVALID_ANALYSIS_REQUEST", f"{label} must be at most {maximum}.")
    return number


def _raise_if_cancelled(cancelled: Event) -> None:
    if cancelled.is_set():
        raise WorkerError("ANALYSIS_CANCELLED", "Analysis was cancelled.")
