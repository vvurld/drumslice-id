from __future__ import annotations

import gzip
import hashlib
import json
import os
import re
import tempfile
from pathlib import Path
from typing import Any


def default_cache_dir() -> Path:
    override = os.environ.get("DRUMSLICE_ID_CACHE_DIR") or os.environ.get("SLICE_LABELER_CACHE_DIR")
    if override:
        return Path(override)
    if os.name == "nt":
        return Path(os.environ.get("LOCALAPPDATA", Path.home())) / "DrumSLICE ID" / "Cache" / "worker"
    if os.uname().sysname == "Darwin":
        return Path.home() / "Library" / "Caches" / "DrumSLICE ID" / "worker"
    return Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "drumslice-id" / "worker"


DEFAULT_MAX_BYTES = 512 * 1024 * 1024


def default_cache_max_bytes() -> int:
    """Return the optional user-configured cache ceiling in whole MiB."""

    raw = os.environ.get("DRUMSLICE_ID_CACHE_MAX_MIB") or os.environ.get("SLICE_LABELER_CACHE_MAX_MIB")
    if raw is None:
        return DEFAULT_MAX_BYTES
    try:
        mebibytes = int(raw)
    except (TypeError, ValueError):
        return DEFAULT_MAX_BYTES
    if not 1 <= mebibytes <= 102_400:
        return DEFAULT_MAX_BYTES
    return mebibytes * 1024 * 1024


class ActivationCache:
    def __init__(self, directory: Path | None = None, max_bytes: int | None = None) -> None:
        self.directory = directory or default_cache_dir()
        self.max_bytes = default_cache_max_bytes() if max_bytes is None else max_bytes

    def path(self, key: str) -> Path:
        return self.directory / f"{_safe_key(key)}.json.gz"

    def get(self, key: str) -> dict[str, Any] | None:
        target = self.path(key)
        try:
            with gzip.open(target, "rt", encoding="utf-8") as handle:
                value = json.load(handle)
            if not isinstance(value, dict):
                raise TypeError("A cache entry must contain an object.")
            os.utime(target, None)
            return value
        except FileNotFoundError:
            return None
        except (OSError, ValueError, TypeError):
            try:
                target.unlink(missing_ok=True)
            except OSError:
                pass
            return None

    def set(self, key: str, value: dict[str, Any]) -> None:
        if not isinstance(value, dict):
            raise TypeError("A cache entry must contain an object.")
        self.directory.mkdir(parents=True, exist_ok=True)
        safe_key = _safe_key(key)
        handle, temporary = tempfile.mkstemp(prefix=f"{safe_key}.", suffix=".tmp", dir=self.directory)
        os.close(handle)
        temp_path = Path(temporary)
        try:
            with gzip.open(temp_path, "wt", encoding="utf-8") as stream:
                json.dump(value, stream, separators=(",", ":"), allow_nan=False)
            os.replace(temp_path, self.path(key))
        finally:
            temp_path.unlink(missing_ok=True)
        self.cleanup()

    def delete(self, key: str) -> None:
        try:
            self.path(key).unlink(missing_ok=True)
        except OSError:
            pass

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


def _safe_key(key: str) -> str:
    if not isinstance(key, str) or not key:
        raise ValueError("Cache keys must be non-empty strings.")
    if re.fullmatch(r"[0-9a-f]{64}", key):
        return key
    return hashlib.sha256(key.encode("utf-8")).hexdigest()
