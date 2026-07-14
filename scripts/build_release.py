#!/usr/bin/env python3
"""Build a deterministic, backend-free DrumSLICE ID alpha bundle."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import tempfile
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FIXED_ZIP_TIME = (1980, 1, 1, 0, 0, 0)
EXECUTABLES = {"install.sh", "uninstall.sh", "scripts/setup_backend.sh", "scripts/check_backend.py"}
ROOT_FILES = (
    "VERSION",
    "LICENSE",
    "README.md",
    "CHANGELOG.md",
    "CODE_OF_CONDUCT.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "SUPPORT.md",
    "THIRD_PARTY_NOTICES.md",
    "KNOWN_LIMITATIONS.md",
    "install.sh",
    "install.ps1",
    "uninstall.sh",
    "uninstall.ps1",
)
DIRECTORY_FILES = {
    "dist": {".amxd"},
    "max": {".json", ".js", ".maxpat", ".maxproj"},
    "python": {".py", ".toml", ".lock"},
    "scripts": {".py", ".js", ".sh", ".ps1", ".md"},
    "docs": {".md"},
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def release_files() -> list[Path]:
    files: list[Path] = []
    for relative in ROOT_FILES:
        path = ROOT / relative
        if path.is_file():
            files.append(path)
    for directory, suffixes in DIRECTORY_FILES.items():
        for path in (ROOT / directory).rglob("*"):
            relative = path.relative_to(ROOT)
            if not path.is_file() or path.name == ".DS_Store":
                continue
            if any(part in {"build", "__pycache__", ".pytest_cache"} or part.endswith(".egg-info") for part in relative.parts):
                continue
            if path.suffix.lower() in suffixes:
                files.append(path)
    return sorted(set(files), key=lambda path: path.relative_to(ROOT).as_posix())


def zip_entry(relative: str, data: bytes, executable: bool) -> tuple[zipfile.ZipInfo, bytes]:
    info = zipfile.ZipInfo(relative, FIXED_ZIP_TIME)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.create_system = 3
    info.external_attr = ((0o755 if executable else 0o644) & 0xFFFF) << 16
    return info, data


def build(output_dir: Path) -> dict[str, Path]:
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    stem = f"DrumSLICE-ID-{version}"
    output_dir.mkdir(parents=True, exist_ok=True)
    archive = output_dir / f"{stem}.zip"
    manifest_path = output_dir / f"{stem}.manifest.json"
    checksums_path = output_dir / "SHA256SUMS"
    file_records: list[dict[str, object]] = []
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        for path in release_files():
            relative = path.relative_to(ROOT).as_posix()
            data = path.read_bytes()
            info, payload = zip_entry(f"{stem}/{relative}", data, relative in EXECUTABLES)
            bundle.writestr(info, payload, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
            file_records.append({"path": relative, "bytes": len(data), "sha256": sha256(data)})
    archive_data = archive.read_bytes()
    manifest = {
        "schemaVersion": 1,
        "product": "DrumSLICE ID",
        "version": version,
        "channel": "alpha",
        "archive": {"name": archive.name, "bytes": len(archive_data), "sha256": sha256(archive_data)},
        "containsAdtofCodeOrWeights": False,
        "files": file_records,
    }
    manifest_data = (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode()
    manifest_path.write_bytes(manifest_data)
    checksums_path.write_text(
        f"{sha256(archive_data)}  {archive.name}\n{sha256(manifest_data)}  {manifest_path.name}\n",
        encoding="utf-8",
    )
    return {"archive": archive, "manifest": manifest_path, "checksums": checksums_path}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify committed release artifacts without changing them")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "release")
    args = parser.parse_args()
    if not args.check:
        artifacts = build(args.output_dir)
        print(json.dumps({key: os.fspath(value) for key, value in artifacts.items()}, indent=2))
        return 0
    with tempfile.TemporaryDirectory(prefix="drumslice-id-release-") as temporary:
        expected = build(Path(temporary))
        mismatches = []
        for key, generated in expected.items():
            committed = args.output_dir / generated.name
            if not committed.is_file() or committed.read_bytes() != generated.read_bytes():
                mismatches.append(committed.name)
        if mismatches:
            parser.error(f"release artifacts are missing or stale: {', '.join(mismatches)}")
    print(json.dumps({"ok": True, "outputDir": os.fspath(args.output_dir)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
