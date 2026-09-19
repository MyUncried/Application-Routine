# KODJO V2 — Architecture globale du préflight déterministe 0.6.42

Date : 2026-09-19  
Base : `main@131c7f1f7c044aa6f366a0e3f30684d0729fa8cf`  
Objet : définir et valider l’architecture cible d’un préflight déterministe unique avant exécution d’une Lean Queue V2, sans encore modifier le runtime de production.

## 1. Décision architecturale

Le préflight V2 devient un **contrôle unique, agrégateur et opposable**, exécuté après sélection de la queue immuable et avant toute préparation mutable de l’exécution.

Il ne remplace pas les sources de vérité existantes. Il les orchestre.

Le principe est :

```
EVENT BOUNDARY
  ↓
QUEUE SELECTION
  ↓
UNIFIED DETERMINISTIC PREFLIGHT
  ↓
PREFLIGHT ATTESTATION
  ↓
EXECUTION PREPARATION
  ↓
FRESHNESS GUARDS
  ↓
CLAUDE
  ↓
POST-EXECUTION GATES
  ↓
IMPLEMENTATION REVIEW
  ↓
HUMAN / DEVICE
  ↓
FINAL_VERIFICATION
```

Le préflight n’est **ni un nouvel état protocolaire, ni un nouveau canal, ni une nouvelle queue**.

Il produit une preuve locale structurée consommée par le superviseur d’exécution.

## 2. Problème actuel

Les préconditions de démarrage existent déjà, mais elles sont dispersées entre :

- `verify-queue-admission.js` ;
- `lib/queue-contract.js` ;
- `verify-authorizations.js` ;
- `verify-visual-checkpoint.js` ;
- `run-queued-request.ps1` ;
- `verify-implementation-mission.js` ;
- `project-queued-request.js` / `normalizeRequest` ;
- `start-kodjo-v2.ps1` ;
- `prepare-visual-recovery.js` ;
- `run-local-claude.js` ;
- `lib/recovery-migration.js`.

Cette distribution est fonctionnellement robuste mais produit trois défauts opérationnels :

1. certaines erreurs ne sont découvertes qu’après franchissement d’une précondition précédente ;
2. des contrôles stables sont recalculés à plusieurs frontières ;
3. la différence entre une **condition prévisible avant exécution** et une **condition volatile devant être revalidée au dernier moment** n’est pas explicitement modélisée.

Le préflight unique doit corriger ces trois points sans supprimer les protections existantes.

## 3. Règle fondamentale : stable vs volatile

Toutes les préconditions sont classées dans une des trois catégories suivantes.

### 3.1 IMMUTABLE

Valeur liée à un blob, un commit ou un contenu Git immuable.

Exemples :
- queue blob OID ;
- plan blob OID ;
- review blob OID ;
- bootstrap hash ;
- plan contract ;
- matrice UI ;
- mission d’implémentation ;
- attestation versionnée dans Git ;
- `package-lock.json` au HEAD d’exécution.

Ces contrôles sont exécutés **une seule fois** dans le préflight et leur résultat est porté dans l’attestation.

### 3.2 LIVE

Valeur distante pouvant changer entre le préflight et l’effet mutable.

Exemples :
- PR toujours ouverte ;
- branche distante toujours au HEAD attendu ;
- commentaire checkpoint toujours identique ;
- réaction/gate utilisateur toujours exploitable ;
- HEAD applicatif toujours celui attendu.

Ces contrôles sont exécutés dans le préflight pour produire un diagnostic complet, puis **rejoués sous forme de freshness guards minimaux** immédiatement avant la mutation qui en dépend.

Ce rejeu n’est pas un second préflight : il ne reconstruit pas le contexte et ne réévalue pas les contrats stables.

### 3.3 RUNNER_VOLATILE

Capacité locale qui peut changer à très court terme.

Exemples :
- verrou d’exécution ;
- session Claude authentifiée ;
- disponibilité du binaire Claude ;
- version Claude ;
- espace disque ;
- accès réseau GitHub ;
- disponibilité de `git`, `node`, `npm`.

Le préflight vérifie les capacités détectables. Les propriétés pouvant changer entre deux instructions sont revalidées uniquement à la frontière d’utilisation.

## 4. Position exacte dans la chaîne

Le workflow `kodjo-v2-lean-queue.yml` conserve son déclenchement, sa concurrence et son canal actuels.

Architecture cible :

1. checkout du protocole ;
2. résolution `before/after` ;
3. résolution/téléchargement éventuel du recovery source ;
4. **sélection unique de la queue** ;
5. **préflight déterministe unique** ;
6. publication locale de l’attestation ;
7. appel de `run-queued-request.ps1` avec queue + attestation ;
8. préparation du checkout et des dépendances ;
9. freshness guards ;
10. Claude ;
11. contrôles, publication et revue existants.

Aucun appel Claude n’est permis avant l’étape 10.

## 5. Séparation SELECTION / PREFLIGHT

La sélection de la queue et le préflight sont deux responsabilités distinctes.

### 5.1 SELECTION

Responsabilité :
- `before/after` valides ;
- exactement une queue ajoutée ;
- aucune mutation/rename de queue ;
- anti-rerun ;
- anti-rejeu par path/blob ;
- unicité du `request_id`.

La sélection détermine **quelle demande** doit être étudiée.

Elle ne décide pas encore qu’elle est exécutable.

### 5.2 PREFLIGHT

Responsabilité :
- démontrer en une seule passe que la demande sélectionnée possède toutes les préconditions nécessaires à l’exécution ;
- collecter tous les échecs indépendants ;
- produire une attestation unique.

Le préflight détermine **si la demande peut commencer**.

## 6. Sources de vérité

Le préflight ne redéfinit aucune règle.

| Domaine | Source de vérité |
|---|---|
| Schéma Lean Queue | `lib/queue-contract.js` |
| Périmètre | `lib/scope-path.js` |
| PLAN/review/user gate | `verify-authorizations.js` |
| Checkpoint visuel | `verify-visual-checkpoint.js` |
| Recovery migration | `lib/recovery-migration.js` |
| PLAN contract | `verify-plan-contract-consistency.js` |
| UI PLAN contract | `verify-ui-plan-criteria.js` |
| Mission IMPLEMENT | `verify-implementation-mission.js` / `lib/implementation-contract.js` |
| Projection locale | `project-queued-request.js` + `normalizeRequest` |
| Prompt effectif | `lib/claude-local.js::buildPrompt` |
| Version Claude | `CLAUDE_CODE_VERSION` dans `lib/claude-local.js` |
| Verrou runner | `lib/execution-lock.js` |
| Review implémentation | `verify-ui-implementation-review.js` |
| Finalisation | `verify-v2-finalization.js` |

Le futur orchestrateur `verify-queue-preflight.js` doit appeler/importer ces implémentations. Il lui est interdit de recopier leurs règles.

## 7. Matrice des familles de contrôle

### P0 — Identité de la demande

Contrôles :
- boundary Git ;
- queue unique ajoutée ;
- blob OID de queue ;
- request_id unique ;
- queue non consommée ;
- run attempt nominal.

Statut cible : `SELECTION`.

### P1 — Contrat Lean Queue

Contrôles :
- schéma 0.6.13 ;
- propriétés autorisées ;
- mode ;
- operation_kind ;
- retry_reason ;
- checks ;
- limits ;
- scope_allow ;
- delivery_target/checkpoint selon l’opération.

Source : `lib/queue-contract.js`.

### P2 — Identité tranche / bootstrap / HEAD protocolaire

Contrôles :
- bootstrap présent et hash exact ;
- slice_id / issue / baseline cohérents ;
- source_head Git existant ;
- source_head dans la lignée autorisée ;
- activation de tranche si applicable.

### P3 — Autorisations causales

Contrôles :
- plan exact ;
- review exact ;
- plan revu = plan exécuté ;
- gate utilisateur exact ;
- evidence_kind ;
- ancre d’approbation ;
- migration éventuelle liée au bon plan/review/gate.

Source : `verify-authorizations.js`.

### P4 — Contrats produit/plan

Pour `IMPLEMENT` :
- plan contract courant consommable ;
- UI contract courant si UI applicable ;
- mission d’implémentation liée au même `plan_blob_oid` ;
- scope de mission = scope approuvé ;
- barrières canoniques présentes ;
- tests/proofs/preservation liés au plan.

Pour `VISUAL_CORRECTION` :
- ne pas imposer le contrat complet du diff initial ;
- conserver le plan approuvé comme référence ;
- contrôler uniquement la causalité de la correction bornée.

### P5 — Cible applicative

Pour `IMPLEMENT` :
- HEAD d’exécution = `source_head`.

Pour `VISUAL_CORRECTION` :
- PR existante ;
- base `main` ;
- branche exacte ;
- application_head exact ;
- ref distante exacte ;
- checkpoint certifié exact ;
- attestation de migration si une migration est réellement invoquée.

Les trois HEAD restent distincts :
- `protocol_head` ;
- `planning_application_head/scan_revision` ;
- `execution/application_head`.

Aucune architecture future ne peut les forcer silencieusement à l’égalité.

### P6 — Recovery

Contrôles :
- retry source présent pour RESUME_DELTA ;
- package attendu disponible si nécessaire ;
- manifest/recovery parseable ;
- scope recovery admissible ;
- attestation de migration présente uniquement lorsque requise ;
- provenance et cible certifiée cohérentes.

Le préflight **inspecte** le paquet mais ne restaure aucun fichier.

### P7 — Projection locale

Le préflight produit en mémoire ou dans `RUNNER_TEMP` une projection exacte de la queue vers le contrat local.

Il exécute :
- `project-queued-request.js` ;
- `normalizeRequest`.

Il vérifie avant toute mutation :
- `source_head` effectif ;
- `protocol_source_head` ;
- `scope_allow` ;
- `checks` ;
- `limits` ;
- `session_id` ;
- `prompt_file` ;
- `delivery_target` ;
- `recovery_migration`.

La projection est hachée et liée à l’attestation.

### P8 — Prompt / budget

Avant Claude, mais dans le préflight :

- le prompt effectif est construit avec la même fonction `buildPrompt` ;
- sa taille exacte est mesurée ;
- `max_prompt_bytes` et `max_total_prompt_bytes` sont opposés ;
- aucun prompt complet n’est reconstruit pendant un `RESUME_DELTA` si le contrat l’interdit.

Aucun appel Claude n’est effectué.

### P9 — Capacités runner

Contrôles :
- OS/runner attendu ;
- `git` ;
- `node` ;
- `npm` ;
- Claude disponible ;
- version Claude exacte ;
- auth/session Claude lisible ;
- espace disque minimum ;
- `GH_TOKEN` présent et API GitHub lisible.

Le préflight ne prétend pas figer ces capacités. Les éléments volatils sont revalidés à leur frontière.

### P10 — Lock / concurrence

Le préflight valide :
- mécanisme de verrou disponible ;
- absence de verrou manifestement résiduel selon les règles existantes.

L’acquisition exclusive finale reste un **freshness guard atomique** juste avant Claude.

Le préflight ne peut jamais transformer « lock libre à T0 » en garantie de disponibilité à T1.

## 8. Attestation de préflight

Schéma cible :

`kodjo.protocol.v2.queue-preflight.v1`

Champs minimaux :

```json
{
  "schema_version": "kodjo.protocol.v2.queue-preflight.v1",
  "status": "PASS",
  "queue_path": "...",
  "queue_blob_oid": "...",
  "request_id": "...",
  "event_before": "...",
  "event_after": "...",
  "protocol_head": "...",
  "execution_head": "...",
  "operation_kind": "IMPLEMENT|VISUAL_CORRECTION",
  "mode": "INITIAL|RESUME_DELTA",
  "checks": [],
  "bindings": {},
  "freshness_guards_required": [],
  "projection_sha256": "...",
  "prompt_sha256": "...",
  "prompt_bytes": 0,
  "preflight_fingerprint": "..."
}
```

La structure `checks` utilise uniquement des résultats de contrôle :
- `PASS`
- `FAIL`
- `BLOCKED`
- `NOT_APPLICABLE`

Ces valeurs **ne sont pas des états protocolaires**.

### Collecte exhaustive

Le préflight n’utilise pas un mode « fail-fast » global.

Il :
1. exécute tous les contrôles indépendants ;
2. marque `BLOCKED` lorsqu’un contrôle dépend d’un prérequis déjà invalide ;
3. publie l’ensemble des diagnostics dans un seul rapport ;
4. retourne un code non nul si au moins un `FAIL` ou `BLOCKED` existe.

Ainsi un run ne doit plus révéler successivement une série de défauts prévisibles.

## 9. Fingerprint et opposition

Le `preflight_fingerprint` couvre les seules données déterministes :

- queue blob ;
- before/after ;
- source/protocol/application heads ;
- bootstrap hash ;
- plan/review blobs ;
- gate reference ;
- checkpoint reference ;
- attestation blob ;
- normalized local request ;
- scope ;
- checks/limits ;
- prompt hash/size ;
- package-lock hash ;
- versions outillage requises.

Il exclut :
- timestamps ;
- identifiants de run ;
- métriques ;
- texte de diagnostic non normatif.

## 10. Consommation par l’exécution

`run-queued-request.ps1` doit à terme recevoir :

```
-QueueFile <path>
-PreflightFile <path>
```

Avant toute mutation, il vérifie :

1. schéma attestation ;
2. `status=PASS` ;
3. même queue path ;
4. même queue blob OID ;
5. même request_id ;
6. même protocol/execution head ;
7. fingerprint valide.

Il lui est interdit de recalculer un contrat stable déjà attesté.

## 11. Freshness guards autorisés après PASS

Seuls les contrôles suivants peuvent subsister en double lecture après le préflight :

### Avant checkout/mutation Git

- queue blob inchangé ;
- target PR toujours ouverte ;
- target branch toujours identique ;
- remote application HEAD toujours identique.

### Avant Claude

- checkout toujours au HEAD attesté ;
- worktree dans l’état attendu ;
- lock acquis atomiquement ;
- Claude toujours disponible/authentifié ;
- prompt file et fingerprint inchangés.

### Avant push/publication

- branche distante n’a pas avancé depuis la borne attendue ;
- PR reste ouverte ;
- publication correspond au nouveau HEAD produit.

Ces guards doivent être courts, sans reconstruire PLAN/review/scope/recovery.

## 12. Ce que le préflight ne doit jamais absorber

Le préflight ne remplace pas :

- PLAN ;
- PLAN_REVIEW ;
- USER_IMPLEMENTATION_APPROVED ;
- les barrières `CHANGE_REQUEST_REQUIRED`, `SCOPE_EXPANSION_REQUIRED`, `NATIVE_PRIMITIVE_EXCEPTION_REQUIRED`, `CLARIFICATION_REQUIRED` ;
- les tests post-implémentation ;
- IMPLEMENTATION_REVIEW ;
- la revue différentielle de `VISUAL_CORRECTION` ;
- le gate humain/device ;
- FINAL_VERIFICATION.

Il ne prédit pas la conformité du code qui n’existe pas encore.

## 13. Cohérence avec les cinq invariants

### I1 — Exhaustivité / traçabilité atomique

Chaque précondition devient un check nommé, sourcé et relié à une évidence.

Aucun « préflight vert » ne peut être déclaré sans matrice complète.

### I2 — Réutilisation / conservation

L’orchestrateur réutilise les validateurs existants.

Aucune règle n’est recodée dans un second moteur.

### I3 — Preuve adaptée au risque

- Git/blob → empreinte ;
- GitHub live → lecture API ;
- runner → capability probe ;
- lock → acquisition atomique ;
- prompt → hash + taille ;
- device → reste hors préflight.

### I4 — Contrôle indépendant / clôture probante

Le préflight vérifie l’admissibilité à l’exécution, pas la conformité finale.

IMPLEMENTATION_REVIEW et FINAL_VERIFICATION restent indépendants.

### I5 — Discipline exécution / changement

Aucune mutation ni invocation Claude avant PASS.

Tout drift live entre PASS et effet mutable est stoppé par un freshness guard ciblé.

## 14. Compatibilité par chemin

| Chemin | Préflight complet | Contrat IMPLEMENT complet | Checkpoint existant | Recovery | Gate humain final |
|---|---:|---:|---:|---:|---:|
| IMPLEMENT / INITIAL | oui | oui | non | non | selon preuve |
| IMPLEMENT / RESUME_DELTA | oui | oui | selon historique | oui | selon preuve |
| VISUAL_CORRECTION / RESUME_DELTA | oui | non — delta historique | oui | baseline checkpoint / migration éventuelle | oui |
| Legacy non-V2 | hors périmètre | inchangé | inchangé | inchangé | inchangé |

## 15. Migration cible en trois lots

### Lot A — moteur de préflight sans changement de comportement

Créer :
- `scripts/kodjo/verify-queue-preflight.js` ;
- `scripts/kodjo/lib/preflight-contract.js` ;
- attestation locale ;
- tests synthétiques.

Le workflow continue temporairement à exécuter les contrôles historiques en aval.

Objectif : démontrer que le nouveau préflight donne le même verdict que la chaîne actuelle.

### Lot B — consommation de l’attestation

- passer `PreflightFile` à `run-queued-request.ps1` ;
- refuser toute attestation divergente ;
- déplacer hors des chemins aval les contrôles stables déjà attestés ;
- conserver uniquement les freshness guards.

Objectif : une seule évaluation stable, aucun affaiblissement.

### Lot C — qualification E2E et suppression des duplications

- nominal IMPLEMENT ;
- RESUME_DELTA ;
- VISUAL_CORRECTION ;
- recovery migration ;
- HEAD déplacé après preflight ;
- PR fermée après preflight ;
- lock devenu occupé après preflight ;
- prompt modifié après preflight ;
- queue/blob différent ;
- contrôle multi-erreurs : toutes les erreurs indépendantes doivent apparaître dans le même rapport.

Aucune ancienne vérification ne peut être supprimée tant que son invariant n’est pas prouvé par le nouveau préflight + freshness guard.

## 16. Critères d’acceptation de l’architecture

L’architecture est considérée cohérente uniquement si :

1. chaque contrôle pré-Claude actuel est rattaché à exactement une catégorie : SELECTION, PREFLIGHT, FRESHNESS_GUARD ou EXECUTION/POST ;
2. aucun contrôle stable n’a deux sources de vérité ;
3. tous les chemins IMPLEMENT et VISUAL_CORRECTION sont couverts ;
4. les trois HEAD du protocole restent distincts ;
5. recovery/checkpoint/attestation conservent leur sémantique actuelle ;
6. aucun état protocolaire n’est ajouté ;
7. le legacy reste hors périmètre ;
8. review/finalization ne sont pas absorbés ;
9. la matrice machine associée est validée par test ;
10. l’implémentation ne commence qu’après validation de cette architecture.

## 17. Verdict d’architecture

**ARCHITECTURE PROPOSÉE : COHÉRENTE SOUS RÉSERVE DE VALIDATION MACHINE DE LA MATRICE ET DE LA CHAÎNE COURANTE.**

Cette version 0.6.42 est volontairement une étape d’architecture. Elle n’active pas encore le préflight unique en production.
