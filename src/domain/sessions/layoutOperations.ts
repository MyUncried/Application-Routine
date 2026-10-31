/**
 * PRE-9 (story B.1b, D-451, COMP §2 et §4, ARB-13) — opérations de Composition sur une disposition
 * générale (`SessionDraft.structure` plus riche que l'ancien modèle : plusieurs Circuits, Cycles).
 *
 * Mêmes règles que pour le Circuit unique (`circuit.ts`), appliquées au Circuit désigné :
 * - compte du Circuit 1..99 ; en séries alternées, chaque Exercice du Circuit suit N, la diminution
 *   met les lignes retirées en réserve, l'augmentation restaure d'abord depuis la réserve (AD-38) ;
 * - nature : groupées → alternées adapte chaque Exercice à N, perte annoncée avant toute mutation
 *   (`prepareLayoutNatureChange`) et troncature définitive à la confirmation ; alternées → groupées
 *   ne change que la nature (COMP §2) ;
 * - compte du Cycle 1..99 (D-451).
 * Les Points d'arrêt ne sont pas concernés : une disposition générale n'en porte pas avant B.6.
 *
 * PRE-9 (B.3, COMP §2 et §6, ch10 « Ajout et sortie du circuit », D-07, D-09, §2.4 des Arbitrages
 * consolidés du 30/10) : ces règles valent pour CHAQUE Circuit de la Séance —
 * - entrée d'un Exercice dans un Circuit alterné (nouvel Exercice inséré, déplacement) : son nombre
 *   actif de séries est adapté au N de CE Circuit (extension par la dernière ligne, troncature au-delà),
 *   régime et autres paramètres conservés ; pertes calculées avant toute mutation, confirmation si et
 *   seulement si des valeurs sont perdues (`settleLayoutCircuitMembership`, `moveExerciseToCircuit`) ;
 * - sortie d'un Circuit : nombre actif et paramètres conservés, réserve de brouillon retirée ;
 * - un Circuit vidé par un déplacement disparaît (COMP §1, §6) ;
 * - Exercice formaté (D-05, matrice §2.2, `circuitCompatibility`) : combinaison refusée par la
 *   matrice ou exigeant une adaptation de ses réglages de Format (C.4) refusée sans altération ; de
 *   même, un compte ou une nature de Circuit qui exigerait de modifier les séries d'un membre formaté
 *   n'est pas appliqué (« Les constantes des Formats ne sont jamais effacées ou modifiées
 *   silencieusement », D-17).
 *
 * Lettres de désignation (COMP §4, ARB-13) : Circuit A, B… dans l'ordre de Composition, à
 * l'échelle de la Séance (sans repartir dans chaque Cycle), Cycle A, B… de même ; aucune lettre
 * lorsqu'un seul conteneur de cette nature est présent ; après Z : AA, AB…, réattribuées selon
 * l'ordre. Une lettre désigne, elle n'est pas un identifiant.
 *
 * Fonctions pures ; même référence lorsque rien ne change.
 */

import { clampSeriesCount, seriesCountOf, type SeriesRow } from "@/domain/activities/ExecutionParameters";

import { adaptExercise, DEFAULT_CIRCUIT_NATURE, lostSeriesCount, type CircuitLoss, type CircuitLossReport, type CircuitNature } from "./circuit";
import { circuitCompatibility, FORMAT_REGISTRY } from "./formats";
import { DEFAULT_TOUR_REPEAT_COUNT } from "./defaults";
import type { StructuralPosition } from "./Session";
import type { SessionDraft, SessionDraftExercise } from "./SessionDraft";
import type { StopPoint } from "./StopPoint";
import {
  CYCLE_REPEAT_COUNT_MAX,
  CYCLE_REPEAT_COUNT_MIN,
  legacyFromStructure,
  NO_CIRCUIT_ID,
  structureCircuits,
  structureExercises,
  structureFromLegacy,
  withoutEmptyLegacyCircuit,
  type SessionStructure,
  type StructureCircuit,
  type StructureCycleMember,
  type StructureElement,
  type StructureStopPointLocation,
} from "./structure";

type Layout = SessionStructure<string, StructureStopPointLocation>;

/** Lettre de rang `index` (0 → A, 25 → Z, 26 → AA, 27 → AB…). */
export function designationLetter(index: number): string {
  let rest = index;
  let letters = "";
  do {
    letters = String.fromCharCode(65 + (rest % 26)) + letters;
    rest = Math.floor(rest / 26) - 1;
  } while (rest >= 0);
  return letters;
}

/** Lettres des Circuits et des Cycles par identifiant ; absente quand le conteneur est seul de sa nature. */
export function containerLetters(layout: Pick<Layout, "elements">): ReadonlyMap<string, string> {
  const circuits = structureCircuits(layout).map((circuit) => circuit.id);
  const cycles = layout.elements.flatMap((element) => (element.kind === "CYCLE" ? [element.cycle.id] : []));
  const letters = new Map<string, string>();
  for (const ids of [circuits, cycles]) {
    if (ids.length > 1) {
      ids.forEach((id, index) => letters.set(id, designationLetter(index)));
    }
  }
  return letters;
}

/** Remplace le Circuit `circuitId` de la disposition (même référence si absent ou inchangé). */
function withLayoutCircuit(layout: Layout, circuitId: string, update: (circuit: StructureCircuit<string>) => StructureCircuit<string>): Layout {
  let changed = false;
  const apply = (circuit: StructureCircuit<string>) => {
    if (circuit.id !== circuitId) {
      return circuit;
    }
    const next = update(circuit);
    changed ||= next !== circuit;
    return next;
  };
  const elements = layout.elements.map((element): StructureElement<string> => {
    switch (element.kind) {
      case "EXERCISE":
        return element;
      case "CIRCUIT":
        return { kind: "CIRCUIT", circuit: apply(element.circuit) };
      case "CYCLE":
        return {
          kind: "CYCLE",
          cycle: {
            ...element.cycle,
            members: element.cycle.members.map((member) => (member.kind === "CIRCUIT" ? { kind: "CIRCUIT", circuit: apply(member.circuit) } : member)),
          },
        };
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  });
  return changed ? { ...layout, elements } : layout;
}

function layoutCircuit(draft: SessionDraft, circuitId: string): StructureCircuit<string> | undefined {
  return draft.structure === undefined ? undefined : structureCircuits(draft.structure).find((circuit) => circuit.id === circuitId);
}

/** Exercices du Circuit qui suivent N : ceux de type `EXERCISE` (AD-37). */
function followsCount(draft: SessionDraft, circuit: StructureCircuit<string>): (exercise: SessionDraftExercise) => boolean {
  const members = new Set(circuit.exercises);
  return (exercise) => members.has(exercise.id) && exercise.type === "EXERCISE";
}

/**
 * PRE-9 (B.3, D-05, D-17, matrice §2.2) : un Exercice formaté peut-il être membre d'un Circuit de
 * cette nature et de ce compte SANS que ses séries ou ses réglages de Format soient modifiés ? Libre :
 * toujours. Groupées : la matrice admet les six Formats, rien n'est modifié (D-08). Alternées : la
 * matrice doit l'admettre (`UNDECIDED` n'est jamais un refus, mais l'adaptation n'est pas décidée)
 * sans réglage à adapter (EMOM : C.4), et son nombre de séries doit déjà valoir N.
 */
export function formattedMemberFits(exercise: SessionDraftExercise, nature: CircuitNature, count: number): boolean {
  const format = exercise.format ?? null;
  if (format === null || exercise.type !== "EXERCISE") {
    return true;
  }
  const compatibility = circuitCompatibility(format.key, { nature, repeatCount: count });
  if (compatibility.status === "REFUSED") {
    return false;
  }
  if (nature === "TOURS") {
    return true;
  }
  const rule = FORMAT_REGISTRY[format.key].inCircuit[nature];
  const adaptsSetting = rule.status === "ADMITTED" && rule.adaptsSetting !== undefined;
  return compatibility.status === "ADMITTED" && !adaptsSetting && seriesCountOf(exercise.executionParameters) === count;
}

/** Vrai si un membre formaté du Circuit ne supporterait pas la nature ou le compte demandés (voir l'en-tête). */
function blockedByFormattedMember(draft: SessionDraft, circuit: StructureCircuit<string>, nature: CircuitNature, count: number): boolean {
  const inCircuit = followsCount(draft, circuit);
  return draft.exercises.some((exercise) => inCircuit(exercise) && !formattedMemberFits(exercise, nature, count));
}

/** Compte du Circuit désigné, borné 1..99 (voir l'en-tête). */
export function setLayoutCircuitCount(draft: SessionDraft, circuitId: string, requested: number): SessionDraft {
  const circuit = layoutCircuit(draft, circuitId);
  if (circuit === undefined || draft.structure === undefined || !Number.isFinite(requested)) {
    return draft;
  }
  const count = clampSeriesCount(requested);
  if (count === circuit.repeatCount) {
    return draft;
  }
  if (circuit.nature === "SERIES" && blockedByFormattedMember(draft, circuit, circuit.nature, count)) {
    return draft;
  }
  const structure = withLayoutCircuit(draft.structure, circuitId, (current) => ({ ...current, repeatCount: count }));
  if (circuit.nature === "TOURS") {
    return { ...draft, structure };
  }
  const inCircuit = followsCount(draft, circuit);
  const reserve: Record<string, readonly SeriesRow[]> = { ...(draft.circuitSeriesReserve ?? {}) };
  const exercises = draft.exercises.map((exercise) => {
    if (!inCircuit(exercise)) {
      return exercise;
    }
    const kept = exercise.executionParameters.series.kind === "VARIABLE" ? (reserve[exercise.id] ?? []) : [];
    const adapted = adaptExercise(exercise, count, kept);
    if (adapted.reserve.length > 0) {
      reserve[exercise.id] = adapted.reserve;
    } else {
      delete reserve[exercise.id];
    }
    return adapted.exercise;
  });
  return { ...draft, structure, exercises, circuitSeriesReserve: Object.keys(reserve).length === 0 ? undefined : reserve };
}

/** Pertes d'un changement de nature du Circuit désigné, sans mutation (voir l'en-tête). */
export function prepareLayoutNatureChange(draft: SessionDraft, circuitId: string, nature: CircuitNature): CircuitLossReport {
  const circuit = layoutCircuit(draft, circuitId);
  if (circuit === undefined || nature === circuit.nature || nature === "TOURS" || blockedByFormattedMember(draft, circuit, nature, circuit.repeatCount)) {
    return { losses: [] };
  }
  const inCircuit = followsCount(draft, circuit);
  return {
    losses: draft.exercises.flatMap((exercise) => {
      const lost = inCircuit(exercise) ? lostSeriesCount(exercise, circuit.repeatCount) : 0;
      return lost > 0 ? [{ occurrenceId: exercise.id, lostSeriesCount: lost }] : [];
    }),
  };
}

/** Applique un changement de nature du Circuit désigné, sans confirmation (à la charge de l'appelant). */
export function applyLayoutNatureChange(draft: SessionDraft, circuitId: string, nature: CircuitNature): SessionDraft {
  const circuit = layoutCircuit(draft, circuitId);
  if (circuit === undefined || draft.structure === undefined || nature === circuit.nature) {
    return draft;
  }
  if (blockedByFormattedMember(draft, circuit, nature, circuit.repeatCount)) {
    return draft;
  }
  const structure = withLayoutCircuit(draft.structure, circuitId, (current) => ({ ...current, nature }));
  if (nature === "TOURS") {
    return { ...draft, structure };
  }
  const inCircuit = followsCount(draft, circuit);
  const reserve: Record<string, readonly SeriesRow[]> = { ...(draft.circuitSeriesReserve ?? {}) };
  const exercises = draft.exercises.map((exercise) => {
    if (!inCircuit(exercise)) {
      return exercise;
    }
    // Conversion confirmée : troncature définitive, aucune réserve conservée.
    delete reserve[exercise.id];
    return adaptExercise(exercise, circuit.repeatCount, []).exercise;
  });
  return { ...draft, structure, exercises, circuitSeriesReserve: Object.keys(reserve).length === 0 ? undefined : reserve };
}

/** Compte du Cycle désigné, borné 1..99 (D-451). */
export function setLayoutCycleCount(draft: SessionDraft, cycleId: string, requested: number): SessionDraft {
  if (draft.structure === undefined || !Number.isFinite(requested)) {
    return draft;
  }
  const count = Math.min(CYCLE_REPEAT_COUNT_MAX, Math.max(CYCLE_REPEAT_COUNT_MIN, Math.round(requested)));
  let changed = false;
  const elements = draft.structure.elements.map((element): StructureElement<string> => {
    if (element.kind !== "CYCLE" || element.cycle.id !== cycleId || element.cycle.repeatCount === count) {
      return element;
    }
    changed = true;
    return { kind: "CYCLE", cycle: { ...element.cycle, repeatCount: count } };
  });
  return changed ? { ...draft, structure: { ...draft.structure, elements } } : draft;
}

// ---------------------------------------------------------------------------
// PRE-9 (B.2, ARB-06, ARB-07, D-451) — création par enveloppe et insertion
// ---------------------------------------------------------------------------

/**
 * Disposition courante du brouillon, que la Composition l'édite dans l'ancien modèle (zones,
 * compte, nature, Points du brouillon ; Circuit vide absent) ou dans la structure générale.
 */
export function currentLayout(draft: SessionDraft, newContainerId: () => string): Layout {
  const layout = draft.structure;
  const legacy = layout === undefined ? null : legacyFromStructure(layout);
  if (layout !== undefined && legacy === null) {
    return layout;
  }
  const zone = (position: StructuralPosition) => draft.exercises.filter((exercise) => exercise.structuralPosition === position).map((exercise) => exercise.id);
  const tour = legacy?.composition.tour;
  const structure = structureFromLegacy(
    {
      beforeTour: zone("BEFORE_TOUR"),
      tour: {
        id: tour !== undefined && tour.id !== NO_CIRCUIT_ID ? tour.id : newContainerId(),
        repeatCount: draft.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT,
        nature: draft.circuitNature ?? tour?.nature ?? DEFAULT_CIRCUIT_NATURE,
        exercises: zone("IN_TOUR"),
      },
      afterTour: zone("AFTER_TOUR"),
    },
    (draft.stopPoints ?? []).map((point) => ({ id: point.id, scope: point.scope, position: point.position })),
  );
  return withoutEmptyLegacyCircuit(structure);
}

/**
 * Brouillon portant la disposition `layout` : représentable dans l'ancien modèle, ses zones,
 * compte, nature et Points sont réécrits (la Composition de l'ancien modèle les lit) ; sinon la
 * disposition fait foi (les champs de l'ancien modèle ne sont plus lus).
 */
export function withLayout(draft: SessionDraft, layout: Layout): SessionDraft {
  const legacy = legacyFromStructure(layout);
  if (legacy === null) {
    return { ...draft, structure: layout };
  }
  const byId = new Map(draft.exercises.map((exercise) => [exercise.id, exercise]));
  const placed = (ids: readonly string[], structuralPosition: StructuralPosition) =>
    ids.flatMap((id) => {
      const exercise = byId.get(id);
      return exercise === undefined ? [] : [exercise.structuralPosition === structuralPosition ? exercise : { ...exercise, structuralPosition }];
    });
  const { beforeTour, tour, afterTour } = legacy.composition;
  // Les Points de la disposition portent l'identité de ceux du brouillon (`currentLayout`).
  const stopPoints: StopPoint[] = legacy.stopPoints.map((point) => ({
    id: (point as { readonly id?: string }).id ?? `${point.scope}-${point.position}`,
    scope: point.scope,
    position: point.position,
  }));
  return {
    ...draft,
    exercises: [...placed(beforeTour, "BEFORE_TOUR"), ...placed(tour.exercises, "IN_TOUR"), ...placed(afterTour, "AFTER_TOUR")],
    tourRepeatCount: tour.repeatCount,
    circuitNature: tour.nature,
    ...(stopPoints.length > 0 || draft.stopPoints !== undefined ? { stopPoints } : {}),
    structure: layout,
  };
}

/** Contenu qu'un nouveau conteneur peut envelopper (ARB-06 ; règles d'imbrication D-451). */
export type EnvelopeTarget = { readonly kind: "EXERCISE" | "CIRCUIT"; readonly id: string };

/**
 * Une disposition générale ne porte aucun Point d'arrêt avant B.6 (`STRUCTURE_STOP_POINTS_UNSUPPORTED`) :
 * tant qu'une Séance en a, aucun conteneur qui la ferait sortir de l'ancien modèle n'est proposé.
 */
function blockedByStopPoints(result: Layout): boolean {
  return result.stopPoints.length > 0 && legacyFromStructure(result) === null;
}

function eligibleExercise(draft: SessionDraft, id: string): boolean {
  const exercise = draft.exercises.find((item) => item.id === id);
  // Exercice formaté : poser un Circuit dessus relève d'ARB-27 (C.4), refusé sans altération d'ici là.
  return exercise !== undefined && exercise.type === "EXERCISE" && (exercise.format ?? null) === null;
}

function wrapped(layout: Layout, target: EnvelopeTarget, container: "CIRCUIT" | "CYCLE", newId: string): Layout | null {
  const circuitAround = (id: string): StructureCircuit<string> => ({ id: newId, repeatCount: 1, nature: DEFAULT_CIRCUIT_NATURE, exercises: [id] });
  let found = false;
  const elements = layout.elements.map((element): StructureElement<string> => {
    if (container === "CIRCUIT" && target.kind === "EXERCISE") {
      if (element.kind === "EXERCISE" && element.exercise === target.id) {
        found = true;
        return { kind: "CIRCUIT", circuit: circuitAround(target.id) };
      }
      if (element.kind === "CYCLE" && element.cycle.members.some((member) => member.kind === "EXERCISE" && member.exercise === target.id)) {
        found = true;
        const members = element.cycle.members.map((member): StructureCycleMember<string> =>
          member.kind === "EXERCISE" && member.exercise === target.id ? { kind: "CIRCUIT", circuit: circuitAround(target.id) } : member,
        );
        return { kind: "CYCLE", cycle: { ...element.cycle, members } };
      }
    }
    if (container === "CYCLE") {
      if (element.kind === "EXERCISE" && target.kind === "EXERCISE" && element.exercise === target.id) {
        found = true;
        return { kind: "CYCLE", cycle: { id: newId, repeatCount: CYCLE_REPEAT_COUNT_MIN, members: [element] } };
      }
      if (element.kind === "CIRCUIT" && target.kind === "CIRCUIT" && element.circuit.id === target.id) {
        found = true;
        return { kind: "CYCLE", cycle: { id: newId, repeatCount: CYCLE_REPEAT_COUNT_MIN, members: [element] } };
      }
    }
    return element;
  });
  // Un Point du niveau principal garde sa place : le nombre d'éléments ne change pas.
  return found ? { ...layout, elements } : null;
}

/** Contenus éligibles pour poser un Circuit (Exercice du niveau Séance ou d'un Cycle) ou un Cycle (Exercice ou Circuit du niveau Séance). */
export function envelopeCandidates(draft: SessionDraft, container: "CIRCUIT" | "CYCLE"): readonly EnvelopeTarget[] {
  const layout = currentLayout(draft, () => "candidate");
  const targets: EnvelopeTarget[] = [];
  for (const element of layout.elements) {
    if (element.kind === "EXERCISE" && eligibleExercise(draft, element.exercise)) {
      targets.push({ kind: "EXERCISE", id: element.exercise });
    } else if (container === "CYCLE" && element.kind === "CIRCUIT") {
      targets.push({ kind: "CIRCUIT", id: element.circuit.id });
    } else if (container === "CIRCUIT" && element.kind === "CYCLE") {
      for (const member of element.cycle.members) {
        if (member.kind === "EXERCISE" && eligibleExercise(draft, member.exercise)) {
          targets.push({ kind: "EXERCISE", id: member.exercise });
        }
      }
    }
  }
  return targets.filter((target) => {
    const result = wrapped(layout, target, container, "candidate");
    return result !== null && !blockedByStopPoints(result);
  });
}

/**
 * Pose un Circuit ou un Cycle sur un premier contenu (ARB-06) : le conteneur est créé autour de
 * lui, compte 1 (Circuit à séries groupées), jamais vide. Contenu non éligible : brouillon inchangé.
 * Les contenus suivants rejoignent le conteneur par glisser-déposer (B.4).
 */
export function wrapInContainer(
  draft: SessionDraft,
  target: EnvelopeTarget,
  container: "CIRCUIT" | "CYCLE",
  newContainerId: () => string,
): SessionDraft {
  if (!envelopeCandidates(draft, container).some((candidate) => candidate.kind === target.kind && candidate.id === target.id)) {
    return draft;
  }
  const result = wrapped(currentLayout(draft, newContainerId), target, container, newContainerId());
  return result === null ? draft : withLayout(draft, result);
}

// ---------------------------------------------------------------------------
// PRE-9 (B.4b) — enveloppe multiple et périmètre ajustable
// ---------------------------------------------------------------------------

/**
 * Périmètre d'un conteneur en cours de pose (B.4b) : contenus frères contigus d'un même parent
 * (niveau Séance, ou Cycle pour un Circuit), dans l'ordre d'affichage, au moins un. Chaque périmètre
 * désigné devient UN conteneur à la confirmation.
 */
export type EnvelopeSpan = { readonly members: readonly EnvelopeTarget[] };

/** Bord d'un périmètre, déplacé par son trait (haut ou bas). */
export type EnvelopeEdge = "TOP" | "BOTTOM";

/** Étendue atteignable d'un périmètre : suite contiguë de contenus éligibles libres, et sa place dans cette suite. */
export type EnvelopeSpanReach = {
  readonly run: readonly EnvelopeTarget[];
  readonly start: number;
  readonly end: number;
};

const sameTarget = (a: EnvelopeTarget, b: EnvelopeTarget) => a.kind === b.kind && a.id === b.id;

function nodeTarget(node: StructureElement<string> | StructureCycleMember<string>): EnvelopeTarget | null {
  switch (node.kind) {
    case "EXERCISE":
      return { kind: "EXERCISE", id: node.exercise };
    case "CIRCUIT":
      return { kind: "CIRCUIT", id: node.circuit.id };
    default:
      return null;
  }
}

/** Frères (niveau Séance, ou membres d'un Cycle) du contenu `first` ; `null` s'il est absent. */
function siblingsOf(layout: Layout, first: EnvelopeTarget): readonly (EnvelopeTarget | null)[] | null {
  const session = layout.elements.map(nodeTarget);
  if (session.some((item) => item !== null && sameTarget(item, first))) {
    return session;
  }
  for (const element of layout.elements) {
    if (element.kind === "CYCLE") {
      const members = element.cycle.members.map(nodeTarget);
      if (members.some((item) => item !== null && sameTarget(item, first))) {
        return members;
      }
    }
  }
  return null;
}

/**
 * Étendue atteignable du périmètre `span` (B.4b) : la suite contiguë, chez ses frères, des contenus
 * éligibles (`envelopeCandidates`, règles d'imbrication D-451 : pour un Circuit, des Exercices ; pour
 * un Cycle, des Exercices et des Circuits du niveau Séance) qui n'appartiennent à aucun autre
 * périmètre désigné (`others`). `null` si le périmètre n'est pas valide (vide, non contigu,
 * inéligible). Une Séance portant des Points d'arrêt ne s'étend pas au-delà du périmètre (leur suivi
 * relève de B.6, comme les déplacements B.3 / B.4).
 */
export function envelopeSpanReach(
  draft: SessionDraft,
  container: "CIRCUIT" | "CYCLE",
  span: EnvelopeSpan,
  others: readonly EnvelopeSpan[] = [],
): EnvelopeSpanReach | null {
  const first = span.members[0];
  if (first === undefined) {
    return null;
  }
  const layout = currentLayout(draft, () => "candidate");
  const siblings = siblingsOf(layout, first);
  if (siblings === null) {
    return null;
  }
  const candidates = envelopeCandidates(draft, container);
  const taken = others.filter((other) => other !== span).flatMap((other) => other.members);
  const free = (item: EnvelopeTarget | null): item is EnvelopeTarget =>
    item !== null && candidates.some((candidate) => sameTarget(candidate, item)) && !taken.some((other) => sameTarget(other, item));
  const at = siblings.findIndex((item) => item !== null && sameTarget(item, first));
  const contiguous = span.members.every((member, offset) => {
    const sibling = siblings[at + offset];
    return sibling !== undefined && free(sibling) && sameTarget(sibling, member);
  });
  if (!contiguous) {
    return null;
  }
  if (layout.stopPoints.length > 0) {
    return { run: span.members, start: 0, end: span.members.length - 1 };
  }
  let low = at;
  while (low > 0 && free(siblings[low - 1] ?? null)) low -= 1;
  let high = at + span.members.length - 1;
  while (high < siblings.length - 1 && free(siblings[high + 1] ?? null)) high += 1;
  const run = siblings.slice(low, high + 1).filter((item): item is EnvelopeTarget => item !== null);
  return { run, start: at - low, end: at - low + span.members.length - 1 };
}

/**
 * Déplace le bord `edge` du périmètre de `delta` contenus (B.4b) : vers le haut (négatif) ou le bas
 * (positif) ; un bord haut qui monte et un bord bas qui descend étendent, l'inverse réduit. Borné à
 * l'étendue atteignable (`envelopeSpanReach`) et à un contenu au moins. Même référence si rien ne change.
 */
export function adjustEnvelopeSpan(
  draft: SessionDraft,
  container: "CIRCUIT" | "CYCLE",
  span: EnvelopeSpan,
  edge: EnvelopeEdge,
  delta: number,
  others: readonly EnvelopeSpan[] = [],
): EnvelopeSpan {
  const reach = envelopeSpanReach(draft, container, span, others);
  if (reach === null || !Number.isFinite(delta)) {
    return span;
  }
  const step = Math.trunc(delta);
  const start = edge === "TOP" ? Math.max(0, Math.min(reach.start + step, reach.end)) : reach.start;
  const end = edge === "BOTTOM" ? Math.min(reach.run.length - 1, Math.max(reach.end + step, reach.start)) : reach.end;
  return start === reach.start && end === reach.end ? span : { members: reach.run.slice(start, end + 1) };
}

/**
 * Sélection multiple (B.4b) : toucher un contenu éligible libre ajoute un périmètre à un seul contenu ;
 * toucher un contenu d'un périmètre désigné retire ce périmètre. Contenu inéligible : inchangé.
 */
export function toggleEnvelopeDesignation(
  draft: SessionDraft,
  container: "CIRCUIT" | "CYCLE",
  spans: readonly EnvelopeSpan[],
  target: EnvelopeTarget,
): readonly EnvelopeSpan[] {
  const holder = spans.find((span) => span.members.some((member) => sameTarget(member, target)));
  if (holder !== undefined) {
    return spans.filter((span) => span !== holder);
  }
  const added: EnvelopeSpan = { members: [target] };
  return envelopeSpanReach(draft, container, added, spans) === null ? spans : [...spans, added];
}

/**
 * Pose (B.4b) un conteneur par périmètre désigné : « Un Circuit par Exercice » (Hermann, 31/10/2026 ;
 * chaque périmètre devient un Circuit dont ses Exercices sont les membres) ; de même un Cycle par
 * périmètre (lecture par analogie, à confirmer). Circuit : compte 1, séries groupées ; Cycle :
 * répétition 1 ; jamais vide ; règles d'imbrication D-451 respectées par l'éligibilité. Brouillon
 * inchangé si un périmètre est invalide ou chevauche un autre, ou si le résultat ferait sortir de
 * l'ancien modèle une Séance portant des Points d'arrêt (B.6) ; un périmètre de plusieurs contenus
 * n'est pas posé dans une Séance à Points d'arrêt.
 */
export function wrapSpansInContainers(
  draft: SessionDraft,
  spans: readonly EnvelopeSpan[],
  container: "CIRCUIT" | "CYCLE",
  newContainerId: () => string,
): SessionDraft {
  if (draft.structure === undefined && spans.length > 0) {
    // Brouillon de l'ancien modèle jamais enregistré : son Circuit n'a pas d'identifiant stable. Sa
    // disposition lui est d'abord donnée ; un Circuit désigné est celui qu'elle porte (au plus un).
    const seeded = withLayout(draft, currentLayout(draft, newContainerId));
    const legacyCircuit = seeded.structure === undefined ? undefined : structureCircuits(seeded.structure)[0];
    const remapped = spans.map((span) => ({
      members: span.members.map((member) => (member.kind === "CIRCUIT" && legacyCircuit !== undefined ? { kind: "CIRCUIT" as const, id: legacyCircuit.id } : member)),
    }));
    const next = wrapSpansInContainers(seeded, remapped, container, newContainerId);
    return next === seeded ? draft : next;
  }
  if (spans.length === 0 || spans.some((span) => envelopeSpanReach(draft, container, span, spans) === null)) {
    return draft;
  }
  const layout = currentLayout(draft, newContainerId);
  if (layout.stopPoints.length > 0 && spans.some((span) => span.members.length > 1)) {
    return draft;
  }
  const spanStartingAt = (node: StructureElement<string> | StructureCycleMember<string>) => {
    const content = nodeTarget(node);
    return content === null ? undefined : spans.find((span) => sameTarget(span.members[0]!, content));
  };
  /** Regroupe, dans une suite de frères, chaque périmètre en un nœud produit par `make`. */
  const group = <N extends StructureElement<string> | StructureCycleMember<string>>(
    nodes: readonly N[],
    make: (members: readonly N[]) => N,
  ): N[] => {
    const result: N[] = [];
    for (let index = 0; index < nodes.length; index += 1) {
      const span = spanStartingAt(nodes[index]!);
      if (span === undefined) {
        result.push(nodes[index]!);
        continue;
      }
      result.push(make(nodes.slice(index, index + span.members.length)));
      index += span.members.length - 1;
    }
    return result;
  };
  const circuitOf = (members: readonly (StructureElement<string> | StructureCycleMember<string>)[]): StructureCircuit<string> => ({
    id: newContainerId(),
    repeatCount: 1,
    nature: DEFAULT_CIRCUIT_NATURE,
    exercises: members.flatMap((member) => (member.kind === "EXERCISE" ? [member.exercise] : [])),
  });
  const elements =
    container === "CIRCUIT"
      ? group(layout.elements, (members): StructureElement<string> => ({ kind: "CIRCUIT", circuit: circuitOf(members) })).map(
          (element): StructureElement<string> =>
            element.kind === "CYCLE"
              ? {
                  kind: "CYCLE",
                  cycle: {
                    ...element.cycle,
                    members: group(element.cycle.members, (members): StructureCycleMember<string> => ({ kind: "CIRCUIT", circuit: circuitOf(members) })),
                  },
                }
              : element,
        )
      : group(layout.elements, (members): StructureElement<string> => ({
          kind: "CYCLE",
          cycle: {
            id: newContainerId(),
            repeatCount: CYCLE_REPEAT_COUNT_MIN,
            members: members.flatMap((member): StructureCycleMember<string>[] =>
              member.kind === "EXERCISE" ? [{ kind: "EXERCISE", exercise: member.exercise }] : member.kind === "CIRCUIT" ? [member] : [],
            ),
          },
        }));
  const result: Layout = { ...layout, elements };
  return blockedByStopPoints(result) ? draft : withLayout(draft, result);
}

/**
 * ARB-07 : un nouvel Exercice est inséré après le dernier Exercice entré, dans son conteneur ; sans
 * repère (ou repère absent), à la fin du niveau principal. Disposition générale seulement : dans
 * l'ancien modèle, l'insertion existante s'applique.
 */
export function insertExerciseInLayout(draft: SessionDraft, exercise: SessionDraftExercise, afterExerciseId: string | null): SessionDraft {
  const layout = draft.structure;
  if (layout === undefined || legacyFromStructure(layout) !== null) {
    return { ...draft, exercises: [...draft.exercises, exercise] };
  }
  let placed = false;
  const inCircuit = (circuit: StructureCircuit<string>): StructureCircuit<string> => {
    const index = placed || afterExerciseId === null ? -1 : circuit.exercises.indexOf(afterExerciseId);
    if (index < 0) {
      return circuit;
    }
    placed = true;
    return { ...circuit, exercises: [...circuit.exercises.slice(0, index + 1), exercise.id, ...circuit.exercises.slice(index + 1)] };
  };
  const elements: StructureElement<string>[] = [];
  for (const element of layout.elements) {
    if (element.kind === "CIRCUIT") {
      elements.push({ kind: "CIRCUIT", circuit: inCircuit(element.circuit) });
    } else if (element.kind === "CYCLE") {
      const members: StructureCycleMember<string>[] = [];
      for (const member of element.cycle.members) {
        if (member.kind === "CIRCUIT") {
          members.push({ kind: "CIRCUIT", circuit: inCircuit(member.circuit) });
        } else {
          members.push(member);
          if (!placed && member.exercise === afterExerciseId) {
            placed = true;
            members.push({ kind: "EXERCISE", exercise: exercise.id });
          }
        }
      }
      elements.push({ kind: "CYCLE", cycle: { ...element.cycle, members } });
    } else {
      elements.push(element);
      if (!placed && element.exercise === afterExerciseId) {
        placed = true;
        elements.push({ kind: "EXERCISE", exercise: exercise.id });
      }
    }
  }
  if (!placed) {
    elements.push({ kind: "EXERCISE", exercise: exercise.id });
  }
  return { ...draft, exercises: [...draft.exercises, exercise], structure: { ...layout, elements } };
}

// ---------------------------------------------------------------------------
// PRE-9 (B.3) — entrée et sortie d'un Circuit de la disposition générale
// ---------------------------------------------------------------------------

/** Circuit de la disposition qui contient l'Exercice `exerciseId` (Cycles compris), s'il existe. */
export function circuitOfExercise(layout: Pick<Layout, "elements"> | undefined, exerciseId: string): StructureCircuit<string> | undefined {
  return layout === undefined ? undefined : structureCircuits(layout).find((circuit) => circuit.exercises.includes(exerciseId));
}

/** Réglage de l'appartenance aux Circuits après une opération de Composition (voir `settleLayoutCircuitMembership`). */
export type LayoutCircuitMembershipSettlement = {
  /** Occurrences après adaptation ; `next.exercises` lui-même si aucune n'est adaptée. */
  readonly exercises: readonly SessionDraftExercise[];
  /** Pertes des Exercices entrants, sur leur état avant adaptation ; vide = aucune confirmation. */
  readonly losses: readonly CircuitLoss[];
  /** N du Circuit alterné de la première perte (texte du dialogue) ; 0 sans perte. */
  readonly targetCount: number;
  /** Exercices formatés entrés dans un Circuit qui ne les admet pas sans altération : opération à refuser. */
  readonly refusedExerciseIds: readonly string[];
  /** Réserve du brouillon, présente (éventuellement `undefined`) si une sortie l'a modifiée. */
  readonly reservePatch: Pick<SessionDraft, "circuitSeriesReserve"> | Record<string, never>;
};

/**
 * PRE-9 (B.3, COMP §6, ch10 « Ajout et sortie du circuit », D-07, D-09, §2.4) — même règle que
 * `settleCircuitMembership` (ancien modèle), appliquée à chaque Circuit d'une disposition générale :
 * compare l'appartenance de chaque Exercice avant (`previous.structure`) et après (`next.structure`).
 * - Un Exercice qui ENTRE dans un Circuit alterné (nouveau, ou venu d'ailleurs, y compris d'un autre
 *   Circuit) est adapté au N de ce Circuit (`adaptExercise`, sans réserve : une troncature confirmée
 *   est définitive) ; ses pertes sont rendues pour confirmation AVANT toute écriture. Dans un Circuit
 *   groupé, il est inchangé (D-08 : séries intrinsèques non modifiées).
 * - Un Exercice qui QUITTE son Circuit (ou est retiré) perd son entrée de réserve ; son nombre actif et
 *   ses paramètres sont conservés, sans message.
 * - Un Exercice formaté qui entre dans un Circuit ne l'admettant pas sans altération
 *   (`formattedMemberFits`) est signalé dans `refusedExerciseIds` : l'appelant refuse l'opération.
 * Fonction pure : rien n'est écrit ; l'appelant applique `exercises` et `reservePatch` avec la
 * structure produite par son opération.
 */
export function settleLayoutCircuitMembership(
  previous: Pick<SessionDraft, "exercises" | "structure" | "circuitSeriesReserve">,
  next: Pick<SessionDraft, "exercises" | "structure">,
): LayoutCircuitMembershipSettlement {
  const previousIds = new Set(previous.exercises.map((exercise) => exercise.id));
  const previousCircuitId = (id: string) => (previousIds.has(id) ? circuitOfExercise(previous.structure, id)?.id : undefined);
  const nextIds = new Set(next.exercises.map((exercise) => exercise.id));

  let reserve = previous.circuitSeriesReserve;
  let reserveChanged = false;
  for (const exercise of previous.exercises) {
    const before = previousCircuitId(exercise.id);
    if (before === undefined || reserve?.[exercise.id] === undefined) {
      continue;
    }
    const after = nextIds.has(exercise.id) ? circuitOfExercise(next.structure, exercise.id)?.id : undefined;
    if (after !== before) {
      const { [exercise.id]: _removed, ...rest } = reserve;
      reserve = rest;
      reserveChanged = true;
    }
  }

  const losses: CircuitLoss[] = [];
  const refusedExerciseIds: string[] = [];
  let targetCount = 0;
  let changed = false;
  const exercises = next.exercises.map((exercise) => {
    const circuit = circuitOfExercise(next.structure, exercise.id);
    if (circuit === undefined || exercise.type !== "EXERCISE" || previousCircuitId(exercise.id) === circuit.id) {
      return exercise;
    }
    if (!formattedMemberFits(exercise, circuit.nature, circuit.repeatCount)) {
      refusedExerciseIds.push(exercise.id);
      return exercise;
    }
    if (circuit.nature !== "SERIES") {
      return exercise;
    }
    const lost = lostSeriesCount(exercise, circuit.repeatCount);
    if (lost > 0) {
      if (losses.length === 0) {
        targetCount = circuit.repeatCount;
      }
      losses.push({ occurrenceId: exercise.id, lostSeriesCount: lost });
    }
    const adapted = adaptExercise(exercise, circuit.repeatCount, []).exercise;
    changed ||= adapted !== exercise;
    return adapted;
  });

  return {
    exercises: changed ? exercises : next.exercises,
    losses,
    targetCount,
    refusedExerciseIds,
    reservePatch: reserveChanged
      ? { circuitSeriesReserve: reserve === undefined || Object.keys(reserve).length === 0 ? undefined : reserve }
      : {},
  };
}

/** Issue d'un déplacement d'Exercice vers un Circuit (`moveExerciseToCircuit`). */
export type LayoutMoveOutcome =
  | { readonly status: "APPLIED"; readonly draft: SessionDraft }
  /** Des valeurs seraient perdues (D-09) : `draft` est à écrire après « Confirmer » ; « Annuler » garde l'entrée. */
  | { readonly status: "CONFIRMATION_REQUIRED"; readonly losses: readonly CircuitLoss[]; readonly targetCount: number; readonly draft: SessionDraft }
  | { readonly status: "REFUSED"; readonly reason: "NOT_FOUND" | "FORMAT_INCOMPATIBLE" | "STOP_POINTS" };

/**
 * PRE-9 (B.3, COMP §6 : « Le déplacement d'un exercice vers un circuit alterné respecte le N commun
 * […] confirmation en cas de perte, Annuler conserve emplacement et données d'origine, Confirmer
 * réalise déplacement et adaptation ensemble. Sans perte, les règles existantes d'adaptation
 * s'appliquent. La disparition du conteneur source vidé appartient à l'application effective du
 * déplacement » ; ch10 « Ajout et sortie du circuit » ; D-07, D-09, §2.4) — opération de domaine du
 * déplacement d'un Exercice, depuis n'importe quel niveau (Séance, Cycle, autre Circuit), au rang
 * `index` (borné) du Circuit `circuitId`. Le geste (glisser-déposer) appartient à B.4.
 *
 * Rien n'est muté : l'issue porte le brouillon à écrire (`APPLIED`, ou `CONFIRMATION_REQUIRED`, à
 * écrire seulement après « Confirmer »). Dans le même Circuit : réordonnancement simple, sans
 * adaptation. Refus sans altération : Exercice ou Circuit inconnu ; Exercice formaté que le Circuit
 * n'admet pas sans altération (D-05, matrice §2.2 ; adaptation de ses réglages : C.4) ; Séance
 * portant des Points d'arrêt (leur suivi lors d'un déplacement relève de B.4 / B.6).
 */
export function moveExerciseToCircuit(
  draft: SessionDraft,
  exerciseId: string,
  circuitId: string,
  index: number,
  newContainerId: () => string,
): LayoutMoveOutcome {
  const layout = currentLayout(draft, newContainerId);
  const exercise = draft.exercises.find((item) => item.id === exerciseId);
  const target = structureCircuits(layout).find((circuit) => circuit.id === circuitId);
  if (exercise === undefined || target === undefined || !structureExercises(layout).includes(exerciseId)) {
    return { status: "REFUSED", reason: "NOT_FOUND" };
  }
  // Les Points d'arrêt suivent un déplacement avec B.4 / B.6 (ARB-02a/b) : refus sans altération d'ici là.
  if (layout.stopPoints.length > 0) {
    return { status: "REFUSED", reason: "STOP_POINTS" };
  }
  const without = (ids: readonly string[]) => ids.filter((id) => id !== exerciseId);
  const remaining = without(target.exercises);
  const at = Math.max(0, Math.min(Number.isFinite(index) ? Math.trunc(index) : remaining.length, remaining.length));
  const placeIn = (circuit: StructureCircuit<string>): StructureCircuit<string> | null => {
    if (circuit.id === circuitId) {
      return { ...circuit, exercises: [...remaining.slice(0, at), exerciseId, ...remaining.slice(at)] };
    }
    const exercises = without(circuit.exercises);
    // COMP §1 : un conteneur disparaît lorsque son dernier membre en sort.
    return exercises.length === 0 ? null : exercises.length === circuit.exercises.length ? circuit : { ...circuit, exercises };
  };
  const elements: StructureElement<string>[] = [];
  for (const element of layout.elements) {
    switch (element.kind) {
      case "EXERCISE":
        if (element.exercise !== exerciseId) {
          elements.push(element);
        }
        break;
      case "CIRCUIT": {
        const circuit = placeIn(element.circuit);
        if (circuit !== null) {
          elements.push(circuit === element.circuit ? element : { kind: "CIRCUIT", circuit });
        }
        break;
      }
      case "CYCLE": {
        const members = element.cycle.members.flatMap((member): StructureCycleMember<string>[] => {
          if (member.kind === "EXERCISE") {
            return member.exercise === exerciseId ? [] : [member];
          }
          const circuit = placeIn(member.circuit);
          return circuit === null ? [] : [circuit === member.circuit ? member : { kind: "CIRCUIT", circuit }];
        });
        if (members.length > 0) {
          elements.push({ kind: "CYCLE", cycle: { ...element.cycle, members } });
        }
        break;
      }
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  }
  const moved: Layout = { ...layout, elements };
  const settlement = settleLayoutCircuitMembership({ ...draft, structure: layout }, { exercises: draft.exercises, structure: moved });
  if (settlement.refusedExerciseIds.length > 0) {
    return { status: "REFUSED", reason: "FORMAT_INCOMPATIBLE" };
  }
  const result = withLayout({ ...draft, exercises: settlement.exercises, ...settlement.reservePatch }, moved);
  return settlement.losses.length > 0
    ? { status: "CONFIRMATION_REQUIRED", losses: settlement.losses, targetCount: settlement.targetCount, draft: result }
    : { status: "APPLIED", draft: result };
}
