# KODJO VNext — Change Report VNext-03

## Objet

Implémenter l’ImpactGraph déterministe de VNext sans activer le runtime VNext.

## Ajouts

- `scripts/kodjo/lib/impact-graph.js`
  - CandidateManifest lié au HEAD exact ;
  - inventaire des paths existants depuis l’arbre Git ;
  - slots CREATE issus d’une politique explicite ;
  - IDs candidats calculés par la machine ;
  - classification par candidate_id uniquement ;
  - compatibilité stricte MODIFY / CREATE / DELETE / NO_CHANGE ;
  - scan ONE_LEVEL_DIRECT_IMPORTS ;
  - couverture obligatoire de chaque requirement ;
  - impact_id calculé par la machine ;
  - validation/reconstruction d’ImpactGraph.

- `tests/kodjo/vnext-impact-graph.pilot.js`
  - inventaire Git et Unicode ;
  - CREATE sur fichier existant refusé ;
  - CREATE hors racine autorisée refusé ;
  - importeurs directs uniquement ;
  - absence de fermeture transitive ;
  - path inventé impossible via candidate_id inconnu ;
  - CREATE limité aux slots machine ;
  - DELETE limité aux fichiers existants ;
  - NO_CHANGE exigence-level ;
  - requirement sans impact refusé ;
  - binding exact CandidateManifest / scan direct ;
  - RequirementRegistry bloqué refusé.

- `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md`
  - section normative VNext-03.

## Réutilisation de l’existant

VNext-03 réutilise les primitives existantes de `plan-impact.js` pour :
- extraction des imports ;
- résolution déterministe des imports relatifs / alias ;
- scan limité aux dépendances directes.

Le nouveau contrat supprime en revanche la possibilité pour l’IA de recopier librement des paths : elle ne classe que des `candidate_id`.

## Non-régression

Ce lot conserve explicitement :
- identité Git exacte ;
- refus des paths ambigus ;
- ONE_LEVEL_DIRECT_IMPORTS ;
- absence de fermeture transitive libre ;
- distinction MODIFY / CREATE ;
- preuve de dépendance avant expansion ;
- fail-closed sur exigence non couverte.

## Hors périmètre

Ce lot ne modifie pas :
- PlanContract ;
- UI criteria/assertions ;
- review ;
- revision patch ;
- approval/handoff ;
- workflows actifs ;
- code applicatif.

## Gate du lot

Le lot est qualifié uniquement si :
- les tests VNext-03 passent ;
- la suite KODJO existante reste verte sur Linux ;
- la suite KODJO existante reste verte sur Windows sur son périmètre ;
- le diff reste borné aux fichiers VNext-03.
