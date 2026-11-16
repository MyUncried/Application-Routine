/**
 * PRE-11 — For time : séries des exercices en tour, du buy-in et du buy-out (règles de Hermann du 14/11/2026, « For time — Règles
 * de gestion des séries et des tours », FT-4 à FT-12 ; corrections 1 et 2 du 14/11/2026 ; recopiées dans
 * `_bmad-output/pre11/spec-pre11-formats.md` §5).
 *
 * - FT-5 (correction 1) : un exercice en tour porte autant de séries que le For time a de tours, **toujours enregistrées tour par
 *   tour** (séries Variables, une valeur par tour) ; « Identiques » n'est qu'un raccourci de saisie, jamais un mode de stockage.
 *   [« identiques ou variables » pour un exercice en tour — remplacé le 14/11/2026, correction 1.]
 * - Correction 2 : buy-in et buy-out, un nombre de séries par bloc, commun à tous ses exercices, d'au moins 1 ; chaque exercice
 *   garde ses valeurs (Identiques ou Variables). [Nombre commun au bloc — remplacé. Recette du 14/11/2026 (Hermann), m2 et m3 : « Les exercices de buy in
 *   (et de buy out) sont indépendants, changer le nombre de séries de l’un ne doit avoir aucun impact sur l’autre » : chaque
 *   exercice du buy-in ou du buy-out a son propre nombre de séries, d'au moins 1.]
 * - FT-7 / FT-10 / correction 2 règle 4 : ajustement à N séries — complétées avec la dernière valeur, ou tronquées (dernières
 *   séries supprimées). Aucune série orpheline ni manquante. [« complétées avec la dernière valeur » — remplacé pour FT-10 et la
 *   règle 4. Recette du 14/11/2026 (Hermann), m5 (buy-in transformé en Tour) : « Il ne faut pas reprendre automatiquement la valeur
 *   de la dernière série » ; i6 (nombre de séries d'un bloc) : « S3 ne doit [pas] prendre la dernière valeur, Elle doit être rentrée
 *   manuellement » : les séries ajoutées y sont « à renseigner » (cible vide, pause de la dernière série, charge 0). FT-7
 *   (changement du nombre de tours, « sans série vide ») n'est pas visé : dernière valeur reprise.]
 * - FT-6 : aucune série sans objectif, jamais « À l'échec » ; une cible « à l'échec » devient « à renseigner ».
 *
 * Fonctions pures.
 */

import { seriesRowsOf, unsetTarget, type ExecutionParametersInput, type SeriesRow } from "@/domain/activities/ExecutionParameters";

import { circuitRoleOf, type CircuitRole } from "./formats";
import { structureCircuits, type StructureCircuit } from "./structure";
import type { SessionDraft, SessionDraftExercise } from "./SessionDraft";

function withoutFailure(row: SeriesRow): SeriesRow {
  return row.target.kind === "FAILURE" ? { ...row, target: unsetTarget() } : row;
}

/** Série ajoutée par un ajustement : à renseigner (recette du 14/11/2026, m5 et i6), pause de la dernière série gardée. */
function addedRow(rows: readonly SeriesRow[]): SeriesRow {
  return { target: unsetTarget(), pauseSeconds: rows.at(-1)?.pauseSeconds ?? 0, loadKg: 0 };
}

/**
 * Séries d'un exercice en tour ajustées à `rounds` tours : toujours Variables, une valeur par tour (FT-5, correction 1).
 * Identiques : la valeur est répétée à chaque tour ; Variables : complétées avec la dernière valeur, ou tronquées. [Séries ajoutées
 * « à renseigner » depuis la recette du 14/11/2026.]
 */
export function seriesForRounds(parameters: ExecutionParametersInput, rounds: number, identical: "repeat" | "unset" = "repeat"): ExecutionParametersInput {
  const count = Math.max(1, Math.round(rounds));
  const series = parameters.series;
  if (series.kind === "VARIABLE" && series.rows.length === count && series.rows.every((row) => row.target.kind !== "FAILURE")) return parameters;
  const rows = seriesRowsOf(parameters).map(withoutFailure);
  // Identiques d'un exercice déjà en tour (« identique + une valeur », correction 1, point 6) : la valeur vaut pour chaque tour,
  // répétée. Exercice qui arrive en tour (`identical: "unset"`, recette h1 : « Buy In (1 serie) passé en mode Tour ») : ses
  // séries sont gardées telles quelles, les nouvelles à renseigner. [Séries ajoutées complétées de la
  // dernière valeur (FT-7), ou de la valeur des séries Identiques — remplacé le 15/11/2026, recette ft-i6, ft-m5 et h1 (Hermann :
  // « La dernière valeur ne doit pas être reprise » ; « les valeurs des Nouvelles séries doivent être entrée manuellement, pas de
  // reprise automatique de valeur ») : toute série ajoutée est à renseigner.]
  const repeat = series.kind === "UNIFORM" && identical === "repeat" && rows.length > 0;
  const resized = Array.from({ length: count }, (_, index) => rows[index] ?? (repeat ? rows.at(-1)! : addedRow(rows)));
  return { ...parameters, series: { kind: "VARIABLE", rows: resized, workPhases: series.workPhases } };
}

/**
 * Séries d'un exercice de buy-in ou de buy-out ajustées au nombre de séries du bloc (correction 2) : type Identiques / Variables
 * conservé ; Variables complétées avec la dernière valeur, ou tronquées.
 */
export function seriesForBlock(parameters: ExecutionParametersInput, count: number): ExecutionParametersInput {
  const size = Math.max(1, Math.round(count));
  const series = parameters.series;
  if (series.kind === "UNIFORM") {
    const target = series.target.kind === "FAILURE" ? unsetTarget() : series.target;
    return series.count === size && target === series.target ? parameters : { ...parameters, series: { ...series, count: size, target } };
  }
  if (series.rows.length === size && series.rows.every((row) => row.target.kind !== "FAILURE")) return parameters;
  const rows = series.rows.map(withoutFailure);
  return { ...parameters, series: { ...series, rows: Array.from({ length: size }, (_, index) => rows[index] ?? addedRow(rows)) } };
}

/**
 * Liste de valeurs ajustée à `count` (FT-7, correction 2) : complétée avec la dernière valeur, ou tronquée. [Complétée de valeurs
 * à renseigner (`null`, `added: "unset"`) pour le nombre de séries d'un bloc depuis la recette du 14/11/2026, i6 : « Elle doit
 * être rentrée manuellement ».]
 */
export function valuesForRounds<T>(values: readonly (T | null)[], count: number): (T | null)[] {
  // [Dernière valeur reprise en tour (FT-7) — remplacé le 15/11/2026, recette ft-i6 : « La dernière valeur ne doit pas être reprise ».]
  const size = Math.max(1, Math.round(count));
  return Array.from({ length: size }, (_, index) => (index < values.length ? (values[index] ?? null) : null));
}

/** Nombre de séries enregistrées d'un exercice. */
export function seriesCountOf(parameters: ExecutionParametersInput): number {
  return parameters.series.kind === "UNIFORM" ? parameters.series.count : parameters.series.rows.length;
}

type DraftLike = Pick<SessionDraft, "exercises" | "structure">;

function forTimeCircuits(draft: DraftLike): readonly StructureCircuit<string>[] {
  return draft.structure === undefined
    ? []
    : structureCircuits<string>(draft.structure).filter((circuit) => circuit.format?.key === "FOR_TIME");
}

function rolesOf(draft: DraftLike, circuit: StructureCircuit<string>): ReadonlyMap<string, CircuitRole> {
  return new Map(circuit.exercises.map((id, index) => [id, circuitRoleOf(draft.exercises.find((exercise) => exercise.id === id)?.format, index)]));
}

/**
 * Nombre de séries du bloc buy-in ou buy-out d'un For time (correction 2) : celui de ses exercices (le plus grand si des
 * données antérieures divergent, pour ne rien perdre) ; `null` sans exercice dans le bloc. `except` : exercice ignoré.
 */
export function forTimeBlockCount(draft: DraftLike, circuit: StructureCircuit<string>, role: "BUY_IN" | "BUY_OUT", except?: string): number | null {
  const roles = rolesOf(draft, circuit);
  const counts = circuit.exercises
    .filter((id) => id !== except && roles.get(id) === role)
    .map((id) => draft.exercises.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is SessionDraftExercise => exercise !== undefined)
    .map((exercise) => seriesCountOf(exercise.executionParameters));
  return counts.length === 0 ? null : Math.max(...counts);
}

/**
 * Séries de tous les For time d'une séance remises en règle (correction 1, point 6 ; correction 2, règle 1) : exercices en tour,
 * une valeur par tour (« identique + une valeur » converti en N valeurs égales) ; buy-in et buy-out, nombre de séries commun au
 * bloc. Appliqué à la lecture d'une séance et à chaque modification du brouillon. Renvoie le même brouillon si rien ne change.
 *
 * Demande de Hermann du 14/11/2026 (soir) : « Pour les exercices en buy in et en buy out, je dois pouvoir ajouter ou supprimer des séries dans la composition de séance » : `previous` (brouillon avant l'écriture) — un exercice du bloc dont le nombre de séries vient de changer donne le
 * nombre du bloc (ajout comme retrait) ; les autres exercices du bloc le suivent (dernière valeur répétée, ou dernières
 * valeurs retirées après confirmation dans la modale, `forTimeBlockCountLoss`). [Remplacé — recette du 14/11/2026, m2 et m3 :
 * exercices du buy-in et du buy-out indépendants ; `_previous` n'est plus lu.]
 */
export function withForTimeSeries<D extends DraftLike>(draft: D, _previous?: DraftLike): D {
  const circuits = forTimeCircuits(draft);
  if (circuits.length === 0) return draft;
  const fitted = new Map<string, SessionDraftExercise>();
  for (const circuit of circuits) {
    const roles = rolesOf(draft, circuit);
    for (const id of circuit.exercises) {
      const exercise = draft.exercises.find((candidate) => candidate.id === id);
      if (exercise === undefined) continue;
      const role = roles.get(id) ?? "TOUR";
      const parameters = exercise.executionParameters;
      // Recette du 14/11/2026 (m2, m3) : buy-in et buy-out indépendants — chaque exercice garde son nombre de séries.
      const next = role === "TOUR" ? seriesForRounds(parameters, circuit.repeatCount) : seriesForBlock(parameters, seriesCountOf(parameters));
      if (next !== parameters) fitted.set(id, { ...exercise, executionParameters: next });
    }
  }
  if (fitted.size === 0) return draft;
  return { ...draft, exercises: draft.exercises.map((exercise) => fitted.get(exercise.id) ?? exercise) };
}

// [`forTimeBlockCountLoss` (valeurs perdues par les autres exercices du bloc) — retiré le 14/11/2026, recette m2 et m3 : exercices
// du buy-in et du buy-out indépendants.]

/**
 * Valeurs qu'un changement de Rôle supprimerait (correction 2, règle 5 ; test f, « aucune valeur perdue en silence ») : en tour,
 * séries au-delà du nombre de tours ; dans un bloc déjà occupé, séries au-delà du nombre de séries du bloc [bloc — retiré le
 * 14/11/2026 : en buy-in ou en buy-out, séries conservées]. 0 : rien de perdu (séries Identiques : la valeur retirée est la même
 * que celles qui restent).
 */
export function forTimeRoleChangeLoss(draft: DraftLike, exerciseId: string, role: CircuitRole, parameters: ExecutionParametersInput): number {
  const circuit = forTimeCircuits(draft).find((candidate) => candidate.exercises.includes(exerciseId));
  if (circuit === undefined || parameters.series.kind === "UNIFORM") return 0;
  return role === "TOUR" ? Math.max(0, seriesCountOf(parameters) - Math.max(1, circuit.repeatCount)) : 0;
}
