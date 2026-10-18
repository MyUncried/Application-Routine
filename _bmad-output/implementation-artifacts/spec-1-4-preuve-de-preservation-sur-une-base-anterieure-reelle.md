---
title: 'Story 1.4 — Preuve de préservation sur une base antérieure réelle'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
baseline_commit: '9cc21b3b8ae836cef1b5c866cff8207343f1078e'
review_loop_iteration: 1
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-1.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/recette-iphone.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Avant d'installer PRE-4 sur ses données réelles, Hermann a besoin de deux choses. D'abord, une preuve sur une vraie base SQLite d'avant PRE-4, avec un jeu complet, que la migration conserve tout le lisible, écarte proprement l'illisible et s'annule entièrement en cas d'erreur. Ensuite, une procédure pas à pas pour préparer et relever ces données sur son iPhone.

**Approach:** Écrire la fixture v9 complète et les tests d'intégration de la **story 1.4 (AC1 à AC5, `epics-parts/epic-1.md`)** sur une base fichier `node:sqlite` relue après réouverture, puis rédiger dans `recette-iphone.md` la procédure (AC6) et les scénarios (AC7). Trancher au passage le report E7 de `deferred-work.md` : `PRAGMA foreign_key_check` sur toute la base face à une violation préexistante.

## Boundaries & Constraints

**Always:**
- Aucun code de production nouveau, sauf si un test révèle un défaut ; dans ce cas, correction minimale, consignée.
- Base fichier réelle (`NodeSqliteDatabase.openFile`), construite par `migration001` à `migration009` via `src/infrastructure/database/testing/buildVersion9.ts` ; relecture par une nouvelle connexion ; injection d'échec par `testing/failOnWrite.ts` sur une écriture tardive de la transaction.
- Comptes de chaque table et listes d'identifiants consignés avant et après migration ; `migration_notices` vide sans illisible, et `count` = 4 pour la variante de l'AC3.
- Procédure de l'AC6 : version de départ `c32e360d` chargée par `npx expo start` dans le dev client « Routine Dev » déjà installé (Q22), exécutée seulement après la vérification de compatibilité faite en ouverture de la story 3.1 ; arrêt et signalement à Hermann si un nouveau build est nécessaire. La production des illisibles passe par un moyen **qui ne laisse aucun code dans la branche livrée** : un patch temporaire appliqué dans une copie de travail jetable (par exemple un `git worktree` sur `c32e360d`), versionné seulement comme fichier de procédure sous `docs/preparation/PRE-4/bmad/`, jamais sous `src/` ou `app/`.
- Aucune mesure non observée n'est inscrite (Q6).

**Never:**
- Aucune modification de `migration001` à `migration010`, sauf correction d'un défaut démontré par un test de cette story, à consigner.
- Aucun EAS, aucun push, aucune réinitialisation de données (P29).

</frozen-after-approval>

## Code Map

- `src/infrastructure/database/testing/buildVersion9.ts` -- construction d'une base v9 réelle (réutiliser, étendre si besoin pour le jeu complet).
- `src/infrastructure/database/testing/failOnWrite.ts` -- échec injecté sur une écriture choisie, poignée de transaction respectée.
- `src/infrastructure/database/testing/NodeSqliteDatabase.ts` -- `openFile` pour la fermeture et la réouverture.
- `src/infrastructure/database/migrations/migration010.ts` -- sous test ; le contrôle `PRAGMA foreign_key_check` (vers :761-764) concerne le report E7.
- `src/infrastructure/database/__tests__/migration010.test.ts`, `copiesAndSnapshots.story13.test.ts` -- modèles de fixtures et d'assertions à réutiliser ; nouveau fichier de test d'intégration pour la story 1.4.
- Repositories (`SqliteActivityDefinitionRepository`, `SqliteSessionRepository`, `SqliteMediaRepository`, `SqliteMigrationNoticeRepository`) -- relecture après réouverture (AC5).
- `docs/preparation/PRE-4/bmad/recette-iphone.md` §2 et §4 -- procédure (AC6) et scénarios R-1.4-01 à 03 (AC7), avec rappel de R-1.1-xx, R-1.2-xx et R-1.3-xx.

## Tasks & Acceptance

**Execution:**
- [x] fixture v9 complète et test d'intégration -- AC1 à AC5, nommés `PRE4-1.4/ACn`.
- [x] report E7 -- test sur base v9 contenant une violation de clé étrangère préexistante sans rapport avec PRE-4 : constater le comportement. Si la migration est bloquée, restreindre le contrôle aux tables reconstruites, test à l'appui. Consigner le résultat et retirer l'entrée de `deferred-work.md`.
- [x] `docs/preparation/PRE-4/bmad/recette-iphone.md` -- procédure (AC6), scénarios (AC7) ; fichier de patch temporaire pour les illisibles sous `docs/preparation/PRE-4/bmad/`, s'il est retenu.

**Acceptance Criteria:**
- Given la story 1.4 de `epics-parts/epic-1.md`, when elle est livrée, then chacun de ses AC1 à AC7 est vérifié par un test nommé (AC1 à AC5) ou par le contenu de `recette-iphone.md` (AC6, AC7), le report E7 est tranché, et `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Implementation Notes

- **Tests :** `src/infrastructure/database/__tests__/preservation.story14.test.ts`. La fixture v9 complète est locale au test : `populateVersion9`, avec sa variante `withUnreadable`. Elle comprend 12 Définitions, 11 Copies dans 3 Séances, dont une archivée, 4 `media_assets`, dont un antérieur à 009, une Catégorie et une Zone créées par l'utilisateur, et un point d'arrêt. La variante ajoute 2 illisibles de structure (`{not json`, version 7) et 2 illisibles selon Q28 (Pause −5 en ligne 2, Bip 2,5), un asset utilisé par un seul illisible, et une Séance D vidée. `def-reps-uniform` porte 2 Zones, 2 Médias et un Bip de 3 s. Base fichier `openFile`, placée sous `node_modules/.cache/` du clone et nettoyée, `-wal` et `-shm` compris. Chaque relecture passe par une nouvelle connexion. AC2 à AC5 et E7 migrent par le chemin du démarrage, `initializeDatabase` (`foreign_keys = ON`, WAL, valeurs vérifiées) ; seule la fixture est construite hors de ce chemin. AC3 compare les comptes et les identifiants de chaque table, liens compris. Seules `a-tour-1` et `a-tour-2` y voient leur position diminuer de 1 ; la comparaison est stricte pour les autres. AC4 injecte l'échec à deux endroits, d'après le SQL relevé des écritures exécutées. Premier endroit : `INSERT INTO migration_notices`, dernière écriture de `migration010`, après la reconstruction (RENAME exécuté) et la création de la table de l'avis. Second endroit : le RENAME d'`activities_v10`, juste après le DROP des tables d'origine. `buildVersion9.ts` et `failOnWrite.ts` sont réutilisés sans modification.
- **« Récupérations »** (AC1) : Récupérations attachées (`post_activity_recovery_seconds` > 0). La fixture ne contient aucune ligne `RECOVERY` autonome, supprimée par 004 du modèle de données.
- **Report E7, défaut démontré et corrigé (correction minimale de production, consignée) :** sur une base v9 contenant une violation préexistante sans rapport avec PRE-4 (`activity_media` vers un asset absent, écrite hors clés étrangères), `migration010` échouait à chaque démarrage sur `foreign_key_check is not empty`, avec `user_version` restée à 9. Constat obtenu en exécutant le test avant la correction. Correction dans `migration010.ts`, en deux volets. (1) Contrôle STRICT, vide exigé, sur `activities` et ses deux tables filles. `foreign_key_check(activities)` contrôle les clés sortantes d'`activities`. Ses deux tables filles sont les seules à la référencer, ce que garantit `assertExpectedSchema`, et chacune est contrôlée. (2) Relevé global `PRAGMA foreign_key_check` au début de la transaction, avant toute écriture, puis relevé global en fin de reconstruction. Ailleurs que dans ces trois tables, toute violation absente du relevé initial lève `Migration010StructuralError` ; la clé de comparaison est table, rowid, parent, fkid. Les violations préexistantes y sont tolérées et laissées intactes, sans réparation silencieuse. Tests `PRE4-1.4/E7-a` (préexistante tolérée), `E7-b` (préexistante dans une table reconstruite) et `E7-c` (violation nouvelle dans `activity_media`, écrite pendant la migration sous clés différées : échec, version 9, état identique).
- **Risque résiduel accepté au titre de Q19 (« une erreur structurelle reste un échec ») :** une violation préexistante *dans* une table reconstruite reste une erreur structurelle. La migration est annulée et la base reste en version 9, à chaque démarrage (test `PRE4-1.4/E7-b`). Le cas est improbable, car les clés étrangères sont actives à chaque ouverture. Le lever exigerait d'écarter des liens, donc une décision produit. Une entrée de `deferred-work.md` demande de le revoir s'il est observé sur un appareil.
- **Garde de cantonnement :** `legacyModeConfinement.test.ts` autorise le nouveau test de parité, qui nomme l'ancien mode et importe `readV1`, au même titre que `migration010.test.ts`.
- **Recette :** procédure au §2 de `recette-iphone.md` (AC6), scénarios au §4.1 (AC7). Patch temporaire `docs/preparation/PRE-4/bmad/recette-patch-illisibles.diff`, appliqué dans un `git worktree` jetable sur `c32e360d` ; `git apply --check` vérifié sur `c32e360d`. Aucun code sous `src/` ou `app/` pour la recette. Répétitions 150 et Bip 11 ne sont pas saisissables dans l'interface de départ : ils sont couverts par les tests seulement.

## Spec Change Log

## Review Triage Log

Revue du 2026-10-17 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V). Verification-gap : chaque AC est prouvé par un test nommé ou par la recette ; suite de la story verte (7/7). Aucune lacune bloquante.

| Constat | Verdict | Preuve | Route |
|---|---|---|---|
| B1 — contrôle restreint : une violation créée par la migration dans une table non reconstruite (`activity_definitions`, `activity_media`, `activity_definition_body_zones`) ne serait plus détectée | medium (E4 : aucun chemin actuel ne la crée, mais `defer_foreign_keys` peut masquer une violation) | `migration010.ts:611-613`, `:782-787` | patch : relevé global initial ; à la fin, rien de nouveau hors des tables reconstruites ; contrôle strict maintenu sur ces tables |
| B2/E4 — commentaire faux sur `foreign_key_check(activities)` | low | Le PRAGMA ne contrôle que les clés sortantes | patch |
| B3/E3/V7 — violation préexistante dans une table reconstruite : échec à chaque démarrage, sans suivi | low (improbable : FK actives, aucun DELETE de parent à `c32e360d`) | Test « constat » | patch documentaire : échec structurel conforme à Q19 ; entrée de risque résiduel dans `deferred-work.md` ; tests renommés `PRE4-1.4/E7-a` et `PRE4-1.4/E7-b` |
| B5/E5 — les tests évitent `initializeDatabase` (PRAGMA, WAL) | low | Appel direct de `migrateDatabase` | patch |
| B4 — AC3 neutralise les positions de toutes les Copies | medium | `{ ...row, position: reread?.position }` | patch |
| B6/V1 — tables de liens comparées en nombre de lignes, sans clés | low | AC3 | patch |
| V2/E9 — injection tardive non localisée ; aucune injection au cœur de la reconstruction | low | `writesBeforeFailure > 30` | patch : écriture précise et seconde injection sur le RENAME |
| V3 — aucun Exercice en Répétitions avec plusieurs Zones, plusieurs Médias et un Bip dans les bornes | low | fixture | patch |
| V4 — AC5 compare champ par champ | low | | patch |
| B7 — nettoyage fragile sous Windows | low | | patch |
| E1 — le patch de recette modifie avant de vérifier les comptes | medium | `UPDATE … WHERE name` sans condition | patch : comptes d'abord, modification seulement si 1 et 1 |
| E2 — base du dev client déjà en version 10 (autre version, VNext comprise) | medium | `c32e360d` refuse une base plus récente ; une base v10 étrangère ne serait jamais migrée | patch de procédure : vérification et arrêt, signalement à Hermann ; aucune remise à zéro sans sa décision (P29) |
| E8 — copie de travail hors du clone | low | Règle : rien hors de `C:\Dev\KODJO-BMAD-PRE4` | patch : copie sous le clone, exclue localement, aucun contrôle pendant son existence |
| B8/E6 — `git apply` et les CRLF | low | | patch : `git apply --check` |
| B9/E7 — « une seule fois » inexact | low | | patch |
| B10 — ordre des sections, `npm ci`, remède en cas de nom mal saisi, trace de l'état | low | | patch |
| V5/V6 — phrase « non créable » pour Q28 ; affirmations non vérifiées | low | | patch |
| B11 — statut de sprint | false | Statut géré par l'orchestrateur | rejeté |

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
- `git diff --stat` -- expected: aucun fichier existant réécrit en entier (fins de ligne d'origine conservées) ; aucune modification sous `src/` hors tests, sauf correction consignée.
