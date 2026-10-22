import { describe, expect, it } from "@jest/globals";

import type { StructuralPosition } from "../Session";
import {
  areStopPointsNonConsecutive,
  consecutiveStopPointPairs,
  hasUniquePositionPerScope,
  isStopPointAllowed,
  isStopPointPlacementValid,
  isStopPointPositionInRange,
  isStopPointProposable,
  orderStopPointsByScope,
  positionInSequence,
  scopeSequence,
  stopPointDisplay,
  stopPointNeighbors,
  structuralSequence,
  withoutStopPoint,
  wouldBeConsecutive,
  type SequenceItem,
  type StopPoint,
} from "../StopPoint";

function occ(id: string, structuralPosition: StructuralPosition, type: "EXERCISE" | "RECOVERY" = "EXERCISE") {
  return { id, structuralPosition, type };
}

/** Séquence lisible : identifiant de l'occurrence, ou `P:id` pour un point. */
function labels(items: readonly SequenceItem<{ readonly id: string }, StopPoint>[]): string[] {
  return items.map((item) => (item.kind === "OCCURRENCE" ? item.occurrence.id : `P:${item.point.id}`));
}

describe("isStopPointPlacementValid", () => {
  it("rejects a placement immediately after the initial countdown", () => {
    expect(
      isStopPointPlacementValid({
        isImmediatelyAfterInitialCountdown: true,
        isImmediatelyBeforeSessionEnd: false,
      }),
    ).toBe(false);
  });

  it("rejects a placement immediately before the session end", () => {
    expect(
      isStopPointPlacementValid({
        isImmediatelyAfterInitialCountdown: false,
        isImmediatelyBeforeSessionEnd: true,
      }),
    ).toBe(false);
  });

  it("accepts any other placement", () => {
    expect(
      isStopPointPlacementValid({
        isImmediatelyAfterInitialCountdown: false,
        isImmediatelyBeforeSessionEnd: false,
      }),
    ).toBe(true);
  });
});

describe("stopPointNeighbors (liste affichée, sans répétition)", () => {
  const occurrences = [occ("b1", "BEFORE_TOUR"), occ("i1", "IN_TOUR"), occ("i2", "IN_TOUR")];

  it("BEFORE_TOUR p=0 directly follows the initial countdown", () => {
    expect(stopPointNeighbors(occurrences, { scope: "BEFORE_TOUR", position: 0 })).toEqual({
      isImmediatelyAfterInitialCountdown: true,
      isImmediatelyBeforeSessionEnd: false,
    });
  });

  it("IN_TOUR p=0 is preceded by the BEFORE_TOUR occurrence", () => {
    expect(stopPointNeighbors(occurrences, { scope: "IN_TOUR", position: 0 })).toEqual({
      isImmediatelyAfterInitialCountdown: false,
      isImmediatelyBeforeSessionEnd: false,
    });
  });

  it("the last IN_TOUR slot with nothing after directly precedes the end", () => {
    expect(stopPointNeighbors(occurrences, { scope: "IN_TOUR", position: 2 })).toEqual({
      isImmediatelyAfterInitialCountdown: false,
      isImmediatelyBeforeSessionEnd: true,
    });
  });

  it("AFTER_TOUR p=0 with no AFTER_TOUR occurrence directly precedes the end", () => {
    expect(stopPointNeighbors(occurrences, { scope: "AFTER_TOUR", position: 0 }).isImmediatelyBeforeSessionEnd).toBe(
      true,
    );
  });
});

describe("isStopPointPositionInRange / isStopPointAllowed", () => {
  const occurrences = [occ("i1", "IN_TOUR"), occ("i2", "IN_TOUR")];

  it("accepts 0..n integers only", () => {
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: 0 })).toBe(true);
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: 2 })).toBe(true);
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: 3 })).toBe(false);
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: -1 })).toBe(false);
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: 0.5 })).toBe(false);
  });

  it("allows only the slot between the two occurrences", () => {
    expect([0, 1, 2].map((position) => isStopPointAllowed(occurrences, { scope: "IN_TOUR", position }))).toEqual([
      false,
      true,
      false,
    ]);
  });
});

describe("hasUniquePositionPerScope", () => {
  it("rejects a duplicate position within the same scope", () => {
    const points: readonly StopPoint[] = [
      { id: "s1", scope: "IN_TOUR", position: 1 },
      { id: "s2", scope: "IN_TOUR", position: 1 },
    ];
    expect(hasUniquePositionPerScope(points)).toBe(false);
  });

  it("allows the same position across two distinct scopes", () => {
    const points: readonly StopPoint[] = [
      { id: "s1", scope: "BEFORE_TOUR", position: 0 },
      { id: "s2", scope: "AFTER_TOUR", position: 0 },
    ];
    expect(hasUniquePositionPerScope(points)).toBe(true);
  });
});

describe("orderStopPointsByScope", () => {
  it("orders by ascending position within the requested scope only", () => {
    const points: readonly StopPoint[] = [
      { id: "s2", scope: "IN_TOUR", position: 2 },
      { id: "s1", scope: "IN_TOUR", position: 1 },
      { id: "s3", scope: "AFTER_TOUR", position: 0 },
    ];
    expect(orderStopPointsByScope(points, "IN_TOUR").map((point) => point.id)).toEqual(["s1", "s2"]);
  });
});

/**
 * Story 6.1 (D-436, remplace ARB-3) : le point est un élément autonome de la
 * séquence mêlée de sa portée ; plus de rattachement à une occurrence.
 */
describe("séquence mêlée (D-436)", () => {
  const occurrences = [occ("W", "BEFORE_TOUR"), occ("A", "IN_TOUR"), occ("B", "IN_TOUR"), occ("Z", "AFTER_TOUR")];

  it("scopeSequence : [pt(s,0)?, occ1, pt(s,1)?, …, occn, pt(s,n)?]", () => {
    const points: StopPoint[] = [
      { id: "end", scope: "IN_TOUR", position: 2 },
      { id: "head", scope: "IN_TOUR", position: 0 },
      { id: "mid", scope: "IN_TOUR", position: 1 },
      { id: "out", scope: "AFTER_TOUR", position: 0 },
    ];
    expect(labels(scopeSequence(occurrences, points, "IN_TOUR"))).toEqual(["P:head", "A", "P:mid", "B", "P:end"]);
  });

  it("structuralSequence : BEFORE_TOUR, puis IN_TOUR, puis AFTER_TOUR", () => {
    const points: StopPoint[] = [
      { id: "w", scope: "BEFORE_TOUR", position: 1 },
      { id: "c", scope: "AFTER_TOUR", position: 0 },
    ];
    expect(labels(structuralSequence(occurrences, points))).toEqual(["W", "P:w", "A", "B", "P:c", "Z"]);
  });

  it("un point hors bornes est ramené à la borne la plus proche", () => {
    const points: StopPoint[] = [
      { id: "far", scope: "IN_TOUR", position: 9 },
      { id: "neg", scope: "IN_TOUR", position: -1 },
    ];
    expect(labels(scopeSequence(occurrences, points, "IN_TOUR"))).toEqual(["P:neg", "A", "B", "P:far"]);
  });

  it("positionInSequence : nombre d'occurrences qui précèdent un rang de la séquence", () => {
    const items = scopeSequence(occurrences, [{ id: "mid", scope: "IN_TOUR", position: 1 }], "IN_TOUR");
    expect([0, 1, 2, 3].map((index) => positionInSequence(items, index))).toEqual([0, 1, 1, 2]);
  });
});

describe("RM-251 : non-consécutivité (D-436)", () => {
  const point = (id: string, scope: StructuralPosition, position: number): StopPoint => ({ id, scope, position });
  const pairIds = (pairs: readonly (readonly [StopPoint, StopPoint])[]) => pairs.map(([a, b]) => `${a.id}+${b.id}`);

  it("deux points séparés par un Exercice ne sont pas consécutifs", () => {
    const occurrences = [occ("A", "IN_TOUR"), occ("B", "IN_TOUR"), occ("C", "IN_TOUR")];
    expect(areStopPointsNonConsecutive(occurrences, [point("p", "IN_TOUR", 1), point("q", "IN_TOUR", 2)])).toBe(true);
  });

  it("une ancienne Récupération autonome ne sépare pas deux points", () => {
    const occurrences = [occ("A", "IN_TOUR"), occ("R", "IN_TOUR", "RECOVERY"), occ("C", "IN_TOUR")];
    const pairs = consecutiveStopPointPairs(occurrences, [point("p", "IN_TOUR", 1), point("q", "IN_TOUR", 2)]);
    expect(pairIds(pairs)).toEqual(["p+q"]);
  });

  it("un type absent est lu EXERCISE (sépare)", () => {
    const occurrences = [{ structuralPosition: "IN_TOUR" as const }, { structuralPosition: "IN_TOUR" as const }, { structuralPosition: "IN_TOUR" as const }];
    expect(areStopPointsNonConsecutive(occurrences, [point("p", "IN_TOUR", 1), point("q", "IN_TOUR", 2)])).toBe(true);
  });

  it("frontière : (BEFORE, nB) + (IN, 0)", () => {
    const occurrences = [occ("W", "BEFORE_TOUR"), occ("A", "IN_TOUR"), occ("Z", "AFTER_TOUR")];
    expect(pairIds(consecutiveStopPointPairs(occurrences, [point("b", "BEFORE_TOUR", 1), point("h", "IN_TOUR", 0)]))).toEqual([
      "b+h",
    ]);
  });

  it("frontière : (IN, nI) + (AFTER, 0) — « après le dernier Exercice du Circuit » et « après le Circuit »", () => {
    const occurrences = [occ("W", "BEFORE_TOUR"), occ("A", "IN_TOUR"), occ("B", "IN_TOUR"), occ("Z", "AFTER_TOUR")];
    expect(pairIds(consecutiveStopPointPairs(occurrences, [point("c", "AFTER_TOUR", 0), point("l", "IN_TOUR", 2)]))).toEqual([
      "l+c",
    ]);
  });

  it("frontière, Circuit vide : (BEFORE, nB) + (AFTER, 0)", () => {
    const occurrences = [occ("W", "BEFORE_TOUR"), occ("Z", "AFTER_TOUR")];
    expect(areStopPointsNonConsecutive(occurrences, [point("b", "BEFORE_TOUR", 1), point("c", "AFTER_TOUR", 0)])).toBe(false);
  });

  it("trois points consécutifs donnent deux paires, dans l'ordre de la séquence", () => {
    const occurrences = [occ("W", "BEFORE_TOUR"), occ("A", "IN_TOUR"), occ("Z", "AFTER_TOUR")];
    const pairs = consecutiveStopPointPairs(occurrences, [
      point("c", "AFTER_TOUR", 0),
      point("b", "BEFORE_TOUR", 1),
      point("h", "IN_TOUR", 0),
      point("l", "IN_TOUR", 1),
    ]);
    expect(pairIds(pairs)).toEqual(["b+h", "l+c"]);
  });

  it("wouldBeConsecutive : candidat jugé contre les autres points, emplacement identique ignoré", () => {
    const occurrences = [occ("A", "IN_TOUR"), occ("B", "IN_TOUR"), occ("C", "IN_TOUR"), occ("Z", "AFTER_TOUR")];
    const existing = [point("p", "IN_TOUR", 1)];
    expect(wouldBeConsecutive(occurrences, existing, { scope: "IN_TOUR", position: 2 })).toBe(false);
    expect(wouldBeConsecutive(occurrences, [point("q", "IN_TOUR", 3)], { scope: "AFTER_TOUR", position: 0 })).toBe(true);
    expect(wouldBeConsecutive(occurrences, existing, { scope: "IN_TOUR", position: 1 })).toBe(false);
  });
});

describe("isStopPointProposable (D-436 : tête de Circuit non proposée)", () => {
  const occurrences = [occ("W", "BEFORE_TOUR"), occ("A", "IN_TOUR"), occ("Z", "AFTER_TOUR")];

  it("refuse la tête de Circuit, autorisée par RM-219 mais jamais proposée", () => {
    expect(isStopPointAllowed(occurrences, { scope: "IN_TOUR", position: 0 })).toBe(true);
    expect(isStopPointProposable(occurrences, { scope: "IN_TOUR", position: 0 })).toBe(false);
  });

  it("suit isStopPointAllowed ailleurs", () => {
    expect(isStopPointProposable(occurrences, { scope: "IN_TOUR", position: 1 })).toBe(true);
    expect(isStopPointProposable(occurrences, { scope: "BEFORE_TOUR", position: 0 })).toBe(false);
    expect(isStopPointProposable(occurrences, { scope: "AFTER_TOUR", position: 1 })).toBe(false);
  });
});

describe("stopPointDisplay (PRE-6 story 4.2, points hors placement)", () => {
  const occurrences = [occ("A", "BEFORE_TOUR"), occ("B", "IN_TOUR"), occ("C", "IN_TOUR"), occ("D", "AFTER_TOUR")];

  it("puts each point p ≥ 1 under the occurrence that precedes it (display only, D-436) and the AFTER_TOUR position 0 point after the Circuit", () => {
    const afterA: StopPoint = { id: "a", scope: "BEFORE_TOUR", position: 1 };
    const afterC: StopPoint = { id: "c", scope: "IN_TOUR", position: 2 };
    const afterCircuit: StopPoint = { id: "t", scope: "AFTER_TOUR", position: 0 };
    const display = stopPointDisplay(occurrences, [afterA, afterC, afterCircuit]);
    expect([...display.byOccurrenceId.entries()]).toEqual([
      ["A", afterA],
      ["C", afterC],
    ]);
    expect(display.afterCircuit).toBe(afterCircuit);
  });

  it("renders no point for a head-of-scope or out-of-range location", () => {
    const display = stopPointDisplay(occurrences, [
      { id: "x", scope: "IN_TOUR", position: 0 },
      { id: "y", scope: "BEFORE_TOUR", position: 3 },
    ]);
    expect(display.byOccurrenceId.size).toBe(0);
    expect(display.afterCircuit).toBeNull();
  });
});

describe("withoutStopPoint (PRE-6 story 4.2)", () => {
  const points: StopPoint[] = [
    { id: "a", scope: "BEFORE_TOUR", position: 1 },
    { id: "b", scope: "IN_TOUR", position: 1 },
  ];

  it("removes the point by id", () => {
    expect(withoutStopPoint(points, "a")).toEqual([points[1]]);
  });

  it("returns the same list (identity) for an unknown id", () => {
    expect(withoutStopPoint(points, "zz")).toBe(points);
  });
});
