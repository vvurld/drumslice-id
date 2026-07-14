<#
.SYNOPSIS
Removes DrumSLICE ID from Windows.

.DESCRIPTION
By default removes the copied Max package and AMXD while preserving the backend
and cache. Use -RemoveBackend, -RemoveCache, or -All for broader cleanup.
#>
[CmdletBinding()]
param(
  [int]$MaxVersion = 9,
  [string]$MaxPackagesDir = "",
  [string]$UserLibrary = "",
  [string]$InstallRoot = "$HOME\.drumslice-id",
  [string]$ConfigPath = "$HOME\.drumslice-id\backend-config.json",
  [string]$CacheDir = "",
  [switch]$RemoveBackend,
  [switch]$RemoveCache,
  [switch]$RemoveLegacy,
  [switch]$All,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
function Write-Step([string]$Message) { Write-Host "==> $Message" }
function Resolve-InstallPath([string]$Value, [string]$Label) {
  if ([string]::IsNullOrWhiteSpace($Value) -or -not [System.IO.Path]::IsPathRooted($Value)) { throw "$Label must be an absolute path: $Value" }
  return [System.IO.Path]::GetFullPath($Value)
}
function Test-DrumSliceIDPackage([string]$Directory) {
  $Metadata = Join-Path $Directory "package-info.json"
  if (-not (Test-Path -LiteralPath $Metadata -PathType Leaf)) { return $false }
  try { return ((Get-Content -LiteralPath $Metadata -Raw | ConvertFrom-Json).name -eq "DrumSliceID") }
  catch { return $false }
}

if ($env:OS -ne "Windows_NT") { throw "uninstall.ps1 supports Windows; use ./uninstall.sh on macOS." }
if (-not $PSBoundParameters.ContainsKey("MaxPackagesDir")) {
  if (-not [string]::IsNullOrWhiteSpace($env:DRUMSLICE_ID_MAX_PACKAGES_DIR)) { $MaxPackagesDir = $env:DRUMSLICE_ID_MAX_PACKAGES_DIR }
  elseif (-not [string]::IsNullOrWhiteSpace($env:SLICE_LABELER_MAX_PACKAGES_DIR)) { $MaxPackagesDir = $env:SLICE_LABELER_MAX_PACKAGES_DIR }
}
if (-not $PSBoundParameters.ContainsKey("UserLibrary")) {
  if (-not [string]::IsNullOrWhiteSpace($env:DRUMSLICE_ID_USER_LIBRARY)) { $UserLibrary = $env:DRUMSLICE_ID_USER_LIBRARY }
  elseif (-not [string]::IsNullOrWhiteSpace($env:SLICE_LABELER_USER_LIBRARY)) { $UserLibrary = $env:SLICE_LABELER_USER_LIBRARY }
}
if (-not $PSBoundParameters.ContainsKey("InstallRoot")) {
  if (-not [string]::IsNullOrWhiteSpace($env:DRUMSLICE_ID_HOME)) { $InstallRoot = $env:DRUMSLICE_ID_HOME }
  elseif (-not [string]::IsNullOrWhiteSpace($env:SLICE_LABELER_HOME)) { $InstallRoot = $env:SLICE_LABELER_HOME }
}
if (-not $PSBoundParameters.ContainsKey("ConfigPath")) {
  if (-not [string]::IsNullOrWhiteSpace($env:DRUMSLICE_ID_BACKEND_CONFIG)) { $ConfigPath = $env:DRUMSLICE_ID_BACKEND_CONFIG }
  elseif (-not [string]::IsNullOrWhiteSpace($env:SLICE_LABELER_BACKEND_CONFIG)) { $ConfigPath = $env:SLICE_LABELER_BACKEND_CONFIG }
}
if (-not $PSBoundParameters.ContainsKey("CacheDir")) {
  if (-not [string]::IsNullOrWhiteSpace($env:DRUMSLICE_ID_CACHE_DIR)) { $CacheDir = $env:DRUMSLICE_ID_CACHE_DIR }
  elseif (-not [string]::IsNullOrWhiteSpace($env:SLICE_LABELER_CACHE_DIR)) { $CacheDir = $env:SLICE_LABELER_CACHE_DIR }
}
if (-not $PSBoundParameters.ContainsKey("InstallRoot") -and (Test-Path -LiteralPath (Join-Path $PSScriptRoot "install-manifest.json") -PathType Leaf)) {
  $InstallRoot = $PSScriptRoot
}
if ([string]::IsNullOrWhiteSpace($MaxPackagesDir)) { $MaxPackagesDir = Join-Path $HOME "Documents\Max $MaxVersion\Packages" }
if ([string]::IsNullOrWhiteSpace($UserLibrary)) { $UserLibrary = Join-Path $HOME "Documents\Ableton\User Library" }
if ([string]::IsNullOrWhiteSpace($CacheDir)) {
  $CacheBase = if ([string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) { $HOME } else { $env:LOCALAPPDATA }
  $CacheDir = Join-Path $CacheBase "DrumSLICE ID\Cache"
}
$MaxPackagesDir = Resolve-InstallPath $MaxPackagesDir "Max Packages directory"
$UserLibrary = Resolve-InstallPath $UserLibrary "Ableton User Library"
$InstallRoot = Resolve-InstallPath $InstallRoot "Backend install root"
$ConfigPath = Resolve-InstallPath $ConfigPath "Backend configuration path"
$CacheDir = Resolve-InstallPath $CacheDir "Cache directory"
$ManifestPath = Join-Path $InstallRoot "install-manifest.json"
$PackageDir = Join-Path $MaxPackagesDir "DrumSliceID"
$LegacyPackageDir = Join-Path $MaxPackagesDir "SliceLabeler"
$DevicePath = Join-Path $UserLibrary "Presets\MIDI Effects\Max MIDI Effect\DrumSLICE ID.amxd"
$LegacyDevicePath = Join-Path $UserLibrary "Presets\MIDI Effects\Max MIDI Effect\Slice Labeler.amxd"

if (Test-Path -LiteralPath $ManifestPath -PathType Leaf) {
  try {
    $Manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
    if (-not $PSBoundParameters.ContainsKey("MaxPackagesDir") -and $Manifest.packageDir) { $PackageDir = $Manifest.packageDir }
    if (-not $PSBoundParameters.ContainsKey("UserLibrary") -and $Manifest.devicePath) { $DevicePath = $Manifest.devicePath }
    if (-not $PSBoundParameters.ContainsKey("ConfigPath") -and $Manifest.configPath) { $ConfigPath = $Manifest.configPath }
  } catch { throw "Installer manifest is malformed: $ManifestPath" }
}

if ([System.IO.Path]::GetFileName($PackageDir) -ne "DrumSliceID") { throw "Refusing unexpected package path: $PackageDir" }
if ([System.IO.Path]::GetFileName($DevicePath) -notin @("DrumSLICE ID.amxd", "Slice Labeler.amxd")) { throw "Refusing unexpected device path: $DevicePath" }

if (Test-Path -LiteralPath $PackageDir) {
  if (-not (Test-DrumSliceIDPackage $PackageDir) -and -not $Force) { throw "$PackageDir is not a recognized DrumSliceID package. Use -Force only after inspecting it." }
  Write-Step "Removing Max package: $PackageDir"
  Remove-Item -LiteralPath $PackageDir -Recurse -Force
} else { Write-Host "Max package is already absent: $PackageDir" }

if (Test-Path -LiteralPath $DevicePath -PathType Leaf) {
  Write-Step "Removing device: $DevicePath"
  Remove-Item -LiteralPath $DevicePath -Force
} else { Write-Host "Device is already absent: $DevicePath" }

if ($RemoveLegacy) {
  if (Test-Path -LiteralPath $LegacyPackageDir) {
    $LegacyMetadata = Join-Path $LegacyPackageDir "package-info.json"
    $Recognized = $false
    if (Test-Path -LiteralPath $LegacyMetadata -PathType Leaf) {
      try { $Recognized = ((Get-Content -LiteralPath $LegacyMetadata -Raw | ConvertFrom-Json).name -in @("SliceLabeler", "DrumSliceID")) } catch {}
    }
    if (-not $Recognized -and -not $Force) { throw "Legacy package path is unrecognized: $LegacyPackageDir" }
    Write-Step "Removing legacy Max package: $LegacyPackageDir"
    Remove-Item -LiteralPath $LegacyPackageDir -Recurse -Force
  }
  if (Test-Path -LiteralPath $LegacyDevicePath -PathType Leaf) { Remove-Item -LiteralPath $LegacyDevicePath -Force }
  $LegacyRoot = Join-Path $HOME ".slice-labeler"
  if (Test-Path -LiteralPath $LegacyRoot -PathType Container) {
    if (-not (Test-Path -LiteralPath (Join-Path $LegacyRoot "backend-config.json") -PathType Leaf) -and -not $Force) {
      throw "Legacy backend has no recognizable config: $LegacyRoot"
    }
    Write-Step "Removing legacy backend: $LegacyRoot"
    Remove-Item -LiteralPath $LegacyRoot -Recurse -Force
  }
}

if ($All) { $RemoveBackend = $true; $RemoveCache = $true }
if ($RemoveBackend) {
  if (Test-Path -LiteralPath $InstallRoot) {
    if (-not (Test-Path -LiteralPath $ManifestPath -PathType Leaf) -and -not $Force) { throw "Backend root has no installer manifest: $InstallRoot. Use -Force only after inspecting it." }
    Write-Step "Removing backend: $InstallRoot"
    Remove-Item -LiteralPath $InstallRoot -Recurse -Force
  }
  if (Test-Path -LiteralPath $ConfigPath -PathType Leaf) { Remove-Item -LiteralPath $ConfigPath -Force }
} else { Write-Host "Backend preserved: $InstallRoot (use -RemoveBackend to delete it)" }

if ($RemoveCache) {
  if ([System.IO.Path]::GetFileName((Split-Path -Parent $CacheDir)) -ne "DrumSLICE ID" -and [System.IO.Path]::GetFileName($CacheDir) -ne "DrumSLICE ID" -and -not $Force) {
    throw "Refusing unexpected cache path: $CacheDir"
  }
  if (Test-Path -LiteralPath $CacheDir) { Write-Step "Removing cache: $CacheDir"; Remove-Item -LiteralPath $CacheDir -Recurse -Force }
} else { Write-Host "Cache preserved: $CacheDir (use -RemoveCache to delete it)" }

Write-Host "`nDrumSLICE ID removal complete."
