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

git cat-file -e "$($queue.source_head)^{commit}"
if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_SOURCE_NOT_FOUND' }
$reachable = @(git rev-list HEAD)
if ($reachable -notcontains $queue.source_head) { throw 'KODJO_QUEUE_SOURCE_NOT_ANCESTOR' }

$tempRequest = Join-Path $env:RUNNER_TEMP ("kodjo-{0}-{1}.json" -f $queue.slice_id, $env:GITHUB_RUN_ID)
$publishPathspec = Join-Path $env:RUNNER_TEMP ("kodjo-publish-{0}-{1}.nul" -f $queue.slice_id, $env:GITHUB_RUN_ID)
Remove-Item -LiteralPath $publishPathspec -Force -ErrorAction SilentlyContinue
$env:KODJO_PUBLISH_PATHSPEC_FILE = $publishPathspec
$branch = "kodjo/v2-{0}-{1}" -f $queue.slice_id.ToLowerInvariant(), $env:GITHUB_RUN_ID
& node (Join-Path $PSScriptRoot 'project-queued-request.js') $queueAbsolute $tempRequest
if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_REQUEST_PROJECTION_FAILED' }

git switch --detach $queue.source_head
if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_CHECKOUT_FAILED' }
git switch -c $branch
if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_BRANCH_FAILED' }

# KV2-19 : les dependances sont installees APRES la bascule sur source_head.
# Installees sur main, elles faisaient decider les controles opposables contre
# un arbre de dependances qui n'etait pas celui de la revision livree.
if (Test-Path -LiteralPath (Join-Path $repoRoot 'package-lock.json') -PathType Leaf) {
  $beforeDeps = @(git status --porcelain=v2 -z --untracked-files=all)
  $npmStartedMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  npm ci --no-audit --no-fund
  $npmExitCode = $LASTEXITCODE
  $npmFinishedMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  if (-not [string]::IsNullOrWhiteSpace($env:KODJO_INFRA_METRICS_FILE)) {
    & node (Join-Path $PSScriptRoot 'record-infrastructure-metric.js') npm-ci $env:KODJO_INFRA_METRICS_FILE $npmStartedMs $npmFinishedMs $npmExitCode $repoRoot
    if ($LASTEXITCODE -ne 0) {
      Write-Warning 'KODJO_QUEUE_INFRASTRUCTURE_METRIC_FAILED: npm-ci'
      $global:LASTEXITCODE = 0
    }
  }
  if ($npmExitCode -ne 0) { throw 'KODJO_QUEUE_DEPENDENCIES_FAILED' }
  # Reserve 4 de la revue du lot 1 : `npm ci` peut reecrire package-lock.json ou
  # deposer des fichiers suivis. Toute mutation du depot avant l'appel Claude
  # fausserait le delta impute a Claude et doit etre refusee ici, nommement.
  $afterDeps = @(git status --porcelain=v2 -z --untracked-files=all)
  if ("$afterDeps" -ne "$beforeDeps") { throw 'KODJO_QUEUE_DEPENDENCIES_MUTATED_REPO' }
}

$githubToken = $env:GH_TOKEN
if ([string]::IsNullOrWhiteSpace($githubToken)) { throw 'KODJO_QUEUE_GITHUB_TOKEN_MISSING' }
Remove-Item Env:GH_TOKEN -ErrorAction SilentlyContinue
$env:KODJO_SUPERVISED_QUEUE = '1'
try {
  & (Join-Path $PSScriptRoot 'start-kodjo-v2.ps1') -Request $tempRequest
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Remove-Item Env:KODJO_SUPERVISED_QUEUE -ErrorAction SilentlyContinue
  Remove-Item Env:KODJO_PUBLISH_PATHSPEC_FILE -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $tempRequest -Force -ErrorAction SilentlyContinue
}
$env:GH_TOKEN = $githubToken
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$githubToken"))
# KV2-09 : l'en-tete d'autorisation est ecrit dans .git/config d'un runner
# persistant. Sans le `finally` ci-dessous, il y survivait a chaque chemin
# d'echec, annulant l'intention de `persist-credentials: false`.
try {
  git config --local http.https://github.com/.extraheader "AUTHORIZATION: basic $auth"

  # KV2-02 / KV2-07 : publication bornee. Le superviseur n'ecrit cette liste que
  # sur un verdict vert, et elle ne contient que des chemins dans le perimetre.
  if (-not (Test-Path -LiteralPath $publishPathspec -PathType Leaf)) { throw 'KODJO_QUEUE_PUBLISH_PATHSPEC_MISSING' }
  if ((Get-Item -LiteralPath $publishPathspec).Length -eq 0) { throw 'KODJO_QUEUE_NO_DELIVERY' }

  # `git add` avec un pathspec n'annule PAS ce qui est deja indexe : un contenu
  # pre-indexe hors perimetre survivrait a la publication bornee. L'index est donc
  # remis a zero d'abord, sans toucher l'arbre de travail.
  git reset --quiet
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_INDEX_RESET_FAILED' }
  # Les octets valides par le superviseur sont opposables : neutraliser la\n  # conversion locale Windows des fins de ligne pendant la publication.\n  git -c core.autocrlf=false add --all --pathspec-from-file=$publishPathspec --pathspec-file-nul
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_ADD_FAILED' }
  # Reserve 3 de la revue du lot 1 : borner l'ajout ne prouve pas ce que l'index
  # CONTIENT. On compare l'index reel, chemin par chemin, a la liste autorisee.
  & node (Join-Path $PSScriptRoot 'verify-staged-scope.js') $publishPathspec
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_STAGED_SCOPE_REFUSED' }
  git diff --cached --check
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_DIFF_CHECK_FAILED' }
  git -c user.name='KODJO Windows Supervisor' -c user.email='kodjo-supervisor@users.noreply.github.com' commit -m ("feat({0}): verified implementation" -f $queue.slice_id)
  if ($LASTEXITCODE -ne 0) { throw 'KODJO_QUEUE_COMMIT_FAILED' }
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
finally {
  git config --local --unset-all http.https://github.com/.extraheader 2>$null
  Remove-Item Env:GH_TOKEN -ErrorAction SilentlyContinue
}
