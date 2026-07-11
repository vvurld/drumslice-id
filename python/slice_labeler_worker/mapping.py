from __future__ import annotations

from dataclasses import dataclass

from .backends.base import CLASS_NAMES, ModelOutput
from .events import EventCluster


@dataclass(frozen=True)
class Region:
    region_id: str
    start_frame: int
    end_frame: int
    sample_rate: int

    @property
    def start_seconds(self) -> float:
        return self.start_frame / self.sample_rate

    @property
    def end_seconds(self) -> float:
        return self.end_frame / self.sample_rate


def assign_clusters(
    regions: list[Region],
    clusters: list[EventCluster],
    pre_tolerance_ms: float = 35.0,
    post_tolerance_ms: float = 90.0,
) -> dict[str, list[EventCluster]]:
    assignments: dict[str, list[EventCluster]] = {region.region_id: [] for region in regions}
    pre = max(0.0, pre_tolerance_ms) / 1000.0
    post = max(0.0, post_tolerance_ms) / 1000.0
    ordered_regions = sorted(regions, key=lambda region: region.start_seconds)
    for cluster in clusters:
        eligible = [region for region in ordered_regions if cluster.time_seconds >= region.start_seconds - pre and cluster.time_seconds <= region.start_seconds + post and cluster.time_seconds < region.end_seconds]
        if not eligible:
            continue
        chosen = min(eligible, key=lambda region: (abs(cluster.time_seconds - region.start_seconds), region.start_seconds))
        assignments[chosen.region_id].append(cluster)
    return assignments


def activation_fallback(
    region: Region,
    output: ModelOutput,
    thresholds: dict[str, float],
    floor: float = 0.70,
    multi_label: bool = True,
) -> tuple[list[str], dict[str, float]]:
    start = max(0.0, region.start_seconds - 0.020)
    # Onset models smear evidence slightly before a transient. Stop the fallback
    # window 20 ms before the region boundary so the next slice's attack cannot
    # be pulled backward into a short/quiet slice.
    end = min(region.end_seconds - 0.020, region.start_seconds + 0.100, output.source_duration)
    first = max(0, int(start * output.fps))
    last = min(len(output.activations), int(end * output.fps) + 1)
    if last <= first:
        return ["unknown"], {}
    raw = {name: max(float(output.activations[frame][index]) for frame in range(first, last)) for index, name in enumerate(output.class_names)}
    return _select_classes(raw, thresholds, floor, multi_label), raw


def _select_classes(
    scores: dict[str, float],
    thresholds: dict[str, float],
    floor: float,
    multi_label: bool,
) -> list[str]:
    if not scores:
        return ["unknown"]
    normalized = {name: float(score) / max(float(thresholds[name]), 1e-12) for name, score in scores.items()}
    ranked = sorted(normalized, key=lambda name: (-normalized[name], CLASS_NAMES.index(name)))
    top = ranked[0]
    if normalized[top] < floor:
        return ["unknown"]
    classes = [top]
    if multi_label:
        classes.extend(name for name in ranked[1:] if normalized[name] >= floor and normalized[top] - normalized[name] <= 0.15)
    return classes


def map_regions(
    regions: list[Region],
    output: ModelOutput,
    clusters: list[EventCluster],
    thresholds: dict[str, float],
    options: dict[str, object],
) -> list[dict[str, object]]:
    assigned = assign_clusters(regions, clusters, float(options.get("preToleranceMs", 35)), float(options.get("postToleranceMs", 90)))
    predictions: list[dict[str, object]] = []
    multi_label = bool(options.get("multiLabel", True))
    for region in regions:
        matches = sorted(assigned[region.region_id], key=lambda event: (abs(event.time_seconds - region.start_seconds), event.time_seconds))
        warnings: list[str] = []
        if matches:
            chosen = matches[0]
            scores = dict(chosen.scores)
            classes = _select_classes(scores, thresholds, 0.70, multi_label)
            decision = "matched_event"
            if len(matches) > 1:
                warnings.append("Additional event clusters occurred later in this region.")
        elif bool(options.get("fallbackEnabled", True)):
            classes, scores = activation_fallback(region, output, thresholds, float(options.get("fallbackNormalizedFloor", 0.70)), multi_label)
            decision = "activation_fallback" if classes != ["unknown"] else "unknown"
        else:
            classes, scores, decision = ["unknown"], {}, "unknown"
        top_score = max(scores.values(), default=0.0)
        predictions.append({
            "regionId": region.region_id,
            "classes": classes,
            "scores": scores,
            "matchedEvents": [{"timeSeconds": item.time_seconds, "classes": list(item.scores)} for item in matches],
            "decision": decision,
            "topScore": top_score,
            "warnings": warnings,
        })
    return predictions
