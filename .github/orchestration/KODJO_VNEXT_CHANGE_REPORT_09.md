# KODJO VNext — Change Report VNext-09

## Objet

Assembler VNext-01→08 en runtime end-to-end, qualifier INITIAL et REVISION, puis projeter l’ExecutionRequest vers la Lean Queue active sans élargir l’autorisation.

## Ajouts

- `scripts/kodjo/lib/vnext-runtime.js`
  - `kodjo.vnext.runtime-snapshot.v1` ;
  - validation ordonnée des 8 étapes VNext ;
  - reconstruction mécanique des artefacts ;
  - INITIAL avec REVISION=NOT_APPLICABLE ;
  - REVISION avec AllowedChangeSet / RevisionPatch / RevisionOutcome RESOLVED obligatoires ;
  - chain_hash ;
  - HANDOFF_READY comme seul terminal state de ce lot ;
  - validation des statuts d’étape même après re-signature.

- `scripts/kodjo/lib/vnext-legacy-queue-adapter.js`
  - `kodjo.vnext.legacy-queue-projection.v1` ;
  - Projection vers `kodjo.protocol.v2.lean-request.0.6.13` ;
  - scope_allow strictement égal au write_scope VNext ;
  - checks strictement identiques ;
  - source_head lié au protocol_head approuvé ;
  - génération déterministe des projections plan/review/mission ;
  - SHA-256 + Git blob OID recalculés ;
  - aucun path/scope libre ;
  - autorité canonique explicitement maintenue sur VNEXT_EXECUTION_REQUEST.

- `.github/orchestration/KODJO_VNEXT_ANTI_REGRESSION_MATRIX.md`
  - disposition explicite INV-001..INV-024 ;
  - inventaire opposable 165 incidents / 138 tests ;
  - distinction mécanisme VNext vs mécanisme transport conservé.

- `tests/kodjo/vnext-e2e-migration.pilot.js`
  - E2E INITIAL → HANDOFF_READY ;
  - projection Lean Queue ;
  - scope widening refusé ;
  - check drift refusé ;
  - compat file tampering refusé ;
  - transport legacy incompatible refusé ;
  - E2E REVISION → RESOLVED → HANDOFF_READY ;
  - REVISION sans preuve bornée refusée ;
  - runtime status tampering refusé ;
  - inventaire 24 / 165 / 138 vérifié.

- `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md`
  - section normative VNext-09 ;
  - contrats runtime/projection ajoutés ;
  - CUTOVER_CANDIDATE défini sans activation.

## Réutilisation

Conservé :
- Lean Queue active et son contrat 0.6.13 ;
- vérifications single-writer, runner, sessions et publication existantes ;
- checks jest/typescript/lint ;
- transport GitHub Reaction compatible avec le gate actif ;
- registre canonique incidents/tests/invariants.

Remplacé dans l’autorité canonique :
- le plan legacy comme source de scope ;
- le commentaire/gate legacy comme preuve primaire d’approbation ;
- les artefacts de transport comme source de vérité.

L’ExecutionRequest VNext reste l’autorité ; le legacy n’est qu’une projection.

## Anti-régression

Le lot ne modifie pas le registre historique.

La qualification exige :
- 24 invariants canoniques uniques ;
- 165 incidents uniques ;
- 138 tests historiques uniques ;
- une ligne de disposition pour chaque INV-001..INV-024.

## Hors périmètre

Ce lot ne :
- modifie aucun workflow actif ;
- active pas VNext ;
- modifie pas la Lean Queue active ;
- modifie pas le runner ;
- modifie pas le code applicatif.

## Gate du lot

Le lot est qualifié uniquement si :
- E2E INITIAL PASS ;
- E2E REVISION PASS ;
- projection legacy PASS ;
- anti-régression 24/165/138 PASS ;
- tests VNext-01..08 restent PASS ;
- suite KODJO Linux reste PASS ;
- suite KODJO Windows reste PASS sur son périmètre ;
- diff borné aux fichiers VNext-09 et à la spec.
