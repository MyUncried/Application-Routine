import {
  computeEstimatedDurationSeconds,
  computeTotalDurationSeconds,
  computeZoneDurationFacts,
} from "@/domain/sessions/calculations";
import { DEFAULT_TOUR_REPEAT_COUNT, DEFAULT_TOUR_SIDE_MODE } from "@/domain/sessions/defaults";
import type { SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { sideMultiplier, type SideMode } from "@/domain/sessions/sideMode";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";
import { formatActivityCount, formatEstimatedDuration } from "@/features/sessions/formatSessionSummary";
import { formatTwoDigits, fromTotalSeconds } from "@/features/sessions/wheelPickerMath";
import { strings } from "@/shared/i18n";

/**
 * Fonctions de présentation pures de l'écran Composition (T01-S07),
 * séparées de `resources/fr.ts` pour la même raison que
 * `formatSessionSummary.ts` (T01-S06) : ce fichier reste un arbre de
 * chaînes statiques, sans logique d'assemblage ni d'arrondi.
 */

export type CompositionSummaryFacts = {
  /** Collection ORDONNÉE d'Activités (`SessionDraft.exercises`, complétion REWORK12) — remplace l'ancien champ `exercise` singulier. */
  readonly exercises: readonly SessionDraftExercise[];
  /**
   * T02-S01 (D-058/CE-T02-01) : répétition du Tour, entier `1..99`. Champ
   * optionnel — `DEFAULT_TOUR_REPEAT_COUNT` (`1`) par défaut, valeur pour
   * laquelle la synthèse est rigoureusement identique à celle de T01 (les
   * Activités du Tour ne sont alors multipliées par rien).
   */
  readonly tourRepeatCount?: number;
  /**
   * V2-BILAT-01 : direction du Tour, entier optionnel — `DEFAULT_TOUR_SIDE_MODE`
   * (`UNILATERAL`) par défaut, valeur pour laquelle la synthèse reste
   * rigoureusement identique à celle d'avant cette tranche (chaque Activité
   * conserve alors sa propre direction, jamais celle du Tour).
   */
  readonly tourSideMode?: SideMode;
};

/**
 * Résumé `N activités · durée estimée` sous `Nombre de tours` (§9 du plan
 * T01-S07 ; mode Répétitions ajouté en T01-S08, arbitrage B ; Séries/Pause
 * après Série corrigées en T01-S08, revue PR #9 —
 * https://github.com/MyUncried/Application-Routine/pull/9#pullrequestreview-5043917736 ;
 * généralisée à plusieurs Activités — complétion REWORK12, 2026-09-04).
 *
 * **REWORK13 (R13-02, `[ChatGPT] CHANGES_REQUESTED — REWORK13 —
 * typographie Nom d'activité + périmètre synthèse Tour`, 2026-09-04 ;
 * `.github/orchestration/reports/2026-09-04_activity-name-typography-tour-
 * summary-scope.md`)** : `initialCountdownSeconds`/`finalPhaseSeconds`
 * retirés de `CompositionSummaryFacts` et de la formule — cette synthèse
 * compte et totalise EXCLUSIVEMENT les Activités du Tour ; `Compte à
 * rebours initial` et `Fin de séance` sont des éléments STRUCTURELS hors
 * Tour, toujours exclus de sa durée (confirmer l'un ou l'autre
 * sélecteur n'actualise donc plus jamais cette synthèse, seulement sa
 * propre carte — par construction, ces champs n'étant plus lus ici). Les
 * autres règles de calcul (durée estimée globale du plan, chapitres 09/10)
 * ne sont pas concernées par ce changement : elles décrivent un total
 * différent, jamais cette synthèse locale.
 *
 * État vide (`exercises.length === 0`) : chaîne locale et complète
 * `"0 activité · 0 min"` (arbitrage V2) — n'appelle jamais
 * `formatActivityCount(0)`, qui produit délibérément `"0 activités"`
 * (pluriel) pour le Catalogue et reste inchangé.
 *
 * État non vide : chaque Activité contribue sa propre durée estimée, SOMMÉE
 * — mode Durée (RM-036/RM-037/RM-071), une Série répète la durée de
 * l'Exercice puis sa Pause après Série éventuelle (RM-036) ; chaque Pause
 * après Série génère une Récupération technique comptée dans la durée
 * estimée (RM-037/RM-071) — d'où, par Activité,
 * `seriesCount × durationSeconds + seriesCount × pauseSeconds`. Mode
 * Répétitions (RM-072) : aucune durée conventionnelle n'est attribuée à
 * l'Exercice lui-même, mais ses Pauses après Série restent comptées
 * (`seriesCount × pauseSeconds`) — dès qu'AU MOINS UNE Activité de la
 * collection est en mode Répétitions, la durée totale devient une borne
 * minimale, précédée de `≥` (jamais présentée comme une valeur exacte, même
 * si d'autres Activités de la même Composition sont en mode Durée). Arrondi
 * à la minute supérieure via `formatEstimatedDuration` (`Math.ceil`,
 * RM-101, inchangé), appliqué une seule fois à la somme totale des
 * Activités.
 *
 * **T02-S01 (CE-T02-01 « Calculs », AC-10/AC-11)**, puis **correctif T02
 * post-test-utilisateur** (2026-09-08) — quatre évolutions, la formule par
 * Activité restant inchangée :
 *
 * 1. **Cette synthèse est celle du Tour lui-même**, pas celle de la
 *    Composition entière : seules les Activités `IN_TOUR` y contribuent,
 *    aussi bien pour le NOMBRE que pour la DURÉE. Les Activités
 *    `BEFORE_TOUR`/`AFTER_TOUR` en sont exclues à la source du calcul (elles
 *    restent comptées dans le Catalogue par `computeActivityCount`,
 *    `calculations.ts`, qui lui couvre bien les trois zones — métrique
 *    distincte, jamais réutilisée ici). Le correctif remplace la version
 *    T02-S01 de cette fonction, qui sommait par erreur `facts.exercises`
 *    (les trois zones) pour le nombre et pour la part `BEFORE_TOUR`/
 *    `AFTER_TOUR` de la durée ;
 * 2. la durée `IN_TOUR` est multipliée par `tourRepeatCount` (« développe les
 *    répétitions du Tour ») ;
 * 3. le NOMBRE affiché reste celui des Activités `IN_TOUR` réellement
 *    composées — chacune une seule fois, jamais multipliée par
 *    `tourRepeatCount` (clarification n° 2 du verdict de revue T02-S01,
 *    désormais bornée à la zone du Tour) ;
 * 4. le mode « À l'échec » déclenche désormais la borne minimale `≥` au même
 *    titre que le mode Répétitions (AC-11/D-112) — il ne la déclenchait pas,
 *    alors qu'il ne porte lui non plus aucune durée conventionnelle ; une
 *    Récupération contribue sa seule durée (D-041), sans Séries ni pause.
 *
 * `Compte à rebours initial` et `Fin de séance` restent exclus (REWORK13,
 * R13-02, inchangé).
 */
export function formatCompositionSummary(facts: CompositionSummaryFacts): string {
  const inTourExercises = facts.exercises.filter(
    (exercise) => exercise.structuralPosition === "IN_TOUR",
  );

  if (inTourExercises.length === 0) {
    return strings.screens.composition.summary.empty;
  }

  // **T02-S02** : la durée d'UNE occurrence du Tour est calculée par la
  // fonction du Domaine (`computeZoneDurationFacts`), jamais par une boucle
  // équivalente locale — c'est elle qui porte la formule canonique
  // canonique CONDITIONNELLE (voir `computePauseOccurrences` : la
  // Récupération remplace la dernière Pause) et la détection de borne
  // minimale. La parité
  // Domaine / présentation est ainsi vraie PAR CONSTRUCTION, plus seulement
  // par ressemblance de deux implémentations.
  const inTourOccurrence = computeZoneDurationFacts(
    inTourExercises,
    facts.tourSideMode ?? DEFAULT_TOUR_SIDE_MODE,
  );

  const totalSeconds = computeEstimatedDurationSeconds({
    beforeTourDurationSeconds: 0,
    inTourDurationSeconds: inTourOccurrence.seconds,
    afterTourDurationSeconds: 0,
    tourRepeatCount: facts.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT,
    isLowerBoundEstimate: inTourOccurrence.isLowerBoundEstimate,
  });

  const formattedDuration = formatEstimatedDuration(totalSeconds);
  const durationLabel = inTourOccurrence.isLowerBoundEstimate
    ? `≥ ${formattedDuration}`
    : formattedDuration;

  return `${formatActivityCount(inTourExercises.length)}${COMPACT_LIST_SEPARATOR}${durationLabel}`;
}

/**
 * Valeur affichée sur une ligne `Compte à rebours initial`/`Fin de séance`
 * (Composition) ou `Durée`/`Pause après Série` (Exercice, T01-S08) avant
 * ouverture du sélecteur, ex. `"00 min 10 s"`. `maxTotalSeconds` par défaut
 * inchangé (3599, V1, Composition) ; l'écran Exercice passe explicitement
 * `WHEEL_EXERCISE_DURATION_SECONDS_MAX`/`WHEEL_PAUSE_SECONDS_MAX` (5999).
 */
export function formatDurationRowValue(
  totalSeconds: number,
  maxTotalSeconds?: number,
): string {
  const { minutes, seconds } = fromTotalSeconds(totalSeconds, maxTotalSeconds);
  return `${formatTwoDigits(minutes)} min ${formatTwoDigits(seconds)} s`;
}

export type ExerciseRowSummaryFacts = {
  readonly executionMode: SessionDraftExercise["executionMode"];
  readonly durationSeconds: number | null;
  readonly repetitionCount: number | null;
  readonly seriesCount: number;
  readonly pauseSeconds: number;
  /**
   * V2-BILAT-01 (plan `## UI`, « Composition cards and summaries ») :
   * direction PROPRE de l'Activité — champ OPTIONNEL, `UNILATERAL` par
   * défaut (même convention que les autres champs optionnels de cette
   * famille de Facts) : un appelant qui ne la transmet pas produit
   * exactement le résumé d'avant cette tranche.
   */
  readonly sideMode?: SideMode;
  /**
   * V2-BILAT-01 : `true` lorsque la direction EFFECTIVEMENT appliquée à
   * cette Activité provient du Tour (Activité `IN_TOUR` d'un Tour bilatéral)
   * plutôt que de sa propre configuration — jamais dérivé ici à partir de
   * `structuralPosition`/`tourSideMode` (ce module reste indépendant de la
   * structure du Tour) : l'appelant (`CompositionScreen.tsx`) le calcule via
   * `resolveEffectiveSideMode`/la zone structurelle. Aucune clause de
   * direction n'est jamais affichée pour une direction héritée — « own
   * bilateral base » exige explicitement une direction PROPRE.
   */
  readonly isSideModeInherited?: boolean;
};

/**
 * Durée compacte et lisible, sans segment inutile (contrairement à
 * `formatDurationRowValue`, qui affiche toujours minutes ET secondes sur
 * deux chiffres pour une roulette) : `"45 s"` (< 1 min), `"1 min"` (secondes
 * nulles), `"1 min 30 s"` (les deux). Réservée à `formatExerciseRowSummary`
 * ci-dessous — demande CHANGES_REQUESTED T01-S08 (commentaire GitHub
 * 5442860439), format non issu de la documentation fonctionnelle
 * préexistante.
 */
export function formatCompactDuration(totalSeconds: number): string {
  const exerciseRow = strings.screens.composition.exerciseRow;
  // Décomposition directe (pas `fromTotalSeconds`, qui borne à
  // `WHEEL_TOTAL_SECONDS_MAX` par défaut) : ce résumé n'est pas issu d'une
  // roulette et ne doit appliquer aucune borne d'affichage arbitraire.
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds} ${exerciseRow.durationUnitSeconds}`;
  }
  if (seconds === 0) {
    return `${minutes} ${exerciseRow.durationUnitMinutes}`;
  }
  return `${minutes} ${exerciseRow.durationUnitMinutes} ${seconds} ${exerciseRow.durationUnitSeconds}`;
}

function formatCountWithUnit(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Résumé détaillé de la ligne Exercice dans Composition (T01-S08,
 * CHANGES_REQUESTED — commentaire GitHub 5442860439, décision D-095).
 *
 * Mode Durée : `N série(s) de X min Y s avec Z min Y s de pause par série`.
 * Mode Répétitions : `N série(s) de X répétition(s) avec Z min Y s de pause
 * par série`. La clause de pause est entièrement omise lorsque
 * `pauseSeconds === 0` — jamais affichée comme `"avec 0 s de pause"`. La
 * Consigne et les Zones corporelles ne figurent jamais dans ce résumé
 * (demande explicite).
 *
 * **V2-BILAT-01 (plan `## UI`, « Composition cards and summaries »)** :
 * lorsque `facts.sideMode` est bilatéral ET PROPRE à l'Activité (jamais
 * `facts.isSideModeInherited`), la clause `exerciseRow.perSide` (« par
 * côté ») s'insère immédiatement après « {N} série(s) », et le suffixe de
 * direction (`sideDirectionSuffixRightLeft`/`sideDirectionSuffixLeftRight`)
 * s'ajoute : (1) après la cible (ou après `toFailure`), (2) donc toujours
 * AVANT la clause de Pause. Une Activité unilatérale ou dont la direction
 * est héritée d'un Tour bilatéral ne reçoit JAMAIS ces deux ajouts — le
 * résumé reste alors rigoureusement identique à celui d'avant cette
 * tranche.
 */
export function formatExerciseRowSummary(facts: ExerciseRowSummaryFacts): string {
  const exerciseRow = strings.screens.composition.exerciseRow;
  const recap = strings.screens.exercise.recap;

  const isOwnBilateral = (facts.sideMode ?? "UNILATERAL") !== "UNILATERAL" && !facts.isSideModeInherited;
  const directionSuffix = !isOwnBilateral
    ? ""
    : facts.sideMode === "RIGHT_LEFT"
      ? exerciseRow.sideDirectionSuffixRightLeft
      : exerciseRow.sideDirectionSuffixLeftRight;

  const seriesLabel = `${formatCountWithUnit(
    facts.seriesCount,
    exerciseRow.seriesSingular,
    exerciseRow.seriesPlural,
  )}${isOwnBilateral ? ` ${exerciseRow.perSide}` : ""}`;

  // T01-S10 (D-111/D-112) : mode « À l'échec » — aucune cible ; le nom n'est
  // jamais répété dans la synthèse compacte. Clause de pause omise à `0 s` ou
  // lorsqu'une seule Série ne crée aucun intervalle.
  if (facts.executionMode === "TO_FAILURE") {
    const base = `${seriesLabel} ${exerciseRow.toFailure}${directionSuffix}`;
    if (facts.pauseSeconds <= 0 || facts.seriesCount <= 1) {
      return base;
    }
    return `${base}, ${exerciseRow.withPause} ${formatCompactDuration(facts.pauseSeconds)} ${recap.pauseLabel} ${recap.pauseSuffix}`;
  }

  const activityLabel =
    facts.executionMode === "DURATION"
      ? formatCompactDuration(facts.durationSeconds ?? 0)
      : formatCountWithUnit(
          facts.repetitionCount ?? 0,
          exerciseRow.repetitionSingular,
          exerciseRow.repetitionPlural,
        );

  const base = `${seriesLabel} ${exerciseRow.of} ${activityLabel}${directionSuffix}`;

  if (facts.pauseSeconds <= 0) {
    return base;
  }

  return `${base} ${exerciseRow.withPause} ${formatCompactDuration(facts.pauseSeconds)} ${exerciseRow.pauseSuffix}`;
}

export type ExerciseRecapFacts = ExerciseRowSummaryFacts & {
  /** Nom de l'Activité en cours d'édition, intégré au récapitulatif (complétion REWORK12) — jamais un littéral figé. */
  readonly name: string;
  /**
   * T02-S02 : Récupération attachée — `0` omet entièrement la proposition
   * `, puis … de récupération`.
   *
   * Champ OPTIONNEL, `0` par défaut — même convention que
   * `CompositionSummaryFacts.tourRepeatCount` : la valeur neutre produit
   * exactement la synthèse d'avant cette tranche, un appelant qui ne
   * modélise pas encore la Récupération reste donc valide et correct.
   * `ExerciseScreen` transmet toujours la valeur réelle du brouillon.
   */
  readonly recoverySeconds?: number;
};

/**
 * Récapitulatif calculé de l'écran `Création d'une Activité — Paramètres
 * essentiels` (CE-T01-13, cadre ancré en bas du formulaire) — REWORK09
 * (mission directe utilisateur, 2026-09-04, point 8), **reformulé par la
 * complétion REWORK12** (`[ChatGPT] Applique impérativement le protocole
 * KODJO actif...`, 2026-09-04) après mise à jour Figma/documentaire (D-105,
 * `06 – Ecrans et navigation de la V1.md` §« Étape 1 »).
 *
 * Format exact vérifié directement sur les nœuds Figma actuels
 * (`3261:4157`/`3261:4166`, frames `1992:9132`/`1992:9212`) :
 * `"3 séries de squat sautés de 1 min 30 s, avec 15 s de pause entre les
 * séries."` (Durée) / `"3 séries de 12 squat sautés, avec 15 s de pause
 * entre les séries."` (Répétitions) — plus jamais de préfixe `Exercice ·
 * Mode X ·` (supprimé, REWORK09's `exercise.type.exercise`/
 * `exercise.recap.modePrefix` désormais sans consommateur). `entre les
 * séries` n'est ajouté que lorsque `seriesCount > 1` (implicite dans les
 * deux exemples Figma, `3 séries` ; règle explicite posée par la
 * documentation mise à jour pour le cas `1 série`, non illustré sur Figma).
 * Jamais une valeur figée : recalculé à chaque changement du brouillon
 * d'Activité (`ExerciseScreen.tsx`, `local`).
 *
 * Réutilise `formatCompactDuration`/`formatCountWithUnit` déjà établis
 * pour `formatExerciseRowSummary` ci-dessus (mêmes unités/pluriels/« de »/
 * « avec », `strings.screens.composition.exerciseRow`) — la clause de
 * pause est entièrement omise lorsque `pauseSeconds === 0`, comme
 * `formatExerciseRowSummary` (D-095) ; `exercise.recap.pauseSuffix`
 * (« entre les séries ») reste distinct de `exerciseRow.pauseSuffix`
 * (« de pause par série »), désormais appliqué CONDITIONNELLEMENT (au
 * pluriel uniquement) plutôt que systématiquement.
 */
export function formatExerciseRecap(facts: ExerciseRecapFacts): string {
  const exercise = strings.screens.exercise;
  const exerciseRow = strings.screens.composition.exerciseRow;

  const seriesLabel = formatCountWithUnit(
    facts.seriesCount,
    exerciseRow.seriesSingular,
    exerciseRow.seriesPlural,
  );

  // T01-S10 (D-111/D-112) : synthèse complète du mode « À l'échec » —
  // `{N} série(s) de {nom}, jusqu'à l'échec[, avec {pause} de pause entre les
  // séries].` La clause de pause est omise à `0 s` ou lorsqu'une seule Série
  // ne crée aucun intervalle.
  if (facts.executionMode === "TO_FAILURE") {
    const failureBase = `${seriesLabel} ${exerciseRow.of} ${facts.name}, ${exerciseRow.toFailure}`;
    if (facts.pauseSeconds <= 0 || facts.seriesCount <= 1) {
      return `${failureBase}${formatRecoveryClause(facts.recoverySeconds ?? 0)}.`;
    }
    return `${failureBase}, ${exerciseRow.withPause} ${formatCompactDuration(facts.pauseSeconds)} ${exercise.recap.pauseLabel} ${exercise.recap.pauseSuffix}${formatRecoveryClause(facts.recoverySeconds ?? 0)}.`;
  }

  const activityLabel =
    facts.executionMode === "DURATION"
      ? `${facts.name} ${exerciseRow.of} ${formatCompactDuration(facts.durationSeconds ?? 0)}`
      : `${facts.repetitionCount ?? 0} ${facts.name}`;

  const base = `${seriesLabel} ${exerciseRow.of} ${activityLabel}`;

  if (facts.pauseSeconds <= 0) {
    return `${base}${formatRecoveryClause(facts.recoverySeconds ?? 0)}.`;
  }

  const pauseSuffix = facts.seriesCount > 1 ? ` ${exercise.recap.pauseSuffix}` : "";

  return `${base}, ${exerciseRow.withPause} ${formatCompactDuration(facts.pauseSeconds)} ${exercise.recap.pauseLabel}${pauseSuffix}${formatRecoveryClause(facts.recoverySeconds ?? 0)}.`;
}

/**
 * Proposition `, puis {récupération} de récupération` du récapitulatif
 * (T02-S02, `06 – Ecrans et navigation de la V1.md`, Écran 4 : « Lorsque la
 * Récupération est non nulle, ajouter `, puis {récupération} de
 * récupération` »).
 *
 * Chaîne VIDE — jamais une proposition vide — lorsque la Récupération est
 * nulle : elle se compose alors sans laisser de virgule orpheline avant le
 * point final, dans les trois modes. Ajoutée avant la ponctuation finale,
 * toujours après l'éventuelle clause de Pause : la Récupération s'exécute
 * après TOUTES les Séries, donc après les Pauses.
 */
function formatRecoveryClause(recoverySeconds: number): string {
  if (recoverySeconds <= 0) {
    return "";
  }
  const recap = strings.screens.exercise.recap;
  return `, ${recap.recoveryPrefix} ${formatCompactDuration(recoverySeconds)} ${recap.recoveryLabel}`;
}

/**
 * Seconde ligne de la synthèse d'Activité (T02-S02, `06` Écran 4) :
 *
 * - mode Durée : `Durée totale : {D}`, `D` suivant la formule canonique
 *   CONDITIONNELLE de `calculations.ts` (`C × B` sans Récupération,
 *   `(C − 1) × B + R` avec) — la valeur DÉRIVÉE, jamais une donnée persistée
 *   (DM-015) ;
 * - modes Répétitions et « À l'échec » : `Durée totale : ≥ {durée connue}`,
 *   borne composée des seules parts déterminables — Pauses entre Séries et
 *   Récupération (RM-132). Aucune durée conventionnelle n'est inventée pour
 *   l'Exercice lui-même.
 *
 * **V2-BILAT-01 (plan `## Calculs`, BIL-068)** : « le libellé visible reste
 * `Durée totale` dans les TROIS modes » — remplace l'ancien libellé distinct
 * `Durée minimale` des modes non chronométrés, supprimé (`fr.ts`). Seul le
 * préfixe `≥` continue de signaler la borne inférieure ; il n'est jamais
 * retiré du champ éditeur ni de cette ligne (décision T02-S02 conservée).
 *
 * La même fonction du Domaine (`computeTotalDurationSeconds`) sert les deux
 * cas : en mode non chronométré, `A` vaut `0`, ce qui EST exactement la
 * définition de la borne minimale — jamais une seconde formule parallèle.
 */
export function formatExerciseDurationLine(facts: ExerciseRecapFacts): string {
  const exercise = strings.screens.exercise;
  const isLowerBound = facts.executionMode !== "DURATION";
  const totalSeconds = computeTotalDurationSeconds(
    facts.seriesCount,
    {
      durationSeconds: isLowerBound ? 0 : (facts.durationSeconds ?? 0),
      pauseSeconds: facts.pauseSeconds,
      recoverySeconds: facts.recoverySeconds ?? 0,
    },
    sideMultiplier(facts.sideMode ?? "UNILATERAL"),
  );
  const formatted = formatCompactDuration(totalSeconds);

  return isLowerBound
    ? `${exercise.recap.totalDurationLabel} : ≥ ${formatted}`
    : `${exercise.recap.totalDurationLabel} : ${formatted}`;
}

/**
 * Séparateur canonique des listes compactes de cette famille d'écrans —
 * exactement celui déjà employé par `formatCompositionSummary` ci-dessus
 * (`N activités · durée`), extrait ici en constante partagée pour garantir
 * la cohérence demandée entre la synthèse d'une ligne Activité et sa ligne
 * de Zones corporelles, plutôt que deux littéraux pouvant diverger.
 */
export const COMPACT_LIST_SEPARATOR = " · ";

/**
 * Zones corporelles d'UNE Activité, pour la ligne dédiée de sa carte dans
 * Composition (correction compacte LOT_3_OF_3, demande utilisateur directe
 * — autorisée bien qu'absente de Figma ; elle ne crée aucune nouvelle
 * persistance : `bodyZoneIds` existe déjà sur `SessionDraftExercise` depuis
 * T01-S08, seule sa RESTITUTION est ajoutée).
 *
 * Contrat :
 * - restitue EXCLUSIVEMENT les Zones corporelles de l'Activité — jamais une
 *   Catégorie de Séance (celles-ci n'appartiennent pas à l'Activité et ne
 *   figurent que sur la carte du Catalogue, `SessionCard.tsx`) ;
 * - ordre du référentiel (`BODY_ZONES`, `order` croissant), jamais l'ordre
 *   de sélection de l'utilisateur — même règle que `SessionSummary
 *   .bodyZoneNames` (T01-S09), pour que deux Activités portant les mêmes
 *   Zones s'affichent toujours identiquement ;
 * - un identifiant inconnu du référentiel est ignoré silencieusement (jamais
 *   affiché brut) ; les doublons éventuels sont dédupliqués par construction
 *   (le référentiel est parcouru une fois, jamais la sélection) ;
 * - `null` — jamais une chaîne vide — lorsqu'aucune Zone connue ne subsiste :
 *   l'appelant omet alors entièrement la ligne plutôt que de rendre un
 *   `Text` vide qui occuperait quand même sa hauteur de ligne.
 */
export function formatExerciseBodyZones(bodyZoneIds: readonly string[]): string | null {
  if (bodyZoneIds.length === 0) {
    return null;
  }
  const selected = new Set(bodyZoneIds);
  const names = BODY_ZONES.filter((zone) => selected.has(zone.id)).map((zone) => zone.name);
  return names.length === 0 ? null : names.join(COMPACT_LIST_SEPARATOR);
}

/**
 * Libellé de la SOUS-CARTE `Récupération X min Y s` attachée à une carte
 * d'Activité dans la Composition (T02-S02, D-095/D-128/D-138 ; CE-T01-09
 * « carte au repos `354 × 69` sans Récupération ou bloc `354 × 93` avec
 * Récupération »).
 *
 * `null` — jamais une chaîne vide — lorsque la Récupération est nulle :
 * l'appelant omet alors entièrement la sous-carte, et le bloc conserve sa
 * hauteur de repos `69`. C'est ce `null` qui rend la géométrie CONDITIONNELLE
 * décidable en un point unique, plutôt que par un test de valeur répété dans
 * l'écran.
 *
 * La durée réutilise `formatCompactDuration` — exactement le format déjà
 * employé par la Pause dans la synthèse de la même carte (`30 s`, `1 min`,
 * `1 min 30 s`). Rendre ici `01 min 30 s` (format de roulette,
 * `formatDurationRowValue`) juxtaposerait deux écritures différentes de la
 * même grandeur dans une même carte.
 */
export function formatActivityRecoveryLabel(recoverySeconds: number): string | null {
  if (recoverySeconds <= 0) {
    return null;
  }
  return `${strings.screens.composition.activityRecovery.label} ${formatCompactDuration(recoverySeconds)}`;
}
