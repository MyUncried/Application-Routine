# KODJO VNext — Change Report VNext-11

## Objet

Ajouter les protections minimales nécessaires pour empêcher une boucle d’audit/correction non convergente avant le cutover.

Ce lot ne transforme pas toutes les recommandations du document de travail en exigences.

## Protections ajoutées

### 1. Fermeture explicite des findings

Ajout du contrat :

`kodjo.vnext.finding-ledger.v1`

Un finding bloquant précédent ne peut plus être considéré comme fermé simplement parce qu’il disparaît du rapport suivant.

États explicites :
- OPEN
- RESOLVED
- REFUTED_WITH_EVIDENCE

La disparition sans résolution produit :
`VNEXT_LEDGER_FINDING_DISAPPEARED_WITHOUT_RESOLUTION`

Le RuntimeSnapshot REVISION exige désormais :
- previous_review_report ;
- finding_ledger ;
- aucun finding précédent encore OPEN avant HANDOFF_READY.

### 2. Provenance normative obligatoire

Ajout du contrat d’audit final :

`kodjo.vnext.final-audit-report.v1`

Tout finding final bloquant doit référencer au moins une source normative préexistante du manifeste d’audit.

Une proposition sans cette provenance doit être classée SUGGESTION.

SUGGESTION reste non bloquante.

### 3. Critères d’audit figés

Ajout :

`kodjo.vnext.audit-manifest.v1`

Le manifeste scelle avant l’audit :
- candidate_head ;
- protocol_spec_hash ;
- références normatives ;
- critères ;
- applicabilité ;
- provenance de création.

Ajout :

`kodjo.vnext.audit-coverage.v1`

Chaque critère du manifeste doit apparaître exactement une fois :
- CHECKED_PASS
- CHECKED_FAIL
- NOT_APPLICABLE

Un critère REQUIRED ne peut pas devenir NOT_APPLICABLE pendant l’audit.

### 4. REVISE final terminal

Le rapport final ne produit que :
- FINAL_APPROVED
- FINAL_REVISE_TERMINAL
- FINAL_CLARIFICATION_TERMINAL

`reentry_allowed=false` est obligatoire.

Un REVISE de l’audit final ne déclenche donc aucun nouvel audit automatique.

## Validations

Ajout de `tests/kodjo/vnext-audit-convergence.pilot.js` couvrant notamment :
- fermeture par disparition refusée ;
- résolution explicite avec preuve ;
- finding persistant non résoluble ;
- couverture complète du manifeste ;
- REQUIRED → NOT_APPLICABLE refusé ;
- finding bloquant sans norme refusé ;
- SUGGESTION non bloquante ;
- CHECKED_FAIL sans finding refusé ;
- FINAL_REVISE_TERMINAL ;
- transfert d’un rapport vers un manifeste modifié refusé ;
- provenance normative altérée puis re-signée refusée.

Le test E2E VNext-09 est adapté afin qu’un parcours REVISION fournisse un FindingLedger explicite.

## Propagation transverse

Mise à jour :
- KODJO_PROTOCOL_VNEXT_SPEC.md ;
- KODJO_VNEXT_ANTI_REGRESSION_MATRIX.md ;
- vnext-runtime.js ;
- E2E VNext-09.

INV-013 et INV-021 sont renforcés par VNext-11.

## Recommandations volontairement non transformées en gates

Ne deviennent pas des exigences de machine :
- classification détaillée de la découverte tardive ;
- registre narratif exhaustif des occurrences ;
- métrique de réduction du nombre de findings ;
- seuil arbitraire de nombre d’audits ou de défauts.

## Hors périmètre

Ce lot ne :
- réalise pas l’E2E réel GitHub/transport ;
- lance pas l’audit Claude final ;
- active pas VNext ;
- modifie aucun workflow actif ;
- modifie pas PRE-1.

## Gate

VNext-11 est qualifié uniquement si :
- tests convergence PASS ;
- E2E contractuel REVISION reste PASS avec FindingLedger ;
- VNext-01..10 restent PASS ;
- suite KODJO Linux reste PASS ;
- suite KODJO Windows reste PASS sur son périmètre.

Résultat attendu :
`AUDIT_CONVERGENCE_READY`

## Disposition du complément PRE-1

Ce rapport conserve les preuves du lot initial. Les schémas et garanties
affectés sont supersédés par la spec VNext §23 et la
[couverture ciblée courante](KODJO_VNEXT_PRE1_COVERAGE.md) : preuve
NON_VERIFIABLE, registre cumulatif et retrait avec inventaire des runs/replay.
Aucune preuve historique de ce rapport ne qualifie ce complément.
