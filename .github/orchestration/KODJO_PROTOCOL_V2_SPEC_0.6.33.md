# KODJO Protocol V2 — spécification 0.6.33

Date : 2026-09-18  
Base : 0.6.32  
Objet : convergence des parcours INITIAL et REVIEW/RÉVISION vers la Lean Queue canonique.

## 1. Décision

La voie 0.6.32 `queue/v2-causal → workflow comment-causal → local-implementation` est supersédée.

Après `PLAN_REVIEW_APPROVED`, les parcours :

- `START_INITIAL_PLAN → START_INITIAL_PLAN_REVIEW` ;
- `START_PLAN_REVISION → START_PLAN_REVIEW` ;

convergent vers le même handoff :

`PLAN_OUTPUT + PLAN_REVIEW_OUTPUT APPROVE`
→ matérialisation Git canonique
→ gate utilisateur organisationnel
→ `kodjo.protocol.v2.lean-request.0.6.13`
→ `kodjo-v2-lean-queue.yml`.

Aucun second runtime d’implémentation n’est autorisé.

## 2. Matérialisation canonique

Le workflow `.github/workflows/kodjo-v2-plan-handoff-materialize.yml` matérialise uniquement après une revue `APPROVE` :

- `technical-plan.md` : contenu exact du `PLAN_OUTPUT` ;
- `independent-review.md` : enveloppe déterministe portant `Verdict: APPROVED`, `Plan reviewed: technical-plan.md`, puis le `PLAN_REVIEW_OUTPUT` intégral ;
- `implementation-mission.md` : enveloppe d’exécution dérivée du plan approuvé, sans décision nouvelle ;
- `planning_application_head` : révision exacte de `KODJO_PLAN_IMPACT_JSON.scan_revision` ;
- bootstrap et registre d’activation : empreintes cohérentes.

Le commit produit est protocolaire uniquement. Toute dérive `app/` ou `src/` entre la révision scannée et le HEAD de matérialisation bloque.

## 3. Gate utilisateur

Le commentaire `[KODJO_V2] PLAN_HANDOFF_READY` porte :

- tranche ;
- PLAN_OUTPUT et PLAN_REVIEW_OUTPUT sources ;
- `plan_blob_oid` ;
- `review_blob_oid` ;
- `approved_at_commit` ;
- bootstrap et mission ;
- `planning_application_head`.

Il devient la référence `user_gate` du contrat Lean Queue. L’autorisation reste celle du socle stable : réaction `+1` du propriétaire du dépôt, vérifiée par `verify-authorizations.js`.

## 4. Génération de la Lean Request

`scripts/kodjo/generate-approved-plan-lean-request.js` :

1. vérifie le commentaire de handoff et son auteur canonique ;
2. vérifie la réaction utilisateur ;
3. refuse un plan ou une revue supersédés ;
4. exige `source_head == approved_at_commit` ;
5. refuse toute dérive applicative postérieure ;
6. dérive `scope_allow` du plan approuvé ;
7. produit directement une `kodjo.protocol.v2.lean-request.0.6.13` ;
8. exécute le contrat et `verify-authorizations.js`.

Aucun schéma intermédiaire n’est créé.

## 5. Validation réelle bornée

`[KODJO_V2] VALIDATE_PLAN_HANDOFF` utilise exactement le même générateur que la mise en file de production.

Le workflow crée un commit local jetable contenant une unique demande Lean Queue, exécute `verify-queue-admission.js`, puis revient au HEAD initial sans push.

Point d’arrêt obligatoire :

`STOP : BEFORE_RUN_QUEUED_REQUEST`.

Ainsi, l’admission réelle est testée sans réexécuter le moteur stable.

## 6. Mise en file de production

`[KODJO_V2] QUEUE_APPROVED_PLAN` produit la même demande, la committe sous `.github/orchestration/queue/v2/`, puis laisse `kodjo-v2-lean-queue.yml` prendre la suite.

Aucune autre voie IMPLEMENT n’est autorisée.

## 7. Supersession et nettoyage

Sont supprimés du chemin exécutable :

- `.github/workflows/kodjo-v2-comment-causal-implementation.yml` ;
- `.github/orchestration/queue/v2-causal/*` ;
- `scripts/kodjo/verify-causal-application-drift.js` ;
- `tests/kodjo/comment-causal-implementation-entry.pilot.js` ;
- le paramètre `LocalRequestFile` et le schéma causal dans `run-queued-request.ps1`.

Les correctifs d’encodage génériques restent conservés s’ils ont d’autres consommateurs ; aucun retrait n’est déduit sans preuve.

## 8. Socle stable inchangé

La sémantique reste inchangée pour :

- `lean-request.0.6.13` ;
- `verify-queue-admission.js` ;
- `verify-authorizations.js` ;
- `start-kodjo-v2.ps1` ;
- `run-local-claude.js` ;
- recovery/checkpoint ;
- `RESUME_DELTA` ;
- `VISUAL_CORRECTION`.

## 9. Acceptation

Avant activation sur `main` :

- E2E-INITIAL-PLAN réel ;
- E2E-PLAN-HANDOFF borné ;
- admission Lean Queue réelle en commit local non poussé ;
- matrice négative ciblée ;
- scanner remote-write ;
- qualification Linux et Windows du protocole.

Après fusion, le même mode `VALIDATE_PLAN_HANDOFF` doit être exécuté contre les artefacts réels matérialisés sur `main` avant toute `QUEUE_APPROVED_PLAN`.
