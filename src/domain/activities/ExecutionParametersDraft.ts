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
 *
 * Correction revue 1 (REV-01) : chaque ligne (active, retirée ou réservée
 * dans le dernier tableau variable) et la valeur uniforme portent une
 * IDENTITÉ volatile ; leurs cibles sont mémorisées PAR MODE et par identité.
 * Une réserve créée dans un mode ne fournit donc jamais de cible active
 * dans un autre mode (« — », jamais une conversion), quel que soit le
 * chemin (variable ↔ uniforme, N, déplacement, À l'échec) ; revenir au mode
 * précédent avant ✓ restaure ses dernières cibles.
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

/** Cibles mémorisées d'une identité de ligne, par mode visité pendant l'ouverture. */
type TargetsByMode = Readonly<Partial<Record<ExecutionMode, number | null>>>;

export type ExecutionSheetDraft = {
  readonly mode: ExecutionMode | null;
  /** N demandé (par côté). */
  readonly count: number;
  /** État variable DEMANDÉ — l'état effectif est uniforme à N=1. */
  readonly variable: boolean;
  /** Cible/Pause uniformes communes (cible du mode courant). */
  readonly uniform: SeriesRow;
  /** Lignes variables actives (longueur N quand `variable`), cibles du mode courant. */
  readonly rows: readonly SeriesRow[];
  /** Lignes retirées par une réduction de N, dans leur ordre relatif d'origine. */
  readonly hiddenRows: readonly SeriesRow[];
  /** Dernier tableau variable, restitué à la réactivation avant ✓. */
  readonly savedVariableRows: readonly SeriesRow[] | null;
  /** Identités volatiles alignées sur `rows`, `hiddenRows` et `savedVariableRows`. */
  readonly rowIds: readonly number[];
  readonly hiddenIds: readonly number[];
  readonly savedIds: readonly number[] | null;
  readonly uniformId: number;
  /** Cibles par identité et par mode (le mode courant est relu des lignes elles-mêmes). */
  readonly targetsById: Readonly<Record<number, TargetsByMode>>;
  readonly nextId: number;
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
  const variable = parameters.series.kind === "VARIABLE";
  const activeRows = variable ? rows : [];
  const rowIds = activeRows.map((_, index) => index + 1);
  const uniformId = rowIds.length + 1;
  const targetsById: Record<number, TargetsByMode> = {};
  const uniform = { target: rows[0]?.target ?? null, pauseSeconds: rows[0]?.pauseSeconds ?? 0 };
  if (parameters.mode !== null) {
    activeRows.forEach((row, index) => (targetsById[rowIds[index]!] = { [parameters.mode!]: row.target }));
    targetsById[uniformId] = { [parameters.mode]: uniform.target };
  }
  return {
    mode: parameters.mode,
    count: seriesCountOf(parameters),
    variable,
    uniform,
    rows: activeRows,
    hiddenRows: [],
    savedVariableRows: null,
    rowIds,
    hiddenIds: [],
    savedIds: null,
    uniformId,
    targetsById,
    nextId: uniformId + 1,
    sideMode: parameters.sideMode,
    sideOrder: parameters.sideOrder,
    sideRecoverySeconds: parameters.sideRecoverySeconds,
    cadenceBeepIntervalSeconds: parameters.cadenceBeepIntervalSeconds,
    countdownSeconds: parameters.countdownSeconds,
    endSeconds: parameters.endSeconds,
  };
}

/** Lignes sans propriété volatile (jamais d'identité transmise au parent). */
const plain = (row: SeriesRow): SeriesRow => ({ target: row.target, pauseSeconds: row.pauseSeconds });

/** Paramètres DEMANDÉS (avant normalisation N=1), état variable/ordre compris. */
function requestedParameters(draft: ExecutionSheetDraft): ExecutionParametersInput {
  return {
    version: 1,
    mode: draft.mode,
    series: draft.variable
      ? { kind: "VARIABLE", rows: draft.rows.map(plain) }
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
 * Mémorise, pour le mode courant, la cible affichée de chaque identité
 * (lignes actives, retirées, réservées, uniforme) avant une transition.
 */
function rememberCurrentTargets(draft: ExecutionSheetDraft): Record<number, TargetsByMode> {
  const targetsById: Record<number, TargetsByMode> = { ...draft.targetsById };
  if (draft.mode === null || draft.mode === "TO_FAILURE") {
    return targetsById;
  }
  const mode = draft.mode;
  const remember = (id: number, target: number | null) => {
    targetsById[id] = { ...targetsById[id], [mode]: target };
  };
  draft.rows.forEach((row, index) => remember(draft.rowIds[index]!, row.target));
  draft.hiddenRows.forEach((row, index) => remember(draft.hiddenIds[index]!, row.target));
  (draft.savedVariableRows ?? []).forEach((row, index) => remember(draft.savedIds![index]!, row.target));
  remember(draft.uniformId, draft.uniform.target);
  return targetsById;
}

/** Nouvelle identité copiant les cibles mémorisées de `sourceId` (copie de ligne). */
function cloneIdentity(
  targetsById: Record<number, TargetsByMode>,
  sourceId: number,
  nextId: number,
): { readonly id: number; readonly nextId: number } {
  targetsById[nextId] = { ...targetsById[sourceId] };
  return { id: nextId, nextId: nextId + 1 };
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
  const targetsById = rememberCurrentTargets(draft);
  let nextId = draft.nextId;
  let rows = [...draft.rows];
  let rowIds = [...draft.rowIds];
  let hiddenRows = [...draft.hiddenRows];
  let hiddenIds = [...draft.hiddenIds];
  if (count < rows.length) {
    hiddenRows = [...rows.slice(count), ...hiddenRows];
    hiddenIds = [...rowIds.slice(count), ...hiddenIds];
    rows = rows.slice(0, count);
    rowIds = rowIds.slice(0, count);
  } else {
    while (rows.length < count) {
      const restored = hiddenRows.shift();
      const restoredId = hiddenIds.shift();
      if (restored && restoredId !== undefined) {
        rows.push({ ...restored });
        rowIds.push(restoredId);
      } else {
        const sourceId = rowIds[rowIds.length - 1] ?? draft.uniformId;
        const clone = cloneIdentity(targetsById, sourceId, nextId);
        nextId = clone.nextId;
        rows.push({ ...(rows[rows.length - 1] ?? draft.uniform) });
        rowIds.push(clone.id);
      }
    }
  }
  return { ...draft, count, rows, rowIds, hiddenRows, hiddenIds, targetsById, nextId };
}

/**
 * Active/désactive « Séries variables » (P3-05). Activation : chaque ligne
 * copie la cible/Pause uniformes, ou restitue le dernier tableau variable de
 * cette ouverture (avec la cible MÉMORISÉE POUR LE MODE COURANT, « — » sinon).
 * Désactivation : l'uniforme reprend la PREMIÈRE ligne dans l'ordre courant.
 * Jamais déduit de l'égalité des valeurs.
 */
export function setVariable(draft: ExecutionSheetDraft, variable: boolean): ExecutionSheetDraft {
  if (variable === draft.variable) {
    return draft;
  }
  const targetsById = rememberCurrentTargets(draft);
  let nextId = draft.nextId;
  if (!variable) {
    const first = draft.rows[0] ?? draft.uniform;
    const firstId = draft.rowIds[0] ?? draft.uniformId;
    const uniform = cloneIdentity(targetsById, firstId, nextId);
    return {
      ...draft,
      variable: false,
      uniform: { ...first },
      uniformId: uniform.id,
      savedVariableRows: [...draft.rows, ...draft.hiddenRows],
      savedIds: [...draft.rowIds, ...draft.hiddenIds],
      rows: [],
      rowIds: [],
      hiddenRows: [],
      hiddenIds: [],
      targetsById,
      nextId: uniform.nextId,
    };
  }
  const rows: SeriesRow[] = [];
  const rowIds: number[] = [];
  const hiddenRows: SeriesRow[] = [];
  const hiddenIds: number[] = [];
  const saved = draft.savedVariableRows;
  if (saved && saved.length > 0) {
    saved.forEach((row, index) => {
      const target = index < draft.count;
      (target ? rows : hiddenRows).push({ ...row });
      (target ? rowIds : hiddenIds).push(draft.savedIds![index]!);
    });
    while (rows.length < draft.count) {
      const clone = cloneIdentity(targetsById, rowIds[rowIds.length - 1]!, nextId);
      nextId = clone.nextId;
      rows.push({ ...rows[rows.length - 1]! });
      rowIds.push(clone.id);
    }
  } else {
    for (let index = 0; index < draft.count; index += 1) {
      const clone = cloneIdentity(targetsById, draft.uniformId, nextId);
      nextId = clone.nextId;
      rows.push({ ...draft.uniform });
      rowIds.push(clone.id);
    }
  }
  return { ...draft, variable: true, rows, rowIds, hiddenRows, hiddenIds, targetsById, nextId };
}

/**
 * Change de mode (P3-04) : N, Pauses, bip, côtés conservés ; cibles
 * incompatibles « — » (null, jamais zéro) ; retour à un mode déjà visité
 * pendant cette ouverture → ses cibles sont restaurées, identité par
 * identité (lignes actives, retirées et réservées). Création (mode jusqu'ici
 * non renseigné) en Répétitions uniforme : cible initiale 1.
 */
export function setMode(draft: ExecutionSheetDraft, mode: ExecutionMode): ExecutionSheetDraft {
  if (mode === draft.mode) {
    return draft;
  }
  const targetsById = rememberCurrentTargets(draft);
  const targetFor = (id: number): number | null => (mode === "TO_FAILURE" ? null : (targetsById[id]?.[mode] ?? null));
  const retarget = (rows: readonly SeriesRow[], ids: readonly number[]) =>
    rows.map((row, index) => ({ ...row, target: targetFor(ids[index]!) }));
  const initialUniform = draft.mode === null && mode === "REPETITIONS" && !draft.variable ? 1 : null;
  const uniformTarget = targetsById[draft.uniformId]?.[mode] !== undefined ? targetFor(draft.uniformId) : initialUniform;
  return {
    ...draft,
    mode,
    targetsById,
    uniform: { ...draft.uniform, target: mode === "TO_FAILURE" ? null : uniformTarget },
    rows: retarget(draft.rows, draft.rowIds),
    hiddenRows: retarget(draft.hiddenRows, draft.hiddenIds),
    savedVariableRows: draft.savedVariableRows ? retarget(draft.savedVariableRows, draft.savedIds!) : null,
  };
}

/**
 * Cible/Pause uniformes. À N=1 en état variable DEMANDÉ, l'état effectif est
 * uniforme sur la première ligne : le réglage affiché modifie donc cette
 * ligne (aucun contrôle actif sans effet, REV-02), et la valeur uniforme.
 */
export function setUniformTarget(draft: ExecutionSheetDraft, target: number | null): ExecutionSheetDraft {
  const rows = draft.variable && draft.rows.length > 0 ? draft.rows.map((row, index) => (index === 0 ? { ...row, target } : row)) : draft.rows;
  return { ...draft, rows, uniform: { ...draft.uniform, target } };
}

export function setUniformPause(draft: ExecutionSheetDraft, pauseSeconds: number): ExecutionSheetDraft {
  const rows =
    draft.variable && draft.rows.length > 0 ? draft.rows.map((row, index) => (index === 0 ? { ...row, pauseSeconds } : row)) : draft.rows;
  return { ...draft, rows, uniform: { ...draft.uniform, pauseSeconds } };
}

export function setRowTarget(draft: ExecutionSheetDraft, index: number, target: number | null): ExecutionSheetDraft {
  return { ...draft, rows: draft.rows.map((row, current) => (current === index ? { ...row, target } : row)) };
}

export function setRowPause(draft: ExecutionSheetDraft, index: number, pauseSeconds: number): ExecutionSheetDraft {
  return { ...draft, rows: draft.rows.map((row, current) => (current === index ? { ...row, pauseSeconds } : row)) };
}

/**
 * Déplace une Série (P3-07) : cible, Pause et identité voyagent ensemble,
 * les lignes sont renumérotées par leur position ; la nouvelle dernière
 * ligne porte PN. Indices hors bornes : aucun changement.
 */
export function moveRow(draft: ExecutionSheetDraft, from: number, to: number): ExecutionSheetDraft {
  if (from === to || from < 0 || to < 0 || from >= draft.rows.length || to >= draft.rows.length) {
    return draft;
  }
  const rows = [...draft.rows];
  const rowIds = [...draft.rowIds];
  const [moved] = rows.splice(from, 1);
  const [movedId] = rowIds.splice(from, 1);
  rows.splice(to, 0, moved!);
  rowIds.splice(to, 0, movedId!);
  return { ...draft, rows, rowIds };
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

/** Le total est éditable (roulette d'inversion) exactement quand l'état EFFECTIF est Durée uniforme renseignée. */
export function isRequestedTotalEditable(draft: ExecutionSheetDraft): boolean {
  return isTotalDurationInvertible(effectiveParameters(draft));
}

/**
 * Inversion de la Durée totale (P3-14) — réservée à la Durée uniforme
 * EFFECTIVE. Correction revue 1 (REV-02) : à N=1 depuis un tableau variable
 * (effectif uniforme sur la première ligne), l'inversion s'applique aussi ;
 * le brouillon passe en uniforme sur cette première ligne — exactement la
 * base du calcul affiché — et le tableau reste réservé (réactivation avant ✓
 * le restitue). Le total réalisé est donc toujours celui annoncé.
 */
export function applyRequestedTotal(
  draft: ExecutionSheetDraft,
  requestedSeconds: number,
): { readonly draft: ExecutionSheetDraft; readonly inversion: TotalDurationInversion } | null {
  const parameters = effectiveParameters(draft);
  if (!isTotalDurationInvertible(parameters)) {
    return null;
  }
  const inversion = invertTotalDuration(parameters, requestedSeconds);
  const uniform = draft.variable ? setVariable(draft, false) : draft;
  return { draft: { ...uniform, count: inversion.seriesCount }, inversion };
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
