/**
 * PRE-9 (story B.4, COMP §6 G1–G8, ARB-06, ARB-09, D-451) — résolution de la destination d'un
 * glisser dans une disposition générale, à partir des boîtes mesurées des éléments rendus.
 *
 * Repère : le contenu défilant de la Composition (ordonnées absolues dans ce contenu). Les boîtes
 * sont celles de la mise en page (les translations de l'aperçu ne les changent pas) : chaque
 * emplacement admis pour l'élément saisi (D-451 : un Exercice partout ; un Circuit au niveau Séance
 * et dans un Cycle ; un Cycle au niveau Séance) reçoit une ordonnée — entre deux membres, sous
 * l'en-tête d'un conteneur (tête), sous son dernier membre (fin) —, et la destination est
 * l'emplacement le plus proche du point de saisie. Un Circuit replié (cartes non rendues) n'offre que
 * sa fin, au milieu de sa boîte. L'élément saisi et son contenu ne sont jamais des destinations ; les
 * rangs sont comptés sans lui (convention de `moveLayoutItem`).
 *
 * [B.4 : « Pendant le glisser la mise en page reste figée (aucun décalage des voisins) » — remplacé
 * par la recette iPhone n° 2 du 31/10/2026 (Hermann : « le comportement tel qu'il a été défini
 * initialement […] : déplacement des bords des circuits / cycle et déplacement des cartes pour faire
 * la place à la carte déplacée ») :] chaque emplacement porte aussi son seuil d'insertion (`insertY` :
 * ce qui est à cette ordonnée ou plus bas descend pour faire la place) et le haut que l'élément
 * déposé y occupera (`insertTop`), lus par l'aperçu (`layoutDragShifts.ts`).
 *
 * Recette iPhone n° 2 du 31/10/2026 (b6-deplacer) : un rang qui porte des Points d'arrêt offre deux
 * emplacements à un élément saisi — avant eux et après eux (`afterStopPoints`, `LayoutDropStopPoint`).
 *
 * Fonctions pures.
 */

import type { CircuitRole } from "@/domain/sessions/formats/carriers";
import { circuitAtMemberLimit, circuitAtMemberMinimum } from "@/domain/sessions/circuitMemberLimit";
import { breaksFixedPassage, type LayoutContainerRef, type LayoutDestination, type LayoutItemRef } from "@/domain/sessions/layoutMoves";
import {
  mapStructure,
  structureCircuits,
  type SessionStructure,
  type StructureCircuit,
  type StructureCycleMember,
  type StructureElement,
  type StructureStopPointLocation,
} from "@/domain/sessions/structure";

/** Boîte verticale mesurée, dans le repère du contenu défilant. */
export type LayoutBox = { readonly top: number; readonly height: number };

/** Clé de la boîte d'un élément (bloc entier : carte, Circuit, Cycle). */
export function layoutItemKey(item: LayoutItemRef): string {
  return `item:${item.kind}:${item.id}`;
}

/** Clé de la boîte de l'en-tête d'un conteneur. */
export function layoutHeaderKey(kind: "CIRCUIT" | "CYCLE", id: string): string {
  return `header:${kind}:${id}`;
}

/** PRE-9 B.6 : clé de la boîte mesurée de la rangée d'un Point d'arrêt (point de saisie du glisser). */
export function layoutStopBoxKey(stopPointId: string): string {
  return `stop:${stopPointId}`;
}

/**
 * Destination résolue : rang (sans l'élément saisi) dans son conteneur, ordonnée de l'emplacement
 * (`lineY`, distance au point de saisie), seuil d'insertion (`insertY`) et haut de l'élément déposé
 * (`insertTop`), dans la mise en page d'origine.
 */
export type LayoutDropTarget = LayoutDestination & { readonly lineY: number; readonly insertY: number; readonly insertTop: number };

/** Écart vertical entre le bord d'un membre et l'ordonnée d'emplacement qui le borde (tête ou fin). */
export const LAYOUT_DROP_EDGE_INSET = 4;

/** Écart entre deux membres d'un conteneur (place ouverte par l'aperçu) ; 0 par défaut. */
export type LayoutGapOf = (container: LayoutContainerRef) => number;
const NO_GAP: LayoutGapOf = () => 0;

type Shape<E> = Pick<SessionStructure<E, StructureStopPointLocation>, "elements">;

type Member = { readonly item: LayoutItemRef; readonly circuit?: StructureCircuit<string> };

function elementMember<E>(element: StructureElement<E> | StructureCycleMember<E>, idOf: (exercise: E) => string): Member {
  switch (element.kind) {
    case "EXERCISE":
      return { item: { kind: "EXERCISE", id: idOf(element.exercise) } };
    case "CIRCUIT":
      return {
        item: { kind: "CIRCUIT", id: element.circuit.id },
        circuit: { ...element.circuit, exercises: element.circuit.exercises.map(idOf) },
      };
    case "CYCLE":
      return { item: { kind: "CYCLE", id: element.cycle.id } };
    default: {
      const unreachable: never = element;
      return unreachable;
    }
  }
}

const sameItem = (a: LayoutItemRef, b: LayoutItemRef) => a.kind === b.kind && a.id === b.id;
const sameContainer = (a: LayoutContainerRef, b: LayoutContainerRef) =>
  a.kind === b.kind && (a.kind === "SESSION" || (b.kind !== "SESSION" && a.id === b.id));

/**
 * Recette iPhone n° 2 du 31/10/2026 (b6-deplacer) : Point d'arrêt de la disposition (conteneur, rang
 * AVEC la source, identifiant de sa rangée mesurée) — un rang qui porte des Points offre deux
 * emplacements à un Exercice, un Circuit ou un Cycle saisi : avant eux et après eux (`afterStopPoints`).
 */
export type LayoutDropStopPoint = { readonly container: LayoutContainerRef; readonly position: number; readonly id: string };

/**
 * Emplacements admis pour `source` avec leur ordonnée (voir l'en-tête). Un emplacement dont une
 * mesure manque est omis. `gapOf` : écart des membres de chaque conteneur (haut de l'élément déposé).
 *
 * Recette iPhone n° 3 du 03/11/2026 (Hermann : « La carte d'exercice Buy-In ne doit pas pouvoir être
 * déplacée dans le circuit ») : `singlePassage` (Exercice « Passage = Une fois ») — les emplacements
 * que `breaksFixedPassage` interdit (buy-in hors tête, buy-out hors fin de leur Circuit porteur, toute
 * carte avant le buy-in ou après le buy-out) ne sont pas offerts : l'aperçu n'y ouvre aucune place.
 *
 * Recette du 08/11/2026 au soir (Hermann : « Superset : il est possible dans le circuit de la composition de séance
 * d'ajouter un troisième exercice, ça ne doit pas être autorisé. ») : un Circuit qui a atteint son nombre maximal de
 * membres (`circuitAtMemberLimit` : Superset à deux) n'offre aucun emplacement à un Exercice venu d'ailleurs — ses
 * propres membres s'y réordonnent toujours. Un Point d'arrêt saisi (repère fictif, absent de la disposition) n'est pas
 * concerné. Réponse de Hermann du 08/11/2026 (« Superset : dans la composition on limite à deux exercices aussi. ») :
 * un membre d'un Superset à son minimum (deux) n'a d'emplacements que dans ce Superset.
 */
export function layoutDropCandidates<E>(
  layout: Shape<E>,
  source: LayoutItemRef,
  boxes: ReadonlyMap<string, LayoutBox>,
  idOf: (exercise: E) => string,
  gapOf: LayoutGapOf = NO_GAP,
  stopPoints: readonly LayoutDropStopPoint[] = [],
  singlePassage?: (exercise: E) => boolean,
  /**
   * Recette iPhone du 07/11/2026 (f4-role, KO, Hermann : « Deux Buy In ou Buy out : on doit pouvoir les déplacer pour inverser
   * l'ordre des buy in ou l'ordre des buy out. ») — Rôle d'un membre de Circuit porteur : l'aperçu offre les mêmes places que
   * le déplacement appliqué (`moveLayoutItem`, MAJ 04/11/2026 §6 bis 2 : réordonnancement à l'intérieur d'une zone). Sans
   * `roleOf`, règle positionnelle d'origine.
   */
  roleOf?: (exercise: E, index: number) => CircuitRole,
): readonly LayoutDropTarget[] {
  const candidates: LayoutDropTarget[] = [];
  const bottom = (box: LayoutBox) => box.top + box.height;

  /**
   * Recette iPhone n° 2 du 31/10/2026 (b6-deplacer) : boîtes des Points d'arrêt du rang `index` (rangs
   * comptés sans la source) du conteneur, dans l'ordre ; `null` si l'une n'est pas mesurée.
   */
  const pointBoxesAt = (container: LayoutContainerRef, sourceIndex: number, index: number): LayoutBox[] | null => {
    const boxesAt: LayoutBox[] = [];
    for (const point of stopPoints) {
      if (!sameContainer(point.container, container)) continue;
      const rank = sourceIndex >= 0 && point.position > sourceIndex ? point.position - 1 : point.position;
      if (rank !== index) continue;
      const box = boxes.get(layoutStopBoxKey(point.id));
      if (box === undefined) return null;
      boxesAt.push(box);
    }
    return boxesAt.sort((a, b) => a.top - b.top);
  };

  /** Rangs d'une suite de membres (sans la source) ; `head` : ordonnée de tête si le conteneur a un en-tête. */
  const sequence = (container: LayoutContainerRef, members: readonly Member[], head: number | null, end: number | null) => {
    const sourceIndex = members.findIndex((member) => sameItem(member.item, source));
    const kept = members.filter((member) => !sameItem(member.item, source));
    const measured = kept.map((member) => boxes.get(layoutItemKey(member.item)));
    if (measured.some((box) => box === undefined)) return false;
    const list = measured as LayoutBox[];
    const gap = gapOf(container);
    // Haut du contenu sous l'en-tête (tête du conteneur).
    const headTop = head === null ? null : head - LAYOUT_DROP_EDGE_INSET + gap;
    for (let index = 0; index <= list.length; index += 1) {
      const before = list[index - 1];
      const after = list[index];
      // Recette n° 2 : Points d'arrêt de ce rang — l'emplacement « avant eux » est au-dessus du
      // premier, un second emplacement « après eux » sous le dernier.
      const points = pointBoxesAt(container, sourceIndex, index) ?? [];
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      const below = firstPoint ?? after;
      const lineY =
        before !== undefined && below !== undefined
          ? (bottom(before) + below.top) / 2
          : below !== undefined
            ? (head ?? below.top - 2 * LAYOUT_DROP_EDGE_INSET)
            : before !== undefined
              ? (end ?? bottom(before) + 2 * LAYOUT_DROP_EDGE_INSET)
              : head;
      if (lineY !== null && lineY !== undefined) {
        // Insertion juste après le membre qui précède (avant les Points d'arrêt de ce rang, convention
        // de `stopPointsAfterInsertion`), sinon en tête du conteneur.
        const insertY = before !== undefined ? bottom(before) + 0.5 : below !== undefined && head === null ? below.top - 0.5 : lineY;
        const insertTop = before !== undefined ? bottom(before) + gap : (headTop ?? below?.top ?? lineY);
        candidates.push({ container, index, lineY, insertY, insertTop });
      }
      if (lastPoint !== undefined) {
        const afterLineY = after !== undefined ? (bottom(lastPoint) + after.top) / 2 : bottom(lastPoint) + 2 * LAYOUT_DROP_EDGE_INSET;
        candidates.push({
          container,
          index,
          afterStopPoints: true,
          lineY: afterLineY,
          insertY: bottom(lastPoint) + 0.5,
          insertTop: bottom(lastPoint) + gap,
        });
      }
    }
    return true;
  };

  const circuitCandidates = (circuit: StructureCircuit<string>) => {
    if (source.kind !== "EXERCISE") return;
    const header = boxes.get(layoutHeaderKey("CIRCUIT", circuit.id));
    const block = boxes.get(layoutItemKey({ kind: "CIRCUIT", id: circuit.id }));
    const head = header === undefined ? null : bottom(header) + LAYOUT_DROP_EDGE_INSET;
    const members = circuit.exercises.map((id): Member => ({ item: { kind: "EXERCISE", id } }));
    const cards = members.filter((member) => !sameItem(member.item, source));
    const allMeasured = cards.length > 0 && cards.every((member) => boxes.has(layoutItemKey(member.item)));
    const container: LayoutContainerRef = { kind: "CIRCUIT", id: circuit.id };
    // Contre-recette n° 3 du 31/10/2026 (b6-deplacer, Circuit) : l'élément saisi est le seul membre d'un
    // Circuit déployé qui porte des Points d'arrêt (`[P, E]`, E saisi) — ses emplacements « avant les
    // Points » et « après les Points » sont offerts comme dans un Cycle (en-tête mesuré) ; sans eux,
    // « monter E au-dessus du Point » le sortait du Circuit. Sans Point : fin seulement (inchangé).
    const soleSourceWithPoints =
      cards.length === 0 &&
      members.length > 0 &&
      head !== null &&
      boxes.has(layoutItemKey(source)) &&
      stopPoints.some((point) => sameContainer(point.container, container));
    if (allMeasured) {
      const last = boxes.get(layoutItemKey(cards[cards.length - 1]!.item))!;
      sequence(container, members, head, bottom(last) + LAYOUT_DROP_EDGE_INSET);
    } else if (soleSourceWithPoints) {
      sequence(container, members, head, null);
    } else if (block !== undefined) {
      // Circuit replié (ou vidé par la saisie) : sa fin seulement, au milieu de sa boîte ; la place
      // s'ouvre au bas du Circuit.
      candidates.push({
        container,
        index: cards.length,
        lineY: block.top + block.height / 2,
        insertY: bottom(block) - 0.5,
        insertTop: bottom(block),
      });
    }
  };

  // Niveau Séance.
  const top = layout.elements.map((element) => elementMember(element, idOf));
  sequence({ kind: "SESSION" }, top, null, null);

  for (const [at, element] of layout.elements.entries()) {
    const member = top[at]!;
    if (sameItem(member.item, source)) continue;
    if (element.kind === "CIRCUIT") circuitCandidates(member.circuit!);
    if (element.kind === "CYCLE" && source.kind !== "CYCLE") {
      const header = boxes.get(layoutHeaderKey("CYCLE", element.cycle.id));
      const members = element.cycle.members.map((cycleMember) => elementMember(cycleMember, idOf));
      const kept = members.filter((cycleMember) => !sameItem(cycleMember.item, source));
      const last = kept.length === 0 ? undefined : boxes.get(layoutItemKey(kept[kept.length - 1]!.item));
      sequence(
        { kind: "CYCLE", id: element.cycle.id },
        members,
        header === undefined ? null : bottom(header) + LAYOUT_DROP_EDGE_INSET,
        last === undefined ? null : bottom(last) + LAYOUT_DROP_EDGE_INSET,
      );
      for (const cycleMember of members) {
        if (cycleMember.circuit !== undefined && !sameItem(cycleMember.item, source)) circuitCandidates(cycleMember.circuit);
      }
    }
  }
  const admitted = withoutFullCircuits(layout, source, idOf, candidates);
  if (singlePassage === undefined) return spreadDropLines(admitted);
  const fixed = new Set<string>();
  const byId = new Map<string, E>();
  const ids = mapStructure({ elements: layout.elements, stopPoints: [] }, (exercise) => {
    const id = idOf(exercise);
    byId.set(id, exercise);
    if (singlePassage(exercise)) fixed.add(id);
    return id;
  });
  if (fixed.size === 0) return admitted;
  const rolesOf =
    roleOf === undefined
      ? undefined
      : (id: string, index: number): CircuitRole => {
          const exercise = byId.get(id);
          return exercise === undefined ? "TOUR" : roleOf(exercise, index);
        };
  return spreadDropLines(admitted.filter((candidate) => !breaksFixedPassage(ids, (id) => fixed.has(id), source, candidate, rolesOf)));
}

/**
 * Recette du 08/11/2026 au soir (Hermann : « je ne peux pas positionner un exercice dans un cycle devant circuit » ; « si je
 * positionne un exercice à la dernière place d'un cycle […] au relâchement l'exercice se positionne à la dernière place du
 * circuit » ; « l'exercice est sorti du circuit et est tombé dans un autre circuit en dessous ») — défaut antérieur, reproduit
 * sur la version de la recette validée `e369c1ae` : au bas d'un Circuit (ou d'un Cycle), les repères « fin du Circuit », « après
 * le Circuit » et « fin du Cycle » n'étaient séparés que par sa marge basse (4 à 12) ; l'emplacement le plus proche du centre de
 * la carte (`nearestLayoutDrop`) ne tombait presque jamais sur celui du milieu. Écart minimal entre deux repères voisins, en
 * points : choix technique (un tiers de la carte de 72), à confirmer sur iPhone.
 */
export const LAYOUT_DROP_MIN_LINE_SPACING = 24;

/**
 * Repères (`lineY`) écartés d'au moins `LAYOUT_DROP_MIN_LINE_SPACING` : chaque grappe de repères trop proches est étalée
 * régulièrement autour de son centre, dans le même ordre, jusqu'à stabilité. Seule la sélection change : seuils d'insertion
 * (`insertY`) et places (`insertTop`) restent ceux de la mise en page.
 */
export function spreadDropLines(candidates: readonly LayoutDropTarget[], spacing: number = LAYOUT_DROP_MIN_LINE_SPACING): readonly LayoutDropTarget[] {
  if (candidates.length < 2) return candidates;
  const order = candidates.map((candidate, index) => ({ index, y: candidate.lineY })).sort((a, b) => a.y - b.y || a.index - b.index);
  for (let pass = 0; pass < candidates.length; pass += 1) {
    let changed = false;
    let start = 0;
    while (start < order.length) {
      let end = start;
      while (end + 1 < order.length && order[end + 1]!.y - order[end]!.y < spacing - 1e-6) end += 1;
      if (end > start) {
        const center = (order[start]!.y + order[end]!.y) / 2;
        const first = center - ((end - start) * spacing) / 2;
        for (let at = start; at <= end; at += 1) {
          const y = first + (at - start) * spacing;
          if (Math.abs(order[at]!.y - y) > 1e-6) changed = true;
          order[at]!.y = y;
        }
      }
      start = end + 1;
    }
    if (!changed) break;
  }
  const spread = candidates.slice();
  for (const { index, y } of order) if (y !== candidates[index]!.lineY) spread[index] = { ...candidates[index]!, lineY: y };
  return spread;
}

/**
 * Recette du 08/11/2026 au soir (Superset limité) : emplacements `candidates` sans ceux des Circuits pleins dont
 * `source` n'est pas membre. Seul un Exercice de la disposition est concerné (un Point d'arrêt saisi n'en est pas un).
 */
function withoutFullCircuits<E>(layout: Shape<E>, source: LayoutItemRef, idOf: (exercise: E) => string, candidates: readonly LayoutDropTarget[]): readonly LayoutDropTarget[] {
  if (source.kind !== "EXERCISE") return candidates;
  const circuits = structureCircuits(layout);
  let isPresent = layout.elements.some((element) => element.kind === "EXERCISE" && idOf(element.exercise) === source.id);
  const full = new Set<string>();
  /** Réponse de Hermann du 08/11/2026 : Superset à deux dont `source` est membre — elle n'en sort pas. */
  let held: string | null = null;
  for (const circuit of circuits) {
    const ids = circuit.exercises.map(idOf);
    isPresent ||= ids.includes(source.id);
    if (!ids.includes(source.id) && circuitAtMemberLimit(circuit)) full.add(circuit.id);
    if (ids.includes(source.id) && circuitAtMemberMinimum(circuit)) held = circuit.id;
  }
  for (const element of layout.elements) {
    if (element.kind === "CYCLE") isPresent ||= element.cycle.members.some((member) => member.kind === "EXERCISE" && idOf(member.exercise) === source.id);
  }
  if (!isPresent) return candidates;
  // Réponse de Hermann du 08/11/2026 (« Superset : dans la composition on limite à deux exercices aussi. ») : un membre
  // d'un Superset à deux ne se voit offrir que les emplacements de ce Superset (réordonnancement) ; lâchée ailleurs, la
  // carte revient dans le Superset, à sa place ou à l'emplacement le plus proche.
  if (held !== null) {
    const heldId = held;
    return candidates.filter((candidate) => candidate.container.kind === "CIRCUIT" && candidate.container.id === heldId);
  }
  if (full.size === 0) return candidates;
  return candidates.filter((candidate) => candidate.container.kind !== "CIRCUIT" || !full.has(candidate.container.id));
}

/** Emplacement admis le plus proche de `pointerY` (à égalité, le premier dans l'ordre de recherche). */
export function resolveLayoutDrop<E>(
  layout: Shape<E>,
  source: LayoutItemRef,
  pointerY: number,
  boxes: ReadonlyMap<string, LayoutBox>,
  idOf: (exercise: E) => string,
  gapOf: LayoutGapOf = NO_GAP,
  stopPoints: readonly LayoutDropStopPoint[] = [],
  singlePassage?: (exercise: E) => boolean,
  roleOf?: (exercise: E, index: number) => CircuitRole,
): LayoutDropTarget | null {
  return nearestLayoutDrop(layoutDropCandidates(layout, source, boxes, idOf, gapOf, stopPoints, singlePassage, roleOf), pointerY);
}

/** Emplacement le plus proche de `pointerY` parmi `candidates` (à égalité, le premier). */
export function nearestLayoutDrop(candidates: readonly LayoutDropTarget[], pointerY: number): LayoutDropTarget | null {
  let best: LayoutDropTarget | null = null;
  for (const candidate of candidates) {
    if (best === null || Math.abs(candidate.lineY - pointerY) < Math.abs(best.lineY - pointerY)) best = candidate;
  }
  return best;
}

/** Même destination (conteneur et rang). */
export function sameLayoutDrop(a: LayoutDestination | null, b: LayoutDestination | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.index !== b.index || a.container.kind !== b.container.kind || (a.afterStopPoints === true) !== (b.afterStopPoints === true)) return false;
  return a.container.kind === "SESSION" || (b.container.kind !== "SESSION" && a.container.id === b.container.id);
}

/**
 * Recette iPhone n° 2 du 31/10/2026 (Hermann : « L'arrêt d'une carte sur un circuit replié doit
 * l'ouvrir ») — temps d'arrêt, en millisecondes, d'un élément saisi sur un Circuit replié avant que
 * ce Circuit se déploie (rendu choisi, Figma muet : à valider sur iPhone). L'arrêt est compté tant que
 * la destination résolue reste ce Circuit replié (sa fin, seule destination qu'il offre replié).
 */
export const LAYOUT_COLLAPSED_HOVER_DELAY_MS = 500;

/**
 * Circuit replié visé par la destination `dropTarget` (identifiant), `null` sinon. Un Circuit replié
 * n'offre que sa fin (`layoutDropCandidates`) : la destination est dans ce Circuit si et seulement si
 * l'élément saisi est arrêté sur lui (jamais un Circuit ni un Cycle, D-451 ; l'écran ne l'applique qu'à
 * une carte d'Exercice, pas à un Point d'arrêt saisi).
 */
export function hoveredCollapsedCircuit(dropTarget: LayoutDestination | null, isCollapsed: (circuitId: string) => boolean): string | null {
  if (dropTarget === null || dropTarget.container.kind !== "CIRCUIT") return null;
  return isCollapsed(dropTarget.container.id) ? dropTarget.container.id : null;
}

/**
 * Contre-recette n° 3 du 31/10/2026 (cr4-replie, Hermann : « le circuit déplie, ses cartes descendent
 * mais avec un mouvement saccadé ») — pendant le déploiement d'un Circuit replié ouvert par l'arrêt de
 * la carte, la destination reste sa FIN (celle qui l'a ouvert), relue dans les boîtes courantes : la place
 * ouverte suit son bas, aucune de ses cartes ne reçoit de translation. `null` : aucun emplacement de fin
 * (le dernier rang du Circuit, avant ses Points de fin).
 */
export function circuitEndDrop(candidates: readonly LayoutDropTarget[], circuitId: string): LayoutDropTarget | null {
  let end: LayoutDropTarget | null = null;
  for (const candidate of candidates) {
    if (candidate.container.kind !== "CIRCUIT" || candidate.container.id !== circuitId || candidate.afterStopPoints === true) continue;
    if (end === null || candidate.index > end.index) end = candidate;
  }
  return end;
}
