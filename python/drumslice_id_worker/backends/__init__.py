from __future__ import annotations

from typing import Any

from ..errors import WorkerError
from .adtof import AdtofBackend
from .base import ClassifierBackend
from .mock import MockBackend


def create_backend(backend_id: str, options: dict[str, Any] | None = None) -> ClassifierBackend:
    if backend_id == "adtof":
        return AdtofBackend(options)
    if backend_id == "mock":
        return MockBackend(options)
    raise WorkerError("UNKNOWN_BACKEND", f"Unknown classifier backend: {backend_id}")


__all__ = ["create_backend", "AdtofBackend", "MockBackend"]
