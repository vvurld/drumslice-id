# Build the Max for Live device

1. Register `max/` as a Max package named `SliceLabeler` (for development, a symlink under `~/Documents/Max 9/Packages/SliceLabeler` is sufficient), then restart Max.
2. In Live, add the stock **Max MIDI Effect** to the MIDI track and choose **Edit in Max**.
3. In Patching Mode, replace the stock shell contents with `max/patchers/SliceLabeler.maxpat`. Confirm `midiin` is connected directly to `midiout` and that the controller object names `slice_labeler_bundle_v2.js`.
4. In the Patcher Inspector enable **Open in Presentation**, save the patch as `dist/Slice Labeler.amxd`, and reload it in Live.
5. Run `scripts/check_backend.py` before testing Analyze.
6. For release distribution, freeze only project-owned Max/JavaScript files. Do not freeze or redistribute Python, ADTOF source, model weights, or a virtual environment.
7. Run `tests/manual/LIVE_12_TEST_CHECKLIST.md` before publishing.

The repository intentionally does not commit a generated `.amxd` binary; local development artifacts are ignored under `dist/`.
