# V2 — Deux correctifs d'orchestration à vérifier côté VNext (2026-10-02)

Compte rendu autonome destiné à la conversation chargée de VNext. Il décrit deux défauts constatés sur le chemin V2 pendant la livraison de V2-PRE-1, leurs correctifs V2 et les preuves d'exécution réelle. **Aucun fichier VNext n'a été modifié.** Les règles V2 ne doivent pas être recopiées telles quelles : chaque section se termine par ce qui est propre à V2 et par les questions que VNext doit vérifier sur son propre chemin.

- Dépôt : `MyUncried/Application-Routine`, branche `main`.
- Mission : V2-PRE-1 (issue #249). Rapport principal : `.github/orchestration/reports/2026-09-30_PRE1_ELEVEN_FINDINGS_CLOSURE_REVIEW.md`.
- Légende : **LIVRÉ ET VÉRIFIÉ** = commité sur `main` et observé en exécution réelle ; **PROPOSÉ** = non réalisé.

---

## Correctif 1 — Vérifications longues passées en arrière-plan dans l'implémenteur non interactif

### Cause exacte et conditions de déclenchement

- L'implémenteur V2 est Claude Code lancé en mode non interactif (`claude -p --output-format json`, `permission_mode=dontAsk`, outils `Read,Edit,Write,Glob,Grep,Bash` avec liste blanche) par `scripts/kodjo/run-local-claude.js`, sur le runner Windows auto-hébergé `KODJO-LOCAL-RUNNER`, Claude Code `2.1.263`.
- Les vérifications ne sont accessibles qu'au travers d'un exécuteur (`node {KODJO_CHECK_RUNNER} jest|typescript|lint`) ; `jest` lance la suite complète (`npm test --silent`), soit environ 100 s à plusieurs minutes sur ce runner.
- Par défaut, l'outil Bash de Claude Code a un délai de 120 000 ms et **déplace automatiquement en arrière-plan** une commande longue (comportement documenté ; désactivable par `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`). Le modèle peut aussi demander `run_in_background`.
- En mode `-p`, la session se termine avec le tour du modèle : le modèle a écrit « Jest is running in the background… I'll wait for the completion notification », a terminé son tour et n'a **jamais vu** le résultat. Le superviseur a ensuite exécuté lui-même les vérifications et classé le run `IMPLEMENTED_WITH_FAILED_CHECKS`.
- Conditions cumulatives : mode non interactif + outil Bash disponible + vérification plus longue que le délai par défaut (ou demande d'arrière-plan) + aucune protection côté lanceur. Une consigne textuelle seule ne suffit pas (run 36929974315 : consigne explicite de `timeout` 600000, même échec).

### Runs ayant démontré le défaut (réels)

| Run | Résultat | Constat |
|---|---|---|
| [36924289392](https://github.com/MyUncried/Application-Routine/actions/runs/36924289392) | `IMPLEMENTED_WITH_FAILED_CHECKS` (jest 1 261/1 262) | Tour terminé en attendant un jest en arrière-plan |
| [36925812691](https://github.com/MyUncried/Application-Routine/actions/runs/36925812691) | `IMPLEMENTED_WITH_FAILED_CHECKS` (jest 1 261/1 262) | Idem ; erreur réelle jamais vue par le modèle |
| [36929974315](https://github.com/MyUncried/Application-Routine/actions/runs/36929974315) | `IMPLEMENTED_WITH_FAILED_CHECKS`, aucun fichier modifié | Idem malgré une consigne textuelle explicite |

### Correctif — LIVRÉ ET VÉRIFIÉ

- Commit `c6bda99c` (`fix(kodjo): keep implementer checks in the foreground in non-interactive runs`), approuvé par Hermann.
- Fichiers : `scripts/kodjo/run-local-claude.js`, `tests/kodjo/claude-foreground-checks.pilot.js` (nouveau).
- Effet : l'environnement du processus Claude reçoit, **après** l'environnement hérité (donc prioritaire), `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`, `BASH_DEFAULT_TIMEOUT_MS=900000`, `BASH_MAX_TIMEOUT_MS=900000`.

Diff exact :

```diff
diff --git a/scripts/kodjo/run-local-claude.js b/scripts/kodjo/run-local-claude.js
index 0c60c212..f43a2753 100644
--- a/scripts/kodjo/run-local-claude.js
+++ b/scripts/kodjo/run-local-claude.js
@@ -19,6 +19,15 @@ const {
   buildPrompt, buildArgs, classifyClaudeFailure, sha256, redact, TURN_LIMIT_POLICY,
 } = require('./lib/claude-local');
 
+// Non-interactive runs end when the model ends its turn: a long check (the full jest suite)
+// auto-moved to the background was never observed (PRE-1 runs 36924289392, 36925812691,
+// 36929974315). Keep every check in the foreground with a timeout above its duration.
+const CLAUDE_FOREGROUND_CHECK_ENV = Object.freeze({
+  CLAUDE_CODE_DISABLE_BACKGROUND_TASKS: '1',
+  BASH_DEFAULT_TIMEOUT_MS: '900000',
+  BASH_MAX_TIMEOUT_MS: '900000',
+});
+
 function die(code, message) {
   process.stderr.write('[KODJO_V2] ' + code + ': ' + message + '\n');
   return 1;
@@ -810,6 +819,7 @@ function main() {
     const claudeEnv = {
       ...process.env,
       KODJO_MUTATION_SCOPE_JSON: JSON.stringify(request.scope_allow),
+      ...CLAUDE_FOREGROUND_CHECK_ENV,
     };
     assertLiveTarget();
     const claudeStartedMs = Date.now();
@@ -1035,5 +1045,5 @@ module.exports = {
   extractClaudeResultText, extractImplementationStopStatus, IMPLEMENTATION_STOP_STATUSES,
   readRecoveryCandidate, payloadDigest, writePublishablePathspec,
   certificationStopAfterRecoveryEnabled,
-  RECOVERY_SCHEMA, LEGACY_MARKER_SCHEMA,
+  RECOVERY_SCHEMA, LEGACY_MARKER_SCHEMA, CLAUDE_FOREGROUND_CHECK_ENV,
 };
diff --git a/tests/kodjo/claude-foreground-checks.pilot.js b/tests/kodjo/claude-foreground-checks.pilot.js
new file mode 100644
index 00000000..cb23d6c8
--- /dev/null
+++ b/tests/kodjo/claude-foreground-checks.pilot.js
@@ -0,0 +1,25 @@
+'use strict';
+// PRE-1 runs 36924289392, 36925812691 and 36929974315 ended while the full jest check had been
+// auto-moved to the background: in non-interactive mode the session closes with the model's turn,
+// so the result was never observed. The implementer environment must keep checks in the foreground.
+const test=require('node:test');
+const assert=require('node:assert/strict');
+const fs=require('node:fs');
+const path=require('node:path');
+const {CLAUDE_FOREGROUND_CHECK_ENV}=require('../../scripts/kodjo/run-local-claude');
+
+test('background tasks are disabled and the Bash timeout exceeds a full check run',()=>{
+  assert.equal(CLAUDE_FOREGROUND_CHECK_ENV.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS,'1');
+  assert.ok(Number(CLAUDE_FOREGROUND_CHECK_ENV.BASH_DEFAULT_TIMEOUT_MS)>=600000);
+  assert.equal(CLAUDE_FOREGROUND_CHECK_ENV.BASH_MAX_TIMEOUT_MS,CLAUDE_FOREGROUND_CHECK_ENV.BASH_DEFAULT_TIMEOUT_MS);
+  assert.ok(Object.isFrozen(CLAUDE_FOREGROUND_CHECK_ENV));
+});
+
+test('the implementer process environment receives these variables after the inherited environment',()=>{
+  const src=fs.readFileSync(path.join(__dirname,'..','..','scripts','kodjo','run-local-claude.js'),'utf8').replace(/\r\n/g,'\n');
+  const m=/const claudeEnv = \{\n([\s\S]*?)\n    \};/.exec(src);
+  assert.ok(m,'claudeEnv literal missing');
+  const lines=m[1].split('\n').map(l=>l.trim());
+  assert.ok(lines.indexOf('...CLAUDE_FOREGROUND_CHECK_ENV,')>lines.indexOf('...process.env,'),'foreground env must override inherited values');
+  assert.match(src,/command\(claudeBin, \[\.\.\.claudePrefix, \.\.\.args\], repoRoot, claudeEnv,/);
+});
```

### Tests et preuves

- `tests/kodjo/claude-foreground-checks.pilot.js` : 2/2 PASS (valeurs, objet gelé, ordre de fusion dans `claudeEnv`, passage de `claudeEnv` au lancement de Claude).
- Suite pilote KODJO (`node --test tests/kodjo/*.pilot.js`) : 846 tests, 828 PASS, 14 échecs **identiques à la base** avant correctif (échecs préexistants, sans rapport).
- Exécution réelle après correctif : run [36932540055](https://github.com/MyUncried/Application-Routine/actions/runs/36932540055) — `IMPLEMENTED_AND_VERIFIED`, 25 tours, 691 s ; le modèle a lu les résultats et corrigé le test (« All three checks are green »), jest 1 262/1 262, typescript et lint PASS ; PR #279.
- Limite de preuve : l'environnement effectivement transmis n'est pas journalisé dans `invocation.json` ; la preuve d'effet est comportementale (même tâche, échec trois fois avant, réussite au premier run après) et par le test statique du lanceur.

### Propre à V2 / à vérifier par VNext

- Propre à V2 : le nom et la structure de `run-local-claude.js`, l'exécuteur `KODJO_CHECK_RUNNER`, la valeur 900000 (calibrée sur la suite jest de ce dépôt, < `max_duration_seconds` 3600 de la requête).
- Potentiellement applicable à VNext : tout lancement de Claude Code **non interactif** dont le modèle exécute lui-même des commandes longues via Bash.
- Questions pour VNext : (1) VNext lance-t-il Claude Code en `-p`/SDK avec l'outil Bash ? (2) Une commande attendue par le modèle peut-elle dépasser 120 s ? (3) L'environnement du processus Claude est-il construit par le lanceur (où injecter les variables) ou par un `settings.json` `env` (prioritaire sur l'environnement du processus selon la documentation Claude Code) ? (4) Le délai maximal choisi reste-t-il inférieur au budget de durée du run ?

---

## Correctif 2 — Publication Routine Dev jamais déclenchée après une revue lancée par la file V2

### Cause exacte et conditions de déclenchement

- Après une revue d'implémentation réussie, `.github/workflows/kodjo-routine-dev-environment-sync.yml` publie le HEAD exact sur le canal EAS `review` de Routine Dev (contrôle sur appareil avant `VISUAL_APPROVED`).
- Avant correctif, ce workflow ne démarrait que sur `workflow_run` (achèvement de « KODJO — Generic Slice Implementation Review ») ou par appel `workflow_call` depuis le routeur de commentaires (`kodjo-v2-comment-router.yml`, chemin `issue_comment`).
- Sur le chemin V2 actuel, la Lean Queue déclenche la revue par `repository_dispatch` (`event_type=kodjo_implementation_ready`) émis avec le jeton du workflow ; le run de revue a pour acteur `github-actions[bot]`.
- **Constaté** (non démontré par la documentation dans ce compte rendu) : aucun run de la synchronisation n'a été créé pour ces revues ; le dernier run de `kodjo-routine-dev-environment-sync.yml` date du 2026-09-29 alors que les revues #276 à #279 ont été exécutées (par exemple revue [36937105726](https://github.com/MyUncried/Application-Routine/actions/runs/36937105726), événement `repository_dispatch`, acteur `github-actions[bot]`). La règle GitHub connue selon laquelle les événements produits avec `GITHUB_TOKEN` ne créent pas de nouveaux runs (hors `workflow_dispatch`/`repository_dispatch`) est cohérente avec ce constat.
- Conditions : revue déclenchée par un événement émis avec le jeton du workflow + publication chaînée uniquement par `workflow_run`.

### Correctif — LIVRÉ ET VÉRIFIÉ (déclenchement explicite)

- Commit `8c5650f0` (`fix(kodjo): allow Routine Dev sync for a named completed review run`), option B approuvée par Hermann.
- Fichiers : `.github/workflows/kodjo-routine-dev-environment-sync.yml`, `tests/kodjo/environment-sync-sidecars.pilot.js`.
- Effet : ajout d'un déclencheur `workflow_dispatch` avec `review_run_id` et `review_run_attempt` obligatoires ; condition du job étendue à cet événement. Aucune permission d'écriture, aucun nouveau `repository_dispatch`.

Diff exact :

```diff
diff --git a/.github/workflows/kodjo-routine-dev-environment-sync.yml b/.github/workflows/kodjo-routine-dev-environment-sync.yml
index cc35d555..51669ca0 100644
--- a/.github/workflows/kodjo-routine-dev-environment-sync.yml
+++ b/.github/workflows/kodjo-routine-dev-environment-sync.yml
@@ -14,6 +14,19 @@ on:
   workflow_run:
     workflows: ["KODJO — Generic Slice Implementation Review"]
     types: [completed]
+  # A review dispatched by the V2 Lean Queue with the workflow token
+  # does not raise workflow_run. The exact completed review run is then named explicitly; the
+  # resolver still requires that run, its success and its single IMPLEMENTATION_REVIEW_OUTPUT.
+  workflow_dispatch:
+    inputs:
+      review_run_id:
+        description: "Completed implementation review run id"
+        required: true
+        type: string
+      review_run_attempt:
+        description: "Attempt of that review run"
+        required: true
+        type: string
 
 permissions:
   actions: read
@@ -27,7 +40,7 @@ concurrency:
 
 jobs:
   sync:
-    if: (github.event_name == 'workflow_run' && github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.head_repository.full_name == github.repository) || (github.event_name == 'issue_comment' && inputs.review_run_id == format('{0}', github.run_id) && inputs.review_run_attempt == format('{0}', github.run_attempt))
+    if: (github.event_name == 'workflow_run' && github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.head_repository.full_name == github.repository) || (github.event_name == 'issue_comment' && inputs.review_run_id == format('{0}', github.run_id) && inputs.review_run_attempt == format('{0}', github.run_attempt)) || (github.event_name == 'workflow_dispatch' && inputs.review_run_id != '' && inputs.review_run_attempt != '')
     runs-on: ubuntu-latest
     timeout-minutes: 30
     env:
diff --git a/tests/kodjo/environment-sync-sidecars.pilot.js b/tests/kodjo/environment-sync-sidecars.pilot.js
index d4c41d28..fb6face9 100644
--- a/tests/kodjo/environment-sync-sidecars.pilot.js
+++ b/tests/kodjo/environment-sync-sidecars.pilot.js
@@ -258,3 +258,10 @@ test('qualification-only changes never request an environment update; mixed prod
   assert.equal(classify(['tests/kodjo-prod-qualif/e2e-sum.ts','package-lock.json']).status,'NATIVE_REBUILD_REQUIRED');
   assert.notEqual(classify(['tests/kodjo-prod-qualif/../../src/foo.ts']).status,'NO_ENVIRONMENT_UPDATE');
 });
+
+test('environment sync: a completed review dispatched by the V2 Lean Queue can be named explicitly',()=>{
+  const reviewSync=read('.github/workflows/kodjo-routine-dev-environment-sync.yml');
+  assert.match(reviewSync,/workflow_dispatch:\n    inputs:\n      review_run_id:\n[\s\S]*?required: true\n[\s\S]*?review_run_attempt:\n[\s\S]*?required: true/);
+  assert.match(reviewSync,/\(github\.event_name == 'workflow_dispatch' && inputs\.review_run_id != '' && inputs\.review_run_attempt != ''\)/);
+  assert.match(reviewSync,/resolve-review-run-environment-sync\.js "\$GITHUB_REPOSITORY" "\$\{\{ github\.event\.workflow_run\.id \|\| inputs\.review_run_id \}\}"/);
+});
```

### Déclenchement avant / après

| | Avant | Après |
|---|---|---|
| Revue lancée par commentaire (routeur) | `workflow_call` depuis le routeur | inchangé |
| Revue lancée par un événement utilisateur | `workflow_run` | inchangé |
| Revue lancée par la Lean Queue (`repository_dispatch`, jeton du workflow) | **aucun déclenchement** | `workflow_dispatch` explicite avec l'identité du run de revue terminé |

### Liaison au commit exact approuvé

Inchangée par le correctif : `scripts/kodjo/resolve-review-run-environment-sync.js` exige l'identité exacte du run et de sa tentative, un run terminé avec succès, issu de `kodjo-slice-implementation-review.yml` (ou du routeur), d'événement `issue_comment` ou `repository_dispatch`, et un unique commentaire `[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT` publié par `github-actions[bot]` pendant ce run et portant `source_review_run_id`/`source_review_run_attempt` ; il en dérive PR, branche, `base_head` et `application_head`. Le workflow extrait ensuite ce HEAD exact, vérifie `git rev-parse HEAD`, classe la compatibilité OTA/natif, et publie avec le message et le `gitCommitHash` du HEAD.

### Tests et preuves

- `tests/kodjo/environment-sync-sidecars.pilot.js` : nouveau test (déclencheur, condition, appel du résolveur) ; fichier 15 PASS, 0 FAIL, 1 ignoré ; test existant conservé (pas de `repository_dispatch`, pas de permission d'écriture dans ce workflow).
- Suite pilote : 847 tests, 829 PASS, 14 échecs identiques à la base.
- `validate-workflows` : OK.
- Résolveur exécuté localement sur la revue réelle 36937105726 : `REVIEW_RUN_SYNC_READY`, PR #279, `application_head=8c632ef99aaacccfd479b1c4982f8f4c385cf236`, `applicable=true`.
- Publication réelle : run [36938795033](https://github.com/MyUncried/Application-Routine/actions/runs/36938795033) (`workflow_dispatch`, `review_run_id=36937105726`, attempt 1) — succès ; compatibilité `OTA_COMPATIBLE` (aucun fichier natif sensible ; rebuild natif ignoré) ; EAS update `01a0f9b8-7bc6-7e15-8ce8-ed4f883192db`, groupe `aae9c275-d82f-4f15-829d-5618e808fc6a`, branche `review`, plateforme `ios`, runtime `1.0.0`, `gitCommitHash=8c632ef99aaacccfd479b1c4982f8f4c385cf236`, créé le 2026-10-01T23:06:52Z ; artefact `routine-dev-sync-36938795033-1`.

### PROPOSÉ (non réalisé)

- Le déclenchement **automatique** après une revue lancée par la file n'est pas rétabli : il faut aujourd'hui lancer explicitement la synchronisation. Un appel depuis le run de revue lui-même ne fonctionne pas tel quel, car le résolveur exige un run de revue **terminé**. Pistes non décidées : déclencher la synchronisation depuis l'orchestrateur après observation de la fin de la revue, ou faire émettre l'événement de revue par une identité autre que le jeton du workflow.

### Propre à V2 / à vérifier par VNext

- Propre à V2 : noms des workflows, `event_type=kodjo_implementation_ready`, format `IMPLEMENTATION_REVIEW_OUTPUT`, résolveur et canal EAS `review` de Routine Dev.
- Potentiellement applicable à VNext : toute publication ou étape aval chaînée par `workflow_run` (ou par un autre événement) derrière un run lui-même déclenché avec le jeton du workflow.
- Questions pour VNext : (1) Comment son étape de publication sur appareil est-elle déclenchée, et par quelle identité l'étape amont est-elle lancée ? (2) Existe-t-il des revues approuvées sans run de publication correspondant (comparer les listes de runs) ? (3) Si un déclenchement explicite est ajouté, la publication reste-t-elle liée au run approuvé et au HEAD exact par un résolveur indépendant de l'entrée fournie ?

---

## État Git et suite PRE-1

- Commits de ce compte rendu : `c6bda99c`, `8c5650f0` (correctifs) ; rapport principal mis à jour dans la mission PRE-1.
- PRE-1 : PR #279 approuvée (revue 5942234941) et publiée sur Routine Dev ; reste le contrôle visuel de Hermann sur appareil puis `VISUAL_APPROVED`. Le `DEVICE_CHECK` de `REQ-B89A1B7A4F23FA8B` reste non exécuté par dérogation et n'est pas couvert par `VISUAL_APPROVED`.
