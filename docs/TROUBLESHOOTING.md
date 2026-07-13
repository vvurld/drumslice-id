# Troubleshooting

- `NO_DOWNSTREAM_DRUM_RACK`: move Slice Labeler before a top-level Drum Rack on the same MIDI track, then rescan.
- `BACKEND_NOT_INSTALLED`: run the explicit setup script or correct `~/.slice-labeler/backend-config.json`.
- `MODEL_WEIGHTS_MISSING`: reinstall the pinned ADTOF environment; the device will not download weights automatically.
- `SAMPLE_FILE_MISSING`: resolve the offline sample in Live. Other sources will continue.
- `UNSUPPORTED_AUDIO_FORMAT`: a REX/RX2 source has no exact-stem WAV, AIFF, FLAC, MP3, or M4A companion that ADTOF can decode.
- `COMPANION_DURATION_MISMATCH`: the companion audio is too different in duration to map the Live slice markers safely.
- `PLAN_STALE`: a rack, source, sample rate, or marker changed after analysis. Scan and Analyze again.
- `CHAIN_NAME_CONFLICT`: a name changed manually after analysis. The row was preserved.
- `WORKER_CRASHED`: inspect the bounded log in the OS cache directory. One same-job restart is attempted before this error is final.
- `ANALYSIS_CANCELLED`: the result was discarded, the dedicated worker was recycled, and it cannot reach Apply. The next Analyze reloads the model.
- `NO_ANALYZABLE_PADS`: every populated pad used an unsupported or ambiguous structure. Review the skipped reason, simplify that pad to exactly one reachable Simpler, then Scan again.

Logs redact likely user paths by default. Diagnostics exports can contain source paths and should be reviewed before sharing.
