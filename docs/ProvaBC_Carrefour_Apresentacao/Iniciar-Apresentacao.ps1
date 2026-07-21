[CmdletBinding()]
param(
    [switch]$SkipDocker,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$presentationRoot = $PSScriptRoot
$projectRoot = (Resolve-Path (Join-Path $presentationRoot "..\..")).Path
$serverPath = Join-Path $presentationRoot "web\server.mjs"
$pidPath = Join-Path $presentationRoot ".presentation-server.pid"
$url = "http://127.0.0.1:4177"

if (-not (Test-Path $projectRoot)) {
    throw "Projeto nao encontrado em $projectRoot."
}

if (-not $SkipDocker) {
    Push-Location $projectRoot
    try {
        docker compose up -d | Out-Host
        if ($LASTEXITCODE -ne 0) {
            throw "Nao foi possivel iniciar o ambiente Docker da prova."
        }
    }
    finally {
        Pop-Location
    }
}

if (Test-Path $pidPath) {
    $existingPid = Get-Content $pidPath -ErrorAction SilentlyContinue
    if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
        Write-Host "Servidor da apresentacao ja esta ativo (PID $existingPid)."
    }
    else {
        Remove-Item $pidPath -Force -ErrorAction SilentlyContinue
    }
}

if (-not (Test-Path $pidPath)) {
    $node = (Get-Command node -ErrorAction Stop).Source
    $process = Start-Process -FilePath $node `
        -ArgumentList @($serverPath) `
        -WorkingDirectory (Join-Path $presentationRoot "web") `
        -WindowStyle Hidden `
        -PassThru
    Set-Content -Path $pidPath -Value $process.Id -Encoding ascii
    Write-Host "Servidor iniciado (PID $($process.Id))."
}

$deadline = (Get-Date).AddSeconds(20)
do {
    try {
        Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 | Out-Null
        break
    }
    catch {
        Start-Sleep -Milliseconds 300
    }
} while ((Get-Date) -lt $deadline)

if ((Get-Date) -ge $deadline) {
    throw "A apresentacao nao respondeu em $url."
}

if (-not $NoBrowser) {
    Start-Process $url
}

Write-Host "Apresentacao pronta em $url"
Write-Host "Use .\Parar-Apresentacao.ps1 para encerrar somente o servidor visual."
