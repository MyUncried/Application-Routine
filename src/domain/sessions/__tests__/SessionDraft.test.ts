import { describe, expect, it } from "@jest/globals";

import { DEFAULT_SESSION_COLOR, type Activity, type Session } from "@/domain/sessions/Session";
import {
  createEmptyDraft,
  createExerciseDraft,
  exerciseEquals,
  isSessionDraftDirty,
  sessionDraftsEqual,
  toCreateSessionInput,
  toSessionDraft,
  toUpdateSessionInput,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import {
  DEFAULT_ACTIVITY_TYPE,
  DEFAULT_EXECUTION_MODE,
  DEFAULT_EXERCISE_DURATION_SECONDS,
  DEFAULT_FINAL_PHASE_SECONDS,
  DEFAULT_INITIAL_COUNTDOWN_SECONDS,
  DEFAULT_PAUSE_SECONDS,
  DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS,
  DEFAULT_SERIES_COUNT,
  DEFAULT_SIDE_MODE,
  DEFAULT_STRUCTURAL_POSITION,
  DEFAULT_TOUR_REPEAT_COUNT,
} from "@/domain/sessions/defaults";
import { activityDefinitionToDraftExercise, type ActivityDefinition } from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import {
  allFailureParameters,
  durationParameters,
  uniformParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import { duplicateActivity } from "@/domain/sessions/composition";

describe("createEmptyDraft", () => {
  it("initializes every field from the canonical defaults, with no Activity and no Category yet", () => {
    expect(createEmptyDraft()).toEqual({
      sourceSessionId: null,
      name: "",
      labelId: null,
      initialCountdownSeconds: DEFAULT_INITIAL_COUNTDOWN_SECONDS,
      finalPhaseSeconds: DEFAULT_FINAL_PHASE_SECONDS,
      tourRepeatCount: DEFAULT_TOUR_REPEAT_COUNT,
      exercises: [],
    });
  });
});

describe("createExerciseDraft", () => {
  it("initializes an empty name, Duration mode, the canonical default duration, one Series without pause nor Récupération, no instruction, no body zone", () => {
    expect(createExerciseDraft("ex-1")).toEqual({
      id: "ex-1",
      type: DEFAULT_ACTIVITY_TYPE,
      structuralPosition: DEFAULT_STRUCTURAL_POSITION,
      name: "",
      // PRE-4 (story 1.1, AD-3) : paramètres typés, Cible `NUMBER` par défaut.
      executionParameters: uniformParameters({
        mode: DEFAULT_EXECUTION_MODE,
        count: DEFAULT_SERIES_COUNT,
        target: DEFAULT_EXERCISE_DURATION_SECONDS,
        pauseSeconds: DEFAULT_PAUSE_SECONDS,
      }),
      // T02-S02 : la Récupération ATTACHÉE naît neutre (`0`) — jamais la
      // durée par défaut de l'ancienne Activité `RECOVERY` autonome, qui
      // aurait ajouté une récupération non demandée à chaque Activité.
      // PRE-6 (story 1.1, AD-35) : elle naît ABSENTE (`null`), distincte de 0.
      postActivityRecoverySeconds: null,
      instruction: null,
      bodyZoneIds: [],
      // V2-BILAT-01 : une nouvelle Activité naît `UNILATERAL` (comportement
      // historique, aucune répétition de côté).
      sideMode: DEFAULT_SIDE_MODE,
    });
    expect(DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS).toBe(0);
  });

  it("uses exactly the id provided by the caller, never a generated one", () => {
    expect(createExerciseDraft("a").id).toBe("a");
    expect(createExerciseDraft("b").id).toBe("b");
  });

  // PRE-6 (story 1.1, AD-35) : sans valeur fournie, l'occurrence naît sans récupération (`null`).
  it("starts without any Récupération (null, absent) when no postActivityRecoverySeconds is provided (PRE-6, AD-35)", () => {
    expect(createExerciseDraft("ex-1").postActivityRecoverySeconds).toBeNull();
  });

  it("uses the explicit postActivityRecoverySeconds provided by the caller — the Profile's current value at creation time (V2-PRE-2, D-171/D-213)", () => {
    expect(createExerciseDraft("ex-1", 30).postActivityRecoverySeconds).toBe(30);
  });
});

describe("bornes de séance au-delà de 60 s (PRE-6 story 7.8, D-438)", () => {
  const legacy = (initialCountdownSeconds: number, finalPhaseSeconds: number): Session => ({
    id: "session-legacy",
    ownerId: "usr_test",
    name: "Ancienne",
    color: DEFAULT_SESSION_COLOR,
    status: "ACTIVE",
    initialCountdownSeconds,
    finalPhaseSeconds,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    cycle: {
      id: "cycle-1",
      position: 1,
      repeatCount: 1,
      tour: { id: "tour-1", position: 1, repeatCount: 1, exercises: [anActivity()] },
    },
  });

  it("a persisted value above 60 s is read back at 60 s; 60 and below are unchanged", () => {
    expect(toSessionDraft(legacy(600, 61))).toMatchObject({ initialCountdownSeconds: 60, finalPhaseSeconds: 60 });
    expect(toSessionDraft(legacy(60, 0))).toMatchObject({ initialCountdownSeconds: 60, finalPhaseSeconds: 0 });
  });

  it("the read-back value does not mark the draft modified (draft and baseline share the reading) and is saved at 60 s", () => {
    const session = legacy(600, 90);
    const baseline = toSessionDraft(session);
    const draft = toSessionDraft(session);
    expect(isSessionDraftDirty(draft, baseline)).toBe(false);
    // Revue 7.8 : la lecture bornée est celle d'une Séance à 60 / 60 (le bornage est effectif).
    expect(sessionDraftsEqual(baseline, toSessionDraft(legacy(60, 60)))).toBe(true);
    const update = toUpdateSessionInput(draft);
    expect(update.ok).toBe(true);
    if (update.ok) {
      expect(update.value).toMatchObject({ initialCountdownSeconds: 60, finalPhaseSeconds: 60 });
    }
  });

  it("a Profile default above 60 s (kept by D-265) creates a draft at 60 s", () => {
    expect(createEmptyDraft({ initialCountdownSeconds: 120, finalPhaseSeconds: 45 })).toMatchObject({
      initialCountdownSeconds: 60,
      finalPhaseSeconds: 45,
    });
  });
});

describe("createEmptyDraft with Profile defaults (V2-PRE-2, D-213)", () => {
  it("uses the Domain's canonical constants when no defaults are provided (T19)", () => {
    const draft = createEmptyDraft();
    expect(draft.initialCountdownSeconds).toBe(DEFAULT_INITIAL_COUNTDOWN_SECONDS);
    expect(draft.finalPhaseSeconds).toBe(DEFAULT_FINAL_PHASE_SECONDS);
  });

  it("uses the Profile's current values when provided — a new Session receives Compte à rebours initial and Fin de séance from the Profile", () => {
    const draft = createEmptyDraft({ initialCountdownSeconds: 20, finalPhaseSeconds: 15 });
    expect(draft.initialCountdownSeconds).toBe(20);
    expect(draft.finalPhaseSeconds).toBe(15);
  });

  it("is not considered modified when compared to itself as a baseline (a fresh draft is never dirty)", () => {
    const draft = createEmptyDraft({ initialCountdownSeconds: 20, finalPhaseSeconds: 15 });
    expect(isSessionDraftDirty(draft, draft)).toBe(false);
  });
});

function anActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "activity-1",
    type: "EXERCISE",
    structuralPosition: "IN_TOUR",
    position: 0,
    name: "Gainage",
    executionParameters: durationParameters(30),
    postActivityRecoverySeconds: 0,
    instruction: null,
    bodyZoneIds: [],
    ...overrides,
  };
}

describe("toSessionDraft", () => {
  function aSession(overrides: Partial<Session> = {}): Session {
    return {
      id: "session-1",
      ownerId: "usr_test",
      name: "Séance simple",
      color: DEFAULT_SESSION_COLOR,
      status: "ACTIVE",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      cycle: {
        id: "cycle-1",
        position: 1,
        repeatCount: 1,
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 1,
          exercises: [anActivity()],
        },
      },
      ...overrides,
    };
  }

  it("copies the editable fields exactly, keeping the source session id, tour repeat and each Activity's own id / type / structural position", () => {
    const session = aSession();
    expect(toSessionDraft(session)).toEqual({
      sourceSessionId: "session-1",
      name: "Séance simple",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [
        {
          id: "activity-1",
          type: "EXERCISE",
          structuralPosition: "IN_TOUR",
          name: "Gainage",
          executionParameters: durationParameters(30),
          // T02-S02 : la Récupération attachée traverse la réhydratation du
          // brouillon comme n'importe quel autre paramètre.
          postActivityRecoverySeconds: 0,
          instruction: null,
          bodyZoneIds: [],
          // V2-BILAT-01 : `Activity.sideMode` est un champ optionnel de
          // transition — `anActivity()` ne le transmet pas, la conversion
          // retombe donc sur `DEFAULT_SIDE_MODE`.
          sideMode: DEFAULT_SIDE_MODE,
        },
      ],
      // PRE-4 story 4.1 (AC13) : occurrences chargées, champ de transport non comparé.
      persistedExerciseIds: ["activity-1"],
    });
  });

  it("carries the attached Récupération from the persisted Activity into the draft (T02-S02)", () => {
    const session = aSession({
      cycle: {
        id: "cycle-1",
        position: 1,
        repeatCount: 1,
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 1,
          exercises: [anActivity({ postActivityRecoverySeconds: 45 })],
        },
      },
    });
    expect(toSessionDraft(session).exercises[0]).toMatchObject({ postActivityRecoverySeconds: 45 });
  });

  it("maps every persisted Activity, in order, never only the first (T01-S09)", () => {
    const session = aSession({
      cycle: {
        id: "cycle-1",
        position: 1,
        repeatCount: 1,
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 1,
          exercises: [
            anActivity({ id: "a1", name: "Gainage" }),
            anActivity({ id: "a2", name: "Squats", position: 1 }),
          ],
        },
      },
    });
    const draft = toSessionDraft(session);
    expect(draft.exercises.map((exercise) => exercise.id)).toEqual(["a1", "a2"]);
    expect(draft.exercises.map((exercise) => exercise.name)).toEqual(["Gainage", "Squats"]);
  });

  it("preserves each Activity's real bodyZoneIds (no longer forced to [])", () => {
    const session = aSession({
      cycle: {
        id: "cycle-1",
        position: 1,
        repeatCount: 1,
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 1,
          exercises: [anActivity({ bodyZoneIds: ["dos", "epaules"] })],
        },
      },
    });
    expect(toSessionDraft(session).exercises[0]?.bodyZoneIds).toEqual(["dos", "epaules"]);
  });

  it("preserves a null instruction without turning it into an empty string", () => {
    const session = aSession({
      cycle: {
        id: "cycle-1",
        position: 1,
        repeatCount: 1,
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 1,
          exercises: [anActivity({ instruction: null })],
        },
      },
    });
    expect(toSessionDraft(session).exercises[0]?.instruction).toBeNull();
  });

  it("round-trips through toCreateSessionInput to reproduce the original editable fields", () => {
    const session = aSession();
    const result = toCreateSessionInput(toSessionDraft(session));
    expect(result).toEqual({
      ok: true,
      value: {
        name: session.name,
        labelId: null,
        initialCountdownSeconds: session.initialCountdownSeconds,
        finalPhaseSeconds: session.finalPhaseSeconds,
        // T02-S01 : la répétition du Tour, l'identifiant, le type et la zone
        // structurelle de chaque Activité traversent désormais le chemin de
        // création — ils étaient perdus au profit de littéraux fixes.
        tourRepeatCount: 1,
        exercises: [
          {
            id: "activity-1",
            type: "EXERCISE",
            structuralPosition: "IN_TOUR",
            name: "Gainage",
            executionParameters: durationParameters(30),
            postActivityRecoverySeconds: 0,
            instruction: null,
            bodyZoneIds: [],
          },
        ],
        stopPoints: [],
      },
    });
  });
});

describe("sessionDraftsEqual (T01-S10, CE-T01-S10-06 — garde de sortie en modification)", () => {
  function aDraft(overrides: Partial<SessionDraft> = {}): SessionDraft {
    return {
      ...createEmptyDraft(),
      name: "Séance",
      tourRepeatCount: 2,
      exercises: [{ ...createExerciseDraft("keep-1"), name: "Gainage", executionParameters: durationParameters(30) }],
      ...overrides,
    };
  }

  it("is true for two functionally identical drafts, even with different sourceSessionId (identity field, never compared)", () => {
    expect(
      sessionDraftsEqual(
        { ...aDraft(), sourceSessionId: "s-1" },
        { ...aDraft(), sourceSessionId: "s-2" },
      ),
    ).toBe(true);
  });

  it("is false as soon as any functional field differs (name, tour repeat, an Activity field, the Étiquette)", () => {
    expect(sessionDraftsEqual(aDraft(), aDraft({ name: "Autre" }))).toBe(false);
    expect(sessionDraftsEqual(aDraft(), aDraft({ tourRepeatCount: 5 }))).toBe(false);
    expect(
      sessionDraftsEqual(aDraft(), aDraft({ exercises: [{ ...createExerciseDraft("keep-1"), name: "X", executionParameters: durationParameters(30) }] })),
    ).toBe(false);
    expect(sessionDraftsEqual(aDraft(), aDraft({ labelId: "focus" }))).toBe(false);
  });
});

describe("isSessionDraftDirty", () => {
  it("is false for a freshly created empty draft", () => {
    expect(isSessionDraftDirty(createEmptyDraft())).toBe(false);
  });

  it("compares against an explicit baseline (V2-PRE-2, T18) — a draft matching its own Profile-derived baseline is never dirty", () => {
    const baseline = createEmptyDraft({ initialCountdownSeconds: 20, finalPhaseSeconds: 15 });
    expect(isSessionDraftDirty(baseline, baseline)).toBe(false);
    expect(isSessionDraftDirty({ ...baseline, name: "Autre" }, baseline)).toBe(true);
  });

  it("is true as soon as one Activity is present (empty draft has exercises: [])", () => {
    expect(
      isSessionDraftDirty({ ...createEmptyDraft(), exercises: [createExerciseDraft("ex-1")] }),
    ).toBe(true);
  });

  it("is order-sensitive between two otherwise-identical Activities", () => {
    const a = createExerciseDraft("ex-1");
    const b = { ...createExerciseDraft("ex-2"), name: "Squats" };
    expect(isSessionDraftDirty({ ...createEmptyDraft(), exercises: [a, b] })).toBe(true);
    expect(isSessionDraftDirty({ ...createEmptyDraft(), exercises: [b, a] })).toBe(true);
  });

  it("is true as soon as an Étiquette is selected (empty draft has labelId: null)", () => {
    expect(isSessionDraftDirty({ ...createEmptyDraft(), labelId: "focus" })).toBe(true);
  });

  it("is false again once labelId is explicitly reset to null, matching the empty draft exactly", () => {
    const withLabel: SessionDraft = { ...createEmptyDraft(), labelId: "focus" };
    expect(isSessionDraftDirty({ ...withLabel, labelId: null })).toBe(false);
  });
});

describe("exerciseEquals (exported for ExerciseScreen, T01-S08)", () => {
  it("is true for two null exercises", () => {
    expect(exerciseEquals(null, null)).toBe(true);
  });

  it("is false when only one side is null", () => {
    expect(exerciseEquals(null, createExerciseDraft("ex-1"))).toBe(false);
    expect(exerciseEquals(createExerciseDraft("ex-1"), null)).toBe(false);
  });

  it("is true for two structurally identical, distinct objects", () => {
    expect(exerciseEquals(createExerciseDraft("ex-1"), { ...createExerciseDraft("ex-1") })).toBe(
      true,
    );
  });

  it("compares bodyZoneIds as a set: order never matters, content does", () => {
    const a: SessionDraftExercise = { ...createExerciseDraft("ex-1"), bodyZoneIds: ["dos", "epaules"] };
    const bReordered: SessionDraftExercise = {
      ...createExerciseDraft("ex-1"),
      bodyZoneIds: ["epaules", "dos"],
    };
    expect(exerciseEquals(a, bReordered)).toBe(true);
  });

  it("detects a change of the attached Récupération — otherwise the exit guard would let it be lost silently (T02-S02)", () => {
    expect(
      exerciseEquals(createExerciseDraft("ex-1"), {
        ...createExerciseDraft("ex-1"),
        postActivityRecoverySeconds: 30,
      }),
    ).toBe(false);
  });
});

describe("toCreateSessionInput (T01-S09, multi-exercise)", () => {
  function completeDraft(): SessionDraft {
    return {
      name: "Séance simple",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(30) }],
    };
  }

  it("fails on an empty draft and reports every violation at once (session name + zero Activity)", () => {
    const result = toCreateSessionInput(createEmptyDraft());
    expect(result).toEqual({
      ok: false,
      violations: [
        { code: "REQUIRED", field: "session.name" },
        { code: "REQUIRED", field: "exercise.name" },
        { code: "REQUIRED", field: "exercise.durationSeconds" },
      ],
    });
  });

  it("succeeds and converts a fully completed draft to a persistable CreateSessionInput", () => {
    const result = toCreateSessionInput(completeDraft());
    expect(result).toEqual({
      ok: true,
      value: {
        name: "Séance simple",
        labelId: null,
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        tourRepeatCount: DEFAULT_TOUR_REPEAT_COUNT,
        exercises: [
          {
            id: "ex-1",
            type: DEFAULT_ACTIVITY_TYPE,
            structuralPosition: DEFAULT_STRUCTURAL_POSITION,
            name: "Gainage",
            executionParameters: durationParameters(30),
            // PRE-6 (story 1.1, AD-35) : occurrence née sans récupération.
            postActivityRecoverySeconds: null,
            instruction: null,
            bodyZoneIds: [],
          },
        ],
        stopPoints: [],
      },
    });
  });

  // T02-S01 (AC-01/AC-08/AC-12) : le chemin de création transporte les trois
  // zones et la répétition réelle du Tour — il produisait auparavant, quel
  // que soit le brouillon, des Exercices `IN_TOUR` d'un Tour figé à `1`.
  //
  // T02-S02 : la troisième Activité de ce scénario était une Récupération
  // AUTONOME (`type: "RECOVERY"`). Ce type n'est plus créable — la
  // Récupération est désormais un paramètre ATTACHÉ (`postActivityRecoverySeconds`) — et
  // le cas de refus est prouvé par le test suivant.
  it("carries the three structural zones, the attached Récupération and the real tour repeat count through creation", () => {
    const draft: SessionDraft = {
      ...completeDraft(),
      tourRepeatCount: 4,
      exercises: [
        {
          ...createExerciseDraft("warmup"),
          name: "Échauffement",
          executionParameters: durationParameters(60),
          structuralPosition: "BEFORE_TOUR",
        },
        {
          ...createExerciseDraft("core"),
          name: "Gainage",
          executionParameters: durationParameters(30),
          structuralPosition: "IN_TOUR",
          postActivityRecoverySeconds: 45,
        },
        {
          ...createExerciseDraft("stretch"),
          name: "Étirements",
          executionParameters: durationParameters(45),
          structuralPosition: "AFTER_TOUR",
          bodyZoneIds: ["dos"],
        },
      ],
    };

    const result = toCreateSessionInput(draft);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tourRepeatCount).toBe(4);
      expect(
        result.value.exercises.map((exercise) => [
          exercise.id,
          exercise.type,
          exercise.structuralPosition,
        ]),
      ).toEqual([
        ["warmup", "EXERCISE", "BEFORE_TOUR"],
        ["core", "EXERCISE", "IN_TOUR"],
        ["stretch", "EXERCISE", "AFTER_TOUR"],
      ]);
      expect(result.value.exercises.map((exercise) => exercise.postActivityRecoverySeconds)).toEqual([
        // PRE-6 (story 1.1, AD-35) : absentes (`null`) hors l'occurrence à 45 s.
        null, 45, null,
      ]);
    }
  });

  /**
   * T02-S02 — verrou de Domaine. La Récupération autonome (`type:
   * "RECOVERY"`, D-041) n'est plus un type d'Activité créable : le CHECK de
   * `migration001` est immuable et connaît toujours cette valeur, mais aucune
   * écriture ne doit plus la produire. Le brouillon ne peut plus l'exprimer
   * par l'écran, ce test prouve le refus au niveau du DOMAINE — la seule
   * barrière que ni l'écran, ni un appelant futur ne peuvent contourner.
   */
  it("refuses to create a standalone RECOVERY Activity — the Récupération is an attached parameter (T02-S02)", () => {
    const draft: SessionDraft = {
      ...completeDraft(),
      exercises: [
        {
          ...createExerciseDraft("rec"),
          name: "Récupération",
          type: "RECOVERY",
          executionParameters: durationParameters(45),
        },
      ],
    };
    const result = toCreateSessionInput(draft);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toContainEqual({
        code: "MUST_BE_ABSENT",
        field: "activity.type",
      });
    }
  });

  it("persists ALL Activities of the collection, in order, without loss — supersedes the REWORK12-era 'first exercise only' limitation", () => {
    const draft: SessionDraft = {
      ...completeDraft(),
      exercises: [
        { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(30) },
        { ...createExerciseDraft("ex-2"), name: "Squats", executionParameters: durationParameters(45, 3) },
      ],
    };
    const result = toCreateSessionInput(draft);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.exercises).toHaveLength(2);
      expect(result.value.exercises.map((exercise) => exercise.name)).toEqual(["Gainage", "Squats"]);
      expect(result.value.exercises[1]).toMatchObject({ name: "Squats", executionParameters: durationParameters(45, 3) });
    }
  });

  it("never throws, even on an entirely invalid draft", () => {
    expect(() => toCreateSessionInput(createEmptyDraft())).not.toThrow();
  });
});

describe("toSessionDraft — Récupération, positions structurelles et répétition du Tour (T01-S10)", () => {
  it("rehydrates a tour repeat count greater than 1, in reading order before / in / after the Tour", () => {
    const session: Session = {
      id: "session-1",
      ownerId: "usr_test",
      name: "Séance structurée",
      color: DEFAULT_SESSION_COLOR,
      status: "ACTIVE",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      cycle: {
        id: "cycle-1",
        position: 1,
        repeatCount: 1,
        beforeTour: [anActivity({ id: "warmup", name: "Échauffement", structuralPosition: "BEFORE_TOUR", position: 0 })],
        afterTour: [
          anActivity({
            id: "rec",
            name: "Récupération",
            type: "RECOVERY",
            structuralPosition: "AFTER_TOUR",
            position: 0,
            executionParameters: durationParameters(45),
            bodyZoneIds: [],
          }),
        ],
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 4,
          exercises: [anActivity({ id: "core", name: "Gainage", position: 0 })],
        },
      },
      categories: [],
    };

    const draft = toSessionDraft(session);
    expect(draft.sourceSessionId).toBe("session-1");
    expect(draft.tourRepeatCount).toBe(4);
    expect(draft.exercises.map((exercise) => exercise.id)).toEqual(["warmup", "core", "rec"]);
    expect(draft.exercises.map((exercise) => exercise.structuralPosition)).toEqual([
      "BEFORE_TOUR",
      "IN_TOUR",
      "AFTER_TOUR",
    ]);
    expect(draft.exercises[2]).toMatchObject({ type: "RECOVERY", executionParameters: durationParameters(45) });
  });
});

describe("toUpdateSessionInput (T01-S10, Q3-A — jamais toCreateSessionInput)", () => {
  function editDraft(overrides: Partial<SessionDraft> = {}): SessionDraft {
    return {
      ...createEmptyDraft(),
      sourceSessionId: "session-42",
      name: "Séance à modifier",
      tourRepeatCount: 3,
      exercises: [
        { ...createExerciseDraft("act-1"), name: "Gainage", executionParameters: durationParameters(30) },
      ],
      ...overrides,
    };
  }

  it("fails with REQUIRED session.sourceSessionId when the draft is a creation draft", () => {
    const result = toUpdateSessionInput({ ...editDraft(), sourceSessionId: null });
    expect(result).toEqual({
      ok: false,
      violations: [{ code: "REQUIRED", field: "session.sourceSessionId" }],
    });
  });

  it("keeps each Activity id, carries the tour repeat count and re-indexes positions per structural zone", () => {
    const result = toUpdateSessionInput(
      editDraft({
        exercises: [
          { ...createExerciseDraft("keep-1"), name: "Gainage", executionParameters: durationParameters(30) },
          { ...createExerciseDraft("keep-2"), name: "Squats", executionParameters: durationParameters(40, 3) },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sourceSessionId).toBe("session-42");
      expect(result.value.tourRepeatCount).toBe(3);
      expect(result.value.activities.map((activity) => activity.id)).toEqual(["keep-1", "keep-2"]);
      expect(result.value.activities.map((activity) => activity.position)).toEqual([0, 1]);
      expect(result.value.activities.every((activity) => activity.structuralPosition === "BEFORE_TOUR")).toBe(
        true,
      );
    }
  });

  it("emits an all-FAILURE Activity (former failure mode, migrated) as Repetitions with typed FAILURE targets, no numeric target", () => {
    const result = toUpdateSessionInput(
      editDraft({
        exercises: [
          {
            ...createExerciseDraft("fail-1"),
            name: "Tractions",
            executionParameters: allFailureParameters(4),
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.activities[0]).toMatchObject({ executionParameters: allFailureParameters(4) });
    }
  });

  it("carries the attached Récupération through the update path (T02-S02)", () => {
    const result = toUpdateSessionInput(
      editDraft({
        exercises: [
          { ...createExerciseDraft("act-1"), name: "Gainage", executionParameters: durationParameters(30), postActivityRecoverySeconds: 60 },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.activities[0]).toMatchObject({ postActivityRecoverySeconds: 60 });
    }
  });

  it("refuses to update towards a standalone RECOVERY Activity, like the creation path (T02-S02)", () => {
    const result = toUpdateSessionInput(
      editDraft({
        exercises: [
          { ...createExerciseDraft("act-1"), name: "Récupération", type: "RECOVERY", executionParameters: durationParameters(30) },
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toContainEqual({ code: "MUST_BE_ABSENT", field: "activity.type" });
    }
  });

  it("never throws on an invalid edit draft", () => {
    expect(() => toUpdateSessionInput(createEmptyDraft())).not.toThrow();
  });
});

describe("side mode across the draft (V2-BILAT-01, portée exclusivement par l'Exercice depuis V2-PRE-1)", () => {
  it("toSessionDraft carries each Activity's own side mode — the Circuit has no direction of its own", () => {
    const session: Session = {
      id: "session-1",
      ownerId: "usr_test",
      name: "Séance",
      color: DEFAULT_SESSION_COLOR,
      status: "ACTIVE",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      cycle: {
        id: "cycle-1",
        position: 1,
        repeatCount: 1,
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 1,
          exercises: [anActivity({ sideMode: "LEFT_RIGHT", executionParameters: durationParameters(30, 1, 0, { sideMode: "LEFT_RIGHT" }) })],
        },
      },
    };
    const draft = toSessionDraft(session);
    expect(draft.exercises[0]?.sideMode).toBe("LEFT_RIGHT");
  });

  it("exerciseEquals detects a change of side mode — otherwise the exit guard would let it be lost silently", () => {
    expect(
      exerciseEquals(createExerciseDraft("ex-1"), {
        ...createExerciseDraft("ex-1"),
        sideMode: "RIGHT_LEFT",
      }),
    ).toBe(false);
  });

  it("toCreateSessionInput / toUpdateSessionInput carry each Activity's own side mode", () => {
    const exercises = [
      // PRE-4 : la direction écrite est celle des paramètres (`executionParameters.sideMode`).
      {
        ...createExerciseDraft("ex-1"),
        name: "Gainage",
        executionParameters: durationParameters(30, 1, 0, { sideMode: "RIGHT_LEFT" }),
        sideMode: "RIGHT_LEFT" as const,
      },
    ];

    const created = toCreateSessionInput({
      ...createEmptyDraft(),
      name: "Séance",
      exercises,
    });
    expect(created.ok).toBe(true);
    if (created.ok) {
      expect(created.value.exercises[0]?.sideMode).toBe("RIGHT_LEFT");
    }

    const updated = toUpdateSessionInput({
      ...createEmptyDraft(),
      sourceSessionId: "session-1",
      name: "Séance",
      exercises,
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.value.activities[0]?.sideMode).toBe("RIGHT_LEFT");
    }
  });
});

/**
 * PRE-3 — copies complètes et isolation (P3-01/copy-isolation, P3-18/copy-complete).
 */
describe("PRE-3 — copie Catalogue → Séance et duplication (paramètres, Catégorie, médias)", () => {
  const parameters: ExecutionParameters = variableParameters({
    mode: "DURATION",
    rows: [
      [30, 10],
      [45, 20],
    ],
    sideMode: "RIGHT_LEFT",
    sideOrder: "BY_SERIES",
    sideRecoverySeconds: 15,
    cadenceBeepIntervalSeconds: 4,
    countdownSeconds: 10,
    endSeconds: 5,
  });
  const photo: MediaAsset = { id: "p1", uri: "kodjo-media/p1.jpg", createdAt: "now", kind: "PHOTO" };
  const video: MediaAsset = { id: "v1", uri: "kodjo-media/v1.mov", createdAt: "now", kind: "VIDEO", durationMs: 1000 };
  const definition: ActivityDefinition = {
    id: "def-1",
    name: "Fentes",
    description: null,
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    sideMode: "RIGHT_LEFT",
    sideRecoverySeconds: 15,
    executionParameters: parameters,
    media: [
      { id: "l1", activityDefinitionId: "def-1", assetId: "v1", position: 0, asset: video },
      { id: "l2", activityDefinitionId: "def-1", assetId: "p1", position: 1, asset: photo },
    ],
    createdAt: "now",
    updatedAt: "now",
  };

  it("P3-18/copy-complete — la copie porte paramètres, Catégorie et médias ordonnés (mêmes fichiers), sans R automatique", () => {
    const copy = activityDefinitionToDraftExercise(definition, "occ-1", 0);
    expect(copy.executionParameters).toEqual(parameters);
    expect(copy.executionParameters).not.toBe(parameters);
    expect(copy.categoryId).toBe("cardio");
    expect(copy.media?.map((item) => [item.assetId, item.asset.uri])).toEqual([
      ["v1", "kodjo-media/v1.mov"],
      ["p1", "kodjo-media/p1.jpg"],
    ]);
    expect(copy.postActivityRecoverySeconds).toBe(0);
    const created = toCreateSessionInput({ ...createEmptyDraft(), name: "S", exercises: [copy] });
    expect(created.ok && created.value.exercises[0]).toEqual(
      expect.objectContaining({
        executionParameters: parameters,
        categoryId: "cardio",
        media: [
          { assetId: "v1", asset: video },
          { assetId: "p1", asset: photo },
        ],
      }),
    );
  });

  it("P3-01/copy-isolation — deux copies et la définition gardent leurs propres valeurs et médias", () => {
    const first = activityDefinitionToDraftExercise(definition, "occ-1", 0);
    const second = activityDefinitionToDraftExercise(definition, "occ-2", 0);
    const duplicated = duplicateActivity([first, second], "occ-1", "occ-3");
    // AD-9 : clonage profond jusqu'à la Cible typée elle-même.
    (first.executionParameters.series as unknown as { rows: { target: { value: number } }[] }).rows[0]!.target.value = 999;
    (first.media as unknown as { assetId: string }[]).splice(0, 1);
    expect(second.executionParameters).toEqual(parameters);
    expect(second.media).toHaveLength(2);
    expect(duplicated[1]!.executionParameters).toEqual(parameters);
    expect(duplicated[1]!.media).toHaveLength(2);
    expect(definition.executionParameters).toEqual(parameters);
    expect(definition.media).toHaveLength(2);
  });

  it("l'égalité de brouillon tient compte des paramètres, de la Catégorie et de l'ordre des médias (garde d'abandon)", () => {
    const copy = activityDefinitionToDraftExercise(definition, "occ-1", 0);
    expect(exerciseEquals(copy, { ...copy })).toBe(true);
    expect(exerciseEquals(copy, { ...copy, media: [...(copy.media ?? [])].reverse() })).toBe(false);
    expect(exerciseEquals(copy, { ...copy, categoryId: "autre" })).toBe(false);
    expect(
      exerciseEquals(copy, { ...copy, executionParameters: { ...parameters, cadenceBeepIntervalSeconds: 0 } }),
    ).toBe(false);
  });

  it("une occurrence relue transporte ses paramètres et médias jusqu'à toUpdateSessionInput", () => {
    const activity: Activity = {
      id: "occ-9",
      type: "EXERCISE",
      structuralPosition: "IN_TOUR",
      position: 0,
      name: "Fentes",
      postActivityRecoverySeconds: 30,
      instruction: null,
      bodyZoneIds: ["cuisses"],
      sideMode: "RIGHT_LEFT",
      executionParameters: parameters,
      categoryId: "cardio",
      media: [{ id: "sl1", activityId: "occ-9", assetId: "v1", position: 0, asset: video }],
    };
    const session: Session = {
      id: "s",
      ownerId: "o",
      name: "S",
      color: DEFAULT_SESSION_COLOR,
      status: "ACTIVE",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      createdAt: "now",
      updatedAt: "now",
      cycle: { id: "c", position: 1, repeatCount: 1, tour: { id: "t", position: 1, repeatCount: 1, exercises: [activity] } },
    };
    const update = toUpdateSessionInput(toSessionDraft(session));
    expect(update.ok && update.value.activities[0]).toEqual(
      expect.objectContaining({
        id: "occ-9",
        executionParameters: parameters,
        categoryId: "cardio",
        media: [{ assetId: "v1", asset: video }],
        postActivityRecoverySeconds: 30,
      }),
    );
  });
});

/**
 * PRE-4 story 1.3 — clonage profond des copies (AD-9) : aucune collection
 * mutable partagée entre une Définition, ses copies, leurs duplications, la
 * Séance relue et l'entrée persistable.
 */
describe("PRE-4 story 1.3 — copies et duplications à Cibles typées (domaine)", () => {
  const photo: MediaAsset = { id: "p1", uri: "kodjo-media/p1.jpg", createdAt: "now", kind: "PHOTO" };
  const video: MediaAsset = { id: "v1", uri: "kodjo-media/v1.mov", createdAt: "now", kind: "VIDEO", durationMs: 1000 };
  const third: MediaAsset = { id: "p2", uri: "kodjo-media/p2.jpg", createdAt: "now", kind: "PHOTO" };
  const typedRows = (): ExecutionParameters =>
    variableParameters({
      mode: "DURATION",
      rows: [
        [30, 10],
        [45, 10],
        ["FAILURE", 10],
      ],
      sideMode: "RIGHT_LEFT",
      sideOrder: "BY_SERIES",
      sideRecoverySeconds: 5,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 3,
      endSeconds: 4,
    });
  const definition: ActivityDefinition = {
    id: "def-1",
    name: "Fentes",
    description: "Buste droit",
    categoryId: "cardio",
    bodyZoneIds: ["cuisses", "jambes"],
    sideMode: "RIGHT_LEFT",
    sideRecoverySeconds: 5,
    executionParameters: typedRows(),
    media: [
      { id: "l1", activityDefinitionId: "def-1", assetId: "v1", position: 0, asset: video },
      { id: "l2", activityDefinitionId: "def-1", assetId: "p1", position: 1, asset: photo },
      { id: "l3", activityDefinitionId: "def-1", assetId: "p2", position: 2, asset: third },
    ],
    createdAt: "now",
    updatedAt: "now",
  };

  function sessionWith(activity: Activity): Session {
    return {
      id: "s",
      ownerId: "o",
      name: "S",
      color: DEFAULT_SESSION_COLOR,
      status: "ACTIVE",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      createdAt: "now",
      updatedAt: "now",
      cycle: { id: "c", position: 1, repeatCount: 1, tour: { id: "t", position: 1, repeatCount: 1, exercises: [activity] } },
    };
  }

  it("PRE4-1.3/AC1 — la copie porte nom, description, Catégorie, Zones, Médias ordonnés et paramètres égaux champ par champ ; Récupération 0", () => {
    const copy = activityDefinitionToDraftExercise(definition, "occ-1", 0);
    expect(copy).toMatchObject({ name: "Fentes", instruction: "Buste droit", categoryId: "cardio", postActivityRecoverySeconds: 0 });
    expect(copy.bodyZoneIds).toEqual(["cuisses", "jambes"]);
    expect(copy.media?.map((item) => item.assetId)).toEqual(["v1", "p1", "p2"]);
    expect(copy.executionParameters).toEqual(typedRows());
    // La Définition ne porte ni position de Séance ni Récupération.
    expect(definition).not.toHaveProperty("structuralPosition");
    expect(definition).not.toHaveProperty("postActivityRecoverySeconds");
  });

  it("PRE4-1.3/AC2 — aucune collection partagée : Définition → copie, Séance relue → brouillon, brouillon → entrée persistable", () => {
    const copy = activityDefinitionToDraftExercise(definition, "occ-1", 0);
    expect(copy.bodyZoneIds).not.toBe(definition.bodyZoneIds);
    expect(copy.media).not.toBe(definition.media);
    copy.media?.forEach((item, index) => expect(item.asset).not.toBe(definition.media![index]!.asset));
    // Muter la copie (Cible de la ligne 1, ordre des lignes, Zones, Médias) ne touche jamais la source.
    const rows = (copy.executionParameters.series as unknown as { rows: { target: unknown }[] }).rows;
    rows[0]!.target = { kind: "NUMBER", value: 99 };
    rows.reverse();
    (copy.bodyZoneIds as string[]).push("dos");
    (copy.media as unknown as unknown[]).splice(0, 1);
    expect(definition.executionParameters).toEqual(typedRows());
    expect(definition.bodyZoneIds).toEqual(["cuisses", "jambes"]);
    expect(definition.media?.map((item) => item.assetId)).toEqual(["v1", "p1", "p2"]);

    // Réouverture d'une Séance relue : le brouillon ne partage ni Zones, ni paramètres, ni Médias.
    const activity: Activity = {
      id: "occ-9",
      type: "EXERCISE",
      structuralPosition: "IN_TOUR",
      position: 0,
      name: "Fentes",
      postActivityRecoverySeconds: 30,
      instruction: null,
      bodyZoneIds: ["cuisses"],
      sideMode: "RIGHT_LEFT",
      executionParameters: typedRows(),
      categoryId: "cardio",
      media: [{ id: "sl1", activityId: "occ-9", assetId: "v1", position: 0, asset: video }],
    };
    const reopened = toSessionDraft(sessionWith(activity)).exercises[0]!;
    expect(reopened.bodyZoneIds).toEqual(activity.bodyZoneIds);
    expect(reopened.bodyZoneIds).not.toBe(activity.bodyZoneIds);
    expect(reopened.executionParameters).not.toBe(activity.executionParameters);
    expect(reopened.media![0]!.asset).not.toBe(activity.media![0]!.asset);

    // Brouillon → entrée persistable (Continuer) : Zones et actifs clonés.
    const draft = toSessionDraft(sessionWith(activity));
    const update = toUpdateSessionInput(draft);
    expect(update.ok).toBe(true);
    const emitted = update.ok ? update.value.activities[0]! : null;
    expect(emitted?.media?.[0]?.asset).toEqual(video);
    expect(emitted?.media?.[0]?.asset).not.toBe(draft.exercises[0]!.media![0]!.asset);
    expect(emitted?.bodyZoneIds).not.toBe(draft.exercises[0]!.bodyZoneIds);
    expect(emitted?.executionParameters).toEqual(draft.exercises[0]!.executionParameters);
    expect(emitted?.executionParameters).not.toBe(draft.exercises[0]!.executionParameters);
    const draftCopy = activityDefinitionToDraftExercise(definition, "occ-2", 0);
    const created = toCreateSessionInput({ ...createEmptyDraft(), name: "S", exercises: [draftCopy] });
    expect(created.ok).toBe(true);
    const createdActivity = created.ok ? created.value.exercises[0]! : null;
    expect(createdActivity?.bodyZoneIds).not.toBe(draftCopy.bodyZoneIds);
    expect(createdActivity?.executionParameters).toEqual(draftCopy.executionParameters);
    expect(createdActivity?.executionParameters).not.toBe(draftCopy.executionParameters);
    expect(createdActivity?.media).toHaveLength(3);
    createdActivity?.media?.forEach((item, index) => expect(item.asset).not.toBe(draftCopy.media![index]!.asset));
  });

  it("PRE4-1.3/AC4 — Cible héritée UNSET : copiée UNSET (jamais FAILURE) dans le brouillon ; Continuer la refuse", () => {
    const unset = { ...definition, executionParameters: variableParameters({ mode: "REPETITIONS", rows: [["UNSET", 10], [12, 10]] }) };
    const copy = activityDefinitionToDraftExercise(unset, "occ-1", 0);
    expect(copy.executionParameters.series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: { kind: "UNSET" }, pauseSeconds: 10, loadKg: 0 },
        { target: { kind: "NUMBER", value: 12 }, pauseSeconds: 10, loadKg: 0 },
      ],
    });
    expect(JSON.stringify(copy.executionParameters)).not.toContain("FAILURE");
    const continued = toCreateSessionInput({ ...createEmptyDraft(), name: "S", exercises: [copy] });
    expect(continued.ok).toBe(false);
  });

  it("PRE4-1.3/AC5 — duplication : nouvel identifiant juste après la source, paramètres typés, Récupération, Catégorie, Zones et Médias égaux ; indépendance", () => {
    const repetitions = () => variableParameters({ mode: "REPETITIONS", rows: [[10, 10], [12, 10], ["FAILURE", 10]] });
    const source: SessionDraftExercise = {
      ...activityDefinitionToDraftExercise({ ...definition, executionParameters: repetitions() }, "occ-1", 40),
      media: [
        { assetId: "v1", asset: video },
        { assetId: "p1", asset: photo },
      ],
    };
    const other = createExerciseDraft("occ-2");
    const next = duplicateActivity([source, other], "occ-1", "occ-3");
    expect(next.map((exercise) => exercise.id)).toEqual(["occ-1", "occ-3", "occ-2"]);
    const copy = next[1]!;
    expect(copy.executionParameters).toEqual(repetitions());
    expect(copy.postActivityRecoverySeconds).toBe(40);
    expect(copy.categoryId).toBe("cardio");
    expect(copy.bodyZoneIds).toEqual(source.bodyZoneIds);
    expect(copy.media?.map((item) => item.assetId)).toEqual(["v1", "p1"]);
    // Modifier l'une ne modifie pas l'autre.
    (copy.executionParameters.series as unknown as { rows: { target: unknown }[] }).rows[2]!.target = { kind: "NUMBER", value: 5 };
    (copy.bodyZoneIds as string[]).push("dos");
    (copy.media as unknown as unknown[]).reverse();
    expect(source.executionParameters).toEqual(repetitions());
    expect(source.bodyZoneIds).toEqual(["cuisses", "jambes"]);
    expect(source.media?.map((item) => item.assetId)).toEqual(["v1", "p1"]);
    expect(copy.media![1]!.asset).not.toBe(source.media![0]!.asset);
  });
});

/**
 * PRE-6 story 1.1 (AD-34, AD-35) : nature du Circuit portée par le brouillon
 * comme `tourRepeatCount` ; récupération à trois états ; garde de sortie.
 */
describe("PRE6-1.1 — nature du Circuit et récupération nullable dans le brouillon", () => {
  const draftWith = (overrides: Partial<SessionDraft> = {}): SessionDraft => ({
    ...createEmptyDraft(),
    name: "Séance",
    tourRepeatCount: 4,
    exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(30) }],
    ...overrides,
  });
  const sessionWith = (activity: Activity, nature?: "TOURS" | "SERIES"): Session => ({
    id: "session-1",
    ownerId: "usr_test",
    name: "Séance",
    color: DEFAULT_SESSION_COLOR,
    status: "ACTIVE",
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    cycle: {
      id: "cycle-1",
      position: 1,
      repeatCount: 1,
      tour: { id: "tour-1", position: 1, repeatCount: 4, ...(nature ? { nature } : {}), exercises: [activity] },
    },
  });

  it("aller-retour nature : brouillon SERIES, N = 4 vers une entrée SERIES, N = 4 (création et modification)", () => {
    const draft = draftWith({ circuitNature: "SERIES" });
    const created = toCreateSessionInput(draft);
    expect(created.ok && [created.value.circuitNature, created.value.tourRepeatCount]).toEqual(["SERIES", 4]);
    const updated = toUpdateSessionInput({ ...draft, sourceSessionId: "s-1" });
    expect(updated.ok && [updated.value.circuitNature, updated.value.tourRepeatCount]).toEqual(["SERIES", 4]);
  });

  it("toSessionDraft relit la nature ; sans nature (fixture antérieure), le brouillon reste en Tours implicite", () => {
    expect(toSessionDraft(sessionWith(anActivity(), "SERIES")).circuitNature).toBe("SERIES");
    const legacy = toSessionDraft(sessionWith(anActivity()));
    expect(legacy.circuitNature).toBeUndefined();
    expect(sessionDraftsEqual(legacy, { ...legacy, circuitNature: "TOURS" })).toBe(true);
  });

  it("aller-retour récupération : null, 0 et 30 transmis tels quels", () => {
    for (const value of [null, 0, 30]) {
      const draft = draftWith({ exercises: [{ ...draftWith().exercises[0]!, postActivityRecoverySeconds: value }] });
      const created = toCreateSessionInput(draft);
      expect(created.ok && created.value.exercises[0]?.postActivityRecoverySeconds).toBe(value);
    }
  });

  it("relue : null reste absente, 0 reste présente à 0 ; undefined (fixture antérieure) devient absente", () => {
    expect(toSessionDraft(sessionWith(anActivity({ postActivityRecoverySeconds: null }))).exercises[0]?.postActivityRecoverySeconds).toBeNull();
    expect(toSessionDraft(sessionWith(anActivity({ postActivityRecoverySeconds: 0 }))).exercises[0]?.postActivityRecoverySeconds).toBe(0);
    expect(toSessionDraft(sessionWith(anActivity({ postActivityRecoverySeconds: undefined }))).exercises[0]?.postActivityRecoverySeconds).toBeNull();
  });

  it("garde de sortie : un changement de nature seul rend le brouillon modifié", () => {
    const baseline = draftWith({ circuitNature: "TOURS" });
    expect(isSessionDraftDirty({ ...baseline, circuitNature: "SERIES" }, baseline)).toBe(true);
    expect(isSessionDraftDirty({ ...baseline }, baseline)).toBe(false);
  });

  it("garde de sortie : une récupération qui passe de null à 0 (ou inversement) rend le brouillon modifié", () => {
    const baseline = draftWith();
    const exercise = baseline.exercises[0]!;
    expect(exercise.postActivityRecoverySeconds).toBeNull();
    const zero = { ...baseline, exercises: [{ ...exercise, postActivityRecoverySeconds: 0 }] };
    expect(isSessionDraftDirty(zero, baseline)).toBe(true);
    expect(isSessionDraftDirty(baseline, zero)).toBe(true);
    expect(exerciseEquals(exercise, { ...exercise, postActivityRecoverySeconds: 0 })).toBe(false);
  });

  it("une copie du Catalogue sans récupération naît absente (null)", () => {
    const definition = {
      id: "def-1",
      name: "Squat",
      description: null,
      bodyZoneIds: [],
      executionParameters: durationParameters(30),
    } as unknown as ActivityDefinition;
    expect(activityDefinitionToDraftExercise(definition, "copy-1", null).postActivityRecoverySeconds).toBeNull();
  });
});

describe("PRE6-1.2 — Points d'arrêt portés par le brouillon", () => {
  const exercise = (id: string, structuralPosition: "BEFORE_TOUR" | "IN_TOUR" | "AFTER_TOUR"): SessionDraftExercise => ({
    ...createExerciseDraft(id),
    name: id,
    structuralPosition,
    executionParameters: durationParameters(30),
  });
  const draftWith = (overrides: Partial<SessionDraft> = {}): SessionDraft => ({
    ...createEmptyDraft(),
    name: "Séance",
    exercises: [exercise("A", "IN_TOUR"), exercise("B", "IN_TOUR"), exercise("Z", "AFTER_TOUR")],
    stopPoints: [
      { id: "s1", scope: "IN_TOUR", position: 1 },
      { id: "s2", scope: "AFTER_TOUR", position: 0 },
    ],
    ...overrides,
  });

  it("toCreateSessionInput et toUpdateSessionInput transmettent { scope, position }, sans identifiant", () => {
    const expected = [
      { scope: "IN_TOUR", position: 1 },
      { scope: "AFTER_TOUR", position: 0 },
    ];
    const created = toCreateSessionInput(draftWith());
    expect(created.ok && created.value.stopPoints).toEqual(expected);
    const updated = toUpdateSessionInput({ ...draftWith(), sourceSessionId: "s-1" });
    expect(updated.ok && updated.value.stopPoints).toEqual(expected);
  });

  it("un point sur un emplacement interdit fait échouer l'enregistrement (union discriminée)", () => {
    const result = toCreateSessionInput(draftWith({ stopPoints: [{ id: "s", scope: "AFTER_TOUR", position: 1 }] }));
    expect(result).toEqual({ ok: false, violations: [{ code: "FORBIDDEN_PLACEMENT", field: "session.stopPoints" }] });
  });

  it("toSessionDraft hydrate les points relus ; absents, le champ reste absent", () => {
    const activity = (id: string, structuralPosition: "IN_TOUR" | "AFTER_TOUR", position: number): Activity => ({
      ...anActivity({ id, name: id, position }),
      structuralPosition,
    });
    const session = {
      id: "session-1",
      ownerId: "usr_test",
      name: "Séance",
      color: DEFAULT_SESSION_COLOR,
      status: "ACTIVE",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      stopPoints: [{ id: "p1", scope: "IN_TOUR", position: 1 }],
      cycle: {
        id: "cycle-1",
        position: 1,
        repeatCount: 1,
        afterTour: [activity("Z", "AFTER_TOUR", 0)],
        tour: { id: "tour-1", position: 1, repeatCount: 1, exercises: [activity("A", "IN_TOUR", 0)] },
      },
    } as Session;
    const draft = toSessionDraft(session);
    expect(draft.stopPoints).toEqual([{ id: "p1", scope: "IN_TOUR", position: 1 }]);
    expect(draft.stopPoints?.[0]).not.toBe(session.stopPoints?.[0]);
    const { stopPoints: _omitted, ...withoutPoints } = session;
    expect("stopPoints" in toSessionDraft(withoutPoints as Session)).toBe(false);
  });

  it("garde de sortie : un point ajouté ou déplacé seul rend le brouillon modifié ; les identifiants sont ignorés", () => {
    const baseline = draftWith({ stopPoints: [] });
    expect(isSessionDraftDirty(draftWith({ stopPoints: [{ id: "x", scope: "IN_TOUR", position: 1 }] }), baseline)).toBe(true);
    const placed = draftWith();
    expect(isSessionDraftDirty({ ...placed, stopPoints: [{ id: "s1", scope: "IN_TOUR", position: 0 }, placed.stopPoints![1]!] }, placed)).toBe(true);
    expect(
      sessionDraftsEqual(placed, {
        ...placed,
        stopPoints: [
          { id: "autre", scope: "AFTER_TOUR", position: 0 },
          { id: "encore", scope: "IN_TOUR", position: 1 },
        ],
      }),
    ).toBe(true);
    expect(sessionDraftsEqual({ ...placed, stopPoints: undefined }, { ...placed, stopPoints: [] })).toBe(true);
  });
});
