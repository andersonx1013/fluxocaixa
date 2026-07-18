[CmdletBinding()]
param(
    [string]$LancamentosUrl = "http://localhost:5101",
    [string]$ConsolidadoUrl = "http://localhost:5102",
    [int]$TimeoutSeconds = 30
)

$ErrorActionPreference = "Stop"
$token = & "$PSScriptRoot\New-LocalJwt.ps1"
$headers = @{ Authorization = "Bearer $token" }
$data = (Get-Date "2090-01-01").AddDays((Get-Random -Minimum 0 -Maximum 3000)).ToString("yyyy-MM-dd")
$ids = [System.Collections.Generic.List[string]]::new()

function Get-ErrorStatusCode {
    param([scriptblock]$Request)

    try {
        & $Request | Out-Null
        return 200
    }
    catch {
        return [int]$_.Exception.Response.StatusCode
    }
}

function New-Lancamento {
    param([int]$Tipo, [decimal]$Valor, [string]$Descricao)

    $body = @{ tipo = $Tipo; valor = $Valor; data = $data; descricao = $Descricao } | ConvertTo-Json
    $created = Invoke-RestMethod -Method Post -Uri "$LancamentosUrl/api/lancamentos" `
        -Headers $headers -ContentType "application/json" -Body $body
    $ids.Add([string]$created.id)
    return $created
}

try {
    Invoke-RestMethod -Uri "$LancamentosUrl/health/ready" | Out-Null
    Invoke-RestMethod -Uri "$ConsolidadoUrl/health/ready" | Out-Null

    $statusSemToken = Get-ErrorStatusCode {
        Invoke-RestMethod -Uri "$LancamentosUrl/api/lancamentos?data=$data"
    }
    $tokenSemRole = & "$PSScriptRoot\New-LocalJwt.ps1" -Role "leitor"
    $statusSemRole = Get-ErrorStatusCode {
        Invoke-RestMethod -Uri "$LancamentosUrl/api/lancamentos?data=$data" `
            -Headers @{ Authorization = "Bearer $tokenSemRole" }
    }
    if ($statusSemToken -ne 401 -or $statusSemRole -ne 403) {
        throw "Seguranca invalida. Esperado 401/403; recebido $statusSemToken/$statusSemRole."
    }

    $credito = New-Lancamento -Tipo 2 -Valor 500.00 -Descricao "Smoke - credito"
    $debito = New-Lancamento -Tipo 1 -Valor 125.50 -Descricao "Smoke - debito"

    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    $consolidado = $null
    while ([DateTime]::UtcNow -lt $deadline) {
        try {
            $response = Invoke-RestMethod -Uri "$ConsolidadoUrl/api/consolidado?data=$data" -Headers $headers
            if ($response.dados.totalCreditos -eq 500.00 -and
                $response.dados.totalDebitos -eq 125.50 -and
                $response.dados.saldoFinal -eq 374.50) {
                $consolidado = $response.dados
                break
            }
        }
        catch {
            # Eventual consistency: 404 is expected until the consumer handles the events.
        }
        Start-Sleep -Milliseconds 250
    }

    if ($null -eq $consolidado) {
        throw "Consolidado nao convergiu em $TimeoutSeconds segundos para a data $data."
    }

    $listagem = Invoke-RestMethod -Uri "$LancamentosUrl/api/lancamentos?data=$data" -Headers $headers
    if (@($listagem.dados).Count -ne 2) {
        throw "A listagem deveria retornar 2 lancamentos, mas retornou $(@($listagem.dados).Count)."
    }

    $dataNova = ([DateTime]::ParseExact($data, "yyyy-MM-dd", [Globalization.CultureInfo]::InvariantCulture)).AddDays(1).ToString("yyyy-MM-dd")
    $updateBody = @{
        tipo = 2
        valor = 200.00
        data = $dataNova
        descricao = "Smoke - alterado entre datas"
    } | ConvertTo-Json
    Invoke-RestMethod -Method Put -Uri "$LancamentosUrl/api/lancamentos/$($debito.id)" `
        -Headers $headers -ContentType "application/json" -Body $updateBody | Out-Null

    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    $mudancaEntreDatasOk = $false
    while ([DateTime]::UtcNow -lt $deadline) {
        try {
            $diaAntigo = Invoke-RestMethod -Uri "$ConsolidadoUrl/api/consolidado?data=$data" -Headers $headers
            $diaNovo = Invoke-RestMethod -Uri "$ConsolidadoUrl/api/consolidado?data=$dataNova" -Headers $headers
            if ($diaAntigo.dados.totalCreditos -eq 500.00 -and
                $diaAntigo.dados.totalDebitos -eq 0 -and
                $diaAntigo.dados.saldoFinal -eq 500.00 -and
                $diaNovo.dados.totalCreditos -eq 200.00 -and
                $diaNovo.dados.saldoFinal -eq 200.00) {
                $mudancaEntreDatasOk = $true
                break
            }
        }
        catch {
            # Wait until both projections converge.
        }
        Start-Sleep -Milliseconds 250
    }

    if (-not $mudancaEntreDatasOk) {
        throw "A alteracao entre as datas $data e $dataNova nao convergiu corretamente."
    }

    [pscustomobject]@{
        Status        = "APROVADO"
        Data          = $data
        TotalCreditos = $consolidado.totalCreditos
        TotalDebitos  = $consolidado.totalDebitos
        SaldoFinal    = $consolidado.saldoFinal
        Seguranca     = "401 sem token / 403 sem role"
        AlteracaoData = "$data -> $dataNova aprovada"
    } | Format-List
}
finally {
    foreach ($id in $ids) {
        try {
            Invoke-RestMethod -Method Delete -Uri "$LancamentosUrl/api/lancamentos/$id" -Headers $headers | Out-Null
        }
        catch {
            Write-Warning "Nao foi possivel remover o lancamento de teste $id."
        }
    }
}
