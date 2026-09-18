# KODJO V2 — Architecture cible du handoff PLAN approuvé → IMPLEMENT

Date : 2026-09-18  
Statut : PROPOSITION CORRIGÉE APRÈS AUDIT INDÉPENDANT — PRÊTE POUR IMPLÉMENTATION APRÈS VALIDATION  
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

L’audit indépendant de cette proposition a rendu `READY_WITH_FIXES`. Les quatre corrections demandées sont intégrées dans la présente version :
- matérialisation explicite de `implementation-mission.md` ;
- définition déterministe de `source_head` ;
- règle explicite pour `planning_application_head` ;
- supersession déterministe des plans approuvés antérieurs.

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

Mais, avant le gate utilisateur, le plan approuvé, la revue approuvée et la mission d’implémentation doivent être matérialisés comme artefacts Git versionnés dans :

- `.github/orchestration/v2-slices/<slice>/technical-plan.md` ;
- `.github/orchestration/v2-slices/<slice>/independent-review.md` ;
- `.github/orchestration/v2-slices/<slice>/implementation-mission.md`.

Les blob OID du plan et de la revue deviennent les preuves `ARTIFACT_HASH` déjà attendues par le contrat Lean Queue.

Aucun passage `gh api → Out-File → JSON.parse()` n’est requis au moment de l’implémentation.

### 3.3 Matérialisation commune INITIAL / REVIEW

Quand une revue rend `APPROVE`, le workflow de revue concerné doit appeler le même mécanisme de matérialisation déterministe :

1. prendre exactement le `PLAN_OUTPUT` revu ;
2. prendre exactement le `PLAN_REVIEW_OUTPUT` APPROVE ;
3. écrire ces contenus dans `technical-plan.md` et `independent-review.md` ;
4. produire `implementation-mission.md` de manière déterministe à partir du plan approuvé ;
5. appliquer, si nécessaire, la mise à jour de `planning_application_head` définie au §4 ;
6. créer **un seul commit protocolaire de matérialisation**, sans fichier applicatif, contenant ces artefacts et les seules mises à jour d’identité nécessaires ;
7. calculer `plan_blob_oid`, `review_blob_oid` et `approved_at_commit`, où `approved_at_commit` est exactement ce commit de matérialisation ;
8. publier un commentaire de gate canonique contenant au minimum le `plan_blob_oid`, la tranche et `approved_at_commit`.

Ce mécanisme est identique pour INITIAL et pour REVIEW/RÉVISION. La différence entre les deux parcours reste uniquement en amont, pendant la construction et la revue du plan.

#### Contrat de `implementation-mission.md`

`implementation-mission.md` est requis parce que `prompt_file` est obligatoire dans `lean-request.0.6.13`.

Il ne constitue **pas** une nouvelle source fonctionnelle ou un second plan. Il est une enveloppe d’exécution déterministe du plan approuvé et doit :

- référencer la tranche, `technical-plan.md` et le `plan_blob_oid`, calculable avant la création du commit ;
- ordonner à l’agent d’implémenter exclusivement le plan approuvé ;
- rappeler que `scope_allow` de la Lean Request est opposable et qu’aucun élargissement n’est autorisé ;
- référencer les checks autorisés par la demande ;
- imposer `CLARIFICATION_REQUIRED` si une règle nécessaire n’est pas déterminable depuis le plan approuvé et ses sources ;
- ne contenir aucune décision produit ou technique nouvelle absente du plan approuvé ;
- ne pas embarquer `approved_at_commit` : cette valeur n’existe qu’après création du commit qui contient la mission et est portée ensuite par le gate et la Lean Request, afin d’éviter toute auto-référence cryptographique.

Sa génération doit être mécanique. Toute information métier ou technique qui modifierait le sens du plan doit d’abord être intégrée au plan et revue ; elle ne peut pas être introduite par `implementation-mission.md`.

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

### 3.5 Définition déterministe de `source_head`

Pour une demande IMPLEMENT issue de ce handoff :

- `source_head` est **exactement `approved_at_commit`**, c’est-à-dire le commit protocolaire de matérialisation défini au §3.3 ;
- il n’est jamais égal par défaut à `baseline_head` ;
- il n’est pas recalculé depuis le HEAD courant au moment où l’utilisateur approuve ;
- il ne peut être remplacé par un commit postérieur sans nouvelle vérification causale.

Cette règle satisfait par construction l’invariant existant de `verify-authorizations.js` :

`approved_at_commit` doit être un ancêtre de `source_head`.

Ici, pour le handoff initial, ils sont identiques. La demande Lean Queue est ajoutée dans un commit ultérieur de queue, mais elle continue à porter comme `source_head` le commit immuable de matérialisation. Le superviseur retrouve donc à ce HEAD les artefacts et `implementation-mission.md` exacts approuvés.

Avant création de la demande, le générateur doit vérifier explicitement :

`git merge-base --is-ancestor <approved_at_commit> <source_head>`

et, dans ce parcours, exiger en plus :

`source_head == approved_at_commit`.

L’échec bloque la génération de la demande avant l’admission Lean Queue.

### 3.6 Production directe de la demande Lean Queue

Après gate utilisateur :

1. relire le `plan_blob_oid`, le `review_blob_oid` et `approved_at_commit` du commit de matérialisation ;
2. vérifier la règle de supersession du §5 ;
3. dériver `scope_allow` du contrat de plan approuvé, sans ressaisie ;
4. fixer `source_head = approved_at_commit` ;
5. fixer `prompt_file=.github/orchestration/v2-slices/<slice>/implementation-mission.md` et vérifier que ce fichier existe à `source_head` ;
6. construire directement un fichier sous `.github/orchestration/queue/v2/<slice>-implement-<id>.json` ;
7. utiliser exactement `schema_version=kodjo.protocol.v2.lean-request.0.6.13` ;
8. renseigner `authorized_plan`, `independent_review`, `user_gate` dans leurs formes déjà admises ;
9. utiliser `mode=INITIAL`, `session_id=null`, `operation_kind=IMPLEMENT` pour ce premier passage d’implémentation ;
10. laisser le workflow existant `kodjo-v2-lean-queue.yml` faire l’admission et l’exécution.

Le nom de fichier emploie `implement` et non `initial` afin de ne pas encoder à tort l’origine du plan dans le transport commun.

Aucune transformation supplémentaire après création de ce fichier.

## 4. Règle de `planning_application_head`

`planning_application_head` désigne **la révision applicative exacte sur laquelle le plan courant a été scanné**.

### 4.1 Nouvelle tranche INITIAL

À l’activation d’une nouvelle tranche :

- `planning_application_head` est obligatoire ;
- sa valeur initiale est exactement `baseline_head` ;
- cette égalité est vérifiée au moment de l’activation.

Ainsi, une nouvelle tranche ne possède pas deux identités indépendantes représentant arbitrairement la même révision : `planning_application_head` est initialisé mécaniquement depuis `baseline_head`.

### 4.2 Plan ultérieur scanné sur une autre révision

Si un PLAN ultérieur est calculé sur une révision applicative différente :

- `planning_application_head` doit être mis à jour explicitement vers le `scan_revision` réellement utilisé ;
- cette mise à jour est protocolaire et ne change ni le code applicatif ni les décisions produit ;
- le `slice_bootstrap_sha256` doit être recalculé ;
- la même nouvelle empreinte doit être reportée dans le registre d’activation ;
- ces modifications doivent faire partie de la matérialisation canonique avant création du gate utilisateur.

Le handoff est refusé si :

`planning_application_head != KODJO_PLAN_IMPACT_JSON.scan_revision`.

### 4.3 Migration de V2-CAT-01

Pour `V2-CAT-01`, dont le bootstrap actif ne porte pas encore ce champ, la migration est explicite :

- ajouter `planning_application_head` égal à la révision réellement scannée par le PLAN approuvé ;
- recalculer `slice_bootstrap_sha256` ;
- mettre à jour la même empreinte dans `v2-activation-registry.json` ;
- effectuer ces changements dans le commit protocolaire de matérialisation ou dans un commit protocolaire préparatoire qui en est un ancêtre direct ;
- ne modifier aucun fichier applicatif ni aucune décision produit.

## 5. Supersession déterministe des plans approuvés

Une tranche ne peut avoir qu’**un seul plan approuvé courant admissible à IMPLEMENT**.

Le mécanisme ne crée pas de nouveau registre exécutable. Il s’appuie sur le chemin canonique déjà existant :

`.github/orchestration/v2-slices/<slice>/technical-plan.md`.

### 5.1 Règle

À chaque nouvelle matérialisation approuvée :

- `technical-plan.md` est remplacé par le nouveau PLAN approuvé ;
- son nouveau `plan_blob_oid` devient l’unique référence courante admissible ;
- si un plan antérieur existait, le commentaire de matérialisation/gate mentionne son `plan_blob_oid` comme `supersedes_plan_blob_oid` à des fins de traçabilité ;
- l’ancien commentaire de gate peut subsister comme historique, mais il ne peut plus produire une nouvelle Lean Request.

### 5.2 Contrôle obligatoire avant génération d’une Lean Request

Au moment de générer la demande, le handoff doit vérifier simultanément :

1. que le `gated_reference` approuvé par l’utilisateur est le `plan_blob_oid` attendu ;
2. que ce blob est exactement le blob courant de :
   `<approved_at_commit>:.github/orchestration/v2-slices/<slice>/technical-plan.md` ;
3. qu’aucune matérialisation approuvée plus récente de cette tranche n’existe sur la branche cible ;
4. que le `technical-plan.md` courant de la tranche sur la branche cible porte toujours le même `plan_blob_oid`.

Si l’un de ces contrôles échoue, le plan est considéré comme supersédé et la génération est refusée avec un statut explicite de type `PLAN_SUPERSEDED`.

Ainsi, deux gates historiques peuvent exister dans l’Issue, mais **un seul peut encore conduire à une nouvelle demande d’implémentation**.

Cette règle ferme également la fenêtre de course entre matérialisation, approbation utilisateur et création de la Lean Request : toute nouvelle matérialisation intervenue entre-temps rend automatiquement l’ancien gate non consommable.

## 6. Convergence INITIAL et REVIEW

### INITIAL

`START_INITIAL_PLAN`
→ `PLAN_OUTPUT planning_mode=INITIAL`
→ `START_INITIAL_PLAN_REVIEW`
→ `PLAN_REVIEW_OUTPUT APPROVE`
→ matérialisation canonique plan/revue/mission
→ gate utilisateur canonique
→ contrôle de non-supersession
→ `lean-request.0.6.13`
→ Lean Queue stable.

### REVIEW / RÉVISION

`START_PLAN_REVISION`
→ `PLAN_OUTPUT`
→ `START_PLAN_REVIEW`
→ `PLAN_REVIEW_OUTPUT APPROVE`
→ **même matérialisation canonique plan/revue/mission**
→ **même gate utilisateur canonique**
→ **même contrôle de non-supersession**
→ **même `lean-request.0.6.13`**
→ Lean Queue stable.

Il ne doit exister aucune divergence de transport après `PLAN_REVIEW_APPROVED`.

## 7. Éléments transitoires à superséder dans la même évolution

L’implémentation de cette architecture doit supprimer/superséder les éléments introduits uniquement pour le raccordement 0.6.32 :

- `.github/workflows/kodjo-v2-comment-causal-implementation.yml` ;
- `.github/orchestration/queue/v2-causal/*` ;
- schéma `kodjo.protocol.v2.comment-causal-request.0.6.32` ;
- branchement `-LocalRequestFile` ajouté à `run-queued-request.ps1` si aucune autre dépendance réelle ne le justifie ;
- exceptions de remote-write ajoutées uniquement pour le workflow comment-causal ;
- correctifs Unicode/BOM spécifiques à cette voie **uniquement après preuve qu’aucun autre consommateur réel ne les utilise**.

Le nettoyage fait partie de la reconstruction ; aucun ancien et nouveau chemin IMPLEMENT ne doivent coexister.

Le retrait d’un correctif générique d’encodage ou Unicode n’est jamais déduit du seul abandon de 0.6.32 : il exige une recherche de consommateurs effective.

## 8. Éléments explicitement hors périmètre

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

## 9. Critères d’acceptation architecturale avant implémentation

L’architecture est acceptable uniquement si :

1. un seul contrat exécutable existe après review : `lean-request.0.6.13` ;
2. INITIAL et REVIEW convergent avant IMPLEMENT ;
3. aucune transformation runtime parallèle n’existe après création de la demande Lean Queue ;
4. les preuves plan/revue sont des blobs Git immuables compatibles avec `verify-authorizations.js` ;
5. `implementation-mission.md` est matérialisé déterministement et utilisé comme `prompt_file` sans devenir une nouvelle source de décision ;
6. `source_head == approved_at_commit` pour ce handoff et l’ancestralité est contrôlée avant génération ;
7. `planning_application_head` est obligatoire, initialisé depuis `baseline_head` puis mis à jour uniquement vers la révision réellement scannée ;
8. le gate utilisateur reste compatible avec la mécanique stable existante ;
9. le scope est dérivé du plan approuvé et non ressaisi ;
10. un plan supersédé ne peut pas produire de nouvelle demande ;
11. le socle Lean Queue n’est pas reconfiguré ;
12. les éléments 0.6.32 transitoires sont supprimés uniquement après contrôle de leurs consommateurs ;
13. le design permet les deux tests E2E bornés :
   - `E2E-INITIAL-PLAN` ;
   - `E2E-PLAN-HANDOFF`, commun aux origines INITIAL et REVIEW/RÉVISION ;
14. `E2E-PLAN-HANDOFF` vérifie en plus :
   - convergence des demandes produites depuis les deux origines, hors `request_id` et `created_at` ;
   - ancestralité et égalité `source_head == approved_at_commit` ;
   - existence de `implementation-mission.md` à `source_head` ;
   - refus d’un plan supersédé ;
   - absence de voie `v2-causal` exécutable parallèle.
