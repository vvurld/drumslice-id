# Contributing

DrumSLICE ID welcomes focused bug fixes, tests, documentation, accessibility improvements, and classifier research that can be redistributed commercially. This is an alpha: open an issue before a large architectural change.

By contributing, you agree that your contribution is licensed under this repository's MIT License and that you have the right to submit it. Do not add proprietary samples, model weights, generated environments, personal paths, or code copied from an unlicensed project.

## Development checks

Use Node 18 or newer and CPython 3.10–3.12:

```sh
node scripts/build_max_js_bundle.js --check
node scripts/build_max_device.js --check
node scripts/verify_max_device.js
node --test tests/node/*.test.js
PYTHONPATH=python python -m pytest -q tests/python
python scripts/build_release.py --check
```

If you change editable JavaScript or the Max patch, rebuild the generated assets before committing. Host-dependent changes also require the relevant entries from `tests/manual/LIVE_12_TEST_CHECKLIST.md`, with versions and evidence recorded.

Classifier proposals must document the code license, weight license, training-data constraints, exact artifact hashes, CPU support on Apple silicon and Windows x64, and representative slice-level results. A repository license alone is not proof that separately downloaded weights may be redistributed.
