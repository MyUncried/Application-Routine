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
| `.github/workflows/kodjo-v2-next-evolution-independent-audit.yml` | Audit Claude manuel, exact-HEAD, read-only, sans artifact |
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
