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

## Pinned production dependency set

`python/requirements.lock` is the authoritative install manifest. The production environment verified on macOS arm64 with Python 3.10.19 contains these exact packages:

```text
adtof-pytorch 0.1.0 (Git revision above)
audioread 3.1.0; certifi 2026.6.17; cffi 2.1.0
charset-normalizer 3.4.9; decorator 5.3.1; filelock 3.29.7
fsspec 2026.6.0; idna 3.18; importlib-resources 7.1.0
Jinja2 3.1.6; joblib 1.5.3; lazy-loader 0.5; librosa 0.11.0
llvmlite 0.48.0; MarkupSafe 3.0.3; mido 1.3.3; mpmath 1.3.0
msgpack 1.2.1; networkx 3.4.2; numba 0.66.0; numpy 2.2.6
packaging 26.2; platformdirs 4.10.0; pooch 1.9.0; pretty-midi 0.2.11
pycparser 3.0; requests 2.34.2; scikit-learn 1.7.2; scipy 1.15.3
six 1.17.0; soundfile 0.14.0; soxr 1.1.0; sympy 1.14.0
threadpoolctl 3.6.0; torch 2.13.0; typing-extensions 4.16.0; urllib3 2.7.0
```

The setup scripts additionally pin build tooling to `pip 26.1.2` and `setuptools 80.9.0`. Exact version pinning improves reproducibility; it does not grant redistribution rights. Before shipping an installer or bundled backend, collect and reproduce every applicable dependency notice/license, confirm obligations for binary wheels and their bundled native libraries, and obtain explicit permission for `adtof-pytorch` and its converted weights. This file is a technical inventory, not legal advice.
