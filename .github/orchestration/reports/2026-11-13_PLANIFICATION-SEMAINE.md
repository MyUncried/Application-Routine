# 2026-11-13 — Moteur de planification et Calendrier Semaine

## Identifiant et objectif

- Mission : `PLANIFICATION-SEMAINE` (demande de Hermann du 13/11/2026 : « Développer le moteur de planification et le calendrier à la semaine »), complétée par sa précision du même jour : « Pour le calendrier, pars du nœud 1992:5101 et utilise docs/MATRICE-ECRANS-CARTES-2026-09-30.md pour retrouver les états de la semaine : jour sélectionné, séance déployée, actions glissées et suppression. Pour la création d'un créneau, pars du nœud 1992:6838 et suis docs/MATRICE-PLANIFICATION-2026-10-08.md pour les variantes de sélection, de répétition, de fréquence et de rappel. Lis les écrans actuels dans Figma et utilise la spécification fonctionnelle pour les règles de calcul du moteur. »
- Objectif : un parcours utilisable de bout en bout — choisir les séances, régler le créneau (répétition, fréquence par contenu, rappel), enregistrer, calculer les occurrences de la semaine, les afficher dans le Calendrier Semaine, les démarrer, les modifier, les dupliquer et les supprimer.

## Branche et commit de départ

- Worktree `C:\Dev\KODJO-PLANIFICATION`, branche `planification/main-20261113`, créée depuis `origin/main` actualisée.
- Commit de départ : `a2b17131599248980749350c8b6d83c032cb98c2` (fusion #438 `pre10-fin`), puis `16c618d5` (rapport de création du worktree).

## Changements des chantiers parallèles qui touchent la planification

| Chantier | État observé (13/11) | Effet sur la planification |
|---|---|---|
| PRE-10 Exécution (`composition-phases-duree`, `pre10-fin`) | Entièrement fusionné dans `main` (#438). | Contrat de démarrage disponible : route `/execution?sessionId=`. Réutilisé tel quel. |
| PRE-10 son et voix (`pre10-guidage`, worktree `PRE10-SON`) | 76 commits non fusionnés ; seul `ExecutionService.ts` diffère de `main` parmi les fichiers partagés. | Aucun fichier commun. Le retour du statut de réalisation dépendrait de `ExecutionService` : non touché (voir « Raccordements ouverts »). |
| Bibliothèques / catalogue connecté (`catalogue/connecte-*`, `docs/bibliotheques-*`, `docs/mouvements-*`) | `docs/*`, `revue/*` : documentation seule. `connecte-dev/admin` : `CatalogueScreen.tsx` (+4 lignes) et `SqliteMovementRepository.ts`. | Contenus planifiables = Séances (D-449), identifiants `sessions.id`, lus par `SessionService.listCatalogueSessions`. Aucune modification en cours de leur sélection ou lecture. Conflit trivial possible sur `CatalogueScreen.tsx` (prop `onPlanSession`). |
| Migrations SQLite | `main` à 29 ; aucune `migration030` ailleurs ; migration « homonymes ≥ 029 » du catalogue connecté non développée. | Cette tranche prend **030**. Les homonymes prendront **031** et porteront les assertions « version courante » des tests de migration à 31. |
| Dépendances natives | — | Ajout d'`expo-notifications ~57.0.25` (rappels locaux) : **nouvelle build du client de développement nécessaire** pour la recette ; `package.json` / `package-lock.json` à fusionner avec les autres lignes. |

## Périmètre demandé

Cadrage (matrices, spécification, décisions, contrats d'écran, Figma « Prototype MVP »), moteur d'occurrences, création d'un créneau (sélection, répétition, fréquence, rappel), Calendrier Semaine (jour sélectionné, séance déployée, actions glissées, suppression), raccordements Exécution et Bibliothèques, tests. Vues Jour et Mois exclues.

## Sources lues

- Matrices : `docs/MATRICE-PLANIFICATION-2026-10-08.md`, `docs/MATRICE-ECRANS-CARTES-2026-09-30.md` (les codes SEM-01..06 / PLAN-01..05 / SEL-01..05 n'y sont pas définis ailleurs : les états ont été relus dans Figma).
- Spécification : chapitres 04 (Routine, Planification), 05 (périmètre MVP, points ouverts, limites), 09 (Entité Routine, Règles de planification), 10 (RM-043 à RM-054a, fréquence, répétition, borne), 11 (API-ROU-01 à 09), 12 (Notifications, §12.4), 13 (CE-UI-02 à 05, CE-UI-11, contrôles de planification) ; registre 07 (D-013, D-022, D-023, D-060, D-243, D-244, D-328 à D-332, D-449, D-499, D-506) ; `KODJO-Catalogues-cartes-modales-2026-11-06.md`.
- Figma `G6RY5Ebhgwb4AHIOYDwwvg`, lus directement le 13/11 : Semaine `1992:5101`, mardi sélectionné `2252:86`, séance déployée `1992:6389`, actions glissées `1992:5962`, suppressions `1992:5365` / `1992:6102` ; création `1992:6838`, date ouverte `1992:6622`, stepper des semaines `1992:7537`, rappel personnalisé ouvert `1992:7187` et sélectionné `1992:7369`, sans répétition `1992:7716`, parcours `7594:34531`, fréquence `7594:34653`, sélection `7599:14197` / `7594:34809` ; icône `icon/planifier` `11004:44092` exportée.

## Cadrage — scénarios, règles, existant, travail

Fréquences de répétition spécifiées pour cette tranche : **créneau unique** et **unité Semaine** (RM-047, D-244, D-331). Jour et Mois : bornes, rangée des jours et fins de mois ouvertes (chapitre 05) → présents, indisponibles. La vue Semaine affiche toute occurrence de la semaine, unique ou répétée.

| Scénario utilisateur | Règle validée et source | Existant réutilisé | Travail de cette tranche |
|---|---|---|---|
| Planifier depuis le Calendrier | CE-UI-03/04, D-499, D-449 ; Figma `7594:34809` « Catalogue des séances » | `FixedHeader` « Fermer et valider », `ContextBand` + `SessionCommandRow` (compteurs, Rechercher, Filtre, Tri), `SessionCard` contexte `planning`, feuille `catalogue-filters` | Modale Catalogue des séances à cases ; Créer retiré (prop rendue facultative) |
| Planifier depuis le Catalogue | CE-UI-05 §3 | Glissé `SessionCatalogueList` | « Planifier » activé, Séance préremplie |
| Régler le créneau | CE-UI-05 ; ch. 10 « répétition » ; RM-047 ; D-244 ; D-331 ; Figma `1992:6838`, `1992:6622`, `1992:7537` | `DatePicker` natif `@expo/ui`, `Switch` + `switchOffColors`, `SegmentedControl`, `InlineStepper` | Début le, Répétition (interrupteur, chevron, Semaine, [N] semaines — stepper déroulé —, jusqu'au/pendant, L M M J V S D), récapitulatif protégé |
| Plusieurs séances, ordre | RM-043, D-328, D-223 ; Figma `7594:34531` | Icône `composition-reorder` | Lignes sans titre : poignée (glisser), nom, fréquence ; VoiceOver monter/descendre |
| Fréquence d'un contenu | D-329, ch. 10 « x fois sur n », CE-UI-11 ; Figma `7594:34653` | `ModalHeader`, `InlineStepper`, feuille native (route `formSheet`) | Feuille « Fréquence » ; filtrage des occurrences par le motif dans le moteur |
| Rappel | D-060, RM-051 à RM-054a, D-243, ch. 12 « Notifications » ; Figma `1992:6838`, `1992:7187`, `1992:7369` | `DurationWheelPicker` (unités rendues paramétrables, défauts inchangés), feuille native | Interrupteur, 5' 15' 30' 1h Autre, « Rappel personnalisé » heures/minutes, autorisation à la première activation, fenêtre glissante de notifications locales |
| Enregistrer, rouvrir l'application | D-013 ; CE-UI-05 §15 | `migrateDatabase`, `ExpoDatabase` | `migration030`, `SqliteRoutineRepository` transactionnel, `PlanningService` |
| Consulter la semaine | CE-UI-03 ; RM-046 ; RM-049 ; Figma `1992:5101`, `2252:86` | `ContextBand` fondu, `SessionCard`, `SessionCompositionTree` | En-tête Jour \| Semaine \| Mois, semaine précédente/suivante, Aujourd'hui, Planifier, barre 7 jours (jour sélectionné, points), sections « N prévue(s) », vide |
| Séance déployée | CE-UI-03 §12 ; Figma `1992:6389` | `SessionCard` (déploiement) | Récurrence « Chaque lundi » + composition |
| Démarrer | RM-048, D-057 ; contrat PRE-10 | `/execution?sessionId=` | Démarrer sur chaque carte |
| Modifier / Dupliquer | D-022 ; RM-123 ; Figma `1992:5962` | `SwipeActionsRow` | Carte → formulaire prérempli ; glissé Dupliquer → brouillon |
| Supprimer | CE-UI-03 §14 ; RM-050 ; R-04 ; Figma `1992:5365`, `1992:6102` | `DecisionDialog` | Unique : Annuler/Confirmer ; périodique : Seulement cette occurrence / Toutes les occurrences à venir / Annuler |
| Séance archivée ou supprimée | RM-206 (même règle) ; ch. 09 | — | Ses occurrences et rappels ne sont plus proposés |

## Constats

- Le moteur n'existait pas (`src/features/planning` : un README ; onglet Calendrier : écran d'attente ; aucune table de Routine ; `infrastructure/notifications` : un README, `expo-notifications` absent).
- D-449 rend la Séance seul contenu planifiable ; CE-UI-04 décrit encore un segment Exercices/Séances. Figma (`7594:34809`) montre désormais le Catalogue des séances en modale : suivi.
- Figma ne représente pas l'état coché dans la modale de sélection ; CE-UI-04 §8 impose des cases : cases conservées.
- Les cartes du Calendrier dans Figma gardent l'ancien format (note du 06/11 : « non migrées ») : la carte de séance partagée actuelle est utilisée (règle des composants standards).

## Preuves et tests

Commandes exécutées dans `C:\Dev\KODJO-PLANIFICATION` :

- `npx tsc --noEmit -p .` : aucune erreur.
- `npx eslint` sur les fichiers créés ou modifiés : aucune erreur.
- `npx jest src/features/planning src/domain/planning src/infrastructure/database/__tests__/migration030` : 50 tests, tous réussis.
- `npx jest` (suite complète) : 353 suites, 5 792 tests, tous réussis.

Tests ajoutés :

- `src/domain/planning/__tests__/occurrences.test.ts` — créneau unique ; toutes les 2 semaines lundis et jeudis ; fin « jusqu'au » incluse ; « pendant 3 semaines » ; début en milieu de semaine ; 4 mois consultés semaine par semaine (120 occurrences, aucune en double, heure d'hiver comprise) ; retrait ; liste ordonnée et motif 1 sur 2 ; futures seulement ; validations.
- `src/features/planning/__tests__/planningSummary.test.ts` — phrases de Figma `1992:7716` et `1992:6838`.
- `src/features/planning/__tests__/reminders.test.ts` — fenêtre de rappels (15 min avant, passé et retraits exclus, limite), bornes 1 min–24 h, libellés 5' / 1h / 1h20, autorisation demandée une seule fois, refus sans programmation, contenu des notifications.
- `src/features/planning/__tests__/PlanningFrequencySheet.test.tsx` — à chaque fois ; 2 fois sur 3 positions 1 et 3 ; remise au gris à chaque changement de x ou n ; coche inactive tant que x positions ne sont pas retenues ; récurrence « Chaque lundi ».
- `src/infrastructure/database/__tests__/migration030.routines.test.ts` — tables additives, contraintes, relecture entière (rappel compris), modification, retrait, suppression en cascade, **fermeture puis réouverture d'une base fichier**.
- `src/features/planning/__tests__/CalendarWeekScreen.integration.test.tsx` (SQLite réelle) — semaine vide ; créneau unique au bon jour et à la bonne heure ; répétition sur deux jours, semaine suivante, fin, retour ; deux séances dans l'ordre ; Démarrer ; carte → modification ; Dupliquer ; suppression unique annulée puis confirmée (Séance conservée) ; « Seulement cette occurrence » puis « Toutes les occurrences à venir » ; Séance archivée ; jour sélectionné.
- `src/features/planning/__tests__/PlanningScreen.integration.test.tsx` (SQLite réelle) — depuis le Catalogue ; répétition (stepper déroulé, jusqu'au/pendant) ; aucun jour → coche inactive ; Catalogue des séances à cases, deux séances, réordonnancement par la poignée ; modification (retraits conservés) ; rappel accordé (15 min, 1h, Autre → 1h20) ; rappel refusé (RM-053) ; fréquence 2 fois sur 3 enregistrée ; abandon sans écriture.

Tests existants modifiés : assertions « version courante » des tests de migration 012 à 029 (29 → 30).

## Hypothèses non démontrées

- Rang d'une occurrence pour le motif x/n : compté depuis la première occurrence du créneau, retraits compris (ch. 09 : origine de l'index « à préciser »).
- « Toutes les occurrences à venir » supprime la Routine : aucune occurrence passée n'est stockée (D-013), Exécutions conservées (RM-050).
- Rendu, notifications et gestes non vérifiés sur iPhone (aucun appareil dans cette session).

## À CLARIFIER

1. **Carte du Calendrier.** Carte de séance partagée (vignette, Démarrer en pilule, heure en gras devant « N circuits · N exercices ») ; Figma `1992:5101` garde l'ancienne carte (lecture ronde, heure à droite). D-260 et la spécification du 27/10 disent « Calendrier sans visuel », le Figma courant affiche une vignette. *Exemple : « Renforcement du genou, 08:00 » — avec ou sans vignette, Démarrer en pilule ou en rond ?*
2. **Vue initiale.** RM-045 : l'onglet ouvre la vue Jour ; non livrée, l'onglet ouvre la Semaine.
3. **Valeurs initiales** (aucune règle) : heure pleine suivante si la date est aujourd'hui, sinon 08:00 ; répétition activée : chaque semaine, le jour de Début le, jusqu'au + 4 semaines ; rappel activé : 15 min (exemple Figma). *Exemple : planifier lundi à 9 h 20 propose 10:00.*
4. **Ordre initial d'une sélection** (CE-UI-04 §14) : ordre de sélection.
5. **Titre d'un parcours dans la bande** : « Alpha et Bravo », « Alpha et 2 autres » ; Figma montre un titre libre.
6. **Archivage d'une séance planifiée** (D-023, modale `4593:6285`) : non développé ; ses occurrences disparaissent simplement et reviennent si elle est restaurée.
7. **Fréquence, point ouvert 1** (plafond ou mise à jour de x) : non tranché. Comportement provisoire : pastilles libres, coche active seulement à x positions. Borne de n fixée techniquement à 10 (CE-UI-11 §14 : à spécifier). *Exemple : 2 fois sur 3, cocher les trois pastilles laisse la coche grise.*
8. **Texte de la notification** : titre = nom de la séance (« Alpha et Bravo » pour un parcours), corps « Séance prévue à 8 h. » ; aucune maquette. Fenêtre : 60 rappels sur 35 jours (limite iOS de 64).
9. Points déjà consignés, non tranchés : conversion jusqu'au ↔ pendant (deux valeurs indépendantes, sans conversion) ; unités Jour et Mois ; Programme (non affiché : écrans à concevoir, non demandé).

## Raccordements restant ouverts

- **Statut de réalisation (RM-048, D-064)** : Démarrer ouvre l'Exécution PRE-10, mais l'Exécution ne porte pas la Routine ni l'occurrence (`executions` sans colonne de Routine ; `ExecutionService.start` sans ce paramètre) ; fichiers en cours de changement sur `pre10-guidage` ; identité des réalisations d'un parcours à spécifier (API-ROU-07). Une occurrence démarrée en avance reste donc proposée à son horaire.
- **Migration des homonymes** du catalogue connecté : version 31.
- **Recette iPhone** : base portée en version 30 et nouveau module natif (`expo-notifications`). Ni Routine BMAD ni Routine Catalogue ne doivent servir sans décision (leur ligne ne lirait plus une base en version 30). Variante proposée : `development` (`com.ankusha.kodjo.dev`), à reconstruire avec EAS.

## Synchronisation code / documentation

- **A** (conformité) : comportements livrés, règles citées dans le tableau de cadrage.
- **C** (non arbitré) : points 1 à 8 ci-dessus, consignés ici ; aucun comportement promu en règle.
- **D** (technique) : `migration030` (trois tables, `reminder_minutes`, pas de clé étrangère vers `sessions`) ; fenêtre glissante de rappels ; unités paramétrables de `DurationWheelPicker` ; `onCreate` facultatif de `SessionCommandRow`. Décrits dans le code.
- Documents normatifs modifiés : aucun.

## Vérifications restant à faire sur appareil réel

Parcours court de recette sur iPhone (app à reconstruire, voir ci-dessus) :

1. Catalogue › Séances : glisser une séance › Planifier → « Planifier une séance », séance préremplie, titre à gauche. Régler la date (calendrier natif) et l'heure ; Répétition sur Non : récapitulatif « Planifiée le … à … h, sans répétition. » Coche.
2. Calendrier : la semaine montre une seule carte au bon jour, heure en gras ; un jour sans séance n'a pas de section.
3. Icône Planifier › « Catalogue des séances » : compteurs, recherche, filtre ; cocher deux séances › coche › « Planifier un parcours ».
4. Glisser la poignée de la seconde ligne vers le haut : l'ordre change. Toucher « à chaque fois » › « Fréquence » : 2 fois sur 3, pastilles 1 et 3, coche → la ligne affiche « 2 fois sur 3 ».
5. Répétition Oui : toucher « 1 » › stepper › 2 ; lundi et jeudi ; jusqu'au dans 5 semaines ; « jusqu'au » ↔ « pendant ». Coche. Dans le Calendrier : cartes lundi et jeudi une semaine sur deux, la seconde séance une occurrence sur trois manquante selon le motif.
6. Rappel : activer → demande système (première fois) ; accepter → 15' sélectionné ; Autre → roulettes heures/minutes → 0 h 20 → « 20' ». Refuser (nouvelle installation) → l'interrupteur revient à Non avec le message, la planification s'enregistre.
7. Planifier une séance 20 min plus tard avec rappel 15' : la notification arrive 15 min avant, application ouverte ou fermée.
8. Chevrons : semaine suivante, après la fin, « Aucune séance planifiée cette semaine. » ; Aujourd'hui revient.
9. Toucher un jour de la barre : sa section passe en tête ; défiler : le jour en tête devient sélectionné (fond violet).
10. Chevron d'une carte : récurrence « Chaque lundi » et composition ; toucher la carte : formulaire prérempli ; modifier l'heure.
11. Glisser une carte › Dupliquer : brouillon ; ✕ : rien de créé. Supprimer (unique) : Annuler puis Confirmer. Supprimer (répétée) : « Seulement cette occurrence » puis « Toutes les occurrences à venir ».
12. Fermer complètement l'application puis la rouvrir : planifications conservées. Démarrer : l'Exécution s'ouvre.
13. Texte agrandi : barre des 7 jours lisible à 360 pt, récapitulatif non chevauché.

## Fichiers modifiés

Voir `git show --stat` des commits de livraison.

## Commit final et état Git

Communiqués dans le message de livraison (hash du commit contenant ce rapport, `git status`).

## Complément du 16/11/2026 — build de recette

- Build EAS `development` 0096cd65 (commit db338226) en échec : `XCODE_BUILD_ERROR`, le profil AdHoc de `com.ankusha.kodjo.dev` n'a ni la capacité Push Notifications ni le droit `aps-environment`, ajouté d'office par le plugin d'`expo-notifications`.
- Correction (classe D, technique) : `app.config.js` retire `aps-environment` ; les rappels sont des notifications locales, sans push. Vérifié par `expo config --type introspect` : droits vides pour `development`, `bmad` et `production`.
- Effet à vérifier sur iPhone : demande d'autorisation et réception du rappel (cahier, section « Rappel »).
- Recette : Metro en réseau local `http://192.168.0.16:8083` (le tunnel Expo échoue au démarrage) ; cahier en ligne https://claude.ai/artifact/SbY2Ci9tcqVe3s9AiDBB84.

## Complément du 17/11/2026 — mise à jour depuis main

- Demande de Hermann (17/11) : faire entrer `main` dans la branche avant la recette, la planification n'entrant dans `main` qu'après la recette.
- `origin/main` (417 commits d'avance) fusionné dans `planification/main-20261113` (merge, sans rebase).
- `main` a pris la migration 030 (`catalogue_preferences`, grille du Catalogue des Mouvements, 16/11). La planification passe en **migration 031**, `DATABASE_VERSION = 31` ; tables et contraintes inchangées. Le catalogue connecté prendra la prochaine version libre.
- Conflits résolus : `manifest.json` (icône Planifier + icônes d'Exécution gardées), `package.json` / `package-lock.json` (`expo-network` de `main` + `expo-notifications`), `constants.ts`, `migrateDatabase.ts`, `migration030.ts` (version de `main`). Assertions de version courante des tests de migration : 30 → 31.
- Tests : `jest` 397 suites, 6 164 réussis, 32 ignorés ; `tsc` propre ; `eslint src app` : rien sur les fichiers de la branche (29 problèmes préexistants dans des fichiers de `main` non modifiés ici).
- Conséquence recette : `expo-network` est un nouveau module natif et la base installée par la build f3600cd7 est numérotée selon l'ancienne 030. **Supprimer Routine Dev de l'iPhone et installer une nouvelle build** (données de test).

## Complément du 18/11/2026 — toucher d'un rappel (recette)

- Écart de recette (Hermann, 18/11) : « lorsqu'une notification apparaît, cliquer dessus ne fait rien actuellement ». Décision : écran d'Exécution sans démarrage (« 1. Ok ») ; première Séance prévue à l'occurrence (« 2. A. »).
- Classe **B** : règle **RM-054b** (ch10), note technique ch12 §12.13, registre ch07 (section « Planification — toucher d'un rappel », numéro D- à attribuer à l'intégration dans `main`), annexes Index et Matrice.
- Code : le rappel emporte `sessionId` (première Séance retenue, motifs compris) ; `LocalNotifications.onReminderOpened` (réponse de lancement consommée une fois + écouteur, action par défaut seulement, dédoublonnage par identifiant) ; `ReminderOpenGate` monté dans `app/_layout.tsx` ouvre `/execution?sessionId=…`, sauf Exécution déjà ouverte.
- Tests : `reminders.test.ts` (séance emportée, « 1 fois sur 2 ») ; `ReminderOpenGate.test.tsx` (ouverture, Exécution en cours, désabonnement).
- Restent à vérifier sur iPhone : toucher avec l'application fermée, en arrière-plan et au premier plan. Les rappels programmés avant ce correctif ne portent pas la Séance : ils sont reprogrammés à l'ouverture suivante de l'application.

## Complément du 18/11/2026 — corrections de la recette iPhone du 17/11

- Point de départ : `ae83620e`. Résultats du cahier lus dans sa base (46 lignes : 8 KO, 13 constats généraux ; section « toucher d'un rappel » pas encore testée).
- Arbitrages de Hermann (18/11) : coche grisée tant que le rappel n'a pas de délai ; « Feuilles iOS » pour Planifier et Catalogue des séances ; « Roues natives d'heure » pour « Autre » ; texte de la notification : Hermann reformulera après explication des contraintes iOS (t6 en attente).
- Classe **B** : RM-047a (conversion jusqu'au ↔ pendant), RM-054c (rappel sans défaut, « Autre » par roues natives) ; CE-UI-04 §5/§9 (feuille, case ronde numérotée centrée, durée en 3e ligne) ; CE-UI-05 §7/§8/§9 (« Planifié le », fréquence seulement avec la répétition, feuille iOS, typographie unique Medium 14 hors titres, interrupteurs alignés, sélecteurs en noir) ; ch04 et PRODUCT (libellé) ; ch12 §12.13 ; registre ch07 (section « Planification — recette iPhone du 17/11/2026 ») ; annexes Index et Matrice.
- Classe **A** : d3 (dernier jour non décochable, CE-UI-05 §14), e3 (autorisation retirée dans Réglages → interrupteur sur Non, RM-053 ; relecture sans demande à l'ouverture et au retour au premier plan), f3 (réserve basse du Calendrier pour que la dernière section monte en tête, RM-046).
- Code : routes `planning` et `planning-selection` en `formSheet` (relais `planningSheetRelay`, `router.dismiss(2)` au ✕ d'une sélection initiale vide) ; `app/planning-reminder.tsx` supprimé ; `SessionCard` contexte `planning` (durée en ligne 3, place réservée à la case) ; `switchNudge` partagé (`src/shared/ui/switchNudge.ts`, repris du Profil, valeur inchangée ; `tokens.ts` intact, protégé par son empreinte) ; `ReminderScheduler.isPermitted`.
- Non réalisables avec les sélecteurs natifs iOS (consignés ch07/ch12, non contournés) : jour choisi du calendrier en fond plein / texte blanc ; mots « heure » / « minute » sur les roues. Le texte noir des sélecteurs (`foregroundStyle`) reste à vérifier sur iPhone.
- Tests : `PlanningScreen.integration` réécrit (sélection par relais, rappel sans défaut, roues, conversion, autorisation retirée), `PlanningSelection.test.tsx` (numérotation) ; suite complète : 399 suites, 6 171 réussis, 32 ignorés ; `tsc` propre ; `eslint` sans erreur sur les fichiers touchés.
- À vérifier sur iPhone : feuilles empilées (ouverture, ✕ sans contenu ferme les deux), alignement des interrupteurs, texte noir des sélecteurs, défilement du Calendrier jusqu'au dernier jour, e3 après retrait dans Réglages.

### Correctif du 18/11/2026 — feuille du Catalogue des séances (recette)

- Écart (Hermann, capture 10 h 21) : « Le catalogue des séances s'ouvre en modale mais avec un bug d'affichage. Et la fenêtre ne peut plus se fermer. »
- Cause probable (attribution plausible, non démontrée sur appareil) : la feuille « Catalogue des séances » était poussée au montage de « Planifier », pendant la présentation de cette feuille ; iOS l'a présentée seule sur le Calendrier, mise en page faussée, et `router.dismiss(2)` du ✕ visait une feuille absente.
- Correction (classe A, rejoint CE-UI-04/RM : sélection préalable, ✕ abandonne) : la sélection initiale s'affiche dans la feuille « Planifier » elle-même (✕ la ferme) ; la seconde feuille ne sert qu'à « Changer », sur une feuille déjà présentée. `closeAll` et `dismiss(2)` supprimés. Documentation : CE-UI-04 §9 garde « feuille posée sur Planifier » pour Changer ; registre ch07 inchangé (même demande).
- Tests : `PlanningScreen.integration` (sélection initiale dans la feuille, ✕ ferme Planifier une seule fois) ; planification 7 suites / 39 tests verts.
- À vérifier sur iPhone : ouverture de Planifier sur le Catalogue des séances, ✕, puis « Changer » (feuille par-dessus, mise en page et ✕).

### Correctif n° 2 du 18/11/2026 — feuille du Catalogue des séances (« Même problème »)

- Écart (Hermann, capture 10 h 39) : même affichage, ✕ inopérant, après le correctif `3787f7b6`. Bundle servi par Metro vérifié : il contenait bien le correctif ; la première hypothèse (présentation de deux feuilles) est donc infirmée comme cause principale.
- Cause (plausible, cohérente avec la capture et avec le constat déjà fait sur les feuilles de filtres le 04/11/2026, `FilterSheetPrimitives`) : dans une feuille `formSheet`, `react-native-screens` étend la liste défilante à toute la hauteur de la feuille ; la liste remonte derrière l'en-tête (transparent) et, posée après lui, capte le toucher du ✕.
- Correction (classe D, technique) : composant partagé `src/shared/ui/SheetFixedTop.tsx` — en-tête et zone de contexte posés par-dessus la liste, liste enveloppée, contenu décalé de la hauteur mesurée du haut, ajustement automatique des marges désactivé. Appliqué au Catalogue des séances et au formulaire Planifier (même structure).
- Tests : planification 7 suites / 39 tests verts ; `tsc` et `eslint` propres.
- À vérifier sur iPhone : liste sous la zone de contexte, ✕ et coche actifs, défilement derrière la zone fondue ; même chose dans Planifier et via « Changer ».

### Correctif n° 3 du 18/11/2026 — réemploi du patron existant (remarque de Hermann)

- Remarque de Hermann : « Mais n'est ce pas une réutilisation de ce qui a déjà été fait plusieurs fois ? N'as tu pas une fonction standard qui s'applique ? »
- Constat : aucun composant partagé, mais un patron établi dans les feuilles qui fonctionnent — « Utiliser un mouvement existant » (`MovementSelectionScreen`, même structure en-tête + zone de contexte de Catalogue + liste, `styles.body`) et les feuilles de filtres (`nativeScrollHost`, `collapsable={false}`) : la liste est enveloppée dans un conteneur `flex: 1` et n'est plus le premier élément de la feuille. `SheetFixedTop` (`87f25c8b`) réinventait une autre solution : **supprimé**.
- Correction (classe D) : Catalogue des séances et Planifier reviennent à leur mise en page de `3787f7b6`, liste enveloppée selon ce patron (décalage de la part fondue porté par l'enveloppe du Catalogue).
- Tests : planification 7 suites / 39 tests verts ; `tsc` et `eslint` propres. À vérifier sur iPhone comme au correctif n° 2.

### Correctif n° 4 du 18/11/2026 — patron complet des feuilles de filtres

- Contre-recette iPhone de `6777b886` (capture de Hermann) : dans Calendrier → Planifier, la liste du Catalogue des séances démarre encore sous l'en-tête et la zone de recherche. La première carte est masquée.
- Constat : le correctif n° 3 n'avait repris que la moitié du patron des feuilles de filtres. `FilterSheetFrame` (`FilterSheetPrimitives.tsx`, recette du 04/11/2026, même symptôme) fait deux choses : il enveloppe la liste (`nativeScrollHost`) **et** pose l'en-tête en absolu au premier plan (`nativeHeader`, `zIndex: 2`), avec un `paddingTop` de la liste égal à la hauteur mesurée de cet en-tête et `contentInsetAdjustmentBehavior="never"`. `SheetFixedTop` (`87f25c8b`) reprenait exactement ce dispositif. Sa suppression au correctif n° 3 était une erreur d'analyse de ma part.
- Correction (classe D) : `PlanningScreen.tsx`, `PlanningSelection.tsx` et `SheetFixedTop.tsx` reviennent à leur état de `87f25c8b`. Le commentaire de `SheetFixedTop` cite désormais `FilterSheetFrame`. `FilterSheetFrame` n'est pas modifié (acquis).
- Tests : planification 7 suites / 39 tests verts ; `tsc` et `eslint` propres. Jest ne reproduit pas la mise en page des feuilles iOS : la preuve reste la vérification sur iPhone.

## Complément du 18/11/2026 — contre-recette iPhone (cahier du 18/11) et analyse de la spécification des notifications

### Point de départ et périmètre

- Départ : `10acaaa4`. Résultats du cahier lus dans sa base (63 lignes) : KO k2c, k6, k8, k12, k13, k14 ; constats généraux du 17/11 relus — deux n'avaient pas été traités (déplacement des séances ; zone figée de « Changer »).
- Demande de Hermann : corriger les écarts ; vérifier la compatibilité de la spécification « Notifications de rappel de séance » (18/11/2026, fournie hors dépôt) avec iOS et Android ; étudier la photo du premier exercice dans la notification.

### Corrections

| Écart | Classe | Correction |
|---|---|---|
| Constat 17/11 « On ne peut plus déplacer les séances, l'appui long fait bouger l'écran… l'écran doit être figé » | A (CE-UI-05 §13) | Geste `Pan` natif activé après l'appui long sur toute la ligne (patron `useRowDrag` des blocs de la Composition), défilement coupé pendant le geste. [PanResponder de la poignée — remplacé.] |
| Constat 17/11 « changer ouvre le catalogue avec les séances déjà sélectionnées au dessus de la liste… » | B (CE-UI-04 §9) | Zone figée des Séances cochées, dans l'ordre, sous la zone de contexte ; la liste ne montre que les autres. Cocher une Séance l'ajoute en fin de zone (même règle, appliquée aussi à la première sélection). |
| k2c composants standards, halos, dégradé, titre centré | B (CE-UI-04 §9, CE-UI-05 §9) | Composant unique `NativeSheetTop` (`SheetFixedTop.tsx`) : `FixedHeader` de modale (titre centré), `ContextBand` fondue avec `backHalo` et nouveau `validateHalo` (halo sous la coche, `ScreenShell.tsx`). |
| k6, k8 date / heure | B (CE-UI-05 §9) | Valeurs affichées en Medium 14 noir ; un appui ouvre le voile partagé `WheelPickerOverlay` (fondu) : calendrier `DatePicker` graphique centré dans un panneau `ModalHeader`, ou roulette native `DurationWheelPicker` heures / minutes. |
| k12, k13 rappel | B (RM-054c révisée) | 15 min à l'activation ; « Autre » ouvre la roulette heures / minutes (pas de 5 min, 24 h) ; la valeur remplace « Autre » ; un délai standard rend « Autre ». |
| k14 redemande d'autorisation | — | Non réalisable : iOS ne présente la demande système qu'une fois par installation ; après un refus, seuls les Réglages la rétablissent. Proposition à Hermann : message KODJO avec un bouton qui ouvre directement la page Réglages de l'application. Non appliquée. |
| k13, taille « celle du texte "Progression" » | — | Texte de référence non trouvé sur l'écran Planifier. Question posée ; non appliqué. |

Documentation (classe B) : ch10 RM-054c ; ch13 CE-UI-04 §9, CE-UI-05 §8, §9, §13 ; ch12 §12.13 ; ch07 « Contre-recette du 18/11/2026 ».

Tests : `PlanningScreen.integration` (appui long puis glisser ; rappel 15 min par défaut et « Autre » ; date et heure dans le voile) ; `PlanningSelection.test` (zone figée) ; suite complète : 399 suites, 6 175 réussis, 32 ignorés ; `tsc` propre ; `eslint` sans erreur sur les fichiers touchés. Jest ne joue ni la mise en page native ni les gestes réels : vérification sur iPhone nécessaire (lignes k16 à k20 du cahier).

### Analyse de la spécification des notifications (18/11/2026)

Sources vérifiées : types `expo-notifications` 57.0.25 installés (`NotificationContentInput.attachments` marqué « @platform ios ») ; code actuel `ReminderScheduler.ts`, `ExpoLocalNotifications.ts`, `sessionCatalogueProjection.ts`, `domain/categories/defaults.ts`. Les références Apple / Android citées par la spécification n'ont pas été rouvertes ici ; les points qui en dépendent sont marqués « documentation système ».

**Compatible tel quel**

- Titre ≤ 30 et corps ≤ 40 caractères : repères Android, sans limite technique iOS ; les 50 titres du catalogue font au plus 29 caractères (calcul sur le texte de la spécification). Corps : les compléments laissent de 17 (« : ta première séance ! ») à 30 caractères (« t’attend. ») au nom ; au-delà, nom seul : règle applicable.
- Pas de sous-titre, pas de badge, pas de bouton d'action, rappel non critique (niveau d'interruption par défaut) : conformes à `expo-notifications`.
- Toucher → séance sans démarrage : déjà en place (RM-054b, écran d'Exécution sans Exécution créée).
- Catégories `CAT-*` : les dix identifiants de la spécification sont ceux de `defaults.ts` ; la projection du Catalogue dérive déjà les catégories des exercices.
- Familles jour (`MON`…`SUN`) et créneau (`MORNING`…`NIGHT`), `SINGLE` / `RECUR` (Répétition activée ou non) : calculables à la programmation.

**Écarts avec le produit actuel (décisions à prendre)**

1. *Parcours* : une occurrence KODJO peut contenir plusieurs Séances (une seule notification, titre actuel « A et B » / « A et n autres »). La spécification ne traite que des séances distinctes à la même heure. Il faut décider du corps d'un parcours (nom de la première Séance ? noms joints ?) et de l'accord (« t’attend » / « t’attendent », « est prête » / « sont prêtes »).
2. *FIRST* et *RESTART* supposent un historique des séances réalisées et manquées : KODJO ne conserve aujourd'hui aucune Exécution terminée (le noyau d'exécution est en mémoire). Ces familles ne sont pas réalisables avant cet historique.
3. *PROGRAM* : la notion de programme n'existe pas dans KODJO (la Routine et le parcours ne sont pas des programmes). Famille à retirer ou à redéfinir.
4. *Contenu figé à la programmation* : une notification locale est composée quand elle est programmée, pas quand elle s'affiche. Rotation, « déjà accomplie », absence et renommage ne sont pris en compte qu'à la reprogrammation suivante (ouverture de l'application, enregistrement). Conforme à l'étape 8 de la spécification si la reprogrammation suit aussi chaque Exécution terminée.
5. *Rotation persistée* : demande un stockage nouveau (derniers modèles utilisés) ; aucun aujourd'hui.
6. *Son* : le contenu actuel ne demande aucun son (`sound` absent). La spécification veut le réglage système : il faut passer `sound: "default"` (le réglage de l'utilisateur reste maître). Effet sur iPhone à vérifier.
7. *Android* : aucun canal de notification ni petite icône monochrome configurés aujourd'hui ; à prévoir si l'application est distribuée sur Android (non recetté à ce jour).
8. *Plafond iOS* (documentation système) : iOS ne garde que les 64 notifications locales programmées les plus proches. La fenêtre glissante actuelle doit rester en dessous ; à rappeler dans la spécification.

**Photo du premier exercice — faisabilité**

- iOS : réalisable avec une notification locale. `expo-notifications` accepte `attachments` (iOS seulement) : fichier local JPEG, PNG ou GIF (10 Mo au plus, documentation système). Le système *déplace* le fichier joint dans son propre stockage (documentation système) : il faut en copier une version par notification (cache de l'application) avant chaque programmation. La miniature s'affiche à droite de la bannière ; l'image entière quand on développe la notification.
- Android : non réalisable avec `expo-notifications` en SDK 57 (pièces jointes iOS seulement) ; il faudrait du code natif ou des notifications distantes.
- Source de la photo : les médias des exercices sont des fichiers locaux de l'application (`firstMediaPreviewSource`). Décisions nécessaires : (a) « premier exercice » strictement, ou premier exercice *qui a une photo* (règle déjà utilisée par la vignette de la carte du Catalogue) ; (b) premier média en vidéo : pas d'image, ou image extraite de la vidéo (module supplémentaire) ; (c) parcours : photo de la première Séance de l'occurrence.
- Non implémenté dans cette livraison : la spécification est une proposition en attente de validation, et les décisions (a) à (c) conditionnent le code.

### Vérifications restant à faire sur iPhone

k16 déplacement par appui long ; k17 zone figée ; k18 en-tête et zone de contexte standards (halos, dégradé, titre centré) ; k19 date et heure dans le voile ; k20 rappel 15 min et « Autre » ; k2d (liste sous la recherche) toujours ouverte.
