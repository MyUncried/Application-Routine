import { CYCLE_MAX, type ContentFrequency, type RoutineEntry } from "@/domain/planning/Routine";
import { planningStrings } from "@/features/planning/planningStrings";

/**
 * Grille créneaux × rotation (D-519, RM-253 à RM-256, RM-260 à RM-263 ; CE-UI-12, 18/11/2026) — état local pur.
 *
 * Une ligne par séance, dans l'ordre de la sélection ; une colonne par créneau du cycle (#1 à #7). Un point = la séance
 * est jouée dans ce créneau. La grille est enregistrée sans nouveau stockage : la fréquence de chaque entrée devient
 * « x fois sur n » avec n = longueur du cycle et les positions = colonnes pointées. Le moteur des occurrences n'est pas
 * modifié (rang de l'occurrence modulo n, chapitre 09).
 *
 * Planifications existantes (RM-263) : des séances réglées avec des n différents sont ramenées à un cycle commun, le plus
 * petit multiple commun des n, en recopiant leurs positions ; les occurrences produites restent identiques.
 * [Hypothèse technique, 18/11/2026 : RM-263 dit « positions retenues » sans préciser le cas de n différents.]
 */

export type PlanningGrid = {
  /** Longueur du cycle de rotation (RM-253) ; peut dépasser 7 pour une planification existante (RM-263). */
  readonly cycle: number;
  /** `points[ligne][colonne]` : la séance de la ligne est jouée dans le créneau `colonne + 1`. */
  readonly points: readonly (readonly boolean[])[];
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Cycle commun des entrées (plus petit multiple commun des n). */
export function commonCycle(entries: readonly { readonly frequency: ContentFrequency }[]): number {
  return entries.reduce((cycle, entry) => (cycle * entry.frequency.n) / gcd(cycle, entry.frequency.n), 1);
}

export function gridFromEntries(entries: readonly { readonly frequency: ContentFrequency }[]): PlanningGrid {
  const cycle = commonCycle(entries);
  return {
    cycle,
    points: entries.map((entry) => Array.from({ length: cycle }, (_, column) => entry.frequency.positions.includes((column % entry.frequency.n) + 1))),
  };
}

/** Fréquence d'une ligne de la grille (n = cycle, positions = colonnes pointées). */
export function frequencyOfRow(row: readonly boolean[]): ContentFrequency {
  const positions = row.flatMap((played, column) => (played ? [column + 1] : []));
  return { x: positions.length, n: row.length, positions };
}

/** Réécrit les fréquences des entrées d'après la grille (même ordre de lignes). */
export function entriesWithGrid(entries: readonly RoutineEntry[], grid: PlanningGrid): RoutineEntry[] {
  return entries.map((entry, row) => ({ ...entry, frequency: frequencyOfRow(grid.points[row] ?? Array.from({ length: grid.cycle }, () => true)) }));
}

/**
 * RM-260 : nouvelle longueur du cycle. Raccourcir retire les colonnes et leurs points ; une séance restée sans point est
 * jouée dans toutes les colonnes restantes. Allonger ajoute des colonnes pointées pour toutes les séances. Le reste de la
 * grille est conservé.
 */
export function withCycle(grid: PlanningGrid, cycle: number): PlanningGrid {
  const length = Math.max(1, Math.min(CYCLE_MAX, cycle));
  if (length === grid.cycle) return grid;
  const points = grid.points.map((row) => {
    if (length > row.length) return [...row, ...Array.from({ length: length - row.length }, () => true)];
    const kept = row.slice(0, length);
    return kept.some(Boolean) ? kept : kept.map(() => true);
  });
  return { cycle: length, points };
}

/**
 * RM-254 / RM-262 : bascule d'un point. Refusée (grille inchangée) si elle laisserait la ligne sans point ou la colonne
 * sans séance, ou si la colonne est hors du cycle.
 */
export function togglePoint(grid: PlanningGrid, row: number, column: number): PlanningGrid {
  const line = grid.points[row];
  if (line === undefined || column < 0 || column >= grid.cycle) return grid;
  const played = line[column] === true;
  if (played) {
    const rowCount = line.filter(Boolean).length;
    const columnCount = grid.points.filter((other) => other[column] === true).length;
    if (rowCount <= 1 || columnCount <= 1) return grid;
  }
  return { ...grid, points: grid.points.map((other, index) => (index === row ? other.map((value, at) => (at === column ? !played : value)) : other)) };
}

/** Vrai si un point peut être retiré (sinon la ligne ou la colonne resterait vide). */
export function canRemovePoint(grid: PlanningGrid, row: number, column: number): boolean {
  return togglePoint(grid, row, column) !== grid || grid.points[row]?.[column] !== true;
}

/** RM-255 / RM-262 : mention calculée d'une ligne (« à chaque fois », « 2 fois sur 3 »). */
export function rowMention(row: readonly boolean[]): string {
  const count = row.filter(Boolean).length;
  if (count === row.length) return planningStrings.form.everyTime;
  return planningStrings.form.frequency.replace("{x}", String(count)).replace("{n}", String(row.length));
}

/** Issues de la grille qui bloquent l'enregistrement : cycle à ramener à 7 (RM-263), colonne ou ligne vide (RM-254). */
export type GridIssue = "CYCLE_TOO_LONG" | "EMPTY_SLOT" | "EMPTY_ROW";

export function gridIssues(grid: PlanningGrid): GridIssue[] {
  const issues: GridIssue[] = [];
  if (grid.cycle > CYCLE_MAX) issues.push("CYCLE_TOO_LONG");
  if (grid.points.length > 0) {
    for (let column = 0; column < grid.cycle; column += 1) {
      if (!grid.points.some((row) => row[column] === true)) {
        issues.push("EMPTY_SLOT");
        break;
      }
    }
  }
  if (grid.points.some((row) => !row.some(Boolean))) issues.push("EMPTY_ROW");
  return issues;
}
