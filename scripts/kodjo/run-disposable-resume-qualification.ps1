[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][ValidatePattern('^[0-9a-f]{40}$')][string]$ExpectedHead,
  [Parameter(Mandatory = $true)][ValidatePattern('^[0-9a-f]{40}$')][string]$ExpectedMain,
  [Parameter(Mandatory = $true)][ValidatePattern('^\d+$')][string]$SourceRunId,
  [Parameter(Mandatory = $true)][string]$SourceEvidenceDirectory,
  [Parameter(Mandatory = $true)][string]$EvidenceDirectory
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$slice = 'V2-QUALIF-01'
$bootstrap = '.github/orchestration/v2-slices/V2-QUALIF-01/slice-bootstrap.json'
$prompt = '.github/orchestration/v2-slices/V2-QUALIF-01/implementation-mission.md'
$scope = 'tests/fixtures/qualif-resume/**'
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
  expected_main = $ExpectedMain
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

function Write-JsonNoBom {
  param([string]$Path, [object]$Value, [int]$Depth = 20)
  $json = ($Value | ConvertTo-Json -Depth $Depth).Replace("`r`n", "`n") + "`n"
  [IO.File]::WriteAllText($Path, $json, (New-Object Text.UTF8Encoding($false)))
}

New-Item -ItemType Directory -Force -Path $evidence | Out-Null
try {
  if ($PSVersionTable.PSVersion.Major -ne 5 -or $PSVersionTable.PSVersion.Minor -ne 1) {
    throw ('WINDOWS_POWERSHELL_5_1_REQUIRED: ' + $PSVersionTable.PSVersion)
  }
  foreach ($tool in @('git', 'gh', 'node', 'npm.cmd', 'claude')) {
    if ($null -eq (Get-Command $tool -ErrorAction SilentlyContinue)) { throw ('TOOL_MISSING: ' + $tool) }
  }
  $manifest.observed_head = (Invoke-Native 'git' @('rev-parse', 'HEAD') $source).Output
  if ($manifest.observed_head -ne $ExpectedHead) { throw ('HEAD_MISMATCH: ' + $manifest.observed_head) }
  if ((Invoke-Native 'git' @('status', '--porcelain', '--untracked-files=all') $source).Output) { throw 'SOURCE_WORKTREE_DIRTY' }

  $sourceManifestPath = Join-Path $sourceEvidence 'qualification-manifest.json'
  $sourceResultPath = Join-Path $sourceEvidence 'result.json'
  $sourceInvocationPath = Join-Path $sourceEvidence 'invocation.json'
  $sourceInterruptionPath = Join-Path $sourceEvidence 'controlled-interruption.json'
  $sourcePackage = Join-Path $sourceEvidence 'recovery-package'
  $sourcePackageManifestPath = Join-Path $sourcePackage 'manifest.json'
  foreach ($required in @($sourceManifestPath, $sourceResultPath, $sourceInvocationPath, $sourceInterruptionPath, $sourcePackageManifestPath, (Join-Path $sourcePackage 'implementation.patch'))) {
    if (-not (Test-Path -LiteralPath $required)) { throw ('SOURCE_EVIDENCE_MISSING: ' + $required) }
  }
  $sourceManifest = Get-Content -Raw -LiteralPath $sourceManifestPath -Encoding UTF8 | ConvertFrom-Json
  $sourceResult = Get-Content -Raw -LiteralPath $sourceResultPath -Encoding UTF8 | ConvertFrom-Json
  $sourceInvocation = Get-Content -Raw -LiteralPath $sourceInvocationPath -Encoding UTF8 | ConvertFrom-Json
  $sourceInterruption = Get-Content -Raw -LiteralPath $sourceInterruptionPath -Encoding UTF8 | ConvertFrom-Json
  $sourcePackageManifest = Get-Content -Raw -LiteralPath $sourcePackageManifestPath -Encoding UTF8 | ConvertFrom-Json
  if ([string]$sourceManifest.github_run_id -ne $SourceRunId -or $sourceManifest.expected_head -ne $sourceResult.source_head -or $sourceManifest.verdict -ne 'PASS') {
    throw 'SOURCE_QUALIFICATION_INCOMPATIBLE'
  }
  if ($sourceResult.claude_invoked -ne $true -or [string]$sourceResult.source_head -notmatch '^[0-9a-f]{40}$' -or [string]::IsNullOrWhiteSpace($sourceResult.session_id)) {
    throw 'SOURCE_RESULT_INCOMPATIBLE'
  }
  if ($sourceInterruption.status -ne 'CONTROLLED_INTERRUPTION' -or $sourceInterruption.local_run_state_deleted -ne $true -or $sourceInterruption.lock_absent -ne $true) {
    throw 'CONTROLLED_INTERRUPTION_NOT_PROVEN'
  }
  if ($sourceInvocation.request_id -ne $sourceResult.request_id -or $sourcePackageManifest.request_id -ne $sourceResult.request_id -or $sourceInterruption.request_id -ne $sourceResult.request_id) {
    throw 'SOURCE_REQUEST_CORRESPONDENCE_NOT_PROVEN'
  }
  if ($sourcePackageManifest.run_id -ne $sourceResult.run_id -or $sourceInterruption.run_id -ne $sourceResult.run_id -or $sourcePackageManifest.session_id -ne $sourceResult.session_id -or $sourceInterruption.session_id -ne $sourceResult.session_id) {
    throw 'SOURCE_RUN_SESSION_CORRESPONDENCE_NOT_PROVEN'
  }
  if ($sourceInvocation.source_head -ne $sourceResult.source_head -or $sourcePackageManifest.source_head -ne $sourceResult.source_head -or $sourceInterruption.source_head -ne $sourceResult.source_head -or $sourceInterruption.main_head -ne $ExpectedMain) {
    throw 'SOURCE_HEAD_CORRESPONDENCE_NOT_PROVEN'
  }
  $manifest.source_session_id = $sourceResult.session_id
  $manifest.source_head = $sourceResult.source_head

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
  $env:KODJO_QUALIFICATION_CHECK_CACHE_DIR = Join-Path $root 'check-cache'
  $baselineDirectory = Join-Path $evidence 'baseline'
  New-Item -ItemType Directory -Force -Path $baselineDirectory | Out-Null
  $baseline = [ordered]@{}
  foreach ($check in @('jest', 'typescript', 'lint')) {
    $target = Join-Path $baselineDirectory ($check + '.json')
    Invoke-Native 'node' @('scripts/kodjo/run-check.js', $check, $target) $work -AllowFailure | Out-Null
    $baseline[$check] = Get-Content -Raw -LiteralPath $target -Encoding UTF8 | ConvertFrom-Json
  }
  $baselinePath = Join-Path $baselineDirectory 'checks.json'
  Write-JsonNoBom $baselinePath $baseline 12

  $env:KODJO_STATE_ROOT = $state
  $env:KODJO_SOURCE_RECOVERY_DIR = $sourcePackage
  $env:KODJO_DISPOSABLE_EVIDENCE_DIR = $evidence
  $entry = Join-Path $work 'scripts\kodjo\invoke-kodjo-v2.ps1'
  $execution = Invoke-Native 'powershell.exe' @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $entry,
    '-SliceId', $slice,
    '-PromptFile', $prompt,
    '-ScopeAllow', $scope,
    '-SliceBootstrapFile', $bootstrap,
    '-Mode', 'RESUME_DELTA',
    '-SessionId', $sourceResult.session_id,
    '-RetryOfRunId', $SourceRunId,
    '-RetryReasonCode', 'CONTROLLED_INTERRUPTION_AFTER_RECOVERY',
    '-RetryReasonDetail', ('Resume preserved disposable delta from run ' + $SourceRunId)
  ) $work -AllowFailure
  $manifest.execution_exit_code = $execution.Code
  $manifest.execution_output = $execution.Output

  $runDirectory = Join-Path (Join-Path $state 'runs') ('github-' + $env:GITHUB_RUN_ID + '-' + $env:GITHUB_RUN_ATTEMPT)
  $resultPath = Join-Path $runDirectory 'result.json'
  $invocationPath = Join-Path $runDirectory 'invocation.json'
  if (-not (Test-Path -LiteralPath $resultPath)) { throw ('CURRENT_RUN_RESULT_MISSING: ' + $resultPath) }
  $result = Get-Content -Raw -LiteralPath $resultPath -Encoding UTF8 | ConvertFrom-Json
  $invocation = Get-Content -Raw -LiteralPath $invocationPath -Encoding UTF8 | ConvertFrom-Json
  $manifest.result = $result
  $manifest.claude_invoked = ($result.claude_invoked -eq $true)
  $manifest.returned_session_id = $result.session_id
  $manifest.request_id = $result.request_id
  $manifest.recovered_files = @($result.recovered_files)
  Copy-Item -LiteralPath $resultPath -Destination (Join-Path $evidence 'result.json') -Force
  Copy-Item -LiteralPath $invocationPath -Destination (Join-Path $evidence 'invocation.json') -Force
  if (Test-Path -LiteralPath (Join-Path $runDirectory 'recovery-package')) {
    Copy-Item -LiteralPath (Join-Path $runDirectory 'recovery-package') -Destination (Join-Path $evidence 'recovery-package') -Recurse -Force
  }
  $resumePackageManifest = Get-Content -Raw -LiteralPath (Join-Path (Join-Path $runDirectory 'recovery-package') 'manifest.json') -Encoding UTF8 | ConvertFrom-Json

  $comparisonPath = Join-Path $evidence 'check-comparison.json'
  $comparisonExecution = Invoke-Native 'node' @('scripts/kodjo/compare-qualification-checks.js', $baselinePath, $resultPath, $comparisonPath) $work -AllowFailure
  $comparison = Get-Content -Raw -LiteralPath $comparisonPath -Encoding UTF8 | ConvertFrom-Json
  $manifest.check_comparison = $comparison

  $expectedFile = Join-Path $work 'tests\fixtures\qualif-resume\result.txt'
  $changed = @((Invoke-Native 'git' @('status', '--porcelain=v1', '--untracked-files=all') $work).Output -split "`r?`n" | Where-Object { $_ })
  $manifest.final_delta = $changed
  if (-not $manifest.claude_invoked) { throw 'CLAUDE_NOT_INVOKED' }
  if ($invocation.mode -ne 'RESUME_DELTA') { throw 'RESUME_MODE_NOT_PROVEN' }
  if ($invocation.request_id -ne $result.request_id -or $invocation.source_head -ne $ExpectedHead -or $result.source_head -ne $ExpectedHead) { throw 'RESUME_REQUEST_SOURCE_CORRESPONDENCE_NOT_PROVEN' }
  if ($resumePackageManifest.request_id -ne $result.request_id -or $resumePackageManifest.run_id -ne $result.run_id -or $resumePackageManifest.session_id -ne $result.session_id -or $resumePackageManifest.source_head -ne $ExpectedHead) { throw 'RESUME_PACKAGE_CORRESPONDENCE_NOT_PROVEN' }
  if ($result.session_id -ne $sourceResult.session_id) { throw 'SESSION_CONTINUITY_NOT_PROVEN' }
  if (@($result.recovered_files).Count -ne 1 -or $result.recovered_files[0] -ne 'tests/fixtures/qualif-resume/result.txt') { throw 'RECOVERY_NOT_PROVEN' }
  $migration = $result.recovery_source_head_migration
  $migrationProven =
    ($migration.required -eq $false -and $migration.status -eq 'NOT_REQUIRED') -or
    ($migration.required -eq $true -and $migration.status -eq 'PASS')
  if (-not $migrationProven) { throw 'RECOVERY_MIGRATION_NOT_PROVEN' }
  if (@($result.out_of_scope_files).Count -ne 0) { throw ('SCOPE_VIOLATION: ' + (@($result.out_of_scope_files) -join ', ')) }
  if (-not (Test-Path -LiteralPath $expectedFile)) { throw 'EXPECTED_FIXTURE_RESULT_MISSING' }
  if ((Get-Content -Raw -LiteralPath $expectedFile -Encoding UTF8).Replace("`r`n", "`n") -ne "KODJO V2 RESUME QUALIFICATION PASS`n") { throw 'EXPECTED_FIXTURE_RESULT_INVALID' }
  $sourcePatchHash = ([string]$sourcePackageManifest.patch_sha256).ToLowerInvariant()
  $resumePatchHash = ([string]$resumePackageManifest.patch_sha256).ToLowerInvariant()
  $manifest.source_patch_sha256 = $sourcePatchHash
  $manifest.resume_patch_sha256 = $resumePatchHash
  if ($sourcePatchHash -notmatch '^[0-9a-f]{64}$' -or $resumePatchHash -ne $sourcePatchHash) { throw 'INITIAL_DELTA_LOST_OR_CHANGED' }
  if ($comparisonExecution.Code -ne 0 -or $comparison.verdict -ne 'PASS') { throw 'QUALIFICATION_CHECK_REGRESSION_OR_NON_EXECUTION' }
  if (Test-Path -LiteralPath (Join-Path $state 'claude-local.lock')) { throw 'CLAUDE_LOCK_REMAINS' }
  $env:GH_TOKEN = $env:KODJO_LIVE_GH_TOKEN
  $main = (gh api ("repos/" + $env:GITHUB_REPOSITORY + "/git/ref/heads/main") --jq '.object.sha').Trim()
  $mainReadExit = $LASTEXITCODE
  Remove-Item Env:GH_TOKEN -ErrorAction SilentlyContinue
  if ($mainReadExit -ne 0) { throw 'MAIN_READ_FAILED_DURING_RESUME' }
  if ($main -ne $ExpectedMain) { throw ('MAIN_CHANGED_DURING_RESUME: ' + $main) }
  $manifest.observed_main = $main
  $manifest.workflow_technical_status = 'SUCCESS'
  $manifest.verdict = 'PASS'
}
catch {
  $manifest.workflow_technical_status = 'FAILURE'
  $manifest.failure = $_.Exception.Message
  throw
}
finally {
  Remove-Item Env:KODJO_DISPOSABLE_EVIDENCE_DIR -ErrorAction SilentlyContinue
  Remove-Item Env:KODJO_STATE_ROOT -ErrorAction SilentlyContinue
  Remove-Item Env:KODJO_SOURCE_RECOVERY_DIR -ErrorAction SilentlyContinue
  Remove-Item Env:KODJO_QUALIFICATION_CHECK_CACHE_DIR -ErrorAction SilentlyContinue
  $manifest.finished_at = (Get-Date).ToUniversalTime().ToString('o')
  $cleanupMessages = New-Object System.Collections.ArrayList
  if (Test-Path -LiteralPath $work) {
    $clean = Invoke-Native 'git' @('clean', '-ffdx', '--quiet') $work -AllowFailure
    if ($clean.Code -ne 0) { [void]$cleanupMessages.Add('git clean: ' + $clean.Output) }
  }
  $rootFull = [IO.Path]::GetFullPath($root).TrimEnd('\')
  $tempFull = [IO.Path]::GetFullPath($env:RUNNER_TEMP).TrimEnd('\')
  $expectedLeaf = 'kodjo-qualif-resume-' + $env:GITHUB_RUN_ID + '-' + $env:GITHUB_RUN_ATTEMPT
  $cleanupIdentityValid = ([IO.Path]::GetDirectoryName($rootFull) -eq $tempFull -and [IO.Path]::GetFileName($rootFull) -eq $expectedLeaf)
  if (-not $cleanupIdentityValid) {
    [void]$cleanupMessages.Add('QUALIFICATION_ROOT_IDENTITY_MISMATCH: ' + $rootFull)
  } elseif (Test-Path -LiteralPath $rootFull) {
    for ($cleanupAttempt = 1; $cleanupAttempt -le 5 -and (Test-Path -LiteralPath $rootFull); $cleanupAttempt++) {
      $remove = Invoke-Native 'cmd.exe' @('/d', '/c', 'rd', '/s', '/q', $rootFull) $source -AllowFailure
      if ($remove.Code -ne 0 -or $remove.Output) {
        [void]$cleanupMessages.Add(('attempt {0}: cmd rd exit={1}: {2}' -f $cleanupAttempt, $remove.Code, $remove.Output))
      }
      if (Test-Path -LiteralPath $rootFull) { Start-Sleep -Seconds 2 }
    }
  }
  $manifest.cleanup_status = if (Test-Path -LiteralPath $root) { 'FAIL' } else { 'PASS' }
  if ($manifest.cleanup_status -eq 'FAIL' -and $cleanupIdentityValid) {
    $blockingProcesses = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
      $_.CommandLine -and $_.CommandLine.IndexOf($rootFull, [StringComparison]::OrdinalIgnoreCase) -ge 0
    } | ForEach-Object { '{0}:{1}' -f $_.ProcessId, $_.Name })
    if ($blockingProcesses.Count -gt 0) {
      [void]$cleanupMessages.Add('processes referencing root: ' + ($blockingProcesses -join ', '))
    }
    $remainingPaths = @(Get-ChildItem -LiteralPath $rootFull -Force -Recurse -ErrorAction SilentlyContinue |
      Select-Object -First 25 -ExpandProperty FullName)
    if ($remainingPaths.Count -gt 0) {
      [void]$cleanupMessages.Add('remaining paths: ' + ($remainingPaths -join ', '))
    }
  }
  $manifest.cleanup_diagnostics = @($cleanupMessages)
  $cleanupMustFailRun = ($manifest.cleanup_status -eq 'FAIL' -and $manifest.verdict -eq 'PASS')
  if ($cleanupMustFailRun) {
    $manifest.verdict = 'FAIL'
    $manifest.workflow_technical_status = 'FAILURE'
    $manifest.failure = 'QUALIFICATION_TEMP_CLEANUP_FAILED'
  }
  Write-JsonNoBom (Join-Path $evidence 'qualification-resume-manifest.json') $manifest 20
  if ($cleanupMustFailRun) { throw 'QUALIFICATION_TEMP_CLEANUP_FAILED' }
}
