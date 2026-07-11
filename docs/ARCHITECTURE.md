# Architecture

This page is the concise architectural summary. See [TECHNICAL_REFERENCE.md](TECHNICAL_REFERENCE.md) for the full runtime, classification-model, preprocessing, mapping, safety, caching, and packaging reference.

The device has four boundaries. The Max patch owns controls, state display, dictionaries, and unconditional MIDI pass-through. `live_controller.js` is the only layer allowed to traverse Live objects or write Live state; its sole write path is `Chain.name`. The Node orchestrator validates snapshots, normalizes and fingerprints files, groups regions by source, manages cancellation and the long-lived Python child process, and strips Live IDs from each Python request. The Python worker loads one backend instance, caches frame activations, extracts and clusters events, and maps them to authoritative Live slice starts.

## Data and safety boundaries

- A rack snapshot contains session-only Live IDs and paths. It remains in Max/Node and is never persisted.
- Python receives source paths, source fingerprints, frame ranges, sample rates, and opaque region IDs—never Live object IDs.
- Cache keys include path, size, nanosecond mtime, backend/model/weight identity, and preprocessing version. Cached data contains activations and metadata, never audio.
- Analyze results cannot be applied unless the rack, chain, source path, sample rate, and markers still match. A changed chain name is a row conflict unless overwrite is explicitly enabled.
- Apply uses deferred LiveAPI writes and verifies each name by reading it back. Revert restores only chains whose name still equals the name written by the previous Apply.

## Mapping

ADTOF activation order is asserted as MIDI labels `35, 38, 47, 42, 49`, mapped explicitly to kick, snare, tom, hi-hat, and cymbal. Per-class peaks use thresholds `0.22, 0.24, 0.32, 0.22, 0.30`. Events within 18 ms are cross-class clustered. A cluster may be assigned to only one region, nearest to a slice start inside the −35/+90 ms window. When no peak matches, the first 100 ms region window is normalized by class thresholds and may fall back at a 0.70 floor.
