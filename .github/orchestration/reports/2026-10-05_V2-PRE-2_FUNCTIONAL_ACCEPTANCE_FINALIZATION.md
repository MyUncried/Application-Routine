# 2026-10-05 — V2-PRE-2_FUNCTIONAL_ACCEPTANCE_FINALIZATION

## Identifiant et objectif

- Mission : `V2-PRE-2_FUNCTIONAL_ACCEPTANCE_FINALIZATION`.
- Objectif : consigner la validation fonctionnelle de Hermann sur V2-PRE-2 (PR #303, tête `3780eb92`, revue APPROVE `5984104726`) avec réserve de conformité visuelle, puis finaliser par le chemin V2 : fusionner #303 et clôturer #288.
- Autorisation : confirmation explicite de Hermann dans la session (« Confirmé. Publie le marqueur avec la réserve explicite, puis poursuis la finalisation, la fusion de #303 et la clôture de #288 comme décrit. »).

## Départ

- Branche locale : `main` (commit local `72be7e9d`, en retard de 67 commits sur `origin/main`) ; `origin/main` consulté pour les scripts : à jour au 2026-10-05.
- 13 fichiers `docs/Specifications-fonctionnelles/*.md` déjà modifiés par Hermann : non touchés.

## Périmètre

- Demandé : étapes 1 à 6 (vérification d'état, validation et réserve, précision sur le nom vide, finalisation, fusion, clôture, conservation des réserves pour PRE-3). Sans nouveau développement, nouvelle revue de PRE-2 ni démarrage de PRE-3.
- Traité : étapes 1, 2, 3 et 5 ; étape 4 **bloquée** par la finalisation V2 (voir constats).

## Constats

### Étape 1 — état avant action
- PR #303 : OPEN, non brouillon, branche `kodjo/v2-v2-pre-2-37178165890`, tête `3780eb9287cf8bc60c79dc322c1662542469a389`, MERGEABLE / CLEAN. Aucun changement depuis la recette.
- Revue `5984104726` : `verdict=APPROVE`, `STATUT : IMPLEMENTATION_REVIEW_APPROVED`, `head=3780eb92…`, `device_gate_required=true`.
- Issue #288 : OPEN ; aucun `VISUAL_APPROVED` ni `FINAL_OUTPUT` antérieur → pas de doublon.

### Étapes 2, 3 et 5 — consignation
- Marqueur publié depuis le compte de Hermann : `[KODJO_SLICE] VISUAL_APPROVED`, commentaire [5985692286](https://github.com/MyUncried/Application-Routine/issues/288#issuecomment-5985692286). Il porte :
  - l'acceptation **fonctionnelle** sur la base de la recette iPhone ;
  - la mention explicite que la conformité Figma **n'est pas** vérifiée, la dérogation limitée à PRE-2 et le maintien des réserves visuelles ;
  - le renvoi des réserves à la préparation de PRE-3 (VNext), **sans** autorisation de refonte visuelle générale ;
  - la précision sur le nom vide.
- Rapprochement contractuel (nom vide) : CE-UI-09 §17 (`docs/Specifications-fonctionnelles/13 – Contrats d’écran.md:2836`) indique « Nom vide/dupliqué … : message et brouillon conservé ». La décision de Hermann pour la création d'une zone corporelle — bouton Ajouter inactif, aucun message — affine ce point sans modifier le comportement validé. **La reformulation du contrat reste à reporter** dans la documentation ; non faite ici (fichier 13 en cours de modification par Hermann, hors périmètre).
- Le plan PRE-2 contient, pour le Profil (CE-UI-01), l'attente « un nom vide … affiche une erreur liée au champ » : cette règle concerne un autre écran et n'est pas visée par la précision.

### Étape 4 — finalisation refusée (ORCHESTRATION_FAILURE)
- Run de finalisation [37244733631](https://github.com/MyUncried/Application-Routine/actions/runs/37244733631) (routeur, job `slice-finalize / finalize`) : **failure**, 2026-10-04T23:43:05Z.
- Refus : `V2_FINAL_CRITERION_NOT_CLOSED: UI-3D89E598F31D` → `V2 finalization contract refused`. Aucun `FINAL_OUTPUT`, aucun `SLICE_CLOSED`, aucune écriture.
- Cause démontrée : contradiction entre deux contrôles du protocole.
  - La revue (`scripts/kodjo/verify-ui-implementation-review.js:16`, `DEFERABLE_PROOFS = [...DEVICE_PROOFS,'ACCESSIBILITY_CHECK']`, et la consigne `kodjo-slice-implementation-review.yml:384`) autorise `ACCESSIBILITY_CHECK: PENDING_DEVICE` lorsque seule la preuve VoiceOver/TalkBack au runtime manque.
  - La finalisation (`scripts/kodjo/verify-v2-finalization.js`, `DEVICE_PROOF_TYPES = {VISUAL_COMPARE, DEVICE_CHECK}`, `devicePendingOnly`) traite `ACCESSIBILITY_CHECK` comme preuve technique devant être `PASS` : tout critère portant `ACCESSIBILITY_CHECK: PENDING_DEVICE` est déclaré non fermé, même après la barrière humaine.
- Portée : 5 des 6 critères UI de la revue portent `ACCESSIBILITY_CHECK: PENDING_DEVICE` (UI-3D89E598F31D, UI-5F3D94866D30, UI-60B2C84BF572, UI-82B1544AE5AE, UI-96E7FD739BF0) ; preuves techniques toutes `PASS` ; frontières 23/23 `PASS`.
- La clôture avec réserve est donc représentable par le marqueur (texte libre accepté, précédent PRE-1 `5953231956`), mais **pas exécutable** tant que la finalisation contredit la revue.

### Changement minimal nécessaire (non appliqué)
- Dans `scripts/kodjo/verify-v2-finalization.js`, aligner la finalisation sur la revue : traiter `ACCESSIBILITY_CHECK` au statut `PENDING_DEVICE` comme une preuve reportée à la barrière humaine (dans `devicePendingOnly` et dans la boucle par preuve, qui sinon lèverait `V2_FINAL_TECHNICAL_PROOF_NOT_PASS`), en conservant le refus de tout `PASS` d'appareil avant la barrière et l'exigence d'au moins une preuve d'appareil en attente. Ajouter un test pilote couvrant ce cas.
- Non appliqué : modifier un contrôle de finalisation pour finaliser est exclu sans autorisation explicite (consigne de Hermann).
- Reprise après correction : le workflow fait un checkout de `main` ; relancer le run 37244733631 (`gh run rerun`) réutiliserait le marqueur 5985692286 sans en publier un second, sous réserve que #303 et sa tête restent inchangées.

## Réserves visuelles conservées pour PRE-3 (VNext)

- Écarts visuels importants à Figma, non mesurés dans ce cycle ; preuves `VISUAL_COMPARE` en `PENDING_DEVICE` sur 5 critères UI.
- Référence relevée : frame `4478:7209` « Ajouter un exercice — Zones corporelles » (fichier `G6RY5Ebhgwb4AHIOYDwwvg`), propriétés détaillées dans `2026-10-05_FIGMA_ZONES_CORPORELLES_MODAL_READ.md` (opacité du voile non récupérable).
- Accessibilité runtime (VoiceOver/TalkBack) non certifiée.
- Affectation à PRE-3 : à expliciter dans son périmètre ; aucune refonte visuelle générale autorisée.

## Preuves et tests

- `gh pr view 303`, commentaires #288, revue 5984104726 (JSON analysé localement), journal du run 37244733631, lecture de `verify-v2-finalization.js` et `verify-ui-implementation-review.js` sur `origin/main`.
- Aucun test exécuté : aucun code modifié.

## Mise à jour — 2026-10-05 (correction 1 appliquée, deuxième blocage)

### Correction 1 — report d'ACCESSIBILITY_CHECK (autorisée par Hermann)
- PR [#320](https://github.com/MyUncried/Application-Routine/pull/320), commit `a07fc5d2`, rapport `2026-10-05_V2_FINALIZE_ACCESSIBILITY_DEFERRAL_FIX.md`.
- Contrôles de #320 : `protocol` et `await_qualified_head` en échec sur deux tests préexistants (`IA-004`, `protocol-runtime-freeze.pilot.js:60` ; `0.6.29`, `v2-initial-planning-entry.pilot.js:144`), reproduits à l'identique sur `origin/main` `b961719c` sans la PR.
- Dérogation limitée à #320 autorisée par Hermann (option A), consignée dans [5986087308](https://github.com/MyUncried/Application-Routine/pull/320#issuecomment-5986087308) ; elle ne qualifie pas ces deux tests, dont la correction reste ouverte.
- Fusion : `9fad303d8bf72f447dde2d0c91295e696d2c50ac` (2026-10-05T00:31:40Z, `--match-head-commit a07fc5d2`).

### Relance de la finalisation (run 37244733631, tentative 2)
- `verify-v2-finalization.js` passe désormais : `finalization verified — slice=V2-PRE-2 head=3780eb9287cf device=true`.
- Nouveau refus, à l'étape suivante (rejeu de la revue sur la tête exacte) : `UI_IMPLEMENTATION_REVIEW_TARGET_NOT_DELIVERED: UI-3D89E598F31D: src/features/sessions/BodyZoneSelector.tsx` → `V2 implementation review replay failed`. Aucun `FINAL_OUTPUT`, aucune écriture.

### Cause démontrée (deuxième contradiction revue ↔ finalisation)
- La revue (`kodjo-slice-implementation-review.yml:263-270`, `:308-311`, ajout de #315/#318) : si `delivery_target.kind == "EXISTING_PR"` dans la file V2, elle fournit à `verify-ui-implementation-review.js` la liste cumulative `baseline_head..head` via `KODJO_CUMULATIVE_CHANGED_FILES` ; les cibles livrées par une livraison antérieure de la tranche restent livrées.
- La finalisation (`kodjo-slice-finalize.yml`, étape « Validate visual and technical approval ») rejoue la même vérification avec la seule liste `base_head..head` (incrément, 28 fichiers), sans liste cumulative.
- PRE-2 : file `V2-PRE-2-resume-819e43e3.json`, `delivery_target.kind=EXISTING_PR`, `baseline_head=53cb05c7…` (146 fichiers cumulés, dont `BodyZoneSelector.tsx`, livré par la livraison initiale de #303).
- Preuve locale, sur un worktree détaché à `3780eb92`, avec les entrées réelles (plan blob `014987f6`, contrat de revue et preuves de tests extraits de 5984104726, implémentation 5983669824) : sans liste cumulative → même refus `TARGET_NOT_DELIVERED` ; avec la liste `53cb05c7..3780eb92` → `UI implementation review verified — verdict=APPROVE device=true mode=FULL`.

### Correction 2 nécessaire (non appliquée, autorisation requise)
- Dans `kodjo-slice-finalize.yml`, avant le rejeu : si la file V2 porte `delivery_target.kind == "EXISTING_PR"`, contrôler que `baseline_head` est un SHA valide et ancêtre de la tête, écrire `git diff --name-only baseline_head..head` et l'exposer en `KODJO_CUMULATIVE_CHANGED_FILES`, à l'identique de la revue. Ajouter un test pilote vérifiant la présence et l'ordre de ce bloc.
- Étapes du workflow encore jamais atteintes pour PRE-2 : Jest, TypeScript, lint et cohérence de clôture sur la tête finale ; d'autres écarts restent possibles.

## Mise à jour — 2026-10-05 (correction 2, nouveau marqueur, clôture)

### Correction 2 — fichiers livrés cumulés (autorisée par Hermann)
- PR [#321](https://github.com/MyUncried/Application-Routine/pull/321), commit `c8e7d0d9`, rapport `2026-10-05_V2_FINALIZE_CUMULATIVE_DELIVERED_FIX.md`.
- Dérogation conditionnelle de Hermann, avec ses deux conditions vérifiées :
  - IA-004 et 0.6.29 sont reproduits sur `9fad303d` sans le correctif ;
  - aucune nouvelle régression : CI [37280256793](https://github.com/MyUncried/Application-Routine/actions/runs/37280256793) à 950 tests, 946 PASS et 2 FAIL (les mêmes) ; le seul test ajouté passe.
- Dérogation consignée dans [5990396582](https://github.com/MyUncried/Application-Routine/pull/321#issuecomment-5990396582).
- Fusion `2a3302669d211339031887914ebfd9ff354f06c8` (2026-10-05T07:55:22Z).

### Troisième blocage : la relance ne prend pas le nouveau workflow
- Tentative 3 du run 37244733631 : même refus `TARGET_NOT_DELIVERED`.
- Le journal montre que le workflow exécuté ne contient pas le bloc de #321 (0 occurrence de `KODJO_CUMULATIVE_CHANGED_FILES`). La copie de `main` utilisée est `9fad303d`.
- Une relance réutilise la définition du workflow de l'événement d'origine, et le routeur ne réagit qu'à `issue_comment.created`.
- Option A choisie par Hermann : nouveau marqueur technique [5990475371](https://github.com/MyUncried/Application-Routine/issues/288#issuecomment-5990475371). Il porte les mêmes champs, renvoie à la décision 5985692286 et n'en ajoute aucune.

### Finalisation réussie
- Run [37281056162](https://github.com/MyUncried/Application-Routine/actions/runs/37281056162) : succès.
  - `finalization verified … device=true` ;
  - rejeu de la revue `verdict=APPROVE device=true mode=FULL` ;
  - Jest `1519 passed, 1519 total` ;
  - TypeScript, lint et cohérence de clôture passés (le job a abouti).
- `FINAL_OUTPUT` [5990555369](https://github.com/MyUncried/Application-Routine/issues/288#issuecomment-5990555369) : `READY_TO_CLOSE`, `visual_approval_comment_id=5990475371`.
- `SLICE_CLOSED` [5990557747](https://github.com/MyUncried/Application-Routine/issues/288#issuecomment-5990557747) : `CLOSED`, `closure_commit=127a83727c1009165d156cafb08c990ead12c4d0`.
- **Fusion de #303** :
  - commande `gh pr merge 303 --merge --match-head-commit 3780eb92…` ;
  - commit de fusion `a153c8e7abf8d492accdcb08314ac235204b4d83` (2026-10-05T08:08:15Z) ;
  - parents : `127a8372` (`main`) et `3780eb92` (tête approuvée).
- **Issue #288** : fermée `COMPLETED` le 2026-10-05T08:08:57Z, avec un commentaire récapitulatif (décision, réserves, références).

## Hypothèses non démontrées

- Aucune sur la chaîne de finalisation : toutes les étapes ont été exécutées.

## Modifications réalisées

- Commentaires publiés depuis le compte de Hermann sur #288 : 5985692286 (décision) et 5990475371 (marqueur technique).
- Correction 1 (#320, `9fad303d`) avec sa dérogation 5986087308 ; correction 2 (#321, `2a330266`) avec sa dérogation 5990396582.
- Relances 2 et 3 du run 37244733631.
- Fusion de #303 et fermeture de #288.
- Ce rapport.

## Éléments non faits / en attente

- Les deux tests pilotes en échec sur `main` (IA-004 dans `protocol-runtime-freeze.pilot.js`, 0.6.29 dans `v2-initial-planning-entry.pilot.js`) : à corriger séparément.
- Reformulation de CE-UI-09 §17 (nom vide : bouton inactif, sans message) : à reporter dans la documentation.
- Réserves visuelles et accessibilité au runtime : à affecter explicitement dans le périmètre de PRE-3.
- Défaut de protocole relevé : une relance après un correctif de workflow n'en tient pas compte, faute de déclenchement manuel du routeur. Piste d'évolution à évaluer séparément.
## Publication documentaire (2026-10-05)

- Autorisée par Hermann : publier ce rapport et `2026-10-05_FIGMA_ZONES_CORPORELLES_MODAL_READ.md` par une PR documentaire limitée à ces deux fichiers, sans relancer de cycle PRE-2.
- Préparation dans un worktree isolé créé depuis `origin/main` `a153c8e7`, sur la branche `docs/pre2-finalization-reports`. Le contenu vient des commits locaux `72be7e9d` (rapport Figma) et `c91bea3b` (ce rapport, avant la présente section).
- Dérogation autorisée, limitée à la PR documentaire : fusion possible si les contrôles passent, ou si les seuls échecs sont IA-004 et 0.6.29, reproduits sur `main` sans la PR et sans nouvelle régression. Sa vérification est consignée dans la PR.
- **Incident pendant la préparation, corrigé** :
  - La première tentative de création du worktree a été faite avec `MSYS_NO_PATHCONV=1`. Git n'a pas converti le chemin et a créé le worktree sous `C:/c/Dev/…`. La copie s'est alors exécutée dans le dépôt principal et a vidé les deux rapports de son arbre de travail.
  - Restauration immédiate depuis `HEAD` (`c91bea3b`) : 87 et 143 lignes. Seuls ces deux fichiers étaient touchés ; les 13 fichiers de spécifications modifiés de Hermann sont restés intacts.
  - Le worktree mal placé, qui était propre, a été retiré avec `git worktree remove`, et sa branche supprimée.
  - Restent deux dossiers vides, `C:\c\Dev` et `C:\c`, dont la suppression a été refusée par un contrôle de sécurité : à supprimer par Hermann.

## Vérifications restant à faire sur appareil réel

- Comparaison visuelle Figma et accessibilité runtime (reportées à PRE-3 par décision de Hermann).

## Fichiers modifiés

- `.github/orchestration/reports/2026-10-05_V2-PRE-2_FUNCTIONAL_ACCEPTANCE_FINALIZATION.md` (création)
- `.github/orchestration/reports/2026-10-05_FIGMA_ZONES_CORPORELLES_MODAL_READ.md` (publication du rapport de lecture Figma, sans modification)

## Commit final et état Git

- Publication par la PR documentaire `docs/pre2-finalization-reports`. Le hash de fusion figure dans la PR et dans la réponse de clôture.
- Les commits locaux `72be7e9d`, `eb970f0f`, `46fdb602` et `c91bea3b` restent sur le `main` local de Hermann, sans push. Leur contenu est repris par la PR.
