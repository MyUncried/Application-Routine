import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { exerciseActivity, structuredSession } from "@/domain/execution/testing/simulation";
import type { DeathByResult } from "@/domain/execution/policies/deathBy";
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
 * PRE-11 (T4) — Death by à l'écran : écran de l'EMOM (grand chrono = temps restant de la fenêtre du rang, repos révélé, barre Arrêt /
 * Pause désactivée / Suivant), fenêtre manquée : écran figé et feuille « Fin du Death by » (coche seule), puis l'élément suivant ;
 * Arrêt : feuille « Arrêt du Death by » (arbitrages de Hermann du 18/11/2026, spec PRE-11 §5 point 30).
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
        { kind: "EXERCISE", exercise: exerciseActivity("E", repetitionParameters(3, 1, 0), { format: { key: "DEATH_BY", settings: { intervalSeconds: 60, incrementPerRound: 2 } } }) },
        { kind: "EXERCISE", exercise: exerciseActivity("B", durationParameters(30, 1, 0)) },
      ],
      stopPoints: [],
    },
    { name: "Death by PRE-11" },
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
  const service = new ExecutionService({ repository, clock, scheduler, newId: () => "exec-deathby", loadSession: async () => session });
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

describe("PRE-11 T4 — Death by à l'écran", () => {
  async function started() {
    const context = await setup();
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    await press("execution-start");
    return context;
  }

  function deathByResults(changes: Awaited<ReturnType<SqliteExecutionRepository["listResults"]>>): DeathByResult[] {
    return changes.flatMap((change) => (change.type === "SCOPE" && (change.result as { format?: string }).format === "DEATH_BY" ? [change.result as DeathByResult] : []));
  }

  it("rangs, repos, fenêtre manquée : feuille « Fin du Death by », puis exercice suivant", async () => {
    const { at, repository, service } = await started();
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Mouvement E");
    expect(screen.getByTestId("execution-timer")).toHaveTextContent("01:00");
    // Barre de l'EMOM : Arrêt, Pause désactivée, Suivant (72).
    expect(screen.getByTestId("execution-stop")).toBeTruthy();
    expect(screen.getByTestId("execution-pause").props.accessibilityState).toMatchObject({ disabled: true });
    await at(20);
    expect(service.project()?.timer).toEqual({ kind: "COUNTDOWN", remainingMs: 40 * S, totalMs: 60 * S, elapsedMs: 20 * S });
    await press("execution-emom-next"); // rang 1 tenu : repos révélé, la fenêtre continue
    expect(screen.getByTestId("execution-emom-rest")).toHaveTextContent("Repos");
    expect(screen.getByTestId("execution-emom-next").props.accessibilityState).toMatchObject({ disabled: true });
    await at(60); // rang 2 : 5 répétitions
    expect(screen.queryByTestId("execution-emom-rest")).toBeNull();
    expect(service.project()?.seriesTarget).toEqual({ kind: "NUMBER", value: 5 });
    await at(120); // rang 2 manqué
    expect(screen.getByTestId("execution-closure-title")).toHaveTextContent("Fin du Death by");
    expect(screen.getByTestId("execution-closure-name")).toHaveTextContent("Mouvement E");
    expect(screen.getByTestId("execution-closure-target")).toHaveTextContent("Objectif5 répétitions");
    await press("execution-closure-value-4");
    await press("execution-closure-validate");
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Mouvement B");
    expect(service.project()?.format).toBeNull();
    expect(deathByResults(await repository.listResults("exec-deathby"))[0]).toMatchObject({
      acquiredRanks: 1,
      rankReached: 2,
      reason: "WINDOW_MISSED",
      partialRepetitions: 4,
      completion: "INCOMPLETE",
    });
  });

  it("Arrêt pendant un rang : feuille « Arrêt du Death by », répétitions saisies, séance arrêtée", async () => {
    const { at, repository, service } = await started();
    await at(15);
    await press("execution-stop");
    expect(screen.getByTestId("execution-partial-title")).toHaveTextContent("Arrêt du Death by");
    await press("execution-partial-value-2");
    await press("execution-partial-validate");
    expect(service.project()?.status).toBe("FINISHED");
    expect(deathByResults(await repository.listResults("exec-deathby"))[0]).toMatchObject({ acquiredRanks: 0, rankReached: 1, reason: "ABANDONED", partialRepetitions: 2 });
  });
});
