# CHANGE REPORT — KODJO Protocol V2 0.6.46

Date : 2026-09-19  
Objet : synchronisation automatique des environnements, sans modification du flux V2.

## Changements

Configuration environnement :
- correction persistante du `projectId` EAS ;
- ajout d’`expo-updates` ;
- configuration `runtimeVersion` / `updates.url` ;
- configuration dynamique versionnée Routine / Routine Dev ;
- profil EAS `review` et channels `review` / `stable`.

Sidecars ajoutés :
- `.github/workflows/kodjo-routine-dev-environment-sync.yml` ;
- `.github/workflows/kodjo-routine-stable-environment-sync.yml`.

Bootstrap :
- `.github/workflows/eas-ios-routine-dev-review.yml` ;
- `eas-ios-preview.yml` conserve son rôle Routine et cesse seulement de réécrire le projectId pendant le run.

## Non-changements garantis

Aucune modification de :
- `kodjo-v2-lean-queue.yml` ;
- `kodjo-slice-implementation-review.yml` ;
- `kodjo-slice-finalize.yml` ;
- préflight 0.6.42–0.6.45 ;
- machine à états ;
- review / VISUAL_APPROVED / READY_TO_CLOSE ;
- queue / retry / recovery / checkpoint.

Les nouveaux workflows sont des observateurs latéraux. Leur succès ou leur échec n’est pas consommé par le protocole principal.

## Tests

`tests/kodjo/environment-sync-sidecars.pilot.js` contrôle :
- configuration Expo/EAS ;
- lock `expo-updates` ;
- causalité exacte review → implementation → PR/HEAD ;
- causalité exacte merge → FINAL_OUTPUT → main ;
- classification OTA/native ;
- absence de permissions d’écriture et de transport vers le flux principal ;
- absence de raccord depuis les workflows V2 principaux.
