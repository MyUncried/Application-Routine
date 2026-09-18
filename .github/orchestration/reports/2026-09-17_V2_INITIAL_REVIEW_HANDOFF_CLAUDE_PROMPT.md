# Prompt Claude — Audit indépendant architecture handoff PLAN → IMPLEMENT

Tu agis comme **auditeur indépendant du protocole KODJO V2**, en lecture seule.

## Contexte de départ

Le protocole V2 a déjà été stabilisé et éprouvé en conditions réelles pour la clôture de `V2-BILAT-01`. Le socle stable est la chaîne :

`.github/orchestration/queue/v2/*.json` (`kodjo.protocol.v2.lean-request.0.6.13`)
→ `verify-queue-admission.js`
→ `verify-authorizations.js`
→ `run-queued-request.ps1`
→ `start-kodjo-v2.ps1`
→ `run-local-claude.js`.

Ce socle, ainsi que recovery, RESUME_DELTA, VISUAL_CORRECTION et la publication applicative, sont **hors périmètre de refonte**. Ne propose pas de les réécrire sauf preuve qu’une modification de la nouvelle architecture les rend nécessairement incohérents.

Depuis 0.6.29, KODJO V2 possède un parcours de premier plan pour une tranche neuve :

`START_INITIAL_PLAN → PLAN_OUTPUT → START_INITIAL_PLAN_REVIEW`.

Le parcours historique de révision reste :

`START_PLAN_REVISION → PLAN_OUTPUT → START_PLAN_REVIEW`.

Depuis 0.6.31/0.6.32, le raccordement du plan approuvé à IMPLEMENT a été réalisé par une voie parallèle (`queue/v2-causal`, workflow comment-causal, fichiers JSON temporaires, projection vers un format local), qui a réintroduit des frontières techniques et des incidents de transport (Unicode Git, BOM PowerShell).

## Objectif final de l’évolution

Concevoir un **seul handoff PLAN approuvé → IMPLEMENT**, commun aux deux origines : INITIAL et REVIEW/RÉVISION.

Après `PLAN_REVIEW_APPROVED` et approbation utilisateur explicite, les deux parcours doivent converger vers **une seule requête canonique `kodjo.protocol.v2.lean-request.0.6.13`**, directement remise au Lean Queue existant.

Il ne doit plus exister :

- de `queue/v2-causal` comme transport parallèle ;
- de workflow d’implémentation comment-causal distinct ;
- de projection `comment-causal-request → local-implementation` ;
- d’`agent_adapter` parallèle ;
- de chaîne `gh api → Out-File → JSON.parse()` au moment du handoff runtime.

Les commentaires GitHub peuvent rester des événements et des traces humaines, mais les preuves opposables d’exécution doivent redevenir les artefacts Git et structures déjà compris par le Lean Queue stable.

## Branche et documents à auditer

Branche : `protocol/v2-initial-handoff-redesign-20260917`

Lis d’abord :

1. `.github/orchestration/reports/2026-09-17_V2_INITIAL_REVIEW_HANDOFF_ARCHITECTURE.md`
2. `.github/orchestration/reports/2026-09-17_V2_INITIAL_REVIEW_HANDOFF_AUDIT_PACKAGE.md`

Puis inspecte **toi-même dans le dépôt** tous les fichiers listés dans le package. Ne te limite pas aux extraits ou au résumé fourni.

## Exigences d’audit

Vérifie notamment :

1. que la proposition réutilise réellement le contrat `lean-request.0.6.13` sans recréer un second runtime ;
2. que INITIAL et REVIEW/RÉVISION convergent avant IMPLEMENT ;
3. que `technical-plan.md` et `independent-review.md` peuvent redevenir les preuves Git immuables requises par `verify-authorizations.js` ;
4. que le gate utilisateur proposé reste compatible avec la mécanique stable `user_gate` et ne crée pas une nouvelle sémantique parallèle ;
5. que `scope_allow` peut être dérivé du plan approuvé sans ressaisie manuelle ;
6. que l’identité `planning_application_head` est définie au bon moment et que la migration de V2-CAT-01 reste purement protocolaire ;
7. que la suppression des éléments 0.6.32 transitoires ne retire aucune capacité indépendante réellement utilisée ;
8. qu’aucune modification implicite du socle stable n’est nécessaire ;
9. qu’il n’existe pas de fenêtre de course ou d’ambiguïté entre plan approuvé, review approuvée, gate utilisateur et création de la demande Lean Queue ;
10. que l’architecture permet ensuite deux tests E2E bornés, sans revalider le moteur stable :
   - `E2E-INITIAL-PLAN` : tranche neuve → PLAN_OUTPUT INITIAL valide → STOP ;
   - `E2E-PLAN-HANDOFF` : plan approuvé (origine INITIAL ou REVIEW) + review APPROVE + user gate → demande `lean-request.0.6.13` admissible → STOP avant `run-queued-request.ps1`.

## Règles de décision

- Ne recommande pas une refonte générale si une correction locale de l’architecture proposée suffit.
- Ne réouvre pas des composants déjà éprouvés sans preuve d’une incompatibilité créée par le nouveau handoff.
- Distingue clairement défaut architectural, risque de mise en œuvre et dette hors périmètre.
- Toute critique doit citer le fichier/composant et l’invariant concerné.
- Si une hypothèse du document d’architecture est fausse au regard du code actuel, signale-la explicitement.

## Format de réponse obligatoire

Réponds exactement sous cette structure :

`DECISION: READY | READY_WITH_FIXES | NOT_READY`

`SUMMARY:`
- synthèse courte et factuelle.

`ARCHITECTURE_FINDINGS:`
- `[BLOCKING|NON_BLOCKING] <fichier/composant> — <constat> — <raison>`
- ou `NONE`.

`REQUIRED_FIXES_BEFORE_IMPLEMENTATION:`
1. `<modification minimale>`
2. ...
- ou `NONE`.

`STABLE_COMPONENTS_CONFIRMED_UNTOUCHED:`
- liste des composants stables que la proposition n’oblige pas à modifier.

`TRANSIENT_0_6_32_COMPONENTS_SAFE_TO_REMOVE:`
- liste exacte des éléments supprimables ;
- signaler explicitement tout élément qui ne peut pas être supprimé.

`BOUNDED_E2E_ACCEPTANCE:`
- préciser si les deux tests bornés proposés sont suffisants ;
- sinon, indiquer uniquement les tests supplémentaires indispensables à la nouvelle frontière.

`FINAL_RECOMMENDATION:`
- recommandation finale concise.

Ne modifie aucun fichier. Ne crée aucun commit. N’exécute aucune implémentation applicative.
