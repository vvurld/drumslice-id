# Known limitations

- `0.1.0-alpha.1` is experimental. Back up important Live Sets and do not assume parameter-state migration from pre-rename device instances.
- The AMXD in `dist/` resolves the installed `DrumSliceID` Max package. The release ZIP is the installation unit; copying the AMXD alone omits required patchers, JavaScript, Node files, schemas, worker code, and backend configuration.
- The release ZIP excludes ADTOF source and weights. Functional classification requires the separately downloaded backend and explicit acknowledgement described in `THIRD_PARTY_NOTICES.md`.
- Upstream ADTOF is NonCommercial, and the pinned PyTorch port/converted weights have no declared license. The current backend path is unsuitable for sale or confident commercial-use claims.
- GitHub CI exercises the Windows PowerShell file-install flow, but a native Windows Live 12/Max host acceptance pass has not yet been recorded.
- Live Object Model traversal and writes cannot be proven outside Live. Mock-graph tests cover discovery, ordering, recursive Simpler traversal, staleness, conflicts, Apply, and Revert.
- Only ADTOF CPU inference at 100 FPS is enabled. Inference is serialized. Cancel discards the job and recycles the dedicated worker, so the next Analyze reloads the model.
- The independently implemented local-prominence picker retains existing class thresholds, but broad calibration still needs a representative multi-break corpus. ADTOF activations are ranking scores, not calibrated probabilities.
- Direct Simpler Slicing Mode, Sampler, multisample Simpler, multiple top-level chains per pad, multiple reachable Simplers, nested Drum Rack pads, and samples without readable files are skipped.
- REX/RX2 relies on a same-stem decodable companion and duration-ratio alignment. Multiple matches are selected by path proximity, not waveform identity.
- The Results table uses `jit.cellblock`; expanded score/warning columns and conflict controls remain host-version-sensitive.
- A 128-region structured-message host pass is still needed; the recorded supplied rack contains 15 regions.
- Apply is conflict-safe and read-back verified but not transactional across all rows. A later row failure does not roll back earlier verified writes.
- Separate simultaneous device instances do not share a cross-process cache-clear lock.
- CPython support is currently 3.10–3.12. No claim is made for newer versions.
- No public performance claim is made until cold load, inference, and cache-hit timing are recorded on supported target machines.
- The alpha archive is unsigned and not notarized. Users may encounter platform download/quarantine warnings.
