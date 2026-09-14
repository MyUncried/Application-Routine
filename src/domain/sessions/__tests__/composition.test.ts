import { describe, expect, it } from "@jest/globals";

import {
  activitiesInZone,
  appendActivityAfterLastDisplayed,
  duplicateActivity,
  groupActivitiesByZone,
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

  /**
   * V2-BILAT-01 : une Activité déposée dans `IN_TOUR` alors que le Tour est
   * déjà bilatéral y arrive `UNILATERAL` — jamais avec une direction propre
   * résiduelle qu'aucun contrôle n'aurait jamais laissé saisir pendant
   * qu'elle était gouvernée par le Tour.
   */
  describe("V2-BILAT-01 — side mode on displacement", () => {
    it("resets the moved Activity to UNILATERAL when it enters IN_TOUR under a bilateral Tour", () => {
      const source = anActivity("before-1", "BEFORE_TOUR", { sideMode: "RIGHT_LEFT" });
      const next = moveActivity([source], "before-1", "IN_TOUR", 0, "LEFT_RIGHT");
      expect(next[0]?.sideMode).toBe("UNILATERAL");
      expect(next[0]?.structuralPosition).toBe("IN_TOUR");
    });

    it("keeps the Activity's own side mode when the destination Tour stays unilateral", () => {
      const source = anActivity("before-1", "BEFORE_TOUR", { sideMode: "RIGHT_LEFT" });
      const next = moveActivity([source], "before-1", "IN_TOUR", 0, "UNILATERAL");
      expect(next[0]?.sideMode).toBe("RIGHT_LEFT");
    });

    it("keeps the Activity's own side mode when it does not enter IN_TOUR, even under a bilateral Tour", () => {
      const source = anActivity("in-1", "IN_TOUR", { sideMode: "RIGHT_LEFT" });
      const next = moveActivity([source], "in-1", "BEFORE_TOUR", 0, "LEFT_RIGHT");
      expect(next[0]?.sideMode).toBe("RIGHT_LEFT");
    });

    it("defaults tourSideMode to UNILATERAL — non-regression for every caller predating this tranche", () => {
      const source = anActivity("before-1", "BEFORE_TOUR", { sideMode: "RIGHT_LEFT" });
      const next = moveActivity([source], "before-1", "IN_TOUR", 0);
      expect(next[0]?.sideMode).toBe("RIGHT_LEFT");
    });
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
 * **T02-S02 (troisième recette visuelle, point 1)** — insertion DYNAMIQUE :
 * une nouvelle Activité se place immédiatement APRÈS la dernière carte
 * ACTUELLEMENT AFFICHÉE et en reprend la zone structurelle. Aucune position ni
 * zone mémorisée à l'ouverture de l'écran n'intervient : la fonction ne
 * consulte que la collection qu'on lui passe.
 */
describe("appendActivityAfterLastDisplayed", () => {
  const composed = [
    anActivity("before-1", "BEFORE_TOUR"),
    anActivity("in-1", "IN_TOUR"),
    anActivity("after-1", "AFTER_TOUR"),
  ];

  /** Zone effectivement attribuée à l'Activité ajoutée. */
  function zoneOfAdded(
    activities: readonly SessionDraftExercise[],
    id: string,
  ): StructuralPosition | undefined {
    return activities.find((activity) => activity.id === id)?.structuralPosition;
  }

  it("places the new Activity right after the last DISPLAYED card, taking that card's zone", () => {
    // Dernière carte affichée : `after-1` (`AFTER_TOUR`). La nouvelle la suit
    // et hérite de sa zone — elle se place donc avant `Fin de séance`, même
    // si elle est née `BEFORE_TOUR`.
    const next = appendActivityAfterLastDisplayed(
      composed,
      anActivity("new-1", "BEFORE_TOUR"),
    );

    expect(ids(next)).toEqual(["before-1", "in-1", "after-1", "new-1"]);
    expect(zoneOfAdded(next, "new-1")).toBe("AFTER_TOUR");
  });

  it("makes it the LAST of the Tour when the last displayed card is IN_TOUR", () => {
    const next = appendActivityAfterLastDisplayed(
      [anActivity("before-1", "BEFORE_TOUR"), anActivity("in-1", "IN_TOUR")],
      anActivity("new-1", "AFTER_TOUR"),
    );

    expect(ids(next)).toEqual(["before-1", "in-1", "new-1"]);
    expect(zoneOfAdded(next, "new-1")).toBe("IN_TOUR");
    // Dernière du Tour : aucune Activité `IN_TOUR` ne la suit.
    expect(ids(activitiesInZone(next, "IN_TOUR"))).toEqual(["in-1", "new-1"]);
  });

  it("places it just after the last BEFORE_TOUR card — therefore before the Tour", () => {
    const next = appendActivityAfterLastDisplayed(
      [anActivity("before-1", "BEFORE_TOUR")],
      anActivity("new-1", "IN_TOUR"),
    );

    expect(ids(next)).toEqual(["before-1", "new-1"]);
    expect(zoneOfAdded(next, "new-1")).toBe("BEFORE_TOUR");
  });

  /**
   * « Dernière carte affichée » est celle de l'ORDRE DE LECTURE, pas celle de
   * la fin du tableau : `moveActivity` peut rendre la collection NON contiguë
   * par zone, et `[after-1, in-1]` est une Composition parfaitement légitime
   * dont la dernière carte affichée reste `after-1`.
   */
  it("reads the CURRENT reading order, never the raw tail of the collection", () => {
    const reordered = [anActivity("after-1", "AFTER_TOUR"), anActivity("in-1", "IN_TOUR")];

    const next = appendActivityAfterLastDisplayed(reordered, anActivity("new-1", "BEFORE_TOUR"));

    expect(ids(next)).toEqual(["after-1", "new-1", "in-1"]);
    expect(zoneOfAdded(next, "new-1")).toBe("AFTER_TOUR");
    // Et elle est bien la dernière carte AFFICHÉE, malgré sa position dans le
    // tableau.
    expect(ids(orderActivitiesByZone(next)).at(-1)).toBe("new-1");
  });

  it("always makes the new Activity the LAST displayed card, whatever the collection", () => {
    const collections: readonly (readonly SessionDraftExercise[])[] = [
      composed,
      [anActivity("in-1", "IN_TOUR"), anActivity("before-1", "BEFORE_TOUR")],
      [anActivity("after-1", "AFTER_TOUR"), anActivity("in-1", "IN_TOUR")],
      [anActivity("before-1", "BEFORE_TOUR"), anActivity("before-2", "BEFORE_TOUR")],
    ];

    for (const collection of collections) {
      const next = appendActivityAfterLastDisplayed(collection, anActivity("new-1", "BEFORE_TOUR"));
      expect(ids(orderActivitiesByZone(next)).at(-1)).toBe("new-1");
    }
  });

  it("keeps the Activity's own zone on an empty composition", () => {
    const next = appendActivityAfterLastDisplayed([], anActivity("in-1", "IN_TOUR"));

    expect(ids(next)).toEqual(["in-1"]);
    expect(zoneOfAdded(next, "in-1")).toBe("IN_TOUR");
  });

  it("returns a NEW collection and never mutates the source", () => {
    const next = appendActivityAfterLastDisplayed(composed, anActivity("new-1", "BEFORE_TOUR"));

    expect(next).not.toBe(composed);
    expect(ids(composed)).toEqual(["before-1", "in-1", "after-1"]);
    // La source garde sa zone d'origine : seule la COPIE insérée est
    // rezonée.
    expect(composed[0]!.structuralPosition).toBe("BEFORE_TOUR");
  });

  it("copies every other parameter of the added Activity unchanged", () => {
    const added = anActivity("new-1", "BEFORE_TOUR", {
      name: "Squats",
      durationSeconds: 45,
      seriesCount: 3,
      pauseSeconds: 15,
    });

    const next = appendActivityAfterLastDisplayed(composed, added);

    expect(next.find((activity) => activity.id === "new-1")).toEqual({
      ...added,
      structuralPosition: "AFTER_TOUR",
    });
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

  /** V2-BILAT-01 : la direction propre (`sideMode`) fait partie des paramètres reproduits à l'identique. */
  it("conserves the source's own side mode on the copy", () => {
    const bilateral = anActivity("in-3", "IN_TOUR", { sideMode: "RIGHT_LEFT" });
    const next = duplicateActivity([...activities, bilateral], "in-3", "copy-1");
    expect(next.find((activity) => activity.id === "copy-1")?.sideMode).toBe("RIGHT_LEFT");
  });
});

describe("appendActivityAfterLastDisplayed — V2-BILAT-01 side mode", () => {
  it("resets the appended Activity to UNILATERAL when it lands IN_TOUR under a bilateral Tour", () => {
    const next = appendActivityAfterLastDisplayed(
      [anActivity("in-1", "IN_TOUR")],
      anActivity("new-1", "IN_TOUR", { sideMode: "RIGHT_LEFT" }),
      "LEFT_RIGHT",
    );
    expect(next.find((activity) => activity.id === "new-1")?.sideMode).toBe("UNILATERAL");
  });

  it("keeps the appended Activity's own side mode when the Tour stays unilateral", () => {
    const next = appendActivityAfterLastDisplayed(
      [anActivity("in-1", "IN_TOUR")],
      anActivity("new-1", "IN_TOUR", { sideMode: "RIGHT_LEFT" }),
      "UNILATERAL",
    );
    expect(next.find((activity) => activity.id === "new-1")?.sideMode).toBe("RIGHT_LEFT");
  });

  it("keeps the appended Activity's own side mode on an empty composition, regardless of tourSideMode", () => {
    const next = appendActivityAfterLastDisplayed(
      [],
      anActivity("new-1", "IN_TOUR", { sideMode: "RIGHT_LEFT" }),
      "LEFT_RIGHT",
    );
    expect(next[0]?.sideMode).toBe("UNILATERAL");
  });

  it("defaults tourSideMode to UNILATERAL — non-regression for every caller predating this tranche", () => {
    const next = appendActivityAfterLastDisplayed(
      [anActivity("in-1", "IN_TOUR")],
      anActivity("new-1", "IN_TOUR", { sideMode: "RIGHT_LEFT" }),
    );
    expect(next.find((activity) => activity.id === "new-1")?.sideMode).toBe("RIGHT_LEFT");
  });
});
