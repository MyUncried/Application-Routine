/**
 * PRE-6 (story 1.1, AD-34) — vue « Circuit » du Tour technique unique
 * (`cycle.tour`, RM-025, D-209) : une ORGANISATION (`CircuitNature`) et une
 * CONDITION DE FIN (`CircuitBound`), deux notions distinctes.
 *
 * - La nature dit comment le contenu se répète : Tours (contenu interne × N)
 *   ou Séries (série i de chaque exercice, i = 1..N). Elle est persistée
 *   (`tours.nature`, `migration011`) ; une séance antérieure se lit en Tours.
 * - La borne `COUNT` EST le `repeatCount` existant (`tourRepeatCount`,
 *   1..99, défaut 1) : aucun second compte concurrent (ch09 L574). Elle n'est
 *   pas persistée : `COUNT` reste implicite tant qu'aucun format n'existe.
 *
 * `CircuitBound` est une union FERMÉE : toute lecture passe par un `switch`
 * exhaustif sur `kind` (garde `never`), pour qu'une future variante (formats :
 * Durée, Max) soit additive et signalée par le compilateur. PRE-6 n'en crée
 * aucune.
 *
 * Futur foyer des opérations de Circuit (AD-39, story 1.4). Fonctions pures,
 * sans dépendance React ni SQLite.
 */

import { DEFAULT_TOUR_REPEAT_COUNT } from "./defaults";

/** Organisation du Circuit (ch10 L686-693) : Tours ou Séries. */
export type CircuitNature = "TOURS" | "SERIES";

/** Valeurs reconnues, dans l'ordre du `CHECK` de `tours.nature` (`migration011`). */
export const CIRCUIT_NATURES: readonly CircuitNature[] = ["TOURS", "SERIES"];

/** Nature d'une séance sans nature explicite : Circuit de Tours (« compatibilité tours par défaut », ch12 L1715). */
export const DEFAULT_CIRCUIT_NATURE: CircuitNature = "TOURS";

/** Garde de type d'une nature reconnue. */
export function isCircuitNature(value: unknown): value is CircuitNature {
  return typeof value === "string" && (CIRCUIT_NATURES as readonly string[]).includes(value);
}

/**
 * Condition de fin du Circuit (ch10 L1102-1108). Seule variante de la séance
 * libre : `COUNT`, dont `count` est le `repeatCount` du Tour (1..99).
 */
export type CircuitBound = { readonly kind: "COUNT"; readonly count: number };

/** Borne d'un brouillon (ou d'une entrée) : dérivée de `tourRepeatCount`, jamais stockée. */
export function circuitBoundOf(draft: { readonly tourRepeatCount?: number }): CircuitBound {
  return { kind: "COUNT", count: draft.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT };
}

/** Nombre de passages (Tours ou Séries) d'une borne — `switch` exhaustif sur `kind`. */
export function circuitBoundCount(bound: CircuitBound): number {
  switch (bound.kind) {
    case "COUNT":
      return bound.count;
    default: {
      const unreachable: never = bound.kind;
      return unreachable;
    }
  }
}
