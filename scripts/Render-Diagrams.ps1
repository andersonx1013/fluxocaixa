[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$diagramPath = Join-Path (Join-Path $root "docs") "diagrams"

docker run --rm `
    -v "${diagramPath}:/workspace" `
    plantuml/plantuml:1.2026.6 `
    -charset UTF-8 -tpng -failfast2 "/workspace/*.puml"

if ($LASTEXITCODE -ne 0) {
    throw "Falha ao renderizar os diagramas PlantUML."
}

Write-Output "Diagramas renderizados em $diagramPath"
