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
 * Points d'arrêt : une disposition générale n'en porte aucun avant B.6 (`STRUCTURE_STOP_POINTS_UNSUPPORTED`) ;
 * un brouillon qui en porte refuse ces déplacements sans altération (`STOP_POINTS`) — l'ancien modèle
 * garde son glisser historique (Points compris).
 *
 * Fonctions pures ; rien n'est écrit : l'issue porte le brouillon à appliquer.
 */

import type { CircuitLoss } from "./circuit";
import { currentLayout, settleLayoutCircuitMembership, withLayout } from "./layoutOperations";
import type { SessionDraft } from "./SessionDraft";
import type { SessionStructure, StructureCircuit, StructureCycle, StructureCycleMember, StructureElement, StructureStopPointLocation } from "./structure";

type Layout = SessionStructure<string, StructureStopPointLocation>;

/** Élément déplaçable : Exercice (identifiant d'occurrence), Circuit ou Cycle (identifiant de conteneur). */
export type LayoutItemRef = { readonly kind: "EXERCISE" | "CIRCUIT" | "CYCLE"; readonly id: string };

/** Conteneur de destination : niveau Séance, Cycle ou Circuit. */
export type LayoutContainerRef = { readonly kind: "SESSION" } | { readonly kind: "CYCLE" | "CIRCUIT"; readonly id: string };

/**
 * Destination : conteneur et rang parmi ses membres, l'élément déplacé retiré (les conteneurs vidés
 * par ce retrait comptent encore : ils ne disparaissent qu'à l'application).
 */
export type LayoutDestination = { readonly container: LayoutContainerRef; readonly index: number };

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

export type LayoutItemMoveRefusal = "NOT_FOUND" | "NESTING" | "FORMAT_INCOMPATIBLE" | "STOP_POINTS" | "CONTROL" | "AT_BOUNDARY";

export type LayoutItemMoveOutcome =
  | {
      readonly status: "APPLIED";
      readonly draft: SessionDraft;
      /** Conteneurs vidés par le déplacement, retirés (effacement progressif côté écran). */
      readonly removedContainers: readonly LayoutItemRef[];
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
    }
  /** Destination identique à la position actuelle : rien à faire. */
  | { readonly status: "UNCHANGED" }
  | { readonly status: "REFUSED"; readonly reason: LayoutItemMoveRefusal; readonly controlReason?: string };

/** Nœud détaché par le retrait de la source. */
type Detached =
  | { readonly kind: "EXERCISE"; readonly id: string }
  | { readonly kind: "CIRCUIT"; readonly circuit: StructureCircuit<string> }
  | { readonly kind: "CYCLE"; readonly cycle: StructureCycle<string> };

/** Retire la source de la disposition, conteneurs vidés CONSERVÉS ; `null` si elle est absente. */
function detach(layout: Layout, source: LayoutItemRef): { readonly layout: Layout; readonly node: Detached } | null {
  let node: Detached | null = null;
  const fromCircuit = (circuit: StructureCircuit<string>): StructureCircuit<string> => {
    if (source.kind !== "EXERCISE" || !circuit.exercises.includes(source.id)) return circuit;
    node = { kind: "EXERCISE", id: source.id };
    return { ...circuit, exercises: circuit.exercises.filter((id) => id !== source.id) };
  };
  const elements: StructureElement<string>[] = [];
  for (const element of layout.elements) {
    switch (element.kind) {
      case "EXERCISE":
        if (source.kind === "EXERCISE" && element.exercise === source.id) node = { kind: "EXERCISE", id: source.id };
        else elements.push(element);
        break;
      case "CIRCUIT":
        if (source.kind === "CIRCUIT" && element.circuit.id === source.id) node = { kind: "CIRCUIT", circuit: element.circuit };
        else elements.push({ kind: "CIRCUIT", circuit: fromCircuit(element.circuit) });
        break;
      case "CYCLE": {
        if (source.kind === "CYCLE" && element.cycle.id === source.id) {
          node = { kind: "CYCLE", cycle: element.cycle };
          break;
        }
        const members = element.cycle.members.flatMap((member): StructureCycleMember<string>[] => {
          if (member.kind === "EXERCISE") {
            if (source.kind === "EXERCISE" && member.exercise === source.id) {
              node = { kind: "EXERCISE", id: source.id };
              return [];
            }
            return [member];
          }
          if (source.kind === "CIRCUIT" && member.circuit.id === source.id) {
            node = { kind: "CIRCUIT", circuit: member.circuit };
            return [];
          }
          return [{ kind: "CIRCUIT", circuit: fromCircuit(member.circuit) }];
        });
        elements.push({ kind: "CYCLE", cycle: { ...element.cycle, members } });
        break;
      }
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  }
  return node === null ? null : { layout: { ...layout, elements }, node };
}

const clampIndex = (index: number, length: number) =>
  Math.max(0, Math.min(Number.isFinite(index) ? Math.trunc(index) : length, length));

function insertAt<T>(items: readonly T[], index: number, item: T): T[] {
  const at = clampIndex(index, items.length);
  return [...items.slice(0, at), item, ...items.slice(at)];
}

/** Insère le nœud à la destination ; `null` si le conteneur est absent ou si l'imbrication est interdite (D-451). */
function attach(layout: Layout, node: Detached, destination: LayoutDestination): Layout | "NESTING" | null {
  const { container, index } = destination;
  switch (container.kind) {
    case "SESSION": {
      const element: StructureElement<string> =
        node.kind === "EXERCISE"
          ? { kind: "EXERCISE", exercise: node.id }
          : node.kind === "CIRCUIT"
            ? { kind: "CIRCUIT", circuit: node.circuit }
            : { kind: "CYCLE", cycle: node.cycle };
      return { ...layout, elements: insertAt(layout.elements, index, element) };
    }
    case "CYCLE": {
      if (node.kind === "CYCLE") return "NESTING";
      const member: StructureCycleMember<string> =
        node.kind === "EXERCISE" ? { kind: "EXERCISE", exercise: node.id } : { kind: "CIRCUIT", circuit: node.circuit };
      let found = false;
      const elements = layout.elements.map((element): StructureElement<string> => {
        if (element.kind !== "CYCLE" || element.cycle.id !== container.id) return element;
        found = true;
        return { kind: "CYCLE", cycle: { ...element.cycle, members: insertAt(element.cycle.members, index, member) } };
      });
      return found ? { ...layout, elements } : null;
    }
    case "CIRCUIT": {
      if (node.kind !== "EXERCISE") return "NESTING";
      let found = false;
      const into = (circuit: StructureCircuit<string>): StructureCircuit<string> => {
        if (circuit.id !== container.id) return circuit;
        found = true;
        return { ...circuit, exercises: insertAt(circuit.exercises, index, node.id) };
      };
      const elements = layout.elements.map((element): StructureElement<string> => {
        switch (element.kind) {
          case "EXERCISE":
            return element;
          case "CIRCUIT":
            return { kind: "CIRCUIT", circuit: into(element.circuit) };
          case "CYCLE":
            return {
              kind: "CYCLE",
              cycle: {
                ...element.cycle,
                members: element.cycle.members.map((member) => (member.kind === "CIRCUIT" ? { kind: "CIRCUIT", circuit: into(member.circuit) } : member)),
              },
            };
          default: {
            const unreachable: never = element;
            return unreachable;
          }
        }
      });
      return found ? { ...layout, elements } : null;
    }
    default: {
      const unreachable: never = container;
      return unreachable;
    }
  }
}

/** COMP §1 : retire les Circuits puis les Cycles devenus vides ; rend les conteneurs retirés. */
function pruneEmpty(layout: Layout): { readonly layout: Layout; readonly removed: readonly LayoutItemRef[] } {
  const removed: LayoutItemRef[] = [];
  const elements = layout.elements.flatMap((element): StructureElement<string>[] => {
    if (element.kind === "CIRCUIT") {
      if (element.circuit.exercises.length > 0) return [element];
      removed.push({ kind: "CIRCUIT", id: element.circuit.id });
      return [];
    }
    if (element.kind === "CYCLE") {
      const members = element.cycle.members.filter((member) => {
        if (member.kind === "CIRCUIT" && member.circuit.exercises.length === 0) {
          removed.push({ kind: "CIRCUIT", id: member.circuit.id });
          return false;
        }
        return true;
      });
      if (members.length === 0) {
        removed.push({ kind: "CYCLE", id: element.cycle.id });
        return [];
      }
      return [members.length === element.cycle.members.length ? element : { kind: "CYCLE", cycle: { ...element.cycle, members } }];
    }
    return [element];
  });
  return { layout: removed.length === 0 ? layout : { ...layout, elements }, removed };
}

/** Comparaison structurelle de deux séquences d'éléments (identités et ordre). */
const sameElements = (a: Layout, b: Layout) => JSON.stringify(a.elements) === JSON.stringify(b.elements);

/**
 * Déplace `source` à `destination` (voir l'en-tête). Ordre des contrôles, tous avant toute écriture :
 * élément et conteneur connus ; Points d'arrêt (B.6) ; imbrication D-451 ; position inchangée ;
 * adaptation au Circuit d'arrivée et matrice des Formats (B.3) ; contrôle avant dépose (C.4).
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
  if (layout.stopPoints.length > 0) {
    return { status: "REFUSED", reason: "STOP_POINTS" };
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
  const result = withLayout({ ...draft, exercises: settlement.exercises, ...settlement.reservePatch }, moved);
  const check = control({ before: draft, after: result, source, destination });
  if (check.status === "REFUSED") return { status: "REFUSED", reason: "CONTROL", controlReason: check.reason };
  if (settlement.losses.length > 0 || check.status === "CONFIRM") {
    return {
      status: "CONFIRMATION_REQUIRED",
      losses: settlement.losses,
      targetCount: settlement.targetCount,
      ...(check.status === "CONFIRM" ? { controlReason: check.reason } : {}),
      draft: result,
      removedContainers: removed,
    };
  }
  return { status: "APPLIED", draft: result, removedContainers: removed };
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

/** Emplacement actuel d'un élément : son conteneur et son rang. */
export function layoutItemLocation(layout: Pick<Layout, "elements">, source: LayoutItemRef): LayoutDestination | null {
  const inCircuit = (circuit: StructureCircuit<string>): LayoutDestination | null => {
    const index = source.kind === "EXERCISE" ? circuit.exercises.indexOf(source.id) : -1;
    return index < 0 ? null : { container: { kind: "CIRCUIT", id: circuit.id }, index };
  };
  for (const [at, element] of layout.elements.entries()) {
    if (element.kind === "EXERCISE" && source.kind === "EXERCISE" && element.exercise === source.id) return { container: { kind: "SESSION" }, index: at };
    if (element.kind === "CIRCUIT") {
      if (source.kind === "CIRCUIT" && element.circuit.id === source.id) return { container: { kind: "SESSION" }, index: at };
      const found = inCircuit(element.circuit);
      if (found !== null) return found;
    }
    if (element.kind === "CYCLE") {
      if (source.kind === "CYCLE" && element.cycle.id === source.id) return { container: { kind: "SESSION" }, index: at };
      for (const [index, member] of element.cycle.members.entries()) {
        if (member.kind === "EXERCISE" && source.kind === "EXERCISE" && member.exercise === source.id) {
          return { container: { kind: "CYCLE", id: element.cycle.id }, index };
        }
        if (member.kind === "CIRCUIT") {
          if (source.kind === "CIRCUIT" && member.circuit.id === source.id) return { container: { kind: "CYCLE", id: element.cycle.id }, index };
          const found = inCircuit(member.circuit);
          if (found !== null) return found;
        }
      }
    }
  }
  return null;
}

const sameDestination = (a: LayoutDestination, b: LayoutDestination) =>
  a.index === b.index && a.container.kind === b.container.kind && (a.container.kind === "SESSION" || (b.container.kind !== "SESSION" && a.container.id === b.container.id));

/**
 * PRE-9 B.4 — `stepOccurrence` généralisé aux positions de l'arbre (« Monter » / « Descendre ») :
 * l'élément passe à l'emplacement admis voisin (`layoutSlots`), dans l'ordre d'affichage ; à la
 * frontière d'un conteneur, il en sort ou y entre (en fin en montant, en tête en descendant), comme
 * l'ancien modèle entre les zones avant / dans / après le Circuit. Mêmes contrôles et même issue que
 * `moveLayoutItem` ; `AT_BOUNDARY` en tête ou en fin de séquence.
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
  const slots = layoutSlots(detached.layout, source.kind);
  const current = slots.findIndex((slot) => sameDestination(slot, location));
  const step = direction === "UP" ? -1 : 1;
  for (let at = current + step; current >= 0 && at >= 0 && at < slots.length; at += step) {
    const outcome = moveLayoutItem(draft, source, slots[at]!, newContainerId, control);
    if (outcome.status !== "UNCHANGED") return outcome;
  }
  return { status: "REFUSED", reason: "AT_BOUNDARY" };
}
