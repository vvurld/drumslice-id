#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAX_VERSION="${MAX_VERSION:-9}"
MAX_PACKAGES_DIR="${SLICE_LABELER_MAX_PACKAGES_DIR:-}"
USER_LIBRARY="${SLICE_LABELER_USER_LIBRARY:-}"
INSTALL_ROOT="${SLICE_LABELER_HOME:-$HOME/.slice-labeler}"
CONFIG_PATH="${SLICE_LABELER_BACKEND_CONFIG:-$HOME/.slice-labeler/backend-config.json}"
PYTHON_COMMAND="${PYTHON:-}"
SKIP_BACKEND=0
VERIFY_ONLY=0
FORCE=0
STAGING_PACKAGE=""
BACKUP_PACKAGE=""
STAGING_DEVICE=""

usage() {
  cat <<'EOF'
Install DrumSLICE ID from a repository clone on macOS.

Usage: ./install.sh [options]

Options:
  --python COMMAND          Python 3.10, 3.11, or 3.12 executable
  --max-version VERSION     Max major version used for the default package path (default: 9)
  --max-packages-dir DIR    Max Packages directory; SliceLabeler is copied below it
  --user-library DIR        Ableton User Library root
  --install-root DIR        Backend environment root (default: ~/.slice-labeler)
  --config PATH             Backend configuration file
  --skip-backend            Install and verify only the Max package and AMXD
  --verify-only             Verify an existing installation without changing it
  --force                   Replace an unrecognized existing SliceLabeler package directory
  -h, --help                Show this help

The normal installation copies the Max runtime, so the repository may be moved
or deleted afterward. For source development with a live symlink, use
scripts/install_local.sh instead.
EOF
}

die() { printf 'DrumSLICE ID install failed: %s\n' "$*" >&2; exit 1; }
step() { printf '\n==> %s\n' "$*"; }

expand_home() {
  case "$1" in
    "~") printf '%s\n' "$HOME" ;;
    \~/*) printf '%s/%s\n' "$HOME" "${1#\~/}" ;;
    *) printf '%s\n' "$1" ;;
  esac
}

require_absolute() {
  case "$2" in
    /*) ;;
    *) die "$1 must be an absolute path: $2" ;;
  esac
  case "$2" in
    *$'\n'*|*$'\r'*) die "$1 must not contain a newline" ;;
  esac
}

is_slice_labeler_package() {
  [[ -f "$1/package-info.json" ]] && grep -Eq '"name"[[:space:]]*:[[:space:]]*"SliceLabeler"' "$1/package-info.json"
}

cleanup() {
  local status=$?
  if [[ -n "$STAGING_PACKAGE" && -e "$STAGING_PACKAGE" ]]; then rm -rf -- "$STAGING_PACKAGE"; fi
  if [[ -n "$STAGING_DEVICE" && -e "$STAGING_DEVICE" ]]; then rm -f -- "$STAGING_DEVICE"; fi
  if [[ -n "$BACKUP_PACKAGE" && ( -e "$BACKUP_PACKAGE" || -L "$BACKUP_PACKAGE" ) ]]; then
    if [[ ! -e "$PACKAGE_DIR" && ! -L "$PACKAGE_DIR" ]]; then mv "$BACKUP_PACKAGE" "$PACKAGE_DIR"
    else rm -rf -- "$BACKUP_PACKAGE"
    fi
  fi
  return "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

while [[ $# -gt 0 ]]; do
  case "$1" in
    --python) [[ $# -ge 2 ]] || die "--python requires a value"; PYTHON_COMMAND="$2"; shift 2 ;;
    --max-version) [[ $# -ge 2 ]] || die "--max-version requires a value"; MAX_VERSION="$2"; shift 2 ;;
    --max-packages-dir) [[ $# -ge 2 ]] || die "--max-packages-dir requires a value"; MAX_PACKAGES_DIR="$2"; shift 2 ;;
    --user-library) [[ $# -ge 2 ]] || die "--user-library requires a value"; USER_LIBRARY="$2"; shift 2 ;;
    --install-root) [[ $# -ge 2 ]] || die "--install-root requires a value"; INSTALL_ROOT="$2"; shift 2 ;;
    --config) [[ $# -ge 2 ]] || die "--config requires a value"; CONFIG_PATH="$2"; shift 2 ;;
    --skip-backend) SKIP_BACKEND=1; shift ;;
    --verify-only) VERIFY_ONLY=1; shift ;;
    --force) FORCE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $1 (run ./install.sh --help)" ;;
  esac
done

[[ "$(uname -s)" == "Darwin" ]] || die "install.sh supports macOS; use install.ps1 on Windows"
[[ "$MAX_VERSION" =~ ^[0-9]+$ ]] || die "--max-version must be a whole-number major version"
MAX_PACKAGES_DIR="$(expand_home "${MAX_PACKAGES_DIR:-$HOME/Documents/Max $MAX_VERSION/Packages}")"
USER_LIBRARY="$(expand_home "${USER_LIBRARY:-$HOME/Music/Ableton/User Library}")"
INSTALL_ROOT="$(expand_home "$INSTALL_ROOT")"
CONFIG_PATH="$(expand_home "$CONFIG_PATH")"
PACKAGE_DIR="$MAX_PACKAGES_DIR/SliceLabeler"
DEVICE_DIR="$USER_LIBRARY/Presets/MIDI Effects/Max MIDI Effect"
DEVICE_PATH="$DEVICE_DIR/DrumSLICE ID.amxd"
LEGACY_DEVICE_PATH="$DEVICE_DIR/Slice Labeler.amxd"
MANIFEST_PATH="$INSTALL_ROOT/install-paths.txt"

require_absolute "Max Packages directory" "$MAX_PACKAGES_DIR"
require_absolute "Ableton User Library" "$USER_LIBRARY"
require_absolute "backend install root" "$INSTALL_ROOT"
require_absolute "backend configuration path" "$CONFIG_PATH"

verify_source() {
  local required
  [[ -s "$ROOT/dist/DrumSLICE ID.amxd" ]] || die "dist/DrumSLICE ID.amxd is missing; pull a complete repository checkout"
  for required in \
    uninstall.sh \
    scripts/setup_backend.sh \
    scripts/check_backend.py \
    python/requirements.lock \
    max/package-info.json \
    max/patchers/SliceLabeler.maxpat \
    max/patchers/slice_labeler_bundle_v2.js \
    max/patchers/orchestrator_loader.js \
    max/node/orchestrator.js \
    max/schemas/analysis_request.schema.json; do
    [[ -f "$ROOT/$required" ]] || die "required runtime file is missing: $required"
  done
  if command -v node >/dev/null 2>&1 && node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 18 ? 0 : 1)' >/dev/null 2>&1; then
    node "$ROOT/scripts/verify_max_device.js" "$ROOT/dist/DrumSLICE ID.amxd" >/dev/null
    printf '    Source AMXD structure verified.\n'
  else
    printf '    Node.js is not installed; continuing with file-integrity verification.\n'
  fi
}

install_backend() {
  step "Installing the private Python analysis backend"
  if [[ -n "$PYTHON_COMMAND" ]]; then
    PYTHON="$PYTHON_COMMAND" SLICE_LABELER_HOME="$INSTALL_ROOT" SLICE_LABELER_BACKEND_CONFIG="$CONFIG_PATH" "$ROOT/scripts/setup_backend.sh"
  else
    SLICE_LABELER_HOME="$INSTALL_ROOT" SLICE_LABELER_BACKEND_CONFIG="$CONFIG_PATH" "$ROOT/scripts/setup_backend.sh"
  fi
}

install_max_package() {
  step "Copying the Max package"
  mkdir -p "$MAX_PACKAGES_DIR"
  if [[ -e "$PACKAGE_DIR" || -L "$PACKAGE_DIR" ]]; then
    if ! is_slice_labeler_package "$PACKAGE_DIR" && [[ "$FORCE" -ne 1 ]]; then
      die "$PACKAGE_DIR exists but is not a recognized SliceLabeler package; inspect it or rerun with --force"
    fi
  fi
  STAGING_PACKAGE="$MAX_PACKAGES_DIR/.SliceLabeler.installing-$$"
  BACKUP_PACKAGE="$MAX_PACKAGES_DIR/.SliceLabeler.backup-$$"
  rm -rf -- "$STAGING_PACKAGE" "$BACKUP_PACKAGE"
  mkdir -p "$STAGING_PACKAGE"
  cp -R "$ROOT/max/." "$STAGING_PACKAGE/"
  if [[ -e "$PACKAGE_DIR" || -L "$PACKAGE_DIR" ]]; then mv "$PACKAGE_DIR" "$BACKUP_PACKAGE"; fi
  mv "$STAGING_PACKAGE" "$PACKAGE_DIR"
  STAGING_PACKAGE=""
  if [[ -e "$BACKUP_PACKAGE" || -L "$BACKUP_PACKAGE" ]]; then rm -rf -- "$BACKUP_PACKAGE"; fi
  BACKUP_PACKAGE=""
}

install_device() {
  step "Copying the Max for Live device"
  mkdir -p "$DEVICE_DIR"
  STAGING_DEVICE="$DEVICE_PATH.installing-$$"
  cp "$ROOT/dist/DrumSLICE ID.amxd" "$STAGING_DEVICE"
  chmod 0644 "$STAGING_DEVICE"
  mv -f "$STAGING_DEVICE" "$DEVICE_PATH"
  STAGING_DEVICE=""
  if [[ -f "$LEGACY_DEVICE_PATH" && -f "$MANIFEST_PATH" ]] && grep -Fqx "devicePath=$LEGACY_DEVICE_PATH" "$MANIFEST_PATH"; then
    rm -f -- "$LEGACY_DEVICE_PATH"
  fi
}

write_manifest() {
  local temporary="$MANIFEST_PATH.tmp-$$"
  mkdir -p "$INSTALL_ROOT"
  {
    printf 'schemaVersion=1\n'
    printf 'packageDir=%s\n' "$PACKAGE_DIR"
    printf 'devicePath=%s\n' "$DEVICE_PATH"
    printf 'configPath=%s\n' "$CONFIG_PATH"
    printf 'installRoot=%s\n' "$INSTALL_ROOT"
  } > "$temporary"
  chmod 0600 "$temporary"
  mv -f "$temporary" "$MANIFEST_PATH"
  cp "$ROOT/uninstall.sh" "$INSTALL_ROOT/uninstall.sh"
  chmod 0700 "$INSTALL_ROOT/uninstall.sh"
}

verify_installation() {
  local backend_python="$INSTALL_ROOT/venv/bin/python"
  step "Verifying the installed files"
  [[ -d "$PACKAGE_DIR" && ! -L "$PACKAGE_DIR" ]] || die "the installed Max package is missing or still a development symlink: $PACKAGE_DIR"
  is_slice_labeler_package "$PACKAGE_DIR" || die "installed Max package metadata is invalid"
  diff -qr "$ROOT/max" "$PACKAGE_DIR" >/dev/null || die "installed Max package differs from the repository runtime"
  [[ -f "$DEVICE_PATH" ]] || die "installed AMXD is missing: $DEVICE_PATH"
  cmp -s "$ROOT/dist/DrumSLICE ID.amxd" "$DEVICE_PATH" || die "installed AMXD differs from the repository artifact"
  if [[ "$SKIP_BACKEND" -eq 0 ]]; then
    [[ -x "$backend_python" ]] || die "backend Python is missing: $backend_python"
    [[ -f "$CONFIG_PATH" ]] || die "backend configuration is missing: $CONFIG_PATH"
    "$backend_python" "$ROOT/scripts/check_backend.py" --python "$backend_python" >/dev/null
    printf '    Backend health check passed.\n'
  fi
  printf '    Max package and AMXD are byte-identical to this checkout.\n'
}

step "Checking the repository and prerequisites"
verify_source
if [[ "$VERIFY_ONLY" -eq 0 && ( -e "$PACKAGE_DIR" || -L "$PACKAGE_DIR" ) ]] && ! is_slice_labeler_package "$PACKAGE_DIR" && [[ "$FORCE" -ne 1 ]]; then
  die "$PACKAGE_DIR exists but is not a recognized SliceLabeler package; inspect it or rerun with --force"
fi
if [[ "$VERIFY_ONLY" -eq 0 && "$SKIP_BACKEND" -eq 0 ]]; then
  command -v git >/dev/null 2>&1 || die "Git is required to install the pinned ADTOF dependency"
fi

if [[ "$VERIFY_ONLY" -eq 0 ]]; then
  if [[ "$SKIP_BACKEND" -eq 0 ]]; then install_backend
  else step "Skipping backend installation as requested"
  fi
  install_max_package
  install_device
  write_manifest
fi

verify_installation
trap - EXIT INT TERM

printf '\nDrumSLICE ID is ready.\n'
printf '  Device: %s\n' "$DEVICE_PATH"
printf '  Max package: %s\n' "$PACKAGE_DIR"
if [[ "$SKIP_BACKEND" -eq 0 ]]; then printf '  Backend: %s\n' "$INSTALL_ROOT/venv"; fi
printf '\nRestart Live or rescan the User Library, then open:\n'
printf '  User Library > Presets > MIDI Effects > Max MIDI Effect > DrumSLICE ID\n'
printf 'Place the device immediately before the sliced Drum Rack.\n'
printf 'Uninstaller: %s\n' "$INSTALL_ROOT/uninstall.sh"
