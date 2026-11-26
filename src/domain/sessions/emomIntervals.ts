/**
 * D-607 (D-572 point 6 de la branche de documentation, Hermann, 25/11/2026 ; Formats § 9.9) — EMOM : l'intervalle est propre à
 * chaque mouvement et à chaque tour ; « Dans chaque intervalle », l'intervalle de chaque tour est partagé par les mouvements
 * (porté par le Circuit porteur).
 *
 * Stockage (réglages de Format, JSON versionné existant, listes admises par `FormatSettingValue`) :
 * - Exercice EMOM (seul, À la suite, En alternance) : `intervalSeconds` (intervalle de la série 1, inchangé) et, seulement quand
 *   les séries n'ont pas toutes le même intervalle, `intervalsSeconds` (un intervalle par série, S1…Sn) ;
 * - Circuit porteur EMOM (« Dans chaque intervalle ») : `windowSeconds` (intervalle du tour 1, inchangé) et, seulement quand les
 *   tours diffèrent, `windowsSeconds` (un intervalle par tour).
 *
 * Compatibilité : liste absente (séances existantes) = l'intervalle unique pour chaque série ou tour. Une liste dont la première
 * valeur ne correspond plus à l'intervalle unique (intervalle réécrit seul par un autre chemin, par exemple la durée de tour du
 * Circuit) est ignorée : l'intervalle unique s'applique alors à toutes les séries. Une liste plus courte que le nombre de séries
 * est complétée par l'intervalle unique (série ou tour ajouté). L'exécution lit toujours l'intervalle unique (série ou tour 1).
 */

import type { FormatSettings } from "./formats/elementFormat";

export const EMOM_DEFAULT_INTERVAL_SECONDS = 60;

/** Réglage de l'intervalle unique : Exercice (`intervalSeconds`) ou Circuit porteur (`windowSeconds`). */
export type EmomIntervalSetting = "intervalSeconds" | "windowSeconds";

/** Liste par série ou par tour associée à l'intervalle unique. */
export function emomIntervalListId(setting: EmomIntervalSetting): "intervalsSeconds" | "windowsSeconds" {
  return setting === "intervalSeconds" ? "intervalsSeconds" : "windowsSeconds";
}

/** Intervalle de chaque série ou tour (rangs 0…count−1), selon les règles de compatibilité de l'en-tête. */
export function emomIntervalsOf(settings: FormatSettings | undefined, setting: EmomIntervalSetting, count: number): readonly number[] {
  const scalar = settings?.[setting];
  const single = typeof scalar === "number" && scalar > 0 ? scalar : EMOM_DEFAULT_INTERVAL_SECONDS;
  const list = settings?.[emomIntervalListId(setting)];
  const usable = Array.isArray(list) && list.length > 0 && list[0] === single && list.every((value) => typeof value === "number" && value > 0);
  return Array.from({ length: Math.max(1, count) }, (_, rank) => (usable ? ((list as readonly number[])[rank] ?? single) : single));
}

/**
 * Réglages avec l'intervalle de chaque série ou tour : intervalle unique = celui de la série ou du tour 1 ; liste écrite seulement si
 * les valeurs diffèrent (sinon retirée : une même configuration n'a qu'une écriture).
 */
export function withEmomIntervals(settings: FormatSettings, setting: EmomIntervalSetting, intervals: readonly number[]): FormatSettings {
  if (intervals.length === 0) return settings;
  const listId = emomIntervalListId(setting);
  const { [listId]: _list, ...rest } = settings;
  const rounded = intervals.map((value) => Math.max(1, Math.round(value)));
  const first = rounded[0]!;
  return rounded.every((value) => value === first) ? { ...rest, [setting]: first } : { ...rest, [setting]: first, [listId]: rounded };
}

/** Intervalle de la série ou du tour `rank` remplacé (les autres rangs conservés). */
export function withEmomIntervalAt(settings: FormatSettings, setting: EmomIntervalSetting, count: number, rank: number, seconds: number): FormatSettings {
  const intervals = [...emomIntervalsOf(settings, setting, count)];
  if (rank < 0 || rank >= intervals.length) return settings;
  intervals[rank] = seconds;
  return withEmomIntervals(settings, setting, intervals);
}

/** Somme des intervalles des `count` séries ou tours (durée de l'EMOM, ses fenêtres successives). */
export function emomIntervalsTotal(settings: FormatSettings | undefined, setting: EmomIntervalSetting, count: number): number {
  return emomIntervalsOf(settings, setting, count).reduce((total, value) => total + value, 0);
}
