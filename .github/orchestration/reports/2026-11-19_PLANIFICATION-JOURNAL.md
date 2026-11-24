# 2026-11-19 — Calendrier : Journal des routines (D-535)

## Identification et objectif

- **Mission** : développer l'onglet Journal du calendrier (D-535), à partir du prompt de Hermann du 19/11/2026.
- **Sources** :
  - `docs/DSF-JOURNAL-2026-11-19.md`, qui fait foi pour le rendu ;
  - DSF Agenda § 5 et § 7 ; DSF Barre de titre à onglets ;
  - chapitres 07 et 13 de la branche `docs/planification-grille-creneaux` ;
  - Figma « Calendrier — Journal — MVP » (`1992:5510`, ancien écran Jour renommé).
- **Branche** : `planification/ce-ui-12-20261118`, dossier `C:\Dev\KODJO-PLANIF-CE12`. Aucune fusion.
- **Commit de départ** : `3c645e45`.
- La fin du prompt était tronquée (« Liv… ») ; j'ai appliqué la livraison habituelle : rapport, commit, état Git, tests.

## Périmètre demandé et traité

| Point du prompt | Réalisation |
|---|---|
| Journal à la place de la vue Jour, onglet actif | `JournalScreen`. La barre à onglets sort de l'Agenda (`CalendarViewTabs`, valeur et changement de vue) ; la route `app/(tabs)/calendar.tsx` bascule entre Journal et Agenda. L'Agenda reste la vue par défaut et la vue choisie est conservée tant que l'onglet est monté. |
| Zone de contexte | Composant partagé des Catalogues `CatalogueContextZone`. Ligne 1 : « Actives N · Terminées N ». Ligne 2 : Rechercher, Filtre (`FilterCommand`), Tri (commande partagée, présente et inactive comme dans les Catalogues), Planifier. Aucune navigation par date. |
| Liste | Cartes espacées de 8, sans séparateur, sans date de regroupement, sans Démarrer, Terminer ni glissement. |
| Carte | `JournalRoutineCard`, de la famille de la carte d'Agenda, 72 de haut. Teinte #EAEAFF, bande à 18 %, repères #B0B0F2 (Figma). Cadre : date de création (« 12 nov. » et « 2026 »). Ligne 1 : chevron et nom. Ligne 2 : zones. Ligne 3 : récurrence (« Chaque lundi et jeudi · jusqu'au 28 déc. », « Tous les jours · jusqu'au 30 nov. », « Une seule fois · le 18 nov. »). À droite : `EditSquareButton`. |
| Bouton d'édition carré | Nouveau composant partagé `shared/ui/EditSquareButton` : 32 × 32, fond #F3F4F9, coins 10, crayon `icon/modifier` déjà présent (`KodjoIcon` « edit-movement », même tracé que le Figma), cible tactile 44. |
| Comportement | Toucher la carte (chevron compris) la déploie : filet, puis composition de chaque séance (`SessionCompositionTree`, comme l'Agenda). Le crayon ouvre la routine (`/planning?routineId=`). |
| Tri, recherche, filtres | Tri par date de création ou de modification (`updatedAt`, à défaut `createdAt`), la plus récente en haut. Recherche sur le nom de la routine, de ses séances et de leurs exercices (règle du Catalogue). Filtres : feuille du Catalogue des séances réutilisée ; une routine est retenue si l'une de ses séances l'est. |
| Compteurs | « Active » : au moins une occurrence aujourd'hui ou à venir (moteur `periodOccurrences`, retraits compris). « Terminée » : plus aucune. |
| Données | Lecture seule (`listRoutines`) ; les champs `createdAt` et `updatedAt` existent déjà. Aucune modification du domaine ni de la persistance. |

## Liste PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE** :
  - moteurs de planification et d'occurrences, formulaire de planification, écran d'exécution, navigation du bas et routes : aucun fichier modifié ;
  - vue Agenda : seul changement, la barre à onglets est importée de `CalendarViewTabs` avec un rappel de changement de vue ; rendu inchangé ;
  - tests existants : verts, un seul ajusté (voir FORBIDDEN).
- **CHANGE** : écran Journal ; son entrée dans la barre à onglets ; composant de bouton d'édition carré.
- **FORBIDDEN, respecté** :
  - aucune réécriture massive : une seule assertion de l'Agenda est adaptée (« Journal indisponible » devient « Journal disponible », D-535) ;
  - aucune primitive native changée ;
  - ni modèle ni persistance touchés ;
  - aucune retouche de l'Agenda.

## Points non tranchés et constats

1. **Spécialité** : la propriété n'existe pas dans le modèle ; seules les zones corporelles sont affichées.
2. **Écran de filtre du Journal** : il n'est pas dessiné. La feuille des filtres du Catalogue des séances est réutilisée telle quelle : sections Statut, Catégories, Zones, Étiquettes et Format. « Spécialité » et « programme » n'y figurent pas, faute de propriété.
3. **Tri** : le DSF ne définit aucun autre ordre que l'ordre par défaut. Le contrôle Tri reste celui des Catalogues : présent et inactif.
4. **« Sans date de fin »** : toute routine enregistrée par l'application a une borne (« jusqu'au » ou « pendant »). Ce cas ne peut pas se produire aujourd'hui.
5. **Composant d'édition** : la description du composant Figma dit 40 × 32, alors que le DSF et l'écran donnent 32 × 32. J'ai retenu 32 × 32.
6. **DSF Agenda modifié le 19/11 (actions glissées 86 × 54, écart de 8)** : non appliqué, puisque toute retouche de l'Agenda est interdite par cette mission. Reste à faire dans une mission Agenda.
7. **Routine sans nom** (antérieure au 18/11) : le titre de la carte reprend le nom de ses séances, comme dans l'Agenda.

## Tests

- Nouveaux tests :
  - `journal.test.ts` : compteurs, borne « pendant », retraits, tri, date de création, ligne de récurrence, filtres ;
  - `JournalScreen.integration.test.tsx` (SQLite réelle) :
    - une carte par routine (une routine à deux séances donne une carte) ;
    - ordre par défaut, y compris après une modification ;
    - compteurs ;
    - déployé ;
    - le crayon ouvre la routine ;
    - recherche sans casse ni accents ;
    - filtre, tri inactif, Planifier ;
    - onglet Agenda.
- `npx jest src/features/planning app/__tests__` : 16 suites, 97 tests réussis.
- `tsc` propre ; `eslint` sans erreur sur les fichiers touchés.
- Suite complète non relancée (mémoire du poste).

## Vérifications sur iPhone

- Onglets Journal ↔ Agenda.
- Bande : compteurs, champ, filtre, tri, Planifier.
- Cartes : 72 de haut, cadre et bande jusqu'aux bords, crayon à droite, trois lignes avec un texte agrandi.
- Déploiement d'une routine à plusieurs séances.
- Le crayon ouvre la modification.
- Feuille de filtres depuis le Journal.

## Synchronisation code / documentation

- Classe A : le code rejoint D-535 (DSF Journal).
- Documentation de la branche documentaire reprise par `cherry-pick -x` :
  - suppression des écrans Jour, Mois et Semaine redondants ;
  - D-535 et DSF Journal ;
  - déployé du Journal ;
  - prompt.
- Aucun autre document modifié.

## Fichiers modifiés (code)

`app/(tabs)/calendar.tsx`, `src/features/planning/{CalendarViewTabs,JournalScreen,JournalRoutineCard,CalendarWeekScreen}.tsx`, `src/features/planning/{journal,planningStrings}.ts`, `src/shared/ui/EditSquareButton.tsx`, tests associés.

## Commits et état Git

- Code : `0fab1d1b`.
- Documentation reprise : 8 commits `cherry-pick -x`.
- Ce rapport : commit final de la mission.
- Branche non poussée, non fusionnée.
