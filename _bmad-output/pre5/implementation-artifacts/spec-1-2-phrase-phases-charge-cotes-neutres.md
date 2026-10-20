---
title: 'Story 1.2 — Phrase avec phases et charge, côtés neutres (indicateur de la Composition différé)'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: '448a563b83701c40a576398b8b0e257abd6b68d0'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre5/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre5/planning-artifacts/architecture/architecture-kodjo-pre5-2026-10-19/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La Phrase de synthèse ignore les phases et la charge que porte le modèle v3 (1.1) et désigne les côtés par « droit / gauche », contrairement à D-407.

**Approach:** Story 1.2 de `epics.md`, AC1 à AC5 et AC7 (qui font foi dans le détail) : `workPhasesClause` et `loadClause` insérées en un point unique après la valeur par série, ordre `VALUE_SUFFIX_ORDER` = phases puis charge (AD-29) ; clause des côtés neutre selon ch. 10 l. 515 ; corpus étendu en fixtures littérales. L'AC6 (indicateur de la Composition) est différé : Figma n'en a aucune variante neutre (voir `deferred-work.md`).

**Décision tirée des sources (QP5-09, spécification des phases §4.1) :** la grammaire existante est conservée (« Conserver la grammaire existante… Le libellé « pause après chaque série » est conservé ») ; l'exemple « **3 séries de 9 s** (…), avec une pause après chaque série de **15 s**. » n'est pas reproduit à la lettre. Seule la parenthèse est ajoutée : « **3 séries** de **9 s** (Descente : **6 s** - Maintien : **3 s**), avec **15 s** de pause après chaque série. ».

## Boundaries & Constraints

**Always:** `generateExecutionPhrase` seul générateur, segments `{texte, gras}` ; phrases sans phases, sans charge et unilatérales identiques à l'oracle ; `phrases-276.json` et `attendus-phrases-276.json` non modifiés ; nombres de charge par le module `exerciseLoad.ts` ; charge non grasse (D-414, exemple de l'AC3), durées des phases en gras ; la charge suit les règles du zéro de `normalizeLoad` (toutes nulles → aucune mention) ; « Durée totale » inchangée ; commentaires en français ; fins de ligne CRLF de la copie de travail conservées.

**Never:** modification de `executionCalculations.ts`, `tokens.ts`, `CompositionScreen.tsx`, `fr.ts`, des fichiers de la Feuille ; lecture de la direction dans la Phrase ; seconde fonction de génération ; persistance de la Phrase.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Phases | Durée, 3 × [Descente 6, Maintien 3], Pause 15 | « **3 séries** de **9 s** (Descente : **6 s** - Maintien : **3 s**), avec **15 s** de pause après chaque série. Durée totale : … » | — |
| Une phase | [Gainage 30] | « … de **30 s** (Gainage : **30 s**) … » | — |
| Charge commune | identiques, 20 kg | « … de **12 répétitions** (charge : 20 kg) cadencées … » | — |
| Charges ≤ 3 / > 3 | [20, 12, 13] / [20, 12, 13, 8] | « (charges : 20, 12, 13 kg) » / « (charges : 20, 12 kg, ...) » | — |
| Zéro, égales | [0, 10, 15] / [20, 20, 20] | « (charges : 0, 10, 15 kg) » / « (charges : 20, 20, 20 kg) » | — |
| Décimales | 2,5 kg | « (charge : 2,5 kg) » | — |
| Sans / tout à 0 | `loadEnabled:false` (valeurs conservées) ou toutes 0 | aucune mention | — |
| À l'échec | 3 séries, charge 20 | « **3 séries** menées jusqu’à l’échec (charge : 20 kg), … » | — |
| Côtés, N = 1 | `RIGHT_LEFT` ou `LEFT_RIGHT` | « , en faisant le côté 1 puis le **côté 2** » | — |
| Côtés, paires | `BY_SERIES` | « , en alternant le côté 1 puis le **côté 2** à chaque série » | — |
| Côtés, par côté | `BY_SIDE` | « , en faisant d’abord toutes les séries du **côté 1**, puis du **côté 2** » | — |

</frozen-after-approval>

## Code Map

- `src/domain/activities/executionPhrase.ts` -- générateur ; groupe Contenu (l. 125-180) : insérer le suffixe juste avant chaque clause de cadence et en fin de branche ; bloc Côtés (l. 190-212) à neutraliser sans lire `RIGHT_LEFT`.
- `src/domain/activities/exerciseLoad.ts` -- `formatLoadKg` (« 20 kg ») et `normalizeLoad` ; ajouter le formateur du nombre seul, dont `formatLoadKg` dérive (un seul module de format).
- `src/domain/activities/ExecutionParameters.ts` -- `normalizeEffective`, `seriesRowsOf`, `UniformSeries.workPhases` (lecture seule ; pas de changement).
- `src/domain/activities/__tests__/executionPhrase.test.ts` -- corpus (l. 160-214) : comparer les 216 cas bilatéraux à une fixture neutre, les 60 autres à l'oracle ; ajouter les cas PRE-5 ; les textes anatomiques littéraux (l. 294-790) deviennent neutres.
- `src/domain/activities/__tests__/fixtures/phrase-variants.json` -- attendus bilatéraux à neutraliser.
- `src/features/activities/__tests__/ActivityEditorForm.test.tsx`, `src/features/reference-data/__tests__/bodyZones.test.ts` -- attendus de Phrase anatomiques éventuels à neutraliser (vérifier : `bodyZones` peut concerner des Zones, pas la Phrase).
- `src/features/sessions/compositionPresentation.ts` -- déjà neutre (« par côté ») ; non touché.

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/activities/exerciseLoad.ts` -- `formatLoadValue(kg)` (nombre au séparateur français), `formatLoadKg` le réutilise -- AC1.
- [x] `src/domain/activities/executionPhrase.ts` -- `workPhasesClause`, `loadClause` exportées (segments), `VALUE_SUFFIX_ORDER`, point d'insertion unique ; clause des côtés neutre -- AC1 à AC4.
- [x] `src/domain/activities/__tests__/fixtures/phrases-276-cotes-neutres.json` (nouveau) -- 216 attendus neutres littéraux (texte et segments) -- AC5.
- [x] `src/domain/activities/__tests__/fixtures/phrases-pre5.json` (nouveau) -- cas phases, charge et combinaisons, Δ48 -- AC5.
- [x] `executionPhrase.test.ts`, `phrase-variants.json`, tests de feature concernés -- attendus neutres ; tests unitaires des deux clauses et de la matrice -- AC5, AC7.

**Acceptance Criteria:**
- Given le corpus, when le test s'exécute, then les 60 cas unilatéraux égalent l'oracle (texte et segments) et les 216 bilatéraux égalent la fixture neutre, qui ne diffère de l'oracle que dans la clause des côtés (vérifié par le test).
- Given la story livrée, when on exécute `npm test`, `npx tsc --noEmit`, `npm run lint`, then les trois sont verts ; `executionCalculations.test.ts` et `ExecutionParametersDraft.test.ts` ne sont pas modifiés.

## Implementation Notes

- Checkpoint 1 (2026-10-19) : approbation pré-autorisée par Hermann (enchaînement sans approbation par story). AC6 différé (aucune variante neutre dans Figma : DSF `5544:6944` n'a que `D→G` / `G→D`, frame Composition `8328:28605` montre « D→G ») ; décision de rendu requise de Hermann.
- Implémentation (sous-agent) : `SegmentBuilder.append` ; la clause de cadence sort des branches Mélange et Répétitions et suit le suffixe (préfixe « , » conservé pour le mélange), corpus inchangé ; fixture neutre des 216 cas bilatéraux produite une fois par réécriture de l'oracle (vérifiée par un test de différence limitée à la clause des côtés) ; cas 144 : 226 caractères (oracle 224, « côté 1 / côté 2 »). Correctifs de revue : libellé rogné à l'affichage, unité par `formatLoadKg`, gardes de test. Contrôles finaux : `npm test` (120 suites, 3110 tests), `tsc`, `lint` verts.

## Spec Change Log

## Review Triage Log

Passe 1 (2026-10-19) — couches : Blind Hunter (B), Edge Case Hunter (E), Verification Gap (V : aucun écart).

| # | Constat | Verdict | Preuve / route |
|---|---|---|---|
| E1 | Phase à 0 s affichée « 0 s » | false | La Carte ne lit que les paramètres validés (`ActivityEditorForm.tsx:260`) ; `sheetDraftResult` normalise puis `validateForSave` refuse toute phase < 1 s. |
| E2 | Libellé de phase vide | false | Même chemin : `normalizeWorkPhases` pose le libellé par défaut, `validateForSave` refuse un libellé blanc. |
| E3 | Espaces extérieurs du libellé → doubles espaces | low | Libellé non rogné à l'enregistrement (`normalizeWorkPhases`), autocorrection iOS plausible. **patch** (`trim()` à l'affichage). |
| B3 / E4 | Phases affichées en Répétitions ou À l'échec | false | La Phrase ne reçoit que des paramètres validés ; l'invariant des phases (Durée, Cible `NUMBER`) est vérifié par `validateForSave` et `readV3`. |
| E5 | Charge 1e21 ou flottant imprécis | low | Charges validées multiples de 0,25 ; valeurs extrêmes hors usage (déjà rejeté en 1.1, B11). Rejeté. |
| E6 | « (charges : 0, 0 kg, ...) » masque les charges positives | false | Forme exigée par D-414 et D-423 : valeurs des séries dans leur ordre, zéros listés, aucune autre compaction. |
| B4 / E7 | Deux parenthèses consécutives | false | Exigé par AD-29 (« (Descente : **6 s** - Maintien : **3 s**) (charge : 20 kg) ») et par le point d'insertion de l'AC3 (fin de la liste variable). |
| E8 / B11 | Le côté de départ n'est plus lisible dans la Phrase | false | Retrait voulu par D-407, FR-18 et AC4 ; aucun module ne lit plus la direction. |
| B1 | Gras asymétrique de la clause des côtés | low | Choix de présentation consigné (Design Notes) et soumis à Hermann. Rejeté. |
| B2 | Unité « kg » écrite hors du formateur | low | Correction directe. **patch** (`formatLoadKg` pour la dernière valeur affichée). |
| B5 | Points de suspension ASCII | false | D-414 (ch. 07 l. 713) écrit « ... ». |
| B6 | Virgule décimale dans une liste à virgules (« 20, 22,5 kg ») | low | Forme imposée par D-414 et le séparateur français ; signalé à Hermann. Rejeté. |
| B7 | Aides du corpus supposant `RIGHT_LEFT` | low | Garde de test directe. **patch** (assertion). |
| B8 | Combinaisons supplémentaires non couvertes | low | Liste de l'AC5 couverte ; la clause des côtés suit le suffixe sans interaction. Rejeté. |
| B9 | `fromPre5` ignore des phases déclarées sur séries variables | low | Correction directe. **patch** (erreur levée). |
| B10 | Règle du total redondant recopiée dans le test | low | Concorde avec le générateur pour toutes les fixtures ; refonte du format de fixture. Rejeté. |
| B12 | Traçabilité aux AC impossible depuis le seul diff | false | La spec et `epics.md` portent les AC ; contrainte propre à la couche aveugle. |

## Design Notes

- Insertion : une fonction `appendValueSuffix(builder, parameters)` appelée une fois par branche du Contenu, juste après la valeur par série et avant toute cadence ; elle parcourt `VALUE_SUFFIX_ORDER`.
- Phases lues sur `series.workPhases` de l'état effectif (uniforme seulement) ; libellé tel quel, durée par `formatPhraseDuration`, séparateur « - ».
- Charge : `normalizeLoad(parameters)` puis, si active, valeurs effectives de `seriesRowsOf` ; uniforme → `(charge : X kg)` ; variables → liste (jamais compactée en commune).
- Gras des côtés neutres : la désignation qui remplaçait un mot gras (« gauche », « droite ») devient grasse ; choix de présentation signalé à Hermann.

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
