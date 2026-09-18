# KODJO Protocol V2 — spécification 0.6.40

Date : 2026-09-19  
Base : 0.6.39  
Objet : restaurer la revue d’implémentation UI critère par critère et la séparation stricte entre approbation technique et preuve device/humaine.

## Principe de non-régression

Cette version est additive par rapport à 0.6.39 et aux versions antérieures.

- aucun état, gate, transport, queue, recovery, checkpoint, attestation ou autorisation existant n’est supprimé ni assoupli ;
- aucun nouveau canal GitHub n’est créé ;
- le workflow existant `.github/workflows/kodjo-slice-implementation-review.yml` reste le canal de revue ;
- le chemin historique non V2 conserve son comportement antérieur ;
- le contrat V2 s’active uniquement lorsque le manifeste de revue est une Lean Queue `.github/orchestration/queue/v2/*.json`.

Toute incompatibilité doit bloquer 0.6.40 plutôt que supprimer une règle antérieure.

## Contrat de revue d’implémentation

Pour une livraison V2, la revue reconstruit déterministiquement un input depuis :

- le `technical-plan.md` approuvé matérialisé par son blob ;
- `KODJO_UI_CRITERIA_MATRIX_JSON` ;
- `KODJO_UI_PLAN_CONTRACT_JSON` ;
- la liste exacte des fichiers modifiés entre base et HEAD livré.

Le contrat refuse notamment :

- un `criterion_id` manquant ou dupliqué ;
- un `change_target` approuvé absent du diff livré ;
- une matrice dont l’empreinte ne correspond plus au contrat de plan ;
- une sortie de reviewer omettant un critère ;
- une sortie de reviewer omettant un type de preuve requis.

## Revue indépendante structurée

Le reviewer OpenAI conserve son rôle indépendant mais produit, pour V2, une sortie structurée `kodjo.ui-implementation-review.v1`.

Chaque critère contient obligatoirement :

- `criterion_id` ;
- `implementation_status` ;
- `preserve_status` ;
- une évidence concise ;
- exactement un `proof_result` pour chaque `proof_required` du plan.

Les valeurs de statut restent limitées aux taxonomies existantes de preuve et de conformité. Aucun nouvel état protocolaire n’est créé.

## Règles de clôture probante

La revue automatisée distingue explicitement :

- `FUNCTIONAL_TEST`, `STATIC_ANALYSIS`, `ACCESSIBILITY_CHECK` : preuves techniques bloquantes ;
- `VISUAL_COMPARE`, `DEVICE_CHECK` : preuves perceptives/device non certifiables automatiquement.

Pour `VISUAL_COMPARE` et `DEVICE_CHECK` :

- la revue automatisée ne peut jamais publier `PASS` ;
- elle doit publier `PENDING_DEVICE` sauf défaut démontré ;
- `device_gate_required=true` est porté dans la sortie lorsque l’un de ces contrôles est requis.

`PENDING_DEVICE` reste une valeur de preuve, jamais un état de la machine protocolaire.

Une revue peut donc produire `verdict=APPROVE` avec `device_gate_required=true`. Cela signifie uniquement « approbation technique », jamais « prêt à fermer ». La clôture reste conditionnée au gate device/humain déjà prévu par le protocole.

## Conservation des acquis

Le reviewer doit contrôler le diff contre `PRESERVE / CHANGE / FORBIDDEN`.

- `preserve_status=FAIL` est bloquant ;
- un `NON_CONFORME` est bloquant ;
- une preuve technique obligatoire différente de `PASS` est bloquante ;
- tout blocage impose `verdict=REVISE`.

À l’inverse, une absence de preuve device ne transforme pas artificiellement une revue technique en échec : elle reste explicitement ouverte pour le gate suivant.

## Transport

La sortie est publiée dans le commentaire `[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT` existant.

Le commentaire V2 ajoute uniquement :

- `device_gate_required=<true|false>` ;
- un bloc `KODJO_UI_IMPLEMENTATION_REVIEW_JSON`.

Aucun nouvel événement, workflow, queue, bridge ou repository_dispatch n’est introduit.

## Hors périmètre

- modification du gate utilisateur/device lui-même ;
- création d’un nouveau workflow de finalisation V2 ;
- modification de VISUAL_CORRECTION ;
- modification de la Lean Queue ;
- modification applicative.

La qualification E2E complète de PLAN → IMPLEMENT → REVIEW → device/closure appartient à l’étape 4.
