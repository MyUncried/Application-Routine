[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][ValidatePattern('^[0-9a-f]{40}$')][string]$ExpectedHead,
  [Parameter(Mandatory = $true)][ValidatePattern('^\d+$')][string]$SourceRunId,
  [Parameter(Mandatory = $true)][string]$SourceEvidenceDirectory,
  [Parameter(Mandatory = $true)][string]$EvidenceDirectory
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$slice = 'V2-QUALIF-00'
$bootstrap = '.github/orchestration/v2-slices/V2-QUALIF-00/slice-bootstrap.json'
$prompt = '.github/orchestration/v2-slices/V2-QUALIF-00/implementation-mission.md'
$scope = 'tests/fixtures/qualif/**'
$source = (git rev-parse --show-toplevel).Trim()
$root = Join-Path $env:RUNNER_TEMP ('kodjo-qualif-resume-' + $env:GITHUB_RUN_ID + '-' + $env:GITHUB_RUN_ATTEMPT)
$origin = Join-Path $root 'origin.git'
$work = Join-Path $root 'work'
$state = Join-Path $root 'state'
$evidence = [IO.Path]::GetFullPath($EvidenceDirectory)
$sourceEvidence = [IO.Path]::GetFullPath($SourceEvidenceDirectory)
$manifest = [ordered]@{
  schema_version = 'kodjo.protocol.v2.disposable-resume-qualification.0.6.21'
  slice_id = $slice
  stage = 'RESUME_DELTA'
  github_run_id = $env:GITHUB_RUN_ID
  github_run_attempt = $env:GITHUB_RUN_ATTEMPT
  source_run_id = $SourceRunId
  expected_head = $ExpectedHead
  observed_head = $null
  source_session_id = $null
  returned_session_id = $null
  claude_invoked = $false
  recovered_files = @()
  remote_branch_created = $false
  pull_request_created = $false
  integrated_in_main = $false
  workflow_technical_status = 'IN_PROGRESS'
  verdict = 'FAIL'
}

function Invoke-Native {
  param([string]$File, [string[]]$Arguments, [string]$WorkingDirectory, [switch]$AllowFailure)
  Push-Location $WorkingDirectory
  $previous = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $output = & $File @Arguments 2>&1
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previous
    Pop-Location
  }
  $text = ($output | Out-String).Trim()
  if ($code -ne 0 -and -not $AllowFailure) { throw ($File + ' failed (' + $code + '): ' + $text) }
  return New-Object psobject -Property @{ Code = $code; Output = $text }
}

New-Item -ItemType Directory -Force -Path $evidence | Out-Null
try {
  if ($PSVersionTable.PSVersion.Major -ne 5 -or $PSVersionTable.PSVersion.Minor -ne 1) {
    throw ('WINDOWS_POWERSHELL_5_1_REQUIRED: ' + $PSVersionTable.PSVersion)
  }
  foreach ($tool in @('git', 'node', 'npm.cmd', 'claude')) {
    if ($null -eq (Get-Command $tool -ErrorAction SilentlyContinue)) { throw ('TOOL_MISSING: ' + $tool) }
  }
  $manifest.observed_head = (Invoke-Native 'git' @('rev-parse', 'HEAD') $source).Output
  if ($manifest.observed_head -ne $ExpectedHead) { throw ('HEAD_MISMATCH: ' + $manifest.observed_head) }
  if ((Invoke-Native 'git' @('status', '--porcelain', '--untracked-files=all') $source).Output) { throw 'SOURCE_WORKTREE_DIRTY' }

  $sourceManifestPath = Join-Path $sourceEvidence 'qualification-manifest.json'
  $sourceResultPath = Join-Path $sourceEvidence 'result.json'
  $sourcePackage = Join-Path $sourceEvidence 'recovery-package'
  foreach ($required in @($sourceManifestPath, $sourceResultPath, (Join-Path $sourcePackage 'manifest.json'), (Join-Path $sourcePackage 'payload.patch'))) {
    if (-not (Test-Path -LiteralPath $required)) { throw ('SOURCE_EVIDENCE_MISSING: ' + $required) }
  }
  $sourceManifest = Get-Content -Raw -LiteralPath $sourceManifestPath | ConvertFrom-Json
  $sourceResult = Get-Content -Raw -LiteralPath $sourceResultPath | ConvertFrom-Json
  if ([string]$sourceManifest.github_run_id -ne $SourceRunId -or $sourceManifest.expected_head -ne $ExpectedHead -or $sourceManifest.verdict -ne 'PASS') {
    throw 'SOURCE_QUALIFICATION_INCOMPATIBLE'
  }
  if ($sourceResult.claude_invoked -ne $true -or $sourceResult.source_head -ne $ExpectedHead -or [string]::IsNullOrWhiteSpace($sourceResult.session_id)) {
    throw 'SOURCE_RESULT_INCOMPATIBLE'
  }
  $manifest.source_session_id = $sourceResult.session_id

  if (Test-Path -LiteralPath $root) { throw ('QUALIFICATION_ROOT_ALREADY_EXISTS: ' + $root) }
  New-Item -ItemType Directory -Force -Path $root | Out-Null
  Invoke-Native 'git' @('clone', '--mirror', '--quiet', $source, $origin) $root | Out-Null
  Invoke-Native 'git' @('clone', '--quiet', $origin, $work) $root | Out-Null
  Invoke-Native 'git' @('checkout', '--quiet', '-b', 'qualification-resume-local', $ExpectedHead) $work | Out-Null
  Invoke-Native 'git' @('push', '--quiet', '--set-upstream', 'origin', 'qualification-resume-local') $work | Out-Null
  $remote = (Invoke-Native 'git' @('remote', 'get-url', 'origin') $work).Output
  if ($remote -match '^(https?://|git@|ssh://)') { throw ('REMOTE_ORIGIN_FORBIDDEN: ' + $remote) }

  $beforeDependencies = (Invoke-Native 'git' @('status', '--porcelain=v2', '--untracked-files=all') $work).Output
  Invoke-Native 'npm.cmd' @('ci', '--no-audit', '--no-fund') $work | Out-Null
  $afterDependencies = (Invoke-Native 'git' @('status', '--porcelain=v2', '--untracked-files=all') $work).Output
  if ($afterDependencies -ne $beforeDependencies) { throw 'QUALIFICATION_DEPENDENCIES_MUTATED_REPO' }

  $env:KODJO_QUALIFICATION_ISOLATED_CHECKS = '1'
  $baselineDirectory = Join-Path $evidence 'baseline'
  New-Item -ItemType Directory -Force -Path $baselineDirectory | Out-Null
  $baseline = [ordered]@{}
  foreach ($check in @('jest', 'typescript', 'lint')) {
    $target = Join-Path $baselineDirectory ($check + '.json')
    Invoke-Native 'node' @('scripts/kodjo/run-check.js', $check, $target) $work -AllowFailure | Out-Null
    $baseline[$check] = Get-Content -Raw -LiteralPath $target | ConvertFrom-Json
  }
  $baselinePath = Join-Path $baselineDirectory 'checks.json'
  ($baseline | ConvertTo-Json -Depth 12) | Set-Content -LiteralPath $baselinePath -Encoding UTF8

  $env:KODJO_STATE_ROOT = $state
  $env:KODJO_SOURCE_RECOVERY_DIR = $sourcePackage
  $entry = Join-Path $work 'scripts\kodjo\invoke-kodjo-v2.ps1'
  $execution = Invoke-Native 'powershell.exe' @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $entry,
    '-SliceId', $slice,
    '-PromptFile', $prompt,
    '-ScopeAllow', $scope,
    '-SliceBootstrapFile', $bootstrap,
    '-Mode', 'RESUME_DELTA',
    '-SessionId', $sourceResult.session_id
  ) $work -AllowFailure
  $manifest.execution_exit_code = $execution.Code
  $manifest.execution_output = $execution.Output

  $runDirectory = Join-Path (Join-Path $state 'runs') ('github-' + $env:GITHUB_RUN_ID + '-' + $env:GITHUB_RUN_ATTEMPT)
  $resultPath = Join-Path $runDirectory 'result.json'
  $invocationPath = Join-Path $runDirectory 'invocation.json'
  if (-not (Test-Path -LiteralPath $resultPath)) { throw ('CURRENT_RUN_RESULT_MISSING: ' + $resultPath) }
  $result = Get-Content -Raw -LiteralPath $resultPath | ConvertFrom-Json
  $invocation = Get-Content -Raw -LiteralPath $invocationPath | ConvertFrom-Json
  $manifest.result = $result
  $manifest.claude_invoked = ($result.claude_invoked -eq $true)
  $manifest.returned_session_id = $result.session_id
  $manifest.recovered_files = @($result.recovered_files)
  Copy-Item -LiteralPath $resultPath -Destination (Join-Path $evidence 'result.json') -Force
  Copy-Item -LiteralPath $invocationPath -Destination (Join-Path $evidence 'invocation.json') -Force
  if (Test-Path -LiteralPath (Join-Path $runDirectory 'recovery-package')) {
    Copy-Item -LiteralPath (Join-Path $runDirectory 'recovery-package') -Destination (Join-Path $evidence 'recovery-package') -Recurse -Force
  }

  $comparisonPath = Join-Path $evidence 'check-comparison.json'
  $comparisonExecution = Invoke-Native 'node' @('scripts/kodjo/compare-qualification-checks.js', $baselinePath, $resultPath, $comparisonPath) $work -AllowFailure
  $comparison = Get-Content -Raw -LiteralPath $comparisonPath | ConvertFrom-Json
  $manifest.check_comparison = $comparison

  $expectedFile = Join-Path $work 'tests\fixtures\qualif\result.txt'
  $changed = @((Invoke-Native 'git' @('status', '--porcelain=v1', '--untracked-files=all') $work).Output -split "`r?`n" | Where-Object { $_ })
  $manifest.final_delta = $changed
  if (-not $manifest.claude_invoked) { throw 'CLAUDE_NOT_INVOKED' }
  if ($invocation.mode -ne 'RESUME_DELTA') { throw 'RESUME_MODE_NOT_PROVEN' }
  if ($result.session_id -ne $sourceResult.session_id) { throw 'SESSION_CONTINUITY_NOT_PROVEN' }
  if (@($result.recovered_files).Count -ne 1 -or $result.recovered_files[0] -ne 'tests/fixtures/qualif/result.txt') { throw 'RECOVERY_NOT_PROVEN' }
  if ($result.recovery_source_head_migration.status -ne 'PASS') { throw 'RECOVERY_MIGRATION_NOT_PROVEN' }
  if (@($result.out_of_scope_files).Count -ne 0) { throw ('SCOPE_VIOLATION: ' + (@($result.out_of_scope_files) -join ', ')) }
  if (-not (Test-Path -LiteralPath $expectedFile)) { throw 'EXPECTED_FIXTURE_RESULT_MISSING' }
  if ((Get-Content -Raw -LiteralPath $expectedFile).Replace("`r`n", "`n") -ne "KODJO V2 QUALIFICATION PASS`n") { throw 'EXPECTED_FIXTURE_RESULT_INVALID' }
  if ($comparisonExecution.Code -ne 0 -or $comparison.verdict -ne 'PASS') { throw 'QUALIFICATION_CHECK_REGRESSION_OR_NON_EXECUTION' }
  if (Test-Path -LiteralPath (Join-Path $state 'claude-local.lock')) { throw 'CLAUDE_LOCK_REMAINS' }
  $manifest.workflow_technical_status = 'SUCCESS'
  $manifest.verdict = 'PASS'
}
catch {
  $manifest.workflow_technical_status = 'FAILURE'
  $manifest.failure = $_.Exception.Message
  throw
}
finally {
  Remove-Item Env:KODJO_STATE_ROOT -ErrorAction SilentlyContinue
  Remove-Item Env:KODJO_SOURCE_RECOVERY_DIR -ErrorAction SilentlyContinue
  $manifest.finished_at = (Get-Date).ToUniversalTime().ToString('o')
  $rootFull = [IO.Path]::GetFullPath($root).TrimEnd('\')
  $tempFull = [IO.Path]::GetFullPath($env:RUNNER_TEMP).TrimEnd('\')
  $expectedLeaf = 'kodjo-qualif-resume-' + $env:GITHUB_RUN_ID + '-' + $env:GITHUB_RUN_ATTEMPT
  $cleanupIdentityValid = ([IO.Path]::GetDirectoryName($rootFull) -eq $tempFull -and [IO.Path]::GetFileName($rootFull) -eq $expectedLeaf)
  if (-not $cleanupIdentityValid) {
    $manifest.cleanup_diagnostic = 'QUALIFICATION_ROOT_IDENTITY_MISMATCH: ' + $rootFull
  } elseif (Test-Path -LiteralPath $rootFull) {
    & cmd.exe /d /c rd /s /q $rootFull
  }
  $manifest.cleanup_status = if (Test-Path -LiteralPath $root) { 'FAIL' } else { 'PASS' }
  if ($manifest.cleanup_status -eq 'FAIL') {
    $manifest.verdict = 'FAIL'
    $manifest.workflow_technical_status = 'FAILURE'
    $manifest.failure = 'QUALIFICATION_TEMP_CLEANUP_FAILED'
  }
  ($manifest | ConvertTo-Json -Depth 20) | Set-Content -LiteralPath (Join-Path $evidence 'qualification-resume-manifest.json') -Encoding UTF8
  if ($manifest.cleanup_status -eq 'FAIL') { throw 'QUALIFICATION_TEMP_CLEANUP_FAILED' }
}
