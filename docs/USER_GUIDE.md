# User guide

## Setup

Run `scripts/setup_backend.sh` (macOS) or `scripts/setup_backend.ps1` (Windows) yourself with CPython 3.10, 3.11, or 3.12. This creates a dedicated environment under your user profile, installs the exact dependency set in `python/requirements.lock`, runs an installed-package health check with strict model-weight loading, and writes only the Python executable and backend revision to `~/.slice-labeler/backend-config.json`. Loading the device never installs or downloads anything.

For repository development, run `scripts/install_local.sh` to install the committed development device and symlink its required `SliceLabeler` Max package. Copying `dist/Slice Labeler.amxd` alone is insufficient. To rebuild the editable source, follow `scripts/build_max_device.md`. Place the resulting MIDI Effect immediately before the sliced Drum Rack on the same MIDI track.

## Workflow

1. Choose a downstream rack, or leave the nearest rack selected.
2. Press Scan. Empty and unsupported pads are ignored or reported; nothing in the Set changes.
3. Press Analyze. Each unique source is inferred at most once per valid cache key. Chain names remain unchanged.
4. Open Results, review all five scores and warnings (scores are not calibrated probabilities), edit names, or mark rows Keep Original. Enable overwrite conflicts only when you intentionally want Apply to replace names changed after Analyze.
5. Press Apply. If markers or sample identity changed, the whole plan becomes stale. Manual name changes are conflicts and are skipped by default.
6. Press Revert Last Apply to restore only names that still equal the previously applied value.

Unknown means evidence was weak or analysis failed; it is intentionally not forced into a drum class.

For layered breaks, the score columns retain overlapping class evidence, but generated names follow the normalized dominant hit. A secondary class is added only when its evidence is genuinely comparable to the dominant class. Fallback analysis also stops before the next slice boundary so a following transient cannot be mislabeled as part of the current slice.

Live can decode REX/RX2 files that the ADTOF audio loader cannot. For those sources, Slice Labeler looks for an exact-stem WAV, AIFF, FLAC, MP3, or M4A companion, scales Live's slice times to the companion duration using Live's full source length, and analyzes it without replacing the rack's source or changing markers. Results include a companion-audio warning. If no matching companion exists, the source is reported as unsupported instead of being silently mislabeled.

Cancel is immediate from the device's point of view and restarts only Slice Labeler's dedicated Python worker. This guarantees stale work cannot refill a cache after Clear Cache, but the next Analyze pays the cold model-load cost again.

The Settings controls are persisted as Max for Live parameters. Their defaults are restored by Live/Max, then read by the settings controller; opening Settings does not reset saved values. **Backend Python path** must be the executable itself (for example `~/.slice-labeler/venv/bin/python`), not a virtual-environment folder.
