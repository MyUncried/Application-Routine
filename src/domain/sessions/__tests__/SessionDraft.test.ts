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
      executionMode: DEFAULT_EXECUTION_MODE,
      durationSeconds: DEFAULT_EXERCISE_DURATION_SECONDS,
      repetitionCount: null,
      seriesCount: DEFAULT_SERIES_COUNT,
      pauseSeconds: DEFAULT_PAUSE_SECONDS,
      // T02-S02 : la Récupération ATTACHÉE naît neutre (`0`) — jamais la
      // durée par défaut de l'ancienne Activité `RECOVERY` autonome, qui
      // aurait ajouté une récupération non demandée à chaque Activité.
      postActivityRecoverySeconds: DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS,
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

  it("uses the Domain's neutral default (0) when no postActivityRecoverySeconds is provided (V2-PRE-2, T19)", () => {
    expect(createExerciseDraft("ex-1").postActivityRecoverySeconds).toBe(0);
  });

  it("uses the explicit postActivityRecoverySeconds provided by the caller — the Profile's current value at creation time (V2-PRE-2, D-171/D-213)", () => {
    expect(createExerciseDraft("ex-1", 30).postActivityRecoverySeconds).toBe(30);
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
    executionMode: "DURATION",
    structuralPosition: "IN_TOUR",
    position: 0,
    name: "Gainage",
    durationSeconds: 30,
    repetitionCount: null,
    seriesCount: 1,
    pauseSeconds: 0,
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
          executionMode: "DURATION",
          durationSeconds: 30,
          repetitionCount: null,
          seriesCount: 1,
          pauseSeconds: 0,
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
            executionMode: "DURATION",
            durationSeconds: 30,
            repetitionCount: null,
            seriesCount: 1,
            pauseSeconds: 0,
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
      exercises: [{ ...createExerciseDraft("keep-1"), name: "Gainage", durationSeconds: 30 }],
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
      sessionDraftsEqual(aDraft(), aDraft({ exercises: [{ ...createExerciseDraft("keep-1"), name: "X", durationSeconds: 30 }] })),
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
      exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 30 }],
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
            executionMode: "DURATION",
            durationSeconds: 30,
            repetitionCount: null,
            seriesCount: 1,
            pauseSeconds: 0,
            postActivityRecoverySeconds: 0,
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
          durationSeconds: 60,
          structuralPosition: "BEFORE_TOUR",
        },
        {
          ...createExerciseDraft("core"),
          name: "Gainage",
          durationSeconds: 30,
          structuralPosition: "IN_TOUR",
          postActivityRecoverySeconds: 45,
        },
        {
          ...createExerciseDraft("stretch"),
          name: "Étirements",
          durationSeconds: 45,
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
        0, 45, 0,
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
          durationSeconds: 45,
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
        { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 30 },
        { ...createExerciseDraft("ex-2"), name: "Squats", durationSeconds: 45, seriesCount: 3 },
      ],
    };
    const result = toCreateSessionInput(draft);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.exercises).toHaveLength(2);
      expect(result.value.exercises.map((exercise) => exercise.name)).toEqual(["Gainage", "Squats"]);
      expect(result.value.exercises[1]).toMatchObject({ name: "Squats", durationSeconds: 45, seriesCount: 3 });
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
            executionMode: null,
            durationSeconds: 45,
            repetitionCount: null,
            seriesCount: null,
            pauseSeconds: 0,
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
    expect(draft.exercises[2]).toMatchObject({ type: "RECOVERY", durationSeconds: 45 });
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
        { ...createExerciseDraft("act-1"), name: "Gainage", durationSeconds: 30 },
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
          { ...createExerciseDraft("keep-1"), name: "Gainage", durationSeconds: 30 },
          { ...createExerciseDraft("keep-2"), name: "Squats", durationSeconds: 40, seriesCount: 3 },
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

  it("emits a TO_FAILURE Activity without any duration or repetition target", () => {
    const result = toUpdateSessionInput(
      editDraft({
        exercises: [
          {
            ...createExerciseDraft("fail-1"),
            name: "Tractions",
            executionMode: "TO_FAILURE",
            durationSeconds: null,
            repetitionCount: null,
            seriesCount: 4,
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.activities[0]).toMatchObject({
        executionMode: "TO_FAILURE",
        durationSeconds: null,
        repetitionCount: null,
        seriesCount: 4,
      });
    }
  });

  it("carries the attached Récupération through the update path (T02-S02)", () => {
    const result = toUpdateSessionInput(
      editDraft({
        exercises: [
          { ...createExerciseDraft("act-1"), name: "Gainage", durationSeconds: 30, postActivityRecoverySeconds: 60 },
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
          { ...createExerciseDraft("act-1"), name: "Récupération", type: "RECOVERY", durationSeconds: 30 },
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
          exercises: [anActivity({ sideMode: "LEFT_RIGHT" })],
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
      { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 30, sideMode: "RIGHT_LEFT" as const },
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
