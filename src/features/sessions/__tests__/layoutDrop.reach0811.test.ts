import { describe, expect, it } from "@jest/globals";

import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import {
  LAYOUT_DROP_MIN_LINE_SPACING,
  layoutDropCandidates,
  layoutHeaderKey,
  layoutItemKey,
  resolveLayoutDrop,
  type LayoutBox,
} from "@/features/sessions/layoutDrop";
import type { LayoutContainerRef } from "@/domain/sessions/layoutMoves";

/**
 * Recette du 08/11/2026 au soir (Hermann : « je ne peux pas positionner un exercice dans un cycle devant circuit qu'il soit le
 * premier ou un autre dans le cycle » ; « si je positionne un exercice à la dernière place d'un cycle […] au relâchement
 * l'exercice se positionne à la dernière place du circuit » ; « l'exercice est sorti du circuit et est tombé dans un autre circuit
 * en dessous ») — défaut reproduit sur la version validée `e369c1ae` : chaque emplacement d'un Cycle à deux Circuits doit être
 * atteignable par le centre de la carte, sur une bande d'au moins `LAYOUT_DROP_MIN_LINE_SPACING`.
 *
 * Géométrie de l'écran (08/11/2026 au soir) : carte 72, en-tête 18 sous 14, écart 9 dans un Circuit et un Cycle, 8 dans la
 * Séance, 10 sous la dernière carte d'un Circuit, 12 sous le dernier membre d'un Cycle.
 */
const layout: SessionStructure<string, StructureStopPointLocation> = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    {
      kind: "CYCLE",
      cycle: {
        id: "cy",
        repeatCount: 2,
        members: [
          { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1", "a2"] } },
          { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } },
        ],
      },
    },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [],
};
const box = (top: number, height: number): LayoutBox => ({ top, height });
const boxes = new Map<string, LayoutBox>([
  [layoutItemKey({ kind: "EXERCISE", id: "e0" }), box(0, 72)],
  [layoutItemKey({ kind: "CYCLE", id: "cy" }), box(80, 389)],
  [layoutHeaderKey("CYCLE", "cy"), box(94, 18)],
  [layoutItemKey({ kind: "CIRCUIT", id: "ca" }), box(121, 204)],
  [layoutHeaderKey("CIRCUIT", "ca"), box(135, 18)],
  [layoutItemKey({ kind: "EXERCISE", id: "a1" }), box(162, 72)],
  [layoutItemKey({ kind: "EXERCISE", id: "a2" }), box(243, 72)],
  [layoutItemKey({ kind: "CIRCUIT", id: "cb" }), box(334, 123)],
  [layoutHeaderKey("CIRCUIT", "cb"), box(348, 18)],
  [layoutItemKey({ kind: "EXERCISE", id: "b1" }), box(375, 72)],
  [layoutItemKey({ kind: "EXERCISE", id: "e9" }), box(477, 72)],
]);
const id = (exercise: string) => exercise;
const gapOf = (container: LayoutContainerRef) => (container.kind === "SESSION" ? 8 : 9);
const label = (target: { container: LayoutContainerRef; index: number }) =>
  `${target.container.kind}${target.container.kind === "SESSION" ? "" : `:${target.container.id}`}@${target.index}`;

/** Emplacements effectivement visés quand le centre de la carte parcourt l'écran, et la longueur de chaque bande. */
function sweep(source: string) {
  const bands = new Map<string, number>();
  for (let y = -50; y <= 650; y += 0.5) {
    const target = resolveLayoutDrop(layout, { kind: "EXERCISE", id: source }, y, boxes, id, gapOf);
    if (target !== null) bands.set(label(target), (bands.get(label(target)) ?? 0) + 0.5);
  }
  return bands;
}

describe("Recette du 08/11/2026 au soir — chaque emplacement d'un Cycle à deux Circuits est atteignable", () => {
  it("a1 (premier membre du Circuit A) : « après A » dans le Cycle, « devant A », « fin du Cycle » — bandes d'au moins 24", () => {
    const candidates = layoutDropCandidates(layout, { kind: "EXERCISE", id: "a1" }, boxes, id, gapOf);
    const bands = sweep("a1");
    for (const candidate of candidates) {
      expect(bands.get(label(candidate)) ?? 0).toBeGreaterThanOrEqual(LAYOUT_DROP_MIN_LINE_SPACING - 0.5);
    }
    for (const wanted of ["CYCLE:cy@0", "CYCLE:cy@1", "CYCLE:cy@2", "CIRCUIT:ca@1", "CIRCUIT:cb@1"]) expect(bands.has(wanted)).toBe(true);
  });

  it("repères dans l'ordre de la mise en page, aucun à moins de 24 de son voisin", () => {
    const lines = layoutDropCandidates(layout, { kind: "EXERCISE", id: "e0" }, boxes, id, gapOf)
      .map((candidate) => candidate.lineY)
      .sort((a, b) => a - b);
    for (let index = 1; index < lines.length; index += 1) expect(lines[index]! - lines[index - 1]!).toBeGreaterThanOrEqual(LAYOUT_DROP_MIN_LINE_SPACING - 1e-6);
  });

  it("seuils d'insertion inchangés : la place s'ouvre toujours au même endroit", () => {
    const end = layoutDropCandidates(layout, { kind: "EXERCISE", id: "e0" }, boxes, id, gapOf).find(
      (candidate) => candidate.container.kind === "CYCLE" && candidate.index === 2,
    )!;
    expect(end).toMatchObject({ insertY: 457 + 0.5, insertTop: 457 + 9 });
  });
});
