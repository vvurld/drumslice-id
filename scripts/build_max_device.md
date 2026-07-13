# Build the Max for Live device

1. From the repository root, run `node scripts/build_max_js_bundle.js`, then require `node scripts/build_max_js_bundle.js --check` to pass. The generated Max-compatible controller bundles are committed build inputs, not optional scratch files.
2. Run `node scripts/build_max_device.js`. The deterministic development builder reads the existing AMPF MIDI Effect as its host-format template, replaces its functional patch graph and parameters from `max/patchers/SliceLabeler.maxpat`, clears saved dependency paths, and atomically rewrites `dist/Slice Labeler.amxd`.
3. Require both `node scripts/build_max_device.js --check` and `node scripts/verify_max_device.js` to pass. A failure means the generated binary is stale, malformed, contains runtime-saved state, or exposes development/user paths.
4. Register and install the exact build with `scripts/install_local.sh`. This creates the `SliceLabeler` package link under `~/Documents/Max 9/Packages` and copies the AMXD into Ableton's User Library. Restart/rescan Live when necessary.
5. Confirm the main controller is `js slice_labeler_bundle_v2.js`; Results and Settings use their own v2 bundles; the Node object is `node.script orchestrator_loader.js @autostart 1 @defer 1 @restart 0`; and `midiin` is connected directly to `midiout`.
6. Run `scripts/check_backend.py --python ~/.slice-labeler/venv/bin/python` before testing Analyze. The check intentionally tests the installed worker without letting the repository source shadow it.
7. Run `tests/manual/LIVE_12_TEST_CHECKLIST.md` against the exact generated binary before publishing.

If Max host-format metadata itself must be refreshed, create a fresh stock **Max MIDI Effect** in Live, copy the complete source graph into it, save it once as the new AMXD template, and then return to the deterministic build/check commands. Do not use an older Slice Labeler patch graph as the source of truth.

The repository commits `dist/Slice Labeler.amxd` for convenient development reinstallation. It is expected to use the separately installed `SliceLabeler` package and is not, by itself, a complete end-user installation.

For release distribution, create and test a clean freeze that contains all project-owned Max patchers, JavaScript bundles, Node files, and schemas without absolute developer paths or a repository symlink. Keep Python, ADTOF source, model weights, and the virtual environment external unless their redistribution rights have been explicitly cleared. A frozen Max device is not enough on its own to make the classifier stack legally or operationally redistributable.
