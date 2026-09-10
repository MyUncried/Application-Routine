[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Request
)

$ErrorActionPreference = 'Stop'
$repoRoot = (git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) { throw 'KODJO_V2_REPOSITORY_NOT_FOUND' }

$authFile = Join-Path (Join-Path $env:LOCALAPPDATA 'KODJO') 'claude-oauth-token.dpapi'
if (-not (Test-Path -LiteralPath $authFile -PathType Leaf)) {
  throw 'KODJO-V2-CLAUDE-AUTH: exécutez scripts\kodjo\setup-kodjo-claude-auth.ps1 une fois.'
}

$secure = Get-Content -LiteralPath $authFile -Encoding UTF8 | ConvertTo-SecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $env:CLAUDE_CODE_OAUTH_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  Push-Location $repoRoot
  try {
    & node scripts/kodjo/run-local-claude.js $Request
    exit $LASTEXITCODE
  }
  finally {
    Pop-Location
  }
}
finally {
  Remove-Item Env:CLAUDE_CODE_OAUTH_TOKEN -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
