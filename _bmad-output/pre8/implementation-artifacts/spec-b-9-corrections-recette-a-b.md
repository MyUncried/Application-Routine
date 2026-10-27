# B.9 — Corrections de la recette iPhone A/B du 27/10/2026

Statut : **done** — recette iPhone validée par Hermann le 27/10/2026 (code recetté `88c2adde`). Les points « À CLARIFIER » ci-dessous n'ont pas reçu d'arbitrage distinct : le comportement livré est celui qui a été recetté.

Sources : écarts de recette et compléments de Hermann du 27/10/2026 (A01 à G, A01 arbitré à 16, A02), Figma `G6RY5Ebhgwb4AHIOYDwwvg` page `510:101` (`10579:21580`, `10465:23141`, `10462:23370`, `10460:23176`, `6513:20151`, `10453:23030`), chapitres 06, 07, 10, 12, 13, DSF Mouvements du 27/10. Décisions consignées au chapitre 07, « Recette A/B du 27/10/2026 ».

| Item | Réalisation | Fichiers principaux |
|---|---|---|
| A01 | `layout.screenGutter` = 16 (tokens) ; `finalActionSideMargin`, `ScreenShell` (en-tête, zone de contexte), Catalogue, Composition, Profil, Modifier le profil, Sélection d'Exercices, menu Créer, écrans de repli. Exceptions : barre de navigation (24), modales et feuilles, médias pleine largeur | `tokens.ts`, `finalAction.ts`, `ScreenShell.tsx`, écrans |
| A02 | Catalogue : `screenTitle` Semi Bold 20 (inchangé) ; fiche et création Mouvement / Niveau : en-tête existant, Medium 17 (vérifié par test) | `MovementScreen.tsx` |
| B01–B04, B07 | Carte `Carte — Mouvement` : pleine largeur utile, 80, fond `#F9FAFC`, bordure 0,5 `#CCD1E0`, rayon 12, ombre 8 % 0/2/10, titre 15/18, Niveau Medium 12, deux premières étapes Regular 12/16 une ligne chacune, 8 entre média et texte | `MovementCatalogueList.tsx` |
| B05 | Primitives communes `SheetMotion` (Reanimated) : piles, choix d'ajout de Niveau, archivage, filtres ; « Réduire les animations » respecté | `MovementCatalogueList.tsx`, `SheetMotion.tsx` (réutilisé) |
| B06 | Toute la marge gauche de la pile déployée (filet compris), sur sa hauteur, la replie | `MovementCatalogueList.tsx` |
| B08 | Appui long puis glisser dans une pile déployée ; actions accessibles « un niveau plus haut / plus bas » ; `MovementCatalogueService.reorderFamily` → `MovementRepository.reorder` | `MovementCatalogueList.tsx`, `movementCatalogueView.ts`, `MovementCatalogueService.ts` |
| B09 | Pile condensée : aucun glissé, aucune action annoncée | `SwipeActionsRow.tsx` |
| B10 | 8 entre la carte ouverte et « Partager » ; coins arrondis aux extrémités du groupe | `SwipeActionsRow.tsx` |
| B11, B12 | « Ajouter un niveau » ; la carte reste ouverte, Plus facile / Plus difficile (101 × 44, `#8C8C94`, flèches et raccords Figma) se déploient sous les actions | `MovementCatalogueList.tsx`, `SwipeActionsRow.tsx`, `fr.ts` |
| C01, C02 | Déjà conformes (aucun rang ajouté au nom ; création en édition sans crayon) ; tests ajoutés | `MovementScreen.b2.integration.test.tsx` |
| D01, D04 | Commandes rondes 34 / pictogramme 20 / cible 44 / écart 12 ; Rechercher 34 de haut dans une cible 44, largeur flexible | `CatalogueCommands.tsx`, `CatalogueScreen.tsx` |
| D02, D03 | Rechercher sur la rangée des commandes (segment Mouvements) ; croix d'effacement | idem |
| D05 | Module commun : rond inactif, pilule étendue (rond bleu = retirer, zone texte = ouvrir), résumé | `CatalogueCommands.tsx` |
| D06 | Réinitialiser 150 × 32, rayon 16, bordure bleue 1, icône 28 | `MovementFilterSheet.tsx` |
| D07 | Zones proposées par le référentiel (`listAssignableBodyZones`) | `MovementFilterSheet.tsx` |
| E01 | Barre à cinq destinations, Communauté désactivée non routée, sans Recherche | `app/(tabs)/_layout.tsx`, `navigationLayout.ts`, `KodjoIcon.tsx`, icônes `nav5-*` |
| F01–F06 | Média derrière le contexte, zone média fixe, gabarit toujours présent, titres 11 harmonisés, phases en liste textuelle, limite 20 points de code | `ActivityEditorForm.tsx`, `MovementPhasesEditor.tsx`, `MovementScreen.tsx` |
| F07 | `/movement?movementId&mode=edit` depuis le Catalogue ; archivé : consultation seule ; Séance inchangée | `MovementScreen.tsx`, `CatalogueScreen.tsx` |

## À CLARIFIER / à valider par Hermann

1. **Déplacement des phases (F05).** La liste textuelle n'a plus de poignée de glisser ; l'ordre reste modifiable par les actions accessibles (VoiceOver) seulement. Faut-il un déplacement visible (par exemple appui long, comme le Catalogue) ?
2. **Étape « Filtres / Aucun » (ch13 §4.5).** Sans critère, Filtrer ouvre directement la feuille ; l'état étendu intermédiaire n'est pas développé.
3. **Résumé de Filtrer.** Un critère : son libellé ; plusieurs : « N filtres ».
4. **Réordonnancement avec membres masqués (B08).** Les archivés masqués gardent leur place ; seules les places des membres affichés sont redistribuées.
5. **Rangée de commandes hors segment Mouvements.** Alignée à droite (le Figma ne représente que le segment Mouvements).
6. **Croix d'effacement (D03)** : pictogramme composé (cercle gris, ✕ blanc), sans référence Figma.
7. **Champ Rechercher** : aplat `#F3F4F9` (le Figma porte un dégradé vers transparent).
8. **Figma** : la marge de 16 (A01), l'espace média/texte de 8 (B07) et la hauteur 34 du champ (D04) restent à reporter dans le fichier Figma ; aucune écriture Figma n'a été faite.
