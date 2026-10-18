---
title: 'Story 2.3 — Phrase des paramètres pour les Cibles mixtes et corpus'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: '8d329c9315de0f7032c20b4c3d2da41beeeacd86'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-2.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Un Exercice à Cibles mixtes (valeurs numériques et « à l'échec ») n'a aucune Phrase des paramètres : le générateur rend `null` pour un mélange. L'adaptation des 92 anciens cas « À l'échec » du corpus reste minimale et implicite. Les variantes des cas nouveaux n'existent pas.

**Approach:** Implémenter la **story 2.3 (AC1 à AC15, `epics-parts/epic-2.md`)** en se limitant à l'écart restant (bilan approuvé du 2026-10-17) :
- dans le générateur existant `generateExecutionPhrase` et son `SegmentBuilder`, ajouter la branche « mélange » : énumération pour 3 Cibles ou moins, compaction au-delà, cadence et `≥` dans la clause Durée totale ;
- rendre explicite et nommée l'adaptation des 92 cas du corpus, avec leur rejeu en Durée ;
- ajouter le test d'identité oracle/encodage (P43) et le fichier de variantes.

Les gabarits tout numériques et tout à l'échec, déjà conformes, sont conservés.

## Boundaries & Constraints

**Always:**
- Réutiliser `generateExecutionPhrase`, `SegmentBuilder`, `enumerate`, `seriesLabel`, `repetitionsLabel`, `totalClauseAmount` et `formatPhraseDuration` (`durationFormat.ts`). Ne toucher aucune sortie des 276 cas : textes, segments et natures identiques.
- Gras (FR-16-02 : valeurs et unités en gras, texte grammatical normal ; H9) :
  - `jusqu’à l’échec` et `à l’échec` normaux ; `10 rép.` gras ; `≥`/`≈` dans le segment gras du montant ;
  - dans l'énumération d'un mélange en Répétitions, chaque valeur numérique est en gras (`10`, `12`) ; `de répétitions variables (` est normal, comme `de durée variable (` ;
  - l'énumération tout numérique existante (`de 12, 10 puis 8 répétitions`) garde le gras du corpus.
- Une Cible `UNSET` ou un Mode `null` donne toujours une Phrase `null`. Aucune Phrase n'est stockée nulle part.
- Les attendus des tests et des variantes sont écrits à la main ; les totaux sont calculés par formule dans le test, jamais par le générateur ni par `executionCalculations` (AD-10, FR-17-04).
- Les fichiers `docs/archives/evolutions-v15-2026-10-07/phrases-276.json` et `docs/preparation/PRE-3/planification/attendus-phrases-276.json` ne sont **jamais modifiés**. Le littéral `TO_FAILURE` n'apparaît dans le test qu'à l'adaptation nommée (garde `legacyModeConfinement.test.ts`).

**Never:**
- Aucune énumération des Pauses variables (P1, D-338), même si Figma les énumère. Aucune nouvelle forme pour plus de 3 Cibles numériques toutes égales (H17).
- Aucune modification visuelle de la Carte, du bouton de Mode ni du libellé accessible (4.2). Aucun `numberOfLines` ni `maxFontSizeMultiplier` ajouté. La Phrase n'apparaît sur aucune carte consommatrice.
- Aucun format For time, Tabata ou EMOM, aucune autre langue.

</frozen-after-approval>

## Code Map

- `src/domain/activities/executionPhrase.ts` :
  - l.85-115 : en-tête et retour `null` d'un mélange, à remplacer par la branche mélange ; `allTargetsFailure` existe ;
  - bloc Contenu l.117-158 : Durée et Répétitions, en identiques ou en variables, avec énumération ou compaction ;
  - cadence l.155-158 : à appliquer aussi aux mélanges en Répétitions avec Bip > 0, mais jamais au tout échec ;
  - Pause l.160-168 ; côtés l.170-195 ; clause Durée totale l.197-205 (`totalClauseAmount` gère déjà `≥`).
  - La compaction d'un mélange de plus de 3 Cibles prend le **minimum des Cibles `NUMBER`**, formaté en Durée par `formatPhraseDuration`, en Répétitions par `{min} rép.`.
- `src/domain/activities/__tests__/executionPhrase.test.ts` :
  - l.53-90 : `toTarget`/`toInput`, adaptation minimale de la story 1.1, à remplacer par une adaptation explicite et nommée, avec un rejeu en Durée (AC13) ;
  - distribution 140/46/90 testée l.~93 ;
  - tests du cas 144 et des cas aux limites, à conserver.
- Nouveau `src/domain/activities/__tests__/fixtures/` : fichier de variantes, en JSON ou en TS, avec les attendus littéraux de l'AC14.
- `src/domain/activities/__tests__/legacyModeConfinement.test.ts` : liste d'autorisation du littéral, à adapter si l'emplacement change.
- `src/features/activities/ActivityEditorForm.tsx:~194-195, ~330-342` : rendu de la Phrase dans un seul flux de texte. AC15 se prouve par un test de rendu : texte complet du cas 144, aucun `numberOfLines`. Aucune modification attendue.
- Instantané v1 pour l'AC14 : `exerciseSnapshot.ts` et `readV1.ts` (story 1.3).

## Tasks & Acceptance

**Execution:**
- [ ] `executionPhrase.ts` -- branche mélange, AC8 et AC9 ; cadence des mélanges, AC4 ; en-tête mis à jour.
- [ ] `executionPhrase.test.ts` -- tests `PRE4-2.3/AC1` à `AC13` :
  - adaptation nommée et rejeu en Durée des 92 cas ;
  - test d'identité oracle/encodage (P43) ;
  - aucune clause ajoutée aux 120 cas en Régime variables ;
  - `0 s` jamais présent (AC11).
- [ ] `src/domain/activities/__tests__/fixtures/` et son test -- `PRE4-2.3/AC14`, liste complète de l'AC14.
- [ ] test de rendu de la Carte -- `PRE4-2.3/AC15`, dans le fichier de test de `ActivityEditorForm`.

**Acceptance Criteria:**
- Given la story 2.3 de `epics-parts/epic-2.md`, when elle est livrée, then chacun de ses critères AC1 à AC15 est vérifié par un test nommé `PRE4-2.3/ACn`, les 276 cas du corpus restent identiques, et `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Design Notes

Gras des valeurs nues d'un mélange en Répétitions : aucune frame Figma ne montre cette Phrase (les frames 8470:13303 et 8328:38848, consultées en lecture seule le 2026-10-17, montrent la Feuille). La règle FR-16-02 s'applique : valeurs en gras. À observer à la recette R-2.3-04.

H8, H9, H16, H17 et H18 sont appliquées comme écrites, au titre de la validation globale du plan. Recettes R-2.3-01 à 05 : ensemble « durées et phrases » ; R-2.3-03 et 04 seulement après l'Epic 3. Aucune validation sur appareil n'est déclarée.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Revue du 2026-10-17 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V). V : aucune lacune de vérification.

| Constat | Verdict | Preuve | Route |
|---|---|---|---|
| B1/E5 — gras de l'AC2 (`3` puis ` séries de `) contraire au test (`3 séries` en gras) | low | Le Corpus 276 figé (AC12, P43) met « 3 séries » en un seul segment gras ; la lettre de l'AC2 le contredit | patch documentaire : règle P46 dans `questions-ouvertes.md` ; renvoi dans le test |
| B2/E7 — AC1 : aucun stockage de la Phrase dans une Définition ou une Copie, non testé | false | Le JSON v2 à forme figée (1.1) ne porte aucune clé de Phrase ; ses tests de forme exacte en apportent la preuve | rejeté |
| B3 — couverture de l'AC14 incomplète pour le tout-échec (Répétitions Bip 0, sans Pause ; N = 1 avec et sans Pause) | low | La garde ne croise que Mode × Régime | patch |
| B4 — AC10 : preuve par l'arité de la fonction | false | La Récupération n'appartient pas aux Paramètres d'exécution ; `generateExecutionPhrase` ne reçoit aucune autre entrée | rejeté |
| B5/E4 — garde des consommateurs sur une liste fermée | low | Un nouveau consommateur échapperait au test | patch |
| B6/E8 — AC15 : police et graisse non vérifiées | low | Seuls `fontSize` et `lineHeight` sont asserts | patch |
| B7 — AC13 : conservation des paramètres de l'adaptation non vérifiée | low | Seul `mode` est assert | patch |
| B8 — `totalFormula` jamais évalué et incohérent ; Cible `null` remplacée en silence | low | `n1-redundant` ; `?? p.targets[0]` | patch |
| B9 — `phraseSource` de l'oracle jamais lu | low | Type `OracleCase` | patch |
| B10 — tests `PRE4-2.1/AC9` portant un comportement de la 2.3 | low | Traçabilité brouillée | patch (renommage) |
| B11 — entrées R-2.3 absentes de `recette-iphone.md` | low | Absentes aussi pour R-2.1 et R-2.2 | patch par l'orchestrateur, à la clôture de l'Epic 2 (ensemble « durées et phrases ») |
| B12 — JSDoc « Régime variables seulement » sans garde | low | Un Régime identiques ne porte qu'une Cible | patch (commentaire) |
| E1 — deux Cibles à l'échec dans une énumération | low | Gabarit non figé par un test ; conforme à Q16 (chaque Cible dans l'ordre) | patch (variante) |
| E2 — Cible `NUMBER` à 0 : « 0 s » | false | Une Cible `NUMBER` est un entier ≥ 1 (contrôle structurel de `validateForSave`, 1.1) | rejeté |
| E3 — `TypeError` au lieu d'un échec lisible dans le test des variantes | low | Fichier de test seulement | rejeté (faible) |
| E6 — relecture d'un Instantané v1 « à l'échec » absente des variantes | false | Couverte par `exerciseSnapshot.test.ts` (1.3) | rejeté |

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
- `git diff --stat` -- expected: aucun fichier réécrit en entier ; fins de ligne d'origine conservées ; aucun fichier du corpus modifié
