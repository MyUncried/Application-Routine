import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Activity } from "@/domain/sessions/Session";
import type { SessionStatus } from "@/domain/sessions/SessionRepository";
import { SessionCatalogueList } from "@/features/sessions/SessionCatalogueList";
import { projectSessionForCatalogue } from "@/features/sessions/sessionCatalogueProjection";
import type { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";

/**
 * PRE-8 (epic E, story E.5) — actions glissées et cycle de vie dans la liste du segment Séances :
 * actions selon l'état, bloc de 80 aligné en haut même déployé, Annuler, confirmation de suppression.
 */

jest.mock("expo-crypto", () => ({ randomUUID: () => "uuid-copy" }));

let sequence = 0;
const exercise = (name: string): Activity => ({
  id: `ex-${++sequence}`,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  position: 0,
  name,
  executionParameters: durationParameters(45),
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds: [],
  categoryId: null,
  media: [],
});

const session = (id: string, status: SessionStatus = "ACTIVE", count = 2) =>
  projectSessionForCatalogue(
    {
      id,
      name: `Séance ${id}`,
      color: "#3B82F6",
      labelId: null,
      status,
      archivedAt: status === "ARCHIVED" ? "2026-10-28T09:00:00.000Z" : null,
      updatedAt: "2026-10-28T08:00:00.000Z",
      structure: {
        elements: Array.from({ length: count }, (_, index) => ({ kind: "EXERCISE" as const, exercise: exercise(`Ex ${index}`) })),
        stopPoints: [],
      },
    },
    new Map(),
  );

function makeService() {
  const done = () => Promise.resolve({ status: "DONE" as const });
  const service = {
    archiveSession: jest.fn(done),
    restoreSession: jest.fn(done),
    deleteArchivedSession: jest.fn(done),
    duplicateSession: jest.fn(() => Promise.resolve({ status: "DUPLICATED" as const, session: {} })),
  };
  return service;
}

function renderList(sessions: ReturnType<typeof session>[], service = makeService(), onChanged = jest.fn()) {
  render(
    <SessionServiceContext.Provider value={service as unknown as SessionService}>
      <SessionCatalogueList sessions={sessions} emptyMessage={null} onOpenSession={() => undefined} onChanged={onChanged} />
    </SessionServiceContext.Provider>,
  );
  return { service, onChanged };
}

async function flush() {
  await act(async () => {
    for (let index = 0; index < 4; index += 1) await Promise.resolve();
  });
}

const reveal = (id: string) => {
  const row = screen.getByTestId(`session-card-${id}-swipe`);
  fireEvent(row, "touchStart", { nativeEvent: { pageX: 300, pageY: 100 } });
  fireEvent(row, "moveShouldSetResponderCapture", { nativeEvent: { pageX: 100, pageY: 100 } });
  fireEvent(row, "responderMove", { nativeEvent: { pageX: 60, pageY: 100 } });
  fireEvent(row, "responderRelease", { nativeEvent: { pageX: 60, pageY: 100 } });
  fireEvent(row, "touchEnd", { nativeEvent: { pageX: 60, pageY: 100 } });
};

describe("PRE-8 E.5 — actions selon l'état", () => {
  it("active : Planifier grisé, Dupliquer, Archiver ; archivée : Restaurer puis Supprimer", () => {
    renderList([session("a"), session("z", "ARCHIVED")]);
    reveal("a");
    expect(screen.getByTestId("session-card-a-swipe-action-plan").props.accessibilityState).toEqual({ disabled: true });
    expect(screen.getByTestId("session-card-a-swipe-action-duplicate")).toBeTruthy();
    expect(screen.getByTestId("session-card-a-swipe-action-archive")).toBeTruthy();
    reveal("z");
    const actions = screen.getByTestId("session-card-z-swipe-actions");
    expect(actions.children.map((child) => (typeof child === "string" ? child : (child.props.testID as string)))).toEqual([
      "session-card-z-swipe-action-restore",
      "session-card-z-swipe-action-delete",
    ]);
  });

  it("bloc de 80, aligné en haut, même sur une carte déployée", () => {
    renderList([session("a")]);
    fireEvent.press(screen.getByTestId("session-card-a-disclosure"));
    reveal("a");
    const style = StyleSheet.flatten(screen.getByTestId("session-card-a-swipe-actions").props.style);
    expect(style).toMatchObject({ top: 0, right: 0, height: 80, width: 3 * 68 });
    expect(style.bottom).toBeUndefined();
    expect(screen.getByTestId("session-card-a-composition")).toBeTruthy();
  });

  it("actions accessibles : Planifier absent (indisponible), Dupliquer et Archiver présents", () => {
    renderList([session("a")]);
    const names = (screen.getByTestId("session-card-a-swipe-card").props.accessibilityActions as { name: string }[]).map((action) => action.name);
    expect(names).toEqual(["duplicate", "archive", "toggleComposition"]);
  });
});

describe("PRE-8 E.5 — cycle de vie", () => {
  it("Archiver : immédiat, snackbar « Séance archivée », Annuler restaure", async () => {
    const { service, onChanged } = renderList([session("a")]);
    reveal("a");
    fireEvent.press(screen.getByTestId("session-card-a-swipe-action-archive"));
    await flush();
    expect(service.archiveSession).toHaveBeenCalledWith("a");
    expect(onChanged).toHaveBeenCalled();
    expect(screen.getByText("Séance archivée")).toBeTruthy();
    fireEvent.press(screen.getByText("Annuler"));
    await flush();
    expect(service.restoreSession).toHaveBeenCalledWith("a");
  });

  it("Restaurer : snackbar « Séance restaurée », Annuler archive de nouveau", async () => {
    const { service } = renderList([session("z", "ARCHIVED")]);
    reveal("z");
    fireEvent.press(screen.getByTestId("session-card-z-swipe-action-restore"));
    await flush();
    expect(service.restoreSession).toHaveBeenCalledWith("z");
    expect(screen.getByText("Séance restaurée")).toBeTruthy();
    fireEvent.press(screen.getByText("Annuler"));
    await flush();
    expect(service.archiveSession).toHaveBeenCalledWith("z");
  });

  it("Supprimer : confirmation ; Annuler n'écrit rien ; Confirmer supprime", async () => {
    const { service } = renderList([session("z", "ARCHIVED")]);
    reveal("z");
    fireEvent.press(screen.getByTestId("session-card-z-swipe-action-delete"));
    expect(screen.getByText("Supprimer cette séance ?")).toBeTruthy();
    expect(screen.getByText("Cette séance archivée sera définitivement supprimée. Cette action est irréversible.")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Annuler"));
    expect(service.deleteArchivedSession).not.toHaveBeenCalled();
    reveal("z");
    fireEvent.press(screen.getByTestId("session-card-z-swipe-action-delete"));
    fireEvent.press(screen.getByLabelText("Confirmer"));
    await flush();
    expect(service.deleteArchivedSession).toHaveBeenCalledWith("z");
    expect(screen.queryByText("Annuler", { exact: true })).toBeNull();
  });

  it("Dupliquer : une double action ne crée qu'une copie", async () => {
    const service = makeService();
    let resolve!: () => void;
    service.duplicateSession.mockImplementation(
      () => new Promise((done) => (resolve = () => done({ status: "DUPLICATED" as const, session: {} }))),
    );
    renderList([session("a")], service);
    const card = screen.getByTestId("session-card-a-swipe-card");
    fireEvent(card, "accessibilityAction", { nativeEvent: { actionName: "duplicate" } });
    fireEvent(card, "accessibilityAction", { nativeEvent: { actionName: "duplicate" } });
    expect(service.duplicateSession).toHaveBeenCalledTimes(1);
    expect(service.duplicateSession).toHaveBeenCalledWith("a", expect.any(Function));
    resolve();
    await flush();
  });

  it("échec : message d'erreur, liste relue", async () => {
    const service = makeService();
    service.archiveSession.mockImplementation(() => Promise.reject(new Error("boom")));
    const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const { onChanged } = renderList([session("a")], service);
    fireEvent(screen.getByTestId("session-card-a-swipe-card"), "accessibilityAction", { nativeEvent: { actionName: "archive" } });
    await flush();
    expect(screen.getByTestId("catalogue-session-action-error")).toBeTruthy();
    expect(onChanged).toHaveBeenCalled();
    spy.mockRestore();
  });
});
