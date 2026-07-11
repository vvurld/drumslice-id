from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol


CLASS_NAMES = ("kick", "snare", "tom", "hihat", "cymbal")


@dataclass(frozen=True)
class ModelOutput:
    fps: float
    class_names: tuple[str, ...]
    activations: list[list[float]]
    source_duration: float
    metadata: dict[str, str]


@dataclass(frozen=True)
class BackendHealth:
    ok: bool
    backend_id: str
    model_version: str
    class_names: tuple[str, ...]
    model_weights_fingerprint: str
    preprocessing_version: str
    message: str = "Ready"

    def as_dict(self) -> dict[str, object]:
        return {
            "ok": self.ok,
            "backendId": self.backend_id,
            "modelVersion": self.model_version,
            "classNames": list(self.class_names),
            "modelWeightsFingerprint": self.model_weights_fingerprint,
            "preprocessingVersion": self.preprocessing_version,
            "message": self.message,
        }


class ClassifierBackend(Protocol):
    backend_id: str
    model_version: str
    class_names: tuple[str, ...]

    def load(self) -> None: ...

    def analyze_file(self, path: Path) -> ModelOutput: ...

    def health(self) -> BackendHealth: ...
