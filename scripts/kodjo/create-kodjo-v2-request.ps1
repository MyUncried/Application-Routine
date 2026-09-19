[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][ValidatePattern('^[A-Za-z0-9._-]{1,80}$')][string]$SliceId,
  [Parameter(Mandatory = $true)][string]$PromptFile,
  [Parameter(Mandatory = $true)][string[]]$ScopeAllow,
  [Parameter(Mandatory = $true)][string]$SliceBootstrapFile,
  [ValidateSet('INITIAL', 'RESUME_DELTA')][string]$Mode = 'INITIAL',
  [string]$RecoveryMigrationFile = '',
  [string]$RetryOfRunId = '',
  [string]$RetryReasonCode = '',
  [string]$RetryReasonDetail = '',
  [string]$SessionId = '',
  [string[]]$Checks = @('jest', 'typescript', 'lint'),
  [string]$Output = ''
)

$ErrorActionPreference = 'Stop'
$repoRoot = (git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) { throw 'KODJO_V2_REPOSITORY_NOT_FOUND' }
$head = (git rev-parse HEAD).Trim()
$repoAbsolute = [IO.Path]::GetFullPath($repoRoot)
$bootstrapAbsolute = if ([IO.Path]::IsPathRooted($SliceBootstrapFile)) {
  [IO.Path]::GetFullPath($SliceBootstrapFile)
} else {
  [IO.Path]::GetFullPath((Join-Path $repoRoot $SliceBootstrapFile))
}
if (-not $bootstrapAbsolute.StartsWith($repoAbsolute + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'SLICE_BOOTSTRAP_FILE_MUST_BE_INSIDE_REPOSITORY'
}
$bootstrapRelative = $bootstrapAbsolute.Substring($repoAbsolute.Length).TrimStart([char[]]'\/').Replace('\', '/')
$bootstrapHash = (& node (Join-Path $PSScriptRoot 'validate-slice-bootstrap.js') $repoRoot $bootstrapRelative $head).Trim()
if ($LASTEXITCODE -ne 0 -or $bootstrapHash -notmatch '^[0-9a-f]{64}$') { throw 'KODJO_V2_IDENTITY_REFUSED' }
$bootstrap = Get-Content -LiteralPath $bootstrapAbsolute -Raw -Encoding UTF8 | ConvertFrom-Json
$promptAbsolute = if ([IO.Path]::IsPathRooted($PromptFile)) {
  [IO.Path]::GetFullPath($PromptFile)
} else {
  [IO.Path]::GetFullPath((Join-Path (Get-Location) $PromptFile))
}
$repoAbsolute = [IO.Path]::GetFullPath($repoRoot)
if (-not $promptAbsolute.StartsWith($repoAbsolute, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'PROMPT_FILE_MUST_BE_INSIDE_REPOSITORY'
}
$relativePrompt = $promptAbsolute.Substring($repoAbsolute.Length).TrimStart([char[]]'\/').Replace('\', '/')
if ($Mode -eq 'INITIAL' -and $SessionId) { throw 'INITIAL_SESSION_MUST_BE_NULL' }
if ($Mode -eq 'RESUME_DELTA' -and -not $SessionId) { throw 'RESUME_SESSION_ID_REQUIRED' }
if (-not $Output) {
  $requestRoot = Join-Path (Join-Path $env:LOCALAPPDATA 'KODJO') 'requests'
  New-Item -ItemType Directory -Force -Path $requestRoot | Out-Null
  $Output = Join-Path $requestRoot ("{0}-{1}.json" -f $SliceId, (Get-Date -Format 'yyyyMMdd-HHmmss'))
}

$request = [ordered]@{
  schema_version = 'kodjo.protocol.v2.local-implementation.0.6.12'
  request_id = [Guid]::NewGuid().ToString()
  slice_id = $SliceId
  source_head = $head
  baseline_head = $bootstrap.baseline_head
  slice_bootstrap_file = $bootstrapRelative
  slice_bootstrap_sha256 = $bootstrapHash
  mode = $Mode
  session_id = $(if ($SessionId) { $SessionId } else { $null })
  prompt_file = $relativePrompt
  scope_allow = @($ScopeAllow)
  checks = @($Checks)
  limits = [ordered]@{
    max_ai_calls = 1
    max_duration_seconds = 3600
    max_prompt_bytes = 32768
    max_total_prompt_bytes = 32768
    max_rollovers = 0
  }
}
if ($Mode -eq 'RESUME_DELTA') {
  if ($RetryOfRunId -notmatch '^[1-9][0-9]*$' -or -not $RetryReasonCode -or -not $RetryReasonDetail) { throw 'RESUME_CAUSALITY_REQUIRED' }
  $request.retry_of_run_id = $RetryOfRunId
  $request.retry_reason = [ordered]@{ code = $RetryReasonCode; detail = $RetryReasonDetail }
} elseif ($RetryOfRunId -or $RetryReasonCode -or $RetryReasonDetail) { throw 'INITIAL_RETRY_FIELDS_FORBIDDEN' }
if ($RecoveryMigrationFile) {
  if ($Mode -ne 'RESUME_DELTA') { throw 'INITIAL_RECOVERY_MIGRATION_FORBIDDEN' }
  if ($RecoveryMigrationFile -notmatch '^\.github/orchestration/v2-slices/[A-Za-z0-9._-]+/recovery-migration-[A-Za-z0-9._-]+\.json$' -or $RecoveryMigrationFile.Contains('..')) {
    throw 'RECOVERY_MIGRATION_ATTESTATION_PATH_INVALID'
  }
  $migrationOid = (& git rev-parse ($head + ':' + $RecoveryMigrationFile))
  if ($LASTEXITCODE -ne 0 -or [string]$migrationOid -notmatch '^[0-9a-f]{40}$') { throw 'RECOVERY_MIGRATION_ATTESTATION_NOT_AT_TARGET' }
  $request.recovery_migration = [ordered]@{
    attestation_path = $RecoveryMigrationFile
    attestation_blob_oid = ([string]$migrationOid).Trim()
    evidence_kind = 'ARTIFACT_HASH'
  }
}
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText([IO.Path]::GetFullPath($Output), ($request | ConvertTo-Json -Depth 5), $utf8NoBom)
Write-Host "KODJO_V2_REQUEST_CREATED=$Output"
