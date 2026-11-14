/**
 * PRE-11 — For time : séries des exercices en tour (règles de Hermann du 14/11/2026, « For time — Règles de gestion des séries et
 * des tours », FT-5, FT-6, FT-7, FT-8, FT-10 ; recopiées dans `_bmad-output/pre11/spec-pre11-formats.md` §5).
 *
 * - FT-5 : un exercice en tour porte autant de séries que le For time a de tours ; cibles identiques ou variables.
 * - FT-7 / FT-10 : ajustement au nombre de tours — séries identiques : même cible répétée ; variables : complétées avec la
 *   dernière valeur, ou tronquées (dernières séries supprimées). Aucune série orpheline ni manquante.
 * - FT-6 : aucune série sans objectif, jamais « À l'échec » ; une cible « à l'échec » devient « à renseigner ».
 *
 * Fonctions pures.
 */

import { unsetTarget, type ExecutionParametersInput, type SeriesRow } from "@/domain/activities/ExecutionParameters";

function withoutFailure(row: SeriesRow): SeriesRow {
  return row.target.kind === "FAILURE" ? { ...row, target: unsetTarget() } : row;
}

/** Séries d'un exercice ajustées à `rounds` tours (voir l'en-tête), type Identiques / Variables conservé. */
export function seriesForRounds(parameters: ExecutionParametersInput, rounds: number): ExecutionParametersInput {
  const count = Math.max(1, Math.round(rounds));
  const series = parameters.series;
  if (series.kind === "UNIFORM") {
    const target = series.target.kind === "FAILURE" ? unsetTarget() : series.target;
    if (series.count === count && target === series.target) return parameters;
    return { ...parameters, series: { ...series, count, target } };
  }
  const rows = series.rows.map(withoutFailure);
  const last = rows.at(-1) ?? { target: unsetTarget(), pauseSeconds: 0, loadKg: 0 };
  const resized = Array.from({ length: count }, (_, index) => rows[index] ?? last);
  return { ...parameters, series: { ...series, rows: resized } };
}

/** Liste de valeurs par tour ajustée à `count` (FT-7) : complétée avec la dernière valeur, ou tronquée. */
export function valuesForRounds<T>(values: readonly (T | null)[], count: number): (T | null)[] {
  const size = Math.max(1, Math.round(count));
  const last = values.length === 0 ? null : (values[values.length - 1] ?? null);
  return Array.from({ length: size }, (_, index) => (index < values.length ? (values[index] ?? null) : last));
}
