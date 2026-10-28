import { describe, expect, it } from "@jest/globals";

import { dragIntent, placedOrder, previewLevels, reorderAnchor, type DragSlot } from "@/features/activities/movementFamilyDrag";

/**
 * PRE-8 — décision du geste de famille (règles A à C du 28/10/2026) et niveaux provisoires.
 * Repère : entrées de 80, écart de 12 ; pile dépliée « f » : membres de 80 séparés de 4.
 */

const free = (id: string, top: number): DragSlot => ({ id, familyKey: null, collapsedKey: null, joinable: true, top, height: 80 });
const member = (id: string, top: number): DragSlot => ({ id, familyKey: "f", collapsedKey: null, joinable: true, top, height: 80 });
const slots: readonly DragSlot[] = [free("a", 0), member("m1", 92), member("m2", 176), member("m3", 260), free("b", 352)];
const intent = (draggedId: string, familyKey: string | null, centerY: number, isFree = true) =>
  dragIntent({ slots, draggedId, familyKey, centerY, reorderTo: 1, free: isFree });

describe("PRE-8 familles — dragIntent", () => {
  it("A / B1 : un membre reste dans l'emprise du filet (réordonnancement) ou en sort, par le haut comme par le bas", () => {
    expect(intent("m3", "f", 200)).toEqual({ kind: "REORDER", to: 1 });
    expect(intent("m3", "f", 92)).toEqual({ kind: "REORDER", to: 1 });
    expect(intent("m3", "f", 341)).toEqual({ kind: "LEAVE" });
    expect(intent("m1", "f", 40)).toEqual({ kind: "LEAVE" });
  });

  it("C6 : un membre au-dessus d'une carte sans famille sort, sans jamais s'y poser", () => {
    expect(intent("m1", "f", 380)).toEqual({ kind: "LEAVE" });
  });

  it("C1 / C3 : un Mouvement sans famille sur une carte sans famille — moitié haute : au-dessus ; moitié basse : en dessous", () => {
    expect(intent("b", null, 10)).toEqual({ kind: "PLACE", anchorId: "a", side: "ABOVE", familyKey: null });
    expect(intent("b", null, 70)).toEqual({ kind: "PLACE", anchorId: "a", side: "BELOW", familyKey: null });
  });

  it("C2 / C7 : sur un membre d'une famille dépliée — entrée à cet endroit", () => {
    expect(intent("a", null, 230)).toEqual({ kind: "PLACE", anchorId: "m2", side: "BELOW", familyKey: "f" });
    expect(intent("a", null, 200)).toEqual({ kind: "PLACE", anchorId: "m2", side: "ABOVE", familyKey: "f" });
  });

  it("sa propre place, un écart entre cartes, un Mouvement non libre : aucun effet", () => {
    expect(intent("b", null, 390)).toEqual({ kind: "NONE" });
    expect(intent("b", null, 86)).toEqual({ kind: "NONE" });
    expect(intent("b", null, 10, false)).toEqual({ kind: "NONE" });
  });

  it("C5 : une pile repliée approchée se déplie ; une carte non disponible (archivée) ne reçoit rien", () => {
    const collapsed: DragSlot = { id: "p", familyKey: null, collapsedKey: "g", joinable: false, top: 0, height: 80 };
    const archived: DragSlot = { ...free("z", 100), joinable: false };
    expect(dragIntent({ slots: [collapsed, archived], draggedId: "x", familyKey: null, centerY: 40, reorderTo: 0, free: true })).toEqual({ kind: "EXPAND", familyKey: "g" });
    expect(dragIntent({ slots: [collapsed, archived], draggedId: "x", familyKey: null, centerY: 140, reorderTo: 0, free: true })).toEqual({ kind: "NONE" });
  });

  it("emprise inconnue (cartes non mesurées) : le geste reste un réordonnancement", () => {
    expect(dragIntent({ slots: [], draggedId: "m1", familyKey: "f", centerY: 999, reorderTo: 2, free: false })).toEqual({ kind: "REORDER", to: 2 });
  });
});

describe("PRE-8 familles — niveaux provisoires et ancres", () => {
  it("previewLevels : rangs sur les seuls actifs, le plus élevé en tête ; moins de deux actifs : aucun niveau", () => {
    expect(previewLevels([{ id: "x", active: true }, { id: "y", active: false }, { id: "z", active: true }])).toEqual(
      new Map([
        ["x", { rank: 2, total: 2 }],
        ["y", null],
        ["z", { rank: 1, total: 2 }],
      ]),
    );
    expect(previewLevels([{ id: "x", active: true }, { id: "y", active: false }])).toEqual(new Map([["x", null], ["y", null]]));
  });

  it("placedOrder et reorderAnchor", () => {
    expect(placedOrder(["m1", "m2", "m3"], "x", "m2", "ABOVE")).toEqual(["m1", "x", "m2", "m3"]);
    expect(placedOrder(["m1", "m2", "m3"], "x", "m2", "BELOW")).toEqual(["m1", "m2", "x", "m3"]);
    expect(reorderAnchor(["m2", "m1", "m3"], "m2")).toEqual({ anchorId: "m1", side: "ABOVE" });
    expect(reorderAnchor(["m1", "m3", "m2"], "m2")).toEqual({ anchorId: "m3", side: "BELOW" });
    expect(reorderAnchor(["m1"], "m1")).toBeNull();
  });
});
