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
  /** Collection ORDONNÉE d'Activités (`SessionDraft.exercises`, complétion REWORK12) — remplace l'ancien champ `exercise` singulier. */
  readonly exercises: readonly SessionDraftExercise[];
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
 */
export function formatCompositionSummary(facts: CompositionSummaryFacts): string {
  if (facts.exercises.length === 0) {
    return strings.screens.composition.summary.empty;
  }

  let isLowerBoundEstimate = false;
  let activitiesAndPauseSeconds = 0;
  for (const exercise of facts.exercises) {
    const isRepetitionMode = exercise.executionMode === "REPETITIONS";
    if (isRepetitionMode) {
      isLowerBoundEstimate = true;
    }
    const activityDurationSeconds = isRepetitionMode ? 0 : exercise.seriesCount * (exercise.durationSeconds ?? 0);
    activitiesAndPauseSeconds += activityDurationSeconds + exercise.seriesCount * exercise.pauseSeconds;
  }
  const formattedDuration = formatEstimatedDuration(activitiesAndPauseSeconds);
  const durationLabel = isLowerBoundEstimate ? `≥ ${formattedDuration}` : formattedDuration;

  return `${formatActivityCount(facts.exercises.length)} · ${durationLabel}`;
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

export type ExerciseRecapFacts = ExerciseRowSummaryFacts & {
  /** Nom de l'Activité en cours d'édition, intégré au récapitulatif (complétion REWORK12) — jamais un littéral figé. */
  readonly name: string;
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

  const activityLabel =
    facts.executionMode === "DURATION"
      ? `${facts.name} ${exerciseRow.of} ${formatCompactDuration(facts.durationSeconds ?? 0)}`
      : `${facts.repetitionCount ?? 0} ${facts.name}`;

  const base = `${seriesLabel} ${exerciseRow.of} ${activityLabel}`;

  if (facts.pauseSeconds <= 0) {
    return `${base}.`;
  }

  const pauseSuffix = facts.seriesCount > 1 ? ` ${exercise.recap.pauseSuffix}` : "";

  return `${base}, ${exerciseRow.withPause} ${formatCompactDuration(facts.pauseSeconds)} ${exercise.recap.pauseLabel}${pauseSuffix}.`;
}
