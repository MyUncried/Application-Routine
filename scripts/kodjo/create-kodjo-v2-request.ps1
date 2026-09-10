[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][ValidatePattern('^[A-Za-z0-9._-]{1,80}$')][string]$SliceId,
  [Parameter(Mandatory = $true)][string]$PromptFile,
  [Parameter(Mandatory = $true)][string[]]$ScopeAllow,
  [ValidateSet('INITIAL', 'RESUME_DELTA')][string]$Mode = 'INITIAL',
  [string]$SessionId = '',
  [string[]]$Checks = @('jest', 'typescript', 'lint'),
  [string]$Output = ''
)

$ErrorActionPreference = 'Stop'
$repoRoot = (git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) { throw 'KODJO_V2_REPOSITORY_NOT_FOUND' }
$head = (git rev-parse HEAD).Trim()
$promptAbsolute = if ([IO.Path]::IsPathRooted($PromptFile)) {
  [IO.Path]::GetFullPath($PromptFile)
} else {
  [IO.Path]::GetFullPath((Join-Path (Get-Location) $PromptFile))
}
$repoAbsolute = [IO.Path]::GetFullPath($repoRoot)
if (-not $promptAbsolute.StartsWith($repoAbsolute, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'PROMPT_FILE_MUST_BE_INSIDE_REPOSITORY'
}
$relativePrompt = [IO.Path]::GetRelativePath($repoAbsolute, $promptAbsolute).Replace('\', '/')
if ($Mode -eq 'INITIAL' -and $SessionId) { throw 'INITIAL_SESSION_MUST_BE_NULL' }
if ($Mode -eq 'RESUME_DELTA' -and -not $SessionId) { throw 'RESUME_SESSION_ID_REQUIRED' }
if (-not $Output) {
  $requestRoot = Join-Path (Join-Path $env:LOCALAPPDATA 'KODJO') 'requests'
  New-Item -ItemType Directory -Force -Path $requestRoot | Out-Null
  $Output = Join-Path $requestRoot ("{0}-{1}.json" -f $SliceId, (Get-Date -Format 'yyyyMMdd-HHmmss'))
}

$request = [ordered]@{
  schema_version = 'kodjo.protocol.v2.local-implementation.0.6.11'
  slice_id = $SliceId
  source_head = $head
  mode = $Mode
  session_id = $(if ($SessionId) { $SessionId } else { $null })
  prompt_file = $relativePrompt
  scope_allow = @($ScopeAllow)
  checks = @($Checks)
  limits = [ordered]@{
    max_ai_calls = 1
    max_turns = 12
    max_duration_seconds = 3600
    max_prompt_bytes = 32768
    max_total_prompt_bytes = 32768
    max_rollovers = 0
  }
}
$request | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $Output -Encoding UTF8
Write-Host "KODJO_V2_REQUEST_CREATED=$Output"
