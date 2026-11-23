# 2026-11-20 — Agenda : filtre par routine (D-539)

## Identifiant et objectif

- **Mission** : AGENDA-FILTRE-ROUTINE (lot 2 sur 2, après AGENDA-ZONE-CONTEXTE `f3e1dcd8`).
- **Objectif** : appliquer `docs/PROMPT-CLAUDE-CODE-AGENDA-FILTRE-ROUTINE-2026-11-20.md` (D-539), lu sur `docs/planification-grille-creneaux` au commit `562a5a0d`, sans fusion.
- **Branche** : `planification/ce-ui-12-20261118`.
- **Commit de départ** : `f3e1dcd8`.

## Sources

- **Branche `docs/planification-grille-creneaux` au commit `562a5a0d`**, lue sans fusion :
  - le prompt ;
  - D-539 (ch07) ;
  - `docs/DSF-AGENDA-PLANNING-2026-11-19.md`, § 9 et § 2.
- **Figma** :
  - « P-Calendrier — Semaine — Filtre par routine — Choix de la routine (proposition) » `12795:25088` ;
  - « … — Vue filtrée (proposition) » `12799:24881` ;
  - composant `icon/filtre-routine` : « Inactif » `12794:49374`, « Actif (filtre en cours) » `12794:49376` ;
  - `DSF / Controls / Case à cocher` `5544:4750` ;
  - `DSF / Actions / Bouton primaire` `5544:4522`.

## Périmètre demandé et traité

| Point du prompt | Traité |
|---|---|
| 1. Entonnoir à l'extrême droite de la ligne 1 | Oui : 34 × 34, sans cercle ; contour gris sans filtre, plein bleu filtre actif |
| 2. Modale « Filtrer par routine » | Oui, voir le détail ci-dessous |
| 3. Bouton | Oui : « Filtrer N routines » / « Filtrer 1 routine » / « Afficher toutes les routines » (retire le filtre) |
| 4. Vue filtrée | Oui, voir le détail ci-dessous |
| 5. Cartes, états, déploiement, actions, modification, suppression | Inchangés ; suppression vérifiée en vue filtrée |

Détail du point 2, la modale :
- ✕ en haut à gauche et titre, posés sur le fond de la zone de contexte du Journal, qui part du haut ;
- recherche sur la largeur disponible, Filtre et Tri à droite, sans compteurs ni « Planifier » ;
- recherche et filtres comme au Journal (feuille des filtres du Catalogue des séances) ; tri inactif comme au Journal ;
- carte du Journal réduite : nom, « X à venir, jusqu'au jj/mm/aaaa », cadre de gauche, case à cocher ;
- sélection multiple ; à la réouverture, les routines du filtre en cours sont cochées ;
- routines ayant au moins un créneau, archivées comprises, par ordre alphabétique.

Détail du point 4, la vue filtrée :
- zone de contexte inchangée, seule l'icône change ;
- liste et points des cartes de jour réduits aux routines choisies ;
- un jour sans créneau de ces routines n'apparaît pas ; une semaine vide affiche l'état vide existant ;
- le filtre reste actif en changeant de semaine ou de mois, avec « Aujourd'hui », et tant qu'il n'est pas retiré.

## PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE** (vérifié) :
  - carte de l'Agenda et ses trois zones, états et couleurs : `RoutineAgendaCard` non modifiée ;
  - règles de figement, de modification et de suppression : service inchangé hors de la nouvelle lecture `routineFilterChoices` ; test de suppression en vue filtrée ;
  - navigation hors filtre : tests existants verts ;
  - filtre multicritère du Journal et des catalogues : réutilisé sans modification (`requestFilterSheet`, `FilterCommand`, `isJournalRoutineVisible`).
- **CHANGE** :
  - zone de contexte de l'Agenda (entonnoir, vue filtrée) ;
  - nouvelle modale ;
  - variante « sélection » de la carte du Journal ;
  - nouvelle case à cocher partagée.
- **FORBIDDEN** (respecté) :
  - l'icône à trois traits du filtre multicritère n'est pas réutilisée : nouvelle icône entonnoir ;
  - aucune zone d'action ajoutée à la carte de l'Agenda ;
  - aucune primitive native remplacée : feuille native iOS comme « Catalogue des séances » ;
  - aucune règle promue (voir « Hypothèses »).

## Points À CLARIFIER et choix techniques (non érigés en règle)

1. **Repris de D-539**, retenus par Claude et inscrits comme tels dans D-539 :
   - liste des routines (au moins un créneau, archivées comprises, ordre alphabétique) ;
   - libellé « Afficher toutes les routines » ;
   - durée du filtre.
2. **Durée du filtre** : il est gardé **en mémoire pour la session de l'application** (module `agendaRoutineFilter`). Il survit au passage par le Journal mais pas à une fermeture complète de l'application. Ce choix technique est à confirmer.
3. **« jusqu'au »** dans la ligne 3 : dernière date que la routine peut produire (`routineLastDate`), comme dans la maquette (« 0 à venir, jusqu'au 30/11/2026 »). « X à venir » compte les créneaux dont l'heure n'est pas passée. Interprétation technique.
4. **Teinte des cartes de la modale** : lilas `#EAEAFF` / `#B0B0F2` de la maquette, pour toutes les routines, au lieu du bleu ou gris du Journal.
5. **Case à cocher** : aucun composant n'existait dans le code. `CheckBox` reprend `DSF / Controls / Case à cocher` (20, rayon 6, cochée primaire avec « ✓ », non cochée bord `#C8C8D0`).
6. **Routine archivée dans la modale** : les filtres de séances s'appliquent à elle comme à une routine non archivée. Sans cela, elle n'apparaîtrait qu'avec le statut « Archivées ».

## Modifications réalisées

- **Agenda** :
  - `CalendarWeekScreen.tsx` : entonnoir dans l'emplacement préparé par le lot 1, état du filtre, filtrage des cartes et des points, ouverture de la modale par le relais ;
  - `agendaRoutineFilter.ts` (nouveau) : filtre en mémoire pour la session.
- **Modale** :
  - `RoutineFilterSheet.tsx` (nouveau) : composée des éléments standard `SheetFixedTop`, `ContextBand`, `FixedHeader`, `CatalogueSearchField`, `FilterCommand`, `CommandCircle`, `JournalRoutineCard`, `PrimaryActionZone` et `PrimaryActionButton` ;
  - `app/agenda-routine-filter.tsx` (nouveau) et `app/_layout.tsx` : feuille native.
- **Composants** :
  - `JournalRoutineCard.tsx` : option `selection` (carte réduite cochable) ;
  - `src/shared/ui/CheckBox.tsx` (nouveau).
- **Service et textes** :
  - `PlanningService.routineFilterChoices` ;
  - `planningSheetRelay.ts` (demande `routineFilter`) ;
  - `planningStrings.routineFilter`.
- **Icônes** : `assets/icons/icon-filtre-routine.svg` et `icon-filtre-routine-actif.svg` (tracé Figma recentré dans 24 × 24), entrées au manifeste.
- **Documentation** : annotation datée en fin du DSF Agenda de cette branche.

## Tests

- **Ajoutés** :
  - `RoutineFilterSheet.test.tsx` (3 tests) : libellés au pluriel, au singulier et sans sélection ; ligne 3 ; cartes réduites ; routine archivée ; sélection multiple ; ✕ ; cases cochées à la réouverture ; recherche ; ouverture des filtres ;
  - `CalendarWeekScreen.integration` (2 tests) :
    - icône contour puis pleine ; liste et points filtrés ;
    - filtre conservé au changement de semaine, de mois et avec « Aujourd'hui » ; retrait sans sélection ;
    - semaine vide ; suppression d'un créneau en vue filtrée (D-537) ;
  - `occurrenceModification.test.ts` (1 test) : routines proposées (au moins un créneau, archivée comprise, ordre alphabétique, créneaux à venir).
- **Résultats** :
  - `npx tsc --noEmit` : aucune erreur ;
  - `eslint` sur les fichiers modifiés : aucune erreur ;
  - `npx jest -w 2` : **412 groupes de tests réussis sur 412, 6 283 tests réussis, 32 ignorés**.
- **À vérifier sur iPhone** :
  - zone de tap de 34 × 34 et lisibilité de l'icône pleine ;
  - modale avec beaucoup de routines (défilement, bouton fixe en bas) ;
  - routine archivée dans la liste ;
  - en-tête posé sur la zone de contexte.

## Synchronisation code / documentation

- **Classe A** : le code rejoint D-539.
- **Classe C** pour les choix retenus par Claude, déjà signalés dans D-539 et non promus.
- D-539 et le DSF Agenda § 9 sont sur la branche documentaire non fusionnée ; aucune correction n'y est préparée.

## Fichiers modifiés

- `src/features/planning/CalendarWeekScreen.tsx`
- `src/features/planning/agendaRoutineFilter.ts` (nouveau)
- `src/features/planning/RoutineFilterSheet.tsx` (nouveau)
- `src/features/planning/JournalRoutineCard.tsx`
- `src/features/planning/PlanningService.ts`
- `src/features/planning/planningSheetRelay.ts`
- `src/features/planning/planningStrings.ts`
- `src/shared/ui/CheckBox.tsx` (nouveau)
- `app/agenda-routine-filter.tsx` (nouveau)
- `app/_layout.tsx`
- `assets/icons/icon-filtre-routine.svg` et `icon-filtre-routine-actif.svg` (nouveaux)
- `assets/icons/manifest.json`
- tests :
  - `src/features/planning/__tests__/RoutineFilterSheet.test.tsx` (nouveau) ;
  - `CalendarWeekScreen.integration.test.tsx` ;
  - `occurrenceModification.test.ts`.
- `docs/DSF-AGENDA-PLANNING-2026-11-19.md`
- ce rapport

## Commit final et état Git

- **Commit** : celui qui contient ce rapport.
- **État Git** : propre après commit ; branche ni envoyée sur GitHub ni fusionnée.
