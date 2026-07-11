#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_ROOT="${SLICE_LABELER_HOME:-$HOME/.slice-labeler}"
VENV="${SLICE_LABELER_VENV:-$INSTALL_ROOT/venv}"
PYTHON="${PYTHON:-}"

# ADTOF/Torch support trails the newest CPython release. Prefer an installed
# production-compatible interpreter instead of silently falling through to a
# bleeding-edge `python3` (3.14 on this machine).
if [[ -z "$PYTHON" ]]; then
  for candidate in python3.11 python3.10 python3.12 python3; do
    if command -v "$candidate" >/dev/null 2>&1; then
      PYTHON="$candidate"
      break
    fi
  done
fi
if [[ -z "$PYTHON" ]] || ! command -v "$PYTHON" >/dev/null 2>&1; then
  echo "Slice Labeler requires Python 3.10, 3.11, or 3.12." >&2
  exit 1
fi

mkdir -p "$INSTALL_ROOT"
"$PYTHON" -m venv "$VENV"
"$VENV/bin/python" -m pip install --upgrade pip
"$VENV/bin/python" -m pip install "$ROOT/python[adtof]"
"$VENV/bin/python" "$ROOT/scripts/check_backend.py" --python "$VENV/bin/python"
"$VENV/bin/python" -c 'import json,pathlib,sys; p=pathlib.Path.home()/".slice-labeler"/"backend-config.json"; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps({"schemaVersion":1,"python":sys.executable,"backend":"adtof","revision":"85c192e78f716ea0b111cc8a5ee4a8f6a3a4f8a9"},indent=2)+"\n",encoding="utf-8")'

echo "Slice Labeler backend configured at $VENV"
