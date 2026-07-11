from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from ..errors import WorkerError
from .base import BackendHealth, CLASS_NAMES, ModelOutput


class MockBackend:
    backend_id = "mock"
    model_version = "mock-1"
    class_names = CLASS_NAMES

    def __init__(self, options: dict[str, Any] | None = None) -> None:
        self.options = options or {}

    def load(self) -> None:
        if os.environ.get("SLICE_LABELER_DEBUG") != "1":
            raise WorkerError("MOCK_BACKEND_DISABLED", "The mock backend is disabled outside explicit development mode.")

    def analyze_file(self, path: Path) -> ModelOutput:
        self.load()
        supplied = self.options.get("mockActivations")
        if not isinstance(supplied, list) or not supplied:
            raise WorkerError("MOCK_DATA_REQUIRED", "Development mock analysis requires explicit activation frames.")
        activations = [[float(value) for value in frame] for frame in supplied]
        if any(len(frame) != 5 for frame in activations):
            raise WorkerError("MALFORMED_MODEL_OUTPUT", "Mock frames must contain five class activations.")
        fps = float(self.options.get("fps", 100))
        return ModelOutput(fps, self.class_names, activations, len(activations) / fps, {"backendId": self.backend_id, "modelVersion": self.model_version})

    def health(self) -> BackendHealth:
        self.load()
        return BackendHealth(True, self.backend_id, self.model_version, self.class_names, "mock", "mock-v1", "Development backend")
