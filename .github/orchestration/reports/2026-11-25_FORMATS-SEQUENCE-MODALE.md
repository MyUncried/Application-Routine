# Formats — séquence d'ouverture et modale « Paramètres d'exécution » selon le contexte (25/11/2026)

## Identifiant et objectif

- **Mission** : « Claude Code — Formats : séquence d'ouverture et modale « Paramètres d'exécution » selon le contexte (25/11/2026) ».
- **Décisions** : D-568, D-569 et D-570 de Hermann, rédigées sur la branche de documentation `docs/planification-grille-creneaux` (lue, non fusionnée) :
  - § 9.6 et § 9.7 de `docs/KODJO-Formats-entrainement-2026-11-02.md` ;
  - registre ch07.
- **Renumérotation** : les numéros D-568 à D-570 sont déjà pris sur main (Agenda). Ils deviennent **D-603, D-604 et D-605**. C'est une collision technique, tranchée sans arbitrage. Le numéro libre suivant est D-603, puisque D-600 à D-602 sont utilisés par les branches de la carte de séance.

## Branche et commit de départ

- **Branche** : `feat/formats-sequence-modale-20261125`.
- **Base** : `origin/main` au commit `a48622d3`.
- **Worktree** : `C:\Dev\KODJO-FMODALE`, avec une jonction `node_modules` vers `C:\Dev\KODJO-FORMATS\node_modules`.

## Périmètre demandé

1. **Séquence d'ouverture.** À la première ouverture des dix formats, le choix des mouvements (mode catalogue du format) s'affiche en premier. Le questionnaire reste accessible par le lien du haut, « Paramètres ». Aucun nouvel écran.
2. **Modale « Paramètres d'exécution » d'un exercice déjà dans la séance** (ouverte depuis l'écran du format ou depuis la Composition) : seuls les champs utiles selon le format.
3. **Sortie d'un format** : l'exercice prend les champs et les valeurs par défaut d'un exercice libre. **Entrée d'un exercice libre** : il présente les champs du format ; ses autres valeurs sont conservées, masquées et inactives, puis réapparaissent à la sortie.
4. **Recouvrement (D-570 → D-605)** : la modale du format recouvre entièrement la modale « Formats d'entraînement ». La feuille native iOS est conservée.
5. **Hors périmètre** : exercices libres hors déplacement, calcul des durées, exécution.
6. **Tests** : listés dans la demande.

## PRESERVE / CHANGE / FORBIDDEN (établi avant le code)

**PRESERVE**
- Exercice libre : modale complète, inchangée. Aucune ligne n'est retirée sans contexte de format.
- Feuilles natives iOS (`formSheet`), leurs hauteurs et leurs ancrages, sauf à l'ouverture d'un format depuis la fenêtre des formats.
- Réouverture « Modifier le format » depuis la Composition : route `/format-summary`, ouverture sur les paramètres.
- Choix « Conserver le format » à la sortie d'un circuit porteur.
- Calcul des durées et exécution.
- Mode catalogue du format : fondus, filtres, piles, « Fermer sans sélectionner ».

**CHANGE**
- État initial de l'écran du format.
- Libellé du lien du haut.
- Lignes de la modale selon le contexte.
- Sortie libre d'un format et entrée d'un exercice libre.
- Présentation à l'ouverture d'un format depuis la fenêtre des formats.

**FORBIDDEN**
- Feuille réimplémentée.
- Migration de base de données.
- Nouvel écran.
- Réécriture hors périmètre.

**Démonstration**
- Diff limité aux fichiers listés plus bas.
- Aucune primitive remplacée : la feuille native des formats est réutilisée et son contenu remplacé.
- Aucune migration : `freeValues` est un état du brouillon.
- Suites voisines vertes : exercice libre (`ExerciseScreen*`, `ExerciseEditingPaths`, `ActivityEditorForm`), Composition (`CompositionScreen.*` formats), réouverture (c3, test « (e) D-604 »).

## Constats

- **Écran du format.** Depuis le 15/11, les formats n'ont plus de questionnaire séparé : un écran unique de paramètres, avec un mode « choix des mouvements » ouvert par « + Ajouter ». Le « questionnaire » de la demande désigne ces paramètres.
- **Présentation.** La modale du format était une seconde feuille native (`/format-summary`) empilée sur la fenêtre des formats (`fitToContents`, haut à 103). Elle laissait voir les bords de cette fenêtre.
- **Filtrage existant.** La modale n'était filtrée que pour EMOM, AMRAP, Death by et For time (`formatSheetContextOf`), sur l'ancienne liste de lignes.
- **Départs rapides sans format porté.** Tabata, 30/30, Renforcement, Progression, À l'échec et Superset ne portent pas de format sur l'exercice. Seul un Circuit garde le modèle d'origine (`originModel`). Un exercice seul issu d'un départ rapide n'en garde aucune trace.
- **Sortie libre.** Elle conservait les « paramètres compatibles » (PRE-9 C.4).
- **Conflit 1 — unité.** Depuis le 16/11, l'unité (Répétitions ou Durée) des mouvements de Renforcement, Progression, À l'échec et Superset ne se choisit que dans cette modale. Appliquer « Charge et De chaque côté » à la lettre empêcherait de compléter ces formats.
- **Conflit 2 — séries du buy-in.** Depuis le 16/11, le nombre de séries d'un buy-in ou d'un buy-out For time ne se réglait que dans la modale. D-604 et la maquette `11312:19895` le remplacent par « Nombre de répétitions ».

## Modifications réalisées

- **Séquence (D-603 / D-604)** — `FormatModelScreen.tsx`
  - Sans `circuitId` (première ouverture), l'écran s'ouvre en mode catalogue, section des mouvements, sans fondu d'entrée.
  - La réouverture reste sur les paramètres.
  - Libellé `backToParameters` : « Paramètres » en français, « Settings » en anglais.
- **Recouvrement (D-605)** — `app/formats-window.tsx`
  - Choisir un format remplace le contenu de la même feuille native par `FormatModelScreen` (nouvelles props `model` et `onClose`).
  - Le cran de la feuille passe de `fitToContents` à celui des modales de format (haut à y = 95), via `Stack.Screen options`.
  - La croix du format rend le contenu de la fenêtre, de nouveau `fitToContents`.
  - Plus de `/format-summary` empilé depuis la fenêtre. La route reste pour « Modifier le format ».
- **Modale (D-604)** — `ExecutionParametersSheet.tsx`
  - **Format porteur** (`format` présent : EMOM, AMRAP, Death by, For time). Retirés : Phases, Cadence et Durée de l'exercice (cadre Cadence entier, Compte à rebours et Fin compris), Durée de l'exercice du format, durée maximum, durée héritée, durée en lecture seule, Pause, Pause entre les côtés, Récupération. La ligne Séries disparaît sauf pour le For time hors buy-in et buy-out ; elle est aussi gardée si un tableau de séries variables existe déjà. La Récupération n'est plus réappliquée au ✓.
  - **Départ rapide** (nouvelle prop `quickFormatName`, nom du format dans le titre) : Charge et De chaque côté seulement. La ligne Mode reste pour les formats à unité libre (`quickFormatUnitOpen`, interprétation à confirmer).
  - Séparateurs recalculés pour ne jamais ouvrir un cadre par un trait.
  - Ordre du clavier sans les champs masqués.
- **Contexte** — `formatSheetContext.ts`
  - Nouveau `quickFormatOf(draft, exerciseId, model?)`.
  - Branché à la Composition (`useMovementExerciseIntake.tsx`) et à l'écran du format.
- **Sortie et entrée (D-604)**
  - `SessionDraft.ts` : `freeValues` (état du brouillon, non persisté).
  - `carrierMembership.ts` : `withFreeValues` et `freeExerciseOf`. `exitCarrier(…, "FREE")` donne désormais les valeurs libres conservées, sinon les valeurs par défaut.
  - `layoutOperations.ts` (`settleLayoutCircuitMembership`) :
    - entrée d'un exercice libre dans un circuit porteur ou de départ rapide : valeurs libres conservées ;
    - sortie d'un circuit de départ rapide : `freeExerciseOf`.
- **Documentation (classe B)**
  - Registre ch07, section « Formats — séquence d'ouverture et modale … (25/11/2026) » : D-603, D-604, D-605, avec les interprétations à confirmer.
  - `KODJO-Formats-entrainement-2026-11-02.md` : §§ 9.6 et 9.7 reportés de la branche de documentation et renumérotés.
  - Annotations datées ajoutées au tableau des Circuits porteurs (§ 6 point 5), à la modale For time, à l'EMOM et à « Adopter un format libre » (§ 13).

## Preuves et tests

Toutes les suites ont été lancées en série (`-w 1`).

**Commandes**
- `npx tsc --noEmit -p .` : propre.
- `npx eslint` sur les fichiers modifiés : propre, sauf une erreur antérieure non touchée (`FormatModelScreen.c3.test.tsx:123`, `react-hooks/refs`, `useState(draftRef.current)` dans le harnais d'origine).

**Nouveaux tests**
- `FormatModelScreen.d603.test.tsx` (17) :
  - première ouverture des **dix formats** sur le choix des mouvements ;
  - lien « Paramètres » vers les paramètres, sans ajout ;
  - ajout depuis le choix initial ;
  - modale des six départs rapides : Charge et De chaque côté, Mode si l'unité est libre, nom dans le titre, lignes absentes.
- `formatSheetContext.d604.test.ts` (8) : contexte depuis la Composition (circuits de départ rapide, circuit standard, exercice seul, circuit porteur).
- `formatsWindowRoute.test.tsx` (10 cas D-605) : pour chacun des dix formats, le contenu est remplacé, aucune feuille n'est empilée (`push` jamais appelé), le cran passe à y = 95, et la croix rend la fenêtre en `fitToContents`.
- `carrierMembership.c4.test.ts`, déplacements réels (`moveLayoutItem`) :
  - Tabata, exercice créé dans le format puis sorti : valeurs par défaut ;
  - Tabata, exercice libre entré puis sorti : valeurs retrouvées ;
  - For time, entrée, « Adopter un format libre » (valeurs retrouvées) et « Conserver » (valeurs gardées masquées) ;
  - For time, exercice créé dans le format puis rendu libre : valeurs par défaut.

**Tests adaptés à D-603 / D-604**
Les anciennes assertions sont remplacées ou désactivées avec une annotation « remplacé ».
- `ExecutionParametersSheet.format0711` : 26 tests.
- `FormatModelScreen.c3` : 24 tests (33 désactivés, déjà là). Au passage par le choix initial s'ajoutent le buy-in en Nombre de répétitions et le test « (e) D-604 ». L'ancien « (e) » est conservé, désactivé.
- `r0711` : 14 tests. Le choix initial est quitté, puis rouvert par « + Ajouter ».
- `emomSerieTour` : 3 tests. Plus de ligne Séries dans la modale EMOM.
- `tableauUnique` : 39 tests. Le nombre de séries se règle par sa ligne.
- `maxD531`, `xdedans` : aide « choix initial quitté ».

**Suites voisines vertes**
- Domaine sessions : `layoutMoves*`, `layoutOperations*`, `recette3.circuits`, `forTime.*`, `circuitRoles.reprise0411`, `layoutStopPoints.b6`, `supersetLimit`.
- Modale : `ExecutionParametersSheet.*` (11 suites, 430 tests au premier passage, dont 12 à adapter, adaptés depuis).
- Composition et exercice : `CompositionScreen.{b3,b4,b4b,b5,carteExercice0811,circuitActions0411,emom0711,envelopeFormat,forTimeRepetitions,recette3circuits,supersetLimit}`, `ExerciseScreen*`, `ExerciseEditingPaths`, `ExerciseEditorNoWrite`, `ExerciseRecovery`, `CompositionPausesFlow`, `ActivityEditorForm`.
- Formats, routes et textes : `formats.recette0511/0611/0811`, `FormatsWindow.c2`, `rootLayoutGesture`, `creationLayout`, `sessionFormats.c1`, i18n (9 suites).

**Non exécutés**
- La suite complète, pour ménager la mémoire de la machine : des processus ont été arrêtés pour manque de mémoire pendant la session.
- Aucun contrôle visuel. Une suite verte ne prouve pas le rendu sur iPhone.

## Hypothèses non démontrées et interprétations à confirmer par Hermann

1. **Ligne Mode des départs rapides à unité libre** (Renforcement, Progression, À l'échec, Superset) : gardée dans la modale. Sans elle, l'unité ne peut plus être choisie et ces formats ne peuvent plus être enregistrés. Tabata et 30/30 : Charge et De chaque côté seulement.
2. **For time, buy-in et buy-out** : Nombre de répétitions à la place de Séries, selon la maquette. Le nombre de séries d'un buy-in ou d'un buy-out ne se règle donc plus nulle part. Un buy-in à séries variables déjà saisi garde sa ligne et son tableau.
3. **Pause entre les côtés** : retirée avec les autres pauses, dans tous les formats.
4. **Valeurs par défaut à la sortie** : celles d'un nouvel exercice, avec le Compte à rebours et la Fin du Profil gardés, sans Récupération. Les durées de phases du Mouvement ne sont pas reprises : le Mouvement n'est pas lu à ce moment.
5. **Exercice seul issu d'un départ rapide** (un seul mouvement) : aucune trace de son format. Depuis la Composition, il a la modale d'un exercice libre. Depuis l'écran du format, il a la modale du départ rapide.
6. **Valeurs libres conservées** (`freeValues`) : non enregistrées avec la séance. Elles valent pendant la composition en cours ; après réouverture d'une séance enregistrée, la sortie donne les valeurs par défaut.
7. **« Inactives »** : aucune modification de l'exécution, hors périmètre. Les valeurs masquées d'un exercice dans un format (cadence, phases…) restent dans ses paramètres comme avant.
8. **Recouvrement** : le changement de cran d'une feuille native ouverte (`fitToContents` vers le cran des formats, et retour) est supposé animé par iOS. Seul l'iPhone peut le confirmer.

## Éléments non corrigés ou hors périmètre

- Exécution des valeurs masquées (hors périmètre).
- Calcul des durées (hors périmètre).
- Lint antérieur de `FormatModelScreen.c3.test.tsx:123`.

## Vérifications sur appareil réel

- Ouverture de chacun des dix formats depuis « Formats d'entraînement » :
  - aucune partie de la fenêtre des formats visible, ni en haut ni sur les côtés ;
  - de même à la fermeture (croix du format) et au retour à la fenêtre ;
  - transition du cran.
- Première ouverture sur le choix des mouvements, lien « Paramètres ».
- Modales par format, depuis l'écran du format et depuis la Composition.
- Déplacement d'un exercice hors d'un Tabata ou d'un For time, puis retour.

## Fichiers modifiés

- **Application**
  - `app/formats-window.tsx`
  - `src/features/sessions/FormatModelScreen.tsx`
  - `src/features/activities/ExecutionParametersSheet.tsx`
  - `src/features/sessions/formatSheetContext.ts`
  - `src/features/sessions/useMovementExerciseIntake.tsx`
  - `src/domain/sessions/SessionDraft.ts`
  - `src/domain/sessions/carrierMembership.ts`
  - `src/domain/sessions/layoutOperations.ts`
  - `src/shared/i18n/resources/fr.ts`
  - `src/shared/i18n/resources/enScreensActivities.ts`
- **Tests**
  - `app/__tests__/formatsWindowRoute.test.tsx`
  - `src/domain/sessions/__tests__/carrierMembership.c4.test.ts`
  - `src/features/activities/__tests__/ExecutionParametersSheet.format0711.test.tsx`
  - `src/features/sessions/__tests__/FormatModelScreen.{c3,emomSerieTour,maxD531,r0711,tableauUnique,xdedans}.test.tsx`
  - nouveaux : `FormatModelScreen.d603.test.tsx`, `formatSheetContext.d604.test.ts`
- **Documentation**
  - `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
  - `docs/KODJO-Formats-entrainement-2026-11-02.md`
  - ce rapport

## Commit final et état Git

Les valeurs sont dans le message de livraison : le hash du commit qui contient ce rapport ne peut pas figurer dans le rapport lui-même.
