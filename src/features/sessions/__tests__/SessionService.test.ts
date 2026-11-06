import { describe, expect, it, jest } from "@jest/globals";

import {
  DEFAULT_SESSION_COLOR,
  type Activity,
  type CreateSessionInput,
  type Session,
  type SessionSummary,
  type UpdateSessionInput,
} from "@/domain/sessions/Session";
import {
  createEmptyDraft,
  createExerciseDraft,
  toStructuredSessionInput,
  type SessionDraft,
} from "@/domain/sessions/SessionDraft";
import { structureExercises } from "@/domain/sessions/structure";
import type { StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { withStructure } from "@/domain/sessions/testing/structuredSession";
import {
  DEFAULT_ACTIVITY_TYPE,
  DEFAULT_EXERCISE_DURATION_SECONDS,
  DEFAULT_FINAL_PHASE_SECONDS,
  DEFAULT_INITIAL_COUNTDOWN_SECONDS,
} from "@/domain/sessions/defaults";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { SessionValidationError } from "@/domain/sessions/errors";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import type {
  SessionRepository,
  SessionStatus,
  StructuredSession,
  StructuredSessionRepository,
  UpdateSessionOutcome,
  UpdateStructuredSessionOutcome,
} from "@/domain/sessions/SessionRepository";

import { SessionService } from "@/features/sessions/SessionService";
import { resetNewMovementMarks, useNewMovementMarks } from "@/features/activities/newMovementMarks";
import { renderHook } from "@testing-library/react-native";

// Repository factice, sans aucune dépendance SQLite (ni node:sqlite, ni
// expo-sqlite, ni NodeSqliteDatabase, ni SqliteSessionRepository).
// PRE-9 (A.1) : le service écrit et lit par le port structuré ; l'ancien port reste implémenté
// (lecture de compatibilité `getSession`) et ses écritures ne sont plus jamais appelées.
class FakeSessionRepository implements SessionRepository, StructuredSessionRepository {
  create = jest.fn<(input: CreateSessionInput) => Promise<Session>>();
  findById = jest.fn<(sessionId: string) => Promise<Session | null>>();
  findSessionStatus = jest.fn<(sessionId: string) => Promise<SessionStatus | null>>();
  listActive = jest.fn<() => Promise<readonly SessionSummary[]>>();
  update =
    jest.fn<(sessionId: string, input: UpdateSessionInput) => Promise<UpdateSessionOutcome>>();
  createStructured = jest.fn<(input: StructuredSessionInput) => Promise<StructuredSession>>();
  findStructuredById = jest.fn<(sessionId: string) => Promise<StructuredSession | null>>();
  updateStructured =
    jest.fn<
      (sessionId: string, input: StructuredSessionInput & { readonly persistedActivityIds?: readonly string[] }) => Promise<UpdateStructuredSessionOutcome>
    >();
}

/** Identité du Circuit créé avec la Séance (`toStructuredSessionInput`), déterministe. */
const NEW_CIRCUIT_ID = "circuit-new";
const newContainerId = () => NEW_CIRCUIT_ID;
const serviceOf = (repository: FakeSessionRepository) => new SessionService(repository, undefined, newContainerId);

/** Exercices de l'entrée structurée transmise au repository, dans l'ordre. */
const exercisesOf = (input: StructuredSessionInput) => structureExercises(input.structure);

function anActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "activity-1",
    type: "EXERCISE",
    structuralPosition: "IN_TOUR",
    position: 0,
    name: "Gainage",
    executionParameters: durationParameters(30, 1, 0),
    postActivityRecoverySeconds: 0,
    instruction: null,
    bodyZoneIds: [],
    ...overrides,
  };
}

function aSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "session-1",
    ownerId: "usr_test",
    name: "Séance simple",
    color: DEFAULT_SESSION_COLOR,
    labelId: null,
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

/** PRE-7 (R-3, C05) : Exercice créé localement (Mouvement NEW à son identifiant, `withLocalMovements`). */
function aValidDraft(): SessionDraft {
  return withLocalMovements({
    ...createEmptyDraft(),
    name: "Séance simple",
    exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage" }],
  });
}

/** PRE-7 (R-3) : Mouvement NEW émis pour une création locale (Catégorie et Zone par défaut des tests). */
function newMovement(id: string, name: string) {
  return {
    id,
    change: "NEW",
    name,
    description: null,
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    media: [],
    phases: [],
    nextPhaseId: 1,
    aliases: [],
  };
}

// T02-S01 : le chemin de création transporte l'identifiant et le type réels de chaque Activité.
// PRE-9 (A.1) : l'Exercice d'un brouillon neuf (`DEFAULT_STRUCTURAL_POSITION`, avant le Circuit)
// est au niveau principal de la structure, avant le Circuit créé avec la Séance.
function normalizedExercise() {
  return {
    id: "ex-1",
    type: DEFAULT_ACTIVITY_TYPE,
    executionParameters: durationParameters(30, 1, 0),
    postActivityRecoverySeconds: null, // PRE-6 (story 1.1, AD-35) : née sans récupération
    // PRE-7 (R-3, C05) : référence au Mouvement, aucun contenu.
    sourceMovementId: "ex-1",
    copyNumber: null,
  };
}

describe("SessionService.createSession (PRE-9 A.1 : chemin structuré)", () => {
  it("does not call the repository for an invalid draft", async () => {
    const repository = new FakeSessionRepository();
    const service = serviceOf(repository);

    await service.createSession(createEmptyDraft());

    expect(repository.createStructured).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("returns the structured violations for an invalid draft, unaltered", async () => {
    const repository = new FakeSessionRepository();
    const service = serviceOf(repository);

    const result = await service.createSession(createEmptyDraft());

    expect(result).toEqual(toStructuredSessionInput(createEmptyDraft(), newContainerId));
    expect(result.ok).toBe(false);
  });

  it("calls the repository exactly once with the normalized structured input for a valid draft", async () => {
    const repository = new FakeSessionRepository();
    const created = withStructure(aSession());
    repository.createStructured.mockResolvedValue(created);
    const service = serviceOf(repository);

    const draft: SessionDraft = withLocalMovements({
      ...createEmptyDraft(),
      name: "  Séance   simple  ",
      exercises: [{ ...createExerciseDraft("ex-1"), name: "  Gainage  " }],
    });

    const result = await service.createSession(draft);

    expect(repository.createStructured).toHaveBeenCalledTimes(1);
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.createStructured).toHaveBeenCalledWith({
      name: "Séance simple",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      // PRE-7 (R-3, C05) : le contenu va au Mouvement NEW, nom normalisé.
      movements: [newMovement("ex-1", "Gainage")],
      // PRE-9 B.2 — D-451, COMP §1 (« une Séance commence sans Circuit », « un conteneur n'est jamais
      // vide ») : l'Exercice est au niveau de la Séance, sans Circuit vide [auparavant : Circuit vide
      // créé avec la Séance] ; aucun Point d'arrêt porté par le brouillon.
      structure: {
        elements: [{ kind: "EXERCISE", exercise: expect.objectContaining(normalizedExercise()) }],
        stopPoints: [],
      },
    });
    expect(result).toEqual({ ok: true, value: created });
    if (result.ok) {
      expect(result.value).toBe(created);
    }
  });

  it("threads multiple Activities and the selected Label through unaltered", async () => {
    const repository = new FakeSessionRepository();
    repository.createStructured.mockResolvedValue(withStructure(aSession()));
    const service = serviceOf(repository);

    const draft: SessionDraft = withLocalMovements({
      ...createEmptyDraft(),
      name: "Séance simple",
      exercises: [
        { ...createExerciseDraft("ex-1"), name: "Gainage" },
        { ...createExerciseDraft("ex-2"), name: "Squats", executionParameters: durationParameters(45) },
      ],
      labelId: "label-1",
    });

    await service.createSession(draft);

    const input = repository.createStructured.mock.calls[0]![0];
    expect(input).toEqual(
      expect.objectContaining({ movements: [newMovement("ex-1", "Gainage"), newMovement("ex-2", "Squats")], labelId: "label-1" }),
    );
    expect(exercisesOf(input)).toEqual([
      expect.objectContaining(normalizedExercise()),
      expect.objectContaining({ sourceMovementId: "ex-2", executionParameters: durationParameters(45) }),
    ]);
  });

  it("propagates a technical error from the repository unchanged, without turning it into a structured result", async () => {
    const repository = new FakeSessionRepository();
    const technicalError = new Error("The stable local user is missing.");
    repository.createStructured.mockRejectedValue(technicalError);
    const service = serviceOf(repository);

    await expect(service.createSession(aValidDraft())).rejects.toBe(technicalError);
  });

  it("propagates a SessionValidationError from the repository unchanged (defense-in-depth path)", async () => {
    const repository = new FakeSessionRepository();
    const repositoryValidationError = new SessionValidationError([
      { code: "REQUIRED", field: "session.name" },
    ]);
    repository.createStructured.mockRejectedValue(repositoryValidationError);
    const service = serviceOf(repository);

    await expect(service.createSession(aValidDraft())).rejects.toBe(repositoryValidationError);
  });

  it("threads the canonical default values through the service without redefining them", async () => {
    const repository = new FakeSessionRepository();
    repository.createStructured.mockResolvedValue(withStructure(aSession()));
    const service = serviceOf(repository);

    const draft: SessionDraft = withLocalMovements({
      ...createEmptyDraft(),
      name: "Séance simple",
      exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage" }],
    });

    await service.createSession(draft);

    const input = repository.createStructured.mock.calls[0]![0];
    expect(input).toEqual(
      expect.objectContaining({
        initialCountdownSeconds: DEFAULT_INITIAL_COUNTDOWN_SECONDS,
        finalPhaseSeconds: DEFAULT_FINAL_PHASE_SECONDS,
      }),
    );
    // PRE-4 (story 1.1) : la durée canonique voyage dans les paramètres typés.
    expect(exercisesOf(input)).toEqual([expect.objectContaining({ executionParameters: durationParameters(DEFAULT_EXERCISE_DURATION_SECONDS) })]);
  });
});

function anEditDraft(): SessionDraft {
  return {
    ...aValidDraft(),
    sourceSessionId: "session-1",
    name: "Séance à modifier",
  };
}

describe("SessionService.updateSession (T01-S10, Q3-A ; PRE-9 A.1 : chemin structuré)", () => {
  it("does not call the repository for an invalid draft", async () => {
    const repository = new FakeSessionRepository();
    const service = serviceOf(repository);

    await service.updateSession("session-1", createEmptyDraft());

    expect(repository.updateStructured).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("returns INVALID for an invalid draft (no Activity, missing name), without capturing violations from anywhere else", async () => {
    const repository = new FakeSessionRepository();
    const service = serviceOf(repository);

    const result = await service.updateSession("session-1", createEmptyDraft());

    const expected = toStructuredSessionInput(createEmptyDraft(), newContainerId);
    expect(expected.ok).toBe(false);
    expect(result).toEqual({ status: "INVALID", violations: expected.ok ? [] : expected.violations });
  });

  it("keeps the persisted Circuit identity and nature, forwards the loaded Exercise ids, then returns UPDATED unchanged", async () => {
    const repository = new FakeSessionRepository();
    const updated = withStructure(aSession({ name: "Nom modifié" }));
    const outcome: UpdateStructuredSessionOutcome = { status: "UPDATED", session: updated };
    repository.updateStructured.mockResolvedValue(outcome);
    const service = serviceOf(repository);

    const draft: SessionDraft = withLocalMovements({
      ...createEmptyDraft(),
      sourceSessionId: "stale-id",
      name: "  Nom modifié  ",
      exercises: [{ ...createExerciseDraft("act-1"), name: "  Gainage  ", structuralPosition: "IN_TOUR" }],
      persistedExerciseIds: ["act-1"],
      // Disposition relue : Circuit « tour-1 » de nature Séries ; le brouillon ne porte pas de nature.
      structure: {
        elements: [{ kind: "CIRCUIT", circuit: { id: "tour-1", repeatCount: 1, nature: "SERIES", exercises: ["act-1"] } }],
        stopPoints: [],
      },
    });

    const result = await service.updateSession("session-1", draft);

    expect(repository.updateStructured).toHaveBeenCalledTimes(1);
    expect(repository.update).not.toHaveBeenCalled();
    expect(repository.updateStructured).toHaveBeenCalledWith("session-1", {
      name: "Nom modifié",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      movements: [newMovement("act-1", "Gainage")],
      structure: {
        elements: [
          {
            kind: "CIRCUIT",
            circuit: {
              id: "tour-1",
              repeatCount: 1,
              nature: "SERIES",
              exercises: [
                expect.objectContaining({
                  id: "act-1",
                  type: "EXERCISE",
                  executionParameters: durationParameters(30, 1, 0),
                  postActivityRecoverySeconds: null, // PRE-6 (story 1.1, AD-35) : née sans récupération
                  sourceMovementId: "act-1",
                  copyNumber: null,
                }),
              ],
            },
          },
        ],
        stopPoints: [],
      },
      persistedActivityIds: ["act-1"],
    });
    expect(result).toEqual(outcome);
  });

  it("returns NOT_FOUND unchanged when the repository reports it", async () => {
    const repository = new FakeSessionRepository();
    repository.updateStructured.mockResolvedValue({ status: "NOT_FOUND" });
    const service = serviceOf(repository);

    const result = await service.updateSession("session-1", anEditDraft());

    expect(result).toEqual({ status: "NOT_FOUND" });
  });

  it("returns ARCHIVED unchanged when the repository reports it", async () => {
    const repository = new FakeSessionRepository();
    repository.updateStructured.mockResolvedValue({ status: "ARCHIVED" });
    const service = serviceOf(repository);

    const result = await service.updateSession("session-1", anEditDraft());

    expect(result).toEqual({ status: "ARCHIVED" });
  });

  it("propagates a SessionValidationError from the repository unchanged (defense-in-depth path)", async () => {
    const repository = new FakeSessionRepository();
    const repositoryValidationError = new SessionValidationError([
      { code: "REQUIRED", field: "session.name" },
    ]);
    repository.updateStructured.mockRejectedValue(repositoryValidationError);
    const service = serviceOf(repository);

    await expect(service.updateSession("session-1", anEditDraft())).rejects.toBe(
      repositoryValidationError,
    );
  });

  it("propagates a technical error from the repository unchanged, without turning it into a structured result", async () => {
    const repository = new FakeSessionRepository();
    const technicalError = new Error("The stable local user is missing.");
    repository.updateStructured.mockRejectedValue(technicalError);
    const service = serviceOf(repository);

    await expect(service.updateSession("session-1", anEditDraft())).rejects.toBe(technicalError);
  });
});

describe("SessionService.getSessionForEdit (T01-S10, CE-T01-S10-01/02)", () => {
  it("returns OK with the session for an active id, reading it only after checking the status", async () => {
    const repository = new FakeSessionRepository();
    const session = withStructure(aSession());
    repository.findSessionStatus.mockResolvedValue("ACTIVE");
    // PRE-9 (A.1) : lecture par le port structuré.
    repository.findStructuredById.mockResolvedValue(session);
    const service = new SessionService(repository);

    const result = await service.getSessionForEdit("session-1");

    expect(result).toEqual({ status: "OK", session });
    expect(repository.findSessionStatus).toHaveBeenCalledWith("session-1");
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND for an unknown id, without ever calling findById", async () => {
    const repository = new FakeSessionRepository();
    repository.findSessionStatus.mockResolvedValue(null);
    const service = new SessionService(repository);

    const result = await service.getSessionForEdit("nope");

    expect(result).toEqual({ status: "NOT_FOUND" });
    expect(repository.findStructuredById).not.toHaveBeenCalled();
  });

  it("returns ARCHIVED for an archived session, without ever calling findById", async () => {
    const repository = new FakeSessionRepository();
    repository.findSessionStatus.mockResolvedValue("ARCHIVED");
    const service = new SessionService(repository);

    const result = await service.getSessionForEdit("archived-1");

    expect(result).toEqual({ status: "ARCHIVED" });
    expect(repository.findStructuredById).not.toHaveBeenCalled();
  });

  it("propagates a technical error from the repository unchanged", async () => {
    const repository = new FakeSessionRepository();
    const technicalError = new Error("db down");
    repository.findSessionStatus.mockRejectedValue(technicalError);
    const service = new SessionService(repository);

    await expect(service.getSessionForEdit("session-1")).rejects.toBe(technicalError);
  });
});

describe("SessionService.listActiveSessions", () => {
  it("returns the repository's summaries unchanged", async () => {
    const repository = new FakeSessionRepository();
    const summaries: readonly SessionSummary[] = [
      {
        id: "session-1",
        name: "Séance simple",
        color: DEFAULT_SESSION_COLOR,
        activityCount: 1,
        estimatedDurationSeconds: 45,
        isEstimatedDurationApproximate: false,
        tourRepeatCount: 1,
        updatedAt: "2026-01-01T00:00:00.000Z",
        categoryNames: [],
        bodyZoneNames: [],
      },
    ];
    repository.listActive.mockResolvedValue(summaries);
    const service = new SessionService(repository);

    const result = await service.listActiveSessions();

    expect(repository.listActive).toHaveBeenCalledTimes(1);
    expect(result).toBe(summaries);
  });
});

describe("SessionService.getSession", () => {
  it("returns the repository's session unchanged for an existing id", async () => {
    const repository = new FakeSessionRepository();
    const session = aSession();
    repository.findById.mockResolvedValue(session);
    const service = new SessionService(repository);

    const result = await service.getSession(session.id);

    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.findById).toHaveBeenCalledWith(session.id);
    expect(result).toBe(session);
  });

  it("returns null for a missing id, without throwing", async () => {
    const repository = new FakeSessionRepository();
    repository.findById.mockResolvedValue(null);
    const service = new SessionService(repository);

    await expect(service.getSession("missing-id")).resolves.toBeNull();

    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.findById).toHaveBeenCalledWith("missing-id");
  });
});

/**
 * V2-PRE-2 (plan §6.3, UI-9194767E574D-A3DE880FD82B1) : abroge l'écrasement
 * V2-PRE-1 — chaque occurrence porte déjà sa propre
 * `postActivityRecoverySeconds`, copiée du Profil au moment de sa création
 * RÉELLE (`ActivitySelectionScreen`/`ExerciseScreen` local). `createSession`
 * ne la relit ni ne l'écrase plus jamais depuis le Profil.
 */
describe("SessionService.createSession — plus d'écrasement de la récupération post-exercice (V2-PRE-2)", () => {
  it("persists each exercise's own postActivityRecoverySeconds unchanged, never re-deriving it from the Profile", async () => {
    const sessionRepository = new FakeSessionRepository();
    sessionRepository.createStructured.mockResolvedValue(withStructure(aSession()));
    const service = serviceOf(sessionRepository);

    await service.createSession(
      withLocalMovements({
        ...createEmptyDraft(),
        name: "Séance simple",
        exercises: [
          { ...createExerciseDraft("ex-1", 30), name: "Gainage" },
          { ...createExerciseDraft("ex-2", 45), name: "Squats" },
        ],
      }),
    );

    expect(exercisesOf(sessionRepository.createStructured.mock.calls[0]![0])).toEqual([
      expect.objectContaining({ postActivityRecoverySeconds: 30 }),
      expect.objectContaining({ postActivityRecoverySeconds: 45 }),
    ]);
  });

  // PRE-6 (story 1.1, AD-35) : l'occurrence naît sans récupération (`null`), transmise telle quelle.
  it("passes the draft's absent Récupération (null) through unchanged when the occurrence never received one", async () => {
    const sessionRepository = new FakeSessionRepository();
    sessionRepository.createStructured.mockResolvedValue(withStructure(aSession()));
    const service = serviceOf(sessionRepository);

    await service.createSession(aValidDraft());

    expect(exercisesOf(sessionRepository.createStructured.mock.calls[0]![0])).toEqual([
      expect.objectContaining({ postActivityRecoverySeconds: null }),
    ]);
  });
});

describe("D-510 (06/11/2026) : fiche Mouvement créée depuis la Composition", () => {
  const marked = () => [...renderHook(() => useNewMovementMarks()).result.current.ids].sort();

  it("marquée « New » une fois la Séance enregistrée (création ou modification) ; pas avant, ni en cas d'échec", async () => {
    resetNewMovementMarks();
    const repository = new FakeSessionRepository();
    repository.createStructured.mockResolvedValue(withStructure(aSession()));
    await serviceOf(repository).createSession(aValidDraft());
    expect(marked()).toEqual(["ex-1"]);

    resetNewMovementMarks();
    repository.updateStructured.mockResolvedValue({ status: "NOT_FOUND" });
    await serviceOf(repository).updateSession("session-1", aValidDraft());
    expect(marked()).toEqual([]);
  });

  it("une fiche existante réutilisée ou corrigée (EDITED) n'est pas une création", async () => {
    resetNewMovementMarks();
    const repository = new FakeSessionRepository();
    repository.createStructured.mockResolvedValue(withStructure(aSession()));
    const draft = aValidDraft();
    const edited: SessionDraft = {
      ...draft,
      movements: Object.fromEntries(Object.entries(draft.movements ?? {}).map(([id, item]) => [id, { ...item, change: "EDITED" as const }])),
    };
    await serviceOf(repository).createSession(edited);
    expect(marked()).toEqual([]);
  });
});
