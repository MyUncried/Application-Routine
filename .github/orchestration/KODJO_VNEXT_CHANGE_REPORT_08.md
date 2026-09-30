# KODJO VNext — Change Report VNext-08

## Objet

Implémenter l’approbation utilisateur actionnable et le handoff canonique vers l’implémentation, sans activer VNext.

## Ajouts

- `scripts/kodjo/lib/approval-handoff-contract.js`
  - `kodjo.vnext.approval-target.v1` ;
  - `kodjo.vnext.approval-record.v1` ;
  - `kodjo.vnext.execution-request.v1` ;
  - execution_core dérivé uniquement des artefacts VNext approuvés ;
  - binding au DirectImportScan exact lorsqu’il existe ;
  - execution_fingerprint canonique ;
  - action attendue `APPROVE_EXACT_EXECUTION` ;
  - approbation explicite liée au hash exact ;
  - transports d’approbation fermés ;
  - contrôle de staleness product/application/protocol HEAD ;
  - write_scope / preserve_scope dérivés du PlanContract ;
  - reconstruction bit-for-bit de l’ExecutionRequest ;
  - validation des identités internes même après re-signature du contrat.

- `tests/kodjo/vnext-approval-handoff.pilot.js`
  - ApprovalTarget exact ;
  - review APPROVE obligatoire ;
  - message d’approbation actionnable ;
  - transport de présentation hors identité canonique ;
  - action utilisateur explicite ;
  - target hash exact obligatoire ;
  - REJECTED bloque le handoff ;
  - handoff reconstructible bit-for-bit ;
  - plan modifié après approbation refusé ;
  - application HEAD dérivé refusé ;
  - product HEAD dérivé refusé ;
  - protocol HEAD dérivé invalide l’approbation ;
  - élargissement manuel du write_scope refusé ;
  - transport inconnu refusé ;
  - absence de path/scope libre ;
  - ApprovalTarget re-signé avec ID falsifié refusé ;
  - ApprovalRecord re-signé avec ID falsifié refusé.

- `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md`
  - section normative VNext-08 ;
  - précision de la règle d’approbation actionnable ;
  - ajout du contrat ApprovalTarget à la liste canonique.

## Réutilisation de l’existant

Conservé du handoff V2 :
- approbation utilisateur explicite ;
- identité utilisateur ;
- preuve externe d’approbation ;
- binding plan/review ;
- contrôle du HEAD applicatif ;
- checks `jest / typescript / lint` ;
- autorisation structurée avant queue.

Remplacé pour VNext :
- marqueur textuel `PLAN_HANDOFF_READY` comme autorité ;
- approbation portant implicitement sur plusieurs champs dispersés ;
- autorisation fondée principalement sur le blob du plan.

Le nouvel objet autoritaire est l’ApprovalTarget scellé et son execution_fingerprint.

## Compatibilité

La Lean Queue active n’est pas modifiée dans ce lot.

`kodjo.vnext.execution-request.v1` constitue l’autorisation canonique VNext. Son adaptation vers le contrat de transport actif sera traitée lors du lot de migration/activation et ne pourra pas élargir cette autorisation.

## Hors périmètre

Ce lot ne modifie pas :
- workflows actifs ;
- Lean Queue active ;
- code applicatif ;
- activation VNext.

## Gate du lot

Le lot est qualifié uniquement si :
- les tests VNext-08 passent ;
- les tests VNext-01..07 restent verts ;
- la suite KODJO existante reste verte sur Linux ;
- la suite KODJO existante reste verte sur Windows sur son périmètre ;
- le diff reste borné aux fichiers VNext-08.
