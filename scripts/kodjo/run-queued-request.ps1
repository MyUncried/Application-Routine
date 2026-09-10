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

git merge-base --is-ancestor $queue.source_head HEAD
if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_SOURCE_NOT_ANCESTOR' }

$tempRequest = Join-Path $env:RUNNER_TEMP ("kodjo-{0}-{1}.json" -f $queue.slice_id, $env:GITHUB_RUN_ID)
$branch = "kodjo/v2-{0}-{1}" -f $queue.slice_id.ToLowerInvariant(), $env:GITHUB_RUN_ID
$request = [ordered]@{
  schema_version = 'kodjo.protocol.v2.local-implementation.0.6.12'
  slice_id = $queue.slice_id
  source_head = $queue.source_head
  baseline_head = $queue.baseline_head
  slice_bootstrap_file = $queue.slice_bootstrap_file
  slice_bootstrap_sha256 = $queue.slice_bootstrap_sha256
  mode = $queue.mode
  session_id = $queue.session_id
  prompt_file = $queue.prompt_file
  scope_allow = @($queue.scope_allow)
  checks = @($queue.checks)
  limits = $queue.limits
}
[IO.File]::WriteAllText($tempRequest, ($request | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))

git switch --detach $queue.source_head
if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_CHECKOUT_FAILED' }
git switch -c $branch
if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_BRANCH_FAILED' }

$env:KODJO_SUPERVISED_QUEUE = '1'
try {
  & (Join-Path $PSScriptRoot 'start-kodjo-v2.ps1') -Request $tempRequest
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Remove-Item Env:KODJO_SUPERVISED_QUEUE -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $tempRequest -Force -ErrorAction SilentlyContinue
}

$modified = @(git status --porcelain=v1 --untracked-files=all)
if ($modified.Count -eq 0) { throw 'KODJO_QUEUE_NO_DELIVERY' }
git add --all
git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_DIFF_CHECK_FAILED' }
git -c user.name='KODJO Windows Supervisor' -c user.email='kodjo-supervisor@users.noreply.github.com' commit -m ("feat({0}): verified implementation" -f $queue.slice_id)
if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_COMMIT_FAILED' }
git push --set-upstream origin $branch
if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_PUSH_FAILED' }

$body = @"
Automated KODJO V2 delivery.

- Slice: `$($queue.slice_id)`
- Authorized source: `$($queue.source_head)`
- Queue request: `$QueueFile`
- Verdict: `IMPLEMENTED_AND_VERIFIED`

Human review remains required before merge.
"@
gh pr create --base main --head $branch --title ("feat({0}): verified implementation" -f $queue.slice_id) --body $body
if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_PR_FAILED' }
