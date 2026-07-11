# Troubleshooting

- `NO_DOWNSTREAM_DRUM_RACK`: move Slice Labeler before a top-level Drum Rack on the same MIDI track, then rescan.
- `BACKEND_NOT_INSTALLED`: run the explicit setup script or correct `~/.slice-labeler/backend-config.json`.
- `MODEL_WEIGHTS_MISSING`: reinstall the pinned ADTOF environment; the device will not download weights automatically.
- `SAMPLE_FILE_MISSING`: resolve the offline sample in Live. Other sources will continue.
- `UNSUPPORTED_AUDIO_FORMAT`: a REX/RX2 source has no exact-stem WAV/AIFF/FLAC companion that ADTOF can decode.
- `COMPANION_DURATION_MISMATCH`: the companion audio is too different in duration to map the Live slice markers safely.
- `PLAN_STALE`: a rack, source, sample rate, or marker changed after analysis. Scan and Analyze again.
- `CHAIN_NAME_CONFLICT`: a name changed manually after analysis. The row was preserved.
- `WORKER_CRASHED`: inspect the bounded log in the OS cache directory. One same-job restart is attempted before this error is final.
- `ANALYSIS_CANCELLED`: the result was discarded and cannot reach Apply.

Logs redact likely user paths by default. Diagnostics exports can contain source paths and should be reviewed before sharing.
