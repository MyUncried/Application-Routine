/**
 * Point d'arrêt de Séance (V2-PRE-1, plan §3.3 ; PRE-6 story 1.2, AD-36,
 * ARB-3) : identité, portée (avant, dans ou après le Circuit) et emplacement
 * dans cette portée. Un Point d'arrêt interne au Circuit est rejoué
 * implicitement à chaque Tour. Il est interdit immédiatement après le compte
 * à rebours initial et immédiatement avant la fin de Séance (RM-219,
 * CE-T03-08 §14), et en doublon sur un même emplacement. Lorsqu'il suit un
 * Exercice, la récupération post-exercice précède le Point d'arrêt.
 *
 * **Emplacement** (`position`) : nombre d'occurrences de la portée qui le
 * précèdent dans l'ordre affiché. `position = p ≥ 1` rattache le point à la
 * p-ième occurrence de sa portée (ARB-3, ch09 L682) : il la suit au
 * déplacement, est copié à la duplication, retiré à la suppression.
 * `position = 0` n'a pas d'occurrence d'attache : le point reste en tête de
 * sa portée. Le rattachement est CALCULÉ, jamais stocké
 * (`anchorStopPoints` / `reattachStopPoints`).
 *
 * Module de Domaine pur, porté de bout en bout par le brouillon
 * (`SessionDraft.stopPoints`), validé à l'enregistrement (`validation.ts`) et
 * persisté tel quel (`session_stop_points`).
 */

import type { StructuralPosition } from "./Session";

/** Mêmes trois portées structurelles que celles d'un Exercice (`StructuralPosition`) — un Point d'arrêt hors Circuit est `BEFORE_TOUR`/`AFTER_TOUR`, un Point d'arrêt dans le Circuit est `IN_TOUR`. */
export type StopPointScope = StructuralPosition;

export type StopPoint = {
  readonly id: string;
  readonly scope: StopPointScope;
  /** Emplacement dans la portée : nombre d'occurrences de cette portée qui le précèdent (`0..n`). */
  readonly position: number;
};

/** Emplacement d'un point, sans identité (entrée persistable, comparaison de brouillons). */
export type StopPointLocation = Pick<StopPoint, "scope" | "position">;

/** Occurrence vue par les règles de placement : seule sa portée compte (et son identifiant pour le rattachement). */
export type StopPointOccurrence = {
  readonly structuralPosition: StructuralPosition;
};

export type AnchorableOccurrence = StopPointOccurrence & { readonly id: string };

export type StopPointNeighbors = {
  readonly isImmediatelyAfterInitialCountdown: boolean;
  readonly isImmediatelyBeforeSessionEnd: boolean;
};

/** Ordre affiché des portées (D-061) : avant → dans → après le Circuit, sans répétition. */
const SCOPE_ORDER: readonly StopPointScope[] = ["BEFORE_TOUR", "IN_TOUR", "AFTER_TOUR"];

/** Un Point d'arrêt ne peut jamais être placé immédiatement après le compte à rebours initial, ni immédiatement avant la fin de Séance. */
export function isStopPointPlacementValid(neighbors: StopPointNeighbors): boolean {
  return !neighbors.isImmediatelyAfterInitialCountdown && !neighbors.isImmediatelyBeforeSessionEnd;
}

/** Nombre d'occurrences d'une portée. */
export function occurrenceCountInScope(
  occurrences: readonly StopPointOccurrence[],
  scope: StopPointScope,
): number {
  return occurrences.filter((occurrence) => occurrence.structuralPosition === scope).length;
}

/**
 * Voisins d'un point, lus sur la liste affichée (avant → dans → après le
 * Circuit, sans répétition) : aucun Exercice ne le précède (il suit
 * directement le compte à rebours initial) ou aucun ne le suit (il précède
 * directement la Fin). Une `position` hors bornes est ramenée dans
 * `0..n` — la borne elle-même relève de `isStopPointPositionInRange`.
 */
export function stopPointNeighbors(
  occurrences: readonly StopPointOccurrence[],
  point: StopPointLocation,
): StopPointNeighbors {
  const scopeIndex = SCOPE_ORDER.indexOf(point.scope);
  const precedingScopes = SCOPE_ORDER.slice(0, Math.max(0, scopeIndex));
  const precedingOutsideScope = occurrences.filter((occurrence) =>
    precedingScopes.includes(occurrence.structuralPosition),
  ).length;
  const inScope = occurrenceCountInScope(occurrences, point.scope);
  const clamped = Math.max(0, Math.min(point.position, inScope));
  const preceding = precedingOutsideScope + clamped;
  return {
    isImmediatelyAfterInitialCountdown: preceding === 0,
    isImmediatelyBeforeSessionEnd: occurrences.length - preceding === 0,
  };
}

/** `position` entière dans `0..nombre d'occurrences de la portée`. */
export function isStopPointPositionInRange(
  occurrences: readonly StopPointOccurrence[],
  point: StopPointLocation,
): boolean {
  return (
    Number.isInteger(point.position) &&
    point.position >= 0 &&
    point.position <= occurrenceCountInScope(occurrences, point.scope)
  );
}

/** Emplacement à la fois dans les bornes et autorisé (RM-219). */
export function isStopPointAllowed(
  occurrences: readonly StopPointOccurrence[],
  point: StopPointLocation,
): boolean {
  return (
    isStopPointPositionInRange(occurrences, point) &&
    isStopPointPlacementValid(stopPointNeighbors(occurrences, point))
  );
}

/** Au plus un point par `(scope, position)` ; deux portées distinctes sont indépendantes. */
export function hasUniquePositionPerScope(points: readonly StopPointLocation[]): boolean {
  const seen = new Set<string>();
  for (const point of points) {
    const key = stopPointKey(point);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
  }
  return true;
}

/** Clé d'emplacement `(scope, position)`, identifiant ignoré. */
export function stopPointKey(point: StopPointLocation): string {
  return `${point.scope}:${point.position}`;
}

/** Points d'arrêt d'une portée donnée, ordonnés par `position` croissante. */
export function orderStopPointsByScope<T extends StopPointLocation>(
  points: readonly T[],
  scope: StopPointScope,
): readonly T[] {
  return points
    .filter((point) => point.scope === scope)
    .slice()
    .sort((a, b) => a.position - b.position);
}

/**
 * Point accompagné de l'identifiant de son occurrence d'attache (ARB-3).
 * `anchorId = null` : point sans attache (`position = 0`, ou hors bornes),
 * laissé tel quel par `reattachStopPoints`.
 */
export type AnchoredStopPoint = {
  readonly point: StopPoint;
  readonly anchorId: string | null;
};

/** Associe chaque point `p ≥ 1` à la p-ième occurrence de sa portée, dans l'ordre affiché. */
export function anchorStopPoints(
  occurrences: readonly AnchorableOccurrence[],
  points: readonly StopPoint[],
): readonly AnchoredStopPoint[] {
  return points.map((point) => {
    if (!Number.isInteger(point.position) || point.position < 1) {
      return { point, anchorId: null };
    }
    const anchor = occurrences.filter((occurrence) => occurrence.structuralPosition === point.scope)[
      point.position - 1
    ];
    return { point, anchorId: anchor?.id ?? null };
  });
}

/**
 * Recalcule portée et emplacement de chaque point rattaché d'après la
 * position ACTUELLE de son occurrence : `scope` = portée de l'occurrence,
 * `position` = son rang dans cette portée + 1. Un point dont l'occurrence a
 * disparu est retiré ; un point sans attache est conservé tel quel.
 */
export function reattachStopPoints(
  occurrences: readonly AnchorableOccurrence[],
  anchored: readonly AnchoredStopPoint[],
): readonly StopPoint[] {
  const locationById = new Map<string, StopPointLocation>();
  const rankByScope = new Map<StopPointScope, number>();
  for (const occurrence of occurrences) {
    const rank = (rankByScope.get(occurrence.structuralPosition) ?? 0) + 1;
    rankByScope.set(occurrence.structuralPosition, rank);
    locationById.set(occurrence.id, { scope: occurrence.structuralPosition, position: rank });
  }

  const result: StopPoint[] = [];
  for (const { point, anchorId } of anchored) {
    if (anchorId === null) {
      result.push(point);
      continue;
    }
    const location = locationById.get(anchorId);
    if (location === undefined) {
      continue;
    }
    result.push(
      location.scope === point.scope && location.position === point.position
        ? point
        : { ...point, scope: location.scope, position: location.position },
    );
  }
  return result;
}
