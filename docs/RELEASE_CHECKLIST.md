# Release checklist

- Run Node and Python automated tests.
- Rebuild all generated Max JavaScript with `node scripts/build_max_js_bundle.js`, then require `node scripts/build_max_js_bundle.js --check` to pass.
- Validate all `.maxpat`, schema, and project files as JSON.
- Run `node scripts/build_max_device.js`, require its `--check` mode and `node scripts/verify_max_device.js` to pass, install that exact binary, and repeat the Live acceptance pass against it.
- Run the complete Live 12 manual checklist and record results in `IMPLEMENTATION_STATUS.md`.
- Confirm Scan and Analyze do not change chain names, MIDI clips, sample markers, macros, routing, sends, or choke groups.
- Confirm late and cancelled jobs cannot be applied.
- Confirm source cache hits avoid inference and Clear Cache forces the next inference.
- Review the current ADTOF-pytorch license status before any redistribution.
- Treat missing classifier/weights redistribution rights as a release blocker, not merely a notice. Keep the externally installed backend until explicit rights permit bundling.
- Audit and reproduce notices/licenses for every package in `python/requirements.lock`, including native libraries carried by binary wheels.
- Inspect the backend wheel manifest and reject `__pycache__`, `.pyc`, build-tree, or developer-path entries.
- Confirm no absolute user paths, Live IDs, Python environments, weights, logs, or sample audio are packaged.
- Test installation from a clean user account on each claimed platform. Confirm the release does not rely on a development symlink or the repository checkout.
- Freeze only project-owned Max/JavaScript/Node assets after a clean primary macOS setup pass. Do not bundle Python, model source, or weights without cleared rights.
- Plan versioning, update/uninstall behavior, signing/notarization or installer signing, support requirements, privacy disclosures, and purchase/license enforcement before a paid release.
- Do not claim performance without measuring cold inference and cache-hit timing on target machines.
