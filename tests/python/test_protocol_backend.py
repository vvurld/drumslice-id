import io
import json
import math
import os
import sys
import warnings
from threading import Event
from types import SimpleNamespace

import pytest

import slice_labeler_worker.backends.adtof as adtof_module
from slice_labeler_worker.backends.adtof import AdtofBackend, _configure_numba_cache, _escape_spotlight_literal, _resolve_audio_source
from slice_labeler_worker.backends.base import CLASS_NAMES, ModelOutput, validate_model_output
from slice_labeler_worker.backends.mock import MockBackend
from slice_labeler_worker.errors import WorkerError
from slice_labeler_worker.protocol import WorkerProtocol


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


@pytest.mark.parametrize("value", [math.nan, math.inf, -0.01, 1.01])
def test_model_output_rejects_nonfinite_and_out_of_range_activations(value):
    output = ModelOutput(100, CLASS_NAMES, [[value, 0, 0, 0, 0]], 0.01, {})
    with pytest.raises(WorkerError) as caught:
        validate_model_output(output)
    assert caught.value.code == "MALFORMED_MODEL_OUTPUT"


@pytest.mark.parametrize(
    "output",
    [
        ModelOutput(0, CLASS_NAMES, [[0, 0, 0, 0, 0]], 0.01, {}),
        ModelOutput(100, CLASS_NAMES, [[0, 0, 0, 0, 0]], 0, {}),
        ModelOutput(100, ("snare", "kick", "tom", "hihat", "cymbal"), [[0, 0, 0, 0, 0]], 0.01, {}),
        ModelOutput(100, None, [[0, 0, 0, 0, 0]], 0.01, {}),
    ],
)
def test_model_output_rejects_invalid_rate_duration_and_class_order(output):
    with pytest.raises(WorkerError) as caught:
        validate_model_output(output)
    assert caught.value.code == "MALFORMED_MODEL_OUTPUT"


def test_mock_backend_rejects_nonfinite_output(monkeypatch, tmp_path):
    monkeypatch.setenv("SLICE_LABELER_DEBUG", "1")
    with pytest.raises(WorkerError) as caught:
        MockBackend({"mockActivations": [[math.nan, 0, 0, 0, 0]]}).analyze_file(tmp_path / "x.wav")
    assert caught.value.code == "MALFORMED_MODEL_OUTPUT"


def test_adtof_checkpoint_loading_is_strict_and_structured(monkeypatch, tmp_path):
    weights = tmp_path / "incomplete.pth"
    weights.write_bytes(b"not-used-by-fake-loader")
    strict_values = []

    class Model:
        def to(self, _device): return self
        def eval(self): return self

    fake_torch = SimpleNamespace(set_num_threads=lambda _value: None)
    fake_adtof = SimpleNamespace(
        LABELS_5=[35, 38, 47, 42, 49],
        get_default_weights_path=lambda: str(weights),
        calculate_n_bins=lambda: 84,
        create_frame_rnn_model=lambda _bins: Model(),
    )
    def fail_load(model, _path, strict):
        strict_values.append(strict)
        raise RuntimeError("missing key")
    fake_adtof.load_pytorch_weights = fail_load
    monkeypatch.setitem(sys.modules, "torch", fake_torch)
    monkeypatch.setitem(sys.modules, "adtof_pytorch", fake_adtof)

    with pytest.raises(WorkerError) as caught:
        AdtofBackend({"weightsPath": str(weights)}).health()
    assert caught.value.code == "MODEL_WEIGHTS_INCOMPATIBLE"
    assert strict_values == [True]


def test_adtof_suppresses_known_matmul_noise_but_rejects_nonfinite_features(tmp_path):
    audio = tmp_path / "break.wav"
    audio.write_bytes(b"not-read-by-test-double")

    class Features:
        def to(self, _device): return self

    class BooleanScalar:
        def all(self): return self
        def item(self): return False

    def load_audio_for_model(_path):
        for message in (
            "divide by zero encountered in matmul",
            "overflow encountered in matmul",
            "invalid value encountered in matmul",
        ):
            warnings.warn(message, RuntimeWarning)
        return Features()

    backend = AdtofBackend()
    backend._model = object()
    backend._torch = SimpleNamespace(
        set_num_threads=lambda _value: None,
        isfinite=lambda _features: BooleanScalar(),
    )
    backend._module = SimpleNamespace(load_audio_for_model=load_audio_for_model)

    with warnings.catch_warnings(record=True) as caught_warnings:
        warnings.simplefilter("always")
        with pytest.raises(WorkerError) as caught:
            backend.analyze_file(audio)

    assert caught.value.code == "INFERENCE_FAILED"
    assert caught_warnings == []


def test_protocol_rejects_nonobject_and_invalid_types_without_stopping():
    messages = [
        [],
        {"schemaVersion": True, "type": "health", "requestId": "bad", "backend": "mock", "options": {}},
        {"schemaVersion": 1, "type": "health", "requestId": None, "backend": "mock", "options": {}},
        {"schemaVersion": 1, "type": "health", "requestId": "bad-options", "backend": "adtof", "options": {"maxThreads": "many"}},
        {"schemaVersion": 1, "type": "shutdown", "requestId": "shutdown"},
    ]
    output = io.StringIO()
    protocol = WorkerProtocol(io.StringIO("".join(json.dumps(item) + "\n" for item in messages)), output)
    protocol.run()
    responses = [json.loads(line) for line in output.getvalue().splitlines()]
    assert [response["code"] for response in responses] == [
        "MALFORMED_REQUEST",
        "SCHEMA_VERSION_MISMATCH",
        "MALFORMED_REQUEST",
        "INVALID_ANALYSIS_REQUEST",
    ]


def test_protocol_shutdown_does_not_read_another_input_line():
    class OneLineInput:
        reads = 0
        def __iter__(self): return self
        def __next__(self):
            self.reads += 1
            if self.reads > 1:
                raise AssertionError("worker read after shutdown")
            return json.dumps({"schemaVersion": 1, "type": "shutdown", "requestId": "shutdown"}) + "\n"

    input_stream = OneLineInput()
    WorkerProtocol(input_stream, io.StringIO()).run()
    assert input_stream.reads == 1


def test_protocol_rejects_a_duplicate_active_request_id():
    release = Event()
    output = io.StringIO()
    protocol = WorkerProtocol(io.StringIO(), output)

    class BlockingService:
        def analyze(self, _params, cancelled, _progress):
            release.wait(1)
            if cancelled.is_set():
                raise WorkerError("ANALYSIS_CANCELLED", "Analysis was cancelled.")
            return ({"backend": {}, "predictions": [], "sourceErrors": []}, [])

    protocol.service = BlockingService()
    request = {"schemaVersion": 1, "type": "request", "requestId": "same", "method": "analyze", "params": {}}
    protocol.handle(request)
    protocol.handle(request)
    release.set()
    protocol._finish_shutdown()
    responses = [json.loads(line) for line in output.getvalue().splitlines()]
    assert any(response.get("code") == "DUPLICATE_REQUEST_ID" for response in responses)


def test_rex_source_prefers_exact_stem_companion_in_same_folder(tmp_path):
    rex = tmp_path / "break.rx2"
    wav = tmp_path / "break.wav"
    rex.write_bytes(b"rex")
    wav.write_bytes(b"wav")
    assert _resolve_audio_source(rex) == wav.resolve()


def test_rex_source_finds_exact_stem_in_an_adjacent_format_folder(tmp_path):
    rex_directory = tmp_path / "breaks" / "02_RX2"
    wav_directory = tmp_path / "breaks" / "01_WAV"
    rex_directory.mkdir(parents=True)
    wav_directory.mkdir(parents=True)
    rex = rex_directory / "amen.rx2"
    wav = wav_directory / "amen.wav"
    rex.write_bytes(b"rex")
    wav.write_bytes(b"wave")
    assert _resolve_audio_source(rex) == wav.resolve()


def test_spotlight_companion_query_escapes_quotes_and_backslashes():
    assert _escape_spotlight_literal('break "one" \\ alt.wav') == 'break \\"one\\" \\\\ alt.wav'


def test_numba_cache_is_redirected_outside_the_installed_package(tmp_path, monkeypatch):
    monkeypatch.setenv("SLICE_LABELER_CACHE_DIR", str(tmp_path / "worker-cache"))
    monkeypatch.delenv("NUMBA_CACHE_DIR", raising=False)
    _configure_numba_cache()
    assert os.environ["NUMBA_CACHE_DIR"] == str(tmp_path / "worker-cache" / "numba")
    assert (tmp_path / "worker-cache" / "numba").is_dir()


def test_numba_cache_falls_back_when_the_primary_directory_is_not_writable(tmp_path, monkeypatch):
    primary = tmp_path / "worker-cache" / "numba"
    fallback_root = tmp_path / "system-temp"
    monkeypatch.setenv("SLICE_LABELER_CACHE_DIR", str(tmp_path / "worker-cache"))
    monkeypatch.delenv("NUMBA_CACHE_DIR", raising=False)
    monkeypatch.setattr(adtof_module.tempfile, "gettempdir", lambda: str(fallback_root))
    real_named_temporary_file = adtof_module.tempfile.NamedTemporaryFile

    def create_probe(*args, **kwargs):
        if os.fspath(kwargs.get("dir")) == os.fspath(primary):
            raise PermissionError("read-only test cache")
        return real_named_temporary_file(*args, **kwargs)

    monkeypatch.setattr(adtof_module.tempfile, "NamedTemporaryFile", create_probe)
    _configure_numba_cache()

    user_token = str(os.getuid()) if hasattr(os, "getuid") else "user"
    expected = fallback_root / f"slice-labeler-numba-{user_token}"
    assert os.environ["NUMBA_CACHE_DIR"] == str(expected)
    assert expected.is_dir()
