# VNext — Cohérence des preuves jusqu’à la clôture

Campagne existante `628b3349-88b4-4bf1-be6b-50bc09e7d245`, tranche `VNEXT-12-QUALIF`, parent `31e98a429f38cf3979b9e54bd6a264f3ce695044`. Qualification locale Linux ; Windows et parcours réels restent ouverts. Aucun lancement de workflow, changement V2/PRE-2 ou promotion.

## Incident et périmètre

Le cas signalé par l’utilisateur est le refus PRE-2 `V2_FINAL_CRITERION_NOT_CLOSED: UI-3D89E598F31D`, run `37244733631`, après APPROVE avec accessibilité en attente. La PR V2 #320 et les réussites annoncées par Claude sont un contexte déclaré, pas une preuve rejouée ici. La finalisation réelle PRE-2 reste non confirmée.

Les vérificateurs de revue et de finalisation présents sur cette branche utilisent déjà `device-proof-policy`. Leurs règles d’accessibilité PASS/PENDING_DEVICE sont cohérentes dans les parcours testés. Ils ne sont pas modifiés. Les corrections portent exclusivement sur les contrôles VNext de reprise d’une livraison et de révision après acceptation.

## Règles vérifiées

| Type | Revue APPROVE | Résolution et clôture |
|---|---|---|
| FUNCTIONAL_TEST, STATIC_ANALYSIS | PASS avec preuve requise ; FAIL, NON_VERIFIABLE, PENDING_DEVICE refusés | Une validation utilisateur ne supplée pas la preuve technique manquante ou échouée |
| ACCESSIBILITY_CHECK | PASS justifié ou PENDING_DEVICE explicite ; FAIL et NON_VERIFIABLE refusés | Une attente exige le gate utilisateur lié au HEAD et à la revue exacts ; elle demeure PENDING_DEVICE dans le résultat |
| VISUAL_COMPARE, DEVICE_CHECK | PENDING_DEVICE ; PASS automatisé, FAIL et NON_VERIFIABLE refusés | Même gate exact ; les observations non exécutées ne deviennent pas PASS |
| Dérogation DEVICE_CHECK non UI existante | Décision nominative, exigence et type exacts, NOT_EXECUTED, justification et risque résiduel ; les autres preuves passent | Clôture de la livraison autorisée dans cette portée ; NOT_EXECUTED, réserve et all_device_proofs_executed=false conservés |

`READY_TO_CLOSE` exprime la clôture de la livraison acceptée. Il ne constitue pas une attestation d’exécution de toutes les preuves. `device_evidence_scope=USER_APPROVAL_OF_EXACT_DELIVERY`, les preuves en attente et les dérogations doivent être lus ensemble. Aucune nouvelle dérogation générale n’est introduite.

## Lacunes démontrées et corrections

Deux tests exécutés dans une copie isolée utilisant les modules antérieurs échouent : un échec d’assertion conservée peut entrer dans une baseline rescellée ; une assertion PENDING_DEVICE autorisée à la revue ne peut pas entrer dans la baseline après acceptation. Le dernier parcours vérifie également la conservation d’une dérogation non UI existante.

VNext recontrôle désormais la couverture exacte des preuves de critères et d’assertions, leurs types, leurs statuts et leurs justifications. Une omission, un doublon, un échec ou un PASS visuel/device non autorisé bloque la reprise. La révision après acceptation accepte les assertions PENDING_DEVICE dont les seuls écarts sont différables et les dérogations nominatives déjà conservées par la revue, sans effacer leurs réserves. Les mêmes contrôles s’appliquent aux preuves non UI. Ces fonctions résident dans le module VNext existant, déjà transporté dans les checkouts de vérification gelés ; aucune nouvelle dépendance à transporter.

## Preuves de qualification

Les tests sont automatiquement inclus dans la qualification VNext existante par `tests/kodjo/vnext-*.pilot.js`.

- Suite VNext : **275 PASS, 0 FAIL, 0 SKIP**, 71,416 s, sur l’implémentation finale avant renforcement supplémentaire des négatifs.
- Vérification finale ciblée : **101 PASS, 0 FAIL, 0 SKIP**, 16,357 s, incluant les nouveaux tests et les suites existantes de revue, finalisation, dérogation, préservation et post-acceptation. Ces nombres se recouvrent et ne s’additionnent pas.
- Nouveau fichier : 26 cas, dont les vingt combinaisons des cinq types et quatre statuts. Les parcours admis exécutent revue CLI, validation utilisateur synthétique, finalisation CLI et validation de baseline VNext. Les négatifs passent par la revue et tentent la clôture d’un contrat altéré ; finalisation ou admission VNext doivent refuser.
- Mauvais HEAD, mauvaise revue, approbation absente, preuve manquante, justification vide, modification d’une revue sans mise à jour de son empreinte, assertion omise/échouée, dérogation hors portée et risque résiduel absent sont refusés.
- La dérogation nominale passe réellement par le chargeur de dérogations et le vérificateur de revue, puis par la finalisation et la reprise VNext. Les décisions restent des fixtures, aucune décision utilisateur réelle n’est inventée.

Commandes, empreintes SHA-256 des fichiers exécutés et journaux exacts : `.github/orchestration/vnext12/VNEXT-12-QUALIF/proof-lifecycle-20261005/evidence.json`. Seconde lecture des modifications et `git diff --check` effectués ; pas d’audit indépendant final du candidat.

## Limites restantes

Les tests utilisent des plans, commentaires, propriétaires et observations d’appareil synthétiques, avec les vérificateurs réels et des fixtures Git locales. Ils ne prouvent ni l’accessibilité d’une application sur appareil, ni une finalisation GitHub réelle, ni la reprise ChatGPT/Claude, ni la résolution de PRE-2. La qualification Windows du nouveau candidat reste nécessaire dans la campagne existante.

La justification non vide et les empreintes empêchent l’omission ou l’altération silencieuse ; elles ne prouvent pas la véracité d’une déclaration substantielle inventée. Un nouveau PASS doit être justifié et revu sur la livraison concernée. L’acceptation utilisateur et une dérogation conservent le statut d’attente ; elles ne le convertissent pas. Les autres travaux ouverts, notamment le raccordement Figma et la qualification réelle, restent ouverts.
