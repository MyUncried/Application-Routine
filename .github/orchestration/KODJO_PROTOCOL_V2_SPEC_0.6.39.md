# KODJO Protocol V2 — spécification 0.6.39

Date : 2026-09-19  
Base : 0.6.38  
Objet : restaurer le contrat de développement UI sans ajouter de canal, workflow, événement, queue ni schéma de transport.

## Principe de non-régression

Cette version est additive par rapport à 0.6.38 et à tous les addenda antérieurs.

- aucun invariant existant de HEAD, scope, queue, recovery, autorisation, checks, publication ou revue n’est supprimé, assoupli ou remplacé ;
- le schéma Lean Queue reste exactement `kodjo.protocol.v2.lean-request.0.6.13` ;
- `prompt_file` reste l’interface existante entre le handoff approuvé et l’implémentation locale ;
- aucun nouveau workflow, événement GitHub, commentaire causal, bridge, queue parallèle ou transport n’est introduit ;
- le contrat de développement est dérivé de la matrice UI approuvée déjà présente dans `technical-plan.md`, par références et empreintes ; la matrice n’est pas recopiée dans un nouveau payload.

Toute incompatibilité avec un invariant existant doit faire échouer 0.6.39 plutôt que conduire à retirer silencieusement la règle antérieure.

## Contrat de développement

Lors de la matérialisation d’un plan approuvé, `implementation-mission.md` est produit déterministiquement à partir :

- du blob exact de `technical-plan.md` ;
- de `KODJO_UI_CRITERIA_MATRIX_JSON` ;
- de `KODJO_UI_PLAN_CONTRACT_JSON`.

La mission ne recopie pas la matrice. Elle transporte uniquement les liaisons déterministes suivantes :

- `implementation_contract=kodjo.ui-implementation-contract.v1` ;
- `plan_blob_oid` ;
- `ui_matrix_sha256` ;
- `ui_criterion_count` ;
- `ui_criterion_ids_sha256` ;
- `ui_preservation_sha256` ;
- la liste fermée des statuts d’arrêt obligatoires.

Le développement doit lire le bloc exact dans `technical-plan.md` avant tout code.

## Règles opposables pendant IMPLEMENT

Pour chaque critère approuvé :

1. respecter `REUSE | EXTEND | CREATE` ;
2. respecter `PRESERVE / CHANGE / FORBIDDEN` ;
3. ne jamais créer silencieusement une copie locale équivalente lorsqu’un composant est à réutiliser/étendre ;
4. ne pas substituer une primitive native, un composant canonique ou un asset imposé ;
5. s’arrêter avant code concerné avec :
   - `CHANGE_REQUEST_REQUIRED` si substitution/refonte nécessaire ;
   - `SCOPE_EXPANSION_REQUIRED` si le périmètre doit s’élargir ;
   - `NATIVE_PRIMITIVE_EXCEPTION_REQUIRED` si une primitive native doit être abandonnée ;
   - `ASSET_REQUIRED` si l’asset canonique requis est indisponible ;
   - `CLARIFICATION_REQUIRED` si la règle normative reste ambiguë ;
6. ne jamais considérer Jest seul comme preuve visuelle, accessibilité ou device ;
7. laisser `PENDING_DEVICE` toute preuve device non exécutée ;
8. démontrer après modification que les éléments `PRESERVE` sont restés inchangés.

## Rapport de développement

Le rapport final Claude doit contenir un bloc `KODJO_IMPLEMENTATION_CONFORMANCE` listant chaque `criterion_id` avec :

- `implementation_status` ;
- `files_or_symbols` ;
- `component_used` ;
- `tests_run` ;
- `proof_status` ;
- `preserve_status` ;
- `residual_status`.

Ce rapport est exigé par le contrat de mission. Sa contre-vérification indépendante et son éventuel gate de clôture appartiennent à l’étape 3 ; 0.6.39 ne modifie pas encore le workflow de revue d’implémentation.

## Admission avant Claude

Deux contrôles indépendants sont ajoutés sans nouveau transport :

1. le générateur de Lean Request refuse un handoff si la mission ne correspond pas exactement au plan/UI contract approuvé ;
2. `run-queued-request.ps1` rejoue le même contrôle, avec le runtime protocolaire courant, après checkout du `source_head` et avant l’appel Claude.

Le contrôle est appliqué aux opérations `IMPLEMENT`. `VISUAL_CORRECTION` reste inchangé dans cette étape afin de ne pas modifier silencieusement son contrat de reprise existant.

## Hors périmètre de 0.6.39

- revue indépendante du rapport `KODJO_IMPLEMENTATION_CONFORMANCE` ;
- gate device ;
- clôture finale par critère ;
- changement du schéma Lean Queue ;
- changement des mécanismes recovery/attestation/checkpoint ;
- modification applicative KODJO.

Ces sujets restent inchangés et seront traités séparément.
