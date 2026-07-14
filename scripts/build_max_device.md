# Build the Max for Live device

1. From the repository root, run `node scripts/build_max_js_bundle.js`, then require `node scripts/build_max_js_bundle.js --check` to pass. The generated Max-compatible controller bundles are committed build inputs, not optional scratch files.
2. Run `node scripts/build_max_device.js`. The deterministic development builder reads the existing AMPF MIDI Effect as its host-format template, replaces its functional patch graph and parameters from `max/patchers/DrumSliceID.maxpat`, clears saved dependency paths, and atomically rewrites `dist/DrumSLICE ID.amxd`.
3. Require both `node scripts/build_max_device.js --check` and `node scripts/verify_max_device.js` to pass. A failure means the generated binary is stale, malformed, contains runtime-saved state, or exposes development/user paths.
4. Register and install the exact build with `scripts/install_local.sh`. This creates the `DrumSliceID` package link under `~/Documents/Max 9/Packages` and copies the AMXD into Ableton's User Library. Restart/rescan Live when necessary.
5. Confirm the main controller is `js drumslice_id_bundle_v2.js`; Results and Settings use their own v2 bundles; the Node object is `node.script orchestrator_loader.js @autostart 1 @defer 1 @restart 0`; and `midiin` is connected directly to `midiout`.
6. Run `scripts/check_backend.py --python ~/.drumslice-id/venv/bin/python` before testing Analyze. The check intentionally tests the installed worker without letting the repository source shadow it.
7. Run `tests/manual/LIVE_12_TEST_CHECKLIST.md` against the exact generated binary before publishing.

If Max host-format metadata itself must be refreshed, create a fresh stock **Max MIDI Effect** in Live, copy the complete source graph into it, save it once as the new AMXD template, and then return to the deterministic build/check commands. Do not use an older DrumSLICE ID patch graph as the source of truth.

The repository commits `dist/DrumSLICE ID.amxd` for convenient development reinstallation. It is expected to use the separately installed `DrumSliceID` package and is not, by itself, a complete end-user installation.

For alpha distribution, run `python scripts/build_release.py` and require its `--check` mode to pass. The deterministic ZIP packages the AMXD together with all project-owned Max, JavaScript, Node, Python-adapter, schema, installer, and notice files. It deliberately excludes ADTOF source, model weights, virtual environments, caches, samples, and developer paths. The ZIP—not the AMXD alone—is the supported installation unit.
