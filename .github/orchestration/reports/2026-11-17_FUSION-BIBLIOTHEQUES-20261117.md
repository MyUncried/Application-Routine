# FUSION-BIBLIOTHEQUES-20261117 — Fusion de la PR #437 (Bibliothèques) et build Routine BMAD

## Identifiant et objectif

- **Mission :** FUSION-BIBLIOTHEQUES-20261117.
- **Objectif :**
  - fusionner la PR #437 « Catalogue connecté — Bibliothèques » dans `main` ;
  - lancer la build EAS iOS `development-bmad` depuis `main` ;
  - préparer le Metro de Routine BMAD dans un worktree dédié ;
  - ensuite, ne laisser que le serveur de la version fusionnée.

## Branche et commit de départ

- `main` @ `12f5713c` (après #440 et #441).
- PR #437 : branche `catalogue/integration-pre10-20261111` @ `acac3faa`, déjà synchronisée avec `main` le 17/11.

## Périmètre demandé (autorisation de Hermann du 17/11/2026, recopiée)

1. « Vérifier avant fusion : que main est toujours à 12f5713c, ou, si main a avancé, que la PR #437 reste MERGEABLE sans conflit […] si un conflit apparaît, t'arrêter et me le présenter, sans le résoudre toi-même. »
   - Échecs connus « KODJO VNext proof stability and architecture » (VNEXT_EQ_EXECUTION_INCOMPLETE) : non bloquants, à ne pas relancer.
2. « Fusionner la PR #437 dans main par un merge commit (pas de squash ni de rebase), avec gh pr merge 437 --merge. »
3. « Lancer la build EAS iOS du profil development-bmad depuis main (APP_VARIANT=bmad, app « Routine BMAD »), à jour de la fusion. »
4. « Préparer le Metro de Routine BMAD sur main, dans un worktree dédié, sans perturber les sessions et worktrees existants […] Arrête-toi avant de le lancer si un autre Metro occupe le port prévu. »
5. **Interdits :**
   - pas d'OTA ni de build de production ;
   - ne pas toucher `catalogue/catalogues/kodjo-pilote-60.catalogue.json` ;
   - ne pas arrêter le serveur d'administration ;
   - pas de reset, rebase, stash, clean ni checkout dans les worktrees d'autres sessions.

## Périmètre réellement traité

- **Étapes 1, 2 et 3 :** faites.
- **Étape 4 :** préparée ; Metro **non lancé**, car le port prévu est occupé.
- **Ménage :** arrêt des Metro de cette session devenus inutiles (8085, 8086, 8087, 8088).

## Constats et preuves

- **Avant fusion :**
  - `origin/main` = `12f5713c`, inchangé.
  - PR #437 : `OPEN`, `MERGEABLE`, `mergeStateStatus` `UNSTABLE` ; `main` déjà inclus dans la branche.
  - Contrôles non réussis, tous du workflow « KODJO VNext proof stability and architecture » (run 44035431778) :
    - `historical-equivalence (ubuntu-latest)` : en échec ;
    - `qualification (ubuntu-latest)` : en échec ;
    - `qualification (windows-latest)` : en échec ;
    - `historical-equivalence (windows-latest)` : en cours.
  - Aucune suite relancée.
- **Migrations :** la branche ne contient que `migration030` (celle de la grille, déjà sur `main`). Pas de renumérotation.
- **Fusion :** `gh pr merge 437 --merge`, le 17/11/2026 à 07:07 UTC. `main` = `91961aa4`.
- **Worktree dédié :**
  - `C:\Dev\KODJO-MAIN` sur la branche locale `main` @ `91961aa4`, avancée en avance rapide depuis `origin/main`.
  - Dépendances installées par `npm ci`. La fusion ajoute `expo-document-picker` et `expo-network` : le `node_modules` de PRE10-SON ne convient plus.
- **Configuration de la variante :** `APP_VARIANT=bmad npx expo config` donne :
  - nom « Routine BMAD » ;
  - identifiant `com.ankusha.kodjo.bmad` ;
  - `NSLocalNetworkUsageDescription` présent ;
  - `NSAppTransportSecurity.NSAllowsLocalNetworking` à `true`.
- **Build EAS :**
  - commande : `eas build --platform ios --profile development-bmad --non-interactive --no-wait` ;
  - build `8107f9b0-f662-4bb6-ba12-c6539a795a45`, statut `FINISHED` à 07:15:48 UTC ;
  - commit `91961aa4`, version 1.0.0 (build 1) ;
  - page : https://expo.dev/accounts/ankushas-team/projects/routine/builds/8107f9b0-f662-4bb6-ba12-c6539a795a45
  - fichier : https://expo.dev/artifacts/eas/ZkMm3Kq5QBSETDTtT_UqmTHhRUnpArUsfgTlohCYXSk.ipa
  - Pas d'OTA, pas de build de production.
- **Port prévu :** 8081 (port de Routine BMAD, convention du 11/11) est occupé par le Metro de PRE10-SON (`expo start --tunnel`), lancé par une autre session. Arrêt avant lancement, comme demandé.
- **Serveurs arrêtés (tous lancés par cette session) :**
  - 8085 et 8086 : `pre11-formats`, devenus inutiles après la PR #440 ;
  - 8087 et 8088 : grille avant la fusion de #437. Leurs processus `node` survivaient à l'arrêt automatique pour manque de mémoire.
- **Non touchés :**
  - Metro 8081 (PRE10-SON), 8082 (Routine Catalogue, `KODJO-CAT-INTEG`), 8083 et 8084 (planification) ;
  - le serveur d'administration : aucun processus `catalogue-admin` n'apparaissait dans la liste des processus `node` ;
  - le fichier `kodjo-pilote-60.catalogue.json`.

## Tests

- Aucune suite Jest relancée.
  - Le code fusionné est celui de la PR #437, déjà synchronisée avec `main` @ `12f5713c` et recettée (cahier v34).
  - `main` n'a pas bougé entre cette synchronisation et la fusion.
- Suite VNext non relancée, sur instruction.

## Hypothèses non démontrées

- Routine BMAD joint l'administration du PC avec la nouvelle build : à vérifier sur l'iPhone après installation.

## Modifications réalisées

- Aucun fichier applicatif modifié.
- Ce rapport.

## Non corrigé / hors périmètre

- Metro de Routine BMAD non lancé. Décision de Hermann attendue : arrêter le Metro 8081 de PRE10-SON, ou utiliser un autre port.
- Ménage final des serveurs, à faire une fois le Metro de la version fusionnée lancé.
- Fusion de la planification (`planification/main-20261113`) à venir : sa `migration030` devra être renumérotée en `031` (décision D2).

## Vérifications restant à faire sur appareil réel

- Installation de la build `8107f9b0` par Hermann.
- Accès au réseau local et réinstallation des bibliothèques depuis le PC dans Routine BMAD.

## Fichiers modifiés

- `.github/orchestration/reports/2026-11-17_FUSION-BIBLIOTHEQUES-20261117.md` (création).

## Commit final et état Git

- Rapport commité sur `fortime/exec-duree-20261117` (worktree `C:\Dev\KODJO-GRILLE4`), branche de travail de cette session ; il rejoindra `main` avec la PR de la mission d.
- `main` = `91961aa4` (GitHub et `C:\Dev\KODJO-MAIN`, propre).
