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
  [string]$InstallRoot = "$HOME\.slice-labeler",
  [string]$ConfigPath = "$HOME\.slice-labeler\backend-config.json",
  [string]$CacheDir = "",
  [switch]$RemoveBackend,
  [switch]$RemoveCache,
  [switch]$All,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
function Write-Step([string]$Message) { Write-Host "==> $Message" }
function Resolve-InstallPath([string]$Value, [string]$Label) {
  if ([string]::IsNullOrWhiteSpace($Value) -or -not [System.IO.Path]::IsPathRooted($Value)) { throw "$Label must be an absolute path: $Value" }
  return [System.IO.Path]::GetFullPath($Value)
}
function Test-SliceLabelerPackage([string]$Directory) {
  $Metadata = Join-Path $Directory "package-info.json"
  if (-not (Test-Path -LiteralPath $Metadata -PathType Leaf)) { return $false }
  try { return ((Get-Content -LiteralPath $Metadata -Raw | ConvertFrom-Json).name -eq "SliceLabeler") }
  catch { return $false }
}

if ($env:OS -ne "Windows_NT") { throw "uninstall.ps1 supports Windows; use ./uninstall.sh on macOS." }
if (-not $PSBoundParameters.ContainsKey("InstallRoot") -and (Test-Path -LiteralPath (Join-Path $PSScriptRoot "install-manifest.json") -PathType Leaf)) {
  $InstallRoot = $PSScriptRoot
}
if ([string]::IsNullOrWhiteSpace($MaxPackagesDir)) { $MaxPackagesDir = Join-Path $HOME "Documents\Max $MaxVersion\Packages" }
if ([string]::IsNullOrWhiteSpace($UserLibrary)) { $UserLibrary = Join-Path $HOME "Documents\Ableton\User Library" }
if ([string]::IsNullOrWhiteSpace($CacheDir)) {
  $CacheBase = if ([string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) { $HOME } else { $env:LOCALAPPDATA }
  $CacheDir = Join-Path $CacheBase "Slice Labeler\Cache"
}
$MaxPackagesDir = Resolve-InstallPath $MaxPackagesDir "Max Packages directory"
$UserLibrary = Resolve-InstallPath $UserLibrary "Ableton User Library"
$InstallRoot = Resolve-InstallPath $InstallRoot "Backend install root"
$ConfigPath = Resolve-InstallPath $ConfigPath "Backend configuration path"
$CacheDir = Resolve-InstallPath $CacheDir "Cache directory"
$ManifestPath = Join-Path $InstallRoot "install-manifest.json"
$PackageDir = Join-Path $MaxPackagesDir "SliceLabeler"
$DevicePath = Join-Path $UserLibrary "Presets\MIDI Effects\Max MIDI Effect\DrumSLICE ID.amxd"

if (Test-Path -LiteralPath $ManifestPath -PathType Leaf) {
  try {
    $Manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
    if (-not $PSBoundParameters.ContainsKey("MaxPackagesDir") -and $Manifest.packageDir) { $PackageDir = $Manifest.packageDir }
    if (-not $PSBoundParameters.ContainsKey("UserLibrary") -and $Manifest.devicePath) { $DevicePath = $Manifest.devicePath }
    if (-not $PSBoundParameters.ContainsKey("ConfigPath") -and $Manifest.configPath) { $ConfigPath = $Manifest.configPath }
  } catch { throw "Installer manifest is malformed: $ManifestPath" }
}

if ([System.IO.Path]::GetFileName($PackageDir) -ne "SliceLabeler") { throw "Refusing unexpected package path: $PackageDir" }
if ([System.IO.Path]::GetFileName($DevicePath) -notin @("DrumSLICE ID.amxd", "Slice Labeler.amxd")) { throw "Refusing unexpected device path: $DevicePath" }

if (Test-Path -LiteralPath $PackageDir) {
  if (-not (Test-SliceLabelerPackage $PackageDir) -and -not $Force) { throw "$PackageDir is not a recognized SliceLabeler package. Use -Force only after inspecting it." }
  Write-Step "Removing Max package: $PackageDir"
  Remove-Item -LiteralPath $PackageDir -Recurse -Force
} else { Write-Host "Max package is already absent: $PackageDir" }

if (Test-Path -LiteralPath $DevicePath -PathType Leaf) {
  Write-Step "Removing device: $DevicePath"
  Remove-Item -LiteralPath $DevicePath -Force
} else { Write-Host "Device is already absent: $DevicePath" }

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
  if ([System.IO.Path]::GetFileName((Split-Path -Parent $CacheDir)) -ne "Slice Labeler" -and [System.IO.Path]::GetFileName($CacheDir) -ne "Slice Labeler" -and -not $Force) {
    throw "Refusing unexpected cache path: $CacheDir"
  }
  if (Test-Path -LiteralPath $CacheDir) { Write-Step "Removing cache: $CacheDir"; Remove-Item -LiteralPath $CacheDir -Recurse -Force }
} else { Write-Host "Cache preserved: $CacheDir (use -RemoveCache to delete it)" }

Write-Host "`nDrumSLICE ID removal complete."
