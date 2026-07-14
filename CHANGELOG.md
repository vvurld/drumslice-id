# Changelog

All notable changes are recorded here. Versions follow semantic versioning; Python package metadata uses the equivalent PEP 440 form.

## 0.1.0-alpha.1 — 2026-07-14

- Renamed the complete runtime from Slice Labeler to DrumSLICE ID, including the Max package, abstractions, generated bundles, Python module, caches, configuration paths, environment variables, schemas, and installer state.
- Added safe upgrade handling for recognized legacy Max/device files and read-only aliases for legacy environment variables and backend configuration.
- Replaced third-party-derived peak-processing behavior with an independently implemented local-prominence and refractory-window event extractor.
- Kept ADTOF-pytorch external and optional. Releases contain no ADTOF source or weights, and backend installation now requires an explicit noncommercial/license-status acknowledgement.
- Added copied macOS and Windows installers, matching uninstallers, verification/repair modes, path overrides, and deterministic installation manifests.
- Added deterministic AMXD and release builds, file manifests, SHA-256 checksums, aligned runtime version checks, and release-integrity tests.
- Added GitHub Actions CI for macOS, Windows, and Linux, including a native Windows file-install smoke test.
- Added contribution, security, support, conduct, issue, pull-request, migration, release, and troubleshooting documentation.
- Refined the compact DrumSLICE ID interface and retained conflict-safe dry-run, Apply, and Revert behavior.

This alpha is not commercially release-ready. See `THIRD_PARTY_NOTICES.md` and `KNOWN_LIMITATIONS.md`.
