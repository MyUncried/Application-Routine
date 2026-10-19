# Epic 1 Context: Mes Exercices portent phases, charge et étapes, sans perte

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Donner au domaine un modèle complet pour PRE-5 avant toute interface : un Exercice (et la Séance qui le copie) porte des phases de travail, une charge en kg et une Description en étapes, enregistrées, relues, copiées et dupliquées sans perte, avec un minimum de 1 s pour toute durée strictement positive. Toute donnée PRE-4 reste lisible et ne perd aucun paramètre. La Phrase de synthèse décrit phases, charge et côtés de façon neutre, et l'indicateur de côté de la Composition perd sa direction. Aucune nouvelle interface dans la Feuille ni dans l'Éditeur : seule la roue de durée change, par l'effet de la borne de 1 s. Les Epics 2 (Feuille) et 3 (Éditeur) s'appuient sur ce socle.

## Stories

- Story 1.1 : Socle de données v3 : phases, charge, étapes et minimum de 1 s
- Story 1.2 : Phrase avec phases et charge, côtés neutres et indicateur de la Composition

## Requirements & Constraints

- **Phases** : 0 à 6 phases ordonnées, communes à toutes les séries ; identité stable, libellé de 1 à 20 caractères (points de code), durée entière ≥ 1 s. Le modèle admet une seule phase (le contrôle 2–6 relève de la Feuille). Uniquement en Mode Durée, Cible commune chiffrée, séries identiques. Avec phases, la durée de série vaut exactement la somme, comprise dans 1..3 535 s, sans arrondi ni tolérance. Durée de l'exercice inchangée dans sa formule : 6 s + 3 s, 3 séries, pause 15 s → 9 s par série, 72 s au total.
- **Charge** : en kg, activation distincte des valeurs ; commune en identiques, par ligne en variables ; valeurs conservées sous Sans, y compris après enregistrement et relecture ; absence lue comme Sans, jamais 0 kg ; ≥ 0, multiple de 0,25, sans plafond. Aucun effet sur cibles, durées, cadence, pauses, Condition d'arrêt et calculs, en Mode Durée comme en Répétitions, y compris à l'échec (cas Répétitions × Identiques, Répétitions × Variables, À l'échec avec charge exigés en tests).
- **Arrondi et zéro de la charge** : arrondi au 0,25 supérieur (1,3 → 1,5 ; 0,01 → 0,25 ; 1,25 → 1,25 ; 0 → 0) ; en identiques, 0 → Sans ; en variables, une ligne à 0 = sans charge pour cette série, toutes à 0 → Sans ; un zéro n'est jamais remplacé par une ancienne valeur ; réactivation sans valeur ou toutes nulles → 0,25 partout, sinon restauration telle quelle. Champ vide = 0 ; texte illisible ou négatif = valeur précédente conservée.
- **Étapes** : stockées dans la colonne de description existante, une étape par ligne, sans numéro ; étapes vides retirées ; limite de 1 000 caractères sur la chaîne encodée, séparateurs compris (validée par Hermann) ; aucune migration, conversion ni retour à l'ancien format (seule tolérance de perte admise du projet : les anciennes descriptions). Fins de ligne `\r\n` sans étape fantôme.
- **Côtés** : `RIGHT_LEFT` et `LEFT_RIGHT` historiques se lisent « Avec » et sont réécrits inchangés ; aucune réécriture des résultats historiques.
- **Condition d'arrêt dérivée** : jamais persistée, aucune valeur « Mixte » stockée. En variables, cellules vides non comptées ; sans ligne renseignée, aucun résultat (affiché « — »).
- **Minimum de 1 s** : seul le minimum de la durée cible passe de 5 à 1 s ; maxima, CHECK SQL 1..5999, maintien accéléré 1/5/10, bornes et grilles des pauses du Profil, T(1)..T(99), Répétitions 1..100 inchangés. Zéro reste permis là où il l'était (Pause, Compte à rebours, Fin).
- **Phrase** : charge après la valeur par série — `(charge : 20 kg)` ; `(charges : 20, 12, 13 kg)` jusqu'à trois séries ; `(charges : 20, 12 kg, ...)` au-delà ; valeurs dans l'ordre des séries, série à zéro listée, charges variables égales présentées en liste ; rien sous Sans. Phases : « **3 séries de 9 s** (Descente : **6 s** - Maintien : **3 s**), avec une pause après chaque série de **15 s**. », exhaustive même pour une phase. Ordre : phases puis charge, avant cadence et Pause. Côtés en forme neutre « côté 1 puis le côté 2 », identique pour les deux directions. Les 276 phrases existantes restent intactes, sauf la clause des côtés.
- **Non-régression** : aucun Exercice ni aucune Séance existants ne perdent de paramètre ; un comportement PRE-4 validé ne change pas sans décision ; aucune refactorisation justifiée par le seul PRD ; toute divergence avec un document généré est signalée, pas appliquée.
- **Contrôles** : chaque story se termine avec `npm test`, `npx tsc --noEmit`, `npm run lint` verts. Une suite verte ne prouve aucun rendu : recette iPhone groupée (roue au minimum 00:01 et relecture d'un Exercice PRE-4 au lot Feuille ; Phrase et Composition au lot Éditeur), aucun résultat d'appareil fabriqué.

## Technical Decisions

- **Format canonique v3, sans migration SQL** : `EXECUTION_PARAMETERS_VERSION` = 3 ; `DATABASE_VERSION` reste 10 ; `migration001` à `migration010` intactes. `serializeExecutionParameters` est le seul écrivain (repositories et Instantané) : forme v2 + `loadEnabled` à la racine (après `endSeconds`), `loadKg` et `workPhases` dans l'uniforme, `loadKg` dans chaque ligne, toujours écrits même à `false`, `0`, `[]`. `readExecutionParameters` est le seul lecteur : v2 → `readV2` (`workPhases: []`, `loadEnabled: false`, `loadKg: 0`) ; v3 → `readV3` strict ; autre → `ExecutionParametersDataError`. `readV2`/`serializeV2` utilisent la constante `EXECUTION_PARAMETERS_V2`. `serializeV2` sans appelant de production, lève une erreur sur phases ou charge, confiné par un test de garde. `EXERCISE_SNAPSHOT_VERSION` = 3, `parseExerciseSnapshot` lit 1, 2 et 3. Retour arrière applicatif non pris en charge (erreur explicite).
- **Types obligatoires** : `loadEnabled: boolean` racine ; `loadKg: number` sur `UniformSeries` et `SeriesRow` ; `workPhases: WorkPhase[]` (`{ id, label, durationSeconds }`) sur `UniformSeries` seulement. Nom de code `workPhases`, jamais `phases`. `WORK_PHASE_LIMITS = { maxCount: 6, controlMinCount: 2, labelMaxLength: 20, durationMin: 1 }` ; `controlMinCount` ne borne jamais la lecture ni `validateForSave`. Tous les constructeurs adaptés ; `normalizeEffective` à N = 1 reprend le `loadKg` de la 1re ligne avec `workPhases: []`. Égalité et clone profonds étendus ; toute construction de `SeriesRow` recopie `loadKg`.
- **Invariant des phases** validé par `validateForSave` et `readV3`, sans tolérance de ligne de base ; la projection scalaire d'un Exercice à phases donne Σ dans le CHECK.
- **Charge** : module unique `exerciseLoad.ts` (`roundLoadUp`, `normalizeLoad`, `reactivateLoad`, `formatLoadKg` seul formateur de kg au séparateur français, `parseLoadText` acceptant « , » et « . »). Contrôle structurel propre à la charge ; `checkStructuralNumber` inchangé ; `sameRowValue` et `alignRowsToBaseline` ignorent la charge.
- **Condition d'arrêt** : `stopConditionOf(parameters)` pure, seule autorité, sur l'état effectif, retournant `TARGET | FAILURE | MIXED | NONE`.
- **Étapes** : codec unique `instructionSteps.ts` (`decodeInstructionSteps` sur `/\r?\n/`, `encodeInstructionSteps` → `null` si vide, `splitStepAt`, `insertPastedText`, `instructionStepsLength` en points de code, seule mesure de la limite) ; `normalizeInstruction` inchangée ; l'Instantané ne porte pas de Description.
- **Brouillon (transport seulement)** : `openSheetDraft`, `plain`, `requestedParameters` portent `workPhases`, `nextPhaseId` (max id + 1, sinon 1), `loadEnabled`, `loadKg` dans toutes les lignes (actives, cachées, sauvegardées) ; aller-retour prouvé par test ; aucune transition nouvelle dans cet epic.
- **Borne** : seul `EXECUTION_BOUNDS.durationTarget.min` change (5 → 1) ; roues, position d'ouverture (00:01), pas et validations en dérivent ; adapter les tests listés par le rapport de propagation de la borne et corriger les commentaires « 5 s ».
- **Calculs intacts** : `workSeconds`, `projectScalars`, l'Inversion (N seul change), `computeIntrinsicDuration` et `executionCalculations.ts` non modifiés ; `LedgerSide` garde `NONE | RIGHT | LEFT` (interne).
- **Phrase** : `generateExecutionPhrase` reste le seul générateur en segments `{texte, gras}`, jamais persisté ; fonctions pures `workPhasesClause`, `loadClause`, point d'insertion unique, constante `VALUE_SUFFIX_ORDER`. Les fichiers du corpus 276 ne sont pas modifiés sur disque ; attendus neutres et nouveaux cas en fixtures littérales (`\r` retirés).
- **Preuves** : aller-retour sur `node:sqlite` réel (v2 relue Sans, réécriture v3, charge sous Sans conservée, phases avec `id`, côtés historiques inchangés) ; copies Définition → Séance, duplications et Instantanés isolés.
- **Conventions** : textes via `src/shared/i18n/` (« Set » proscrit) ; code en anglais, commentaires en français ; persistance par les repositories seuls ; `tokens.ts` inchangé ; gardes zéro `ScrollView` des roues intacts ; piège CRLF pris en compte.

## UX & Interaction Patterns

- Seul effet visible de la story 1.1 : roue « Durée d'une série » à 0 min proposant 01..59 ; 00:00 non validable.
- Indicateur de côté de la Composition sans direction (« D→G » / « G→D » supprimés) : seul son point de passage change, sans refonte ; rendu relevé en lecture seule dans Figma, en constantes locales nommées ; clés de lexique anatomiques devenues orphelines retirées.

## Cross-Story Dependencies

- 1.1 est atomique et ne dépend de rien : l'écriture v3 ne peut être livrée sans son lecteur ni sans le transport par le Brouillon.
- 1.2 dépend de 1.1 (modèle, `formatLoadKg`).
- L'Epic 2 (transitions du Brouillon, Feuille) et l'Epic 3 (Description en étapes, qui utilise le codec) dépendent de 1.1 ; l'Epic 3 peut avancer en parallèle de l'Epic 2 dès 1.1 livrée.
- Hors epic : transitions nouvelles du Brouillon, toute interface de phases, charge, côtés ou Condition d'arrêt, Description à l'écran ; moteur d'exécution des phases, formats et refonte de la Composition hors PRE-5.
