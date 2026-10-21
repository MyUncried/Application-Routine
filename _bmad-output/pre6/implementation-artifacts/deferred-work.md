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
  summary: Dynamic Type — la carte v2 a des hauteurs fixes (80, lignes 18 / 16 / 17) ; une taille de texte agrandie tronque ou déborde. Aucun écran de l'application ne gère aujourd'hui Dynamic Type.
  evidence: Revue 5.1 ; sujet transverse, à planifier avec Hermann.
- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-5-2-rail-segmente-circuit-bornes-et-points-d-arret.md`
  summary: Panneau du choix de nature (Android / web, `CircuitNaturePanel`) : toujours ancré au bord droit du contenu, alors que la pastille de nature suit désormais le titre et l'œil (en-tête sur une ligne, durée à droite). Le menu natif iOS s'ancre lui-même.
  evidence: Story 5.2 (D-435, choix D4) ; comportement inchangé, position du panneau à revoir avec Hermann (hors iOS).
- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-5-2-rail-segmente-circuit-bornes-et-points-d-arret.md`
  summary: Retirer les jetons devenus orphelins `dimensions.compositionTourSection.radius` (10, remplacé par le rayon 18 du Circuit v2) et `closedHeight` (54, plus de hauteur minimale) ; `inset` reste utilisé par `SWIPE_REVEAL_OFFSET` jusqu'à la story 5.4.
  evidence: Revue 5.2 ; `tokens.ts` verrouillé par `tokensSpecification.test.ts` ; à regrouper avec les autres jetons orphelins de PRE-6.
- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-5-3-placement-mixte-et-defilement.md`
  summary: Saut de défilement à l'entrée ou à la sortie du placement (rangées de point d'arrêt ajoutées ou retirées sous les cartes, cadre qui élargit la colonne des valeurs) — position conservée ou non à juger sur appareil.
  evidence: Revue 5.3 ; non observable en Jest, jalon J4.
- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-5-3-placement-mixte-et-defilement.md`
  summary: Récupération corrompue (NaN, négative) en placement : `placementSlots` la voit « présente » (pas de cadre) mais rien n'est affiché ni modifiable ; cas rare (données historiques).
  evidence: Revue 5.3 ; aucune donnée connue, à traiter avec la validation des données si une source en produit.
- source_spec: `_bmad-output/pre6/implementation-artifacts/spec-5-3-placement-mixte-et-defilement.md`
  summary: Les ± du stepper révélé (`InlineStepper`, `ProfileStepper.tsx`, partagé avec la Feuille PRE-5) gardent un `hitSlop` qui peut dépasser leur parent (sans effet sous Fabric iOS) ; à convertir en boîtes réelles avec la Feuille.
  evidence: Revue 5.3 (cibles réelles) ; composant partagé hors du périmètre de la story.
