# KODJO VNext — Change Report VNext-07

## Objet

Implémenter la révision bornée VNext sans reconstruction globale après REVISE.

## Ajouts

- `scripts/kodjo/lib/revision-contract.js`
  - `kodjo.vnext.allowed-change-set.v1` ;
  - `kodjo.vnext.revision-patch.v1` ;
  - `kodjo.vnext.revision-application.v1` ;
  - `kodjo.vnext.revision-outcome.v1` ;
  - graphe des objets exacts revus ;
  - séparation AUTHORIZED / MACHINE_DERIVED / PRESERVE_EXACT ;
  - réentrée minimale REQUIREMENTS / IMPACT / PLAN ;
  - ancres SOURCE_UNIT / CANDIDATE immuables ;
  - refus d’un PLAN_CONTRACT utilisé comme autorisation globale ;
  - correction limitée aux target_id autorisés ;
  - vérification mécanique des hashes préservés ;
  - contrôle des nouveaux objets par causalité ;
  - REVISION_STALLED ;
  - PRESERVATION_REGRESSION.

- `tests/kodjo/vnext-revision-contract.pilot.js`
  - AllowedChangeSet borné ;
  - plan root trop large refusé ;
  - réentrée la plus amont ;
  - anchor SOURCE_UNIT sans ouverture de ses descendants ;
  - cible hors AllowedChangeSet refusée ;
  - couverture de tous les findings obligatoire ;
  - séparation editable / machine-derived ;
  - correction ciblée avec préservation exacte ;
  - nouvel objet dérivé causal autorisé ;
  - modification d’un objet préservé refusée ;
  - finding persistant → REVISION_STALLED ;
  - nouveau finding sur objet préservé → PRESERVATION_REGRESSION ;
  - finding_id stable entre INITIAL et REVISION ;
  - schéma de correction sans path/verdict/remplacement JSON libre.

## Corrections dépendantes nécessaires

### review-contract.js

Le `finding_id` ne dépend plus du `ReviewContext.hash`.

Raison : un même défaut devait pouvoir conserver le même ID après correction afin de détecter `REVISION_STALLED`.

### plan-contract.js

Le `plan_item_id` dépend désormais du seul `requirement_id`, et non des hashes globaux RequirementRegistry / ImpactGraph.

Raison : une correction locale ne doit pas changer artificiellement l’identité de tous les plan items non concernés.

## Réutilisation

Conservé de #251 :
- bounded revision après REVISE ;
- préservation de l’acquis ;
- absence de reconstruction opportuniste.

Conservé de #250 :
- findings structurés ;
- vérification explicite des modifications ciblées.

Renforcé :
- hashes par objet ;
- causalité machine des descendants ;
- reentry stage calculé ;
- contrôle des nouveaux objets ;
- anti-loop mécanique.

## Hors périmètre

Ce lot ne modifie pas :
- approval utilisateur ;
- handoff ;
- workflows actifs ;
- code applicatif ;
- activation VNext.

## Gate du lot

Le lot est qualifié uniquement si :
- les tests VNext-07 passent ;
- les tests VNext-01..06 restent verts ;
- la suite KODJO existante reste verte sur Linux ;
- la suite KODJO existante reste verte sur Windows sur son périmètre ;
- le diff reste borné aux fichiers VNext-07 et aux deux corrections dépendantes explicitement justifiées.
