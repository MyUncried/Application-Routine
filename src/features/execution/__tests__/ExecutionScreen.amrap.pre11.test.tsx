import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { exerciseActivity, structuredSession } from "@/domain/execution/testing/simulation";
import type { AmrapResult } from "@/domain/execution/policies/amrap";
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
 * PRE-11 (T3) — AMRAP à l'écran : grand chrono = temps restant du bloc, barre du For time (Arrêt, Pause désactivée, « + Tour »),
 * tour en cours au compteur, Clôture « Fin du bloc » à l'échéance (partiel de l'exercice en cours), Arrêt « Arrêt de l'AMRAP »
 * (arbitrages de Hermann du 18/11/2026, spec PRE-11 §5 point 30).
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
        { kind: "EXERCISE", exercise: exerciseActivity("E", repetitionParameters(10, 1, 0), { format: { key: "AMRAP", settings: { durationSeconds: 120, incrementPerRound: 0 } } }) },
        { kind: "EXERCISE", exercise: exerciseActivity("B", durationParameters(30, 1, 0)) },
      ],
      stopPoints: [],
    },
    { name: "AMRAP PRE-11" },
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
  const service = new ExecutionService({ repository, clock, scheduler, newId: () => "exec-amrap", loadSession: async () => session });
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

describe("PRE-11 T3 — AMRAP à l'écran", () => {
  async function started() {
    const context = await setup();
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    await press("execution-start");
    return context;
  }

  function blockResult(changes: Awaited<ReturnType<SqliteExecutionRepository["listResults"]>>): AmrapResult | undefined {
    return changes.flatMap((change) => (change.type === "SCOPE" && (change.result as { format?: string }).format === "AMRAP" ? [change.result as AmrapResult] : []))[0];
  }

  it("bloc : chrono du bloc, « + Tour », tour au compteur ; échéance : écran figé, « Fin du bloc », partiel, puis exercice suivant", async () => {
    const { at, repository, service } = await started();
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Mouvement E");
    expect(screen.getByTestId("execution-timer")).toHaveTextContent("02:00");
    expect(screen.getByTestId("execution-stop")).toBeTruthy();
    expect(screen.getByTestId("execution-pause").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("execution-tour")).toHaveTextContent("1");
    await at(30);
    expect(service.project()?.timer).toEqual({ kind: "COUNTDOWN", remainingMs: 90 * S, totalMs: 120 * S, elapsedMs: 30 * S });
    // D-529 / CE-UI-14 : tours acquis dans le bouton (« +Tour · n »).
    expect(screen.getByTestId("execution-plus-tour-label")).toHaveTextContent("Tour · 0");
    await press("execution-plus-tour");
    expect(screen.getByTestId("execution-plus-tour-label")).toHaveTextContent("Tour · 1");
    expect(screen.getByTestId("execution-tour")).toHaveTextContent("2");
    expect(service.project()?.format?.amrap).toMatchObject({ round: 2, completedRounds: 1 });
    await at(120);
    expect(screen.getByTestId("execution-closure-title")).toHaveTextContent("Fin du bloc");
    expect(screen.getByTestId("execution-closure-name")).toHaveTextContent("Mouvement E");
    expect(screen.getByTestId("execution-closure-target")).toHaveTextContent("Objectif10 répétitions");
    await press("execution-closure-value-6");
    await press("execution-closure-validate");
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Mouvement B");
    expect(blockResult(await repository.listResults("exec-amrap"))).toMatchObject({ completedRounds: 1, partialRepetitions: 6, stopped: false });
  });

  it("Arrêt pendant le bloc : feuille « Arrêt de l'AMRAP », répétitions saisies, séance arrêtée", async () => {
    const { at, repository, service } = await started();
    await at(15);
    await press("execution-stop");
    expect(screen.getByTestId("execution-partial-title")).toHaveTextContent("Arrêt de l’AMRAP");
    await press("execution-partial-value-4");
    await press("execution-partial-validate");
    expect(service.project()?.status).toBe("FINISHED");
    expect(blockResult(await repository.listResults("exec-amrap"))).toMatchObject({ completedRounds: 0, partialRepetitions: 4, stopped: true });
  });
});
