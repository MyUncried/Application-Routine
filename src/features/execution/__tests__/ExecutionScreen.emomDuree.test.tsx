import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { exerciseActivity, structuredSession } from "@/domain/execution/testing/simulation";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteExecutionRepository } from "@/infrastructure/database/repositories/SqliteExecutionRepository";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { ExecutionSignalAdapter } from "@/infrastructure/haptics/ExecutionSignalAdapter";
import { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

import { ExecutionScreen } from "../ExecutionScreen";
import { ExecutionService } from "../ExecutionService";
import { ExecutionServiceContext } from "../ExecutionServiceContext";
import { ExecutionTimerRing } from "../ExecutionTimerRing";

/**
 * Recette du 18/11/2026 (emom-6, spec PRE-11 §5 point 32) — EMOM en durée : un seul anneau (la minute), appui au centre partagé avec
 * le For time (retenue de l'effort seul, la minute continue), chiffre central = effort cumulé / objectif, minute restante dans le coin,
 * repos atteint à l'objectif (fond et anneau du repos, appui sans effet).
 */

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() }),
  useFocusEffect: (effect: () => void | (() => void)) => jest.requireActual<typeof import("react")>("react").useEffect(effect, [effect]),
}));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" } }));

const S = 1000;
const T0 = Date.UTC(2026, 10, 18, 19, 0, 0);

async function setup() {
  jest.spyOn(AppState, "addEventListener").mockImplementation(((_type: string, _listener: (state: AppStateStatus) => void) => ({ remove: () => undefined })) as never);
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const session = structuredSession(
    {
      elements: [
        { kind: "EXERCISE", exercise: exerciseActivity("D", durationParameters(40, 2, 0), { format: { key: "EMOM", settings: { intervalSeconds: 60 } } }) },
        { kind: "EXERCISE", exercise: exerciseActivity("B", durationParameters(30, 1, 0)) },
      ],
      stopPoints: [],
    },
    { name: "EMOM en durée" },
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
  const service = new ExecutionService({ repository, clock, scheduler, newId: () => "exec-emom-duree", loadSession: async () => session });
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
  await act(async () => {
    await new Promise((resolve) => setImmediate(resolve));
  });
  await press("execution-start");
  act(() => {
    fireEvent(screen.getByTestId("execution-ring-area"), "layout", { nativeEvent: { layout: { width: 398, height: 340, x: 0, y: 0 } } });
  });
  return { service, at };
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
    await new Promise((resolve) => setImmediate(resolve));
  });
}

const ring = () => screen.UNSAFE_getByType(ExecutionTimerRing).props as { inner?: unknown; fill?: string };

describe("Recette du 18/11/2026 (emom-6) — EMOM en durée à l'écran", () => {
  it("un seul anneau ; effort cumulé / objectif au centre, minute restante dans le coin ; retenue de l'effort seul ; repos à l'objectif", async () => {
    const { at, service } = await setup();
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Mouvement D");
    // Un seul anneau : celui de la minute (pas d'anneau intérieur de la durée).
    expect(ring().inner).toBeNull();
    expect(screen.getByTestId("execution-timer")).toHaveTextContent("00:00 / 00:40");
    expect(screen.getByTestId("execution-duration-mention")).toHaveTextContent("Appuyez pour faire pause");
    expect(ring().fill).toBe("#D1F2D9");
    await at(10);
    // (L'écran se rafraîchit sur son propre minuteur : les valeurs affichées se lisent après un appui.)
    // Appui au centre (zone partagée avec le For time) : retenue de l'effort seul.
    await press("execution-duration-zone");
    expect(screen.getByTestId("execution-duration-mention")).toHaveTextContent("Appuyez pour repartir");
    expect(screen.getByTestId("execution-timer")).toHaveTextContent("00:10 / 00:40");
    expect(screen.getByTestId("execution-duration-countdown")).toHaveTextContent("00:50");
    await at(15);
    expect(service.project()?.format?.duration?.remainingMs).toBe(30 * S);
    expect(service.project()?.format?.duration?.state).toBe("HELD");
    // La minute continue.
    expect(service.project()?.timer).toEqual({ kind: "COUNTDOWN", remainingMs: 45 * S, totalMs: 60 * S, elapsedMs: 15 * S });
    expect(ring().fill).toBe("#FFD194");
    await press("execution-duration-zone"); // reprise
    expect(screen.getByTestId("execution-duration-countdown")).toHaveTextContent("00:45");
    await at(20);
    await press("execution-duration-zone"); // seconde retenue
    await at(25);
    await press("execution-duration-zone"); // reprise : effort cumulé 15 s
    expect(screen.getByTestId("execution-timer")).toHaveTextContent("00:15 / 00:40");
    await at(49);
    expect(service.project()?.phase).toBe("ACTIVITY");
    // Objectif atteint à 50 s (10 s de retenue) : repos tout seul, fond du repos, appui sans effet.
    await at(50);
    expect(service.project()?.phase).toBe("WINDOW_REST");
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Repos");
    expect(ring().fill).toBe("#FFEBD1");
    expect(screen.queryByTestId("execution-duration-zone")).toBeNull();
    expect(screen.queryByTestId("execution-duration-mention")).toBeNull();
    // Les retenues ne font pas dériver la durée totale : la fenêtre 2 commence à 60 s.
    await at(59);
    expect(service.project()?.format?.emom?.window).toBe(1);
    await at(60);
    expect(service.project()?.format?.emom?.window).toBe(2);
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Mouvement D");
    expect(screen.getByTestId("execution-timer")).toHaveTextContent("00:00 / 00:40");
    expect(ring().inner).toBeNull();
    // Fin de l'EMOM à 120 s, à l'heure.
    await at(120);
    expect(service.project()?.format).toBeNull();
  });

  it("la zone du centre est la même que celle du For time (composant partagé, pas de copie)", async () => {
    await setup();
    // Un seul Pressable « execution-duration-zone » dans l'écran : celui du For time, ouvert à l'EMOM en durée.
    expect(screen.getAllByTestId("execution-duration-zone")).toHaveLength(1);
  });
});
