# Third-party notices

## ADTOF PyTorch

- Source: `https://github.com/xavriley/ADTOF-pytorch`
- Reviewed/pinned revision: `85c192e78f716ea0b111cc8a5ee4a8f6a3a4f8a9` (2025-11-11)
- Package version at that revision: `0.1.0`
- Direct API used: model construction, packaged weights lookup, audio preprocessing, weight loading, and frame activations. MIDI export is not used.
- Expected label order: `[35, 38, 47, 42, 49]`
- Default thresholds: `[0.22, 0.24, 0.32, 0.22, 0.30]`
- License status: the reviewed repository revision has no license file or license declaration in `pyproject.toml`. Rights for redistribution are therefore not established. The dependency and bundled weights are not vendored or redistributed by this repository; setup is explicit and user-run. Obtain legal/license confirmation before distribution.

The port derives from MZehren/ADTOF. The upstream ADTOF repository at reviewed revision `b3968fb332f69b65ee07c089fc62f436503755db` declares CC BY-NC-SA 4.0. That declaration does not resolve the separate PyTorch port’s missing license.
