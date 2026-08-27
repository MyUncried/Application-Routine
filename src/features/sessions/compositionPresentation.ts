import type { SessionDraftExercise } from "@/domain/sessions/SessionDraft";
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
  readonly exercise: SessionDraftExercise | null;
  readonly initialCountdownSeconds: number;
  readonly finalPhaseSeconds: number;
};

/**
 * Résumé `N activités · durée estimée` de la Composition (§9 du plan
 * T01-S07 ; mode Répétitions ajouté en T01-S08, arbitrage B).
 *
 * État vide (`exercise === null`) : chaîne locale et complète
 * `"0 activité · 0 min"` (arbitrage V2) — n'appelle jamais
 * `formatActivityCount(0)`, qui produit délibérément `"0 activités"`
 * (pluriel) pour le Catalogue et reste inchangé.
 *
 * État non vide, mode Durée : réutilise `formatActivityCount`/
 * `formatEstimatedDuration` (T01-S06) sans modification, avec
 * `Math.ceil(totalSeconds / 60)` déjà porté par `formatEstimatedDuration`.
 *
 * État non vide, mode Répétitions (RM-072/D-070/D-008, déjà validées) :
 * aucune durée conventionnelle n'est attribuée à l'Exercice lui-même (le
 * Compte à rebours initial et la Fin de séance restent comptés) ; la durée
 * estimée devient une borne minimale, précédée de `≥` — jamais présentée
 * comme une valeur exacte.
 */
export function formatCompositionSummary(facts: CompositionSummaryFacts): string {
  if (facts.exercise === null) {
    return strings.screens.composition.summary.empty;
  }

  const isRepetitionMode = facts.exercise.executionMode === "REPETITIONS";
  const activityDurationSeconds = isRepetitionMode ? 0 : facts.exercise.durationSeconds ?? 0;
  const estimatedDurationSeconds =
    facts.initialCountdownSeconds + activityDurationSeconds + facts.finalPhaseSeconds;
  const formattedDuration = formatEstimatedDuration(estimatedDurationSeconds);
  const durationLabel = isRepetitionMode ? `≥ ${formattedDuration}` : formattedDuration;

  return `${formatActivityCount(1)} · ${durationLabel}`;
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
function formatCompactDuration(totalSeconds: number): string {
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
 */
export function formatExerciseRowSummary(facts: ExerciseRowSummaryFacts): string {
  const exerciseRow = strings.screens.composition.exerciseRow;

  const seriesLabel = formatCountWithUnit(
    facts.seriesCount,
    exerciseRow.seriesSingular,
    exerciseRow.seriesPlural,
  );

  const activityLabel =
    facts.executionMode === "DURATION"
      ? formatCompactDuration(facts.durationSeconds ?? 0)
      : formatCountWithUnit(
          facts.repetitionCount ?? 0,
          exerciseRow.repetitionSingular,
          exerciseRow.repetitionPlural,
        );

  const base = `${seriesLabel} ${exerciseRow.of} ${activityLabel}`;

  if (facts.pauseSeconds <= 0) {
    return base;
  }

  return `${base} ${exerciseRow.withPause} ${formatCompactDuration(facts.pauseSeconds)} ${exerciseRow.pauseSuffix}`;
}
