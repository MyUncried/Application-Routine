# Manifeste du paquet KODJO V2 0.6.11 — adaptateur Claude local borné

## Objet

Cette version ajoute l’exécution Claude locale supervisée, la boucle interne de correction des tests et l’authentification OAuth durable chiffrée sous Windows. Elle conserve l’architecture validée : Claude modifie uniquement `/Dev`, ne committe pas, ne pousse pas et ne possède aucun droit d’écriture GitHub.

## Sources normatives

| Fichier | Rôle |
|---|---|
| `primary/KODJO_PROTOCOL_V2_SPEC_0.6.11.md` | Spécification normative courante |
| `primary/KODJO_PROTOCOL_V2_IMPLEMENTATION_WORKFLOW_REFERENCE_0.6.11.yml` | Workflow distant de préservation, inchangé fonctionnellement |
| `CHANGE_REPORT_0.6.11.md` | Rapport de l’adaptateur Claude local |

## Nouveaux composants locaux

| Chemin | Rôle |
|---|---|
| `evidence/scripts/kodjo/lib/claude-local.js` | Configuration figée, validation de requête, prompt borné et arguments effectifs |
| `evidence/scripts/kodjo/run-local-claude.js` | Superviseur local : préflight, exclusion, appel unique, runner de contrôles isolé et résultat |
| `evidence/scripts/kodjo/setup-kodjo-claude-auth.ps1` | Enregistrement DPAPI du jeton long terme |
| `evidence/scripts/kodjo/start-kodjo-v2.ps1` | Injection éphémère du jeton et lancement sécurisé |
| `evidence/scripts/kodjo/create-kodjo-v2-request.ps1` | Construction automatique d’une requête liée au HEAD courant |
| `evidence/scripts/kodjo/invoke-kodjo-v2.ps1` | Entrée utilisateur unique : création de requête puis lancement |
| `evidence/KODJO_V2_LOCAL_REQUEST_EXAMPLE.json` | Schéma d’exemple, non exécutable tel quel |
| `evidence/tests/kodjo/claude-local.pilot.js` | Tests des bornes, outils, budgets, périmètres et secrets |

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
- tours : `12` maximum ;
- durée : `3 600` secondes maximum ;
- prompt : `32 768` octets maximum ;
- outils : `Read, Edit, Write, Glob, Grep, Bash` ;
- Bash autorisé uniquement pour un runner externe figé qui exécute Jest, TypeScript ou lint après retrait du jeton Claude ;
- Git, `gh`, réseau, MCP, PowerShell et suppressions globales explicitement interdits ;
- `--restricted`, `--permission-prompts none`, `--strict-mcp-config` et configuration MCP vide obligatoires.

## Hiérarchie

En cas d’écart : spécification `0.6.11`, configuration effective de `claude-local.js`, superviseur, tests, puis rapports.

## Limite restante connue

L’implémentation locale est testable sans consommation Claude grâce aux tests déterministes. Sa qualification finale exige une invocation réelle sur le poste `/Dev` avec Claude Code `2.1.263` et le jeton long terme. Cette invocation constitue l’unique essai fonctionnel restant avant activation.
