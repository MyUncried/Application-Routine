[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Request
)

$ErrorActionPreference = 'Stop'
$repoRoot = (git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) { throw 'KODJO_V2_REPOSITORY_NOT_FOUND' }

$authFile = Join-Path (Join-Path $env:LOCALAPPDATA 'KODJO') 'claude-oauth-token.dpapi'
$supervisedQueue = $env:KODJO_SUPERVISED_QUEUE -eq '1' -and $env:GITHUB_ACTIONS -eq 'true'
$ptr = [IntPtr]::Zero
try {
  if (Test-Path -LiteralPath $authFile -PathType Leaf) {
    $secure = Get-Content -LiteralPath $authFile -Encoding UTF8 | ConvertTo-SecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $env:CLAUDE_CODE_OAUTH_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  }
  elseif (-not $supervisedQueue) {
    throw 'KODJO-V2-CLAUDE-AUTH: configuration Claude absente.'
  }

  Push-Location $repoRoot
  try {
    $requestObject = Get-Content -LiteralPath $Request -Raw -Encoding UTF8 | ConvertFrom-Json
    if ([string]$requestObject.operation_kind -eq 'VISUAL_CORRECTION') {
      & node scripts/kodjo/prepare-visual-recovery.js $Request
      if ($LASTEXITCODE -ne 0) { throw 'KODJO_V2_VISUAL_RECOVERY_PREPARATION_FAILED' }
    }
    & node scripts/kodjo/run-local-claude.js $Request
    exit $LASTEXITCODE
  }
  finally {
    Pop-Location
  }
}
finally {
  Remove-Item Env:CLAUDE_CODE_OAUTH_TOKEN -ErrorAction SilentlyContinue
  if ($ptr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}
