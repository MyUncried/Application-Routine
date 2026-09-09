import { describe, expect, it } from "@jest/globals";

import {
  activitiesInZone,
  duplicateActivity,
  groupActivitiesByZone,
  insertActivityInZone,
  moveActivity,
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

/**
 * T02-S02 (continuation après recette visuelle) : une nouvelle Activité
 * s'insère APRÈS la dernière Activité DE SA ZONE, pas en fin de collection.
 */
describe("insertActivityInZone", () => {
  const composed = [
    anActivity("before-1", "BEFORE_TOUR"),
    anActivity("in-1", "IN_TOUR"),
    anActivity("after-1", "AFTER_TOUR"),
  ];

  it("inserts right after the last Activity of the SAME zone, never at the end of the collection", () => {
    expect(ids(insertActivityInZone(composed, anActivity("before-2", "BEFORE_TOUR")))).toEqual([
      "before-1",
      "before-2",
      "in-1",
      "after-1",
    ]);
    expect(ids(insertActivityInZone(composed, anActivity("in-2", "IN_TOUR")))).toEqual([
      "before-1",
      "in-1",
      "in-2",
      "after-1",
    ]);
  });

  it("appends at the very end for the last zone, where no later zone exists", () => {
    expect(ids(insertActivityInZone(composed, anActivity("after-2", "AFTER_TOUR")))).toEqual([
      "before-1",
      "in-1",
      "after-1",
      "after-2",
    ]);
  });

  it("inserts before the first Activity of a later zone when its own zone is still empty", () => {
    const onlyAfterTour = [anActivity("after-1", "AFTER_TOUR")];
    expect(ids(insertActivityInZone(onlyAfterTour, anActivity("before-1", "BEFORE_TOUR")))).toEqual([
      "before-1",
      "after-1",
    ]);
    expect(ids(insertActivityInZone(onlyAfterTour, anActivity("in-1", "IN_TOUR")))).toEqual([
      "in-1",
      "after-1",
    ]);
  });

  it("returns a NEW collection and never mutates the source", () => {
    const next = insertActivityInZone(composed, anActivity("before-2", "BEFORE_TOUR"));
    expect(next).not.toBe(composed);
    expect(ids(composed)).toEqual(["before-1", "in-1", "after-1"]);
  });

  /**
   * **T02-S02 (seconde recette visuelle, point 1)** — la collection n'est pas
   * nécessairement CONTIGUË par zone : `moveActivity` la réordonne, et
   * `[in-1, before-1]` est une Composition parfaitement légitime.
   *
   * La règle précédente cherchait la PREMIÈRE Activité d'une zone
   * postérieure ; sur une collection non contiguë, elle plaçait la nouvelle
   * Activité `BEFORE_TOUR` avant `in-1`, donc AVANT `before-1` — en tête de
   * sa zone, immédiatement sous le `Compte à rebours initial`, exactement le
   * symptôme relevé par la recette. Chercher la DERNIÈRE de sa propre zone
   * est vrai quelle que soit la disposition de la collection.
   */
  it("still appends after the last Activity of its zone when the collection is NOT contiguous by zone", () => {
    const reordered = [anActivity("in-1", "IN_TOUR"), anActivity("before-1", "BEFORE_TOUR")];

    expect(ids(insertActivityInZone(reordered, anActivity("before-2", "BEFORE_TOUR")))).toEqual([
      "in-1",
      "before-1",
      "before-2",
    ]);
    // Et jamais en tête de sa zone.
    expect(
      ids(insertActivityInZone(reordered, anActivity("before-2", "BEFORE_TOUR"))).indexOf(
        "before-2",
      ),
    ).toBeGreaterThan(
      ids(insertActivityInZone(reordered, anActivity("before-2", "BEFORE_TOUR"))).indexOf(
        "before-1",
      ),
    );
  });

  it("appends after the last of its zone even when a later zone's Activity sits BEFORE it in the collection", () => {
    const reordered = [
      anActivity("after-1", "AFTER_TOUR"),
      anActivity("in-1", "IN_TOUR"),
      anActivity("in-2", "IN_TOUR"),
    ];

    expect(ids(insertActivityInZone(reordered, anActivity("in-3", "IN_TOUR")))).toEqual([
      "after-1",
      "in-1",
      "in-2",
      "in-3",
    ]);
  });

  it("handles an empty composition", () => {
    expect(ids(insertActivityInZone([], anActivity("in-1", "IN_TOUR")))).toEqual(["in-1"]);
  });

  it("keeps the collection order equal to the structural reading order after several insertions", () => {
    const built = [
      anActivity("in-1", "IN_TOUR"),
      anActivity("before-1", "BEFORE_TOUR"),
      anActivity("after-1", "AFTER_TOUR"),
      anActivity("before-2", "BEFORE_TOUR"),
      anActivity("in-2", "IN_TOUR"),
    ].reduce<readonly SessionDraftExercise[]>(
      (collection, activity) => insertActivityInZone(collection, activity),
      [],
    );

    expect(ids(built)).toEqual(["before-1", "before-2", "in-1", "in-2", "after-1"]);
    expect(ids(built)).toEqual(ids(orderActivitiesByZone(built)));
  });
});

describe("duplicateActivity (AC-06 ; T02-S02, D-138)", () => {
  const activities = [
    anActivity("before-1", "BEFORE_TOUR", { name: "Échauffement" }),
    anActivity("in-1", "IN_TOUR", {
      name: "Gainage",
      durationSeconds: 45,
      seriesCount: 3,
      pauseSeconds: 20,
      recoverySeconds: 90,
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

  /**
   * T02-S02 : le titre de la copie est STRICTEMENT IDENTIQUE à celui de la
   * source. `D-124` (suffixe `(copie)`) est marquée « Révisée par D-138 »,
   * et `D-138` ne réintroduit aucune règle de renommage — elle pose au
   * contraire que la copie forme un bloc indivisible identique à sa source.
   * Seul l'identifiant distingue les deux.
   */
  it("gives the copy a new identifier and the SAME title, leaving the source untouched", () => {
    const next = duplicateActivity(activities, "in-1", "copy-1");
    expect(next[2]?.id).toBe("copy-1");
    expect(next[2]?.name).toBe("Gainage");
    expect(next[2]?.name).toBe(activities[1]!.name);
    expect(next[2]?.name).not.toMatch(/copie/u);
    expect(next[1]).toBe(activities[1]);
  });

  it("copies every parameter and association of the source, Récupération attachée included", () => {
    const next = duplicateActivity(activities, "in-1", "copy-1");
    expect(next[2]).toEqual({ ...activities[1], id: "copy-1" });
    expect(next[2]?.recoverySeconds).toBe(90);
    expect(next[2]?.pauseSeconds).toBe(20);
  });

  it("makes the copy independent: its body zones never share the source's array", () => {
    const next = duplicateActivity(activities, "in-1", "copy-1");
    expect(next[2]?.bodyZoneIds).not.toBe(activities[1]?.bodyZoneIds);
    expect(next[2]?.bodyZoneIds).toEqual(activities[1]?.bodyZoneIds);
  });

  it("keeps every successive copy identical in title, distinguished only by its identifier", () => {
    const once = duplicateActivity(activities, "in-1", "copy-1");
    const twice = duplicateActivity(once, "in-1", "copy-2");
    expect(twice.map((activity) => activity.name)).toEqual([
      "Échauffement",
      "Gainage",
      "Gainage",
      "Gainage",
      "Squats",
    ]);
    expect(ids(twice)).toEqual(["before-1", "in-1", "copy-2", "copy-1", "in-2"]);
    // Les identifiants, eux, restent uniques — c'est la seule distinction.
    expect(new Set(ids(twice)).size).toBe(twice.length);
  });

  it("returns the collection unchanged for an unknown identifier", () => {
    expect(duplicateActivity(activities, "unknown", "copy-1")).toBe(activities);
  });
});
