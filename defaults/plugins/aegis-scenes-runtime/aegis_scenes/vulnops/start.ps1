param([ValidateRange(1024,65535)][int]$Port = 8765, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot
$venvDir = Join-Path $projectDir '.venv'
$pythonExe = Join-Path $venvDir 'Scripts\python.exe'
Push-Location $projectDir
try {
    $health = $null
    try { $health = Invoke-RestMethod "http://127.0.0.1:$Port/api/health" -TimeoutSec 2 } catch { }
    if ($health.service -eq 'VulnOps') {
        Write-Host "VulnOps is already running: http://127.0.0.1:$Port" -ForegroundColor Green
        if (-not $NoBrowser) { Start-Process "http://127.0.0.1:$Port" }
        return
    }
    if (-not (Test-Path -LiteralPath $pythonExe)) {
        $uvCommand = Get-Command uv -ErrorAction SilentlyContinue
        if ($uvCommand) {
            & $uvCommand.Source venv $venvDir --python 3.11
        } else {
            & python -m venv $venvDir
        }
        if ($LASTEXITCODE -ne 0) { throw 'Cannot create Python environment. Install Python 3.11+ or uv and retry.' }
    }
    & $pythonExe -c 'import fastapi, uvicorn, multipart' 2>$null
    if ($LASTEXITCODE -ne 0) {
        $uvCommand = Get-Command uv -ErrorAction SilentlyContinue
        if ($uvCommand) {
            & $uvCommand.Source pip install --python $pythonExe -r requirements-lock.txt
        } else {
            & $pythonExe -m pip install -r requirements-lock.txt
        }
        if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Check your network connection and retry.' }
    }
    $env:VULNOPS_PORT = [string]$Port
    $env:VULNOPS_OPEN_BROWSER = if ($NoBrowser) { '0' } else { '1' }
    Write-Host "VulnOps: http://127.0.0.1:$Port" -ForegroundColor Green
    Write-Host 'Keep this window open. Press Ctrl+C to stop. Data is saved in the data folder.'
    & $pythonExe app.py
} finally {
    Pop-Location
}
