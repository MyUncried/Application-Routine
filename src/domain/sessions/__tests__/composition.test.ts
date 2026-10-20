import { describe, expect, it } from "@jest/globals";

import {
  activitiesInZone,
  appendActivityAfterLastDisplayed,
  duplicateActivity,
  duplicateOccurrence,
  groupActivitiesByZone,
  moveActivity,
  moveOccurrence,
  nextCopyName,
  orderActivitiesByZone,
  removeActivity,
  removeOccurrence,
  type CompositionState,
} from "@/domain/sessions/composition";
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { StructuralPosition } from "@/domain/sessions/Session";
import { NAME_MAX_LENGTH } from "@/domain/sessions/validation";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";

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
      executionParameters: durationParameters(90, 3, 15),
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

  /** V2-PRE-1 (plan §3.3) : le Circuit (Tour) n'a plus d'influence fonctionnelle — une Activité déplacée conserve toujours sa direction propre. */
  it("keeps the Activity's own side mode on any displacement, into or out of IN_TOUR (V2-PRE-1)", () => {
    const source = anActivity("before-1", "BEFORE_TOUR", { sideMode: "RIGHT_LEFT" });
    const next = moveActivity([source], "before-1", "IN_TOUR", 0);
    expect(next[0]?.sideMode).toBe("RIGHT_LEFT");
    expect(next[0]?.structuralPosition).toBe("IN_TOUR");
  });

  /**
   * V2-PRE-2 (plan §6.1, UI-9194767E574D-A0D8A00099FB7 ; 04 L259, CE-T03-08
   * L884) : la Récupération après exercice appartient à l'occurrence — un
   * déplacement ne la relit jamais du Profil, même si celui-ci a changé
   * depuis la création de l'occurrence.
   */
  it("preserves the occurrence's own postActivityRecoverySeconds on any displacement, never re-reading the Profile (V2-PRE-2)", () => {
    const source = anActivity("before-1", "BEFORE_TOUR", { postActivityRecoverySeconds: 45 });
    const next = moveActivity([source], "before-1", "AFTER_TOUR", 0);
    expect(next[0]?.postActivityRecoverySeconds).toBe(45);
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
      executionParameters: durationParameters(45, 3, 15),
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
      executionParameters: durationParameters(45, 3, 20),
      postActivityRecoverySeconds: 90,
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
   * PRE-6 (story 2.3, D-124, RM-021, ch13) : la copie est nommée
   * `{nom} (copie)`, puis `{nom} (copie 2)`… sans collision (remplace
   * l'attente T02-S02 d'un titre identique).
   */
  it("gives the copy a new identifier and the « (copie) » suffix, leaving the source untouched", () => {
    const next = duplicateActivity(activities, "in-1", "copy-1");
    expect(next[2]?.id).toBe("copy-1");
    expect(next[2]?.name).toBe("Gainage (copie)");
    expect(next[1]).toBe(activities[1]);
  });

  it("copies every parameter and association of the source, Récupération attachée included", () => {
    const next = duplicateActivity(activities, "in-1", "copy-1");
    expect(next[2]).toEqual({ ...activities[1], id: "copy-1", name: "Gainage (copie)" });
    expect(next[2]?.postActivityRecoverySeconds).toBe(90);
    expect(next[2]?.executionParameters).toEqual(durationParameters(45, 3, 20));
    // AD-9 : clonage profond — aucune référence partagée des paramètres.
    expect(next[2]?.executionParameters).not.toBe(activities[1]?.executionParameters);
  });

  it("makes the copy independent: its body zones never share the source's array", () => {
    const next = duplicateActivity(activities, "in-1", "copy-1");
    expect(next[2]?.bodyZoneIds).not.toBe(activities[1]?.bodyZoneIds);
    expect(next[2]?.bodyZoneIds).toEqual(activities[1]?.bodyZoneIds);
  });

  it("numbers successive copies without collision: (copie), (copie 2), (copie 3)", () => {
    const once = duplicateActivity(activities, "in-1", "copy-1");
    const twice = duplicateActivity(once, "in-1", "copy-2");
    const thrice = duplicateActivity(twice, "in-1", "copy-3");
    expect(thrice.map((activity) => activity.name)).toEqual([
      "Échauffement",
      "Gainage",
      "Gainage (copie 3)",
      "Gainage (copie 2)",
      "Gainage (copie)",
      "Squats",
    ]);
    expect(ids(thrice)).toEqual(["before-1", "in-1", "copy-3", "copy-2", "copy-1", "in-2"]);
    expect(new Set(ids(thrice)).size).toBe(thrice.length);
  });

  it("names a copy of a copy from its exact source name", () => {
    const once = duplicateActivity(activities, "in-1", "copy-1");
    const ofCopy = duplicateActivity(once, "copy-1", "copy-2");
    expect(ofCopy.find((activity) => activity.id === "copy-2")?.name).toBe("Gainage (copie) (copie)");
  });

  it("nextCopyName takes the first free suffix, filling a gap", () => {
    expect(nextCopyName("Squat", [])).toBe("Squat (copie)");
    expect(nextCopyName("Squat", ["Squat", "Squat (copie)"])).toBe("Squat (copie 2)");
    expect(nextCopyName("Squat", ["Squat (copie)", "Squat (copie 3)"])).toBe("Squat (copie 2)");
    expect(nextCopyName("Squat", ["Squat (copie)", "Squat (copie 2)"])).toBe("Squat (copie 3)");
  });

  it("nextCopyName compare les noms normalisés (espaces), comme l'enregistrement", () => {
    expect(nextCopyName("Squat", ["  Squat   (copie) "])).toBe("Squat (copie 2)");
    expect(nextCopyName("  Squat  ", [])).toBe("Squat (copie)");
  });

  it("nextCopyName tronque la base (points de code) pour tenir dans NAME_MAX_LENGTH", () => {
    const long = "é".repeat(NAME_MAX_LENGTH);
    const first = nextCopyName(long, []);
    expect(Array.from(first)).toHaveLength(NAME_MAX_LENGTH);
    expect(first.endsWith(" (copie)")).toBe(true);
    const second = nextCopyName(long, [first]);
    expect(Array.from(second)).toHaveLength(NAME_MAX_LENGTH);
    expect(second.endsWith(" (copie 2)")).toBe(true);
    // Emoji (deux unités UTF-16) : jamais coupé en deux.
    const emoji = nextCopyName("💪".repeat(NAME_MAX_LENGTH), []);
    expect(Array.from(emoji)).toHaveLength(NAME_MAX_LENGTH);
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

  /**
   * V2-PRE-2 (plan §6.1, UI-9194767E574D-A0D8A00099FB7 ; 04 L259, CE-T03-08
   * L884) : la duplication reproduit la Récupération après exercice
   * attachée EXACTEMENT, sans jamais la relire du Profil.
   */
  it("conserves the source's own postActivityRecoverySeconds on the copy, never re-reading the Profile (V2-PRE-2)", () => {
    const withRecovery = anActivity("in-3", "IN_TOUR", { postActivityRecoverySeconds: 45 });
    const next = duplicateActivity([...activities, withRecovery], "in-3", "copy-1");
    expect(next.find((activity) => activity.id === "copy-1")?.postActivityRecoverySeconds).toBe(45);
  });
});

describe("appendActivityAfterLastDisplayed — side mode (V2-PRE-1)", () => {
  it("keeps the appended Activity's own side mode regardless of destination zone or composition state", () => {
    const next = appendActivityAfterLastDisplayed(
      [anActivity("in-1", "IN_TOUR")],
      anActivity("new-1", "IN_TOUR", { sideMode: "RIGHT_LEFT" }),
    );
    expect(next.find((activity) => activity.id === "new-1")?.sideMode).toBe("RIGHT_LEFT");
  });
});

/**
 * PRE-6 (story 1.2, AD-36, ARB-3) : opérations de Composition conscientes
 * des Points d'arrêt — matrice I/O de la spec 1.2.
 */
describe("moveOccurrence / duplicateOccurrence / removeOccurrence (Points d'arrêt, ARB-3)", () => {
  function stateOf(
    activities: readonly SessionDraftExercise[],
    stopPoints: CompositionState["stopPoints"],
  ): CompositionState {
    return { exercises: activities, stopPoints };
  }

  const abc = () => [anActivity("A", "IN_TOUR"), anActivity("B", "IN_TOUR"), anActivity("C", "IN_TOUR")];

  it("Déplacement : A(point) B C, A déposée après B → B A(point) C, point en p=2", () => {
    const state = stateOf(abc(), [{ id: "s", scope: "IN_TOUR", position: 1 }]);
    const next = moveOccurrence(state, "A", "IN_TOUR", 1);
    expect(ids(next.exercises)).toEqual(["B", "A", "C"]);
    expect(next.stopPoints).toEqual([{ id: "s", scope: "IN_TOUR", position: 2 }]);
  });

  it("Déplacement inter-portées : le point suit son occurrence dans sa nouvelle portée", () => {
    const state = stateOf([...abc(), anActivity("Z", "AFTER_TOUR")], [{ id: "s", scope: "IN_TOUR", position: 1 }]);
    const next = moveOccurrence(state, "A", "AFTER_TOUR", 0);
    expect(next.stopPoints).toEqual([{ id: "s", scope: "AFTER_TOUR", position: 1 }]);
  });

  it("les autres points suivent leur propre occurrence, un point en p=0 reste en tête", () => {
    const state = stateOf(
      [anActivity("P", "BEFORE_TOUR"), ...abc()],
      [
        { id: "sb", scope: "IN_TOUR", position: 2 },
        { id: "s0", scope: "IN_TOUR", position: 0 },
      ],
    );
    const next = moveOccurrence(state, "A", "IN_TOUR", 2);
    expect(ids(next.exercises)).toEqual(["P", "B", "C", "A"]);
    expect(next.stopPoints).toEqual([
      { id: "sb", scope: "IN_TOUR", position: 1 },
      { id: "s0", scope: "IN_TOUR", position: 0 },
    ]);
  });

  it("Déplacement interdit : A(point) déposée en dernière position, rien après → état inchangé", () => {
    const state = stateOf(abc(), [{ id: "s", scope: "IN_TOUR", position: 1 }]);
    expect(moveOccurrence(state, "A", "IN_TOUR", 2)).toBe(state);
  });

  it("Déplacement interdit : un autre point deviendrait le premier élément de la Séance", () => {
    const state = stateOf(
      [anActivity("P", "BEFORE_TOUR"), anActivity("A", "IN_TOUR"), anActivity("B", "IN_TOUR")],
      [{ id: "s0", scope: "IN_TOUR", position: 0 }],
    );
    expect(moveOccurrence(state, "P", "IN_TOUR", 2)).toBe(state);
  });

  it("identifiant inconnu : même référence ; sans point, les points restent la même référence", () => {
    const state = stateOf(abc(), []);
    expect(moveOccurrence(state, "inconnu", "IN_TOUR", 0)).toBe(state);
    expect(moveOccurrence(state, "A", "IN_TOUR", 1).stopPoints).toBe(state.stopPoints);
  });

  it("Duplication : A(point) B → A(point) A'(point copié) B", () => {
    const state = stateOf(
      [anActivity("A", "IN_TOUR"), anActivity("B", "IN_TOUR")],
      [{ id: "s", scope: "IN_TOUR", position: 1 }],
    );
    const next = duplicateOccurrence(state, "A", "A2", "s2");
    expect(ids(next.exercises)).toEqual(["A", "A2", "B"]);
    expect(next.stopPoints).toEqual([
      { id: "s", scope: "IN_TOUR", position: 1 },
      { id: "s2", scope: "IN_TOUR", position: 2 },
    ]);
  });

  it("Duplication d'une occurrence sans point : les points suivants se décalent, aucune copie", () => {
    const state = stateOf(abc(), [{ id: "sb", scope: "IN_TOUR", position: 2 }]);
    const next = duplicateOccurrence(state, "A", "A2", "unused");
    expect(next.stopPoints).toEqual([{ id: "sb", scope: "IN_TOUR", position: 3 }]);
  });

  it("Suppression : A(point) B ; supprimer A → B, aucun point", () => {
    const state = stateOf(
      [anActivity("A", "IN_TOUR"), anActivity("B", "IN_TOUR")],
      [{ id: "s", scope: "IN_TOUR", position: 1 }],
    );
    const next = removeOccurrence(state, "A");
    expect(ids(next.exercises)).toEqual(["B"]);
    expect(next.stopPoints).toEqual([]);
  });

  it("Suppression rendant interdit : A(point) B ; supprimer B → A, point retiré", () => {
    const state = stateOf(
      [anActivity("A", "IN_TOUR"), anActivity("B", "IN_TOUR")],
      [{ id: "s", scope: "IN_TOUR", position: 1 }],
    );
    const next = removeOccurrence(state, "B");
    expect(ids(next.exercises)).toEqual(["A"]);
    expect(next.stopPoints).toEqual([]);
  });

  it("Suppression : les points des autres occurrences sont recalculés", () => {
    const state = stateOf(abc(), [{ id: "sb", scope: "IN_TOUR", position: 2 }]);
    expect(removeOccurrence(state, "A").stopPoints).toEqual([{ id: "sb", scope: "IN_TOUR", position: 1 }]);
  });

  it("identifiant inconnu : duplication et suppression retournent la même référence", () => {
    const state = stateOf(abc(), [{ id: "s", scope: "IN_TOUR", position: 1 }]);
    expect(duplicateOccurrence(state, "inconnu", "x", "y")).toBe(state);
    expect(removeOccurrence(state, "inconnu")).toBe(state);
  });
});
