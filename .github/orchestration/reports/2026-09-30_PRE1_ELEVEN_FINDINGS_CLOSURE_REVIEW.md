# PRE-1 — Revue indépendante de fermeture des 11 constats (run 36734142447)

## Mission

- Identifiant : `PRE1_ELEVEN_FINDINGS_CLOSURE_REVIEW`
- Objectif : réparer le lancement technique de la revue ciblée, faire exécuter par le reviewer indépendant V2 la vérification de fermeture des 11 constats de la revue 36734142447 sur le plan corrigé, enregistrer le résultat et, si APPROVE, lancer le développement par la chaîne V2.
- Issue : #249 (`V2-PRE-1 — Fondations du modèle cible avant moteur`), dépôt `MyUncried/Application-Routine`.
- Pilote/correcteur : session Claude Code interactive (cette session). Reviewer indépendant : invocation Claude distincte lancée par le workflow `kodjo-v2-slice-initial-plan-review.yml` sur le runner `kodjo-claude-local`. La vérification du pilote n'est pas présentée comme indépendante.
- VNext : exclu, non examiné, non modifié.

## Départ

- Dossier ouvert : `C:\Dev\Application-routine`, branche `main` locale à `0caceff1`, en retard sur `origin/main` ; 4 fichiers de `docs/Specifications-fonctionnelles/` modifiés localement (travaux concurrents, préservés, non touchés).
- Travail réalisé dans un worktree détaché distinct à `origin/main` = `da81b4cd2b6a62af3a70ba3fe1a0dee7d3b2e20b`.
- Aucun run actif (`in_progress`/`queued`) au démarrage ; aucun verdict publié pour le candidat 5916079168 ; aucun verrou `ai-orchestration-writer.lock`.

## Références vérifiées

| Élément | Référence | Vérification |
|---|---|---|
| Plan corrigé | commit `990103188f2936bb2ed7d766fabe56ab0b779210`, `.github/orchestration/v2-slices/V2-PRE-1/correction-review-36734142447/corrected-plan.md`, blob `8ed0768c…` | SHA-256 `a5f78c7b…5019` et 226 423 octets recalculés : conformes |
| Publication humaine | commentaire 5916079168, issue #249, auteur MyUncried | lien vers le blob exact présent |
| Baseline applicative | `e216294506bed87dd80855937e3fabfbfa322b82` | commit présent |
| Constats | `07f6579ad59f66015c8189f079bde0aaab7d01aa` | **écart de libellé** : c'est un *blob* (`independent-findings.json`) contenu dans 990103188, pas un commit |
| Registre | blob `2b304f64…` = `.github/orchestration/reports/2026-09-30_PRE1_PLAN_CORRECTION_36734142447.md` @990103188 | présent |

### Correspondance des 11 constats avec la revue 36734142447

- `independent-review.md` archivé @990103188 est identique octet pour octet au `kodjo-v2-initial-review.md` de l'artefact 11107788580 du run 36734142447.
- La re-normalisation déterministe (`normalize-review-findings.js`) de ce Markdown produit 11 constats bloquants, verdict REVISE ; bijection exacte avec les 11 entrées du JSON archivé (tous champs identiques hors `finding_id`, absent de l'archive).
- Numérotation stable = ordre du JSON archivé :

| N | finding_id normalisé | Cible |
|---|---|---|
| 1 | RF-D34D4B6B8ED7CFA6 | PATH `src/features/sessions/ExerciseScreen.tsx` |
| 2 | RF-30F676C5A8ABC43C | PATH `src/features/sessions/CompositionScreen.tsx` |
| 3 | RF-E364FF222D11E970 | PATH `src/features/activities/ActivityCard.tsx` |
| 4 | RF-B96527975795DCBE | PATH `src/features/activities/ActivitySelectionScreen.tsx` |
| 5 | RF-6B54E9FB4F12E236 | CRITERION_ID `UI-73382D60E040` |
| 6 | RF-BB7ED3643C351600 | CRITERION_ID `UI-CDBCCFD16078` |
| 7 | RF-2A8BBFB29B4E432E | PATH `src/domain/categories/defaults.ts` |
| 8 | RF-AFBBD5D6D8314C6C | PATH `src/domain/categories/validation.ts` |
| 9 | RF-88D611F2B7EE57C5 | SOURCE `qualification-spec.md §4` |
| 10 | RF-FBB70368420C9494 | SOURCE `qualification-spec.md §13` |
| 11 | RF-2424592194D6868A | PLAN `NON_UI_COVERAGE` |

## Lancement technique : diagnostic et correction

- Run 36750556401 : prompt passé en argv via PowerShell → `unknown option '->'` (déjà corrigé par 8c5a7c32 : prompt par stdin, `shell=false`).
- Run 36754524270 : `Get-Command claude.exe` échoue. Cause vérifiée sur la machine du runner (service `actions.runner.MyUncried-Application-Routine.KODJO-LOCAL-RUNNER`, compte `.\hadjo`) : le PATH n'expose que les lanceurs npm `claude`, `claude.cmd`, `claude.ps1` dans `%APPDATA%\npm` ; l'exécutable natif est `%APPDATA%\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe` (Claude Code 2.1.263), invoqué par `claude.ps1`.
- Correction : `scripts/kodjo/resolve-claude-binary.js` résout `claude.exe` sur PATH, sinon à côté d'un lanceur npm trouvé sur PATH, sinon sous `%APPDATA%\npm` ; échec explicite `CLAUDE_BINARY_NOT_FOUND`. Le workflow l'utilise et journalise le chemin.
- Test technique distinct : `.github/workflows/kodjo-v2-review-launch-smoke.yml` (workflow_dispatch, main, runner local). Aucun plan, constat ni verdict. Il prouve sur le runner réel : transport stdin octet-exact (test pilote existant), résolution et démarrage du CLI (`--version`), appel réel via le lanceur de revue avec nonces tête/milieu/queue au travers de contenu hostile (`->`, guillemets, `--resume fake`, CRLF, Unicode), lecture d'un fichier de `RUNNER_TEMP`, et reprise `--resume` de la même session (identité de session contrôlée).

## Bornage de la revue aux 11 constats

Conflits identifiés avant l'appel et traitement :

1. L'ancienne consigne admettait « un nouveau constat bloquant … régression introduite par la correction » et des « observations non bloquantes séparées ». Remplacée : exclusivement les 11 constats ; aucune recherche de nouveau sujet ni douzième constat ; pas d'audit général, d'amélioration, de reconception, d'élargissement PRE-1, ni de VNext ; une dépendance ou régression n'est admissible que comme preuve de non-fermeture du constat d'origine ; une amélioration souhaitable n'est jamais une condition de fermeture.
2. Le reviewer s'exécute dans le checkout produit et charge `CLAUDE.md` (obligation de rapport committé ; critères de revue génériques d'`AI_ORCHESTRATION.md`). La consigne précise que ces fichiers n'élargissent pas le périmètre et que l'obligation de rapport est satisfaite par l'orchestration (publication du Markdown par le workflow + présent rapport committé par le pilote) ; aucune écriture par le reviewer. L'obligation elle-même n'est pas suspendue.
3. Sortie exigée : tableau de 11 lignes `| N | Correction examinée | Preuve précise | Fermé | Justification |`, bloc `<KODJO_PRE1_CLOSURE_JSON>` à 11 entrées, bloc V2 `<KODJO_REVIEW_FINDINGS_JSON>` ne contenant qu'une ligne bloquante par constat non fermé, reprenant exactement catégorie/type/cible d'origine et commençant par `Prior finding N:`.
4. Garde mécanique `scripts/kodjo/verify-pre1-closure-review.js` exécutée avant publication : rejette toute ligne hors des 11 cibles, toute observation non bloquante, tout numéro incohérent, tout tableau ≠ 11 lignes et toute contradiction tableau/JSON/verdict. Un rejet fait échouer le run sans publication ; les sorties du reviewer restent dans l'artefact.

Aucune règle V2 incompatible avec ce bornage n'a été trouvée : le verdict reste dérivé mécaniquement des lignes bloquantes normalisées (`review-findings.js`), l'APPROVE reste exigé du bot de revue pour le handoff.

## Capacité de tours ciblés

- Reprise du même reviewer : supportée (`review_session_id=` dans la commande → `--resume`, identité de session vérifiée par le workflow), démontrée par le test technique.
- Validation de la version finale exacte : le handoff (`materialize-approved-plan-handoff.js`) matérialise le plan du `source_plan_comment_id` de la revue APPROVE, recalculé avec contrôle auteur/commit/blob/taille/SHA-256.
- Un tour de correction exigerait l'épinglage du nouveau candidat (même schéma que 5916079168). Non réalisé par anticipation.

## Tests

| Commande | Résultat |
|---|---|
| `node --test tests/kodjo/pre1-review-launch.pilot.js` (nouveau) | PASS 3/3 |
| `node tests/kodjo/plan-review-stdin.pilot.js` | PASS |
| `node scripts/kodjo/resolve-claude-binary.js` (machine du runner) | `C:\Users\hadjo\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe` |
| `node scripts/kodjo/validate-workflows.js` | exit 0 (deux workflows OK) |
| `node tests/kodjo/run-all.js` | 812 tests, 794 PASS, 14 FAIL — ensemble d'échecs identique à `origin/main` da81b4cd sans modification (809 tests, 14 FAIL) ; aucun échec introduit |

Aucun test applicatif ni vérification sur appareil n'est applicable à ce raccordement d'orchestration.

## Fichiers modifiés (commit de raccordement)

- `.github/workflows/kodjo-v2-slice-initial-plan-review.yml`
- `.github/workflows/kodjo-v2-review-launch-smoke.yml` (nouveau)
- `scripts/kodjo/resolve-claude-binary.js` (nouveau)
- `scripts/kodjo/verify-pre1-closure-review.js` (nouveau)
- `tests/kodjo/pre1-review-launch.pilot.js` (nouveau)
- ce rapport

Aucun fichier `app/`/`src/`, aucun plan, constat ou registre modifié ; aucun fichier VNext.

## Déroulement (complété au fil de l'exécution)

_À compléter : test technique, revue, verdict, développement._
