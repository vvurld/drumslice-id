from __future__ import annotations

import gzip
import json
import os
import tempfile
import time
from pathlib import Path
from typing import Any


def default_cache_dir() -> Path:
    override = os.environ.get("SLICE_LABELER_CACHE_DIR")
    if override:
        return Path(override)
    if os.name == "nt":
        return Path(os.environ.get("LOCALAPPDATA", Path.home())) / "Slice Labeler" / "Cache" / "worker"
    if os.uname().sysname == "Darwin":
        return Path.home() / "Library" / "Caches" / "Slice Labeler" / "worker"
    return Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "slice-labeler" / "worker"


class ActivationCache:
    def __init__(self, directory: Path | None = None, max_bytes: int = 512 * 1024 * 1024) -> None:
        self.directory = directory or default_cache_dir()
        self.max_bytes = max_bytes

    def path(self, key: str) -> Path:
        return self.directory / f"{key}.json.gz"

    def get(self, key: str) -> dict[str, Any] | None:
        target = self.path(key)
        try:
            with gzip.open(target, "rt", encoding="utf-8") as handle:
                value = json.load(handle)
            os.utime(target, None)
            return value
        except FileNotFoundError:
            return None
        except (OSError, ValueError, TypeError):
            target.unlink(missing_ok=True)
            return None

    def set(self, key: str, value: dict[str, Any]) -> None:
        self.directory.mkdir(parents=True, exist_ok=True)
        handle, temporary = tempfile.mkstemp(prefix=f"{key}.", suffix=".tmp", dir=self.directory)
        os.close(handle)
        temp_path = Path(temporary)
        try:
            with gzip.open(temp_path, "wt", encoding="utf-8") as stream:
                json.dump(value, stream, separators=(",", ":"))
            os.replace(temp_path, self.path(key))
        finally:
            temp_path.unlink(missing_ok=True)
        self.cleanup()

    def clear(self) -> None:
        if not self.directory.exists():
            return
        for item in self.directory.glob("*.json.gz"):
            item.unlink(missing_ok=True)

    def cleanup(self) -> None:
        entries = sorted(self.directory.glob("*.json.gz"), key=lambda path: path.stat().st_atime)
        total = sum(path.stat().st_size for path in entries)
        for entry in entries:
            if total <= self.max_bytes:
                break
            size = entry.stat().st_size
            entry.unlink(missing_ok=True)
            total -= size
