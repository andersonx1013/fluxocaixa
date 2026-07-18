[CmdletBinding()]
param(
    [string]$ProjectName = "fluxocaixa",
    [string]$LancamentosUrl = "http://localhost:5101",
    [string]$ConsolidadoUrl = "http://localhost:5102",
    [int]$TimeoutSeconds = 45
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$token = & "$PSScriptRoot\New-LocalJwt.ps1"
$headers = @{ Authorization = "Bearer $token" }
$data = (Get-Date "2120-01-01").AddDays((Get-Random -Minimum 0 -Maximum 3000)).ToString("yyyy-MM-dd")
$createdId = $null

Push-Location $root
try {
    docker compose -p $ProjectName stop rabbitmq | Out-Null

    $body = @{
        tipo = 2
        valor = 888.88
        data = $data
        descricao = "Teste de Outbox com broker indisponivel"
    } | ConvertTo-Json

    $created = Invoke-RestMethod -Method Post -Uri "$LancamentosUrl/api/lancamentos" `
        -Headers $headers -ContentType "application/json" -Body $body
    $createdId = [string]$created.id

    $persisted = Invoke-RestMethod -Uri "$LancamentosUrl/api/lancamentos/$createdId" -Headers $headers
    if ($persisted.dados.valor -ne 888.88) {
        throw "O lancamento nao foi persistido enquanto o RabbitMQ estava parado."
    }

    docker compose -p $ProjectName start rabbitmq | Out-Null

    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    $saldoFinal = $null
    while ([DateTime]::UtcNow -lt $deadline) {
        try {
            $response = Invoke-RestMethod -Uri "$ConsolidadoUrl/api/consolidado?data=$data" -Headers $headers
            if ($response.dados.saldoFinal -eq 888.88) {
                $saldoFinal = $response.dados.saldoFinal
                break
            }
        }
        catch {
            # Outbox publisher and consumer reconnect asynchronously.
        }
        Start-Sleep -Milliseconds 500
    }

    if ($null -eq $saldoFinal) {
        throw "O evento do Outbox nao convergiu apos a recuperacao do RabbitMQ."
    }

    [pscustomobject]@{
        Status                = "APROVADO"
        LancamentoSemBroker   = $createdId
        Data                  = $data
        SaldoAposRecuperacao  = $saldoFinal
        PerdaDeEventos        = "0%"
    } | Format-List
}
finally {
    docker compose -p $ProjectName start rabbitmq | Out-Null
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
