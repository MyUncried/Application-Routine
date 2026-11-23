import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
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

/**
 * Recette du 18/11/2026 (Hermann, amrap-1) — « Un exercice : Mettre "Série" en gris, nombre de séries "-" » ; « Synthèse d'exercice, ne pas
 * répéter le nom de l'exercice si c'est le même : Un exercice : Une ligne avec le nom de l'exercice puis par tour : Tour X + Nb de
 * répétitions + Durée ; plusieurs exercices : une ligne par Tour X puis par mouvement : Nb de répétitions + durée ».
 */

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() }),
  useFocusEffect: (effect: () => void | (() => void)) => jest.requireActual<typeof import("react")>("react").useEffect(effect, [effect]),
}));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" } }));

const S = 1000;
const T0 = Date.UTC(2026, 10, 19, 9, 0, 0);

function loopMember(id: string, parameters: ExecutionParameters) {
  return exerciseActivity(id, parameters, { format: { key: "AMRAP", settings: { incrementPerRound: 0 } } });
}

const singleSession = () =>
  structuredSession(
    {
      elements: [
        { kind: "EXERCISE", exercise: exerciseActivity("E", repetitionParameters(10, 1, 0), { format: { key: "AMRAP", settings: { durationSeconds: 120, incrementPerRound: 0 } } }) },
        { kind: "EXERCISE", exercise: exerciseActivity("B", durationParameters(30, 1, 0)) },
      ],
      stopPoints: [],
    },
    { name: "AMRAP un exercice" },
  );

const circuitSession = () =>
  structuredSession(
    {
      elements: [
        {
          kind: "CIRCUIT",
          circuit: {
            id: "c",
            repeatCount: 1,
            nature: "TOURS",
            format: { key: "AMRAP", settings: { blockSeconds: 120, restBetweenBlocksSeconds: 0 } },
            exercises: [loopMember("A", repetitionParameters(10, 1, 0)), loopMember("P", repetitionParameters(5, 1, 0))],
          },
        },
      ],
      stopPoints: [],
    },
    { name: "AMRAP deux exercices" },
  );

async function setup(session: ReturnType<typeof structuredSession>) {
  jest.spyOn(AppState, "addEventListener").mockImplementation(((_type: string, _listener: (state: AppStateStatus) => void) => ({ remove: () => undefined })) as never);
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
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
  const service = new ExecutionService({ repository, clock, scheduler, newId: () => "exec-amrap1", loadSession: async () => session });
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
  return { service, at };
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
    await new Promise((resolve) => setImmediate(resolve));
  });
}

const textOf = (testID: string) => {
  const parts: string[] = [];
  const walk = (node: unknown) => {
    if (node === null || node === undefined) return;
    if (typeof node === "string") return void parts.push(node);
    if (Array.isArray(node)) return void node.forEach(walk);
    walk((node as { children?: unknown }).children);
  };
  walk(screen.getByTestId(testID));
  return parts.join("");
};

describe("amrap-1 — AMRAP : Série grisée et synthèse par tour", () => {
  it("un exercice : Série en gris avec « – » pendant les tours ; le Tour reste affiché", async () => {
    const { at } = await setup(singleSession());
    await at(10);
    expect(screen.getByTestId("execution-series")).toHaveTextContent("–");
    expect(screen.getByTestId("execution-tour")).toHaveTextContent("1");
    await press("execution-plus-tour");
    expect(screen.getByTestId("execution-series")).toHaveTextContent("–");
    expect(screen.getByTestId("execution-tour")).toHaveTextContent("2");
  });

  it("plusieurs exercices : le compteur Série n'est pas modifié", async () => {
    const { at } = await setup(circuitSession());
    await at(10);
    expect(screen.getByTestId("execution-series")).not.toHaveTextContent("–");
  });

  it("synthèse, un exercice : le nom une fois, puis une ligne par tour « Tour X · rép. · durée »", async () => {
    const { at } = await setup(singleSession());
    await at(30);
    await press("execution-plus-tour");
    await at(60);
    await press("execution-plus-tour");
    await at(120);
    await press("execution-closure-value-6");
    await press("execution-closure-validate");
    await at(200);
    const block = screen.getAllByTestId(/^execution-end-amrap-/)[0]!;
    const text = textOf(block.props.testID as string);
    expect(text.match(/Mouvement E/g)).toHaveLength(1);
    expect(text).toContain("Tour 1 · 10 rép. · 00:30");
    expect(text).toContain("Tour 2 · 10 rép. · 00:30");
    expect(text).toContain("Tour 3 · 6 rép. · 01:00");
    // L'exercice libre qui suit garde sa ligne habituelle.
    expect(textOf("execution-end")).toMatch(/Mouvement B.*Terminée/);
  });

  it("synthèse, plusieurs exercices : une ligne « Tour X », puis une ligne par mouvement « rép. · durée »", async () => {
    const { at } = await setup(circuitSession());
    await at(20);
    await press("execution-for-time-next");
    await at(30);
    await press("execution-plus-tour");
    await at(120);
    await press("execution-closure-value-4");
    await press("execution-closure-validate");
    await at(130);
    const block = screen.getAllByTestId(/^execution-end-tour-/);
    expect(block).toHaveLength(2);
    const tour1 = textOf(block[0]!.props.testID as string);
    expect(tour1).toContain("Tour 1");
    expect(tour1).toContain("Mouvement A · 10 rép. · 00:20");
    expect(tour1).toContain("Mouvement P · 5 rép. · 00:10");
    const tour2 = textOf(block[1]!.props.testID as string);
    expect(tour2).toContain("Tour 2");
    expect(tour2).toContain("Mouvement A · 4 rép. · 01:30");
  });
});
