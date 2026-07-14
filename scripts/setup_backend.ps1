param(
  [string]$InstallRoot = "$HOME\.drumslice-id",
  [string]$Python = "python",
  [string]$ConfigPath = "$HOME\.drumslice-id\backend-config.json",
  [switch]$AcceptAdtofLicense
)
$ErrorActionPreference = "Stop"
if (-not $PSBoundParameters.ContainsKey("InstallRoot")) {
  if (-not [string]::IsNullOrWhiteSpace($env:DRUMSLICE_ID_HOME)) { $InstallRoot = $env:DRUMSLICE_ID_HOME }
  elseif (-not [string]::IsNullOrWhiteSpace($env:SLICE_LABELER_HOME)) { $InstallRoot = $env:SLICE_LABELER_HOME }
}
if (-not $PSBoundParameters.ContainsKey("ConfigPath")) {
  if (-not [string]::IsNullOrWhiteSpace($env:DRUMSLICE_ID_BACKEND_CONFIG)) { $ConfigPath = $env:DRUMSLICE_ID_BACKEND_CONFIG }
  elseif (-not [string]::IsNullOrWhiteSpace($env:SLICE_LABELER_BACKEND_CONFIG)) { $ConfigPath = $env:SLICE_LABELER_BACKEND_CONFIG }
}
if (-not $AcceptAdtofLicense -and $env:DRUMSLICE_ID_ACCEPT_ADTOF_LICENSE -ne "1") {
  throw "Refusing to download the external ADTOF backend without explicit acknowledgement. Run install.ps1 with -AcceptAdtofLicense; see THIRD_PARTY_NOTICES.md."
}
function Invoke-Native {
  param([string]$Command, [string[]]$Arguments)
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code $LASTEXITCODE`: $Command $($Arguments -join ' ')"
  }
}
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Venv = Join-Path $InstallRoot "venv"
Invoke-Native $Python @("-c", "import sys; raise SystemExit(0 if (3, 10) <= sys.version_info[:2] < (3, 13) else 1)")
New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null
Invoke-Native $Python @("-m", "venv", $Venv)
$VenvPython = Join-Path $Venv "Scripts\python.exe"
Invoke-Native $VenvPython @("-m", "pip", "install", "--upgrade", "pip==26.1.2", "setuptools==80.9.0")
Invoke-Native $VenvPython @("-m", "pip", "install", "--no-build-isolation", "-r", (Join-Path $Root "python\requirements.lock"))
Invoke-Native $VenvPython @("-m", "pip", "install", "--no-build-isolation", "--no-deps", (Join-Path $Root "python"))
Invoke-Native $VenvPython @((Join-Path $Root "scripts\check_backend.py"), "--python", $VenvPython)
$Config = @{schemaVersion=1; python=$VenvPython; backend="adtof"; revision="85c192e78f716ea0b111cc8a5ee4a8f6a3a4f8a9"} | ConvertTo-Json
$ConfigPath = [System.IO.Path]::GetFullPath($ConfigPath)
$ConfigDirectory = [System.IO.Path]::GetDirectoryName($ConfigPath)
New-Item -ItemType Directory -Force -Path $ConfigDirectory | Out-Null
$ConfigTemporary = "$ConfigPath.tmp-$PID"
try {
  [System.IO.File]::WriteAllText($ConfigTemporary, $Config + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))
  Move-Item -Force $ConfigTemporary $ConfigPath
} finally {
  Remove-Item -Force -ErrorAction SilentlyContinue $ConfigTemporary
}
Write-Host "DrumSLICE ID backend configured at $Venv"
Write-Host "Backend configuration written to $ConfigPath"
