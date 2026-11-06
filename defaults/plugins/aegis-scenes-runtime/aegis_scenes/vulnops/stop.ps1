param([ValidateRange(1024,65535)][int]$Port = 8765)
$ErrorActionPreference = 'Stop'
$expectedPython = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '.venv\Scripts\python.exe'))
$listeners = @(Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
if (-not $listeners.Count) { Write-Host "No running server on port $Port."; return }
foreach ($listener in $listeners) {
    $serverProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
    if (-not $serverProcess.ExecutablePath -or -not [string]::Equals($serverProcess.ExecutablePath, $expectedPython, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Port $Port is owned by another executable. No process was stopped."
    }
    if ($serverProcess.CommandLine -notmatch '(?i)\bapp\.py\b') {
        throw "Port $Port does not match the VulnOps application. No process was stopped."
    }
    Stop-Process -Id $serverProcess.ProcessId
    Write-Host "Stopped VulnOps process $($serverProcess.ProcessId). Data is retained."
}
