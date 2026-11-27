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

/**
 * Recette iPhone du 26/11/2026 (soir, Hermann : « Death by : Incrément par tour d'un exercice qui a un mouvement avec des phases :
 * l'incrément doit être un multiple de la somme des phases (message d'information avec proposition inférieure, supérieure, ou annuler).
 * Ce n'est pas une obligation. ») — incrément en Durée du Death by comparé à la durée du motif des phases. `null` : rien à proposer
 * (multiple exact, pas de motif). Le multiple inférieur n'est proposé que s'il reste ≥ 1 s (l'incrément du Death by est au moins + 1,
 * Formats « Règle » du complément du 5 novembre, §13) ; le supérieur, que s'il reste dans la borne `max` du champ.
 */
export function incrementCycleRounding(
  incrementSeconds: number,
  cycleSeconds: number | null,
  max: number,
): { readonly lowerSeconds: number | null; readonly upperSeconds: number | null } | null {
  if (cycleSeconds === null || cycleSeconds <= 0 || incrementSeconds <= 0) return null;
  const remainder = incrementSeconds % cycleSeconds;
  if (remainder === 0) return null;
  const lower = incrementSeconds - remainder;
  const upper = lower + cycleSeconds;
  const rounding = { lowerSeconds: lower >= 1 ? lower : null, upperSeconds: upper <= max ? upper : null };
  return rounding.lowerSeconds === null && rounding.upperSeconds === null ? null : rounding;
}

/** `lowerSeconds` : `null` pour une série plus courte que le motif (aucun multiple inférieur non nul). */
export type PhaseCycleRounding = { readonly rank: number; readonly targetSeconds: number; readonly lowerSeconds: number | null; readonly upperSeconds: number | null };

export type PhaseCycleIssues = {
  /** Durée du motif, `null` sans contrôle (pas de phases, motif incomplet ou hors bornes, autre mode). */
  readonly cycleSeconds: number | null;
  /**
   * Rangs (0-based) des séries plus courtes que le motif. Recette du 16/11/2026 (Autres constats a, Hermann : « Tours identiques : un objectif de durée qui est inférieur à la somme de la durée des phases affiche un texte en rouge, et bloque la validation. Retirer le texte rouge et afficher la même fenêtre de message qui propose un arrondi inférieur et supérieur lorsque l'objectif de durée est supérieur à la durée des phases sans être un arrondi. ») :
   * toujours vide — une série plus courte que le motif demande l'arrondi (`notMultiple`, au motif). [Enregistrement bloqué,
   * message rouge — remplacé le 16/11/2026.]
   */
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
    if (fit.status === "BELOW") notMultiple.push({ rank, targetSeconds: row.target.value, lowerSeconds: null, upperSeconds: cycleSeconds });
    else if (fit.status === "NOT_MULTIPLE") notMultiple.push({ rank, targetSeconds: row.target.value, lowerSeconds: fit.lowerSeconds, upperSeconds: fit.upperSeconds });
  });
  return { cycleSeconds, belowRanks, notMultiple };
}
