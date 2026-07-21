[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    $output = dotnet list FluxoCaixa.sln package --vulnerable --include-transitive `
        --format json --output-version 1

    if ($LASTEXITCODE -ne 0) {
        throw "A auditoria NuGet nao foi executada com sucesso."
    }

    $audit = ($output -join [Environment]::NewLine) | ConvertFrom-Json
    $vulnerablePackages = [System.Collections.Generic.List[string]]::new()

    foreach ($project in @($audit.projects)) {
        foreach ($framework in @($project.frameworks)) {
            if ($null -eq $framework) {
                continue
            }

            $packages = @($framework.topLevelPackages) + @($framework.transitivePackages)
            foreach ($package in $packages) {
                if ($null -eq $package) {
                    continue
                }

                $vulnerabilitiesProperty = $package.PSObject.Properties["vulnerabilities"]
                if ($null -ne $vulnerabilitiesProperty -and
                    @($vulnerabilitiesProperty.Value).Count -gt 0) {
                    $vulnerablePackages.Add("$($project.path): $($package.id) $($package.resolvedVersion)")
                }
            }
        }
    }

    if ($vulnerablePackages.Count -gt 0) {
        $details = $vulnerablePackages -join [Environment]::NewLine
        throw "Pacotes NuGet vulneraveis encontrados:$([Environment]::NewLine)$details"
    }

    [pscustomobject]@{
        Status             = "APROVADO"
        ProjetosAuditados  = @($audit.projects).Count
        PacotesVulneraveis = 0
    } | Format-List
}
finally {
    Pop-Location
}
