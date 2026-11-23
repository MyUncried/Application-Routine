# Rapport de mission — PROGRAMME-RECETTE (23 novembre 2026)

## Identifiant et objectif

- **Mission :** `PROGRAMME-RECETTE`.
- **Objectif :** vérifier par rapport aux décisions, reformuler et documenter les remarques de Hermann après la recette du Programme ; rédiger le prompt de développement.
- **Hors périmètre :** code applicatif, Figma.

## Branche et commit de départ

- **Branche :** `docs/agenda-seances-journal-filtre-20261121` (PR #448).
- **Commit de départ :** `f0866dd3`.

## Constats (vérification par rapport aux décisions)

| Remarque | Décisions existantes | Résultat |
|---|---|---|
| a. Bande du programme sans créneau | D-554 : routines ayant un créneau dans la semaine ; D-559 : programme sans groupe → Journal | Évolution, D-561 |
| b, c. Onglet d'arrivée | Aucune | Nouvelle règle, D-562 |
| d. Période en un calendrier | D-548 : dates modifiables d'un toucher ; code : `DatePicker` natif par date | Évolution, D-563 ; calendrier natif `UICalendarView`, pas d'exception aux primitives natives |
| e. Occurrences dans la période | ch04 : « la fenêtre du programme borne les dates » ; rattachement des occurrences « à concevoir » | Conforme au principe, précisé : D-564, RM-275 ; limite d'un programme par routine (option A, Hermann) |
| f. Rebond du glisser | Aucune | D-565 |
| g. Espacement des actions | D-546 (actions), aucune mesure | D-565 |

- **Source absente de la branche :** la spécification Programme du 20/11 est sur `main` (PR #447), pas sur cette branche. Les compléments sont dans un document séparé qui la cite. **À reporter lors de la fusion** : annotation de la spécification Programme § 3 (suppression bornée à la période) et § 4 (période dans un seul calendrier). Préparé, non appliqué.
- Identifiants D-561 à D-565 et RM-275 vérifiés libres sur toutes les branches distantes.

## Synchronisation code / documentation

- **Classe B** : D-561 à D-565, RM-275.
- Code concerné (`feat/plan-20261121`), non modifié : `PlanScreen`/`planWeek`, navigation du calendrier, `ProgramSheetScreen`, actions glissées, suppression d'un programme.

## Preuves et tests

- Aucun test applicable (mission documentaire). `git diff --check`, liens Markdown relus.

## Hypothèses non démontrées

- `UICalendarView` (iOS 16+) exige un module natif Swift : faisabilité à confirmer par le développement.

## Vérifications restant à effectuer sur appareil réel

- Lisibilité des repères de période ; arrêt net du glisser.

## Fichiers modifiés

- Créé : `docs/KODJO-Programme-recette-2026-11-23.md`, ce rapport.
- Modifiés : registre ch07, ch10, `docs/DSF-PLAN-2026-11-21.md`, `docs/INDEX.md`.

## Commit final et état Git

Donnés dans le compte rendu de livraison.
