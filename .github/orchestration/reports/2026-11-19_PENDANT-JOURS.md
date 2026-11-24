# 2026-11-19 — Borne « pendant » pour l'unité jours

## Identification et objectif

- **Demande de Hermann (19/11/2026, au soir)** : « avec l'option "jour", l'option "pendant" n'est pas disponible, c'est à corriger ».
- **Écran** : Planifier, carte Répétition.
- **Branche** : `planification/ce-ui-12-20261118`, dossier `C:\Dev\KODJO-PLANIF-CE12`.
- **Commit de départ** : `02393670`.

## Constat

- **Unité semaines** : « jusqu'au » bascule vers « pendant » N semaines (D-331, recette du 19/11, d4).
- **Unité jours** :
  - l'écran affichait « jusqu'au » en texte fixe, sans bascule ;
  - le domaine (`RoutineRepetition` « DAY »), la lecture SQLite et le brouillon n'acceptaient que « jusqu'au » ;
  - passer en jours convertissait une borne « pendant » en « jusqu'au ».
- **Origine** : un choix écrit le 19/11 dans RM-257 et D-331 (« l'unité jours garde "jusqu'au" seulement »), que Hermann remplace aujourd'hui.

## Périmètre

- **Demandé** : rendre « pendant » disponible avec l'unité jours.
- **Traité** : exactement cela, de bout en bout :
  - domaine ;
  - occurrences ;
  - persistance (lecture) ;
  - brouillon ;
  - écran ;
  - synthèse et Journal.
- **Persistance** : aucune migration. Le schéma (`migration031`) accepte déjà `end_kind = 'FOR'` quelle que soit l'unité ; seule la lecture ignorait `FOR` pour `DAY`.

## Réalisation

- **Domaine** (`Routine.ts`) :
  - l'unité Jour accepte `end: RoutineEnd` (« jusqu'au » ou « pendant ») ;
  - nouvelle fonction `endDateForCount(unité, début, N)` :
    - semaines : N semaines civiles depuis celle de « Début le » (inchangé) ;
    - jours : N jours depuis « Début le » compris.
- **Occurrences, Journal** : la dernière date passe par `endDateForCount`, pour les deux unités.
- **Lecture SQLite** : `FOR` est relu aussi pour l'unité jours.
- **Brouillon** (`planningDraft.ts`) :
  - le nombre est compté dans l'unité courante (`countUntil`) ;
  - la bascule « jusqu'au » ↔ « pendant », le changement de nombre, de date de fin ou de « Début le » convertissent dans l'unité courante ;
  - **changement d'unité** : la borne garde sa forme et sa date de fin, et le nombre est recompté. Exemple : « pendant 3 semaines » depuis le lundi 5 août devient « pendant 21 jours ».
- **Écran** : la bascule « jusqu'au » / « pendant » s'affiche pour les deux unités. Le libellé après le nombre suit l'unité (« jour » / « jours »). C'est la même roulette en popover, de 1 à 520.
- **Synthèse et Journal** : « pendant 10 jours » (`duringLabel`).

## Hypothèses non démontrées

- **Décompte des jours** : « pendant N jours » compte N jours depuis « Début le », ce jour compris. C'est l'analogie avec les semaines comptées depuis la semaine d'ancrage. Aucune règle ne le fixe.
- **Bornes** : de 1 à 520 jours, les mêmes que pour les semaines. Aucune règle ne fixe de borne pour les jours.

## Tests

- **Ajoutés** :
  - `occurrences.test.ts` : « pendant 5 jours », tous les 2 jours, et « pendant 1 jour » ;
  - `journal.test.ts` : dernière date et ligne « Tous les jours · pendant 10 jours » ;
  - `PlanningScreen.integration.test.tsx` : unité jours → bascule « pendant » (29 jours), roulette réglée à 10, retour à « jusqu'au 14 août 2030 », enregistrement `{ unit: "DAY", end: { kind: "FOR", count: 10 } }`.
- **Ajusté** : le test d4, qui vérifiait « unité jours : jusqu'au seulement », vérifie maintenant la conversion 3 semaines ↔ 21 jours.
- **Résultats** :
  - planification (domaine, écrans, Journal), plus `migration031.routines` : 14 suites, 105 tests réussis ;
  - `tsc` propre ;
  - `eslint` propre sur les fichiers touchés.

## Synchronisation code / documentation

- **Classe B** (demande explicite de Hermann) :
  - chapitre 10, RM-257 : annotation datée ; texte d'origine conservé, marqué « remplacé ci-après » ;
  - chapitre 07 : annotation de remplacement sur la décision d4 du 19/11.

## Vérifications restant à faire sur iPhone

- Planifier, Répétition « tous les … jours » : la bascule « jusqu'au » ↔ « pendant » s'affiche ; le nombre s'ouvre dans la roulette ; « jour » / « jours » s'affiche après le nombre.
- La conversion fonctionne quand on change d'unité.
- Enregistrer, rouvrir : « pendant N jours » est conservé.
- Le Journal affiche « pendant N jours ».

## Fichiers modifiés

- `src/domain/planning/{Routine,occurrences}.ts`
- `src/features/planning/{planningDraft,PlanningScreen,planningSummary,journal}.ts(x)`
- `src/infrastructure/database/repositories/SqliteRoutineRepository.ts`
- Tests :
  - `src/domain/planning/__tests__/occurrences.test.ts` ;
  - `src/features/planning/__tests__/{journal.test.ts,PlanningScreen.integration.test.tsx}`.
- Documentation : chapitres 07 et 10.

## Commit et état Git

- Voir le message de clôture : hash du commit, branche non poussée, non fusionnée.
