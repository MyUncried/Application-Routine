---
title: 'Story 1.2 — Avis des Exercices écartés et Séance vide visible'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
baseline_commit: '77e1630c631e285ca138e3f49a1d2f599dd4b922'
review_loop_iteration: 1
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-1.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La migration 010 (story 1.1) inscrit dans `migration_notices` le nombre d'Exercices illisibles écartés, mais rien ne l'affiche. Une Séance dont toutes les Copies ont été écartées disparaît de la liste et ne s'ouvre plus, parce que les lectures de Séance font un `JOIN activities` interne.

**Approach:** Un seul composant à la racine lit l'avis non acquitté et l'affiche par une `Alert` native, avec un seul bouton dont l'appui l'acquitte (AD-12, H24). Les lectures et la liste des Séances acceptent une Séance sans occurrence (P39). Les critères d'acceptation font foi : **story 1.2, AC1 à AC7, dans `epics-parts/epic-1.md`**.

## Boundaries & Constraints

**Always:**
- Texte par clé du lexique (RM-092) : pluriel « {n} exercices illisibles n’ont pas pu être repris. », singulier « 1 exercice illisible n’a pas pu être repris. » ; aucun nom, identifiant ni contenu d'Exercice écarté.
- Acquittement écrit seulement à l'appui du bouton ; un avis non acquitté réapparaît au lancement suivant ; aucun avis sans ligne non acquittée.
- `MigrationNoticeGate` est l'unique lecteur, monté une fois sous `SessionServiceProvider` et jamais passé en `children` de `SQLiteProvider` ; `SessionServiceProvider.test.tsx:36-47` reste vert.
- Séance sans occurrence : présente dans la liste et ouvrable avec une composition vide. **Décision de Hermann (Q32, 2026-10-16) :** sur la carte de liste, zéro prend le singulier, donc « 0 exercice · 2 tours » avec la durée « 0 min » dans la ligne de titre ; le format de la carte ne change pas par ailleurs. Le résumé « 0 exercice · 0 min » est celui de Composition, affiché à l'ouverture. Les autres Séances gardent résumé, ordre et durée.

**Never:**
- Aucune refonte de Composition ni de l'écran de Séance (Q4) ; aucune modification des règles d'enregistrement d'une Séance au `Continuer`.
- Aucun changement de `migration010` ni du schéma de `migration_notices`.
- Aucune modification de jeton ni des garde-fous `ScrollView`.

</frozen-after-approval>

## Code Map

- `app/_layout.tsx` -- monte `SessionServiceProvider` ; y placer `MigrationNoticeGate` une fois, à l'intérieur du provider, sans le faire transiter par `SQLiteProvider`.
- `src/features/sessions/SessionServiceProvider.tsx` (:166-176, :207, :241-272) -- fournit déjà `MigrationNoticeRepositoryContext` ; réutiliser, ne pas modifier le montage de `SQLiteProvider`.
- `src/features/sessions/MigrationNoticeRepositoryContext.tsx` -- contexte lu directement par le Gate (le hook `useMigrationNoticeRepository()` a été supprimé, faute d'appelant : revue de l'itération 1, B6).
- `src/domain/migration/MigrationNotice.ts` -- type et port (`MigrationNoticeKind`, repository) ; mettre à jour le commentaire « aucun lecteur d'interface ».
- `src/infrastructure/database/repositories/SqliteMigrationNoticeRepository.ts` -- lecture de l'avis non acquitté, écriture de `acknowledged_at` ; ajouter seulement ce qui manque, avec des tests `node:sqlite`.
- `src/features/migration/MigrationNoticeGate.tsx` (nouveau, dossier avec `README.md`) -- lit l'avis au montage, affiche `Alert.alert` une fois, acquitte à l'appui.
- `src/shared/i18n/index.ts` et `resources/fr.ts` -- clés de l'avis au singulier et au pluriel.
- `src/infrastructure/database/repositories/SqliteSessionRepository.ts` -- lecture par identifiant (requête :236-240, `JOIN activities`) et liste (:476-479, `JOIN activities`, `GROUP BY sessions.id, tours.id`) : passer en `LEFT JOIN` et faire ignorer par l'assemblage (`assembleSession`, `toActivity`) une ligne dont les colonnes d'occurrence sont nulles ; vérifier les compteurs de zones et les faits de durée par lot pour une Séance vide.
- Tests : `src/features/migration/__tests__/MigrationNoticeGate.test.tsx` (nouveau), tests du repository des avis et de `SqliteSessionRepository` (liste et lecture d'une Séance sans occurrence issue de la base migrée de 1.1).

## Tasks & Acceptance

**Execution:**
- [x] `src/shared/i18n/` -- clés singulier et pluriel de l'avis, bouton de fermeture -- AC1, AC4.
- [x] `src/features/migration/MigrationNoticeGate.tsx` + `app/_layout.tsx` -- lecteur unique monté à la racine après le splash ; une seule lecture par montage, même si la référence du repository change ; aucun `Alert` après démontage (drapeau `active` dans l'effet) ; seul le `kind` `UNREADABLE_EXERCISES_DROPPED` est affiché ; erreurs en `console.warn` -- AC1 à AC5.
- [x] `SqliteMigrationNoticeRepository.ts` -- lecture et acquittement couverts par `node:sqlite` -- AC2.
- [x] `SqliteSessionRepository.ts` -- `LEFT JOIN` et assemblage d'une Séance vide ; JSDoc d'`assertSessionAggregateRow` restée au-dessus de sa fonction -- AC6, AC7.
- [x] `src/features/sessions/` (formateur du nombre d'Exercices de la carte, `SessionCard`) -- zéro au singulier : « 0 exercice » (Q32) -- AC6.
- [x] tests nommés `PRE4-1.2/ACn` pour AC1 à AC7, dont : rendu de la carte d'une Séance vide (« 0 exercice · 2 tours », « 0 min », sans ≥ ni ≈, sans étiquette) et son dépliage sans erreur ; nature de durée `exact` à 0 ; montage de l'écran de Composition sur la Séance vide ; rendu de `RootLayout` (Gate absent pendant le splash ou tant que la base n'est pas prête, présent après) ; changement de référence du repository (une seule lecture, un seul `Alert`) ; démontage avant la résolution de la lecture ; `kind` inconnu ignoré ; `assembleSession` sur une ligne d'en-tête seule invalide (`ARCHIVED`, `tour_side_mode` invalide, `tour_repeat_count` 0) et sur un mélange en-tête/occurrence, chaque cas devant lever ; titre du test AC5 conforme à ce qu'il vérifie.

**Acceptance Criteria:**
- Given la story 1.2 de `epics-parts/epic-1.md`, when elle est livrée, then chacun de ses AC1 à AC7 est vérifié par un test nommé, et `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Implementation Notes

- AC6 (itération 0, remplacé) : la carte aurait affiché « 0 exercices · 2 tours ». Itération 1 : `formatActivityCount(0)` renvoie « 0 exercice » (Q32) ; la carte d'une Séance vide affiche « 0 exercice · 2 tours » et « 0 min ». Le chevron de la carte est désactivé dans le code de départ : son « dépliage » est vérifié comme un appui sans erreur.
- Avis : bouton « OK », sans source ; avec le texte singulier, il est à valider par Hermann à la recette (H24). Le Gate n'est monté qu'après le splash de l'application.
- Lecture et liste en `LEFT JOIN activities` ; une Séance vide est assemblée depuis une ligne d'en-tête ; l'enregistrement d'une Séance sans Exercice reste refusé (règle existante).

## Spec Change Log

- **Itération 0 → 1 (2026-10-16).**
  - **Constat déclencheur :** B1/E3. L'AC6 et la section « Always » citaient « 0 exercice · 0 min » pour la carte de liste, alors que c'est le résumé de Composition ; la carte existante aurait affiché « 0 exercices · 2 tours ».
  - **Modification :** intention figée mise à jour selon la décision Q32 de Hermann ; tâches complétées par les correctifs retenus de la revue.
  - **État fautif évité :** une carte au pluriel « 0 exercices », et un AC6 marqué couvert sans vérification du rendu.
  - **À CONSERVER** (diff de l'itération 0 : `_bmad-output/tmp/keep-1-2-iteration0.patch`) : `MigrationNoticeGate` (`Alert` natif, titre = phrase, un bouton « OK », `cancelable: false`) ; clés de lexique singulier et pluriel ; montage `databaseReady && !showAppSplash` sous `SessionServiceProvider` ; `SessionAggregateQueryRow`, `isSessionOccurrenceRow`, `assertSessionHeaderRow` et l'assemblage d'une Séance vide ; `update()` qui ignore la ligne d'en-tête ; tests AC1 à AC7 existants, sur `node:sqlite` et en composant ; mises à jour des README et commentaires.

## Review Triage Log

Revue de l'itération 0 (2026-10-16) : relecteurs `blind-hunter`, `edge-case-hunter` et `verification-gap`.

| Constat | Verdict | Preuve | Route |
|---|---|---|---|
| B1/E3 — texte de la carte d'AC6 | medium | `SessionCard.tsx:109-112` : `formatActivityCount(0)` donne « 0 exercices » ; « 0 exercice · 0 min » est `composition.summary.empty`. | intent_gap → Q32, boucle |
| G1 — condition de montage du Gate vérifiée par lecture de texte seulement | low | Le test AC5 lit `app/_layout.tsx` ; aucun rendu de `RootLayout` ne vérifie la condition. | patch (test) |
| G2 — garde « une lecture par montage » jamais exercée | low | `rerender` garde le même repository ; supprimer `hasReadRef` ne ferait échouer aucun test. | patch (test) |
| G3 — contrôles de la ligne d'en-tête seule non testés | low | Aucun test d'`assembleSession` sur une ligne d'en-tête invalide ou un mélange. | patch (test) |
| B2 — aucun rendu de l'écran sur la Séance vide | low | AC7 testé jusqu'au brouillon et au résumé seulement. | patch (test) |
| B3 — états nouveaux (carte dépliée, Démarrer) d'une Séance vide | low | Une Séance vide n'atteignait jamais la liste avant cette story. | patch (test de rendu et de dépliage) |
| B4 — nature de durée de la Séance vide non vérifiée | low | Seuls `activityCount` et `estimatedDurationSeconds` sont vérifiés. | patch (test) |
| B5 — textes sans source non consignés | low | Le bouton « OK » et le singulier ne figurent pas dans `questions-ouvertes.md`. | patch documentaire (H24) |
| B6 — écart avec la carte du code (`useContext` direct) | false | Le contexte doit accepter `null` avant que le repository soit prêt ; le hook lève dans ce cas. Aucun préjudice. | rejeté |
| B7 — JSDoc orpheline | low | Deux blocs `/** */` consécutifs au-dessus d'`assertSessionHeaderRow`. | patch |
| B8 — double lecture au remontage | low | Couvert par G2 et E1. | patch |
| B9 — titre du test AC5 inexact | low | Le titre promet une vérification de la création de la table que le test ne fait pas. | patch (titre) |
| B10 — défauts de mise en forme de la documentation | low | Espace avant le point (`domain/migration/README.md`), coupure de ligne (`SqliteMigrationNoticeRepository.ts`). | patch |
| B11 — `console.error` en production | low | Écran rouge LogBox en développement ; la convention existante est `console.warn` (`app/_layout.tsx`). | patch |
| E1 — `Alert` après démontage | low | Pas de drapeau d'annulation dans l'effet. | patch |
| E2 — `kind` non vérifié | low | Toute ligne non acquittée est affichée avec le texte des Exercices illisibles. | patch |

Revue de l'itération 1 (2026-10-16), mêmes trois couches.

| Constat | Verdict | Preuve | Route |
|---|---|---|---|
| VG1 — Gate hors du provider non détecté | low | Le provider et le Gate simulés ignorent le contexte. | patch (test à sentinelle) |
| VG2/B5/E2 — remise à zéro du drapeau avant résolution non testée ; contrat « une seule lecture » inexact | low | Le nettoyage remet `hasReadRef` à `false` ; aucun test ne relance l'effet avant résolution. | patch (test + documentation du contrat réel) |
| VG3/B3 — titres de tests contredits par Q32 | low | `index.test.ts:202`, `CompositionScreen.test.tsx:425`. | patch |
| B1 — epic non mis à jour après Q32 | low | `epic-1.md` l. 188 et 199, `epics.md`. | patch documentaire (fait) |
| B2 — singulier de Q32 étendu au résumé de Composition | low | `compositionPresentation.ts:141` utilise le même formateur. | accepté (Q32 : zéro au singulier, précision consignée) + patch (test) |
| B4 — documentation qui cite « 0 activité · 0 min » | low | `features/sessions/README.md:36`, JSDoc de `compositionPresentation.ts:57`. | patch |
| B6 — hook `useMigrationNoticeRepository` mort | low | Aucun appelant de production. | patch (suppression) |
| B7 — pas de scénarios 1.2 dans `recette-iphone.md` | false | Les scénarios sont insérés par la story 4.6 et regroupés en ensembles de recette (consigne de Hermann). | rejeté |
| B8 — « Démarrer » sur une Séance vide | false | Bouton visuel seulement, aucun gestionnaire relié (`SessionCard.tsx:34`). | rejeté |
| B9 — sortie d'une Séance vide rouverte non testée | low | Le test de parcours s'arrête à l'ouverture. | patch (test) |
| B10 — tenue de la spec | low | Statut et résultats : relevés à l'étape 5. | rejeté (modification de la spec) |
| B11 — test « aucun identifiant ni date » non probant | low | `formatMigrationNoticeMessage` ne reçoit que `count`. | patch (assertion sur les arguments d'`Alert`) |
| B12 — durées du splash en dur dans le test | low | Constantes non exportées ; la correction ajouterait une surface publique. | rejeté |
| B13 — comptages SQL des lignes nulles sans test unitaire | low | Vérifiés de bout en bout sur `node:sqlite`. | rejeté |
| B14 — Q32 mal rangée | low | Ordre du tableau de décisions. | rejeté (cosmétique) |
| E1 — filtre de `kind` dans la requête | false | Un seul écrivain, une seule constante de `kind` (`migration010.ts:771`). | rejeté |
| E3 — cas `databaseReady` faux non testé | low | La base non prête bloque aussi le splash ; le test ne distingue pas les deux gardes. | patch (cas `rootError`) |

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes, dont `SessionServiceProvider.test.tsx`
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- Recette R-1.2-01 et R-1.2-02 sur iPhone, regroupée avec l'ensemble « migration et données » après la story 1.4.
