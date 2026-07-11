from __future__ import annotations

from pathlib import Path
from threading import Event
from typing import Callable

from .backends import create_backend
from .backends.base import ClassifierBackend, ModelOutput
from .cache import ActivationCache
from .errors import WorkerError
from .events import cluster_events, extract_events
from .mapping import Region, map_regions


DEFAULT_THRESHOLDS = {"kick": 0.22, "snare": 0.24, "tom": 0.32, "hihat": 0.22, "cymbal": 0.30}


class AnalysisService:
    def __init__(self, cache: ActivationCache | None = None) -> None:
        self.cache = cache or ActivationCache()
        self.backends: dict[tuple[str, str], ClassifierBackend] = {}

    def backend(self, backend_id: str, options: dict[str, object]) -> ClassifierBackend:
        key = (backend_id, repr(sorted((key, repr(value)) for key, value in options.items() if key != "thresholds")))
        if key not in self.backends:
            self.backends[key] = create_backend(backend_id, options)
        return self.backends[key]

    def health(self, backend_id: str, options: dict[str, object]) -> dict[str, object]:
        return self.backend(backend_id, options).health().as_dict()

    def analyze(
        self,
        params: dict[str, object],
        cancelled: Event,
        progress: Callable[[dict[str, object]], None],
    ) -> tuple[dict[str, object], list[dict[str, object]]]:
        backend_id = str(params.get("backend", "adtof"))
        model_options = _object(params.get("modelOptions"), "modelOptions")
        mapping_options = _object(params.get("mappingOptions"), "mappingOptions")
        sources = params.get("sources")
        if not isinstance(sources, list):
            raise WorkerError("INVALID_ANALYSIS_REQUEST", "sources must be an array.")
        backend = self.backend(backend_id, model_options)
        health = backend.health().as_dict()
        thresholds = dict(DEFAULT_THRESHOLDS)
        configured = model_options.get("thresholds")
        if isinstance(configured, dict):
            thresholds.update({str(key): float(value) for key, value in configured.items()})
        predictions: list[dict[str, object]] = []
        source_errors: list[dict[str, object]] = []
        for index, raw_source in enumerate(sources):
            if cancelled.is_set():
                raise WorkerError("ANALYSIS_CANCELLED", "Analysis was cancelled.")
            source = _object(raw_source, "source")
            source_id = str(source.get("sourceId", ""))
            regions_raw = source.get("regions")
            if not source_id or not isinstance(regions_raw, list):
                raise WorkerError("INVALID_ANALYSIS_REQUEST", "A source is missing sourceId or regions.")
            progress({"phase": "inference", "sourceId": source_id, "completed": index, "total": len(sources), "message": f"Analyzing source {index + 1} of {len(sources)}"})
            try:
                output = self._output(source_id, Path(str(source.get("path", ""))), backend)
                sample_rate = int(source["sampleRateFromLive"])
                region_scale = 1.0
                if output.metadata.get("audioSource") == "companion":
                    live_end_frame = max((int(item.get("endFrame", 0)) for item in regions_raw if isinstance(item, dict)), default=0)
                    live_duration = live_end_frame / sample_rate if sample_rate > 0 else 0.0
                    if live_duration <= 0.0:
                        raise WorkerError("INVALID_SAMPLE_REGION", "Live did not expose a usable REX source duration.")
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
                        round(int(item["startFrame"]) * region_scale),
                        round(int(item["endFrame"]) * region_scale),
                        sample_rate,
                    )
                    for item in regions_raw
                    if isinstance(item, dict)
                ]
                events = extract_events(output.activations, output.fps, output.class_names, thresholds)
                clusters = cluster_events(events, float(mapping_options.get("clusterMs", 18)))
                mapped = map_regions(regions, output, clusters, thresholds, mapping_options)
                if region_scale != 1.0:
                    for prediction in mapped:
                        prediction.setdefault("warnings", []).append("Analyzed the matching companion audio for this REX source.")
                predictions.extend(mapped)
            except WorkerError as error:
                source_errors.append({"sourceId": source_id, **error.as_dict()})
                for region in regions_raw:
                    if isinstance(region, dict):
                        predictions.append({"regionId": str(region.get("regionId", "")), "classes": ["unknown"], "scores": {}, "matchedEvents": [], "decision": "analysis_error", "topScore": 0.0, "warnings": [error.message]})
            progress({"phase": "inference", "sourceId": source_id, "completed": index + 1, "total": len(sources), "message": f"Analyzed source {index + 1} of {len(sources)}"})
        return {"backend": health, "predictions": predictions, "sourceErrors": source_errors}, source_errors

    def _output(self, source_id: str, path: Path, backend: ClassifierBackend) -> ModelOutput:
        # REX/RX2 analysis may resolve to a companion WAV/AIFF whose metadata is
        # not represented by Live's source fingerprint, so never reuse a stale
        # activation cache entry for those container formats.
        cacheable = path.suffix.lower() not in (".rex", ".rx2")
        cached = self.cache.get(source_id) if cacheable else None
        if cached:
            return ModelOutput(float(cached["fps"]), tuple(cached["classNames"]), cached["activations"], float(cached["sourceDuration"]), dict(cached.get("metadata", {})))
        output = backend.analyze_file(path)
        if cacheable:
            self.cache.set(source_id, {"fps": output.fps, "classNames": list(output.class_names), "activations": output.activations, "sourceDuration": output.source_duration, "metadata": output.metadata})
        return output


def _object(value: object, label: str) -> dict[str, object]:
    if not isinstance(value, dict):
        raise WorkerError("INVALID_ANALYSIS_REQUEST", f"{label} must be an object.")
    return value
