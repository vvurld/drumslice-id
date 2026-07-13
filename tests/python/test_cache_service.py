import hashlib
from threading import Event, Thread

import pytest

import slice_labeler_worker.service as service_module
from slice_labeler_worker.backends.base import BackendHealth, CLASS_NAMES, ModelOutput
from slice_labeler_worker.backends.mock import MockBackend
from slice_labeler_worker.cache import ActivationCache, DEFAULT_MAX_BYTES
from slice_labeler_worker.errors import WorkerError
from slice_labeler_worker.service import AnalysisService


class Backend:
    backend_id = "test"
    model_version = "1"
    class_names = CLASS_NAMES

    def __init__(self, fail=None):
        self.calls = []
        self.fail = fail

    def load(self): pass

    def health(self):
        return BackendHealth(True, "test", "1", CLASS_NAMES, "w", "p")

    def analyze_file(self, path):
        self.calls.append(path.name)
        if path.name == self.fail:
            raise WorkerError("INFERENCE_FAILED", "failed source")
        activations = [[0.0] * 5 for _ in range(30)]
        activations[5] = [0.8, 0, 0, 0.7, 0]
        return ModelOutput(100, CLASS_NAMES, activations, 0.3, {})


class CompanionBackend(Backend):
    def analyze_file(self, path):
        self.calls.append(path.name)
        activations = [[0.0] * 5 for _ in range(100)]
        activations[0][0] = 0.8
        activations[50][1] = 0.8
        return ModelOutput(100, CLASS_NAMES, activations, 1.0, {"audioSource": "companion"})


class PartialCompanionBackend(Backend):
    def analyze_file(self, path):
        self.calls.append(path.name)
        activations = [[0.0] * 5 for _ in range(100)]
        activations[40][0] = 0.9
        activations[80][1] = 0.9
        return ModelOutput(100, CLASS_NAMES, activations, 1.0, {"audioSource": "companion"})


def params(paths):
    return {"backend": "test", "modelOptions": {}, "mappingOptions": {}, "sources": [{"sourceId": hashlib.sha256(f"id-{i}".encode()).hexdigest(), "path": str(path), "sampleRateFromLive": 1000, "regions": [{"regionId": f"r-{i}", "startFrame": 0, "endFrame": 100}]} for i, path in enumerate(paths)]}


def test_cache_roundtrip_corruption_and_safe_key_behavior(tmp_path):
    cache = ActivationCache(tmp_path)
    cache.set("a", {"value": 1})
    assert cache.get("a") == {"value": 1}
    cache.path("a").write_text("corrupt")
    assert cache.get("a") is None
    cache.set("../escaped", {"value": 2})
    assert cache.get("../escaped") == {"value": 2}
    assert not (tmp_path.parent / "escaped.json.gz").exists()


def test_cache_maximum_is_configurable_in_whole_mebibytes(monkeypatch, tmp_path):
    monkeypatch.setenv("SLICE_LABELER_CACHE_MAX_MIB", "64")
    assert ActivationCache(tmp_path / "configured").max_bytes == 64 * 1024 * 1024
    monkeypatch.setenv("SLICE_LABELER_CACHE_MAX_MIB", "not-a-number")
    assert ActivationCache(tmp_path / "fallback").max_bytes == DEFAULT_MAX_BYTES


def test_service_continues_after_source_failure(tmp_path):
    service = AnalysisService(ActivationCache(tmp_path / "cache")); backend = Backend("bad.wav")
    service.backend = lambda *_: backend
    good, bad = tmp_path / "good.wav", tmp_path / "bad.wav"; good.write_bytes(b"a"); bad.write_bytes(b"b")
    result, errors = service.analyze(params([bad, good]), Event(), lambda _: None)
    assert len(errors) == 1
    assert {item["decision"] for item in result["predictions"]} == {"analysis_error", "matched_event"}


def test_service_stops_between_sources_when_cancelled(tmp_path):
    service = AnalysisService(ActivationCache(tmp_path / "cache")); backend = Backend(); service.backend = lambda *_: backend
    files = [tmp_path / "a.wav", tmp_path / "b.wav"]
    for file in files: file.write_bytes(b"x")
    cancel = Event()
    def progress(item):
        if item.get("completed") == 1: cancel.set()
    with pytest.raises(WorkerError) as caught:
        service.analyze(params(files), cancel, progress)
    assert caught.value.code == "ANALYSIS_CANCELLED"
    assert backend.calls == ["a.wav"]


def test_cached_source_avoids_second_inference(tmp_path):
    service = AnalysisService(ActivationCache(tmp_path / "cache")); backend = Backend(); service.backend = lambda *_: backend
    file = tmp_path / "a.wav"; file.write_bytes(b"x"); request = params([file])
    service.analyze(request, Event(), lambda _: None); service.analyze(request, Event(), lambda _: None)
    assert backend.calls == ["a.wav"]


def test_backend_cache_ignores_thresholds_and_runtime_thread_count(monkeypatch, tmp_path):
    created = []

    def create(_backend_id, _options):
        backend = Backend()
        created.append(backend)
        return backend

    monkeypatch.setattr(service_module, "create_backend", create)
    service = AnalysisService(ActivationCache(tmp_path / "cache"))
    first = service.backend("test", {"maxThreads": 2, "thresholds": {"kick": 0.2}, "device": "cpu"})
    second = service.backend("test", {"maxThreads": 6, "thresholds": {"kick": 0.4}, "device": "cpu"})
    assert first is second
    assert created == [first]


def test_runtime_thread_setting_is_reapplied_for_each_inference(tmp_path):
    class RuntimeBackend(Backend):
        def __init__(self):
            super().__init__()
            self.current_threads = None
            self.used_threads = []

        def prepare_inference(self, options):
            self.current_threads = options.get("maxThreads", 2)

        def analyze_file(self, path):
            self.used_threads.append(self.current_threads)
            return super().analyze_file(path)

    service = AnalysisService(ActivationCache(tmp_path / "cache"))
    backend = RuntimeBackend()
    service.backend = lambda *_: backend
    first, second = tmp_path / "first.wav", tmp_path / "second.wav"
    first.write_bytes(b"a")
    second.write_bytes(b"b")
    first_request = params([first])
    second_request = params([second])
    second_request["sources"][0]["sourceId"] = hashlib.sha256(b"second-runtime-source").hexdigest()
    first_request["modelOptions"] = {"maxThreads": 2}
    second_request["modelOptions"] = {"maxThreads": 6}

    service.analyze(first_request, Event(), lambda _: None)
    service.analyze(second_request, Event(), lambda _: None)

    assert backend.used_threads == [2, 6]


def test_mock_cache_identity_changes_with_supplied_activation_fixture(monkeypatch, tmp_path):
    monkeypatch.setenv("SLICE_LABELER_DEBUG", "1")
    source_id = hashlib.sha256(b"mock-source").hexdigest()
    first = MockBackend({"fps": 100, "mockActivations": [[0.8, 0, 0, 0, 0]]})
    same = MockBackend({"fps": 100, "mockActivations": [[0.8, 0, 0, 0, 0]]})
    changed = MockBackend({"fps": 100, "mockActivations": [[0, 0.8, 0, 0, 0]]})
    assert first.cache_key(tmp_path / "unused.wav", source_id) == same.cache_key(tmp_path / "unused.wav", source_id)
    assert first.cache_key(tmp_path / "unused.wav", source_id) != changed.cache_key(tmp_path / "unused.wav", source_id)


def test_semantically_corrupt_cache_is_deleted_and_recomputed(tmp_path):
    service = AnalysisService(ActivationCache(tmp_path / "cache")); backend = Backend(); service.backend = lambda *_: backend
    file = tmp_path / "a.wav"; file.write_bytes(b"x"); request = params([file])
    source_id = request["sources"][0]["sourceId"]
    service.cache.set(source_id, {"fps": 100})
    result, errors = service.analyze(request, Event(), lambda _: None)
    assert errors == []
    assert result["predictions"][0]["classes"] == ["kick"]
    assert backend.calls == ["a.wav"]
    assert service.cache.get(source_id)["classNames"] == list(CLASS_NAMES)


def test_rex_companion_scales_live_slice_times_to_decoded_audio(tmp_path):
    service = AnalysisService(ActivationCache(tmp_path / "cache"))
    backend = CompanionBackend()
    service.backend = lambda *_: backend
    request = {
        "backend": "test",
        "modelOptions": {},
        "mappingOptions": {},
        "sources": [{
            "sourceId": hashlib.sha256(b"rex-source").hexdigest(),
            "path": str(tmp_path / "break.rx2"),
            "sampleRateFromLive": 1000,
            "lengthFramesFromLive": 2000,
            "regions": [
                {"regionId": "first", "startFrame": 0, "endFrame": 1000},
                {"regionId": "second", "startFrame": 1000, "endFrame": 2000},
            ],
        }],
    }
    result, errors = service.analyze(request, Event(), lambda _: None)
    assert errors == []
    assert [prediction["classes"] for prediction in result["predictions"]] == [["kick"], ["snare"]]
    assert all("companion audio" in prediction["warnings"][0] for prediction in result["predictions"])


def test_rex_companion_activations_are_reused_from_cache(tmp_path):
    service = AnalysisService(ActivationCache(tmp_path / "cache"))
    backend = CompanionBackend()
    service.backend = lambda *_: backend
    request = {
        "backend": "test",
        "modelOptions": {},
        "mappingOptions": {},
        "sources": [{
            "sourceId": hashlib.sha256(b"cached-rex").hexdigest(),
            "path": str(tmp_path / "break.rx2"),
            "sampleRateFromLive": 1000,
            "lengthFramesFromLive": 1000,
            "regions": [{"regionId": "only", "startFrame": 0, "endFrame": 1000}],
        }],
    }
    service.analyze(request, Event(), lambda _: None)
    service.analyze(request, Event(), lambda _: None)
    assert backend.calls == ["break.rx2"]


def test_rex_scaling_uses_full_source_length_when_later_regions_are_absent(tmp_path):
    service = AnalysisService(ActivationCache(tmp_path / "cache"))
    backend = PartialCompanionBackend()
    service.backend = lambda *_: backend
    request = {
        "backend": "test",
        "modelOptions": {},
        "mappingOptions": {},
        "sources": [{
            "sourceId": hashlib.sha256(b"partial-rex").hexdigest(),
            "path": str(tmp_path / "break.rx2"),
            "sampleRateFromLive": 1000,
            "lengthFramesFromLive": 2000,
            "regions": [{"regionId": "remaining", "startFrame": 800, "endFrame": 1000}],
        }],
    }
    result, errors = service.analyze(request, Event(), lambda _: None)
    assert errors == []
    assert result["predictions"][0]["classes"] == ["kick"]


def test_companion_warning_is_present_for_one_to_one_duration(tmp_path):
    service = AnalysisService(ActivationCache(tmp_path / "cache"))
    backend = CompanionBackend()
    service.backend = lambda *_: backend
    request = {
        "backend": "test",
        "modelOptions": {},
        "mappingOptions": {},
        "sources": [{
            "sourceId": hashlib.sha256(b"one-to-one-rex").hexdigest(),
            "path": str(tmp_path / "break.rx2"),
            "sampleRateFromLive": 1000,
            "lengthFramesFromLive": 1000,
            "regions": [{"regionId": "only", "startFrame": 0, "endFrame": 1000}],
        }],
    }
    result, errors = service.analyze(request, Event(), lambda _: None)
    assert errors == []
    assert "companion audio" in result["predictions"][0]["warnings"][0]


def test_cancellation_after_inference_skips_post_processing(monkeypatch, tmp_path):
    cancel = Event()
    backend = Backend()
    original = backend.analyze_file
    def analyze_and_cancel(path):
        output = original(path)
        cancel.set()
        return output
    backend.analyze_file = analyze_and_cancel
    service = AnalysisService(ActivationCache(tmp_path / "cache")); service.backend = lambda *_: backend
    calls = []
    monkeypatch.setattr("slice_labeler_worker.service.extract_events", lambda *args: calls.append(args) or [])
    file = tmp_path / "a.wav"; file.write_bytes(b"x")
    with pytest.raises(WorkerError) as caught:
        service.analyze(params([file]), cancel, lambda _: None)
    assert caught.value.code == "ANALYSIS_CANCELLED"
    assert calls == []
    assert service.cache.get(params([file])["sources"][0]["sourceId"]) is None


def test_invalid_zero_threshold_is_rejected_before_inference(tmp_path):
    service = AnalysisService(ActivationCache(tmp_path / "cache")); backend = Backend(); service.backend = lambda *_: backend
    file = tmp_path / "a.wav"; file.write_bytes(b"x"); request = params([file])
    request["modelOptions"] = {"thresholds": {"kick": 0.0}}
    with pytest.raises(WorkerError) as caught:
        service.analyze(request, Event(), lambda _: None)
    assert caught.value.code == "INVALID_ANALYSIS_REQUEST"
    assert backend.calls == []


def test_invalid_region_and_mapping_shapes_are_rejected_before_inference(tmp_path):
    service = AnalysisService(ActivationCache(tmp_path / "cache")); backend = Backend(); service.backend = lambda *_: backend
    file = tmp_path / "a.wav"; file.write_bytes(b"x")

    invalid_region = params([file])
    invalid_region["sources"][0]["regions"] = [{"regionId": "r", "startFrame": 100, "endFrame": 100}]
    with pytest.raises(WorkerError) as caught:
        service.analyze(invalid_region, Event(), lambda _: None)
    assert caught.value.code == "INVALID_ANALYSIS_REQUEST"

    invalid_mapping = params([file])
    invalid_mapping["mappingOptions"] = {"multiLabel": "yes"}
    with pytest.raises(WorkerError) as caught:
        service.analyze(invalid_mapping, Event(), lambda _: None)
    assert caught.value.code == "INVALID_ANALYSIS_REQUEST"
    assert backend.calls == []


def test_concurrent_requests_share_one_inference_for_the_same_cache_key(tmp_path):
    started = Event()
    release = Event()

    class SlowBackend(Backend):
        def analyze_file(self, path):
            self.calls.append(path.name)
            started.set()
            assert release.wait(2)
            activations = [[0.0] * 5 for _ in range(30)]
            activations[5][0] = 0.8
            return ModelOutput(100, CLASS_NAMES, activations, 0.3, {})

    service = AnalysisService(ActivationCache(tmp_path / "cache")); backend = SlowBackend(); service.backend = lambda *_: backend
    file = tmp_path / "a.wav"; file.write_bytes(b"x"); request = params([file])
    results = []
    threads = [Thread(target=lambda: results.append(service.analyze(request, Event(), lambda _: None)[0])) for _ in range(2)]
    threads[0].start(); assert started.wait(1); threads[1].start(); release.set()
    for thread in threads: thread.join(2)
    assert all(not thread.is_alive() for thread in threads)
    assert len(results) == 2
    assert backend.calls == ["a.wav"]
