param(
  [Parameter(Mandatory=$true)][string]$SourcePath,
  [Parameter(Mandatory=$true)][string]$DestinationPath
)

$ErrorActionPreference = 'Stop'
if (!(Test-Path -LiteralPath $SourcePath -PathType Leaf)) {
  throw "Manifest source missing: $SourcePath"
}

$parent = Split-Path -Parent $DestinationPath
if ($parent) {
  [IO.Directory]::CreateDirectory($parent) | Out-Null
}

$bytes = [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $SourcePath))
[IO.File]::WriteAllBytes($DestinationPath, $bytes)

$sourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $SourcePath).Hash
$snapshotHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $DestinationPath).Hash
if ($sourceHash -ne $snapshotHash) {
  throw 'Manifest snapshot hash mismatch'
}

$snapshotHash.ToLowerInvariant()
