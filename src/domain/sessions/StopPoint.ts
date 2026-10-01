/**
 * Point d'arrêt de Séance (V2-PRE-1, plan §3.3) : identité, position hors ou
 * dans le Circuit (Tour) et ordre dans sa portée. Un Point d'arrêt interne au
 * Circuit est rejoué implicitement à chaque Tour. Il est interdit
 * immédiatement après le compte à rebours initial et immédiatement avant la
 * fin de Séance. Lorsqu'il suit un Exercice, la récupération post-exercice
 * précède le Point d'arrêt.
 *
 * Module de Domaine pur — non encore câblé dans `Session`/`SessionRepository`/
 * la persistance SQLite : la mission bornée de cette invocation n'a pas pu
 * couvrir l'intégration complète de bout en bout (limite disclosée dans le
 * rapport de mission). Les invariants de placement et d'ordre ci-dessous sont
 * la seule implémentation, prête à être réutilisée par cette intégration
 * future.
 */

import type { StructuralPosition } from "./Session";

/** Mêmes trois portées structurelles que celles d'un Exercice (`StructuralPosition`) — un Point d'arrêt hors Circuit est `BEFORE_TOUR`/`AFTER_TOUR`, un Point d'arrêt dans le Circuit est `IN_TOUR`. */
export type StopPointScope = StructuralPosition;

export type StopPoint = {
  readonly id: string;
  readonly scope: StopPointScope;
  /** Rang 0-indexé DANS sa portée — même convention que `Activity.position`. */
  readonly order: number;
};

export type StopPointNeighbors = {
  readonly isImmediatelyAfterInitialCountdown: boolean;
  readonly isImmediatelyBeforeSessionEnd: boolean;
};

/** Un Point d'arrêt ne peut jamais être placé immédiatement après le compte à rebours initial, ni immédiatement avant la fin de Séance. */
export function isStopPointPlacementValid(neighbors: StopPointNeighbors): boolean {
  return !neighbors.isImmediatelyAfterInitialCountdown && !neighbors.isImmediatelyBeforeSessionEnd;
}

/** Ordres uniques par portée (aucun doublon d'ordre au sein d'une même portée ; deux portées distinctes sont indépendantes). */
export function hasUniqueOrderPerScope(points: readonly StopPoint[]): boolean {
  const seenByScope = new Map<StopPointScope, Set<number>>();
  for (const point of points) {
    const seen = seenByScope.get(point.scope) ?? new Set<number>();
    if (seen.has(point.order)) {
      return false;
    }
    seen.add(point.order);
    seenByScope.set(point.scope, seen);
  }
  return true;
}

/** Points d'arrêt d'une portée donnée, ordonnés par `order` croissant. */
export function orderStopPointsByScope(
  points: readonly StopPoint[],
  scope: StopPointScope,
): readonly StopPoint[] {
  return points
    .filter((point) => point.scope === scope)
    .slice()
    .sort((a, b) => a.order - b.order);
}
