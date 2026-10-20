import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import {
  allTargetsFailure,
  hasUnsetTarget,
  isBilateral,
  seriesCountOf,
  seriesRowsOf,
  type ExecutionParametersInput,
  type SeriesTarget,
} from "@/domain/activities/ExecutionParameters";
import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import {
  computeSeriesCircuitOccurrenceDuration,
  hasDurationAmount,
  type ExerciseDurationKind,
  type SessionDurationResult,
} from "@/domain/activities/executionCalculations";
import { computeActivityDurationResult, computeStructuredSessionDuration } from "@/domain/sessions/calculations";
import { DEFAULT_CIRCUIT_NATURE, type CircuitNature } from "@/domain/sessions/circuit";
import { groupActivitiesByZone } from "@/domain/sessions/composition";
import { DEFAULT_TOUR_REPEAT_COUNT } from "@/domain/sessions/defaults";
import type { SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SideMode } from "@/domain/sessions/sideMode";
import { formatEstimatedDuration } from "@/features/sessions/formatSessionSummary";
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
  /** PRE-6 (story 1.3) : nature du Circuit du brouillon, lue `?? "TOURS"`. */
  readonly circuitNature?: CircuitNature;
};

/**
 * Résumé sous le titre du Circuit (`Nombre de tours`) — historique : T01-S07,
 * T01-S08 (revue PR #9), REWORK12, REWORK13 (R13-02), T02-S01/T02-S02, PRE-3,
 * PRE-4 (story 2.4, P41, P47).
 *
 * **PRE-6 (story 1.3, D-382, D-390, D-399)** : le résumé est la SEULE durée
 * de ce Circuit, sans nombre d'exercices ; « — min » (`summary.empty`) si
 * aucun Exercice n'est dans le Circuit.
 *
 * - Périmètre : les seules occurrences `IN_TOUR` ; les occurrences
 *   `BEFORE_TOUR`/`AFTER_TOUR`, le Compte à rebours initial et la Fin de
 *   séance en sont toujours exclus (REWORK13, R13-02).
 * - Calcul : autorité unique du Domaine, `computeStructuredSessionDuration`
 *   restreinte à la zone `IN_TOUR`, qui développe le Circuit selon sa nature
 *   (Tours : contenu interne × `tourRepeatCount` ; Séries : passages) —
 *   même total que la liste et la lecture complète. La Récupération positive
 *   remplace la Pause terminale ; aucune formule locale.
 * - Nature et format : « ≥ » si un travail est inconnu (à l'échec,
 *   Répétitions sans bip, Cible à renseigner), suivi des minutes et secondes
 *   sans arrondi (`formatPhraseDuration`), sauf une borne de 0 s qui garde
 *   « ≥ 0 min » (P47) ; « ≈ » si une contribution est estimée (Répétitions
 *   avec bip) ; exact sinon. `exact` et `estimated` passent par
 *   `formatEstimatedDuration` (arrondi à la minute supérieure, RM-101, P41).
 */
export function formatCompositionSummary(facts: CompositionSummaryFacts): string {
  const inTourExercises = facts.exercises.filter(
    (exercise) => exercise.structuralPosition === "IN_TOUR",
  );

  if (inTourExercises.length === 0) {
    return strings.screens.composition.summary.empty;
  }

  // PRE-6 (story 1.3, AD-40) : autorité unique du Domaine,
  // `computeStructuredSessionDuration` restreinte à la zone `IN_TOUR` — le
  // développement suit la nature du Circuit (Tours : × N ; Séries :
  // passages), exactement comme la liste et la lecture complète. Aucune
  // formule locale : la parité Domaine / présentation est vraie par
  // construction.
  const duration = computeStructuredSessionDuration({
    beforeTour: [],
    inTour: inTourExercises,
    afterTour: [],
    tourRepeatCount: facts.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT,
    circuitNature: facts.circuitNature ?? DEFAULT_CIRCUIT_NATURE,
  });
  // PRE-6 (story 1.3, D-382, D-390) : la durée de ce seul Circuit, sans
  // nombre d'exercices.
  return formatSessionDurationResult(duration);
}

/**
 * Format partagé d'une durée typée du Domaine. PRE-3 : « ≥ » si un travail
 * est inconnu, « ≈ » si une contribution est estimée (Répétitions avec bip),
 * aucun symbole sinon. PRE-4 (story 2.4, AC5) : la borne minimale garde ses
 * secondes (105 s → « ≥ 1 min 45 s ») ; `exact` et `estimated` gardent
 * `formatEstimatedDuration` et son arrondi à la minute supérieure (P41). Une
 * borne de 0 s garde « ≥ 0 min », jamais « 0 s » (règle P47).
 *
 * PRE-6 (story 2.1) : partagé par le résumé du Circuit et la durée de séance
 * de l'en-tête — même formatage et mêmes préfixes par construction.
 */
function formatSessionDurationResult(duration: SessionDurationResult): string {
  return duration.kind === "lowerBound" && duration.seconds > 0
    ? `${strings.shared.durationNature.lowerBoundPrefix}${formatPhraseDuration(duration.seconds)}`
    : formatEstimatedDuration(duration.seconds, duration.kind);
}

/**
 * Durée de séance de l'en-tête de la Composition (PRE-6 story 2.1,
 * CE-T03-08, RM-159) : TOUTES les occurrences, développées selon la nature
 * du Circuit (`computeStructuredSessionDuration`, autorité unique du
 * Domaine), sans Compte à rebours initial ni Fin de séance. Séance vide :
 * « 0 min » (total exact nul).
 */
export function formatCompositionSessionDuration(facts: CompositionSummaryFacts): string {
  // Même répartition en zones que l'affichage de la Composition.
  const zones = groupActivitiesByZone(facts.exercises);
  return formatSessionDurationResult(
    computeStructuredSessionDuration({
      beforeTour: zones.beforeTour,
      inTour: zones.inTour,
      afterTour: zones.afterTour,
      tourRepeatCount: facts.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT,
      circuitNature: facts.circuitNature ?? DEFAULT_CIRCUIT_NATURE,
    }),
  );
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
  /**
   * PRE-4 (story 1.1, AD-3, AD-6) : paramètres typés de l'Exercice — seule
   * source du Mode, des Cibles, de N et des Pauses (aucun scalaire, aucun
   * `?? 0`). Une `ActivityDefinition` ou un `SessionDraftExercise` les portent.
   */
  readonly executionParameters: ExecutionParametersInput;
  /**
   * V2-BILAT-01 (plan `## UI`, « Composition cards and summaries ») :
   * direction PROPRE de l'Activité — champ OPTIONNEL, `UNILATERAL` par
   * défaut : un appelant qui ne la transmet pas produit exactement le résumé
   * d'avant cette tranche.
   */
  readonly sideMode?: SideMode;
  /**
   * V2-BILAT-01 : `true` lorsque la direction EFFECTIVEMENT appliquée à
   * cette Activité provient du Tour plutôt que de sa propre configuration —
   * jamais dérivé ici. Aucune clause de direction n'est jamais affichée pour
   * une direction héritée.
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
 *
 * PRE-4 (story 2.2, AC1, AD-5) : converge sur le formateur unique du
 * domaine (`durationFormat.ts`), sans borne de roulette : sorties
 * inchangées.
 */
export function formatCompactDuration(totalSeconds: number): string {
  return formatPhraseDuration(totalSeconds);
}

function formatCountWithUnit(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Résumé détaillé de la ligne Exercice dans Composition et sur la carte
 * Catalogue (T01-S08, CHANGES_REQUESTED — commentaire GitHub 5442860439,
 * décision D-095).
 *
 * Mode Durée : `N série(s) de X min Y s avec Z min Y s de pause par série`.
 * Mode Répétitions : `N série(s) de X répétition(s) avec Z min Y s de pause
 * par série`. La clause de pause est entièrement omise lorsque la Pause vaut
 * 0 — jamais affichée comme `"avec 0 s de pause"`. La Consigne et les Zones
 * corporelles ne figurent jamais dans ce résumé.
 *
 * **V2-BILAT-01** : lorsque la direction est bilatérale ET PROPRE à
 * l'Activité (jamais `facts.isSideModeInherited`), la clause
 * `exerciseRow.perSide` (« par côté ») s'insère immédiatement après
 * « {N} série(s) » — seule marque de bilatéralité de la carte.
 *
 * **PRE-4 (story 1.1, AD-6, Q24, Q17, H28)** : lecture des Cibles TYPÉES,
 * jamais des scalaires ni d'un `?? 0` :
 * - toutes les Cibles `FAILURE` (ancien mode « à l'échec » migré), en Régime
 *   identiques comme variables : « {N} séries à l’échec » (clause de Pause
 *   commune conservée en identiques) — jamais « 0 s » ni « 0 rép. » ;
 * - Régime variables : indicateur compact « {N} séries variables » (v13 §7) ;
 * - Mode non renseigné ou Cible à renseigner (`UNSET`, héritée) : le texte
 *   existant « Paramètres à compléter. », sans aucune valeur inventée.
 */
export function formatExerciseRowSummary(facts: ExerciseRowSummaryFacts): string {
  const exerciseRow = strings.screens.composition.exerciseRow;
  const recap = strings.screens.exercise.recap;
  const parameters = facts.executionParameters;

  const isOwnBilateral = (facts.sideMode ?? "UNILATERAL") !== "UNILATERAL" && !facts.isSideModeInherited;
  const count = seriesCountOf(parameters);
  const seriesLabel = `${formatCountWithUnit(
    count,
    exerciseRow.seriesSingular,
    exerciseRow.seriesPlural,
  )}${isOwnBilateral ? ` ${exerciseRow.perSide}` : ""}`;

  // Tout échec : aucune Cible numérique ; le nom n'est jamais répété dans la
  // synthèse compacte. Clause de Pause omise à 0 s, en Régime variables, ou
  // lorsqu'une seule Série ne crée aucun intervalle.
  if (allTargetsFailure(parameters)) {
    const base = `${seriesLabel} ${exerciseRow.toFailure}`;
    const series = parameters.series;
    if (series.kind !== "UNIFORM" || series.pauseSeconds <= 0 || count <= 1) {
      return base;
    }
    return `${base}, ${exerciseRow.withPause} ${formatCompactDuration(series.pauseSeconds)} ${recap.pauseLabel} ${recap.pauseSuffix}`;
  }

  if (parameters.mode === null || hasUnsetTarget(parameters)) {
    return strings.executionParameters.card.incomplete;
  }

  if (parameters.series.kind === "VARIABLE") {
    const summary = strings.executionParameters.summary;
    return (isOwnBilateral ? summary.variableSeriesPerSide : summary.variableSeries).replace("{n}", String(count));
  }

  const target = parameters.series.target;
  if (target.kind !== "NUMBER") {
    return strings.executionParameters.card.incomplete;
  }

  const activityLabel =
    parameters.mode === "DURATION"
      ? formatCompactDuration(target.value)
      : formatCountWithUnit(target.value, exerciseRow.repetitionSingular, exerciseRow.repetitionPlural);

  const base = `${seriesLabel} ${exerciseRow.of} ${activityLabel}`;
  const pauseSeconds = parameters.series.pauseSeconds;

  if (pauseSeconds <= 0) {
    return base;
  }

  return `${base} ${exerciseRow.withPause} ${formatCompactDuration(pauseSeconds)} ${exerciseRow.pauseSuffix}`;
}

/**
 * Séparateur canonique des listes compactes de cette famille d'écrans —
 * historiquement celui de `formatCompositionSummary` (`N activités · durée`,
 * avant PRE-6 story 1.3), extrait ici en constante partagée pour garantir
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
 * - ordre du référentiel PERSISTANT (`bodyZones`, paramètre explicite de
 *   l'appelant — V2-PRE-1, plan §3.1/UI-CDBCCFD16078 : `BODY_ZONES` n'est
 *   plus l'autorité runtime, aucun argument par défaut ne s'y substitue),
 *   jamais l'ordre de sélection de l'utilisateur — même règle que
 *   `SessionSummary.bodyZoneNames` (T01-S09), pour que deux Activités
 *   portant les mêmes Zones s'affichent toujours identiquement ;
 * - un identifiant inconnu du référentiel transmis est ignoré silencieusement
 *   (jamais affiché brut) ; les doublons éventuels sont dédupliqués par
 *   construction (le référentiel est parcouru une fois, jamais la
 *   sélection) ;
 * - `null` — jamais une chaîne vide — lorsqu'aucune Zone connue ne subsiste :
 *   l'appelant omet alors entièrement la ligne plutôt que de rendre un
 *   `Text` vide qui occuperait quand même sa hauteur de ligne.
 */
export function formatExerciseBodyZones(
  bodyZoneIds: readonly string[],
  bodyZones: readonly BodyZone[],
): string | null {
  if (bodyZoneIds.length === 0) {
    return null;
  }
  const selected = new Set(bodyZoneIds);
  const names = bodyZones.filter((zone) => selected.has(zone.id)).map((zone) => zone.name);
  return names.length === 0 ? null : names.join(COMPACT_LIST_SEPARATOR);
}

/**
 * Libellé de la Récupération d'une occurrence dans la Composition (historique :
 * sous-carte attachée de T02-S02, D-095/D-128/D-138, retirée en PRE-6 story 2.1).
 *
 * **PRE-6 (story 2.1, D-303, D-217, écart E5, Figma `8328:28657`)** : la
 * sous-carte devient l'information de la ligne structurelle de récupération
 * sous l'occurrence. `null` lorsque la Récupération est absente (`null`,
 * story 1.1) ou nulle : la ligne ne montre alors que son trait, jamais
 * « Récupération 0 s » (remplace la règle V2-PRE-1 d'une chaîne toujours
 * rendue).
 *
 * La durée réutilise `formatCompactDuration` — exactement le format déjà
 * employé par la Pause dans la synthèse de la même carte (`30 s`, `1 min`,
 * `1 min 30 s`). Rendre ici `01 min 30 s` (format de roulette,
 * `formatDurationRowValue`) juxtaposerait deux écritures différentes de la
 * même grandeur dans une même carte.
 */
export function formatActivityRecoveryLabel(
  postActivityRecoverySeconds: number | null | undefined,
): string | null {
  if (postActivityRecoverySeconds === null || postActivityRecoverySeconds === undefined || postActivityRecoverySeconds <= 0) {
    return null;
  }
  return `${strings.screens.composition.activityRecovery.label} ${formatCompactDuration(postActivityRecoverySeconds)}`;
}

/** PRE-6 (story 2.2, D-238) : nombre maximal de cibles listées d'une série variable avant « … ». */
export const OCCURRENCE_SUMMARY_MAX_VALUES = 3;

/**
 * Synthèse de la carte d'occurrence de la Composition (PRE-6 story 2.2,
 * D-238 révisant D-095, ch13 « Résumé de la ligne d'un Exercice »,
 * composant Figma `5544:6797`). Fonction pure :
 * - séries identiques : `N × cible` avec unité (« 3 × 1 min 30 s »,
 *   « 3 × 10 rép. ») ; une seule série : la cible seule (« 45 s »,
 *   « 10 rép. ») ;
 * - séries variables : cibles séparées par « · », unité des Répétitions à la
 *   fin, au plus trois valeurs puis « … » (« 10 · 12 · 14 … rép. ») ;
 * - toutes les cibles à l'échec : libellé métier existant (« 1 série à l’échec »,
 *   « 3 séries à l’échec ») ; une cible à l'échec parmi des cibles chiffrées en
 *   variables est écrite « à l’échec » à sa place (rendu des lignes mixtes
 *   encore à aligner, ch13) ;
 * - Mode non renseigné ou cible à renseigner : « Paramètres à compléter. ».
 *
 * Durées au format `formatCompactDuration`. Le nom et le Mode ne sont pas
 * répétés ; aucun texte de pause ni de récupération. En Circuit de Séries, N
 * est celui des paramètres déjà adaptés par la story 1.4 : aucune règle propre.
 */
export function formatOccurrenceSummary(facts: Pick<ExerciseRowSummaryFacts, "executionParameters">): string {
  const parameters = facts.executionParameters;
  const card = strings.screens.composition.occurrenceCard;
  const failure = strings.screens.composition.exerciseRow.toFailure;
  const count = seriesCountOf(parameters);

  // Aucune série : paramètres à compléter (`[].every()` rendrait sinon « tout à l'échec »).
  if (count === 0) {
    return strings.executionParameters.card.incomplete;
  }
  // Toutes les cibles à l'échec : libellé métier existant, celui de `formatExerciseRowSummary`
  // (« 1 série à l’échec », « 3 séries à l’échec »), sans pause ni clause de côté.
  if (allTargetsFailure(parameters)) {
    const exerciseRow = strings.screens.composition.exerciseRow;
    return `${formatCountWithUnit(count, exerciseRow.seriesSingular, exerciseRow.seriesPlural)} ${failure}`;
  }
  if (parameters.mode === null || hasUnsetTarget(parameters)) {
    return strings.executionParameters.card.incomplete;
  }

  const mode = parameters.mode;
  const unit = mode === "REPETITIONS" ? ` ${strings.executionParameters.sheet.repetitionsUnit}` : "";
  const formatTarget = (target: SeriesTarget): string => {
    if (target.kind === "NUMBER") {
      return mode === "DURATION" ? formatCompactDuration(target.value) : String(target.value);
    }
    return failure;
  };

  const rows = seriesRowsOf(parameters);
  if (parameters.series.kind === "UNIFORM" || rows.length === 1) {
    const target = `${formatTarget(rows[0].target)}${unit}`;
    return count > 1 ? card.seriesTimes.replace("{n}", String(count)).replace("{target}", target) : target;
  }

  const values = rows.slice(0, OCCURRENCE_SUMMARY_MAX_VALUES).map((row) => formatTarget(row.target));
  const overflow = rows.length > OCCURRENCE_SUMMARY_MAX_VALUES ? ` ${card.valuesOverflow}` : "";
  return `${values.join(COMPACT_LIST_SEPARATOR)}${overflow}${unit}`;
}

/** Contexte de Circuit nécessaire à la durée d'UNE occurrence (PRE-6 story 2.2). */
export type OccurrenceCircuitContext = {
  readonly circuitNature?: CircuitNature;
  readonly tourRepeatCount?: number;
};

/**
 * Durée d'UNE occurrence (PRE-6 story 2.2), par l'autorité du Domaine :
 * `computeStructuredSessionDuration` sur cette seule occurrence. Hors
 * Circuit ou en Circuit de Tours : durée d'occurrence simple (To, un seul
 * passage, jamais × N tours) ; en Circuit de Séries : total de ses passages
 * (story 1.3). Aucune formule locale.
 */
function occurrenceDurationResult(
  exercise: SessionDraftExercise,
  context: OccurrenceCircuitContext,
): SessionDurationResult {
  const nature = context.circuitNature ?? DEFAULT_CIRCUIT_NATURE;
  const inSeriesCircuit = exercise.structuralPosition === "IN_TOUR" && nature === "SERIES";
  return computeStructuredSessionDuration({
    beforeTour: inSeriesCircuit ? [] : [exercise],
    inTour: inSeriesCircuit ? [exercise] : [],
    afterTour: [],
    tourRepeatCount: context.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT,
    circuitNature: nature,
  });
}

/**
 * Seconde ligne « durée estimée » de la carte d'occurrence (PRE-6 story 2.2,
 * variante Figma « Répétitions + cadence » `9522:43875`) : présente
 * seulement lorsque la durée de l'occurrence est estimée (Répétitions avec
 * bip) ; `null` sinon. Montant au format `formatCompactDuration`, précédé du
 * symbole « ≈ » du lexique (même règle de nature que partout ailleurs).
 */
export function formatOccurrenceEstimatedDuration(
  exercise: SessionDraftExercise,
  context: OccurrenceCircuitContext = {},
): string | null {
  const duration = occurrenceDurationResult(exercise, context);
  return duration.kind === "estimated"
    ? `${strings.shared.durationNature.estimatedPrefix}${formatCompactDuration(duration.seconds)}`
    : null;
}

/**
 * Nature de la durée d'UNE occurrence avant agrégation (`omitted`, `incomplete`…),
 * par les mêmes fonctions du Domaine que `computeStructuredSessionDuration`.
 */
function occurrenceDurationKind(
  exercise: SessionDraftExercise,
  context: OccurrenceCircuitContext,
): ExerciseDurationKind {
  const nature = context.circuitNature ?? DEFAULT_CIRCUIT_NATURE;
  const parameters = exercise.executionParameters;
  if (
    exercise.structuralPosition === "IN_TOUR" &&
    nature === "SERIES" &&
    parameters.mode !== null &&
    exercise.type !== "RECOVERY"
  ) {
    return computeSeriesCircuitOccurrenceDuration(
      parameters,
      exercise.postActivityRecoverySeconds ?? 0,
      context.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT,
    ).kind;
  }
  return computeActivityDurationResult(exercise).kind;
}

/**
 * Nom accessible de la carte d'occurrence (PRE-6 story 2.2, CE-T03-08 §18) :
 * type (« Exercice »), nom, position dans sa zone (« n sur m »), durée
 * d'occurrence (même format et mêmes symboles que les autres durées de la
 * Composition : `formatSessionDurationResult`) — omise si elle n'a pas de montant
 * (`omitted`, `incomplete` : jamais « ≥ 0 min ») —, puis « changement de côté »
 * si l'occurrence est bilatérale (RM-243, sans direction).
 */
export function formatOccurrenceAccessibilityLabel(
  exercise: SessionDraftExercise,
  position: { readonly index: number; readonly count: number },
  context: OccurrenceCircuitContext = {},
): string {
  const card = strings.screens.composition.occurrenceCard;
  const parts = [
    card.accessibilityType,
    exercise.name,
    card.accessibilityPosition
      .replace("{position}", String(position.index + 1))
      .replace("{count}", String(position.count)),
  ];
  if (hasDurationAmount(occurrenceDurationKind(exercise, context))) {
    parts.push(formatSessionDurationResult(occurrenceDurationResult(exercise, context)));
  }
  if (isBilateral(exercise.sideMode)) {
    parts.push(card.accessibilitySideChange);
  }
  return parts.join(", ");
}

/** Catégorie affichée sur la ligne de classement d'une carte (nom et couleur de pastille). */
export type OccurrenceCategory = { readonly name: string; readonly color: string };

/**
 * PRE-6 (story 2.2) : Catégorie d'une occurrence, résolue dans le référentiel
 * persistant (`Category`, même source que le Catalogue). `null` si l'occurrence
 * n'en porte pas ou si l'identifiant est inconnu du référentiel transmis : la
 * carte n'affiche alors ni pastille ni nom de Catégorie (jamais l'identifiant brut).
 */
export function resolveOccurrenceCategory(
  categoryId: string | null | undefined,
  categories: readonly Category[],
): OccurrenceCategory | null {
  if (!categoryId) {
    return null;
  }
  const category = categories.find((candidate) => candidate.id === categoryId);
  return category ? { name: category.name, color: category.color } : null;
}
