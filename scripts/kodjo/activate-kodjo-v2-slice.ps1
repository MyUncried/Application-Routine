[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$SliceId,
  [Parameter(Mandatory = $true)][int]$IssueNumber,
  [Parameter(Mandatory = $true)][string[]]$ProductSources,
  [string[]]$AuthorizedActors = @('user', 'chatgpt-protocole', 'claude-local'),
  [string]$TargetBranch = 'main',
  [string]$PreviousSliceId = '',
  [string]$PreviousCheckpoint = ''
)
$ErrorActionPreference = 'Stop'
$argsList = @('scripts/kodjo/activate-kodjo-v2-slice.js','--slice-id',$SliceId,'--issue-number',[string]$IssueNumber,'--product-sources',($ProductSources -join ','),'--authorized-actors',($AuthorizedActors -join ','),'--target-branch',$TargetBranch)
if ($PreviousSliceId) { $argsList += @('--previous-slice-id', $PreviousSliceId) }
if ($PreviousCheckpoint) { $argsList += @('--previous-checkpoint', $PreviousCheckpoint) }
& node @argsList
exit $LASTEXITCODE
