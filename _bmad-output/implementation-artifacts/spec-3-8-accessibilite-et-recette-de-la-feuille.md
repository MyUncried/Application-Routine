---
title: 'Story 3.8 — Accessibilité et recette de la Feuille'
type: 'feature'
created: '2026-10-18'
status: 'done'
route: 'dispatch'
baseline_commit: '936c03e5'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-3.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/prds/prd-kodjo-pre4-2026-10-16/prd.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-kodjo-pre4-2026-10-16/ARCHITECTURE-SPINE.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/questions-ouvertes.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/recette-iphone.md'
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les stories 3.1 à 3.7 ont livré la Feuille contrôle par contrôle. Il reste à vérifier l'ensemble : accessibilité de bout en bout (focus, annonces, lexique), inertie de toute action extérieure pendant qu'une surface est ouverte, maintien des règles PRE-3 non supersédées (table FR-03-13), tenue au texte agrandi, et une section de recette de la Feuille consolidée.

**Approach:** Implémenter la **story 3.8 (AC1 à AC9, `epics-parts/epic-3.md`)** comme une story de **vérification et de compléments** (bilan des écarts : « annonces des nouveaux contrôles, retour du focus, table FR-03-13, section de recette »). Auditer d'abord, puis ne corriger que les écarts réels, par des tests nommés. Décisions applicables : Q44 (pas de Cellule active ni de Pied commun : les parties correspondantes d'AC2 et d'AC8 sont sans objet ; à leur place, la cellule de Cible annonce sa ligne et sa colonne et ses ± disponibles), Q41 (panneaux sans flèche), Q35, Q36, Q42, Q45, Q46.

## Boundaries & Constraints

**Always:**
- Audit d'abord : pour chaque AC, relever l'existant (tests `PRE4-Q39`, `PRE4-Q40`, `PRE4-Q41`, `PRE4-3.x/…` déjà présents) et n'ajouter que ce qui manque ; les preuves déjà fournies sont citées, pas dupliquées.
- AC1 : focus confiné dans la Feuille (`accessibilityViewIsModal` ou mécanisme de la `Modal` existante), ✕ et ✓ libellés, focus rendu à la Carte Paramètres d'exécution à la fermeture (primitive `AccessibilityInfo.setAccessibilityFocus` ou équivalent existant), Régime `variables` annoncé.
- AC2 / AC3 : annonces des valeurs en lecture seule (valeur et origine, jamais un tiret), cellule de Cible (ligne et colonne, Q44), Bip (nom, `Aucun` ou intervalle, actions et limites), actions monter / descendre et poignée (libellés existants), totaux `≈` / `≥` / non modifiable (3.7), options échec sélectionnées ou non, Cible à l'échec, valeur et unité dans le Sélecteur, directions du Changement de côté en toutes lettres.
- AC4 : toute annonce par une clé de `src/shared/i18n/`, apostrophe `’`, vocabulaire du glossaire (pas de terme interdit, D-077) ; un test qui le vérifie autant que possible ; liste des textes d'annonce de la Feuille consignée dans les Implementation Notes pour validation par Hermann.
- AC5 : avec une roue ou un panneau ouvert, ni `Terminer`, ni une croix, ni ✓ de la Feuille, ni une autre ligne ne se déclenche ; l'appui extérieur ferme sans appliquer (Q41). L'Éditeur sous la Feuille est inerte.
- AC6 : table FR-03-13 du PRD : une ligne par règle PRE-3 non supersédée, avec le test qui la couvre (existant ou ajouté) ; vérifier l'absence des règles supersédées. **Ajustement Q44 :** « steppers en place et permanents » reste supersédé pour la Cible commune et les champs hors tableau, mais les ± permanents des cellules du tableau sont rétablis par Q44 ; le noter dans la table.
- AC7 : aucun `maxFontSizeMultiplier` ni `allowFontScaling={false}` dans la Feuille et ses composants ; aucune hauteur fixe qui rogne un texte (les lignes de 44 pt sont des hauteurs minimales, Q42) ; tests possibles sous Jest, le reste en recette. Constat connu à reprendre : croix rognée à 375 pt (R-3.6-01) — à 360 pt, consigner dans la recette, ne pas corriger sans Hermann.
- AC8 : section Feuille de `recette-iphone.md` consolidée au format du §3, colonne Résultat vide, au moins un scénario par popover et par roulette, états sans frame (fond `#FFF1F0`, douze Séries avec défilement, Répétitions avec option échec : attendu visuel « jugement de Hermann »). Ne pas effacer les écarts E-xx ni les résultats déjà consignés par Hermann ; consolider sans perdre d'information.
- AC9 : déjà livré par Q39 à Q41 (validé fonctionnellement par Hermann) ; vérifier que les tests listés dans « Preuves attendues » existent et sont verts, ajouter uniquement ce qui manque.
- Garde-fous zéro `ScrollView` intacts. Aucun jeton modifié. `migration001` intouchée.

**Never:**
- Ne pas retravailler l'ergonomie (durées, courbes, panneaux, sélection, 44 pt) : Hermann la réserve à une session dédiée.
- Pas de remplacement de primitive ; pas de conformité visuelle déclarée (NFR-04).
- Hors story : accessibilité de l'écran principal de l'Éditeur et des référentiels (4.6), recette finale de l'Éditeur (4.6).

</frozen-after-approval>

## Code Map

- `src/features/activities/ExecutionParametersSheet.tsx`, `AnchoredPanel.tsx`, `SheetMotion.tsx`, `sheetSurface.ts`.
- `src/features/activities/ActivityEditorForm.tsx` (ou l'écran hôte de la Carte Paramètres d'exécution) pour le retour du focus.
- `src/shared/ui/ProfileStepper.tsx`, `src/features/sessions/DurationWheelPicker.tsx`, `NumberWheelPicker.tsx`.
- `src/shared/i18n/index.ts`.
- Tests : `ExecutionParametersSheet.test.tsx`, `AnchoredPanel.test.tsx`, `sheetSurface.test.ts`.
- PRD : FR-03-13 (table des règles PRE-3).
- `docs/preparation/PRE-4/bmad/recette-iphone.md` §3 (format), §4.x (Feuille).

## Tasks & Acceptance

**Execution:**
- [x] Audit AC1 à AC9 : existant, écarts (tableau dans les Implementation Notes).
- [x] Corrections d'accessibilité et de lexique ; retour du focus (code existant, désormais prouvé par un test).
- [x] Table FR-03-13 avec ses tests.
- [x] Contrôles AC7 (texte agrandi) possibles sous Jest.
- [x] Recette consolidée de la Feuille ; R-3.8-01 à 03, plus R-3.8-04 à 06 pour les états sans frame.
- [x] Tests `PRE4-3.8/AC1` à `AC7` ; AC8 (document) et AC9 (preuves existantes) par citation ; READMEs.

**Acceptance Criteria:**
- Given la story 3.8 et Q44, when elle est livrée, then chacun de ses critères AC1 à AC9 (parties Cellule active et Pied commun sans objet) est vérifié par un test nommé ou rattaché à un test existant cité ; `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Implementation Notes

Base : `936c03e5`. Fichiers de tests : `ExecutionParametersSheet.test.tsx` (S), `sheetSurface.test.ts` (R), `ActivityEditorForm.test.tsx` (E), `AnchoredPanel.test.tsx` (P), `ExecutionParametersDraft.test.ts` (D), `ProfileStepper.test.tsx` (PS). Les tests sont cités par leur identifiant de tête, dans le fichier indiqué.

### Audit AC1 à AC9

| AC | Exigence | Existant (avant 3.8) | Écart | Suite donnée |
|---|---|---|---|---|
| AC1 | Focus confiné | Feuille `Modal` + `accessibilityViewIsModal` : S `P3-21/accessible-controls`, S `PRE4-3.3/AC1` ; panneaux modaux : P `PRE4-Q41 — VoiceOver`, S `ACCESSIBILITY/wheel` ; champ ± : S `PRE4-3.3/AC8 — VoiceOver` | — | cité ; S `PRE4-3.8/AC1` le reprend avec les clés du lexique |
| AC1 | ✕ et ✓ libellés | S `P3-21/accessible-controls`, S `ACCESSIBILITY/sheet-check-cross` | — | cité |
| AC1 | Focus rendu à la Carte | Code présent (`ActivityEditorForm.closeSheet` : `setAccessibilityFocus`), **aucun test** | preuve manquante | E `PRE4-3.8/AC1` (✕, retour système, ✓) ; effet réel en R-3.8-01 |
| AC1 | Régime `variables` annoncé | S `ACCESSIBILITY/regime` (texte visible, N = 1 annoncé) | libellé `variables` non vérifié | S `PRE4-3.8/AC1` |
| AC2 | Lecture seule : valeur et origine, jamais un tiret | Durée totale : S `PRE4-3.7/AC7` ; Régime à N = 1 « sans effet pour une seule série » : S `P3-21` | **une valeur `—` (Mode, Côté, Cible commune, cellule) était annoncée « — »** (lu « tiret ») | `unsetSpoken` « aucune valeur » ; S `PRE4-3.8/AC2 — valeur « — »…` ; S `PRE4-3.3/AC9` adapté |
| AC2 | Cellule active | — | sans objet (Q44) | cellule de Cible : S `PRE4-3.6/AC13` (×2 : ligne et colonne « Série 2, Durée », seulement les ± disponibles, « activer ») |
| AC2 | `Bip de cadence` : nom, `Aucun` ou intervalle, actions | S `ACCESSIBILITY/stepper`, S `PRE4-3.3/AC8 — ± à l'appui` (« Bip de cadence, 2 s ») | **limites non annoncées** (le réglage ajustable ne disait rien à la borne) | `InlineStepper` : « minimum atteint » / « maximum atteint » dans la valeur annoncée ; S `PRE4-3.8/AC2 — Bip…`, S `PRE4-3.8/AC2 — limites des cellules…` |
| AC2 | Monter, Descendre, poignée | S `ACCESSIBILITY/sortable-rows`, S `P3-07/move-accessible`, S `PRE4-3.6/AC8` | — | cité |
| AC3 | `≈`, `≥`, non modifiable | S `PRE4-3.7/AC7` | — | cité |
| AC3 | Option échec sélectionnée ou non | Répétitions : S `PRE4-3.5/AC8` (`selected` faux puis vrai) ; Durée : S `PRE4-3.4/AC3`, S `PRE4-3.6/AC13` (vrai seulement) | état « non sélectionnée » non vérifié en Durée | S `PRE4-3.8/AC3 — option échec…` |
| AC3 | Cible à l'échec annoncée ; grisé jamais seul | S `PRE4-1.1/AC22 — une Cible à l’échec est nommée…`, S `PRE4-3.5/AC7`, S `PRE4-3.6/AC13` | — | cité ; S `PRE4-3.8/AC3` (ligne commune) |
| AC3 | Valeur et unité dans le Sélecteur | S `PRE4-3.5/AC7` (« 12 répétitions »), S `PRE4-3.6/AC3 — roue Durée d'une ligne…` | colonnes de la roue commune non vérifiées | S `PRE4-3.8/AC3 — valeur et unité…` (« Minutes », « Secondes ») |
| AC3 | Directions en toutes lettres | S `PRE4-3.3/AC4`, S `D-341` (Android) | — | cité |
| AC4 | Lexique, `’`, glossaire, aucun texte en dur | clés de `strings` partout ; aucun test d'ensemble | test absent | S `PRE4-3.8/AC4` (×2 : annonces rendues dans quatre états avec surfaces ouvertes ; sources et lexique) ; liste ci-dessous |
| AC5 | Roue ou panneau ouvert : ✓ / ✕ de la Feuille inertes | T10 (autre ligne) : R `PRE4-3.3/AC8 — T10`, S `PRE4-3.3/AC7 — une seule surface` ; croix : S `PRE4-3.6/AC9` (iOS et Android) ; toucher extérieur sans appliquer : S `PRE4-3.4/AC8`, S `PRE4-3.6/AC3 — toucher hors du panneau`, S `PRE4-3.7/AC4` | **✓ et ✕ de la Feuille (et le retour système) agissaient avec un panneau ou une roue ouvert** : ✓ validait la Feuille (sans la valeur en cours), ✕ l'abandonnait ; l'en-tête est hors de la zone extérieure et, pour VoiceOver, n'est pas un voisin du panneau modal | `sheetCommandsAbsorbed` (réducteur) : l'appui ferme la surface sans appliquer ; champ ± ouvert et cadre D-4 non absorbés (T19) ; R `PRE4-3.8/AC5`, S `PRE4-3.8/AC5` (×4, dont ✓ grisé avec surface ouverte), E `PRE4-3.8/AC5` (Feuille montée, focus non déplacé) |
| AC5 | `Terminer` et l'Éditeur inertes | La Feuille est une `Modal` plein écran sur l'Éditeur : S `PRE4-3.3/AC1`, E `P3-21/accessible-controls` | non simulable sous Jest | R-3.8-02 |
| AC6 | Table FR-03-13 | voir la table ci-dessous | absences non vérifiées d'un seul tenant | S `PRE4-3.8/AC6` |
| AC7 | Ni `maxFontSizeMultiplier` ni `allowFontScaling` à faux | aucun dans la Feuille ni ses composants (relevé du source) ; en-tête : S `T-61` ; lignes : S `PRE4-Q42` | pas de test d'ensemble | S `PRE4-3.8/AC7 — texte agrandi…` (aucun plafond, aucune coupe, panneaux et tableau compris) |
| AC7 | Aucune hauteur fixe qui rogne | lignes et en-tête en hauteur minimale | **la ligne du tableau a une hauteur fixe de 44** (`tableRow`, dont dépend `dragDestination`) | non corrigé (glisser PRE-3 accepté, 44 pt réservés à Hermann) ; S `PRE4-3.8/AC7 — hauteurs…` fige cette exception, et, roue ouverte, celle de l'option « Aucune durée, à l’échec » (hauteur 30, story 3.4 ; constat 6) ; constats à juger en R-3.8-03 |
| AC8 | Recette consolidée | R-3.1-00 à R-3.7-04 au §4.3 | index de couverture, états sans frame, VoiceOver et texte agrandi d'ensemble absents ; R-3.1-02 et R-3.1-03 décrivaient la couche Q37 | §4.3 : sous-section « Story 3.8 », index, R-3.8-01 à 06 (Résultat vide) ; annotations « Consolidation 3.8 » sur R-3.1-02, R-3.1-03 et la liste « Prévu mais pas encore implémenté » du §5 ; écarts E-01 à E-16 et constats de Hermann inchangés |
| AC9 | Preuves Q39 à Q41 | S : 4 tests `PRE4-Q39…`, 4 tests `PRE4-Q40…`, 11 tests `PRE4-Q41…` ; P : 5 tests `PRE4-Q41…` ; S `PRE4-Q39 / Q40 / Q41 — ClosingSelector appelle toujours onClosed…` | — | tous présents et verts ; rien ajouté |

Garde-fous zéro `ScrollView` (`DurationWheelPicker.test.tsx` « REWORK06 — actually uses the native SwiftUI Picker primitive on iOS, never a ScrollView fallback » et « R-1/native-delegation — … », `NumberWheelPicker.test.tsx` « actually uses the native SwiftUI Picker primitive on iOS, never a ScrollView fallback… ») : intacts et verts. `migration001.ts`, `tokens.ts` : intouchés.

### Ce qui a été changé

- `sheetSurface.ts` : `sheetCommandsAbsorbed(state)`, lecture seule (vrai pour un `popover` ou un `selector` ouvert, hors cadre D-4).
- `ExecutionParametersSheet.tsx` : `handleValidate`, `handleCancel` (✕ de la Feuille et `onRequestClose` de la `Modal`) passent d'abord par `absorbSheetCommand` ; `spokenValue` (« — » annoncé `unsetSpoken`) pour les pastilles de Mode, de Changement de côté, de Cible commune (Durée, Répétitions), les champs ± fermés et les cellules de Cible.
- `ProfileStepper.tsx` (`InlineStepper`, accepté, mécanisme inchangé) : props optionnelles `spokenValue` et `announceLimits` ; sur opt-in, valeur annoncée d'un nombre dans les bornes et à une borne suivie de « minimum atteint » et/ou « maximum atteint » (clés existantes `screens.profile.stepper`). Seule la Feuille utilise `InlineStepper` et passe l'opt-in (champs ± ouverts, cellules de Cible et de Pause) ; tests PS `PRE4-3.8/AC2` (×3).
- ✓ de la Feuille : `disabled` et `accessibilityState.disabled` valent `!validation.ok && !sheetCommandsAbsorbed(surface)` ; S `PRE4-3.8/AC5 — ✓ grisé…`, E `PRE4-3.8/AC5` (Feuille montée, focus non déplacé).
- Lexique : `executionParameters.sheet.unsetSpoken` (« aucune valeur »).
- READMEs `src/features/activities`, `src/shared/ui`.

### Table FR-03-13 → tests

| Règle PRE-3 maintenue (FR-03-13) | Exigence PRE-4 | Tests |
|---|---|---|
| Ouvrir copie le Brouillon parent ; ✕ ou retour annule toute l'ouverture ; ✓ applique atomiquement ; seul `Terminer` enregistre | FR-03-01, FR-11-01, FR-18-17 | S `INTERACTION/sheet-check-cross`, S `PRE4-3.3/AC7 — appui extérieur sur le popover du Mode…` ; D `✕ : le parent reste octet-équivalent`, D `PRE4-3.2/AC11` (×2) ; E `P3-21/accessible-controls`, E `INTERACTION/parameter-card` ; `ExerciseEditorNoWrite.integration.test.tsx` `PRE4-1.3/AC11` (×4) |
| Activer `variables` copie la Cible et la Pause uniformes ; revenir en `identiques` reprend la première ligne ; réactiver avant ✓ restaure le tableau | FR-04-03, FR-04-04 | S `INTERACTION/regime (ex-interrupteur)`, S `A-01` ; D `PRE4-3.2/AC5` |
| Diminuer N retire les dernières lignes ; remonter N avant ✓ les restaure dans leur ordre, puis copie la dernière ligne | FR-12-01, FR-12-02 | D `N 4→2→5 : A/B actives, C/D restaurées dans l'ordre, cinquième clone de D`, D `PRE4-3.2/AC7` ; S `PRE4-3.3/AC8 — T22…`, S `PRE4-3.6/AC2 (partie maintenue par Q44) — S4…` |
| Déplacer une ligne déplace ses paramètres, renumérote, recalcule la dernière Pause ; ✕ annule les déplacements | FR-12-03 | S `P3-07/move-accessible`, S `INTERACTION/sortable-rows`, S `PRE4-3.6/AC8` ; D `PRE4-3.2/AC8` |
| Changer de Mode conserve N, Pauses et Bip ; Cibles incompatibles non renseignées, jamais zéro ; retour avant ✓ restaure | FR-11-03, FR-11-04 | D `N, pauses et bip conservés ; cibles incompatibles « — » ; retour restaure pendant l'ouverture`, D `PRE4-3.2/AC3`, D `PRE4-3.2/AC4` ; S `F-02 — séries variables modifiées puis Durée → Répétitions → Durée…`, S `REV-01`, S `P3-11/all-modes-bip` |
| N = 1 normalise immédiatement, calculs compris ; contrôles sans effet atténués (Ordre masqué, Q38) | FR-12-04 | S `P3-08/immediate-N1`, S `PRE4-Q38` (×6), S `PRE4-3.3/AC6 — N = 1…` ; D `PRE4-3.2/AC9`, D `réduire à N1…` |
| Replier le tableau ne change ni données ni validité | FR-04-02, FR-03-03 | S `PRE4-3.3/AC6 — chevron…`, S `P3-16/fold-incomplete`, S `PRE4-3.6/AC7` |
| Bip au premier niveau juste avant le total applicable ; total absent → avant Compte à rebours ; voile `#1F2129` à 34 % | FR-03-02, FR-03-01 | S `P3-20/sheet-specific` (×2), S `PRE4-3.3/AC2` (×2), S `PRE4-3.7/AC2` |
| Phrase Inter 13, interligne 20, valeurs Semi Bold, texte long intégral | FR-02-06, FR-16-11 | E `P3-20/all-surfaces`, E `P3-15/long-phrase`, E `PRE4-2.3/AC15` (Carte de l'Éditeur ; la Feuille n'affiche pas la Phrase) |
| En-tête accessible, corps défilant, Safe Areas, clavier, texte agrandi | FR-03-02, FR-22-05, FR-22-06 | S `T-61`, S `PRE4-3.3/AC1`, S `P3-19/exclusive-scroll`, S `PRE4-3.8/AC7` (×2) ; largeurs et ≈ 200 % : R-3.8-03 |
| Appui au pas 1, maintien après ≈ 500 ms, accélération 1/5/10, Bip / Compte à rebours / Fin au pas 1, arrêt au relâchement | FR-03-05, FR-09-04 | S `P3-19/hold`, S `P3-19/non-accelerated`, S `INTERACTION/stepper`, S `PRE4-3.6/AC6` ; PS (maintien, `createHoldRepeater`) |
| Réutiliser les composants et jetons existants | NFR-03, FR-02-13 | `tokensSpecification.test.ts` ; S `PRE4-3.3/AC11 — iOS : aucune Modal ni aucun Pressable de substitution…` ; garde-fous zéro `ScrollView` ; P `PRE4-Q41 — ni Modal, ni Popover…` |

Règles **supersédées**, absentes de l'interface :

| Règle PRE-3 supersédée | Preuve d'absence |
|---|---|
| Steppers « en place » et permanents | Hors tableau (N, Pauses, Bip, Compte à rebours, Fin, Cible commune) : S `PRE4-3.3/AC8 — ± à l'appui…`, S `PRE4-3.5/AC2`, S `PRE4-3.8/AC6`. **Ajustement Q44** : les ± permanents des cellules du tableau sont rétablis (S `PRE4-3.6/AC4`, S `PRE4-3.8/AC6`) ; la supersession ne vaut donc plus que pour la Cible commune et les champs hors tableau |
| Message identifiant la Série incomplète | S `P3-16/fold-incomplete`, S `PRE4-3.3/AC10`, S `PRE4-3.6/AC7`, S `PRE4-3.8/AC6` |
| Mode à trois valeurs ; Bip « dans les trois modes » | S `PRE4-1.1/AC22 — le segmenté du Mode propose exactement Durée puis Répétitions…`, S `PRE4-3.1/AC6`, S `PRE4-3.3/AC3` |
| Cible Durée 1..5999 s | `ExecutionParameters.test.ts` `Cible Durée : entiers de 5 à 3535, à la seconde (Q36)` ; S `PRE4-1.1/AC24 — valeur hors bornes (4 s)…` ; S `PRE4-3.4/AC4` |
| Retraits x52 du tableau | S `PRE4-3.6/AC1 — structure…`, S `PRE4-3.8/AC6` |
| Segmentés intégrés | iOS : S `PRE4-3.3/AC11 — iOS…`, S `PRE4-3.3/AC4`, S `PRE4-3.8/AC6` ; le segmenté en ligne ne reste que comme repli Android et web (AD-7, S `PRE4-3.3/AC11 — Android…`) |
| Présentations D-339 et D-341 | Présentation en ligne remplacée sur iOS (mêmes tests) ; le **comportement** D-4 (valeur appliquée, visible 350 ms, puis repli) est conservé par Q40 et 3.8 AC9 (S `D-4 / Q39 / Q40`, S `PRE4-Q39 / Q40 / Q41 — ClosingSelector…`) ; D-341 n'est plus vérifiée que sur le repli Android (S `D-341`). Voir Spec Change Log (b) |

### Textes d'annonce de la Feuille (H23 — à valider par Hermann)

Tous viennent de `src/shared/i18n/index.ts` (`strings.executionParameters.sheet`, sauf mention). `{n}` = numéro de Série ; `{v}` = valeur affichée.

- En-tête : ✕ « Annuler les paramètres » ; ✓ « Valider les paramètres », ou « Valider les paramètres, indisponible tant qu’une valeur est invalide » ; titre « Paramètres d’exécution » (en-tête).
- Mode : « Mode d’exécution, Durée » / « …, Répétitions » / « …, aucune valeur » (nouveau, 3.8) ; options du popover « Durée », « Répétitions ».
- Séries : champ de Régime « Régime des séries, identiques » / « …, variables » ; à N = 1 « Régime des séries, identiques, sans effet pour une seule série » ; options « identiques, toutes les séries ont la même valeur », « variables, chaque série a sa propre valeur » ; chevron « Masquer le tableau des séries » / « Afficher le tableau des séries » ; nombre « Séries, 3 séries ».
- Champs ± (fermés) : « Séries, {v} », « Pause après chaque série, {v} », « Pause entre les côtés, {v} », « Bip de cadence, Aucun » ou « Bip de cadence, 4 s », « Compte à rebours, {v} », « Fin d’exercice, {v} ». Ouverts : réglage ajustable « Séries », « Pause après chaque série, secondes », « Pause entre les côtés, secondes », « Bip de cadence, secondes », « Compte à rebours, secondes », « Fin d’exercice, secondes » ; valeur « {v} », suivie à la borne de « minimum atteint » ou « maximum atteint » (nouveau, 3.8 ; clés `screens.profile.stepper`) ; action « Fermer ».
- Cible commune : « Durée d’une série, {v} » / « Nombre de répétitions, {v} », où {v} vaut aussi « à l’échec » ou « aucune valeur » ; indice « Valeur à renseigner » ou « Valeur non admise ».
- Sélecteur Durée : option « Aucune durée, à l’échec » (état sélectionné natif) ; colonnes « Minutes », « Secondes » (`screens.exercise.wheelPicker`), préfixées « Série {n}, Durée » pour une cellule ; ✕ « Annuler », ✓ « Valider ».
- Sélecteur Répétitions : ligne de tête « Aucune répétition, à l’échec » ; nombres « 1 répétition », « {n} répétitions » ; libellé de la roue « Nombre de répétitions » ou « Série {n}, Répétitions ».
- Côtés : « Changement de côté, Sans changement » / « …, Droite puis gauche » / « …, Gauche puis droite » / « …, aucune valeur » ; options « Sans changement », « Droite puis gauche », « Gauche puis droite » ; « Ordre des côtés, Un côté après l’autre » / « …, Les deux côtés à chaque série » ; options « Un côté après l’autre (D1 → D2) → (G1 → G2) », « Les deux côtés à chaque série (D1 → G1) → (D2 → G2) ».
- Durée totale : modifiable « Durée totale, ajuster le nombre de séries, {montant} » ; lecture seule « Durée totale, estimation, {montant}, non modifiable », « Durée totale, total prévisionnel partiel, {montant}, non modifiable », « Durée totale, {montant}, non modifiable » ; invalide « Durée totale[, nature], montant indisponible tant qu’une valeur est invalide ».
- Tableau : cellule « Série {n}, Durée » / « Série {n}, Répétitions », valeur « {v} », « à l’échec » ou « aucune valeur », avec les limites ; « Série {n}, pause » ; numéro « Série {n} » ; poignée « Déplacer la série {n} », actions « Monter la série {n} », « Descendre la série {n} » ; croix « Supprimer la série {n} », indice « Ferme d’abord le champ ouvert, sans supprimer la série » ; message « Série supprimée », action « Annuler ».
- Inversion : « Durée ajustée à {durée} pour respecter un nombre entier de séries. », action « Annuler » (`screens.exercise.adjustedTotalDurationUndoAction`).

Points de ces textes à trancher par Hermann (Q47) : « aucune valeur » (nouveau) ; « minimum atteint » / « maximum atteint » (repris du Profil), en particulier le Bip à 0 annoncé « Aucun, minimum atteint » ; les sous-titres d'Ordre lus avec leurs flèches (« D1 → D2 ») ; « Séries » sans unité pour le réglage du nombre ; les ± internes de `InlineStepper` (« Diminuer — minimum atteint ») ne sont pas atteints par VoiceOver (réglage ajustable).

### Constats à soumettre à Hermann (non corrigés, NFR-04)

1. **Ligne du tableau à hauteur fixe** (`TABLE_ROW_HEIGHT` = 44, exigé par la géométrie du glisser PRE-3) : avec un texte à ≈ 200 %, une valeur pourrait dépasser la ligne. Modifier cette hauteur toucherait au glisser accepté et aux 44 pt de Q42 : à juger en R-3.8-03.
2. **Champs ± de largeur fixe** (137 hors tableau, 128 dans le tableau) : valeurs longues agrandies (« 1 min 30 s », « 99 séries ») à observer en R-3.8-03.
3. **Croix rognée à 375 pt** (R-3.6-01) : à 360 pt, plus marqué ; consigné en R-3.8-03, non corrigé.
4. **Retour du focus** : `setAccessibilityFocus` est appelé pendant que la `Modal` en fondu se démonte ; s'il échoue sur iPhone, le constater en R-3.8-01 (aucun délai inventé sans preuve).
5. **Legacy Répétitions** (Android et web, hors recette Q5) : la ligne de tête garde `numberOfLines={1}` (story 3.5) ; elle n'est pas rendue sur iOS.
6. **Option « Aucune durée, à l’échec » à hauteur fixe** (30, story 3.4, `DurationWheelPicker`) : avec un texte agrandi, son libellé (Regular 20) peut être rogné. Non modifiée (contrôle accepté de la roue) ; figée comme exception dans S `PRE4-3.8/AC7 — hauteurs…` ; à juger en R-3.8-03.

## Spec Change Log

- 2026-10-18 — (a) **AC5 contre l'annotation Q41 d'AD-15.** La spine (AD-15, puce « Présentation remplacée par Q41 ») dit : « L'en-tête de la Feuille reste hors de la zone de toucher extérieur : ✓ de la Feuille applique le Brouillon sans la valeur en cours dans le panneau, ✕ de la Feuille annule tout (T19, constat de recette) ». La section frozen de 3.8 (AC5), FR-22-11, T10 et T19 disent au contraire que ni ✓ ni ✕ de la Feuille ne se déclenchent avec une surface ouverte. Lecture retenue : la section frozen (plus récente, approuvée), appliquée par `sheetCommandsAbsorbed` ; le retour système (Android) suit la même règle. La spine est à aligner (signalé, non modifié). *Corrigé : la spine (annotation Q41 d'AD-15) et le PRD (précision FR-03-13 / D-339, voir (b)) ont été alignés par Claude le 2026-10-18 ; le changement ✓ / ✕ et les nouveaux textes sont soumis à Hermann en Q47 (`questions-ouvertes.md`).*
- 2026-10-18 — (b) **D-339 « supersédée » (FR-03-13) contre « comportement D-4 conservé » (AC9).** Lecture retenue : la présentation (segmenté intégré) est supersédée sur iOS ; le cadre D-4 (valeur appliquée, visible, puis repli) reste, à 350 ms (Q40).
- 2026-10-18 — (c) **« Jamais un tiret »** (AC2 : valeurs en lecture seule) étendu aux valeurs modifiables non renseignées, au titre d'AC4 (vocabulaire) : un « — » lu à voix haute n'est pas une annonce. Texte « aucune valeur » choisi par Claude (neutre en genre), à valider par Hermann (H23).
- 2026-10-18 — (d) **« Limites annoncées »** (AC2, ch. 13 §18) : appliqué à tous les champs ± de la Feuille (`InlineStepper`, seul utilisé par elle), pas seulement au Bip ; annonce à la borne seulement, par les clés existantes du Profil.
- 2026-10-18 — (e) **AC8** : R-3.8-04 à 06 ajoutés pour les trois états sans frame, en plus de R-3.8-01 à 03 nommés par la story.
- 2026-10-18 — (f) **Correctifs de revue.** ✓ grisé (Brouillon invalide) avec une surface ouverte : l'appui est reçu et ferme la surface (`validateDisabled = !validation.ok && !sheetCommandsAbsorbed`), état d'accessibilité aligné sur l'activabilité, libellé « indisponible… » et rendu grisé conservés. Suffixe de limite : opt-in explicite `announceLimits` (la Feuille seule ; aucun autre usage d'`InlineStepper` dans le code, `ProfileStepper` du Profil inchangé), seulement pour une valeur dans les bornes, les deux suffixes si min = max ; une ancienne valeur hors bornes (4 s, 5999 s) n'en reçoit aucun. « — » : `spokenValue` aussi sur les cellules de Pause et les champs ± ouverts. AC4 : lexique parcouru étendu à `screens.exercise.wheelPicker` et `adjustedTotalDurationUndoAction` ; recherche de texte en dur étendue aux valeurs annoncées, aux libellés d'actions et aux gabarits. AC6 : chaque contrôle d'absence a son contrôle positif ; `marginStart` / `paddingStart` vérifiés. AC7 : tous les panneaux et roues ouverts ; contrôle des hauteurs avec un panneau et une roue ouverts — il révèle une seconde hauteur fixe (constat 6). Recette : R-3.8-02 réécrit (états de départ, étape 4 scindée, ✓ grisé), R-3.8-03 avec 375 pt, index complété.

## Review Triage Log

Revue du 2026-10-18 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V). Correctifs appliqués par l'implémenteur ; Q47 ouverte, spine et PRD alignés par Claude.

| Constat | Verdict | Route |
|---|---|---|
| B1 — journal de la spec contraire aux modifications de la spine et du PRD | low | patch (Spec Change Log corrigé) |
| B2 — comportement ✓ / ✕ inversé sans question ouverte ; « aucune valeur » non soumis | medium | patch (Q47, à trancher par Hermann) |
| B3 — R-3.8-02 contradictoire à l'étape 4 | low | patch (états A, B, C ; étape 4 scindée) |
| B4/E1 — ✓ grisé : l'appui ne ferme pas la surface ouverte | medium | patch |
| B5/V1 — « — » encore annonçable (Pauses, champs ouverts, Cible Répétitions vide) | medium | patch |
| B6/E4 — test AC4 aveugle (gabarits, `accessibilityValue`, actions, clés hors Feuille) | low | patch |
| B7 — test AC7 n'ouvre pas ce que son titre annonce | low | patch (7 panneaux et roues ; constat 6 : option échec à hauteur fixe, R-3.8-03) |
| B8 — contrôles d'absence AC6 sans contrôle positif | low | patch |
| B9 — minuteries simulées non restaurées | low | patch |
| B10 — appui absorbé et focus non testés | low | patch |
| B11 — `InlineStepper` partagé : annonce de limite hors Feuille possible | low | patch (opt-in `announceLimits`) |
| B12 — Bip « Aucun, minimum atteint » | low | patch (cité dans Q47) |
| B13 — statut de la spec et résultats de vérification | low | patch (clôture) |
| B14 — index de recette incomplet (375 pt, limites hors Bip, Inversion) | low | patch |
| E2/E3 — limite annoncée pour une valeur hors bornes ; double limite | medium | patch |


## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
