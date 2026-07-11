# Known limitations

- The committed development `.amxd` in `dist/` depends on the locally installed `SliceLabeler` Max package. A self-contained redistribution freeze is still a separate release step.
- Rack discovery, scanning, production ADTOF analysis, REX2 companion resolution, and expanded Results rendering are host-verified in Live 12.4.2 (15 analyzed pads, 0 skipped, 0 unknown on the supplied break). Apply/Revert and expanded Results editing still require a production-backend acceptance pass.
- The expanded Results table uses `jit.cellblock`; its row editing behavior remains host-version-sensitive.
- Live Object Model traversal and writes cannot be validated by automated tests outside Live. Mock-graph tests cover ordering, recursive Simpler discovery, staleness, conflict handling, apply, and revert logic.
- Only the ADTOF CPU path is enabled. Inference cannot be interrupted inside a single source; cancellation is honored before the next source and before publishing the result.
- Direct Simpler Slicing Mode, Sampler, multisample Simpler, multiple chains per pad, multiple reachable Simplers, nested Drum Rack pads, and samples without readable files are deliberately skipped.
- The pinned ADTOF-pytorch revision does not declare a license. No source or weights may be redistributed until rights are established.
- ADTOF’s activations are ranking scores, not calibrated probabilities, and the initial mapping tolerances require validation on representative sliced breaks.
