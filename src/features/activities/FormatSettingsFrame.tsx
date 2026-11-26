import type { ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { emomIntervalsOf, withEmomIntervals } from "@/domain/sessions/emomIntervals";
import type { CircuitRole, ElementFormatKey, FormatSettings } from "@/domain/sessions/formats";

/**
 * PRE-9 — réglages de Format dans la modale de l'Exercice (CE-FMT-04 ; référence Formats §3, §6, §10 à §12, §14 ;
 * mise à jour consolidée des écrans Formats du 04/11/2026 §4.4, §6 bis 2). [Suspendus le 03/11/2026 sur décision de
 * Hermann (« les règles vont changer de toute façon ») ; suspension levée le 04/11/2026 pour appliquer la cible
 * documentée.]
 *
 * Cadre de la feuille des paramètres d'exécution, selon le porteur :
 * - AMRAP : Exercice autonome — Durée de l'exercice, Incrément par tour ; membre — Rôle (Buy-in | Tour),
 *   Incrément par tour, toujours présent, « + 0 » par défaut, dans l'unité de l'objectif, grisé pour un buy-in
 *   ou à l'échec ;
 * - For time : Exercice autonome — Durée maximum du For time (« Aucune ») ; membre — Rôle (Buy-in | Tour |
 *   Buy-out), Durée de l'exercice héritée du Circuit, grisée ;
 * - EMOM : Intervalle (Exercice autonome ou d'un Circuit standard) ;
 * - Death by : Intervalle (autonome, membre alterné), Incrément par intervalle (≥ + 1), Condition d'arrêt À
 *   l'échec imposée.
 * Les valeurs restent locales jusqu'au ✓ de la feuille (✕ : rien n'est appliqué). Contrôle EMOM des durées :
 * message, cadre rouge, ✓ indisponible (seuil inclusif).
 */

/** `seriesUntilFailure` : Death by autonome — Séries « Jusqu'à l'échec » (Variables grisé), Formats §12 et §14. */
/**
 * Décisions de Hermann du 07/11/2026 (EMOM, points A2, A3, A5, A8, B, B9 ; Figma `8795:14588` et `8598:30515`) : `stopTarget` — « À l'objectif » seul, « À l'échec » grisé ; `durationReadOnly` — Durée de l'exercice en
 * lecture seule (N × intervalle) sous l'Intervalle ; `noRecovery` — Récupération absente (alternance, dans chaque intervalle).
 */
export type FormatSheetRow =
  | "role"
  | "increment"
  | "interval"
  | "duration"
  | "timeCap"
  | "inheritedCap"
  | "stopImposed"
  | "seriesUntilFailure"
  | "stopTarget"
  | "durationReadOnly"
  | "noRecovery";

export type FormatSheetContext = {
  readonly key: ElementFormatKey;
  readonly rows: readonly FormatSheetRow[];
  readonly settings: FormatSettings;
  /** Rôle dans le circuit : admis par le Format, disponibles (dernier membre de la boucle : Tour seul). */
  readonly role?: { readonly current: CircuitRole; readonly admitted: readonly CircuitRole[]; readonly available: readonly CircuitRole[] };
  /**
   * For time : la Durée est refusée à cet Exercice (dernier de la boucle en Répétitions, ou For time autonome) — option grisée et message
   * court sous le cadre Exécution (`forTimeDurationRefused`, recette du 17/11/2026).
   */
  readonly durationRefused?: boolean;
  /**
   * D-531 / RM-271 (Hermann, 19/11/2026) : « À l'échec » (Max) refusé à un membre de la boucle d'un AMRAP de plusieurs mouvements — option
   * grisée et message court sous le cadre Exécution, comme `durationRefused`. Une valeur déjà à l'échec n'est pas changée d'office.
   */
  readonly failureRefused?: boolean;
  /** For time membre : borne héritée du Circuit, affichée grisée (« Sans limite », « ≤ 15 min »). */
  readonly inheritedCapText?: string;
  /**
   * Contrôle EMOM des durées : intervalle porté par le Circuit (`windowSeconds`, dans chaque intervalle) et
   * travail prévu des autres membres ; absent : l'intervalle est celui de l'Exercice (`intervalSeconds`).
   */
  /** Complément du 5 novembre 2026 (Hermann), §14 : travail prévu des autres membres de l'intervalle commun, rang par rang (S1…Sn). */
  readonly emom?: {
    readonly windowSeconds: number | null;
    readonly othersWorkByRank: readonly number[];
    /**
     * D-607 (D-572 point 6, D-573 point 1, Hermann, 25-26/11/2026 ; Formats § 9.9, § 9.10) : « Dans chaque intervalle » — intervalle de
     * chaque tour du Circuit porteur, partagé par ses mouvements : affiché et modifiable dans la modale de chacun ; le ✓ le reporte au
     * Circuit (`onApply`), donc aux autres mouvements. Absent : l'intervalle est propre à l'Exercice.
     */
    readonly sharedIntervals?: readonly number[];
  };
  /** D-607 : `sharedIntervals` — intervalles des tours du Circuit porteur EMOM à reporter (`null` : aucun changement). */
  readonly onApply: (settings: FormatSettings, role: CircuitRole | null, sharedIntervals?: readonly number[] | null) => void;
  /**
   * For time (correction 2 de Hermann du 14/11/2026, règle 5) : nombre de valeurs qu'un nouveau Rôle retirerait à ces séries, et
   * nombre de séries gardées — annoncé avant de valider (« aucune valeur perdue en silence »). Absent : aucune annonce.
   */
  readonly roleChangeLoss?: (role: CircuitRole, parameters: ExecutionParametersInput) => { readonly lost: number; readonly kept: number };
  /**
   * Demande de Hermann du 14/11/2026 (soir) : « Pour les exercices en buy in et en buy out, je dois pouvoir ajouter ou supprimer des séries dans la composition de séance » : valeurs que les autres exercices du bloc (buy-in, buy-out) perdraient avec ce nombre de séries ; annoncé avant ✓.
   */
  /**
   * Précision de Hermann du 14/11/2026 (soir) : « le for Time a un nombre de tours. Dans la composition de séance si je transforme un exercice Buy In ou Buy Out en un exercice Tour, il doit héritier du nombre de Tours du circuit » : séries de l'exercice pour le Rôle choisi (en tour : une par tour du Circuit ; dans un bloc occupé : nombre du bloc),
   * appliquées à la modale dès le choix du Rôle.
   */
  readonly seriesForRole?: (role: CircuitRole, parameters: ExecutionParametersInput) => ExecutionParametersInput;
  /**
   * Recette du 16/11/2026 (mp-charge, Hermann : « Incrément : il ne faut pas de valeur par défaut dans la modale ») : Incrément
   * encore à renseigner (écran d'un Format) ; sans `incrementPerRound`, la ligne affiche « — » en rouge et le ✓ attend la saisie.
   */
  readonly incrementRequired?: boolean;
};

/** D-607 : `sharedIntervals` — intervalles des tours du Circuit porteur EMOM en cours de saisie (`null` : Exercice hors Circuit porteur). */
export type FormatSheetValue = { readonly settings: FormatSettings; readonly role: CircuitRole | null; readonly sharedIntervals?: readonly number[] | null };

export function initialFormatSheetValue(context: FormatSheetContext): FormatSheetValue {
  return { settings: context.settings, role: context.role?.current ?? null, sharedIntervals: context.emom?.sharedIntervals ?? null };
}

/** Intervalle effectif du contrôle EMOM (celui du Circuit, sinon celui de l'Exercice) — série ou tour 1. */
export function emomIntervalOf(context: FormatSheetContext, value: FormatSheetValue): number | null {
  if (context.key !== "EMOM" || context.emom === undefined) return null;
  if (context.emom.windowSeconds !== null) return value.sharedIntervals?.[0] ?? context.emom.windowSeconds;
  const own = value.settings.intervalSeconds;
  return typeof own === "number" ? own : null;
}

/**
 * D-607 (D-572 point 6, Hermann, 25/11/2026 ; Formats § 9.9) : intervalle de chaque série ou tour (rangs 0…count−1) dans la modale —
 * ceux des tours du Circuit porteur (partagés), sinon ceux de l'Exercice (`intervalsSeconds`, absent : Intervalle). `null` : pas un EMOM.
 */
export function emomSheetIntervals(context: FormatSheetContext, value: FormatSheetValue, count: number): readonly number[] | null {
  if (context.key !== "EMOM") return null;
  const ranks = Math.max(1, count);
  if (context.emom !== undefined && context.emom.windowSeconds !== null) {
    const shared = value.sharedIntervals ?? [];
    const first = shared[0] ?? context.emom.windowSeconds;
    return Array.from({ length: ranks }, (_, rank) => shared[rank] ?? first);
  }
  return emomIntervalsOf(value.settings, "intervalSeconds", ranks);
}

/**
 * D-607 : intervalle de la série ou du tour `rank` remplacé dans la modale. Dans chaque intervalle, c'est l'intervalle du tour, partagé
 * (reporté au Circuit au ✓) ; sinon celui de la série de l'Exercice (`intervalSeconds` = série 1, `intervalsSeconds` si elles diffèrent).
 */
export function withEmomSheetInterval(context: FormatSheetContext, value: FormatSheetValue, count: number, rank: number, seconds: number): FormatSheetValue {
  const intervals = emomSheetIntervals(context, value, count);
  if (intervals === null || rank < 0 || rank >= intervals.length) return value;
  return withEmomSheetIntervals(context, value, intervals.map((current, at) => (at === rank ? seconds : current)));
}

/** D-607 : intervalles de toutes les séries ou de tous les tours remplacés (ligne Intervalle : séries identiques ou un seul tour). */
export function withEmomSheetIntervals(context: FormatSheetContext, value: FormatSheetValue, intervals: readonly number[]): FormatSheetValue {
  if (context.key !== "EMOM" || intervals.length === 0) return value;
  if (context.emom !== undefined && context.emom.windowSeconds !== null) return { ...value, sharedIntervals: intervals.map((seconds) => Math.max(1, Math.round(seconds))) };
  return { ...value, settings: withEmomIntervals(value.settings, "intervalSeconds", intervals) };
}

/**
 * Dépassement EMOM au seuil inclusif : pour une série/fenêtre au moins, travail prévu de l'Exercice (plus celui des autres membres
 * au même rang) ≥ intervalle — Complément du 5 novembre 2026 (Hermann), §14 : chaque série est vérifiée. Les membres en Répétitions ne comptent pas.
 */
export function emomOverflowOf(context: FormatSheetContext, value: FormatSheetValue, workOfRank: (rank: number) => number, ranks: number): boolean {
  return emomOverflowRanks(context, value, workOfRank, ranks).ranks.length > 0;
}

/**
 * Recette iPhone du 08/11/2026 (Hermann : « mettre les valeurs à modifier en fond rouge » ; « un message différent si la durée de la
 * série d'un exercice dépasse déjà l'intervalle ») : séries en dépassement (rang 0..n−1) et `alone` si, pour l'une d'elles, la durée de
 * la série de l'Exercice atteint seule l'intervalle.
 */
export function emomOverflowRanks(
  context: FormatSheetContext,
  value: FormatSheetValue,
  workOfRank: (rank: number) => number,
  ranks: number,
): { readonly ranks: readonly number[]; readonly alone: boolean } {
  const interval = emomIntervalOf(context, value);
  if (interval === null) return { ranks: [], alone: false };
  // D-607 (D-572 point 6) : intervalle de chaque série ou tour.
  const intervals = emomSheetIntervals(context, value, ranks) ?? [];
  const overflowing: number[] = [];
  let alone = false;
  for (let rank = 0; rank < ranks; rank += 1) {
    const own = workOfRank(rank);
    const window = intervals[rank] ?? interval;
    if (own > 0 && own + (context.emom?.othersWorkByRank[rank] ?? 0) >= window) {
      overflowing.push(rank);
      if (own >= window) alone = true;
    }
  }
  return { ranks: overflowing, alone };
}

/*
 * Recette iPhone du 07/11/2026 (Hermann : « Ils doivent être intégrés dans les cadres existants. Par ailleurs la mention du
 * nom du format dans un cadre séparé doit disparaître. ») : les lignes de Format sont rendues par `ExecutionParametersSheet`
 * dans ses cadres (Exécution, Séries, Cadence), au clavier. [Cadre séparé `FormatSettingsFrame` à steppers ± — retiré.]
 */
