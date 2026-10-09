/**
 * PRE-3 — machine de brouillon PURE de la feuille Paramètres (v13 §3,
 * `perimetre-et-couverture.md` §5).
 *
 * Ouvrir la feuille copie les paramètres du parent dans un sous-brouillon
 * isolé ; ✕/retour système l'abandonne simplement (le parent n'a jamais été
 * touché) ; ✓ (`commitSheetDraft`) produit atomiquement les paramètres
 * EFFECTIFS valides à appliquer au parent, sans aucune persistance. Les
 * réserves (lignes retirées par réduction de N, dernier tableau variable,
 * cibles par mode, ordre des côtés demandé à N≥2) sont volatiles : elles
 * n'existent que pendant cette ouverture et ne sont jamais transmises.
 */

import {
  cloneExecutionParameters,
  EXECUTION_BOUNDS,
  normalizeEffective,
  seriesCountOf,
  seriesRowsOf,
  validateExecutionParameters,
  type ExecutionMode,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type ExecutionParametersViolation,
  type SeriesRow,
  type SideOrder,
} from "./ExecutionParameters";
import { invertTotalDuration, isTotalDurationInvertible, type TotalDurationInversion } from "./executionCalculations";
import type { SideMode } from "@/domain/sessions/sideMode";

type ModeTargets = {
  readonly uniformTarget: number | null;
  readonly rowTargets: readonly (number | null)[];
  readonly hiddenTargets: readonly (number | null)[];
};

export type ExecutionSheetDraft = {
  readonly mode: ExecutionMode | null;
  /** N demandé (par côté). */
  readonly count: number;
  /** État variable DEMANDÉ — l'état effectif est uniforme à N=1. */
  readonly variable: boolean;
  /** Cible/Pause uniformes communes. */
  readonly uniform: SeriesRow;
  /** Lignes variables actives (longueur N quand `variable`). */
  readonly rows: readonly SeriesRow[];
  /** Lignes retirées par une réduction de N, dans leur ordre relatif d'origine. */
  readonly hiddenRows: readonly SeriesRow[];
  /** Dernier tableau variable, restitué à la réactivation avant ✓. */
  readonly savedVariableRows: readonly SeriesRow[] | null;
  /** Cibles du dernier passage dans chaque mode, restaurées au retour avant ✓. */
  readonly targetsByMode: Readonly<Partial<Record<ExecutionMode, ModeTargets>>>;
  readonly sideMode: SideMode | null;
  /** Ordre DEMANDÉ — l'ordre effectif est « Un côté après l'autre » à N=1. */
  readonly sideOrder: SideOrder;
  readonly sideRecoverySeconds: number;
  readonly cadenceBeepIntervalSeconds: number;
  readonly countdownSeconds: number;
  readonly endSeconds: number;
};

/** Copie des paramètres du parent à l'ouverture — aucune réserve héritée. */
export function openSheetDraft(parent: ExecutionParametersInput): ExecutionSheetDraft {
  const parameters = cloneExecutionParameters(parent);
  const rows = seriesRowsOf(parameters).map((row) => ({ ...row }));
  return {
    mode: parameters.mode,
    count: seriesCountOf(parameters),
    variable: parameters.series.kind === "VARIABLE",
    uniform: { target: rows[0]?.target ?? null, pauseSeconds: rows[0]?.pauseSeconds ?? 0 },
    rows: parameters.series.kind === "VARIABLE" ? rows : [],
    hiddenRows: [],
    savedVariableRows: null,
    targetsByMode: {},
    sideMode: parameters.sideMode,
    sideOrder: parameters.sideOrder,
    sideRecoverySeconds: parameters.sideRecoverySeconds,
    cadenceBeepIntervalSeconds: parameters.cadenceBeepIntervalSeconds,
    countdownSeconds: parameters.countdownSeconds,
    endSeconds: parameters.endSeconds,
  };
}

/** Paramètres DEMANDÉS (avant normalisation N=1), état variable/ordre compris. */
function requestedParameters(draft: ExecutionSheetDraft): ExecutionParametersInput {
  return {
    version: 1,
    mode: draft.mode,
    series: draft.variable
      ? { kind: "VARIABLE", rows: draft.rows }
      : { kind: "UNIFORM", count: draft.count, target: draft.uniform.target, pauseSeconds: draft.uniform.pauseSeconds },
    sideMode: draft.sideMode,
    sideOrder: draft.sideOrder,
    sideRecoverySeconds: draft.sideRecoverySeconds,
    cadenceBeepIntervalSeconds: draft.cadenceBeepIntervalSeconds,
    countdownSeconds: draft.countdownSeconds,
    endSeconds: draft.endSeconds,
  };
}

/**
 * Paramètres EFFECTIFS du brouillon, utilisés pour le calcul, la phrase et
 * l'affichage : à N=1, uniforme sur la première ligne courante et « Un côté
 * après l'autre », immédiatement (P3-08/immediate-N1).
 */
export function effectiveParameters(draft: ExecutionSheetDraft): ExecutionParametersInput {
  return normalizeEffective(requestedParameters(draft));
}

/** Contrôles « sans effet » à N=1 : interrupteur variable et Ordre des côtés grisés. */
export function isSingleSeries(draft: ExecutionSheetDraft): boolean {
  return draft.count === 1;
}

function clampCount(count: number): number {
  return Math.min(Math.max(Math.trunc(count), EXECUTION_BOUNDS.seriesCount.min), EXECUTION_BOUNDS.seriesCount.max);
}

/**
 * Change N (P3-06) : réduire retire les dernières lignes actives et les
 * conserve dans leur ordre relatif ; remonter restaure d'abord ces lignes,
 * puis clone la dernière ligne active. Uniforme : seul N change.
 */
export function setSeriesCount(draft: ExecutionSheetDraft, requested: number): ExecutionSheetDraft {
  const count = clampCount(requested);
  if (!draft.variable) {
    return { ...draft, count };
  }
  let rows = [...draft.rows];
  let hiddenRows = [...draft.hiddenRows];
  if (count < rows.length) {
    hiddenRows = [...rows.slice(count), ...hiddenRows];
    rows = rows.slice(0, count);
  } else {
    while (rows.length < count) {
      const restored = hiddenRows.shift();
      rows.push(restored ? { ...restored } : { ...(rows[rows.length - 1] ?? draft.uniform) });
    }
  }
  return { ...draft, count, rows, hiddenRows };
}

/**
 * Active/désactive « Séries variables » (P3-05). Activation : chaque ligne
 * copie la cible/Pause uniformes, ou restitue le dernier tableau variable de
 * cette ouverture. Désactivation : l'uniforme reprend la PREMIÈRE ligne dans
 * l'ordre courant. Jamais déduit de l'égalité des valeurs.
 */
export function setVariable(draft: ExecutionSheetDraft, variable: boolean): ExecutionSheetDraft {
  if (variable === draft.variable) {
    return draft;
  }
  if (!variable) {
    const first = draft.rows[0] ?? draft.uniform;
    return {
      ...draft,
      variable: false,
      uniform: { ...first },
      savedVariableRows: [...draft.rows, ...draft.hiddenRows],
      rows: [],
      hiddenRows: [],
    };
  }
  const source = draft.savedVariableRows;
  const rows: SeriesRow[] = [];
  const hiddenRows: SeriesRow[] = [];
  if (source && source.length > 0) {
    source.forEach((row, index) => (index < draft.count ? rows : hiddenRows).push({ ...row }));
    while (rows.length < draft.count) {
      rows.push({ ...rows[rows.length - 1]! });
    }
  } else {
    for (let index = 0; index < draft.count; index += 1) {
      rows.push({ ...draft.uniform });
    }
  }
  return { ...draft, variable: true, rows, hiddenRows };
}

function captureTargets(draft: ExecutionSheetDraft): ModeTargets {
  return {
    uniformTarget: draft.uniform.target,
    rowTargets: draft.rows.map((row) => row.target),
    hiddenTargets: draft.hiddenRows.map((row) => row.target),
  };
}

/**
 * Change de mode (P3-04) : N, Pauses, bip, côtés conservés ; cibles
 * incompatibles « — » (null, jamais zéro) ; retour à un mode déjà visité
 * pendant cette ouverture → ses cibles sont restaurées. Création (mode
 * jusqu'ici non renseigné) en Répétitions uniforme : cible initiale 1.
 */
export function setMode(draft: ExecutionSheetDraft, mode: ExecutionMode): ExecutionSheetDraft {
  if (mode === draft.mode) {
    return draft;
  }
  const targetsByMode =
    draft.mode === null ? draft.targetsByMode : { ...draft.targetsByMode, [draft.mode]: captureTargets(draft) };
  const restored = targetsByMode[mode];
  const initialUniform = draft.mode === null && mode === "REPETITIONS" && !draft.variable ? 1 : null;
  const withTarget = (row: SeriesRow, target: number | null): SeriesRow => ({ ...row, target });
  if (mode === "TO_FAILURE") {
    return {
      ...draft,
      mode,
      targetsByMode,
      uniform: withTarget(draft.uniform, null),
      rows: draft.rows.map((row) => withTarget(row, null)),
      hiddenRows: draft.hiddenRows.map((row) => withTarget(row, null)),
    };
  }
  return {
    ...draft,
    mode,
    targetsByMode,
    uniform: withTarget(draft.uniform, restored ? restored.uniformTarget : initialUniform),
    rows: draft.rows.map((row, index) => withTarget(row, restored?.rowTargets[index] ?? null)),
    hiddenRows: draft.hiddenRows.map((row, index) => withTarget(row, restored?.hiddenTargets[index] ?? null)),
  };
}

export function setUniformTarget(draft: ExecutionSheetDraft, target: number | null): ExecutionSheetDraft {
  return { ...draft, uniform: { ...draft.uniform, target } };
}

export function setUniformPause(draft: ExecutionSheetDraft, pauseSeconds: number): ExecutionSheetDraft {
  return { ...draft, uniform: { ...draft.uniform, pauseSeconds } };
}

export function setRowTarget(draft: ExecutionSheetDraft, index: number, target: number | null): ExecutionSheetDraft {
  return { ...draft, rows: draft.rows.map((row, current) => (current === index ? { ...row, target } : row)) };
}

export function setRowPause(draft: ExecutionSheetDraft, index: number, pauseSeconds: number): ExecutionSheetDraft {
  return { ...draft, rows: draft.rows.map((row, current) => (current === index ? { ...row, pauseSeconds } : row)) };
}

/**
 * Déplace une Série (P3-07) : cible et Pause voyagent ensemble, les lignes
 * sont renumérotées par leur position ; la nouvelle dernière ligne porte PN.
 * Indices hors bornes : aucun changement (Monter sur la première, Descendre
 * sur la dernière).
 */
export function moveRow(draft: ExecutionSheetDraft, from: number, to: number): ExecutionSheetDraft {
  if (from === to || from < 0 || to < 0 || from >= draft.rows.length || to >= draft.rows.length) {
    return draft;
  }
  const rows = [...draft.rows];
  const [moved] = rows.splice(from, 1);
  rows.splice(to, 0, moved!);
  return { ...draft, rows };
}

export function setSideMode(
  draft: ExecutionSheetDraft,
  sideMode: SideMode,
  profileSideRecoverySecondsDefault: number,
): ExecutionSheetDraft {
  const activating = (draft.sideMode === null || draft.sideMode === "UNILATERAL") && sideMode !== "UNILATERAL";
  return {
    ...draft,
    sideMode,
    // P3-10 : la Pause entre les côtés est copiée du Profil à l'activation, jamais relue ensuite.
    sideRecoverySeconds: activating ? profileSideRecoverySecondsDefault : draft.sideRecoverySeconds,
  };
}

export function setSideOrder(draft: ExecutionSheetDraft, sideOrder: SideOrder): ExecutionSheetDraft {
  return { ...draft, sideOrder };
}

export function setSideRecovery(draft: ExecutionSheetDraft, sideRecoverySeconds: number): ExecutionSheetDraft {
  return { ...draft, sideRecoverySeconds };
}

export function setCadenceBeep(draft: ExecutionSheetDraft, cadenceBeepIntervalSeconds: number): ExecutionSheetDraft {
  return { ...draft, cadenceBeepIntervalSeconds };
}

export function setCountdown(draft: ExecutionSheetDraft, countdownSeconds: number): ExecutionSheetDraft {
  return { ...draft, countdownSeconds };
}

export function setEnd(draft: ExecutionSheetDraft, endSeconds: number): ExecutionSheetDraft {
  return { ...draft, endSeconds };
}

/** Inversion de la Durée totale (P3-14) — réservée à la Durée uniforme. */
export function applyRequestedTotal(
  draft: ExecutionSheetDraft,
  requestedSeconds: number,
): { readonly draft: ExecutionSheetDraft; readonly inversion: TotalDurationInversion } | null {
  const parameters = effectiveParameters(draft);
  if (draft.variable || !isTotalDurationInvertible(parameters)) {
    return null;
  }
  const inversion = invertTotalDuration(parameters, requestedSeconds);
  return { draft: { ...draft, count: inversion.seriesCount }, inversion };
}

export type SheetCommitResult =
  | { readonly ok: true; readonly value: ExecutionParameters }
  | { readonly ok: false; readonly violations: readonly ExecutionParametersViolation[] };

/**
 * ✓ (P3-16) : valide l'état EFFECTIF (repli du tableau sans effet) ; succès
 * → paramètres normalisés à appliquer atomiquement au parent, réserves
 * abandonnées ; échec → aucune application, violations nommant la Série.
 */
export function commitSheetDraft(draft: ExecutionSheetDraft): SheetCommitResult {
  return validateExecutionParameters(effectiveParameters(draft));
}

/** Première Série incomplète (message « Série n », v13 §6), ou `null`. */
export function firstIncompleteSeries(violations: readonly ExecutionParametersViolation[]): number | null {
  const withSeries = violations.find((violation) => violation.field === "target" && violation.seriesNumber);
  return withSeries?.seriesNumber ?? null;
}
