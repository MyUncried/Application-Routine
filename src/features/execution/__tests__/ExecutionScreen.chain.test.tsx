import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft, createExerciseDraft } from "@/domain/sessions/SessionDraft";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteExecutionRepository } from "@/infrastructure/database/repositories/SqliteExecutionRepository";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { ExecutionSignalAdapter } from "@/infrastructure/haptics/ExecutionSignalAdapter";
import { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { SessionService } from "@/features/sessions/SessionService";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

import { executionParams, nextInChain, parseChain, parseOrigin, type ExecutionChain } from "../executionChain";
import { CHAIN_AUTO_NEXT_MS, ExecutionScreen } from "../ExecutionScreen";
import { ExecutionService } from "../ExecutionService";
import { ExecutionServiceContext } from "../ExecutionServiceContext";
import type { PlanningService } from "@/features/planning/PlanningService";
import { PlanningServiceContext } from "@/features/planning/PlanningServiceContext";

/**
 * D-534 — enchaînement des séances d'une routine : orchestration au-dessus du moteur (inchangé). Une séance : comportement
 * d'origine ; deux séances : la fin normale de la première libère l'Exécution puis ouvre la seconde au rang 2, la fin de
 * la seconde ramène au calendrier ; voile de transition au rang 2 seulement ; arrêt volontaire et reprise : pas de chaîne.
 * Horloge et ordonnanceur du moteur simulés ; aucun rendu visuel contrôlé.
 */

const calls: string[] = [];
const mockBack = jest.fn(() => calls.push("back"));
const mockDismissTo = jest.fn((target: { readonly pathname: string; readonly params: { readonly day: string } }) => calls.push(`dismissTo ${target.pathname} ${target.params.day}`));
const mockNavigate = jest.fn();
const mockReplace = jest.fn((target: unknown) => calls.push(`replace ${JSON.stringify(target)}`));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, canGoBack: () => true, replace: mockReplace, push: jest.fn(), navigate: mockNavigate, dismissTo: mockDismissTo }),
  useFocusEffect: (effect: () => void | (() => void)) => jest.requireActual<typeof import("react")>("react").useEffect(effect, [effect]),
}));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" } }));
jest.mock("expo-crypto", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  randomUUID: () => (require("node:crypto") as typeof import("node:crypto")).randomUUID(),
}));

const S = 1000;
const T0 = Date.UTC(2026, 10, 19, 8, 0, 0);

async function setup(finalPhaseSeconds = 0) {
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const sessionService = new SessionService(new SqliteSessionRepository(database), new SqliteCategoryRepository(database));
  const create = async (name: string) => {
    const created = await sessionService.createSession(
      withLocalMovements({
        ...createEmptyDraft(),
        name,
        initialCountdownSeconds: 3,
        finalPhaseSeconds,
        exercises: [{ ...createExerciseDraft(`${name}-a`), name: `${name} A`, structuralPosition: "BEFORE_TOUR", executionParameters: durationParameters(5, 1, 0) }],
      }),
    );
    if (!created.ok) throw new Error(`seed failed: ${JSON.stringify(created.violations)}`);
    return created.value.id;
  };
  const first = await create("Alpha");
  const second = await create("Bravo");

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
  let executions = 0;
  const service = new ExecutionService({
    repository: new SqliteExecutionRepository(database),
    clock,
    scheduler,
    newId: () => `exec-${++executions}`,
    loadSession: (sessionId) => sessionService.getSessionForConsultation(sessionId),
  });
  const release = service.release.bind(service);
  jest.spyOn(service, "release").mockImplementation(() => {
    calls.push("release");
    release();
  });
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

  /** Avance l'horloge du moteur de `seconds` en déclenchant les réveils dus. */
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

  const show = (sessionId: string | null, chain: ExecutionChain | null) =>
    render(<ExecutionScreen key={`${sessionId}|${chain?.rank ?? 0}`} sessionId={sessionId} chain={chain} />, { wrapper: Wrapper });
  /** D-553 : écran rendu avec une planification (rattachement automatique). */
  const showPlanned = (sessionId: string, planning: Pick<PlanningService, "autoAttachment">, origin: { routineId: string; occurrenceKey: string; rank?: number } | null = null) =>
    render(
      <PlanningServiceContext.Provider value={planning as PlanningService}>
        <ExecutionScreen sessionId={sessionId} chain={null} origin={origin} />
      </PlanningServiceContext.Provider>,
      { wrapper: Wrapper },
    );
  return { service, advance, show, showPlanned, first, second, database };
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
    await new Promise((resolve) => setImmediate(resolve));
  });
}

async function runToEnd(advance: (seconds: number) => Promise<void>) {
  await press(((await screen.findByTestId("execution-start")) && "execution-start") as string);
  await advance(20);
  expect(screen.getByTestId("execution-end-status")).toBeTruthy();
}

beforeEach(() => {
  calls.length = 0;
  mockBack.mockClear();
  mockReplace.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("executionChain (D-534)", () => {
  it("paramètres de route : une séance seule garde le contrat PRE-10 ; plusieurs séances ajoutent la chaîne et le rang", () => {
    expect(executionParams(["a"])).toEqual({ sessionId: "a" });
    expect(executionParams(["a", "b", "c"])).toEqual({ sessionId: "a", chain: "a,b,c", rank: "1" });
    expect(executionParams(["a", "b", "c"], 3)).toEqual({ sessionId: "c", chain: "a,b,c", rank: "3" });
  });

  it("lecture de la chaîne : absente, incohérente ou d'une seule séance → séance isolée", () => {
    expect(parseChain("b", "a,b", "2")).toEqual({ sessionIds: ["a", "b"], rank: 2 });
    expect(parseChain("a", undefined, undefined)).toBeNull();
    expect(parseChain(null, "a,b", "1")).toBeNull();
    expect(parseChain("a", "a", "1")).toBeNull();
    expect(parseChain("b", "a,b", "1")).toBeNull();
    expect(parseChain("a", "a,b", "3")).toBeNull();
  });

  it("suite : rang + 1, rien après la dernière", () => {
    expect(nextInChain({ sessionIds: ["a", "b", "c"], rank: 1 })).toEqual({ sessionId: "b", chain: "a,b,c", rank: "2" });
    expect(nextInChain({ sessionIds: ["a", "b"], rank: 2 })).toBeNull();
  });
});

describe("Exécution — enchaînement des séances d'une routine (D-534)", () => {
  // Recette du 21/11/2026 (Hermann : « Après l'exécution d'une séance lancée depuis le catalogue, l'application ouvre l'Agenda à
  // la date de l'exécution ») : séance seule, sans chaîne ni occurrence.
  it("une seule séance : aucun voile ; à la fin, l'Agenda à la date de l'exécution", async () => {
    const { advance, show, first } = await setup();
    const view = show(first, null);
    expect(await screen.findByTestId("execution-start")).toBeTruthy();
    expect(screen.queryByTestId("execution-chain-veil")).toBeNull();
    await runToEnd(advance);
    await press("execution-close");
    expect(calls).toHaveLength(2);
    expect(calls[0]).toBe("release");
    expect(calls[1]).toMatch(/^dismissTo \/calendar \d{4}-\d{2}-\d{2}$/);
    expect(mockReplace).not.toHaveBeenCalled();
    view.unmount();
  });

  it("deux séances : la fin de la première libère l'Exécution puis ouvre la seconde au rang 2 ; la fin de la seconde ramène au calendrier", async () => {
    const { service, advance, show, first, second } = await setup();
    const chain = parseChain(first, `${first},${second}`, "1")!;
    const firstView = show(first, chain);
    expect(await screen.findByTestId("execution-start")).toBeTruthy();
    // Rang 1 : sans voile, comme aujourd'hui.
    expect(screen.queryByTestId("execution-chain-veil")).toBeNull();
    // D-577 (27/11/2026) : première séance du parcours — écran « Avant la séance », bouton « …le parcours », avec Retour.
    // [Recette du 19/11 au soir (s19-voile) : liste « Séance 1 · Alpha », « Séance 2 · Bravo » sur l'écran de départ — remplacé.]
    expect(screen.getByTestId("before-session-FULL")).toBeTruthy();
    expect(screen.getByTestId("before-session-start-label").props.children).toBe("Appuyer pour démarrer le parcours");
    expect(screen.getByTestId("execution-back")).toBeTruthy();
    await runToEnd(advance);
    // Recette du 20/11/2026 (constat F) : pas de bouton sur « Séance terminée » d'une séance intermédiaire.
    expect(screen.queryByTestId("execution-close")).toBeNull();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, CHAIN_AUTO_NEXT_MS + 100));
    });
    // release() précède la navigation : la séance suivante peut démarrer (pas d'ExecutionBlockedError).
    expect(calls).toEqual(["release", `replace ${JSON.stringify({ pathname: "/execution", params: { sessionId: second, chain: `${first},${second}`, rank: "2" } })}`]);
    expect(mockBack).not.toHaveBeenCalled();
    expect(service.current()).toBeNull();
    firstView.unmount();

    calls.length = 0;
    mockReplace.mockClear();
    const secondView = show(second, parseChain(second, `${first},${second}`, "2"));
    // D-577 point 4 : version « séances suivantes » (un seul cadre, sans douleur), libellé au rang calculé.
    // [D-534 : voile de transition « Appuyer pour / démarrer la 2è séance / du parcours », toucher n'importe où — remplacé.]
    expect(await screen.findByTestId("before-session-NEXT")).toBeTruthy();
    expect(screen.getByTestId("execution-start").props.accessibilityLabel).toBe("Appuyer pour démarrer la 2ème séance");
    expect(screen.queryByTestId("before-session-pain-scale")).toBeNull();
    await press("execution-start");
    expect(screen.queryByTestId("before-session")).toBeNull();
    expect(service.current()?.plan.sessionName).toBe("Bravo");
    expect(screen.queryByTestId("execution-blocked")).toBeNull();
    await advance(20);
    expect(screen.getByTestId("execution-end-status")).toBeTruthy();
    await press("execution-close");
    expect(calls).toEqual(["release", "back"]);
    expect(mockReplace).not.toHaveBeenCalled();
    secondView.unmount();
  });

  it("séance intermédiaire : pas de « Fin de séance », « Séance terminée » puis la suivante s'ouvre seule (recette du 19/11 au soir, constat F)", async () => {
    const { advance, show, first, second } = await setup(5);
    const view = show(first, parseChain(first, `${first},${second}`, "1"));
    await press(((await screen.findByTestId("execution-start")) && "execution-start") as string);
    // Compte à rebours 3 s, exercice 5 s : la phase finale de 5 s est passée aussitôt.
    await advance(9);
    expect(screen.getByTestId("execution-end-status").props.children).toBe("Séance terminée");
    expect(screen.queryByTestId("execution-close")).toBeNull();
    expect(calls).toEqual([]);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, CHAIN_AUTO_NEXT_MS + 100));
    });
    expect(calls).toEqual(["release", `replace ${JSON.stringify({ pathname: "/execution", params: { sessionId: second, chain: `${first},${second}`, rank: "2" } })}`]);
    view.unmount();
  });

  it("dernière séance du parcours : fin habituelle, avec la « Fin de séance »", async () => {
    const { advance, show, first, second } = await setup(5);
    const view = show(second, parseChain(second, `${first},${second}`, "2"));
    expect(await screen.findByTestId("before-session-NEXT")).toBeTruthy();
    await press("execution-start");
    await advance(9);
    expect(screen.queryByTestId("execution-end-status")).toBeNull();
    await advance(6);
    expect(screen.getByTestId("execution-end-status")).toBeTruthy();
    view.unmount();
  });

  it("arrêt volontaire d'une séance de la chaîne : la chaîne s'arrête, retour au calendrier (À CLARIFIER : suite à proposer)", async () => {
    const { advance, show, first, second } = await setup();
    const view = show(first, parseChain(first, `${first},${second}`, "1"));
    await press(((await screen.findByTestId("execution-start")) && "execution-start") as string);
    await advance(4);
    await press("execution-pause");
    await press("execution-stop");
    expect(screen.getByTestId("execution-end-status").props.children).toBe("Séance interrompue");
    await press("execution-close");
    expect(calls).toEqual(["release", "back"]);
    expect(mockReplace).not.toHaveBeenCalled();
    view.unmount();
  });

  it("reprise après interruption (route sans paramètre) : seule la séance interrompue est reprise, puis retour au calendrier", async () => {
    const { service, advance, show, first, second } = await setup();
    const view = show(first, parseChain(first, `${first},${second}`, "1"));
    await press(((await screen.findByTestId("execution-start")) && "execution-start") as string);
    view.unmount();
    // ExecutionRecoveryGate rouvre `/execution` sans paramètre : aucune chaîne.
    expect(parseChain(null, undefined, undefined)).toBeNull();
    const resumed = show(null, null);
    expect(service.current()?.plan.sessionName).toBe("Alpha");
    await advance(20);
    await press("execution-close");
    expect(calls).toEqual(["release", "back"]);
    expect(mockReplace).not.toHaveBeenCalled();
    resumed.unmount();
  });
});

describe("Exécution — rattachement d'une séance lancée hors Agenda (D-553, § 4)", () => {
  it("sans occurrence ni chaîne : rattachée au créneau éligible ; sinon hors planification ; le moteur est inchangé", async () => {
    const { service, showPlanned, first } = await setup();
    const start = jest.spyOn(service, "start");
    const autoAttachment = jest.fn(async () => ({ routineId: "r1", occurrenceKey: "2026-11-19T08:00", rank: 1 }));
    const view = showPlanned(first, { autoAttachment });
    await press(((await screen.findByTestId("execution-start")) && "execution-start") as string);
    expect(autoAttachment).toHaveBeenCalledWith(first, new Date(T0));
    expect(start.mock.calls[0]![1]).toEqual({ routineId: "r1", occurrenceKey: "2026-11-19T08:00", rank: 1 });
    view.unmount();
  });

  it("aucun créneau éligible : Exécution sans lien (hors planification)", async () => {
    const { service, showPlanned, first } = await setup();
    const start = jest.spyOn(service, "start");
    const view = showPlanned(first, { autoAttachment: jest.fn(async () => null) });
    await press(((await screen.findByTestId("execution-start")) && "execution-start") as string);
    expect(start.mock.calls[0]![1]).toBeUndefined();
    view.unmount();
  });

  it("lancée depuis l'Agenda : lien explicite conservé, rang propre d'un « Rattraper » ; pas de rattachement automatique", async () => {
    const { service, showPlanned, first } = await setup();
    const start = jest.spyOn(service, "start");
    const autoAttachment = jest.fn(async () => null);
    const view = showPlanned(first, { autoAttachment }, { routineId: "r9", occurrenceKey: "2026-11-19T14:00", rank: 2 });
    await press(((await screen.findByTestId("execution-start")) && "execution-start") as string);
    expect(autoAttachment).not.toHaveBeenCalled();
    expect(start.mock.calls[0]![1]).toEqual({ routineId: "r9", occurrenceKey: "2026-11-19T14:00", rank: 2 });
    view.unmount();
  });

  it("paramètres de route : rang d'occurrence d'un « Rattraper » transmis et relu", () => {
    expect(executionParams(["b"], 1, { routineId: "r", occurrenceKey: "k", rank: 2 })).toEqual({ sessionId: "b", routineId: "r", occurrence: "k", occurrenceRank: "2" });
    expect(parseOrigin("r", "k", "2")).toEqual({ routineId: "r", occurrenceKey: "k", rank: 2 });
    expect(parseOrigin("r", "k")).toEqual({ routineId: "r", occurrenceKey: "k" });
  });
});
