param(
  [string]$InstallRoot = "$HOME\.slice-labeler",
  [string]$Python = "python"
)
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Venv = Join-Path $InstallRoot "venv"
New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null
& $Python -m venv $Venv
$VenvPython = Join-Path $Venv "Scripts\python.exe"
& $VenvPython -m pip install --upgrade pip
& $VenvPython -m pip install "$Root\python[adtof]"
& $VenvPython "$Root\scripts\check_backend.py" --python $VenvPython
$Config = @{schemaVersion=1; python=$VenvPython; backend="adtof"; revision="85c192e78f716ea0b111cc8a5ee4a8f6a3a4f8a9"} | ConvertTo-Json
$Config | Set-Content -Encoding UTF8 (Join-Path $InstallRoot "backend-config.json")
Write-Host "Slice Labeler backend configured at $Venv"
