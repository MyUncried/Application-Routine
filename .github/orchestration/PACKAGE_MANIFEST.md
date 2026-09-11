# Manifeste du paquet KODJO V2 0.6.21 — qualification jetable opposable

## Objet

Cette version conserve les invariants 0.6.20, rend le registre réellement canonique, unifie l’admission des chemins et active une tranche jetable sans effet applicatif. Claude ne committe pas, ne pousse pas et ne possède aucun droit d’écriture GitHub.

## Sources normatives

| Fichier | Rôle |
|---|---|
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.21.md` | Spécification normative courante, delta de 0.6.20 |
| `.github/orchestration/KODJO_PROTOCOL_V2_IMPLEMENTATION_WORKFLOW_REFERENCE_0.6.12.yml` | Workflow distant de préservation, inchangé fonctionnellement |
| `.github/orchestration/CHANGE_REPORT_0.6.21.md` | Rapport de canonicalisation et qualification jetable |
| `.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md` | Registre canonique, contenu version 3.14.0 |

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
| `tests/kodjo/qualification/disposable-slice-bench.js` | Banc portable S1 à S7, chemins relatifs et résultat JSON hashable |

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

## Composants déjà qualifiés et conservés

| Élément | État |
|---|---|
| Préservation avant contrôles | Qualifiée localement et sur GitHub Actions |
| Restauration depuis l’artefact | Qualifiée dans un second job |
| Writer externe | Qualifié le 10 septembre 2026 dans `Application-Routine-KODJO-Evidence` |
| Dépôt applicatif distant | Lecture seule |
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

En cas d’écart : spécification `0.6.21` complétant `0.6.20`, configuration effective de `claude-local.js`, superviseur, tests, puis rapports.

## Qualification

La migration 0.6.20 reste démontrée par les runs `34611834316`, `34612786612` et le run pilote complet `34621816482`, tous qualifiés sur Ubuntu et Windows PowerShell 5.1. La qualification Claude de `V2-QUALIF-00` reste NON RETESTÉE jusqu’au run manuel 0.6.21 et à son artefact propre.
