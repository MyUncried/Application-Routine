# Manifeste du paquet KODJO V2 0.6.19 — tours gouvernés par Claude

## Objet

Cette version conserve l’identité de tranche, le verrou propriétaire, le diagnostic lié au run courant, la traçabilité de `request_id` et les lectures Git bornées. Elle retire le plafond protocolaire de tours : la fin de l’invocation relève de Claude et des droits réels de l’abonnement. Claude ne committe pas, ne pousse pas et ne possède aucun droit d’écriture GitHub.

## Sources normatives

| Fichier | Rôle |
|---|---|
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.19.md` | Spécification normative courante, delta de 0.6.18 |
| `.github/orchestration/KODJO_PROTOCOL_V2_IMPLEMENTATION_WORKFLOW_REFERENCE_0.6.12.yml` | Workflow distant de préservation, inchangé fonctionnellement |
| `.github/orchestration/CHANGE_REPORT_0.6.19.md` | Rapport du correctif des runs #15 et #16 |
| `.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER_v3.4.0_CORRECTED.md` | Registre canonique, contenu version 3.6.0 |

## Composants d’activation V2

| Chemin | Rôle |
|---|---|
| `.github/orchestration/slice-bootstrap.schema.json` | Schéma fermé de `SliceBootstrapIdentity` |
| `.github/orchestration/v2-activation-registry.json` | Registre explicite des tranches V2 actives |
| `scripts/kodjo/activate-kodjo-v2-slice.ps1` | Commande bornée de préparation d’une activation |
| `scripts/kodjo/validate-slice-bootstrap.js` | Validation du bootstrap, du registre, du hash et de l’ascendance Git |
| `tests/kodjo/slice-identity.pilot.js` | Tests positifs, altération, absence, divergence et refus V1 |

## Composants locaux

| Chemin | Rôle |
|---|---|
| `scripts/kodjo/lib/claude-local.js` | Configuration figée, validation de requête, prompt borné et arguments effectifs |
| `scripts/kodjo/run-local-claude.js` | Superviseur local : préflight, exclusion, appel unique, runner de contrôles isolé et résultat |
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

En cas d’écart : spécification `0.6.19` complétant `0.6.18`, configuration effective de `claude-local.js`, superviseur, tests, puis rapports.

## Qualification

La qualification 0.6.19 est démontrée par le run `34608773847` au commit `86cedd33e2579f351ddf2e117ab10ff60ed19ac9` : Ubuntu `103293703287` PASS, Windows PowerShell 5.1 `103293703580` PASS, banc isolé PASS et artefact réel `10267286529`, sans appel Claude.
