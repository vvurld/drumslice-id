"""Small setuptools hook that makes incremental wheel builds deterministic."""

from __future__ import annotations

import shutil
from pathlib import Path

from setuptools import setup
from setuptools.command.build_py import build_py


class CleanBuildPy(build_py):
    """Discard stale ignored files before setuptools repopulates build/lib."""

    def run(self) -> None:
        build_lib = Path(self.build_lib)
        if build_lib.exists():
            shutil.rmtree(build_lib)
        super().run()


setup(cmdclass={"build_py": CleanBuildPy})
