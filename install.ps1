<#
.SYNOPSIS
Installs DrumSLICE ID from a repository clone on Windows.

.DESCRIPTION
Copies the Max runtime and AMXD to user-owned locations, installs the private
Python backend, verifies the result, and records paths for uninstall.ps1.
#>
[CmdletBinding()]
param(
  [string]$Python = "python",
  [int]$MaxVersion = 9,
  [string]$MaxPackagesDir = "",
  [string]$UserLibrary = "",
  [string]$InstallRoot = "$HOME\.drumslice-id",
  [string]$ConfigPath = "$HOME\.drumslice-id\backend-config.json",
  [switch]$SkipBackend,
  [switch]$AcceptAdtofLicense,
  [switch]$VerifyOnly,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

function Write-Step([string]$Message) { Write-Host "`n==> $Message" }
function Resolve-InstallPath([string]$Value, [string]$Label) {
  if ([string]::IsNullOrWhiteSpace($Value)) { throw "$Label must not be empty." }
  if (-not [System.IO.Path]::IsPathRooted($Value)) { throw "$Label must be an absolute path: $Value" }
  return [System.IO.Path]::GetFullPath($Value)
}
function Invoke-NativeChecked([string]$Command, [string[]]$Arguments) {
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Command failed with exit code $LASTEXITCODE`: $Command $($Arguments -join ' ')" }
}
function Test-DrumSliceIDPackage([string]$Directory) {
  $Metadata = Join-Path $Directory "package-info.json"
  if (-not (Test-Path -LiteralPath $Metadata -PathType Leaf)) { return $false }
  try { return ((Get-Content -LiteralPath $Metadata -Raw | ConvertFrom-Json).name -eq "DrumSliceID") }
  catch { return $false }
}
function Test-LegacyPackage([string]$Directory) {
  $Metadata = Join-Path $Directory "package-info.json"
  if (-not (Test-Path -LiteralPath $Metadata -PathType Leaf)) { return $false }
  try { return ((Get-Content -LiteralPath $Metadata -Raw | ConvertFrom-Json).name -in @("SliceLabeler", "DrumSliceID")) }
  catch { return $false }
}
function Assert-SourceComplete {
  $Required = @(
    "dist\DrumSLICE ID.amxd",
    "uninstall.ps1",
    "scripts\setup_backend.ps1",
    "scripts\check_backend.py",
    "python\requirements.lock",
    "max\package-info.json",
    "max\patchers\DrumSliceID.maxpat",
    "max\patchers\drumslice_id_bundle_v2.js",
    "max\patchers\orchestrator_loader.js",
    "max\node\orchestrator.js",
    "max\schemas\analysis_request.schema.json"
  )
  foreach ($Relative in $Required) {
    if (-not (Test-Path -LiteralPath (Join-Path $Root $Relative) -PathType Leaf)) {
      throw "Required runtime file is missing: $Relative"
    }
  }
  $Node = Get-Command node -ErrorAction SilentlyContinue
  $NodeIsCurrent = $false
  if ($null -ne $Node) {
    $NodeVersion = & $Node.Source --version
    if ($LASTEXITCODE -eq 0 -and $NodeVersion -match '^v?([0-9]+)\.') {
      $NodeIsCurrent = ([int]$Matches[1] -ge 18)
    }
  }
  if ($NodeIsCurrent) {
    Invoke-NativeChecked $Node.Source @(
      (Join-Path $Root "scripts\verify_max_device.js"),
      (Join-Path $Root "dist\DrumSLICE ID.amxd")
    )
    Write-Host "    Source AMXD structure verified."
  } else {
    Write-Host "    Node.js is not installed; continuing with file-integrity verification."
  }
}
function Get-TreeHashes([string]$Directory) {
  $Base = [System.IO.Path]::GetFullPath($Directory).TrimEnd('\')
  $Result = @{}
  Get-ChildItem -LiteralPath $Base -File -Recurse -Force | ForEach-Object {
    $Relative = $_.FullName.Substring($Base.Length).TrimStart('\')
    $Result[$Relative] = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
  }
  return $Result
}
function Assert-TreesEqual([string]$Source, [string]$Destination) {
  $Left = Get-TreeHashes $Source
  $Right = Get-TreeHashes $Destination
  if ($Left.Count -ne $Right.Count) { throw "Installed Max package has a different file count from the repository runtime." }
  foreach ($Name in $Left.Keys) {
    if (-not $Right.ContainsKey($Name) -or $Right[$Name] -ne $Left[$Name]) {
      throw "Installed Max package differs at: $Name"
    }
  }
}

if ($env:OS -ne "Windows_NT") { throw "install.ps1 supports Windows; use ./install.sh on macOS." }
if ($MaxVersion -lt 1) { throw "MaxVersion must be a positive major version." }
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
if ([string]::IsNullOrWhiteSpace($MaxPackagesDir)) { $MaxPackagesDir = Join-Path $HOME "Documents\Max $MaxVersion\Packages" }
if ([string]::IsNullOrWhiteSpace($UserLibrary)) { $UserLibrary = Join-Path $HOME "Documents\Ableton\User Library" }
$MaxPackagesDir = Resolve-InstallPath $MaxPackagesDir "Max Packages directory"
$UserLibrary = Resolve-InstallPath $UserLibrary "Ableton User Library"
$InstallRoot = Resolve-InstallPath $InstallRoot "Backend install root"
$ConfigPath = Resolve-InstallPath $ConfigPath "Backend configuration path"
$PackageDir = Join-Path $MaxPackagesDir "DrumSliceID"
$LegacyPackageDir = Join-Path $MaxPackagesDir "SliceLabeler"
$DeviceDir = Join-Path $UserLibrary "Presets\MIDI Effects\Max MIDI Effect"
$DevicePath = Join-Path $DeviceDir "DrumSLICE ID.amxd"
$LegacyDevicePath = Join-Path $DeviceDir "Slice Labeler.amxd"
$ManifestPath = Join-Path $InstallRoot "install-manifest.json"
$SourcePackage = Join-Path $Root "max"
$SourceDevice = Join-Path $Root "dist\DrumSLICE ID.amxd"
$PreviousDevicePath = ""
if (Test-Path -LiteralPath $ManifestPath -PathType Leaf) {
  try { $PreviousDevicePath = (Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json).devicePath }
  catch { throw "Existing installer manifest is malformed: $ManifestPath" }
}

Write-Step "Checking the repository and prerequisites"
Assert-SourceComplete
if (-not $VerifyOnly -and (Test-Path -LiteralPath $PackageDir) -and -not (Test-DrumSliceIDPackage $PackageDir) -and -not $Force) {
  throw "$PackageDir exists but is not a recognized DrumSliceID package. Inspect it or rerun with -Force."
}
if (-not $VerifyOnly -and -not $SkipBackend -and $null -eq (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is required to install the pinned ADTOF dependency."
}
if (-not $VerifyOnly -and -not $SkipBackend) {
  if (-not $AcceptAdtofLicense -and $env:DRUMSLICE_ID_ACCEPT_ADTOF_LICENSE -ne "1") {
    throw "The external ADTOF backend requires -AcceptAdtofLicense. Upstream is CC BY-NC-SA 4.0 and the pinned PyTorch port has no separate declared license; see THIRD_PARTY_NOTICES.md. Use -SkipBackend to install only the device files."
  }
  $PythonCommand = Get-Command $Python -ErrorAction SilentlyContinue
  if ($null -eq $PythonCommand) { throw "DrumSLICE ID requires Python 3.10, 3.11, or 3.12; command not found: $Python" }
  & $PythonCommand.Source -c 'import sys; raise SystemExit(0 if (3, 10) <= sys.version_info[:2] < (3, 13) else 1)'
  if ($LASTEXITCODE -ne 0) { throw "DrumSLICE ID requires Python 3.10, 3.11, or 3.12: $Python" }
}

if (-not $VerifyOnly) {
  if (-not $SkipBackend) {
    Write-Step "Installing the private Python analysis backend"
    & (Join-Path $Root "scripts\setup_backend.ps1") -InstallRoot $InstallRoot -Python $Python -ConfigPath $ConfigPath -AcceptAdtofLicense
    if ($LASTEXITCODE -ne 0) { throw "Backend installation failed with exit code $LASTEXITCODE." }
  } else {
    Write-Step "Skipping backend installation as requested"
  }

  Write-Step "Copying the Max package"
  New-Item -ItemType Directory -Force -Path $MaxPackagesDir | Out-Null
  if ((Test-Path -LiteralPath $PackageDir) -and -not (Test-DrumSliceIDPackage $PackageDir) -and -not $Force) {
    throw "$PackageDir exists but is not a recognized DrumSliceID package. Inspect it or rerun with -Force."
  }
  $Staging = Join-Path $MaxPackagesDir ".DrumSliceID.installing-$PID"
  $Backup = Join-Path $MaxPackagesDir ".DrumSliceID.backup-$PID"
  Remove-Item -LiteralPath $Staging, $Backup -Recurse -Force -ErrorAction SilentlyContinue
  try {
    New-Item -ItemType Directory -Force -Path $Staging | Out-Null
    Get-ChildItem -LiteralPath $SourcePackage -Force | Copy-Item -Destination $Staging -Recurse -Force
    if (Test-Path -LiteralPath $PackageDir) { Move-Item -LiteralPath $PackageDir -Destination $Backup }
    Move-Item -LiteralPath $Staging -Destination $PackageDir
    Remove-Item -LiteralPath $Backup -Recurse -Force -ErrorAction SilentlyContinue
  } catch {
    Remove-Item -LiteralPath $Staging -Recurse -Force -ErrorAction SilentlyContinue
    if ((Test-Path -LiteralPath $Backup) -and -not (Test-Path -LiteralPath $PackageDir)) {
      Move-Item -LiteralPath $Backup -Destination $PackageDir
    }
    throw
  }

  Write-Step "Copying the Max for Live device"
  New-Item -ItemType Directory -Force -Path $DeviceDir | Out-Null
  $DeviceTemporary = "$DevicePath.installing-$PID"
  Copy-Item -LiteralPath $SourceDevice -Destination $DeviceTemporary -Force
  if (Test-Path -LiteralPath $DevicePath -PathType Leaf) {
    [System.IO.File]::Replace($DeviceTemporary, $DevicePath, $null)
  } else {
    Move-Item -LiteralPath $DeviceTemporary -Destination $DevicePath
  }
  if (Test-Path -LiteralPath $LegacyPackageDir) {
    if (Test-LegacyPackage $LegacyPackageDir) {
      Remove-Item -LiteralPath $LegacyPackageDir -Recurse -Force
      Write-Host "    Removed recognized legacy Max package: $LegacyPackageDir"
    } else {
      Write-Host "    Preserved unrecognized legacy package path: $LegacyPackageDir"
    }
  }
  if (Test-Path -LiteralPath $LegacyDevicePath -PathType Leaf) {
    Remove-Item -LiteralPath $LegacyDevicePath -Force
    Write-Host "    Removed legacy device copy: $LegacyDevicePath"
  }
  $LegacyBackend = Join-Path $HOME ".slice-labeler"
  if ($InstallRoot -ne $LegacyBackend -and (Test-Path -LiteralPath $LegacyBackend -PathType Container)) {
    Write-Host "    Preserved legacy backend at $LegacyBackend; remove it manually after validating this install."
  }

  New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null
  $Manifest = @{
    schemaVersion = 2
    product = "DrumSLICE ID"
    packageDir = $PackageDir
    devicePath = $DevicePath
    configPath = $ConfigPath
    installRoot = $InstallRoot
  } | ConvertTo-Json
  $ManifestTemporary = "$ManifestPath.tmp-$PID"
  [System.IO.File]::WriteAllText($ManifestTemporary, $Manifest + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))
  if (Test-Path -LiteralPath $ManifestPath -PathType Leaf) {
    [System.IO.File]::Replace($ManifestTemporary, $ManifestPath, $null)
  } else {
    Move-Item -LiteralPath $ManifestTemporary -Destination $ManifestPath
  }
  Copy-Item -LiteralPath (Join-Path $Root "uninstall.ps1") -Destination (Join-Path $InstallRoot "uninstall.ps1") -Force
}

Write-Step "Verifying the installed files"
if (-not (Test-Path -LiteralPath $PackageDir -PathType Container)) { throw "Installed Max package is missing: $PackageDir" }
if (-not (Test-DrumSliceIDPackage $PackageDir)) { throw "Installed Max package metadata is invalid." }
Assert-TreesEqual $SourcePackage $PackageDir
if (-not (Test-Path -LiteralPath $DevicePath -PathType Leaf)) { throw "Installed AMXD is missing: $DevicePath" }
if ((Get-FileHash -LiteralPath $SourceDevice -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $DevicePath -Algorithm SHA256).Hash) {
  throw "Installed AMXD differs from the repository artifact."
}
if (-not $SkipBackend) {
  $BackendPython = Join-Path $InstallRoot "venv\Scripts\python.exe"
  if (-not (Test-Path -LiteralPath $BackendPython -PathType Leaf)) { throw "Backend Python is missing: $BackendPython" }
  if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) { throw "Backend configuration is missing: $ConfigPath" }
  Invoke-NativeChecked $BackendPython @((Join-Path $Root "scripts\check_backend.py"), "--python", $BackendPython)
  Write-Host "    Backend health check passed."
}
Write-Host "    Max package and AMXD are byte-identical to this checkout."

Write-Host "`nDrumSLICE ID is ready."
Write-Host "  Device: $DevicePath"
Write-Host "  Max package: $PackageDir"
if (-not $SkipBackend) { Write-Host "  Backend: $(Join-Path $InstallRoot 'venv')" }
Write-Host "`nRestart Live or rescan the User Library, then open:"
Write-Host "  User Library > Presets > MIDI Effects > Max MIDI Effect > DrumSLICE ID"
Write-Host "Place the device immediately before the sliced Drum Rack."
Write-Host "Uninstaller: $(Join-Path $InstallRoot 'uninstall.ps1')"
