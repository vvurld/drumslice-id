# User guide

## Setup

From a release archive or complete repository clone, run [`install.sh`](../install.sh) on macOS or [`install.ps1`](../install.ps1) on Windows. The backend path requires CPython 3.10, 3.11, or 3.12 plus Git/network access. It creates a dedicated environment under your user profile, installs the exact dependency set in `python/requirements.lock`, runs an installed-package health check with strict model-weight loading, copies the complete Max package and AMXD, and verifies that the installed runtime matches the source. Loading the device itself never installs or downloads anything.

The external ADTOF backend is not part of the release. Its upstream NonCommercial license and the PyTorch port's missing license declaration require explicit acknowledgement; read [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) before continuing.

The default commands are:

```sh
./install.sh --accept-adtof-license
```

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1 -AcceptAdtofLicense
```

Restart Live or rescan its User Library, then load **User Library → Presets → MIDI Effects → Max MIDI Effect → DrumSLICE ID**. Both installers accept custom Max package, Ableton User Library, backend, configuration, and Python paths. Use `--help` on macOS or `Get-Help .\install.ps1 -Detailed` on Windows for the complete interface.

The copied installation does not depend on the archive or clone remaining in place. A self-locating uninstaller is copied to `~/.drumslice-id`; by default it removes only the AMXD and Max package. Use `--all`/`-All` only when you also want to remove the private backend and cache. Pre-rename users should also read [`MIGRATION.md`](MIGRATION.md).

For repository development, [`scripts/install_local.sh`](../scripts/install_local.sh) remains the opt-in symlink workflow. To rebuild the editable source, follow [`scripts/build_max_device.md`](../scripts/build_max_device.md). Copying `dist/DrumSLICE ID.amxd` alone is insufficient in either workflow; the package and backend are required. Place the resulting MIDI Effect immediately before the sliced Drum Rack on the same MIDI track.

## Workflow

1. Choose a downstream rack, or leave the nearest rack selected.
2. Press Scan. Empty and unsupported pads are ignored or reported; nothing in the Set changes.
3. Press Analyze. Each unique source is inferred at most once per valid cache key. Chain names remain unchanged.
4. Open Results, review all five scores and warnings (scores are not calibrated probabilities), edit names, or mark rows Keep Original. Enable overwrite conflicts only when you intentionally want Apply to replace names changed after Analyze.
5. Press Apply. If markers or sample identity changed, the whole plan becomes stale. Manual name changes are conflicts and are skipped by default.
6. Press Revert Last Apply to restore only names that still equal the previously applied value.

Unknown means evidence was weak or analysis failed; it is intentionally not forced into a drum class.

For layered breaks, the score columns retain overlapping class evidence, but generated names follow the normalized dominant hit. A secondary class is added only when its evidence is genuinely comparable to the dominant class. Fallback analysis also stops before the next slice boundary so a following transient cannot be mislabeled as part of the current slice.

Live can decode REX/RX2 files that the ADTOF audio loader cannot. For those sources, DrumSLICE ID looks for an exact-stem WAV, AIFF, FLAC, MP3, or M4A companion, scales Live's slice times to the companion duration using Live's full source length, and analyzes it without replacing the rack's source or changing markers. Results include a companion-audio warning. If no matching companion exists, the source is reported as unsupported instead of being silently mislabeled.

Cancel is immediate from the device's point of view and restarts only DrumSLICE ID's dedicated Python worker. This guarantees stale work cannot refill a cache after Clear Cache, but the next Analyze pays the cold model-load cost again.

The Settings controls are persisted as Max for Live parameters. Their defaults are restored by Live/Max, then read by the settings controller; opening Settings does not reset saved values. **Backend Python path** must be the executable itself (for example `~/.drumslice-id/venv/bin/python`), not a virtual-environment folder.
