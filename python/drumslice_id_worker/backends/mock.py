from __future__ import annotations

import math
import os
import hashlib
from pathlib import Path
from typing import Any

from ..errors import WorkerError
from .base import BackendHealth, CLASS_NAMES, ModelOutput, validate_model_output


class MockBackend:
    backend_id = "mock"
    model_version = "mock-1"
    class_names = CLASS_NAMES

    def __init__(self, options: dict[str, Any] | None = None) -> None:
        self.options = options or {}

    def load(self) -> None:
        if os.environ.get("DRUMSLICE_ID_DEBUG") != "1" and os.environ.get("SLICE_LABELER_DEBUG") != "1":
            raise WorkerError("MOCK_BACKEND_DISABLED", "The mock backend is disabled outside explicit development mode.")

    def analyze_file(self, path: Path) -> ModelOutput:
        self.load()
        supplied = self.options.get("mockActivations")
        if not isinstance(supplied, list) or not supplied:
            raise WorkerError("MOCK_DATA_REQUIRED", "Development mock analysis requires explicit activation frames.")
        if any(not isinstance(frame, list) or len(frame) != len(CLASS_NAMES) for frame in supplied):
            raise WorkerError("MALFORMED_MODEL_OUTPUT", "Mock frames must contain five class activations.")
        try:
            activations = [[float(value) for value in frame] for frame in supplied]
            fps = float(self.options.get("fps", 100))
        except (TypeError, ValueError, OverflowError) as exc:
            raise WorkerError("MALFORMED_MODEL_OUTPUT", "Mock activations and FPS must be numeric.") from exc
        if not math.isfinite(fps) or fps <= 0.0:
            raise WorkerError("MALFORMED_MODEL_OUTPUT", "Mock FPS must be finite and positive.")
        return validate_model_output(ModelOutput(
            fps,
            self.class_names,
            activations,
            len(activations) / fps,
            {"backendId": self.backend_id, "modelVersion": self.model_version},
        ))

    def prepare_inference(self, options: dict[str, Any]) -> None:
        self.load()

    def health(self) -> BackendHealth:
        self.load()
        return BackendHealth(True, self.backend_id, self.model_version, self.class_names, "mock", "mock-v1", "Development backend")

    def cache_key(self, path: Path, source_id: str) -> str:
        # Development requests may intentionally supply different activation
        # fixtures for the same source file.  Reusing the production source ID
        # alone would return stale activations after that fixture changes.
        material = repr((self.options.get("fps", 100), self.options.get("mockActivations")))
        return hashlib.sha256(f"{source_id}\0{material}".encode("utf-8")).hexdigest()
