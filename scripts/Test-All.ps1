[CmdletBinding()]
param(
    [string]$ProjectName = "carrefour-fluxocaixa-prova"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    docker compose config --quiet
    & "$PSScriptRoot\Render-Diagrams.ps1"
    dotnet test FluxoCaixa.sln --configuration Release
    & "$PSScriptRoot\Test-Dependencies.ps1"
    docker compose -p $ProjectName up -d --build
    & "$PSScriptRoot\Test-Smoke.ps1"
    & "$PSScriptRoot\Test-Resilience.ps1" -ProjectName $ProjectName
    & "$PSScriptRoot\Test-Outbox.ps1" -ProjectName $ProjectName
    & "$PSScriptRoot\Test-Load.ps1"
}
finally {
    Pop-Location
}
