import type { BodyZone } from "@/domain/body-zones/BodyZone";
import {
  allTargetsFailure,
  hasUnsetTarget,
  seriesCountOf,
  type ExecutionParametersInput,
} from "@/domain/activities/ExecutionParameters";
import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { computeStructuredSessionDuration } from "@/domain/sessions/calculations";
import { DEFAULT_CIRCUIT_NATURE, type CircuitNature } from "@/domain/sessions/circuit";
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
  const totalSeconds = duration.seconds;
  const isLowerBound = duration.kind === "lowerBound";

  // PRE-3 : symbole issu de l'autorité Domaine — « ≥ » si un travail est
  // inconnu, « ≈ » si une contribution est estimée (Répétitions avec bip),
  // aucun symbole sinon. PRE-4 (story 2.4, AC5) : la borne minimale garde
  // ses secondes (105 s → « ≥ 1 min 45 s ») ; `exact` et `estimated` gardent
  // `formatEstimatedDuration` et son arrondi à la minute supérieure (P41).
  // Une borne de 0 s garde le rendu PRE-3 « ≥ 0 min », jamais « 0 s »
  // (règle P47, `docs/preparation/PRE-4/bmad/questions-ouvertes.md`).
  //
  // PRE-6 (story 1.3, D-382, D-390) : la durée de ce seul Circuit, sans
  // nombre d'exercices.
  return isLowerBound && totalSeconds > 0
    ? `${strings.shared.durationNature.lowerBoundPrefix}${formatPhraseDuration(totalSeconds)}`
    : formatEstimatedDuration(totalSeconds, duration.kind);
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
 * Libellé de la SOUS-CARTE `Récupération X min Y s` attachée à une carte
 * d'Activité dans la Composition (T02-S02, D-095/D-128/D-138 ; CE-T01-09
 * « carte au repos `354 × 69` sans Récupération ou bloc `354 × 93` avec
 * Récupération »).
 *
 * **V2-PRE-1 (plan §3.2, UI-CDBCCFD16078)** : `postActivityRecoverySeconds`
 * est désormais un champ OBLIGATOIRE de l'occurrence (`Activity`), jamais
 * absent — y compris lorsqu'il vaut `0`. Cette fonction retourne donc
 * toujours une chaîne non vide (`"Récupération 0 s"` incluse), jamais `null`
 * : son seul usage métier restant est la Récupération de l'OCCURRENCE
 * (Composition) — plus aucun appel depuis une carte de Définition Catalogue
 * (`ActivityCard.tsx`), qui ne porte plus cette notion.
 *
 * La durée réutilise `formatCompactDuration` — exactement le format déjà
 * employé par la Pause dans la synthèse de la même carte (`30 s`, `1 min`,
 * `1 min 30 s`). Rendre ici `01 min 30 s` (format de roulette,
 * `formatDurationRowValue`) juxtaposerait deux écritures différentes de la
 * même grandeur dans une même carte.
 */
export function formatActivityRecoveryLabel(postActivityRecoverySeconds: number): string {
  return `${strings.screens.composition.activityRecovery.label} ${formatCompactDuration(postActivityRecoverySeconds)}`;
}
