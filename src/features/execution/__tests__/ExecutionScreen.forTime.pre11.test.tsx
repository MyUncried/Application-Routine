import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { exerciseActivity, structuredSession } from "@/domain/execution/testing/simulation";
import type { ForTimeResult } from "@/domain/execution/policies/forTime";
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

/**
 * PRE-11 (T1) — For time depuis l'écran d'Exécution : borne dans le coin du haut à gauche (décision de Hermann du
 * 13/11/2026), temps réalisé au grand chrono, Clôture « Vos résultats » (modèle « Résultat de série »), validation,
 * enchaînement automatique et résultat d'élément persisté.
 */

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() }),
  useFocusEffect: (effect: () => void | (() => void)) => jest.requireActual<typeof import("react")>("react").useEffect(effect, [effect]),
}));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(() => Promise.resolve()), ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" } }));

const S = 1000;
const T0 = Date.UTC(2026, 10, 13, 19, 0, 0);

async function setup() {
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const session = structuredSession(
    {
      elements: [
        { kind: "EXERCISE", exercise: exerciseActivity("F", repetitionParameters(21, 2, 0), { format: { key: "FOR_TIME", settings: { timeCapSeconds: 60 } } }) },
        { kind: "EXERCISE", exercise: exerciseActivity("B", durationParameters(30, 1, 0)) },
      ],
      stopPoints: [],
    },
    { name: "For time PRE-11" },
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
  const service = new ExecutionService({ repository, clock, scheduler, newId: () => "exec-ft", loadSession: async () => session });
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

describe("PRE-11 T1 — For time à l'écran", () => {
  it("borne en coin, temps réalisé, borne atteinte, Clôture avec les répétitions faites, puis exercice suivant", async () => {
    const { at, repository, service } = await setup();
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    await press("execution-start");
    // Largeur de la zone de l'anneau (mesurée à l'écran) : les cadres en coin s'affichent.
    await act(async () => {
      fireEvent(screen.getByTestId("execution-ring-area"), "layout", { nativeEvent: { layout: { width: 398, height: 340, x: 0, y: 0 } } });
    });
    // Borne dans le coin du haut à gauche ; l'objectif de la Série passe dans le cercle.
    expect(screen.getByTestId("execution-cap")).toBeTruthy();
    expect(screen.getByTestId("execution-objective").props.children).toBe("21 rép.");
    await at(20);
    // Grand chrono : temps réalisé de l'élément, anneau jusqu'à la borne.
    expect(service.project()?.timer).toEqual({ kind: "STOPWATCH", elapsedMs: 20 * S, nominalMs: 60 * S });
    await press("execution-next-command"); // S1 en 20 s
    await at(60); // borne pendant S2
    expect(screen.getByTestId("execution-closure")).toBeTruthy();
    expect(screen.getByTestId("execution-closure-time").props.children.join("")).toContain("Limite atteinte");
    await press("execution-closure-value-12");
    await press("execution-closure-validate");
    expect(screen.queryByTestId("execution-closure")).toBeNull();
    const results = await repository.listResults("exec-ft");
    const element = results.find((change) => change.type === "SCOPE" && (change.result as { format?: string }).format === "FOR_TIME");
    expect(element?.result as ForTimeResult).toMatchObject({ measuredMs: 60 * S, capReached: true, completedActivities: 1, partialRepetitions: 12 });
  });
});
