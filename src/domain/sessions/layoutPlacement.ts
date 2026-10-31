/**
 * PRE-9 (story B.6 ; ch08 « Placement des récupérations et des points d'arrêt » ; ch13 CE-T03-08 ;
 * D-435, D-441, D-442 ; ARB-02, ARB-02a/b) — mode Placement sur une disposition générale (plusieurs
 * Circuits, Cycles) : mêmes emplacements, même sous-brouillon, mêmes règles que le placement de
 * l'ancien modèle (`placement.ts`), évalués sur la séquence fonctionnelle de toute la structure
 * (`layoutStopPoints.ts`).
 *
 * - **Emplacements de Point** : chaque emplacement de chaque conteneur — après chaque Exercice, en
 *   tête de Circuit ou de Cycle (début de Tour / de répétition, D-442), après un Circuit ou un Cycle —
 *   dans l'ordre de la séquence. Un emplacement qui porte un Point existant est toujours rendu
 *   (sélectionné, désélectionnable : retrait programmé, D-441) ; un emplacement libre n'est proposé
 *   que s'il est autorisé (RM-219, exception de début et de fin de répétition à N ≥ 2 ou k ≥ 2) et
 *   ne rendrait aucun Point consécutif compte tenu de l'état effectif (RM-251) ; un ajout qui créerait
 *   un conflit de répétition demande le choix (« Début de tour / Fin de tour », ou de répétition,
 *   D-442, ARB-02b).
 * - **Récupération** (RM-209, RM-210, D-442) : attachée à l'occurrence, où qu'elle soit ; zones et
 *   réglages identiques à l'ancien modèle (`placementRecoverySeconds`, `selectPlacementRecovery`,
 *   `deselectPlacementRecovery`, réutilisés tels quels).
 * - **Sous-brouillon** : `PlacementDraft` de l'ancien modèle. Un emplacement de la disposition y est
 *   désigné par son RANG dans la séquence fonctionnelle (`layoutPlacementDesignation` : `position` =
 *   rang, `scope` sans signification de zone) — la structure ne change pas pendant le placement ; la
 *   désignation n'est jamais enregistrée : « Confirmer » la traduit en emplacement réel
 *   (`applyLayoutPlacementDraft`).
 *
 * Fonctions pures, sans React.
 */

import { currentLayout, withLayout } from "./layoutOperations";
import {
  analyzeLayoutStopPoints,
  isLayoutStopPointAllowed,
  layoutRepetitionBoundaryPoints,
  layoutRepetitionConflicts,
  layoutStopPointKey,
  separatorOf,
  stopPointLocationIn,
  wouldBeConsecutiveInLayout,
  type LayoutStopPoint,
  type LayoutStopPointAnalysis,
  type RepetitionScope,
  type StopPointContainer,
} from "./layoutStopPoints";
import {
  EMPTY_PLACEMENT_DRAFT,
  isPlacementStopPointAdded,
  isPlacementStopPointRemoved,
  type PlacementConfirmation,
  type PlacementDraft,
  type PlacementStopPointSlot,
} from "./placement";
import type { SessionDraft } from "./SessionDraft";
import { stopPointKey, type StopPointLocation, type TourBoundaryChoice } from "./StopPoint";
import type { SessionStructure, StructureStopPointLocation } from "./structure";

type Layout = SessionStructure<string, StructureStopPointLocation>;

/** Désignation d'un emplacement de la disposition dans le sous-brouillon : son rang dans la séquence. */
export function layoutPlacementDesignation(rank: number): StopPointLocation {
  return { scope: "BEFORE_TOUR", position: rank };
}

/** Emplacement de Point du placement d'une disposition générale. */
export type LayoutPlacementSlot = {
  /** Rang dans la séquence fonctionnelle (désignation du sous-brouillon). */
  readonly rank: number;
  readonly designation: StopPointLocation;
  /** Emplacement réel (conteneur et rang dans le conteneur). */
  readonly place: StructureStopPointLocation;
  readonly container: StopPointContainer;
  readonly position: number;
  /** Exercice qui précède immédiatement l'emplacement dans son conteneur (rangée sous sa carte), sinon `null`. */
  readonly afterExerciseId: string | null;
  /** Point existant (sélectionné) ou emplacement proposé ; `null` : rien à rendre. */
  readonly stopPoint: PlacementStopPointSlot | null;
};

/** Ce sur quoi se juge le placement : le brouillon (occurrences, disposition). */
export type LayoutPlacementContext = Pick<SessionDraft, "exercises" | "structure" | "stopPoints" | "tourRepeatCount" | "circuitNature">;

type Resolved = {
  readonly layout: Layout;
  readonly analysis: LayoutStopPointAnalysis;
  readonly slots: readonly { readonly rank: number; readonly place: StructureStopPointLocation; readonly container: StopPointContainer; readonly position: number; readonly afterExerciseId: string | null }[];
  readonly existing: readonly LayoutStopPoint[];
};

function resolve(context: LayoutPlacementContext): Resolved {
  const draft = context as SessionDraft;
  const layout = currentLayout(draft, () => "placement");
  const analysis = analyzeLayoutStopPoints(layout, separatorOf(context.exercises));
  const slots: Resolved["slots"][number][] = [];
  analysis.items.forEach((item, index) => {
    if (item.kind !== "SLOT") return;
    const previous = analysis.items[index - 1];
    const afterExerciseId = item.position > 0 && previous?.kind === "EXERCISE" && previous.scopes.length === item.scopes.length ? previous.id : null;
    slots.push({ rank: slots.length, place: stopPointLocationIn(item.container, item.position), container: item.container, position: item.position, afterExerciseId });
  });
  return { layout, analysis, slots, existing: layout.stopPoints };
}

const samePlace = (a: StructureStopPointLocation, b: StructureStopPointLocation) => layoutStopPointKey(a) === layoutStopPointKey(b);

/** Emplacement réel d'une désignation du sous-brouillon ; `null` si elle ne désigne rien. */
function placeOf(resolved: Resolved, designation: StopPointLocation): StructureStopPointLocation | null {
  return resolved.slots[designation.position]?.place ?? null;
}

/** Points ajoutés par le sous-brouillon (emplacements réels, sans identifiant). */
function additionsOf(resolved: Resolved, placement: PlacementDraft): LayoutStopPoint[] {
  return placement.stopPoints.flatMap((designation) => {
    const place = placeOf(resolved, designation);
    return place === null ? [] : [{ ...place }];
  });
}

/** Points effectifs : existants moins retraits programmés, plus ajouts (sans doublon d'emplacement). */
function effectivePoints(resolved: Resolved, placement: PlacementDraft): readonly LayoutStopPoint[] {
  const kept = resolved.existing.filter((point) => point.id === undefined || !placement.stopPointRemovals.includes(point.id));
  const added = additionsOf(resolved, placement).filter((point) => !kept.some((existing) => samePlace(existing, point)));
  return [...kept, ...added];
}

const scopeKey = (scope: Pick<RepetitionScope, "kind" | "id">) => `${scope.kind}:${scope.id}`;

function conflictedScopes(resolved: Resolved, points: readonly LayoutStopPoint[]): ReadonlySet<string> {
  return new Set(layoutRepetitionConflicts(resolved.analysis, points).map((conflict) => scopeKey(conflict.scope)));
}

/**
 * Emplacements de Point du placement, dans l'ordre de la séquence (voir l'en-tête), chacun avec son
 * Point existant ou proposé. Un Point existant sur un emplacement inconnu n'est pas rendu (donnée
 * invalide, refusée à l'enregistrement par la forme).
 */
export function layoutPlacementSlots(context: LayoutPlacementContext, placement: PlacementDraft = EMPTY_PLACEMENT_DRAFT): readonly LayoutPlacementSlot[] {
  const resolved = resolve(context);
  const effective = effectivePoints(resolved, placement);
  return resolved.slots.map((slot) => {
    const designation = layoutPlacementDesignation(slot.rank);
    const existing = resolved.existing.find((point) => samePlace(point, slot.place));
    let stopPoint: PlacementStopPointSlot | null = null;
    if (existing !== undefined) {
      stopPoint = existing.id === undefined ? { location: designation, existing: true } : { location: designation, existing: true, stopPointId: existing.id };
    } else if (isLayoutStopPointAllowed(resolved.analysis, slot.place)) {
      if (isPlacementStopPointAdded(placement, designation) || !wouldBeConsecutiveInLayout(resolved.analysis, effective, slot.place)) {
        stopPoint = { location: designation, existing: false };
      }
    }
    return { ...slot, designation, stopPoint };
  });
}

/** Choix requis par une bascule de Point (même forme que `PlacementStopPointOutcome`). */
export type LayoutPlacementStopPointOutcome =
  | { readonly status: "APPLIED"; readonly placement: PlacementDraft }
  | {
      readonly status: "CHOICE_REQUIRED";
      /** Portée du conflit : Circuit (« Début de tour / Fin de tour ») ou Cycle (de répétition). */
      readonly scope: RepetitionScope;
      readonly resolutions: Readonly<Record<TourBoundaryChoice, PlacementDraft>>;
    };

/** Sous-brouillon sans aucun Point effectif de la limite `boundary` de la portée `scope`. */
function withoutEffectiveBoundary(resolved: Resolved, placement: PlacementDraft, scope: RepetitionScope, boundary: "HEAD" | "TAIL"): PlacementDraft {
  const points = layoutRepetitionBoundaryPoints(resolved.analysis, effectivePoints(resolved, placement), scope, boundary);
  return points.reduce((current, point) => {
    if (point.id !== undefined) {
      return current.stopPointRemovals.includes(point.id) ? current : { ...current, stopPointRemovals: [...current.stopPointRemovals, point.id] };
    }
    return { ...current, stopPoints: current.stopPoints.filter((designation) => { const place = placeOf(resolved, designation); return place === null || !samePlace(place, point); }) };
  }, placement);
}

/** Premier conflit de répétition NOUVEAU de `next` par rapport à `previous` (état effectif), ou `null`. */
function freshConflictScope(resolved: Resolved, previous: PlacementDraft, next: PlacementDraft): RepetitionScope | null {
  const before = conflictedScopes(resolved, effectivePoints(resolved, previous));
  return layoutRepetitionConflicts(resolved.analysis, effectivePoints(resolved, next)).find((conflict) => !before.has(scopeKey(conflict.scope)))?.scope ?? null;
}

/**
 * Bascule du retrait programmé du Point existant `stopPointId` (D-441). Annuler un retrait est refusé
 * (sous-brouillon rendu tel quel) si le Point redevenait consécutif à un Point AJOUTÉ (RM-251) ou
 * créait un conflit de répétition avec un ajout (D-442) ; deux Points existants déjà en cause avant
 * le placement (hérités) n'empêchent rien.
 */
export function toggleLayoutPlacementStopPointRemoval(placement: PlacementDraft, stopPointId: string, context: LayoutPlacementContext): PlacementDraft {
  if (!placement.stopPointRemovals.includes(stopPointId)) {
    return { ...placement, stopPointRemovals: [...placement.stopPointRemovals, stopPointId] };
  }
  const resolved = resolve(context);
  const point = resolved.existing.find((candidate) => candidate.id === stopPointId);
  const reselected = { ...placement, stopPointRemovals: placement.stopPointRemovals.filter((id) => id !== stopPointId) };
  if (point === undefined) return reselected;
  const additions = additionsOf(resolved, placement).filter((added) => !resolved.existing.some((existing) => samePlace(existing, added)));
  if (wouldBeConsecutiveInLayout(resolved.analysis, additions, point)) return placement;
  const scope = freshConflictScope(resolved, placement, reselected);
  if (scope !== null) {
    const conflict = layoutRepetitionConflicts(resolved.analysis, effectivePoints(resolved, reselected)).find((item) => scopeKey(item.scope) === scopeKey(scope));
    if (conflict !== undefined && (conflict.head.id === undefined || conflict.tail.id === undefined)) return placement;
  }
  return reselected;
}

/**
 * Bascule d'un Point sur l'emplacement désigné (voir `togglePlacementStopPointOutcome`, ancien modèle) :
 * Point existant → bascule de son retrait (une resélection en conflit de répétition avec un ajout
 * demande le choix) ; emplacement ajouté → ajout retiré ; emplacement libre proposé → ajouté, ou choix
 * requis s'il crée un conflit de répétition ; sinon sous-brouillon rendu tel quel.
 */
export function toggleLayoutPlacementStopPointOutcome(
  placement: PlacementDraft,
  designation: StopPointLocation,
  context: LayoutPlacementContext,
): LayoutPlacementStopPointOutcome {
  const resolved = resolve(context);
  const place = placeOf(resolved, designation);
  if (place === null) return { status: "APPLIED", placement };
  const existing = resolved.existing.find((point) => samePlace(point, place));
  if (existing !== undefined && existing.id !== undefined) {
    const id = existing.id;
    const toggled = toggleLayoutPlacementStopPointRemoval(placement, id, context);
    if (toggled !== placement || !isPlacementStopPointRemoved(placement, id)) return { status: "APPLIED", placement: toggled };
    // Resélection refusée : si la seule cause est un conflit de répétition avec un AJOUT, choix.
    const reselected = { ...placement, stopPointRemovals: placement.stopPointRemovals.filter((item) => item !== id) };
    const scope = freshConflictScope(resolved, placement, reselected);
    if (scope === null) return { status: "APPLIED", placement };
    const conflict = layoutRepetitionConflicts(resolved.analysis, effectivePoints(resolved, reselected)).find((item) => scopeKey(item.scope) === scopeKey(scope));
    if (conflict === undefined || (conflict.head.id !== id && conflict.tail.id !== id)) return { status: "APPLIED", placement };
    const keepsHead = conflict.head.id === id;
    const withoutAddition = withoutEffectiveBoundary(resolved, reselected, scope, keepsHead ? "TAIL" : "HEAD");
    const others = effectivePoints(resolved, withoutAddition).filter((point) => point.id !== id);
    if (wouldBeConsecutiveInLayout(resolved.analysis, others, existing)) return { status: "APPLIED", placement };
    return { status: "CHOICE_REQUIRED", scope, resolutions: keepsHead ? { HEAD: withoutAddition, TAIL: placement } : { HEAD: placement, TAIL: withoutAddition } };
  }
  if (isPlacementStopPointAdded(placement, designation)) {
    const key = stopPointKey(designation);
    return { status: "APPLIED", placement: { ...placement, stopPoints: placement.stopPoints.filter((item) => stopPointKey(item) !== key) } };
  }
  const offered = layoutPlacementSlots(context, placement).some(
    (slot) => slot.stopPoint !== null && !slot.stopPoint.existing && stopPointKey(slot.designation) === stopPointKey(designation),
  );
  if (!offered) return { status: "APPLIED", placement };
  const next = { ...placement, stopPoints: [...placement.stopPoints, designation] };
  const scope = freshConflictScope(resolved, placement, next);
  if (scope === null) return { status: "APPLIED", placement: next };
  return {
    status: "CHOICE_REQUIRED",
    scope,
    resolutions: { HEAD: withoutEffectiveBoundary(resolved, next, scope, "TAIL"), TAIL: withoutEffectiveBoundary(resolved, next, scope, "HEAD") },
  };
}

/** Changements du sous-brouillon réellement applicables (même juge que l'ancien modèle, `applicablePlacement`). */
type Applicable = {
  readonly recoveries: ReadonlyMap<string, number>;
  readonly recoveryChanges: ReadonlyMap<string, number>;
  readonly recoveryRemovedIds: ReadonlySet<string>;
  readonly removedIds: ReadonlySet<string>;
  readonly kept: readonly LayoutStopPoint[];
  readonly additions: readonly StructureStopPointLocation[];
};

function applicable(context: LayoutPlacementContext, placement: PlacementDraft): Applicable {
  const resolved = resolve(context);
  const removedIds = new Set(resolved.existing.flatMap((point) => (point.id !== undefined && placement.stopPointRemovals.includes(point.id) ? [point.id] : [])));
  const kept = resolved.existing.filter((point) => point.id === undefined || !removedIds.has(point.id));

  const recoveries = new Map<string, number>();
  const recoveryChanges = new Map<string, number>();
  const recoveryRemovedIds = new Set<string>();
  for (const exercise of context.exercises) {
    const current = exercise.postActivityRecoverySeconds;
    const present = exercise.type === "EXERCISE" && current !== null && current !== undefined;
    const added = placement.recoveries[exercise.id];
    if (added !== undefined && exercise.type === "EXERCISE" && !present) {
      recoveries.set(exercise.id, added);
      continue;
    }
    if (present && placement.recoveryRemovals.includes(exercise.id)) {
      recoveryRemovedIds.add(exercise.id);
      continue;
    }
    const changed = placement.recoveryChanges[exercise.id];
    if (changed !== undefined && present && current !== changed) recoveryChanges.set(exercise.id, changed);
  }

  const additions: StructureStopPointLocation[] = [];
  for (const designation of placement.stopPoints) {
    const place = placeOf(resolved, designation);
    if (place === null || !isLayoutStopPointAllowed(resolved.analysis, place)) continue;
    const retained: readonly LayoutStopPoint[] = [...kept, ...additions];
    if (retained.some((point) => samePlace(point, place))) continue;
    if (wouldBeConsecutiveInLayout(resolved.analysis, retained, place)) continue;
    const before = conflictedScopes(resolved, retained);
    const createsConflict = layoutRepetitionConflicts(resolved.analysis, [...retained, place]).some((conflict) => !before.has(scopeKey(conflict.scope)));
    if (!createsConflict) additions.push(place);
  }
  return { recoveries, recoveryChanges, recoveryRemovedIds, removedIds, kept, additions };
}

/** Nature du bouton Confirmer (D-441 ; voir `placementConfirmation`). */
export function layoutPlacementConfirmation(placement: PlacementDraft, context: LayoutPlacementContext): PlacementConfirmation {
  const changes = applicable(context, placement);
  if (changes.recoveryChanges.size + changes.removedIds.size + changes.recoveryRemovedIds.size > 0) return { kind: "CHANGES" };
  const additions = changes.recoveries.size + changes.additions.length;
  return additions > 0 ? { kind: "ADDITIONS_ONLY", count: additions } : { kind: "NONE" };
}

/**
 * « Confirmer » (AD-43) : applique au brouillon, en une mise à jour, les changements applicables —
 * récupérations ajoutées, modifiées ou retirées (retrait : Pause terminale rétablie, RM-038), Points
 * retirés puis ajoutés à leur emplacement réel (identifiants fournis par `newStopPointId`). Rien
 * d'applicable : le brouillon lui-même.
 */
export function applyLayoutPlacementDraft(draft: SessionDraft, placement: PlacementDraft, newStopPointId: () => string): SessionDraft {
  const changes = applicable(draft, placement);
  const recoveriesChanged = changes.recoveries.size > 0 || changes.recoveryChanges.size > 0 || changes.recoveryRemovedIds.size > 0;
  const pointsChanged = changes.removedIds.size > 0 || changes.additions.length > 0;
  if (!recoveriesChanged && !pointsChanged) return draft;
  const exercises = draft.exercises.map((exercise) => {
    if (changes.recoveryRemovedIds.has(exercise.id)) return { ...exercise, postActivityRecoverySeconds: null };
    const seconds = changes.recoveries.get(exercise.id) ?? changes.recoveryChanges.get(exercise.id);
    return seconds === undefined ? exercise : { ...exercise, postActivityRecoverySeconds: seconds };
  });
  const next = recoveriesChanged ? { ...draft, exercises } : draft;
  if (!pointsChanged) return next;
  const layout = currentLayout(draft, () => "placement");
  const added = changes.additions.map((place) => ({ ...place, id: newStopPointId() }));
  return withLayout(next, { ...layout, stopPoints: [...changes.kept, ...added] });
}
