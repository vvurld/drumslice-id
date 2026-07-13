#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAX_VERSION="${MAX_VERSION:-9}"
MAX_PACKAGES_DIR="${SLICE_LABELER_MAX_PACKAGES_DIR:-}"
USER_LIBRARY="${SLICE_LABELER_USER_LIBRARY:-}"
INSTALL_ROOT="${SLICE_LABELER_HOME:-$HOME/.slice-labeler}"
CONFIG_PATH="${SLICE_LABELER_BACKEND_CONFIG:-$HOME/.slice-labeler/backend-config.json}"
CACHE_DIR="${SLICE_LABELER_CACHE_DIR:-$HOME/Library/Caches/Slice Labeler}"
REMOVE_BACKEND=0
REMOVE_CACHE=0
FORCE=0
CUSTOM_MAX=0
CUSTOM_LIBRARY=0
CUSTOM_CONFIG=0

if [[ -z "${SLICE_LABELER_HOME:-}" && -f "$SCRIPT_DIR/install-paths.txt" ]]; then
  INSTALL_ROOT="$SCRIPT_DIR"
fi

usage() {
  cat <<'EOF'
Remove Slice Labeler from macOS.

Usage: ./uninstall.sh [options]

By default this removes only the Max package and AMXD, preserving the backend
and analysis cache so a reinstall is quick.

Options:
  --max-version VERSION     Max major version for the default package path
  --max-packages-dir DIR    Override the Max Packages directory
  --user-library DIR        Override the Ableton User Library root
  --install-root DIR        Backend environment root (default: ~/.slice-labeler)
  --config PATH             Backend configuration file
  --cache-dir DIR           Analysis/log cache directory
  --remove-backend          Also remove the private Python environment/config
  --remove-cache            Also remove cached activations and diagnostics
  --all                     Equivalent to --remove-backend --remove-cache
  --force                   Remove unrecognized paths selected explicitly
  -h, --help                Show this help
EOF
}

die() { printf 'Slice Labeler uninstall failed: %s\n' "$*" >&2; exit 1; }
step() { printf '==> %s\n' "$*"; }
expand_home() { case "$1" in "~") printf '%s\n' "$HOME" ;; \~/*) printf '%s/%s\n' "$HOME" "${1#\~/}" ;; *) printf '%s\n' "$1" ;; esac; }
is_slice_labeler_package() { [[ -f "$1/package-info.json" ]] && grep -Eq '"name"[[:space:]]*:[[:space:]]*"SliceLabeler"' "$1/package-info.json"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-version) [[ $# -ge 2 ]] || die "--max-version requires a value"; MAX_VERSION="$2"; shift 2 ;;
    --max-packages-dir) [[ $# -ge 2 ]] || die "--max-packages-dir requires a value"; MAX_PACKAGES_DIR="$2"; CUSTOM_MAX=1; shift 2 ;;
    --user-library) [[ $# -ge 2 ]] || die "--user-library requires a value"; USER_LIBRARY="$2"; CUSTOM_LIBRARY=1; shift 2 ;;
    --install-root) [[ $# -ge 2 ]] || die "--install-root requires a value"; INSTALL_ROOT="$2"; shift 2 ;;
    --config) [[ $# -ge 2 ]] || die "--config requires a value"; CONFIG_PATH="$2"; CUSTOM_CONFIG=1; shift 2 ;;
    --cache-dir) [[ $# -ge 2 ]] || die "--cache-dir requires a value"; CACHE_DIR="$2"; shift 2 ;;
    --remove-backend) REMOVE_BACKEND=1; shift ;;
    --remove-cache) REMOVE_CACHE=1; shift ;;
    --all) REMOVE_BACKEND=1; REMOVE_CACHE=1; shift ;;
    --force) FORCE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $1 (run ./uninstall.sh --help)" ;;
  esac
done

[[ "$(uname -s)" == "Darwin" ]] || die "uninstall.sh supports macOS; use uninstall.ps1 on Windows"
INSTALL_ROOT="$(expand_home "$INSTALL_ROOT")"
MANIFEST_PATH="$INSTALL_ROOT/install-paths.txt"
MANIFEST_PACKAGE=""
MANIFEST_DEVICE=""
MANIFEST_CONFIG=""
if [[ -f "$MANIFEST_PATH" ]]; then
  while IFS='=' read -r key value; do
    case "$key" in packageDir) MANIFEST_PACKAGE="$value" ;; devicePath) MANIFEST_DEVICE="$value" ;; configPath) MANIFEST_CONFIG="$value" ;; esac
  done < "$MANIFEST_PATH"
fi

MAX_PACKAGES_DIR="$(expand_home "${MAX_PACKAGES_DIR:-$HOME/Documents/Max $MAX_VERSION/Packages}")"
USER_LIBRARY="$(expand_home "${USER_LIBRARY:-$HOME/Music/Ableton/User Library}")"
CONFIG_PATH="$(expand_home "$CONFIG_PATH")"
CACHE_DIR="$(expand_home "$CACHE_DIR")"
PACKAGE_DIR="$MAX_PACKAGES_DIR/SliceLabeler"
DEVICE_PATH="$USER_LIBRARY/Presets/MIDI Effects/Max MIDI Effect/Slice Labeler.amxd"
if [[ "$CUSTOM_MAX" -eq 0 && -n "$MANIFEST_PACKAGE" ]]; then PACKAGE_DIR="$MANIFEST_PACKAGE"; fi
if [[ "$CUSTOM_LIBRARY" -eq 0 && -n "$MANIFEST_DEVICE" ]]; then DEVICE_PATH="$MANIFEST_DEVICE"; fi
if [[ "$CUSTOM_CONFIG" -eq 0 && -n "$MANIFEST_CONFIG" ]]; then CONFIG_PATH="$MANIFEST_CONFIG"; fi

for path_to_check in "$PACKAGE_DIR" "$DEVICE_PATH" "$INSTALL_ROOT" "$CONFIG_PATH" "$CACHE_DIR"; do
  case "$path_to_check" in /*) ;; *) die "refusing non-absolute removal path: $path_to_check" ;; esac
done

[[ "$(basename "$PACKAGE_DIR")" == "SliceLabeler" ]] || die "refusing unexpected package path: $PACKAGE_DIR"
[[ "$(basename "$DEVICE_PATH")" == "Slice Labeler.amxd" ]] || die "refusing unexpected device path: $DEVICE_PATH"

if [[ -e "$PACKAGE_DIR" || -L "$PACKAGE_DIR" ]]; then
  if ! is_slice_labeler_package "$PACKAGE_DIR" && [[ "$FORCE" -ne 1 ]]; then die "$PACKAGE_DIR is not a recognized SliceLabeler package; use --force only after inspecting it"; fi
  step "Removing Max package: $PACKAGE_DIR"
  rm -rf -- "$PACKAGE_DIR"
else printf 'Max package is already absent: %s\n' "$PACKAGE_DIR"
fi

if [[ -f "$DEVICE_PATH" ]]; then
  step "Removing device: $DEVICE_PATH"
  rm -f -- "$DEVICE_PATH"
else printf 'Device is already absent: %s\n' "$DEVICE_PATH"
fi

if [[ "$REMOVE_BACKEND" -eq 1 ]]; then
  if [[ -e "$INSTALL_ROOT" ]]; then
    if [[ ! -f "$MANIFEST_PATH" && "$FORCE" -ne 1 ]]; then die "backend root has no installer manifest: $INSTALL_ROOT (use --force after inspecting it)"; fi
    step "Removing backend: $INSTALL_ROOT"
    rm -rf -- "$INSTALL_ROOT"
  fi
  if [[ -f "$CONFIG_PATH" ]]; then rm -f -- "$CONFIG_PATH"; fi
else
  printf 'Backend preserved: %s (use --remove-backend to delete it)\n' "$INSTALL_ROOT"
fi

if [[ "$REMOVE_CACHE" -eq 1 ]]; then
  case "$CACHE_DIR" in
    "$HOME/Library/Caches/Slice Labeler"|*/Slice\ Labeler) ;;
    *) [[ "$FORCE" -eq 1 ]] || die "refusing unexpected cache path: $CACHE_DIR" ;;
  esac
  if [[ -e "$CACHE_DIR" ]]; then step "Removing cache: $CACHE_DIR"; rm -rf -- "$CACHE_DIR"; fi
else
  printf 'Cache preserved: %s (use --remove-cache to delete it)\n' "$CACHE_DIR"
fi

printf '\nSlice Labeler removal complete.\n'
