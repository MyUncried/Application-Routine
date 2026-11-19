# 2026-11-19 — Planification : écarts de la recette du 19/11, Agenda, enchaînement des séances, rappels

## Identification et objectif

- **Mission** : « Les tests sont réalisés. Corrige tous les écarts, il y a notamment des évolutions amenées sur l'écran de l'agenda, les cartes de routines, les notifications, et l'enchaînement de l'exécution des séances. » (Hermann, 19/11/2026).
- **Sources** :
  - cahier « Recette Planification Semaine » (artifact `SbY2Ci9tcqVe3s9AiDBB84`), 78 résultats : 12 KO, 4 sans objet, 61 OK ; deux prompts collés dans les notes, en t1 et en constat b ; spécification des notifications en pièce jointe de t6 ;
  - branche `docs/planification-grille-creneaux` : D-525 complété, D-532 à D-534, CE-UI-15, DSF Agenda et DSF Barre de titre à onglets ;
  - Figma `G6RY5Ebhgwb4AHIOYDwwvg`, écran `12580:27335`.
- **Branche** : `planification/ce-ui-12-20261118`, dossier `C:\Dev\KODJO-PLANIF-CE12`. Aucune fusion.
- **Commit de départ** : `a22f9f71`.

## Périmètre demandé et traité

| Lot | Commit | Contenu |
|---|---|---|
| 1. Écarts de l'écran Planifier | `d7405b26` | d4 : « pendant » rétabli. k13 / e2 : position du popover et unités des roues. k19 : date et heure en popover sans titre ni bouton ; calendrier en apparence claire. k8 : bleu KODJO. k14 / e3 : rappel refusé. |
| Documentation de référence | `ece72478` à `173d867c` | 9 commits de la branche documentaire repris par `cherry-pick -x` (planification seulement ; D-528 à D-531, EMOM et Max, écartés). |
| 2. Barre de titre à onglets (D-532) | `d41a5711` | Journal · Agenda · Vue d'ensemble, avec le composant partagé `CatalogueNavigation`. |
| 3. Agenda (D-533, D-534, CE-UI-15) | `c113d0d1` | Zone de contexte, rangée des jours, liste par jour, carte de routine `RoutineAgendaCard` : une carte par occurrence. h2 : texte agrandi. |
| 4. Enchaînement des séances (D-534) | `e3c6c5ea` | Chaîne passée dans les paramètres de route, `release()` puis séance suivante, voile vert au rang 2 et au-delà. |
| 5. Textes des rappels (t6) | `0e65ca01` | Catalogue, familles, rotation, règle des 40 caractères (RM-054d). |

### Lignes du cahier sans correction

- **f8** (« Les occurrences passées doivent être proposées ») : déjà le cas depuis D-525 (`a22f9f71`). Le Calendrier calcule les occurrences de la semaine passées comprises. C'est la ligne du cahier qui est à réécrire.
- **t4** (KO sans note, 17/11) : aucune indication à appliquer.
- **Constat a** (« On ne peut plus déplacer les séances… ») : c'est le texte du 17/11. Il a été corrigé le 18/11 (k16 noté OK le 18/11 à 19 h 32). La liste réordonnable a ensuite été retirée par D-523 (ordre des lignes = ordre de sélection). **Non rétabli, à confirmer par Hermann.**
- **c5 à c7, d1, d2, e3, k9, k11, k12, k14, t5** : ces lignes portent sur des écrans retirés par D-523 (interrupteurs, stepper, feuille Fréquence). Elles sont à remplacer dans le prochain cahier.

## Liste PRESERVE / CHANGE / FORBIDDEN

### PRESERVE, démontré inchangé

- **Moteur et noyau d'exécution, `ExecutionService`** (API et persistance) : aucun fichier de `src/domain/execution/` ni `ExecutionService.ts` modifié. Les tests `ExecutionService.pre10`, `ExecutionScreen.pre10` et `forTime.pre11` sont verts.
- **Moteur des occurrences** : `occurrences.ts` n'est pas modifié. `reminders.ts` reçoit seulement le rang de l'occurrence (`rank`), sans changement de calcul.
- **Écran de démarrage d'une séance isolée** : pour une séance, la route reste `{ sessionId }`, sans voile. Testé dans `ExecutionScreen.chain`, cas « une seule séance ».
- **Bips, voix, dialogues, anneau** : non touchés.
- **Catalogue et Composition** : non touchés. Seul ajout : la fonction pure `sessionCategoryIds`, qui lit les catégories des exercices, sans changer la projection existante.
- **Primitives natives** :
  - `Picker` SwiftUI `pickerStyle("wheel")` et `DatePicker` graphique conservés ;
  - le popover n'est qu'un conteneur ;
  - aucune roulette de remplacement n'est rendue sur iOS (les tests le vérifient).
- **Navigation et routes** : routes inchangées. La route `/execution` accepte deux paramètres facultatifs.

### CHANGE

- Écran Planifier (écarts de la recette).
- Barre de titre du Calendrier.
- Vue Agenda : zone de contexte, rangée des jours, liste et carte.
- Point d'entrée « Démarrer » et `close()` de l'écran d'exécution.
- Écran de transition (voile).
- Textes des rappels.

### FORBIDDEN, respecté

- Aucune primitive native remplacée.
- Aucune réécriture massive de tests : les tests modifiés sont ceux des comportements remplacés ; des tests ont été ajoutés.
- Le modèle de domaine et la persistance ne changent pas : aucune migration, et la rotation des rappels n'est pas persistée.
- L'écran Jour n'est pas modifié (il n'existe pas : Journal reste indisponible).
- Le moteur d'exécution n'est pas modifié.

## Constats et décisions de mise en œuvre (à confirmer)

1. **Rappel refusé (k14)** : iOS ne repose jamais sa demande d'autorisation après un refus. Il est donc impossible de réactiver les notifications sans passer par Réglages.
   - Mise en œuvre : un message natif « Notifications désactivées » avec Annuler / Autoriser.
   - « Autoriser » ouvre directement la page des notifications de Routine dans Réglages.
   - Le délai choisi s'applique au retour, si les notifications y ont été autorisées.
2. **« pendant » (d4)** : seulement pour l'unité semaines. Le modèle ne connaît pas de durée en jours (RM-257), donc l'unité jours garde « jusqu'au ».
3. **Unités des roues (k13, e2)** : « heures / minutes », puisque le rappel est en heures et minutes. La note disait « minutes / secondes ». Unités ajoutées aussi à la roue de l'heure de début. La roue du nombre de semaines reste sans unité (D-520).
4. **Agenda, points À CLARIFIER du DSF, non tranchés** :
   - « spécialité » : absente du modèle, seules les zones corporelles sont affichées ;
   - teintes fait / manqué : elles demandent le lien occurrence ↔ Exécution, absent du modèle, que D-525 du 19/11 suppose (« rejouée, l'occurrence devient Exécutée ») ; toutes les cartes sont donc grises (« prévue ») et l'étiquette « Terminée » n'apparaît jamais ;
   - « Aujourd'hui » toujours visible ;
   - changement de mois : premier jour du mois (proposition du DSF) ;
   - semaine à cheval : « du 26 août au 1er septembre ».
5. **Récurrence dans le déployé** : conservée sous la carte, avec les séances (« à conserver, déplacer ou retirer, à arbitrer »).
6. **Enchaînement** :
   - l'appui sur le voile lance directement la séance (hypothèse du prompt) ;
   - un arrêt volontaire termine la chaîne (À CLARIFIER : « Passer à la suivante » / « Terminer ») ;
   - couleurs du voile : vert des étiquettes « Terminée » (`#1A995C`) à 35 %, encadré `#12784A` ; l'écran Figma « Enchaînement (proposition) » n'a pas été lu.
7. **Textes des rappels** :
   - nom = celui de la routine ; sans nom, celui de sa première séance ;
   - RESTART, FIRST et PROGRAM ne sont pas retenus (données absentes) ;
   - la rotation dérive du rang de l'occurrence, sans persistance ;
   - le toucher ouvre toujours la première séance (RM-054b), sans la chaîne.

## Tests

- Tests ciblés exécutés pendant la mission, tous verts :
  - `PlanningScreen.integration` (18, dont « pendant », popovers et rappel refusé) ;
  - `planningPopover` ;
  - `CalendarWeekScreen.integration` (12, dont onglets, une carte par occurrence, navigation par mois, Démarrer avec la chaîne) ;
  - `agendaFormat` ;
  - `ExecutionScreen.chain` (7 : une séance ; deux séances avec `release()` avant la navigation ; voile au rang 2 seulement, texte exact, toucher qui lance la séance ; arrêt volontaire ; reprise sans chaîne) ;
  - `reminderMessages`, `reminders`.
- Planification et domaine : 12 suites, 111 tests. Exécution : 8 suites, 58 tests.
- `tsc` propre, `eslint` sans erreur sur les fichiers touchés.
- Résultat global : voir « Exécution finale des tests » ci-dessous.

## Vérifications sur iPhone

- **Écran Planifier** :
  - popovers près du champ, au-dessus du champ en bas d'écran ;
  - unités lisibles ;
  - calendrier lisible en mode sombre ;
  - voile qui ferme ;
  - bleu des dates et heures ;
  - « pendant » et conversion ;
  - message « Notifications désactivées », passage par Réglages et retour.
- **Agenda** :
  - onglets ;
  - trois lignes de la bande, doubles flèches ;
  - semaine à cheval sur deux mois ;
  - rangée des jours en texte agrandi ;
  - cartes jusqu'aux bords de l'écran, bande et traits ;
  - glissé 90 × 52 ;
  - déployé ;
  - routine à deux séances sur une seule carte.
- **Enchaînement** :
  - routines à deux et à trois séances, de bout en bout ;
  - bips et voix entre deux séances ;
  - lisibilité du voile ;
  - arrêt volontaire en cours de chaîne ;
  - interruption puis reprise.
- **Rappels** : titre, corps, et rotation sur plusieurs jours.

## Synchronisation code / documentation

- **Classe A** : D-532, D-533, D-534 (CE-UI-15, DSF Agenda, DSF Barre de titre) ; documentation reprise de la branche documentaire.
- **Classe B** :
  - recette du 19/11 (d4, k8, k13, e2, k14, e3, k19) → ch07 (D-520, D-524, « Mise en œuvre de la grille »), ch10 (RM-053, RM-257), ch13 (CE-UI-12) ;
  - spécification des notifications (t6) → ch10 RM-054d, ch07, `docs/KODJO-Specification-notifications-rappels-seance-2026-11-18.md`.
- **Classe D** : ch12 § 12.13 (textes des rappels, Agenda et enchaînement).

## Fichiers modifiés (code)

`app/execution.tsx`, `assets/icons/icon-agenda-chronometre.svg`, `src/domain/planning/{reminderMessages,reminders}.ts`, `src/features/execution/{ExecutionScreen.tsx,executionChain.ts,executionStrings.ts}`, `src/features/planning/{CalendarWeekScreen,PlanningScreen,PlanningWheelPopover,RoutineAgendaCard}.tsx`, `src/features/planning/{PlanningService,ReminderScheduler,agendaFormat,planningDraft,planningStrings}.ts`, `src/features/sessions/{SessionServiceProvider.tsx,sessionCatalogueProjection.ts}`, tests associés.

## Exécution finale des tests

- Commande : `npx jest --maxWorkers=2 src/features/planning src/domain/planning src/features/execution src/domain/execution src/features/sessions src/infrastructure app`
- Résultat : **214 suites réussies sur 214 ; 2 616 tests réussis, 32 ignorés (déjà ignorés avant la mission), 0 échec.**
- Non exécutés : les autres dossiers de `src` (activités, catalogue, préférences, bibliothèques…), qui ne sont pas touchés par cette mission. La suite complète d'un seul tenant n'a pas été relancée : elle avait été arrêtée faute de mémoire le 18/11.

## Cahier de recette

Le cahier en ligne « Recette Planification Semaine » (`https://claude.ai/artifact/SbY2Ci9tcqVe3s9AiDBB84`) a reçu cinq sections en tête :
- écran Planifier (7 lignes) ;
- Agenda (11 lignes) ;
- enchaînement (8 lignes) ;
- rappels (3 lignes) ;
- à trancher (8 lignes).

Les résultats déjà saisis sont conservés. Adresse Metro : `http://192.168.0.16:8083`.

## État Git

Branche `planification/ce-ui-12-20261118`, non poussée, non fusionnée. Le commit final contient ce rapport.
