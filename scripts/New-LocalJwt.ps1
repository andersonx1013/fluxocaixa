[CmdletBinding()]
param(
    [int]$ExpirationMinutes = 60,
    [string]$Subject = "avaliador-local",
    [string]$Role = "comerciante",
    [string]$Secret = "CarrefourFluxoCaixaSecretKey2024!@#$%"
)

$ErrorActionPreference = "Stop"

function ConvertTo-Base64Url {
    param([byte[]]$Bytes)

    return [Convert]::ToBase64String($Bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

$now = [DateTimeOffset]::UtcNow
$headerJson = @{ alg = "HS256"; typ = "JWT" } | ConvertTo-Json -Compress
$payloadJson = @{
    sub  = $Subject
    name = "Avaliador Local"
    role = $Role
    iss  = "FluxoCaixa"
    aud  = "FluxoCaixaAPI"
    iat  = $now.ToUnixTimeSeconds()
    nbf  = $now.AddSeconds(-5).ToUnixTimeSeconds()
    exp  = $now.AddMinutes($ExpirationMinutes).ToUnixTimeSeconds()
    jti  = [Guid]::NewGuid().ToString()
} | ConvertTo-Json -Compress

$header = ConvertTo-Base64Url ([Text.Encoding]::UTF8.GetBytes($headerJson))
$payload = ConvertTo-Base64Url ([Text.Encoding]::UTF8.GetBytes($payloadJson))
$unsignedToken = "$header.$payload"

$hmac = [Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($Secret))
try {
    $signature = ConvertTo-Base64Url ($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($unsignedToken)))
}
finally {
    $hmac.Dispose()
}

Write-Output "$unsignedToken.$signature"
