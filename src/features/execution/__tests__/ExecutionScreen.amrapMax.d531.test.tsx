import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { allFailureParameters, durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
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
 * D-531 / RM-272 (Hermann, 19/11/2026) — AMRAP à un seul mouvement en Max, à l'écran : « Suivant » à chaque échec (ni « + Tour » ni
 * compteur de tours), saisie de la série au clavier numérique pendant que le chronomètre du bloc continue, score cumulé en direct en
 * bas à droite (CE-UI-14), total = score.
 */

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() }),
  useFocusEffect: (effect: () => void | (() => void)) => jest.requireActual<typeof import("react")>("react").useEffect(effect, [effect]),
}));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" } }));

const S = 1000;
const T0 = Date.UTC(2026, 10, 19, 9, 0, 0);

async function setup() {
  jest.spyOn(AppState, "addEventListener").mockImplementation(((_type: string, _listener: (state: AppStateStatus) => void) => ({ remove: () => undefined })) as never);
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const session = structuredSession(
    {
      elements: [
        { kind: "EXERCISE", exercise: exerciseActivity("E", allFailureParameters(1, 0), { format: { key: "AMRAP", settings: { durationSeconds: 120, incrementPerRound: 0 } } }) },
        { kind: "EXERCISE", exercise: exerciseActivity("B", durationParameters(30, 1, 0)) },
      ],
      stopPoints: [],
    },
    { name: "AMRAP Max" },
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
  const service = new ExecutionService({ repository, clock, scheduler, newId: () => "exec-max", loadSession: async () => session });
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

async function type(testID: string, text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(testID), text);
    await new Promise((resolve) => setImmediate(resolve));
  });
}

describe("D-531 — AMRAP à un seul mouvement en Max, à l'écran", () => {
  async function started() {
    const context = await setup();
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    await press("execution-start");
    await act(async () => {
      fireEvent(screen.getByTestId("execution-ring-area"), "layout", { nativeEvent: { layout: { width: 398, height: 340, x: 0, y: 0 } } });
    });
    return context;
  }

  function blockResult(changes: Awaited<ReturnType<SqliteExecutionRepository["listResults"]>>): AmrapResult | undefined {
    return changes.flatMap((change) => (change.type === "SCOPE" && (change.result as { format?: string }).format === "AMRAP" ? [change.result as AmrapResult] : []))[0];
  }

  it("« Suivant » sans « + Tour » ni tour ; saisie au clavier numérique ; score cumulé en bas à droite ; total = score", async () => {
    const { at, repository, service } = await started();
    expect(screen.getByTestId("execution-timer")).toHaveTextContent("02:00");
    expect(screen.queryByTestId("execution-plus-tour")).toBeNull();
    // Compteur Tour sans valeur (libellé et « – » en gris, recette du 13/11/2026).
    expect(screen.getByTestId("execution-tour")).not.toHaveTextContent(/\d/);
    expect(screen.getByTestId("execution-amrap-score")).toHaveTextContent("0");
    await at(20);
    await press("execution-for-time-next");
    // Saisie de la série 1 ; le chronomètre du bloc continue derrière.
    expect(screen.getByTestId("execution-max-entry-name")).toHaveTextContent("Mouvement E · Série 1");
    expect(screen.getByTestId("execution-max-entry-input").props.keyboardType).toBe("number-pad");
    expect(screen.getByTestId("execution-max-entry-validate").props.accessibilityState).toMatchObject({ disabled: true });
    await at(25);
    expect(service.project()?.timer).toMatchObject({ kind: "COUNTDOWN", remainingMs: 95 * S });
    await type("execution-max-entry-input", "12");
    await press("execution-max-entry-validate");
    expect(screen.queryByTestId("execution-max-entry")).toBeNull();
    expect(screen.getByTestId("execution-amrap-score")).toHaveTextContent("12");
    await at(50);
    await press("execution-for-time-next");
    await type("execution-max-entry-input", "9");
    await press("execution-max-entry-validate");
    expect(screen.getByTestId("execution-amrap-score")).toHaveTextContent("21");
    // Échéance : partiel de la série en cours (« Fin du bloc », règle existante), puis l'exercice suivant.
    await at(120);
    expect(screen.getByTestId("execution-closure-title")).toHaveTextContent("Fin du bloc");
    await press("execution-closure-value-4");
    await press("execution-closure-validate");
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Mouvement B");
    const result = blockResult(await repository.listResults("exec-max"));
    expect(result?.maxSeries?.map((entry) => entry.repetitions)).toEqual([12, 9]);
    expect(result).toMatchObject({ partialRepetitions: 4 });
    // Répétitions de chaque série reprises par la synthèse (valeurs saisies).
    expect([...service.partialRepetitions().values()].sort((a, b) => a - b)).toEqual([4, 9, 12]);
  });

  it("croix de la saisie : la série est redemandée à la fin du bloc", async () => {
    const { at, repository } = await started();
    await at(20);
    await press("execution-for-time-next");
    await press("execution-max-entry-cancel");
    expect(screen.queryByTestId("execution-max-entry")).toBeNull();
    expect(screen.getByTestId("execution-amrap-score")).toHaveTextContent("0");
    await at(120);
    await press("execution-closure-value-3");
    await press("execution-closure-validate");
    expect(screen.getByTestId("execution-closure-title")).toHaveTextContent("Fin du bloc");
    await press("execution-closure-value-8");
    await press("execution-closure-validate");
    expect(blockResult(await repository.listResults("exec-max"))?.maxSeries?.map((entry) => entry.repetitions)).toEqual([8]);
  });
});
