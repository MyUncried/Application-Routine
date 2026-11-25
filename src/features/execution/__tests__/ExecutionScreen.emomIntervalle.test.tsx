import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { exerciseActivity, structuredSession } from "@/domain/execution/testing/simulation";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteExecutionRepository } from "@/infrastructure/database/repositories/SqliteExecutionRepository";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { ExecutionSignalAdapter } from "@/infrastructure/haptics/ExecutionSignalAdapter";
import { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

import { advanceMoveMarks, ExecutionScreen } from "../ExecutionScreen";
import { ExecutionTimerRing } from "../ExecutionTimerRing";
import { ExecutionService } from "../ExecutionService";
import { ExecutionServiceContext } from "../ExecutionServiceContext";

/**
 * Constat e) de la recette du 18/11/2026 (Hermann, ligne n° 50, Circuit EMOM « dans chaque intervalle ») : série +1 à chaque changement de
 * mouvement, cercle figé sur l'anneau au « Suivant » qui change de mouvement, nombre de tours visible pendant le repos.
 */

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() }),
  useFocusEffect: (effect: () => void | (() => void)) => jest.requireActual<typeof import("react")>("react").useEffect(effect, [effect]),
}));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" } }));

const S = 1000;
const T0 = Date.UTC(2026, 10, 18, 19, 0, 0);


async function setup(options: { readonly initialCountdownSeconds?: number } = {}) {
  jest.spyOn(AppState, "addEventListener").mockImplementation(((_type: string, _listener: (state: AppStateStatus) => void) => ({ remove: () => undefined })) as never);
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const session = structuredSession(
    {
      elements: [
        { kind: "CIRCUIT", circuit: { id: "c", repeatCount: 2, nature: "TOURS", format: { key: "EMOM", settings: { windowSeconds: 60 } }, exercises: [exerciseActivity("A", repetitionParameters(10, 2, 0), { format: { key: "EMOM", settings: {} } }), exerciseActivity("B", repetitionParameters(10, 2, 0), { format: { key: "EMOM", settings: {} } })] } } as never,
      ],
      stopPoints: [],
    },
    { name: "EMOM dans chaque intervalle", ...options },
  );
  const clock = { ms: T0, nowMs: () => clock.ms };
  const timers: { at: number; callback: () => void; id: number }[] = [];
  let timerId = 0;
  const scheduler = {
    setTimeout: (callback: () => void, delayMs: number) => {
      timerId += 1;
      timers.push({ at: clock.ms + delayMs, callback, id: timerId });
      return timerId;
    },
    clearTimeout: (handle: unknown) => {
      const index = timers.findIndex((timer) => timer.id === handle);
      if (index >= 0) timers.splice(index, 1);
    },
  };
  const repository = new SqliteExecutionRepository(database);
  const service = new ExecutionService({ repository, clock, scheduler, newId: () => "exec-emom-intervalle", loadSession: async () => session });
  const profileService = new ProfileService(new SqliteProfileRepository(database));
  const value = { service, signals: new ExecutionSignalAdapter(), screenAwake: { keepAwake: () => undefined } };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestSafeAreaProvider>
        <ProfileServiceContext.Provider value={profileService}>
          <ExecutionServiceContext.Provider value={value}>{children}</ExecutionServiceContext.Provider>
        </ProfileServiceContext.Provider>
      </TestSafeAreaProvider>
    );
  }

  async function at(seconds: number) {
    const target = T0 + seconds * S;
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      const due = timers[0];
      if (due === undefined || due.at > target) break;
      timers.shift();
      clock.ms = Math.max(clock.ms, due.at);
      await act(async () => {
        due.callback();
        await Promise.resolve();
      });
    }
    clock.ms = target;
    await act(async () => {
      await service.dispatch({ type: "TICK" });
    });
  }

  render(<ExecutionScreen sessionId={session.id} />, { wrapper: Wrapper });
  return { service, at, repository };
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
    await new Promise((resolve) => setImmediate(resolve));
  });
}

describe("Constat e) du 18/11/2026 — Circuit EMOM « dans chaque intervalle », deux mouvements", () => {
  async function started() {
    const context = await setup();
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    await press("execution-start");
    act(() => {
      fireEvent(screen.getByTestId("execution-ring-area"), "layout", { nativeEvent: { layout: { width: 398, height: 340, x: 0, y: 0 } } });
    });
    return context;
  }

  it("série 1/2 puis 2/2 dans la minute ; le tour reste affiché pendant le repos", async () => {
    const { at } = await started();
    expect(screen.getByTestId("execution-series")).toHaveTextContent("1/2");
    expect(screen.getByTestId("execution-tour")).toHaveTextContent("1/2");
    const ringMarks = () => (screen.UNSAFE_getByType(ExecutionTimerRing).props as { marks?: readonly number[] }).marks ?? [];
    expect(ringMarks()).toEqual([]);
    await at(15);
    await press("execution-emom-next");
    expect(screen.getByTestId("execution-series")).toHaveTextContent("2/2");
    // Cercle figé à l'instant du changement de mouvement (15 s sur 60 : un quart de tour).
    expect(ringMarks()).toEqual([0.25]);
    expect(screen.getByTestId("execution-tour")).toHaveTextContent("1/2");
    await at(30);
    await press("execution-emom-next");
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Repos");
    expect(screen.getByTestId("execution-tour")).toHaveTextContent("1/2");
    // Le repère reste jusqu'à la fin de l'intervalle.
    expect(ringMarks()).toEqual([0.25]);
    await at(45);
    expect(screen.getByTestId("execution-tour")).toHaveTextContent("1/2");
    await at(60);
    expect(screen.getByTestId("execution-series")).toHaveTextContent("1/2");
    expect(screen.getByTestId("execution-tour")).toHaveTextContent("2/2");
    // Nouvel intervalle : anneau sans repère.
    expect(ringMarks()).toEqual([]);
    // Dernier tour : même règle pendant son repos.
    await at(70);
    await press("execution-emom-next");
    await at(80);
    await press("execution-emom-next");
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Repos");
    expect(screen.getByTestId("execution-tour")).toHaveTextContent("2/2");
    await at(100);
    expect(screen.getByTestId("execution-tour")).toHaveTextContent("2/2");
  });
});

describe("advanceMoveMarks — repère de changement de mouvement (constat e du 18/11/2026)", () => {
  const empty = { key: null, list: [], last: null } as const;
  it("un autre mouvement dans le même intervalle ajoute un repère ; un nouvel intervalle repart sans repère", () => {
    let marks = advanceMoveMarks(empty, "w#1", { step: "a1", name: "A" }, 0);
    expect(marks.list).toEqual([]);
    marks = advanceMoveMarks(marks, "w#1", { step: "b1", name: "B" }, 15_000);
    expect(marks.list).toEqual([15_000]);
    expect(advanceMoveMarks(marks, "w#1", null, 40_000)).toBe(marks);
    expect(advanceMoveMarks(marks, "w#2", { step: "a2", name: "A" }, 0).list).toEqual([]);
  });

  it("changement de côté (même mouvement) : aucun repère ; hors EMOM : aucun repère", () => {
    const first = advanceMoveMarks(empty, "w#1", { step: "a1-g", name: "A" }, 0);
    expect(advanceMoveMarks(first, "w#1", { step: "a1-d", name: "A" }, 20_000).list).toEqual([]);
    expect(advanceMoveMarks(first, null, { step: "b1", name: "B" }, 20_000)).toEqual(empty);
  });
});
