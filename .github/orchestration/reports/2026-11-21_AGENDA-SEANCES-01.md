# 2026-11-21 — AGENDA-SEANCES-01 : Agenda centré sur les Séances, Journal et filtre (D-553)

## Identifiant et objectif

- **Mission** : AGENDA-SEANCES-01.
- **Objectif** : développer `docs/KODJO-Agenda-seances-journal-filtre-2026-11-21.md` (§ 2 à 5, arbitrages 1 à 9 du § 8), D-553.
- **Branche de départ** : `docs/agenda-seances-journal-filtre-20261121` (PR #448, non fusionnée), tête `fccd9f4a`, issue de `integration/bmad-planification-20261120` (base en version 34).
- **Branche de développement** : `feat/agenda-seances-20261121`, dans le worktree `C:\Dev\KODJO-AGENDA-SEANCES`. Le worktree de Metro (`C:\Dev\KODJO-PLANIF-CE12`) n'est pas touché.
- **Sources lues** :
  - `CLAUDE.md`, `docs/AGENTS.md`, `.claude/rules/synchronisation-code-documentation.md` ;
  - la spécification du 21/11/2026, D-553 (ch07), ch10 (RM-258, RM-261, RM-264), ch13 (CE-UI-15 et complément du 21/11), DSF Agenda, DSF Journal ;
  - Figma, fichier `G6RY5Ebhgwb4AHIOYDwwvg`, en lecture seule : Agenda validé `12906:47` (groupe de parcours `12906:71`).

## Liste PRESERVE / CHANGE / FORBIDDEN (établie avant le code)

### PRESERVE

- Moteur d'exécution, instantanés et persistance des Exécutions : aucune modification de `ExecutionService`, du noyau ni de `SqliteExecutionRepository.create` (le lien au créneau passe déjà par `occurrence`).
- Enchaînement D-534 : « Démarrer » d'un parcours lance la chaîne complète depuis sa première Séance (`executionChain`), voile de transition, reprise de la seule séance interrompue.
- D-536 : créneau commencé figé, non modifiable ; groupes modifiés à la main ; modification de la routine limitée aux créneaux non commencés.
- D-537 : un créneau commencé n'est pas supprimé ; suppression d'une routine depuis le Journal inchangée.
- D-540 : rattrapage jusqu'au créneau suivant, 10 jours pour le dernier, puis « Expirée » ; routines actives / terminées calculées.
- D-538 : zone de contexte de l'Agenda (Aujourd'hui, mois, rangée des sept jours, Planifier, entonnoir).
- D-539 : comportement de l'entonnoir (bleu = désactive, modale sans précoche, bouton désactivé sans sélection).
- Primitives natives existantes (roulettes SwiftUI, `TextInput`, gestes de `SwipeActionsRow`) ; composants partagés (`DecisionDialog`, `JournalRoutineCard`, `ParcoursBadge`, `SessionCompositionTree`, `TabbedScreen`).
- Rendu de la carte d'Agenda (cadre heure / durée, bande, traits, pastille, tailles du catalogue) ; Journal : une carte par routine, « P » après le nom.
- Unicité des noms de Séances.

### CHANGE

- Nom de Routine : nom généré par défaut (Séance, ou noms reliés par « + »), qui suit la composition ; nom personnalisé fixe ; mode stocké explicitement (`routines.name_generated`, migration 036) ; plus de contrôle d'unicité ; nom vidé bloquant (« Nom obligatoire »).
- Agenda : une carte par Séance (planifiée, exécutée, hors planification) ; ligne « Ⓟ nom de la Routine » et lien pour un parcours ; heures, durées et statuts par Séance ; actions et gestes par Séance.
- Rattachement automatique d'une Exécution lancée hors Agenda au créneau autonome éligible.
- Lecture de toutes les Exécutions par l'Agenda (Exécutions sans lien comprises).
- Filtre de l'Agenda : routines actives puis terminées ; Exécutions hors planification masquées quand un filtre est actif.

### FORBIDDEN

- Modifier le moteur, la chaîne D-534 ou les protections D-536 / D-537 / D-540.
- Remplacer un composant partagé ou une primitive native.
- Toucher aux Catalogues, aux Programmes (mission PROG-CAT-01) ou au Journal hors nom de Routine.
- Fusionner, rebaser, réinitialiser ou forcer un envoi ; modifier Figma.
- Inventer une règle : tout cas non couvert est listé « À CLARIFIER ».

## Migration

- **Numéro retenu : 036** (version de base 36).
- **Contrôle fait avant la création** (`git fetch --all`, puis recherche de `migration035` et suivantes) :
  - aucune migration 035 ou suivante sur les branches distantes ;
  - la session parallèle PROG-CAT-01 a déjà une `migration035.ts` (Programmes) dans son worktree local `C:\Dev\KODJO-PROG-CAT-01`, sur la branche `feat/programmes-catalogue-20261121`, non envoyée ;
  - le premier numéro libre est donc 036.
- **Contenu** : la colonne `routines.name_generated` (0 ou 1).
  - Une routine nommée garde son nom, considéré comme personnalisé, sans changement visible.
  - Une routine sans nom (antérieure au 18/11/2026, RM-264) reçoit le nom généré.
  - La migration est idempotente.
- **Version 35** : cette branche passe de 34 à 35 sans rien écrire. La version 35 est réservée à la migration 035 des Programmes.
- **Point d'intégration à traiter** : une base passée en version 36 par cette branche seule n'a pas la migration 035.
  - À la fusion avec PROG-CAT-01, la migration 035 doit s'insérer à la version 34 → 35.
  - Pour une base déjà en 36, il faut aussi appliquer la migration 035, qui est idempotente. Sinon, réinstaller l'application (les données de l'iPhone sont jetables).

## Modifications réalisées

| Domaine | Fichiers | Contenu |
|---|---|---|
| Nom de Routine | `Routine.ts`, `planningDraft.ts`, `PlanningScreen.tsx`, `PlanningService.ts`, `journal.ts`, `planningStrings.ts`, `SqliteRoutineRepository.ts`, `migration036.ts` | Le nom généré (`generatedRoutineName`) est recalculé à l'affichage (`routineDisplayName`, `routineTitle`). Le mode est stocké. Le contrôle d'unicité est supprimé (`isNameTaken`, `normalizeRoutineName`, « Ce nom est déjà utilisé »). Un nom vidé affiche « Nom obligatoire ». Une copie part du nom généré. |
| Agenda | `agendaCards.ts` (nouveau), `CalendarWeekScreen.tsx`, `RoutineAgendaCard.tsx`, `ParcoursBadge.tsx` | Une carte par Séance. Groupe de parcours : ligne « Ⓟ nom », lien noir de 1, cadre décalé (Figma `12906:71`). Heure réelle, « — », durée réelle, statut par Séance. Actions et gestes par Séance. Le déployé montre la composition seule. |
| Exécutions | `occurrenceExecutions.ts`, `SqliteExecutionRepository.listForAgenda`, `SqliteOccurrenceExecutionRepository.ts`, `SessionServiceProvider.tsx`, `PlanningService.agendaData` | L'Agenda lit toutes les Exécutions (`listForAgenda`). La Séance de chaque Exécution liée est lue. Le créneau d'avant la période est lu quand une Exécution démarre dans la période. |
| Rattachement | `PlanningService.autoAttachment`, `ExecutionScreen.tsx`, `executionChain.ts`, `app/execution.tsx` | Rattachement au lancement hors Agenda. « Rattraper » une Séance seule passe son rang (`occurrenceRank`). |
| Suppression d'une Séance | `PlanningService.removeOccurrenceSession`, `CalendarWeekScreen.tsx` | La Séance est retirée seule. Une Séance exécutée est refusée. La dernière Séance supprime le créneau. |
| Catch-up par Séance | `occurrences.ts` (`catchUpEnd`) | Fin du délai de rattrapage, calculée pour toute occurrence, commencée comprise (règle D-540 inchangée). |
| Filtre | `PlanningService.routineFilterChoices`, `RoutineFilterSheet.tsx`, `JournalRoutineCard.tsx` | Routines actives puis terminées. Une ligne par Routine. Ⓟ après le nom d'un parcours : il manquait dans la modale. Sélection par identifiant, inchangée. |
| Journal | `JournalScreen.tsx` | Nom généré ou personnalisé. Une carte par Routine et « P » après le nom : déjà en place, inchangés. |

## Démonstration PRESERVE

- **Moteur d'exécution** : `ExecutionService` et le noyau ne sont pas modifiés (`git diff` vide sur ces fichiers).
  - `SqliteExecutionRepository` reçoit seulement une méthode de lecture, `listForAgenda` ; `create` et `save` sont inchangés.
  - Cette lecture est placée dans ce dépôt parce que la garde PRE-4 1.3 / AC9 réserve la lecture de l'instantané à la persistance de l'Exécution.
  - Seul l'écran d'Exécution calcule le lien avant d'appeler `service.start`, comme avant.
- **Enchaînement D-534** : `nextInChain`, le voile et la reprise sont inchangés.
  - « Démarrer » de la première carte d'un parcours lance la même chaîne qu'avant (test « routine à deux séances »).
  - Les 13 tests de `ExecutionScreen.chain.test.tsx` sont verts.
- **D-536 et D-537** : `updateOccurrence`, `frozen`, `excludeOccurrence` et `deleteRoutine` sont inchangés.
  - Les tests existants passent sans modification de leurs attentes (`occurrenceModification.test.ts`).
- **D-540** : `withExpiry` garde la même règle ; il ajoute seulement `catchUpEnd`.
  - Les tests D-540 existants sont verts, dont l'écran « Expirée ».
- **D-538 et D-539** : la zone de contexte et l'entonnoir ne sont pas modifiés ; leurs tests sont verts.
- **Primitives natives et composants partagés** : aucun remplacement.
  - `ParcoursBadge` reçoit une option `size`. `JournalRoutineCard` affiche le Ⓟ dans sa variante de sélection. `RoutineAgendaCard` reçoit trois options.
  - Les rendus par défaut sont inchangés.

## À CLARIFIER (non bloquant, choix appliqués en attendant)

1. **Titre de confirmation de la suppression d'une Séance de parcours** : « Supprimer cette séance » (libellé technique). Pour un créneau à une Séance, « Supprimer ce créneau » reste inchangé.
2. **Copie d'une routine au nom personnalisé** : la copie part du nom généré (règle de création, § 2). Garder plutôt le nom personnalisé ?
3. **Ordre des cartes d'un parcours** : ordre de la composition, même si les Séances ont été exécutées dans un autre ordre. Le groupe se place à l'heure de sa première carte.
4. **Séance d'un parcours rattrapée un autre jour** : elle reste groupée sous le jour du créneau. C'est l'arbitrage 2 étendu au-delà de minuit.
5. **Durée réelle** : fin − début de l'Exécution, pauses comprises.
6. **Exécution non terminée** : aucune carte « Hors planification » tant qu'elle n'est pas terminée. Une Séance planifiée en cours reste « non exécutée ».
7. **Égalité de distance au rattachement** : « le plus ancien » est lu comme l'heure prévue la plus tôt, puis la routine créée la première.
8. **Séance suivante d'un parcours non lancé** :
   - la carte prend la teinte du créneau (bleu à venir, rouge passé), sans action ;
   - si le créneau est expiré, chaque Séance affiche « Expirée ».
9. **Parcours commencé en avance** (lancé avant son heure, chaîne interrompue) : les Séances non exécutées affichent « Rattraper » même avant l'heure prévue.
10. **Points de la rangée des jours** : un point par carte de Séance, Exécutions hors planification comprises.
11. **Composition au déployé d'une Exécution hors planification** : composition actuelle de la Séance, pas l'instantané. Le nom vient de l'instantané. Sans Séance au catalogue, il n'y a pas de déployé.
12. **Routines sans nom (RM-264)** : la migration les passe en nom généré.

## Tests

### Ajoutés

- `agendaSeances.test.ts` (17 tests) :
  - nom généré ; noms identiques ; renommage ; nom vidé bloquant ; copie ;
  - modification d'un seul créneau sans changement de nom ;
  - rattachement : le plus proche, puis le plus ancien ; créneau commencé ou expiré exclu ; Séance de parcours lancée directement ; Séance seule et dans un parcours le même jour ;
  - suppression d'une Séance, d'une Séance exécutée, de la dernière Séance ;
  - historique après suppression de la routine ;
  - ordre du filtre ;
  - cartes : passage de minuit, trait « — », statut individuel, heure réelle, double Exécution, rattrapage puis « Expirée », filtre mixte sans doublon avec Exécutions hors planification masquées, créneaux multiples et expirés.
- Agenda (écran) :
  - ligne Ⓟ et lien ; une carte par Séance et chaîne D-534 ;
  - parcours commencé, avec « Rattraper » seule et créneau non modifiable ;
  - suppression d'une Séance puis de la dernière ;
  - Exécutions hors planification ;
  - Séance rattrapée plus tard, placée à sa date réelle.
- Planifier (écran) : nom généré, doublon, nom vidé, nom personnalisé ; nom généré enregistré.
- Filtre (modale) : une ligne par Routine avec Ⓟ, actives puis terminées, noms identiques sélectionnés par identifiant.
- Exécution (écran) :
  - rattachement automatique ; sans créneau éligible, aucun lien ;
  - lien explicite conservé et rang d'un « Rattraper » ;
  - paramètres de route.
- Base :
  - migration 036 (reprise, mode écrit et relu, idempotence) ;
  - lecture de toutes les Exécutions par l'Agenda.

### Ajustés, parce que la règle a changé (D-553)

- Titre de carte = nom de la Séance.
- Une carte par Séance (deux tests de l'Agenda réécrits).
- Nom généré à plusieurs séances et plus de « Ce nom est déjà utilisé » (Planifier, `planningGrid`, migration 032).
- Version courante 36 dans les tests de migration : mise à jour habituelle à chaque nouvelle migration.
- Lien relu portant la Séance (`ExecutionService.pre10`).

### Exécutés

- `npx tsc --noEmit` : aucune erreur.
- `eslint` sur tous les fichiers modifiés : aucune erreur.
- Jest, un seul processus :
  - planification (écrans, service, domaine) et base de données : 794 tests sur 794, dont 534 en base ;
  - Exécution : réussis ;
  - tests hors planification qui dépendent des fichiers modifiés (`SessionServiceProvider`, `MigrationNoticeGate`, `CompositionSaveFlow`, `ExerciseScreen`, `app/__tests__`) : 111 sur 111.

### Suite complète

- Lancée, puis **arrêtée par Claude Code faute de mémoire sur le poste** : 4 fichiers passés, aucun échec, avant l'arrêt.
- Metro (port 8083, worktree `KODJO-PLANIF-CE12`) a été arrêté en même temps, pour la même raison.
- Ni l'une ni l'autre n'est relancée sans accord de Hermann. **Résultat de la suite complète : non disponible.**

## Synchronisation code / documentation

- **Classe A (conformité)** : le code rejoint D-553 et la spécification du 21/11/2026, déjà écrites sur la branche documentaire.
  - Aucune règle n'est créée.
  - Les cas non couverts sont listés « À CLARIFIER ».
- **Classe D (technique)** :
  - ch12 annoté : mécanisme du nom (migration 036) et stratégie de rattachement et de lecture des Exécutions, qui y étaient marqués « à concevoir » ;
  - statut de la spécification annoté (« Développées le 21/11/2026 »).

## Livraison sur l'iPhone

- **Mise à jour par Metro ou OTA, sans réinstallation** : la livraison est en JavaScript seul, sans module natif ni réglage natif.
  - La migration 036 s'applique au lancement de l'application (`migrateDatabase`).
- **Réinstallation, ou application de la migration 035, nécessaire seulement à l'intégration avec PROG-CAT-01** : voir la section « Migration ».

## Vérifications restant à faire sur l'iPhone

Toutes les vérifications de cette mission sont à faire sur l'iPhone. Elles sont listées dans le cahier de recette, section « Agenda centré sur les Séances » (24 cas). Points de rendu à comparer à Figma `12906:47` :
- position du Ⓟ de 18 sur les traits des cartes ;
- lien noir de 1 ;
- décalage de 10 du cadre ;
- écart de 4 entre les cartes d'un parcours.

## Commit final et état Git

- **Commit** : celui qui contient ce rapport.
- **État Git** : propre après commit. La branche est envoyée et une PR est ouverte vers `integration/bmad-planification-20261120`, sans fusion.
