# Package d’audit indépendant — Handoff PLAN approuvé → IMPLEMENT

Date : 2026-09-17
Branche à auditer : `protocol/v2-initial-handoff-redesign-20260917`
Commit de la proposition : `53a81c41c306ed6c5e9cba863807e654af7097d1`

## Objet de l’audit

Auditer uniquement la nouvelle architecture proposée pour raccorder les parcours de planification KODJO V2 au socle Lean Queue déjà stabilisé.

L’audit ne doit pas ré-auditer le moteur d’exécution V2 historique sauf si la proposition le modifie effectivement.

## Point de départ à considérer comme acquis

Le chemin suivant a déjà été éprouvé en réel avec `V2-BILAT-01` et doit être traité comme la frontière stable :

`.github/orchestration/queue/v2/*.json`
→ `verify-queue-admission.js`
→ `verify-authorizations.js`
→ `run-queued-request.ps1`
→ `start-kodjo-v2.ps1`
→ `run-local-claude.js`.

Exemples de demandes réelles :

- `.github/orchestration/queue/v2/V2-BILAT-01-resume-50c14550.json` ;
- `.github/orchestration/queue/v2/V2-BILAT-01-retry3-1a3faf24.json` ;
- autres demandes `V2-BILAT-01-*` du même répertoire.

La preuve d’autorisation stable repose sur :

- `authorized_plan` : artefact Git + blob OID ;
- `independent_review` : artefact Git + blob OID + lien au plan ;
- `user_gate` : commentaire GitHub référencé + approbation organisationnelle vérifiée ;
- `scope_allow` : contrôlé contre le plan quand `KODJO_PLAN_IMPACT_JSON` est présent.

## Problème à résoudre

Depuis l’ajout du premier parcours `INITIAL` (0.6.29), puis du gate explicite plan/revue/utilisateur (0.6.31), le raccordement à IMPLEMENT n’a pas convergé proprement vers le Lean Queue historique.

La tentative 0.6.32 a créé une voie parallèle :

`PLAN/REVIEW comments → queue/v2-causal → workflow comment-causal → JSON temporaires → projection local-implementation → run-queued-request.ps1`.

Cette couche a généré des défauts de transport spécifiques (quoting Unicode Git, BOM PowerShell) alors que les preuves fonctionnelles étaient correctes.

L’objectif est donc de supprimer cette voie parallèle et de faire converger **INITIAL et REVIEW/RÉVISION** vers une seule `lean-request.0.6.13`.

## Fichiers à lire en priorité

### Proposition d’architecture

- `.github/orchestration/reports/2026-09-17_V2_INITIAL_REVIEW_HANDOFF_ARCHITECTURE.md`

### Socle stable / contrat canonique

- `.github/workflows/kodjo-v2-lean-queue.yml`
- `scripts/kodjo/lib/queue-contract.js`
- `scripts/kodjo/verify-queue-admission.js`
- `scripts/kodjo/verify-authorizations.js`
- `scripts/kodjo/run-queued-request.ps1`

### Références V2-BILAT réelles

- `.github/orchestration/queue/v2/V2-BILAT-01-resume-50c14550.json`
- `.github/orchestration/v2-slices/V2-BILAT-01/technical-plan.md`
- `.github/orchestration/v2-slices/V2-BILAT-01/independent-review.md`
- `.github/orchestration/v2-slices/V2-BILAT-01/slice-bootstrap.json`

### Parcours INITIAL actuel

- `.github/workflows/kodjo-v2-slice-initial-plan.yml`
- `.github/workflows/kodjo-v2-slice-initial-plan-review.yml`
- `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.29.md`

### Parcours REVIEW/RÉVISION actuel

- `.github/workflows/kodjo-v2-slice-plan.yml`
- `.github/workflows/kodjo-v2-slice-plan-review.yml`

### Raccordement transitoire à superséder

- `.github/workflows/kodjo-v2-comment-causal-implementation.yml`
- `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.32.md`
- `.github/orchestration/CHANGE_REPORT_0.6.32.md`

### Tranche V2-CAT-01 concernée

- `.github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json`
- `.github/orchestration/v2-activation-registry.json`

## Questions obligatoires pour l’audit

1. La proposition réutilise-t-elle réellement la frontière stable V2, ou recrée-t-elle encore une voie parallèle sous une autre forme ?
2. INITIAL et REVIEW/RÉVISION convergent-ils vers le même contrat avant IMPLEMENT ?
3. La matérialisation Git de `technical-plan.md` et `independent-review.md` est-elle suffisante pour réutiliser `verify-authorizations.js` sans l’altérer ?
4. Le gate utilisateur proposé reste-t-il conforme à la mécanique stable de `user_gate` ?
5. Le plan `scope_allow` peut-il être dérivé sans ressaisie depuis le plan approuvé et transporté directement dans `lean-request.0.6.13` ?
6. `planning_application_head` doit-il être ajouté au bootstrap INITIAL dès activation, et la migration proposée pour V2-CAT-01 est-elle cohérente avec le contrat stable ?
7. Quels éléments exacts introduits par 0.6.32 peuvent être supprimés sans casser une capacité indépendante déjà validée ?
8. La proposition modifie-t-elle implicitement `verify-queue-admission.js`, `verify-authorizations.js`, `run-queued-request.ps1`, recovery, RESUME_DELTA ou VISUAL_CORRECTION ? Si oui, est-ce réellement nécessaire ?
9. Existe-t-il un défaut de causalité ou une fenêtre de course entre matérialisation du plan/revue, gate utilisateur et création de la requête Lean Queue ?
10. Le design permet-il de tester le nouveau handoff sans requalifier le moteur V2 stable ?

## Verdict attendu

L’audit doit rendre l’un des trois verdicts suivants :

- `READY` : architecture applicable telle quelle ;
- `READY_WITH_FIXES` : architecture saine mais corrections précises nécessaires avant implémentation ;
- `NOT_READY` : défaut architectural majeur ou atteinte au socle stable.

Pour chaque correction demandée, préciser : fichier ou composant concerné, invariant violé, modification minimale attendue.
