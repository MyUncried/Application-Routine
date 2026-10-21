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
 *
 * **Sous-brouillon** (`PlacementDraft`) : seuls les ajouts de la session de placement — durée
 * de récupération par occurrence et emplacements de points. « Annuler » le jette ;
 * « Confirmer » l'applique au `SessionDraft` en une seule mise à jour (`applyPlacementDraft`).
 * Rien n'est persisté ici : « Continuer » reste la seule persistance (D-388).
 *
 * Module de Domaine pur, sans dépendance React.
 */

import type { SessionDraft, SessionDraftExercise } from "./SessionDraft";
import type { StructuralPosition } from "./Session";
import { isStopPointAllowed, stopPointKey, type StopPoint, type StopPointLocation } from "./StopPoint";

/** Ordre affiché des zones (D-061) : avant → dans → après le Circuit. */
const ZONE_ORDER: readonly StructuralPosition[] = ["BEFORE_TOUR", "IN_TOUR", "AFTER_TOUR"];

/** Récupération d'un emplacement : à ajouter, déjà présente (valeur conservée), ou non proposée. */
export type PlacementRecoverySlot =
  | { readonly kind: "AVAILABLE" }
  | { readonly kind: "EXISTING"; readonly seconds: number };

/** Point d'arrêt d'un emplacement : son emplacement et s'il existe déjà dans le brouillon. */
export type PlacementStopPointSlot = {
  readonly location: StopPointLocation;
  readonly existing: boolean;
};

/**
 * Emplacement proposé en placement : sous une occurrence (`occurrenceId`) ou après le Circuit
 * (`occurrenceId = null`). `recovery` / `stopPoint` valent `null` quand l'élément n'y est pas
 * proposé ; un emplacement sans aucun des deux n'est jamais produit.
 */
export type PlacementSlot = {
  readonly occurrenceId: string | null;
  readonly recovery: PlacementRecoverySlot | null;
  readonly stopPoint: PlacementStopPointSlot | null;
};

type PlacementOccurrence = Pick<
  SessionDraftExercise,
  "id" | "type" | "structuralPosition" | "postActivityRecoverySeconds"
>;

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
 */
export function placementSlots(
  exercises: readonly PlacementOccurrence[],
  stopPoints: readonly StopPointLocation[] = [],
): readonly PlacementSlot[] {
  const ordered = displayedOccurrences(exercises);
  const existingKeys = new Set(stopPoints.map(stopPointKey));
  const stopPointSlot = (location: StopPointLocation): PlacementStopPointSlot | null =>
    isStopPointAllowed(ordered, location) ? { location, existing: existingKeys.has(stopPointKey(location)) } : null;

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
      slots.push({ occurrenceId: occurrence.id, recovery, stopPoint });
    }
  }
  if (afterCircuitPending) {
    pushAfterCircuit();
  }
  return slots;

  function pushAfterCircuit() {
    afterCircuitPending = false;
    const stopPoint = stopPointSlot({ scope: "AFTER_TOUR", position: 0 });
    if (stopPoint !== null) {
      slots.push({ occurrenceId: null, recovery: null, stopPoint });
    }
  }
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
 */
export type PlacementDraft = {
  readonly recoveries: Readonly<Record<string, number>>;
  readonly stopPoints: readonly StopPointLocation[];
};

export const EMPTY_PLACEMENT_DRAFT: PlacementDraft = { recoveries: {}, stopPoints: [] };

/** Ajoute ou met à jour la récupération choisie pour une occurrence (✓ de la roulette). */
export function setPlacementRecovery(placement: PlacementDraft, occurrenceId: string, seconds: number): PlacementDraft {
  return { ...placement, recoveries: { ...placement.recoveries, [occurrenceId]: seconds } };
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

/** Bascule l'ajout d'un point d'arrêt sur un emplacement. */
export function togglePlacementStopPoint(placement: PlacementDraft, location: StopPointLocation): PlacementDraft {
  const key = stopPointKey(location);
  const stopPoints = placement.stopPoints.some((point) => stopPointKey(point) === key)
    ? placement.stopPoints.filter((point) => stopPointKey(point) !== key)
    : [...placement.stopPoints, { scope: location.scope, position: location.position }];
  return { ...placement, stopPoints };
}

/** Le point de cet emplacement est-il ajouté dans le sous-brouillon ? */
export function isPlacementStopPointAdded(placement: PlacementDraft, location: StopPointLocation): boolean {
  const key = stopPointKey(location);
  return placement.stopPoints.some((point) => stopPointKey(point) === key);
}

/** N de « Confirmer N pauses ajoutées » : récupérations et points nouvellement ajoutés. */
export function placementAdditionCount(placement: PlacementDraft): number {
  return Object.keys(placement.recoveries).length + placement.stopPoints.length;
}

/**
 * « Confirmer » (AD-43) : applique le sous-brouillon au brouillon de séance, en une seule
 * mise à jour fonctionnelle de `exercises` (récupérations) et de `stopPoints`. Seuls les
 * ajouts encore proposés par `placementSlots` sur le brouillon REÇU sont appliqués (une
 * occurrence disparue, une récupération ou un point déjà présents sont ignorés). Sans ajout
 * applicable, le brouillon est rendu tel quel (même identité). `newStopPointId` fournit
 * l'identifiant de chaque point créé (le Domaine n'en génère pas).
 */
export function applyPlacementDraft(
  draft: SessionDraft,
  placement: PlacementDraft,
  newStopPointId: () => string,
): SessionDraft {
  const currentStopPoints = draft.stopPoints ?? [];
  const slots = placementSlots(draft.exercises, currentStopPoints);
  const availableRecoveryIds = new Set(
    slots.filter((slot) => slot.recovery?.kind === "AVAILABLE").map((slot) => slot.occurrenceId),
  );
  const availableStopKeys = new Set(
    slots.flatMap((slot) =>
      slot.stopPoint !== null && !slot.stopPoint.existing ? [stopPointKey(slot.stopPoint.location)] : [],
    ),
  );

  let recoveriesChanged = false;
  const exercises = draft.exercises.map((exercise) => {
    const seconds = placement.recoveries[exercise.id];
    if (seconds === undefined || !availableRecoveryIds.has(exercise.id)) {
      return exercise;
    }
    recoveriesChanged = true;
    return { ...exercise, postActivityRecoverySeconds: seconds };
  });

  const added: StopPoint[] = [];
  for (const location of placement.stopPoints) {
    const key = stopPointKey(location);
    if (availableStopKeys.has(key)) {
      availableStopKeys.delete(key);
      added.push({ id: newStopPointId(), scope: location.scope, position: location.position });
    }
  }

  if (!recoveriesChanged && added.length === 0) {
    return draft;
  }
  return {
    ...draft,
    ...(recoveriesChanged ? { exercises } : {}),
    ...(added.length > 0 ? { stopPoints: [...currentStopPoints, ...added] } : {}),
  };
}
