# KODJO VNext — Change Report VNext-05

## Objet

Implémenter l’atomicité UI VNext en réutilisant les contrôles pertinents de #243, sans activer VNext.

## Ajouts

- `scripts/kodjo/lib/ui-atomicity-contract.js`
  - contrat `kodjo.vnext.ui-criteria.v2` ;
  - hiérarchie Requirement → Criterion → Assertion ;
  - criterion_id / assertion_id calculés par la machine ;
  - aucune création de Requirement depuis l’UI ;
  - cibles par impact_id/candidate_id, jamais par path libre ;
  - taxonomie atomique PRESENCE / CONTENT / STATE / GEOMETRY / RELATION / STYLE / LAYERING / INTERACTION / RESPONSIVE ;
  - preuves obligatoirement issues du PlanContract ;
  - source normative dérivée du Requirement parent ;
  - règles d’autorité VISUAL / FUNCTIONAL / DECISION ;
  - couverture complète des changements UI ;
  - REUSE / EXTEND / CREATE avec recherche de réutilisation limitée aux candidats UI réels.

- `tests/kodjo/vnext-ui-atomicity.pilot.js`
  - chaîne UI complète et IDs mécaniques ;
  - refus d’IDs fournis par l’IA ;
  - VISUAL_COMPARE obligatoire pour propriétés visuelles ;
  - source visuelle autoritative obligatoire ;
  - INTERACTION avec source et preuve fonctionnelles ;
  - preuve assertion hors critère refusée ;
  - preuve critère non allouée refusée ;
  - changement critère non couvert par assertion refusé ;
  - changement UI sans critère refusé ;
  - requirement non-UI ne peut porter silencieusement un changement UI ;
  - REUSE/EXTEND lié au périmètre réellement recherché ;
  - CREATE ne peut sélectionner un composant existant ;
  - binding au PlanContract exact ;
  - absence de dérivation inverse Criterion/Assertion → Requirement.

- `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md`
  - section normative VNext-05.

## Réutilisation de #243

Conservé :
- taxonomie des propriétés atomiques ;
- preuves adaptées aux propriétés ;
- assertions obligatoires pour les nouveaux plans UI ;
- couverture des preuves du critère ;
- REUSE / EXTEND / CREATE ;
- principe de compatibilité historique.

Renforcé pour VNext :
- IDs mécaniques ;
- source-first stricte ;
- liens par requirement_id / impact_id / proof_id / candidate_id ;
- absence de path libre dans le contrat atomique ;
- autorité de source contrôlée ;
- aucune possibilité de reconstruire les Requirements depuis les critères.

## Compatibilité

Aucun lecteur historique actif n’est modifié dans ce lot.

Les matrices historiques restent prises en charge par le mécanisme existant jusqu’au lot de migration/activation VNext.

## Hors périmètre

Ce lot ne modifie pas :
- review ;
- revision patch ;
- approval/handoff ;
- workflows actifs ;
- code applicatif.

## Gate du lot

Le lot est qualifié uniquement si :
- les tests VNext-05 passent ;
- la suite KODJO existante reste verte sur Linux ;
- la suite KODJO existante reste verte sur Windows sur son périmètre ;
- le diff reste borné aux fichiers VNext-05.
