import { describe, expect, it } from "@jest/globals";

import {
  activitiesInZone,
  duplicateActivity,
  groupActivitiesByZone,
  moveActivity,
  nextCopyName,
  orderActivitiesByZone,
  removeActivity,
} from "@/domain/sessions/composition";
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { StructuralPosition } from "@/domain/sessions/Session";

/**
 * Opérations métier pures de réorganisation de la Composition (T02-S01,
 * CE-T02-01/CE-T02-02, D-124/D-127/D-129, AC-04/AC-06/AC-07).
 */
function anActivity(
  id: string,
  zone: StructuralPosition,
  overrides: Partial<SessionDraftExercise> = {},
): SessionDraftExercise {
  return {
    ...createExerciseDraft(id),
    name: id,
    structuralPosition: zone,
    ...overrides,
  };
}

function ids(activities: readonly SessionDraftExercise[]): string[] {
  return activities.map((activity) => activity.id);
}

describe("groupActivitiesByZone / activitiesInZone / orderActivitiesByZone", () => {
  const activities = [
    anActivity("in-1", "IN_TOUR"),
    anActivity("before-1", "BEFORE_TOUR"),
    anActivity("after-1", "AFTER_TOUR"),
    anActivity("in-2", "IN_TOUR"),
  ];

  it("groups by zone while keeping the relative order of each zone", () => {
    const zones = groupActivitiesByZone(activities);
    expect(ids(zones.beforeTour)).toEqual(["before-1"]);
    expect(ids(zones.inTour)).toEqual(["in-1", "in-2"]);
    expect(ids(zones.afterTour)).toEqual(["after-1"]);
  });

  it("returns empty zones rather than undefined ones", () => {
    const zones = groupActivitiesByZone([]);
    expect(zones).toEqual({ beforeTour: [], inTour: [], afterTour: [] });
  });

  it("exposes a single zone directly", () => {
    expect(ids(activitiesInZone(activities, "IN_TOUR"))).toEqual(["in-1", "in-2"]);
    expect(activitiesInZone(activities, "AFTER_TOUR")).toHaveLength(1);
  });

  it("flattens back in the canonical structural order (before → in → after)", () => {
    expect(ids(orderActivitiesByZone(activities))).toEqual([
      "before-1",
      "in-1",
      "in-2",
      "after-1",
    ]);
  });
});

describe("moveActivity (AC-04)", () => {
  const activities = [
    anActivity("before-1", "BEFORE_TOUR"),
    anActivity("before-2", "BEFORE_TOUR"),
    anActivity("in-1", "IN_TOUR"),
    anActivity("after-1", "AFTER_TOUR"),
  ];

  it("reorders inside a zone without touching the other zones", () => {
    const next = moveActivity(activities, "before-2", "BEFORE_TOUR", 0);
    expect(ids(next)).toEqual(["before-2", "before-1", "in-1", "after-1"]);
    expect(next.map((activity) => activity.structuralPosition)).toEqual([
      "BEFORE_TOUR",
      "BEFORE_TOUR",
      "IN_TOUR",
      "AFTER_TOUR",
    ]);
  });

  it("moves an Activity between the three zones, updating only its structural position", () => {
    const toTour = moveActivity(activities, "before-1", "IN_TOUR", 0);
    expect(ids(toTour)).toEqual(["before-2", "before-1", "in-1", "after-1"]);
    expect(toTour.find((activity) => activity.id === "before-1")?.structuralPosition).toBe(
      "IN_TOUR",
    );

    const toAfter = moveActivity(activities, "in-1", "AFTER_TOUR", 1);
    expect(ids(toAfter)).toEqual(["before-1", "before-2", "after-1", "in-1"]);
    expect(toAfter.find((activity) => activity.id === "in-1")?.structuralPosition).toBe(
      "AFTER_TOUR",
    );
  });

  it("accepts an empty destination zone", () => {
    const onlyBefore = [anActivity("before-1", "BEFORE_TOUR")];
    const next = moveActivity(onlyBefore, "before-1", "AFTER_TOUR", 0);
    expect(ids(next)).toEqual(["before-1"]);
    expect(next[0]?.structuralPosition).toBe("AFTER_TOUR");
  });

  it("keeps the identifier and every parameter of the moved Activity", () => {
    const source = anActivity("in-1", "IN_TOUR", {
      name: "Gainage",
      durationSeconds: 90,
      seriesCount: 3,
      pauseSeconds: 15,
      instruction: "Dos droit",
      bodyZoneIds: ["dos", "abdominaux"],
    });
    const next = moveActivity([source], "in-1", "BEFORE_TOUR", 0);
    expect(next[0]).toEqual({ ...source, structuralPosition: "BEFORE_TOUR" });
  });

  it("never creates, duplicates nor loses an Activity", () => {
    const next = moveActivity(activities, "after-1", "BEFORE_TOUR", 1);
    expect(next).toHaveLength(activities.length);
    expect(new Set(ids(next))).toEqual(new Set(ids(activities)));
  });

  it("clamps an out-of-range destination index to the end of the zone", () => {
    expect(ids(moveActivity(activities, "in-1", "BEFORE_TOUR", 99))).toEqual([
      "before-1",
      "before-2",
      "in-1",
      "after-1",
    ]);
    expect(ids(moveActivity(activities, "after-1", "BEFORE_TOUR", -5))).toEqual([
      "after-1",
      "before-1",
      "before-2",
      "in-1",
    ]);
  });

  it("returns the collection unchanged for an unknown identifier (a drop without a valid target)", () => {
    expect(moveActivity(activities, "unknown", "IN_TOUR", 0)).toBe(activities);
  });
});

describe("removeActivity (AC-07)", () => {
  const activities = [
    anActivity("before-1", "BEFORE_TOUR"),
    anActivity("in-1", "IN_TOUR"),
    anActivity("in-2", "IN_TOUR"),
  ];

  it("removes only the targeted Activity and keeps the others' order and identity", () => {
    const next = removeActivity(activities, "in-1");
    expect(ids(next)).toEqual(["before-1", "in-2"]);
    expect(next[1]).toBe(activities[2]);
  });

  it("returns the collection unchanged for an unknown identifier", () => {
    expect(removeActivity(activities, "unknown")).toBe(activities);
  });

  it("supports removing the very last Activity", () => {
    expect(removeActivity([activities[0]!], "before-1")).toEqual([]);
  });
});

describe("nextCopyName (D-124)", () => {
  it("uses the plain '(copie)' suffix when it is free", () => {
    expect(nextCopyName("Gainage", ["Gainage"])).toBe("Gainage (copie)");
  });

  it("numbers from 2 upwards, returning the first available suffix", () => {
    expect(nextCopyName("Gainage", ["Gainage", "Gainage (copie)"])).toBe("Gainage (copie 2)");
    expect(
      nextCopyName("Gainage", ["Gainage", "Gainage (copie)", "Gainage (copie 2)"]),
    ).toBe("Gainage (copie 3)");
  });

  it("fills a gap in the numbering rather than always appending after the highest", () => {
    expect(
      nextCopyName("Gainage", ["Gainage", "Gainage (copie)", "Gainage (copie 3)"]),
    ).toBe("Gainage (copie 2)");
  });

  it("derives the candidate from the SOURCE name, without stripping an existing suffix", () => {
    expect(nextCopyName("Gainage (copie)", ["Gainage", "Gainage (copie)"])).toBe(
      "Gainage (copie) (copie)",
    );
  });
});

describe("duplicateActivity (AC-06)", () => {
  const activities = [
    anActivity("before-1", "BEFORE_TOUR", { name: "Échauffement" }),
    anActivity("in-1", "IN_TOUR", {
      name: "Gainage",
      durationSeconds: 45,
      seriesCount: 3,
      pauseSeconds: 20,
      instruction: "Dos droit",
      bodyZoneIds: ["dos"],
    }),
    anActivity("in-2", "IN_TOUR", { name: "Squats" }),
  ];

  it("inserts the copy immediately after its source, in the same structural zone", () => {
    const next = duplicateActivity(activities, "in-1", "copy-1");
    expect(ids(next)).toEqual(["before-1", "in-1", "copy-1", "in-2"]);
    expect(next[2]?.structuralPosition).toBe("IN_TOUR");
  });

  it("gives the copy a new identifier and a collision-free name, leaving the source untouched", () => {
    const next = duplicateActivity(activities, "in-1", "copy-1");
    expect(next[2]?.id).toBe("copy-1");
    expect(next[2]?.name).toBe("Gainage (copie)");
    expect(next[1]).toBe(activities[1]);
  });

  it("copies every parameter and association of the source", () => {
    const next = duplicateActivity(activities, "in-1", "copy-1");
    expect(next[2]).toEqual({
      ...activities[1],
      id: "copy-1",
      name: "Gainage (copie)",
    });
  });

  it("makes the copy independent: its body zones never share the source's array", () => {
    const next = duplicateActivity(activities, "in-1", "copy-1");
    expect(next[2]?.bodyZoneIds).not.toBe(activities[1]?.bodyZoneIds);
    expect(next[2]?.bodyZoneIds).toEqual(activities[1]?.bodyZoneIds);
  });

  it("numbers successive copies without collision", () => {
    const once = duplicateActivity(activities, "in-1", "copy-1");
    const twice = duplicateActivity(once, "in-1", "copy-2");
    expect(twice.map((activity) => activity.name)).toEqual([
      "Échauffement",
      "Gainage",
      "Gainage (copie 2)",
      "Gainage (copie)",
      "Squats",
    ]);
  });

  it("returns the collection unchanged for an unknown identifier", () => {
    expect(duplicateActivity(activities, "unknown", "copy-1")).toBe(activities);
  });
});
