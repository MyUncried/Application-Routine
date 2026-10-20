# KODJO PRE-6 — État de départ vérifié

Relevé du 20/10/2026, en lecture seule, sur la branche de planification `plan/pre6-bmad` (worktree `C:\Dev\KODJO-BMAD-PRE6`), commit `ad189847`. Aucun fichier applicatif, aucune spécification et aucun nœud Figma n'ont été modifiés.

## 1. Baseline PRE-5

| Élément | Constat |
|---|---|
| `origin/main` | `ad189847` — « Merge pull request #389 from MyUncried/pre5-bmad/livraison-main », fusionnée le 20/10/2026 à 08:33 (UTC). |
| Contenu | 12 stories et 3 epics PRE-5 terminés (`67838422`), plus les corrections de recette RC-14 à RC-17 du 20/10. |
| Worktree PRE-5 | `C:\Dev\KODJO-BMAD-PRE5`, branche `bmad/pre5-depuis-pre4`, à `67838422`, en retard de 3 commits sur `origin/main` (commits de livraison). Non modifié par PRE-6. |
| Clôture PRE-5 | En cours : recettes iPhone des lots Feuille (R-2.5 à R-2.8) et Éditeur (R-3.1, R-3.2) notées « en attente » dans `_bmad-output/pre5/implementation-artifacts/sprint-status.yaml` ; rétrospectives facultatives non faites. |
| Report PRE-5 utile à PRE-6 | Story 1.2 AC6 : indicateur de côté de la Composition sans direction, reporté au « batch correctif UX » (`_bmad-output/pre5/implementation-artifacts/deferred-work.md`). Aucun rendu neutre n'existe dans Figma (`5544:6944`, `8328:28605` affichent « D→G »). |

**Conséquence.** `ad189847` est la baseline **provisoire**. Le plan prévoit une étape 0 de réconciliation avec le commit PRE-5 effectivement validé (voir `planning-artifacts/epics.md` § Étape 0). D'autres corrections PRE-5 issues des recettes encore attendues peuvent arriver sur `main`.

## 2. Code existant (acquis à conserver)

Chiffres : nombre de lignes. `CS` = `src/features/sessions/CompositionScreen.tsx`.

### 2.1 Composition

| Acquis | Emplacement | Remarque |
|---|---|---|
| Route et brouillon de séance | `app/(creation)/composition.tsx`, `_layout.tsx` (`SessionDraftProvider`), `SessionDraftProvider.tsx` | À conserver. |
| En-tête fixe, nom (limite `NAME_MAX_LENGTH`), Étiquette (`LabelPickerModal`) | CS L588-680 | Couleur dérivée de l'Étiquette. |
| Ajout : menu « Une nouvelle activité » / « Une activité existante » | CS L702-718, L993-1046 ; `ActivitySelectionScreen.tsx` `handleAdd` L120-146 | Copies indépendantes, insertion atomique. |
| Compte à rebours initial et Fin de séance | `BoundaryActivityRow` CS L767, L854 ; `DurationWheelPicker` dans `WheelPickerOverlay` | |
| Zones avant / dans / après le Tour | `ActivityZoneList` CS L1261-1310 ; `StructuralPosition` (`Session.ts:60`) | |
| Carte d'occurrence | `CompositionActivityRow` CS L1448-1902 | Nom, zones, résumé (`formatExerciseRowSummary`), indicateur D→G / G→D, sous-ligne Récupération. |
| Gestes | `compositionGesture.ts` (204) : appui long 500 ms → glisser ; balayage 40 → Dupliquer / Supprimer | Système de répondeurs React Native, sans RNGH ni Reanimated (CS L1379-1384). |
| Opérations pures | `domain/sessions/composition.ts` (245) : `appendActivityAfterLastDisplayed`, `moveActivity`, `removeActivity`, `duplicateActivity` | |
| Édition d'une copie | `ExerciseScreen.tsx` (741) → `ActivityEditorForm.tsx` → `ExecutionParametersSheet.tsx` (PRE-5) | Parcours livrés en PRE-4/PRE-5. |
| Enregistrement et garde de sortie | CS `handleSave` L363-390 ; `useCompositionExitGuard.ts` ; `AbandonCreationModal` ; états `CompositionEditState` L2149-2208 | `createSession` / `updateSession` atomiques. |
| Calculs | `domain/sessions/calculations.ts` (280) ; `domain/activities/executionCalculations.ts` (363) : registre d'exécution, `To = T − PN + R`, natures exact / ≈ / ≥ / omis | |
| Présentation | `compositionPresentation.ts` (362), `formatSessionSummary.ts` (133) | |
| Paramètres PRE-5 | `ExecutionParameters.ts` v3 (1354), `ExecutionParametersDraft.ts` (1210), `ExecutionParametersSheet.tsx` (3444) | Phases, charge, côtés, cadence, pause, identiques / variables, cibles typées et À l'échec. |
| Persistance | Migrations 001 à 010, `DATABASE_VERSION = 10` ; `SqliteSessionRepository.ts` (1468) ; `SessionService.ts` | Prochaine migration : 011. |
| Composants partagés | `SegmentedControl` (variantes `standard` / `parameters` / `inline`), `InlineStepper` / `ProfileStepper`, `DisclosureControl`, `ScreenShell`, `KodjoIcon`, `TransientNotification`, `tokens.ts` ; `AnchoredPanel`, `SheetMotion`, `sheetTable.tsx`, `NumberWheelPicker`, `DurationWheelPicker`, `DecisionDialog` | `Row`, `ValuePill`, `Separator` sont locaux à la Feuille (non exportés). |

Tests existants : `CompositionScreen.test.tsx` (3378 lignes, environ 167 cas), `compositionPresentation.test.ts` (environ 78), `calculations.test.ts` (51), `composition.test.ts` (33), `SessionDraft.test.ts` (51), `SqliteSessionRepository.test.ts` (environ 86), flux d'intégration `Composition*Flow`, migrations (`migrateDatabase`, `migration010`, `targetSchema`).

### 2.2 Écarts avec la cible

| # | Écart | Preuve |
|---|---|---|
| E1 | Aucune entité Circuit avec nature. Seul existe le Tour : `tour.repeatCount` 1..99 (`Session.ts:183-204`, `SessionDraft.tourRepeatCount`). | Ni nature, ni borne, ni conversion. |
| E2 | Contrôle du compte = roue `NumberWheelPicker` derrière une boîte à chevron (`TourCard` CS L2043-2140), libellé « Nombre de tours ». | Remplacé par CIR-10 (12/10) : chiffre → ± révélés ; pastille d'unité → nature ; œil permanent. |
| E3 | Aucune modale Volumes, aucune icône œil (`KodjoIcon`). | CE-CIR-03. |
| E4 | Récupération = scalaire `postActivityRecoverySeconds` NOT NULL DEFAULT 0 : absent et 0 indiscernables. Aucune interface de réglage ; toutes les insertions passent 0. | Ch09 L558, L566, L682 et ch08 L473 exigent absent ≠ 0 ≠ positif. |
| E5 | La sous-ligne « Récupération 0 s » s'affiche toujours : `formatActivityRecoveryLabel` renvoie toujours une chaîne (`compositionPresentation.ts:360`), donc `recoveryLabel !== null` est toujours vrai (CS L1715, L1885). | Contraire à D-303 (« Récupération absente/0 … aucune information »). |
| E6 | Points d'arrêt : domaine `StopPoint.ts` (portée + rang) et table `session_stop_points` existent, mais `SessionDraft` ne les porte pas, la validation les laisse passer et `update()` supprime puis réinsère la liste reçue (vide) (`SqliteSessionRepository.ts:503-510`). `insertStopPoints` renumérote les positions de 0 à k : l'emplacement exact est perdu. | Effacement latent dès qu'une interface en créera. Le rang « dans la portée » ne dit pas après quelle occurrence se place le point. |
| E7 | Aucun mode placement, ni sous-brouillon, ni roulette de récupération, ni action Retirer. | CE-T03-08 L1494, ch08 L465-474. |
| E8 | `inheritedSeriesCount` existe (`ExecutionParametersDraft.ts:125-128`) mais la Feuille ne le reçoit jamais (`openSheetDraft(parent)`, `ExecutionParametersSheet.tsx:511`). | N hérité d'un Circuit de Séries non raccordé. |
| E9 | La carte n'affiche ni la classification (catégorie et pastille), ni les volumes « 10 · 12 · 14 rép. ». | Figma `8328:28605`, `8328:34965` ; CE-T03-08 L1474. |
| E10 | Action finale libellée « Enregistrer la séance » (`fr.ts:331`). | « Continuer » dans CE-T03-08 L1672 et Figma. Règles d'activation (nom, D-380) à vérifier. |
| E11 | Résumé du Circuit `« N exercice · X min »`, état vide « 0 exercice · 0 min ». | D-390 (pas de « N exercice(s) »), D-399 (« — min »), D-382 (ce Circuit seulement). |
| E12 | Plage de récupération du code 0..5999 s (`wheelPickerMath.ts:67`). | Contrat 0..300 s, grille 1 s jusqu'à 5, 5 s jusqu'à 120, 30 s jusqu'à 300 (CE-T03-08 L1502). |
| E13 | Défaut Profil de récupération (`Profile.postActivityRecoverySecondsDefault`) jamais appliqué. | RM-209 et D-307 : proposé à l'ajout explicite. |

Code mort repéré, sans action PRE-6 nécessaire : `SideModeControl.tsx`, `ColorPalette.tsx`, clés `composition.tourBilateralConfirmModal` et `composition.colorPicker` de `fr.ts`.

## 3. Sources de vérité retenues

Dernière couche normative sur les Circuits : arbitrages **CIR-01 à CIR-12 du 12/10** (ch07 L622-639), D-382, D-388, D-390 et D-399 (16-17/10). Les PR documentaires #383 à #388 (18-19/10) ne modifient aucune règle de Composition, de Circuit, de Récupération ou de Point d'arrêt. Décision la plus récente : D-434 (19/10), qui concerne l'éditeur.

| Sujet | Référence principale |
|---|---|
| Composition | CE-T03-08 (ch13 L1434-1688) ; RM-017 à RM-031 (ch10 L527-556) |
| Nature, conversion, réserve | CE-CIR-01 et CE-CIR-02 (ch13 L1692-1862) ; ch10 L649-659, L678-798 ; CIR-02, CIR-03, CIR-04, CIR-05, CIR-10 |
| Volumes | CE-CIR-03 (ch13 L1864-1950) ; ch10 L808-818 ; CIR-08 |
| Récupérations et Points d'arrêt | ch10 L584, L627-631 ; RM-036, RM-038, RM-191, RM-209, RM-210, RM-213, RM-219, RM-220 ; D-217, D-301, D-303, D-304, D-307, D-314, D-323 ; ch08 L465-474 ; ch11 API-COM-09, API-COM-REC-01 à 05, placement L228-251 |
| Durées | RM-129, RM-159, RM-071 ; ch10 L2038, L2050-2052 (exemples 75 s / 85 s / 225 s / 255 s) |
| Modèle | ch09 L81-144, L558-582, L682 ; ch12 L1677-1687, L1713-1726 |
| Formats (future PR) | ch10 L1102-1108 (organisation / indexation / borne) ; FMT-26, FMT-30 à FMT-38 ; ch12 L1713, L1720-1726 ; REVUE-COHERENCE-FORMATS R-01 à R-04 |

## 4. Relevé Figma (lecture seule, 20/10)

Fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page `510:101`. Les valeurs chiffrées des captures sont des exemples, pas des règles.

| Frame | Apport |
|---|---|
| `8328:28172` Initial | Circuit vide, en-tête « Circuit », durée, œil, compteur « − 1 tour + », « Continuer » grisé. |
| `8328:28605` Standard | Cartes : nom ; pastille + classification + zones ; cible à droite et badge « D→G ». Récupération positive sur un trait sous la carte (sablier, « Récupération 20 s »). |
| `8328:28863` Actions glissées | Balayage : Dupliquer / Supprimer ; la récupération glisse avec la carte. |
| `8328:29270` Placement | Contenu atténué, icône pause pleine ; emplacements après chaque occurrence (Récupération / Point d'arrêt) ; barre « Confirmer 2 pauses ajoutées » / « Annuler ». |
| `8328:29428` Point d'arrêt | Puce « ❚❚ Point d'arrêt » sur le trait. |
| `8328:33546` Déplacement | Bloc carte + récupération soulevé ensemble. |
| `8328:34662` / `8328:34805` | Popover de nature, avec les sous-textes « les séries d'un exercice s'enchaînent » (tours) et « une série de chaque exercice par passage » (séries). Conformes à ch10 L686-693. |
| `8328:34813` | Confirmation « Passer en circuit de séries ? » (CE-CIR-02). |
| `8328:34965` / `8328:35135` | Volumes séries / tours : colonnes Exercice, S1…Sn, Unité ; X ; feuille basse. |
| `8328:28733` | Modale « Durée de récupération » (X, ✓, roues minutes et secondes). |
| `8328:28998` | Fin de séance avec − / +. |
| `8328:29133`, `8328:33689` | « Retirer la récupération », « Retirer le point d'arrêt ». |
| `8328:34520` | Circuit de Séries à variables : volumes sur cartes. |

Écarts de captures sans effet sur les règles : la série inexistante de `8328:35135` est une case vide alors que la règle impose « — » (CE-CIR-03 L1926) ; les totaux ne sont pas recalculés d'une frame à l'autre ; certains calques sont mal nommés (`Récupération` pour un point d'arrêt, « Volumes des séries » pour la variante tours) ; un rectangle pointillé d'annotation entoure les actions d'en-tête.
