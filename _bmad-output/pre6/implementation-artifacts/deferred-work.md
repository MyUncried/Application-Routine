# PRE-6 — travaux reportés

- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-1-4-operations-de-circuit.md`
  summary: Coordonner la réserve du Circuit (`circuitSeriesReserve`) avec les modifications de séries faites dans la Feuille (vider la réserve d'une occurrence modifiée hors `setCircuitCount`).
  evidence: Revue 1.4 (edge + blind) ; le raccordement de la Feuille à la Composition est la story 3.3.
- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-1-4-operations-de-circuit.md`
  summary: Le changement de N dans la Composition doit passer par `setCircuitCount` (aujourd'hui `updateDraft({ tourRepeatCount })`, `CompositionScreen.tsx:988`).
  evidence: Revue 1.4 (verification-gap) ; raccordement de l'en-tête du Circuit en story 3.1.
- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-2-1-en-tete-bornes-de-seance-et-continuer.md`
  summary: Retirer le jeton orphelin `dimensions.compositionActivityRow.recoveryCardHeight` (sous-carte supprimée) et ses assertions de test.
  evidence: `tokens.ts` verrouillé par `tokensSpecification.test.ts` ; changement à planifier avec Hermann.
