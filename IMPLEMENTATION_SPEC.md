# Slice Labeler implementation contract

This repository implements the supplied build-ready specification for a Max for Live MIDI Effect that scans a downstream top-level Drum Rack, analyzes each unique backing file locally, proposes deterministic drum labels, and changes only supported Drum Rack chain names after an explicit Apply.

The normative runtime contracts are the JSON schemas in `max/schemas`; safety invariants, supported rack shape, mapping defaults, state transitions, apply/revert behavior, tests, and packaging requirements are documented in `docs/ARCHITECTURE.md`, `docs/USER_GUIDE.md`, and `tests/manual/LIVE_12_TEST_CHECKLIST.md`.

The immutable safety rules are: Scan and Analyze are read-only; slice markers and MIDI data are never written; unsupported structures are skipped; stale plans abort before writes; manual name conflicts are preserved; Live IDs never cross the Python boundary or persist; no model or package is downloaded during normal device operation.
