$ErrorActionPreference = "Stop"

Write-Host "KODJO - arrêt de l'ancienne session Expo..."

$connections = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue

if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique

    foreach ($processId in $pids) {
        Write-Host "Arrêt du processus PID $processId utilisant le port 8081..."
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }

    Start-Sleep -Seconds 2
}
else {
    Write-Host "Aucune ancienne session sur le port 8081."
}

Write-Host ""
Write-Host "KODJO - mise à jour depuis GitHub..."

git switch feat/creation-seance-catalogue
git pull --ff-only

Write-Host ""
Write-Host "Branche : $(git branch --show-current)"
Write-Host "Commit  : $(git rev-parse --short HEAD)"
Write-Host ""
Write-Host "Lancement d'Expo sur le port 8081..."

npx expo start --clear --port 8081
