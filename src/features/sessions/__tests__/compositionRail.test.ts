import { describe, expect, it } from "@jest/globals";

import { CIRCUIT_HEADER_HEIGHT } from "@/features/sessions/CircuitHeader";
import { STOP_POINT_LINE_HEIGHT } from "@/features/sessions/ActivityRecoveryLine";
import { type DropTarget, resolveDragShifts } from "@/features/sessions/compositionGesture";
import { RAIL_KEYS, railRowKey, railStopKey, resolveRailLinks, type RailChainInput } from "@/features/sessions/compositionRail";
import { railGeometryFor } from "@/features/sessions/CompositionScreen";
import { OCCURRENCE_CARD_HEIGHT, OCCURRENCE_CARD_MEDIA } from "@/features/sessions/OccurrenceCard";

/**
 * PRE-6 (story 5.2, D-435, Figma `8328:28605`) : liens du rail segmenté. Géométrie de conception à
 * 402 : écart 8 hors Circuit, 9 dans le Circuit, marge du Circuit 14, ancres — haut du média 8,
 * haut de l'anneau du Circuit 15 (en-tête de 40), haut de l'anneau de Fin 7 (rangée de 24).
 */
// Story 5.2b : la géométrie même de l'écran (`railGeometryFor`), pas une copie.
const GEOMETRY = railGeometryFor(CIRCUIT_HEADER_HEIGHT);
const CARD = 80;

function links(input: Partial<RailChainInput>) {
  return resolveRailLinks({
    beforeTour: [],
    inTour: [],
    afterTour: [],
    hasAfterCircuit: false,
    skipped: null,
    geometry: GEOMETRY,
    ...input,
  });
}
const summary = (result: ReturnType<typeof links>) =>
  Object.fromEntries([...result].map(([key, link]) => [key, [link.prevKey, link.length]]));

describe("resolveRailLinks (rail segmenté, story 5.2)", () => {
  it("story 6.2 — un point (rangée autonome) est un nœud : écart de sa zone au-dessus, ancre au haut de sa rangée ; le suivant s'y relie", () => {
    expect(summary(links({ beforeTour: ["a", { stopPointId: "p" }, "b"], inTour: ["i", { stopPointId: "q" }, "j"] }))).toMatchObject({
      [railStopKey("p")]: [railRowKey("a"), 8],
      [railRowKey("b")]: [railStopKey("p"), 8 + 8],
      [railStopKey("q")]: [railRowKey("i"), 9],
      [railRowKey("j")]: [railStopKey("q"), 9 + 8],
    });
    // Point soulevé : le suivant se relie à travers sa place (écart + 22 + écart + ancre).
    expect(
      links({ beforeTour: ["a", { stopPointId: "p" }, "b"], skipped: { key: railStopKey("p"), height: 22 } }).get(railRowKey("b")),
    ).toEqual({ prevKey: railRowKey("a"), length: 8 + 22 + 8 + 8 });
  });

  it("séquence vide : Compte à rebours → anneau du Circuit vide → bas du Circuit → Fin", () => {
    expect(summary(links({}))).toEqual({
      // Écart 8 + marge haute du Circuit 14 + haut de l'anneau 15.
      [RAIL_KEYS.circuitHeader]: [RAIL_KEYS.start, 8 + 14 + 15],
      // Du bas de l'en-tête au bas du Circuit : marge basse 14.
      [RAIL_KEYS.circuitEnd]: [RAIL_KEYS.circuitHeader, 14],
      [RAIL_KEYS.end]: [RAIL_KEYS.circuitEnd, 8 + 7],
    });
  });

  it("une carte avant, dans et après le Circuit : anneau → média → anneau → média → bas du Circuit → média → Fin", () => {
    expect(summary(links({ beforeTour: ["b"], inTour: ["i"], afterTour: ["a"] }))).toEqual({
      [railRowKey("b")]: [RAIL_KEYS.start, 8 + 8],
      [RAIL_KEYS.circuitHeader]: [railRowKey("b"), 8 + 14 + 15],
      [railRowKey("i")]: [RAIL_KEYS.circuitHeader, 9 + 8],
      [RAIL_KEYS.circuitEnd]: [railRowKey("i"), 14],
      [railRowKey("a")]: [RAIL_KEYS.circuitEnd, 8 + 8],
      [RAIL_KEYS.end]: [railRowKey("a"), 8 + 7],
    });
  });

  it("deux cartes dans le Circuit : écart 9 ; deux cartes au dehors : écart 8", () => {
    const result = links({ beforeTour: ["b1", "b2"], inTour: ["i1", "i2"] });
    expect(result.get(railRowKey("b2"))).toMatchObject({ prevKey: railRowKey("b1"), length: 8 + 8 });
    expect(result.get(railRowKey("i2"))).toMatchObject({ prevKey: railRowKey("i1"), length: 9 + 8 });
  });

  it("point après le Circuit : la rangée se relie au bas du Circuit, la suite à la rangée", () => {
    const result = links({ afterTour: ["a"], hasAfterCircuit: true });
    expect(result.get(RAIL_KEYS.afterCircuit)).toMatchObject({ prevKey: RAIL_KEYS.circuitEnd, length: 8 });
    expect(result.get(railRowKey("a"))).toMatchObject({ prevKey: RAIL_KEYS.afterCircuit, length: 8 + 8 });
    // Sans occurrence après : la Fin se relie à la rangée.
    expect(links({ hasAfterCircuit: true }).get(RAIL_KEYS.end)).toMatchObject({ prevKey: RAIL_KEYS.afterCircuit, length: 15 });
  });

  it("aucune coordonnée d'exemple : chaque lien rejoint exactement le bord bas de son prédécesseur dans la mise en page en flux", () => {
    // Mise en page simulée à partir des seules règles de flux (écarts, marges, hauteurs) — rangée
    // d'un point d'arrêt comprise dans le bloc de la carte (80 + 8 + 22).
    const input = { beforeTour: ["b1", "b2"], inTour: ["i1", "i2"], afterTour: ["a1"], hasAfterCircuit: true };
    const heights: Record<string, number> = { b1: CARD + 8 + 22, b2: CARD, i1: CARD, i2: CARD + 9 + 22, a1: CARD };
    const boxes = new Map<string, { top: number; bottom: number; anchor: number }>();
    let y = 0;
    const put = (key: string, height: number, anchor: number) => {
      boxes.set(key, { top: y, bottom: y + height, anchor: y + anchor });
      y += height;
    };
    put(RAIL_KEYS.start, 27, 0);
    for (const id of input.beforeTour) {
      y += 8;
      put(railRowKey(id), heights[id], 8);
    }
    y += 8 + 14;
    put(RAIL_KEYS.circuitHeader, 40, 15);
    for (const id of input.inTour) {
      y += 9;
      put(railRowKey(id), heights[id], 8);
    }
    y += 14;
    put(RAIL_KEYS.circuitEnd, 0, 0);
    y += 8;
    put(RAIL_KEYS.afterCircuit, 22, 0);
    for (const id of input.afterTour) {
      y += 8;
      put(railRowKey(id), heights[id], 8);
    }
    y += 8;
    put(RAIL_KEYS.end, 24, 7);

    const result = links(input);
    expect(result.size).toBe(boxes.size - 1);
    for (const [key, link] of result) {
      expect(boxes.get(key)!.anchor - link.length).toBe(boxes.get(link.prevKey)!.bottom);
    }
  });

  it("glisser : l'occurrence glissée sort de la chaîne, son successeur se relie à son prédécesseur à travers sa place", () => {
    const result = links({
      beforeTour: ["b1", "b2"],
      inTour: ["i1"],
      skipped: { key: railRowKey("b1"), height: CARD },
    });
    expect(result.has(railRowKey("b1"))).toBe(false);
    // Écart 8 + carte 80 (place d'origine) + écart 8 + haut du média 8.
    expect(result.get(railRowKey("b2"))).toEqual({ prevKey: RAIL_KEYS.start, length: 8 + CARD + 8 + 8 });
    // La suite de la chaîne est inchangée.
    expect(result.get(RAIL_KEYS.circuitHeader)).toEqual({ prevKey: railRowKey("b2"), length: 8 + 14 + 15 });
  });

  it("glisser la seule carte du Circuit : le bas du Circuit se relie à l'en-tête à travers sa place", () => {
    const result = links({ inTour: ["i1"], skipped: { key: railRowKey("i1"), height: CARD + 9 + 22 } });
    expect(result.get(RAIL_KEYS.circuitEnd)).toMatchObject({
      prevKey: RAIL_KEYS.circuitHeader,
      length: 9 + CARD + 9 + 22 + 14,
    });
  });
});

/**
 * PRE-6 story 5.2b : rail pendant le glisser et pendant le retour — `resolveDragShifts` (décalages)
 * et `resolveRailLinks` (liens) combinés sur un modèle de la mise en page au repos (celle que relève
 * `originLayout` ; le soulèvement est neutre pour la mise en page), avec la géométrie même de
 * l'écran (`railGeometryFor`, `OCCURRENCE_CARD_MEDIA`, rangée de point d'arrêt, en-tête de 40).
 *
 * - Aperçu (fraction `t` de l'animation vers l'emplacement) : la carte glissée A est hors de la
 *   chaîne, soulevée au premier plan.
 * - Retour (dépôt refusé, geste interrompu, « Annuler ») : A part de sa position de dépôt et revient
 *   à 0 avec ses voisines (même fraction `t`) ; hors de la chaîne et au premier plan jusqu'à la fin
 *   du retour, elle porte le rail de sa propre surface.
 *
 * PRE-6 story 6.2 (D-436) : les Points d'arrêt sont des rangées autonomes (`kind: "stop"`) — nœuds
 * de la chaîne et lignes de la géométrie, avec leur hauteur (22) ; un point glissé suit le même
 * modèle (sans média : sa puce, centrée sur la page, ne recouvre pas l'axe du rail).
 *
 * Invariants, à t = 1, ½ et 0 : (1) jonction visible — le haut de chaque lien est le bas visible de
 * son prédécesseur, ou, quand celui-ci chevauche l'élément, le bord haut de l'élément lui-même (lien
 * ramené à sa surface propre), ou un point recouvert par la carte A ; (2) jamais sous la surface
 * propre ; (3) aucun lien ne traverse un média peint sous lui, hors de ce que A recouvre.
 */
describe("rail pendant le glisser et le retour : jonctions visibles, aucun média traversé (story 5.2b)", () => {
  type Zone = "BEFORE_TOUR" | "IN_TOUR" | "AFTER_TOUR";
  /**
   * Élément de la séquence : une carte (`inCircuitHeight` : hauteur prise dans le Circuit, pour une
   * hauteur d'insertion différente de la hauteur retirée) ou, story 6.2, un point (`kind: "stop"`).
   */
  type Occurrence = { readonly id: string; readonly zone: Zone; readonly kind?: "stop"; readonly inCircuitHeight?: number };
  const keyOf = (item: Occurrence) => (item.kind === "stop" ? railStopKey(item.id) : railRowKey(item.id));
  type Element = {
    readonly key: string;
    readonly group: string;
    readonly top: number;
    readonly bottom: number;
    readonly entry: number;
    readonly minLength: number;
    readonly media: { readonly top: number; readonly bottom: number } | null;
  };
  const G = railGeometryFor(CIRCUIT_HEADER_HEIGHT);
  const START_ROW = 27;
  const END_ROW = 24;
  const GAPS = { row: G.sequenceGap, circuitRow: G.circuitGap, zone: G.sequenceGap, circuit: G.circuitGap };
  const EPSILON = 1e-6;

  /** Mise en page au repos : éléments du rail dans l'ordre de peinture, et relevé des cartes. */
  function layOut(sequence: readonly Occurrence[]) {
    const elements: Element[] = [];
    const rows: { id: string; zone: Zone; top: number; height: number }[] = [];
    let y = START_ROW;
    elements.push({ key: RAIL_KEYS.start, group: "start", top: 0, bottom: START_ROW, entry: 0, minLength: 0, media: null });
    const list = (zone: Zone, gap: number, group: string) =>
      sequence
        .filter((occurrence) => occurrence.zone === zone)
        .forEach((occurrence, index) => {
          if (index > 0) y += gap;
          const isStop = occurrence.kind === "stop";
          const height = isStop
            ? STOP_POINT_LINE_HEIGHT
            : zone === "IN_TOUR"
              ? (occurrence.inCircuitHeight ?? OCCURRENCE_CARD_HEIGHT)
              : OCCURRENCE_CARD_HEIGHT;
          elements.push({
            key: keyOf(occurrence),
            group,
            top: y,
            bottom: y + height,
            entry: isStop ? y : y + G.rowEntry,
            minLength: isStop ? 0 : G.rowEntry,
            media: isStop ? null : { top: y + OCCURRENCE_CARD_MEDIA.top, bottom: y + OCCURRENCE_CARD_MEDIA.bottom },
          });
          rows.push({ id: keyOf(occurrence), zone, top: y, height });
          y += height;
        });
    const has = (zone: Zone) => sequence.some((occurrence) => occurrence.zone === zone);
    if (has("BEFORE_TOUR")) {
      y += G.sequenceGap;
      list("BEFORE_TOUR", G.sequenceGap, "before");
    }
    y += G.sequenceGap;
    const tourTop = y;
    elements.push({
      key: RAIL_KEYS.circuitHeader,
      group: "circuit",
      top: tourTop,
      bottom: tourTop + G.circuitPadding + CIRCUIT_HEADER_HEIGHT,
      entry: tourTop + G.circuitPadding + G.circuitHeaderEntry,
      minLength: G.circuitPadding + G.circuitHeaderEntry,
      media: null,
    });
    y += G.circuitPadding + CIRCUIT_HEADER_HEIGHT;
    if (has("IN_TOUR")) {
      y += G.circuitGap;
      list("IN_TOUR", G.circuitGap, "circuit");
    }
    y += G.circuitPadding;
    const tourBottom = y;
    elements.push({ key: RAIL_KEYS.circuitEnd, group: "circuit", top: tourBottom, bottom: tourBottom, entry: tourBottom, minLength: G.circuitPadding, media: null });
    if (has("AFTER_TOUR")) {
      y += G.sequenceGap;
      list("AFTER_TOUR", G.sequenceGap, "after");
    }
    y += G.sequenceGap;
    elements.push({ key: RAIL_KEYS.end, group: "end", top: y, bottom: y + END_ROW, entry: y + G.endEntry, minLength: G.endEntry, media: null });
    return { elements, layout: { tourTop, tourBottom, rows } };
  }

  /** Séquence après le déplacement (règle de `moveActivity` : rang `index` dans la zone visée). */
  function moved(sequence: readonly Occurrence[], id: string, target: DropTarget): Occurrence[] {
    const source = sequence.find((occurrence) => occurrence.id === id)!;
    const others = sequence.filter((occurrence) => occurrence.id !== id);
    const order: Zone[] = ["BEFORE_TOUR", "IN_TOUR", "AFTER_TOUR"];
    return order.flatMap((zone) => {
      const inZone = others.filter((occurrence) => occurrence.zone === zone);
      if (zone === target.zone) inZone.splice(target.index, 0, { ...source, zone });
      return inZone;
    });
  }

  type Phase = "preview" | "return";
  /** Défauts du rail à la fraction `t` (`release` : écart à la position de dépôt, retour seulement). */
  function railDefects(sequence: readonly Occurrence[], id: string, target: DropTarget, phase: Phase, t: number, release = 0) {
    const rest = layOut(sequence);
    const after = layOut(moved(sequence, id, target));
    const draggedKey = keyOf(sequence.find((item) => item.id === id)!);
    const dragged = rest.layout.rows.find((row) => row.id === draggedKey)!;
    const insertionHeight = after.layout.rows.find((row) => row.id === draggedKey)!.height;
    const shifts = resolveDragShifts(rest.layout, draggedKey, target, GAPS, insertionHeight);
    const shiftOf = (key: string): number => {
      if (key === draggedKey) return phase === "return" ? t * release : 0;
      const byKey: Record<string, number> = {
        [RAIL_KEYS.circuitHeader]: shifts.circuitTop,
        [RAIL_KEYS.circuitEnd]: shifts.circuitBottom,
        [RAIL_KEYS.afterCircuit]: shifts.afterCircuit,
        [RAIL_KEYS.end]: shifts.end,
      };
      return t * (shifts.rows.get(key) ?? byKey[key] ?? 0);
    };
    const byKey = new Map(rest.elements.map((element) => [element.key, element]));
    const draggedElement = byKey.get(draggedKey)!;
    const draggedGroup = draggedElement.group;
    // A au premier plan ; sa zone (le Circuit entier pour une carte du Circuit) au-dessus des autres.
    const paintRank = (element: Element, index: number) =>
      element.key === draggedKey ? 1e6 : element.group === draggedGroup ? 1e3 + index : index;
    const ranks = new Map(rest.elements.map((element, index) => [element.key, paintRank(element, index)]));
    // Seule une carte recouvre l'axe du rail ; la puce d'un point, centrée sur la page, non.
    const coverByA =
      draggedElement.media === null
        ? { top: Number.NaN, bottom: Number.NaN }
        : { top: draggedElement.top + shiftOf(draggedKey), bottom: draggedElement.bottom + shiftOf(draggedKey) };
    const zoneIds = (zone: Zone) =>
      sequence
        .filter((occurrence) => occurrence.zone === zone)
        .map((occurrence) => (occurrence.kind === "stop" ? { stopPointId: occurrence.id } : occurrence.id));
    const result = links({
      beforeTour: zoneIds("BEFORE_TOUR"),
      inTour: zoneIds("IN_TOUR"),
      afterTour: zoneIds("AFTER_TOUR"),
      skipped: { key: draggedKey, height: dragged.height },
      geometry: G,
    });
    const defects: string[] = [];
    for (const [key, link] of result) {
      const element = byKey.get(key)!;
      const previous = byKey.get(link.prevKey)!;
      const anchor = element.entry + shiftOf(key);
      const visible = Math.max(element.minLength, link.length + shiftOf(key) - shiftOf(link.prevKey));
      const top = anchor - visible;
      const previousBottom = previous.bottom + shiftOf(link.prevKey);
      const joined =
        Math.abs(top - previousBottom) < EPSILON ||
        (Math.abs(visible - element.minLength) < EPSILON && previousBottom >= top - EPSILON) ||
        (top > coverByA.top - EPSILON && top < coverByA.bottom + EPSILON);
      if (!joined) defects.push(`${key} : jonction ${(top - previousBottom).toFixed(2)}`);
      if (visible < element.minLength - EPSILON) defects.push(`${key} : sous sa surface propre`);
      for (const card of rest.elements) {
        if (card.media === null || card.key === key || card.key === draggedKey) continue;
        if (ranks.get(card.key)! > ranks.get(key)!) continue;
        const mediaTop = card.media.top + shiftOf(card.key);
        const mediaBottom = card.media.bottom + shiftOf(card.key);
        let from = Math.max(top, mediaTop);
        let to = Math.min(anchor, mediaBottom);
        // Ce que la carte A, au premier plan, recouvre n'est pas visible.
        if (from < coverByA.bottom && to > coverByA.top) {
          if (coverByA.top <= from) from = Math.max(from, coverByA.bottom);
          else to = Math.min(to, coverByA.top);
        }
        if (to - from > EPSILON) defects.push(`${key} : traverse le média de ${card.key}`);
      }
    }
    return { defects, holeOffset: after.layout.rows.find((row) => row.id === draggedKey)!.top - dragged.top };
  }

  /** Aperçu puis retour, depuis l'emplacement ouvert et à 25 de part et d'autre. */
  function expectSound(sequence: readonly Occurrence[], id: string, target: DropTarget) {
    for (const t of [1, 0.5, 0]) {
      const preview = railDefects(sequence, id, target, "preview", t);
      expect([t, preview.defects]).toEqual([t, []]);
      for (const offset of [0, 25, -25]) {
        const release = preview.holeOffset + offset;
        expect([t, release, railDefects(sequence, id, target, "return", t, release).defects]).toEqual([t, release, []]);
      }
    }
  }

  const circuit: Occurrence[] = [
    { id: "A", zone: "IN_TOUR" },
    { id: "B", zone: "IN_TOUR" },
    { id: "C", zone: "IN_TOUR" },
  ];

  it("Circuit [A, B, C] : A glissée en dernier", () => {
    expectSound(circuit, "A", { zone: "IN_TOUR", index: 2 });
  });

  it("Circuit [A, B, C] : C (la dernière) glissée en premier", () => {
    expectSound(circuit, "C", { zone: "IN_TOUR", index: 0 });
  });

  it("story 6.2 — rangée autonome d'un point (S) voisine des cartes glissées, dans les deux sens (index de séquence mêlée)", () => {
    const withStop: Occurrence[] = [
      { id: "P", zone: "BEFORE_TOUR" },
      { id: "A", zone: "IN_TOUR" },
      { id: "B", zone: "IN_TOUR" },
      { id: "S", zone: "IN_TOUR", kind: "stop" },
      { id: "C", zone: "IN_TOUR" },
      { id: "Z", zone: "AFTER_TOUR" },
    ];
    expectSound(withStop, "A", { zone: "IN_TOUR", index: 3 });
    expectSound(withStop, "C", { zone: "IN_TOUR", index: 0 });
    expectSound(withStop, "P", { zone: "IN_TOUR", index: 4 });
    expectSound(withStop, "Z", { zone: "IN_TOUR", index: 2 });
  });

  it("story 6.2 — point glissé seul (R2) : dans sa zone et d'une zone à l'autre", () => {
    const sequence: Occurrence[] = [
      { id: "A", zone: "BEFORE_TOUR" },
      { id: "S", zone: "BEFORE_TOUR", kind: "stop" },
      { id: "B", zone: "BEFORE_TOUR" },
      { id: "C", zone: "BEFORE_TOUR" },
      { id: "X", zone: "IN_TOUR" },
      { id: "Y", zone: "IN_TOUR" },
      { id: "Z", zone: "AFTER_TOUR" },
    ];
    expectSound(sequence, "S", { zone: "BEFORE_TOUR", index: 2 });
    expectSound(sequence, "S", { zone: "IN_TOUR", index: 1 });
    expectSound(sequence, "S", { zone: "AFTER_TOUR", index: 0 });
  });

  // Hauteur SYNTHÉTIQUE (80 + 6 dans le Circuit) : la carte v2 fait 80 partout (story 5.1) ; l'écart
  // sert seulement à éprouver une hauteur d'insertion différente de la hauteur retirée
  // (`predictedInsertionHeight`), comme le test unitaire de cette fonction.
  it("hauteur d'insertion différente de la hauteur retirée : une carte qui grandit dans le Circuit y entre, puis en sort", () => {
    const sequence: Occurrence[] = [
      { id: "P", zone: "BEFORE_TOUR", inCircuitHeight: OCCURRENCE_CARD_HEIGHT + 6 },
      { id: "A", zone: "IN_TOUR", inCircuitHeight: OCCURRENCE_CARD_HEIGHT + 6 },
      { id: "S", zone: "IN_TOUR", kind: "stop" },
      { id: "B", zone: "IN_TOUR" },
      { id: "Z", zone: "AFTER_TOUR" },
    ];
    expectSound(sequence, "P", { zone: "IN_TOUR", index: 3 });
    expectSound(sequence, "A", { zone: "AFTER_TOUR", index: 1 });
    expectSound(sequence, "A", { zone: "BEFORE_TOUR", index: 0 });
  });

  it("dernière carte avant le Circuit vers le Circuit, dernière du Circuit vers l'après", () => {
    const sequence: Occurrence[] = [
      { id: "B", zone: "BEFORE_TOUR" },
      { id: "A", zone: "BEFORE_TOUR" },
      { id: "X", zone: "IN_TOUR" },
      { id: "Y", zone: "IN_TOUR" },
      { id: "Z", zone: "AFTER_TOUR" },
    ];
    expectSound(sequence, "A", { zone: "IN_TOUR", index: 1 });
    expectSound(sequence, "Y", { zone: "AFTER_TOUR", index: 1 });
  });
});
