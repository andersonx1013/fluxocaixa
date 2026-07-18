[CmdletBinding()]
param(
    [string]$ProjectName = "carrefour-fluxocaixa-prova",
    [string]$LancamentosUrl = "http://localhost:5101",
    [string]$ConsolidadoUrl = "http://localhost:5102",
    [int]$TimeoutSeconds = 45
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$token = & "$PSScriptRoot\New-LocalJwt.ps1"
$headers = @{ Authorization = "Bearer $token" }
$data = (Get-Date "2100-01-01").AddDays((Get-Random -Minimum 0 -Maximum 3000)).ToString("yyyy-MM-dd")
$createdId = $null

Push-Location $root
try {
    docker compose -p $ProjectName stop api-consolidado | Out-Null

    $body = @{
        tipo = 2
        valor = 777.77
        data = $data
        descricao = "Teste com consolidado indisponivel"
    } | ConvertTo-Json

    $created = Invoke-RestMethod -Method Post -Uri "$LancamentosUrl/api/lancamentos" `
        -Headers $headers -ContentType "application/json" -Body $body
    $createdId = [string]$created.id

    $persisted = Invoke-RestMethod -Uri "$LancamentosUrl/api/lancamentos/$createdId" -Headers $headers
    if ($persisted.dados.valor -ne 777.77) {
        throw "O lancamento nao permaneceu disponivel durante a queda do consolidado."
    }

    docker compose -p $ProjectName start api-consolidado | Out-Null

    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    $saldoFinal = $null
    while ([DateTime]::UtcNow -lt $deadline) {
        try {
            $response = Invoke-RestMethod -Uri "$ConsolidadoUrl/api/consolidado?data=$data" -Headers $headers
            if ($response.dados.saldoFinal -eq 777.77) {
                $saldoFinal = $response.dados.saldoFinal
                break
            }
        }
        catch {
            # The API and consumer need a short startup/reconnection interval.
        }
        Start-Sleep -Milliseconds 500
    }

    if ($null -eq $saldoFinal) {
        throw "O evento acumulado nao foi consolidado apos a recuperacao em $TimeoutSeconds segundos."
    }

    [pscustomobject]@{
        Status                  = "APROVADO"
        LancamentoDuranteQueda = $createdId
        Data                    = $data
        SaldoAposRecuperacao    = $saldoFinal
        PerdaDeEventos          = "0%"
    } | Format-List
}
finally {
    docker compose -p $ProjectName start api-consolidado | Out-Null
    if ($createdId) {
        try {
            Invoke-RestMethod -Method Delete -Uri "$LancamentosUrl/api/lancamentos/$createdId" -Headers $headers | Out-Null
        }
        catch {
            Write-Warning "Nao foi possivel remover o lancamento de teste $createdId."
        }
    }
    Pop-Location
}
