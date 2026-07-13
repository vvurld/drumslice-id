from __future__ import annotations

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
    if fps <= 0 or not activations:
        return []
    events: list[Event] = []
    pre_average_frames = max(0, int(round(0.100 * fps)))
    post_average_frames = max(0, int(round(0.010 * fps)))
    pre_maximum_frames = max(0, int(round(0.020 * fps)))
    post_maximum_frames = max(0, int(round(0.010 * fps)))
    combine_frames = max(1, int(round(0.020 * fps)))
    for class_index, class_name in enumerate(class_names):
        threshold = float(thresholds[class_name])
        raw = [float(frame[class_index]) for frame in activations]
        processed = _subtract_moving_average(raw, pre_average_frames, post_average_frames)
        candidates: list[int] = []
        for index, score in enumerate(processed):
            left = max(0, index - pre_maximum_frames)
            right = min(len(processed), index + post_maximum_frames + 1)
            if score >= threshold and score >= max(processed[left:right]):
                candidates.append(index)
        for group in _combine_candidates(candidates, combine_frames):
            chosen = max(group, key=lambda index: processed[index])
            events.append(Event(chosen / fps, class_name, raw[chosen]))
    return sorted(events, key=lambda event: (event.time_seconds, event.class_name))


def _subtract_moving_average(values: list[float], left: int, right: int) -> list[float]:
    """Match the pinned ADTOF PeakPicker's edge-padded moving average."""

    if left <= 0 and right <= 0:
        return list(values)
    width = left + 1 + right
    result: list[float] = []
    for index, value in enumerate(values):
        total = 0.0
        for offset in range(-left, right + 1):
            source_index = min(len(values) - 1, max(0, index + offset))
            total += values[source_index]
        result.append(max(0.0, value - total / width))
    return result


def _combine_candidates(candidates: list[int], maximum_gap: int) -> list[list[int]]:
    if not candidates:
        return []
    groups: list[list[int]] = [[candidates[0]]]
    for candidate in candidates[1:]:
        if candidate - groups[-1][-1] <= maximum_gap:
            groups[-1].append(candidate)
        else:
            groups.append([candidate])
    return groups


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
