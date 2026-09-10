[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$authRoot = Join-Path $env:LOCALAPPDATA 'KODJO'
$authFile = Join-Path $authRoot 'claude-oauth-token.dpapi'

Write-Host 'Cette opération est nécessaire une seule fois.'
Write-Host 'Dans une autre fenêtre PowerShell, exécutez : claude setup-token'
Write-Host 'Copiez le jeton produit, puis revenez ici.'
$secureToken = Read-Host 'Collez le jeton Claude long terme' -AsSecureString
if ($secureToken.Length -lt 20) {
  throw 'KODJO-V2-CLAUDE-AUTH: jeton absent ou trop court.'
}

New-Item -ItemType Directory -Force -Path $authRoot | Out-Null
$secureToken | ConvertFrom-SecureString | Set-Content -LiteralPath $authFile -Encoding UTF8
Write-Host "KODJO_V2_CLAUDE_AUTH=CONFIGURED ($authFile)"
Write-Host 'Le jeton est chiffré par Windows DPAPI et utilisable uniquement par votre compte Windows.'
