[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Root,
  [Parameter(Mandatory = $true)][string]$WorkspaceRoot,
  [Parameter(Mandatory = $true)][string]$RunId,
  [Parameter(Mandatory = $true)][string]$MetricsFile
)

$ErrorActionPreference = 'Stop'

function Get-DirectoryBytes([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path -PathType Container)) { return [Int64]0 }
  $sum = (Get-ChildItem -LiteralPath $Path -Force -Recurse -File -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum).Sum
  if ($null -eq $sum) { return [Int64]0 }
  return [Int64]$sum
}

function Write-Metrics([hashtable]$Cleanup, [Int64]$CheckoutBytes, [Int64]$CheckoutCountAfter, [Int64]$VolumeFreeAfter) {
  $metrics = @{}
  if (Test-Path -LiteralPath $MetricsFile -PathType Leaf) {
    $metricsObject = Get-Content -LiteralPath $MetricsFile -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($property in $metricsObject.PSObject.Properties) { $metrics[$property.Name] = $property.Value }
  }
  if (-not $metrics.ContainsKey('schema_version')) { $metrics.schema_version = 'kodjo.protocol.v2.infrastructure-metrics.0.6.22' }
  if (-not $metrics.ContainsKey('github_run_id')) { $metrics.github_run_id = $env:GITHUB_RUN_ID }
  if (-not $metrics.ContainsKey('github_run_attempt')) { $metrics.github_run_attempt = $env:GITHUB_RUN_ATTEMPT }
  if (-not $metrics.ContainsKey('checkout')) { $metrics.checkout = $null }
  if (-not $metrics.ContainsKey('dependencies')) { $metrics.dependencies = $null }
  if (-not $metrics.ContainsKey('toolchain')) { $metrics.toolchain = @{ node = $null; npm = $null; jest = $null } }
  if (-not $metrics.ContainsKey('package_lock_sha256')) { $metrics.package_lock_sha256 = $null }
  if (-not $metrics.ContainsKey('storage') -or $null -eq $metrics.storage) { $metrics.storage = @{} }
  $storage = @{}
  if ($metrics.storage -is [System.Collections.IDictionary]) {
    foreach ($key in $metrics.storage.Keys) { $storage[$key] = $metrics.storage[$key] }
  } else {
    foreach ($property in $metrics.storage.PSObject.Properties) { $storage[$property.Name] = $property.Value }
  }
  $storage.checkout_bytes_before_cleanup = $CheckoutBytes
  $storage.kodjo_checkout_count_after_cleanup = $CheckoutCountAfter
  $storage.volume_free_bytes_after_cleanup = $VolumeFreeAfter
  $metrics.storage = $storage
  $metrics.cleanup = $Cleanup
  $json = ($metrics | ConvertTo-Json -Depth 20).Replace("`r`n", "`n") + "`n"
  [IO.File]::WriteAllText($MetricsFile, $json, (New-Object Text.UTF8Encoding($false)))
}

$rootFull = [IO.Path]::GetFullPath($Root).TrimEnd('\')
$workspaceFull = [IO.Path]::GetFullPath($WorkspaceRoot).TrimEnd('\')
$kodjoRoot = [IO.Path]::GetFullPath((Join-Path $workspaceFull '_kodjo')).TrimEnd('\')
$expectedRoot = [IO.Path]::GetFullPath((Join-Path $kodjoRoot $RunId)).TrimEnd('\')
$diagnostics = New-Object System.Collections.ArrayList
$checkoutBytes = Get-DirectoryBytes $rootFull
$attempts = 0
$driveRoot = [IO.Path]::GetPathRoot($workspaceFull)
$cmdRoot = if ($rootFull.StartsWith('\\?\')) { $rootFull } else { '\\?\' + $rootFull }

if ($RunId -notmatch '^[0-9]+$' -or $rootFull -ne $expectedRoot -or
    [IO.Path]::GetDirectoryName($rootFull) -ne $kodjoRoot) {
  [void]$diagnostics.Add('RUN_CHECKOUT_IDENTITY_MISMATCH: ' + $rootFull)
  $cleanup = @{ status = 'REFUSED'; attempts = 0; diagnostics = @($diagnostics) }
  $countAfter = @(Get-ChildItem -LiteralPath $kodjoRoot -Directory -ErrorAction SilentlyContinue).Count
  $freeAfter = (New-Object IO.DriveInfo -ArgumentList $driveRoot).AvailableFreeSpace
  Write-Metrics $cleanup $checkoutBytes $countAfter $freeAfter
  throw 'RUN_CHECKOUT_IDENTITY_MISMATCH'
}

for ($attempt = 1; $attempt -le 5 -and (Test-Path -LiteralPath $rootFull); $attempt++) {
  $attempts = $attempt
  # PowerShell 5.1 transforme parfois stderr d'un programme natif en exception
  # lorsque ErrorActionPreference vaut Stop. On doit conserver la sortie et le
  # code retour pour laisser les cinq tentatives et les diagnostics s'exécuter.
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $output = & cmd.exe /d /c rd /s /q $cmdRoot 2>&1
    $exit = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  if ($exit -ne 0 -or $output) {
    [void]$diagnostics.Add(('attempt {0}: cmd rd exit={1}: {2}' -f $attempt, $exit, ($output -join ' ')))
  }
  if (Test-Path -LiteralPath $rootFull) { Start-Sleep -Seconds 2 }
}

$status = if (Test-Path -LiteralPath $rootFull) { 'FAIL' } else { 'PASS' }
if ($status -eq 'FAIL') {
  $processes = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -and $_.CommandLine.IndexOf($rootFull, [StringComparison]::OrdinalIgnoreCase) -ge 0
  } | ForEach-Object { '{0}:{1}' -f $_.ProcessId, $_.Name })
  if ($processes.Count -gt 0) { [void]$diagnostics.Add('processes referencing root: ' + ($processes -join ', ')) }
  $remaining = @(Get-ChildItem -LiteralPath $rootFull -Force -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 25 -ExpandProperty FullName)
  if ($remaining.Count -gt 0) { [void]$diagnostics.Add('remaining paths: ' + ($remaining -join ', ')) }
}

$cleanup = @{ status = $status; attempts = $attempts; diagnostics = @($diagnostics) }
$countAfter = @(Get-ChildItem -LiteralPath $kodjoRoot -Directory -ErrorAction SilentlyContinue).Count
$freeAfter = (New-Object IO.DriveInfo -ArgumentList $driveRoot).AvailableFreeSpace
Write-Metrics $cleanup $checkoutBytes $countAfter $freeAfter
if ($status -ne 'PASS') { throw 'RUN_CHECKOUT_CLEANUP_FAILED' }
