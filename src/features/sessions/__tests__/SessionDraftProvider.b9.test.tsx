import { describe, expect, it, jest } from "@jest/globals";
import { act, render, waitFor } from "@testing-library/react-native";
import { useEffect } from "react";
import { Text } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { DEFAULT_SESSION_COLOR, type Session } from "@/domain/sessions/Session";
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { withStructure } from "@/domain/sessions/testing/structuredSession";
import { initialSessionName, sessionNamePromptShown, suggestedSessionNameAfter } from "@/domain/sessions/sessionNaming";
import { SessionDraftProvider } from "@/features/sessions/SessionDraftProvider";
import { useSessionDraft, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import type { LoadSessionForEditResult, SessionService } from "@/features/sessions/SessionService";

/**
 * PRE-9 B.9 — Nom de séance à trois états (ch08, ARB-14, ARB-15 ; précisions de Hermann du
 * 01/11/2026, main `fce276fd` : « le nom du Format peut être suggéré ; le champ est modifiable dès
 * l'ouverture ; un nom personnalisé n'est jamais remplacé automatiquement »).
 */

const exercise = (id: string, name: string): SessionDraftExercise => ({
  ...createExerciseDraft(id),
  name,
  executionParameters: durationParameters(30),
});

describe("sessionNaming (domaine)", () => {
  it("état 1 : le nom du Format est la suggestion initiale ; sans Format, aucune", () => {
    expect(initialSessionName("Tabata")).toBe("Tabata");
    expect(initialSessionName()).toBe("");
  });

  it("état 2 : à l'ajout du premier Exercice, son nom (sans suffixe de niveau)", () => {
    expect(suggestedSessionNameAfter([], [exercise("a", "Pompes")], "")).toBe("Pompes");
    // Ouverture depuis un Format : la suggestion du Format cède au premier Exercice ajouté.
    expect(suggestedSessionNameAfter([], [exercise("a", "Pompes")], "Tabata")).toBe("Pompes");
  });

  it("état 3 : à l'ajout du deuxième Exercice, la suggestion s'efface au profit de l'invite", () => {
    const one = [exercise("a", "Pompes")];
    const two = [...one, exercise("b", "Squats")];
    expect(suggestedSessionNameAfter(one, two, "Pompes")).toBe("");
    expect(sessionNamePromptShown(one)).toBe(false);
    expect(sessionNamePromptShown(two)).toBe(true);
  });

  it("retrait d'Exercices : aucune nouvelle substitution", () => {
    const two = [exercise("a", "Pompes"), exercise("b", "Squats")];
    expect(suggestedSessionNameAfter(two, two.slice(0, 1), "")).toBe("");
    expect(suggestedSessionNameAfter(two.slice(0, 1), [], "Pompes")).toBe("Pompes");
  });
});

function Capture({ onRender }: { onRender: (value: SessionDraftContextValue) => void }) {
  const value = useSessionDraft();
  useEffect(() => {
    onRender(value);
  });
  return <Text>captured</Text>;
}

function renderProvider(service?: SessionService) {
  let captured!: SessionDraftContextValue;
  const tree = (
    <SessionDraftProvider>
      <Capture onRender={(value) => (captured = value)} />
    </SessionDraftProvider>
  );
  render(service === undefined ? tree : <SessionServiceContext.Provider value={service}>{tree}</SessionServiceContext.Provider>);
  return () => captured;
}

describe("SessionDraftProvider — nom suggéré (B.9)", () => {
  it("création : le premier Exercice nomme la Séance, le deuxième efface la suggestion", () => {
    const current = renderProvider();
    act(() => current().updateDraft((draft) => ({ exercises: [...draft.exercises, exercise("a", "Pompes")] })));
    expect(current().draft.name).toBe("Pompes");
    act(() => current().updateDraft((draft) => ({ exercises: [...draft.exercises, exercise("b", "Squats")] })));
    expect(current().draft.name).toBe("");
  });

  it("le champ est modifiable dès l'ouverture ; un nom saisi n'est jamais remplacé automatiquement (ARB-14)", () => {
    const current = renderProvider();
    act(() => current().updateDraft({ name: "Ma séance" }));
    act(() => current().updateDraft((draft) => ({ exercises: [...draft.exercises, exercise("a", "Pompes")] })));
    expect(current().draft.name).toBe("Ma séance");
    act(() => current().updateDraft((draft) => ({ exercises: [...draft.exercises, exercise("b", "Squats")] })));
    expect(current().draft.name).toBe("Ma séance");
  });

  it("le nom suggéré, une fois modifié, devient personnalisé", () => {
    const current = renderProvider();
    act(() => current().updateDraft((draft) => ({ exercises: [...draft.exercises, exercise("a", "Pompes")] })));
    act(() => current().updateDraft({ name: "Pompes du matin" }));
    act(() => current().updateDraft((draft) => ({ exercises: [...draft.exercises, exercise("b", "Squats")] })));
    expect(current().draft.name).toBe("Pompes du matin");
  });

  it("une nouvelle création repart d'un nom suggéré", () => {
    const current = renderProvider();
    act(() => current().updateDraft({ name: "Ma séance" }));
    act(() => current().resetDraft());
    act(() => current().updateDraft((draft) => ({ exercises: [...draft.exercises, exercise("a", "Pompes")] })));
    expect(current().draft.name).toBe("Pompes");
  });

  it("modification d'une Séance existante : son nom n'est jamais recalculé", async () => {
    const session = withStructure({
      id: "s-1",
      ownerId: "usr_test",
      name: "Haut du corps",
      color: DEFAULT_SESSION_COLOR,
      status: "ACTIVE",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 10,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      cycle: { id: "cycle-1", position: 1, repeatCount: 1, tour: { id: "tour-1", position: 1, repeatCount: 1, exercises: [] } },
      categories: [],
    } as Session);
    const getSessionForEdit = jest.fn<(id: string) => Promise<LoadSessionForEditResult>>();
    getSessionForEdit.mockResolvedValue({ status: "OK", session });
    const current = renderProvider({ getSessionForEdit } as unknown as SessionService);
    act(() => current().hydrateFromSession?.("s-1"));
    await waitFor(() => expect(current().editStatus).toBe("ready"));
    act(() => current().updateDraft((draft) => ({ exercises: [...draft.exercises, exercise("a", "Pompes")] })));
    expect(current().draft.name).toBe("Haut du corps");
  });
});
