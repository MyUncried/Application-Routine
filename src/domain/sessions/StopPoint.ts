/**
 * Point d'arrêt de Séance (V2-PRE-1, plan §3.3 ; PRE-6 story 1.2, AD-36 ;
 * story 6.1, D-436, RM-251) : identité, portée (avant, dans ou après le
 * Circuit) et emplacement dans cette portée. Un Point d'arrêt interne au
 * Circuit est rejoué implicitement à chaque Tour. Il est interdit
 * immédiatement après le compte à rebours initial et immédiatement avant la
 * fin de Séance (RM-219, CE-T03-08 §14), et en doublon sur un même
 * emplacement. Lorsqu'il suit un Exercice, la récupération post-exercice
 * précède le Point d'arrêt.
 *
 * **Emplacement** (`position`) : nombre d'occurrences de la portée qui le
 * précèdent dans l'ordre affiché.
 *
 * **D-436 (story 6.1, remplace ARB-3)** : le point est un élément AUTONOME de
 * la séquence mêlée de sa portée — `[pt(s,0)?, occ1, pt(s,1)?, …, occn,
 * pt(s,n)?]` — et n'est plus rattaché à l'occurrence qui le précède : il ne
 * la suit pas au déplacement, n'est pas copié à la duplication ni retiré à la
 * suppression. Les opérations sur les occurrences (`composition.ts`) laissent
 * les points à leur place dans cette séquence et recalculent leur `position`.
 *
 * **RM-251 (non-consécutivité)** : sur la séquence structurelle complète
 * (BEFORE_TOUR, puis IN_TOUR, puis AFTER_TOUR, sans répétition), deux points
 * sont consécutifs si aucune occurrence `EXERCISE` ne les sépare — une
 * ancienne Récupération autonome (`RECOVERY`) ne les sépare pas. Les
 * frontières du Circuit en découlent : `(BEFORE, nB)` + `(IN, 0)`,
 * `(IN, nI)` + `(AFTER, 0)` et, Circuit vide, `(BEFORE, nB)` + `(AFTER, 0)`.
 *
 * Module de Domaine pur, porté de bout en bout par le brouillon
 * (`SessionDraft.stopPoints`), validé à l'enregistrement (`validation.ts`) et
 * persisté tel quel (`session_stop_points`).
 */

import type { ActivityType, StructuralPosition } from "./Session";

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

/** Occurrence vue par les règles de placement : seule sa portée compte. */
export type StopPointOccurrence = {
  readonly structuralPosition: StructuralPosition;
};

/**
 * Occurrence vue par RM-251 : sa portée et son type. Seule une occurrence
 * `EXERCISE` sépare deux points ; un type absent est lu `EXERCISE` (type par
 * défaut d'une occurrence).
 */
export type SequenceOccurrence = StopPointOccurrence & { readonly type?: ActivityType };

/**
 * Prédicat UNIQUE de « séparateur » (story 6.1, D-436, RM-219, RM-251) : seule
 * une occurrence `EXERCISE` sépare deux points, sépare un point du compte à
 * rebours initial ou de la Fin. Une ancienne Récupération autonome
 * (`RECOVERY`) n'est donc jamais un voisin au sens de RM-219 ni un séparateur
 * au sens de RM-251. Partagé par `stopPointNeighbors`, `consecutiveStopPointPairs`
 * et la fusion du développement (`circuit.ts`).
 */
export function isSequenceSeparator(occurrence: { readonly type?: ActivityType }): boolean {
  return (occurrence.type ?? "EXERCISE") === "EXERCISE";
}

export type StopPointNeighbors = {
  readonly isImmediatelyAfterInitialCountdown: boolean;
  readonly isImmediatelyBeforeSessionEnd: boolean;
};

/** Ordre affiché des portées (D-061) : avant → dans → après le Circuit, sans répétition. */
export const STOP_POINT_SCOPE_ORDER: readonly StopPointScope[] = ["BEFORE_TOUR", "IN_TOUR", "AFTER_TOUR"];

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
 *
 * Story 6.1 (D-436) : seuls les séparateurs (`isSequenceSeparator`, occurrences
 * `EXERCISE`) comptent ; une ancienne Récupération autonome n'est pas un
 * voisin — un point précédé seulement d'elle suit le compte à rebours. Un
 * type absent est lu `EXERCISE`.
 */
export function stopPointNeighbors(
  occurrences: readonly SequenceOccurrence[],
  point: StopPointLocation,
): StopPointNeighbors {
  const scopeIndex = STOP_POINT_SCOPE_ORDER.indexOf(point.scope);
  const precedingScopes = STOP_POINT_SCOPE_ORDER.slice(0, Math.max(0, scopeIndex));
  const precedingOutsideScope = occurrences.filter(
    (occurrence) => precedingScopes.includes(occurrence.structuralPosition) && isSequenceSeparator(occurrence),
  ).length;
  const inScope = occurrences.filter((occurrence) => occurrence.structuralPosition === point.scope);
  const clamped = Math.max(0, Math.min(point.position, inScope.length));
  const preceding = precedingOutsideScope + inScope.slice(0, clamped).filter(isSequenceSeparator).length;
  const separators = occurrences.filter(isSequenceSeparator).length;
  return {
    isImmediatelyAfterInitialCountdown: preceding === 0,
    isImmediatelyBeforeSessionEnd: separators - preceding === 0,
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
  occurrences: readonly SequenceOccurrence[],
  point: StopPointLocation,
): boolean {
  return (
    isStopPointPositionInRange(occurrences, point) &&
    isStopPointPlacementValid(stopPointNeighbors(occurrences, point))
  );
}

/**
 * Tête de Circuit `(IN_TOUR, 0)` : emplacement que l'interface ne propose
 * jamais (placement, déplacement autonome), bien qu'il ne soit pas interdit
 * par RM-219. Depuis la revue de la story 6.1, toute opération qui y AMÈNE un
 * point est refusée (`composition.ts`) : un point en tête de Circuit ne peut
 * être qu'une donnée héritée, laissée en place.
 */
export function isCircuitHead(point: StopPointLocation): boolean {
  return point.scope === "IN_TOUR" && point.position === 0;
}

/** Emplacement qu'un utilisateur peut CHOISIR pour un point : autorisé (RM-219) et hors tête de Circuit. */
export function isStopPointProposable(
  occurrences: readonly SequenceOccurrence[],
  point: StopPointLocation,
): boolean {
  return !isCircuitHead(point) && isStopPointAllowed(occurrences, point);
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

// --- Séquence mêlée (D-436) ---------------------------------------------------

/** Élément de la séquence mêlée d'une portée : une occurrence ou un point. */
export type SequenceItem<O, P> =
  | { readonly kind: "OCCURRENCE"; readonly occurrence: O }
  | { readonly kind: "STOP_POINT"; readonly point: P };

/**
 * Séquence mêlée d'une portée (D-436) : `[pt(s,0)?, occ1, pt(s,1)?, …, occn,
 * pt(s,n)?]`, occurrences dans l'ordre de la collection. Un point hors bornes
 * (négatif, non entier, au-delà de n) est ramené à la borne la plus proche
 * (`0..n`, partie entière) ; deux points sur un même emplacement (donnée déjà
 * invalide, `DUPLICATE`) gardent leur ordre d'entrée.
 */
export function scopeSequence<O extends StopPointOccurrence, P extends StopPointLocation>(
  occurrences: readonly O[],
  points: readonly P[],
  scope: StopPointScope,
): readonly SequenceItem<O, P>[] {
  const inScope = occurrences.filter((occurrence) => occurrence.structuralPosition === scope);
  const slotOf = (point: P) => {
    const position = Number.isFinite(point.position) ? Math.trunc(point.position) : inScope.length;
    return Math.max(0, Math.min(position, inScope.length));
  };
  const scopedPoints = points.filter((point) => point.scope === scope);
  const items: SequenceItem<O, P>[] = [];
  for (let slot = 0; slot <= inScope.length; slot += 1) {
    for (const point of scopedPoints) {
      if (slotOf(point) === slot) {
        items.push({ kind: "STOP_POINT", point });
      }
    }
    const occurrence = inScope[slot];
    if (occurrence !== undefined) {
      items.push({ kind: "OCCURRENCE", occurrence });
    }
  }
  return items;
}

/** Séquence structurelle complète : séquences mêlées de BEFORE_TOUR, IN_TOUR puis AFTER_TOUR, sans répétition. */
export function structuralSequence<O extends StopPointOccurrence, P extends StopPointLocation>(
  occurrences: readonly O[],
  points: readonly P[],
): readonly SequenceItem<O, P>[] {
  return STOP_POINT_SCOPE_ORDER.flatMap((scope) => scopeSequence(occurrences, points, scope));
}

/**
 * Emplacement `(scope, position)` d'un élément de rang `index` dans la
 * séquence mêlée de `scope` : nombre d'occurrences qui le précèdent.
 */
export function positionInSequence<O, P>(items: readonly SequenceItem<O, P>[], index: number): number {
  return items.slice(0, Math.max(0, index)).filter((item) => item.kind === "OCCURRENCE").length;
}

// --- RM-251 : non-consécutivité (D-436) ---------------------------------------

/**
 * RM-251 : paires de points consécutifs sur la séquence structurelle — deux
 * points sans occurrence `EXERCISE` entre eux (une ancienne Récupération
 * autonome ne sépare pas). Chaque paire est rendue dans l'ordre de la
 * séquence ; trois points consécutifs donnent deux paires.
 */
export function consecutiveStopPointPairs<P extends StopPointLocation>(
  occurrences: readonly SequenceOccurrence[],
  points: readonly P[],
): readonly (readonly [P, P])[] {
  const pairs: (readonly [P, P])[] = [];
  let previous: P | null = null;
  for (const item of structuralSequence(occurrences, points)) {
    if (item.kind === "STOP_POINT") {
      if (previous !== null) {
        pairs.push([previous, item.point]);
      }
      previous = item.point;
    } else if (isSequenceSeparator(item.occurrence)) {
      previous = null;
    }
  }
  return pairs;
}

/** RM-251 : aucun couple de points consécutifs. */
export function areStopPointsNonConsecutive(
  occurrences: readonly SequenceOccurrence[],
  points: readonly StopPointLocation[],
): boolean {
  return consecutiveStopPointPairs(occurrences, points).length === 0;
}

/**
 * RM-251 : un point AJOUTÉ en `location` serait-il consécutif à l'un des
 * `points` (un point déjà en `location` est ignoré, l'emplacement étant
 * considéré comme celui du candidat) ?
 */
export function wouldBeConsecutive(
  occurrences: readonly SequenceOccurrence[],
  points: readonly StopPointLocation[],
  location: StopPointLocation,
): boolean {
  const key = stopPointKey(location);
  const candidate: StopPointLocation = { scope: location.scope, position: location.position };
  const others = points.filter((point) => stopPointKey(point) !== key);
  return consecutiveStopPointPairs(occurrences, [...others, candidate]).some(
    ([first, second]) => first === candidate || second === candidate,
  );
}

// --- Retrait ------------------------------------------------------------------

/** Story 4.2 : retrait d'un point par son identifiant ; inconnu : liste rendue telle quelle (même identité). */
export function withoutStopPoint<T extends StopPoint>(points: readonly T[], id: string): readonly T[] {
  return points.some((point) => point.id === id) ? points.filter((point) => point.id !== id) : points;
}
