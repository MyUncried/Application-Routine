[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][ValidatePattern('^[A-Za-z0-9._-]{1,80}$')][string]$SliceId,
  [Parameter(Mandatory = $true)][string]$PromptFile,
  [Parameter(Mandatory = $true)][string[]]$ScopeAllow,
  [Parameter(Mandatory = $true)][string]$SliceBootstrapFile,
  [ValidateSet('INITIAL', 'RESUME_DELTA')][string]$Mode = 'INITIAL',
  [string]$RetryOfRunId = '',
  [string]$RetryReasonCode = '',
  [string]$RetryReasonDetail = '',
  [string]$SessionId = ''
)

$ErrorActionPreference = 'Stop'
$requestRoot = Join-Path (Join-Path $env:LOCALAPPDATA 'KODJO') 'requests'
New-Item -ItemType Directory -Force -Path $requestRoot | Out-Null
$request = Join-Path $requestRoot ("{0}-{1}.json" -f $SliceId, (Get-Date -Format 'yyyyMMdd-HHmmss'))

& (Join-Path $PSScriptRoot 'create-kodjo-v2-request.ps1') `
  -SliceId $SliceId -PromptFile $PromptFile -ScopeAllow $ScopeAllow -SliceBootstrapFile $SliceBootstrapFile -Mode $Mode -SessionId $SessionId -RetryOfRunId $RetryOfRunId -RetryReasonCode $RetryReasonCode -RetryReasonDetail $RetryReasonDetail -Output $request
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& (Join-Path $PSScriptRoot 'start-kodjo-v2.ps1') -Request $request
exit $LASTEXITCODE
