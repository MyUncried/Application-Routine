J'ai terminé la revue. Lecture seule stricte : uniquement `Read`, `Glob`, `Grep` — aucun fichier, aucune décision, aucun test, aucune relance.

# Revue indépendante de stabilisation VNext — candidat `cc35919d408759ee26c2e37033ba85374fad37f1`

## Base de preuve réellement lue

| Élément | État |
|---|---|
`qualification/vnext-controls-Linux.txt` | lu — `tests 339 / pass 339 / fail 0 / skipped 0`, `duration_ms 42782` (l. 2061-2068) |
`qualification/vnext-controls-Windows.txt` | lu — `tests 339 / pass 339 / fail 0 / skipped 0`, `duration_ms 382713` (l. 1646-1653) |
Recherche `^(not ok|✖)` sur les deux artefacts | 0 occurrence |
Normatif | `CLAUDE.md`, `.github/AI_ORCHESTRATION.md`, `KODJO_PROTOCOL_VNEXT_SPEC.md` §2 |
Matrice / rapport | `KODJO_VNEXT_STABILIZATION_TRACE.md`, `reports/2026-10-06_VNEXT_STABILIZATION.md` |
Preuve historique du dernier parcours réel | `task2/no-browser-20261006/runtime-result-37491799216/{status.json, plan-review.json}` — **les 4 findings réels lus intégralement** |
Modules | `qualify-vnext-figma-real-path.js`, `qualify-vnext-stabilization-audit.js`, `vnext-disposable-functional-contract.js`, `vnext-live-chain.js`, `vnext-review-process.js`, `vnext-figma-implementation-review.js`, `vnext-figma-recipe.js`, `vnext-figma-source.js`, `vnext-github-qualification.js`, `execution-lock.js`, `audit-convergence-contract.js`, `ui-atomicity-contract.js` |
Tests | `vnext-functional-coherence`, `vnext-figma-real-supervisor`, `vnext-figma-launch-review`, `vnext-campaign-sequence`, `vnext-review-process`, `vnext-transport-security` |
Workflows | `kodjo-vnext-proof-stability.yml`, `kodjo-vnext12-disposable.yml` |

**Limite de preuve de cette revue, à retenir avant tout le reste** : `Bash` est refusé, donc je n'ai aucun accès à `git`. Les diffs de `c1ea9aef`, `b0bf7edf`, `187b8846`, `f15aa64e` ne sont **pas** vérifiables par moi. Je n'ai vérifié que l'**état final** de l'arbre et le contenu des rapports conservés. Toute attribution au niveau du commit reste donc, pour cette revue, **démontrée par rapport conservé** et non par observation directe.

## Conformité aux décisions utilisateur non réinterprétables — vérifiée

- Recherche indépendante `puppeteer|playwright|headless|chromium|getBoundingClientRect|browser` sur l'arbre : **aucune occurrence exécutable** dans `scripts/` ni `tests/`. Seuls `package-lock.json` (dépendances Expo sans rapport) et des chaînes de diagnostic dans des preuves historiques conservées.
- `scripts/kodjo/lib/vnext-figma-browser-observer.js` et son pilote : absents (vérifié par `Glob` et par le garde `vnext-figma-real-supervisor.pilot.js:27`).
- Aucun `VISUAL_COMPARE` dans le plan du banc : `scopedPacket` (driver l. 32) force toutes les décisions Figma à `OBSERVED_ONLY`, donc `vnext-figma-source.validateCoverage:211` (`VISUAL_COMPARE` obligatoire pour toute décision `REALIZE`/`PRESERVE`) ne s'applique plus. Asserté par `vnext-functional-coherence.pilot.js:19`.
- `visual_proof_expected = NOT_APPLICABLE_FOR_PROTOCOL_TEST`, `visual_validation = NOT_EXECUTED_USER_ONLY`. Aucun gate visuel humain dans le chemin exécutable.
- Séquence : `architecture-audit` porte `needs: qualification` (matrice Linux+Windows) et le driver revérifie `QUALIFICATION_RESULT==='success'`. `historical-equivalence` est `SKIPPED` sur `create`. `kodjo-vnext12-disposable.yml` n'a pas de déclencheur `create`. Pas de trois runs concurrents.
- Budget 2 h : `CLAUDE_TIMEOUT_MS = 7200000` partout ; un timeout produit `ETIMEDOUT` + `VNEXT_LIVE_PROCESS_FAILED`, jamais une approbation (`vnext-review-process.pilot.js:19-29`), et `recoverReview` refuse tout `process_result` incomplet sans rappeler le modèle.
- Aucun développement applicatif, publication, tâche 3, PRE-1 ni cutover dans ce candidat : `permissions: contents: read`, `persist-credentials: false`, tokens supprimés, `final_audit_authorized:false`, `pre1_in_scope:false`.

## Clôture des 4 findings du run 37491799216 — confrontée au code

| Finding réel | Statut sur `cc35919d` |
|---|---|
`FND-b55cc9c6` TEST_GAP, bloquant (ordre cache/sentinelle) | **Fermé.** `EXPECTED` (contrat l. 6) décrit maintenant exactement l'ordre de `preservation()` (l. 11-24) : vider les deux caches, re-`require` le partagé, `require` Screen, identité normale ; puis vider **seulement** Screen, poser la sentinelle, re-`require` Screen. Le partagé n'est plus vidé entre pose de sentinelle et rechargement. |
`FND-dd91d4b3` SUGGESTION, non bloquant (CREATE/MODIFY) | **Fermé par l'option 2 explicitement offerte par le reviewer** : `BINDING.justification` (driver l. 11) borne CREATE au symbole `toggle()`. Le défaut mécanique sous-jacent subsiste → ISR-09. |
`FND-e8b0b3a9` PROOF_GAP, bloquant (conservation sans preuve indépendante) | **Substance fermée.** `runDeliveredTests` l. 95 pose `receipt.preservation_probe = assertDelta(...)`, exécuté par l'orchestration dans un processus enfant propre ; `observe` l. 77 exige `status==='PASS' && normal_identity===true && sentinel_identity===true`. Un exit 0 ne suffit plus. Résidu de forme → ISR-04. |
`FND-ec01aaef` PROOF_GAP, bloquant (liaison des scénarios) | **Partiellement fermé.** Le texte d'obligation (`vnext-figma-recipe.js:27`) lie désormais explicitement premier appel → `toggle-off-on`, second → `toggle-on-off`, même instance, un seul processus. Mais l'interdiction demandée n'est pas calculée → **ISR-01, le point le plus important de cette revue.** |

## Findings

### ISR-01 — `toggle-on-off` peut encore être attesté PASS sans transition off→on observée
- **Règle et autorité** : `required_correction` de `FND-ec01aaefa78bf87b8b316025`, finding **bloquant** de la revue indépendante conservée du run 37491799216 : « *recording a proof_result for toggle-on-off from any call not preceded by an observed off->on call in the same process must be forbidden* ». Renforcée par VNX-10 (spec) et par la ligne « *Première true puis deuxième false, sinon refus* » de la matrice.
- **Cible** : `scripts/kodjo/lib/vnext-disposable-functional-contract.js:9`.
- **Preuve lue** : `scenarios:{'toggle-off-on':first===true,'toggle-on-off':second===false}`. Les deux scénarios sont évalués indépendamment.
- **Contre-exemple** : `NEGATIVE_FUNCTIONAL_FAULT` (`toggle = () => false`) donne `first=false, second=false` → `toggle-off-on:false`, `toggle-on-off:true`. Ce n'est pas une hypothèse : `tests/kodjo/vnext-figma-real-supervisor.pilot.js:22` **asserte** `['FAIL','PASS']`.
- **Classe** : TROU_ARCHITECTURAL (résidu littéral d'un finding bloquant antérieur).
- **Bloquant pour cette phase : NON.** Aucune règle en vigueur ne l'impose, et le dossier global est refusé via `VNEXT_FIGMA_REVIEW_SCENARIO_NOT_PASSED` sur `toggle-off-on`. Je ne transforme pas cela en réserve. Mais c'est l'élément que je considère le plus susceptible de provoquer un nouveau REVISE : le même reviewer avait déjà qualifié exactement ce point de « *permits a false PASS* » et l'avait classé bloquant.
- **Origine** : démontrée — propriété du contrat créé par cette stabilisation ; la correction demandée a été reportée dans le texte du plan, pas dans le calcul.
- **Correction minimale** : `'toggle-on-off': first===true && second===false`.
- **Test négatif de fermeture** : injecter `toggle:()=>false` et asserter `['FAIL','FAIL']` (remplace l'assertion `['FAIL','PASS']` existante).

### ISR-02 — `module_instances` et `call_order` sont des littéraux, pas des observations
- **Règle et autorité** : matrice, ligne « `execution.json` : ordre, nombre d'instances » ; mission : « Distinguer référence déterministe, reviewer injecté, processus Node réellement exécuté ».
- **Cible** : même ligne 9.
- **Preuve lue** : `module_instances:1` et `call_order:['toggle-off-on','toggle-on-off']` sont codés en dur. Seuls `returned_values` sont mesurés.
- **Contre-exemple** : un observateur qui relancerait un processus par scénario émettrait le même `module_instances:1`. Le reviewer lisant `execution.json` ne peut pas distinguer une mesure d'une affirmation — c'est précisément la confusion que `FND-ec01aaef` reprochait.
- **Classe** : PREUVE_MANQUANTE. **Bloquant : NON** (la propriété est vraie par construction dans le code actuel).
- **Origine** : démontrée, introduite avec le contrat.
- **Correction minimale** : enregistrer `process.pid`, `require.resolve(screenPath)` et le nombre réel d'entrées `require.cache` correspondantes.
- **Test négatif** : sonde rechargeant Screen entre les deux appels → `module_instances !== 1` et refus.

### ISR-03 — `compare`/`Review.prepare` n'exigent pas le reçu du test livré
- **Règle et autorité** : matrice, ligne « Test livré distinct du contrôle indépendant de conservation — *Un test vide ne suffit pas* ».
- **Cible** : `qualify-vnext-figma-real-path.js:74` (`if(nodeTestReceipt)`) et `vnext-figma-implementation-review.js:25-55`.
- **Preuve lue** : `observe` ne valide le reçu **que s'il est fourni** ; `prepare` ne lit jamais `node_test_receipt`. `vnext-figma-real-supervisor.pilot.js:22` et `vnext-functional-coherence.pilot.js:39` appellent `observe`/`compare` **sans** reçu et obtiennent un dossier structurellement complet.
- **Contre-exemple** : avec un `Screen` conforme et sans reçu, `compare` puis `Review.prepare` produisent un dossier approuvable alors que ni le test livré ni la sonde de conservation n'ont été exécutés. La garantie repose uniquement sur l'ordre d'appel du driver.
- **Classe** : TROU_ARCHITECTURAL. **Bloquant : NON** — `initial()` passe toujours le reçu (l. 121 et l. 129).
- **Origine** : démontrée, propriété du nouveau câblage.
- **Correction minimale** : rendre le reçu obligatoire dans `observe`, hors chemin négatif explicitement paramétré.
- **Test négatif** : `compare` sans reçu sur une implémentation conforme doit lever (`VNEXT_FUNCTIONAL_GATE_RECEIPT_REQUIRED`).

### ISR-04 — La conservation n'entre pas dans la couverture obligatoire du reviewer
- **Règle et autorité** : option (a) de `required_correction` de `FND-e8b0b3a9` (bloquant) : « *records it as an observed proof_result* » ; matrice, « Le reviewer peut effectivement lire les preuves annoncées ».
- **Cible** : `vnext-figma-implementation-review.js:55` (dossier) et `:58-64` (`validateAssessment`).
- **Preuve lue** : `assertion_ids`, `scenario_ids` et `consulted_resource_sha256` ne contiennent aucune entrée de conservation. La sonde n'existe que dans `node_test_receipt.preservation_probe`, hors `measurements` et `scenarioResults`, donc hors `actualFact`.
- **Contre-exemple** : un reviewer couvrant exactement les trois ensembles requis peut APPROVE sans jamais lire `preservation_probe`.
- **Classe** : TROU_ARCHITECTURAL (résidu de forme ; la substance est close par ISR-04 ≠ faux PASS). **Bloquant : NON** — `observe` échoue fermé si la sonde n'est pas PASS, donc aucun faux PASS n'atteint le reviewer.
- **Origine** : démontrée.
- **Correction minimale** : déclarer une ligne d'observation avec `value_path:['node_test_receipt','preservation_probe','sentinel_identity']` pour la faire entrer dans la couverture obligatoire.
- **Test négatif** : falsifier `sentinel_identity:false` dans l'artefact → `VNEXT_FIGMA_REVIEW_FACT_MISMATCH` et couverture incomplète.

### ISR-05 — `codeFingerprint` exclut une entrée exécutable réellement lue au runtime
- **Règle et autorité** : `AI_ORCHESTRATION.md` §Contrôles déterministes, « intégrité des fichiers matérialisés » ; matrice, « Qualification exacte ».
- **Cible** : `lib/vnext-github-qualification.js:48-49`.
- **Preuve lue** : l'empreinte couvre `scripts/kodjo`, `tests/kodjo`, `.github/workflows` et `KODJO_VNEXT_REMOTE_WRITE_POLICY.json`. Or le driver lit à l'exécution `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/frozen-source.json` (l. 103 et l. 136), fichier qui détermine le paquet, les requirements et donc le plan généré. `tests/kodjo/vnext-transport-security.pilot.js:97-107` ne teste qu'un changement sous `scripts/kodjo`.
- **Contre-exemple** : un head contrôleur portant un `frozen-source.json` différent du head qualifié est accepté `EXACT_SAME_PROTOCOL_CODE` et exécuté sans qualification propre.
- **Classe** : TROU_ARCHITECTURAL. **Bloquant : NON** — pour la relance prévue le delta contrôleur se limite à `request.json`, ce que le contrôleur peut constater directement.
- **Origine** : **indéterminée** quant à la date d'introduction (git inaccessible à cette revue) ; présence démontrée dans le candidat.
- **Correction minimale** : ajouter `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones` à la liste de `git ls-tree`.
- **Test négatif** : `commit-tree` modifiant `frozen-source.json` → `verifyExecutionQualifications` doit exiger `controller_qualification_run_id`.

### ISR-06 — Budget par appel (2 h) supérieur au budget du job qui contient cinq appels
- **Règle et autorité** : décision utilisateur du 6 octobre (« deux heures par appel ; un timeout est un échec d'exécution à diagnostiquer ») ; `AI_ORCHESTRATION.md` §`ORCHESTRATION_FAILURE`.
- **Cible** : `kodjo-vnext12-disposable.yml:276` (`timeout-minutes: 120`) contre `vnext-live-chain.js:29`.
- **Preuve lue** : `initial()` effectue **cinq** appels réels à 2 h chacun — revue de plan (l. 114), implémentation (l. 119), revue initiale (l. 121), correction (l. 127), revue corrigée (l. 129). Le job qui les contient dispose de 120 min au total. Par contraste, `architecture-audit` est à 125 min pour **un** appel : cohérent.
- **Contre-exemple** : un seul appel atteignant son budget déclenche l'annulation du job. L'échec se présente alors comme une annulation GitHub et non comme le `ETIMEDOUT` diagnosticable du superviseur, et les preuves `if: always()` sont au mieux partielles puisque l'étape en cours est interrompue.
- **Classe** : TROU_ARCHITECTURAL (cohérence de budget). **Bloquant : NON** — le dernier parcours réel a consommé 408 768 ms, très en dessous.
- **Origine** : démontrée dans le candidat.
- **Correction minimale** : aligner `figma-initial.timeout-minutes` sur la somme réellement autorisée, ou déclarer explicitement un budget par appel inférieur pour ce job. Toute baisse du budget 2 h relèverait de l'utilisateur.
- **Test négatif** : assertion de workflow exigeant `timeout-minutes ≥ nombre d'appels × budget` pour les jobs invoquant le driver.

### ISR-07 — Deux tests cités par la matrice sont absents de la qualification qui conditionne cette revue
- **Règle et autorité** : matrice, ligne « Reprise sans double appel ni double publication — `vnext12-supervisor`, `vnext12-revision-supervisor` » ; mission, « les qualifications Linux et Windows du même SHA doivent réussir avant cette invocation ».
- **Cible** : `kodjo-vnext-proof-stability.yml:68`, glob `tests/kodjo/vnext-*.pilot.js`.
- **Preuve lue** : `tests/kodjo/vnext12-supervisor.pilot.js` et `vnext12-revision-supervisor.pilot.js` existent (vérifié par `Glob`) mais ne sont pas matchés par `vnext-*` (le tiret suit immédiatement `vnext`). `historical-equivalence`, qui exécute `tests/kodjo/*.pilot.js`, est `SKIPPED` sur `create` (l. 84, asserté par `vnext-campaign-sequence.pilot.js:30`). Les 339 tests que j'ai lus correspondent donc au seul sous-ensemble `vnext-*`.
- **Contre-exemple** : la ligne « reprise / verrou » de la matrice s'appuie, dans la base de preuve de **cette** revue, sur deux tests non exécutés.
- **Classe** : PREUVE_MANQUANTE. **Bloquant : NON** — ces deux fichiers sont exécutés par `select-stage` (`kodjo-vnext12-disposable.yml:41`) avant toute exécution réelle. La garantie existe sur le chemin de relance ; elle manque dans ma base de preuve.
- **Origine** : démontrée (motif de glob).
- **Correction minimale** : `tests/kodjo/vnext*.pilot.js`.
- **Test négatif** : assertion vérifiant que chaque test cité par la matrice appartient au glob de qualification.

### ISR-08 — Le plan généré et `execution.json` ne sont pas accessibles à cette revue
- **Règle et autorité** : mission, « Vérifier le plan généré et le dossier `execution.json`, pas seulement les noms de tests » ; « Une preuve historique absente reste NON VERIFIABLE ».
- **Cible** : `stabilization-input.json` ; `qualify-vnext-stabilization-audit.js:15-21`.
- **Preuve lue** : le manifeste ne contient que les deux journaux de contrôles et l'inventaire des fichiers suivis. Aucun `approved-plan.md`, `execution.json`, `functional-test-*.json`. La référence déterministe est produite dans des répertoires temporaires supprimés par `t.after(() => fs.rmSync(...))`.
- **Contre-exemple** : j'ai vérifié la structure d'`execution.json` et le texte des obligations **par lecture du code générateur et des assertions de tests**, non par lecture d'un artefact produit. Toute affirmation de ma part sur « le plan réellement généré » est donc une inférence de code, pas une observation d'artefact. Je le déclare explicitement plutôt que de le présenter comme vérifié.
- **Classe** : PREUVE_MANQUANTE. **Bloquant : NON** pour la phase.
- **Origine** : démontrée (conception de la voie d'audit).
- **Correction minimale** : faire émettre par la qualification un dossier de référence (plan + `execution.json` + reçu) et l'ajouter au manifeste. **Proposition seulement** — en faire une condition d'admission du driver d'audit serait une obligation nouvelle nécessitant une autorisation.
- **Test négatif** : conditionné à cette autorisation.

### ISR-09 — `component_decision: CREATE` n'est pas recoupé avec `change_kind: MODIFY`
- **Règle et autorité** : `FND-dd91d4b33dbc8eec37414d51`, **non bloquant** à l'origine ; VNX-08.
- **Cible** : `lib/ui-atomicity-contract.js:209`.
- **Preuve lue** : seul `selected_component_candidate_id === null` est exigé sous CREATE. Le reviewer précédent avait lui-même écrit : « *no rule relates component_decision to the impact change_kind, so the inconsistency is invisible to the mechanical gate* ». L'option textuelle a été retenue ; la règle mécanique reste absente.
- **Contre-exemple** : un CREATE coexiste avec un ImpactGraph intégralement MODIFY sur candidats `GIT_TREE`, sans refus.
- **Classe** : RECOMMANDATION. **Bloquant : NON** — non bloquant à l'origine, et la correction retenue est l'une des deux que le reviewer avait explicitement proposées.
- **Origine** : pré-existante au contrat UI générique ; date **indéterminée**.
- **Correction minimale** : refuser CREATE quand tous les impacts de l'exigence sont MODIFY sur `GIT_TREE`, ou exiger un `CREATE_SLOT`.
- **Test négatif** : critère CREATE avec impacts uniquement MODIFY → refus.

### ISR-10 — Le garde anti-navigateur ne couvre qu'un fichier
- **Règle et autorité** : `CLAUDE.md` §Validation visuelle du 6 octobre ; spec §Périmètre des tests.
- **Cible** : `tests/kodjo/vnext-figma-real-supervisor.pilot.js:27`.
- **Preuve lue** : la regex ne s'applique qu'à `qualify-vnext-figma-real-path.js`, plus l'absence de deux fichiers nommés. Ma recherche indépendante sur l'arbre entier confirme l'état courant conforme.
- **Contre-exemple** : une réintroduction dans `vnext-figma-implementation-review.js` ou dans un module neuf ne serait pas détectée par le garde.
- **Classe** : RECOMMANDATION. **Bloquant : NON** — état courant vérifié conforme.
- **Correction minimale** : appliquer le garde à `scripts/kodjo` et `tests/kodjo` entiers, avec exceptions explicites pour les preuves historiques conservées.
- **Test négatif** : fixture ajoutant un require de navigateur dans un autre module → refus.

### ISR-11 — Contrôle de dimensions PNG dans la validation de source : classification à acter
- **Règle et autorité** : décision utilisateur, « aucun contrôle automatique de rendu, géométrie, pixels ou captures ».
- **Cible** : `lib/vnext-figma-source.js:77-80`.
- **Preuve lue** : comparaison de `width`/`height` lus dans l'en-tête IHDR de la capture **gelée** aux propriétés du frame **gelé**. Exécuté sur `frozen-source.json` via `precheck` (`vnext-figma-launch-review.pilot.js:53`).
- **Contre-exemple** : aucun. Rien n'est rendu ; aucune propriété de la livraison n'est mesurée. C'est une cohérence interne d'un instantané déjà en Git.
- **Classe** : PREFERENCE / clarification documentaire. **Bloquant : NON, et je ne recommande aucune modification.** Je le signale pour qu'un reviewer ultérieur ne le « découvre » pas comme un résidu de rendu.
- **Correction minimale** : au plus une phrase dans la trace. **Test négatif** : sans objet.

### ISR-12 — Pas de verrou durable sur la voie d'audit
- **Règle et autorité** : `AI_ORCHESTRATION.md` §Mode LOCAL ; matrice, « verrou, consommation unique ».
- **Cible** : `qualify-vnext-stabilization-audit.js` (aucun `Lock.acquire`) contre `qualify-vnext-figma-real-path.js:163`.
- **Preuve lue** : exclusion assurée par `claudeProcessState()!=='NONE'`, `GITHUB_RUN_ATTEMPT==='1'`, répertoire par `GITHUB_RUN_ID` et création `wx`.
- **Contre-exemple** : deux branches d'audit créées simultanément ont des groupes de concurrence distincts (`github.ref`) ; la sérialisation repose alors sur l'unicité du runner self-hosted, qui n'est pas elle-même contrôlée.
- **Classe** : RECOMMANDATION. **Bloquant : NON** — audit en lecture seule, sans effet d'écriture.
- **Correction minimale** : `Lock.acquire` sur un chemin indépendant du run, ou groupe de concurrence constant pour la voie d'audit.
- **Test négatif** : seconde invocation concurrente → `CLAUDE_EXECUTION_ALREADY_ACTIVE`.

### ISR-13 — Lecture du résultat de contrôles par première occurrence
- **Règle et autorité** : `AI_ORCHESTRATION.md`, « Une affirmation sans preuve n'est pas une conformité ».
- **Cible** : `qualify-vnext-stabilization-audit.js:17`.
- **Preuve lue** : regex sans `g`, donc première occurrence. Sur les deux artefacts lus, les lignes de résumé sont uniques et cohérentes.
- **Contre-exemple** : une ligne antérieure contenant « fail 0 » serait retenue. L'invariant croisé `pass===tests && fail===0 && skipped===0` limite fortement l'exploitabilité, puisqu'un échec réel fait divergera `pass` de `tests`.
- **Classe** : RECOMMANDATION de faible poids. **Bloquant : NON.**
- **Correction minimale** : ancrer sur la dernière occurrence, ou utiliser un reporter structuré.
- **Test négatif** : artefact contenant un nom de test « fail 0 » et un échec réel → refus.

**Aucun de ces treize findings n'est une VIOLATION_EXISTANTE.** Je n'ai trouvé aucune infraction aux décisions utilisateur figées, ni aucun navigateur, contrôle de rendu ou gate visuel réintroduit. Aucune de mes recommandations ne doit devenir une obligation sans décision explicite.

## Conclusions séparées

### 1. Cohérence du protocole
Cohérent. La chaîne source → exigence → scope → plan → revue → approbation → exécution → correction → reprise → conservation → clôture est fermée, chaque couche échoue fermé, et la séparation des trois autorités de la matrice (protocole générique / banc / validation produit) est effectivement portée par le code et non seulement par la prose. Les décisions du 6 octobre sont écrites de façon normative en trois endroits concordants (`CLAUDE.md`, spec §2, trace) et le code les respecte. `audit-convergence-contract.js:447-455` interdit tout `FINAL_APPROVED` fabriqué : un seul critère `NON_VERIFIABLE` force `FINAL_PROOF_UNAVAILABLE_TERMINAL`. La lecture seule de cette revue est garantie par observation et non seulement par configuration : le driver recalcule l'inventaire complet `git ls-files` + `git status --porcelain --untracked-files=all` après l'appel et échoue sur `VNEXT_STABILIZATION_AUDIT_CHECKOUT_CHANGED`. Réserves de cohérence, toutes non bloquantes : ISR-05 (périmètre de l'empreinte de qualification) et ISR-06 (budgets d'appel et de job non alignés).

### 2. Fidélité du banc de test
Nettement meilleure qu'avant, avec une limite précise à nommer. Points réellement acquis : la référence déterministe génère le vrai plan via `launchAndProduce`, exécute de vrais processus Node, de vraies opérations Git, et refuse six mutations négatives distinctes ; `precheck` traverse la **vraie** `frozen-source.json` (8 450 dispositions, 6 ressources) de bout en bout sans modèle ; la distinction reviewer injecté / vrai Claude est honnêtement déclarée, et le test qui approuve utilise explicitement un `invoke` injecté. Limites : la chaîne `runDeliveredTests → observe → compare → Review.prepare` n'est exercée qu'avec le paquet **synthétique** à 5 nœuds (`vnext-functional-coherence.pilot.js:7` passe `scopedPacket(p, …)` et non `scopedPacket(original, …)`), jamais avec le paquet gelé réel ; et l'attestation par scénario reste localement falsifiable (ISR-01), avec deux champs d'`execution.json` affirmés plutôt que mesurés (ISR-02) et la conservation hors couverture obligatoire du reviewer (ISR-04). Signal de performance à tracer, sans défaut : 42,8 s sur Linux contre 382,7 s sur Windows pour les mêmes 339 tests, soit un facteur 9.

### 3. Preuves externes restant à obtenir
Toutes celles que la matrice annonce déjà comme non acquises, et elles le restent : un vrai Claude produisant une livraison conforme ; un vrai Claude lisant correctement le dossier (`consulted_resource_sha256` est recopiable depuis le dossier sans lecture effective — limite déjà déclarée dans `dossier.limits`) ; des services GitHub réels pour publication, réservation et recovery, aujourd'hui injectés ; les parcours génériques de révision, cutover et PRE-1, que le pilote Boolean ne prouve pas. S'y ajoutent, mises au jour par cette revue : les deux pilotes `vnext12-*` absents de la base de preuve de cette revue (ISR-07) ; le plan généré et `execution.json` du candidat, non conservés et donc non lisibles par moi (ISR-08) ; et l'attribution au niveau du commit de `c1ea9aef`, `b0bf7edf`, `187b8846`, `f15aa64e`, **NON VERIFIABLE** par cette revue faute d'accès à `git` — je m'appuie sur les rapports conservés, dont le contenu est cohérent avec l'état final que j'ai pu vérifier, et je ne la présente pas comme démontrée par observation directe. Le bundle de livraison du run 37491799216 n'existe dans le dépôt que par ses hachages ; les octets sont dans l'artefact 11426097501, hors de ma portée.

### 4. Possibilité de préparer UNE relance réelle
Oui, une relance réelle peut être préparée. Rien dans ce que j'ai lu ne l'interdit : les deux qualifications du SHA exact sont vertes et je les ai lues directement ; les trois findings bloquants antérieurs sont substantiellement traités ; aucune décision utilisateur n'est enfreinte ; la séquence et les verrous sont en place. Je ne conclus pas au succès de cette relance, qui n'a pas lieu pendant cette revue.

Trois éléments factuels à traiter par le contrôleur avant dépôt, qui ne sont pas des réserves de ma part mais des constats d'état : le `request.json` déposé est `QUALIFY_ONLY` et porte encore `approved_protocol_head: f15aa64e`, `qualification_run_id: 37490564500` et le `request_id: 41010699-3777-4e8c-95bc-bf98996acdee` **déjà consommé** par le run 37491799216 — une relance `FIGMA_INITIAL` exige le nouveau SHA, la qualification correspondante et un `request_id` neuf, sans quoi `claimRequest` échouera sur `EEXIST` du `started.json`. Le head contrôleur devra être le head de la PR 269 et `KODJO_FIGMA_CONTROLLER_HEAD` devra correspondre. Enfin, si le delta contrôleur touche autre chose que `request.json`, ISR-05 impose de vérifier manuellement `frozen-source.json`, que l'empreinte de qualification ne couvre pas.

Si une seule correction devait précéder cette relance, je recommanderais ISR-01, pour une raison purement empirique : c'est le résidu littéral d'un finding que le reviewer indépendant avait lui-même qualifié de bloquant et de « *permits a false PASS* », et le correctif tient en une conjonction. Ce n'est qu'une recommandation ; elle ne devient pas une obligation et ne conditionne pas la relance.

## Livraison documentaire — `DELIVERY_REPORT_GATE`

Je ne peux pas satisfaire ce gate moi-même : `Edit`, `Write` et `Bash` sont refusés par le driver et toute modification de l'arbre déclencherait `VNEXT_STABILIZATION_AUDIT_CHECKOUT_CHANGED`. Aucune `EXCEPTION EXPRESSE — AUCUN RAPPORT DE MISSION` n'a été donnée. Le présent texte est intégralement matérialisé par le driver dans `stabilization-report.md` du répertoire de preuves et préservé dans l'artefact `kodjo-vnext-architecture-37501814430-1`, mais hors dépôt et non commité.

Conformément à `CLAUDE.md`, je déclare donc cette mission **LIVRAISON INCOMPLÈTE au sens de `DELIVERY_REPORT_GATE`, et non TERMINÉE**, jusqu'à ce que le contrôleur commite le rapport préservé, par exemple sous `.github/orchestration/reports/2026-10-06_VNEXT_STABILIZATION_INDEPENDENT_REVIEW.md`, puis communique chemin, hash du commit et état Git. Tests exécutés par moi : **aucun**, par conception de cette mission en lecture seule ; les résultats de tests consignés ci-dessus sont ceux des deux artefacts de qualification que j'ai lus.