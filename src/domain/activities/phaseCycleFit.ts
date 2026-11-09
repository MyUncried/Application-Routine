import { EXECUTION_BOUNDS, seriesRowsOf, WORK_PATTERN_DURATION_BOUNDS, type ExecutionMode, type ExecutionSeries } from "./ExecutionParameters";
import { workPhasesCycleSeconds } from "./phaseGuidance";

/**
 * Cohérence d'une durée de série avec le motif des phases du mouvement (décision de Hermann du
 * 09/11/2026, recette PRE-10, constat d) : « Si un objectif en durée est inférieur à la durée totale
 * des phases, il faut un message d'alerte. Si ce n'est pas un multiple il faut un message et demander
 * s'il faut arrondir la valeur au multiple supérieur ou inférieur ». Arbitrages du même jour : alerte
 * bloquante ; deux choix seulement (inférieur / supérieur) ; contrôle à la saisie et au ✓.
 *
 * Remplace, pour les séries en Durée chiffrée, l'indépendance de la cible et du motif (PHC-20261026,
 * D-446). Les Répétitions et les cibles À l'échec ne sont pas concernées ; un motif incomplet ou hors
 * bornes (déjà signalé sur ses cellules) n'est pas contrôlé.
 */
export type PhaseCycleFit =
  | { readonly status: "OK" }
  | { readonly status: "BELOW"; readonly cycleSeconds: number }
  | {
      readonly status: "NOT_MULTIPLE";
      readonly cycleSeconds: number;
      readonly lowerSeconds: number;
      /** `null` lorsque le multiple supérieur dépasse la borne de la cible (3535 s) : seul l'arrondi inférieur est proposé. */
      readonly upperSeconds: number | null;
    };

export function phaseCycleFit(targetSeconds: number, cycleSeconds: number): PhaseCycleFit {
  if (cycleSeconds <= 0) return { status: "OK" };
  if (targetSeconds < cycleSeconds) return { status: "BELOW", cycleSeconds };
  const remainder = targetSeconds % cycleSeconds;
  if (remainder === 0) return { status: "OK" };
  const lowerSeconds = targetSeconds - remainder;
  const upper = lowerSeconds + cycleSeconds;
  return { status: "NOT_MULTIPLE", cycleSeconds, lowerSeconds, upperSeconds: upper > EXECUTION_BOUNDS.durationTarget.max ? null : upper };
}

export type PhaseCycleRounding = { readonly rank: number; readonly targetSeconds: number; readonly lowerSeconds: number; readonly upperSeconds: number | null };

export type PhaseCycleIssues = {
  /** Durée du motif, `null` sans contrôle (pas de phases, motif incomplet ou hors bornes, autre mode). */
  readonly cycleSeconds: number | null;
  /** Rangs (0-based) des séries plus courtes que le motif : enregistrement bloqué. */
  readonly belowRanks: readonly number[];
  /** Séries non multiples du motif, avec leurs arrondis. */
  readonly notMultiple: readonly PhaseCycleRounding[];
};

type ParametersLike = { readonly mode: ExecutionMode | null; readonly series: ExecutionSeries };

export function phaseCycleIssues(parameters: ParametersLike): PhaseCycleIssues {
  const cycle = parameters.mode === "DURATION" ? workPhasesCycleSeconds(parameters.series.workPhases) : null;
  const cycleSeconds = cycle !== null && cycle <= WORK_PATTERN_DURATION_BOUNDS.max ? cycle : null;
  if (cycleSeconds === null) return { cycleSeconds: null, belowRanks: [], notMultiple: [] };
  const belowRanks: number[] = [];
  const notMultiple: PhaseCycleRounding[] = [];
  seriesRowsOf(parameters).forEach((row, rank) => {
    if (row.target.kind !== "NUMBER") return;
    const fit = phaseCycleFit(row.target.value, cycleSeconds);
    if (fit.status === "BELOW") belowRanks.push(rank);
    else if (fit.status === "NOT_MULTIPLE") notMultiple.push({ rank, targetSeconds: row.target.value, lowerSeconds: fit.lowerSeconds, upperSeconds: fit.upperSeconds });
  });
  return { cycleSeconds, belowRanks, notMultiple };
}
