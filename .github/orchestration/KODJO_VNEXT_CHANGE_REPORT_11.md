# KODJO VNext — Change Report VNext-11

## Objet

Fermer les risques de non-convergence identifiés après analyse de la boucle d’audits indépendants de l’ancien protocole, sans transformer toutes les recommandations du document d’analyse en exigences protocolaires.

## Protections retenues

VNext-11 implémente quatre protections impératives :

1. un finding bloquant ne peut pas être fermé par simple disparition ;
2. un finding bloquant doit référencer au moins un critère normatif préexistant et figé ;
3. les critères applicables à un cycle d’audit sont figés par hash ;
4. l’audit indépendant final est terminal et ne peut pas déclencher de réaudit automatique.

Deux validations nécessaires sont également structurées :

- ledger cumulatif minimal des findings ;
- matrice exhaustive de couverture de l’audit final.

## Ajouts

- `scripts/kodjo/lib/audit-stability-contract.js`
  - `kodjo.vnext.audit-manifest.v1` ;
  - `kodjo.vnext.finding-assessment.v1` ;
  - `kodjo.vnext.finding-resolution-set.v1` ;
  - `kodjo.vnext.finding-ledger.v1` ;
  - `kodjo.vnext.audit-coverage.v1` ;
  - `kodjo.vnext.final-audit-outcome.v1`.

- `tests/kodjo/vnext-audit-stability.pilot.js`
  - AuditManifest déterministe ;
  - changement de critère → changement de hash ;
  - blocker sans provenance normative refusé ;
  - suggestion sans provenance normative acceptée et non bloquante ;
  - révision sans FindingAssessment refusée ;
  - disparition sans résolution explicite refusée ;
  - ledger OPEN → RESOLVED uniquement avec preuve ;
  - changement silencieux d’AuditManifest refusé ;
  - RevisionOutcome exige FindingResolutionSet ;
  - couverture incomplète refusée ;
  - REQUIRED → NOT_APPLICABLE refusé ;
  - final REVISE terminal, sans réaudit automatique ;
  - final APPROVE avec finding ancien encore OPEN refusé.

## Modifications dépendantes

- `scripts/kodjo/lib/revision-contract.js`
  - `kodjo.vnext.allowed-change-set.v1` supersédé par `v2` ;
  - `kodjo.vnext.revision-outcome.v1` supersédé par `v2` ;
  - AuditManifest + FindingAssessment + FindingLedger courant requis avant autorisation de correction ;
  - `finding_ledger_hash` scellé dans AllowedChangeSet v2 ;
  - previous ReviewReport exact + FindingResolutionSet + FindingLedger avancé requis pour fermer une révision ;
  - `next_finding_ledger_hash` scellé dans RevisionOutcome v2.

- `scripts/kodjo/lib/vnext-runtime.js`
  - le runtime REVISION exige et scelle désormais le FindingResolutionSet.

- `tests/kodjo/vnext-revision-contract.pilot.js`
  - adaptation des tests VNext-07 à la provenance normative figée et aux fermetures explicites.

- `tests/kodjo/vnext-e2e-migration.pilot.js`
  - adaptation de l’E2E REVISION VNext-09 au FindingResolutionSet et à l’AuditManifest figé.

## Documentation

- `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md`
  - principe VNX-13 ;
  - section VNext-11 ;
  - supersession explicite des contrats VNext-07 concernés ;
  - propagation dans les gates de révision et l’E2E REVISION.

- `.github/orchestration/KODJO_VNEXT_ANTI_REGRESSION_MATRIX.md`
  - INV-004 renforcé par la provenance normative ;
  - INV-013 renforcé par la fermeture explicite et l’audit terminal ;
  - INV-021 renforcé par l’interdiction de réaudit automatique.

## Ce qui n’est volontairement pas ajouté

Ne deviennent pas des exigences du cœur VNext-11 :

- la classification « défaut découvert tardivement » ;
- une taxonomie causale obligatoire de la date de découverte ;
- un seuil de nombre maximal de findings ;
- les scénarios publication/quota/runner comme états sémantiques.

Publication, quota, runner, interruption et reprise sans nouvel appel coûteux restent des scénarios nécessaires du futur E2E réel VNext.

## Impact sur la convergence

Avant VNext-11 :
- un ancien finding pouvait ne plus apparaître dans la review suivante et un verdict APPROVE pouvait conduire à RESOLVED ;
- une catégorie bloquante pouvait être produite sans preuve mécanique qu’elle correspondait à une règle préexistante.

Après VNext-11 :
- chaque finding bloquant précédent absent doit être explicitement RESOLVED ou REFUTED avec preuve ;
- chaque blocker autorisant une correction doit être lié à l’AuditManifest figé ;
- le ledger maintient les états cumulés ;
- le dernier audit REVISE produit FINAL_REVISE_TERMINAL et `automatic_reaudit_allowed=false`.

## Hors périmètre

VNext-11 ne :
- modifie aucun workflow actif ;
- active pas VNext ;
- modifie pas PRE-1 ;
- modifie pas la Lean Queue ;
- lance pas l’audit Claude final ;
- remplace pas le futur E2E réel.

## Gate

Le lot est qualifié uniquement si :
- tests VNext-11 PASS ;
- tests VNext-07 adaptés PASS ;
- E2E contractuel VNext-09 adapté PASS ;
- VNext-01..10 restent verts ;
- suite KODJO Linux PASS ;
- suite KODJO Windows PASS sur son périmètre ;
- aucun workflow actif modifié.

Après qualification, le prochain lot est le **VNext-12 — E2E réel jetable**, incluant publication/runner/quota/reprise avant constitution du package Claude final.
