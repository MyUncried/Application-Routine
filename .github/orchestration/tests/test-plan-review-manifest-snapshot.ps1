$ErrorActionPreference = 'Stop'
$root = Join-Path ([IO.Path]::GetTempPath()) ("kodjo-manifest-snapshot-" + [guid]::NewGuid())
[IO.Directory]::CreateDirectory($root) | Out-Null

try {
  $source = Join-Path $root 'protocol\T03-S01.yml'
  $snapshot = Join-Path $root 'packet\manifest.yml'
  [IO.Directory]::CreateDirectory((Split-Path -Parent $source)) | Out-Null
  $content = "schema: kodjo.slice.v1`nslice_id: T03-S01`nbaseline_head: 90706d2481bddb18200cd113a915e5c0a2eca1dc`n"
  [IO.File]::WriteAllText($source, $content, [Text.UTF8Encoding]::new($false))

  $hash = & .github/orchestration/scripts/snapshot-plan-review-manifest.ps1 -SourcePath $source -DestinationPath $snapshot
  if (!(Test-Path -LiteralPath $snapshot -PathType Leaf)) { throw 'Snapshot was not created' }
  if ($hash -ne (Get-FileHash -Algorithm SHA256 -LiteralPath $snapshot).Hash.ToLowerInvariant()) { throw 'Returned snapshot hash mismatch' }

  Remove-Item -LiteralPath (Split-Path -Parent $source) -Recurse -Force
  if (!(Test-Path -LiteralPath $snapshot -PathType Leaf)) { throw 'Snapshot did not survive source checkout replacement' }
  if ([IO.File]::ReadAllText($snapshot) -ne $content) { throw 'Snapshot content changed' }

  $missingRejected = $false
  try {
    & .github/orchestration/scripts/snapshot-plan-review-manifest.ps1 -SourcePath (Join-Path $root 'missing.yml') -DestinationPath (Join-Path $root 'invalid.yml') | Out-Null
  } catch {
    $missingRejected = $true
  }
  if (!$missingRejected) { throw 'Missing source was accepted' }

  Write-Output 'Plan review manifest snapshot tests: PASS'
} finally {
  if (Test-Path -LiteralPath $root) { Remove-Item -LiteralPath $root -Recurse -Force }
}
