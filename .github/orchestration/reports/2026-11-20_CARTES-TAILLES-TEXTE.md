# 2026-11-20 — Tailles de texte des cartes du calendrier et de la planification

## Identifiant et objectif

- **Mission** : CARTES-TAILLES-TEXTE.
- **Objectif** : aligner les tailles de texte des cartes du calendrier et de la planification sur celles des cartes des catalogues (séances, mouvements). Aucun autre changement.
- **Règle** : décision de Hermann du 20/11/2026, rendu uniquement (DSF Agenda § 5).
- **Synchronisation** : classe A.
- **Branche** : `planification/ce-ui-12-20261118`.
- **Commit de départ** : `b8c2b940`.

## Constats

- **Jetons déjà utilisés par les cartes des catalogues**, réutilisés tels quels (aucun jeton créé) :
  - **Card name** : `type.listCardTitle`, Inter Semi Bold 15. C'est le titre de la carte de séance (`SessionCard`, `DSF / Cards / Séance`). Le titre de la carte de mouvement utilise `type.compactCardTitle`, de même valeur.
  - **Card metadata** : `type.supporting`, Inter Regular 12. Ce sont les métadonnées de la carte de séance (`SessionCard.meta`).
- **Cartes concernées et tailles écrites en dur** :
  - `RoutineAgendaCard`, cartes de l'Agenda dans tous leurs états (Semaine, déployée, actions glissées) : nom 16, lignes 13 ;
  - `JournalRoutineCard`, cartes du Journal **et** cartes « Choix de la routine » de la modale du filtre par routine (même composant) : nom 16, lignes 13 ;
  - « Choisir une séance » (`PlanningSelection`) : la carte de séance du catalogue (`SessionCard`) est déjà en 15 / 12, donc rien à changer.

## Modifications réalisées

- **Nom de la routine** : `...type.listCardTitle` au lieu de 16 Semi Bold écrit en dur.
- **Lignes sous le nom** (`secondary`) : `...type.supporting` au lieu de 13 Regular écrit en dur. Cela couvre spécialité, zones corporelles, point séparateur, durée, année, ligne des créneaux et ligne « X à venir ».
- **Interligne** : `lineHeight: undefined`, comme la carte de séance. La ligne suit la taille de la police, sans interligne fixe nouveau, pour ne pas changer la hauteur des cartes.

## PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE**, démontré par le diff (`git diff b8c2b940` : 2 fichiers, styles `name` et `secondary` seulement, plus l'import de `type`) :
  - heure « 8h00 » (`RoutineAgendaCard.time`) et date « 12 nov. » (`JournalRoutineCard.date`) : 15 Semi Bold, inchangées ;
  - couleurs : `colors.textPrimary` et `colors.textSecondary`, inchangées ;
  - espacements, hauteurs, positions, zones tactiles, états, comportements : aucun autre style ni aucune autre propriété modifiés ;
  - étiquettes et boutons « Terminée », « Rattraper », « Démarrer » (`startLabel`, `tagLabel`) : inchangés ;
  - cartes des catalogues : aucun fichier des catalogues touché.
- **CHANGE** : nom (16 → 15 Semi Bold) et lignes dessous (13 → 12 Regular) des deux cartes.
- **FORBIDDEN** (respecté) :
  - aucun composant natif ni aucune primitive modifiés ;
  - aucun jeton modifié ;
  - aucun test réécrit.

## Tests

- **Assertions concernées** : aucune assertion ni aucun snapshot ne contenait les anciennes tailles (recherche dans `src/features/planning/__tests__`). Aucun test modifié.
- **Suite complète** (`npx jest -w 2`) : **412 groupes de tests réussis sur 412, 6 283 tests réussis, 32 ignorés**.
- `npx tsc --noEmit` et `eslint` sur les fichiers modifiés : aucune erreur.
- **À vérifier sur iPhone par Hermann** : alignement vertical des lignes avec les icônes (chronomètre, chevron, zones corporelles).

## Point laissé hors périmètre

Le nom des séances dans la partie dépliée sous la carte de l'Agenda et du Journal (14 Semi Bold) n'est pas une ligne de la carte. Il n'est pas modifié.

## Fichiers modifiés

- `src/features/planning/RoutineAgendaCard.tsx`
- `src/features/planning/JournalRoutineCard.tsx`
- ce rapport

## Commit final et état Git

- **Commit** : celui qui contient ce rapport.
- **État Git** : propre après commit ; branche ni envoyée sur GitHub ni fusionnée.
