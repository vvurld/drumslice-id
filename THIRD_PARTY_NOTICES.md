# Third-party notices

DrumSLICE ID's repository and release bundle contain project-owned code under the MIT License. They do **not** contain ADTOF source code, converted model weights, a Python virtual environment, or user audio.

## Optional ADTOF PyTorch backend

- Source: [xavriley/ADTOF-pytorch](https://github.com/xavriley/ADTOF-pytorch)
- Pinned revision: `85c192e78f716ea0b111cc8a5ee4a8f6a3a4f8a9`
- Package version at that revision: `0.1.0`
- Used API: audio preprocessing, model construction, packaged-weights lookup, strict weight loading, and five frame-activation streams
- Expected label order: `[35, 38, 47, 42, 49]`
- License status at review: the pinned repository has no license file and its `pyproject.toml` declares no license. The converted weights have no separate license notice visible in that repository. Public availability is not permission to redistribute or use copyrighted material.

The port describes itself as derived from [MZehren/ADTOF](https://github.com/MZehren/ADTOF). Upstream ADTOF is licensed [Creative Commons Attribution-NonCommercial-ShareAlike 4.0](https://github.com/MZehren/ADTOF/blob/master/LICENSE). That NonCommercial license is not compatible with a future paid DrumSLICE ID backend, and it does not resolve the separate port/converted-weight uncertainty.

The platform installers download the pinned port only after the user supplies `--accept-adtof-license`, `-AcceptAdtofLicense`, or the matching explicit environment flag. This acknowledgement is a disclosure, not a warranty or legal determination. The external backend path is intended only for free, noncommercial, experimental alpha testing. Users—including musicians releasing commercial work—must assess whether their intended use is permitted.

DrumSLICE ID does not call or copy the port's MIDI/peak-post-processing implementation. Project-owned `events.py` independently converts the returned activation matrix to local-prominence events before slice mapping.

## Pinned backend dependency set

`python/requirements.lock` is the exact external-backend install manifest verified on macOS arm64 with Python 3.10.19:

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

Setup also pins `pip 26.1.2` and `setuptools 80.9.0`. Exact pins improve reproducibility; they do not grant redistribution rights. Binary wheels may contain additional native-library notices. A commercial or backend-bundled release requires a complete dependency-license audit and explicit permission or a replacement model with commercially redistributable code and weights.

This inventory is not legal advice.
