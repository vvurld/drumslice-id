# DrumSLICE ID 0.1.0-alpha.1

This is the first public alpha of DrumSLICE ID, a Max for Live MIDI Effect that identifies kick, snare, tom, hi-hat, and cymbal content in existing sliced Drum Racks and prepares conflict-safe chain names.

## Important alpha terms

- The project-owned source is MIT-licensed.
- Classification currently depends on an optional external ADTOF-pytorch backend. Upstream ADTOF is CC BY-NC-SA 4.0, while the pinned PyTorch port does not declare a separate license for its code or converted weights.
- The release archive does not contain ADTOF code or weights. Backend download requires explicit acknowledgement and is intended only for free, noncommercial, experimental alpha use.
- Do not sell or commercially redistribute a backend-equipped build. Commercial musicians should independently assess whether the external backend's NonCommercial restriction permits their intended use.
- Windows file installation is exercised in CI, but native Windows Live/Max acceptance remains open. Treat Windows support as experimental.

## Install

Verify `SHA256SUMS`, extract the archive, then run:

```sh
./install.sh --accept-adtof-license
```

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1 -AcceptAdtofLicense
```

Use `--skip-backend` or `-SkipBackend` to install only the device and project-owned Max runtime.

Read `README.md`, `THIRD_PARTY_NOTICES.md`, `KNOWN_LIMITATIONS.md`, and `docs/MIGRATION.md` before testing. Report reproducible defects through the repository templates without attaching copyrighted audio or unredacted private paths.
