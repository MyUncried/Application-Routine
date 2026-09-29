# KODJO VNext — Change Report VNext-02

## Objet

Implémenter le `RequirementRegistry` source-first, sans activer VNext ni modifier le runtime de production.

## Ajouts

- `scripts/kodjo/lib/requirement-registry.js`
  - contrat `kodjo.vnext.requirement-registry.v1` ;
  - IDs machine-generated ;
  - couverture exhaustive de chaque unité du SourceManifest ;
  - support UI et non-UI dans le même registre ;
  - relations et conflits dérivés mécaniquement ;
  - statut `READY | BLOCKED` ;
  - gate `assertReady()`.

- `tests/kodjo/vnext-requirement-registry.pilot.js`
  - registre nominal UI + non-UI ;
  - refus d’une unité normative oubliée ;
  - refus d’une exigence sans source ;
  - refus d’une exigence issue de CONTEXT_ONLY ;
  - ambiguïté → CLARIFICATION_REQUIRED ;
  - conflit symétrique et bloquant ;
  - relations dérivées ;
  - doublon requirement_id refusé ;
  - binding exact au SourceManifest ;
  - décision résolue consommée comme source normative ;
  - registre sans unité normative refusé ;
  - preuve structurelle d’absence de dérivation depuis UI criteria.

- `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md`
  - section normative VNext-02.

## Principe anti-régression

Le défaut visé est l’omission silencieuse d’une exigence.

VNext-02 interdit qu’une unité `REQUIREMENT_SOURCE` du SourceManifest puisse disparaître du registre sans provoquer un échec mécanique.

Une exigence UI est recensée depuis sa source avant tout `criterion_id` ou assertion UI.

## Hors périmètre

Ce lot ne modifie pas :
- ImpactGraph ;
- PlanContract ;
- UI criteria/assertions ;
- workflows de production ;
- Lean Queue ;
- review/recovery/finalisation ;
- code applicatif.

## Gate du lot

Le lot est qualifié uniquement si :
- les nouveaux tests VNext-02 passent ;
- la suite KODJO existante reste verte sur Linux ;
- la suite KODJO existante reste verte sur Windows sur son périmètre ;
- le diff de PR reste borné aux fichiers VNext-02.
