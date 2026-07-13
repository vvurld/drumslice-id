# Slice Labeler for Ableton Live 12

Slice Labeler is a source-first Max for Live MIDI Effect that labels the existing regions in a sliced Drum Rack without changing the user’s slices. It scans the first downstream top-level Drum Rack, analyzes each unique source file once through a local ADTOF worker, presents a dry-run naming plan, and writes only `Chain.name` after Apply.

## Install from a clone

Prerequisites:

- Ableton Live 12 with Max for Live;
- CPython 3.10, 3.11, or 3.12;
- Git and internet access for the pinned ADTOF/PyTorch backend; and
- enough free disk space for the local ML environment.

On macOS, clone the repository and run one command from its root:

```sh
./install.sh
```

On Windows, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

The installer checks the repository, creates a private backend environment under `~/.slice-labeler`, validates the model, copies the complete `SliceLabeler` Max package, copies the AMXD into the Ableton User Library, verifies the installed files, and prints the exact browser location. The Max runtime is copied rather than symlinked, so ordinary users can move or delete the clone afterward.

Restart Live or rescan the User Library, then open:

```text
User Library > Presets > MIDI Effects > Max MIDI Effect > Slice Labeler
```

Place the device immediately before the sliced Drum Rack on the same MIDI track.

Useful installer modes:

```sh
./install.sh --verify-only          # verify the existing complete installation
./install.sh --skip-backend         # copy only the Max package and AMXD
./install.sh --user-library "/custom/Ableton/User Library"
./install.sh --help                 # every path override and prerequisite
```

PowerShell exposes the corresponding `-VerifyOnly`, `-SkipBackend`, `-UserLibrary`, `-MaxPackagesDir`, `-InstallRoot`, and `-ConfigPath` parameters.

The installer places a self-locating uninstaller in the backend directory. A normal uninstall removes the device and Max package while retaining the large backend/cache for a quick reinstall; broader cleanup is explicit:

```sh
~/.slice-labeler/uninstall.sh
~/.slice-labeler/uninstall.sh --all
```

```powershell
& "$HOME\.slice-labeler\uninstall.ps1"
& "$HOME\.slice-labeler\uninstall.ps1" -All
```

## Development quick start

```sh
npm test --prefix max/node
PYTHONPATH=python pytest -q tests/python
python3 scripts/create_test_fixtures.py
```

Install or rebuild the production backend independently when needed:

```sh
./scripts/setup_backend.sh
```

The production dependency set currently supports CPython 3.10, 3.11, or 3.12. The installer creates a dedicated environment under `~/.slice-labeler`, installs the exact versions in `python/requirements.lock`, verifies the installed worker and model weights, and writes the selected interpreter to `~/.slice-labeler/backend-config.json`.

The activation cache defaults to 512 MiB. Advanced installations can set `SLICE_LABELER_CACHE_MAX_MIB` to a whole number from 1 through 102400 before starting Live.

For source development, install the committed device with a live symlink to `max/`:

```sh
./scripts/install_local.sh
```

After source changes, regenerate and verify the committed development artifact first:

```sh
node scripts/build_max_js_bundle.js
node scripts/build_max_js_bundle.js --check
node scripts/build_max_device.js
node scripts/build_max_device.js --check
node scripts/verify_max_device.js
```

The development symlink flow is intentionally separate from the copied end-user installation. Loading or copying the `.amxd` itself never downloads software implicitly.

Then open `max/SliceLabeler.maxproj` in Max. See `scripts/build_max_device.md` for the source-device build and `docs/USER_GUIDE.md` for use in Live.

For an implementation-level explanation of the Live Object Model scan, process boundaries, pinned ADTOF preprocessing and Frame_RNN, onset-to-slice classification, caching, naming, and Apply/Revert safety, see [`docs/TECHNICAL_REFERENCE.md`](docs/TECHNICAL_REFERENCE.md).

The generated development device is committed as `dist/Slice Labeler.amxd` for convenient local reinstallation. It resolves the separately installed `SliceLabeler` Max package at runtime; copying that `.amxd` alone to another machine is not a complete installation. Third-party model code, model weights, backend virtual environments, and user-provided copyrighted audio are not committed.

This development artifact is not yet a commercially redistributable product. A public release needs a clean, self-contained freeze of project-owned Max/JavaScript/Node assets, installation and host acceptance on every supported platform, code-signing/notarization or an installer strategy where applicable, and resolved redistribution rights for the classifier and its weights. In particular, the pinned `adtof-pytorch` revision has no declared license and its upstream project is marked CC BY-NC-SA 4.0; see `THIRD_PARTY_NOTICES.md` and `KNOWN_LIMITATIONS.md` before distributing or selling the device.
