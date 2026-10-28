$ErrorActionPreference = 'Stop'
$root = Join-Path $env:RUNNER_TEMP ('kodjo-cleanup-smoke-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $root | Out-Null
$bare = Join-Path $root 'remote.git'
$repo = Join-Path $root 'main'
$wt = Join-Path $root 'temporary'
$script = Join-Path $PSScriptRoot '..\cleanup-workspace.ps1'
try {
  & git init --bare $bare | Out-Null
  & git clone $bare $repo 2>$null | Out-Null
  & git -C $repo config user.email 'tests@example.invalid'
  & git -C $repo config user.name 'Workspace test'
  Set-Content -LiteralPath (Join-Path $repo 'README.txt') -Value 'initial' -Encoding utf8
  & git -C $repo add README.txt
  & git -C $repo commit -m 'initial' | Out-Null
  & git -C $repo branch -M main
  & git -C $repo push -u origin main | Out-Null
  & git -C $repo worktree add -b temporary $wt main | Out-Null
  & $script -Path $repo -Repository $repo -Remove 2>$null
  if ($LASTEXITCODE -eq 0) { throw 'Main repository deletion should be refused' }
  & $script -Path $wt -Repository $repo
  if (-not (Test-Path $wt)) { throw 'Diagnostic deleted worktree' }
  Set-Content -LiteralPath (Join-Path $wt 'LOCAL.txt') -Value 'untracked' -Encoding utf8
  & $script -Path $wt -Repository $repo -Remove 2>$null
  if (-not (Test-Path $wt)) { throw 'Dirty worktree was deleted' }
  Remove-Item (Join-Path $wt 'LOCAL.txt') -Force
  & $script -Path $wt -Repository $repo -Remove
  if (Test-Path $wt) { throw 'Clean worktree was not deleted' }
  Write-Host 'PASS: repository protected; dry run safe; dirty worktree refused; clean worktree removed.'
} finally {
  if (Test-Path $root) { Remove-Item $root -Recurse -Force -ErrorAction SilentlyContinue }
}
