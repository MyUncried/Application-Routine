import { describe, expect, it } from "@jest/globals";

import {
  activitiesInZone,
  appendActivityAfterLastDisplayed,
  duplicateActivity,
  duplicateOccurrence,
  duplicateOccurrenceOutcome,
  groupActivitiesByZone,
  moveActivity,
  moveOccurrence,
  moveOccurrenceInSequence,
  moveOccurrenceOutcome,
  moveStopPoint,
  nextCopyName,
  orderActivitiesByZone,
  removeActivity,
  removeOccurrence,
  removeOccurrenceOutcome,
  stepOccurrence,
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
 * PRE-6 story 6.1 (D-436, RM-251 ; remplace ARB-3 de la story 1.2) :
 * opérations de Composition sur la séquence mêlée — les points gardent leur
 * place, toute opération invalide est refusée sans mutation. Matrice I/O de
 * la spec 6.1 et corrections de revue (tête de Circuit, Circuit vidé,
 * unicité, paires héritées, non-déplacement, « Monter » / « Descendre »).
 */
describe("opérations de Composition et Points d'arrêt indépendants (D-436, RM-251)", () => {
  function stateOf(
    activities: readonly SessionDraftExercise[],
    stopPoints: CompositionState["stopPoints"],
  ): CompositionState {
    return { exercises: activities, stopPoints };
  }
  const inTour = (...names: string[]) => names.map((name) => anActivity(name, "IN_TOUR"));
  const legacyRecovery = (name: string): SessionDraftExercise => ({ ...anActivity(name, "IN_TOUR"), type: "RECOVERY" });
  const point = (id: string, scope: StructuralPosition, position: number) => ({ id, scope, position });
  /** [W | A, P, B | Z] : P après A dans le Circuit. */
  const withCircuitPoint = () =>
    stateOf(
      [anActivity("W", "BEFORE_TOUR"), ...inTour("A", "B"), anActivity("Z", "AFTER_TOUR")],
      [point("P", "IN_TOUR", 1)],
    );

  describe("déplacer une occurrence (R1)", () => {
    it("[W, A, P, B] → A après B : [W, P, B, A], P reste à sa place", () => {
      const state = stateOf(inTour("W", "A", "B"), [point("P", "IN_TOUR", 2)]);
      const next = moveOccurrence(state, "A", "IN_TOUR", 2);
      expect(ids(next.exercises)).toEqual(["W", "B", "A"]);
      expect(next.stopPoints).toEqual([point("P", "IN_TOUR", 1)]);
    });

    it("[A, P, B, C] → A après B : P deviendrait premier (après le Compte à rebours) → refus, état inchangé", () => {
      const state = stateOf(inTour("A", "B", "C"), [point("P", "IN_TOUR", 1)]);
      expect(moveOccurrenceOutcome(state, "A", "IN_TOUR", 1)).toEqual({
        status: "REFUSED",
        reason: "STOP_POINT_NOT_ALLOWED",
        stopPointIds: ["P"],
      });
      expect(moveOccurrence(state, "A", "IN_TOUR", 1)).toBe(state);
    });

    it("[A, P, B] → B en tête : P deviendrait le dernier (juste avant la Fin) → refus", () => {
      const state = stateOf(inTour("A", "B"), [point("P", "IN_TOUR", 1)]);
      expect(moveOccurrenceOutcome(state, "B", "IN_TOUR", 0)).toEqual({
        status: "REFUSED",
        reason: "STOP_POINT_NOT_ALLOWED",
        stopPointIds: ["P"],
      });
    });

    it("[A, P, B, Q, C] → B après C : P et Q deviendraient consécutifs → refus", () => {
      const state = stateOf(inTour("A", "B", "C"), [point("P", "IN_TOUR", 1), point("Q", "IN_TOUR", 2)]);
      expect(moveOccurrenceOutcome(state, "B", "IN_TOUR", 2)).toEqual({
        status: "REFUSED",
        reason: "CONSECUTIVE_STOP_POINTS",
        stopPointIds: ["P", "Q"],
      });
      expect(moveOccurrence(state, "B", "IN_TOUR", 2)).toBe(state);
    });

    it("tête de Circuit : [W | A, P, B | Z], « Descendre » A (forme historique) amènerait P en (IN, 0) → refus", () => {
      const state = withCircuitPoint();
      expect(moveOccurrenceOutcome(state, "A", "IN_TOUR", 1)).toEqual({
        status: "REFUSED",
        reason: "STOP_POINT_NOT_ALLOWED",
        stopPointIds: ["P"],
      });
      expect(stepOccurrence(state, "A", "DOWN")).toMatchObject({ status: "REFUSED", reason: "STOP_POINT_NOT_ALLOWED" });
    });

    it("tête de Circuit : A sortie vers AFTER_TOUR → refus (P arriverait en tête)", () => {
      expect(moveOccurrenceOutcome(withCircuitPoint(), "A", "AFTER_TOUR", 0)).toMatchObject({
        status: "REFUSED",
        reason: "STOP_POINT_NOT_ALLOWED",
      });
    });

    it("inter-portées : un point hérité déjà en tête de Circuit y reste ; l'opération n'est pas refusée pour lui", () => {
      const state = stateOf(
        [anActivity("W", "BEFORE_TOUR"), ...inTour("A", "B"), anActivity("Z", "AFTER_TOUR")],
        [point("H", "IN_TOUR", 0)],
      );
      const outcome = moveOccurrenceOutcome(state, "A", "AFTER_TOUR", 0);
      expect(outcome.status).toBe("APPLIED");
      if (outcome.status === "APPLIED") {
        expect(ids(outcome.state.exercises)).toEqual(["W", "B", "A", "Z"]);
        expect(outcome.state.stopPoints).toBe(state.stopPoints);
      }
    });

    it("Circuit vidé alors qu'il porte un point : déplacement refusé", () => {
      const state = stateOf(
        [anActivity("W", "BEFORE_TOUR"), anActivity("A", "IN_TOUR"), anActivity("Z", "AFTER_TOUR")],
        [point("P", "IN_TOUR", 1)],
      );
      expect(moveOccurrenceOutcome(state, "A", "AFTER_TOUR", 1)).toEqual({
        status: "REFUSED",
        reason: "STOP_POINT_NOT_ALLOWED",
        stopPointIds: ["P"],
      });
    });

    it("Circuit vidé, « avant » + « après » le Circuit deviendraient consécutifs → refus", () => {
      const state = stateOf(
        [anActivity("W", "BEFORE_TOUR"), anActivity("A", "IN_TOUR"), anActivity("Z", "AFTER_TOUR")],
        [point("B", "BEFORE_TOUR", 1), point("C", "AFTER_TOUR", 0)],
      );
      expect(moveOccurrenceOutcome(state, "A", "AFTER_TOUR", 2)).toEqual({
        status: "REFUSED",
        reason: "CONSECUTIVE_STOP_POINTS",
        stopPointIds: ["B", "C"],
      });
    });

    it("convention de l'indice en occurrences : insérée AVANT le point qui occupe l'emplacement visé", () => {
      const state = stateOf(inTour("A", "B", "C"), [point("P", "IN_TOUR", 2)]);
      // Restent [B, P, C] : indice 1 = après B, donc avant P.
      const beforePoint = moveOccurrence(state, "A", "IN_TOUR", 1);
      expect(ids(beforePoint.exercises)).toEqual(["B", "A", "C"]);
      expect(beforePoint.stopPoints).toEqual([point("P", "IN_TOUR", 2)]);
      // Indice 2 = après C.
      const atEnd = moveOccurrence(state, "A", "IN_TOUR", 2);
      expect(ids(atEnd.exercises)).toEqual(["B", "C", "A"]);
      expect(atEnd.stopPoints).toEqual([point("P", "IN_TOUR", 1)]);
    });

    it("convention : en tête d'AFTER_TOUR, l'occurrence passe avant le point « après le Circuit »", () => {
      const state = stateOf(
        [anActivity("W", "BEFORE_TOUR"), ...inTour("A"), anActivity("Z", "AFTER_TOUR"), anActivity("Y", "AFTER_TOUR")],
        [point("C", "AFTER_TOUR", 0)],
      );
      const next = moveOccurrence(state, "Y", "AFTER_TOUR", 0);
      expect(ids(next.exercises)).toEqual(["W", "A", "Y", "Z"]);
      expect(next.stopPoints).toEqual([point("C", "AFTER_TOUR", 1)]);
    });

    it("non-déplacement (même portée, même rang d'occurrence) : l'entrée elle-même, aucun point ne change de côté", () => {
      const state = stateOf(inTour("A", "B", "C"), [point("P", "IN_TOUR", 1)]);
      expect(moveOccurrenceOutcome(state, "B", "IN_TOUR", 1)).toEqual({ status: "APPLIED", state });
      expect(moveOccurrence(state, "B", "IN_TOUR", 1)).toBe(state);
    });
  });

  describe("moveOccurrenceInSequence (contrat de l'indice mêlé)", () => {
    it("indice compté sur la séquence cible, source déjà retirée", () => {
      const state = stateOf(inTour("A", "B", "C"), [point("P", "IN_TOUR", 2)]);
      // [A, B, P, C] → restent [B, P, C] : rang 2 = après P.
      const afterPoint = moveOccurrenceInSequence(state, "A", "IN_TOUR", 2);
      expect(afterPoint.status).toBe("APPLIED");
      if (afterPoint.status === "APPLIED") {
        expect(ids(afterPoint.state.exercises)).toEqual(["B", "A", "C"]);
        expect(afterPoint.state.stopPoints).toEqual([point("P", "IN_TOUR", 1)]);
      }
      // Rang 1 = entre B et P.
      const beforePoint = moveOccurrenceInSequence(state, "A", "IN_TOUR", 1);
      expect(beforePoint.status === "APPLIED" && beforePoint.state.stopPoints).toEqual([point("P", "IN_TOUR", 2)]);
      expect(moveOccurrenceInSequence(state, "inconnu", "IN_TOUR", 0)).toEqual({ status: "NOT_FOUND" });
    });

    it("refus : [A, P, B, C], A au rang 1 de [P, B, C] → P deviendrait premier", () => {
      const state = stateOf(inTour("A", "B", "C"), [point("P", "IN_TOUR", 1)]);
      expect(moveOccurrenceInSequence(state, "A", "IN_TOUR", 1)).toEqual({
        status: "REFUSED",
        reason: "STOP_POINT_NOT_ALLOWED",
        stopPointIds: ["P"],
      });
    });

    it("même place (rang d'origine) : l'entrée elle-même", () => {
      const state = stateOf(inTour("A", "B", "C"), [point("P", "IN_TOUR", 1)]);
      // [A, P, B, C] : B est au rang 2 ; restent [A, P, C], le rang 2 est sa place.
      expect(moveOccurrenceInSequence(state, "B", "IN_TOUR", 2)).toEqual({ status: "APPLIED", state });
    });
  });

  describe("stepOccurrence (« Monter » / « Descendre » dans la séquence mêlée)", () => {
    const state = () =>
      stateOf(
        [anActivity("W", "BEFORE_TOUR"), ...inTour("A", "B", "C"), anActivity("Z", "AFTER_TOUR")],
        [point("P", "IN_TOUR", 1)],
      );

    it("échange avec le point voisin : B monte au-dessus de P", () => {
      const outcome = stepOccurrence(state(), "B", "UP");
      expect(outcome.status === "APPLIED" && outcome.state.stopPoints).toEqual([point("P", "IN_TOUR", 2)]);
    });

    it("échange avec l'occurrence voisine : B descend sous C, P ne bouge pas", () => {
      const initial = state();
      const outcome = stepOccurrence(initial, "B", "DOWN");
      expect(outcome.status).toBe("APPLIED");
      if (outcome.status === "APPLIED") {
        expect(ids(outcome.state.exercises)).toEqual(["W", "A", "C", "B", "Z"]);
        expect(outcome.state.stopPoints).toBe(initial.stopPoints);
      }
    });

    it("franchit les limites de portée comme aujourd'hui ; début et fin de Séance : AT_BOUNDARY", () => {
      const descended = stepOccurrence(state(), "C", "DOWN");
      expect(descended.status === "APPLIED" && ids(descended.state.exercises)).toEqual(["W", "A", "B", "C", "Z"]);
      expect(descended.status === "APPLIED" && descended.state.exercises[3]!.structuralPosition).toBe("AFTER_TOUR");
      expect(stepOccurrence(state(), "W", "UP")).toEqual({ status: "REFUSED", reason: "AT_BOUNDARY", stopPointIds: [] });
      expect(stepOccurrence(state(), "Z", "DOWN")).toEqual({ status: "REFUSED", reason: "AT_BOUNDARY", stopPointIds: [] });
      expect(stepOccurrence(state(), "inconnu", "UP")).toEqual({ status: "NOT_FOUND" });
    });

    it("en montant hors du Circuit, l'occurrence passe après le point final de la portée précédente", () => {
      const initial = stateOf(
        [anActivity("W", "BEFORE_TOUR"), ...inTour("A", "B"), anActivity("Z", "AFTER_TOUR")],
        [point("Q", "BEFORE_TOUR", 1)],
      );
      const outcome = stepOccurrence(initial, "A", "UP");
      expect(outcome.status).toBe("APPLIED");
      if (outcome.status === "APPLIED") {
        expect(ids(outcome.state.exercises)).toEqual(["W", "A", "B", "Z"]);
        expect(outcome.state.exercises[1]!.structuralPosition).toBe("BEFORE_TOUR");
        expect(outcome.state.stopPoints).toBe(initial.stopPoints);
      }
    });
  });

  describe("paires héritées et unicité", () => {
    /** [A, P, R, Q, B, C, D] : P et Q consécutifs (R, ancienne Récupération, ne sépare pas). */
    const legacyPair = () =>
      stateOf(
        [anActivity("A", "IN_TOUR"), legacyRecovery("R"), ...inTour("B", "C", "D")],
        [point("P", "IN_TOUR", 1), point("Q", "IN_TOUR", 2)],
      );

    it("une paire déjà consécutive, restée aux mêmes emplacements, n'est pas jugée", () => {
      const state = legacyPair();
      const next = moveOccurrence(state, "D", "IN_TOUR", 3);
      expect(next).not.toBe(state);
      expect(ids(next.exercises)).toEqual(["A", "R", "B", "D", "C"]);
      expect(next.stopPoints).toBe(state.stopPoints);
    });

    it("une paire héritée seulement renumérotée (occurrence déplacée devant elle) reste autorisée", () => {
      const state = legacyPair();
      const outcome = moveOccurrenceOutcome(state, "D", "IN_TOUR", 0);
      expect(outcome.status).toBe("APPLIED");
      if (outcome.status === "APPLIED") {
        expect(ids(outcome.state.exercises)).toEqual(["D", "A", "R", "B", "C"]);
        expect(outcome.state.stopPoints).toEqual([
          { id: "P", scope: "IN_TOUR", position: 2 },
          { id: "Q", scope: "IN_TOUR", position: 3 },
        ]);
      }
    });

    it("retirer ou sortir l'ancienne Récupération entre P et Q les réunirait → refus", () => {
      expect(removeOccurrenceOutcome(legacyPair(), "R")).toMatchObject({ status: "REFUSED" });
      expect(moveOccurrenceOutcome(legacyPair(), "R", "IN_TOUR", 4)).toMatchObject({ status: "REFUSED" });
    });

    it("moveStopPoint : déplacer P de l'autre côté de Q, qui reste adjacent, est refusé (aucune exemption)", () => {
      const state = stateOf(
        [anActivity("A", "IN_TOUR"), legacyRecovery("R1"), legacyRecovery("R2"), ...inTour("B", "C")],
        [point("P", "IN_TOUR", 1), point("Q", "IN_TOUR", 2)],
      );
      // [A, P, R1, Q, R2, B, C] → P après R2 : [A, R1, Q, R2, P, B, C].
      expect(moveStopPoint(state, "P", { scope: "IN_TOUR", position: 3 })).toEqual({
        status: "REFUSED",
        reason: "CONSECUTIVE_STOP_POINTS",
        stopPointIds: ["Q", "P"],
      });
    });
  });

  describe("supprimer une occurrence", () => {
    it("[A, P, B] : supprimer A → refus (P suivrait le Compte à rebours), raison fournie", () => {
      const state = stateOf(inTour("A", "B"), [point("P", "IN_TOUR", 1)]);
      expect(removeOccurrenceOutcome(state, "A")).toEqual({
        status: "REFUSED",
        reason: "STOP_POINT_NOT_ALLOWED",
        stopPointIds: ["P"],
      });
      expect(removeOccurrence(state, "A")).toBe(state);
    });

    it("[A, P, B] : supprimer B → refus (P précéderait la Fin) ; aucune suppression silencieuse", () => {
      const state = stateOf(inTour("A", "B"), [point("P", "IN_TOUR", 1)]);
      expect(removeOccurrenceOutcome(state, "B")).toEqual({
        status: "REFUSED",
        reason: "STOP_POINT_NOT_ALLOWED",
        stopPointIds: ["P"],
      });
      expect(removeOccurrence(state, "B")).toBe(state);
    });

    it("[A, P, B, Q, C] : supprimer B → refus (P, Q consécutifs)", () => {
      const state = stateOf(inTour("A", "B", "C"), [point("P", "IN_TOUR", 1), point("Q", "IN_TOUR", 2)]);
      expect(removeOccurrenceOutcome(state, "B")).toEqual({
        status: "REFUSED",
        reason: "CONSECUTIVE_STOP_POINTS",
        stopPointIds: ["P", "Q"],
      });
    });

    it("[W | A, P, B | Z] : supprimer A amènerait P en tête de Circuit → refus", () => {
      expect(removeOccurrenceOutcome(withCircuitPoint(), "A")).toMatchObject({
        status: "REFUSED",
        reason: "STOP_POINT_NOT_ALLOWED",
      });
    });

    it("Circuit vidé par une suppression : refusé s'il porte un point ; « avant » + « après » consécutifs → refus", () => {
      const withPoint = stateOf(
        [anActivity("W", "BEFORE_TOUR"), anActivity("A", "IN_TOUR"), anActivity("Z", "AFTER_TOUR")],
        [point("P", "IN_TOUR", 1)],
      );
      expect(removeOccurrenceOutcome(withPoint, "A")).toMatchObject({ status: "REFUSED", reason: "STOP_POINT_NOT_ALLOWED" });
      const borders = stateOf(
        [anActivity("W", "BEFORE_TOUR"), anActivity("A", "IN_TOUR"), anActivity("Z", "AFTER_TOUR")],
        [point("B", "BEFORE_TOUR", 1), point("C", "AFTER_TOUR", 0)],
      );
      expect(removeOccurrenceOutcome(borders, "A")).toEqual({
        status: "REFUSED",
        reason: "CONSECUTIVE_STOP_POINTS",
        stopPointIds: ["B", "C"],
      });
    });

    it("suppression acceptée : les points restent à leur place, leur position est recalculée", () => {
      const state = stateOf(inTour("A", "B", "C"), [point("P", "IN_TOUR", 2)]);
      const next = removeOccurrence(state, "A");
      expect(ids(next.exercises)).toEqual(["B", "C"]);
      expect(next.stopPoints).toEqual([point("P", "IN_TOUR", 1)]);
    });

    it("suppression sans effet sur les points : même référence de points", () => {
      const state = stateOf(inTour("A", "B", "C", "D"), [point("P", "IN_TOUR", 1)]);
      const next = removeOccurrence(state, "C");
      expect(ids(next.exercises)).toEqual(["A", "B", "D"]);
      expect(next.stopPoints).toBe(state.stopPoints);
    });
  });

  describe("dupliquer une occurrence", () => {
    it("[A, P, B] → [A, A′, P, B] : le point n'est pas copié, la récupération l'est", () => {
      const state = stateOf(
        [anActivity("A", "IN_TOUR", { postActivityRecoverySeconds: 30 }), anActivity("B", "IN_TOUR")],
        [point("P", "IN_TOUR", 1)],
      );
      expect(duplicateOccurrenceOutcome(state, "A", "A2").status).toBe("APPLIED");
      const next = duplicateOccurrence(state, "A", "A2", "inutilisé");
      expect(ids(next.exercises)).toEqual(["A", "A2", "B"]);
      expect(next.exercises[1]!.postActivityRecoverySeconds).toBe(30);
      expect(next.stopPoints).toEqual([point("P", "IN_TOUR", 2)]);
    });

    it("les points qui précèdent la source ne bougent pas", () => {
      const state = stateOf(inTour("A", "B", "C"), [point("P", "IN_TOUR", 1)]);
      expect(duplicateOccurrence(state, "B", "B2").stopPoints).toBe(state.stopPoints);
    });

    it("un point hérité hors bornes ou de position non entière est laissé intact", () => {
      const far = point("X", "IN_TOUR", 9);
      const fractional = point("Y", "BEFORE_TOUR", 0.5);
      const state = stateOf(
        [anActivity("W", "BEFORE_TOUR"), ...inTour("A", "B", "C"), anActivity("Z", "AFTER_TOUR")],
        [point("P", "IN_TOUR", 1), far, fractional],
      );
      const next = duplicateOccurrence(state, "A", "A2");
      expect(next.stopPoints).toEqual([point("P", "IN_TOUR", 2), far, fractional]);
      expect(next.stopPoints[1]).toBe(far);
      expect(next.stopPoints[2]).toBe(fractional);
    });

    it("entrée invalide : un identifiant de copie déjà présent lève une exception", () => {
      const state = stateOf(inTour("A", "B"), []);
      expect(() => duplicateOccurrenceOutcome(state, "A", "B")).toThrow();
    });
  });

  describe("déplacer un point (R2)", () => {
    it("[A, P, B, C] → P après B : [A, B, P, C], identité conservée", () => {
      const state = stateOf(inTour("A", "B", "C"), [point("P", "IN_TOUR", 1)]);
      const outcome = moveStopPoint(state, "P", { scope: "IN_TOUR", position: 2 });
      expect(outcome).toEqual({
        status: "APPLIED",
        state: { exercises: state.exercises, stopPoints: [point("P", "IN_TOUR", 2)] },
      });
      expect(outcome.status === "APPLIED" && outcome.state.exercises).toBe(state.exercises);
    });

    it("[A, P, B, Q, C, Z] → P après C : autorisé (ni consécutif ni avant la Fin)", () => {
      const state = stateOf(
        [...inTour("A", "B", "C"), anActivity("Z", "AFTER_TOUR")],
        [point("P", "IN_TOUR", 1), point("Q", "IN_TOUR", 2)],
      );
      expect(moveStopPoint(state, "P", { scope: "IN_TOUR", position: 3 }).status).toBe("APPLIED");
    });

    it("refus : consécutif (frontière du Circuit), emplacement occupé, interdit, tête de Circuit", () => {
      const state = stateOf(
        [anActivity("W", "BEFORE_TOUR"), ...inTour("A", "B"), anActivity("Z", "AFTER_TOUR")],
        [point("P", "BEFORE_TOUR", 1), point("L", "IN_TOUR", 2)],
      );
      expect(moveStopPoint(state, "P", { scope: "AFTER_TOUR", position: 0 })).toEqual({
        status: "REFUSED",
        reason: "CONSECUTIVE_STOP_POINTS",
        stopPointIds: ["L", "P"],
      });
      expect(moveStopPoint(state, "P", { scope: "IN_TOUR", position: 2 })).toEqual({
        status: "REFUSED",
        reason: "LOCATION_OCCUPIED",
        stopPointIds: ["P", "L"],
      });
      expect(moveStopPoint(state, "P", { scope: "AFTER_TOUR", position: 1 })).toMatchObject({
        status: "REFUSED",
        reason: "STOP_POINT_NOT_ALLOWED",
      });
      expect(moveStopPoint(state, "P", { scope: "BEFORE_TOUR", position: 0 })).toMatchObject({ status: "REFUSED" });
      expect(moveStopPoint(state, "P", { scope: "IN_TOUR", position: 0 })).toMatchObject({
        status: "REFUSED",
        reason: "STOP_POINT_NOT_ALLOWED",
      });
    });

    it("même emplacement : l'entrée elle-même ; point inconnu : NOT_FOUND", () => {
      const state = stateOf(inTour("A", "B"), [point("P", "IN_TOUR", 1)]);
      expect(moveStopPoint(state, "P", { scope: "IN_TOUR", position: 1 })).toEqual({ status: "APPLIED", state });
      expect(moveStopPoint(state, "X", { scope: "IN_TOUR", position: 1 })).toEqual({ status: "NOT_FOUND" });
    });
  });

  it("identifiant inconnu : formes historiques à l'identique, résultats NOT_FOUND ; sans point, même référence de points", () => {
    const state = stateOf(inTour("A", "B", "C"), [point("P", "IN_TOUR", 1)]);
    expect(moveOccurrence(state, "inconnu", "IN_TOUR", 0)).toBe(state);
    expect(duplicateOccurrence(state, "inconnu", "x", "y")).toBe(state);
    expect(removeOccurrence(state, "inconnu")).toBe(state);
    expect(moveOccurrenceOutcome(state, "inconnu", "IN_TOUR", 0)).toEqual({ status: "NOT_FOUND" });
    expect(removeOccurrenceOutcome(state, "inconnu")).toEqual({ status: "NOT_FOUND" });
    expect(duplicateOccurrenceOutcome(state, "inconnu", "x")).toEqual({ status: "NOT_FOUND" });
    const empty = stateOf(inTour("A", "B"), []);
    expect(moveOccurrence(empty, "A", "IN_TOUR", 1).stopPoints).toBe(empty.stopPoints);
  });
});
