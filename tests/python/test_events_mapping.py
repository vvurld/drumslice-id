from slice_labeler_worker.backends.base import ModelOutput
from slice_labeler_worker.events import Event, EventCluster, cluster_events
from slice_labeler_worker.mapping import Region, activation_fallback, assign_clusters, map_regions


THRESHOLDS = {"kick": 0.22, "snare": 0.24, "tom": 0.32, "hihat": 0.22, "cymbal": 0.30}


def output(frames):
    return ModelOutput(100.0, ("kick", "snare", "tom", "hihat", "cymbal"), frames, len(frames) / 100, {})


def test_clusters_simultaneous_classes_but_not_distant_events():
    clustered = cluster_events([Event(1.0, "kick", 0.8), Event(1.01, "hihat", 0.7), Event(1.04, "snare", 0.9)], 18)
    assert len(clustered) == 2
    assert set(clustered[0].classes) == {"kick", "hihat"}


def test_assigns_cluster_to_only_nearest_adjacent_slice():
    regions = [Region("a", 0, 100, 1000), Region("b", 80, 200, 1000)]
    result = assign_clusters(regions, [EventCluster(0.075, {"kick": 1.0})], 35, 90)
    assert sum(len(items) for items in result.values()) == 1
    assert len(result["b"]) == 1


def test_pre_tolerance_and_post_window():
    region = Region("a", 100, 300, 1000)
    assert len(assign_clusters([region], [EventCluster(0.07, {"kick": 1})], 35, 90)["a"]) == 1
    assert assign_clusters([region], [EventCluster(0.191, {"kick": 1})], 35, 90)["a"] == []


def test_multi_and_single_label_event_mapping():
    region = Region("a", 0, 100, 1000)
    cluster = EventCluster(0.0, {"kick": 0.8, "hihat": 0.79})
    multi = map_regions([region], output([[0] * 5]), [cluster], THRESHOLDS, {"multiLabel": True})[0]
    single = map_regions([region], output([[0] * 5]), [cluster], THRESHOLDS, {"multiLabel": False})[0]
    assert set(multi["classes"]) == {"kick", "hihat"}
    assert single["classes"] == ["kick"]


def test_dominant_event_does_not_inherit_every_overlapping_class():
    region = Region("a", 0, 100, 1000)
    cluster = EventCluster(0.0, {"kick": 0.82, "hihat": 0.23, "cymbal": 0.50})
    prediction = map_regions([region], output([[0] * 5]), [cluster], THRESHOLDS, {"multiLabel": True})[0]
    assert prediction["classes"] == ["kick"]
    assert set(prediction["scores"]) == {"kick", "hihat", "cymbal"}


def test_fallback_top_close_second_and_unknown_floor():
    region = Region("a", 0, 100, 1000)
    classes, _ = activation_fallback(region, output([[0.19, 0.22, 0, 0, 0]]), THRESHOLDS, 0.70, True)
    assert classes == ["snare", "kick"]
    classes, _ = activation_fallback(region, output([[0.01] * 5]), THRESHOLDS, 0.70, True)
    assert classes == ["unknown"]


def test_fallback_excludes_next_slice_onset_bleed():
    frames = [[0.0] * 5 for _ in range(100)]
    frames[79][1] = 0.213  # snare evidence just before this slice boundary
    frames[79][3] = 0.132
    frames[88][0] = 0.897  # strong kick belonging to the next slice
    frames[88][3] = 0.292
    frames[88][4] = 0.585
    region = Region("slice-6", 803, 885, 1000)
    classes, scores = activation_fallback(region, output(frames), THRESHOLDS, 0.70, True)
    assert classes == ["snare"]
    assert scores["kick"] == 0.0
