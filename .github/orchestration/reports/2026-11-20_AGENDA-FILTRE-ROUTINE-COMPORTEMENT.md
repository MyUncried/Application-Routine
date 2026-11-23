# 2026-11-20 — Filtre par routine : comportement (D-539 mis à jour) et alignement des cartes de la modale

## Identifiant et objectif

- **Mission** : AGENDA-FILTRE-ROUTINE-COMPORTEMENT.
- **Branche** : `planification/ce-ui-12-20261118`.
- **Commit de départ** : `e1410546`.
- **Demande de Hermann**, en deux parties :
  - **A.** Modale du filtre : « l'espace entre les deux première lignes est trop important : Aligner verticalement le nom de la routine avec la date ; Aligner verticalement la ligne du nombre de créneaux avec l'année ».
  - **B.** Comportement du filtre (D-539 mis à jour le 20/11/2026), d'après :
    - `docs/PROMPT-CLAUDE-CODE-AGENDA-FILTRE-ROUTINE-2026-11-20.md` ;
    - `docs/DSF-AGENDA-PLANNING-2026-11-19.md`, § 9.

    Les deux documents sont lus sur `docs/planification-grille-creneaux` à sa tête `8ecd17fc`, sans fusion.

## Périmètre traité

| Point | Traité |
|---|---|
| A. Nom aligné sur la date, ligne des créneaux sur l'année | Oui : les deux colonnes de la carte réduite ont le même écart (2) et les mêmes hauteurs de ligne (18 pour la date et le nom, 15 pour l'année et les créneaux) |
| B1. Toucher l'entonnoir sans filtre ouvre la modale | Inchangé |
| B2. Toucher l'icône bleue désactive le filtre sans ouvrir la modale | Oui |
| B3. Modale toujours sans routine cochée | Oui : précoche supprimée, le champ `initial` est retiré de la demande et de la modale |
| B4. « Filtrer N routines » / « Filtrer 1 routine », désactivé sans sélection ; « Afficher toutes les routines » supprimé | Oui : `PrimaryActionButton` en état `disabled` |

## PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE** (diff limité à 8 fichiers, vérifié) :
  - vue filtrée (filtrage de la liste et des points) : code inchangé ; test « vue filtrée » vert ;
  - icône contour / pleine bleue : inchangée ;
  - liste des routines (`routineFilterChoices`) : inchangée ;
  - persistance du filtre au changement de semaine, de mois et avec « Aujourd'hui » : inchangée et toujours testée ;
  - tout le reste de l'Agenda : la seule modification de `CalendarWeekScreen` est le `onPress` de l'icône et son libellé d'accessibilité.
  - **cartes de la modale** : contenu, cadre, case à cocher et teintes inchangés. Seul l'alignement de la partie A change, et il ne concerne que la variante « sélection » de `JournalRoutineCard`. La carte du Journal est inchangée.
- **CHANGE** :
  - `onPress` de l'icône ;
  - état initial de la modale ;
  - état et libellé du bouton ;
  - alignement des deux lignes des cartes de la modale.
- **FORBIDDEN** (respecté) : aucun écran ni état ajouté ; aucune primitive native remplacée.

## Hypothèses

1. **Libellé du bouton désactivé** : la formule « Filtrer N routines » est appliquée telle quelle, d'où « Filtrer 0 routines ». À confirmer.
2. **Accessibilité** : l'icône bleue s'annonce « Désactiver le filtre par routine ».
3. **Alignement (A)** : écart de 2 et hauteurs de ligne de 18 et 15 dans les deux colonnes ; valeurs techniques.

## Tests

- **Ajustés** :
  - `RoutineFilterSheet.test` : libellé « Afficher toutes les routines » retiré ; la réouverture avec cases cochées devient une ouverture sans case cochée ;
  - `CalendarWeekScreen.integration` : relais sans `initial` ; pour changer de filtre, désactivation puis réouverture.
- **Ajoutés** :
  - toucher l'icône bleue désactive le filtre sans ouvrir la modale (aucune navigation, aucune demande au relais) ;
  - modale vide à l'ouverture ;
  - bouton désactivé sans sélection, sans effet quand on le touche, puis actif après une sélection.
- **Résultats** :
  - `npx jest -w 2` : **412 groupes de tests réussis sur 412, 6 283 tests réussis, 32 ignorés** ;
  - `tsc` : aucune erreur ;
  - `eslint` sur `src/features/planning` : aucune erreur.
- **À vérifier sur iPhone** : alignement des deux lignes avec la date et l'année ; bouton désactivé ; toucher sur l'icône bleue.

## Synchronisation

- **Partie B, classe A** : le code rejoint D-539 mis à jour. Le DSF Agenda de cette branche est annoté.
- **Partie A, classe B** : registre ch07 et DSF Agenda annotés.

## Fichiers modifiés

- `src/features/planning/CalendarWeekScreen.tsx`
- `src/features/planning/RoutineFilterSheet.tsx`
- `src/features/planning/JournalRoutineCard.tsx`
- `src/features/planning/planningSheetRelay.ts`
- `src/features/planning/planningStrings.ts`
- `app/agenda-routine-filter.tsx`
- tests : `RoutineFilterSheet.test.tsx`, `CalendarWeekScreen.integration.test.tsx`
- documentation : registre ch07, `docs/DSF-AGENDA-PLANNING-2026-11-19.md`
- ce rapport

## Commit final et état Git

- **Commit** : celui qui contient ce rapport.
- **État Git** : propre après commit ; branche ni envoyée sur GitHub ni fusionnée.
