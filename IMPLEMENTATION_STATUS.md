# Implementation status

Updated: 2026-07-14

## Alpha candidate

- Product/version: DrumSLICE ID `0.1.0-alpha.1` (`0.1.0a1` for the Python package).
- Project-owned code: MIT. The optional functional classifier is installed separately and remains restricted to free, noncommercial, experimental alpha use; no ADTOF source, environment, or weights are committed or bundled.
- Release unit: the deterministic ZIP in `release/`, not the standalone AMXD. It contains the copied Max package, Node orchestration layer, Python adapter, installers, uninstallers, notices, and documentation.
- Candidate AMXD: AMPF v4 MIDI Effect, 40,171 bytes, SHA-256 `8f3ae84d3605e1721c4179d1934f103aa711ea82d951c980bdb999b834088263`; verification finds no saved user/development paths or embedded dependency table.
- Supported backend runtime: CPython 3.10–3.12, CPU-only inference, five classes in the fixed order kick/snare/tom/hi-hat/cymbal.

## Completed

- Completed the source/runtime rename from Slice Labeler to DrumSLICE ID. Canonical names are `DrumSliceID` for the Max package and abstractions, `drumslice_id_worker` for Python, `drumslice-id` for install state and slugs, and `DRUMSLICE_ID_` for environment variables.
- Added migration compatibility for recognized pre-rename installs. Legacy environment variables and a legacy configured worker can still be read; old Max artifacts are replaced only when positively identified; old environments and caches require explicit removal.
- Implemented downstream Drum Rack discovery, 128-pad scan, single-chain enforcement, recursive nested-Instrument-Rack Simpler discovery, exact Sample marker extraction, opaque region IDs, dry-run construction, stale-plan validation, conflict-safe deferred `Chain.name` Apply, read-back verification, and conflict-safe session Revert.
- Implemented source grouping/fingerprinting, bounded atomic activation caches, JSON Lines worker transport, health/cancellation/restart, immutable in-flight settings, and structured errors. Live IDs remain inside the Max/Node boundary and are never persisted or sent to Python.
- Isolated ADTOF behind a separately installed adapter. The release builder excludes external source, weights, virtual environments, caches, logs, and sample audio. Backend setup requires explicit acknowledgement in both platform installers and direct setup scripts.
- Replaced copied peak-picker behavior with the project-owned local-median prominence detector documented in `docs/TECHNICAL_REFERENCE.md`. ADTOF supplies preprocessing, model/weights loading, and frame activations only.
- Added clone-and-run macOS and Windows installers with copied runtimes, path overrides, prerequisite checks, verification-only mode, repair behavior, recognized-legacy migration, clear summaries, and matching self-locating uninstallers. `scripts/install_local.sh` remains the development symlink workflow.
- Added deterministic version checks, Max bundle/device builds, a backend-free release ZIP, a complete file manifest, SHA-256 checksums, GitHub Actions CI/release workflows, Dependabot, issue forms, a pull-request template, security/support/contribution policies, changelog, migration guide, and alpha release notes.
- Automated verification passes: 85 Node tests and 49 Python tests. Coverage includes installers, AMPF structure, Max controller/runtime behavior, scan/plan/apply/revert invariants, worker lifecycle and races, result validation, settings, cache safety, REX companion identity/scaling, source failures, event extraction, and classification mapping.
- Completed a clean isolated macOS ZIP install/verify/uninstall pass and a clean full backend install using Python 3.10.19. Strict health loaded the expected five-class model and pinned weights with SHA-256 `1bc986e596ec47ba0b44916f87cd4a39f0b2bec23596df3fb5d0e87749217320`.
- Installed the canonical candidate on the target machine. The package and device are copied rather than symlinked, the new backend/config live under `~/.drumslice-id`, and the recognized old Max package was removed while the old backend was preserved.
- Host-tested the prepared 15-slice REX2 break with its same-stem companion: 15 predictions, zero per-source errors, and slice 6 resolves to snare rather than kick. The Results window rendered all 15 rows, five score columns, zero skipped, and zero unknown rows in the recorded acceptance run.
- Verified cancellation during production preflight returns `ANALYSIS_CANCELLED`, the dedicated child exits before cache maintenance, and a subsequent analysis starts a fresh worker without accepting stale output.

## Open acceptance work

- The current candidate opens in Ableton Live 12.4.2, discovers the prepared downstream rack, and displays `Ready`. The desktop automation layer can select the device but cannot activate the embedded Max presentation controls, so the final candidate's Apply/Revert/conflict/staleness click-through is recorded as Not Run rather than inferred from controller tests or an earlier host pass.
- A native Windows Max/Live acceptance pass remains open. CI covers the Windows PowerShell file-install/verify/uninstall workflow after publication; it is not a substitute for a Windows DAW host pass.
- A clean 128-region host run, non-ASCII/path-with-spaces host run, transport stress pass, and multi-rack host pass remain open.
- Cold model load, cold inference, and cache-hit timing have not been recorded, so no performance claim is made.
- Signing/notarization and a classifier with clearly redistributable commercial rights are required before any paid release.

## Verification commands

- `node scripts/check_versions.js`
- `node scripts/build_max_js_bundle.js --check`
- `node scripts/build_max_device.js --check`
- `node scripts/verify_max_device.js`
- `node --test tests/node/*.test.js`
- `PYTHONPATH=python python -m pytest -q tests/python`
- `python scripts/build_release.py --check`
- JSON parsing for every `.json`, `.maxpat`, and `.maxproj`
- `shellcheck` for every committed shell script
- Isolated macOS ZIP install, verify-only, repair/uninstall safety, and full backend health checks
- Installed-host scan/analyze/results and cancellation/restart acceptance against the supplied break

Detailed item-by-item host evidence and Not Run entries are in `tests/manual/LIVE_12_TEST_CHECKLIST.md`.
