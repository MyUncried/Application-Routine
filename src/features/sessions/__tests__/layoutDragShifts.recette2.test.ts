import { describe, expect, it } from "@jest/globals";

import type { LayoutStopPoint } from "@/domain/sessions/layoutStopPoints";
import type { SessionStructure } from "@/domain/sessions/structure";
import { RAIL_KEYS, railRowKey, railStopKey } from "@/features/sessions/compositionRail";
import { layoutHeaderKey, layoutItemKey, layoutStopBoxKey, resolveLayoutDrop, type LayoutBox } from "@/features/sessions/layoutDrop";
import {
  layoutBlockShiftKey,
  layoutDragShifts,
  layoutEdgeShiftKey,
  layoutSessionRailLinks,
  layoutSettleOffset,
  layoutShiftKeys,
  layoutShiftPieces,
} from "@/features/sessions/layoutDragShifts";

/**
 * PRE-9 — recette iPhone n° 2 du 31/10/2026 (b4-entrer, b4-sortir, b4-cycle-entier, b6-glisser,
 * b6-recup). Hermann : « le comportement tel qu'il a été défini initialement, et qui fonctionne avec un
 * seul circuit : déplacement des bords des circuits / cycle et déplacement des cartes pour faire la
 * place à la carte déplacée ». Aperçu d'un glisser de la disposition générale par translations :
 * cartes, Points d'arrêt, bords des Circuits et des Cycles ; liens du rail du niveau Séance.
 */

type Layout = SessionStructure<string, LayoutStopPoint>;
const id = (exercise: string) => exercise;
const gapOf = (container: { kind: string }) => (container.kind === "SESSION" ? 8 : 9);
const box = (top: number, height: number): LayoutBox => ({ top, height });
const edge = (kind: "CIRCUIT" | "CYCLE", containerId: string, side: "top" | "bottom") => layoutEdgeShiftKey(kind, containerId, side);

/** e0, Circuit A [a1, a2], Circuit B [b1], e9 — mesures du test d'écran B.4. */
const twoCircuits: Layout = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1", "a2"] } },
    { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 2, nature: "SERIES", exercises: ["b1"] } },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [],
};
const twoCircuitBoxes = new Map<string, LayoutBox>([
  [layoutItemKey({ kind: "EXERCISE", id: "e0" }), box(0, 80)],
  [layoutItemKey({ kind: "CIRCUIT", id: "ca" }), box(100, 220)],
  [layoutHeaderKey("CIRCUIT", "ca"), box(114, 18)],
  [layoutItemKey({ kind: "EXERCISE", id: "a1" }), box(141, 80)],
  [layoutItemKey({ kind: "EXERCISE", id: "a2" }), box(230, 80)],
  [layoutItemKey({ kind: "CIRCUIT", id: "cb" }), box(340, 130)],
  [layoutHeaderKey("CIRCUIT", "cb"), box(354, 18)],
  [layoutItemKey({ kind: "EXERCISE", id: "b1" }), box(381, 80)],
  [layoutItemKey({ kind: "EXERCISE", id: "e9" }), box(490, 80)],
]);

function preview(layout: Layout, boxes: ReadonlyMap<string, LayoutBox>, source: { kind: "EXERCISE" | "CIRCUIT" | "CYCLE"; id: string }, pointerY: number, sourceGap: number) {
  const pieces = layoutShiftPieces(layout, id);
  const target = resolveLayoutDrop(layout, source, pointerY, boxes, id, gapOf);
  const lifted = { boxKey: layoutItemKey(source), gap: sourceGap };
  const insertion = target === null ? null : { insertY: target.insertY, insertTop: target.insertTop, gap: gapOf(target.container) };
  return { pieces, target, lifted, insertion, result: layoutDragShifts(pieces, boxes, lifted, insertion)! };
}

describe("Recette iPhone n° 2 — aperçu du glisser d'une disposition générale (layoutDragShifts)", () => {
  it("b4-entrer : carte de la Séance amenée entre deux cartes d'un Circuit — les cartes suivantes descendent, le Circuit s'agrandit", () => {
    const { target, result } = preview(twoCircuits, twoCircuitBoxes, { kind: "EXERCISE", id: "e9" }, 225.5, 8);
    expect(target).toMatchObject({ container: { kind: "CIRCUIT", id: "ca" }, index: 1 });
    const shifts = result.shifts;
    // Au-dessus de l'emplacement : immobile ; bord haut du Circuit A immobile.
    expect(shifts.get(railRowKey("e0"))).toBeUndefined();
    expect(shifts.get(railRowKey("a1"))).toBeUndefined();
    expect(shifts.get(edge("CIRCUIT", "ca", "top"))).toBeUndefined();
    // a2 descend de la carte plus l'écart du Circuit (80 + 9) ; le bord bas du Circuit A aussi : il s'agrandit.
    expect(shifts.get(railRowKey("a2"))).toBe(89);
    expect(shifts.get(edge("CIRCUIT", "ca", "bottom"))).toBe(89);
    // Le Circuit B descend en bloc (ses deux bords et sa carte).
    expect(shifts.get(edge("CIRCUIT", "cb", "top"))).toBe(89);
    expect(shifts.get(edge("CIRCUIT", "cb", "bottom"))).toBe(89);
    expect(shifts.get(railRowKey("b1"))).toBe(89);
    // La carte saisie ne reçoit rien (elle suit le doigt) ; la Fin de séance : décalage net (9 − 8).
    expect(shifts.has(railRowKey("e9"))).toBe(false);
    expect(result.end).toBe(1);
  });

  it("b4-sortir : dernière carte d'un Circuit sortie sous la dernière carte — le Circuit se rétracte, ce qui suit remonte", () => {
    const { target, result } = preview(twoCircuits, twoCircuitBoxes, { kind: "EXERCISE", id: "b1" }, 578, 9);
    expect(target).toMatchObject({ container: { kind: "SESSION" }, index: 4 });
    const shifts = result.shifts;
    expect(shifts.get(edge("CIRCUIT", "cb", "top"))).toBeUndefined();
    expect(shifts.get(edge("CIRCUIT", "cb", "bottom"))).toBe(-89);
    expect(shifts.get(railRowKey("e9"))).toBe(-89);
    expect(shifts.get(edge("CIRCUIT", "ca", "bottom"))).toBeUndefined();
    expect(result.end).toBe(-1);
  });

  it("à sa propre place : aucune translation", () => {
    // Centre de a1 (181) : emplacement d'origine de a1, entre l'en-tête et a2.
    const { target, result } = preview(twoCircuits, twoCircuitBoxes, { kind: "EXERCISE", id: "a1" }, 140, 9);
    expect(target).toMatchObject({ container: { kind: "CIRCUIT", id: "ca" }, index: 0 });
    expect([...result.shifts.values()].every((value) => value === 0)).toBe(true);
    expect(result.shifts.size).toBe(0);
    expect(result.end).toBe(0);
  });

  it("b4-cycle-entier : Cycle saisi — son contenu ne bouge pas avec l'aperçu, les autres éléments font la place", () => {
    const withCycle: Layout = {
      elements: [
        { kind: "EXERCISE", exercise: "e0" },
        { kind: "CYCLE", cycle: { id: "cy", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: "d1" }, { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } }] } },
        { kind: "EXERCISE", exercise: "e9" },
      ],
      stopPoints: [{ id: "p", circuitId: null, cycleId: "cy", position: 1 }],
    };
    const boxes = new Map<string, LayoutBox>([
      [layoutItemKey({ kind: "EXERCISE", id: "e0" }), box(0, 80)],
      [layoutItemKey({ kind: "CYCLE", id: "cy" }), box(88, 300)],
      [layoutHeaderKey("CYCLE", "cy"), box(102, 18)],
      [layoutItemKey({ kind: "EXERCISE", id: "d1" }), box(129, 80)],
      [layoutStopBoxKey("p"), box(218, 22)],
      [layoutItemKey({ kind: "CIRCUIT", id: "cb" }), box(249, 131)],
      [layoutItemKey({ kind: "EXERCISE", id: "b1" }), box(290, 80)],
      [layoutItemKey({ kind: "EXERCISE", id: "e9" }), box(396, 80)],
    ]);
    // Cycle (centre de l'en-tête 111) amené avant e0.
    const { target, result } = preview(withCycle, boxes, { kind: "CYCLE", id: "cy" }, -8, 8);
    expect(target).toMatchObject({ container: { kind: "SESSION" }, index: 0 });
    // e0 descend de la hauteur du Cycle plus l'écart (300 + 8) ; e9 : retrait puis insertion, net 0.
    expect(result.shifts.get(railRowKey("e0"))).toBe(308);
    expect(result.shifts.has(railRowKey("e9"))).toBe(false);
    // Contenu du Cycle (membres, Point d'arrêt, Circuit intérieur) : rien.
    for (const key of [railRowKey("d1"), railRowKey("b1"), railStopKey("p"), edge("CIRCUIT", "cb", "top"), edge("CYCLE", "cy", "top")]) {
      expect(result.shifts.has(key)).toBe(false);
    }
  });

  it("b6-glisser / b6-recup : Point d'arrêt saisi dans un Cycle amené dans un Circuit — le Cycle se rétracte, le Circuit s'agrandit", () => {
    const layout: Layout = {
      elements: [
        { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1", "a2"] } },
        { kind: "CYCLE", cycle: { id: "cy", repeatCount: 1, members: [{ kind: "EXERCISE", exercise: "d1" }, { kind: "EXERCISE", exercise: "d2" }] } },
      ],
      stopPoints: [{ id: "p", circuitId: null, cycleId: "cy", position: 1 }],
    };
    const boxes = new Map<string, LayoutBox>([
      [layoutItemKey({ kind: "CIRCUIT", id: "ca" }), box(0, 220)],
      [layoutHeaderKey("CIRCUIT", "ca"), box(14, 18)],
      [layoutItemKey({ kind: "EXERCISE", id: "a1" }), box(41, 80)],
      [layoutItemKey({ kind: "EXERCISE", id: "a2" }), box(130, 80)],
      [layoutItemKey({ kind: "CYCLE", id: "cy" }), box(228, 230)],
      [layoutHeaderKey("CYCLE", "cy"), box(242, 18)],
      [layoutItemKey({ kind: "EXERCISE", id: "d1" }), box(269, 80)],
      [layoutStopBoxKey("p"), box(358, 22)],
      [layoutItemKey({ kind: "EXERCISE", id: "d2" }), box(389, 80)],
    ]);
    const pieces = layoutShiftPieces(layout, id);
    // Repère d'Exercice fictif du Point (B.6) : toutes les places d'un Exercice.
    const target = resolveLayoutDrop(layout, { kind: "EXERCISE", id: "\u0000p" }, 125.5, boxes, id, gapOf)!;
    expect(target).toMatchObject({ container: { kind: "CIRCUIT", id: "ca" }, index: 1 });
    const result = layoutDragShifts(pieces, boxes, { boxKey: layoutStopBoxKey("p"), gap: 9 }, { insertY: target.insertY, insertTop: target.insertTop, gap: 9 })!;
    // Dans le Circuit A : a2 descend du Point plus l'écart (22 + 9), le Circuit s'agrandit.
    expect(result.shifts.get(railRowKey("a2"))).toBe(31);
    expect(result.shifts.get(edge("CIRCUIT", "ca", "bottom"))).toBe(31);
    // Le Cycle descend en entier (insertion au-dessus), puis sa place du Point se referme : d2 et son bas ne bougent pas.
    expect(result.shifts.get(edge("CYCLE", "cy", "top"))).toBe(31);
    expect(result.shifts.get(railRowKey("d1"))).toBe(31);
    expect(result.shifts.has(railRowKey("d2"))).toBe(false);
    expect(result.shifts.has(edge("CYCLE", "cy", "bottom"))).toBe(false);
    expect(result.shifts.has(railStopKey("p"))).toBe(false);
  });

  it("pièces : ordre d'affichage, Points d'arrêt à leur place, clés de translation des blocs", () => {
    const layout: Layout = {
      elements: [
        { kind: "EXERCISE", exercise: "e0" },
        { kind: "CYCLE", cycle: { id: "cy", repeatCount: 1, members: [{ kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } }] } },
      ],
      stopPoints: [
        { id: "s", circuitId: null, position: 1 },
        { id: "c", circuitId: "cb", position: 1 },
      ],
    };
    const pieces = layoutShiftPieces(layout, id);
    expect(pieces.map((piece) => `${piece.kind}:${piece.id}`)).toEqual(["EXERCISE:e0", "STOP_POINT:s", "CYCLE:cy", "CIRCUIT:cb", "EXERCISE:b1", "STOP_POINT:c"]);
    expect(pieces.find((piece) => piece.id === "c")!.within).toEqual([layoutItemKey({ kind: "CIRCUIT", id: "cb" }), layoutItemKey({ kind: "CYCLE", id: "cy" })]);
    expect(layoutShiftKeys(pieces)).toContain(layoutBlockShiftKey("CYCLE", "cy"));
  });

  it("rail du niveau Séance : chaque élément se relie au précédent ; l'élément saisi sort de la chaîne", () => {
    const pieces = layoutShiftPieces(twoCircuits, id);
    const rest = layoutSessionRailLinks(pieces, null);
    expect(rest.get(railRowKey("e0"))).toEqual({ prevKey: RAIL_KEYS.start, extra: 0 });
    expect(rest.get(edge("CIRCUIT", "cb", "top"))).toEqual({ prevKey: edge("CIRCUIT", "ca", "bottom"), extra: 0 });
    expect(rest.get(RAIL_KEYS.end)).toEqual({ prevKey: railRowKey("e9"), extra: 0 });
    // Cartes d'un Circuit : rail porté par la queue du Circuit, pas de lien de Séance.
    expect(rest.has(railRowKey("a1"))).toBe(false);
    // Circuit B saisi : e9 se relie au bas du Circuit A à travers sa place (130 + 8).
    const lifted = layoutSessionRailLinks(pieces, { boxKey: layoutItemKey({ kind: "CIRCUIT", id: "cb" }), extra: 138 });
    expect(lifted.get(railRowKey("e9"))).toEqual({ prevKey: edge("CIRCUIT", "ca", "bottom"), extra: 138 });
    expect(lifted.has(edge("CIRCUIT", "cb", "top"))).toBe(false);
  });

  it("mise en place après le lâcher (story 7.6) : translation qui garde l'élément sous le doigt dans la nouvelle disposition", () => {
    const { lifted, insertion } = preview(twoCircuits, twoCircuitBoxes, { kind: "EXERCISE", id: "e9" }, 225.5, 8);
    // e9 (haut 490) lâché à −300 : haut affiché 190 ; sa place dans la nouvelle disposition : 230.
    expect(layoutSettleOffset(twoCircuitBoxes, lifted, insertion!, -300)).toBe(-40);
    // b1 (haut 381, place refermée de 89) déposé sous e9 : nouveau haut 570 + 8 − 89 = 489.
    const out = preview(twoCircuits, twoCircuitBoxes, { kind: "EXERCISE", id: "b1" }, 578, 9);
    expect(layoutSettleOffset(twoCircuitBoxes, out.lifted, out.insertion!, 157)).toBe(381 + 157 - 489);
  });
});
