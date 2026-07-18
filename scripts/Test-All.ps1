[CmdletBinding()]
param(
    [string]$ProjectName = "carrefour-fluxocaixa-prova"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    dotnet test FluxoCaixa.sln --configuration Release
    docker compose -p $ProjectName up -d --build
    & "$PSScriptRoot\Test-Smoke.ps1"
    & "$PSScriptRoot\Test-Resilience.ps1" -ProjectName $ProjectName
    & "$PSScriptRoot\Test-Outbox.ps1" -ProjectName $ProjectName
    & "$PSScriptRoot\Test-Load.ps1"
}
finally {
    Pop-Location
}
