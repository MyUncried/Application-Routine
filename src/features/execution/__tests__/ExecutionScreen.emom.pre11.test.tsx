import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { durationParameters, repetitionParameters, uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { exerciseActivity, structuredSession } from "@/domain/execution/testing/simulation";
import type { EmomWindowResult } from "@/domain/execution/policies/emom";
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
 * PRE-11 (T2) — EMOM à l'écran : grand chrono = temps restant de la fenêtre, barre du For time (Arrêt, Pause désactivée, Suivant),
 * repos révélé, Clôture « Fin de l'EMOM » des fenêtres non saisies, Arrêt « Arrêt de l'EMOM » (arbitrages de Hermann du 18/11/2026,
 * spec PRE-11 §5 point 30). Recette du 18/11/2026 (point 31) : barre du Format dès le Compte à rebours, plus de bandeau, « Repos » en
 * titre, objectif conservé sur fond vert, écran figé pendant la Clôture, « série » au lieu de « fenêtre », une ligne par Série dans la
 * synthèse.
 */

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() }),
  useFocusEffect: (effect: () => void | (() => void)) => jest.requireActual<typeof import("react")>("react").useEffect(effect, [effect]),
}));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" } }));

const S = 1000;
const T0 = Date.UTC(2026, 10, 18, 19, 0, 0);


async function setup(options: { readonly initialCountdownSeconds?: number } = {}, parameters = repetitionParameters(10, 3, 0)) {
  jest.spyOn(AppState, "addEventListener").mockImplementation(((_type: string, _listener: (state: AppStateStatus) => void) => ({ remove: () => undefined })) as never);
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const session = structuredSession(
    {
      elements: [
        { kind: "EXERCISE", exercise: exerciseActivity("E", parameters, { format: { key: "EMOM", settings: { intervalSeconds: 60 } } }) },
        { kind: "EXERCISE", exercise: exerciseActivity("B", durationParameters(30, 1, 0)) },
      ],
      stopPoints: [],
    },
    { name: "EMOM PRE-11", ...options },
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
  const service = new ExecutionService({ repository, clock, scheduler, newId: () => "exec-emom", loadSession: async () => session });
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

describe("PRE-11 T2 — EMOM à l'écran", () => {
  async function started(options: { readonly initialCountdownSeconds?: number } = {}, parameters?: Parameters<typeof setup>[1]) {
    const context = await setup(options, parameters);
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    await press("execution-start");
    return context;
  }

  it("Compte à rebours initial : barre de l'EMOM (Pause désactivée 48, Suivant 72) — recette emom-1", async () => {
    await started({ initialCountdownSeconds: 3 });
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Préparez-vous");
    expect(screen.queryByTestId("execution-next-command")).toBeNull();
    expect(screen.getByTestId("execution-emom-next")).toBeTruthy();
    expect(screen.getByTestId("execution-pause").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("fenêtres, repos, Clôture « Fin de l'EMOM » sur écran figé, synthèse par Série, puis exercice suivant", async () => {
    const { at, repository, service } = await started();
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Mouvement E");
    expect(screen.getByTestId("execution-timer")).toHaveTextContent("01:00");
    // Barre du For time : Arrêt, Pause désactivée, Suivant (72).
    expect(screen.getByTestId("execution-stop")).toBeTruthy();
    expect(screen.getByTestId("execution-pause").props.accessibilityState).toMatchObject({ disabled: true });
    await at(20);
    // Grand chrono : temps restant de la fenêtre (l'écran se rafraîchit sur son propre minuteur).
    expect(service.project()?.timer).toEqual({ kind: "COUNTDOWN", remainingMs: 40 * S, totalMs: 60 * S, elapsedMs: 20 * S });
    await press("execution-emom-next"); // travail terminé : repos révélé, la fenêtre continue
    // Recette du 18/11/2026 : « Repos » en titre (plus dans le cercle) ; l'objectif reste dans le coin.
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Repos");
    act(() => {
      fireEvent(screen.getByTestId("execution-ring-area"), "layout", { nativeEvent: { layout: { width: 398, height: 340, x: 0, y: 0 } } });
    });
    expect(screen.getByTestId("execution-objective")).toHaveTextContent("10rép.");
    expect(screen.getByTestId("execution-emom-next").props.accessibilityState).toMatchObject({ disabled: true });
    await at(60); // fenêtre 2
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Mouvement E");
    await at(120); // fenêtre 2 non terminée : aucune saisie pendant la fenêtre 3 (bandeau supprimé, emom-3)
    expect(screen.queryByText(/non terminée/)).toBeNull();
    expect(screen.queryByTestId("execution-partial-title")).toBeNull();
    await at(130);
    await press("execution-emom-next");
    await at(180); // fin : la fenêtre 2 reste à déclarer
    expect(screen.getByTestId("execution-closure-title")).toHaveTextContent("Fin de l’EMOM");
    expect(screen.getByTestId("execution-closure-name")).toHaveTextContent("Mouvement E · série 2");
    expect(screen.getByTestId("execution-closure-target")).toHaveTextContent("Objectif10 répétitions");
    // Écran figé sur le dernier état du travail, jamais « Résultat ».
    expect(screen.getByTestId("execution-title")).not.toHaveTextContent("Résultat");
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Repos");
    await press("execution-closure-value-4");
    await press("execution-closure-validate");
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Mouvement B");
    expect(service.project()?.format).toBeNull();
    await at(400); // fin de la séance : synthèse, une ligne par Série de l'EMOM
    expect(screen.getByTestId("execution-end")).toBeTruthy();
    expect(screen.getAllByText(/^Série [0-9]/).map((node) => node.props.children)).toEqual([
      "Série 1 · Terminée · 10 / 10 rép.",
      "Série 2 · Non terminée · 4 / 10 rép.",
      "Série 3 · Terminée · 10 / 10 rép.",
    ]);
    const windows = (await repository.listResults("exec-emom"))
      .flatMap((change) => (change.type === "SCOPE" && typeof (change.result as { window?: number }).window === "number" ? [change.result as EmomWindowResult] : []))
      .sort((a, b) => a.window - b.window);
    expect(windows.map((result) => [result.window, result.terminated, result.partialRepetitions])).toEqual([
      [1, true, null],
      [2, false, 4],
      [3, true, null],
    ]);
  });

  it("D-529 / CE-UI-14 : objectif en haut à gauche, intervalle fixe en haut à droite, compte à rebours du repos en bas à droite", async () => {
    const { at } = await started();
    act(() => {
      fireEvent(screen.getByTestId("execution-ring-area"), "layout", { nativeEvent: { layout: { width: 398, height: 340, x: 0, y: 0 } } });
    });
    const placement = (testID: string) => {
      let node = screen.getByTestId(testID).parent;
      while (node !== null && node.props.side === undefined) node = node.parent;
      return { side: node?.props.side, vertical: node?.props.vertical };
    };
    expect(placement("execution-objective")).toEqual({ side: "left", vertical: "top" });
    // Intervalle : valeur fixe, sans « max » (recette emom-e1 : « valeur fixe, le triangle reste gris »).
    expect(screen.getByTestId("execution-cap")).toHaveTextContent(/^01:00$/);
    expect(placement("execution-cap")).toEqual({ side: "right", vertical: "top" });
    expect(screen.queryByTestId("execution-rest-countdown")).toBeNull();
    await at(20);
    await press("execution-emom-next");
    expect(screen.getByTestId("execution-cap")).toHaveTextContent(/^01:00$/);
    expect(screen.getByTestId("execution-rest-countdown")).toHaveTextContent("00:40");
    expect(placement("execution-rest-countdown")).toEqual({ side: "right", vertical: "bottom" });
    await at(60); // fenêtre suivante : plus de repos en coin
    expect(screen.queryByTestId("execution-rest-countdown")).toBeNull();
  });

  // Complément D-529 / CE-UI-14 du 26/11/2026 : en EMOM en Répétitions, le décompte du repos occupe le bas à droite pendant le repos
  // seulement ; aucun décompte de Série en Durée ; la charge reste en bas à gauche pendant le travail.
  it("complément D-529 : EMOM en Répétitions chargé — charge en bas à gauche ; bas à droite vide au travail, décompte du repos au repos", async () => {
    const { at } = await started({}, uniformParameters({ mode: "REPETITIONS", count: 3, target: 10, pauseSeconds: 0, loadKg: 20, loadEnabled: true }));
    act(() => {
      fireEvent(screen.getByTestId("execution-ring-area"), "layout", { nativeEvent: { layout: { width: 398, height: 340, x: 0, y: 0 } } });
    });
    const placement = (testID: string) => {
      let node = screen.getByTestId(testID).parent;
      while (node !== null && node.props.side === undefined) node = node.parent;
      return { side: node?.props.side, vertical: node?.props.vertical };
    };
    expect(screen.getByTestId("execution-load")).toHaveTextContent("20kg");
    expect(placement("execution-load")).toEqual({ side: "left", vertical: "bottom" });
    expect(screen.queryByTestId("execution-rest-countdown")).toBeNull();
    expect(screen.queryByTestId("execution-duration-countdown")).toBeNull();
    expect(screen.queryByTestId("execution-auto-count")).toBeNull();
    await at(20);
    await press("execution-emom-next"); // repos
    expect(placement("execution-rest-countdown")).toEqual({ side: "right", vertical: "bottom" });
    expect(screen.queryByTestId("execution-duration-countdown")).toBeNull();
    // Aucune autre information n'est déplacée vers un autre coin.
    expect(placement("execution-objective")).toEqual({ side: "left", vertical: "top" });
    expect(placement("execution-cap")).toEqual({ side: "right", vertical: "top" });
    // Charge pendant le repos de la fenêtre : aujourd'hui absente (étape de repos sans charge), point À CLARIFIER (rapport
    // 2026-11-26_D529-COINS-DYNAMIQUES). Test neutre sur ce point : si elle est affichée, ce n'est qu'en bas à gauche.
    if (screen.queryByTestId("execution-load") !== null) expect(placement("execution-load")).toEqual({ side: "left", vertical: "bottom" });
  });

  it("Arrêt pendant une Série : feuille « Arrêt de l'EMOM », répétitions saisies, séance arrêtée", async () => {
    const { at, repository, service } = await started();
    await at(15);
    await press("execution-stop");
    expect(screen.getByTestId("execution-partial-title")).toHaveTextContent("Arrêt de l’EMOM");
    await press("execution-partial-value-6");
    await press("execution-partial-validate");
    expect(service.project()?.status).toBe("FINISHED");
    const window = (await repository.listResults("exec-emom")).find((change) => change.type === "SCOPE" && (change.result as { window?: number }).window === 1);
    expect(window?.result as EmomWindowResult).toMatchObject({ terminated: false, partialRepetitions: 6 });
  });
});
