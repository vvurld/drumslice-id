import os
from pathlib import Path
from threading import Event

from slice_labeler_worker.backends.base import BackendHealth, CLASS_NAMES, ModelOutput
from slice_labeler_worker.cache import ActivationCache
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
        return ModelOutput(100, CLASS_NAMES, [[0.8, 0, 0, 0.7, 0]], 0.01, {})


class CompanionBackend(Backend):
    def analyze_file(self, path):
        self.calls.append(path.name)
        activations = [[0.0] * 5 for _ in range(100)]
        activations[0][0] = 0.8
        activations[50][1] = 0.8
        return ModelOutput(100, CLASS_NAMES, activations, 1.0, {"audioSource": "companion"})


def params(paths):
    return {"backend": "test", "modelOptions": {}, "mappingOptions": {}, "sources": [{"sourceId": f"id-{i}", "path": str(path), "sampleRateFromLive": 1000, "regions": [{"regionId": f"r-{i}", "startFrame": 0, "endFrame": 10}]} for i, path in enumerate(paths)]}


def test_cache_roundtrip_corruption_and_lru_key_behavior(tmp_path):
    cache = ActivationCache(tmp_path)
    cache.set("a", {"value": 1})
    assert cache.get("a") == {"value": 1}
    cache.path("a").write_text("corrupt")
    assert cache.get("a") is None


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
    try:
        service.analyze(params(files), cancel, progress)
    except WorkerError as error:
        assert error.code == "ANALYSIS_CANCELLED"
    assert backend.calls == ["a.wav"]


def test_cached_source_avoids_second_inference(tmp_path):
    service = AnalysisService(ActivationCache(tmp_path / "cache")); backend = Backend(); service.backend = lambda *_: backend
    file = tmp_path / "a.wav"; file.write_bytes(b"x"); request = params([file])
    service.analyze(request, Event(), lambda _: None); service.analyze(request, Event(), lambda _: None)
    assert backend.calls == ["a.wav"]


def test_rex_companion_scales_live_slice_times_to_decoded_audio(tmp_path):
    service = AnalysisService(ActivationCache(tmp_path / "cache"))
    backend = CompanionBackend()
    service.backend = lambda *_: backend
    request = {
        "backend": "test",
        "modelOptions": {},
        "mappingOptions": {},
        "sources": [{
            "sourceId": "rex-source",
            "path": str(tmp_path / "break.rx2"),
            "sampleRateFromLive": 1000,
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
