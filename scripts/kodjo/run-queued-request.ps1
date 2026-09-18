[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$QueueFile
)

$ErrorActionPreference = 'Stop'
$repoRoot = (git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) { throw 'KODJO_V2_REPOSITORY_NOT_FOUND' }

$queueAbsolute = [IO.Path]::GetFullPath((Join-Path $repoRoot $QueueFile))
$queue = Get-Content -LiteralPath $queueAbsolute -Raw -Encoding UTF8 | ConvertFrom-Json
if ($queue.schema_version -ne 'kodjo.protocol.v2.lean-request.0.6.13') { throw 'KODJO_QUEUE_SCHEMA_REFUSED' }
if ($queue.source_head -notmatch '^[0-9a-f]{40}$') { throw 'KODJO_QUEUE_SOURCE_HEAD_REFUSED' }
if ($queue.slice_id -notmatch '^[A-Za-z0-9._-]{1,80}$') { throw 'KODJO_QUEUE_SLICE_ID_REFUSED' }
if (-not $queue.prompt_file -or -not $queue.slice_bootstrap_file -or -not $queue.scope_allow) { throw 'KODJO_QUEUE_INCOMPLETE' }

$operationKind = if ([string]::IsNullOrWhiteSpace([string]$queue.operation_kind)) { 'IMPLEMENT' } else { ([string]$queue.operation_kind).ToUpperInvariant() }
$isVisual = $operationKind -eq 'VISUAL_CORRECTION'
if ($operationKind -notin @('IMPLEMENT', 'VISUAL_CORRECTION')) { throw 'KODJO_QUEUE_OPERATION_KIND_REFUSED' }
if ($isVisual -and [string]$queue.mode -ne 'RESUME_DELTA') { throw 'KODJO_QUEUE_VISUAL_MODE_REFUSED' }

$githubToken = $env:GH_TOKEN
if ([string]::IsNullOrWhiteSpace($githubToken)) { throw 'KODJO_QUEUE_GITHUB_TOKEN_MISSING' }

git cat-file -e "$($queue.source_head)^{commit}"
if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_SOURCE_NOT_FOUND' }
$reachable = @(git rev-list HEAD)
if ($reachable -notcontains $queue.source_head) { throw 'KODJO_QUEUE_SOURCE_NOT_ANCESTOR' }

# Une PR applicative peut être basée sur un HEAD antérieur au protocole courant.
# Le runtime exécutable est donc figé hors checkout AVANT toute bascule vers le
# HEAD applicatif. Le correctif ne dépend jamais des scripts présents dans la PR.
$runtimeEntryScript = 'start-kodjo-v2' + '.ps1'
$runtimeScriptRoot = Join-Path $env:RUNNER_TEMP ("kodjo-protocol-runtime-{0}-{1}" -f $env:GITHUB_RUN_ID, $env:GITHUB_RUN_ATTEMPT)
Remove-Item -LiteralPath $runtimeScriptRoot -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -LiteralPath $PSScriptRoot -Destination $runtimeScriptRoot -Recurse -Force
if (-not (Test-Path -LiteralPath (Join-Path $runtimeScriptRoot $runtimeEntryScript) -PathType Leaf)) {
  throw 'KODJO_QUEUE_PROTOCOL_RUNTIME_COPY_FAILED'
}

$tempRequest = Join-Path $env:RUNNER_TEMP ("kodjo-{0}-{1}.json" -f $queue.slice_id, $env:GITHUB_RUN_ID)
$publishPathspec = Join-Path $env:RUNNER_TEMP ("kodjo-publish-{0}-{1}.nul" -f $queue.slice_id, $env:GITHUB_RUN_ID)
Remove-Item -LiteralPath $publishPathspec -Force -ErrorAction SilentlyContinue
$env:KODJO_PUBLISH_PATHSPEC_FILE = $publishPathspec
$branch = "kodjo/v2-{0}-{1}" -f $queue.slice_id.ToLowerInvariant(), $env:GITHUB_RUN_ID
$targetBranch = $null
$targetPr = $null
$applicationHead = $null

& node (Join-Path $PSScriptRoot 'project-queued-request.js') $queueAbsolute $tempRequest
if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_REQUEST_PROJECTION_FAILED' }

if ($isVisual) {
  $target = $queue.delivery_target
  if ($null -eq $target -or [string]$target.kind -ne 'EXISTING_PR') { throw 'KODJO_QUEUE_DELIVERY_TARGET_REFUSED' }
  $targetPr = [int]$target.application_pr
  $targetBranch = [string]$target.branch
  $applicationHead = ([string]$target.application_head).ToLowerInvariant()
  if ($applicationHead -notmatch '^[0-9a-f]{40}$') { throw 'KODJO_QUEUE_APPLICATION_HEAD_REFUSED' }

  $pr = gh api "repos/$env:GITHUB_REPOSITORY/pulls/$targetPr" | ConvertFrom-Json
  if ($LASTEXITCODE -ne 0 -or $null -eq $pr) { throw 'KODJO_QUEUE_APPLICATION_PR_UNREADABLE' }
  if ([string]$pr.state -ne 'open') { throw 'KODJO_QUEUE_APPLICATION_PR_NOT_OPEN' }
  if ([string]$pr.base.ref -ne 'main') { throw 'KODJO_QUEUE_APPLICATION_PR_BASE_MISMATCH' }
  if ([string]$pr.head.ref -ne $targetBranch) { throw 'KODJO_QUEUE_APPLICATION_BRANCH_MISMATCH' }
  if (([string]$pr.head.sha).ToLowerInvariant() -ne $applicationHead) { throw 'KODJO_QUEUE_APPLICATION_HEAD_MOVED' }

  $auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$githubToken"))
  $fetchRefspec = "refs/heads/{0}:refs/remotes/origin/{0}" -f $targetBranch
  git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $auth" fetch --no-tags origin $fetchRefspec # kodjo-allow-mention
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_APPLICATION_FETCH_FAILED' }
  git cat-file -e "$applicationHead^{commit}"
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_APPLICATION_HEAD_NOT_FOUND' }
  git switch --detach $applicationHead
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_CHECKOUT_FAILED' }
  $branch = "kodjo/visual-{0}-{1}" -f $queue.slice_id.ToLowerInvariant(), $env:GITHUB_RUN_ID
  git switch -c $branch
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_BRANCH_FAILED' }
} else {
  git switch --detach $queue.source_head
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_CHECKOUT_FAILED' }
  git switch -c $branch
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_BRANCH_FAILED' }
}

if (Test-Path -LiteralPath (Join-Path $repoRoot 'package-lock.json') -PathType Leaf) {
  $beforeDeps = @(git status --porcelain=v2 -z --untracked-files=all)
  $npmStartedMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  npm ci --no-audit --no-fund
  $npmExitCode = $LASTEXITCODE
  $npmFinishedMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  if (-not [string]::IsNullOrWhiteSpace($env:KODJO_INFRA_METRICS_FILE)) {
    & node (Join-Path $runtimeScriptRoot 'record-infrastructure-metric.js') npm-ci $env:KODJO_INFRA_METRICS_FILE $npmStartedMs $npmFinishedMs $npmExitCode $repoRoot
    if ($LASTEXITCODE -ne 0) {
      Write-Warning 'KODJO_QUEUE_INFRASTRUCTURE_METRIC_FAILED: npm-ci'
      $global:LASTEXITCODE = 0
    }
  }
  if ($npmExitCode -ne 0) { throw 'KODJO_QUEUE_DEPENDENCIES_FAILED' }
  $afterDeps = @(git status --porcelain=v2 -z --untracked-files=all)
  if ("$afterDeps" -ne "$beforeDeps") { throw 'KODJO_QUEUE_DEPENDENCIES_MUTATED_REPO' }
}

Remove-Item Env:GH_TOKEN -ErrorAction SilentlyContinue
$env:KODJO_SUPERVISED_QUEUE = '1'
try {
  # start-kodjo-v2.ps1 — invocation réelle, après le garde npm ci.
  & (Join-Path $runtimeScriptRoot $runtimeEntryScript) -Request $tempRequest
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Remove-Item Env:KODJO_SUPERVISED_QUEUE -ErrorAction SilentlyContinue
  Remove-Item Env:KODJO_PUBLISH_PATHSPEC_FILE -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $tempRequest -Force -ErrorAction SilentlyContinue
}
$env:GH_TOKEN = $githubToken
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$githubToken"))
try {
  git config --local http.https://github.com/.extraheader "AUTHORIZATION: basic $auth"

  if (-not (Test-Path -LiteralPath $publishPathspec -PathType Leaf)) { throw 'KODJO_QUEUE_PUBLISH_PATHSPEC_MISSING' }
  if ((Get-Item -LiteralPath $publishPathspec).Length -eq 0) { throw 'KODJO_QUEUE_NO_DELIVERY' }

  git reset --quiet
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_INDEX_RESET_FAILED' }
  git -c core.autocrlf=false add --all --pathspec-from-file=$publishPathspec --pathspec-file-nul
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_ADD_FAILED' }
  & node (Join-Path $runtimeScriptRoot 'verify-staged-scope.js') $publishPathspec
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_STAGED_SCOPE_REFUSED' }
  git -c core.whitespace=cr-at-eol diff --cached --check
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_DIFF_CHECK_FAILED' }

  $commitMessage = if ($isVisual) {
    "fix({0}): verified visual correction" -f $queue.slice_id
  } else {
    "feat({0}): verified implementation" -f $queue.slice_id
  }
  git -c user.name='KODJO Windows Supervisor' -c user.email='kodjo-supervisor@users.noreply.github.com' commit -m $commitMessage
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_COMMIT_FAILED' }
  $newHead = (git rev-parse HEAD).Trim()

  if ($isVisual) {
    $pushRefspec = "HEAD:refs/heads/{0}" -f $targetBranch
    git push origin $pushRefspec # kodjo-allow-mention
    if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_EXISTING_PR_PUSH_FAILED' }
    $prAfter = gh api "repos/$env:GITHUB_REPOSITORY/pulls/$targetPr" | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0 -or ([string]$prAfter.head.sha).ToLowerInvariant() -ne $newHead.ToLowerInvariant()) {
      throw 'KODJO_QUEUE_EXISTING_PR_DELIVERY_NOT_OBSERVED'
    }
    if ([string]$prAfter.state -ne 'open') { throw 'KODJO_QUEUE_APPLICATION_PR_CLOSED_DURING_DELIVERY' }

    $metadataPath = [string]$env:KODJO_VISUAL_DELIVERY_METADATA_FILE
    if (-not [string]::IsNullOrWhiteSpace($metadataPath)) {
      $metadata = [ordered]@{
        schema_version = 'kodjo.protocol.v2.visual-delivery.0.6.28'
        slice_id = [string]$queue.slice_id
        issue_number = [int]$queue.issue_number
        application_pr = $targetPr
        application_branch = $targetBranch
        previous_application_head = $applicationHead
        application_head = $newHead
        protocol_head = [string]$queue.source_head
        prior_checkpoint_ref = [string]$queue.delivery_checkpoint.checkpoint_ref
        authorized_plan = $queue.authorized_plan
        independent_review = $queue.independent_review
        user_gate = $queue.user_gate
        attestation_path = [string]$queue.recovery_migration.attestation_path
        attestation_blob_oid = [string]$queue.recovery_migration.attestation_blob_oid
        request_id = [string]$queue.request_id
        source_run_id = [string]$queue.retry_of_run_id
      }
      [IO.File]::WriteAllText([IO.Path]::GetFullPath($metadataPath), ($metadata | ConvertTo-Json -Depth 8), (New-Object Text.UTF8Encoding($false)))
    }

    $body = @"
Automated KODJO V2 visual correction delivery.

Slice: $($queue.slice_id)
Existing application PR: #$targetPr
Previous HEAD: $applicationHead
Delivered HEAD: $newHead
Protocol HEAD: $($queue.source_head)
Verdict: IMPLEMENTED_AND_VERIFIED

Human visual review remains required before merge.
"@
    gh pr comment $targetPr --body $body
    if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_EXISTING_PR_COMMENT_FAILED' }
  } else {
    git push --set-upstream origin $branch
    if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_PUSH_FAILED' }

    $body = @"
Automated KODJO V2 delivery.

Slice: $($queue.slice_id)
Authorized source: $($queue.source_head)
Queue request: $QueueFile
Verdict: IMPLEMENTED_AND_VERIFIED

Human review remains required before merge.
"@
    gh pr create --base main --head $branch --title ("feat({0}): verified implementation" -f $queue.slice_id) --body $body
    if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_PR_FAILED' }
  }
}
finally {
  git config --local --unset-all http.https://github.com/.extraheader 2>$null
  Remove-Item Env:GH_TOKEN -ErrorAction SilentlyContinue
  # Rendre le checkout protocolaire aux étapes `always()` du workflow lorsque
  # le parcours visuel l'exige. Le runtime figé, lui, est toujours supprimé.
  if ($isVisual) {
    $savedPreference = $ErrorActionPreference
    try {
      $ErrorActionPreference = 'Continue'
      git reset --hard | Out-Null
      git switch --detach $queue.source_head | Out-Null
    } finally {
      $ErrorActionPreference = $savedPreference
    }
  }
  Remove-Item -LiteralPath $runtimeScriptRoot -Recurse -Force -ErrorAction SilentlyContinue
}
