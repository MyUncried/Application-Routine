/**
 * PRE-9 (story B.4) — déplacement d'un élément de la structure générale : Exercice, Circuit ou Cycle
 * entier, vers un rang du niveau Séance, d'un Cycle ou d'un Circuit.
 *
 * Règles appliquées :
 * - COMP §6 (G1–G8) : « Un exercice change de circuit, de cycle ou de niveau séance ; l'appartenance
 *   directe au cycle est autorisée par D-451. Un circuit replié se déplace entre cycles ou vers la
 *   séance » ; « Le départ du dernier membre entraîne la disparition du conteneur » (COMP §1 : « Il
 *   disparaît lorsque son dernier membre en sort ») ;
 * - ARB-06 / D-04 : tout contenu peut être déposé dans un conteneur depuis une position non contiguë
 *   ou un autre conteneur, sans contrainte de contiguïté ni de parent commun ; « ni Circuit dans
 *   Circuit, ni Cycle dans Cycle » (D-451 : un Circuit ne contient que des Exercices, un Cycle des
 *   Exercices directs et des Circuits) — dépose contraire refusée sans altération (`NESTING`) ;
 * - ARB-09 : un Cycle entier se déplace par le même geste (au niveau de la Séance seulement) ;
 * - COMP §6, ch10 « Ajout et sortie du circuit », D-05, D-07, D-09, §2.4 des Arbitrages consolidés du
 *   30/10 : l'entrée d'un Exercice dans un Circuit alterné adapte son nombre actif de séries au N de
 *   CE Circuit, confirmation si et seulement si des valeurs sont perdues (« Annuler conserve
 *   emplacement et données d'origine, Confirmer réalise déplacement et adaptation ensemble ») ; un
 *   Exercice formaté conserve son Format et ses réglages, la combinaison est contrôlée par la matrice
 *   §2.2 avant toute mutation et refusée sans altération si elle ne convient pas
 *   (`settleLayoutCircuitMembership`, B.3) ; aucun Format n'est transmis, aucune adoption sur simple
 *   dépose (D-02, D-12, D-26 ; correction C.1 du 30/10 : le Circuit ne porte aucun Format) ;
 * - ARB-24 : point d'appel d'un contrôle avant dépose (`LayoutDropControl` : accepté / accepté après
 *   confirmation / refusé sans mutation), neutre par défaut ; C.4 y branche ses règles.
 *
 * Points d'arrêt : [B.4 : « une disposition générale n'en porte aucun avant B.6 ; un brouillon qui en
 * porte refuse ces déplacements sans altération (`STOP_POINTS`) » — remplacé le 31/10/2026 par B.6.]
 * PRE-9 B.6 (ARB-02 règles 1 à 3 et 5, ARB-06, D-441, D-442) : les Points restent à leur place dans la
 * séquence (`layoutStopPoints.ts`) ; un conteneur déplacé emporte les siens ; puis la règle tolérante
 * de D-442 s'applique à toute la structure (`settleLayoutStopPoints` : Points devenus interdits ou
 * consécutifs retirés sans message, le premier conservé ; conflit de répétition créé → choix requis,
 * `CHOICE_REQUIRED`). Un Point se déplace seul (`moveLayoutStopPoint`, `stepLayoutStopPoint`), dans un
 * conteneur compris, « selon les règles applicables à sa position de destination » (ARB-06).
 *
 * PRE-9 (story B.5) : suppression (`removeLayoutExercise`, conteneur vidé retiré) et duplication
 * (`duplicateLayoutExercise`, D-441, ARB-17) d'un Exercice ; aucune duplication de Circuit ni de
 * Cycle (ARB-08).
 *
 * Fonctions pures ; rien n'est écrit : l'issue porte le brouillon à appliquer.
 */

import type { CircuitLoss } from "./circuit";
import { copyCircuitReserveEntry } from "./circuitMembership";
import { duplicateActivity } from "./composition";
import { currentLayout, settleLayoutCircuitMembership, withLayout } from "./layoutOperations";
import {
  analyzeLayoutStopPoints,
  isLayoutStopPointAllowed,
  judgeLayoutStopPointMove,
  layoutStopPointId,
  layoutStopPointKey,
  sameStopPointContainer,
  stopPointContainerOf,
  stopPointLocationIn,
  type LayoutRepetitionConflictInfo,
  type LayoutStopPointRefusal,
} from "./layoutStopPoints";
import {
  attach,
  detach,
  layoutItemLocation,
  pruneEmpty,
  sameElements,
  separatorsOfDraft,
  withSettledStopPoints,
  type LayoutDestination,
  type LayoutItemRef,
} from "./layoutTree";
import type { SessionDraft } from "./SessionDraft";
import type { TourBoundaryChoice } from "./StopPoint";
import type { SessionStructure, StructureCircuit, StructureStopPointLocation } from "./structure";

export { layoutItemLocation } from "./layoutTree";
export type { LayoutContainerRef, LayoutDestination, LayoutItemRef } from "./layoutTree";

type Layout = SessionStructure<string, StructureStopPointLocation>;

/** Réponse du contrôle avant dépose (ARB-24). */
export type LayoutDropCheck =
  | { readonly status: "ACCEPTED" }
  | { readonly status: "CONFIRM"; readonly reason: string }
  | { readonly status: "REFUSED"; readonly reason: string };

/**
 * Point d'appel du contrôle avant dépose (ARB-24, B.4 → C.4) : appelé après les règles de structure
 * et l'adaptation au Circuit d'arrivée, avant toute écriture, avec le brouillon avant et après.
 */
export type LayoutDropControl = (context: {
  readonly before: SessionDraft;
  readonly after: SessionDraft;
  readonly source: LayoutItemRef;
  readonly destination: LayoutDestination;
}) => LayoutDropCheck;

/** Contrôle neutre : tout élément libre est accepté (les refus de la matrice §2.2 sont déjà appliqués). */
export const neutralDropControl: LayoutDropControl = () => ({ status: "ACCEPTED" });

/** [B.4 : refus `STOP_POINTS` tant que la Séance portait des Points d'arrêt — retiré le 31/10/2026 par B.6.] */
export type LayoutItemMoveRefusal = "NOT_FOUND" | "NESTING" | "FORMAT_INCOMPATIBLE" | "CONTROL" | "AT_BOUNDARY";

/** Issue appliquée, ou à confirmer, d'un déplacement (voir `LayoutItemMoveOutcome`). */
export type LayoutItemMoveResult =
  | {
      readonly status: "APPLIED";
      readonly draft: SessionDraft;
      /** Conteneurs vidés par le déplacement, retirés (effacement progressif côté écran). */
      readonly removedContainers: readonly LayoutItemRef[];
      /** PRE-9 B.6 (D-442) : Points d'arrêt retirés sans message par le déplacement. */
      readonly removedStopPointIds: readonly string[];
    }
  | {
      readonly status: "CONFIRMATION_REQUIRED";
      /** Pertes de séries (D-09) ; vide si seule la règle du contrôle demande confirmation. */
      readonly losses: readonly CircuitLoss[];
      readonly targetCount: number;
      /** Raison rendue par le contrôle avant dépose (C.4), le cas échéant. */
      readonly controlReason?: string;
      readonly draft: SessionDraft;
      readonly removedContainers: readonly LayoutItemRef[];
      readonly removedStopPointIds: readonly string[];
    };

export type LayoutItemMoveOutcome =
  | LayoutItemMoveResult
  /**
   * PRE-9 B.6 (D-442, ARB-02 règle 5, ARB-02b) : le déplacement ferait se suivre un Point de début et
   * un Point de fin d'une portée répétée (Circuit N ≥ 2, Cycle × k ≥ 2) ; rien n'est appliqué.
   * `resolutions.HEAD` conserve le début, `.TAIL` la fin ; chacune est l'issue complète à appliquer
   * (éventuellement une confirmation de perte). « Annuler » : rien ne change.
   */
  | {
      readonly status: "CHOICE_REQUIRED";
      readonly conflict: LayoutRepetitionConflictInfo;
      readonly resolutions: Readonly<Record<TourBoundaryChoice, LayoutItemMoveResult>>;
    }
  /** Destination identique à la position actuelle : rien à faire. */
  | { readonly status: "UNCHANGED" }
  | { readonly status: "REFUSED"; readonly reason: LayoutItemMoveRefusal; readonly controlReason?: string };

/**
 * Déplace `source` à `destination` (voir l'en-tête). Ordre des contrôles, tous avant toute écriture :
 * élément et conteneur connus ; imbrication D-451 ; position inchangée ; Points d'arrêt (B.6 : réglés
 * sur la disposition d'arrivée, choix de répétition) ; adaptation au Circuit d'arrivée et matrice des
 * Formats (B.3) ; contrôle avant dépose (C.4). [B.4 : « Points d'arrêt (B.6) » — refus sans altération,
 * remplacé par B.6.]
 */
export function moveLayoutItem(
  draft: SessionDraft,
  source: LayoutItemRef,
  destination: LayoutDestination,
  newContainerId: () => string,
  control: LayoutDropControl = neutralDropControl,
): LayoutItemMoveOutcome {
  const layout = currentLayout(draft, newContainerId);
  const detached = detach(layout, source);
  if (detached === null || (source.kind === "EXERCISE" && !draft.exercises.some((exercise) => exercise.id === source.id))) {
    return { status: "REFUSED", reason: "NOT_FOUND" };
  }
  const attached = attach(detached.layout, detached.node, destination);
  if (attached === "NESTING") return { status: "REFUSED", reason: "NESTING" };
  if (attached === null) return { status: "REFUSED", reason: "NOT_FOUND" };
  const { layout: moved, removed } = pruneEmpty(attached);
  if (sameElements(moved, layout)) return { status: "UNCHANGED" };

  const settlement = settleLayoutCircuitMembership({ ...draft, structure: layout }, { exercises: draft.exercises, structure: moved });
  if (settlement.refusedExerciseIds.length > 0) {
    return { status: "REFUSED", reason: "FORMAT_INCOMPATIBLE" };
  }
  const finish = (result: Layout, removedStopPointIds: readonly string[]): LayoutItemMoveResult | Extract<LayoutItemMoveOutcome, { status: "REFUSED" }> => {
    const next = withLayout({ ...draft, exercises: settlement.exercises, ...settlement.reservePatch }, result);
    const check = control({ before: draft, after: next, source, destination });
    if (check.status === "REFUSED") return { status: "REFUSED", reason: "CONTROL", controlReason: check.reason };
    if (settlement.losses.length > 0 || check.status === "CONFIRM") {
      return {
        status: "CONFIRMATION_REQUIRED",
        losses: settlement.losses,
        targetCount: settlement.targetCount,
        ...(check.status === "CONFIRM" ? { controlReason: check.reason } : {}),
        draft: next,
        removedContainers: removed,
        removedStopPointIds,
      };
    }
    return { status: "APPLIED", draft: next, removedContainers: removed, removedStopPointIds };
  };
  const outcome = withSettledStopPoints(draft, layout, moved, finish);
  if (outcome.status !== "CHOICE_REQUIRED") return outcome;
  const { HEAD, TAIL } = outcome.resolutions;
  if (HEAD.status === "REFUSED") return HEAD;
  if (TAIL.status === "REFUSED") return TAIL;
  return { status: "CHOICE_REQUIRED", conflict: outcome.conflict, resolutions: { HEAD, TAIL } };
}

// ---------------------------------------------------------------------------
// Emplacements et déplacement pas à pas (`stepOccurrence` généralisé)
// ---------------------------------------------------------------------------

/**
 * Emplacements admis pour `source` (D-451), dans l'ordre d'affichage, sur la disposition SANS la
 * source (conteneurs vidés conservés) : avant chaque élément du niveau Séance puis, pour un
 * conteneur qui l'admet, chacun de ses rangs (un Circuit de Cycle après le rang du Cycle qui le
 * précède). Un Exercice entre partout ; un Circuit au niveau Séance et dans les Cycles ; un Cycle au
 * niveau Séance seulement.
 */
export function layoutSlots(layoutWithoutSource: Pick<Layout, "elements">, sourceKind: LayoutItemRef["kind"]): readonly LayoutDestination[] {
  const slots: LayoutDestination[] = [];
  const circuitSlots = (circuit: StructureCircuit<string>) => {
    if (sourceKind !== "EXERCISE") return;
    for (let index = 0; index <= circuit.exercises.length; index += 1) {
      slots.push({ container: { kind: "CIRCUIT", id: circuit.id }, index });
    }
  };
  const elements = layoutWithoutSource.elements;
  elements.forEach((element, at) => {
    slots.push({ container: { kind: "SESSION" }, index: at });
    if (element.kind === "CIRCUIT") circuitSlots(element.circuit);
    if (element.kind === "CYCLE" && sourceKind !== "CYCLE") {
      element.cycle.members.forEach((member, index) => {
        slots.push({ container: { kind: "CYCLE", id: element.cycle.id }, index });
        if (member.kind === "CIRCUIT") circuitSlots(member.circuit);
      });
      slots.push({ container: { kind: "CYCLE", id: element.cycle.id }, index: element.cycle.members.length });
    }
  });
  slots.push({ container: { kind: "SESSION" }, index: elements.length });
  return slots;
}

const sameDestination = (a: LayoutDestination, b: LayoutDestination) =>
  a.index === b.index && a.container.kind === b.container.kind && (a.container.kind === "SESSION" || (b.container.kind !== "SESSION" && a.container.id === b.container.id));

/**
 * PRE-9 B.4 — `stepOccurrence` généralisé aux positions de l'arbre (« Monter » / « Descendre ») :
 * l'élément passe à l'emplacement admis voisin (`layoutSlots`), dans l'ordre d'affichage ; à la
 * frontière d'un conteneur, il en sort ou y entre (en fin en montant, en tête en descendant), comme
 * l'ancien modèle entre les zones avant / dans / après le Circuit. Mêmes contrôles et même issue que
 * `moveLayoutItem` ; `AT_BOUNDARY` en tête ou en fin de séquence.
 *
 * PRE-9 B.6 (D-441, `stepOccurrence` : « échange avec l'élément VOISIN de la séquence mêlée, point ou
 * occurrence ») : un Point voisin dans le même conteneur (juste avant en montant, juste après en
 * descendant) est d'abord franchi — l'élément et ce Point échangent leur place —, puis la règle
 * tolérante de D-442 s'applique (`[A, P, B]`, B monte : `[A, B, P]`, P retiré s'il précède la Fin).
 */
export function stepLayoutItem(
  draft: SessionDraft,
  source: LayoutItemRef,
  direction: "UP" | "DOWN",
  newContainerId: () => string,
  control: LayoutDropControl = neutralDropControl,
): LayoutItemMoveOutcome {
  const layout = currentLayout(draft, newContainerId);
  const location = layoutItemLocation(layout, source);
  const detached = detach(layout, source);
  if (location === null || detached === null) return { status: "REFUSED", reason: "NOT_FOUND" };
  // Point voisin : rang du Point juste avant (`index`) ou juste après (`index + 1`) l'élément.
  const neighborPosition = direction === "UP" ? location.index : location.index + 1;
  const neighbors = layout.stopPoints.filter((point) => {
    const container = stopPointContainerOf(point);
    return container !== null && sameStopPointContainer(container, location.container) && point.position === neighborPosition;
  });
  if (neighbors.length > 0) {
    const crossed = direction === "UP" ? location.index + 1 : location.index;
    const swapped: Layout = {
      ...layout,
      stopPoints: layout.stopPoints.map((point) => (neighbors.includes(point) ? { ...point, position: crossed } : point)),
    };
    const outcome = withSettledStopPoints(draft, layout, swapped, (result, removedStopPointIds): LayoutItemMoveResult => ({
      status: "APPLIED",
      draft: withLayout(draft, result),
      removedContainers: [],
      removedStopPointIds,
    }));
    return outcome;
  }
  const slots = layoutSlots(detached.layout, source.kind);
  const current = slots.findIndex((slot) => sameDestination(slot, location));
  const step = direction === "UP" ? -1 : 1;
  for (let at = current + step; current >= 0 && at >= 0 && at < slots.length; at += step) {
    const outcome = moveLayoutItem(draft, source, slots[at]!, newContainerId, control);
    if (outcome.status !== "UNCHANGED") return outcome;
  }
  return { status: "REFUSED", reason: "AT_BOUNDARY" };
}

// ---------------------------------------------------------------------------
// PRE-9 (story B.5) — suppression et duplication d'un Exercice de la structure générale
// ---------------------------------------------------------------------------

/** Suppression ou duplication appliquée. */
export type LayoutExerciseEditResult = {
  readonly status: "APPLIED";
  readonly draft: SessionDraft;
  /** Conteneurs vidés par la suppression, retirés (effacement progressif côté écran) ; toujours vide pour une duplication. */
  readonly removedContainers: readonly LayoutItemRef[];
  /** PRE-9 B.6 (D-442) : Points d'arrêt retirés sans message ; toujours vide pour une duplication. */
  readonly removedStopPointIds: readonly string[];
};

/** Issue d'une suppression ou d'une duplication d'Exercice (`removeLayoutExercise`, `duplicateLayoutExercise`). */
export type LayoutExerciseEditOutcome =
  | LayoutExerciseEditResult
  /**
   * PRE-9 B.6 (D-442 amendée, recette J6 ; ARB-02b) : la suppression ferait se suivre un Point de début
   * et un Point de fin d'une portée répétée — « Début de tour / Fin de tour » (ou de répétition), ou
   * Annuler ; chaque résolution est la suppression complète à appliquer.
   */
  | {
      readonly status: "CHOICE_REQUIRED";
      readonly conflict: LayoutRepetitionConflictInfo;
      readonly resolutions: Readonly<Record<TourBoundaryChoice, LayoutExerciseEditResult>>;
    }
  /**
   * [B.5 : « `STOP_POINTS` : la disposition porte des Points d'arrêt — elle est alors représentable
   * dans l'ancien modèle (une disposition générale n'en porte aucun avant B.6) » — retiré le 31/10/2026
   * par B.6.] `STOP_POINT_CONFLICT` (B.6, duplication seule) : la copie rendrait un Point interdit ou
   * consécutif — refus doux de D-441, en pratique impossible (la copie est insérée juste après sa
   * source, avant le Point qui la suivait).
   */
  | { readonly status: "REFUSED"; readonly reason: "NOT_FOUND" | "STOP_POINT_CONFLICT" };

/**
 * PRE-9 B.5 (epics B.5 ; COMP §1 : « Il disparaît lorsque son dernier membre en sort ») — suppression
 * de l'Exercice `exerciseId`, où qu'il soit (niveau Séance, Exercice direct d'un Cycle, Circuit d'un
 * Cycle ou de la Séance). Ses voisins se resserrent ; s'il était le dernier membre de son Circuit, le
 * Circuit est retiré, puis le Cycle devenu vide (`removedContainers`). La réserve de séries du Circuit
 * quitté part avec lui (`settleLayoutCircuitMembership`) ; les autres Exercices sont inchangés (un
 * Format n'est jamais transmis ni retiré : correction C.1 du 30/10). Aucune confirmation : la
 * suppression ne fait perdre que l'Exercice supprimé (D-442 amendée : toujours appliquée).
 *
 * PRE-9 B.6 (epics B.5 « points d'arrêt devenus interdits retirés sans message » ; D-442 ; ARB-02) :
 * les Points restent à leur place dans la séquence ; ceux que la suppression rend interdits (RM-219)
 * ou consécutifs (RM-251, le premier conservé), ou qui perdent leur conteneur, sont retirés sans
 * message (`removedStopPointIds`) ; un conflit de répétition créé demande le choix
 * (`CHOICE_REQUIRED`).
 */
export function removeLayoutExercise(draft: SessionDraft, exerciseId: string, newContainerId: () => string): LayoutExerciseEditOutcome {
  const layout = currentLayout(draft, newContainerId);
  const detached = detach(layout, { kind: "EXERCISE", id: exerciseId });
  if (detached === null || !draft.exercises.some((exercise) => exercise.id === exerciseId)) {
    return { status: "REFUSED", reason: "NOT_FOUND" };
  }
  const { layout: pruned, removed } = pruneEmpty(detached.layout);
  const exercises = draft.exercises.filter((exercise) => exercise.id !== exerciseId);
  const settlement = settleLayoutCircuitMembership({ ...draft, structure: layout }, { exercises, structure: pruned });
  const finish = (result: Layout, removedStopPointIds: readonly string[]): LayoutExerciseEditResult => ({
    status: "APPLIED",
    draft: withLayout({ ...draft, exercises: settlement.exercises, ...settlement.reservePatch }, result),
    removedContainers: removed,
    removedStopPointIds,
  });
  return withSettledStopPoints({ ...draft, exercises }, layout, pruned, finish);
}

/** Insère `copyId` juste après `sourceId`, dans le même conteneur ; `null` si la source est absente. */
function insertCopyAfter(layout: Layout, sourceId: string, copyId: string): Layout | null {
  const location = layoutItemLocation(layout, { kind: "EXERCISE", id: sourceId });
  if (location === null) return null;
  const attached = attach(layout, { kind: "EXERCISE", id: copyId }, { container: location.container, index: location.index + 1 });
  return attached === null || attached === "NESTING" ? null : attached;
}

/**
 * PRE-9 B.5 (D-441 ; ARB-17 ; correction C.1 du 30/10 : Format porté par l'Exercice seul) —
 * duplication de l'Exercice `exerciseId` : la copie (`duplicateActivity` : même Mouvement, numéro de
 * copie, paramètres indépendants, récupération comprise, Format et réglages de Format conservés) est
 * insérée juste après la source, dans le même conteneur (Séance, Cycle ou Circuit). Dans un Circuit
 * alterné, la copie garde le nombre de séries de sa source, déjà au N du Circuit, et reçoit sa réserve
 * de séries (`copyCircuitReserveEntry`). Rien n'est transmis aux autres éléments. Aucune duplication de
 * Circuit ni de Cycle (ARB-08) : seule cette opération d'Exercice existe. Entrée invalide — `newId`
 * déjà présent : exception (convention de `duplicateOccurrenceOutcome`).
 *
 * PRE-9 B.6 (D-441, arbitrage du 22/10/2026 ; RM-210) : la copie est insérée AVANT le Point qui suivait
 * la source (`[A, P, B]` → `[A, A′, P, B]`) ; aucun Point n'est copié.
 */
export function duplicateLayoutExercise(
  draft: SessionDraft,
  exerciseId: string,
  newId: string,
  newContainerId: () => string,
): LayoutExerciseEditOutcome {
  if (draft.exercises.some((exercise) => exercise.id === newId)) {
    throw new Error(`duplicateLayoutExercise : l'identifiant de copie « ${newId} » existe déjà dans la Composition.`);
  }
  const layout = currentLayout(draft, newContainerId);
  const inserted = insertCopyAfter(layout, exerciseId, newId);
  const exercises = duplicateActivity(draft.exercises, exerciseId, newId);
  if (inserted === null || exercises === draft.exercises) {
    return { status: "REFUSED", reason: "NOT_FOUND" };
  }
  const outcome = withSettledStopPoints({ ...draft, exercises }, layout, inserted, (_result, removedStopPointIds) => ({ status: "APPLIED" as const, removedStopPointIds }));
  if (outcome.status === "CHOICE_REQUIRED" || outcome.removedStopPointIds.length > 0) {
    return { status: "REFUSED", reason: "STOP_POINT_CONFLICT" };
  }
  return {
    status: "APPLIED",
    draft: withLayout({ ...draft, exercises, ...copyCircuitReserveEntry(draft, exerciseId, newId) }, inserted),
    removedContainers: [],
    removedStopPointIds: [],
  };
}

// ---------------------------------------------------------------------------
// PRE-9 (story B.6) — déplacement autonome d'un Point d'arrêt (D-441, ARB-06)
// ---------------------------------------------------------------------------

/** Issue d'un déplacement de Point (`moveLayoutStopPoint`, `stepLayoutStopPoint`). */
export type LayoutStopPointMoveOutcome =
  | { readonly status: "APPLIED"; readonly draft: SessionDraft }
  | { readonly status: "UNCHANGED" }
  | {
      readonly status: "CHOICE_REQUIRED";
      readonly conflict: LayoutRepetitionConflictInfo;
      /** `HEAD` / `TAIL` : brouillon à appliquer ; conserver l'autre Point retire donc le Point déplacé. */
      readonly resolutions: Readonly<Record<TourBoundaryChoice, SessionDraft>>;
    }
  | { readonly status: "REFUSED"; readonly reason: LayoutStopPointRefusal | "NOT_FOUND" | "AT_BOUNDARY" };

/**
 * PRE-9 B.6 (D-441 « déplacement autonome » ; RM-251 ; ARB-06 : « Un point d'arrêt peut également être
 * déplacé dans le conteneur, selon les règles applicables à sa position de destination ») — dépose du
 * Point `stopPointId` à l'emplacement `target` (Séance, Cycle ou Circuit, où qu'il soit), identité
 * conservée, structure inchangée. Refus sans mutation : cible non autorisée (RM-219, exception de début
 * et de fin de répétition comprise), occupée, ou qui rendrait le Point consécutif à un autre (RM-251) ;
 * un conflit de répétition créé rend le choix requis (D-442). Même emplacement : `UNCHANGED`.
 */
export function moveLayoutStopPoint(
  draft: SessionDraft,
  stopPointId: string,
  target: StructureStopPointLocation,
  newContainerId: () => string,
): LayoutStopPointMoveOutcome {
  const layout = currentLayout(draft, newContainerId);
  const point = layout.stopPoints.find((candidate) => layoutStopPointId(candidate) === stopPointId);
  if (point === undefined) return { status: "REFUSED", reason: "NOT_FOUND" };
  if (layoutStopPointKey(point) === layoutStopPointKey(target)) return { status: "UNCHANGED" };
  const judgement = judgeLayoutStopPointMove({ layout, isSeparator: separatorsOfDraft(draft) }, stopPointId, target);
  if (judgement === null) return { status: "REFUSED", reason: "NOT_FOUND" };
  switch (judgement.status) {
    case "REFUSED":
      return { status: "REFUSED", reason: judgement.reason };
    case "APPLIED":
      return { status: "APPLIED", draft: withLayout(draft, { ...layout, stopPoints: judgement.stopPoints }) };
    case "CHOICE_REQUIRED":
      return {
        status: "CHOICE_REQUIRED",
        conflict: judgement.conflict,
        resolutions: {
          HEAD: withLayout(draft, { ...layout, stopPoints: judgement.resolutions.HEAD.stopPoints }),
          TAIL: withLayout(draft, { ...layout, stopPoints: judgement.resolutions.TAIL.stopPoints }),
        },
      };
    default: {
      const unreachable: never = judgement;
      return unreachable;
    }
  }
}

/**
 * Emplacements de Point de la disposition, dans l'ordre de la séquence fonctionnelle (voir
 * `analyzeLayoutStopPoints`) : chaque emplacement de chaque conteneur.
 */
export function layoutStopPointSlots(draft: SessionDraft, newContainerId: () => string): readonly StructureStopPointLocation[] {
  const layout = currentLayout(draft, newContainerId);
  return analyzeLayoutStopPoints(layout, separatorsOfDraft(draft)).items.flatMap((item) =>
    item.kind === "SLOT" ? [stopPointLocationIn(item.container, item.position)] : [],
  );
}

/**
 * PRE-9 B.6 (D-441, CE-T03-08 « Monter » / « Descendre » d'un Point, généralisé à la structure) : le
 * Point passe au plus proche emplacement, dans le sens demandé, où sa dépose serait acceptée
 * (`moveLayoutStopPoint` : appliquée ou choix requis), en entrant dans un conteneur ou en en sortant.
 * `AT_BOUNDARY` s'il n'en existe aucun.
 */
export function stepLayoutStopPoint(
  draft: SessionDraft,
  stopPointId: string,
  direction: "UP" | "DOWN",
  newContainerId: () => string,
): LayoutStopPointMoveOutcome {
  const layout = currentLayout(draft, newContainerId);
  const point = layout.stopPoints.find((candidate) => layoutStopPointId(candidate) === stopPointId);
  if (point === undefined) return { status: "REFUSED", reason: "NOT_FOUND" };
  const analysis = analyzeLayoutStopPoints(layout, separatorsOfDraft(draft));
  const slots = layoutStopPointSlots(draft, newContainerId);
  const current = slots.findIndex((slot) => layoutStopPointKey(slot) === layoutStopPointKey(point));
  const step = direction === "UP" ? -1 : 1;
  for (let at = current + step; current >= 0 && at >= 0 && at < slots.length; at += step) {
    const slot = slots[at]!;
    if (!isLayoutStopPointAllowed(analysis, slot)) continue;
    const outcome = moveLayoutStopPoint(draft, stopPointId, slot, newContainerId);
    if (outcome.status === "APPLIED" || outcome.status === "CHOICE_REQUIRED") return outcome;
  }
  return { status: "REFUSED", reason: "AT_BOUNDARY" };
}
