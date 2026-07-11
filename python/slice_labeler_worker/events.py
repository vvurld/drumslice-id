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
    for class_index, class_name in enumerate(class_names):
        threshold = float(thresholds[class_name])
        candidates: list[int] = []
        for index, frame in enumerate(activations):
            score = float(frame[class_index])
            left = max(0, index - int(round(0.02 * fps)))
            right = min(len(activations), index + int(round(0.01 * fps)) + 1)
            if score >= threshold and score >= max(float(activations[j][class_index]) for j in range(left, right)):
                candidates.append(index)
        combined: list[int] = []
        combine_frames = max(1, int(round(0.02 * fps)))
        for candidate in candidates:
            if combined and candidate - combined[-1] <= combine_frames:
                if activations[candidate][class_index] > activations[combined[-1]][class_index]:
                    combined[-1] = candidate
            else:
                combined.append(candidate)
        events.extend(Event(i / fps, class_name, float(activations[i][class_index])) for i in combined)
    return sorted(events, key=lambda event: (event.time_seconds, event.class_name))


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
