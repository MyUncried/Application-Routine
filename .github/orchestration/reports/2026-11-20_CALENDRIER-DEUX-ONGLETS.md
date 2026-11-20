# 2026-11-20 — Calendrier : deux onglets seulement (D-542)

## Identifiant et objectif

- **Mission** : CALENDRIER-DEUX-ONGLETS.
- **Objectif** : retirer le troisième onglet du Calendrier (D-542).
- **Sources lues sans fusion**, sur `docs/planification-grille-creneaux` au commit `bce52a34` : D-542 (ch07) et DSF Barre de titre à onglets.
- **Branche** : `planification/ce-ui-12-20261118`.
- **Commit de départ** : `cd623f40`.

## Constats

- L'onglet « Vue d'ensemble » était présent mais indisponible. **Aucun écran** ne lui correspondait : il n'y a rien à supprimer de ce côté.
- La barre partagée (`CatalogueNavigation`) répartit ses onglets sur toute la largeur. Avec deux onglets, ils seraient centrés à x ≈ 108,5 et 293,5, et non à 139,5 et 262,5.

## Modifications réalisées

- `CalendarViewTabs.tsx` : options « Journal » et « Agenda » seulement. Plus d'onglet indisponible ni de libellé « non disponible ».
- `CatalogueNavigation.tsx` et `TabbedScreen.tsx` : option facultative `slotFraction`. Chaque emplacement prend cette part de la largeur utile et les emplacements sont centrés.
  - Le Calendrier passe `1/3`, comme la largeur des emplacements des Catalogues. Les centres tombent à x ≈ 139,3 et 262,7, pour 139,5 et 262,5 dans la maquette.
  - La forme arrondie de l'onglet actif suit son emplacement, donc son libellé.
- `planningStrings.ts` : libellés « Vue d'ensemble » et « vue non disponible » retirés.
- `app/(tabs)/calendar.tsx` : commentaire mis à jour.
- Aucun écran « Plan » créé.

## PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE** :
  - **Catalogues** : ils ne passent pas `slotFraction`, donc le style des emplacements (`flex: 1`) et de la rangée est identique. `CatalogueScreen.test` et les tests de `src/shared/ui` (dont `TabbedScreen`) sont verts.
  - **Journal et Agenda** : aucun changement hors de la barre ; leurs tests sont verts.
  - **Barre de navigation** : non touchée.
  - **Navigation entre les deux vues** : vérifiée par le test du Journal (onglet Agenda → `onChangeView("agenda")`) et par l'onglet actif.
- **CHANGE** : onglets du Calendrier.
- **FORBIDDEN** (respecté) : catalogues non touchés (une option facultative ajoutée, absente chez eux) ; aucune vue ajoutée.

## Tests

- `CalendarWeekScreen.integration` :
  - deux onglets seulement, plus de « Vue d'ensemble » ;
  - emplacements d'un tiers, centrés ;
  - onglet Agenda actif.
- `JournalScreen.integration` : onglet Journal actif, pas de troisième onglet, passage à l'Agenda.
- **Exécutés** : `npx jest -w 2` sur `src/features/planning`, `src/shared/ui`, `CatalogueScreen.test` et `app/__tests__` : **323 tests réussis sur 323**, après correction d'une assertion d'arrondi dans le nouveau test.
- `tsc` et `eslint` sur les fichiers modifiés : aucune erreur.
- **Suite complète** : non relancée. La précédente a été arrêtée faute de mémoire, et sa relance attend l'accord de Hermann.
- **À vérifier sur iPhone** : position des deux libellés et forme de l'onglet actif.

## Synchronisation

- **Classe A** : le code rejoint D-542.
- DSF Barre de titre à onglets de cette branche annoté.

## Fichiers modifiés

- `src/features/planning/CalendarViewTabs.tsx`
- `src/features/sessions/CatalogueNavigation.tsx`
- `src/shared/ui/TabbedScreen.tsx`
- `src/features/planning/planningStrings.ts`
- `app/(tabs)/calendar.tsx`
- tests : `src/features/planning/__tests__/CalendarWeekScreen.integration.test.tsx`, `JournalScreen.integration.test.tsx`
- `docs/DSF-BARRE-TITRE-ONGLETS-2026-11-19.md`
- ce rapport

## Commit final et état Git

- **Commit** : celui qui contient ce rapport.
- **État Git** : propre après commit ; branche ni envoyée sur GitHub ni fusionnée.
