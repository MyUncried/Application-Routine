# Manifeste du paquet KODJO V2 0.6.51 — candidat et preuves historiques

## Objet

Le paquet de cette branche candidate est défini par la spécification 0.6.51, qui complète la base fusionnée 0.6.47 et son héritage additif. La version 0.6.51 est **NON RETESTÉE** tant que la qualification Linux/Windows et l’audit indépendant Claude n’ont pas été exécutés. Les contrats UI/préflight antérieurs restent applicables lorsqu’ils ne sont pas supersédés explicitement. Les runs historiques cités ci-dessous ne certifient pas le HEAD candidat.

## Sources normatives

| Fichier | Rôle |
|---|---|
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.51.md` | Spécification normative candidate PE-27 à PE-38 ; NON RETESTÉE |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.47.md` | Base normative actuellement fusionnée |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.21.md` | Base historique de qualification jetable, conservée sous les addenda ultérieurs |
| `.github/orchestration/KODJO_PROTOCOL_V2_IMPLEMENTATION_WORKFLOW_REFERENCE_0.6.12.yml` | Workflow distant de préservation, inchangé fonctionnellement |
| `.github/orchestration/CHANGE_REPORT_0.6.51.md` | Rapport de changement du candidat 0.6.51 |
| `.github/orchestration/CHANGE_REPORT_0.6.21.md` | Rapport historique de canonicalisation et qualification jetable |
| `.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md` | Registre canonique, version indiquée par son propre en-tête |

| `.github/orchestration/reports/2026-09-29_PROTOCOL_DETERMINISM_AUDIT.md` | Audit de déterminisme préparatoire |
| `.github/orchestration/reports/2026-09-29_PROTOCOL_DETERMINISM_MATRIX.md` | Matrice opérationnelle P/D/T/DET à auditer |
| `.github/orchestration/reports/2026-09-29_PROTOCOL_EVOLUTION_CLAUDE_AUDIT_MISSION.md` | Mission de contre-audit Claude indépendant |
| `.github/orchestration/reports/KODJO_V2_ORDINARY_PATH_CERTIFICATION_REPORT_0.1.md` | Rapport historique de certification C1–C4, D1–D3 et R1–R6 |

## Composants d’activation V2

| Chemin | Rôle |
|---|---|
| `.github/orchestration/slice-bootstrap.schema.json` | Schéma fermé de `SliceBootstrapIdentity` |
| `.github/orchestration/v2-activation-registry.json` | Registre explicite des tranches V2 actives |
| `scripts/kodjo/activate-kodjo-v2-slice.ps1` | Commande bornée de préparation d’une activation |
| `scripts/kodjo/validate-slice-bootstrap.js` | Validation du bootstrap, du registre, du hash et de l’ascendance Git |
| `tests/kodjo/slice-identity.pilot.js` | Tests positifs, altération, absence, divergence et refus V1 |
| `.github/orchestration/v2-slices/V2-QUALIF-00/slice-bootstrap.json` | Identité autonome de la tranche jetable |
| `.github/orchestration/v2-slices/V2-QUALIF-00/implementation-mission.md` | Mission bornée à la fixture jetable |
| `.github/workflows/kodjo-v2-disposable-qualification.yml` | Qualification manuelle réelle, permissions de lecture |
| `scripts/kodjo/run-disposable-qualification.ps1` | Banc réel Windows PowerShell 5.1 et dépôt de preuves |
| `scripts/kodjo/compare-qualification-checks.js` | Comparaison causale entre contrôles initiaux et contrôles post-Claude |
| `tests/kodjo/qualification/disposable-slice-bench.js` | Banc portable S1 à S7, chemins relatifs et résultat JSON hashable |

Le même banc possède un mode `PreflightOnly` qui exerce installation, contrôles, inventaire et nettoyage sur Windows sans invoquer Claude. Une seule exécution PASS de ce mode est requise avant l’unique tentative jetable finale.

## Composants locaux

| Chemin | Rôle |
|---|---|
| `scripts/kodjo/lib/claude-local.js` | Configuration figée, validation de requête, prompt borné et arguments effectifs |
| `scripts/kodjo/run-local-claude.js` | Superviseur local : préflight, exclusion, appel unique, runner de contrôles isolé et résultat |
| `scripts/kodjo/lib/scope-path.js` | Validation canonique partagée des chemins et règles de périmètre |
| `scripts/kodjo/certify-recovery-artifact.js` | Certification sans Claude d’un artefact réel dans un clone isolé du HEAD candidat |
| `scripts/kodjo/setup-kodjo-claude-auth.ps1` | Enregistrement DPAPI du jeton long terme |
| `scripts/kodjo/start-kodjo-v2.ps1` | Injection éphémère du jeton et lancement sécurisé |
| `scripts/kodjo/create-kodjo-v2-request.ps1` | Construction automatique d’une requête liée au HEAD courant |
| `scripts/kodjo/invoke-kodjo-v2.ps1` | Entrée utilisateur unique : création de requête puis lancement |
| `KODJO_V2_LOCAL_REQUEST_EXAMPLE.json` | Schéma d’exemple, non exécutable tel quel |
| `tests/kodjo/claude-local.pilot.js` | Tests des bornes, outils, budgets, périmètres et secrets |
| `scripts/kodjo/lib/requirement-contract.js` | Contrat unifié requirements/tests/boundaries UI + non-UI |
| `scripts/kodjo/lib/review-findings.js` | Findings structurés et IDs stables pour REVISE |
| `scripts/kodjo/validate-plan-module-paths.js` | Validation précoce MODIFY/CREATE au HEAD immuable |
| `scripts/kodjo/verify-test-contract-results.js` | Liaison des résultats Jest réels au test contract |
| `scripts/kodjo/lib/error-policy.js` | Hiérarchie PREVENTABLE / RESIDUAL / HUMAN |
| `scripts/kodjo/generate-bounded-correction-request.js` | Générateur de correction résiduelle bornée |
| `scripts/kodjo/lib/artifact-policy.js` | Classification des artifacts par rôle |
| `scripts/kodjo/check-artifact-budget.js` | Préflight du volume Actions avant exécution coûteuse |
| `scripts/kodjo/close-v2-activation.js` | Transition idempotente ACTIVE → CLOSED |
| `scripts/kodjo/verify-independent-protocol-audit.js` | Validation du contrat de sortie du contre-audit Claude |
| `.github/workflows/kodjo-v2-next-evolution-independent-audit.yml` | Audit Claude sur PR ou lancement manuel, exact-HEAD, read-only, rapport conservé en artifact et résumé Actions |
| `tests/kodjo/next-evolution-determinism.pilot.js` | Oracles PE-27 à PE-38 et DET |


## Composants historiquement qualifiés et conservés

| Élément | État |
|---|---|
| Préservation avant contrôles | Qualifiée localement et sur GitHub Actions |
| Restauration depuis l’artefact | Qualifiée dans un second job |
| Writer externe | Qualifié le 10 septembre 2026 dans `Application-Routine-KODJO-Evidence` |
| Dépôt applicatif distant | Lecture seule pour Claude ; publication autorisée réservée au superviseur Lean Queue |
| Workflow writer corrigé | Résolution de `${RUNNER_TEMP}` après démarrage du runner |

## Configuration Claude effective

- version exacte : `2.1.263` ;
- invocation : `1` ;
- tours : aucun plafond KODJO ; `--max-turns` absent ; quota et fin régis par Claude et l’abonnement ;
- durée : `3 600` secondes maximum ;
- prompt : `32 768` octets maximum ;
- outils : `Read, Edit, Write, Glob, Grep, Bash` ;
- Bash autorisé uniquement pour un runner externe figé qui exécute Jest, TypeScript ou lint après retrait du jeton Claude ;
- Git direct interdit ; lectures bornées via `kodjo-git-read.js` ; `gh`, réseau, MCP, PowerShell et suppressions globales interdits ;
- `--restricted`, `--permission-prompts none`, `--strict-mcp-config` et configuration MCP vide obligatoires.

## Hiérarchie

Sur la branche candidate, la spécification `0.6.51` complète `0.6.47`, puis la chaîne des addenda explicitement hérités et `.github/AI_ORCHESTRATION.md` pour les principes conservés. Les contrats exécutables et tests priment sur les rapports descriptifs pour démontrer une capacité. Aucun addendum ne supprime silencieusement une règle antérieure. Tant que 0.6.51 n’est pas qualifiée et fusionnée, 0.6.47 reste la dernière base normative fusionnée.

## Qualification historique (HEADs indiqués, sans extrapolation au courant)

La migration 0.6.20 reste démontrée par les runs `34611834316`, `34612786612` et le run pilote complet `34621816482`, tous qualifiés sur Ubuntu et Windows PowerShell 5.1.

Le run #73 `34648194736`, au HEAD exact `8a7b9e018c2a0a7cedd9c27f3dbe1ac0afdadd0f`, qualifie la tranche jetable INITIAL réelle : workflow `SUCCESS`, verdict protocolaire `PASS`, Claude invoqué une fois, delta limité à `tests/fixtures/qualif/result.txt`, `request_id` propagé, paquet de reprise intact, aucune publication distante et nettoyage `PASS`. L’artefact opposable est `10283681378`, SHA-256 `3defbea095d0adcfbfcac55bed02a39ad0fa3dd319763325cbb59b00c35e1a53`.

La santé applicative absolue reste `FAIL` à cause des deux timeouts Jest préexistants ; les contrôles sont exécutables et la non-régression causale est `PASS`. L’interruption contrôlée puis la reprise réelle `RESUME_DELTA` de la même session restent `NON RETESTÉES`.

## Qualification du candidat 0.6.51

Statut actuel : **NON RETESTÉ**. La présence des scripts, workflows et tests dans la PR #250 ne vaut pas certification. Sont encore requis : suite Linux, suite Windows réelle, scénarios PE-27 à PE-38, audit indépendant Claude et absence de finding bloquant résiduel.

## Complément des entrées normatives et runtime du candidat

Ces composants sont livrés au même HEAD que ce manifeste. Leur présence ne vaut pas qualification.

| Chemin | Rôle |
|---|---|
| `.github/AI_ORCHESTRATION_CONTINUITY.md` | Entrée normative ou runtime consommé par les workflows candidats |
| `.github/orchestration/KODJO_PROTOCOL_NEXT_EVOLUTION_R1_R3_R4_CONTINUITY.md` | Entrée normative ou runtime consommé par les workflows candidats |
| `.github/orchestration/PACKAGE_MANIFEST.md` | Entrée normative ou runtime consommé par les workflows candidats |
| `.github/orchestration/audit-deferrals.json` | Entrée normative ou runtime consommé par les workflows candidats |
| `.github/orchestration/normative-inputs.json` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/apply-minor-plan-clarification.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/assemble-plan-impact.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/build-planning-context.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/certify-persistent-runner-lock.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/check-qualification-availability.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/classify-planning-failure.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/classify-protocol-impact.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/cleanup-run-checkout.ps1` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/decide-plan-review-retry.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/detect-v2-closure-inconsistency.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/exit-from-business-status.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/finalize-implementation-delivery.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/generate-approved-plan-lean-request.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/generate-ui-plan-contract.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/git-state-guard.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/initialize-run-diagnostic.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/inventory-closure-artifacts.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/lib/boundary-proof.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/lib/plan-impact.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/lib/ui-identities.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/materialize-approved-plan-handoff.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/recover-published-plan.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/republish-plan-review.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/verify-plan-closure-review.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/normalize-review-findings.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/openai-plan-request.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/prepare-evidence-writer-smoke.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/preserve-implementation.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/publish-implementation-output.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/publish-independent-protocol-audit.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/publish-visual-checkpoint.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/reconcile-initial-plan-prose.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/record-infrastructure-metric.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/resolve-checks-to-run.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/resolve-implementation-review-policy.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/resolve-private-head.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/resolve-recovery-source.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/resolve-run-directory.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/restore-source-artifact.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/run-check.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/run-disposable-resume-qualification.ps1` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/run-implementation-agent.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/run-queued-request.ps1` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/scan-plan-impact.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/scan-remote-write-capability.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/resolve-pre1-targeted-acceptance.js` | Exception propriétaire de #267 liée au SHA exact après qualification ; conserve REVISE et les réserves historiques, sans nouvel appel global |
| `scripts/kodjo/targeted-requalification.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/validate-orchestration-paths.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/validate-workflows.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/verify-authorizations.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/verify-bounded-plan-revision.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/verify-delivery.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/verify-implementation-plan-gate.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/verify-initial-product-sources.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/verify-plan-contract-consistency.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/verify-plan-impact.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/verify-plan-review-transition.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/verify-queue-admission.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/verify-queue-preflight.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/verify-ui-plan-criteria.js` | Entrée normative ou runtime consommé par les workflows candidats |
| `scripts/kodjo/write-evidence-deposit.js` | Entrée normative ou runtime consommé par les workflows candidats |

| `scripts/kodjo/verify-artifact-retention.js` | Contrôle exécutable des rétentions déclarées des uploads KODJO |
| `tests/kodjo/causal-runtime-boundaries.pilot.js` | Régressions du runtime IMPLEMENT, reprises causales et frontières cumulatives |
| `scripts/kodjo/lib/ui-criteria-contract.js` | Validation et schémas des contrats UI et frontières structurées |

## Dépendances conservées pour l’intégration VNext

Ces fichiers participent aux points d’entrée existants ou à leurs dépendances figées. Leur présence dans le paquet ne vaut pas activation ni qualification du candidat intégré.

| Fichier | Rôle |
|---|---|
| `scripts/kodjo/lib/log.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/slice-identity.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/vnext-delivery-preservation.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/vnext-contract.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/vnext-post-acceptance.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/device-proof-policy.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/verify-source-comment.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/vnext-legacy-queue-adapter.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/approval-handoff-contract.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/planning-envelope.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/source-manifest.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/requirement-registry.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/impact-graph.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/vnext-performance.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/vnext-git-batch.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/plan-contract.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/review-contract.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/ui-atomicity-contract.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/vnext-figma-source.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/vnext-producer-packet.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/vnext-preserved-controls.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/queue-contract.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/initial-restart.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/preflight-contract.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/vnext-audit-register.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/vnext-finalization.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/yaml.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/vnext-remote-write-security.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/git.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/hash.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/json.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/delivery.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/tar.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/checks.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/status.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/lib/adapters.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/materialize-boundary-file.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/record-unavailable-recovery.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/resolve-claude-binary.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/run-plan-review-cli.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/recover-published-pre1-plan.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/verify-pre1-closure-review.js` | Entrée ou dépendance figée conservée |

## Entrées de routage VNext

Ces fichiers participent aux points d’entrée existants ou à leurs dépendances figées. Leur présence dans le paquet ne vaut pas activation ni qualification du candidat intégré.

| Fichier | Rôle |
|---|---|
| `scripts/kodjo/resolve-slice-protocol.js` | Entrée ou dépendance figée conservée |
| `scripts/kodjo/start-kodjo-slice.js` | Entrée de planification des nouvelles tranches VNext |
| `scripts/kodjo/lib/slice-protocol-routing.js` | Routage depuis les contrats d’activation committés |
| `.github/orchestration/KODJO_VNEXT_ACTIVATION.md` | Usage et limites du basculement |

## Sources normatives VNext

- `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md`
- `.github/orchestration/KODJO_VNEXT_ANTI_REGRESSION_MATRIX.md`
- `.github/orchestration/KODJO_VNEXT_HISTORICAL_DISPOSITION.json`
- `.github/orchestration/KODJO_VNEXT_HISTORICAL_DISPOSITION.md`
- `.github/orchestration/KODJO_VNEXT_HISTORICAL_EQUIVALENCE.json`
- `.github/orchestration/KODJO_VNEXT_REMOTE_WRITE_POLICY.json`
- `.github/orchestration/KODJO_VNEXT_ACTIVATION.md`

- `scripts/kodjo/lib/machine-block.js` — consommateur partagé de blocs sans sélection arbitraire du premier.
- `scripts/kodjo/validate-vnext-closure-request.js` — demande de clôture générique et routage.
- `scripts/kodjo/wait-vnext-audit-qualification.js` — attente en lecture seule des preuves exactes.

- `scripts/kodjo/produce-vnext-test-evidence.js` — observation des tests exécutés sur la livraison exacte.
- `scripts/kodjo/lib/vnext-test-evidence.js` — vérification partagée du run, du job, de l’artefact et de l’arbre testé avant finalisation/clôture.

Dépendance VNext de clôture (IA-F07) : `scripts/kodjo/lib/vnext-review-coverage.js` → `review-contract.js`, `vnext-contract.js`, `machine-block.js` ; consommée par `finalize-vnext-delivery.js`. Le contexte/rapport passent par le plan approuvé ; les champs dérivés sont conservés par les consommateurs GitHub et locaux.

## Dépendances partagées du transport VNext — correctif de volume #341

| Fichier | Rôle |
|---|---|
| `scripts/kodjo/lib/vnext-file-bundle.js` | Transport intégral borné, restitution et contrôle des empreintes ; dépendance du gate partagé |
| `scripts/kodjo/lib/vnext-plan-bundles.js` | Lecture des parties du plan autorisé à la révision protocolaire figée |
| `.gitattributes` | Conservation des octets exacts des manifestes et parties de transport sous Windows, même avec core.autocrlf=true |
