# User guide

## Setup

Run `scripts/setup_backend.sh` (macOS) or `scripts/setup_backend.ps1` (Windows) yourself. This creates a dedicated environment under your user profile, installs the reviewed ADTOF revision, runs a health check, and writes only the Python executable and backend revision to `~/.slice-labeler/backend-config.json`. Loading the device never installs or downloads anything.

Build the editable source in Max using `scripts/build_max_device.md`. Place the resulting MIDI Effect immediately before the sliced Drum Rack on the same MIDI track.

## Workflow

1. Choose a downstream rack, or leave the nearest rack selected.
2. Press Scan. Empty and unsupported pads are ignored or reported; nothing in the Set changes.
3. Press Analyze. Each unique source is inferred at most once per valid cache key. Chain names remain unchanged.
4. Open Results, review scores (they are not calibrated probabilities), edit names, or mark rows Keep Original.
5. Press Apply. If markers or sample identity changed, the whole plan becomes stale. Manual name changes are conflicts and are skipped by default.
6. Press Revert Last Apply to restore only names that still equal the previously applied value.

Unknown means evidence was weak or analysis failed; it is intentionally not forced into a drum class.

For layered breaks, the score columns retain overlapping class evidence, but generated names follow the normalized dominant hit. A secondary class is added only when its evidence is genuinely comparable to the dominant class. Fallback analysis also stops before the next slice boundary so a following transient cannot be mislabeled as part of the current slice.

Live can decode REX/RX2 files that the ADTOF audio loader cannot. For those sources, Slice Labeler looks for an exact-stem WAV/AIFF/FLAC companion, scales Live's slice times to the companion duration, and analyzes it without replacing the rack's source or changing markers. Results include a companion-audio warning. If no matching companion exists, the source is reported as unsupported instead of being silently mislabeled.
