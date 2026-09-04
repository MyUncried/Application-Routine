import { describe, expect, it, jest } from "@jest/globals";

import type { CreateSessionInput, Session, SessionSummary } from "@/domain/sessions/Session";
import { DEFAULT_SESSION_COLOR } from "@/domain/sessions/Session";
import {
  createEmptyDraft,
  createExerciseDraft,
  type SessionDraft,
} from "@/domain/sessions/SessionDraft";
import {
  DEFAULT_EXERCISE_DURATION_SECONDS,
  DEFAULT_FINAL_PHASE_SECONDS,
  DEFAULT_INITIAL_COUNTDOWN_SECONDS,
} from "@/domain/sessions/defaults";
import { SessionValidationError } from "@/domain/sessions/errors";
import type {
  SessionRepository,
  UpdateSessionOutcome,
} from "@/domain/sessions/SessionRepository";

import { SessionService } from "@/features/sessions/SessionService";

// Repository factice, sans aucune dépendance SQLite (ni node:sqlite, ni
// expo-sqlite, ni NodeSqliteDatabase, ni SqliteSessionRepository).
class FakeSessionRepository implements SessionRepository {
  create = jest.fn<(input: CreateSessionInput) => Promise<Session>>();
  findById = jest.fn<(sessionId: string) => Promise<Session | null>>();
  listActive = jest.fn<() => Promise<readonly SessionSummary[]>>();
  update =
    jest.fn<(sessionId: string, input: CreateSessionInput) => Promise<UpdateSessionOutcome>>();
}

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
        exercise: {
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
          instruction: null,
        },
      },
    },
    ...overrides,
  };
}

function aValidDraft(): SessionDraft {
  return {
    ...createEmptyDraft(),
    name: "Séance simple",
    exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage" }],
  };
}

describe("SessionService.createSession", () => {
  it("does not call the repository for an invalid draft", async () => {
    const repository = new FakeSessionRepository();
    const service = new SessionService(repository);

    await service.createSession(createEmptyDraft());

    expect(repository.create).not.toHaveBeenCalled();
  });

  it("returns the structured violations for an invalid draft, unaltered", async () => {
    const repository = new FakeSessionRepository();
    const service = new SessionService(repository);

    const result = await service.createSession(createEmptyDraft());

    expect(result).toEqual({
      ok: false,
      violations: [
        { code: "REQUIRED", field: "session.name" },
        { code: "REQUIRED", field: "exercise.name" },
        { code: "REQUIRED", field: "exercise.durationSeconds" },
      ],
    });
  });

  it("calls the repository exactly once with the normalized input for a valid draft", async () => {
    const repository = new FakeSessionRepository();
    const created = aSession();
    repository.create.mockResolvedValue(created);
    const service = new SessionService(repository);

    const draft: SessionDraft = {
      ...aValidDraft(),
      name: "  Séance   simple  ",
      exercises: [{ ...createExerciseDraft("ex-1"), name: "  Gainage  " }],
    };

    const result = await service.createSession(draft);

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({
      name: "Séance simple",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercise: { name: "Gainage", durationSeconds: 30, instruction: null },
    });
    expect(result).toEqual({ ok: true, value: created });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(created);
    }
  });

  it("propagates a technical error from the repository unchanged, without turning it into a structured result", async () => {
    const repository = new FakeSessionRepository();
    const technicalError = new Error("The stable local user is missing.");
    repository.create.mockRejectedValue(technicalError);
    const service = new SessionService(repository);

    await expect(service.createSession(aValidDraft())).rejects.toBe(technicalError);
  });

  it("propagates a SessionValidationError from the repository unchanged (defense-in-depth path)", async () => {
    const repository = new FakeSessionRepository();
    const repositoryValidationError = new SessionValidationError([
      { code: "INVALID_COLOR", field: "session.color" },
    ]);
    repository.create.mockRejectedValue(repositoryValidationError);
    const service = new SessionService(repository);

    await expect(service.createSession(aValidDraft())).rejects.toBe(repositoryValidationError);
  });

  it("threads the canonical default values through the service without redefining them", async () => {
    const repository = new FakeSessionRepository();
    repository.create.mockResolvedValue(aSession());
    const service = new SessionService(repository);

    const draft: SessionDraft = {
      ...createEmptyDraft(),
      name: "Séance simple",
      exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage" }],
    };

    await service.createSession(draft);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        initialCountdownSeconds: DEFAULT_INITIAL_COUNTDOWN_SECONDS,
        finalPhaseSeconds: DEFAULT_FINAL_PHASE_SECONDS,
        exercise: expect.objectContaining({ durationSeconds: DEFAULT_EXERCISE_DURATION_SECONDS }),
      }),
    );
  });
});

describe("SessionService.updateSession", () => {
  it("does not call the repository for an invalid draft", async () => {
    const repository = new FakeSessionRepository();
    const service = new SessionService(repository);

    await service.updateSession("session-1", createEmptyDraft());

    expect(repository.update).not.toHaveBeenCalled();
  });

  it("returns INVALID for an invalid draft, without capturing violations from anywhere else", async () => {
    const repository = new FakeSessionRepository();
    const service = new SessionService(repository);

    const result = await service.updateSession("session-1", createEmptyDraft());

    expect(result).toEqual({
      status: "INVALID",
      violations: [
        { code: "REQUIRED", field: "session.name" },
        { code: "REQUIRED", field: "exercise.name" },
        { code: "REQUIRED", field: "exercise.durationSeconds" },
      ],
    });
  });

  it("returns INVALID rather than NOT_FOUND when both the draft is invalid and the id is unknown, because validation precedes lookup", async () => {
    const repository = new FakeSessionRepository();
    const service = new SessionService(repository);

    const result = await service.updateSession("does-not-exist", createEmptyDraft());

    expect(repository.update).not.toHaveBeenCalled();
    expect(result.status).toBe("INVALID");
  });

  it("calls the repository exactly once with the normalized input for a valid draft, and returns UPDATED unchanged", async () => {
    const repository = new FakeSessionRepository();
    const updated = aSession({ name: "Nom modifié" });
    const outcome: UpdateSessionOutcome = { status: "UPDATED", session: updated };
    repository.update.mockResolvedValue(outcome);
    const service = new SessionService(repository);

    const draft: SessionDraft = {
      ...aValidDraft(),
      name: "  Nom modifié  ",
      exercises: [{ ...createExerciseDraft("ex-1"), name: "  Gainage  " }],
    };

    const result = await service.updateSession("session-1", draft);

    expect(repository.update).toHaveBeenCalledTimes(1);
    expect(repository.update).toHaveBeenCalledWith("session-1", {
      name: "Nom modifié",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercise: { name: "Gainage", durationSeconds: 30, instruction: null },
    });
    expect(result).toEqual(outcome);
  });

  it("returns NOT_FOUND unchanged when the repository reports it", async () => {
    const repository = new FakeSessionRepository();
    repository.update.mockResolvedValue({ status: "NOT_FOUND" });
    const service = new SessionService(repository);

    const result = await service.updateSession("session-1", aValidDraft());

    expect(result).toEqual({ status: "NOT_FOUND" });
  });

  it("returns ARCHIVED unchanged when the repository reports it", async () => {
    const repository = new FakeSessionRepository();
    repository.update.mockResolvedValue({ status: "ARCHIVED" });
    const service = new SessionService(repository);

    const result = await service.updateSession("session-1", aValidDraft());

    expect(result).toEqual({ status: "ARCHIVED" });
  });

  it("propagates a SessionValidationError from the repository unchanged (defense-in-depth path)", async () => {
    const repository = new FakeSessionRepository();
    const repositoryValidationError = new SessionValidationError([
      { code: "INVALID_COLOR", field: "session.color" },
    ]);
    repository.update.mockRejectedValue(repositoryValidationError);
    const service = new SessionService(repository);

    await expect(service.updateSession("session-1", aValidDraft())).rejects.toBe(
      repositoryValidationError,
    );
  });

  it("propagates a technical error from the repository unchanged, without turning it into a structured result", async () => {
    const repository = new FakeSessionRepository();
    const technicalError = new Error("The stable local user is missing.");
    repository.update.mockRejectedValue(technicalError);
    const service = new SessionService(repository);

    await expect(service.updateSession("session-1", aValidDraft())).rejects.toBe(technicalError);
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
        tourRepeatCount: 1,
        updatedAt: "2026-01-01T00:00:00.000Z",
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
