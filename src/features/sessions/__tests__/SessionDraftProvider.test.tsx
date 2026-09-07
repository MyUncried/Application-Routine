import { act, render, waitFor } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { useEffect, type ReactNode } from "react";
import { Text } from "react-native";

import type { Session } from "@/domain/sessions/Session";
import { DEFAULT_SESSION_COLOR } from "@/domain/sessions/Session";
import { createEmptyDraft, createExerciseDraft } from "@/domain/sessions/SessionDraft";
import type { LoadSessionForEditResult, SessionService } from "@/features/sessions/SessionService";
import { SessionDraftProvider } from "@/features/sessions/SessionDraftProvider";
import {
  useSessionDraft,
  type SessionDraftContextValue,
} from "@/features/sessions/SessionDraftContext";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";

function Capture({ onRender }: { onRender: (value: SessionDraftContextValue) => void }) {
  const value = useSessionDraft();
  useEffect(() => {
    onRender(value);
  });
  return <Text>captured</Text>;
}

describe("SessionDraftProvider", () => {
  it("initializes with an empty draft (createEmptyDraft())", () => {
    let captured: SessionDraftContextValue | undefined;
    render(
      <SessionDraftProvider>
        <Capture onRender={(value) => (captured = value)} />
      </SessionDraftProvider>,
    );

    expect(captured?.draft).toEqual(createEmptyDraft());
  });

  it("updateDraft merges the provided patch into the current draft, without discarding other fields", () => {
    let captured!: SessionDraftContextValue;
    render(
      <SessionDraftProvider>
        <Capture onRender={(value) => (captured = value)} />
      </SessionDraftProvider>,
    );

    act(() => {
      captured.updateDraft({ name: "Séance simple" });
    });
    act(() => {
      captured.updateDraft({ color: "#E5484D" });
    });

    expect(captured.draft.name).toBe("Séance simple");
    expect(captured.draft.color).toBe("#E5484D");
  });

  it("resetDraft restores exactly createEmptyDraft(), discarding every prior modification", () => {
    let captured!: SessionDraftContextValue;
    render(
      <SessionDraftProvider>
        <Capture onRender={(value) => (captured = value)} />
      </SessionDraftProvider>,
    );

    act(() => {
      captured.updateDraft({
        name: "Séance simple",
        color: "#E5484D",
        initialCountdownSeconds: 20,
        finalPhaseSeconds: 15,
        exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 30 }],
      });
    });
    expect(captured.draft.name).toBe("Séance simple");

    act(() => {
      captured.resetDraft();
    });

    expect(captured.draft).toEqual(createEmptyDraft());
  });

  it("keeps updateDraft/resetDraft referentially stable across renders caused by a draft change", () => {
    const seenUpdateDraft = new Set<SessionDraftContextValue["updateDraft"]>();
    const seenResetDraft = new Set<SessionDraftContextValue["resetDraft"]>();
    let captured!: SessionDraftContextValue;

    render(
      <SessionDraftProvider>
        <Capture
          onRender={(value) => {
            captured = value;
            seenUpdateDraft.add(value.updateDraft);
            seenResetDraft.add(value.resetDraft);
          }}
        />
      </SessionDraftProvider>,
    );

    act(() => {
      captured.updateDraft({ name: "Séance simple" });
    });
    act(() => {
      captured.updateDraft({ name: "Autre nom" });
    });

    expect(seenUpdateDraft.size).toBe(1);
    expect(seenResetDraft.size).toBe(1);
  });

  it("persists the same draft across two renders of a descendant tree (no unmount in between)", () => {
    const renders: unknown[] = [];

    function Sibling() {
      const { draft } = useSessionDraft();
      renders.push(draft.name);
      return <Text>sibling</Text>;
    }

    const { rerender } = render(
      <SessionDraftProvider>
        <Sibling />
      </SessionDraftProvider>,
    );

    rerender(
      <SessionDraftProvider>
        <Sibling />
      </SessionDraftProvider>,
    );

    // Both renders saw the same (empty) draft name: the Provider's state was
    // never reset by the second render pass, since `SessionDraftProvider`
    // itself was never unmounted between the two `render`/`rerender` calls.
    expect(renders).toEqual(["", ""]);
  });
});

describe("SessionDraftProvider — mode modification (T01-S10)", () => {
  function aSession(overrides: Partial<Session> = {}): Session {
    return {
      id: "session-42",
      ownerId: "usr_test",
      name: "Séance persistée",
      color: DEFAULT_SESSION_COLOR,
      status: "ACTIVE",
      initialCountdownSeconds: 12,
      finalPhaseSeconds: 7,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      cycle: {
        id: "cycle-1",
        position: 1,
        repeatCount: 1,
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 3,
          exercises: [
            {
              id: "act-1",
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
              bodyZoneIds: [],
            },
          ],
        },
      },
      categories: [],
      ...overrides,
    };
  }

  function newGetForEdit() {
    return jest.fn<(id: string) => Promise<LoadSessionForEditResult>>();
  }

  function makeService(getSessionForEdit: ReturnType<typeof newGetForEdit>) {
    return { getSessionForEdit } as unknown as SessionService;
  }

  function renderWithService(service: SessionService, capture: (value: SessionDraftContextValue) => void) {
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <SessionServiceContext.Provider value={service}>
          <SessionDraftProvider>{children}</SessionDraftProvider>
        </SessionServiceContext.Provider>
      );
    }
    return render(
      <Wrapper>
        <Capture onRender={capture} />
      </Wrapper>,
    );
  }

  it("hydrates the draft from the persisted session, keeping source id / tour repeat / activity ids, without writing", async () => {
    const getSessionForEdit = newGetForEdit();
    getSessionForEdit.mockResolvedValue({ status: "OK", session: aSession() });
    let captured!: SessionDraftContextValue;
    renderWithService(makeService(getSessionForEdit), (value) => (captured = value));

    act(() => {
      captured.hydrateFromSession?.("session-42");
    });

    await waitFor(() => expect(captured.editStatus).toBe("ready"));
    expect(captured.draft.sourceSessionId).toBe("session-42");
    expect(captured.draft.tourRepeatCount).toBe(3);
    expect(captured.draft.exercises.map((e) => e.id)).toEqual(["act-1"]);
    expect(getSessionForEdit).toHaveBeenCalledWith("session-42");
    // T01-S10 (CE-T01-S10-06) : le brouillon réhydraté sert de référence à
    // la garde de sortie.
    expect(captured.hydratedBaseline).toEqual(captured.draft);
  });

  it("reports NOT_FOUND for an unknown id and never leaves a demo draft", async () => {
    const getSessionForEdit = newGetForEdit();
    getSessionForEdit.mockResolvedValue({ status: "NOT_FOUND" });
    let captured!: SessionDraftContextValue;
    renderWithService(makeService(getSessionForEdit), (value) => (captured = value));

    act(() => {
      captured.hydrateFromSession?.("nope");
    });

    await waitFor(() => expect(captured.editStatus).toBe("not-found"));
    expect(captured.draft).toEqual(createEmptyDraft());
  });

  it("reports ARCHIVED for an archived session", async () => {
    const getSessionForEdit = newGetForEdit();
    getSessionForEdit.mockResolvedValue({ status: "ARCHIVED" });
    let captured!: SessionDraftContextValue;
    renderWithService(makeService(getSessionForEdit), (value) => (captured = value));

    act(() => {
      captured.hydrateFromSession?.("archived-1");
    });

    await waitFor(() => expect(captured.editStatus).toBe("archived"));
  });

  it("reports error on a technical failure and retryHydration re-runs the load", async () => {
    const getSessionForEdit = newGetForEdit();
    getSessionForEdit.mockRejectedValueOnce(new Error("db down"));
    getSessionForEdit.mockResolvedValueOnce({ status: "OK", session: aSession() });
    let captured!: SessionDraftContextValue;
    renderWithService(makeService(getSessionForEdit), (value) => (captured = value));

    act(() => {
      captured.hydrateFromSession?.("session-42");
    });
    await waitFor(() => expect(captured.editStatus).toBe("error"));

    act(() => {
      captured.retryHydration?.();
    });
    await waitFor(() => expect(captured.editStatus).toBe("ready"));
    expect(getSessionForEdit).toHaveBeenCalledTimes(2);
  });

  it("ignores the stale response of a superseded id (no draft contamination)", async () => {
    const getSessionForEdit = newGetForEdit();
    let resolveFirst!: (r: LoadSessionForEditResult) => void;
    getSessionForEdit.mockImplementationOnce(
      () => new Promise<LoadSessionForEditResult>((resolve) => (resolveFirst = resolve)),
    );
    getSessionForEdit.mockResolvedValueOnce({
      status: "OK",
      session: aSession({ id: "session-99", name: "La bonne" }),
    });
    let captured!: SessionDraftContextValue;
    renderWithService(makeService(getSessionForEdit), (value) => (captured = value));

    act(() => {
      captured.hydrateFromSession?.("session-42");
    });
    act(() => {
      captured.hydrateFromSession?.("session-99");
    });
    await waitFor(() => expect(captured.draft.sourceSessionId).toBe("session-99"));

    // La réponse tardive de session-42 arrive : elle ne doit rien écraser.
    await act(async () => {
      resolveFirst({ status: "OK", session: aSession({ id: "session-42", name: "La périmée" }) });
    });
    expect(captured.draft.sourceSessionId).toBe("session-99");
    expect(captured.editStatus).toBe("ready");
  });

  it("falls back to error when no SessionService is available", async () => {
    let captured!: SessionDraftContextValue;
    render(
      <SessionDraftProvider>
        <Capture onRender={(value) => (captured = value)} />
      </SessionDraftProvider>,
    );

    act(() => {
      captured.hydrateFromSession?.("session-42");
    });
    await waitFor(() => expect(captured.editStatus).toBe("error"));
  });
});
