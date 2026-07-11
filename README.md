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

Install the committed development device and its Max package into the standard local folders:

```sh
./scripts/install_local.sh
```

Restart Live or rescan the User Library after installation. The backend and Max-device installers are separate so loading or copying the `.amxd` never downloads software implicitly.

Then open `max/SliceLabeler.maxproj` in Max. See `scripts/build_max_device.md` for the source-device build and `docs/USER_GUIDE.md` for use in Live.

The generated development device is committed as `dist/Slice Labeler.amxd` for convenient local reinstallation. It resolves the committed `max/` package sources at runtime. Third-party model code, model weights, backend virtual environments, and user-provided copyrighted audio are not committed.
