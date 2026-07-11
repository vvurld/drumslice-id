import os

import pytest

from slice_labeler_worker.backends.adtof import _resolve_audio_source
from slice_labeler_worker.backends.mock import MockBackend
from slice_labeler_worker.errors import WorkerError


def test_mock_backend_is_impossible_without_explicit_debug_flag(monkeypatch):
    monkeypatch.delenv("SLICE_LABELER_DEBUG", raising=False)
    with pytest.raises(WorkerError, match="disabled") as caught:
        MockBackend({}).health()
    assert caught.value.code == "MOCK_BACKEND_DISABLED"


def test_mock_backend_requires_explicit_activations(monkeypatch, tmp_path):
    monkeypatch.setenv("SLICE_LABELER_DEBUG", "1")
    with pytest.raises(WorkerError) as caught:
        MockBackend({}).analyze_file(tmp_path / "x.wav")
    assert caught.value.code == "MOCK_DATA_REQUIRED"


def test_rex_source_prefers_exact_stem_companion_in_same_folder(tmp_path):
    rex = tmp_path / "break.rx2"
    wav = tmp_path / "break.wav"
    rex.write_bytes(b"rex")
    wav.write_bytes(b"wav")
    assert _resolve_audio_source(rex) == wav.resolve()
