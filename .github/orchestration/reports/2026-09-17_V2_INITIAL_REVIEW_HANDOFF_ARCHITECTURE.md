# KODJO V2 — Architecture cible du handoff PLAN approuvé → IMPLEMENT

Date : 2026-09-17
Statut : PROPOSITION À AUDITER AVANT IMPLÉMENTATION
Branche : `protocol/v2-initial-handoff-redesign-20260917`

## 1. Point de départ

Le socle d’exécution KODJO V2 ayant permis de clôturer `V2-BILAT-01` est considéré comme stable et hors périmètre de refonte :

`.github/orchestration/queue/v2/*.json` (`kodjo.protocol.v2.lean-request.0.6.13`)
→ `verify-queue-admission.js`
→ `verify-authorizations.js`
→ `run-queued-request.ps1`
→ `start-kodjo-v2.ps1`
→ `run-local-claude.js`.

Ce chemin a été éprouvé en réel, notamment avec les demandes V2-BILAT-01 versionnées dans `queue/v2/`.

Depuis 0.6.29, un nouveau parcours de premier plan `INITIAL` a été ajouté. Depuis 0.6.31/0.6.32, le raccordement d’un plan approuvé vers IMPLEMENT a été tenté par une voie parallèle (`queue/v2-causal`, workflow comment-causal, projection vers un format local), ce qui a réintroduit des frontières techniques non présentes dans le chemin Lean Queue stable.

## 2. Objectif final

Obtenir un seul handoff vers IMPLEMENT, commun aux deux origines de plan :

- premier plan d’une nouvelle tranche : `START_INITIAL_PLAN → PLAN_OUTPUT → START_INITIAL_PLAN_REVIEW` ;
- révision d’un plan existant : `START_PLAN_REVISION → PLAN_OUTPUT → START_PLAN_REVIEW`.

Après `PLAN_REVIEW_APPROVED` et validation utilisateur explicite, les deux parcours doivent converger vers **une demande Lean Queue canonique `kodjo.protocol.v2.lean-request.0.6.13` directement admise par le socle existant**.

Aucun second workflow d’implémentation, aucune `queue/v2-causal`, aucune projection `comment-causal-request → local-implementation`, aucun `agent_adapter` parallèle.

## 3. Principe d’architecture

### 3.1 Une seule représentation exécutable

La seule représentation exécutable d’une autorisation d’implémentation reste le contrat Lean Queue existant :

`kodjo.protocol.v2.lean-request.0.6.13`.

Le handoff PLAN→IMPLEMENT doit uniquement produire cette structure. Il ne crée aucun nouveau schéma d’exécution.

### 3.2 Les commentaires GitHub restent des événements et des traces, pas le transport runtime

`PLAN_OUTPUT` et `PLAN_REVIEW_OUTPUT` peuvent continuer à être publiés sur l’Issue pour lisibilité et orchestration humaine.

Mais, avant le gate utilisateur, le plan approuvé et la revue approuvée doivent être matérialisés comme les artefacts Git déjà attendus par `verify-authorizations.js` :

- `.github/orchestration/v2-slices/<slice>/technical-plan.md` ;
- `.github/orchestration/v2-slices/<slice>/independent-review.md`.

Leurs blob OID Git deviennent les preuves `ARTIFACT_HASH` du contrat Lean Queue.

Aucun passage `gh api → Out-File → JSON.parse()` n’est requis au moment de l’implémentation.

### 3.3 Matérialisation commune INITIAL / REVIEW

Quand une revue rend `APPROVE`, le workflow de revue concerné doit appeler le même mécanisme de matérialisation déterministe :

1. prendre exactement le `PLAN_OUTPUT` revu ;
2. prendre exactement le `PLAN_REVIEW_OUTPUT` APPROVE ;
3. écrire les deux contenus dans `technical-plan.md` et `independent-review.md` ;
4. créer un commit protocolaire contenant ces deux artefacts, sans fichier applicatif ;
5. calculer `plan_blob_oid`, `review_blob_oid`, `approved_at_commit` ;
6. publier un commentaire de gate canonique contenant au minimum le `plan_blob_oid`, la tranche et le commit d’approbation.

Ce mécanisme est identique pour INITIAL et pour REVIEW/RÉVISION. La différence entre les deux parcours reste uniquement en amont, pendant la construction et la revue du plan.

### 3.4 Gate utilisateur réutilisant l’autorisation V2 stable

Le contrat Lean Queue stable attend :

```json
"user_gate": {
  "gate_ref": "issue_comment:<id>",
  "gated_reference": "<plan_blob_oid>",
  "decision": "APPROVED",
  "user_login": "MyUncried",
  "evidence_kind": "ORGANISATIONAL"
}
```

`verify-authorizations.js` vérifie déjà ce gate via GitHub et exige la réaction `+1` du propriétaire du dépôt sur le commentaire référencé.

Cette mécanique n’est pas modifiée.

L’approbation utilisateur donnée à ChatGPT Protocole peut être matérialisée en ajoutant cette réaction `+1` au commentaire de gate canonique, puis seulement après en produisant la demande Lean Queue.

### 3.5 Production directe de la demande Lean Queue

Après gate utilisateur :

1. lire les OID Git des deux artefacts déjà matérialisés ;
2. dériver `scope_allow` du contrat de plan approuvé, sans ressaisie ;
3. construire directement un fichier sous `.github/orchestration/queue/v2/<slice>-initial-<id>.json` ;
4. utiliser exactement `schema_version=kodjo.protocol.v2.lean-request.0.6.13` ;
5. renseigner `authorized_plan`, `independent_review`, `user_gate` dans leurs formes déjà admises ;
6. `mode=INITIAL`, `session_id=null`, `operation_kind=IMPLEMENT` ;
7. laisser le workflow existant `kodjo-v2-lean-queue.yml` faire l’admission et l’exécution.

Aucune transformation supplémentaire après création de ce fichier.

## 4. Particularité du planning_application_head

`verify-authorizations.js` exige déjà, pour les plans portant `KODJO_PLAN_IMPACT_JSON`, que le bootstrap contienne `planning_application_head` et que celui-ci corresponde à `scan_revision` du plan.

Cette règle a déjà été utilisée par le parcours V2-BILAT.

Pour toute nouvelle activation de tranche, `planning_application_head` doit donc être présent dès la création de l’identité de tranche.

Pour une tranche déjà active qui ne le possède pas, comme `V2-CAT-01`, une migration d’identité protocolaire explicite est nécessaire avant handoff : ajout de `planning_application_head` égal à la révision réellement scannée par le plan, puis mise à jour cohérente du `slice_bootstrap_sha256` dans le bootstrap et le registre d’activation. Cette migration ne modifie aucun code applicatif ni décision produit.

## 5. Convergence INITIAL et REVIEW

### INITIAL

`START_INITIAL_PLAN`
→ `PLAN_OUTPUT planning_mode=INITIAL`
→ `START_INITIAL_PLAN_REVIEW`
→ `PLAN_REVIEW_OUTPUT APPROVE`
→ matérialisation canonique plan/revue
→ gate utilisateur canonique
→ `lean-request.0.6.13`
→ Lean Queue stable.

### REVIEW / RÉVISION

`START_PLAN_REVISION`
→ `PLAN_OUTPUT`
→ `START_PLAN_REVIEW`
→ `PLAN_REVIEW_OUTPUT APPROVE`
→ **même matérialisation canonique**
→ **même gate utilisateur canonique**
→ **même `lean-request.0.6.13`**
→ Lean Queue stable.

Il ne doit exister aucune divergence de transport après `PLAN_REVIEW_APPROVED`.

## 6. Éléments transitoires à superséder dans la même évolution

L’implémentation de cette architecture doit supprimer/superséder les éléments introduits uniquement pour le raccordement 0.6.32 :

- `.github/workflows/kodjo-v2-comment-causal-implementation.yml` ;
- `.github/orchestration/queue/v2-causal/*` ;
- schéma `kodjo.protocol.v2.comment-causal-request.0.6.32` ;
- branchement `-LocalRequestFile` ajouté à `run-queued-request.ps1` si aucune autre dépendance réelle ne le justifie ;
- exceptions de remote-write ajoutées uniquement pour le workflow comment-causal ;
- correctifs Unicode/BOM spécifiques à cette voie s’ils deviennent sans consommateur.

Le nettoyage fait partie de la reconstruction ; aucun ancien et nouveau chemin IMPLEMENT ne doivent coexister.

## 7. Éléments explicitement hors périmètre

Ne pas modifier :

- sémantique de `lean-request.0.6.13` ;
- `verify-queue-admission.js` sauf preuve d’un défaut indépendant de ce handoff ;
- sémantique de `verify-authorizations.js` ;
- `run-queued-request.ps1` hors retrait du branchement transitoire 0.6.32 ;
- `start-kodjo-v2.ps1` ;
- `run-local-claude.js` ;
- recovery/checkpoint ;
- `RESUME_DELTA` ;
- `VISUAL_CORRECTION` ;
- publication PR applicative ;
- règles produit de V2-CAT-01.

## 8. Critères d’acceptation architecturale avant implémentation

L’architecture est acceptable uniquement si l’audit indépendant confirme :

1. un seul contrat exécutable après review : `lean-request.0.6.13` ;
2. INITIAL et REVIEW convergent avant IMPLEMENT ;
3. aucune transformation runtime parallèle après création de la demande Lean Queue ;
4. les preuves plan/revue sont des blobs Git immuables compatibles avec `verify-authorizations.js` ;
5. le gate utilisateur reste compatible avec la mécanique stable existante ;
6. le scope est dérivé du plan approuvé et non ressaisi ;
7. le socle Lean Queue n’est pas reconfiguré ;
8. les éléments 0.6.32 transitoires peuvent être supprimés sans perte d’une capacité validée indépendante ;
9. le design permet ensuite deux tests E2E bornés : `E2E-INITIAL-PLAN` et `E2E-PLAN-HANDOFF`, le second étant commun aux origines INITIAL et REVIEW.
