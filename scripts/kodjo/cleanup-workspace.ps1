# Nettoyage cible des espaces Git temporaires KODJO.
# Par defaut : diagnostic seul. -Remove supprime uniquement un worktree eligible.
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Path,
  [string]$Repository = 'C:\Dev\Application-routine',
  [switch]$Remove
)
$ErrorActionPreference = 'Stop'
function GitLines([string]$cwd, [string[]]$arguments) {
  $output = @(& git -C $cwd @arguments 2>&1)
  if ($LASTEXITCODE -ne 0) { throw "Git a echoue ($cwd) : $($output -join ' ')" }
  return $output
}
$repositoryFull = [IO.Path]::GetFullPath($Repository).TrimEnd('\','/')
$targetFull = [IO.Path]::GetFullPath($Path).TrimEnd('\','/')
if (-not (Test-Path -LiteralPath $repositoryFull -PathType Container)) { throw "Depot principal absent." }
if (-not (Test-Path -LiteralPath $targetFull -PathType Container)) { throw "Dossier cible absent." }
if ($targetFull -ieq $repositoryFull) { throw "REFUS : depot principal protege." }
# Pas de suppression d'un dossier arbitraire, d'un clone ou d'un dossier de preuve.
$entry = "worktree " + ($targetFull -replace '\\','/')
$registered = @(GitLines $repositoryFull @('worktree','list','--porcelain'))
if (-not (@($registered | Where-Object { $_ -ieq $entry }).Count -eq 1)) {
  throw "REFUS : la cible n'est pas un worktree enregistre du depot principal."
}
$root = (GitLines $targetFull @('rev-parse','--show-toplevel') | Select-Object -First 1)
if ([IO.Path]::GetFullPath($root).TrimEnd('\','/') -ine $targetFull) {
  throw "REFUS : racine Git differente de la cible."
}
# Comparer avec la reference distante deja disponible ; ne jamais supposer un fetch reussi.
GitLines $repositoryFull @('fetch','origin','main') | Out-Null
$head = (GitLines $targetFull @('rev-parse','HEAD') | Select-Object -First 1)
& git -C $repositoryFull merge-base --is-ancestor $head origin/main 2>$null
if ($LASTEXITCODE -ne 0) { throw "REFUS : commit non descendant integre a origin/main (squash a verifier manuellement)." }
$local = @(GitLines $targetFull @('status','--porcelain','--untracked-files=all'))
if ($local.Count -gt 0) { throw "REFUS : changements locaux ou fichiers non suivis." }
$ignored = @(GitLines $targetFull @('ls-files','--others','--ignored','--exclude-standard'))
if ($ignored.Count -gt 0) { throw "REFUS : fichiers ignores presents ; qualification humaine requise." }
if (-not $Remove) {
  Write-Host "ELIGIBLE : $targetFull (aucune suppression)."
  Write-Host "Pour supprimer ce seul worktree : relancer avec -Remove."
  exit 0
}
GitLines $repositoryFull @('worktree','remove','--',$targetFull) | Out-Null
if (Test-Path -LiteralPath $targetFull) { throw "Suppression incomplete : $targetFull" }
Write-Host "SUPPRIME : $targetFull"
