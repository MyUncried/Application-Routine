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

import { executionParams, nextInChain, parseChain, type ExecutionChain } from "../executionChain";
import { CHAIN_AUTO_NEXT_MS, ExecutionScreen } from "../ExecutionScreen";
import { ExecutionService } from "../ExecutionService";
import { ExecutionServiceContext } from "../ExecutionServiceContext";

/**
 * D-534 — enchaînement des séances d'une routine : orchestration au-dessus du moteur (inchangé). Une séance : comportement
 * d'origine ; deux séances : la fin normale de la première libère l'Exécution puis ouvre la seconde au rang 2, la fin de
 * la seconde ramène au calendrier ; voile de transition au rang 2 seulement ; arrêt volontaire et reprise : pas de chaîne.
 * Horloge et ordonnanceur du moteur simulés ; aucun rendu visuel contrôlé.
 */

const calls: string[] = [];
const mockBack = jest.fn(() => calls.push("back"));
const mockReplace = jest.fn((target: unknown) => calls.push(`replace ${JSON.stringify(target)}`));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, canGoBack: () => true, replace: mockReplace, push: jest.fn() }),
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
  return { service, advance, show, first, second, database };
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
  it("une seule séance : comportement inchangé, aucun voile, retour au calendrier", async () => {
    const { advance, show, first } = await setup();
    const view = show(first, null);
    expect(await screen.findByTestId("execution-start")).toBeTruthy();
    expect(screen.queryByTestId("execution-chain-veil")).toBeNull();
    await runToEnd(advance);
    await press("execution-close");
    expect(calls).toEqual(["release", "back"]);
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
    // Recette du 19/11 au soir (s19-voile) : le premier écran présente le parcours, avec Démarrer et Retour.
    expect((await screen.findByTestId("execution-route-1")).props.children).toEqual(["Séance 1", " · Alpha"]);
    expect(screen.getByTestId("execution-route-2").props.children).toEqual(["Séance 2", " · Bravo"]);
    expect(screen.getByTestId("execution-back")).toBeTruthy();
    await runToEnd(advance);
    await press("execution-close");
    // release() précède la navigation : la séance suivante peut démarrer (pas d'ExecutionBlockedError).
    expect(calls).toEqual(["release", `replace ${JSON.stringify({ pathname: "/execution", params: { sessionId: second, chain: `${first},${second}`, rank: "2" } })}`]);
    expect(mockBack).not.toHaveBeenCalled();
    expect(service.current()).toBeNull();
    firstView.unmount();

    calls.length = 0;
    mockReplace.mockClear();
    const secondView = show(second, parseChain(second, `${first},${second}`, "2"));
    // Voile de transition : texte exact, sur l'écran de démarrage de la séance suivante.
    const veil = await screen.findByTestId("execution-chain-veil");
    expect(veil.props.accessibilityLabel).toBe("Appuyer pour démarrer la 2è séance du parcours");
    expect(screen.getByText("démarrer la 2è séance")).toBeTruthy();
    expect(screen.getByTestId("execution-start")).toBeTruthy();
    // Un toucher sur le voile lance la séance et fait disparaître le voile.
    await press("execution-chain-veil");
    expect(screen.queryByTestId("execution-chain-veil")).toBeNull();
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
    expect(await screen.findByTestId("execution-chain-veil")).toBeTruthy();
    await press("execution-chain-veil");
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
