# Decisions

## 2026-07-11

- Pinned the production adapter to the separate PyTorch port at `85c192e…`, because the supplied specification explicitly requires PyTorch while the primary MZehren/ADTOF repository is TensorFlow/Keras. Direct activations are obtained without MIDI export.
- Kept ADTOF entirely external and user-installed. The reviewed PyTorch revision has no explicit license; redistribution is not safe to assume.
- Implemented activation caching in the Python worker and source fingerprinting/grouping in Node. This keeps large activation arrays off the Max message bus while preserving the specified cache identity and one-inference-per-source behavior.
- Enabled only CPU in the production adapter. Hardware acceleration remains disabled until capability and Live-load testing can establish reliability.
- Committed editable `.maxpat` sources plus a generated development `.amxd`. The development artifact deliberately resolves the separately installed `DrumSliceID` Max package; a clean freeze of project-owned dependencies is a distinct release task.
- Used hand-written boundary validation in Node plus checked Python decoding; the versioned JSON Schemas remain the normative data contracts.

## 2026-07-12

- At that stage, replaced the prototype raw-local-maximum event detector with the pinned backend's standard `PeakPicker` behavior. This historical choice was superseded on 2026-07-14 by the project-owned detector below.
- Kept threshold-normalized dominant-class filtering for both matched clusters and activation fallback. In multi-label mode only near-tied secondary evidence (within 0.15 normalized score) is retained. This is an intentional product decision for layered breaks, where copying every weak simultaneous class produced misleading compound names.
- Ended fallback analysis 20 ms before the next slice boundary. This deliberate anti-bleed guard prevents a following slice's pre-onset smear from labeling a short or quiet current slice.
- Made Live's full sample length authoritative for REX/RX2 time scaling. A discovered companion is now included in the activation-cache identity by resolved path, size, and nanosecond mtime, so companion-backed analysis can be cached without reusing activations after the companion changes.
- Required strict model-weight loading and production-compatible CPython 3.10–3.12. A health check now rejects incomplete/incompatible weights instead of permitting a partially random model.
- Treated `dist/DrumSLICE ID.amxd` as a reinstallable development artifact, not a sale-ready binary. Commercial distribution remains gated on a self-contained project-owned freeze, cross-platform acceptance, and explicit rights to redistribute the classifier and weights.
- Gave the Results and Settings JavaScript bundles v2 runtime filenames while retaining generated legacy-name copies. Max can keep old project search paths ahead of an installed package; versioned names prevent a prior DrumSLICE ID project from silently loading stale UI controllers.
- Made Clear Cache remove only DrumSLICE ID's hashed activation artifacts, temporary cache files, and dedicated Numba subtree. An explicitly configured cache root may be shared with the diagnostic log or user-owned files, so deleting that root recursively is unsafe.
- Kept Max↔Node runtime snapshots/results as validated serialized JSON messages and reserved a named Max `Dict` for diagnostics export. This avoids duplicating large activation data in Max dictionaries and is host-proven for the current 15-region rack, but a 128-region host acceptance pass remains required.
- Recycle the device-owned Python child on Cancel. This makes preflight cancellation immediate and lets Clear Cache wait for definitive process exit, trading the next run's model-reload cost for stale-result and stale-cache safety.
- Cache loaded backends only by true model identity, not thresholds or `maxThreads`; apply Torch's process-global thread count immediately before inference under the same lock used for model loading.

## 2026-07-13

- Made the root platform installers the ordinary clone-to-use workflow. They copy the Max runtime rather than symlinking it, so moving or deleting the clone cannot break an installed device. The existing `scripts/install_local.sh` remains explicitly development-only because live source edits benefit from its symlink.
- Kept backend installation explicit at installer execution time and never at device load. The unified installer may download the pinned backend only because the user deliberately ran it; the AMXD itself remains network-inert.
- Refuse to replace an existing unrecognized `DrumSliceID` package without a force flag. Installation uses a staging directory and backup/restore path, then verifies the complete runtime tree and AMXD against the checkout.
- Install a self-locating uninstaller beside the backend manifest. Default removal preserves the costly backend and cache; destructive backend/cache cleanup requires an explicit option.

## 2026-07-14

- Completed the runtime rename to DrumSLICE ID: `DrumSliceID` for the Max package/abstractions, `drumslice_id_worker` for Python, `drumslice-id` for slugs/state, and `DRUMSLICE_ID_` for environment variables. Legacy identifiers now appear only in documented migration aliases and safe old-install detection.
- Rebuild virtual environments at the canonical path instead of moving them because their launchers and package metadata contain absolute paths. Preserve the old backend until users explicitly remove it.
- Replaced the external port's peak-picker behavior with a project-owned local-median prominence detector and nearby-candidate suppression. ADTOF is now used only for preprocessing, weights/model loading, and frame activations.
- Publish the first release as `0.1.0-alpha.1`. Keep project-owned code MIT, keep ADTOF code/weights out of the repository and ZIP, require an explicit backend-status acknowledgement, and label the functional backend path free/noncommercial/experimental.
- Treat the release ZIP—not the small AMXD—as the installable unit. Build it deterministically with a complete file manifest and SHA-256 checksums, and verify it in CI.
