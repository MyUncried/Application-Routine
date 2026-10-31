/**
 * PRE-9 (story B.6 ; ARB-02 « Règles retenues », ARB-02a, ARB-02b, ARB-06) — Points d'arrêt sur toute
 * la structure générale : niveau Séance, Cycles et Circuits (du niveau Séance ou d'un Cycle).
 *
 * Aucune règle nouvelle : RM-219, RM-220, RM-251, D-441 et D-442 sont évaluées sur la **séquence
 * fonctionnelle de toute la structure** (ARB-02, règle 1 : « Contrôles inchangés, appliqués à la
 * séquence fonctionnelle de toute la structure »), un seul mécanisme pour le Circuit et le Cycle
 * (ARB-02b : « Ne pas introduire un second mécanisme de gestion des points d'arrêt »).
 *
 * **Séquence fonctionnelle** (`analyzeLayoutStopPoints`) : la structure lue dans l'ordre d'affichage,
 * sans répétition, où chaque conteneur (Séance, Cycle, Circuit) offre un emplacement avant chacun de
 * ses éléments et un après le dernier (`position` = nombre d'éléments du conteneur qui le précèdent,
 * `structure.ts`). Les emplacements de deux conteneurs emboîtés restent distincts (« après le dernier
 * Exercice du Circuit » et « après le Circuit ») ; aucun Exercice ne les sépare : ils sont consécutifs
 * au sens structurel (D-441, ARB-02 règle 2 : la définition structurelle s'applique à chaque
 * conteneur, Circuit ou Cycle, et aux conteneurs emboîtés). Seule une occurrence `EXERCISE` sépare
 * deux Points (`isSequenceSeparator`, RM-251 : « une Récupération n'est pas un séparateur »).
 *
 * **Portées répétées** : un Circuit (N Tours ou Séries) et un Cycle (k répétitions) ; un emplacement
 * appartient aux portées qui l'englobent (Circuit d'un Cycle : les deux). Un Point d'une portée est
 * rencontré à chaque passage de celle-ci (RM-220 ; ARB-02a : « Un point d'arrêt placé à l'intérieur
 * d'un Cycle est rencontré à chaque répétition du Cycle »), un Point du niveau Séance une fois.
 *
 * - **RM-219** : aucun Point qu'aucun Exercice ne précède (juste après le Compte à rebours) ou ne
 *   suit (juste avant la Fin). Exception D-442, étendue au Cycle par ARB-02b : un Point de **début ou
 *   de fin** d'une portée répétée (N ≥ 2, ou Cycle × k ≥ 2) reste autorisé même si elle ouvre ou clôt
 *   la Séance — début : aucun Exercice de la portée ne le précède en elle ; fin : aucun ne le suit.
 * - **RM-251** : deux Points sans Exercice entre eux sont consécutifs.
 * - **Conflit de répétition** (D-442 « Début et fin de Tour », ARB-02 règle 5, ARB-02b) : dans une
 *   portée répétée, un Point de début et un Point de fin se suivraient entre deux passages ; l'action
 *   qui le crée demande lequel conserver (même choix, mêmes opérations que pour le Circuit).
 *
 * **Opérations** (D-441 : « les points restent à leur place dans la séquence ») : retirer un élément
 * d'un conteneur recule les Points qui le suivent ; insérer un élément au rang `i` le place avant le
 * Point qui occupe ce rang (convention de l'ancien modèle, `sequenceIndexForOccurrenceIndex`) ; un
 * conteneur déplacé emporte ses Points ; un conteneur retiré (vidé) perd les siens. Le jugement
 * (`settleLayoutStopPoints`) applique ensuite D-442 : Points devenus interdits retirés sans message,
 * second de deux Points devenus consécutifs retiré (le premier conservé), conflit de répétition créé
 * → choix requis. Les situations héritées (paires déjà consécutives, conflit déjà présent) ne sont pas
 * retouchées, comme dans l'ancien modèle (`composition.ts`, `settle`).
 *
 * Fonctions pures, sans React ni SQLite.
 */

import type { TourBoundary, TourBoundaryChoice } from "./StopPoint";
import type { SessionStructure, StructureCircuit, StructureStopPointLocation } from "./structure";

/** Point d'une disposition : emplacement et, dans un brouillon, identifiant (toujours présent à l'exécution). */
export type LayoutStopPoint = StructureStopPointLocation & { readonly id?: string };

type LayoutElements = Pick<SessionStructure<string, StructureStopPointLocation>, "elements">;

/** Conteneur d'un emplacement : niveau Séance, Cycle ou Circuit. */
export type StopPointContainer = { readonly kind: "SESSION" } | { readonly kind: "CIRCUIT" | "CYCLE"; readonly id: string };

/** Conteneur d'un Point (`circuitId`, sinon `cycleId`, sinon la Séance) ; `null` si les deux sont renseignés (invalide). */
export function stopPointContainerOf(point: StructureStopPointLocation): StopPointContainer | null {
  const cycleId = point.cycleId ?? null;
  if (point.circuitId !== null) return cycleId === null ? { kind: "CIRCUIT", id: point.circuitId } : null;
  return cycleId !== null ? { kind: "CYCLE", id: cycleId } : { kind: "SESSION" };
}

/** Emplacement `position` du conteneur `container`, dans la forme persistée (`structure.ts`). */
export function stopPointLocationIn(container: StopPointContainer, position: number): StructureStopPointLocation {
  switch (container.kind) {
    case "SESSION":
      return { circuitId: null, position };
    case "CIRCUIT":
      return { circuitId: container.id, position };
    case "CYCLE":
      return { circuitId: null, cycleId: container.id, position };
    default: {
      const unreachable: never = container;
      return unreachable;
    }
  }
}

export function sameStopPointContainer(a: StopPointContainer, b: StopPointContainer): boolean {
  return a.kind === b.kind && (a.kind === "SESSION" || (b.kind !== "SESSION" && a.id === b.id));
}

const containerKey = (container: StopPointContainer) => (container.kind === "SESSION" ? "SESSION" : `${container.kind}:${container.id}`);

/** Clé d'emplacement (conteneur et rang), identifiant ignoré ; `INVALID` pour un conteneur invalide. */
export function layoutStopPointKey(point: StructureStopPointLocation): string {
  const container = stopPointContainerOf(point);
  return container === null ? "INVALID" : `${containerKey(container)}@${point.position}`;
}

/** Identifiant d'un Point ; à défaut (donnée sans identité), sa clé d'emplacement. */
export function layoutStopPointId(point: LayoutStopPoint): string {
  return point.id ?? layoutStopPointKey(point);
}

const samePoint = (a: StructureStopPointLocation, b: StructureStopPointLocation) => layoutStopPointKey(a) === layoutStopPointKey(b);

// ---------------------------------------------------------------------------
// Séquence fonctionnelle
// ---------------------------------------------------------------------------

/** Portée répétée : un Circuit (N) ou un Cycle (k). */
export type RepetitionScope = { readonly kind: "CIRCUIT" | "CYCLE"; readonly id: string; readonly repeatCount: number };

/** Élément de la séquence fonctionnelle : un emplacement de Point, ou un Exercice. */
export type FunctionalItem =
  | {
      readonly kind: "SLOT";
      readonly key: string;
      readonly container: StopPointContainer;
      readonly position: number;
      /** Portées qui englobent l'emplacement, de la plus extérieure à la plus intérieure. */
      readonly scopes: readonly RepetitionScope[];
    }
  | { readonly kind: "EXERCISE"; readonly id: string; readonly separator: boolean; readonly scopes: readonly RepetitionScope[] };

type ScopeRange = { readonly scope: RepetitionScope; readonly start: number; readonly end: number };

/** Lecture de la séquence fonctionnelle d'une disposition (voir l'en-tête). */
export type LayoutStopPointAnalysis = {
  readonly items: readonly FunctionalItem[];
  /** Rang de chaque emplacement dans `items`, par clé (`layoutStopPointKey`). */
  readonly slotIndex: ReadonlyMap<string, number>;
  /** `separatorsBefore[i]` : Exercices séparateurs strictement avant le rang `i` (longueur `items.length + 1`). */
  readonly separatorsBefore: readonly number[];
  /** Portées répétables, dans l'ordre d'ouverture. */
  readonly scopes: readonly ScopeRange[];
};

const scopeKey = (scope: Pick<RepetitionScope, "kind" | "id">) => `${scope.kind}:${scope.id}`;

/**
 * Séquence fonctionnelle de la disposition (voir l'en-tête). `isSeparator(exerciseId)` : l'occurrence
 * sépare-t-elle deux Points (type `EXERCISE`) ? Un identifiant inconnu est lu comme un Exercice.
 */
export function analyzeLayoutStopPoints(layout: LayoutElements, isSeparator: (exerciseId: string) => boolean): LayoutStopPointAnalysis {
  const items: FunctionalItem[] = [];
  const scopes: ScopeRange[] = [];
  const slot = (container: StopPointContainer, position: number, enclosing: readonly RepetitionScope[]) => {
    items.push({ kind: "SLOT", key: `${containerKey(container)}@${position}`, container, position, scopes: enclosing });
  };
  const exercise = (id: string, enclosing: readonly RepetitionScope[]) => {
    items.push({ kind: "EXERCISE", id, separator: isSeparator(id), scopes: enclosing });
  };
  const scoped = (scope: RepetitionScope, body: () => void) => {
    const start = items.length;
    const at = scopes.length;
    scopes.push({ scope, start, end: start });
    body();
    scopes[at] = { scope, start, end: items.length - 1 };
  };
  const circuit = (item: StructureCircuit<string>, outer: readonly RepetitionScope[]) => {
    const scope: RepetitionScope = { kind: "CIRCUIT", id: item.id, repeatCount: item.repeatCount };
    const enclosing = [...outer, scope];
    const container: StopPointContainer = { kind: "CIRCUIT", id: item.id };
    scoped(scope, () => {
      item.exercises.forEach((id, index) => {
        slot(container, index, enclosing);
        exercise(id, enclosing);
      });
      slot(container, item.exercises.length, enclosing);
    });
  };
  const session: StopPointContainer = { kind: "SESSION" };
  layout.elements.forEach((element, index) => {
    slot(session, index, []);
    switch (element.kind) {
      case "EXERCISE":
        exercise(element.exercise, []);
        break;
      case "CIRCUIT":
        circuit(element.circuit, []);
        break;
      case "CYCLE": {
        const scope: RepetitionScope = { kind: "CYCLE", id: element.cycle.id, repeatCount: element.cycle.repeatCount };
        const enclosing = [scope];
        const container: StopPointContainer = { kind: "CYCLE", id: element.cycle.id };
        scoped(scope, () => {
          element.cycle.members.forEach((member, memberIndex) => {
            slot(container, memberIndex, enclosing);
            if (member.kind === "EXERCISE") exercise(member.exercise, enclosing);
            else circuit(member.circuit, enclosing);
          });
          slot(container, element.cycle.members.length, enclosing);
        });
        break;
      }
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  });
  slot(session, layout.elements.length, []);

  const slotIndex = new Map<string, number>();
  const separatorsBefore: number[] = [0];
  items.forEach((item, index) => {
    if (item.kind === "SLOT") slotIndex.set(item.key, index);
    separatorsBefore.push(separatorsBefore[index]! + (item.kind === "EXERCISE" && item.separator ? 1 : 0));
  });
  return { items, slotIndex, separatorsBefore, scopes };
}

/** Lecture d'un brouillon : séparateur = occurrence de type `EXERCISE` (`isSequenceSeparator`). */
export function separatorOf(exercises: readonly { readonly id: string; readonly type?: string }[]): (exerciseId: string) => boolean {
  const types = new Map(exercises.map((exercise) => [exercise.id, exercise.type ?? "EXERCISE"]));
  return (exerciseId) => (types.get(exerciseId) ?? "EXERCISE") === "EXERCISE";
}

function indexOf(analysis: LayoutStopPointAnalysis, point: StructureStopPointLocation): number | undefined {
  if (!Number.isInteger(point.position)) return undefined;
  return analysis.slotIndex.get(layoutStopPointKey(point));
}

/** Emplacement existant dans la disposition (conteneur connu, rang entier dans ses bornes). */
export function isLayoutStopPointInRange(analysis: LayoutStopPointAnalysis, point: StructureStopPointLocation): boolean {
  return indexOf(analysis, point) !== undefined;
}

const separatorsBetween = (analysis: LayoutStopPointAnalysis, from: number, to: number) =>
  analysis.separatorsBefore[to]! - analysis.separatorsBefore[from]!;

/**
 * Début (`HEAD` : aucun Exercice de la portée ne le précède en elle) ou fin (`TAIL` : aucun ne le suit)
 * de la portée `scope` pour le Point ; `null` hors de la portée, entre deux Exercices, ou si la portée
 * ne contient aucun Exercice (rien n'y est répété). Indépendant du compte (voir `isRepeated`).
 */
export function layoutBoundaryOf(
  analysis: LayoutStopPointAnalysis,
  point: StructureStopPointLocation,
  scope: Pick<RepetitionScope, "kind" | "id">,
): TourBoundary | null {
  const index = indexOf(analysis, point);
  const range = analysis.scopes.find((candidate) => scopeKey(candidate.scope) === scopeKey(scope));
  if (index === undefined || range === undefined || index < range.start || index > range.end) return null;
  const inside = separatorsBetween(analysis, range.start, range.end + 1);
  if (inside === 0) return null;
  const before = separatorsBetween(analysis, range.start, index);
  if (before === 0) return "HEAD";
  return before === inside ? "TAIL" : null;
}

const isRepeated = (scope: RepetitionScope) => Number.isFinite(scope.repeatCount) && scope.repeatCount >= 2;

/** Portées répétées (compte ≥ 2) dont le Point est le début ou la fin de répétition. */
export function repeatedBoundariesOf(
  analysis: LayoutStopPointAnalysis,
  point: StructureStopPointLocation,
): readonly { readonly scope: RepetitionScope; readonly boundary: TourBoundary }[] {
  const index = indexOf(analysis, point);
  const item = index === undefined ? undefined : analysis.items[index];
  if (item === undefined || item.kind !== "SLOT") return [];
  return item.scopes.flatMap((scope) => {
    if (!isRepeated(scope)) return [];
    const boundary = layoutBoundaryOf(analysis, point, scope);
    return boundary === null ? [] : [{ scope, boundary }];
  });
}

/**
 * Emplacement autorisé (RM-219, exception D-442 / ARB-02b) : dans les bornes, et un Exercice le
 * précède et le suit dans la séquence, sauf début ou fin d'une portée répétée.
 */
export function isLayoutStopPointAllowed(analysis: LayoutStopPointAnalysis, point: StructureStopPointLocation): boolean {
  const index = indexOf(analysis, point);
  if (index === undefined) return false;
  if (repeatedBoundariesOf(analysis, point).length > 0) return true;
  const total = analysis.separatorsBefore[analysis.items.length]!;
  const before = analysis.separatorsBefore[index]!;
  return before > 0 && total - before > 0;
}

/** Points rangés dans l'ordre de la séquence (emplacements inconnus écartés ; même emplacement : ordre d'entrée). */
function orderedPoints<P extends StructureStopPointLocation>(
  analysis: LayoutStopPointAnalysis,
  points: readonly P[],
): readonly { readonly point: P; readonly index: number }[] {
  return points
    .map((point, order) => ({ point, order, index: indexOf(analysis, point) }))
    .filter((entry): entry is { point: P; order: number; index: number } => entry.index !== undefined)
    .sort((a, b) => a.index - b.index || a.order - b.order);
}

/** RM-251 : paires de Points consécutifs (aucun Exercice entre eux), dans l'ordre de la séquence. */
export function layoutConsecutivePairs<P extends StructureStopPointLocation>(
  analysis: LayoutStopPointAnalysis,
  points: readonly P[],
): readonly (readonly [P, P])[] {
  const ordered = orderedPoints(analysis, points);
  const pairs: (readonly [P, P])[] = [];
  for (let at = 1; at < ordered.length; at += 1) {
    const previous = ordered[at - 1]!;
    const current = ordered[at]!;
    if (separatorsBetween(analysis, previous.index, current.index) === 0) pairs.push([previous.point, current.point]);
  }
  return pairs;
}

/** RM-251 : un Point ajouté en `location` serait-il consécutif à l'un des `points` (un Point déjà là est ignoré) ? */
export function wouldBeConsecutiveInLayout(
  analysis: LayoutStopPointAnalysis,
  points: readonly StructureStopPointLocation[],
  location: StructureStopPointLocation,
): boolean {
  const candidate: StructureStopPointLocation = { ...location };
  const others = points.filter((point) => !samePoint(point, location));
  return layoutConsecutivePairs(analysis, [...others, candidate]).some(([first, second]) => first === candidate || second === candidate);
}

/** Conflit de répétition d'une portée : premier Point de début et dernier Point de fin (ceux qui se toucheraient). */
export type LayoutRepetitionConflict<P> = { readonly scope: RepetitionScope; readonly head: P; readonly tail: P };

/** Conflits de répétition (D-442, ARB-02b) des portées répétées, dans l'ordre de la séquence. */
export function layoutRepetitionConflicts<P extends StructureStopPointLocation>(
  analysis: LayoutStopPointAnalysis,
  points: readonly P[],
): readonly LayoutRepetitionConflict<P>[] {
  const ordered = orderedPoints(analysis, points);
  return analysis.scopes.flatMap(({ scope }) => {
    if (!isRepeated(scope)) return [];
    let head: P | null = null;
    let tail: P | null = null;
    for (const { point } of ordered) {
      const boundary = layoutBoundaryOf(analysis, point, scope);
      if (boundary === "HEAD" && head === null) head = point;
      else if (boundary === "TAIL") tail = point;
    }
    return head !== null && tail !== null ? [{ scope, head, tail }] : [];
  });
}

/** Tous les Points de la limite `boundary` de la portée `scope` (une résolution les retire tous). */
export function layoutRepetitionBoundaryPoints<P extends StructureStopPointLocation>(
  analysis: LayoutStopPointAnalysis,
  points: readonly P[],
  scope: Pick<RepetitionScope, "kind" | "id">,
  boundary: TourBoundary,
): readonly P[] {
  return points.filter((point) => layoutBoundaryOf(analysis, point, scope) === boundary);
}

// ---------------------------------------------------------------------------
// Points qui restent à leur place (D-441)
// ---------------------------------------------------------------------------

function inContainer(point: StructureStopPointLocation, container: StopPointContainer): boolean {
  const own = stopPointContainerOf(point);
  return own !== null && sameStopPointContainer(own, container);
}

function relocated<P extends StructureStopPointLocation>(point: P, container: StopPointContainer, position: number): P {
  const { cycleId: _cycleId, ...rest } = point;
  return { ...(rest as P), ...stopPointLocationIn(container, position) };
}

function mapPoints<P extends StructureStopPointLocation>(points: readonly P[], update: (point: P) => P): readonly P[] {
  let changed = false;
  const next = points.map((point) => {
    const updated = update(point);
    changed ||= updated !== point;
    return updated;
  });
  return changed ? next : points;
}

/** Un élément retiré du rang `index` de `container` : les Points qui le suivaient reculent d'un rang. */
export function stopPointsAfterRemoval<P extends StructureStopPointLocation>(points: readonly P[], container: StopPointContainer, index: number): readonly P[] {
  return mapPoints(points, (point) => (inContainer(point, container) && point.position > index ? { ...point, position: point.position - 1 } : point));
}

/** Un élément inséré au rang `index` de `container`, avant le Point qui occupe ce rang : ce Point et les suivants avancent. */
export function stopPointsAfterInsertion<P extends StructureStopPointLocation>(points: readonly P[], container: StopPointContainer, index: number): readonly P[] {
  return mapPoints(points, (point) => (inContainer(point, container) && point.position >= index ? { ...point, position: point.position + 1 } : point));
}

/**
 * Les `count` éléments consécutifs de `container` à partir du rang `start` deviennent les membres d'un
 * nouveau conteneur `into` (enveloppe multiple, B.4b) : les Points situés entre eux y entrent, à leur
 * place ; ceux d'avant ou d'après restent dehors, autour du nouveau conteneur.
 */
export function stopPointsAfterGrouping<P extends StructureStopPointLocation>(
  points: readonly P[],
  container: StopPointContainer,
  start: number,
  count: number,
  into: StopPointContainer,
): readonly P[] {
  if (count <= 1) return points;
  return mapPoints(points, (point) => {
    if (!inContainer(point, container) || point.position <= start) return point;
    if (point.position < start + count) return relocated(point, into, point.position - start);
    return { ...point, position: point.position - count + 1 };
  });
}

// ---------------------------------------------------------------------------
// Jugement après une opération
// ---------------------------------------------------------------------------

/** Points retenus et identifiants retirés. */
export type LayoutStopPointsResolution<P extends LayoutStopPoint = LayoutStopPoint> = {
  readonly stopPoints: readonly P[];
  readonly removedStopPointIds: readonly string[];
};

/** Conflit de répétition nommé (portée, identifiants des deux Points). */
export type LayoutRepetitionConflictInfo = {
  readonly scope: RepetitionScope;
  readonly headStopPointId: string;
  readonly tailStopPointId: string;
};

export type LayoutStopPointsSettlement<P extends LayoutStopPoint = LayoutStopPoint> =
  | ({ readonly status: "APPLIED" } & LayoutStopPointsResolution<P>)
  | {
      readonly status: "CHOICE_REQUIRED";
      readonly conflict: LayoutRepetitionConflictInfo;
      /** `HEAD` : « Début de tour / de répétition » conservé ; `TAIL` : la fin. Chacune complète (retraits compris). */
      readonly resolutions: Readonly<Record<TourBoundaryChoice, LayoutStopPointsResolution<P>>>;
    };

const pairKey = (a: LayoutStopPoint, b: LayoutStopPoint) => [layoutStopPointId(a), layoutStopPointId(b)].sort().join("|");

/** Une disposition et la lecture de ses séparateurs. */
export type LayoutStopPointState<P extends LayoutStopPoint = LayoutStopPoint> = {
  readonly layout: LayoutElements & { readonly stopPoints: readonly P[] };
  readonly isSeparator: (exerciseId: string) => boolean;
};

function conflictInfo(conflict: LayoutRepetitionConflict<LayoutStopPoint>): LayoutRepetitionConflictInfo {
  return { scope: conflict.scope, headStopPointId: layoutStopPointId(conflict.head), tailStopPointId: layoutStopPointId(conflict.tail) };
}

/**
 * Choix requis sur `points` (non appliqué) : pour chaque conflit NOUVEAU (portée sans conflit avant),
 * la résolution retire tous les Points de la limite écartée. Rend `null` sans conflit nouveau.
 */
function choiceFor<P extends LayoutStopPoint>(
  analysis: LayoutStopPointAnalysis,
  points: readonly P[],
  inherited: ReadonlySet<string>,
  removed: readonly string[],
): Extract<LayoutStopPointsSettlement<P>, { status: "CHOICE_REQUIRED" }> | null {
  const fresh = layoutRepetitionConflicts(analysis, points).filter((conflict) => !inherited.has(scopeKey(conflict.scope)));
  if (fresh.length === 0) return null;
  const resolve = (keep: TourBoundaryChoice): LayoutStopPointsResolution<P> => {
    const dropped = new Set(
      fresh.flatMap((conflict) =>
        layoutRepetitionBoundaryPoints(analysis, points, conflict.scope, keep === "HEAD" ? "TAIL" : "HEAD").map(layoutStopPointId),
      ),
    );
    return {
      stopPoints: points.filter((point) => !dropped.has(layoutStopPointId(point))),
      removedStopPointIds: [...removed, ...dropped],
    };
  };
  return { status: "CHOICE_REQUIRED", conflict: conflictInfo(fresh[0]!), resolutions: { HEAD: resolve("HEAD"), TAIL: resolve("TAIL") } };
}

function inheritedConflicts(state: LayoutStopPointState): ReadonlySet<string> {
  const analysis = analyzeLayoutStopPoints(state.layout, state.isSeparator);
  return new Set(layoutRepetitionConflicts(analysis, state.layout.stopPoints).map((conflict) => scopeKey(conflict.scope)));
}

/**
 * Règle TOLÉRANTE de D-442 (déplacement ou suppression d'un Exercice, déplacement d'un conteneur,
 * changement de compte), appliquée à toute la structure (ARB-02 règles 1 à 3, 5). `after` porte les
 * Points laissés à leur place par l'opération ; sont retirés, sans message, dans cet ordre :
 * 1. les Points dont l'emplacement n'existe plus (conteneur vidé et retiré) ;
 * 2. les Points devenus interdits (RM-219, exception de début et de fin de répétition comprise) ;
 * 3. RM-251, itérativement : le SECOND de la première paire consécutive nouvelle (le premier est
 *    conservé) ; les paires déjà consécutives avant l'opération restent (données héritées) ;
 * 4. un second Point sur un même emplacement (l'unicité étant vraie avant).
 * Puis un conflit de répétition créé (portée sans conflit avant) rend `CHOICE_REQUIRED`.
 */
export function settleLayoutStopPoints<P extends LayoutStopPoint>(before: LayoutStopPointState, after: LayoutStopPointState<P>): LayoutStopPointsSettlement<P> {
  const beforeAnalysis = analyzeLayoutStopPoints(before.layout, before.isSeparator);
  const afterAnalysis = analyzeLayoutStopPoints(after.layout, after.isSeparator);
  const previous = new Map(before.layout.stopPoints.map((point) => [layoutStopPointId(point), point]));
  const removed: string[] = [];
  let points = after.layout.stopPoints;
  const drop = (ids: readonly string[]) => {
    if (ids.length === 0) return;
    const gone = new Set(ids);
    removed.push(...ids);
    points = points.filter((point) => !gone.has(layoutStopPointId(point)));
  };

  drop(
    points
      .filter((point) => {
        const was = previous.get(layoutStopPointId(point));
        return !isLayoutStopPointInRange(afterAnalysis, point) && (was === undefined || isLayoutStopPointInRange(beforeAnalysis, was));
      })
      .map(layoutStopPointId),
  );
  drop(
    points
      .filter((point) => {
        const was = previous.get(layoutStopPointId(point));
        return !isLayoutStopPointAllowed(afterAnalysis, point) && (was === undefined || isLayoutStopPointAllowed(beforeAnalysis, was));
      })
      .map(layoutStopPointId),
  );

  const exempted = new Set(layoutConsecutivePairs(beforeAnalysis, before.layout.stopPoints).map(([first, second]) => pairKey(first, second)));
  for (;;) {
    const pair = layoutConsecutivePairs(afterAnalysis, points).find(([first, second]) => !exempted.has(pairKey(first, second)));
    if (pair === undefined) break;
    drop([layoutStopPointId(pair[1])]);
  }

  const uniqueBefore = new Set(before.layout.stopPoints.map(layoutStopPointKey)).size === before.layout.stopPoints.length;
  if (uniqueBefore) {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const { point } of orderedPoints(afterAnalysis, points)) {
      const key = layoutStopPointKey(point);
      if (seen.has(key)) duplicates.push(layoutStopPointId(point));
      else seen.add(key);
    }
    drop(duplicates);
  }

  const stopPoints = removed.length === 0 ? after.layout.stopPoints : points;
  return choiceFor(afterAnalysis, stopPoints, inheritedConflicts(before), removed) ?? { status: "APPLIED", stopPoints, removedStopPointIds: removed };
}

/** Raison d'un refus strict (déplacement autonome d'un Point, duplication). */
export type LayoutStopPointRefusal = "STOP_POINT_NOT_ALLOWED" | "LOCATION_OCCUPIED" | "CONSECUTIVE_STOP_POINTS";

export type LayoutStopPointJudgement<P extends LayoutStopPoint = LayoutStopPoint> =
  | Extract<LayoutStopPointsSettlement<P>, { status: "APPLIED" | "CHOICE_REQUIRED" }>
  | { readonly status: "REFUSED"; readonly reason: LayoutStopPointRefusal; readonly stopPointIds: readonly string[] };

/**
 * Règle STRICTE (D-441, RM-251 ; ARB-06 : « selon les règles applicables à sa position de
 * destination ») du déplacement autonome du Point `stopPointId` vers `target`, structure inchangée :
 * refus sans mutation si la cible n'est pas autorisée (RM-219, exception de répétition comprise),
 * si elle porte un autre Point, ou si le Point y serait consécutif à un autre (aucune paire qui le
 * contient n'est exemptée) ; une dépose qui crée un conflit de répétition rend `CHOICE_REQUIRED`
 * (conserver l'autre Point retire donc le Point déplacé).
 */
export function judgeLayoutStopPointMove<P extends LayoutStopPoint>(
  state: LayoutStopPointState<P>,
  stopPointId: string,
  target: StructureStopPointLocation,
): LayoutStopPointJudgement<P> | null {
  const point = state.layout.stopPoints.find((candidate) => layoutStopPointId(candidate) === stopPointId);
  if (point === undefined) return null;
  const analysis = analyzeLayoutStopPoints(state.layout, state.isSeparator);
  if (!isLayoutStopPointAllowed(analysis, target)) {
    return { status: "REFUSED", reason: "STOP_POINT_NOT_ALLOWED", stopPointIds: [stopPointId] };
  }
  const occupant = state.layout.stopPoints.find((candidate) => candidate !== point && samePoint(candidate, target));
  if (occupant !== undefined) {
    return { status: "REFUSED", reason: "LOCATION_OCCUPIED", stopPointIds: [stopPointId, layoutStopPointId(occupant)] };
  }
  const container = stopPointContainerOf(target)!;
  const moved = relocated(point, container, target.position);
  const stopPoints = state.layout.stopPoints.map((candidate) => (candidate === point ? moved : candidate));
  const exempted = new Set(
    layoutConsecutivePairs(analysis, state.layout.stopPoints)
      .filter(([first, second]) => first !== point && second !== point)
      .map(([first, second]) => pairKey(first, second)),
  );
  const fresh = layoutConsecutivePairs(analysis, stopPoints).filter(([first, second]) => !exempted.has(pairKey(first, second)));
  if (fresh.length > 0) {
    return { status: "REFUSED", reason: "CONSECUTIVE_STOP_POINTS", stopPointIds: [...new Set(fresh.flat().map(layoutStopPointId))] };
  }
  return choiceFor(analysis, stopPoints, inheritedConflicts(state), []) ?? { status: "APPLIED", stopPoints, removedStopPointIds: [] };
}
