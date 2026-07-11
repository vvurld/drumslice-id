# Decisions

## 2026-07-11

- Pinned the production adapter to the separate PyTorch port at `85c192e…`, because the supplied specification explicitly requires PyTorch while the primary MZehren/ADTOF repository is TensorFlow/Keras. Direct activations are obtained without MIDI export.
- Kept ADTOF entirely external and user-installed. The reviewed PyTorch revision has no explicit license; redistribution is not safe to assume.
- Implemented activation caching in the Python worker and source fingerprinting/grouping in Node. This keeps large activation arrays off the Max message bus while preserving the specified cache identity and one-inference-per-source behavior.
- Enabled only CPU in the production adapter. Hardware acceleration remains disabled until capability and Live-load testing can establish reliability.
- Added editable `.maxpat` source and build instructions instead of fabricating an `.amxd`.
- Used hand-written boundary validation in Node plus checked Python decoding; the versioned JSON Schemas remain the normative data contracts.
