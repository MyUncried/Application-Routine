# KODJO VNext — Change Report VNext-06

## Objet

Implémenter une review commune INITIAL / REVISION avec findings structurés, targets bornées et verdict mécanique.

## Ajouts

- `scripts/kodjo/lib/review-contract.js`
  - `kodjo.vnext.review-context.v1` ;
  - `kodjo.vnext.review-report.v1` ;
  - replay mécanique des contrats VNext avant review sémantique ;
  - même moteur en INITIAL et REVISION ;
  - target catalog calculé depuis les IDs VNext ;
  - schéma de sortie reviewer borné aux IDs connus ;
  - finding_id calculé par la machine ;
  - blocking calculé par catégorie ;
  - reentry_stage calculé par catégorie ;
  - verdict APPROVE / REVISE / CLARIFICATION_REQUIRED calculé mécaniquement.

- `tests/kodjo/vnext-review-contract.pilot.js`
  - cœur identique INITIAL / REVISION ;
  - APPROVE sans finding ;
  - REVISE sur finding bloquant ;
  - CLARIFICATION_REQUIRED sur ambiguïté produit ;
  - SUGGESTION non bloquante ;
  - refus de verdict/blocking/finding_id/reentry fournis par l’IA ;
  - refus d’un target_id inventé ;
  - refus catégorie/type de cible incompatible ;
  - doublon de finding refusé ;
  - schéma reviewer sans verdict libre ;
  - contrôles mécaniques avant review ;
  - UI Atomicity obligatoire pour un plan UI ;
  - findings Criterion / Assertion réels ;
  - finding_id déterministe.

- `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md`
  - section normative VNext-06.

## Réutilisation

Conservé du protocole actuel :
- review indépendante ;
- replay impact / plan / UI avant Claude ;
- séparation auteur / reviewer.

Conservé de #250 :
- findings structurés ;
- identité stable des findings.

Remplacé pour VNext :
- verdict libre textuel ;
- targets textuelles libres ;
- booléen blocking fourni par l’IA ;
- étape de réentrée fournie par l’IA.

## Hors périmètre

Ce lot ne modifie pas :
- RevisionPatch / AllowedChangeSet ;
- approbation utilisateur ;
- handoff ;
- workflows actifs ;
- code applicatif.

## Gate du lot

Le lot est qualifié uniquement si :
- les tests VNext-06 passent ;
- la suite KODJO existante reste verte sur Linux ;
- la suite KODJO existante reste verte sur Windows sur son périmètre ;
- le diff reste borné aux fichiers VNext-06.
