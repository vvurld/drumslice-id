# DrumSLICE ID implementation contract

This repository implements the supplied build-ready specification for a Max for Live MIDI Effect that scans a downstream top-level Drum Rack, analyzes each unique backing file locally, proposes deterministic drum labels, and changes only supported Drum Rack chain names after an explicit Apply.

The normative runtime contracts are the JSON schemas in `max/schemas`; safety invariants, supported rack shape, mapping defaults, state transitions, apply/revert behavior, tests, and packaging requirements are documented in `docs/ARCHITECTURE.md`, `docs/USER_GUIDE.md`, and `tests/manual/LIVE_12_TEST_CHECKLIST.md`.

`DECISIONS.md` records deliberate implementation/calibration changes made after testing the supplied specification against the user's layered break. Event timing now uses a project-owned local-prominence picker over ADTOF's frame activations, while class naming retains only threshold-normalized near ties and activation fallback stops 20 ms before the next slice. Those choices replace the original “copy every clustered class” and full-to-boundary fallback rules because they produced misleading bleed labels; the raw class scores remain available for review.

The committed `dist/DrumSLICE ID.amxd` is a development/reinstallation artifact, not the release-distribution contract. It requires the installed `DrumSliceID` Max package. Root platform installers copy that package and configure the external backend for clone-based use; the AMXD alone remains insufficient. Commercial release requirements and third-party redistribution blockers are tracked in `docs/RELEASE_CHECKLIST.md`, `KNOWN_LIMITATIONS.md`, and `THIRD_PARTY_NOTICES.md`.

The immutable safety rules are: Scan and Analyze are read-only; slice markers and MIDI data are never written; unsupported structures are skipped; stale plans abort before writes; manual name conflicts are preserved; Live IDs never cross the Python boundary or persist; no model or package is downloaded during normal device operation.
