#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAX_VERSION="${MAX_VERSION:-9}"
PACKAGE_DIR="$HOME/Documents/Max $MAX_VERSION/Packages/SliceLabeler"
DEVICE_DIR="$HOME/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect"

if [[ -e "$PACKAGE_DIR" && ! -L "$PACKAGE_DIR" ]]; then
  echo "Refusing to replace the existing non-symlink package: $PACKAGE_DIR" >&2
  exit 1
fi

mkdir -p "$(dirname "$PACKAGE_DIR")" "$DEVICE_DIR"
ln -sfn "$ROOT/max" "$PACKAGE_DIR"
cp -f "$ROOT/dist/Slice Labeler.amxd" "$DEVICE_DIR/Slice Labeler.amxd"

echo "Installed SliceLabeler Max package: $PACKAGE_DIR"
echo "Installed device: $DEVICE_DIR/Slice Labeler.amxd"
echo "Run $ROOT/scripts/setup_backend.sh separately to install or verify ADTOF."
