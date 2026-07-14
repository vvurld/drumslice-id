from __future__ import annotations

import math
from dataclasses import dataclass
from numbers import Real
from pathlib import Path
from typing import Protocol

from ..errors import WorkerError


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

    def prepare_inference(self, options: dict[str, object]) -> None: ...

    def analyze_file(self, path: Path) -> ModelOutput: ...

    def health(self) -> BackendHealth: ...

    def cache_key(self, path: Path, source_id: str) -> str: ...


def validate_model_output(
    output: object,
    expected_class_names: tuple[str, ...] = CLASS_NAMES,
) -> ModelOutput:
    """Validate the model/cache boundary before mapping or serialization."""

    if not isinstance(output, ModelOutput):
        raise WorkerError("MALFORMED_MODEL_OUTPUT", "The classifier returned an invalid result object.")
    if not _is_finite_number(output.fps) or float(output.fps) <= 0.0:
        raise WorkerError("MALFORMED_MODEL_OUTPUT", "The classifier returned an invalid frame rate.")
    if not isinstance(output.class_names, (list, tuple)) or tuple(output.class_names) != tuple(expected_class_names):
        raise WorkerError(
            "MALFORMED_MODEL_OUTPUT",
            "The classifier returned an unexpected class order.",
            {
                "expected": list(expected_class_names),
                "actual": list(output.class_names) if isinstance(output.class_names, (list, tuple)) else [],
            },
        )
    if not isinstance(output.activations, list) or not output.activations:
        raise WorkerError("MALFORMED_MODEL_OUTPUT", "The classifier returned no activation frames.")
    for frame in output.activations:
        if not isinstance(frame, list) or len(frame) != len(expected_class_names):
            raise WorkerError("MALFORMED_MODEL_OUTPUT", "The classifier returned an unexpected activation shape.")
        for value in frame:
            if not _is_finite_number(value) or not 0.0 <= float(value) <= 1.0:
                raise WorkerError(
                    "MALFORMED_MODEL_OUTPUT",
                    "The classifier returned an activation outside the finite 0-to-1 range.",
                )
    if not _is_finite_number(output.source_duration) or float(output.source_duration) <= 0.0:
        raise WorkerError("MALFORMED_MODEL_OUTPUT", "The classifier returned an invalid source duration.")
    if not isinstance(output.metadata, dict):
        raise WorkerError("MALFORMED_MODEL_OUTPUT", "The classifier returned invalid metadata.")
    return output


def _is_finite_number(value: object) -> bool:
    return isinstance(value, Real) and not isinstance(value, bool) and math.isfinite(float(value))
