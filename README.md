# Slice Labeler for Ableton Live 12

Slice Labeler is a source-first Max for Live MIDI Effect that labels the existing regions in a sliced Drum Rack without changing the user’s slices. It scans the first downstream top-level Drum Rack, analyzes each unique source file once through a local ADTOF worker, presents a dry-run naming plan, and writes only `Chain.name` after Apply.

## Development quick start

```sh
npm test --prefix max/node
PYTHONPATH=python pytest -q tests/python
python3 scripts/create_test_fixtures.py
```

Install the production backend only when you choose to:

```sh
./scripts/setup_backend.sh
```

The production dependency set currently supports CPython 3.10, 3.11, or 3.12. The installer creates a dedicated environment under `~/.slice-labeler`, installs the exact versions in `python/requirements.lock`, verifies the installed worker and model weights, and writes the selected interpreter to `~/.slice-labeler/backend-config.json`.

The activation cache defaults to 512 MiB. Advanced installations can set `SLICE_LABELER_CACHE_MAX_MIB` to a whole number from 1 through 102400 before starting Live.

Install the committed development device and its Max package into the standard local folders:

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

Restart Live or rescan the User Library after installation. The backend and Max-device installers are separate so loading or copying the `.amxd` never downloads software implicitly.

Then open `max/SliceLabeler.maxproj` in Max. See `scripts/build_max_device.md` for the source-device build and `docs/USER_GUIDE.md` for use in Live.

For an implementation-level explanation of the Live Object Model scan, process boundaries, pinned ADTOF preprocessing and Frame_RNN, onset-to-slice classification, caching, naming, and Apply/Revert safety, see [`docs/TECHNICAL_REFERENCE.md`](docs/TECHNICAL_REFERENCE.md).

The generated development device is committed as `dist/Slice Labeler.amxd` for convenient local reinstallation. It resolves the separately installed `SliceLabeler` Max package at runtime; copying that `.amxd` alone to another machine is not a complete installation. Third-party model code, model weights, backend virtual environments, and user-provided copyrighted audio are not committed.

This development artifact is not yet a commercially redistributable product. A public release needs a clean, self-contained freeze of project-owned Max/JavaScript/Node assets, installation and host acceptance on every supported platform, code-signing/notarization or an installer strategy where applicable, and resolved redistribution rights for the classifier and its weights. In particular, the pinned `adtof-pytorch` revision has no declared license and its upstream project is marked CC BY-NC-SA 4.0; see `THIRD_PARTY_NOTICES.md` and `KNOWN_LIMITATIONS.md` before distributing or selling the device.
