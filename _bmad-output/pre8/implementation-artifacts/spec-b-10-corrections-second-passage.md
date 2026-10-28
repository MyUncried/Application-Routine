# B.10 — Second passage de la recette iPhone A/B (27/10/2026)

Statut : done (recette iPhone validée par Hermann le 27/10/2026, code recetté `88c2adde`). Source : résultats du cahier de recette (collection `results`, 27/10, 13:10–14:41) et accord de Hermann (« 1. Oui — 2. Non — 3. Non »). Décisions : chapitre 07, section « Recette A/B du 27/10/2026, second passage ».

## Périmètre

Inclus : `b2-4`, `b2-5`, `b2-8`, `q6-2`, `r9-a02`, `b7-5`, `b8-3`, remarques générales 2 à 9 et le bouton de lecture vidéo spécifié par Hermann.
Exclus : fiche de Mouvement dans la Composition de Séance (remarque 1) ; saisie des alias (`b5-5`, reportée à la question des langues).

## Réalisé

| Point | Mise en œuvre | Fichiers principaux |
| --- | --- | --- |
| r9-a02 | `type.screenHeaderTitle` (Medium 17/21) pour tous les titres d'écran | `tokens.ts`, `ScreenShell.tsx`, `+not-found.tsx`, `UpdatesDiagnosticScreen.tsx` |
| b7-5 | Un filtre autre que Statut ne garde que les membres correspondants ; Recherche seule : pile entière | `movementCatalogueView.ts` |
| b8-3 | Rang affiché des actifs recalculé sur les actifs ; `familyPosition` garde l'ordre complet | `MovementCatalogueService.ts`, `MovementCatalogueList.tsx` |
| Remarque 2 | Pendant le glisser : ni découpe ni transition de place ; voisines décalées progressivement (`DragShift`) | `MovementCatalogueList.tsx` |
| Remarque 4 | Retour au Catalogue (`reloadToken`) : cartes refermées, piles et filtres conservés | `MovementCatalogueList.tsx` |
| Remarque 9 | `marginTop` 8 de la rangée de commandes rétabli (valeur de `main`) | `CatalogueScreen.tsx` |
| b2-4 | Zone média remontée pendant la saisie (Reanimated, réduction respectée) ; bouton ↑ des Phases | `ActivityEditorForm.tsx`, `MovementPhasesEditor.tsx` |
| b2-5, remarque 7 | Suggestions au-dessus de la zone de contexte ; message Figma `10175:20349` ; Entrée garde le clavier ; fiche verrouillée ; même mécanisme pour un nouveau Niveau | `MovementScreen.tsx`, `ActivityEditorForm.tsx` |
| Remarque 5 | Autofocus du Nom à la création | `ActivityEditorForm.tsx` |
| Remarque 6 | « Ajouter un niveau » / « Ouvrir ce mouvement » (libellés propres à la fiche) | `MovementResultCard.tsx`, `MovementSuggestionPanel.tsx`, `useMovementOriginChoice.tsx` |
| b2-8 | « Ouvrir un autre niveau » ; textes réduits (panneau de repli Android/web) | `MovementLevelMenu.tsx` |
| q6-2 | « (archivé) » dans les menus Niveau (Mouvement et Exercice) et après le nom | `MovementLevelMenu.tsx`, `MovementScreen.tsx`, `ExerciseScreen.tsx` |
| Remarque 4 (médias) | Compteur « rang / total » à la place de « Vidéo » | `ActivityMediaList.tsx` |

## Non livré

- **Bouton de lecture vidéo (72, flou, triangle 30)** : bloqué à ce stade, `expo-blur` absent des dépendances. **Livré ensuite en B.11** (`e74f85b1`, arbitrage B : verre natif `expo-glass-effect`, sans nouvelle build).

## À CLARIFIER

1. Taille des textes du menu Niveau sur iOS : menu natif SwiftUI, taille fixée par le système ; la réduire impose une exception à la primitive native. Toujours en ARBITRAGE (A, B ou C, voir B.11).
2. Rang affiché d'un membre archivé : reste celui de la famille complète ; les menus Niveau de la fiche ne sont pas renumérotés. **Tranché le 28/10** (b8-3 confirmé, option A) : l'archivé garde le rang de la famille complète ; la fiche est alignée sur les rangs des actifs (`MovementScreen`, `displayedLevelPosition`).
3. Forme du repère « (archivé) » (gris, après le nom).
4. Nouveau Niveau verrouillé tant que son nom pré-rempli n'est pas modifié.
5. Libellé VoiceOver du bouton ↑ des Phases : « Valider les phases ».
6. Verrouillage du nom déjà utilisé limité à la création (pas au renommage d'un Mouvement existant).
7. `q6-2` côté Exercice : les autres niveaux restent grisés (règle PRE-7 A3.1, un niveau sans Exercice n'a pas de destination).
