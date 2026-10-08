# VNext — audit v8, premier lot de corrections

Date : 2026-10-03 (Europe/Paris), 2026-10-02 UTC.

## Périmètre et références

Mise en œuvre autorisée du plan issu de l'audit indépendant v8. Premier lot uniquement : D10, D13 et D14. Parent exact : `c0f72fc2148a5955b9a810a8aca1f6eeefa64870`, PR #269, branche `protocol/vnext-proof-stability-20260930`. Main observé : `8fc58a466679a85ea74752f0273939f901efa1b8`.

Le commit final est celui qui contient ce rapport (pas un HEAD synthétique). Publication Git blobs/tree/commit, parent vérifié, déplacement de ref non forcé. Aucun merge, FINAL, cutover, changement applicatif ou nouvelle exécution Claude.

## Changements

| Constat | Emplacement | Correction |
| --- | --- | --- |
| D10 | `kodjo-v2-pilot-tests.yml`, job `protocol-windows-preflight` | PR autorisée seulement si son dépôt source est le dépôt courant ; le lancement manuel et la condition full-Windows sont conservés. |
| D10 | `kodjo-vnext-proof-stability.yml`, job `architecture-audit` | Même contrôle de dépôt source, en conservant les conditions branche/événement/première tentative. |
| D13 | `kodjo-e2e-orchestration-test-v1-3.yml`, `e2e-review-bridge` | Commentaire déclencheur de l'owner uniquement, avant allocation du job. |
| D13 | `kodjo-e2e-t1-t6-v1-3.yml`, `t1-to-t2` / `t2-to-t3` | Commentaire de l'owner uniquement ; dispatch autorisé à l'owner ou `github-actions[bot]` pour préserver la continuité automatisée. |
| D13 | `t01-s09-implementation-v1-3-temporary.yml`, `implement` ; `t01-s09-plan-revision-v1-3-temporary.yml`, `revise-plan` | Commentaire déclencheur de l'owner uniquement. |
| D14 | `kodjo-v14-s09-implementation-local.yml`, `implement` | Contrôle commun de l'événement et de l'owner pour tous les marqueurs, y compris `IMPLEMENTATION_REVISION` et `VISUAL_CORRECTION`. |

Les quatre routes legacy par commentaire sont conservées, non supprimées. Les gardes existantes sur l'issue et les marqueurs sont conservées. Les scripts exécutables des jobs ne sont pas modifiés intentionnellement. Six empreintes de workflows writer sont actualisées dans `KODJO_VNEXT_REMOTE_WRITE_POLICY.json` ; toutes les autres lignes sont conservées. Le workflow d'audit VNext n'a pas de ligne writer figée : aucune ligne artificielle n'est ajoutée.

## Vérifications locales

Nouveau test comportemental : `tests/kodjo/audit-v8-trigger-security.pilot.js`. Il évalue les véritables expressions `jobs.*.if` avec des contextes GitHub contrôlés : fork/interne, manuel, owner/tiers/bot, mauvais marqueur/issue et dispatch. Ce n'est pas une preuve d'exécution du scheduler GitHub ni une revue Claude.

Commande : `node --test tests/kodjo/audit-v8-trigger-security.pilot.js tests/kodjo/post-campaign-hardening.pilot.js tests/kodjo/incident-register.pilot.js tests/kodjo/vnext-remote-write-security.pilot.js`.

Résultat : **35 PASS, 0 FAIL, 0 SKIP**, dont 11 nouveaux tests. Les tests historiques n'ont pas été modifiés ; aucune empreinte de cas ni position historique n'est changée. Les 420 sujets historiques restent protégés.

Le candidat complet a passé `validateTree` avant publication : YAML, validateurs de workflows, JavaScript/JSON, contrôle des writers figés (`PASS_WITH_FROZEN_LEGACY`), correspondance des 420 sujets historiques et détection des blocs PowerShell exécutables modifiés (0 unité modifiée). Une différence de fin de fichier ajoutée pendant l'édition a été retirée pour conserver les octets exécutables hérités ; aucun contrôle PowerShell n'a été contourné. La qualification GitHub du nouveau HEAD reste **en attente** à la publication. Les succès d'un ancien HEAD ne certifient pas ce candidat. Le checkpoint conserve les preuves historiques et interdit tout rejeu des demandes consommées.

## Limites et suite

Ces corrections sont sur la branche de PR seulement. **Main n'est pas modifié ni sécurisé par cette publication** ; la promotion fera partie du rapprochement D3 autorisé séparément, après qualification. Les workflows self-hosted continuent à faire confiance aux PR issues du même dépôt ; la frontière fork est désormais explicite. Les droits d'écriture au dépôt et les réglages GitHub restent des frontières de confiance.

D11 (credentials Git / hooks / métadonnées), D3/D1/D2 (rapprochement et finalisation appareil), D8/D7/D6 (plan/revue/révision) et D9/D12/D15–D18 (scanner/imports/verrous/preflight) restent à traiter. Aucun contrôle non exécuté, notamment la dérogation SQLite PRE-1, n'est déclaré réussi. Aucun audit complet ni élimination universelle des risques n'est revendiqué.

Après qualification de chaque candidat, le cycle réel final INITIAL/REVISION exigera de nouvelles identités, de vraies preuves et une vraie revue indépendante. Il n'est pas lancé par ce lot de gardes.
