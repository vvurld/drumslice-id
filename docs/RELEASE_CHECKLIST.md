# Release checklist

- Run Node and Python automated tests.
- Validate all `.maxpat`, schema, and project files as JSON.
- Run the complete Live 12 manual checklist and record results in `IMPLEMENTATION_STATUS.md`.
- Confirm Scan and Analyze do not change chain names, MIDI clips, sample markers, macros, routing, sends, or choke groups.
- Confirm late and cancelled jobs cannot be applied.
- Confirm source cache hits avoid inference and Clear Cache forces the next inference.
- Review the current ADTOF-pytorch license status before any redistribution.
- Confirm no absolute user paths, Live IDs, Python environments, weights, logs, or sample audio are packaged.
- Freeze only after a clean primary macOS setup pass; do not claim performance without measuring it.
