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
 *   Story 6.1 (D-441, RM-251) : un emplacement LIBRE n'est proposé que s'il ne rend aucun point
 *   consécutif, compte tenu de l'état effectif (points existants − retraits programmés + ajouts
 *   du sous-brouillon, `effectivePlacementStopPoints`).
 *
 * **Sous-brouillon** (`PlacementDraft`) : les changements de la session de placement — durée
 * de récupération par occurrence, emplacements de points ajoutés, et (story 6.1, D-441)
 * retraits programmés de points existants. « Annuler » le jette ; « Confirmer » l'applique au
 * `SessionDraft` en une seule mise à jour (`applyPlacementDraft`). Rien n'est persisté ici :
 * « Continuer » reste la seule persistance (D-388).
 *
 * **Story 7.1 (D-442)** : la Récupération ne se règle plus qu'en placement — une récupération
 * présente (0 comprise) apparaît sélectionnée ; la désélectionner programme son retrait
 * (`recoveryRemovals`), la resélectionner à une durée annule ce retrait et en programme la
 * modification. La tête de Circuit est un emplacement proposé (`CIRCUIT_HEAD`) ; N du Circuit
 * (`PlacementContext.tourRepeatCount`) lève RM-219 en début et fin de Tour à N ≥ 2, et un ajout qui
 * ferait coexister les deux rend un choix requis (`togglePlacementStopPointOutcome`).
 *
 * **PRE-9 (ordre de Hermann du 01/11/2026, point 2 ; ch07 « Récupération de l'Exercice et défauts
 * du Profil », qui clôt REC-PARAM-01 et remplace D-442 sur ce périmètre)** : le placement ne porte
 * plus que les Points d'arrêt. La Récupération appartient à l'Exercice et se règle uniquement dans
 * Paramètres d'exécution : aucune zone, aucun ajout, réglage ni retrait de récupération ici
 * [les mentions de récupération ci-dessus — emplacements, sous-brouillon, story 7.1 — sont
 * remplacées le 01/11/2026 ; texte conservé pour l'historique].
 *
 * Module de Domaine pur, sans dépendance React.
 */

import type { SessionDraft, SessionDraftExercise } from "./SessionDraft";
import type { StructuralPosition } from "./Session";
import {
  isStopPointProposable,
  stopPointKey,
  tourBoundaryConflict,
  tourBoundaryPoints,
  wouldBeConsecutive,
  type StopPoint,
  type StopPointLocation,
  type StopPointRules,
  type TourBoundaryChoice,
} from "./StopPoint";

/** Ordre affiché des zones (D-061) : avant → dans → après le Circuit. */
const ZONE_ORDER: readonly StructuralPosition[] = ["BEFORE_TOUR", "IN_TOUR", "AFTER_TOUR"];

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
 * Nature d'un emplacement : sous une occurrence, « après le Circuit », (story 7.1, D-442) en tête
 * de Circuit — début de Tour `(IN_TOUR, 0)`, avant la première occurrence du Circuit —, ou (story
 * 6.1, R3) point existant sur un emplacement que le placement ne propose pas — emplacement devenu
 * interdit sans occurrence d'ancrage, hors bornes ou non entier —, rendu pour pouvoir être
 * désélectionné (retiré).
 */
export type PlacementSlotKind = "OCCURRENCE" | "CIRCUIT_HEAD" | "AFTER_CIRCUIT" | "UNOFFERED_STOP_POINT";

/**
 * Emplacement proposé en placement : sous une occurrence (`occurrenceId`) ou sans occurrence
 * (`occurrenceId = null` : « après le Circuit », ou point existant non proposé, voir `kind`).
 * `stopPoint` vaut `null` quand l'élément n'y est pas proposé [PRE-9, 01/11/2026 : la zone
 * `recovery` est retirée — aucune récupération en placement] ; un emplacement sans point n'est
 * jamais produit.
 */
export type PlacementSlot = {
  readonly kind: PlacementSlotKind;
  readonly occurrenceId: string | null;
  readonly stopPoint: PlacementStopPointSlot | null;
};

type PlacementOccurrence = Pick<SessionDraftExercise, "id" | "type" | "structuralPosition">;

/** Point existant vu par le placement : emplacement, et identifiant quand il est connu. */
export type PlacementExistingStopPoint = StopPointLocation & { readonly id?: string };

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
 * Story 6.1 (D-441, RM-251, revue) :
 * - un emplacement qui porte un point existant est toujours rendu `existing` (désélectionnable :
 *   retrait programmé), même s'il est devenu interdit ; un point existant sur un emplacement
 *   que le placement ne propose pas (hors bornes, non entier, « après le
 *   Circuit » d'un Circuit vide…) est rendu À LA FIN de la liste, `kind:
 *   "UNOFFERED_STOP_POINT"`, `occurrenceId = null` ;
 * - un emplacement ajouté dans le sous-brouillon reste rendu (désélectionnable), même si un
 *   voisin le rend consécutif ;
 * - un emplacement libre n'est proposé que s'il est proposable (`isStopPointProposable`) et
 *   ne serait consécutif à aucun point de l'état effectif (`effectivePlacementStopPoints` :
 *   existants − retraits + ajouts de `placement`). Sans `placement` (hors placement, applicabilité) : par
 *   rapport aux seuls points existants.
 *
 * Story 7.1 (D-442) :
 * - la tête de Circuit `(IN_TOUR, 0)` est un emplacement `CIRCUIT_HEAD` (`occurrenceId = null`),
 *   rendu juste avant la première occurrence du Circuit, aux mêmes conditions que les autres ;
 *   un point existant qui l'occupe y est rendu (il n'est plus `UNOFFERED_STOP_POINT`) ;
 * - `rules` (N du Circuit, `StopPointRules`) : à N ≥ 2, début et fin de Tour échappent à RM-219.
 *   Le conflit de Tour (début et fin à N ≥ 2) n'empêche PAS la proposition : le choisir rend un
 *   choix requis (`togglePlacementStopPointOutcome`) ;
 * - [récupérations rendues `EXISTING` / `AVAILABLE`, désélection et resélection — retirées le
 *   01/11/2026 (ordre de Hermann, point 2) : aucune récupération en placement.]
 */
export function placementSlots(
  exercises: readonly PlacementOccurrence[],
  stopPoints: readonly PlacementExistingStopPoint[] = [],
  placement: PlacementDraft = EMPTY_PLACEMENT_DRAFT,
  rules: StopPointRules = {},
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
    if (!isStopPointProposable(ordered, location, rules)) {
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
  let circuitHeadPending = afterCircuitPending;
  for (const occurrence of ordered) {
    if (afterCircuitPending && occurrence.structuralPosition === "AFTER_TOUR") {
      pushAfterCircuit();
    }
    if (circuitHeadPending && occurrence.structuralPosition === "IN_TOUR") {
      circuitHeadPending = false;
      const head = stopPointSlot({ scope: "IN_TOUR", position: 0 });
      if (head !== null) {
        slots.push({ kind: "CIRCUIT_HEAD", occurrenceId: null, stopPoint: head });
      }
    }
    const scope = occurrence.structuralPosition;
    const rank = (rankByScope.get(scope) ?? 0) + 1;
    rankByScope.set(scope, rank);
    const stopPoint = stopPointSlot({ scope, position: rank });
    if (stopPoint !== null) {
      slots.push({ kind: "OCCURRENCE", occurrenceId: occurrence.id, stopPoint });
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
      stopPoint: existingSlot({ scope: point.scope, position: point.position }, point),
    });
  }
  return slots;

  function pushAfterCircuit() {
    afterCircuitPending = false;
    const stopPoint = stopPointSlot({ scope: "AFTER_TOUR", position: 0 });
    if (stopPoint !== null) {
      slots.push({ kind: "AFTER_CIRCUIT", occurrenceId: null, stopPoint });
    }
  }
}

function existingSlot(location: StopPointLocation, point: PlacementExistingStopPoint): PlacementStopPointSlot {
  return point.id === undefined ? { location, existing: true } : { location, existing: true, stopPointId: point.id };
}

/**
 * Sous-brouillon de placement (AD-43) : ajouts de la session, jamais l'état existant.
 * `stopPoints` : emplacements ajoutés, sans doublon.
 * `stopPointRemovals` (story 6.1, D-441) : IDENTIFIANTS des points existants dont le retrait est
 * programmé (désélection) ; une resélection annule le retrait ; jamais comptés dans N.
 * [PRE-9, 01/11/2026 (ordre de Hermann, point 2) : `recoveries`, `recoveryChanges` (story 4.2) et
 * `recoveryRemovals` (story 7.1) sont retirés — la récupération de l'Exercice ne se règle plus en
 * placement.]
 */
export type PlacementDraft = {
  readonly stopPoints: readonly StopPointLocation[];
  readonly stopPointRemovals: readonly string[];
};

export const EMPTY_PLACEMENT_DRAFT: PlacementDraft = {
  stopPoints: [],
  stopPointRemovals: [],
};

/**
 * Story 6.1 (D-441) : points effectifs du placement — existants moins ceux dont le retrait est
 * programmé (par identifiant ; un point sans identifiant n'est jamais retiré), plus les ajouts
 * du sous-brouillon (emplacements, sans doublon). Story 7.1 : les points existants gardent leur
 * identifiant (un ajout n'en a pas).
 */
export function effectivePlacementStopPoints(
  stopPoints: readonly PlacementExistingStopPoint[],
  placement: PlacementDraft,
): readonly PlacementExistingStopPoint[] {
  const kept = stopPoints.filter((point) => point.id === undefined || !placement.stopPointRemovals.includes(point.id));
  const keptKeys = new Set(kept.map(stopPointKey));
  return [...kept, ...placement.stopPoints.filter((point) => !keptKeys.has(stopPointKey(point)))];
}

/**
 * Composition sur laquelle se jugent une bascule de point et l'applicabilité (story 6.1) ; un
 * `SessionDraft` convient. Story 7.1 (D-442) : `tourRepeatCount` (N du Circuit, absent : 1) —
 * contexte des règles d'emplacement (`StopPointRules`).
 */
export type PlacementContext = StopPointRules & {
  readonly exercises: readonly PlacementOccurrence[];
  readonly stopPoints?: readonly StopPoint[];
};

/**
 * Story 6.1 (D-441, arbitrage du 22/10/2026) : nature du bouton Confirmer — rien à confirmer,
 * ajouts seuls (« Confirmer N pauses ajoutées », `count` = N), ou tout autre changement
 * (« Confirmer les modifications » : un retrait, une modification de durée, ou un mélange
 * avec des ajouts). Le libellé lui-même relève de la présentation (story 6.3).
 */
export type PlacementConfirmation =
  | { readonly kind: "NONE" }
  | { readonly kind: "ADDITIONS_ONLY"; readonly count: number }
  | { readonly kind: "CHANGES" };

/**
 * Seuls les changements réellement APPLICABLES par `applyPlacementDraft` sur `context` sont
 * comptés (`applicablePlacement`, revue 6.1). Story 6.3 (revue) : `context` obligatoire — la
 * lecture brute du sous-brouillon (forme historique) est retirée.
 */
export function placementConfirmation(placement: PlacementDraft, context: PlacementContext): PlacementConfirmation {
  const applicable = applicablePlacement(context, placement);
  // PRE-9 (01/11/2026, ordre de Hermann, point 2) : Points d'arrêt seuls — aucune récupération comptée.
  if (applicable.removedIds.size > 0) {
    return { kind: "CHANGES" };
  }
  const additions = applicable.stopPointAdditions.length;
  return additions > 0 ? { kind: "ADDITIONS_ONLY", count: additions } : { kind: "NONE" };
}

/**
 * Story 6.1 (D-441, R3) : bascule le retrait programmé du point existant `stopPointId`. Annuler
 * un retrait (resélection) est refusé — sous-brouillon rendu tel quel — si le point redevenait
 * consécutif à un point AJOUTÉ par le sous-brouillon. Story 6.3 (revue) : seul un ajout bloque ;
 * deux points existants déjà consécutifs avant le placement (données héritées) n'empêchent pas
 * d'en resélectionner un, le placement ne créant ni n'aggravant rien. `context` obligatoire.
 * Story 7.1 (D-442) : de même, la resélection est refusée si elle créait un conflit de Tour avec
 * un point AJOUTÉ (à N ≥ 2, début et fin de Tour) ; un conflit entre deux points existants
 * (hérité) ne bloque pas.
 */
export function togglePlacementStopPointRemoval(
  placement: PlacementDraft,
  stopPointId: string,
  context: PlacementContext,
): PlacementDraft {
  if (!placement.stopPointRemovals.includes(stopPointId)) {
    return { ...placement, stopPointRemovals: [...placement.stopPointRemovals, stopPointId] };
  }
  const existing = context.stopPoints ?? [];
  const point = existing.find((candidate) => candidate.id === stopPointId);
  const reselected = { ...placement, stopPointRemovals: placement.stopPointRemovals.filter((id) => id !== stopPointId) };
  if (point !== undefined) {
    const ordered = displayedOccurrences(context.exercises);
    const existingKeys = new Set(existing.map(stopPointKey));
    const additions = placement.stopPoints.filter((location) => !existingKeys.has(stopPointKey(location)));
    if (wouldBeConsecutive(ordered, additions, point)) {
      return placement;
    }
    const conflict = tourBoundaryConflict(ordered, effectivePlacementStopPoints(existing, reselected), context);
    const involvesPoint = conflict !== null && (conflict.head.id === stopPointId || conflict.tail.id === stopPointId);
    if (involvesPoint && (conflict.head.id === undefined || conflict.tail.id === undefined)) {
      return placement;
    }
  }
  return reselected;
}

/**
 * Story 7.1 (D-442) : conflit de Tour du placement — emplacements de début et de fin de Tour, et
 * identifiant de chacun quand c'est un point EXISTANT (absent : point ajouté par le sous-brouillon).
 */
export type PlacementTourConflict = {
  readonly head: StopPointLocation;
  readonly tail: StopPointLocation;
  readonly headStopPointId?: string;
  readonly tailStopPointId?: string;
};

/**
 * Story 7.1 (D-442) : issue d'une bascule de point en placement — appliquée (nouveau
 * sous-brouillon, ou l'entrée elle-même si rien ne change), ou choix requis : l'ajout créerait un
 * conflit de Tour (N ≥ 2). `resolutions.HEAD` conserve le début de Tour (« Début de tour »),
 * `resolutions.TAIL` la fin (« Fin de tour ») : l'autre point est retiré — ajout : l'ajout est
 * jeté ; existant : son retrait est programmé. « Annuler » : garder l'entrée.
 */
export type PlacementStopPointOutcome =
  | { readonly status: "APPLIED"; readonly placement: PlacementDraft }
  | {
      readonly status: "CHOICE_REQUIRED";
      readonly conflict: PlacementTourConflict;
      readonly resolutions: Readonly<Record<TourBoundaryChoice, PlacementDraft>>;
    };

/**
 * Revue 7.1 : sous-brouillon sans AUCUN point de la limite de Tour `boundary` de l'état effectif
 * (deux fins héritées, p. ex. : n'en retirer qu'une laisserait le conflit).
 */
function withoutEffectiveBoundary(
  placement: PlacementDraft,
  context: PlacementContext,
  boundary: TourBoundaryChoice,
): PlacementDraft {
  const ordered = displayedOccurrences(context.exercises);
  return tourBoundaryPoints(ordered, effectivePlacementStopPoints(context.stopPoints ?? [], placement), boundary).reduce(
    withoutEffectivePoint,
    placement,
  );
}

/** Sous-brouillon sans le point `point` de l'état effectif : retrait programmé (existant) ou ajout jeté. */
function withoutEffectivePoint(placement: PlacementDraft, point: PlacementExistingStopPoint): PlacementDraft {
  if (point.id !== undefined) {
    return placement.stopPointRemovals.includes(point.id)
      ? placement
      : { ...placement, stopPointRemovals: [...placement.stopPointRemovals, point.id] };
  }
  const key = stopPointKey(point);
  return { ...placement, stopPoints: placement.stopPoints.filter((location) => stopPointKey(location) !== key) };
}

/**
 * Bascule un point d'arrêt sur un emplacement (story 6.1, D-441, RM-251), jugé contre le même
 * ensemble que `placementSlots(context.exercises, context.stopPoints, placement, context)` :
 * - emplacement d'un point EXISTANT : bascule son retrait (`togglePlacementStopPointRemoval`) ;
 * - emplacement ajouté : retire l'ajout ;
 * - emplacement libre : l'ajoute seulement si `placementSlots` le propose ; sinon sous-brouillon
 *   rendu tel quel.
 * Story 7.1 (D-442) : un ajout qui CRÉE un conflit de Tour (absent de l'état effectif avant)
 * rend `CHOICE_REQUIRED`, sans rien ajouter.
 *
 * Story 6.3 (revue) : `context` obligatoire. Deux points existants sur la même clé (données
 * héritées) : seul le premier est visé par l'emplacement ; l'écran bascule un point existant par
 * son identifiant (`togglePlacementStopPointRemoval`).
 */
export function togglePlacementStopPointOutcome(
  placement: PlacementDraft,
  location: StopPointLocation,
  context: PlacementContext,
): PlacementStopPointOutcome {
  const key = stopPointKey(location);
  const existingPoints = context.stopPoints ?? [];
  const existing = existingPoints.find((point) => stopPointKey(point) === key);
  if (existing !== undefined) {
    const toggled = togglePlacementStopPointRemoval(placement, existing.id, context);
    if (toggled !== placement || !isPlacementStopPointRemoved(placement, existing.id)) {
      return { status: "APPLIED", placement: toggled };
    }
    // Revue 7.1 (D-441, D-442) : resélection refusée par `togglePlacementStopPointRemoval`. Si la
    // seule cause est un conflit de Tour avec un AJOUT, l'utilisateur choisit : conserver le point
    // resélectionné (l'ajout est jeté) ou l'ajout (le point reste retiré, l'entrée elle-même).
    const reselected = { ...placement, stopPointRemovals: placement.stopPointRemovals.filter((id) => id !== existing.id) };
    const ordered = displayedOccurrences(context.exercises);
    const conflict = tourBoundaryConflict(ordered, effectivePlacementStopPoints(existingPoints, reselected), context);
    const added = conflict === null ? undefined : [conflict.head, conflict.tail].find((point) => point.id === undefined);
    const involves = conflict !== null && (conflict.head.id === existing.id || conflict.tail.id === existing.id);
    if (conflict === null || added === undefined || !involves) {
      return { status: "APPLIED", placement };
    }
    const keepsHead = conflict.head.id === existing.id;
    const withoutAddition = withoutEffectiveBoundary(reselected, context, keepsHead ? "TAIL" : "HEAD");
    if (wouldBeConsecutive(ordered, effectivePlacementStopPoints(existingPoints, withoutAddition).filter((point) => point.id !== existing.id), existing)) {
      return { status: "APPLIED", placement };
    }
    return {
      status: "CHOICE_REQUIRED",
      conflict: placementConflictOf(conflict),
      resolutions: keepsHead
        ? { HEAD: withoutAddition, TAIL: placement }
        : { HEAD: placement, TAIL: withoutAddition },
    };
  }
  if (isPlacementStopPointAdded(placement, location)) {
    return {
      status: "APPLIED",
      placement: { ...placement, stopPoints: placement.stopPoints.filter((point) => stopPointKey(point) !== key) },
    };
  }
  const offered = placementSlots(context.exercises, existingPoints, placement, context).some(
    (slot) => slot.stopPoint !== null && !slot.stopPoint.existing && stopPointKey(slot.stopPoint.location) === key,
  );
  if (!offered) {
    return { status: "APPLIED", placement };
  }
  const next = { ...placement, stopPoints: [...placement.stopPoints, { scope: location.scope, position: location.position }] };
  const ordered = displayedOccurrences(context.exercises);
  const conflict = tourBoundaryConflict(ordered, effectivePlacementStopPoints(existingPoints, next), context);
  if (conflict === null || tourBoundaryConflict(ordered, effectivePlacementStopPoints(existingPoints, placement), context) !== null) {
    return { status: "APPLIED", placement: next };
  }
  return {
    status: "CHOICE_REQUIRED",
    conflict: placementConflictOf(conflict),
    resolutions: { HEAD: withoutEffectiveBoundary(next, context, "TAIL"), TAIL: withoutEffectiveBoundary(next, context, "HEAD") },
  };
}

function placementConflictOf(conflict: {
  readonly head: PlacementExistingStopPoint;
  readonly tail: PlacementExistingStopPoint;
}): PlacementTourConflict {
  return {
    head: { scope: conflict.head.scope, position: conflict.head.position },
    tail: { scope: conflict.tail.scope, position: conflict.tail.position },
    ...(conflict.head.id !== undefined ? { headStopPointId: conflict.head.id } : {}),
    ...(conflict.tail.id !== undefined ? { tailStopPointId: conflict.tail.id } : {}),
  };
}

/**
 * Forme historique de `togglePlacementStopPointOutcome` : le sous-brouillon appliqué, ou — story
 * 7.1, choix requis — l'entrée elle-même (rien n'est ajouté sans le choix de l'utilisateur). Depuis
 * la story 7.2, l'écran appelle `togglePlacementStopPointOutcome` (dialogue de choix).
 */
export function togglePlacementStopPoint(
  placement: PlacementDraft,
  location: StopPointLocation,
  context: PlacementContext,
): PlacementDraft {
  const outcome = togglePlacementStopPointOutcome(placement, location, context);
  return outcome.status === "APPLIED" ? outcome.placement : placement;
}

/** Story 6.1 (D-441) : le retrait du point existant `stopPointId` est-il programmé ? */
export function isPlacementStopPointRemoved(placement: PlacementDraft, stopPointId: string): boolean {
  return placement.stopPointRemovals.includes(stopPointId);
}

/** Le point de cet emplacement est-il ajouté dans le sous-brouillon ? */
export function isPlacementStopPointAdded(placement: PlacementDraft, location: StopPointLocation): boolean {
  const key = stopPointKey(location);
  return placement.stopPoints.some((point) => stopPointKey(point) === key);
}

/** Changements du sous-brouillon réellement applicables à un contexte (story 6.1, revue). */
type ApplicablePlacement = {
  readonly removedIds: ReadonlySet<string>;
  readonly keptStopPoints: readonly StopPoint[];
  readonly stopPointAdditions: readonly StopPointLocation[];
};

/**
 * Seul juge de l'applicabilité, partagé par `applyPlacementDraft` et `placementConfirmation` :
 * - retraits : points existants dont l'identifiant est programmé ;
 * - [récupérations ajoutées, retirées ou modifiées — retirées le 01/11/2026 : aucune récupération
 *   en placement] ;
 * - points ajoutés, dans l'ordre du sous-brouillon : emplacement encore proposé sur les points
 *   conservés (N compris), non consécutif aux points déjà retenus (RM-251) et — story 7.1 — ne
 *   créant pas de conflit de Tour avec eux.
 */
function applicablePlacement(context: PlacementContext, placement: PlacementDraft): ApplicablePlacement {
  const initial = context.stopPoints ?? [];
  const removedIds = new Set(
    initial.filter((point) => placement.stopPointRemovals.includes(point.id)).map((point) => point.id),
  );
  const keptStopPoints = removedIds.size > 0 ? initial.filter((point) => !removedIds.has(point.id)) : initial;
  const slots = placementSlots(context.exercises, keptStopPoints, EMPTY_PLACEMENT_DRAFT, context);
  const availableStopKeys = new Set(
    slots.flatMap((slot) =>
      slot.stopPoint !== null && !slot.stopPoint.existing ? [stopPointKey(slot.stopPoint.location)] : [],
    ),
  );

  const ordered = displayedOccurrences(context.exercises);
  const stopPointAdditions: StopPointLocation[] = [];
  for (const location of placement.stopPoints) {
    const key = stopPointKey(location);
    const retained = [...keptStopPoints, ...stopPointAdditions];
    const createsTourConflict =
      tourBoundaryConflict(ordered, [...retained, location], context) !== null &&
      tourBoundaryConflict(ordered, retained, context) === null;
    if (availableStopKeys.has(key) && !wouldBeConsecutive(ordered, retained, location) && !createsTourConflict) {
      availableStopKeys.delete(key);
      stopPointAdditions.push({ scope: location.scope, position: location.position });
    }
  }
  return { removedIds, keptStopPoints, stopPointAdditions };
}

/**
 * « Confirmer » (AD-43) : applique le sous-brouillon au brouillon de séance, en une seule
 * mise à jour fonctionnelle de `stopPoints` [PRE-9, 01/11/2026 : `exercises` (récupérations) n'est
 * plus jamais modifié par le placement ; les mentions de récupération ci-dessous sont remplacées].
 * Seuls les
 * changements APPLICABLES sont appliqués (`applicablePlacement` : une occurrence disparue, une
 * récupération ou un point déjà présents, un emplacement qui n'est plus proposé ou qui serait
 * consécutif sont ignorés). Une modification (`recoveryChanges`, story 4.2) ne s'applique qu'à
 * une récupération encore présente et n'en crée jamais. Story 6.1 (D-441) : les retraits
 * programmés retirent d'abord les points visés ; jamais deux points consécutifs créés. Sans
 * changement applicable, le brouillon est rendu tel quel (même identité). `newStopPointId`
 * fournit l'identifiant de chaque point créé (le Domaine n'en génère pas). Story 7.1 (D-442) :
 * un retrait de récupération programmé rend la récupération ABSENTE
 * (`postActivityRecoverySeconds = null`) — la Pause terminale configurée est rétablie dans les
 * durées (RM-038) ; N du Circuit lu sur `draft.tourRepeatCount`.
 */
export function applyPlacementDraft(
  draft: SessionDraft,
  placement: PlacementDraft,
  newStopPointId: () => string,
): SessionDraft {
  const applicable = applicablePlacement(draft, placement);
  const pointsChanged = applicable.removedIds.size > 0 || applicable.stopPointAdditions.length > 0;
  if (!pointsChanged) {
    return draft;
  }
  const added: StopPoint[] = applicable.stopPointAdditions.map((location) => ({
    id: newStopPointId(),
    scope: location.scope,
    position: location.position,
  }));
  return { ...draft, stopPoints: [...applicable.keptStopPoints, ...added] };
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
