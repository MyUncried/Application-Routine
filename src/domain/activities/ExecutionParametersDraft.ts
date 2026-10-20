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
 *
 * PRE-5 (story 2.1, AD-19, AD-20, AD-21, AD-23, AD-25) : transitions pures des
 * phases (`canEnableWorkPhases`, `setWorkPhasesEnabled`, `setWorkPhaseCount`,
 * `removeWorkPhase`, `moveWorkPhase`, `setWorkPhaseLabel`, `setWorkPhaseDuration`,
 * `normalizeWorkPhases` ; `deriveSeriesDuration` seul écrivain de D), de la charge
 * (`setLoadEnabled`, `setLoadValue`, `normalizeDraftLoad`, par `exerciseLoad.ts`
 * seulement) et de la Condition d'arrêt (`setStopCondition`, mémoire « À la cible »
 * `lastNumberById`, jamais persistée). Avec des phases, Répétitions, À l'échec,
 * Variables et la Cible commune sont refusés (FR-2, aucune conversion destructive).
 * `pendingRemoval` couvre une série ou une phase (une seule annulation en attente).
 * Le ✓ passe par la fonction unique `sheetDraftResult` (phases, charge, puis
 * `validateForSave`), qui sert aussi la disponibilité du ✓ (FR-3, FR-9).
 */

import {
  alignRowsToBaseline,
  clampSeriesCount,
  cloneExecutionParameters,
  EXECUTION_BOUNDS,
  EXECUTION_PARAMETERS_VERSION,
  failureTarget,
  normalizeEffective,
  numberTarget,
  resizeWithReserve,
  seriesCountOf,
  seriesRowsOf,
  unsetTarget,
  validateForSave,
  WORK_PHASE_LIMITS,
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
import { normalizeLoad, reactivateLoad, REACTIVATED_LOAD_KG, roundLoadUp } from "./exerciseLoad";
import type { SideMode } from "@/domain/sessions/sideMode";
import { codePointLength } from "@/domain/sessions/validation";

/** Cibles mémorisées d'une identité de ligne, par mode visité pendant l'ouverture. */
type TargetsByMode = Readonly<Partial<Record<ExecutionMode, SeriesTarget>>>;

/**
 * PRE-5 (story 2.1, AD-23, FR-19) : dernière valeur `NUMBER` connue d'une
 * identité, par Mode. Jamais écrasée par `FAILURE` ni `UNSET`, jamais persistée.
 */
type NumbersByMode = Readonly<Partial<Record<ExecutionMode, number>>>;

/**
 * Instantané d'annulation d'un retrait (story 3.2, AC10) : la ligne retirée,
 * son identité et sa position 0-indexée dans l'ordre d'alors. PRE-5 (story 2.1,
 * AD-25, Q29) : union `series` | `phase`, une seule annulation en attente.
 */
export type PendingRemoval =
  | {
      readonly kind: "series";
      readonly index: number;
      readonly row: SeriesRow;
      readonly rowId: number;
    }
  | {
      readonly kind: "phase";
      readonly index: number;
      readonly phase: DraftWorkPhase;
    };

/** Libellé par défaut d'une phase selon sa position 1-indexée (« Phase n »), fourni depuis `strings` par l'appelant (AD-20). */
export type DefaultWorkPhaseLabel = (position: number) => string;

export type OpenSheetDraftOptions = {
  /** N marqué hérité d'un circuit de séries (P42) : entrée seulement, jamais persistée. */
  readonly inheritedSeriesCount?: boolean;
};

/**
 * Phase dans le Brouillon (AD-20, AD-25) : une durée `null` est à renseigner
 * (fond rouge pâle), 0 est admise pendant l'édition ; un libellé vide affiche le
 * libellé par défaut selon la position. `normalizeWorkPhases` (au ✓) retire les
 * phases à 0 ou `null` et remplace les libellés vides.
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
   * PRE-5 (story 2.1, AD-23) : mémoire « À la cible », distincte de `targetsById` :
   * dernière Cible `NUMBER` connue par identité et par Mode, restituée au retour de
   * À l'échec vers À la cible. Volatile : jamais transmise ni persistée.
   */
  readonly lastNumberById: Readonly<Record<number, NumbersByMode>>;
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
  const lastNumberById: Record<number, NumbersByMode> = {};
  const first = rows[0];
  const uniform = first ? plain(first) : { target: unsetTarget(), pauseSeconds: 0, loadKg: 0 };
  const workPhases: readonly WorkPhase[] = parameters.series.kind === "UNIFORM" ? parameters.series.workPhases : [];
  if (parameters.mode !== null) {
    const mode = parameters.mode;
    // PRE-5 (AD-23) : les Cibles `NUMBER` ouvertes sont les premières valeurs connues « À la cible ».
    const remember = (id: number, target: SeriesTarget) => {
      targetsById[id] = { [mode]: target };
      if (target.kind === "NUMBER") {
        lastNumberById[id] = { [mode]: target.value };
      }
    };
    activeRows.forEach((row, index) => remember(rowIds[index]!, row.target));
    remember(uniformId, uniform.target);
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
    lastNumberById,
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

/** Mémoires volatiles par identité : Cibles par Mode et, PRE-5 (AD-23), dernière valeur `NUMBER`. */
type TargetMemory = {
  readonly targetsById: Record<number, TargetsByMode>;
  readonly lastNumberById: Record<number, NumbersByMode>;
};

/**
 * Mémorise, pour le mode courant, la cible affichée de chaque identité
 * (lignes actives, retirées, réservées, uniforme) avant une transition.
 * PRE-5 (story 2.1, AD-23) : une Cible `NUMBER` alimente aussi `lastNumberById`
 * (jamais `FAILURE` ni `UNSET`).
 */
function rememberCurrentTargets(draft: ExecutionSheetDraft): TargetMemory {
  const targetsById: Record<number, TargetsByMode> = { ...draft.targetsById };
  const lastNumberById: Record<number, NumbersByMode> = { ...draft.lastNumberById };
  if (draft.mode === null) {
    return { targetsById, lastNumberById };
  }
  const mode = draft.mode;
  const remember = (id: number, target: SeriesTarget) => {
    targetsById[id] = { ...targetsById[id], [mode]: target };
    if (target.kind === "NUMBER") {
      lastNumberById[id] = { ...lastNumberById[id], [mode]: target.value };
    }
  };
  draft.rows.forEach((row, index) => remember(draft.rowIds[index]!, row.target));
  draft.hiddenRows.forEach((row, index) => remember(draft.hiddenIds[index]!, row.target));
  (draft.savedVariableRows ?? []).forEach((row, index) => remember(draft.savedIds![index]!, row.target));
  remember(draft.uniformId, draft.uniform.target);
  return { targetsById, lastNumberById };
}

/** Nouvelle identité copiant les cibles mémorisées de `sourceId` (copie de ligne), mémoire « À la cible » comprise (AD-23). */
function cloneIdentity(
  memory: TargetMemory,
  sourceId: number,
  nextId: number,
): { readonly id: number; readonly nextId: number } {
  memory.targetsById[nextId] = { ...memory.targetsById[sourceId] };
  const numbers = memory.lastNumberById[sourceId];
  if (numbers !== undefined) {
    memory.lastNumberById[nextId] = { ...numbers };
  }
  return { id: nextId, nextId: nextId + 1 };
}

/**
 * PRE-5 (story 2.1, AD-23) : écrit la Cible commune et, si elle est `NUMBER`,
 * l'enregistre comme dernière valeur connue « À la cible » de l'uniforme.
 */
function withUniformTarget(draft: ExecutionSheetDraft, target: SeriesTarget): ExecutionSheetDraft {
  const lastNumberById =
    target.kind === "NUMBER" && draft.mode !== null
      ? { ...draft.lastNumberById, [draft.uniformId]: { ...draft.lastNumberById[draft.uniformId], [draft.mode]: target.value } }
      : draft.lastNumberById;
  return { ...draft, uniform: { ...draft.uniform, target }, lastNumberById };
}

/**
 * Change N (P3-06) : réduire retire les dernières lignes actives et les
 * conserve dans leur ordre relatif ; remonter restaure d'abord ces lignes,
 * puis clone la dernière ligne active. Uniforme : seul N change.
 */
export function setSeriesCount(draft: ExecutionSheetDraft, requested: number): ExecutionSheetDraft {
  const count = clampSeriesCount(requested);
  if (!draft.variable) {
    return modified({ ...draft, count });
  }
  const memory = rememberCurrentTargets(draft);
  let nextId = draft.nextId;
  // PRE-6 (story 1.4) : règle « réduire → réserve ; augmenter → restaurer puis
  // copier la dernière » partagée avec le Circuit (`resizeWithReserve`),
  // appliquée aux couples (ligne, identité). Identités et mémoires restent ici.
  type RowWithId = { readonly row: SeriesRow; readonly id: number };
  const hidden: readonly RowWithId[] = draft.hiddenRows.map((row, index) => ({ row, id: draft.hiddenIds[index]! }));
  const resized = resizeWithReserve<RowWithId>(
    draft.rows.map((row, index) => ({ row, id: draft.rowIds[index]! })),
    hidden,
    count,
    (last) => {
      const sourceId = last?.id ?? draft.uniformId;
      const clone = cloneIdentity(memory, sourceId, nextId);
      nextId = clone.nextId;
      // Story 1.3 (AD-9) : la ligne ajoutée copie la dernière (Cible `FAILURE`
      // et Pause comprises) sans partager l'objet de sa Cible.
      const source = last?.row ?? draft.uniform;
      return { row: { ...source, target: { ...source.target } }, id: clone.id };
    },
  );
  const restored = new Set(hidden);
  // Une ligne restaurée est recopiée (Cible comprise), comme avant l'extraction.
  const rows = resized.active.map((item) =>
    restored.has(item) ? { ...item.row, target: { ...item.row.target } } : item.row,
  );
  const rowIds = resized.active.map(({ id }) => id);
  const hiddenRows = resized.reserve.map(({ row }) => row);
  const hiddenIds = resized.reserve.map(({ id }) => id);
  // Une ligne ajoutée par N est NOUVELLE : aucune ligne de base (AD-13).
  return { ...draft, ...memory, count, rows, rowIds, hiddenRows, hiddenIds, nextId, pendingRemoval: null };
}

/**
 * Active/désactive « Séries variables » (P3-05). Activation : chaque ligne
 * copie la cible/Pause uniformes, ou restitue le dernier tableau variable de
 * cette ouverture (avec la cible MÉMORISÉE POUR LE MODE COURANT, « — » sinon).
 * Désactivation : l'uniforme reprend la PREMIÈRE ligne dans l'ordre courant.
 * Jamais déduit de l'égalité des valeurs.
 *
 * PRE-5 (story 2.1) : avec des phases, l'activation est refusée (FR-2, AD-20 :
 * aucune conversion destructive) ; la désactivation est suivie de `normalizeLoad`
 * (AD-19, AD-23, §9-9) : une charge commune reprise à 0 fait passer à Sans.
 */
export function setVariable(draft: ExecutionSheetDraft, variable: boolean): ExecutionSheetDraft {
  if (variable === draft.variable) {
    return draft;
  }
  if (!variable) {
    return normalizeDraftLoad(toUniform(draft));
  }
  if (draft.workPhases.length > 0) {
    return draft;
  }
  return toVariable(draft);
}

/**
 * Variables → Identiques, sans normalisation de la charge : l'uniforme reprend la
 * PREMIÈRE ligne dans l'ordre courant (charge comprise). Sert `setVariable(false)`,
 * l'Inversion du total et, à N = 1 avec un état variable demandé, les transitions
 * de phases, de charge commune et de Condition d'arrêt (AD-20 : la Feuille et le
 * Brouillon voient le même uniforme).
 */
function toUniform(draft: ExecutionSheetDraft): ExecutionSheetDraft {
  if (!draft.variable) {
    return draft;
  }
  const memory = rememberCurrentTargets(draft);
  const originById: Record<number, number> = { ...draft.originById };
  const first = draft.rows[0] ?? draft.uniform;
  const firstId = draft.rowIds[0] ?? draft.uniformId;
  const uniform = cloneIdentity(memory, firstId, draft.nextId);
  inheritOrigin(originById, uniform.id, firstId);
  return {
    ...draft,
    ...memory,
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
    nextId: uniform.nextId,
  };
}

/** Identiques → Variables (P3-05), voir `setVariable`. */
function toVariable(draft: ExecutionSheetDraft): ExecutionSheetDraft {
  const memory = rememberCurrentTargets(draft);
  const originById: Record<number, number> = { ...draft.originById };
  let nextId = draft.nextId;
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
      const clone = cloneIdentity(memory, rowIds[rowIds.length - 1]!, nextId);
      nextId = clone.nextId;
      rows.push({ ...rows[rows.length - 1]! });
      rowIds.push(clone.id);
    }
  } else {
    for (let index = 0; index < draft.count; index += 1) {
      const clone = cloneIdentity(memory, draft.uniformId, nextId);
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
    ...memory,
    variable: true,
    rows,
    rowIds,
    hiddenRows,
    hiddenIds,
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
 *
 * PRE-5 (story 2.1, FR-2, AD-20) : avec des phases, tout changement de Mode est
 * refusé (Brouillon inchangé) ; la mémoire des Cibles par Mode est conservée.
 */
export function setMode(draft: ExecutionSheetDraft, mode: ExecutionMode): ExecutionSheetDraft {
  if (mode === draft.mode || draft.workPhases.length > 0) {
    return draft;
  }
  const memory = rememberCurrentTargets(draft);
  const { targetsById } = memory;
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
    ...memory,
    pendingRemoval: null,
    mode,
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
  // PRE-5 (story 2.1, AD-20) : tant que des phases existent, D est dérivée ; régler la Cible commune est sans effet.
  if (draft.workPhases.length > 0) {
    return draft;
  }
  const rows = draft.variable && draft.rows.length > 0 ? draft.rows.map((row, index) => (index === 0 ? { ...row, target } : row)) : draft.rows;
  return withUniformTarget({ ...draft, pendingRemoval: null, rows }, target);
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
 * PRE-5, D-434 (QD-434-1, AD-23, RM-250) — commande « À l'échec » de la barre du clavier,
 * pour la Cible de la seule ligne `index` : une Cible numérique (ou à renseigner) passe à
 * l'échec, la valeur numérique étant d'abord mémorisée pour cette identité et ce Mode
 * (`lastNumberById`, comme la Condition d'arrêt des séries identiques) ; une Cible à l'échec
 * reprend la dernière valeur numérique mémorisée, sinon redevient à renseigner. Mode non
 * choisi ou index hors bornes : Brouillon inchangé.
 */
export function toggleRowFailure(draft: ExecutionSheetDraft, index: number): ExecutionSheetDraft {
  if (!isRowIndex(draft, index) || draft.mode === null) {
    return draft;
  }
  const mode = draft.mode;
  const id = draft.rowIds[index];
  const target = draft.rows[index]!.target;
  if (target.kind === "FAILURE") {
    const remembered = id === undefined ? undefined : draft.lastNumberById[id]?.[mode];
    return setRowTarget(draft, index, remembered === undefined ? unsetTarget() : numberTarget(remembered));
  }
  // Une Cible à renseigner passée à l'échec n'a pas de valeur à restituer : la mémoire de ce
  // Mode est effacée (le retour la rend à renseigner, jamais une valeur plus ancienne).
  const kept: Partial<Record<ExecutionMode, number>> = { ...(id === undefined ? {} : draft.lastNumberById[id]) };
  if (target.kind === "NUMBER") kept[mode] = target.value;
  else delete kept[mode];
  const lastNumberById = id === undefined ? draft.lastNumberById : { ...draft.lastNumberById, [id]: kept };
  return { ...setRowTarget(draft, index, failureTarget()), lastNumberById };
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
    pendingRemoval: { kind: "series", index, row: removed!, rowId: removedId! },
  };
}

/**
 * Annule le dernier retrait encore valide (AC10) : la ligne revient à sa
 * position, avec sa Cible, sa Pause et son identité (donc sa mémoire par
 * Mode et sa ligne de base). Sans annulation valide, ou si sa position
 * n'existe plus (état incohérent), Brouillon inchangé, sans recalage.
 * PRE-5 (story 2.1, AD-25, FR-8) : une phase retirée revient à sa position avec
 * son identité, son libellé et sa durée ; D est redérivée.
 */
export function undoRemoval(draft: ExecutionSheetDraft): ExecutionSheetDraft {
  const pending = draft.pendingRemoval;
  if (pending !== null && pending.kind === "phase") {
    return undoWorkPhaseRemoval(draft, pending);
  }
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
  // PRE-5 (story 2.1) : passage en uniforme sans `normalizeLoad` (l'Inversion ne touche pas la charge).
  const uniform = toUniform(draft);
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
 *
 * PRE-5 (story 2.1, AD-25) : délègue à `sheetDraftResult`, seule fonction du ✓.
 * Sans `defaultLabel` (Feuille actuelle, qui ne crée aucune phase), un libellé
 * vide reste vide et la validation le refuse : aucun texte n'est inventé.
 */
export function commitSheetDraft(
  draft: ExecutionSheetDraft,
  baseline: ExecutionParametersInput | null = null,
  defaultLabel?: DefaultWorkPhaseLabel,
): SheetCommitResult {
  return sheetDraftResult(draft, defaultLabel, baseline);
}

/**
 * PRE-5 (story 2.1, AD-25, FR-3, FR-9, FR-14) — résultat UNIQUE du ✓, qui sert
 * à la fois sa disponibilité et `commitSheetDraft` : `normalizeWorkPhases`, puis
 * `normalizeLoad` (`exerciseLoad.ts`) sur les paramètres effectifs, puis
 * `validateForSave` (AD-13). Des phases à 0 ou à renseigner ne bloquent jamais ✓
 * par elles-mêmes ; une somme normalisée hors de 1..3535 le bloque (violation
 * `workPhases`). `defaultLabel` vient de `strings` (le domaine n'importe pas l'i18n).
 */
export function sheetDraftResult(
  draft: ExecutionSheetDraft,
  defaultLabel: DefaultWorkPhaseLabel | undefined,
  baseline: ExecutionParametersInput | null = null,
): SheetCommitResult {
  const normalized = normalizeWorkPhases(draft, defaultLabel);
  const parameters = normalizeLoad(effectiveParameters(normalized));
  return baseline === null
    ? validateForSave(parameters, null)
    : validateForSave(parameters, baseline, { baselineRowIndexes: baselineRowIndexes(normalized, baseline) });
}

// --- PRE-5 story 2.1 : phases de l'exercice (AD-20, AD-25, FR-2 à FR-9) -------

/**
 * À N = 1 avec un état variable DEMANDÉ, l'état effectif est uniforme sur la
 * première ligne : les transitions de phases, de charge commune et de Condition
 * d'arrêt passent d'abord par l'uniforme (`setVariable(false)`, sans normalisation
 * de la charge) pour que la Feuille et le Brouillon voient le même uniforme (AD-20).
 */
function effectiveUniform(draft: ExecutionSheetDraft): ExecutionSheetDraft {
  return draft.variable && draft.count === 1 ? toUniform(draft) : draft;
}

/** Séries identiques EFFECTIVES (N = 1 compris). */
function isEffectivelyUniform(draft: ExecutionSheetDraft): boolean {
  return !draft.variable || draft.count === 1;
}

/** Cible commune EFFECTIVE (première ligne à N = 1 en état variable demandé). */
function effectiveUniformTarget(draft: ExecutionSheetDraft): SeriesTarget {
  return draft.variable ? (draft.rows[0] ?? draft.uniform).target : draft.uniform.target;
}

/**
 * Prédicat UNIQUE d'éligibilité des phases (FR-2, AD-20) : Mode `DURATION`,
 * séries identiques effectives (N = 1 compris), Cible commune non `FAILURE`.
 */
export function canEnableWorkPhases(draft: ExecutionSheetDraft): boolean {
  return draft.mode === "DURATION" && isEffectivelyUniform(draft) && effectiveUniformTarget(draft).kind !== "FAILURE";
}

/**
 * SEUL écrivain de D tant que des phases existent (AD-20, FR-3) : Cible commune
 * = `NUMBER(Σ)` si Σ ≥ 1, sinon `UNSET` ; une durée `null` compte pour 0. Appelée
 * seulement par une transition qui laisse une liste non vide (activation, ajout,
 * retrait, annulation d'un retrait, réglage d'une durée, y compris sur une phase
 * seule relue des données) et par la normalisation qui en laisse au moins deux ; jamais
 * de calcul de la dernière phase sur le restant (réservé aux formats, D-372).
 */
export function deriveSeriesDuration(draft: ExecutionSheetDraft): ExecutionSheetDraft {
  const sum = draft.workPhases.reduce((total, phase) => total + (phase.durationSeconds ?? 0), 0);
  return withUniformTarget(draft, sum >= 1 ? numberTarget(sum) : unsetTarget());
}

/**
 * Phases modifiées par une transition : D est redérivée dès que la liste est non vide
 * (AD-20, « pour une liste non vide seulement »), ce qui couvre une phase seule relue
 * des données (le modèle l'admet) et garde D = Σ pour un passage ultérieur à Sans.
 */
function withWorkPhases(draft: ExecutionSheetDraft, workPhases: readonly DraftWorkPhase[]): ExecutionSheetDraft {
  const next = { ...draft, workPhases, pendingRemoval: null };
  return workPhases.length > 0 ? deriveSeriesDuration(next) : next;
}

/**
 * Phases Avec / Sans (FR-5, FR-8, D-432, décision de Hermann du 19/10).
 * - Avec, sans phase et si `canEnableWorkPhases` : DEUX phases à libellé vide,
 *   identités tirées de `nextPhaseId` ; la première à la durée de la Cible
 *   `NUMBER` courante si elle est dans 1..3535, sinon `null` ; la seconde `null`
 *   (à renseigner). Rien n'est inventé. Sinon : refus, Brouillon inchangé.
 * - Sans : `workPhases = []` ; la Cible garde la dernière somme, qui devient la
 *   durée unique de série modifiable (`UNSET` si la somme était nulle) ; aucune
 *   mémoire des anciennes phases (revenir à Avec recrée deux phases).
 */
export function setWorkPhasesEnabled(draft: ExecutionSheetDraft, enabled: boolean): ExecutionSheetDraft {
  if (!enabled) {
    return draft.workPhases.length === 0 ? draft : { ...draft, workPhases: [], pendingRemoval: null };
  }
  if (draft.workPhases.length > 0 || !canEnableWorkPhases(draft)) {
    return draft;
  }
  const uniform = effectiveUniform(draft);
  const current = uniform.uniform.target;
  const bounds = EXECUTION_BOUNDS.durationTarget;
  const firstDuration = current.kind === "NUMBER" && current.value >= bounds.min && current.value <= bounds.max ? current.value : null;
  const id = uniform.nextPhaseId;
  return withWorkPhases({ ...uniform, nextPhaseId: id + 2 }, [
    { id, label: "", durationSeconds: firstDuration },
    { id: id + 1, label: "", durationSeconds: null },
  ]);
}

/**
 * SEULE transition du stepper du nombre de phases (D-432, QR-1), bornée à 2..6
 * et d'un pas : n + 1 ajoute en fin une phase à la durée de la dernière (`null`
 * si la dernière est `null`), refusé à six ; n − 1 retire la dernière par le même
 * retrait annulable que la croix (`removeWorkPhase`), refusé à deux. Toute autre
 * valeur : Brouillon inchangé.
 */
export function setWorkPhaseCount(draft: ExecutionSheetDraft, count: number): ExecutionSheetDraft {
  const length = draft.workPhases.length;
  if (
    length === 0 ||
    !Number.isInteger(count) ||
    count < WORK_PHASE_LIMITS.controlMinCount ||
    count > WORK_PHASE_LIMITS.maxCount ||
    Math.abs(count - length) !== 1
  ) {
    return draft;
  }
  if (count < length) {
    return removeWorkPhase(draft, draft.workPhases[length - 1]!.id);
  }
  const last = draft.workPhases[length - 1]!;
  const id = draft.nextPhaseId;
  return withWorkPhases({ ...draft, nextPhaseId: id + 1 }, [
    ...draft.workPhases,
    { id, label: "", durationSeconds: last.durationSeconds },
  ]);
}

/** Rang de la phase d'identité `phaseId`, ou -1. */
function workPhaseIndex(draft: ExecutionSheetDraft, phaseId: number): number {
  return draft.workPhases.findIndex((phase) => phase.id === phaseId);
}

/**
 * Retrait annulable d'une phase par sa croix, ou de la dernière par le stepper −
 * (FR-8, AD-25, Q29) : `pendingRemoval` de type `phase` remplace toute annulation
 * en attente (série ou phase) ; D est redérivée. Refusé à deux phases (QR-1 : le
 * retour à « Aucune » passe par Sans) ou pour une identité inconnue.
 */
export function removeWorkPhase(draft: ExecutionSheetDraft, phaseId: number): ExecutionSheetDraft {
  const index = workPhaseIndex(draft, phaseId);
  if (index < 0 || draft.workPhases.length <= WORK_PHASE_LIMITS.controlMinCount) {
    return draft;
  }
  const workPhases = [...draft.workPhases];
  const [removed] = workPhases.splice(index, 1);
  return { ...withWorkPhases(draft, workPhases), pendingRemoval: { kind: "phase", index, phase: removed! } };
}

/** Annulation du retrait d'une phase : ordre, libellé, durée, identité, nombre et D restitués. */
function undoWorkPhaseRemoval(
  draft: ExecutionSheetDraft,
  pending: Extract<PendingRemoval, { readonly kind: "phase" }>,
): ExecutionSheetDraft {
  const length = draft.workPhases.length;
  if (
    length === 0 ||
    length >= WORK_PHASE_LIMITS.maxCount ||
    !Number.isInteger(pending.index) ||
    pending.index < 0 ||
    pending.index > length ||
    workPhaseIndex(draft, pending.phase.id) >= 0
  ) {
    return draft;
  }
  const workPhases = [...draft.workPhases];
  workPhases.splice(pending.index, 0, pending.phase);
  return withWorkPhases(draft, workPhases);
}

/**
 * Déplace une phase (FR-4, AD-27) : libellé, durée et identité voyagent ensemble ;
 * D est inchangée (même somme). Indices hors bornes ou sur place : Brouillon inchangé.
 */
export function moveWorkPhase(draft: ExecutionSheetDraft, from: number, to: number): ExecutionSheetDraft {
  const length = draft.workPhases.length;
  const valid = (index: number) => Number.isInteger(index) && index >= 0 && index < length;
  if (from === to || !valid(from) || !valid(to)) {
    return draft;
  }
  const workPhases = [...draft.workPhases];
  const [moved] = workPhases.splice(from, 1);
  workPhases.splice(to, 0, moved!);
  return { ...draft, workPhases, pendingRemoval: null };
}

/**
 * Libellé d'une phase (FR-6) : refusé au-delà de 20 points de code (comme le
 * CHECK `length()` de SQLite, AD-26) ou pour une identité inconnue. Un libellé
 * vide reste vide : le libellé par défaut est affiché selon la position, puis
 * stocké au ✓ (`normalizeWorkPhases`, QN-3).
 */
export function setWorkPhaseLabel(draft: ExecutionSheetDraft, phaseId: number, label: string): ExecutionSheetDraft {
  const index = workPhaseIndex(draft, phaseId);
  if (index < 0 || codePointLength(label) > WORK_PHASE_LIMITS.labelMaxLength) {
    return draft;
  }
  return {
    ...draft,
    pendingRemoval: null,
    workPhases: draft.workPhases.map((phase, current) => (current === index ? { ...phase, label } : phase)),
  };
}

/**
 * Durée d'une phase (FR-7) : entier ≥ 0 ou `null` (à renseigner), sans borne
 * propre hors celle de la somme (contrôlée au ✓) ; sinon, ou pour une identité
 * inconnue, Brouillon inchangé. D est redérivée.
 */
export function setWorkPhaseDuration(
  draft: ExecutionSheetDraft,
  phaseId: number,
  durationSeconds: number | null,
): ExecutionSheetDraft {
  const index = workPhaseIndex(draft, phaseId);
  if (index < 0 || (durationSeconds !== null && (!Number.isInteger(durationSeconds) || durationSeconds < 0))) {
    return draft;
  }
  return withWorkPhases(
    draft,
    draft.workPhases.map((phase, current) => (current === index ? { ...phase, durationSeconds } : phase)),
  );
}

/**
 * Normalisation des phases au ✓ (FR-3, FR-9, AD-20, QR-2, QN-3) : les phases à 0
 * ou `null` sont retirées sans message ; un libellé vide (après suppression des
 * espaces extérieurs) devient `defaultLabel(n)` selon la position finale, stocké
 * ensuite comme un libellé ordinaire (sans `defaultLabel`, il reste vide et la
 * validation le refuse). Au moins deux phases restantes : D est redérivée. Une
 * seule : elle est retirée et sa durée devient la durée de série (Sans, D-371).
 * Aucune : « Aucune », la Cible reste celle de la dernière dérivation (`UNSET`
 * si la somme était nulle) et la validation existante décide.
 */
export function normalizeWorkPhases(draft: ExecutionSheetDraft, defaultLabel?: DefaultWorkPhaseLabel): ExecutionSheetDraft {
  if (draft.workPhases.length === 0) {
    return draft;
  }
  const kept = draft.workPhases
    .filter((phase) => phase.durationSeconds !== null && phase.durationSeconds > 0)
    .map((phase, index) =>
      phase.label.trim() === "" && defaultLabel !== undefined ? { ...phase, label: defaultLabel(index + 1) } : phase,
    );
  if (kept.length >= WORK_PHASE_LIMITS.controlMinCount) {
    return deriveSeriesDuration({ ...draft, workPhases: kept });
  }
  if (kept.length === 1) {
    return withUniformTarget({ ...draft, workPhases: [] }, numberTarget(kept[0]!.durationSeconds!));
  }
  return { ...draft, workPhases: [] };
}

// --- PRE-5 story 2.1 : charge (AD-19, FR-10 à FR-14, Δ16 à Δ20, Δ48) -----------

/**
 * Pose une charge sur les seules valeurs à 0 de l'uniforme et de toutes les lignes
 * (actives, retirées, réservées) ; une charge positive conservée reste telle quelle.
 */
function withLoadOnZeros(draft: ExecutionSheetDraft, loadKg: number): ExecutionSheetDraft {
  const all = (rows: readonly SeriesRow[]) => rows.map((row) => (row.loadKg === 0 ? { ...row, loadKg } : row));
  return {
    ...draft,
    uniform: draft.uniform.loadKg === 0 ? { ...draft.uniform, loadKg } : draft.uniform,
    rows: all(draft.rows),
    hiddenRows: all(draft.hiddenRows),
    savedVariableRows: draft.savedVariableRows ? all(draft.savedVariableRows) : null,
  };
}

/**
 * Charge Avec / Sans (FR-10, FR-14, AD-19). Sans : seules les valeurs restent,
 * conservées partout (D-249 ne s'applique pas à la charge). Avec : `reactivateLoad`
 * sur les paramètres demandés ; si toutes les valeurs étaient nulles (ou aucune
 * mémorisée), 0,25 kg est posé sur chaque valeur à 0 de l'uniforme et des lignes
 * (actives, retirées, réservées), sans écraser une charge positive conservée dans une
 * ligne retirée ou réservée ; sinon les valeurs sont restaurées telles quelles, zéros
 * compris. À N = 1 en état variable demandé, l'uniforme est pris d'abord.
 */
export function setLoadEnabled(draft: ExecutionSheetDraft, enabled: boolean): ExecutionSheetDraft {
  if (enabled === draft.loadEnabled) {
    return draft;
  }
  const uniform = effectiveUniform(draft);
  if (!enabled) {
    return { ...uniform, loadEnabled: false, pendingRemoval: null };
  }
  const requested = requestedParameters(uniform);
  const reactivated = reactivateLoad(requested);
  const before = seriesRowsOf(requested).map((row) => row.loadKg);
  const after = seriesRowsOf(reactivated).map((row) => row.loadKg);
  const restored = before.every((kg, index) => kg === after[index]);
  const next = restored ? uniform : withLoadOnZeros(uniform, REACTIVATED_LOAD_KG);
  return { ...next, loadEnabled: reactivated.loadEnabled, pendingRemoval: null };
}

/** Cible d'une saisie de charge : la charge commune, ou une ligne active désignée par son identité (AD-27). */
export type LoadValueTarget = "uniform" | { readonly rowId: number };

/**
 * Saisie d'une charge (FR-11, FR-13, FR-14, §9-10) : arrondie au 0,25 supérieur
 * (`roundLoadUp`) ; `null` (champ vidé) vaut 0, donc aucune charge pour cette
 * série ; la saisie ne se propage pas aux autres séries. Jamais de `normalizeLoad`
 * ici (Précédent / Suivant ne masquent pas la colonne) : voir `normalizeDraftLoad`.
 * Valeur négative ou non finie, identité inconnue, ou charge commune en variables
 * effectives : Brouillon inchangé. La charge commune à N = 1 en état variable
 * demandé passe d'abord par l'uniforme.
 */
export function setLoadValue(draft: ExecutionSheetDraft, target: LoadValueTarget, kg: number | null): ExecutionSheetDraft {
  if (kg !== null && (!Number.isFinite(kg) || kg < 0)) {
    return draft;
  }
  const loadKg = roundLoadUp(kg ?? 0);
  if (target === "uniform") {
    if (!isEffectivelyUniform(draft)) {
      return draft;
    }
    const uniform = effectiveUniform(draft);
    return { ...uniform, pendingRemoval: null, uniform: { ...uniform.uniform, loadKg } };
  }
  const index = draft.rowIds.indexOf(target.rowId);
  if (!draft.variable || index < 0 || index >= draft.rows.length) {
    return draft;
  }
  return {
    ...draft,
    pendingRemoval: null,
    rows: draft.rows.map((row, current) => (current === index ? { ...row, loadKg } : row)),
  };
}

/**
 * Règles du zéro à la fermeture du clavier (FR-14, AD-19) : `normalizeLoad` sur
 * les paramètres effectifs ; tout à 0 fait passer à Sans, sans modifier aucune
 * valeur. Sans effet (charge déjà Sans, ou une valeur positive) : Brouillon
 * inchangé, annulation en attente comprise.
 */
export function normalizeDraftLoad(draft: ExecutionSheetDraft): ExecutionSheetDraft {
  const normalized = normalizeLoad(effectiveParameters(draft));
  return normalized.loadEnabled === draft.loadEnabled ? draft : { ...draft, loadEnabled: normalized.loadEnabled, pendingRemoval: null };
}

// --- PRE-5 story 2.1 : Condition d'arrêt (AD-23, FR-19, FR-21) -----------------

/** Choix de la Condition d'arrêt en séries identiques. */
export type StopConditionChoice = "FAILURE" | "TARGET";

/**
 * Condition d'arrêt en séries identiques (FR-19, FR-21, AD-23) : À l'échec écrit
 * `FAILURE` dans la Cible commune (toutes les séries) après avoir mémorisé la
 * valeur `NUMBER` courante ; À la cible restaure la dernière valeur `NUMBER`
 * connue dans le Brouillon pour cette identité et ce Mode (`lastNumberById`),
 * sinon `UNSET`. Refusée en variables effectives (N ≥ 2 : résultat dérivé, FR-20)
 * et, vers À l'échec, avec des phases (FR-2). À N = 1 en état variable demandé,
 * l'uniforme est pris d'abord. Choix déjà en vigueur : Brouillon inchangé.
 */
export function setStopCondition(draft: ExecutionSheetDraft, condition: StopConditionChoice): ExecutionSheetDraft {
  if (!isEffectivelyUniform(draft) || (condition === "FAILURE" && draft.workPhases.length > 0)) {
    return draft;
  }
  const current = effectiveUniformTarget(draft);
  if ((condition === "FAILURE") === (current.kind === "FAILURE")) {
    return draft;
  }
  const uniform = effectiveUniform(draft);
  if (condition === "FAILURE") {
    const memory = rememberCurrentTargets(uniform);
    return withUniformTarget({ ...uniform, ...memory, pendingRemoval: null }, failureTarget());
  }
  const remembered = uniform.mode === null ? undefined : uniform.lastNumberById[uniform.uniformId]?.[uniform.mode];
  return withUniformTarget({ ...uniform, pendingRemoval: null }, remembered === undefined ? unsetTarget() : numberTarget(remembered));
}

/** Première Série incomplète (message « Série n », v13 §6), ou `null`. */
export function firstIncompleteSeries(violations: readonly ExecutionParametersViolation[]): number | null {
  const withSeries = violations.find((violation) => violation.field === "target" && violation.seriesNumber);
  return withSeries?.seriesNumber ?? null;
}
