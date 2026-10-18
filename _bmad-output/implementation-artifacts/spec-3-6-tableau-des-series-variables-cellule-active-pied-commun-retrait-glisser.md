---
title: 'Story 3.6 — Tableau des séries variables : Cellule active, Pied commun, retrait, glisser'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: '2945e167'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-3.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-kodjo-pre4-2026-10-16/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-3-5-selecteur-de-cible-en-repetitions-a-une-colonne.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/questions-ouvertes.md'
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le Tableau des séries variables porte encore des `InlineStepper` permanents dans chaque cellule. Il n'a ni Cellule active, ni Pied commun, ni croix de retrait avec « Série supprimée — Annuler », ni ouverture du Sélecteur depuis une cellule de Cible. `steppedValue(5999, +1, …)` renvoie 3535 (valeur inférieure pour +).

**Approach:** Implémenter la **story 3.6 (AC1 à AC13, `epics-parts/epic-3.md`)** selon AD-8, AD-15 (deux états `openSurface` et `activeCell`, table T1 à T27) et AD-16 (`stepTarget`, `steppedValue` corrigé), avec les décisions Q13, Q15, Q21, Q25, Q26, Q29, Q35, Q36, Q40, Q41, Q42. **Réutiliser** : le réducteur `sheetSurface.ts` (l'étendre avec `activeCell` et `selector(rowTarget(l))`, ne pas en créer un second), `DurationWheelPicker` (3.4) et `NumberWheelPicker` (3.5) avec leurs props `targetBounds` / `failureOption`, `selectorOpeningPosition`, `AnchoredPanel` (Q41 : panneau sous la cellule, aligné à droite), le glisser PRE-3 (`DraggableRow`, actions monter / descendre), le message d'ajustement existant pour « Série supprimée — Annuler », `removeRow` / `undoRemoval` / `pendingRemoval` du Brouillon (3.2), `EXECUTION_ACCELERATED_HOLD_POLICY`, `RevealStepper` / mécanisme ± existant pour le Pied.

**Renégocié par Hermann le 2026-10-17 (Q44), prioritaire sur tout ce qui suit :** la Cellule active et le Pied commun **ne sont pas réalisés**. Les cellules de Cible et de Pause gardent leurs ± permanents (`InlineStepper` PRE-3). Pas d'`activeCell`, pas de Pied, pas de mention « Série i · … » ; le réducteur n'ajoute que `selector(rowTarget(l))`. Toucher la valeur d'une cellule de Cible (entre − et +, ou « à l’échec », « — ») ouvre la roue de 3.4 ou 3.5 sous la cellule (Q41) ; ✓ applique à cette ligne seule. Les ± d'une cellule suivent `stepTarget` (indisponibles sur l'échec ; `—` + → minimum, − indisponible). Restent : croix et « Série supprimée — Annuler » (croix inactive sous surface ou stepper ouvert), fond `#FFF1F0`, glisser, `steppedValue` corrigé, AC10 à AC13. Les mentions de Cellule active et de Pied ci-dessous sont sans objet.

**Statut des critères sous Q44 :** maintenus : AC1, AC3 (ouverture du Sélecteur depuis la cellule, ✓ / ✕ / appui extérieur), AC5 et AC6 (appliqués aux ± des cellules), AC7, AC8, AC9 (croix inactive tant qu'un outil est ouvert), AC10 à AC13 (AC13 : cibles tactiles et annonce de ligne et colonne de la cellule) ; partiels : AC2 (seule l'unicité de la surface ouverte, tableau compris, et la fermeture d'un champ hors tableau au toucher d'une cellule de Cible, T21) ; sans objet : AC4 (Pied commun), la partie Cellule active d'AC3 et d'AC9 (T27 avec Cellule active), T4, T9, T11, T12 et R-3.6-08. Q26 n'est supersédée que pour le Pied sans Cellule active ; sa règle `UNSET` (+ → minimum, − indisponible) s'applique aux ± des cellules.

## Boundaries & Constraints

**Always:**
- Réducteur d'interface pur (`sheetSurface.ts`) : `openSurface` et `activeCell` distincts ; les invariants d'AD-15 (au plus une surface ; `stepper` et `activeCell` jamais ensemble ; `selector(rowTarget(l))` seulement avec `activeCell = { l, target }` ; « Ligne disparue » ; anti-rappel tardif par clé). Un test de réducteur par transition T1 à T27, plus R-3.6-08, S4, T27 avec Cellule active, « Ligne disparue », T8. Sous Q41, T7 et T10 pour un panneau : toucher hors du panneau ferme sans appliquer, range l'outil (T7) et n'active pas la cellule touchée.
- Domaine (`ExecutionParameters.ts`) : `stepTarget(mode, target, direction)` → valeur ou `unavailable` (AC4, AC5 : `UNSET` + → minimum, − → `unavailable` ; `FAILURE` → `unavailable` ; 7 s → 8 / 6 ; 5999 → + `unavailable`, − 3535 ; 150 rép. → + `unavailable`, − 100). `steppedValue` corrigé : jamais inférieur à la courante pour +, ni supérieur pour − ; le Profil (`PROFILE_HOLD_POLICY`) est inchangé.
- Pas et maintien (Q36) : Cible Durée pas 1 dans 5..3535 ; Répétitions pas 1 dans 1..100 ; Pause pas 1 dans 0..300 ; maintien par `EXECUTION_ACCELERATED_HOLD_POLICY` existante ; saturation sans rebouclage. Aucune politique nouvelle.
- Cellule à renseigner : fond `#FFF1F0` (`dangerSurface`), sans contour, sans message (Q35) ; ✓ de la Feuille indisponible ; jamais convertie en échec.
- Pied commun : toujours affiché en `variables` ; sans Cellule active, sans mention et ± indisponibles (`accessibilityState.disabled`) ; avec Cellule active, mention `Série i · <colonne>` et ± sur elle seule (indisponibles si une surface est ouverte ou si `stepTarget` est `unavailable`). Chaque pas est acquis dans le Brouillon de la Feuille.
- Croix de retrait : active seulement si aucune surface, aucun stepper ni Cellule active ; sinon l'appui range l'outil sans retirer. Indisponible à N = 1. « Série supprimée — Annuler » par le message existant ; `Annuler` suit Q29 (invalidé par toute modification du Brouillon, pas par l'ouverture / fermeture sans application d'une surface) et ne range pas l'outil (T27).
- Glisser PRE-3 conservé (responder RN, sans `List` native), repère d'insertion, actions VoiceOver monter / descendre existantes.
- Sélection du groupe « Séries variables » (Q40, AC1 dernier alinéa) : vérifier l'existant (E-14) et compléter si besoin, sans retravailler l'ergonomie validée.
- Cibles tactiles ≥ 44 × 44 sans agrandir le dessin (`hitSlop`) ; Cellule active annoncée par ligne et colonne, pas par la seule couleur ; textes par le lexique (`1 série` / `3 séries` : vérifier l'existant).
- Garde-fous zéro `ScrollView` intacts. Aucun jeton modifié. `migration001` intouchée.

**Never:**
- Pas de second réducteur, pas de réimplémentation de la roue, du glisser ni du stepper ; pas de `List` native ; pas de nouvelle durée ni de nouvel écran pour le message de retrait.
- Ne pas retravailler l'ergonomie validée (animations, panneaux, sélection, lignes de 44 pt).
- La Durée totale relève de 3.7 ; le comportement sous N hérité est hors story.

</frozen-after-approval>

## Code Map

- `src/features/activities/sheetSurface.ts` : réducteur (T7, T8, T10, T15, T16, T20, T23, T24 déjà présents) ; « Hors story 3.3 : `activeCell` et `selector(rowTarget(l))` (story 3.6) ».
- `src/features/activities/ExecutionParametersSheet.tsx` : tableau (`DraggableRow`, `InlineStepper` des cellules), message d'ajustement et `Annuler`, `AnchoredPanel` et `rowBoxes` / `trackRow`, roues de Cible commune (modèle).
- `src/domain/activities/ExecutionParameters.ts` (`EXECUTION_BOUNDS`, `nearestGridValue`, `selectorOpeningPosition`) ; `ExecutionParametersDraft.ts` (`removeRow`, `undoRemoval`, `pendingRemoval`).
- `src/shared/ui/ProfileStepper.tsx:66` (`steppedValue`).
- `src/shared/i18n/index.ts` ; `src/features/activities/testing/executionSheetActions.ts`.
- Tests : `sheetSurface` (réducteur), `ExecutionParameters.test.ts`, `ProfileStepper` tests, `ExecutionParametersSheet.test.tsx`.
- Relevé visuel : `8328:38632`, `8328:38741`, `8328:38848`, `8470:13303`, `8328:39279`, `8328:39181` ; maîtres `8129:31593`, `8129:31601`, `8129:31604` (depuis `docs/preparation/PRE-4/figma/*.json.gz` et le fichier des maîtres de `sources-caa2a5cf`).
- Recette `recette-iphone.md` §4.3 : R-3.6-01 à 09 (texte de la story).

## Tasks & Acceptance

**Execution:**
- [x] Relevé visuel (tableau dans les Implementation Notes, D-255).
- [x] Domaine : `stepTarget`, `steppedValue` corrigé, tests.
- [x] Réducteur : `selector(rowTarget(l))`, transitions applicables, tests (`activeCell` sans objet, Q44).
- [x] Feuille (Q44) : ± permanents conservés avec la règle `stepTarget`, Sélecteur de cellule dans `AnchoredPanel`, croix et « Série supprimée — Annuler », fond `#FFF1F0`, glisser conservé, accessibilité. Cellule active et Pied commun : sans objet (Q44).
- [x] Tests `PRE4-3.6/AC1` à `AC13` (AC2, AC4 limités, Q44) ; recette R-3.6-01 à 09 ; READMEs.

**Acceptance Criteria:**
- Given la story 3.6, les décisions citées et Q44, when elle est livrée, then chacun de ses critères maintenus ou partiels (statut ci-dessus) est vérifié par un test nommé, chaque transition T1 à T27 hors T4, T9, T11, T12 par un test de réducteur ; `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Implementation Notes

**Portée réelle : Q44.** Décision de Hermann du 2026-10-17, transmise par le coordinateur en cours de développement : ni Cellule active ni Pied commun. Le premier état du développement (Cellule active, Pied commun, cellules sans ±) a été retiré à la main, sans commande Git. Les cellules gardent leurs `InlineStepper` permanents.

**Relevé visuel (D-255 ; `docs/preparation/PRE-4/figma/*.json.gz`, captures de `sources-caa2a5cf`).**

| Frame / maître | Relevé | Suite donnée |
|---|---|---|
| `8328:38632` (Durée, `variables`) | Lignes 334 × 36 à x36 (tableau au bord des lignes, sans retrait x52) ; poignée 12 × 18, numéro 24 aligné à droite (x24) ; cellules 76 × 24, rayon 8, à x79 et x175, valeur Semi Bold 13 `#0508E5` ; cellule active `#EAEAFF` ; barre d'accent 3 × 24 `#0508E5` à x28 ; croix : zone 36 × 36 à x294, disque 28 `#FCFCFE` liseré blanc, croix 12 × 12 trait 2,2 `#0508E5` ; filets 330 entre lignes ; Pied 354 × 48 (« Série 1 · Durée » 12 Medium `#595E66`, boutons 36 blancs espacés de 16) | Tableau sans retrait x52 ; croix reproduite (disque 28, jeton `parametersSegmentedOption`, icône `wheel-action-cancel` teintée `primary`). Cellules 76, fond actif, barre d'accent, filets, Pied : sans objet (Q44, ± permanents conservés) |
| `8328:38741` (Répétitions) | `12 rép.`, `10 rép.`, `8 rép.` ; en-tête « Répétitions » | Conforme (formateur existant) |
| `8328:38848` (tout échec) | « à l’échec » en bleu dans chaque cellule, deux colonnes conservées | Valeur du stepper « à l’échec » (`formatValue`), ± indisponibles ; deux colonnes |
| `8470:13303` (mixte) | Ligne 3 « à l’échec » parmi des durées | Conforme |
| `8328:39279` (glisser) | Ligne portée en carte ombrée sous les autres | Glisser PRE-3 inchangé (pas d'ombre ajoutée, ergonomie validée) |
| `8328:39181` (replié) | Groupe replié, chevron bas | Inchangé |
| `8328:37760` (R-3.6-06) | Ligne `Séries` à N = 1 : « 1 série » dans la pastille de valeur | Libellé du lexique existant (`1 série` / `n séries`), inchangé |
| `8129:31593`, `8129:31601`, `8129:31604` | Ligne, Pied, croix (même géométrie que ci-dessus) | Ligne et croix comme ci-dessus ; Pied sans objet (Q44) |

**Choix d'intégration.**
- Réducteur (`sheetSurface.ts`) étendu, pas dupliqué : surface `selector(rowTarget(l))` (l = identité de ligne, `rowIds`), `sameSurface` distingue la ligne, événement `rows` (« Ligne disparue » : un Sélecteur de ligne dont la ligne n'existe plus se ferme ; envoyé par un effet sur `draft.rowIds`), `removalEnabled(state)` (croix active seulement sans surface ni champ ± ouvert). Aucun état `activeCell`.
- Ouverture du Sélecteur : toucher la **valeur** d'une cellule de Cible, entre − et + (y compris « à l’échec » et « — »). `InlineStepper` reçoit deux props optionnelles, sans effet en leur absence : `onValuePress` (la valeur devient un `Pressable`, `hitSlop` 14 en haut et en bas ; action d'accessibilité « activer » du réglage ajustable) et `stepRule` (règle de pas de l'appelant). Le composant n'est pas remplacé ; ses ± et son maintien sont ceux de PRE-3.
- Règle du pas des ± d'une Cible : `stepTarget(mode, cible, sens, pas)` du domaine via `stepRule` (la valeur courante du stepper prime, pour que le maintien relise la dernière valeur). `FAILURE` : ± indisponibles ; `UNSET` : + donne 5 s ou 1, − indisponible ; 5999 : + indisponible, − 3535 ; 150 : + indisponible, − 100. Politique de maintien inchangée (`EXECUTION_ACCELERATED_HOLD_POLICY`). Pause : inchangée.
- Domaine : `stepWithinBounds` (pas borné, multiples directionnels, jamais en arrière) et `stepTarget` dans `ExecutionParameters.ts` ; `steppedValue` (`ProfileStepper.tsx`) délègue à `stepWithinBounds` (le domaine n'importe rien de `shared/`). Résultats inchangés dans les bornes ; `PROFILE_HOLD_POLICY` intouchée.
- Roues : `durationTargetWheel` et `repetitionsTargetWheel` factorisent la roue de la Cible commune (3.4, 3.5) ; seul le dispatch au ✓ diffère (`setUniformTarget` ou `setRowTarget` de la ligne). Panneau `execution-sheet-cell-panel`, conteneur `execution-sheet-cell-wheel` ; Android et web : roue en ligne sous la ligne.
- Placement du panneau (Q41) : sous la cellule (bas de la cellule mesuré : groupe « Séries » → tableau → ligne → cellule, + 4), aligné à droite sur elle. La roue de 330 ne tient pas à gauche d'une cellule de Cible : elle est ramenée dans le groupe, bord gauche au bord des lignes. Choix d'intégration à juger sur iPhone (R-3.6-01). Revue : la ligne et sa cellule sont mesurées une à une, par identité (`tableRowBoxes`, `targetCellBoxes`), et élaguées au retrait ; tant que la mesure de la ligne ouverte manque, le panneau n'est pas rendu (pas de saut en tête de tableau). Largeur par défaut : celle de la roue montée, 330 en Durée comme en Répétitions à ligne de tête (`dimensions.wheelPicker.durationWidth`, story 3.5) ; la largeur mesurée est liée à la clé de l'ouverture, donc oubliée à la fermeture et au changement de Mode.
- Croix : sans surface ni champ ± ouvert, `removeRow` puis message existant « Série supprimée » + `Annuler` (`undoRemoval`), même durée, rendu sous le tableau (sous la ligne `Séries` si N tombe à 1). Croix non active : l'appui range l'outil ouvert, quel qu'il soit — `outside` pour un champ ± (T23), `closeAll` pour un Sélecteur ou un segmenté en ligne (Android, web) ou un panneau atteint directement — sans retirer ; un `accessibilityHint` du lexique (`removeRowClosesFieldHint`) l'annonce. Sur iOS, un toucher hors du panneau atteint d'abord sa zone extérieure (T7). Indisponible à N = 1 (et le tableau n'existe pas à N = 1).
- Mise en page : pour loger la croix (28, `hitSlop` 8) sans réduire les steppers acceptés (128), le tableau perd son retrait x52 (AC1) et l'écart entre colonnes passe de 4 à 2 (40 + 2 + 128 + 2 + 128 + 2 + 28 = 330 à 402). Sur un iPhone de 375 pt (SE, mini) : contenu du groupe 375 − 2 × 24 − 2 × 12 = 303 pt pour une ligne de 330 pt ; la croix (x302 à 330) n'est visible que sur 13 pt, dans la marge du groupe (`bleed` de 12, découpe à 315), et sa zone tactile est rognée. Aucune réduction ne la fait tenir sans réduire les steppers acceptés (128 + 128 + 28 = 284 laisseraient 19 pt au numéro et à la poignée). La Pause dépassait déjà avant la story (40 + 4 + 128 + 4 + 128 + 16 de retrait = 320 > 303). Consigné et porté en R-3.6-01, décision de Hermann ; pas de test Jest (aucun moteur de mise en page).
- Cibles tactiles (AC13) : poignée `hitSlop` 13/13/12/20 (44 × 44, la marge du groupe portée par `bleed` sur la ligne), croix 28 + 8 × 2, ± 28 + 10 × 2 (48), valeur ≈ 16 + 14 × 2. Les tests n'en sont qu'un contrôle structurel (style + `hitSlop`) ; la preuve (hitSlop hors du parent, découpe `clip`) est en recette, R-3.6-10.
- Accessibilité (revue) : avec `stepRule`, le réglage ne propose à VoiceOver que les pas disponibles (aucun à l'échec, seul « diminuer » à 5999 s) ; valeur annoncée « à l’échec » ; « activer » ouvre la roue, sauf réglage `disabled` (valeur alors non tactile ; des ± indisponibles par la règle laissent la valeur touchable). Roue Durée d'une ligne : libellés minutes et secondes préfixés « Série n, Durée », comme la roue Répétitions.
- Identité de ligne (revue) : `tableRowIdentity(rowIds, index)` ne renvoie jamais un rang ; une ligne sans identité reste affichée et réglable, sans Sélecteur ni croix.
- Message d'ajustement typé par genre (`Adjustment`) : le retrait ne garde plus d'instantané `previous`.
- Lexique : `removeRow` (« Supprimer la série {n} »), `seriesRemoved` (« Série supprimée »), `removeRowClosesFieldHint`. `1 série` / `3 séries` existaient.
- Retiré : `FailureTargetText` (la cellule à l'échec est le stepper lui-même).
- Tests (56 nommés `PRE4-3.6/…`) : réducteur (`T1`, `T2`, `T3`, `T5` à `T8`, `T10`, `T13` à `T27`, `S4`, « Ligne disparue »), domaine (`AC4`, `AC5`, `AC6`), `steppedValue` et maintien (`AC5`, `AC6`), Feuille (`AC1` à `AC13`, AC2 et AC4 limités à la partie maintenue). Tests existants adaptés : largeur des cellules (128, inchangée), cellules à l'échec (`PRE4-1.1/AC22` : ± indisponibles au lieu d'absence de stepper ; nom accessible « Série 1, Répétitions » avec la valeur « à l’échec »).
- **Sans objet (Q44), non testés :** T4, T9, T11, T12, R-3.6-08 ; la partie `activeCell` de T5, T6, T7, T13, T21 et T27 ; AC2 (hors unicité de la surface ouverte), AC4 (hors règle du pas de la cellule), la partie Cellule active et Pied d'AC3, AC9 et AC13.
- Garde-fous zéro `ScrollView`, `migration001`, `tokens.ts`, `PROFILE_HOLD_POLICY` : intouchés. Recette : R-3.6-01 à 10 ajoutés au §4.3 de `recette-iphone.md` (R-3.6-08 sans objet ; R-3.6-10 : cibles tactiles et VoiceOver sur appareil).

## Spec Change Log

- 2026-10-17 — (a) Q44 (décision de Hermann, transmise par le coordinateur ; section frozen mise à jour par lui) : ni Cellule active ni Pied commun ; ± permanents des cellules conservés. Le travail déjà écrit pour ces deux points a été retiré.
- 2026-10-17 — (b) Lecture retenue pour « toucher la cellule de Cible » sous Q44 : toucher la valeur affichée entre − et + (ou « à l’échec », « — »), exposée à VoiceOver par l'action « activer » du réglage. Interprétation de Claude, révisable par Hermann.
- 2026-10-17 — (c) Placement du panneau : aligné à droite sur la cellule quand la roue tient ; sinon ramené dans le groupe (roue de 330 plus large que l'espace à gauche de la cellule). Choix d'intégration à juger sur iPhone.
- 2026-10-17 — (d) Écart entre colonnes du tableau 4 → 2 pour loger la croix sans réduire les steppers (choix d'intégration).
- 2026-10-17 — (e) Valeur de départ d'une Cible `—` au + d'une cellule : 30 s (`emptyStart` PRE-3) → 5 s (1 en Répétitions), valeur minimale, par `stepTarget` (Q25, Q26) ; − indisponible.
- 2026-10-17 — (f) Revue : croix non active = rangement de l'outil ouvert quel qu'il soit, avec indice d'accessibilité ; mesures du panneau par ligne, panneau non rendu sans mesure ; actions VoiceOver limitées aux pas disponibles ; recette R-3.6-10 ; constat à 375 pt consigné (R-3.6-01).

## Review Triage Log

Revue du 2026-10-17 (itération 0), après la décision Q44 : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V). Correctifs de code appliqués par l'implémenteur ; corrections documentaires (spec, epics, PRD, spine, `questions-ouvertes.md`) par Claude.

| Constat | Verdict | Route |
|---|---|---|
| B1/B2/B3 — critère d'acceptation, bloc frozen et note des epics contradictoires avec Q44 | medium | patch (statut par AC dans la spec et la story 3.6) |
| B4 — vocabulaire « Pied commun / Cellule active » périmé (JSDoc, READMEs, tests, ligne Q41) | low | patch |
| B5 — PRD FR-10-03 et spine AD-15/AD-16 non annotés en ligne | low | patch |
| B6 — Q26 dite supersédée mais appliquée | low | patch (Q26 supersédée pour le seul Pied ; règle `UNSET` maintenue) |
| B7 — alignement à droite de Q41 impossible sur la cellule de Cible | medium | patch (Q45 ouverte, à juger par Hermann, R-3.6-01) |
| B8/E3/E4 — largeur et mesures du panneau périmées, boîte de cellule partagée, ligne non mesurée | medium | patch (mesures par identité, panneau différé, largeur liée à l'ouverture) |
| B9 — croix rognée sur iPhone 375 pt | medium | defer (documenté, R-3.6-01 ; correction = réduire les steppers acceptés, décision de Hermann) |
| B10 — croix annoncée active quand elle ne fait que fermer un champ | low | patch (`accessibilityHint`) |
| B11/E1/V-autre — Android/web : croix sans effet avec un Sélecteur en ligne ouvert | medium | patch (la croix range tout outil ouvert) |
| B12 — règle « la croix ne retire pas sous panneau » non testée | low | patch (appui direct sur la croix) |
| B13 — roue Durée d'une ligne sans contexte de ligne pour VoiceOver | low | patch |
| B14 — T10 au lieu de T7 ; frame `8328:37760` absente du relevé | low | patch |
| B15 — `previous` inutilisé ; `emptyStart` 30 → 5 s non consigné | low | patch (union par genre ; Spec Change Log, Q44) |
| V1 — T27 (Annuler ne range pas l'outil) non vérifié dans la Feuille | medium | patch (Bip ouvert ; Sélecteur Android ouvert) |
| V-autre — tests AC13 de cibles tactiles sans mesure réelle | low | patch (renommés en contrôles structurels ; R-3.6-10) |
| E2 — valeur touchable d'un stepper désactivé | medium | patch |
| E5 — identité de ligne remplacée par l'index | low | patch (`tableRowIdentity` → `null`) |
| E6 — réordonnancement possible avec un stepper ouvert (T18) | low | rejeté pour le code (le glisser range l'outil dans le même geste, T13/T23) ; test renommé |
| E7 — cellule à l'échec : actions VoiceOver increment/decrement sans effet | medium | patch (seules les actions disponibles) |


## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
