# PRE-9 — Recette iPhone du 07/11/2026 : catalogue des mouvements d'un Format (A, B, D, E, H) et couleurs des catalogues

- Identifiant : PRE9-RECETTE-0711-CATALOGUE-FORMAT
- Objectif : corriger les remarques A, B, D, E, H de Hermann (mode catalogue ouvert par « + Ajouter » dans un Format) et appliquer D-501 révisée (couleurs des catalogues, 08/11/2026).
- Branche : `feat/pre9-catalogues-cartes-badge-20261106` ; commit de départ : `c9f5695b`.
- Mission de correction, menée par un sous-agent ; consigne de l'appelant : aucun commit, push, changement de branche, stash ni reset (l'appelant relit et committe). Ce rapport est donc livré **non committé** : le commit qui le contiendra reste à créer par l'appelant.

## Périmètre

Demandé : A, B, D, E, H et couleurs (jetons, fondus, modale « Catalogue des mouvements » ouverte depuis la Composition). Fichiers en cours de modification en parallèle laissés intacts (CompositionScreen.tsx, FormatTables.tsx, ExecutionParametersSheet.tsx, CarrierDurationSheet.tsx, jetons des interrupteurs).

Traité : tout le périmètre demandé ; dans `FormatModelScreen.tsx`, uniquement le mode catalogue (cartes, piles, fondus d'ouverture et de fermeture, zone de recherche, zone d'action du bas).

## Constats (causes)

- Le catalogue d'un Format n'est pas `MovementCatalogueList` : c'est le « mode catalogue » rendu dans `FormatModelScreen.tsx` (`familyCards`, `collapsedPile`, cartes `SelectedMovementCard`).
- A : la carte du dessus d'une pile repliée recevait `togglePicked` (sélection) ; seul le filet dépliait.
- B : `SelectedMovementCard` affichait le Niveau en `#0508E5`, centré verticalement (`alignItems: "center"`).
- D : liste, recherche et bouton du bas apparaissaient d'un coup ; pastille des zones (`card-body-zone-badge`) = SVG affiché par `expo-image`, chargé et décodé de façon asynchrone (en développement, servi par Metro) — même cause que le pictogramme Trier corrigé le 06/11 dans `CatalogueCommands.tsx`. Repli / dépli au filet : bascule instantanée, sans animation.
- E : `closeCatalogue()` était immédiat pour les trois boutons.
- H : les cartes d'une pile sont décalées de 8 (`styles.family.paddingLeft`, place du filet), les cartes sans famille ne l'étaient pas ; les bords droits étaient déjà alignés (marges identiques) : seule la lecture « décaler vers la droite » produit un changement.
- Couleurs : jetons D-501 du 06/11 ; `MovementSelectionScreen` (modale de la Composition) utilisait le fond blanc par défaut de `ScreenShell`, la bande `colors.contextBand` (lilas) et le dégradé blanc de `PrimaryActionZone`.

## Modifications

- `src/shared/ui/tokens.ts` : `catalogueMovementsContext #DDEBFF`, `catalogueMovementsBackground #F1F7FF`, `catalogueSessionsBackground #F7F7FF`, `catalogueProgramsBackground #F9F6FF` (fond = 40 % du contexte sur blanc, vérifié par calcul).
- `src/features/activities/MovementSelectionScreen.tsx` : fond, bande de contexte et dégradé du bas = `catalogueColors("movements")`.
- `src/shared/ui/PrimaryActionZone.tsx` : prop facultative `background` (couleur d'arrivée du dégradé) ; défaut inchangé (blanc).
- `src/features/activities/SelectedMovementCard.tsx` : prop `inCatalogue` — Niveau couleur du nom (`#14171C`), première ligne `alignItems: "baseline"` ; récapitulatifs inchangés.
- `src/shared/ui/KodjoIcon.tsx` : `prefetchKodjoIcons(names)` (préchargement `Image.prefetch` dans le cache mémoire et disque d'`expo-image`) ; rendu des icônes inchangé.
- `src/features/sessions/FormatModelScreen.tsx` (mode catalogue seulement) : A (carte du dessus d'une pile repliée → dépli, sans sélection) ; B (`inCatalogue`) ; D (préchargement de la pastille au montage ; ouverture : contenu, recherche et bouton du bas en fondu de 450 ms ; repli / dépli : membres qui glissent depuis la carte du dessus, feuilles en fondu en fin de repli, cartes suivantes en transition de place, uniquement pendant 550 ms après un repli / dépli) ; E (fondu de sortie de 450 ms puis fermeture, paramètres qui réapparaissent en fondu ; immédiat sous « Réduire les animations ») ; H (retrait de 8 des cartes sans famille).

## Tests

- Ajoutés : `src/features/sessions/__tests__/FormatModelScreen.r0711.test.tsx` (A, B, H, D, E, E sous « Réduire les animations ») ; un cas D-501 révisée dans `MovementSelectionScreen.cat1.test.tsx`.
- Ajustés : `CatalogueScreen.test.tsx` (nouvelles valeurs D-501) ; `FormatModelScreen.c3.test.tsx` (deux fermetures attendues dans `act` async, la fin du fondu étant signalée au fil JS).
- Résultats : 14 suites / 179 tests PASS (Formats, Catalogue, sélection, listes du catalogue, `PrimaryActionZone`, `ScreenShell`) ; `CompositionScreen.test.tsx` 428 PASS ; 4 suites dépendantes 155 PASS ; `npx tsc --noEmit` sans erreur.
- Échecs observés hors périmètre : `formats.recette0611.test.tsx` (2 tests, largeur de Max dans les tableaux), liés aux modifications parallèles de `FormatTables.tsx`, non touché.
- Aucun test ne valide le rendu visuel.

## Hypothèses non démontrées

- Le préchargement suffit à faire apparaître la pastille avec sa carte (lecture du cache mémoire d'`expo-image` à l'affichage) : non vérifiable sans iPhone.
- H : interprétation « décaler vers la droite » (retrait de 8), les bords droits étant déjà alignés.
- B : « aligner en bas » réalisé par la ligne de base du texte.

## Hors périmètre / non corrigé

- Couleurs du mode catalogue d'un Format (fond blanc de la feuille) : non demandées, inchangées.
- Documentation : à la charge de l'appelant (classe B pour A, B, D, E, H et D-501 révisée).

## À vérifier sur iPhone

A (dépli sans sélection), B (noir, alignement), D (apparition simultanée de la pastille, fondu de la liste, glissement au repli / dépli, absence de saccade pendant la recherche), E (fondu de sortie puis retour des paramètres), H, couleurs du Catalogue et de la modale de la Composition (bande, fond, fondu du bas).

## Fichiers modifiés

`src/shared/ui/tokens.ts`, `src/shared/ui/PrimaryActionZone.tsx`, `src/shared/ui/KodjoIcon.tsx`, `src/features/activities/SelectedMovementCard.tsx`, `src/features/activities/MovementSelectionScreen.tsx`, `src/features/sessions/FormatModelScreen.tsx`, `src/features/sessions/__tests__/FormatModelScreen.r0711.test.tsx` (nouveau), `src/features/sessions/__tests__/FormatModelScreen.c3.test.tsx`, `src/features/sessions/__tests__/CatalogueScreen.test.tsx`, `src/features/activities/__tests__/MovementSelectionScreen.cat1.test.tsx`, ce rapport.

## Commit final et état Git

Aucun commit (consigne de l'appelant). HEAD `c9f5695b` ; arbre de travail modifié, avec d'autres modifications parallèles non liées à cette mission.
