# 2026-10-05 — V2_FINALIZE_CUMULATIVE_DELIVERED_FIX

## Identifiant et objectif

- Mission : `V2_FINALIZE_CUMULATIVE_DELIVERED_FIX`. Correction d'orchestration autorisée explicitement par Hermann le 2026-10-05 (« Oui, applique la correction 2 avec son test »).
- Objectif : lever le second refus de la finalisation V2-PRE-2 (run [37244733631](https://github.com/MyUncried/Application-Routine/actions/runs/37244733631), tentative 2) : `UI_IMPLEMENTATION_REVIEW_TARGET_NOT_DELIVERED: UI-3D89E598F31D: src/features/sessions/BodyZoneSelector.tsx`.

## Départ

- Branche : `fix/kodjo-v2-finalize-cumulative-delivered`, créée depuis `origin/main` `9fad303d` (fusion de #320). Travail dans un worktree séparé ; le `main` local de Hermann n'est pas touché.

## Périmètre

- Demandé et traité : l'étape de rejeu de la revue dans `.github/workflows/kodjo-slice-finalize.yml`, et son test pilote dans `tests/kodjo/ui-e2e-finalization.pilot.js`.
- Hors périmètre : la revue, les scripts de vérification et le code applicatif.

## Constats

- Pour une livraison `EXISTING_PR`, la revue (`kodjo-slice-implementation-review.yml:263-270` et `:308-311`) passe à `verify-ui-implementation-review.js` la liste cumulative `baseline_head..head`, via `KODJO_CUMULATIVE_CHANGED_FILES`.
- La finalisation rejouait la même vérification avec la seule liste de l'incrément `base_head..head`. Pour PRE-2, cela donne 28 fichiers. La liste cumulative en compte 146 ; `BodyZoneSelector.tsx` y figure, livré par la livraison initiale de #303.

## Modifications réalisées

Dans `kodjo-slice-finalize.yml`, après la sortie de la tête exacte et avant le rejeu :

- remise à zéro de `KODJO_CUMULATIVE_CHANGED_FILES` ;
- si `queue.delivery_target.kind == 'EXISTING_PR'` :
  - contrôle du SHA `baseline_head` ;
  - contrôle que `baseline_head` est un ancêtre de la tête finale (`git merge-base --is-ancestor`) ;
  - écriture de `git diff --name-only baseline_head..head` ;
  - export de cette liste, comme dans la revue.

Test pilote ajouté : il vérifie la présence et l'ordre du bloc (remise à zéro, condition, ancêtre, diff, export, puis rejeu), ses refus explicites, et l'alignement avec la revue.

## Preuves et tests

- `node --test tests/kodjo/ui-e2e-finalization.pilot.js` : 24/24 PASS.
- Contre-épreuve : sans la modification du workflow, le nouveau test échoue.
- Exécution réelle du bloc sous Windows PowerShell 5.1, avec la file `V2-PRE-2-resume-819e43e3.json` et la tête `3780eb92` :
  - 0 erreur d'analyse ;
  - 146 fichiers, dont `src/features/sessions/BodyZoneSelector.tsx` ;
  - variable vide lorsque la livraison n'est pas sur PR existante.
- Rejeu local de `verify-ui-implementation-review.js validate` sur la tête `3780eb92`, avec les entrées réelles (plan `014987f6`, revue 5984104726, implémentation 5983669824) :
  - sans liste cumulative : même refus que le run ;
  - avec la liste `53cb05c7..3780eb92` : `verdict=APPROVE device=true mode=FULL`.
- Condition de dérogation vérifiée sur `origin/main` `9fad303d` sans le correctif : seuls `IA-004` (`protocol-runtime-freeze.pilot.js`) et `0.6.29` (`v2-initial-planning-entry.pilot.js`) échouent (18 PASS, 2 FAIL).

## Dérogation

- Autorisée par Hermann pour cette PR : fusion malgré `IA-004` et `0.6.29`, à deux conditions :
  - ces deux échecs sont reproduits sur `main` sans le correctif ;
  - aucune nouvelle régression n'apparaît.
- La vérification des conditions est consignée dans la PR avant fusion.

## Hypothèses non démontrées

- Étapes suivantes de la finalisation (Jest, TypeScript, lint, cohérence de clôture) : non encore exécutées pour PRE-2.

## Éléments non corrigés / hors périmètre

- `IA-004` et `0.6.29`, en échec sur `main` : à corriger séparément.

## Vérifications restant à effectuer sur appareil réel

- Aucune pour ce correctif.

## Fichiers modifiés

- `.github/workflows/kodjo-slice-finalize.yml`
- `tests/kodjo/ui-e2e-finalization.pilot.js`
- `.github/orchestration/reports/2026-10-05_V2_FINALIZE_CUMULATIVE_DELIVERED_FIX.md`

## Commit final et état Git

- Commit de livraison de la branche `fix/kodjo-v2-finalize-cumulative-delivered` : hash communiqué dans la PR et en clôture.
