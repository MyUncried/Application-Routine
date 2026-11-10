import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft, createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
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

import { ExecutionDialog } from "../ExecutionDialog";
import { ExecutionScreen, refreshDelayMs } from "../ExecutionScreen";
import { ExecutionService } from "../ExecutionService";
import { ExecutionServiceContext } from "../ExecutionServiceContext";

/**
 * PRE-10.3 — parcours réel de l'application, en test : une Séance Libre enregistrée par le service de la
 * Composition (brouillon → `createSession`, base SQLite réelle) est lancée depuis l'écran d'Exécution,
 * parcourue, mise en pause, réinitialisée, arrêtée à un Point d'arrêt, reprise et terminée (ou arrêtée).
 * Horloge et ordonnanceur du moteur simulés ; aucun rendu visuel contrôlé (comportement seulement).
 */

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, canGoBack: () => true, replace: jest.fn(), push: jest.fn() }),
  // Écran toujours au premier plan dans ces tests.
  useFocusEffect: (effect: () => void | (() => void)) => jest.requireActual<typeof import("react")>("react").useEffect(effect, [effect]),
}));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(() => Promise.resolve()), ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" } }));
jest.mock("expo-crypto", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  randomUUID: () => (require("node:crypto") as typeof import("node:crypto")).randomUUID(),
}));

const S = 1000;
const T0 = Date.UTC(2026, 10, 9, 19, 0, 0);

const exercise = (id: string, name: string, structuralPosition: SessionDraftExercise["structuralPosition"], executionParameters: SessionDraftExercise["executionParameters"]): SessionDraftExercise => ({
  ...createExerciseDraft(id),
  name,
  structuralPosition,
  executionParameters,
});

async function setup() {
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const sessionService = new SessionService(new SqliteSessionRepository(database), new SqliteCategoryRepository(database));
  // Séance Libre : A (Durée 20 s × 2, Pause 5 s), Point d'arrêt, Circuit 2 tours [B Répétitions bilatéral], C (Durée 10 s).
  const created = await sessionService.createSession(
    withLocalMovements({
      ...createEmptyDraft(),
      name: "Libre PRE-10",
      initialCountdownSeconds: 3,
      finalPhaseSeconds: 0,
      tourRepeatCount: 2,
      circuitNature: "TOURS",
      exercises: [
        exercise("ex-a", "Squat", "BEFORE_TOUR", durationParameters(20, 2, 5)),
        exercise("ex-b", "Fente", "IN_TOUR", repetitionParameters(10, 1, 0, { sideMode: "RIGHT_LEFT" })),
        exercise("ex-c", "Gainage", "AFTER_TOUR", durationParameters(10, 1, 0)),
      ],
      stopPoints: [{ id: "p1", scope: "BEFORE_TOUR", position: 1 }],
    }),
  );
  if (!created.ok) throw new Error(`seed failed: ${JSON.stringify(created.violations)}`);

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
  const service = new ExecutionService({
    repository: new SqliteExecutionRepository(database),
    clock,
    scheduler,
    newId: () => "exec-ui",
    loadSession: (sessionId) => sessionService.getSessionForConsultation(sessionId),
  });
  const profileService = new ProfileService(new SqliteProfileRepository(database));
  const value = { service, signals: new ExecutionSignalAdapter() };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestSafeAreaProvider>
        <ProfileServiceContext.Provider value={profileService}>
          <ExecutionServiceContext.Provider value={value}>{children}</ExecutionServiceContext.Provider>
        </ProfileServiceContext.Provider>
      </TestSafeAreaProvider>
    );
  }

  /** Avance l'horloge du moteur jusqu'à `seconds` après T0 en déclenchant les réveils dus. */
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

  const view = render(<ExecutionScreen sessionId={created.value.id} />, { wrapper: Wrapper });
  return { service, at, view, database };
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
    await new Promise((resolve) => setImmediate(resolve));
  });
}

describe("PRE-10.3 — Exécution Libre depuis l'application", () => {
  afterEach(() => {
    mockBack.mockReset();
  });

  it("lancer, parcourir, mettre en pause, réinitialiser, attendre au Point d'arrêt, continuer et terminer", async () => {
    const { service, at, view, database } = await setup();
    expect(await screen.findByTestId("execution-start")).toBeTruthy();
    // L'ouverture de l'écran ne démarre rien : aucune Exécution persistée.
    expect(await database.getAllAsync("SELECT id FROM executions")).toHaveLength(0);
    await press("execution-start");
    expect(screen.getByTestId("execution-title").props.children).toBe("Compte à rebours");

    await at(3);
    expect(screen.getByTestId("execution-title").props.children).toBe("Squat");
    expect(screen.getByTestId("execution-series").props.children).toBe("Série 1/2");
    expect(screen.getByTestId("execution-next").props.children[1].props.children).toBe("Pause · 00:05");

    // Pause de 10 s pendant la Série 1 : temps restant conservé.
    await at(8);
    await press("execution-pause");
    expect(screen.getByTestId("execution-pause-dialog")).toBeTruthy();
    await at(18);
    await press("execution-pause-resume");
    expect(screen.getByTestId("execution-timer").props.children).toBe("00:15");

    // Réinitialiser : confirmation, l'Exécution est suspendue pendant la modale, la Série recommence.
    await press("execution-reset");
    expect(screen.getByTestId("execution-reset-dialog")).toBeTruthy();
    await at(25);
    await press("execution-reset-confirm");
    expect(screen.getByTestId("execution-timer").props.children).toBe("00:20");

    // Série 1 : 25 → 45 ; Pause 45 → 50 ; Série 2 : 50 → 70 ; dernière Pause conservée sans récupération (ch09) 70 → 75 ;
    // Point d'arrêt (aucune échéance).
    await at(74);
    expect(screen.getByTestId("execution-title").props.children).toBe("Pause");
    await at(75);
    expect(screen.getByTestId("execution-title").props.children).toBe("Point d'arrêt");
    await at(400);
    expect(screen.getByTestId("execution-title").props.children).toBe("Point d'arrêt");
    await press("execution-next-command"); // Continuer
    expect(screen.getByTestId("execution-title").props.children).toBe("Fente");
    expect(screen.getByTestId("execution-side").props.children).toBe("Côté 1");
    expect(screen.getByTestId("execution-tour").props.children).toBe("Tour 1/2");

    // Répétitions : Suivant sans confirmation, côté 2 puis Tour 2.
    for (let i = 0; i < 4; i += 1) await press("execution-next-command");
    expect(screen.getByTestId("execution-title").props.children).toBe("Gainage");

    // Suivant avant le terme d'une Durée : confirmation, puis Partielle.
    await press("execution-next-command");
    expect(screen.getByTestId("execution-next-dialog")).toBeTruthy();
    await press("execution-next-confirm");
    expect(screen.getByTestId("execution-end-status").props.children).toBe("Séance partiellement exécutée");
    const stored = await database.getFirstAsync<{ status: string; business_status: string }>("SELECT status, business_status FROM executions");
    expect(stored).toEqual({ status: "FINISHED", business_status: "PARTIAL" });
    expect(service.occurrences().map((occurrence) => occurrence.status)).toEqual(["COMPLETED", "COMPLETED", "COMPLETED", "PARTIAL"]);
    await press("execution-close");
    expect(mockBack).toHaveBeenCalled();
    view.unmount();
  });

  it("Arrêter la séance depuis la Pause : fin minimale, statut Interrompue", async () => {
    const { at, view, database } = await setup();
    await press(((await screen.findByTestId("execution-start")) && "execution-start") as string);
    await at(10);
    await press("execution-pause");
    await press("execution-pause-stop");
    expect(screen.getByTestId("execution-end-status").props.children).toBe("Séance interrompue");
    expect(await database.getFirstAsync("SELECT business_status FROM executions")).toEqual({ business_status: "INTERRUPTED" });
    view.unmount();
  });
});

describe("PRE-10 — corrections de la recette iPhone du 09/11/2026", () => {
  afterEach(() => {
    mockBack.mockReset();
  });

  it("Réinitialiser puis Annuler : aucun dialogue de Pause intercalé, commandes de nouveau actives", async () => {
    const { service, at, view } = await setup();
    await screen.findByTestId("execution-start");
    await press("execution-start");
    await at(8); // Squat S1, 15 s restantes
    await press("execution-reset");
    expect(service.current()?.state.pause?.reason).toBe("DIALOG");
    expect(screen.queryByTestId("execution-pause-dialog")).toBeNull();
    await press("execution-reset-cancel");
    // Le dialogue se ferme une fois la reprise enregistrée : jamais de Pause visible entre les deux.
    expect(screen.queryByTestId("execution-reset-dialog")).toBeNull();
    expect(screen.queryByTestId("execution-pause-dialog")).toBeNull();
    expect(service.current()?.state.status).toBe("RUNNING");
    await at(9);
    expect(service.project()?.timer).toMatchObject({ kind: "COUNTDOWN", remainingMs: 14 * S });
    await press("execution-pause");
    expect(screen.getByTestId("execution-pause-dialog")).toBeTruthy();
    await press("execution-pause-resume");
    expect(screen.queryByTestId("execution-pause-dialog")).toBeNull();
    view.unmount();
  });

  it("Suivant pendant une Durée : chrono suspendu pendant la confirmation ; Annuler reprend à la même valeur", async () => {
    const { service, at, view } = await setup();
    await screen.findByTestId("execution-start");
    await press("execution-start");
    await at(8); // 15 s restantes
    await press("execution-next-command");
    expect(screen.getByTestId("execution-next-dialog")).toBeTruthy();
    expect(service.current()?.state.status).toBe("PAUSED");
    await at(30);
    await press("execution-next-cancel");
    expect(screen.queryByTestId("execution-next-dialog")).toBeNull();
    expect(screen.queryByTestId("execution-pause-dialog")).toBeNull();
    expect(screen.getByTestId("execution-timer").props.children).toBe("00:15");
    // Confirmer : reprise puis passage, l'Exercice est Partiel.
    await press("execution-next-command");
    await press("execution-next-confirm");
    expect(screen.queryByTestId("execution-next-dialog")).toBeNull();
    expect(screen.getByTestId("execution-title").props.children).toBe("Pause");
    // Recette n° 2 du 09/11/2026 : pendant son fondu de fermeture, le Modal garde le contenu du dialogue Suivant
    // (jamais celui de la Pause, « Reprendre la séance / Arrêter la séance »).
    const closing = view.UNSAFE_getByType(ExecutionDialog);
    expect(closing.props.visible).toBe(false);
    expect(closing.props.testID).toBe("execution-next-dialog");
    view.unmount();
  });

  it("Suivant pendant une Pause entre séries : passage direct, sans confirmation", async () => {
    const { at, view } = await setup();
    await screen.findByTestId("execution-start");
    await press("execution-start");
    await at(24); // Pause 23 → 28
    expect(screen.getByTestId("execution-title").props.children).toBe("Pause");
    await press("execution-next-command");
    expect(screen.queryByTestId("execution-next-dialog")).toBeNull();
    expect(screen.getByTestId("execution-title").props.children).toBe("Squat");
    expect(screen.getByTestId("execution-series").props.children).toBe("Série 2/2");
    view.unmount();
  });

  it("À suivre : numéro de Série après le nom ; Point d'arrêt annoncé « Arrêt de la séance, redémarrage manuel »", async () => {
    const { at, view } = await setup();
    await screen.findByTestId("execution-start");
    await press("execution-start");
    await at(24); // Pause après S1 : à suivre Squat S2
    expect(screen.getByTestId("execution-next").props.children[1].props.children).toBe("Squat · Série 2/2 · 00:20");
    await at(50); // Pause finale : à suivre le Point d'arrêt
    expect(screen.getByTestId("execution-title").props.children).toBe("Pause");
    expect(screen.getByTestId("execution-next").props.children[1].props.children).toBe("Arrêt de la séance, redémarrage manuel");
    view.unmount();
  });

  it("rafraîchissement calé sur le changement de seconde affichée", () => {
    const countdown = (remainingMs: number) => ({ timer: { kind: "COUNTDOWN", remainingMs, totalMs: 30000, elapsedMs: 0 } }) as unknown as Parameters<typeof refreshDelayMs>[0];
    expect(refreshDelayMs(countdown(2010))).toBe(30); // « 00:03 » jusqu'à 2000 ms, puis « 00:02 »
    expect(refreshDelayMs(countdown(2600))).toBe(250);
    expect(refreshDelayMs(countdown(2200))).toBe(220);
    expect(refreshDelayMs({ timer: { kind: "STOPWATCH", elapsedMs: 4900, nominalMs: null } } as unknown as Parameters<typeof refreshDelayMs>[0])).toBe(120);
  });
});
