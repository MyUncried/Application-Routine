# 2026-11-20 — Contre-recette du 20/11 et missions D-536 (1 et 2) et D-537 (E)

## Identifiant et objectif

- **Mission** : RECETTE-2011-MISSIONS.
- **Demande de Hermann** : « Les tests sont réalisés, tu peux corriger les écarts et les évolutions. » ; « Qu'as-tu corrigé concernant la modification d'une occurrence dans l'agenda ? J'ai répondu aux questions qui concernent ce point. »
- **Objectif** :
  - appliquer la réponse à la question q21-modele, qui vaut validation du modèle ;
  - réaliser les missions 1 et 2 (D-536), puis la mission E (D-537) ;
  - corriger les écarts de la contre-recette (r21-*, constat A) ;
  - appliquer la demande faite en cours de route sur les zones tactiles de l'Agenda.
- **Branche** : `planification/ce-ui-12-20261118`, worktree `C:\Dev\KODJO-PLANIF-CE12`.
- **Commit de départ** : `cd94d4e2`.

## Sources

- **Cahier**, base de l'artefact `SbY2Ci9tcqVe3s9AiDBB84` :
  - q21-modele : KO, avec le modèle reformulé par Hermann ;
  - r21-j-carte, r21-j-deploye, r21-j-supprimer : KO ;
  - r21-supprimer : note ;
  - « Autres constats » A, B, E.
- **Branche `docs/planification-grille-creneaux`**, lue sans fusion, à sa tête `f0c116d3` :
  - `docs/PROMPT-CLAUDE-CODE-MODIFICATION-OCCURRENCES-2026-11-20.md` ;
  - `docs/PROMPT-CLAUDE-CODE-OCCURRENCE-SEULE-RECETTE-2026-11-20.md` ;
  - `docs/PROMPT-CLAUDE-CODE-SUPPRESSION-2026-11-20.md` ;
  - D-536 et D-537 (ch07).
- **Figma** : `DSF / Overlays / Confirmation`, variantes « Titre seul » `12759:24520` et « Titre et message » `12759:24619`.

## Périmètre demandé et traité

| Point | Traité |
|---|---|
| Modèle des occurrences (q21-modele) | Oui : migration 034 |
| Mission 1 : figement, protection par groupe, statut sur les séances actives, « Rattraper » | Oui |
| Mission 2 : modification d'une occurrence seule depuis l'Agenda | Oui |
| Mission 2 : cahier, cas B et C | Oui : cahier publié, pas dans le dépôt |
| Mission E : suppression (D-537) | Oui |
| Mission E : cahier, cas D | Oui |
| r21-j-carte : symbole du calendrier en ligne 3 | Oui |
| r21-j-deploye : ligne vierge et filet ; nom des séances toujours affiché | Oui |
| r21-j-supprimer : compte et suppression des seuls créneaux non exécutés ; titre nommé | Oui |
| r21-supprimer : « Supprimer ce créneau » | Oui |
| Constat A : liste figée pendant le glissement (Journal, Agenda) | Oui |
| Demande en cours de route : trois zones tactiles de la carte de l'Agenda | Oui |

## PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE** (vérifié) :
  - moteur et écrans d'exécution : aucun fichier de `src/features/execution` ni de `src/domain/execution` modifié ;
  - formulaire de planification en création et en modification : rendu et comportement inchangés hors des points ci-dessous ;
  - filtres du Journal : la feuille est inchangée ;
  - historique des exécutions : aucune exécution n'est supprimée, ni ses liens ;
  - tests existants : seuls ajustements, ceux qu'impose une règle changée (voir « Tests »).
- **CHANGE** :
  - occurrences ;
  - modification de la routine et d'une occurrence ;
  - états du bouton ;
  - dialogues de suppression et de modification ;
  - carte et déployé du Journal ;
  - zones tactiles de la carte de l'Agenda.
- **FORBIDDEN** (respecté) :
  - aucune primitive native remplacée : les dialogues étendent le composant partagé `DecisionDialog` ;
  - aucune réécriture massive de tests ;
  - le modèle a été modifié seulement après la validation q21-modele ;
  - aucune suppression d'une occurrence commencée.

## Modifications réalisées

### Modèle (migration 034) et domaine

- **Table `routine_occurrences`** : une ligne par occurrence modifiée à la main ou commencée.
  - Identité : la date et l'heure d'origine.
  - Groupes : date et heure, séances (en JSON : séance, entrée, origine ROUTINE ou ADDED, active), rappel.
  - `started_at` non NULL : l'occurrence est commencée et enregistrée en entier.
  - `occurrence_index` : rang dans la suite des créneaux.
- **Colonne `routines.archived_at`** (D-537).
- **`routineOccurrences`** :
  - les groupes enregistrés remplacent ceux de la routine ;
  - une occurrence enregistrée est rattachée à son jour d'origine ;
  - une occurrence commencée ou déplacée que la routine ne produit plus reste affichée ;
  - une routine archivée ne garde que ses occurrences commencées.
- **`Occurrence`** :
  - porte la date et l'heure effectives, les séances (désactivées comprises) et le rappel effectif ;
  - indique si elle est commencée (`started`) et quels groupes ont été modifiés à la main ;
  - `contents` ne contient que les séances actives : « Complétée » se calcule donc sur les seules séances actives.
- **Rappels** : délai, date et heure propres à chaque occurrence ; plus de rappel pour une occurrence commencée.

### Service (`PlanningService`)

- **Commencée** : l'occurrence a au moins une Exécution liée (lien écrit au lancement, migration 033).
- **Figement** : toute écriture sur la routine enregistre d'abord en entier ses occurrences commencées qui ne le sont pas encore. Cela vaut pour la modification depuis le Journal, la modification d'une occurrence et la suppression. Ces occurrences gardent ainsi la séquence de leur lancement, et le moteur d'exécution n'est pas touché.
- **Modification d'une occurrence** (`getOccurrence`, `updateOccurrence`) :
  - un groupe identique à la routine n'est pas enregistré ;
  - refusée pour une occurrence commencée ;
  - au moins une séance active est exigée.
- **Comptes** :
  - `pendingSlotCount` : créneaux non commencés, pour le message de modification ;
  - `deletionPlan` : historique présent ou non, et nombre de créneaux non commencés.
- **Suppression** :
  - `deleteRoutine` : sans historique, suppression ; avec historique, archivage, et suppression des occurrences non commencées ;
  - `excludeOccurrence` : refusée pour une occurrence commencée.

### Écrans

- **Agenda** :
  - le cadre ouvre la modification du seul créneau (`/planning?routineId&occurrenceKey`) ; rien pour une occurrence commencée ;
  - pas d'action Supprimer sur une occurrence commencée ;
  - dialogue « Supprimer ce créneau », avec « Annuler » en haut à gauche ;
  - « Rattraper » sur une occurrence passée non commencée ;
  - trois zones tactiles sur toute la hauteur : gauche ouvre le créneau, centre déplie, droite démarre ; à droite, rien quand la pastille est un statut ;
  - liste figée pendant le glissement.
- **Planifier, mode « créneau seul »** :
  - le nom de la routine n'est pas modifiable ;
  - la carte Répétition est absente ;
  - seule la colonne du créneau est colorée et modifiable ; les autres sont grisées ;
  - ni réordonnancement ni changement de cycle ;
  - « Changer » : les séances de la routine restent (on les désactive), les séances ajoutées s'ajoutent ou se retirent ;
  - la dernière pastille active ne peut pas être retirée ;
  - aucune fenêtre de choix.
- **Planifier, modification depuis le Journal** : confirmation « N créneaux à venir seront modifiés. ».
- **Journal** :
  - symbole du calendrier en ligne 3 ;
  - sans répétition : ni ligne vide ni premier filet ;
  - nom de chaque séance toujours affiché ;
  - dialogue de suppression : trois messages, ou le titre « La routine <nom> sera supprimée » ;
  - routine archivée visible avec le filtre « Archivées » seulement ;
  - liste figée pendant le glissement.
- **`DecisionDialog`** : option `cancelOnTop`, aux mesures Figma :
  - carte de 370, rayon de 18 ;
  - « Annuler » de 88 × 32 à 16 du bord ;
  - « Confirmer » sur toute la largeur, 48 de haut, rayon de 24 ;
  - écarts de 16, 8 et 16, marge basse de 24.
- **`SessionCompositionTree`** : option `divider` (filet en tête).

## Hypothèses et écarts à confirmer par Hermann

1. **Textes des messages** : le texte de Hermann est retenu ; la branche documentaire diffère.
   - Modification : Hermann écrit « N créneaux **à venir** seront modifiés. », D-536 sur la branche « non commencés ».
   - Archivage : Hermann écrit « N créneaux non commencés seront **supprimés** ; La routine sera archivée. », D-537 « seront modifiés ».
2. **Valeur de N** dans « à venir seront modifiés » : tous les créneaux non commencés, **passés compris**, comme le prévoit D-536, point 2.
3. **Titre du dialogue de modification** : « Modifier cette routine » (aucun texte n'était demandé).
4. **Figement** : écrit à la première écriture sur la routine qui suit le lancement, pas dans le moteur d'exécution. Le résultat est le même, puisque la routine n'a pas changé entre-temps.
5. **Occurrence qui n'est plus produite** :
   - réglée seulement dans ses séances ou son rappel, elle suit la récurrence et disparaît ;
   - déplacée ou commencée, elle reste affichée.
6. **Occurrence commencée** : la toucher dans l'Agenda ne fait rien (« n'est pas modifiable »).
7. **r21-j-deploye** : « pas de planification » est lu comme « pas de répétition » ; le filet est retiré sous la première séance seulement.
8. **Suppression sans créneau à supprimer** (« La routine <nom> sera supprimée ») : avec un historique, la routine est **archivée**, et ses créneaux exécutés sont conservés comme demandé.
9. **Restauration d'une routine archivée** : elle n'existe pas dans l'application ; rien n'a été inventé.
10. **Créneaux grisés** : opacité de 0,3 sur les pastilles, en-têtes en gris ; choix sans maquette.
11. **Cas D du cahier** : D-537 ne rédige pas ses « 7 cas ». Ils sont reconstitués depuis la liste de tests du document de mission.

## Tests

- **Ajoutés** :
  - `occurrenceModification.test.ts` (12 tests, base SQLite réelle) : cas B1 à B6, cas C1 à C10, date d'origine conservée quand la récurrence change, effacement d'un groupe redevenu identique, suppression ;
  - `PlanningScreen.integration` : mode « créneau seul » ; confirmation depuis le Journal ;
  - `JournalScreen.integration` : archivage avec historique ; titre nommé ; ligne 3 ; déployé ;
  - `CalendarWeekScreen.integration` : occurrence commencée non modifiable ni supprimable ; zone droite inerte ; « Supprimer ce créneau ».
- **Ajustés**, parce qu'une règle a changé :
  - paramètres d'ouverture depuis l'Agenda (`occurrenceKey`) ;
  - titre du dialogue de l'Agenda ;
  - aide `save()` qui confirme la modification ;
  - version de base 34 et liste des tables dans les tests de migration.
- **Résultats** :
  - `npx jest -w 2` : **411 groupes de tests réussis sur 411, 6 277 tests réussis, 32 ignorés** ;
  - `npx tsc --noEmit` : aucune erreur ;
  - `eslint` sur les fichiers modifiés : aucune erreur.
- **À vérifier sur iPhone** : tout ce qui est visuel ou tactile. Les dialogues, les colonnes grisées, les trois zones tactiles, la liste figée et la migration 034 sur la base de l'iPhone n'ont pas été vus. Une suite de tests verte ne les valide pas.

## Synchronisation code / documentation

- **Classe B** : registre ch07, section « Contre-recette iPhone du 20/11/2026 et missions D-536 / D-537 » ; DSF Journal et DSF Agenda annotés.
- **Classe D** : migration 034, choix techniques notés dans le registre.
- **Préparé, non appliqué** : D-536 et D-537 restent sur `docs/planification-grille-creneaux`, non fusionnée. Les écarts de texte du point 1 sont à reporter sur cette branche.

## Fichiers modifiés

- **Domaine** : `src/domain/planning/Routine.ts`, `occurrences.ts`, `reminders.ts`.
- **Base de données** :
  - `src/infrastructure/database/constants.ts`, `migrateDatabase.ts`, `migrations/migration034.ts` (nouveau) ;
  - `repositories/SqliteRoutineRepository.ts`.
- **Planification** :
  - `src/features/planning/PlanningService.ts`, `occurrenceDraft.ts` (nouveau), `PlanningScreen.tsx` ;
  - `CalendarWeekScreen.tsx`, `RoutineAgendaCard.tsx` ;
  - `JournalScreen.tsx`, `JournalRoutineCard.tsx`, `journal.ts`, `planningStrings.ts`.
- **Composants partagés** : `src/features/sessions/DecisionDialog.tsx`, `SessionCompositionTree.tsx`.
- **Route** : `app/planning.tsx`.
- **Tests** :
  - `src/features/planning/__tests__/` : `occurrenceModification.test.ts` (nouveau), `CalendarWeekScreen`, `JournalScreen`, `PlanningScreen` ;
  - tests de migration de `src/infrastructure/database/__tests__/` (version 34).
- **Documentation** : registre ch07, `docs/DSF-JOURNAL-2026-11-19.md`, `docs/DSF-AGENDA-PLANNING-2026-11-19.md`, ce rapport.

## Commit final et état Git

- **Commit** : celui qui contient ce rapport, sur `planification/ce-ui-12-20261118`.
- **État Git** : propre après commit ; branche ni envoyée sur GitHub ni fusionnée ; aucune réinitialisation (reset), aucun réalignement (rebase), aucun envoi forcé.
