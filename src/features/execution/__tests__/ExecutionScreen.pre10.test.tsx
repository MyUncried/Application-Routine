import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft, createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { GUIDANCE_EVENTS, type GuidanceEvents } from "@/domain/preferences/guidanceSettings";
import type { SessionGuidance } from "@/domain/sessions/sessionGuidance";
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

async function setup(guidance?: SessionGuidance) {
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
      ...(guidance !== undefined ? { guidance } : {}),
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
  const awake: boolean[] = [];
  const value = { service, signals: new ExecutionSignalAdapter(), screenAwake: { keepAwake: (active: boolean) => void awake.push(active) } };

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
  return { service, at, view, database, awake };
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
    await new Promise((resolve) => setImmediate(resolve));
  });
}


/** « À suivre » (Figma `1992:8132`, recette r6) : nom à gauche, cible ou durée à droite. */
function nextShown(): string {
  const name = screen.getByTestId("execution-next-name").props.children as string;
  const value = screen.getByTestId("execution-next-value").props.children as string;
  return [name, value].filter((part) => part !== "").join(" · ");
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
    expect(screen.getByTestId("execution-title").props.children).toBe("Préparez-vous");
    // Recette e1 (b) : 3, 2, 1 sans 0 ; Série et Tour du premier exercice dès le Compte à rebours.
    expect(screen.getByTestId("execution-timer").props.children).toBe("3");
    expect(screen.getByTestId("execution-series").props.children).toBe("1/2");

    await at(3);
    // Recette e1 (g) : pas de « Sur 00:20 » sous le compte à rebours.
    expect(screen.queryByText(/^Sur /)).toBeNull();
    expect(screen.getByTestId("execution-title").props.children).toBe("Squat");
    expect(screen.getByTestId("execution-series").props.children).toBe("1/2");
    expect(nextShown()).toBe("Pause · 00:05");

    // Pause de 10 s pendant la Série 1 : temps restant conservé.
    await at(8);
    await press("execution-pause");
    expect(screen.getByTestId("execution-resume")).toBeTruthy(); // recette e1 : Démarrer remplace la modale de Pause
    await at(18);
    await press("execution-resume");
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
    // Recette du 13/11/2026 : pendant la Pause, Série de l’exercice qui vient de s’exécuter (Squat, Série 2/2).
    expect(screen.getByTestId("execution-series").props.children).toBe("2/2");
    // Recette du 12/11/2026 (e1f) : le Point d'arrêt présente l'exercice qui suit (Fente, en Répétitions : 00:00), en
    // attente de Démarrer ; Réinitialiser devient Arrêt, Suivant est désactivé.
    await at(75);
    expect(screen.getByTestId("execution-title").props.children).toBe("Fente");
    expect(screen.getByTestId("execution-timer").props.children).toBe("00:00");
    expect(screen.getByTestId("execution-press-start")).toBeTruthy();
    // Recette du 13/11/2026 : voile orange au Point d’arrêt, invitation sur deux lignes.
    expect(screen.getByTestId("execution-stop-veil")).toBeTruthy();
    expect(screen.getByTestId("execution-press-start").props.children).toBe("Appuyer sur\ndémarrer");
    expect(screen.getByTestId("execution-wait")).toBeTruthy();
    expect(screen.getByTestId("execution-stop")).toBeTruthy();
    expect(screen.getByTestId("execution-next-command").props.accessibilityState).toMatchObject({ disabled: true });
    await at(400);
    // Recette du 13/11/2026 (Hermann : « Pour le point d’arrêt : exercice qui suit ») : Tour 1/2 de la Fente à venir.
    expect(screen.getByTestId("execution-tour").props.children).toBe("1/2");
    // Recette du 13/11/2026 : Cycle toujours affiché, « – » en gris sans Cycle.
    expect(screen.getByTestId("execution-cycle").props.children).toBe("–");
    expect(screen.queryByTestId("execution-pause")).toBeNull();
    await press("execution-continue");
    // Le voile s’efface en fondu (250 ms) ; l’invitation et le chronomètre de l’attente disparaissent tout de suite.
    expect(screen.queryByTestId("execution-press-start")).toBeNull();
    expect(screen.queryByTestId("execution-wait")).toBeNull();
    expect(screen.getByTestId("execution-title").props.children).toBe("Fente");
    expect(screen.getByTestId("execution-side").props.children).toBe("1er côté");
    expect(screen.getByTestId("execution-tour").props.children).toBe("1/2");

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
    await press("execution-stop");
    expect(screen.getByTestId("execution-end-status").props.children).toBe("Séance interrompue");
    expect(await database.getFirstAsync("SELECT business_status FROM executions")).toEqual({ business_status: "INTERRUPTED" });
    view.unmount();
  });
});

/** Fin de PRE-10 (spec `spec-guidage-reglages` §3.3) — guidage propre à la Séance, sinon le Profil. */
describe("fin de PRE-10 — guidage de la Séance", () => {
  const label = (testID: string) => screen.getByTestId(testID).props.accessibilityState;

  it("sans réglage propre : interrupteurs selon le Profil (Sons et Voix actifs par défaut)", async () => {
    const { view } = await setup();
    await press(((await screen.findByTestId("execution-start")) && "execution-start") as string);
    expect(label("execution-sound")).toEqual({ checked: true });
    expect(label("execution-voice")).toEqual({ checked: true });
    view.unmount();
  });

  // Guidage sonore validé pour la Séance (modale de Composition, documentation de main `ebe72f76`) : aucun son ni
  // aucune annonce réglés → interrupteurs Sons et Voix inactifs au démarrage.
  it("aucun son ni aucune annonce réglés pour la Séance : interrupteurs off au démarrage, modifiables pendant la séance", async () => {
    const silent = Object.fromEntries(GUIDANCE_EVENTS.map((event) => [event, { sound: "NONE", vibration: true }])) as unknown as GuidanceEvents;
    const { view } = await setup({ announcements: { session: false, names: false, phases: false, objective: false, pauses: false, sides: false }, events: silent });
    await press(((await screen.findByTestId("execution-start")) && "execution-start") as string);
    expect(label("execution-sound")).toEqual({ checked: false });
    expect(label("execution-voice")).toEqual({ checked: false });
    await press("execution-sound");
    expect(label("execution-sound")).toEqual({ checked: true });
    expect(label("execution-voice")).toEqual({ checked: false });
    view.unmount();
  });
});

/** Fin de PRE-10 (11/11/2026) — ch09 Profil, « Écran maintenu actif » : pendant l'exécution uniquement. */
describe("fin de PRE-10 — écran maintenu actif", () => {
  it("maintenu actif pendant l'exécution et en pause ; rendu à la fin", async () => {
    const { at, view, awake } = await setup();
    expect(await screen.findByTestId("execution-start")).toBeTruthy();
    expect(awake).toEqual([]);
    await press("execution-start");
    expect(awake).toEqual([true]);
    await at(10);
    await press("execution-pause");
    expect(awake).toEqual([true]);
    await press("execution-stop");
    expect(screen.getByTestId("execution-end-status")).toBeTruthy();
    expect(awake).toEqual([true, false]);
    view.unmount();
    expect(awake).toEqual([true, false]);
  });

  it("sortie de l'écran pendant l'exécution : veille rendue", async () => {
    const { view, awake } = await setup();
    await press(((await screen.findByTestId("execution-start")) && "execution-start") as string);
    view.unmount();
    expect(awake).toEqual([true, false]);
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
    expect(screen.getByTestId("execution-resume")).toBeTruthy(); // recette e1 : Démarrer remplace la modale de Pause
    await press("execution-resume");
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
    expect(screen.getByTestId("execution-series").props.children).toBe("2/2");
    view.unmount();
  });

  it("À suivre : numéro de Série après le nom ; Point d'arrêt annoncé « Arrêt de la séance, redémarrage manuel »", async () => {
    const { at, view } = await setup();
    await screen.findByTestId("execution-start");
    await press("execution-start");
    await at(24); // Pause après S1 : à suivre Squat S2
    expect(nextShown()).toBe("Squat · 00:20");
    await at(50); // Pause finale : à suivre le Point d'arrêt
    expect(screen.getByTestId("execution-title").props.children).toBe("Pause");
    expect(nextShown()).toBe("Arrêt de la séance, redémarrage manuel");
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

/**
 * Recette du 11/11/2026, constat a (Hermann : « Pendant un appel vidéo ou téléphonique, ou l'utilisation d'une autre
 * application, il faut une interruption de la séance, par défaut ») : la séance passe en Pause à l'arrière-plan.
 */
describe("recette du 11/11/2026 — interruption de la séance à l'arrière-plan", () => {
  it("l'application quitte le premier plan : la séance est en Pause au retour", async () => {
    const listeners: ((state: AppStateStatus) => void)[] = [];
    const spy = jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
      listeners.push(listener as (state: AppStateStatus) => void);
      return { remove: () => undefined } as ReturnType<typeof AppState.addEventListener>;
    });
    const { at, view } = await setup();
    await press(((await screen.findByTestId("execution-start")) && "execution-start") as string);
    await at(5);
    expect(screen.queryByTestId("execution-pause-dialog")).toBeNull();
    await act(async () => {
      for (const listener of listeners) listener("background");
    });
    await act(async () => {
      for (const listener of listeners) listener("active");
    });
    expect(screen.getByTestId("execution-resume")).toBeTruthy(); // recette e1 : Démarrer remplace la modale de Pause
    spy.mockRestore();
    view.unmount();
  });
});
