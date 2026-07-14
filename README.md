# DrumSLICE ID for Ableton Live 12

> **Alpha software:** `0.1.0-alpha.1` is intended for testing and feedback. Back up important Live Sets and review the classifier licensing notice below.

DrumSLICE ID is a Max for Live MIDI Effect that identifies kick, snare, tom, hi-hat, and cymbal content in the existing regions of a sliced Drum Rack. It never changes the slices. It analyzes each unique source once, presents a dry-run naming plan, and writes only `Chain.name` after an explicit Apply.

## Classifier and licensing

The project-owned code is available under the MIT License. The functional alpha currently uses an optional, separately downloaded ADTOF-pytorch backend:

- upstream ADTOF is licensed CC BY-NC-SA 4.0;
- the pinned PyTorch port does not declare a separate license for its code or converted weights; and
- this repository and its release archive contain neither ADTOF source nor model weights.

Backend installation therefore requires an explicit acknowledgement and is intended for **free, noncommercial, experimental use**. The MIT License for our code does not grant rights to the external backend. Do not sell or commercially redistribute a backend-equipped build. See [Third-party notices](THIRD_PARTY_NOTICES.md) for the exact revision and status.

## Install

Prerequisites:

- Ableton Live 12 with Max for Live;
- CPython 3.10, 3.11, or 3.12;
- Git and internet access when installing the external backend; and
- enough disk space for a private PyTorch environment.

Download the release archive, verify it against `SHA256SUMS`, extract it, and run one command from its root.

macOS:

```sh
./install.sh --accept-adtof-license
```

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1 -AcceptAdtofLicense
```

To install only the device and MIT-licensed project runtime, use `--skip-backend` or `-SkipBackend`. Analysis will remain unavailable until a compatible backend is configured.

The installer validates its input, builds a private environment under `~/.drumslice-id`, copies the complete `DrumSliceID` Max package and AMXD, verifies the installed files, and prints their exact locations. It never modifies a Live Set. The installed runtime is copied rather than symlinked, so the extracted archive can be moved or deleted afterward.

Restart Live or rescan the User Library, then open:

```text
User Library > Presets > MIDI Effects > Max MIDI Effect > DrumSLICE ID
```

Place the device immediately before the sliced Drum Rack on the same MIDI track. Read the [User guide](docs/USER_GUIDE.md) before applying names.

Useful modes:

```sh
./install.sh --verify-only
./install.sh --skip-backend
./install.sh --user-library "/custom/Ableton/User Library"
./install.sh --help
```

PowerShell exposes the matching `-VerifyOnly`, `-SkipBackend`, `-UserLibrary`, `-MaxPackagesDir`, `-InstallRoot`, and `-ConfigPath` parameters.

The self-locating uninstaller preserves the large backend and cache by default:

```sh
~/.drumslice-id/uninstall.sh
~/.drumslice-id/uninstall.sh --all
~/.drumslice-id/uninstall.sh --remove-legacy
```

```powershell
& "$HOME\.drumslice-id\uninstall.ps1"
& "$HOME\.drumslice-id\uninstall.ps1" -All
```

Upgrading a pre-rename development install requires a new device instance; see [Migration](docs/MIGRATION.md).

## What the alpha does

1. Discovers downstream Drum Racks without changing Live state.
2. Scans each populated pad for exactly one supported Simpler source and its existing region markers.
3. Runs one local inference per unique source/cache identity.
4. Maps five-class activation peaks to the authoritative slice starts.
5. Shows the proposed names, all class scores, skipped rows, and warnings.
6. Applies only validated, non-conflicting `Chain.name` writes and verifies them by reading back.
7. Reverts the most recent Apply only where the written name is still unchanged.

Scores are ranking evidence, not calibrated probabilities. Unknown or skipped slices are preserved instead of being forced into a class.

## Development

Use Node 18 or newer and CPython 3.10–3.12:

```sh
node scripts/check_versions.js
node scripts/build_max_js_bundle.js --check
node scripts/build_max_device.js --check
node scripts/verify_max_device.js
node --test tests/node/*.test.js
PYTHONPATH=python python -m pytest -q tests/python
python scripts/build_release.py --check
```

For live source development, run `./scripts/install_local.sh` and open `max/DrumSliceID.maxproj` in Max. Rebuild generated bundles and `dist/DrumSLICE ID.amxd` after source changes. The committed AMXD is a small development artifact that resolves the copied `DrumSliceID` package; copying it alone is not an installation.

The deterministic release builder creates a backend-free ZIP, file manifest, and checksums in `release/`:

```sh
python scripts/build_release.py
python scripts/build_release.py --check
```

Architecture and classification details are documented in [Technical reference](docs/TECHNICAL_REFERENCE.md). See [Known limitations](KNOWN_LIMITATIONS.md), [Release checklist](docs/RELEASE_CHECKLIST.md), [Contributing](CONTRIBUTING.md), [Support](SUPPORT.md), and [Security](SECURITY.md) before publishing changes or reports.
