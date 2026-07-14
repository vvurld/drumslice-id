from __future__ import annotations

import statistics
from dataclasses import dataclass


@dataclass(frozen=True)
class Event:
    time_seconds: float
    class_name: str
    score: float


@dataclass(frozen=True)
class EventCluster:
    time_seconds: float
    scores: dict[str, float]

    @property
    def classes(self) -> list[str]:
        return list(self.scores)


def extract_events(
    activations: list[list[float]],
    fps: float,
    class_names: tuple[str, ...],
    thresholds: dict[str, float],
) -> list[Event]:
    """Convert frame activations into class-labelled onset candidates.

    This project-owned picker is intentionally independent of the optional
    ADTOF package.  It treats a peak as a local activation whose prominence
    above the surrounding median reaches the user threshold, then applies a
    short refractory interval.  Keeping post-processing here makes the
    backend replaceable and avoids importing or redistributing third-party
    peak-picker code.
    """

    if fps <= 0 or not activations:
        return []
    events: list[Event] = []
    context_before = max(1, int(round(0.100 * fps)))
    context_after = max(1, int(round(0.030 * fps)))
    peak_radius = max(1, int(round(0.020 * fps)))
    refractory_frames = max(1, int(round(0.020 * fps)))
    for class_index, class_name in enumerate(class_names):
        threshold = float(thresholds[class_name])
        raw = [float(frame[class_index]) for frame in activations]
        prominence = _local_prominence(raw, context_before, context_after)
        candidates: list[int] = []
        for index, score in enumerate(prominence):
            left = max(0, index - peak_radius)
            right = min(len(prominence), index + peak_radius + 1)
            neighborhood = prominence[left:right]
            if score >= threshold and score == max(neighborhood):
                candidates.append(index)
        for chosen in _suppress_nearby(candidates, prominence, refractory_frames):
            events.append(Event(chosen / fps, class_name, raw[chosen]))
    return sorted(events, key=lambda event: (event.time_seconds, event.class_name))


def _local_prominence(values: list[float], before: int, after: int) -> list[float]:
    result: list[float] = []
    for index, value in enumerate(values):
        start = max(0, index - before)
        stop = min(len(values), index + after + 1)
        baseline = statistics.median(values[start:stop])
        result.append(max(0.0, value - baseline))
    return result


def _suppress_nearby(candidates: list[int], scores: list[float], radius: int) -> list[int]:
    selected: list[int] = []
    for candidate in sorted(candidates, key=lambda index: (-scores[index], index)):
        if all(abs(candidate - accepted) > radius for accepted in selected):
            selected.append(candidate)
    return sorted(selected)


def cluster_events(events: list[Event], cluster_ms: float = 18.0) -> list[EventCluster]:
    if not events:
        return []
    maximum_gap = max(0.0, cluster_ms) / 1000.0
    groups: list[list[Event]] = [[event] for event in sorted(events, key=lambda item: item.time_seconds)[:1]]
    for event in sorted(events, key=lambda item: item.time_seconds)[1:]:
        if event.time_seconds - groups[-1][-1].time_seconds <= maximum_gap:
            groups[-1].append(event)
        else:
            groups.append([event])
    result: list[EventCluster] = []
    for group in groups:
        scores: dict[str, float] = {}
        for event in group:
            scores[event.class_name] = max(scores.get(event.class_name, 0.0), event.score)
        weight = sum(max(event.score, 0.0) for event in group)
        time = (sum(event.time_seconds * max(event.score, 0.0) for event in group) / weight) if weight else group[0].time_seconds
        result.append(EventCluster(time, scores))
    return result
