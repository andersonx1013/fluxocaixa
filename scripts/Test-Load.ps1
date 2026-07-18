[CmdletBinding()]
param(
    [int]$RequestsPerSecond = 50,
    [int]$DurationSeconds = 10,
    [decimal]$MaximumLossPercent = 5,
    [string]$LancamentosUrl = "http://localhost:5101",
    [string]$ConsolidadoUrl = "http://localhost:5102"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

$token = & "$PSScriptRoot\New-LocalJwt.ps1"
$headers = @{ Authorization = "Bearer $token" }
$data = (Get-Date "2110-01-01").AddDays((Get-Random -Minimum 0 -Maximum 3000)).ToString("yyyy-MM-dd")
$createdId = $null
$client = [Net.Http.HttpClient]::new()
$client.DefaultRequestHeaders.Authorization = [Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $token)

try {
    $body = @{ tipo = 2; valor = 1.00; data = $data; descricao = "Preparacao do teste de carga" } | ConvertTo-Json
    $created = Invoke-RestMethod -Method Post -Uri "$LancamentosUrl/api/lancamentos" `
        -Headers $headers -ContentType "application/json" -Body $body
    $createdId = [string]$created.id

    $deadline = [DateTime]::UtcNow.AddSeconds(30)
    while ([DateTime]::UtcNow -lt $deadline) {
        try {
            Invoke-RestMethod -Uri "$ConsolidadoUrl/api/consolidado?data=$data" -Headers $headers | Out-Null
            break
        }
        catch {
            Start-Sleep -Milliseconds 250
        }
    }

    $total = $RequestsPerSecond * $DurationSeconds
    $uri = "$ConsolidadoUrl/api/consolidado?data=$data"
    $tasks = [System.Collections.Generic.List[object]]::new()
    $watch = [Diagnostics.Stopwatch]::StartNew()

    for ($index = 0; $index -lt $total; $index++) {
        $targetMilliseconds = ($index * 1000.0) / $RequestsPerSecond
        $remaining = $targetMilliseconds - $watch.Elapsed.TotalMilliseconds
        if ($remaining -ge 1) {
            Start-Sleep -Milliseconds ([int][Math]::Floor($remaining))
        }
        $tasks.Add($client.GetAsync($uri))
    }

    $taskArray = [System.Threading.Tasks.Task[]]@($tasks)
    [System.Threading.Tasks.Task]::WaitAll($taskArray)
    $watch.Stop()

    $success = 0
    foreach ($task in $tasks) {
        $response = $task.Result
        try {
            if ([int]$response.StatusCode -eq 200) {
                $success++
            }
        }
        finally {
            $response.Dispose()
        }
    }

    $failed = $total - $success
    $lossPercent = if ($total -eq 0) { 0 } else { [Math]::Round(($failed * 100.0) / $total, 2) }
    $throughput = [Math]::Round($total / $watch.Elapsed.TotalSeconds, 2)

    [pscustomobject]@{
        Status            = if ($lossPercent -le $MaximumLossPercent) { "APROVADO" } else { "REPROVADO" }
        Requisicoes       = $total
        Sucessos          = $success
        Falhas            = $failed
        PerdaPercentual   = "$lossPercent%"
        VazaoObservadaRps = $throughput
        MetaRps           = $RequestsPerSecond
    } | Format-List

    if ($lossPercent -gt $MaximumLossPercent) {
        throw "Perda de $lossPercent% excedeu o limite de $MaximumLossPercent%."
    }
}
finally {
    $client.Dispose()
    if ($createdId) {
        try {
            Invoke-RestMethod -Method Delete -Uri "$LancamentosUrl/api/lancamentos/$createdId" -Headers $headers | Out-Null
        }
        catch {
            Write-Warning "Nao foi possivel remover o lancamento de teste $createdId."
        }
    }
}
