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
  /** For time membre : borne héritée du Circuit, affichée grisée (« Sans limite », « ≤ 15 min »). */
  readonly inheritedCapText?: string;
  /**
   * Contrôle EMOM des durées : intervalle porté par le Circuit (`windowSeconds`, dans chaque intervalle) et
   * travail prévu des autres membres ; absent : l'intervalle est celui de l'Exercice (`intervalSeconds`).
   */
  /** Complément du 5 novembre 2026 (Hermann), §14 : travail prévu des autres membres de l'intervalle commun, rang par rang (S1…Sn). */
  readonly emom?: { readonly windowSeconds: number | null; readonly othersWorkByRank: readonly number[] };
  readonly onApply: (settings: FormatSettings, role: CircuitRole | null) => void;
};

export type FormatSheetValue = { readonly settings: FormatSettings; readonly role: CircuitRole | null };

export function initialFormatSheetValue(context: FormatSheetContext): FormatSheetValue {
  return { settings: context.settings, role: context.role?.current ?? null };
}

/** Intervalle effectif du contrôle EMOM (celui du Circuit, sinon celui de l'Exercice). */
export function emomIntervalOf(context: FormatSheetContext, value: FormatSheetValue): number | null {
  if (context.key !== "EMOM" || context.emom === undefined) return null;
  if (context.emom.windowSeconds !== null) return context.emom.windowSeconds;
  const own = value.settings.intervalSeconds;
  return typeof own === "number" ? own : null;
}

/**
 * Dépassement EMOM au seuil inclusif : pour une série/fenêtre au moins, travail prévu de l'Exercice (plus celui des autres membres
 * au même rang) ≥ intervalle — Complément du 5 novembre 2026 (Hermann), §14 : chaque série est vérifiée. Les membres en Répétitions ne comptent pas.
 */
export function emomOverflowOf(context: FormatSheetContext, value: FormatSheetValue, workOfRank: (rank: number) => number, ranks: number): boolean {
  const interval = emomIntervalOf(context, value);
  if (interval === null) return false;
  for (let rank = 0; rank < ranks; rank += 1) {
    const own = workOfRank(rank);
    if (own > 0 && own + (context.emom?.othersWorkByRank[rank] ?? 0) >= interval) return true;
  }
  return false;
}

/*
 * Recette iPhone du 07/11/2026 (Hermann : « Ils doivent être intégrés dans les cadres existants. Par ailleurs la mention du
 * nom du format dans un cadre séparé doit disparaître. ») : les lignes de Format sont rendues par `ExecutionParametersSheet`
 * dans ses cadres (Exécution, Séries, Cadence), au clavier. [Cadre séparé `FormatSettingsFrame` à steppers ± — retiré.]
 */
