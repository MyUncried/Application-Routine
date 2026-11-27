import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { StepResult } from "@/domain/execution/kernel";
import { occurrenceResults, seriesLines } from "@/domain/execution/results";
import { createEmptyDraft, createExerciseDraft } from "@/domain/sessions/SessionDraft";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { PlanningService } from "@/features/planning/PlanningService";
import { ProgramService } from "@/features/programs/ProgramService";
import { ProgramServiceContext } from "@/features/programs/ProgramServiceContext";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteExecutionFeedbackRepository } from "@/infrastructure/database/repositories/SqliteExecutionFeedbackRepository";
import { SqliteExecutionRepository } from "@/infrastructure/database/repositories/SqliteExecutionRepository";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { SqliteProgramRepository } from "@/infrastructure/database/repositories/SqliteProgramRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { ExecutionSignalAdapter } from "@/infrastructure/haptics/ExecutionSignalAdapter";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

import { ExecutionScreen } from "../ExecutionScreen";
import { ExecutionService } from "../ExecutionService";
import { ExecutionServiceContext } from "../ExecutionServiceContext";
import { setStartScreenBackendForTests } from "../startScreenStore";

/**
 * Arbitrage de Hermann du 28/11/2026 (option A ajustée) — répétitions faites écrites à Enregistrer dans le résultat de chaque série
 * affichée (`StepResult.repetitionsDone`), une seule valeur par série, de bout en bout sur une base SQLite réelle : relecture brute du
 * résultat, cible figée si le programme change, correction d'une série, sortie sans Enregistrer, exercices terminés inchangés,
 * séances antérieures lues comme avant.
 */
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn() }),
  useFocusEffect: (effect: () => void | (() => void)) => jest.requireActual<typeof import("react")>("react").useEffect(effect, [effect]),
}));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" } }));
jest.mock("expo-crypto", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  randomUUID: () => (require("node:crypto") as typeof import("node:crypto")).randomUUID(),
}));

const S = 1000;
const T0 = Date.UTC(2026, 10, 28, 8, 0, 0);

async function setup() {
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const sessionService = new SessionService(new SqliteSessionRepository(database), new SqliteCategoryRepository(database));
  const created = await sessionService.createSession(
    withLocalMovements({
      ...createEmptyDraft(),
      name: "Jambes",
      initialCountdownSeconds: 3,
      finalPhaseSeconds: 0,
      exercises: [{ ...createExerciseDraft("squat"), name: "Squat", structuralPosition: "BEFORE_TOUR", executionParameters: repetitionParameters(12, 2, 0) }],
    }),
  );
  if (!created.ok) throw new Error(`seed failed: ${JSON.stringify(created.violations)}`);
  const sessionId = created.value.id;
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
  const executionRepository = new SqliteExecutionRepository(database);
  const service = new ExecutionService({
    repository: executionRepository,
    clock,
    scheduler,
    newId: () => "exec-1",
    loadSession: (id) => sessionService.getSessionForConsultation(id),
  });
  const programService = new ProgramService({
    repository: new SqliteProgramRepository(database),
    feedback: new SqliteExecutionFeedbackRepository(database),
    planning: {} as PlanningService,
    newId: () => "x",
    now: () => new Date(clock.ms),
  });
  const profileService = new ProfileService(new SqliteProfileRepository(database));
  const value = { service, signals: new ExecutionSignalAdapter(), screenAwake: { keepAwake: () => undefined } };
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestSafeAreaProvider>
        <ProfileServiceContext.Provider value={profileService}>
          <ProgramServiceContext.Provider value={programService}>
            <ExecutionServiceContext.Provider value={value}>{children}</ExecutionServiceContext.Provider>
          </ProgramServiceContext.Provider>
        </ProfileServiceContext.Provider>
      </TestSafeAreaProvider>
    );
  }
  async function advance(seconds: number) {
    const target = clock.ms + seconds * S;
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
  const show = () => render(<ExecutionScreen sessionId={sessionId} />, { wrapper: Wrapper });
  /** Résultats d'étape tels qu'ils sont stockés (relecture brute de `execution_results.payload_json`). */
  const rawSteps = async () =>
    (await database.getAllAsync<{ result_key: string; payload_json: string }>("SELECT result_key, payload_json FROM execution_results WHERE execution_id = 'exec-1' AND kind = 'STEP' ORDER BY rowid")).map(
      (row) => JSON.parse(row.payload_json) as StepResult,
    );
  return { database, service, advance, show, rawSteps, executionRepository };
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
    await new Promise((resolve) => setImmediate(resolve));
  });
}

/** Démarre, fait les deux séries (Suivant), atteint l'écran de fin. */
async function runSession(ctx: Awaited<ReturnType<typeof setup>>) {
  await press(((await screen.findByTestId("execution-start")) && "execution-start") as string);
  await ctx.advance(4);
  await press("execution-next-command");
  await ctx.advance(1);
  await press("execution-next-command");
  await ctx.advance(2);
  expect(screen.getByTestId("end-session-COMPLETED")).toBeTruthy();
}

describe("répétitions faites par série (arbitrage de Hermann du 28/11/2026)", () => {
  beforeEach(() => {
    const files = new Map<string, string>();
    setStartScreenBackendForTests({ read: () => files.get("f") ?? null, write: (content) => void files.set("f", content) });
  });
  afterEach(() => {
    setStartScreenBackendForTests();
    jest.restoreAllMocks();
  });

  it("Enregistrer écrit la valeur affichée de TOUTES les séries (cible par défaut, valeur corrigée) ; une seule valeur par série ; exercices terminés inchangés", async () => {
    const ctx = await setup();
    const view = ctx.show();
    await runSession(ctx);
    const cells = screen.getAllByTestId(/^end-session-reps-/);
    expect(cells.map((cell) => cell.props.value)).toEqual(["12", "12"]);
    const tally = screen.getByTestId("end-session-exercises").props.children as string;
    // Sortie sans Enregistrer (pas encore) : rien n'est écrit.
    expect((await ctx.rawSteps()).filter((step) => step.leafKind === "ACTIVITY").every((step) => step.repetitionsDone === undefined)).toBe(true);
    fireEvent.changeText(cells[1]!, "10");
    expect(screen.getByTestId("end-session-exercises").props.children).toBe(tally);
    await press("end-session-feeling-GOOD");
    await press("end-session-save");
    const activity = (await ctx.rawSteps()).filter((step) => step.leafKind === "ACTIVITY");
    expect(activity.map((step) => [step.series, step.repetitionsDone])).toEqual([
      [1, 12],
      [2, 10],
    ]);
    // Les autres champs du résultat sont intacts (état de fin, temps).
    expect(activity.every((step) => step.completion === "COMPLETED")).toBe(true);
    expect(await ctx.database.getFirstAsync("SELECT business_status FROM executions WHERE id = 'exec-1'")).toEqual({ business_status: "COMPLETED" });
    // Aucune table de corrections séparée.
    expect(await ctx.database.getFirstAsync("SELECT COUNT(*) AS count FROM sqlite_master WHERE name = 'execution_repetition_corrections'")).toEqual({ count: 0 });
    // Relecture : valeurs enregistrées, figées même si la cible du programme change ensuite (cible lue : 15).
    const stored = await ctx.executionRepository.listResults("exec-1");
    const occurrences = occurrenceResults(stored.flatMap((result) => (result.type === "STEP" ? [result.result as StepResult] : [])));
    const lines = seriesLines(occurrences[0]!, () => ({ mode: "REPETITIONS", target: { kind: "NUMBER", value: 15 } }), new Map());
    expect(lines.map((line) => line.done)).toEqual([12, 10]);
    view.unmount();
  });

  it("sortie sans Enregistrer : aucune écriture dans les résultats ; séance antérieure (sans champ) lue comme avant", async () => {
    const ctx = await setup();
    const view = ctx.show();
    await runSession(ctx);
    fireEvent.changeText(screen.getAllByTestId(/^end-session-reps-/)[0]!, "3");
    view.unmount();
    const activity = (await ctx.rawSteps()).filter((step) => step.leafKind === "ACTIVITY");
    expect(activity.every((step) => step.repetitionsDone === undefined)).toBe(true);
    const occurrences = occurrenceResults(activity);
    expect(seriesLines(occurrences[0]!, () => ({ mode: "REPETITIONS", target: { kind: "NUMBER", value: 12 } }), new Map()).map((line) => line.done)).toEqual([12, 12]);
  });
});

describe("série interrompue d'un format : la valeur déjà enregistrée est écrasée, sans second champ", () => {
  it("partialRepetitions et maxSeries[].repetitions réécrits ; résultat d'étape sans repetitionsDone", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    await database.runAsync(
      `INSERT INTO executions (id, origin, session_id, snapshot_json, snapshot_version, plan_version, engine_version, status, business_status, checkpoint_json, checkpoint_revision, started_at, last_saved_at, clock_wall_ms)
       VALUES ('exec-1', 'SESSION', NULL, '{}', 1, 1, 1, 'FINISHED', 'PARTIAL', '{}', 1, 't', 't', 0)`,
    );
    const insert = (key: string, kind: "STEP" | "SCOPE", payload: unknown) =>
      database.runAsync("INSERT INTO execution_results (execution_id, result_key, kind, payload_json, revision) VALUES ('exec-1', ?, ?, ?, 1)", [key, kind, JSON.stringify(payload)]);
    await insert("ft/a/s1", "STEP", { key: "ft/a/s1", completion: "INTERRUPTED" });
    await insert("scope:ft", "SCOPE", { format: "FOR_TIME", interruptedKey: "ft/a/s1", partialRepetitions: 7, elapsedMs: 1000 });
    await insert("scope:amrap", "SCOPE", { format: "AMRAP", maxSeries: [{ key: "am/r1", repetitions: 5 }, { key: "am/r2", repetitions: 6 }] });
    const repository = new SqliteExecutionFeedbackRepository(database);
    await repository.save(
      {
        executionId: "exec-1",
        feeling: "GOOD",
        comment: null,
        painAfter: null,
        seriesRepetitions: [
          { stepKey: "ft/a/s1", partialKey: "ft/a/s1", repetitions: 9 },
          { stepKey: "am/r2", partialKey: "am/r2", repetitions: 4 },
        ],
      },
      "t",
    );
    const read = async (key: string) => JSON.parse((await database.getFirstAsync<{ payload_json: string }>("SELECT payload_json FROM execution_results WHERE result_key = ?", [key]))!.payload_json) as Record<string, unknown>;
    expect(await read("scope:ft")).toEqual({ format: "FOR_TIME", interruptedKey: "ft/a/s1", partialRepetitions: 9, elapsedMs: 1000 });
    expect(await read("scope:amrap")).toEqual({ format: "AMRAP", maxSeries: [{ key: "am/r1", repetitions: 5 }, { key: "am/r2", repetitions: 4 }] });
    expect(await read("ft/a/s1")).toEqual({ key: "ft/a/s1", completion: "INTERRUPTED" });
    // Valeur invalide : toute la finalisation est annulée.
    await expect(repository.save({ executionId: "exec-1", feeling: "BAD", comment: null, painAfter: null, seriesRepetitions: [{ stepKey: "ft/a/s1", partialKey: "ft/a/s1", repetitions: -1 }] }, "u")).rejects.toThrow();
    expect((await read("scope:ft")).partialRepetitions).toBe(9);
    expect((await repository.get("exec-1"))?.feeling).toBe("GOOD");
  });
});
