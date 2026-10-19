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
 * chemin (variable ↔ uniforme, N, déplacement) ; revenir au mode précédent
 * avant ✓ restaure ses dernières cibles.
 *
 * PRE-4 (story 1.1, adaptation mécanique) : les Cibles sont typées
 * (`SeriesTarget`) ; une Cible à renseigner est `UNSET` (jamais `null`). Une
 * Cible `FAILURE` est conservée au changement de Mode et recopiée quand N
 * augmente depuis une dernière ligne à l'échec. Réserves et identités de
 * ligne : étendues par la story 3.2 (ci-dessous).
 *
 * PRE-4 (story 3.2, AD-2, AD-13) : extension sans réécriture.
 * - Retrait d'une ligne (`removeRow`) et son instantané d'annulation
 *   (`pendingRemoval`, `undoRemoval`). TOUTE transition qui modifie le
 *   Brouillon l'invalide (Q29 : Cible, Pause, N, Mode, Régime, Bip, Pause
 *   commune, réordonnancement, autre retrait, et les autres réglages). Le
 *   Brouillon n'expose aucune transition d'ouverture ou de fermeture de
 *   surface : ces gestes, sans application, ne l'invalident donc jamais.
 *   Seules les transitions sans effet déjà existantes (même Mode, même
 *   Régime, déplacement sur place ou hors bornes) rendent le Brouillon
 *   inchangé, annulation comprise.
 * - Ligne de base alignée par identité (`originById`) : chaque identité
 *   issue du parent garde le rang de sa ligne d'origine dans les paramètres
 *   ouverts (`openedRows`) ; une ligne ajoutée par N n'en a pas. Au ✓,
 *   `commitSheetDraft` rapproche ces rangs de la ligne de base par valeur
 *   (`alignRowsToBaseline`), puis transmet l'alignement à `validateForSave`.
 *   Index de ligne hors bornes ou annulation devenue incohérente : Brouillon
 *   inchangé.
 * - Indicateur « N hérité » (`inheritedSeriesCount`, P42) : entrée
 *   d'ouverture, jamais persistée ni transmise ; il ne rend indisponible
 *   que l'Inversion du total.
 *
 * PRE-5 (story 1.1, AD-25, AD-33) : transport seulement, sans transition
 * nouvelle. Le Brouillon porte les phases (`workPhases`, forme brouillon
 * d'AD-20, et `nextPhaseId`), l'activation de la charge (`loadEnabled`) et
 * `loadKg` dans l'uniforme et dans chaque ligne (actives, retirées, réservées) :
 * `openSheetDraft`, `plain` et `requestedParameters` les recopient, pour
 * qu'aucun ✓ ne perde une donnée lue (`requestedParameters(openSheetDraft(p))` = `p`).
 */

import {
  alignRowsToBaseline,
  cloneExecutionParameters,
  EXECUTION_BOUNDS,
  EXECUTION_PARAMETERS_VERSION,
  normalizeEffective,
  numberTarget,
  seriesCountOf,
  seriesRowsOf,
  unsetTarget,
  validateForSave,
  type ExecutionMode,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type ExecutionParametersViolation,
  type SeriesRow,
  type SeriesTarget,
  type SideOrder,
  type WorkPhase,
} from "./ExecutionParameters";
import { invertTotalDuration, isTotalDurationInvertible, type TotalDurationInversion } from "./executionCalculations";
import type { SideMode } from "@/domain/sessions/sideMode";

/** Cibles mémorisées d'une identité de ligne, par mode visité pendant l'ouverture. */
type TargetsByMode = Readonly<Partial<Record<ExecutionMode, SeriesTarget>>>;

/**
 * Instantané d'annulation d'un retrait (story 3.2, AC10) : la ligne retirée,
 * son identité et sa position 0-indexée dans l'ordre d'alors.
 */
export type PendingRemoval = {
  readonly index: number;
  readonly row: SeriesRow;
  readonly rowId: number;
};

export type OpenSheetDraftOptions = {
  /** N marqué hérité d'un circuit de séries (P42) : entrée seulement, jamais persistée. */
  readonly inheritedSeriesCount?: boolean;
};

/**
 * Phase dans le Brouillon (AD-20, AD-25) : une durée `null` est à renseigner ;
 * aucune transition de la story 1.1 n'en crée (`normalizeWorkPhases` et
 * `sheetDraftResult` arrivent avec la story 2.1).
 */
export type DraftWorkPhase = {
  readonly id: number;
  readonly label: string;
  readonly durationSeconds: number | null;
};

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
  /**
   * Rang 0-indexé, dans les paramètres ouverts, de la ligne d'origine de
   * chaque identité (AD-13). Absent : ligne nouvelle, sans ligne de base.
   */
  readonly originById: Readonly<Record<number, number>>;
  /** Lignes des paramètres ouverts (uniforme développé), pour rapprocher `originById` de la ligne de base au ✓. */
  readonly openedRows: readonly SeriesRow[];
  readonly nextId: number;
  /** Annulation du dernier retrait, `null` si aucune ou invalidée (Q29). */
  readonly pendingRemoval: PendingRemoval | null;
  /** N hérité (P42) : rend l'Inversion du total indisponible ; aucune autre règle. */
  readonly inheritedSeriesCount: boolean;
  readonly sideMode: SideMode | null;
  /** Ordre DEMANDÉ — l'ordre effectif est « Un côté après l'autre » à N=1. */
  readonly sideOrder: SideOrder;
  readonly sideRecoverySeconds: number;
  readonly cadenceBeepIntervalSeconds: number;
  readonly countdownSeconds: number;
  readonly endSeconds: number;
  /** Phases de l'exercice (AD-20, AD-25), dans l'ordre d'exécution ; `[]` = « Aucune ». */
  readonly workPhases: readonly DraftWorkPhase[];
  /** Prochaine identité de phase : max(`id`) + 1 à l'ouverture, 1 si aucune phase (AD-27). */
  readonly nextPhaseId: number;
  /** Charge Avec / Sans (AD-19) ; les `loadKg` restent portés sous Sans. */
  readonly loadEnabled: boolean;
};

/** Copie des paramètres du parent à l'ouverture — aucune réserve héritée. */
export function openSheetDraft(parent: ExecutionParametersInput, options: OpenSheetDraftOptions = {}): ExecutionSheetDraft {
  const parameters = cloneExecutionParameters(parent);
  const rows = seriesRowsOf(parameters).map((row) => ({ ...row }));
  const variable = parameters.series.kind === "VARIABLE";
  const activeRows = variable ? rows : [];
  const rowIds = activeRows.map((_, index) => index + 1);
  const uniformId = rowIds.length + 1;
  // AD-13 : chaque ligne ouverte a pour base la ligne de même rang du parent ;
  // la valeur uniforme est celle de la première ligne.
  const originById: Record<number, number> = { [uniformId]: 0 };
  rowIds.forEach((id, index) => (originById[id] = index));
  const targetsById: Record<number, TargetsByMode> = {};
  const first = rows[0];
  const uniform = first ? plain(first) : { target: unsetTarget(), pauseSeconds: 0, loadKg: 0 };
  const workPhases: readonly WorkPhase[] = parameters.series.kind === "UNIFORM" ? parameters.series.workPhases : [];
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
    originById,
    openedRows: rows.map(plain),
    nextId: uniformId + 1,
    pendingRemoval: null,
    inheritedSeriesCount: options.inheritedSeriesCount ?? false,
    sideMode: parameters.sideMode,
    sideOrder: parameters.sideOrder,
    sideRecoverySeconds: parameters.sideRecoverySeconds,
    cadenceBeepIntervalSeconds: parameters.cadenceBeepIntervalSeconds,
    countdownSeconds: parameters.countdownSeconds,
    endSeconds: parameters.endSeconds,
    workPhases: workPhases.map((phase) => ({ id: phase.id, label: phase.label, durationSeconds: phase.durationSeconds })),
    nextPhaseId: workPhases.reduce((max, phase) => Math.max(max, phase.id), 0) + 1,
    loadEnabled: parameters.loadEnabled,
  };
}

/**
 * Lignes sans propriété volatile (jamais d'identité transmise au parent).
 * PRE-5 (AD-19, AD-25) : la charge suit la ligne.
 */
function plain(row: SeriesRow): SeriesRow {
  return { target: row.target, pauseSeconds: row.pauseSeconds, loadKg: row.loadKg };
}

/**
 * Paramètres DEMANDÉS (avant normalisation N=1), état variable/ordre compris.
 * PRE-5 (AD-25) : phases, charge commune et activation de la charge comprises ;
 * une durée de phase `null` (à renseigner) est transmise comme 0, que la
 * validation refuse. Exportée pour le test d'aller-retour.
 */
export function requestedParameters(draft: ExecutionSheetDraft): ExecutionParametersInput {
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: draft.mode,
    series: draft.variable
      ? { kind: "VARIABLE", rows: draft.rows.map(plain) }
      : {
          kind: "UNIFORM",
          count: draft.count,
          target: draft.uniform.target,
          pauseSeconds: draft.uniform.pauseSeconds,
          loadKg: draft.uniform.loadKg,
          workPhases: draft.workPhases.map((phase) => ({
            id: phase.id,
            label: phase.label,
            durationSeconds: phase.durationSeconds ?? 0,
          })),
        },
    sideMode: draft.sideMode,
    sideOrder: draft.sideOrder,
    sideRecoverySeconds: draft.sideRecoverySeconds,
    cadenceBeepIntervalSeconds: draft.cadenceBeepIntervalSeconds,
    countdownSeconds: draft.countdownSeconds,
    endSeconds: draft.endSeconds,
    loadEnabled: draft.loadEnabled,
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

/**
 * Contrôles « sans effet » à N=1 : interrupteur variable grisé ; Ordre des côtés
 * masqué (Q38), sa valeur `sideOrder` restant conservée dans le Brouillon.
 */
export function isSingleSeries(draft: ExecutionSheetDraft): boolean {
  return draft.count === 1;
}

function clampCount(count: number): number {
  return Math.min(Math.max(Math.trunc(count), EXECUTION_BOUNDS.seriesCount.min), EXECUTION_BOUNDS.seriesCount.max);
}

/** Q29 : toute modification du Brouillon invalide l'annulation d'un retrait. */
function modified(draft: ExecutionSheetDraft): ExecutionSheetDraft {
  return draft.pendingRemoval === null ? draft : { ...draft, pendingRemoval: null };
}

/**
 * Une identité qui COPIE une valeur existante sans la modifier (passage de
 * Régime) garde la ligne de base de sa source (AD-13, H25).
 */
function inheritOrigin(originById: Record<number, number>, id: number, sourceId: number): void {
  const origin = originById[sourceId];
  if (origin !== undefined) {
    originById[id] = origin;
  }
}

/**
 * Mémorise, pour le mode courant, la cible affichée de chaque identité
 * (lignes actives, retirées, réservées, uniforme) avant une transition.
 */
function rememberCurrentTargets(draft: ExecutionSheetDraft): Record<number, TargetsByMode> {
  const targetsById: Record<number, TargetsByMode> = { ...draft.targetsById };
  if (draft.mode === null) {
    return targetsById;
  }
  const mode = draft.mode;
  const remember = (id: number, target: SeriesTarget) => {
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
    return modified({ ...draft, count });
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
        rows.push({ ...restored, target: { ...restored.target } });
        rowIds.push(restoredId);
      } else {
        const sourceId = rowIds[rowIds.length - 1] ?? draft.uniformId;
        const clone = cloneIdentity(targetsById, sourceId, nextId);
        nextId = clone.nextId;
        // Story 1.3 (AD-9) : la ligne ajoutée copie la dernière (Cible `FAILURE`
        // et Pause comprises) sans partager l'objet de sa Cible.
        const last = rows[rows.length - 1] ?? draft.uniform;
        rows.push({ ...last, target: { ...last.target } });
        rowIds.push(clone.id);
      }
    }
  }
  // Une ligne ajoutée par N est NOUVELLE : aucune ligne de base (AD-13).
  return { ...draft, count, rows, rowIds, hiddenRows, hiddenIds, targetsById, nextId, pendingRemoval: null };
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
  const originById: Record<number, number> = { ...draft.originById };
  let nextId = draft.nextId;
  if (!variable) {
    const first = draft.rows[0] ?? draft.uniform;
    const firstId = draft.rowIds[0] ?? draft.uniformId;
    const uniform = cloneIdentity(targetsById, firstId, nextId);
    inheritOrigin(originById, uniform.id, firstId);
    return {
      ...draft,
      pendingRemoval: null,
      originById,
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
      // Sans tableau réservé, l'uniforme est celui ouvert : la k-ième copie a pour
      // origine la k-ième ligne développée du parent (origines distinctes) ; au-delà, aucune.
      if (draft.originById[draft.uniformId] !== undefined && index < draft.openedRows.length) {
        originById[clone.id] = index;
      }
      nextId = clone.nextId;
      rows.push({ ...draft.uniform });
      rowIds.push(clone.id);
    }
  }
  return {
    ...draft,
    variable: true,
    rows,
    rowIds,
    hiddenRows,
    hiddenIds,
    targetsById,
    originById,
    nextId,
    pendingRemoval: null,
  };
}

/**
 * Change de mode (P3-04) : N, Pauses, bip, côtés conservés ; cibles
 * incompatibles « — » (`UNSET`, jamais zéro) ; retour à un mode déjà visité
 * pendant cette ouverture → ses cibles sont restaurées, identité par
 * identité (lignes actives, retirées et réservées). Création (mode jusqu'ici
 * non renseigné) en Répétitions uniforme : cible initiale 1. PRE-4 : une
 * Cible `FAILURE` est conservée telle quelle (AC22, H27).
 */
export function setMode(draft: ExecutionSheetDraft, mode: ExecutionMode): ExecutionSheetDraft {
  if (mode === draft.mode) {
    return draft;
  }
  const targetsById = rememberCurrentTargets(draft);
  const targetFor = (id: number, current: SeriesTarget): SeriesTarget =>
    current.kind === "FAILURE" ? current : (targetsById[id]?.[mode] ?? unsetTarget());
  const retarget = (rows: readonly SeriesRow[], ids: readonly number[]) =>
    rows.map((row, index) => ({ ...row, target: targetFor(ids[index]!, row.target) }));
  const initialUniform =
    draft.mode === null && mode === "REPETITIONS" && !draft.variable ? numberTarget(1) : unsetTarget();
  const uniformTarget =
    draft.uniform.target.kind === "FAILURE" || targetsById[draft.uniformId]?.[mode] !== undefined
      ? targetFor(draft.uniformId, draft.uniform.target)
      : initialUniform;
  return {
    ...draft,
    pendingRemoval: null,
    mode,
    targetsById,
    uniform: { ...draft.uniform, target: uniformTarget },
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
export function setUniformTarget(draft: ExecutionSheetDraft, target: SeriesTarget): ExecutionSheetDraft {
  const rows = draft.variable && draft.rows.length > 0 ? draft.rows.map((row, index) => (index === 0 ? { ...row, target } : row)) : draft.rows;
  return { ...draft, pendingRemoval: null, rows, uniform: { ...draft.uniform, target } };
}

export function setUniformPause(draft: ExecutionSheetDraft, pauseSeconds: number): ExecutionSheetDraft {
  const rows =
    draft.variable && draft.rows.length > 0 ? draft.rows.map((row, index) => (index === 0 ? { ...row, pauseSeconds } : row)) : draft.rows;
  return { ...draft, pendingRemoval: null, rows, uniform: { ...draft.uniform, pauseSeconds } };
}

const isRowIndex = (draft: ExecutionSheetDraft, index: number): boolean =>
  Number.isInteger(index) && index >= 0 && index < draft.rows.length;

/** Index hors bornes : aucune modification, Brouillon inchangé (annulation comprise). */
export function setRowTarget(draft: ExecutionSheetDraft, index: number, target: SeriesTarget): ExecutionSheetDraft {
  if (!isRowIndex(draft, index)) {
    return draft;
  }
  return { ...draft, pendingRemoval: null, rows: draft.rows.map((row, current) => (current === index ? { ...row, target } : row)) };
}

/** Index hors bornes : aucune modification, Brouillon inchangé (annulation comprise). */
export function setRowPause(draft: ExecutionSheetDraft, index: number, pauseSeconds: number): ExecutionSheetDraft {
  if (!isRowIndex(draft, index)) {
    return draft;
  }
  return {
    ...draft,
    pendingRemoval: null,
    rows: draft.rows.map((row, current) => (current === index ? { ...row, pauseSeconds } : row)),
  };
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
  return { ...draft, pendingRemoval: null, rows, rowIds };
}

/**
 * Retire une ligne du Tableau des séries variables par sa croix (story 3.2,
 * AC10, FR-12-05, H5 confirmée par Q29) : la ligne part avec sa Cible et sa
 * Pause, N diminue de 1 et les lignes suivantes sont renumérotées par leur
 * position. Un instantané d'annulation (`pendingRemoval`) est exposé ; il
 * remplace celui d'un retrait précédent (« autre retrait », Q29). Refusé
 * (Brouillon inchangé) à N = 1, hors Régime `variables` ou hors bornes. Un
 * retrait qui ramène N à 1 laisse la normalisation effective d'AC9 opérer.
 */
export function removeRow(draft: ExecutionSheetDraft, index: number): ExecutionSheetDraft {
  if (!draft.variable || draft.rows.length <= 1 || !Number.isInteger(index) || index < 0 || index >= draft.rows.length) {
    return draft;
  }
  const rows = [...draft.rows];
  const rowIds = [...draft.rowIds];
  const [removed] = rows.splice(index, 1);
  const [removedId] = rowIds.splice(index, 1);
  return {
    ...draft,
    count: rows.length,
    rows,
    rowIds,
    pendingRemoval: { index, row: removed!, rowId: removedId! },
  };
}

/**
 * Annule le dernier retrait encore valide (AC10) : la ligne revient à sa
 * position, avec sa Cible, sa Pause et son identité (donc sa mémoire par
 * Mode et sa ligne de base). Sans annulation valide, ou si sa position
 * n'existe plus (état incohérent), Brouillon inchangé, sans recalage.
 */
export function undoRemoval(draft: ExecutionSheetDraft): ExecutionSheetDraft {
  const pending = draft.pendingRemoval;
  if (pending === null || !draft.variable || !Number.isInteger(pending.index) || pending.index < 0 || pending.index > draft.rows.length) {
    return draft;
  }
  const rows = [...draft.rows];
  const rowIds = [...draft.rowIds];
  rows.splice(pending.index, 0, pending.row);
  rowIds.splice(pending.index, 0, pending.rowId);
  return { ...draft, count: rows.length, rows, rowIds, pendingRemoval: null };
}

export function setSideMode(
  draft: ExecutionSheetDraft,
  sideMode: SideMode,
  profileSideRecoverySecondsDefault: number,
): ExecutionSheetDraft {
  const activating = (draft.sideMode === null || draft.sideMode === "UNILATERAL") && sideMode !== "UNILATERAL";
  return {
    ...draft,
    pendingRemoval: null,
    sideMode,
    // P3-10 : la Pause entre les côtés est copiée du Profil à l'activation, jamais relue ensuite.
    sideRecoverySeconds: activating ? profileSideRecoverySecondsDefault : draft.sideRecoverySeconds,
  };
}

export function setSideOrder(draft: ExecutionSheetDraft, sideOrder: SideOrder): ExecutionSheetDraft {
  return { ...draft, pendingRemoval: null, sideOrder };
}

export function setSideRecovery(draft: ExecutionSheetDraft, sideRecoverySeconds: number): ExecutionSheetDraft {
  return { ...draft, pendingRemoval: null, sideRecoverySeconds };
}

export function setCadenceBeep(draft: ExecutionSheetDraft, cadenceBeepIntervalSeconds: number): ExecutionSheetDraft {
  return { ...draft, pendingRemoval: null, cadenceBeepIntervalSeconds };
}

export function setCountdown(draft: ExecutionSheetDraft, countdownSeconds: number): ExecutionSheetDraft {
  return { ...draft, pendingRemoval: null, countdownSeconds };
}

export function setEnd(draft: ExecutionSheetDraft, endSeconds: number): ExecutionSheetDraft {
  return { ...draft, pendingRemoval: null, endSeconds };
}

/**
 * Le total est éditable (roulette d'inversion) exactement quand l'état
 * EFFECTIF est Durée uniforme renseignée et que N n'est pas hérité (P42).
 */
export function isRequestedTotalEditable(draft: ExecutionSheetDraft): boolean {
  return isTotalDurationInvertible(effectiveParameters(draft), draft.inheritedSeriesCount);
}

/**
 * Inversion de la Durée totale (P3-14) — réservée à la Durée uniforme
 * EFFECTIVE. Correction revue 1 (REV-02) : à N=1 depuis un tableau variable
 * (effectif uniforme sur la première ligne), l'inversion s'applique aussi ;
 * le brouillon passe en uniforme sur cette première ligne — exactement la
 * base du calcul affiché — et le tableau reste réservé (réactivation avant ✓
 * le restitue). Le total réalisé est donc toujours celui annoncé. Story 3.2
 * (AC14, P42) : indisponible sous N hérité.
 */
export function applyRequestedTotal(
  draft: ExecutionSheetDraft,
  requestedSeconds: number,
): { readonly draft: ExecutionSheetDraft; readonly inversion: TotalDurationInversion } | null {
  const parameters = effectiveParameters(draft);
  if (!isTotalDurationInvertible(parameters, draft.inheritedSeriesCount)) {
    return null;
  }
  const inversion = invertTotalDuration(parameters, requestedSeconds, draft.inheritedSeriesCount);
  const uniform = draft.variable ? setVariable(draft, false) : draft;
  return { draft: modified({ ...uniform, count: inversion.seriesCount }), inversion };
}

export type SheetCommitResult =
  | { readonly ok: true; readonly value: ExecutionParameters }
  | { readonly ok: false; readonly violations: readonly ExecutionParametersViolation[] };

/**
 * Rang de la ligne de base de chaque Série EFFECTIVE, par identité (AD-13,
 * story 3.2 AC12) ; `null` pour une ligne nouvelle.
 */
function baselineRowIndexes(draft: ExecutionSheetDraft, baseline: ExecutionParametersInput): readonly (number | null)[] {
  // Le parent ouvert peut différer de la base (Feuille rouverte après un ✓ qui a
  // réordonné) : ses rangs sont rapprochés de la base par valeur, puis par rang
  // libre (alignement injectif).
  const parentToBase = alignRowsToBaseline(draft.openedRows, seriesRowsOf(baseline), { exclusive: true });
  const originOf = (id: number | undefined): number | null => {
    const origin = id === undefined ? undefined : draft.originById[id];
    return origin === undefined ? null : (parentToBase[origin] ?? null);
  };
  if (draft.variable && draft.rows.length > 0) {
    // À N = 1, l'état effectif est uniforme sur la première ligne : sa base est celle de cette ligne.
    return draft.rows.length === 1 ? [originOf(draft.rowIds[0])] : draft.rowIds.map(originOf);
  }
  return [originOf(draft.uniformId)];
}

/**
 * ✓ (P3-16) : valide l'état EFFECTIF (repli du tableau sans effet) par la
 * validation unique (AD-13), avec la ligne de base relue à l'ouverture de
 * l'Éditeur (`null` en création), alignée par IDENTITÉ de ligne (story 3.2,
 * AC12) ; succès → paramètres normalisés à appliquer atomiquement au parent,
 * sans identité, Réserve, mémoire par Mode, `pendingRemoval` ni indicateur
 * d'héritage ; échec → aucune application, violations nommant la Série.
 */
export function commitSheetDraft(
  draft: ExecutionSheetDraft,
  baseline: ExecutionParametersInput | null = null,
): SheetCommitResult {
  const parameters = effectiveParameters(draft);
  return baseline === null
    ? validateForSave(parameters, null)
    : validateForSave(parameters, baseline, { baselineRowIndexes: baselineRowIndexes(draft, baseline) });
}

/** Première Série incomplète (message « Série n », v13 §6), ou `null`. */
export function firstIncompleteSeries(violations: readonly ExecutionParametersViolation[]): number | null {
  const withSeries = violations.find((violation) => violation.field === "target" && violation.seriesNumber);
  return withSeries?.seriesNumber ?? null;
}
