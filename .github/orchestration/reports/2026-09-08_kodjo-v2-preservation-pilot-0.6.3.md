# Pilote technique borné — conservation et reprise KODJO V2 0.6.3

| Métadonnée | Valeur |
|---|---|
| Mission | Pilote technique borné de conservation et de reprise (KODJO V2 0.6.3) |
| Date | 2026-09-08 |
| Révision | 4 — preuve réelle GitHub Actions de conservation et restauration |
| Worktree | `C:\Dev\Application-routine-kodjo-v2-pilot` |
| Branche contrôlée | `chore/kodjo-v2-pilot` |
| HEAD de départ et de fin | `f70c664558a77f8164e1fa9d7780b6f158200335` |
| Verdict | `PILOT_PASS_LOCAL` + `GITHUB_SMOKE_PASS` |
| GitHub Actions réel | **VÉRIFIÉ sur le chemin borné de conservation/restauration** — run `34286251097` |
| Adaptateur d'agent réel | `NON_VÉRIFIABLE` — aucun adaptateur borné intégré |
| Commits de preuve | `f6efd62` (pilote local), `234bd0a` (smoke test GitHub Actions) |

## 0. Statut de cette révision

La révision 1 déclarait `PILOT_PASS`. La revue indépendante a confirmé les 23 tests mais relevé trois
défauts MAJOR, corrigés en révision 2. La révision 3 ajoute un durcissement de sécurité ciblé sur l'étape
de publication. La révision 4 enregistre le smoke test GitHub Actions réel `34286251097` : l'artefact de
récupération a été téléversé avant un échec volontaire, l'étape `if: always()` a continué, puis un second
job a téléchargé l'artefact et restauré le fichier exactement. L'adaptateur d'agent réel reste hors du
périmètre vérifié.

| Correction MAJOR | État | Preuve |
|---|---|---|
| 1. Conservation réellement durable avant contrôles | **CORRIGÉE** | `recovery_upload` précède les 4 contrôles ; §4 et `T02-PRES-009`, `T02-PRES-010` |
| 2. URL et digest réels de l'artefact, reçu de publication séparé | **CORRIGÉE** | §5 et `T02-PRES-011`, `T02-PRES-012` |
| 3. Encadrement de l'adaptateur (plus de `shell:true`) + garde d'état Git | **CORRIGÉE** | §6 et les 9 tests de `adapter-guard.pilot.js` |
| 4. Sécurité de l'étape de publication (révision 3) | **CORRIGÉE** | §6bis et les 10 tests de `publication-security.pilot.js` |

## 1. Préflight contrôlé

```text
git rev-parse --show-toplevel   -> C:/Dev/Application-routine-kodjo-v2-pilot
git branch --show-current       -> chore/kodjo-v2-pilot
git rev-parse HEAD              -> f70c664558a77f8164e1fa9d7780b6f158200335
git status --short              -> (vide au préflight initial)
```

Les quatre sources normatives sont présentes dans `.github/orchestration/` et ont été lues avant toute
écriture. Aucune condition de `CLARIFICATION_REQUIRED` n'était réunie.

## 2. Fichiers créés ou modifiés

**Aucun fichier existant du dépôt n'a été modifié.** `git diff --stat` sur les fichiers suivis est vide.
38 fichiers ont été créés (29 en révision 1, 4 en révision 2, 5 en révision 3).

Workflow (1) : `.github/workflows/kodjo-v2-implementation-artifact.yml`

Scripts d'exécution (13, `publish-implementation-output.js` réécrit en révision 3) : `run-implementation-agent.js`, `git-state-guard.js` *(nouveau)*,
`preserve-implementation.js`, `verify-delivery.js`, `run-check.js`, `check-scope.js`,
`finalize-implementation-delivery.js`, `publish-implementation-output.js`, `exit-from-business-status.js`,
`restore-source-artifact.js`, `resolve-checks-to-run.js`, `scan-remote-write-capability.js`,
`validate-workflows.js`

Adaptateur de production (1) : `scripts/kodjo/adapters/no-remote-agent.js` *(nouveau)*

Bibliothèque (10) : `lib/adapters.js` *(nouveau)*, `lib/git.js`, `lib/delivery.js`, `lib/status.js`, `lib/checks.js`, `lib/tar.js`,
`lib/yaml.js`, `lib/hash.js`, `lib/json.js`, `lib/log.js`

Tests (12) : `t02-preservation.pilot.js`, `adapter-guard.pilot.js`, `publication-security.pilot.js` *(nouveau)*, `unit.pilot.js`,
`run-all.js`, `helpers/{sandbox,pipeline,fakes}.js`, `adapters/{mutating-agent,failing-publisher,recording-publisher}.js` *(2 nouveaux)*

Rapport (1) : `.github/orchestration/reports/2026-09-08_kodjo-v2-preservation-pilot-0.6.3.md`

## 3. Architecture minimale retenue

**Node.js CommonJS sans dépendance, invoqué depuis un workflow `workflow_dispatch`.**

- `jq` est absent de la machine et `python` n'est pas installé ; Node 24 est présent et le dépôt est déjà un
  projet Node ;
- `node_modules/` est absent de ce worktree : les tests utilisent `node:test`, ce qui évite de modifier
  `package.json` ou `jest.config.js`, fichiers applicatifs interdits ;
- les fichiers de test sont nommés `*.pilot.js` hors de `__tests__/`. Le `testMatch` réel de `jest-expo`
  (`node_modules/jest-expo/config/getPlatformPreset.js`, lu en lecture seule) exige `__tests__/**/*test*`,
  `__tests__/**/*spec*` ou `?(*.)+(spec|test).[jt]s?(x)` : aucun fichier du pilote ne correspond ;
- `lib/yaml.js` implémente le sous-ensemble YAML nécessaire et rejette ancres, alias et clés dupliquées ;
- `lib/tar.js` extrait `git archive` en Node : GNU tar sous Windows lit `C:/…` comme un hôte distant.

### Layout de livraison — trois artefacts, pas un

```text
delivery/
  recovery/    -> artefact kodjo-<slice>-<run>-recovery, TÉLÉVERSÉ AVANT LES CONTRÔLES
    implementation.patch, implementation.patch.sha256, modified-files.json,
    manifest.json (statut NON finalisé), development-report.md, validation.json
  integrity/   git-state-before.json, git-state-after.json, git-state.json
  checks/      jest.json, typescript.json, lint.json, scope.json
  result/      -> artefact kodjo-<slice>-<run>-result, APRÈS les contrôles
    manifest.json (statut final, URL/digest d'artefact), implementation-output.txt, summary.json
  receipt/     -> artefact kodjo-<slice>-<run>-publication-receipt, APRÈS la publication
    publication-receipt.json (CONFIRMED | FAILED | SKIPPED)
```

Le paquet `recovery/` est **immuable après son téléversement** : rien de ce qui est calculé ensuite n'y est
réécrit. C'est vérifié par test — le manifeste téléversé porte `status_finalized: false`,
`implementation_status: null` et ne contient ni `checks`, ni `failed_checks`, ni `publication`.

## 4. Correction MAJOR 1 — conservation durable avant les contrôles

**Défaut relevé.** En révision 1, `actions/upload-artifact` intervenait après Jest, TypeScript, lint et
scope : une perte du runner pendant un contrôle faisait encore perdre le patch.

**Correction.** Ordre effectif du workflow :

```text
git_state_before -> agent -> git_state_after -> preserve -> patch_check
                 -> recovery_upload   <-- artefact immuable, AVANT tout contrôle
                 -> jest -> typescript -> lint -> scope
                 -> summarize -> result_upload -> publish -> receipt_upload -> exit_status
```

Chaque contrôle est conditionné à `steps.recovery_upload.outcome == 'success'`, et non plus à la seule
validation du patch : un contrôle ne peut pas démarrer avant que l'artefact ne soit effectivement déposé.

**Preuves.**

**(a) Test structurel.** `validate-workflows.js` refuse le workflow si `recovery_upload` est absent, s'il
précède `preserve` ou `patch_check`, s'il n'est pas un `actions/upload-artifact`, s'il n'a pas
`if-no-files-found: error`, s'il n'est pas gardé par `always()`, si un contrôle le précède, ou si
`result_upload` re-téléverse `delivery/recovery/`. `T02-PRES-009` exécute cette validation **et** analyse
directement le YAML livré pour assérter `idx(recovery_upload) > idx(patch_check)` et
`idx(<contrôle>) > idx(recovery_upload)` pour les quatre contrôles.

```text
$ node scripts/kodjo/validate-workflows.js
OK   kodjo-v2-implementation-artifact.yml
```

**(b) Observation à l'exécution.** Le harnais enregistre pour chaque étape `recovery_uploaded_before`.
`T02-PRES-001` et `T02-PRES-009` assèrent que les quatre contrôles ont cette valeur à `true`, en plus du
`patch_before.sha256` déjà égal au hash final.

**(c) Perte du runner simulée — `T02-PRES-010`.** Le pipeline est interrompu juste après `recovery_upload`.
Aucun contrôle, aucune synthèse, aucune publication n'a lieu ; `result/manifest.json` n'existe pas. Le
répertoire de travail entier est ensuite **supprimé**. À partir du seul artefact conservé, le test vérifie
les cinq membres, l'égalité `patch_sha256`, `patch_validated: true`, puis restaure le patch sur un espace
vierge au `source_head` et compare le hash de **chaque** fichier déclaré. Le delta est intégralement
récupérable alors que le runner a disparu.

**(d) Reprise.** `TARGETED_FIX` télécharge l'artefact de **récupération** du run source
(`source_recovery_artifact`), et, séparément et en `continue-on-error`, l'artefact de **résultat** pour les
contrôles repris.

## 5. Correction MAJOR 2 — URL, digest et hash du patch

**Défaut relevé.** Le commentaire confondait le hash du patch et la référence d'artefact, et le statut de
publication était écrit dans un manifeste présenté comme déjà téléversé.

**Correction.** Les sorties `artifact-url`, `artifact-digest` et `artifact-id` de `recovery_upload` sont
transmises à `summarize` par variables d'environnement. Le commentaire porte trois champs distincts :

```text
artifact=<URL réelle retournée par actions/upload-artifact>
artifact_name=kodjo-<slice>-<run>-recovery
artifact_digest=<digest GitHub>
patch_sha256=<sha256 de implementation.patch>
```

`validate-workflows.js` échoue si `summarize` ne reçoit pas `KODJO_RECOVERY_ARTIFACT_URL` et
`KODJO_RECOVERY_ARTIFACT_DIGEST`, ou si l'URL ne provient pas de `steps.recovery_upload.outputs`.

**Preuve — `T02-PRES-011`.** Le test compare les champs du commentaire aux sorties de l'étape d'upload,
vérifie que `artifact` est une URL `https://github.com/…`, que `artifact_digest ≠ patch_sha256`, que
`artifact ≠ artifact_digest`, et que `patch_sha256` est bien le sha256 du fichier `implementation.patch`.
Il vérifie enfin qu'**aucune URL n'est fabriquée** lorsqu'aucun upload n'a eu lieu : `artifact=` et
`artifact_digest=` sont vides, tandis que `patch_sha256` reste renseigné.

**Reçu de publication séparé.** `publish-implementation-output.js` n'écrit plus dans le manifeste : il
produit `receipt/publication-receipt.json` avec `CONFIRMED`, `FAILED` ou `SKIPPED`, téléversé ensuite comme
artefact distinct avec `if: always()`. **Preuve — `T02-PRES-012`** : le reçu existe avec un statut de
l'énumération, `receipt_upload` suit `publish` et précède `exit_status`, et le paquet de récupération déjà
téléversé ne contient **ni** `publication.json`, **ni** clé `publication`, **ni** statut finalisé. Le cas
`SKIPPED` (aucune cible configurée) est couvert.

## 6. Correction MAJOR 3 — encadrement de l'adaptateur

**Défaut relevé.** `run-implementation-agent.js` exécutait `KODJO_AGENT_CMD` avec `shell: true` : cette
commande échappait au garde `lib/git.js` et pouvait créer un commit directement.

**Correction — registre fixe, `shell: false`.** L'adaptateur est désormais sélectionné par **identifiant**
dans un registre de scripts appartenant au dépôt, lancé avec `spawnSync(process.execPath, [...], {shell:
false})` et des arguments structurés (`--mode`, `--repo-dir`, `--delivery-dir`, `--slice-id`,
`--source-head`, `--failed-checks`). Le registre de production ne contient qu'une entrée, `none` →
`scripts/kodjo/adapters/no-remote-agent.js`, qui s'arrête en `NO_AGENT_ADAPTER_CONFIGURED`.

`KODJO_AGENT_CMD` n'est plus honoré : il est refusé bruyamment (`AGENT_COMMAND_NOT_ALLOWED`). Le même
durcissement s'applique aux commandes de contrôle : un `KODJO_CHECK_CMD_*` n'est honoré qu'avec
`KODJO_ALLOW_TEST_ADAPTER=1`, drapeau que **le workflow ne positionne jamais** ; sinon les commandes fixes
du dépôt s'appliquent et l'ignorance est journalisée. Les adaptateurs factices sont confinés à
`tests/kodjo/adapters/`, accessibles seulement via l'identifiant `test:<nom>` avec ce même drapeau, avec
contrôle d'évasion de chemin.

**Preuves.** `adapter-guard.pilot.js` vérifie : qu'une commande arbitraire est refusée **et ne laisse aucune
trace d'exécution** ; que seuls les identifiants du registre passent (`claude`, `sh -c ls`, `../../evil`,
`node` refusés) ; que `test:` exige le drapeau et refuse `test:../../scripts/kodjo/check-scope`, `test:a/b`
et `test:` ; que l'adaptateur de production sort en 78 avec la mention `NON_VERIFIABLE` ; qu'un
remplacement de commande de contrôle sans drapeau n'exécute rien et retombe sur `npm run lint --silent`.

**Garde d'état Git autour de l'adaptateur.** `git-state-guard.js capture … before` enregistre HEAD, la
liste complète des références, le reflog et le sha256 de l'index ; `… verify` recapture et compare après
l'adaptateur. Toute variation produit `GIT_STATE_MUTATED` (exit 4), écrit
`integrity/git-state.json` avec `functional_continuation: BLOCKED`, propage ce verdict dans le manifeste de
récupération **et** dans le manifeste de résultat, ajoute `functional_continuation=BLOCKED` au commentaire,
et fait sortir le run en 4. Le contenu du répertoire de travail n'est pas comparé : l'agent a le droit de le
modifier, c'est précisément le delta à conserver.

**Preuve d'une détection réelle.** Le test `garde git — une mutation de HEAD/refs/reflog…` fait tourner un
adaptateur **hostile** qui appelle `git commit` lui-même, contournant le garde `lib/git.js`. Le test vérifie
d'abord que le commit a bien eu lieu — le garde ne l'empêche pas, il le **détecte** — puis que : exit 4,
`GIT_STATE_MUTATED`, champs `head` et `refs`/`reflog` signalés, `functional_continuation: BLOCKED` dans les
deux manifestes et dans le commentaire, exit du run à 4 avec `FUNCTIONAL_CONTINUATION_BLOCKED`. Et surtout :
**le delta reste conservé et téléversé** (`recovery_upload` réussi, `has_changes: true`). Une mutation du
seul index est également détectée, ainsi que l'absence de baseline (`BLOCKED` par précaution).

Précédence des codes de sortie : `IMPLEMENTATION_FAILED` (3) l'emporte sur le blocage fonctionnel (4),
puisqu'il n'y a alors rien d'intégrable à bloquer.

## 6bis. Correction sécurité — étape de publication (révision 3)

**Défaut relevé.** `publish-implementation-output.js` assemblait `gh issue comment …` sous forme de chaîne
et l'exécutait avec `shell: true`. Un `issue_number` ou un `repository` non validé permettait une injection
de commande, échappant au garde `lib/git.js`.

**Correction — exécution directe, sans shell ni assemblage.**

- `gh` est lancé directement : `spawnSync('gh', ['issue','comment', issue, '--repo', repository,
  '--body-file', bodyFile], { shell: false })`. Aucune chaîne de commande n'est construite ni interprétée ;
  `grep -rn "gh issue comment" scripts/kodjo/` ne retourne plus rien.
- **Validation stricte avant lancement** : `issue_number` doit satisfaire `^[1-9][0-9]{0,17}$` (entier
  décimal positif) et `repository` doit satisfaire `^[A-Za-z0-9][A-Za-z0-9._-]{0,99}/[A-Za-z0-9][A-Za-z0-9._-]{0,99}$`.
  Toute valeur invalide produit `PUBLICATION_TARGET_INVALID` **avant** que `gh` ne soit lancé.
- La construction de l'invocation est isolée dans la fonction pure `buildInvocation(env, bodyFile)`, qui ne
  lance rien : elle est assertée directement par les tests.
- **`KODJO_PUBLISH_CMD` n'est plus une commande.** Sa valeur doit être un identifiant confiné
  `test:<nom>` désignant un script de `tests/kodjo/adapters/`, accepté seulement avec
  `KODJO_ALLOW_TEST_ADAPTER=1` — même confinement que l'adaptateur d'implémentation, factorisé dans
  `scripts/kodjo/lib/adapters.js` (contrôle de nom, contrôle d'évasion de chemin, existence du script).
  Une chaîne de commande est refusée dans tous les cas, avec ou sans le drapeau.
- **Reçu sans donnée sensible** : le reçu enregistre `executable`, `arguments` (arguments non sensibles :
  numéro d'issue, dépôt, nom de base du fichier de corps, ou chemin relatif du script de test) et le
  résultat. Le champ `command` a disparu. Les traces conservées passent par `redact()`, qui masque
  `ghp_…`/`gho_…`/`github_pat_…` et les en-têtes `Authorization`/`Bearer`/`token`.

**Preuves — `publication-security.pilot.js`, 10 tests.**

- `issue_number = "17; git commit -m injected"` : refusé, `executable: null`, aucun vecteur d'arguments
  enregistré, et HEAD/refs/reflog du dépôt strictement identiques — refus **avant effet**.
- Douze formes hostiles de `issue_number` (`17 && git push`, `17|ls`, `$(id)`, `` `id` ``, `-17`, `0`,
  `0x11`, `17\nrm -rf /`, …) n'atteignent jamais `gh` ; trois formes valides sont acceptées.
- Neuf formes invalides de `repository` (`OWNER`, `OWNER/REPO;whoami`, `../etc/passwd`, `OWNER/RE PO`, …)
  refusées ; trois valides acceptées.
- Publication normale : `executable === 'gh'`, vecteur d'arguments exactement
  `['issue','comment','43','--repo','MyUncried/Application-Routine','--body-file', <body>]`, chaque argument
  atomique ; le source du script ne contient **aucun** `shell: true`, contient `shell: false`, et n'assemble
  aucune ligne `gh issue comment`.
- Reçu : `shell: false`, pas de clé `command`, arguments non sensibles et sans chemin absolu machine.
- Commande arbitraire refusée **avec et sans** le drapeau de test, sans laisser de trace d'exécution ;
  évasions `test:../../scripts/kodjo/check-scope`, `test:a/b`, `test:`, `test:absent` refusées.
- Un échec de publication produit toujours son reçu, dans son propre artefact, et l'artefact de récupération
  reste intact et sans statut de publication.

**Scanner étendu.** `scan-remote-write-capability.js` détecte désormais `shell\s*:\s*true` dans tous les
chemins distants de production. Une seule exception, déclarée dans `SHELL_TRUE_EXEMPTIONS` et **affichée à
chaque exécution** :

```text
SHELL_EXECUTION exemption — scripts/kodjo/lib/checks.js: fixed repository check commands
(npm test / npx tsc / npm run lint); overrides are gated behind KODJO_ALLOW_TEST_ADAPTER=1,
which the workflow never sets.
```

**Justification et preuve de l'exception.** `lib/checks.js` exécute les commandes de contrôle du dépôt, qui
sont des lignes de commande shell par nature. Elles sont des **constantes fixes** de `DEFAULT_COMMANDS` ; un
`KODJO_CHECK_CMD_*` n'est honoré qu'avec `KODJO_ALLOW_TEST_ADAPTER=1`. Deux tests le démontrent : l'un
vérifie qu'un remplacement sans le drapeau n'exécute rien et retombe sur `npm run lint --silent` ; l'autre
analyse le YAML livré et vérifie que le workflow ne mentionne **ni** `KODJO_ALLOW_TEST_ADAPTER`, **ni**
`KODJO_CHECK_CMD_`, **ni** `KODJO_PUBLISH_CMD`, et que la liste exacte des onze entrées de
`workflow_dispatch` ne contient aucun nom capable d'atteindre ces variables. Un `shell: true` non exempté
est bien signalé : le test le prouve sur un dépôt fictif (`SHELL_EXECUTION — scripts/kodjo/offender.js`,
exit 1).

**Dette connue, hors périmètre de cette correction.** `run-implementation-agent.js` conserve sa propre copie
de la logique de confinement, désormais également présente dans `lib/adapters.js`. L'unification est un
suivi à faire ; elle n'a pas été effectuée ici pour respecter la consigne « ne modifie rien d'autre ». Les
deux implémentations sont couvertes par des tests distincts.

## 7. Preuves conservées de la révision 1

**Fichiers non suivis inclus.** Patch fabriqué sans commit via un index isolé (`GIT_INDEX_FILE`) ;
`lib/git.js` refuse `git add`/`read-tree` sans cet index. `T02-PRES-004` couvre un fichier texte non suivi,
un binaire non suivi et une suppression : présence dans `modified-files.json` et dans le patch
(`GIT binary patch`), restauration bit à bit (`assert.deepEqual` de `Buffer`), suppression effective.

**Reprise cumulative.** `T02-PRES-006` : vérification du sha256 contre le manifeste, le fichier `.sha256` et
le hash attendu ; contrôle que le HEAD de l'espace de contrôle est bien le `source_head` ; seuls `jest` et
`scope` relancés ; `typescript`/`lint` repris avec `carried_from_run_id` ; artefact cumulatif applicable sur
le HEAD **initial** contenant les deux runs ; exactement un appel d'adaptateur ; aucun commit.

**Absence d'écriture fonctionnelle distante.** `T02-PRES-008` : dix sous-commandes refusées avant effet
(dont `reflog expire`), état Git strictement identique, index et `git config` protégés, scan statique vert,
`contents: read` et `persist-credentials: false`.

## 8. Commandes de tests réellement exécutées

| Commande | Résultat |
|---|---|
| `node tests/kodjo/run-all.js` | **PASS** — 46 tests, 46 pass, 0 fail |
| `node scripts/kodjo/validate-workflows.js` | **PASS** — exit 0 |
| `node scripts/kodjo/scan-remote-write-capability.js` | **PASS** — exit 0, 25 fichiers, 1 exception `shell:true` déclarée et justifiée |
| `grep -rnE "git (commit\|push\|tag\|update-ref\|branch)\|contents: *write\|persist-credentials: *true"` | **PASS** — seule occurrence = documentation du scanner |
| `git diff --check` | **PASS** — exit 0 |
| `git status --short` / `git diff --stat` | 4 chemins non suivis / vide |

## 9. Résultats scénario par scénario

| ID | Scénario | Résultat |
|---|---|---|
| `T02-PRES-001` | Jest en échec | **PASS** — `IMPLEMENTED_WITH_FAILED_CHECKS`, `failed_checks=["jest"]`, 862/2, patch figé et artefact déjà téléversé au démarrage des 4 contrôles, exit 1 après les deux uploads et la publication, dépôt inchangé |
| `T02-PRES-002` | TypeScript en échec | **PASS** — `failed_checks=["typescript"]` seul, `not_run_checks=[]` |
| `T02-PRES-003` | Périmètre en échec | **PASS** — delta intégral conservé, `SCOPE_VIOLATION` nommant le fichier, HEAD/refs/reflog inchangés |
| `T02-PRES-004` | Fichier non suivi | **PASS** — texte + binaire non suivis, restauration bit à bit, suppression appliquée, `IMPLEMENTED_AND_VERIFIED` |
| `T02-PRES-005` | Commentaire indisponible | **PASS** — reçu `FAILED`, artefact stocké intact et applicable, republication à l'identique sans appel IA |
| `T02-PRES-006` | Reprise `TARGETED_FIX` | **PASS** — reprise depuis l'artefact de **récupération**, contrôles ciblés, artefact cumulatif sur le HEAD initial |
| `T02-PRES-007` | Préservation/validation invalide | **PASS** — trois variantes, toutes `IMPLEMENTATION_FAILED` avec diagnostic explicite et exit 3 |
| `T02-PRES-008` | Écriture distante refusée | **PASS** — refus avant effet, état Git identique, scan et permissions vérifiés |
| `T02-PRES-009` | **Upload de récupération avant tout contrôle** | **PASS** — ordre observé et ordre déclaré dans le YAML ; paquet téléversé sans statut ni résultat de contrôle |
| `T02-PRES-010` | **Perte du runner après l'upload** | **PASS** — workspace supprimé, delta intégralement restauré depuis le seul artefact, tous les hashes concordent |
| `T02-PRES-011` | **URL / digest / hash distincts** | **PASS** — trois valeurs différentes et cohérentes ; aucune URL fabriquée sans upload |
| `T02-PRES-012` | **Reçu de publication séparé** | **PASS** — `FAILED` et `SKIPPED` couverts, reçu hors du paquet immuable |

**Encadrement de l'adaptateur (9 tests)** : commande arbitraire refusée sans exécution ; registre fermé ;
adaptateurs de test confinés et gated ; adaptateur de production `NON_VERIFIABLE` ; remplacement de commande
de contrôle ignoré ; état Git intact constaté ; mutation HEAD/refs/reflog détectée et bloquante ; mutation
de l'index détectée ; baseline absente bloquante.

**Sécurité de la publication (10 tests)** : injection par `issue_number` refusée sans exécution et sans
effet Git ; douze formes hostiles de numéro d'issue et neuf de dépôt refusées ; vecteur d'arguments
structuré exact pour `gh` ; absence de `shell: true` et d'assemblage `gh issue comment` dans le source ;
reçu sans ligne de commande et sans chemin absolu ; expurgation des chaînes de type identifiant ; commande
arbitraire refusée avec et sans le drapeau de test ; échec de publication produisant toujours son reçu sans
masquer l'artefact ; exception `shell: true` unique, déclarée, et impossible à détourner par une entrée de
workflow.

**Tests unitaires (15)** : non-rétrogradation pour chacun des 4 contrôles ; `NOT_RUN` jamais compté comme
réussi ; contrôle absent signalé ; codes de sortie et reprises distincts ; règles d'impact de la reprise ;
compteurs Jest ; parseur YAML ; détection de violations dans un workflow fabriqué ; allowlist absente →
`NOT_RUN` ; commande introuvable → jamais `PASS` ; classification chaîne d'outils indisponible ; refus
d'appel IA sans adaptateur borné.

## 10. Défauts trouvés et corrigés pendant le pilote

1. **Classification `FAIL` vs `NOT_RUN`** (révision 1). En exécutant les vraies commandes du dépôt sans
   `node_modules`, `jest`/`tsc`/`lint` étaient classés `FAIL`. `classifyLaunchFailure()` distingue désormais
   les codes 127/9009, les codes hors intervalle POSIX 0-255 et les messages de lancement. Un vrai verdict
   n'est jamais requalifié — test dédié.
2. **Précédence des codes de sortie** (révision 2). Un `IMPLEMENTATION_FAILED` sans garde d'intégrité
   exécuté sortait en 4 (blocage fonctionnel) au lieu de 3. Corrigé : le statut métier l'emporte quand rien
   n'est intégrable.

## 11. Échecs, limites et éléments `NON_VÉRIFIABLE`

- **GitHub Actions réel : vérifié sur le chemin borné de conservation/restauration.** Le run
  [`34286251097`](https://github.com/MyUncried/Application-Routine/actions/runs/34286251097), au commit
  `234bd0a`, a produit un artefact avant l'échec volontaire du contrôle. L'étape exécutée avec
  `if: always()` a réussi après cet échec ; le job distinct `restore_from_artifact` a téléchargé
  l'artefact, restauré le fichier factice bit à bit et confirmé le `source_head` inchangé. Les sorties
  réelles `artifact-url` et `artifact-digest` étaient non vides. Ce résultat vérifie les primitives
  GitHub, pas encore un cycle complet utilisant un agent distant réel.
- **Adaptateur d'agent réel : `NON_VÉRIFIABLE`.** Le pilote n'intègre aucun agent distant borné. Que le
  futur adaptateur réel ne crée aucun commit **reste à démontrer** : le garde d'état Git le *détecte* après
  coup, il ne l'*empêche* pas. **Ce workflow n'est pas prêt pour une implémentation réelle** ; il est prêt
  pour la conservation et la reprise.
- **`npm test`, `npx tsc --noEmit`, `npm run lint` n'ont pas pu être exécutés** : `node_modules/` est absent
  de ce worktree. Cause extérieure au pilote, aucun fichier applicatif n'ayant été modifié. `NON_VÉRIFIABLE`
  sur cette machine. Que le pilote n'affecte pas `npm test` est établi **statiquement** (lecture du
  `testMatch` réel de `jest-expo`), pas par exécution.
- **Fins de ligne.** La restauration bit à bit exige `core.autocrlf=false`. Cette machine a
  `core.autocrlf=true` au niveau **système** ; le runner gardé et les fixtures le forcent à `false`. Point
  d'exploitation à conserver pour l'application locale dans `/Dev`.
- **Renommages.** `--no-renames` : un renommage est conservé comme suppression + ajout. Contenu et
  restauration exacts, sémantique « renommé » non portée par le manifeste.
- **`lib/yaml.js`** couvre le sous-ensemble YAML du workflow livré ; il n'est pas le validateur de GitHub.
- **Périmètre.** Le pilote ne couvre que le défaut T02 : ni moteur V2, ni machine à états, ni branche de
  preuves, ni schémas d'enveloppe (§6.1).

## 12. État Git et exécution distante

```text
branche pilote          : chore/kodjo-v2-pilot
commit pilote local     : f6efd62
commit smoke test       : 234bd0a
run GitHub Actions      : 34286251097
résultat global         : failure attendue (contrôle volontairement rouge)
preserve_before_failure : failure attendue après upload
restore_from_artifact   : success
artefacts publiés       : 1
```

Les deux commits et leur push ont été réalisés manuellement depuis le worktree local `/Dev` par
l'utilisateur. Le workflow distant n'a créé ni commit, ni push, ni branche, ni tag, ni référence. Le
worktree fonctionnel `C:\Dev\Application-routine` et sa branche `feat/creation-seance-catalogue` n'ont pas
été modifiés par le pilote.

## 13. Verdict

**`PILOT_PASS_LOCAL`** — les douze scénarios `T02-PRES-001` à `T02-PRES-012` et les trente-quatre tests
unitaires, d'encadrement et de sécurité passent en exécution locale (46 au total). La conservation est
**durable** avant tout contrôle, une perte du runner après l'upload laisse le delta intégralement
récupérable, l'URL et le digest de l'artefact sont distincts du hash du patch, le statut de publication vit
dans un reçu séparé, ni l'adaptateur d'implémentation ni l'étape de publication ne peuvent exécuter une
commande arbitraire, `gh` est lancé sans shell avec des arguments structurés après validation stricte de sa
cible, et toute mutation de l'état Git est détectée et bloque la suite fonctionnelle sans détruire le
travail produit.

La conservation avant échec, `if: always()`, le transport par artefact et la restauration dans un second
job sont désormais également **vérifiés sur GitHub Actions réel**. Restent `NON_VÉRIFIABLES` à ce stade :
l'adaptateur d'agent distant réel et le cycle V2 complet de bout en bout.
