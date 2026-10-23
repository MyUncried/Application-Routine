/**
 * Point d'arrêt de Séance (V2-PRE-1, plan §3.3 ; PRE-6 story 1.2, AD-36 ;
 * story 6.1, D-441, RM-251) : identité, portée (avant, dans ou après le
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
 * **D-441 (story 6.1, remplace ARB-3)** : le point est un élément AUTONOME de
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
 * **D-442 (story 7.1)** : la tête de Circuit `(IN, 0)` est autorisée et
 * proposée ; à N ≥ 2 (`StopPointRules.tourRepeatCount`), un point de début ou
 * de fin de Tour échappe à RM-219 même si le Circuit ouvre ou clôt la
 * Séance, et leur coexistence est un conflit de Tour (`tourBoundaryConflict`)
 * que l'utilisateur tranche.
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
 * Prédicat UNIQUE de « séparateur » (story 6.1, D-441, RM-219, RM-251) : seule
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
 * Story 6.1 (D-441) : seuls les séparateurs (`isSequenceSeparator`, occurrences
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

// --- Début et fin de Tour (D-442) ---------------------------------------------

/**
 * Story 7.1 (D-442) : contexte des règles d'emplacement — N du Circuit
 * (`SessionDraft.tourRepeatCount`, nombre de Tours ou de Séries). Absent : 1
 * (`DEFAULT_TOUR_REPEAT_COUNT`), RM-219 s'applique sans exception. Un
 * `SessionDraft`, un `CompositionState` ou un `PlacementContext` conviennent
 * tels quels (typage structurel).
 */
export type StopPointRules = { readonly tourRepeatCount?: number };

/**
 * D-442 : le Circuit est-il exécuté plusieurs fois (N ≥ 2 Tours ou Séries) ? Lu sur N seul, comme
 * D-442 le formule : en Séries, des exercices hérités à moins de N séries peuvent réduire les
 * passages effectivement joués (`expandComposition`) sans changer cette règle d'emplacement.
 */
export function repeatsCircuit(rules: StopPointRules = {}): boolean {
  const count = rules.tourRepeatCount ?? 1;
  return Number.isFinite(count) && count >= 2;
}

/** Limite de Tour d'un point : début (`HEAD`) ou fin (`TAIL`) de Tour. */
export type TourBoundary = "HEAD" | "TAIL";

/**
 * Story 7.1 (D-442) : un point `IN_TOUR` est en DÉBUT de Tour (`HEAD`) si
 * aucun Exercice du Circuit ne le précède, en FIN de Tour (`TAIL`) si aucun ne
 * le suit ; `null` hors Circuit, entre deux Exercices, ou si le Circuit ne
 * contient aucun Exercice (seules d'anciennes Récupérations autonomes : rien
 * n'est répété). Comme RM-219 et RM-251, seules les occurrences `EXERCISE`
 * comptent (`isSequenceSeparator`) : `(IN, 0)` est le début de Tour usuel,
 * `(IN, nI)` la fin. Indépendant de N — voir `repeatsCircuit`. Une position
 * hors bornes ou non entière (donnée invalide) n'est jamais une limite de Tour.
 */
export function tourBoundaryOf(
  occurrences: readonly SequenceOccurrence[],
  point: StopPointLocation,
): TourBoundary | null {
  // Revue 7.1 : un point hors bornes ou non entier (donnée déjà invalide) n'est jamais une limite de Tour.
  if (point.scope !== "IN_TOUR" || !isStopPointPositionInRange(occurrences, point)) {
    return null;
  }
  const inCircuit = occurrences.filter((occurrence) => occurrence.structuralPosition === "IN_TOUR");
  const separators = inCircuit.filter(isSequenceSeparator).length;
  if (separators === 0) {
    return null;
  }
  const preceding = inCircuit.slice(0, point.position).filter(isSequenceSeparator).length;
  if (preceding === 0) {
    return "HEAD";
  }
  return preceding === separators ? "TAIL" : null;
}

/**
 * Story 7.1 (D-442) : emplacement autorisé au sens de RM-219, N compris. À
 * N ≥ 2, un point de début ou de fin de Tour reste autorisé même si le
 * Circuit ouvre ou clôt la Séance (entre deux Tours, un Exercice le précède et
 * le suit ; l'exécution omet seulement l'arrêt qui suivrait le compte à
 * rebours ou précéderait la Fin, `expandComposition`). À N = 1 : RM-219
 * telle quelle (`stopPointNeighbors`).
 */
export function isStopPointPlacementAllowed(
  occurrences: readonly SequenceOccurrence[],
  point: StopPointLocation,
  rules: StopPointRules = {},
): boolean {
  if (repeatsCircuit(rules) && tourBoundaryOf(occurrences, point) !== null) {
    return true;
  }
  return isStopPointPlacementValid(stopPointNeighbors(occurrences, point));
}

/** Emplacement à la fois dans les bornes et autorisé (RM-219 ; story 7.1, D-442 : exception de début et de fin de Tour à N ≥ 2). */
export function isStopPointAllowed(
  occurrences: readonly SequenceOccurrence[],
  point: StopPointLocation,
  rules: StopPointRules = {},
): boolean {
  return isStopPointPositionInRange(occurrences, point) && isStopPointPlacementAllowed(occurrences, point, rules);
}

/**
 * Tête de Circuit `(IN_TOUR, 0)`. Story 7.1 (D-442, remplace la
 * non-proposition de D-441) : emplacement désormais autorisé et proposé, sous
 * réserve de RM-219 et RM-251 ; le prédicat ne sert plus qu'à NOMMER
 * l'emplacement (emplacement de placement dédié `CIRCUIT_HEAD`, `placement.ts`).
 */
export function isCircuitHead(point: StopPointLocation): boolean {
  return point.scope === "IN_TOUR" && point.position === 0;
}

/**
 * Emplacement qu'un utilisateur peut CHOISIR pour un point : autorisé
 * (`isStopPointAllowed`, N compris). Story 7.1 (D-442) : la tête de Circuit
 * n'est plus exclue. RM-251, le conflit de Tour et l'occupation se jugent à
 * part (`wouldBeConsecutive`, `tourBoundaryConflict`, `moveStopPoint`).
 */
export function isStopPointProposable(
  occurrences: readonly SequenceOccurrence[],
  point: StopPointLocation,
  rules: StopPointRules = {},
): boolean {
  return isStopPointAllowed(occurrences, point, rules);
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

// --- Séquence mêlée (D-441) ---------------------------------------------------

/** Élément de la séquence mêlée d'une portée : une occurrence ou un point. */
export type SequenceItem<O, P> =
  | { readonly kind: "OCCURRENCE"; readonly occurrence: O }
  | { readonly kind: "STOP_POINT"; readonly point: P };

/**
 * Séquence mêlée d'une portée (D-441) : `[pt(s,0)?, occ1, pt(s,1)?, …, occn,
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

// --- RM-251 : non-consécutivité (D-441) ---------------------------------------

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

/** Story 7.1 (D-442) : retrait de plusieurs points par identifiant ; aucun visé : liste rendue telle quelle (même identité). */
export function withoutStopPoints<T extends StopPoint>(points: readonly T[], ids: Iterable<string>): readonly T[] {
  const removed = new Set(ids);
  return points.some((point) => removed.has(point.id)) ? points.filter((point) => !removed.has(point.id)) : points;
}

// --- Conflit de Tour (D-442) --------------------------------------------------

/**
 * Story 7.1 (D-442) : à N ≥ 2, un point de début de Tour et un point de fin de
 * Tour se suivraient entre deux Tours (fin du Tour k, début du Tour k + 1) —
 * RM-251 sur la séquence EXÉCUTÉE, que la séquence structurelle (sans
 * répétition) ne voit pas. Rend la paire en conflit (le PREMIER point de début
 * et le DERNIER point de fin dans la séquence : ceux qui se touchent entre deux
 * Tours), ou `null` : N = 1, Circuit sans Exercice, ou l'un des deux absent.
 * L'opération qui le CRÉERAIT demande lequel conserver (`TourBoundaryChoice`) ;
 * un conflit hérité n'empêche pas l'enregistrement et l'exécution n'en fait
 * qu'un arrêt (`expandComposition`).
 */
export function tourBoundaryConflict<P extends StopPointLocation>(
  occurrences: readonly SequenceOccurrence[],
  points: readonly P[],
  rules: StopPointRules = {},
): { readonly head: P; readonly tail: P } | null {
  if (!repeatsCircuit(rules)) {
    return null;
  }
  let head: P | null = null;
  let tail: P | null = null;
  for (const item of scopeSequence(occurrences, points, "IN_TOUR")) {
    if (item.kind !== "STOP_POINT") {
      continue;
    }
    const boundary = tourBoundaryOf(occurrences, item.point);
    if (boundary === "HEAD" && head === null) {
      head = item.point;
    } else if (boundary === "TAIL") {
      tail = item.point;
    }
  }
  return head !== null && tail !== null ? { head, tail } : null;
}

/**
 * Revue 7.1 (D-442) : TOUS les points de la limite `boundary` (début ou fin de Tour). Une
 * résolution de conflit retire tous les points de la limite écartée — avec deux points de fin
 * hérités (paire consécutive, ancienne Récupération), n'en retirer qu'un laisserait le conflit.
 */
export function tourBoundaryPoints<P extends StopPointLocation>(
  occurrences: readonly SequenceOccurrence[],
  points: readonly P[],
  boundary: TourBoundary,
): readonly P[] {
  return points.filter((point) => tourBoundaryOf(occurrences, point) === boundary);
}

/** Prédicat du conflit de Tour (D-442, `tourBoundaryConflict`). */
export function hasTourBoundaryConflict(
  occurrences: readonly SequenceOccurrence[],
  points: readonly StopPointLocation[],
  rules: StopPointRules = {},
): boolean {
  return tourBoundaryConflict(occurrences, points, rules) !== null;
}

/**
 * Choix de l'utilisateur devant un conflit de Tour (D-442) : conserver le
 * point de début de Tour (`HEAD`, « Début de tour ») ou celui de fin (`TAIL`,
 * « Fin de tour ») ; « Annuler » n'applique rien (l'appelant garde l'état).
 */
export type TourBoundaryChoice = TourBoundary;

/** Conflit de Tour nommé par les identifiants des deux points (issue « choix requis »). */
export type TourBoundaryConflict = {
  readonly headStopPointId: string;
  readonly tailStopPointId: string;
};
