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
- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-2-2-cartes-d-occurrence.md`
  summary: Retirer les jetons devenus orphelins `dimensions.compositionActivityRow.restHeight` et `compactRestHeight` (cartes 64 / 70 depuis la story 2.2).
  evidence: `tokens.ts` verrouillé par `tokensSpecification.test.ts` ; à regrouper avec le retrait de `recoveryCardHeight`.
- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-3-1-en-tete-du-circuit-et-compteur.md`
  summary: Retirer l'icône `icon-tour` (KodjoIcon, manifeste) et le jeton `dimensions.compositionTourControl`, sans usage depuis le retrait de `TourCard`.
  evidence: `tokens.ts` verrouillé ; à regrouper avec les autres jetons orphelins de PRE-6.
- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-2-3b-reorganisation-animee-au-glisser.md`
  summary: Test épinglant le nombre de rendus de `CompositionScreen` pendant un glisser (re-rendu seulement au changement d'emplacement).
  evidence: Revue 2.3b (verification-gap) ; comportement présent, non verrouillé par un test.
- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-5-1-carte-v2-et-recuperation-en-troisieme-ligne.md`
  summary: Retirer l'icône `composition-reorder` (KodjoIcon, `composition-reorder.svg`, manifeste) et le jeton `dimensions.structureMovableIcon` (`glyph`, `slot`), sans usage depuis la suppression de la poignée (carte v2, D-435).
  evidence: `tokens.ts` verrouillé par `tokensSpecification.test.ts` ; à regrouper avec les autres jetons orphelins de PRE-6.
- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-5-1-carte-v2-et-recuperation-en-troisieme-ligne.md`
  summary: Carte à 370 de large et x 16 (écran 402) : élargir la rangée d'occurrence au-delà de la colonne des étapes, avec le rail sur le média et le débord 8 du Circuit.
  evidence: Story 5.1 : la carte occupe la colonne actuelle (le rail et le fond du Circuit ne sont pas encore v2) ; à traiter avec la story 5.2.
- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-5-1-carte-v2-et-recuperation-en-troisieme-ligne.md`
  summary: Dynamic Type — la carte v2 a des hauteurs fixes (80, lignes 18 / 16 / 17) ; une taille de texte agrandie tronque ou déborde. Aucun écran de l'application ne gère aujourd'hui Dynamic Type.
  evidence: Revue 5.1 ; sujet transverse, à planifier avec Hermann.
- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-5-1-carte-v2-et-recuperation-en-troisieme-ligne.md`
  summary: Recentrer le repère (point) d'une occurrence sur la carte de 80 (`OCCURRENCE_MARKER_CENTER_Y` vaut encore 24, calé sur l'ancienne carte).
  evidence: Revue 5.1 ; rail segmenté et repères de la story 5.2.
