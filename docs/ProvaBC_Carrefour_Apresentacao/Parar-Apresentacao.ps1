[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$pidPath = Join-Path $PSScriptRoot ".presentation-server.pid"

if (-not (Test-Path $pidPath)) {
    Write-Host "Nenhum servidor de apresentacao registrado."
    exit 0
}

$serverPid = Get-Content $pidPath
$process = Get-Process -Id $serverPid -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $serverPid
    Write-Host "Servidor da apresentacao encerrado (PID $serverPid)."
}

Remove-Item $pidPath -Force
Write-Host "Os containers da prova permaneceram ativos."
