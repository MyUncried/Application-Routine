# 2026-11-20 — Agenda : affichage retardé, message « semaine vide » parasite, barre de navigation saccadée

## Identifiant et objectif

- **Mission** : AGENDA-PERFORMANCE.
- **Constat de Hermann** : « Quand j'affiche l'agenda, la liste apparaît avec un temps de décalage. Elle affiche d'abord "Aucune séance planifiée cette semaine", puis affiche la liste. La performance n'est pas top pour les quelques données de test qu'on a. La barre de navigation est saccadée (déplacement du cadre) ».
- **Branche** : `planification/ce-ui-12-20261118`.
- **Commit de départ** : `fbfcfadc`.

## Diagnostic (mesures)

1. **Calcul des créneaux**
   - **Mesure** : banc d'essai temporaire, non committé, sous Jest/Node, avec 12 routines de test (10 routines hebdomadaires d'un an, 1 routine quotidienne de 520 jours, 1 routine hebdomadaire de 520 semaines), soit 2 610 créneaux : **595 ms**.
   - **Cause** : la génération parcourait chaque jour de la vie de chaque routine. Chaque jour, elle faisait plusieurs conversions de dates sur des chaînes (`addDays`, `mondayOf`, `daysBetween`, `weekdayOf`).
   - **Effet** : la mesure est sur ordinateur ; sur l'iPhone, c'est vraisemblablement plus lent. Le fil JavaScript est occupé pendant ce temps, ce qui retarde la liste et l'animation de la barre.
2. **Lectures en double** : chaque chargement de l'Agenda lisait les routines et les Exécutions liées deux fois. Une première lecture se faisait directement depuis l'écran, une seconde depuis `rangeOccurrences`.
3. **Message parasite** : « Aucune séance planifiée cette semaine » s'affichait dès que la semaine n'avait aucun créneau en mémoire, donc aussi **avant la fin du chargement**, ou juste après un changement de semaine.
4. **Barre de navigation** : le cadre actif glissait par une animation de `left` **sans le pilote natif**. Il dépendait donc du fil JavaScript, occupé par l'écran qui s'ouvre.

## Modifications réalisées

- **`occurrences.ts`** : génération des seuls jours produits, en jours numériques (`producedDates`, `dayNumber`, `fromDayNumber`).
  - Mêmes règles : semaine d'ancrage, multiplicateur, jours, bornes « jusqu'au » et « pendant », unité jour.
  - Même rang des créneaux, même résultat.
  - **Mesure après correction** : **59 à 75 ms** pour les mêmes 2 610 créneaux, soit environ 8 à 10 fois plus rapide.
- **`PlanningService.agendaData`** : routines, créneaux et Exécutions en une seule lecture. `rangeOccurrences` réutilise le même calcul (`inRange`).
- **`CalendarWeekScreen.tsx`** :
  - un seul appel de chargement ;
  - le message « semaine vide » n'apparaît qu'une fois chargée la fenêtre affichée (`loadedStart`).
- **`app/(tabs)/_layout.tsx`** : le cadre actif glisse par translation (`translateX`, `useNativeDriver: true`), avec le même trajet et la même durée (250 ms).

## Classe de synchronisation

- **Classe D (technique)** : performance, lectures, animation. Le résultat, le trajet et la durée sont inchangés.
- **Classe A** : le message parasite était une anomalie. Le message reste réservé à une semaine réellement vide.
- Aucun document fonctionnel à modifier.

## PRESERVE

- **Créneaux identiques** : toute la suite de la planification et du domaine est verte. Elle compte 161 tests : unités semaine et jour, bornes, rotation, retraits, enregistrements D-536, expiration D-540.
- **Barre de navigation** : même cadre (66 × 50, centré dans l'emplacement mesuré), même durée, jamais masqué. Les tests de la barre sont verts.
- **Agenda** : liste continue, carrousel, filtre par routine, états des créneaux : tests verts.

## Tests

- **Ajoutés** :
  - Agenda : pas de message « semaine vide » tant que la semaine n'est pas chargée ;
  - barre de navigation : cadre en translation, `left: 0`, centré dans l'emplacement mesuré.
- **Exécutés** : `npx jest -w 2` sur `src/features/planning`, `src/domain/planning`, `TabsLayoutSearch` : **161 tests réussis sur 161**. Puis `app/__tests__` et `src/shared/ui` : **187 tests réussis sur 187**.
- `tsc` et `eslint` sur les fichiers modifiés : aucune erreur.
- **Suite complète** : non relancée. La précédente a été arrêtée faute de mémoire, et sa relance attend l'accord de Hermann.
- **À vérifier sur iPhone** : délai d'apparition de la liste, absence du message parasite, fluidité du cadre de la barre de navigation.

## Fichiers modifiés

- `src/domain/planning/occurrences.ts`
- `src/features/planning/PlanningService.ts`
- `src/features/planning/CalendarWeekScreen.tsx`
- `app/(tabs)/_layout.tsx`
- tests : `src/features/planning/__tests__/CalendarWeekScreen.integration.test.tsx`, `src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx`
- ce rapport

## Commit final et état Git

- **Commit** : celui qui contient ce rapport.
- **État Git** : propre après commit ; branche ni envoyée sur GitHub ni fusionnée.
