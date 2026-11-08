# PRE9 — Carte d'exercice de la Composition au composant « DSF / Cards / Exercice — Composition » — 08/11/2026

## Identifiant et objectif

- Identifiant : `PRE9-CARTE-EXERCICE-COMPOSITION`.
- Objectif (demande de Hermann, 08/11/2026) : « Utiliser le composant « Carte d'exercice » dans la Composition de séance. Remplace le rendu actuel des cartes d'exercice de la Composition de séance par le composant correspondant à « DSF / Cards / Exercice — Composition ». La mission porte sur l'application et ses tests. »
- Branche : `feat/pre9-catalogues-cartes-badge-20261106` (PR #420). Commit de départ : `0755517b`, arbre propre.

## Périmètre

- Demandé : raccorder le composant à toutes les cartes d'exercice de la Composition (§1), reproduire la carte de référence (§2), prescription issue des paramètres réels (§3), mode placement (§4), tests, synchronisation documentaire, rapport.
- Réellement traité : tout le périmètre demandé, plus le libellé du bandeau de placement (« Confirmer N points d'arrêt ajoutés », D-513, encore « pauses » dans le code) et le débord horizontal des cartes (362 à x 20 à 402) nécessaire pour garder le rail au centre de la photo.
- Hors périmètre, non touchés : en-têtes de Circuit / Cycle (chevron du Circuit), défilement (`EnvelopeFrame` / `EnvelopeFrameYContext`), Superset limité, `MEMBER_MINIMUM`, domaine, base de données, Figma (lecture seule : `create_session`, `get_design_context`, `get_metadata`, `get_screenshot` ; aucune écriture).

## Constats et historique

- Composant existant : `src/features/sessions/OccurrenceCard.tsx`, carte v2 de la Composition (PRE-6 story 5.1, D-435, Figma `9798:44464`) : 370 × 80, média 64 à 8 (rayon 12), bord 1 `#E4E7EF` hors Circuit et aucun dans le Circuit, colonne des valeurs avec symbole de durée (« chronomètre »), synthèse Regular 12 grise et durée estimée « / ≈ … », récupération en nœud fourni par l'écran (`OccurrenceRecovery`), Buy-in / Buy-out à la place de la récupération (`passageLabel`, Semi Bold bleu).
- Une seule entrée : `CompositionActivityRow` (`CompositionScreen.tsx`) rend `OccurrenceCard` pour l'ancien modèle (zones avant / dans / après le Tour) et pour la disposition générale (`LayoutExerciseRow` : Séance, Cycle, Circuit, Circuit d'un Cycle, buy-in, buy-out, placement). Aucune autre carte d'exercice construite par la Composition.
- Figma : le composant `11810:2159` n'existait pas dans le code ; ses variantes ne diffèrent que par la couleur du pictogramme (tracé identique, `#141414` / `#7A7A80`). Les pastilles, le sablier et l'icône de changement de côté exportés par Figma sont identiques (tracés comparés) aux icônes `KodjoIcon` existantes ; seul le pictogramme noir manquait.
- Le cadre « Récupération » en pointillés avait déjà été retiré du placement le 01/11/2026 (`PlacementRecoveryFrame`, PRE-9) ; seule la constante `OCCURRENCE_RECOVERY_FRAME` subsistait (supprimée).
- Le bandeau affichait encore « Confirmer N pause(s) ajoutée(s) » malgré D-513.

### Rendus remplacés

- `OccurrenceCard` (réécrit en delta sur le même fichier et la même entrée) : colonne des valeurs, `workSymbol` / `card-work-duration` (chronomètre), durée estimée et séparateur, mise en page « deux lignes » de « Paramètres à compléter. », `OCCURRENCE_CARD_TEXT_FRAME`, `occurrenceRecoveryTouchExtent`, `OCCURRENCE_RECOVERY_FRAME`, `occurrenceCardInCircuitSurface`, prop `bordered`, prop `recovery` (nœud), prop `estimatedDuration`.
- `CompositionActivityRow` : `recoveryNode` (`OccurrenceRecovery` ou `passageLabel` stylé), `isCardBordered`, style `passageLabel`, appel de `formatOccurrenceEstimatedDuration` et `formatOccurrenceSummary`.
- `deathBySummary` : « 1 / +1 rép. » → « 1 rép. +1/min ».

## PRESERVE / CHANGE / FORBIDDEN

| Catégorie | Élément | Preuve après modification |
|---|---|---|
| PRESERVE | Toucher de la carte (paramètres d'exécution), bouton photo (fiche du mouvement), appui long / glisser, balayage Dupliquer / Supprimer, actions VoiceOver Monter / Descendre / Dupliquer / Supprimer, focus | `Pressable` et `activityMediaButton` inchangés (positions dérivées de `OCCURRENCE_CARD_MEDIA`) ; suites `CompositionScreen.test.tsx` (428 tests), `b4`, `b5`, `b6`, `recette2*` vertes ; test de déplacement « Monter / Descendre » dans `CompositionScreen.carteExercice0811.test.tsx` |
| PRESERVE | Carte à compléter (fond et liseré rouges), carte à vérifier (orange, sans liseré orange du 08/11) | `occurrenceCardIncompleteSurface` / `occurrenceCardToVerifySurface` inchangés, testés (`OccurrenceCardIncomplete.test.tsx`) |
| PRESERVE | Défilement `EnvelopeFrame` / `EnvelopeFrameYContext`, Superset limité (`canDuplicate`), `MEMBER_MINIMUM`, chevron du Circuit avant le nom | diff de `CompositionScreen.tsx` sans aucune ligne contenant ces noms ; `CircuitHeader.tsx`, `layoutDrop.ts`, `src/domain` non modifiés ; suites `supersetLimit`, `layoutDrop*`, `CircuitHeader*`, `src/domain/sessions` vertes |
| PRESERVE | Rail au centre de la photo (x 56 à 402), Circuit de 386 à x 8, Circuit dans un Cycle, alignement des bornes sur le bord des cartes (story 7.8) | `RAIL_CENTER_X_IN_COLUMN` = 36 − 4 = 32 (inchangé) ; `CIRCUIT_OUTSET` 16 et `LAYOUT_CIRCUIT_IN_CYCLE_OUTSET` 12 fixés ; tests « largeurs » et « bornes alignées » mis à jour et verts |
| PRESERVE | Nom accessible et repères des Points d'arrêt (« nom - Nn (copie n) ») | `occurrenceCardName` inchangé ; test du niveau vérifie le nom accessible |
| PRESERVE | Primitive native, gestes, aucune migration | aucune primitive remplacée ; aucun fichier de base de données touché |
| CHANGE | Contenu de la carte (72, photo 4/8, lignes 8/30/48, colonne 10, niveau, prescription, rôle + récupération, variantes) | `OccurrenceCardComposition.test.tsx` |
| CHANGE | Prescription (incrément, à l'échec, aucune estimation) | `compositionPresentation.deathBy.test.ts` |
| CHANGE | Débord des cartes 8 → 4 ; marge basse des conteneurs dérivée (8 → 4) | tests rail et largeurs |
| CHANGE | Bandeau « Confirmer N points d'arrêt ajoutés » | `PlacementBar.test.tsx`, `CompositionScreen.test.tsx`, test de placement |
| FORBIDDEN | Écriture Figma, migration, refonte des en-têtes, remplacement d'une primitive native, commit / push | respectés |

## Modifications réalisées

- `OccurrenceCard.tsx` : composant « DSF / Cards / Exercice — Composition » — carte 72, liseré 0,5 `colors.cardsBorder` à 50 % (`rgba(204, 209, 224, 0.5)`, comme `SessionCard`) dans les deux variantes ; contenu en positions absolues repérées sur le bord extérieur (`borderWidth`) ; photo 64 à 4, rayon 8 (sans photo : bord 1 `#7A7A80`, fond `#EEF0F6`, pictogramme 24 noir ou gris ; avec photo : image couvrant le gabarit) ; ligne 1 nom Semi Bold 15 + niveau Medium 12 `text-primary` sur la ligne de base ; ligne 2 pastille dans colonne de 10, catégorie Regular 12 `#7A7A80`, changement de côté puis prescription Semi Bold 12 `text-primary` (jamais abrégée) ; ligne 3 zones, rôle Regular 12, sablier + durée Regular 12 `text-secondary` (`formatPrimeDuration`, masqués à 0) ; placement : contenu grisé et masqué à l'accessibilité.
- `CompositionScreen.tsx` : appel du composant avec niveau, nom visible sans suffixe « - Nn », variante `IN_CIRCUIT` / `OUT_OF_CIRCUIT` selon `structuralPosition` (calculée par l'appartenance effective au Circuit), rôle et récupération ensemble, épaisseur du bord ; état soulevé avec contour 1 ; `CARD_OUTSET` 4 ; intervalle du Circuit porteur pour le Death by.
- `compositionPresentation.ts` : `formatOccurrencePrescription` (à l'échec, AMRAP Volume croissant), `deathBySummary` au nouveau format, `carrierIntervalSeconds` dans le contexte.
- `KodjoIcon.tsx` + `assets/icons/icon-nature-exercice-hors-circuit.svg` : pictogramme noir (même tracé que l'export Figma `11810:2104`).
- `fr.ts` : chaînes de l'incrément ; bandeau « Confirmer {n} point(s) d’arrêt ajouté(s) ».
- `PlacementBar.tsx` : commentaire du libellé.
- Documentation : ch07 (nouvelle section avec les parties normatives recopiées mot pour mot, réalisation, À CLARIFIER), ch06 (tableau de la règle « Ce que porte la carte d'un exercice »), ch13 (réalisation du 08/11 dans CE-T03-08), spec du 06/11 §11 (réalisation), ch12 (DSF carte de Composition), `src/features/sessions/README.md`.

## Synchronisation code / documentation

- Classe A : carte 72 / photo / liseré / lignes / niveau / ligne 2 sans chronomètre / ligne 3 / aucun chevron (D-511) ; placement sans cadre et bandeau « points d'arrêt » (D-513) ; aucune estimation sur la carte (D-511, description Figma).
- Classe B : compléments de la demande du 08/11 (incréments « +2/tour » et « +1/min », « à l'échec » sans durée pour une série, rôle et récupération ensemble, Death by « 1 / +1 rép. » remplacé) — ch07, ch06, ch13, spec §11.
- Classe C (À CLARIFIER, ch07) : voir ci-dessous.
- Classe D : `CARD_OUTSET`, constantes de géométrie, nouvel actif d'icône (ch12).

## Preuves et tests (Jest ciblé, `-w 2`)

- `OccurrenceCardComposition.test.tsx` (nouveau, 15 tests), `OccurrenceCardIncomplete.test.tsx`, `OccurrenceCardMedia.test.tsx` : 30 / 30.
- `compositionPresentation.deathBy.test.ts` (8 tests : les 6 cas + incrément négatif, durée, estimation absente, Death by incomplet), `compositionPresentation*.test.ts` : 94 / 94.
- `CompositionScreen.carteExercice0811.test.tsx` (nouveau : variantes, déplacement entrant / sortant d'un Circuit, buy-in + récupération, AMRAP, Death by, placement et bandeau) et suites corrigées : lot de 7 suites, 151 / 151.
- Lot A (27 suites : `CompositionScreen*`, `OccurrenceCard*`, `compositionRail`, `compositionPresentation*`) : 743 / 748 puis les 5 échecs (géométrie 8 → 4 codée en dur) corrigés et revérifiés.
- Lot D (92 suites : `SessionCard*`, `layoutDrop*`, `src/domain/sessions`, `Composition*` dont `CompositionScreen.test.tsx`, intégrations, `CircuitHeader*`, `sessionCatalogue*`, `ExecutionParametersSheet.format0711`, `formats.recette0811`, `recette3*`) : 1897 / 1898, l'échec (`compositionDeletion.test.ts`, carte 80 / média 8 codés) corrigé : 6 / 6.
- `PlacementBar.test.tsx`, `src/shared/i18n` : verts.
- `npx tsc --noEmit` : aucune erreur. ESLint sur les fichiers modifiés : aucune nouvelle erreur (12 erreurs `react-hooks/refs` et 3 avertissements préexistants à `0755517b`, lignes non modifiées).
- Base avant modification (`0755517b`) : 7 suites, 549 / 549.
- Tests mis à jour (valeurs remplacées par la décision) : `CompositionScreen.test.tsx`, `compositionRail.test.ts`, `compositionDeletion.test.ts`, `CompositionScreen.b2`, `recette2`, `recette2composition` (croissance prévue 61 → 57 : marge basse 4), `PlacementBar.test.tsx`, `i18n/index.test.ts`.

## Hypothèses non démontrées

- Rendu réel, alignement sur la ligne de base, troncature, couleurs du liseré à 50 % : non observés (aucun écran).
- Le contenu en positions absolues reste aligné sur le bord extérieur sous Fabric iOS (bord 0,5 / 1) : démontré par les styles seulement.

## Écarts à Figma

- Format des durées : « 3 × 1 min 30 », « 45 s », « 30 s » de la maquette s'affichent « 3 × 1′30″ », « 45″ », « 30″ » (décision de Hermann du 08/11 au soir).
- Niveau : interligne 15 (`type.movementCardLevel`, comme la carte Mouvement D-508) au lieu de 16 dans Figma.
- Pastilles : boîte de 13 centrée dans la colonne de 10 qui commence à 76 (centre 81 ; Figma 81,5) ; texte à 93 comme Figma.
- Marge basse d'un Circuit sous ses cartes : 4 (règle du 30/10) ; l'écran de référence montre 10 (et 10 en haut, le code garde 14).
- Bornes (Compte à rebours, Fin) alignées sur le bord des cartes (x 382, règle story 7.8) ; l'écran de référence les termine à x 378.

## À CLARIFIER (consignés au ch07)

1. Marge basse d'un Circuit / Cycle sous ses cartes : 4 (règle du 30/10) ou 10 (écran `11789:21914`) ; marge haute 14 ou 10.
2. Death by à intervalle différent d'une minute : « +1/30″ » affiché.
3. AMRAP à incrément négatif : « 10 rép. −1/tour » affiché.
4. « Paramètres à compléter. » sur une ligne (la règle « deux lignes, chronomètre à sa place » du 29/10 est sans objet sans chronomètre).

## Éléments non corrigés / hors périmètre

- `OccurrenceRecovery` (`ActivityRecoveryLine.tsx`) n'est plus utilisé par la Composition ; laissé en place (aucun nettoyage hors périmètre).
- `formatOccurrenceEstimatedDuration` reste exporté (plus appelé par la carte).
- Commentaire de `src/domain/sessions/placement.ts` (l. 254) citant encore « Confirmer N pauses ajoutées » : non modifié (domaine hors périmètre).

## Vérifications restant à faire sur iPhone

- Les deux variantes (pictogramme noir hors circuit, gris dans un circuit), y compris un Exercice directement dans un Cycle (noir) ; avec et sans photo.
- Nom long avec niveau : troncature avant « Niveau N », ligne de base commune.
- Buy-in avec récupération : « Buy-in », sablier, « 30″ » sur la ligne 3 ; carte sans récupération (ni sablier ni valeur).
- Prescriptions à incrément : « 10 rép. +2/tour », « 1 rép. +1/min » ; « à l'échec ».
- Mode placement : emplacements, aucun cadre en pointillés, bandeau « Confirmer N points d'arrêt ajoutés », confirmation.
- Liseré 0,5 à 50 %, carte de 362 à x 20, rail au centre de la photo, marge basse 4 des Circuits / Cycles, état soulevé, carte rouge / orange.

## Fichiers modifiés

- `src/features/sessions/OccurrenceCard.tsx`, `src/features/sessions/CompositionScreen.tsx`, `src/features/sessions/compositionPresentation.ts`, `src/features/sessions/PlacementBar.tsx`, `src/features/sessions/README.md`, `src/shared/ui/KodjoIcon.tsx`, `src/shared/i18n/resources/fr.ts`, `assets/icons/icon-nature-exercice-hors-circuit.svg` (nouveau).
- Tests : `src/features/sessions/__tests__/OccurrenceCardComposition.test.tsx` (nouveau), `CompositionScreen.carteExercice0811.test.tsx` (nouveau), `OccurrenceCardIncomplete.test.tsx`, `OccurrenceCardMedia.test.tsx`, `compositionPresentation.deathBy.test.ts`, `compositionRail.test.ts`, `compositionDeletion.test.ts`, `CompositionScreen.test.tsx`, `CompositionScreen.b2.test.tsx`, `CompositionScreen.recette2.test.tsx`, `CompositionScreen.recette2composition.test.tsx`, `PlacementBar.test.tsx`, `src/shared/i18n/index.test.ts`.
- Documentation : `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md`, `07 – Registre des décisions de conception.md`, `12 – Architecture technique.md`, `13 – Contrats d’écran.md`, `docs/KODJO-Catalogues-cartes-modales-2026-11-06.md`, ce rapport.

## Commit final et état Git

- Aucun commit ni push (consigne : la session principale relit et livre). Commit final : à créer par la session principale.
- État Git : 23 fichiers modifiés, 4 fichiers nouveaux non suivis (actif SVG, deux tests, ce rapport), sur `feat/pre9-catalogues-cartes-badge-20261106` au-dessus de `0755517b`.
