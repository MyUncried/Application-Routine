# KODJO V2 — Acceptation des tests négatifs bornés du handoff PLAN → IMPLEMENT

Date : 2026-09-18
Branche : `protocol/v2-initial-handoff-redesign-20260917`

## Objet

Valider uniquement les refus nécessaires aux nouvelles frontières du handoff cible :

`PLAN_OUTPUT + PLAN_REVIEW_APPROVED + USER_IMPLEMENTATION_APPROVED`
→ matérialisation canonique
→ `lean-request.0.6.13`
→ STOP avant `run-queued-request.ps1`.

Les tests ne requalifient pas le moteur V2 stable et n'exercent pas Claude, recovery, RESUME_DELTA, VISUAL_CORRECTION ou la publication applicative.

Les anciens incidents Unicode/BOM de `queue/v2-causal` ne sont pas rejoués : cette voie est explicitement supprimée par l'architecture cible.

## Run de référence

- workflow : `.github/workflows/kodjo-v2-bounded-plan-handoff-e2e.yml`
- script négatif : `tests/kodjo/v2-plan-handoff-negative-e2e.js`
- run : `35313102469`
- conclusion : **SUCCESS**
- URL : https://github.com/MyUncried/Application-Routine/actions/runs/35313102469

Le test positif `E2E-PLAN-HANDOFF` a également repassé dans le même run avant les négatifs.

## Matrice des refus

| Cas | Situation opposée | Refus attendu | Résultat |
|---|---|---|---|
| N1 | Review liée à un autre PLAN_OUTPUT | `HANDOFF_REVIEW_PLAN_LINK_MISMATCH` | PASS |
| N2 | Review non APPROVE | `HANDOFF_REVIEW_NOT_APPROVED` | PASS |
| N3 | USER gate lié à une autre review | `HANDOFF_USER_GATE_REVIEW_LINK_MISMATCH` | PASS |
| N4 | `scope_allow` différent du plan approuvé | `PLAN_SCOPE_CONTRADICTION` | PASS |
| N5 | `planning_application_head != scan_revision` | `PLAN_APPLICATION_HEAD_MISMATCH` | PASS |
| N6 | `source_head` antérieur au commit d'approbation | `PLAN_COMMIT_NOT_ANCESTOR` | PASS |
| N6b | `source_head != approved_at_commit` dans le handoff cible | `HANDOFF_SOURCE_HEAD_MUST_EQUAL_APPROVED_AT_COMMIT` | PASS |
| N7 | `implementation-mission.md` absente à `source_head` | `HANDOFF_PROMPT_MISSING_AT_SOURCE` | PASS |
| N8 | Gate utilisateur visant un autre plan | `GATE_REFERENCE_MISMATCH` | PASS |
| N9 | Review déclarant un autre `plan_blob_oid` | `REVIEW_PLAN_HASH_MISMATCH` | PASS |
| N10 | Nouveau plan matérialisé après le plan approuvé | `PLAN_SUPERSEDED` | PASS |

Total : **11/11 PASS**.

## Nature des oracles

Les cas N4, N5, N6, N8 et N9 sont opposés aux vrais validateurs du socle stable, notamment `verify-authorizations.js`.

Les cas N1, N2, N3, N6b, N7 et N10 sont des oracles de pré-génération propres au nouveau handoff. Ils constituent les exigences à reprendre telles quelles dans l'implémentation de production avant création de la Lean Request.

## Arrêt borné

Le run confirme :

`STOP=BEFORE_RUN_QUEUED_REQUEST`

Aucun appel au superviseur, aucun appel Claude et aucune mutation applicative ne sont exécutés par ces tests.

## Conclusion

Les refus essentiels de la nouvelle frontière sont définis et démontrés. L'implémentation de production du handoff devra satisfaire cette même matrice sans modifier la sémantique des validateurs stables.
