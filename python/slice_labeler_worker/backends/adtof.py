from __future__ import annotations

import contextlib
import hashlib
import io
import os
from pathlib import Path
import shutil
import subprocess
import sys
from typing import Any

from ..errors import WorkerError
from .base import BackendHealth, CLASS_NAMES, ModelOutput


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
        self._model: Any = None
        self._torch: Any = None
        self._module: Any = None
        self._weights_path: Path | None = None
        self._weights_fingerprint = "unloaded"

    def load(self) -> None:
        if self._model is not None:
            return
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
                "The installed ADTOF class mapping does not match Slice Labeler.",
                {"expected": EXPECTED_LABELS, "actual": list(adtof_pytorch.LABELS_5)},
            )
        fps = int(self.options.get("fps", 100))
        if fps != 100:
            raise WorkerError("UNSUPPORTED_MODEL_FPS", "The pinned ADTOF model supports 100 activation frames per second.")
        torch.set_num_threads(max(1, min(8, int(self.options.get("maxThreads", 2)))))
        weights_override = self.options.get("weightsPath")
        default_weights = adtof_pytorch.get_default_weights_path()
        weights = Path(weights_override or default_weights or "")
        if not weights.is_file():
            raise WorkerError("MODEL_WEIGHTS_MISSING", "ADTOF model weights are not readable.")
        model = adtof_pytorch.create_frame_rnn_model(adtof_pytorch.calculate_n_bins())
        # The pinned backend prints a human-readable weights message to stdout.
        # stdout is reserved exclusively for our JSON-lines protocol, so capture
        # third-party chatter during model initialization.
        with contextlib.redirect_stdout(io.StringIO()):
            model = adtof_pytorch.load_pytorch_weights(model, str(weights), strict=False)
        device = str(self.options.get("device", "cpu"))
        if device != "cpu":
            raise WorkerError("UNSUPPORTED_DEVICE", "This prototype enables only the reliable CPU inference path.")
        model.to("cpu")
        model.eval()
        self._torch = torch
        self._module = adtof_pytorch
        self._model = model
        self._weights_path = weights
        self._weights_fingerprint = _sha256_file(weights)

    def analyze_file(self, path: Path) -> ModelOutput:
        self.load()
        if not path.is_file():
            raise WorkerError("SAMPLE_FILE_MISSING", f"Sample file is not readable: {path.name}")
        analysis_path = _resolve_audio_source(path)
        try:
            features = self._module.load_audio_for_model(str(analysis_path)).to("cpu")
            with self._torch.inference_mode():
                tensor = self._model(features).cpu()
            activations = tensor.squeeze(0).tolist()
        except WorkerError:
            raise
        except Exception as exc:
            raise WorkerError("INFERENCE_FAILED", f"ADTOF could not analyze {path.name}.", {"exception": type(exc).__name__}) from exc
        _validate_activations(activations)
        return ModelOutput(
            fps=100.0,
            class_names=self.class_names,
            activations=activations,
            source_duration=len(activations) / 100.0,
            metadata={
                "backendId": self.backend_id,
                "modelVersion": self.model_version,
                "audioSource": "companion" if analysis_path != path else "original",
            },
        )

    def health(self) -> BackendHealth:
        self.load()
        return BackendHealth(True, self.backend_id, self.model_version, self.class_names, self._weights_fingerprint, self.preprocessing_version)


def _validate_activations(activations: object) -> None:
    if not isinstance(activations, list) or not activations:
        raise WorkerError("MALFORMED_MODEL_OUTPUT", "ADTOF returned no activation frames.")
    for frame in activations:
        if not isinstance(frame, list) or len(frame) != len(CLASS_NAMES):
            raise WorkerError("MALFORMED_MODEL_OUTPUT", "ADTOF returned an unexpected activation shape.")
        if any(not isinstance(value, (int, float)) for value in frame):
            raise WorkerError("MALFORMED_MODEL_OUTPUT", "ADTOF returned a non-numeric activation.")


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
    if not candidates and sys.platform == "darwin" and shutil.which("mdfind"):
        for suffix in DIRECT_AUDIO_SUFFIXES:
            query = f'kMDItemFSName == "{path.stem}{suffix}"c'
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
