# Obligations d’orchestration VNext — non actives dans ce clone

Sources conservées à l’identique : `.github/AI_ORCHESTRATION.md`, `.github/AI_ORCHESTRATION_CONTINUITY.md`, [`originaux/CLAUDE.md`](originaux/CLAUDE.md).

Les obligations suivantes **ne s’appliquent pas** au chantier de révision documentaire OpenSpec, qui n’a aucun raccordement à VNext ni à BMAD :

| Obligation d’origine | Source |
|---|---|
| Machine à états `SPEC_PREPARED → … → CLOSED`, barrières `PLAN_APPROVED`, `CHANGE_REQUEST_REQUIRED`, `SCOPE_EXPANSION_REQUIRED`, `NATIVE_PRIMITIVE_EXCEPTION_REQUIRED`, `ORCHESTRATION_FAILURE`, etc. | `AI_ORCHESTRATION.md` |
| Rôles ChatGPT / Claude / GitHub et relais de revue automatisé | `AI_ORCHESTRATION.md` § Rôles ; `AI_ORCHESTRATION_CONTINUITY.md` |
| Checkpoints, deltas, sessions persistantes, paquets de contexte IA, modes `LOCAL`/`CLOUD`, désignation d’écrivain | `AI_ORCHESTRATION.md` |
| Routage des commentaires GitHub, traçabilité Issue/PR, preuves Git d’orchestration, `DELIVERY_REPORT_GATE` | `AI_ORCHESTRATION.md` |
| Reprise événementielle, réveil GitHub → Work, conventions A/B/C | `AI_ORCHESTRATION_CONTINUITY.md` |
| Diagnostic historique VNext, `DIRECT_REAL_USER_REQUEST`, `FIGMA_INITIAL`, `PREPARE_REVISION`, absence de navigateur dans les tests VNext | `originaux/CLAUDE.md` § « Diagnostic historique obligatoire de VNext » |
| Dépôt des rapports dans `.github/orchestration/reports/` | `originaux/CLAUDE.md` (contenu minimal repris en P-7 de `EXIGENCES-PRODUIT.md`) |

## Ce qui reste vrai malgré tout

- La revue ChatGPT et la validation d’Hermann sont **demandées manuellement** par la mission, sans relais ni état machine.
- Les références figées des préparations PRE-4 en cours ne sont pas modifiées.
- Aucun push, workflow, EAS, changement Figma ni code applicatif.
