/**
 * Mode placement de la Composition (PRE-6 story 4.1, AD-43, E7, E13, CE-T03-08 §14) :
 * emplacements autorisés des pauses et sous-brouillon local des ajouts.
 *
 * **Emplacements** (`placementSlots`), ni plus ni moins :
 * - récupération : après chaque occurrence `EXERCISE` (toutes zones, dernière comprise), une
 *   seule par occurrence — jamais avant le premier Exercice, puisqu'elle suit toujours le sien.
 *   Une occurrence qui porte déjà une récupération présente (0 ou positive, AD-35) l'affiche
 *   comme existante, sans ajout possible (sa modification relève de la story 4.2) ;
 * - point d'arrêt : après chaque occurrence (`position = p ≥ 1` de sa portée) et après le
 *   Circuit (`AFTER_TOUR`, `position = 0`) s'il n'est pas vide, en excluant les emplacements
 *   interdits (`isStopPointAllowed`, story 1.2 : jamais juste après le compte à rebours, jamais
 *   juste avant la Fin, RM-219). Un emplacement qui porte déjà un point l'affiche comme existant.
 *   Story 6.1 (D-436, RM-251) : un emplacement LIBRE n'est proposé que s'il ne rend aucun point
 *   consécutif, compte tenu de l'état effectif (points existants − retraits programmés + ajouts
 *   du sous-brouillon, `effectivePlacementStopPoints`).
 *
 * **Sous-brouillon** (`PlacementDraft`) : les changements de la session de placement — durée
 * de récupération par occurrence, emplacements de points ajoutés, et (story 6.1, D-436)
 * retraits programmés de points existants. « Annuler » le jette ; « Confirmer » l'applique au
 * `SessionDraft` en une seule mise à jour (`applyPlacementDraft`). Rien n'est persisté ici :
 * « Continuer » reste la seule persistance (D-388).
 *
 * Module de Domaine pur, sans dépendance React.
 */

import type { SessionDraft, SessionDraftExercise } from "./SessionDraft";
import type { StructuralPosition } from "./Session";
import {
  isStopPointProposable,
  stopPointKey,
  wouldBeConsecutive,
  type StopPoint,
  type StopPointLocation,
} from "./StopPoint";

/** Ordre affiché des zones (D-061) : avant → dans → après le Circuit. */
const ZONE_ORDER: readonly StructuralPosition[] = ["BEFORE_TOUR", "IN_TOUR", "AFTER_TOUR"];

/** Récupération d'un emplacement : à ajouter, déjà présente (valeur conservée), ou non proposée. */
export type PlacementRecoverySlot =
  | { readonly kind: "AVAILABLE" }
  | { readonly kind: "EXISTING"; readonly seconds: number };

/**
 * Point d'arrêt d'un emplacement : son emplacement et s'il existe déjà dans le brouillon.
 * Story 6.1 : `stopPointId` identifie le point existant (quand les points fournis portent leur
 * identifiant) — c'est lui que vise un retrait programmé (`togglePlacementStopPointRemoval`).
 */
export type PlacementStopPointSlot = {
  readonly location: StopPointLocation;
  readonly existing: boolean;
  readonly stopPointId?: string;
};

/**
 * Nature d'un emplacement : sous une occurrence, « après le Circuit », ou (story 6.1, R3)
 * point existant sur un emplacement que le placement ne propose pas — tête de Circuit,
 * emplacement devenu interdit sans occurrence d'ancrage, hors bornes ou non entier —, rendu
 * pour pouvoir être désélectionné (retiré).
 */
export type PlacementSlotKind = "OCCURRENCE" | "AFTER_CIRCUIT" | "UNOFFERED_STOP_POINT";

/**
 * Emplacement proposé en placement : sous une occurrence (`occurrenceId`) ou sans occurrence
 * (`occurrenceId = null` : « après le Circuit », ou point existant non proposé, voir `kind`).
 * `recovery` / `stopPoint` valent `null` quand l'élément n'y est pas proposé ; un emplacement
 * sans aucun des deux n'est jamais produit.
 */
export type PlacementSlot = {
  readonly kind: PlacementSlotKind;
  readonly occurrenceId: string | null;
  readonly recovery: PlacementRecoverySlot | null;
  readonly stopPoint: PlacementStopPointSlot | null;
};

type PlacementOccurrence = Pick<
  SessionDraftExercise,
  "id" | "type" | "structuralPosition" | "postActivityRecoverySeconds"
>;

/** Point existant vu par le placement : emplacement, et identifiant quand il est connu. */
type PlacementExistingStopPoint = StopPointLocation & { readonly id?: string };

/** Occurrences dans l'ordre affiché (zones dans l'ordre D-061, ordre du brouillon dans chaque zone). */
function displayedOccurrences<T extends Pick<SessionDraftExercise, "structuralPosition">>(
  exercises: readonly T[],
): readonly T[] {
  return ZONE_ORDER.flatMap((zone) => exercises.filter((exercise) => exercise.structuralPosition === zone));
}

/**
 * Emplacements du placement, dans l'ordre affiché : un par occurrence qui offre au moins un
 * élément, puis, s'il est autorisé, celui « après le Circuit » juste après la dernière
 * occurrence du Circuit (avant les occurrences `AFTER_TOUR`).
 *
 * Story 6.1 (D-436, RM-251, revue) :
 * - un emplacement qui porte un point existant est toujours rendu `existing` (désélectionnable :
 *   retrait programmé), même s'il est devenu interdit ; un point existant sur un emplacement
 *   que le placement ne propose pas (tête de Circuit, hors bornes, non entier, « après le
 *   Circuit » d'un Circuit vide…) est rendu À LA FIN de la liste, `kind:
 *   "UNOFFERED_STOP_POINT"`, `occurrenceId = null` ;
 * - un emplacement ajouté dans le sous-brouillon reste rendu (désélectionnable), même si un
 *   voisin le rend consécutif ;
 * - un emplacement libre n'est proposé que s'il est proposable (`isStopPointProposable`) et
 *   ne serait consécutif à aucun point de l'état effectif (`effectivePlacementStopPoints` :
 *   existants − retraits + ajouts de `placement`). Sans `placement` (appel historique) : par
 *   rapport aux seuls points existants.
 */
export function placementSlots(
  exercises: readonly PlacementOccurrence[],
  stopPoints: readonly PlacementExistingStopPoint[] = [],
  placement: PlacementDraft = EMPTY_PLACEMENT_DRAFT,
): readonly PlacementSlot[] {
  const ordered = displayedOccurrences(exercises);
  const effective = effectivePlacementStopPoints(stopPoints, placement);
  const rendered = new Set<PlacementExistingStopPoint>();
  const stopPointSlot = (location: StopPointLocation): PlacementStopPointSlot | null => {
    const key = stopPointKey(location);
    const existing = stopPoints.find((point) => stopPointKey(point) === key);
    if (existing !== undefined) {
      rendered.add(existing);
      return existingSlot(location, existing);
    }
    if (!isStopPointProposable(ordered, location)) {
      return null;
    }
    if (isPlacementStopPointAdded(placement, location)) {
      return { location, existing: false };
    }
    return wouldBeConsecutive(ordered, effective, location) ? null : { location, existing: false };
  };

  const slots: PlacementSlot[] = [];
  const rankByScope = new Map<StructuralPosition, number>();
  let afterCircuitPending = ordered.some((occurrence) => occurrence.structuralPosition === "IN_TOUR");
  for (const occurrence of ordered) {
    if (afterCircuitPending && occurrence.structuralPosition === "AFTER_TOUR") {
      pushAfterCircuit();
    }
    const scope = occurrence.structuralPosition;
    const rank = (rankByScope.get(scope) ?? 0) + 1;
    rankByScope.set(scope, rank);
    const recovery = recoverySlotOf(occurrence);
    const stopPoint = stopPointSlot({ scope, position: rank });
    if (recovery !== null || stopPoint !== null) {
      slots.push({ kind: "OCCURRENCE", occurrenceId: occurrence.id, recovery, stopPoint });
    }
  }
  if (afterCircuitPending) {
    pushAfterCircuit();
  }
  const unoffered = stopPoints
    .filter((point) => !rendered.has(point))
    .slice()
    .sort((a, b) => ZONE_ORDER.indexOf(a.scope) - ZONE_ORDER.indexOf(b.scope) || a.position - b.position);
  for (const point of unoffered) {
    slots.push({
      kind: "UNOFFERED_STOP_POINT",
      occurrenceId: null,
      recovery: null,
      stopPoint: existingSlot({ scope: point.scope, position: point.position }, point),
    });
  }
  return slots;

  function pushAfterCircuit() {
    afterCircuitPending = false;
    const stopPoint = stopPointSlot({ scope: "AFTER_TOUR", position: 0 });
    if (stopPoint !== null) {
      slots.push({ kind: "AFTER_CIRCUIT", occurrenceId: null, recovery: null, stopPoint });
    }
  }
}

function existingSlot(location: StopPointLocation, point: PlacementExistingStopPoint): PlacementStopPointSlot {
  return point.id === undefined ? { location, existing: true } : { location, existing: true, stopPointId: point.id };
}

function recoverySlotOf(occurrence: PlacementOccurrence): PlacementRecoverySlot | null {
  if (occurrence.type !== "EXERCISE") {
    return null;
  }
  const seconds = occurrence.postActivityRecoverySeconds;
  return seconds === null || seconds === undefined ? { kind: "AVAILABLE" } : { kind: "EXISTING", seconds };
}

/**
 * Sous-brouillon de placement (AD-43) : ajouts de la session, jamais l'état existant.
 * `recoveries` : durée choisie par identifiant d'occurrence (0 conservé comme présent, D-323) ;
 * `stopPoints` : emplacements ajoutés, sans doublon.
 * `recoveryChanges` (story 4.2) : nouvelle durée d'une récupération DÉJÀ présente, par
 * identifiant d'occurrence — « la modification de leur durée n'est pas un ajout » (ch08) : jamais
 * comptée dans N, appliquée avec le reste par « Confirmer », jetée par « Annuler ».
 * `stopPointRemovals` (story 6.1, D-436) : IDENTIFIANTS des points existants dont le retrait est
 * programmé (désélection) ; une resélection annule le retrait ; jamais comptés dans N.
 */
export type PlacementDraft = {
  readonly recoveries: Readonly<Record<string, number>>;
  readonly stopPoints: readonly StopPointLocation[];
  readonly recoveryChanges: Readonly<Record<string, number>>;
  readonly stopPointRemovals: readonly string[];
};

export const EMPTY_PLACEMENT_DRAFT: PlacementDraft = {
  recoveries: {},
  stopPoints: [],
  recoveryChanges: {},
  stopPointRemovals: [],
};

/**
 * Story 6.1 (D-436) : points effectifs du placement — existants moins ceux dont le retrait est
 * programmé (par identifiant ; un point sans identifiant n'est jamais retiré), plus les ajouts
 * du sous-brouillon (emplacements, sans doublon).
 */
export function effectivePlacementStopPoints(
  stopPoints: readonly PlacementExistingStopPoint[],
  placement: PlacementDraft,
): readonly StopPointLocation[] {
  const kept = stopPoints.filter((point) => point.id === undefined || !placement.stopPointRemovals.includes(point.id));
  const keptKeys = new Set(kept.map(stopPointKey));
  return [...kept, ...placement.stopPoints.filter((point) => !keptKeys.has(stopPointKey(point)))];
}

/** Ajoute ou met à jour la récupération choisie pour une occurrence (✓ de la roulette). */
export function setPlacementRecovery(placement: PlacementDraft, occurrenceId: string, seconds: number): PlacementDraft {
  return { ...placement, recoveries: { ...placement.recoveries, [occurrenceId]: seconds } };
}

/**
 * Story 4.2 : nouvelle durée d'une récupération existante (✓ de la roulette), non comptée dans N.
 * Revenir à la valeur du brouillon (`originalSeconds`) efface la modification.
 */
export function setPlacementRecoveryChange(
  placement: PlacementDraft,
  occurrenceId: string,
  seconds: number,
  originalSeconds: number | null,
): PlacementDraft {
  if (seconds === originalSeconds) {
    if (!(occurrenceId in placement.recoveryChanges)) {
      return placement;
    }
    const recoveryChanges = Object.fromEntries(
      Object.entries(placement.recoveryChanges).filter(([id]) => id !== occurrenceId),
    );
    return { ...placement, recoveryChanges };
  }
  return { ...placement, recoveryChanges: { ...placement.recoveryChanges, [occurrenceId]: seconds } };
}

/**
 * Story 4.2 : le sous-brouillon porte-t-il quelque chose à appliquer (ajout, modification de
 * durée, ou — story 6.1, D-436 — retrait programmé d'un point) ? Lecture brute du
 * sous-brouillon ; `placementConfirmation` avec contexte ne compte que l'applicable.
 */
export function hasPlacementChanges(placement: PlacementDraft): boolean {
  return (
    placementAdditionCount(placement) > 0 ||
    Object.keys(placement.recoveryChanges).length > 0 ||
    placement.stopPointRemovals.length > 0
  );
}

/** Composition sur laquelle se jugent une bascule de point et l'applicabilité (story 6.1) ; un `SessionDraft` convient. */
export type PlacementContext = {
  readonly exercises: readonly PlacementOccurrence[];
  readonly stopPoints?: readonly StopPoint[];
};

/**
 * Story 6.1 (D-436, arbitrage du 22/10/2026) : nature du bouton Confirmer — rien à confirmer,
 * ajouts seuls (« Confirmer N pauses ajoutées », `count` = N), ou tout autre changement
 * (« Confirmer les modifications » : un retrait, une modification de durée, ou un mélange
 * avec des ajouts). Le libellé lui-même relève de la présentation (story 6.3).
 */
export type PlacementConfirmation =
  | { readonly kind: "NONE" }
  | { readonly kind: "ADDITIONS_ONLY"; readonly count: number }
  | { readonly kind: "CHANGES" };

/**
 * Avec `context` (revue 6.1) : seuls les changements réellement APPLICABLES par
 * `applyPlacementDraft` sur ce contexte sont comptés (`applicablePlacement`). Sans contexte :
 * lecture brute du sous-brouillon (forme historique).
 */
export function placementConfirmation(placement: PlacementDraft, context?: PlacementContext): PlacementConfirmation {
  const counts =
    context === undefined
      ? {
          additions: placementAdditionCount(placement),
          changes: Object.keys(placement.recoveryChanges).length + placement.stopPointRemovals.length,
        }
      : (() => {
          const applicable = applicablePlacement(context, placement);
          return {
            additions: applicable.recoveries.size + applicable.stopPointAdditions.length,
            changes: applicable.recoveryChanges.size + applicable.removedIds.size,
          };
        })();
  if (counts.changes > 0) {
    return { kind: "CHANGES" };
  }
  return counts.additions > 0 ? { kind: "ADDITIONS_ONLY", count: counts.additions } : { kind: "NONE" };
}

/** Retire la récupération ajoutée d'une occurrence (désélection). Sans ajout : inchangé. */
export function removePlacementRecovery(placement: PlacementDraft, occurrenceId: string): PlacementDraft {
  if (!(occurrenceId in placement.recoveries)) {
    return placement;
  }
  const recoveries = Object.fromEntries(
    Object.entries(placement.recoveries).filter(([id]) => id !== occurrenceId),
  );
  return { ...placement, recoveries };
}

/**
 * Story 6.1 (D-436, R3) : bascule le retrait programmé du point existant `stopPointId`. Avec
 * `context`, annuler un retrait est refusé (sous-brouillon rendu tel quel) si le point
 * redevenait consécutif à un point de l'état effectif — même ensemble que `placementSlots`.
 */
export function togglePlacementStopPointRemoval(
  placement: PlacementDraft,
  stopPointId: string,
  context?: PlacementContext,
): PlacementDraft {
  if (!placement.stopPointRemovals.includes(stopPointId)) {
    return { ...placement, stopPointRemovals: [...placement.stopPointRemovals, stopPointId] };
  }
  const point = context?.stopPoints?.find((candidate) => candidate.id === stopPointId);
  if (context !== undefined && point !== undefined) {
    const effective = effectivePlacementStopPoints(context.stopPoints ?? [], placement);
    if (wouldBeConsecutive(displayedOccurrences(context.exercises), effective, point)) {
      return placement;
    }
  }
  return { ...placement, stopPointRemovals: placement.stopPointRemovals.filter((id) => id !== stopPointId) };
}

/**
 * Bascule un point d'arrêt sur un emplacement.
 *
 * Avec `context` (story 6.1, D-436, RM-251 ; forme que la story 6.3 utilisera) — jugé contre
 * le même ensemble que `placementSlots(context.exercises, context.stopPoints, placement)` :
 * - emplacement d'un point EXISTANT : bascule son retrait (`togglePlacementStopPointRemoval`) ;
 * - emplacement ajouté : retire l'ajout ;
 * - emplacement libre : l'ajoute seulement si `placementSlots` le propose ; sinon sous-brouillon
 *   rendu tel quel.
 *
 * Sans `context` : forme HISTORIQUE de la story 4.1, conservée pour l'appel actuel de l'écran —
 * bascule l'ajout sans contrôle ; `applyPlacementDraft` écarte ensuite l'inapplicable.
 */
export function togglePlacementStopPoint(
  placement: PlacementDraft,
  location: StopPointLocation,
  context?: PlacementContext,
): PlacementDraft {
  const key = stopPointKey(location);
  if (context !== undefined) {
    const existing = (context.stopPoints ?? []).find((point) => stopPointKey(point) === key);
    if (existing !== undefined) {
      return togglePlacementStopPointRemoval(placement, existing.id, context);
    }
  }
  if (isPlacementStopPointAdded(placement, location)) {
    return { ...placement, stopPoints: placement.stopPoints.filter((point) => stopPointKey(point) !== key) };
  }
  if (context !== undefined) {
    const offered = placementSlots(context.exercises, context.stopPoints ?? [], placement).some(
      (slot) => slot.stopPoint !== null && !slot.stopPoint.existing && stopPointKey(slot.stopPoint.location) === key,
    );
    if (!offered) {
      return placement;
    }
  }
  return { ...placement, stopPoints: [...placement.stopPoints, { scope: location.scope, position: location.position }] };
}

/** Story 6.1 (D-436) : le retrait du point existant `stopPointId` est-il programmé ? */
export function isPlacementStopPointRemoved(placement: PlacementDraft, stopPointId: string): boolean {
  return placement.stopPointRemovals.includes(stopPointId);
}

/** Le point de cet emplacement est-il ajouté dans le sous-brouillon ? */
export function isPlacementStopPointAdded(placement: PlacementDraft, location: StopPointLocation): boolean {
  const key = stopPointKey(location);
  return placement.stopPoints.some((point) => stopPointKey(point) === key);
}

/** N de « Confirmer N pauses ajoutées » : récupérations et points nouvellement ajoutés (lecture brute). */
export function placementAdditionCount(placement: PlacementDraft): number {
  return Object.keys(placement.recoveries).length + placement.stopPoints.length;
}

/** Changements du sous-brouillon réellement applicables à un contexte (story 6.1, revue). */
type ApplicablePlacement = {
  readonly recoveries: ReadonlyMap<string, number>;
  readonly recoveryChanges: ReadonlyMap<string, number>;
  readonly removedIds: ReadonlySet<string>;
  readonly keptStopPoints: readonly StopPoint[];
  readonly stopPointAdditions: readonly StopPointLocation[];
};

/**
 * Seul juge de l'applicabilité, partagé par `applyPlacementDraft` et `placementConfirmation` :
 * - retraits : points existants dont l'identifiant est programmé ;
 * - récupérations ajoutées : occurrences encore proposées `AVAILABLE` ;
 * - modifications : récupération `EXERCISE` encore présente et de valeur différente ;
 * - points ajoutés, dans l'ordre du sous-brouillon : emplacement encore proposé sur les points
 *   conservés, et non consécutif aux points déjà retenus (RM-251).
 */
function applicablePlacement(context: PlacementContext, placement: PlacementDraft): ApplicablePlacement {
  const initial = context.stopPoints ?? [];
  const removedIds = new Set(
    initial.filter((point) => placement.stopPointRemovals.includes(point.id)).map((point) => point.id),
  );
  const keptStopPoints = removedIds.size > 0 ? initial.filter((point) => !removedIds.has(point.id)) : initial;
  const slots = placementSlots(context.exercises, keptStopPoints);
  const availableRecoveryIds = new Set(
    slots.filter((slot) => slot.recovery?.kind === "AVAILABLE").map((slot) => slot.occurrenceId),
  );
  const availableStopKeys = new Set(
    slots.flatMap((slot) =>
      slot.stopPoint !== null && !slot.stopPoint.existing ? [stopPointKey(slot.stopPoint.location)] : [],
    ),
  );

  const recoveries = new Map<string, number>();
  const recoveryChanges = new Map<string, number>();
  for (const exercise of context.exercises) {
    const added = placement.recoveries[exercise.id];
    if (added !== undefined && availableRecoveryIds.has(exercise.id)) {
      recoveries.set(exercise.id, added);
      continue;
    }
    const changed = placement.recoveryChanges[exercise.id];
    const current = exercise.postActivityRecoverySeconds;
    if (changed !== undefined && exercise.type === "EXERCISE" && current !== null && current !== undefined && current !== changed) {
      recoveryChanges.set(exercise.id, changed);
    }
  }

  const ordered = displayedOccurrences(context.exercises);
  const stopPointAdditions: StopPointLocation[] = [];
  for (const location of placement.stopPoints) {
    const key = stopPointKey(location);
    if (availableStopKeys.has(key) && !wouldBeConsecutive(ordered, [...keptStopPoints, ...stopPointAdditions], location)) {
      availableStopKeys.delete(key);
      stopPointAdditions.push({ scope: location.scope, position: location.position });
    }
  }
  return { recoveries, recoveryChanges, removedIds, keptStopPoints, stopPointAdditions };
}

/**
 * « Confirmer » (AD-43) : applique le sous-brouillon au brouillon de séance, en une seule
 * mise à jour fonctionnelle de `exercises` (récupérations) et de `stopPoints`. Seuls les
 * changements APPLICABLES sont appliqués (`applicablePlacement` : une occurrence disparue, une
 * récupération ou un point déjà présents, un emplacement qui n'est plus proposé ou qui serait
 * consécutif sont ignorés). Une modification (`recoveryChanges`, story 4.2) ne s'applique qu'à
 * une récupération encore présente et n'en crée jamais. Story 6.1 (D-436) : les retraits
 * programmés retirent d'abord les points visés ; jamais deux points consécutifs créés. Sans
 * changement applicable, le brouillon est rendu tel quel (même identité). `newStopPointId`
 * fournit l'identifiant de chaque point créé (le Domaine n'en génère pas).
 */
export function applyPlacementDraft(
  draft: SessionDraft,
  placement: PlacementDraft,
  newStopPointId: () => string,
): SessionDraft {
  const applicable = applicablePlacement(draft, placement);
  const recoveriesChanged = applicable.recoveries.size > 0 || applicable.recoveryChanges.size > 0;
  const pointsChanged = applicable.removedIds.size > 0 || applicable.stopPointAdditions.length > 0;
  if (!recoveriesChanged && !pointsChanged) {
    return draft;
  }
  const exercises = draft.exercises.map((exercise) => {
    const seconds = applicable.recoveries.get(exercise.id) ?? applicable.recoveryChanges.get(exercise.id);
    return seconds === undefined ? exercise : { ...exercise, postActivityRecoverySeconds: seconds };
  });
  const added: StopPoint[] = applicable.stopPointAdditions.map((location) => ({
    id: newStopPointId(),
    scope: location.scope,
    position: location.position,
  }));
  return {
    ...draft,
    ...(recoveriesChanged ? { exercises } : {}),
    ...(pointsChanged ? { stopPoints: [...applicable.keptStopPoints, ...added] } : {}),
  };
}

/**
 * Story 4.2 (hors placement) : durée de la récupération d'une occurrence — nouvelle valeur (✓
 * de la roulette, 0 conservé comme présent, D-323) ou retrait (`null` : récupération absente, la
 * Pause terminale configurée est rétablie dans les durées, RM-038). Occurrence inconnue ou non
 * `EXERCISE`, durée invalide (non entière, négative, NaN) ou
 * valeur inchangée : brouillon rendu tel quel (même identité). Seule l'occurrence du brouillon
 * change, jamais la définition de l'Exercice.
 */
export function setOccurrenceRecovery(
  draft: SessionDraft,
  occurrenceId: string,
  seconds: number | null,
): SessionDraft {
  if (seconds !== null && (!Number.isInteger(seconds) || seconds < 0)) {
    return draft;
  }
  const target = draft.exercises.find((exercise) => exercise.id === occurrenceId);
  if (
    target === undefined ||
    target.type !== "EXERCISE" ||
    (target.postActivityRecoverySeconds ?? null) === seconds
  ) {
    return draft;
  }
  return {
    ...draft,
    exercises: draft.exercises.map((exercise) =>
      exercise.id === occurrenceId ? { ...exercise, postActivityRecoverySeconds: seconds } : exercise,
    ),
  };
}
