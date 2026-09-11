[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][ValidatePattern('^[0-9a-f]{40}$')][string]$ExpectedHead,
  [Parameter(Mandatory = $true)][string]$EvidenceDirectory
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$repository = 'MyUncried/Application-Routine'
$slice = 'V2-QUALIF-00'
$bootstrap = '.github/orchestration/v2-slices/V2-QUALIF-00/slice-bootstrap.json'
$prompt = '.github/orchestration/v2-slices/V2-QUALIF-00/implementation-mission.md'
$scope = 'tests/fixtures/qualif/**'
$source = (git rev-parse --show-toplevel).Trim()
$root = Join-Path $env:RUNNER_TEMP ('kodjo-qualif-' + $env:GITHUB_RUN_ID + '-' + $env:GITHUB_RUN_ATTEMPT)
$origin = Join-Path $root 'origin.git'
$work = Join-Path $root 'work'
$evidence = [IO.Path]::GetFullPath($EvidenceDirectory)
$manifest = [ordered]@{
  schema_version = 'kodjo.protocol.v2.disposable-qualification.0.6.21'
  repository = $repository
  slice_id = $slice
  github_run_id = $env:GITHUB_RUN_ID
  github_run_attempt = $env:GITHUB_RUN_ATTEMPT
  expected_head = $ExpectedHead
  observed_head = $null
  claude_invoked = $false
  protocol_status = 'PRECHECK'
  workflow_technical_status = 'IN_PROGRESS'
  local_delta = $false
  recovery_preserved = $false
  remote_branch_created = $false
  pull_request_created = $false
  integrated_in_main = $false
  baseline_checks = $null
  result = $null
  tree_drift_outside_fixture = @()
  verdict = 'FAIL'
}

function Invoke-Native {
  param([string]$File, [string[]]$Arguments, [string]$WorkingDirectory, [switch]$AllowFailure)
  Push-Location $WorkingDirectory
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    # Windows PowerShell 5.1 wraps native stderr as a non-terminating
    # NativeCommandError.  Git writes harmless progress (for example detached
    # HEAD notices) to stderr even when it exits 0, so capture it without
    # letting the script-wide Stop policy turn that progress into an exception.
    $ErrorActionPreference = 'Continue'
    $output = & $File @Arguments 2>&1
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
    Pop-Location
  }
  $text = ($output | Out-String).Trim()
  if ($code -ne 0 -and -not $AllowFailure) { throw ($File + ' failed (' + $code + '): ' + $text) }
  return New-Object psobject -Property @{ Code = $code; Output = $text }
}

function Get-Inventory {
  param([string]$RepositoryRoot)
  $map = [ordered]@{}
  $pending = New-Object 'System.Collections.Generic.Stack[string]'
  $pending.Push($RepositoryRoot)
  while ($pending.Count -gt 0) {
    $directory = $pending.Pop()
    foreach ($child in (Get-ChildItem -LiteralPath $directory -Directory -Force)) {
      $relativeDirectory = $child.FullName.Substring($RepositoryRoot.Length).TrimStart('\').Replace('\', '/')
      if ($relativeDirectory -eq '.git' -or $relativeDirectory.StartsWith('.git/')) { continue }
      if ($relativeDirectory -eq 'node_modules' -or $relativeDirectory.StartsWith('node_modules/')) { continue }
      if ($relativeDirectory -eq 'tests/fixtures/qualif' -or $relativeDirectory.StartsWith('tests/fixtures/qualif/')) { continue }
      $pending.Push($child.FullName)
    }
    foreach ($item in (Get-ChildItem -LiteralPath $directory -File -Force)) {
      $relative = $item.FullName.Substring($RepositoryRoot.Length).TrimStart('\').Replace('\', '/')
      $map[$relative] = (Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256).Hash
    }
  }
  return $map
}

function Compare-Inventory {
  param($Before, $After)
  $drift = New-Object System.Collections.ArrayList
  foreach ($key in $Before.Keys) {
    if (-not $After.Contains($key)) { [void]$drift.Add('REMOVED:' + $key) }
    elseif ($Before[$key] -ne $After[$key]) { [void]$drift.Add('MODIFIED:' + $key) }
  }
  foreach ($key in $After.Keys) {
    if (-not $Before.Contains($key)) { [void]$drift.Add('ADDED:' + $key) }
  }
  return @($drift | Sort-Object)
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
  $dirty = (Invoke-Native 'git' @('status', '--porcelain', '--untracked-files=all') $source).Output
  if ($dirty) { throw ('SOURCE_WORKTREE_DIRTY: ' + $dirty) }

  $lockProof = Join-Path $evidence 'runner-lock-certification.json'
  Invoke-Native 'node' @('scripts/kodjo/certify-persistent-runner-lock.js', $lockProof) $source | Out-Null

  if (Test-Path -LiteralPath $root) { throw ('QUALIFICATION_ROOT_ALREADY_EXISTS: ' + $root) }
  New-Item -ItemType Directory -Force -Path $root | Out-Null
  Invoke-Native 'git' @('clone', '--mirror', '--quiet', $source, $origin) $root | Out-Null
  Invoke-Native 'git' @('clone', '--quiet', $origin, $work) $root | Out-Null
  Invoke-Native 'git' @('checkout', '--quiet', '-b', 'qualification-local', $ExpectedHead) $work | Out-Null
  Invoke-Native 'git' @('push', '--quiet', '--set-upstream', 'origin', 'qualification-local') $work | Out-Null
  $remote = (Invoke-Native 'git' @('remote', 'get-url', 'origin') $work).Output
  if ($remote -match '^(https?://|git@|ssh://)') { throw ('REMOTE_ORIGIN_FORBIDDEN: ' + $remote) }

  $beforeDependencies = (Invoke-Native 'git' @('status', '--porcelain=v2', '--untracked-files=all') $work).Output
  Invoke-Native 'npm.cmd' @('ci', '--no-audit', '--no-fund') $work | Out-Null
  $afterDependencies = (Invoke-Native 'git' @('status', '--porcelain=v2', '--untracked-files=all') $work).Output
  if ($afterDependencies -ne $beforeDependencies) { throw 'QUALIFICATION_DEPENDENCIES_MUTATED_REPO' }

  $before = Get-Inventory $work
  $baselineDirectory = Join-Path $evidence 'baseline'
  New-Item -ItemType Directory -Force -Path $baselineDirectory | Out-Null
  $baseline = [ordered]@{}
  foreach ($check in @('jest', 'typescript', 'lint')) {
    $target = Join-Path $baselineDirectory ($check + '.json')
    Invoke-Native 'node' @('scripts/kodjo/run-check.js', $check, $target) $work -AllowFailure | Out-Null
    $baseline[$check] = Get-Content -Raw -LiteralPath $target | ConvertFrom-Json
  }
  $manifest.baseline_checks = $baseline

  $localBench = Join-Path $evidence 'disposable-local-bench.json'
  Invoke-Native 'node' @('tests/kodjo/qualification/disposable-slice-bench.js', $localBench) $work | Out-Null

  $entry = Join-Path $work 'scripts\kodjo\invoke-kodjo-v2.ps1'
  $execution = Invoke-Native 'powershell.exe' @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $entry,
    '-SliceId', $slice,
    '-PromptFile', $prompt,
    '-ScopeAllow', $scope,
    '-SliceBootstrapFile', $bootstrap,
    '-Mode', 'INITIAL'
  ) $work -AllowFailure
  $manifest.execution_exit_code = $execution.Code
  $manifest.execution_output = $execution.Output

  $stateRoot = Join-Path $env:USERPROFILE '.kodjo-v2'
  $runDirectory = Join-Path (Join-Path $stateRoot 'runs') ('github-' + $env:GITHUB_RUN_ID + '-' + $env:GITHUB_RUN_ATTEMPT)
  $resultPath = Join-Path $runDirectory 'result.json'
  $invocationPath = Join-Path $runDirectory 'invocation.json'
  if (-not (Test-Path -LiteralPath $resultPath)) { throw ('CURRENT_RUN_RESULT_MISSING: ' + $resultPath) }
  $result = Get-Content -Raw -LiteralPath $resultPath | ConvertFrom-Json
  $manifest.result = $result
  $manifest.claude_invoked = ($result.claude_invoked -eq $true)
  $manifest.protocol_status = $result.status
  $manifest.local_delta = (@($result.modified_files).Count -gt 0)
  $manifest.recovery_preserved = ($null -ne $result.recovery_package -and (Test-Path -LiteralPath (Join-Path $runDirectory 'recovery-package')))
  Copy-Item -LiteralPath $resultPath -Destination (Join-Path $evidence 'result.json') -Force
  if (Test-Path -LiteralPath $invocationPath) { Copy-Item -LiteralPath $invocationPath -Destination (Join-Path $evidence 'invocation.json') -Force }
  if (Test-Path -LiteralPath (Join-Path $runDirectory 'run-context.json')) {
    Copy-Item -LiteralPath (Join-Path $runDirectory 'run-context.json') -Destination (Join-Path $evidence 'run-context.json') -Force
  }
  if (Test-Path -LiteralPath (Join-Path $runDirectory 'recovery-package')) {
    Copy-Item -LiteralPath (Join-Path $runDirectory 'recovery-package') -Destination (Join-Path $evidence 'recovery-package') -Recurse -Force
  }

  $after = Get-Inventory $work
  $outsideDrift = @(Compare-Inventory $before $after)
  $manifest.tree_drift_outside_fixture = $outsideDrift
  $expectedFile = Join-Path $work 'tests\fixtures\qualif\result.txt'
  $manifest.fixture_result_exists = Test-Path -LiteralPath $expectedFile
  $manifest.fixture_result_sha256 = if ($manifest.fixture_result_exists) { (Get-FileHash -LiteralPath $expectedFile -Algorithm SHA256).Hash } else { $null }
  $manifest.fixture_result_content_valid = if ($manifest.fixture_result_exists) {
    ((Get-Content -Raw -LiteralPath $expectedFile).Replace("`r`n", "`n") -eq "KODJO V2 QUALIFICATION PASS`n")
  } else { $false }

  if (-not $manifest.claude_invoked) { throw 'CLAUDE_NOT_INVOKED' }
  if (-not $manifest.local_delta) { throw 'DELTA_NOT_PRODUCED' }
  if (-not $manifest.recovery_preserved) { throw 'RECOVERY_NOT_PRESERVED' }
  if ($outsideDrift.Count -gt 0) { throw ('OUT_OF_SCOPE_DRIFT: ' + ($outsideDrift -join ', ')) }
  if (-not $manifest.fixture_result_exists) { throw 'EXPECTED_FIXTURE_RESULT_MISSING' }
  if (-not $manifest.fixture_result_content_valid) { throw 'EXPECTED_FIXTURE_RESULT_INVALID' }
  if (@($result.out_of_scope_files).Count -ne 0) { throw ('SCOPE_VIOLATION: ' + (@($result.out_of_scope_files) -join ', ')) }
  $manifest.workflow_technical_status = 'SUCCESS'
  $manifest.verdict = 'PASS'
}
catch {
  $manifest.workflow_technical_status = 'FAILURE'
  $manifest.failure = $_.Exception.Message
  throw
}
finally {
  $manifest.finished_at = (Get-Date).ToUniversalTime().ToString('o')
  if (Test-Path -LiteralPath $work) {
    Invoke-Native 'icacls.exe' @($work, '/reset', '/T', '/C', '/Q') $source -AllowFailure | Out-Null
  }
  if (Test-Path -LiteralPath $root) { Remove-Item -LiteralPath $root -Recurse -Force -ErrorAction SilentlyContinue }
  $manifest.cleanup_status = if (Test-Path -LiteralPath $root) { 'FAIL' } else { 'PASS' }
  $cleanupMustFailRun = ($manifest.cleanup_status -eq 'FAIL' -and $manifest.verdict -eq 'PASS')
  if ($cleanupMustFailRun) {
    $manifest.verdict = 'FAIL'
    $manifest.workflow_technical_status = 'FAILURE'
    $manifest.failure = 'QUALIFICATION_TEMP_CLEANUP_FAILED'
  }
  ($manifest | ConvertTo-Json -Depth 20) | Set-Content -LiteralPath (Join-Path $evidence 'qualification-manifest.json') -Encoding UTF8
  if ($cleanupMustFailRun) { throw 'QUALIFICATION_TEMP_CLEANUP_FAILED' }
}
