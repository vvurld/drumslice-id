from __future__ import annotations

import contextlib
import hashlib
import io
import math
import os
import shutil
import subprocess
import sys
import tempfile
import warnings
from numbers import Real
from pathlib import Path
from typing import Any

from ..cache import default_cache_dir
from ..errors import WorkerError
from .base import BackendHealth, CLASS_NAMES, ModelOutput, validate_model_output


EXPECTED_LABELS = [35, 38, 47, 42, 49]
DIRECT_AUDIO_SUFFIXES = (".wav", ".wave", ".aif", ".aiff", ".flac", ".mp3", ".m4a")
REX_SUFFIXES = (".rex", ".rx2")


class AdtofBackend:
    backend_id = "adtof"
    model_version = "adtof-pytorch-0.1.0+85c192e"
    class_names = CLASS_NAMES
    preprocessing_version = "adtof-pytorch-audio-v1"

    def __init__(self, options: dict[str, Any] | None = None) -> None:
        self.options = options or {}
        self._maximum_threads = max(1, min(8, _integer_option(self.options, "maxThreads", 2)))
        self._model: Any = None
        self._torch: Any = None
        self._module: Any = None
        self._weights_path: Path | None = None
        self._weights_fingerprint = "unloaded"

    def load(self) -> None:
        if self._model is not None:
            return
        _configure_numba_cache()
        try:
            import torch
            import adtof_pytorch
        except ImportError as exc:
            raise WorkerError(
                "BACKEND_NOT_INSTALLED",
                "The ADTOF backend is not installed. Run the explicit backend setup script.",
                {"missing": getattr(exc, "name", "adtof_pytorch")},
            ) from exc
        if list(adtof_pytorch.LABELS_5) != EXPECTED_LABELS:
            raise WorkerError(
                "BACKEND_CLASS_MAPPING_CHANGED",
                "The installed ADTOF class mapping does not match DrumSLICE ID.",
                {"expected": EXPECTED_LABELS, "actual": list(adtof_pytorch.LABELS_5)},
            )
        fps = _integer_option(self.options, "fps", 100)
        if fps != 100:
            raise WorkerError("UNSUPPORTED_MODEL_FPS", "The pinned ADTOF model supports 100 activation frames per second.")
        device = self.options.get("device", "cpu")
        if not isinstance(device, str) or device != "cpu":
            raise WorkerError("UNSUPPORTED_DEVICE", "This prototype enables only the reliable CPU inference path.")
        weights_override = self.options.get("weightsPath")
        if weights_override is not None and (not isinstance(weights_override, str) or not weights_override):
            raise WorkerError("INVALID_BACKEND_OPTIONS", "weightsPath must be a non-empty string.")
        default_weights = adtof_pytorch.get_default_weights_path()
        weights = Path(weights_override or default_weights or "")
        if not weights.is_file():
            raise WorkerError("MODEL_WEIGHTS_MISSING", "ADTOF model weights are not readable.")
        try:
            model = adtof_pytorch.create_frame_rnn_model(adtof_pytorch.calculate_n_bins())
            # The pinned backend prints a human-readable weights message to stdout.
            # stdout is reserved exclusively for our JSON-lines protocol, so capture
            # third-party chatter during model initialization.
            with contextlib.redirect_stdout(io.StringIO()):
                model = adtof_pytorch.load_pytorch_weights(model, str(weights), strict=True)
        except Exception as exc:
            raise WorkerError(
                "MODEL_WEIGHTS_INCOMPATIBLE",
                "ADTOF model weights are incomplete or incompatible with the pinned model.",
                {"exception": type(exc).__name__},
            ) from exc
        model.to("cpu")
        model.eval()
        self._torch = torch
        self._module = adtof_pytorch
        self._model = model
        self._weights_path = weights
        try:
            self._weights_fingerprint = _sha256_file(weights)
        except OSError as exc:
            self._model = None
            raise WorkerError("MODEL_WEIGHTS_MISSING", "ADTOF model weights could not be read completely.") from exc

    def analyze_file(self, path: Path) -> ModelOutput:
        self.load()
        self._torch.set_num_threads(self._maximum_threads)
        if not path.is_file():
            raise WorkerError("SAMPLE_FILE_MISSING", f"Sample file is not readable: {path.name}")
        analysis_path = _resolve_audio_source(path)
        try:
            # NumPy/Accelerate can report spurious floating-point status flags
            # for this finite filter-bank matrix multiplication on macOS. Keep
            # those three known warnings out of the worker log, then validate
            # the actual feature tensor so a genuine numerical failure cannot
            # be hidden by the suppression.
            with warnings.catch_warnings():
                warnings.filterwarnings(
                    "ignore",
                    message=r"(?:divide by zero|overflow|invalid value) encountered in matmul",
                    category=RuntimeWarning,
                )
                features = self._module.load_audio_for_model(str(analysis_path)).to("cpu")
            if not bool(self._torch.isfinite(features).all().item()):
                raise WorkerError("INFERENCE_FAILED", "ADTOF produced non-finite audio features.")
            with self._torch.inference_mode():
                tensor = self._model(features).cpu()
            activations = tensor.squeeze(0).tolist()
        except WorkerError:
            raise
        except Exception as exc:
            raise WorkerError("INFERENCE_FAILED", f"ADTOF could not analyze {path.name}.", {"exception": type(exc).__name__}) from exc
        return validate_model_output(ModelOutput(
            fps=100.0,
            class_names=self.class_names,
            activations=activations,
            source_duration=len(activations) / 100.0,
            metadata={
                "backendId": self.backend_id,
                "modelVersion": self.model_version,
                "audioSource": "companion" if analysis_path != path else "original",
            },
        ))

    def prepare_inference(self, options: dict[str, object]) -> None:
        """Apply process-global Torch settings immediately before inference."""

        self.load()
        self._maximum_threads = max(1, min(8, _integer_option(options, "maxThreads", 2)))
        self._torch.set_num_threads(self._maximum_threads)

    def cache_key(self, path: Path, source_id: str) -> str:
        """Include a resolved REX companion's identity in the activation key."""
        if path.suffix.lower() not in REX_SUFFIXES:
            return source_id
        analysis_path = _resolve_audio_source(path)
        try:
            stat = analysis_path.stat()
        except OSError as exc:
            raise WorkerError("SAMPLE_FILE_MISSING", "The matching REX companion is no longer readable.") from exc
        material = "\0".join((source_id, str(analysis_path.resolve()), str(stat.st_size), str(stat.st_mtime_ns)))
        return hashlib.sha256(material.encode("utf-8")).hexdigest()

    def health(self) -> BackendHealth:
        self.load()
        return BackendHealth(True, self.backend_id, self.model_version, self.class_names, self._weights_fingerprint, self.preprocessing_version)


def _integer_option(options: dict[str, Any], key: str, default: int) -> int:
    value = options.get(key, default)
    if (
        not isinstance(value, Real)
        or isinstance(value, bool)
        or not math.isfinite(float(value))
        or int(value) != float(value)
    ):
        raise WorkerError("INVALID_BACKEND_OPTIONS", f"{key} must be an integer.")
    return int(value)


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _resolve_audio_source(path: Path) -> Path:
    """Resolve formats librosa cannot decode, notably the supplied REX2 fixture.

    Live can use REX/RX2 directly, while the pinned ADTOF audio loader cannot.
    Sample packs commonly ship the same break as both REX2 and WAV; prefer an
    exact-stem companion without modifying Live's rack or slice markers.
    """
    if path.suffix.lower() not in REX_SUFFIXES:
        return path
    candidates: list[Path] = []
    for suffix in DIRECT_AUDIO_SUFFIXES:
        candidate = path.with_suffix(suffix)
        if candidate.is_file():
            candidates.append(candidate)
    if not candidates:
        # Sample packs commonly separate equivalent encodings into adjacent
        # folders such as 01_WAV and 02_RX2. Check those deterministic nearby
        # paths before relying on a platform-specific global index.
        try:
            sibling_directories = [item for item in path.parent.parent.iterdir() if item.is_dir()]
        except OSError:
            sibling_directories = []
        for directory in sibling_directories:
            for suffix in DIRECT_AUDIO_SUFFIXES:
                candidate = directory / f"{path.stem}{suffix}"
                if candidate.is_file():
                    candidates.append(candidate)
    if not candidates and sys.platform == "darwin" and shutil.which("mdfind"):
        for suffix in DIRECT_AUDIO_SUFFIXES:
            query = f'kMDItemFSName == "{_escape_spotlight_literal(path.stem + suffix)}"c'
            try:
                result = subprocess.run(
                    ["mdfind", "-onlyin", str(Path.home()), query],
                    check=False,
                    capture_output=True,
                    text=True,
                    timeout=10,
                )
            except (OSError, subprocess.TimeoutExpired):
                continue
            candidates.extend(Path(line) for line in result.stdout.splitlines() if line and Path(line).is_file())
            if candidates:
                break
    if candidates:
        unique = list(dict.fromkeys(candidate.resolve() for candidate in candidates))
        unique.sort(key=lambda candidate: (_path_distance(path.resolve(), candidate), str(candidate)))
        return unique[0]
    raise WorkerError(
        "UNSUPPORTED_AUDIO_FORMAT",
        f"ADTOF cannot decode {path.suffix.upper()} directly and no matching WAV/AIFF companion was found.",
        {"extension": path.suffix.lower()},
    )


def _path_distance(left: Path, right: Path) -> int:
    try:
        common = Path(os.path.commonpath((str(left), str(right))))
        return len(left.parts) + len(right.parts) - 2 * len(common.parts)
    except ValueError:
        return 1_000_000


def _escape_spotlight_literal(value: str) -> str:
    """Quote an exact filename safely inside an mdfind query literal."""

    return value.replace("\\", "\\\\").replace('"', '\\"')


def _configure_numba_cache() -> None:
    """Keep librosa/Numba caches out of a possibly read-only environment."""

    if os.environ.get("NUMBA_CACHE_DIR"):
        return
    user_token = str(os.getuid()) if hasattr(os, "getuid") else "user"
    candidates = [
        default_cache_dir() / "numba",
        Path(tempfile.gettempdir()) / f"slice-labeler-numba-{user_token}",
    ]
    last_error: OSError | None = None
    for directory in candidates:
        try:
            directory.mkdir(parents=True, exist_ok=True)
            # mkdir(exist_ok=True) succeeds for an existing read-only
            # directory.  Probe an actual file creation so Numba does not fail
            # later while importing librosa from a read-only installation.
            with tempfile.NamedTemporaryFile(prefix=".slice-labeler-write-", dir=directory) as probe:
                probe.write(b"ok")
                probe.flush()
            os.environ["NUMBA_CACHE_DIR"] = str(directory)
            return
        except OSError as exc:
            last_error = exc
    raise WorkerError(
        "CACHE_DIRECTORY_UNWRITABLE",
        "No writable local directory is available for the analysis runtime cache.",
        {"exception": type(last_error).__name__ if last_error else "OSError"},
    ) from last_error
