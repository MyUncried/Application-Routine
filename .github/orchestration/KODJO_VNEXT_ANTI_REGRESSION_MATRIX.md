# KODJO VNext — Matrice anti-régression canonique

## Objet

Cette matrice rend opposable la règle VNX-12 avant toute activation de VNext.

Source historique autoritative :
`.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md`.

Inventaire attendu de la source canonique :
- 24 invariants `INV-001..INV-024` ;
- 165 incidents `INC-001..INC-165` ;
- 138 tests `T-001..T-138`.

Les incidents et tests restent des évidences historiques : ils ne sont ni renumérotés ni réinterprétés comme de nouvelles règles. Les règles à disposer sont les 24 invariants consolidés.

Dispositions autorisées :
`CONSERVÉE | REMPLACÉE_ÉQUIVALENTE | SUPERSÉDÉE_EXPLICITEMENT | NON_APPLICABLE_JUSTIFIÉE`.

## Matrice

| Invariant | Disposition VNext | Mécanisme VNext / transport | Évidence automatisée |
|---|---|---|---|
| INV-001 | REMPLACÉE_ÉQUIVALENTE | ApprovalTarget → ApprovalRecord → ExecutionRequest ; aucune implémentation sans APPROVED exact | `vnext-approval-handoff.pilot.js`, `vnext-e2e-migration.pilot.js` |
| INV-002 | REMPLACÉE_ÉQUIVALENTE | Single-writer/lock conservés et RemoteWritePolicy inventorie toutes les surfaces d’écriture sans filtre de préfixe ; legacy figé par blob, writers VNext déclarés | suites KODJO + `vnext-remote-write-security.pilot.js` |
| INV-003 | REMPLACÉE_ÉQUIVALENTE | SourceManifest, PlanningEnvelope et hashes canoniques priment sur mémoire/texte libre | `vnext-foundations.pilot.js`, runtime snapshot |
| INV-004 | REMPLACÉE_ÉQUIVALENTE | AMBIGUOUS/CLARIFICATION_REQUIRED, autorité UI sourcée, aucune invention de path/ID | `vnext-requirement-registry.pilot.js`, `vnext-ui-atomicity.pilot.js` |
| INV-005 | REMPLACÉE_ÉQUIVALENTE | DecisionRecord OPEN/RESOLVED, options et preuve causale | `vnext-foundations.pilot.js` |
| INV-006 | REMPLACÉE_ÉQUIVALENTE | Politique d’erreur fermée + contrats distincts par frontière + findings structurés | VNext-01, VNext-06 |
| INV-007 | CONSERVÉE | Révision consomme les artefacts durables existants ; aucune relance IA implicite n’est introduite | VNext-07 + transport Lean existant |
| INV-008 | CONSERVÉE | Les contrats de planification sont sans dépendance à un session_id ; la projection IMPLEMENT initiale garde `session_id=null` et la sémantique resume reste celle de la queue active | VNext-09 adapter + suites queue existantes |
| INV-009 | REMPLACÉE_ÉQUIVALENTE | Unicode exact, refus #Uxxxx / \\uXXXX / U+FFFD ; paths Git issus de CandidateManifest | VNext-01, VNext-03 |
| INV-010 | REMPLACÉE_ÉQUIVALENTE | TestObligation et ProofObligation explicites ; preuves adaptées aux propriétés UI | VNext-04, VNext-05 |
| INV-011 | CONSERVÉE | Les chemins de qualification/transport actifs continuent d’installer leurs dépendances ; VNext-09 n’ajoute aucun workflow autonome non qualifié | suite KODJO active |
| INV-012 | REMPLACÉE_ÉQUIVALENTE | RuntimeSnapshot scelle tous les hashes de la chaîne ; GitHub conserve run/status/SHA côté transport | VNext-09 runtime + pilot workflow |
| INV-013 | REMPLACÉE_ÉQUIVALENTE | Réentrée minimale, AllowedChangeSet, RevisionPatch, FindingLedger et arrêt terminal après audit final | VNext-07, VNext-11 |
| INV-014 | REMPLACÉE_ÉQUIVALENTE | ImpactGraph → Plan boundaries → ExecutionRequest → queue scope exact, sans path libre | VNext-03/04/08/09 |
| INV-015 | REMPLACÉE_ÉQUIVALENTE | Review APPROVE + approbation exacte + ExecutionRequest avec checks autoritatifs sur HEAD exact | VNext-06/08/09 |
| INV-016 | CONSERVÉE | Canonical JSON/UTF-8 côté VNext ; transport actif conserve ses règles UTF-8/BOM/PowerShell | VNext-01 + suites KODJO existantes |
| INV-017 | REMPLACÉE_ÉQUIVALENTE | Aucun workflow actif modifié pendant construction ; au cutover les anciens writers restent figés uniquement pour les slices legacy puis doivent être retirés après la dernière fermeture | VNext-10 + VNext-F01 |
| INV-018 | REMPLACÉE_ÉQUIVALENTE | Projection legacy déterministe ; toute capacité de publication distante est inventoriée/frozen ou déclarée, et une capacité supplémentaire échoue | VNext-09 adapter + VNext-F01 |
| INV-019 | CONSERVÉE | Les marqueurs des workflows actifs restent inchangés ; VNext canonique utilise des schémas/keys exacts et non des préfixes textuels | suites existantes + contrats VNext |
| INV-020 | REMPLACÉE_ÉQUIVALENTE | SourceManifest borné + contrats compacts + REVISION différentielle au lieu de reconstruction globale | VNext-01/02/07 |
| INV-021 | REMPLACÉE_ÉQUIVALENTE | Aucun retry automatique ; FINAL_REVISE_TERMINAL interdit toute nouvelle boucle d’audit sans nouvelle décision explicite | VNext-01, VNext-11 + transport actuel |
| INV-022 | REMPLACÉE_ÉQUIVALENTE | JSON canonique, exact keys et validation par reconstruction remplacent les parsing fragiles de gates | VNext-01→09 |
| INV-023 | REMPLACÉE_ÉQUIVALENTE | PlanningEnvelope sépare baseline_head, product_head, application_head et base causale REVISION | VNext-01, VNext-07 |
| INV-024 | REMPLACÉE_ÉQUIVALENTE | Tests négatifs par contrats exacts, reconstruction complète et qualification Linux/Windows du HEAD de PR | tests VNext-01→09 + workflow pilote |

## Règles de migration

1. Une disposition `CONSERVÉE` signifie que VNext ne remplace pas le mécanisme au lot d’intégration ; l’activation doit conserver le contrôle existant.
2. Une disposition `REMPLACÉE_ÉQUIVALENTE` exige que le nouveau mécanisme soit exécuté dans l’E2E VNext avant cutover.
3. Aucune disposition ne vaut preuve à elle seule : le test associé doit PASS.
4. Toute absence d’un invariant `INV-001..INV-024`, d’un incident `INC-001..INC-165` ou d’un test `T-001..T-138` dans le registre canonique bloque la qualification.
5. Le cutover ne peut supprimer un mécanisme `CONSERVÉE` tant qu’une disposition nouvelle n’a pas été explicitement validée.
6. Le cutover exige une attestation RemoteWritePolicy PASS liée au CutoverPlan ; après fermeture de la dernière slice legacy, seul `PASS_RETIRED` est recevable.

## Conclusion du lot

VNext-09 peut être déclaré `CUTOVER_CANDIDATE` uniquement si :
- les 24 lignes ci-dessus sont présentes avec une disposition autorisée ;
- l’inventaire historique 165/138 reste complet ;
- l’E2E INITIAL et l’E2E REVISION passent ;
- la projection Lean Queue ne modifie ni scope, ni checks, ni HEAD autorisés ;
- les suites KODJO existantes restent vertes sur leur périmètre.

## Complément ciblé des écueils PRE-1

La [couverture des six axes](KODJO_VNEXT_PRE1_COVERAGE.md) distingue conception,
implémentation contractuelle, tests et activation effective. Contrôles :
`vnext-proof-stability.pilot.js` et extension
`vnext-audit-convergence.pilot.js`. Les tests ne clôturent pas la matrice
individuelle 165/138. Restent à prouver : intégration producteurs/résolution,
registre cumulatif dans tous les gates, transport authentifié, déclenchement
CI distant et collecte réelle de retrait/replay legacy. Aucun PASS global ni
cutover ne se déduit des tests de contrat de ce complément.

## Disposition individuelle et lecture de l’architecture

La [matrice individuelle](KODJO_VNEXT_HISTORICAL_DISPOSITION.md) complète les
24 invariants, sans certifier ses équivalences encore ouvertes. La présence
des 165/138 lignes ne vaut pas readiness. Le validateur historique refuse
la certification tant que les responsabilités et preuves individuelles ne
sont pas fermées. Les paragraphes inclusifs AI_ORCHESTRATION restent à
qualifier en clauses applicables.

[Traitement de l’audit anticipé](reports/2026-09-30_VNEXT_ARCHITECTURE_CLOSURE.md).
