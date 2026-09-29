# KODJO VNext — Change Report VNext-04

## Objet

Implémenter le PlanContract canonique VNext sans activer le runtime VNext.

## Ajouts

- `scripts/kodjo/lib/plan-contract.js`
  - contrat `kodjo.vnext.plan-contract.v1` ;
  - plan item unique par requirement ;
  - reprise mécanique de tous les impacts ;
  - change items dérivés des impacts ;
  - intent obligatoire pour chaque changement ;
  - obligations de test liées aux impacts ;
  - obligations de preuve liées aux changements ;
  - boundaries calculées depuis ImpactGraph/CandidateManifest ;
  - disposition CHANGE / NO_CHANGE calculée ;
  - projection Markdown déterministe ;
  - validation par reconstruction complète.

- `tests/kodjo/vnext-plan-contract.pilot.js`
  - chaîne Requirement → Impact → Change → Test → Proof → Boundary ;
  - absence de path libre ;
  - intent manquant refusé ;
  - changement sans couverture test refusé ;
  - changement sans couverture preuve refusé ;
  - test affecté sans impact refusé ;
  - preuve FUNCTIONAL_TEST mal reliée refusée ;
  - suppression de test exige une preuve alternative ;
  - conflit CHANGE/PRESERVE refusé ;
  - requirement plan manquant refusé ;
  - NO_CHANGE explicite ;
  - projection Markdown déterministe.

- `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md`
  - section normative VNext-04.

## Réutilisation de l’existant

Le lot conserve les comportements qualifiés de :
- `verify-plan-contract-consistency.js` ;
- validation scope/tests/provenance ;
- concepts requirement/test/boundary de #250 ;
- validations de path/scope existantes.

Ces contrôles ne sont pas recopiés sous forme de contrats parallèles. Ils sont absorbés dans le contrat VNext canonique lorsque compatible.

## Non-régression

Le lot interdit :
- requirement actif uniquement en prose ;
- path ajouté librement au plan ;
- changement sans intent ;
- changement sans test ;
- changement sans preuve ;
- test affecté non représenté ;
- boundary CHANGE/PRESERVE contradictoire ;
- drift entre JSON canonique et projection Markdown.

## Hors périmètre

Ce lot ne modifie pas :
- UI criteria/assertions atomiques ;
- review ;
- revision patch ;
- approval/handoff ;
- workflows actifs ;
- code applicatif.

## Gate du lot

Le lot est qualifié uniquement si :
- les tests VNext-04 passent ;
- la suite KODJO existante reste verte sur Linux ;
- la suite KODJO existante reste verte sur Windows sur son périmètre ;
- le diff reste borné aux fichiers VNext-04.
