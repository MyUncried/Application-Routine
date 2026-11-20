# 2026-11-20 — Cycle de vie d'une routine : créneau expiré, routines actives et terminées (D-540)

## Identifiant et objectif

- **Mission** : CYCLE-VIE-ROUTINE.
- **Objectif** : appliquer `docs/PROMPT-CLAUDE-CODE-CYCLE-VIE-ROUTINE-2026-11-20.md` (D-540).
- **Sources lues sans fusion**, sur `docs/planification-grille-creneaux` à sa tête `171f9ca3` :
  - le prompt ;
  - D-540 (ch07) ;
  - DSF Agenda § 10 ;
  - DSF Journal § 2 et § 6.
- **Décisions de Hermann du 20/11/2026** :
  - un créneau manqué reste rattrapable jusqu'au créneau suivant de la routine ; le dernier, 10 jours ;
  - ensuite il est « expiré » ;
  - l'action « Archiver » disparaît, « Supprimer » reste ;
  - le filtre du Journal propose « Terminées » ;
  - routine active ou terminée : état calculé, liste par défaut = routines actives, compteurs « Actives · Terminées ».
- **Branche** : `planification/ce-ui-12-20261118`.
- **Commit de départ** : `acceacaa`.

## Périmètre traité

| Point du prompt | Traité |
|---|---|
| 1. Créneau rattrapable | Oui : jusqu'au début du créneau suivant de la routine (non retiré), commencé ou non ; le dernier, jusqu'à la fin du 10ᵉ jour après sa date |
| 2. Créneau expiré | Oui : cadre rouge, étiquette « Expirée » (76 × 24, fond `#FCE6E6`, texte `#B33838`) à la place de « Rattraper », ni « Démarrer » ni « Rattraper » ; conservé dans l'Agenda passé ; ni modifié ni compté par une modification de la routine ; supprimé avec la routine ; règle recalculée quand le créneau suivant est retiré |
| 3. Routine active / terminée | Oui : au moins un créneau à venir ou rattrapable ; prolonger la date de fin la réactive |
| 4. Journal | Oui : liste par défaut = actives ; statut « Terminées » du filtre ; compteurs « Actives · Terminées » |
| 5. Plus d'archivage | Oui : avec un créneau commencé, les créneaux non commencés (expirés compris) sont **retirés** et la routine devient terminée ; message « N créneaux non commencés seront supprimés. La routine sera terminée. ». Sans créneau commencé : suppression complète, inchangée |
| 5. Action glissée « Archiver » | Constat : elle n'a jamais existé dans le code ; le Journal ne proposait que « Dupliquer » et « Supprimer ». Rien à retirer |
| 6. Filtre par routine de l'Agenda | Oui : les routines terminées restent proposées |

## Choix techniques et interprétations (à confirmer)

1. **« 10 jours après sa date »** : rattrapable jusqu'à minuit à la fin du 10ᵉ jour. Exemple : un créneau du 5 expire le 16 à 0 h.
2. **« Créneau suivant »** : le suivant dans l'ordre chronologique des créneaux de la routine, avec leurs dates effectives (un créneau déplacé compte à sa nouvelle date), retirés exclus.
3. **Créneau expiré et modification de la routine** : à la modification depuis le Journal, il est enregistré en entier, non commencé (même mécanisme que le figement de D-536). Il garde ses séances, sa date et son heure.
4. **Fin de l'archivage** : le retrait des créneaux non commencés passe par des retraits réels (`exclusions`), comme la suppression d'un créneau de l'Agenda. C'est ce qui permet à une prolongation de réactiver la routine.
   - La colonne `routines.archived_at` (migration 034) reste en base mais n'est plus ni écrite ni lue.
   - Une routine archivée lors de la recette précédente réapparaît avec tous ses créneaux. Les données de l'iPhone sont jetables.
5. **Feuille des filtres partagée** : ouverte depuis le Journal, elle affiche « Actives » / « Terminées » (option `statusLabels`). Les séances, avec « Actives » / « Archivées », ne changent pas.
   - Au Journal, le statut porte sur la routine ; les autres critères portent sur les séances de la routine, quel que soit leur statut.
6. **Modification d'un créneau expiré seul depuis l'Agenda** : non traitée par D-540 ; elle reste possible comme pour un créneau non commencé. À clarifier.

## PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE** :
  - figement D-536 : aucun test existant modifié sur ce point, hors l'ajout du créneau expiré conservé ;
  - suppression d'un créneau D-537 (1)(2) : inchangée, tests verts ;
  - historique des exécutions ;
  - carte de routine (hors étiquette « Expirée ») ;
  - statut « Archivées » des séances : la feuille partagée garde ses libellés par défaut, et aucun fichier des séances ne change hors de cette option ;
  - critères multiples du Journal (catégories, zones, étiquettes, formats) ;
  - reste de l'Agenda.
- **CHANGE** :
  - calcul de l'état des créneaux (`withExpiry`) et des routines (`isRoutineActiveAt`) ;
  - liste par défaut et statut du filtre du Journal ;
  - message de suppression ;
  - étiquette « Expirée ».
- **FORBIDDEN** (respecté) :
  - aucun état enregistré en base : rattrapable, expiré, actif et terminé sont calculés à l'affichage ;
  - aucun réglage ajouté (constante `LAST_SLOT_CATCH_UP_DAYS = 10`) ;
  - séances archivées non touchées ;
  - aucune règle promue (interprétations listées ci-dessus).

## Modifications réalisées

- **Domaine** :
  - `occurrences.ts` : champ `expired`, `withExpiry`, `LAST_SLOT_CATCH_UP_DAYS`, `isRoutineActiveAt` ; plus de filtrage des routines archivées ;
  - `Routine.ts` : `archivedAt` marqué obsolète.
- **Service** (`PlanningService.ts`) :
  - créneaux expirés figés à la modification de la routine ;
  - `pendingSlotCount` sans les créneaux expirés ;
  - `routineActivity` ;
  - suppression avec historique par retraits ;
  - `rangeOccurrences` avec l'état expiré.
- **Agenda** :
  - `RoutineAgendaCard.tsx` : état `EXPIRED` ;
  - `CalendarWeekScreen.tsx` : état du créneau.
- **Journal** :
  - `journal.ts` : `isRoutineActive`, `journalCounts`, `isJournalRoutineVisible`, `matchesRoutineSessionFilters` ;
  - `JournalScreen.tsx` : état actif chargé, liste, compteurs, libellés du filtre ;
  - `RoutineFilterSheet.tsx` : routines terminées proposées, statut ignoré.
- **Feuille des filtres** : `filterSheetRelay.ts`, `FilterSheetRoute.tsx`, `SessionFilterSheet.tsx` (option `statusLabels`).
- **Textes** (`planningStrings.ts`) : « Actives », « Expirée », message de suppression.
- **Documentation** : DSF Agenda et DSF Journal de cette branche annotés.

## Tests

- **Ajoutés** :
  - service (`occurrenceModification.test.ts`) :
    - rattrapable jusqu'au créneau suivant, exécuté ou non, puis expiré ;
    - règle recalculée quand le créneau suivant est retiré ;
    - dernier créneau expiré après 10 jours ;
    - routine active puis terminée ;
    - prolongation qui réactive ;
    - créneau expiré ni modifié ni compté ;
  - Journal (`journal.test.ts`) : définition active / terminée, filtre « Actives » / « Terminées » ;
  - Journal, écran : liste par défaut sans routine terminée, compteurs « Actives », libellés « Terminées » de la feuille des filtres, suppression d'une routine terminée via ce filtre ;
  - Agenda : créneau expiré (cadre rouge, « Expirée », sans bouton).
- **Ajustés**, parce que la règle a changé :
  - suppression avec historique : plus d'`archivedAt`, nouveau message ;
  - compteurs « Actives » ;
  - créneau expiré conservé quand la récurrence change ;
  - routine terminée de la modale du filtre.
- **Exécutés** :
  - `npx jest -w 3 src/features/planning src/domain/planning` : **150 tests réussis sur 150** ;
  - `npx tsc --noEmit` : aucune erreur ;
  - `eslint` sur les fichiers modifiés : aucune erreur.
- **Suite complète** : lancée, puis **arrêtée par Claude Code faute de mémoire sur le poste**, en même temps que Metro. Elle n'est pas relancée sans accord de Hermann. Résultat de la suite complète : **non disponible**.
  - Elle couvre en plus les séances, les activités et la feuille des filtres partagée, dont les libellés par défaut sont inchangés.
- **À vérifier sur iPhone** :
  - lisibilité de l'étiquette « Expirée » sur le cadre rouge ;
  - bascule d'un créneau à minuit ;
  - liste du Journal après une suppression.

## Remarque de recette

Pendant le travail, les rechargements à chaud de Metro ont envoyé à l'iPhone des versions intermédiaires des fichiers. Cela a produit des messages « Console Error » : fonction absente, puis base de données fermée (« Access to closed resource »). Ces erreurs viennent de l'environnement de développement. Un « Reload JS » après le commit les fait disparaître.

## Synchronisation

- **Classe A** : le code rejoint D-540.
- DSF Agenda et DSF Journal de cette branche annotés.
- D-540 est sur la branche documentaire non fusionnée ; aucune correction n'y est préparée.

## Commit final et état Git

- **Commit** : celui qui contient ce rapport.
- **État Git** : propre après commit ; branche ni envoyée sur GitHub ni fusionnée.
