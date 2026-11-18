import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { exerciseActivity, structuredSession } from "@/domain/execution/testing/simulation";
import type { ForTimeResult } from "@/domain/execution/policies/forTime";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
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
import { displayedFraction, REST_RING_COLOR, RING, ringColorOf, ringMotion, ringSegmentsOf } from "../timerRing";

/**
 * PRE-11 (T1) — For time depuis l'écran d'Exécution : borne dans le coin du haut à gauche (décision de Hermann du
 * 13/11/2026), temps réalisé au grand chrono, Clôture « Vos résultats » (modèle « Résultat de série »), validation,
 * enchaînement automatique et résultat d'élément persisté.
 */

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() }),
  useFocusEffect: (effect: () => void | (() => void)) => jest.requireActual<typeof import("react")>("react").useEffect(effect, [effect]),
}));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" } }));

const S = 1000;
const T0 = Date.UTC(2026, 10, 13, 19, 0, 0);

let appStateListener: ((state: AppStateStatus) => void) | null = null;

async function setup(
  parameters: ExecutionParameters = repetitionParameters(21, 2, 0),
  capSeconds: number | null = 60,
  format: "FOR_TIME" | null = "FOR_TIME",
) {
  jest.spyOn(AppState, "addEventListener").mockImplementation(((type: string, listener: (state: AppStateStatus) => void) => {
    if (type === "change") appStateListener = listener;
    return { remove: () => undefined };
  }) as never);
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const session = structuredSession(
    {
      elements: [
        {
          kind: "EXERCISE",
          exercise: exerciseActivity("F", parameters, format === null ? {} : { format: { key: "FOR_TIME", settings: capSeconds === null ? {} : { timeCapSeconds: capSeconds } } }),
        },
        { kind: "EXERCISE", exercise: exerciseActivity("B", durationParameters(30, 1, 0)) },
      ],
      stopPoints: [],
    },
    { name: "For time PRE-11" },
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
  const service = new ExecutionService({ repository, clock, scheduler, newId: () => "exec-ft", loadSession: async () => session });
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

describe("PRE-11 T1 — For time à l'écran", () => {
  it("borne en coin, temps réalisé, borne atteinte, Clôture avec les répétitions faites, puis exercice suivant", async () => {
    const { at, repository, service } = await setup();
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    await press("execution-start");
    // Largeur de la zone de l'anneau (mesurée à l'écran) : les cadres en coin s'affichent.
    await act(async () => {
      fireEvent(screen.getByTestId("execution-ring-area"), "layout", { nativeEvent: { layout: { width: 398, height: 340, x: 0, y: 0 } } });
    });
    // Borne dans le coin du haut à gauche ; l'objectif de la Série passe dans le cercle.
    expect(screen.getByTestId("execution-cap")).toBeTruthy();
    // Recette du 14/11/2026 : durée sur la ligne du haut, « max » sur celle du bas ; seconde recette du 17/11/2026 (« utiliser le format
    // 00:00 pour toutes les durées »). [« 1′00″ » (ft-k8) — remplacé.]
    expect(screen.getByTestId("execution-cap-value").props.children).toBe("01:00");
    expect(screen.getByTestId("execution-cap")).toHaveTextContent("01:00max");
    // Recette du 15/11/2026 (g3) : l'objectif passe dans le coin du bas à droite ; seconde recette du 17/11/2026 : sur deux lignes.
    expect(screen.getByTestId("execution-objective")).toHaveTextContent("21rép.");
    let badge = screen.getByTestId("execution-objective").parent;
    while (badge !== null && badge.props.side === undefined) badge = badge.parent;
    expect(badge?.props).toMatchObject({ side: "right", vertical: "bottom" });
    await at(20);
    // Grand chrono : temps réalisé de l'élément, anneau jusqu'à la borne.
    expect(service.project()?.timer).toEqual({ kind: "STOPWATCH", elapsedMs: 20 * S, nominalMs: 60 * S });
    // Correction 3 : le ✓ valide la Série sans saisie. [« Suivant » — remplacé pour le For time.]
    // 16/11/2026 : « + Tour » remplace le ✓ ; For time d'un seul exercice : un tour = une Série. [✓ — remplacé.]
    await press("execution-plus-tour"); // S1 en 20 s
    await at(60); // borne pendant S2
    expect(screen.getByTestId("execution-closure")).toBeTruthy();
    // Recette du 18/11/2026 (Hermann : « Je ne veux pas de cet écran résultat à la fin ») : l'écran reste sur l'exercice.
    expect(screen.getByTestId("execution-title")).not.toHaveTextContent("Résultat");
    // Troisième recette du 17/11/2026 (ftr3-modale-duree) : « Arrêt du For Time », Valider seul, Objectif, roulette. [Rappel « Limite
    // atteinte · durée » — remplacé.]
    expect(screen.getByTestId("execution-closure-title")).toHaveTextContent("Arrêt du For Time");
    expect(screen.queryByTestId("execution-closure-cancel")).toBeNull();
    expect(screen.getByTestId("execution-closure-target")).toHaveTextContent("Objectif21 répétitions");
    await press("execution-closure-value-12");
    await press("execution-closure-validate");
    expect(screen.queryByTestId("execution-closure")).toBeNull();
    // Recette du 18/11/2026 : l'écran figé se libère à la validation ; l'élément suivant de la séance démarre.
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Mouvement B");
    const results = await repository.listResults("exec-ft");
    const element = results.find((change) => change.type === "SCOPE" && (change.result as { format?: string }).format === "FOR_TIME");
    expect(element?.result as ForTimeResult).toMatchObject({ measuredMs: 60 * S, capReached: true, completedActivities: 1, partialRepetitions: 12 });
  });
});

/**
 * PRE-11, corrections 3 et 4 de Hermann du 14/11/2026 — barre du For time, aucune modale de résultat dans le déroulement normal,
 * arrêt avec « Répétitions partielles », couleur de l'anneau, modale gardée au retour d'arrière-plan.
 * Cas de Hermann : For time d'un exercice, deux séries, une pause entre les séries.
 */
describe("PRE-11 — For time, corrections 3 et 4", () => {
  const twoSeries = () => repetitionParameters(10, 2, 20);
  async function started(parameters = twoSeries(), capSeconds: number | null = null) {
    const context = await setup(parameters, capSeconds);
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    await press("execution-start");
    return context;
  }
  const disabled = (testID: string) => screen.getByTestId(testID).props.accessibilityState?.disabled === true;

  // Recette du 14/11/2026 (Hermann : « supprimer cette fenêtre résultat, passer directement à la pause »). [Temps final affiché 3 s — remplacé.]
  // Registre ch07 (16/11/2026) : Arrêt rouge à la place de Réinitialiser, Pause désactivée, « + Tour » à la place du ✓.
  // [Réinitialiser inerte, Pause 56, ✓ (correction 3) — remplacés.]
  // Seconde recette du 17/11/2026 (Hermann : « Temps de repos supprimés en For time » ; « aucun texte dans les autres cas ») : la série 2
  // aussitôt, sans pause ; après le For time, l'exercice suivant aussitôt ; aucune mention dans le cercle. [Pause entre les séries et
  // après le For time, « Appuyez à chaque tour terminé » — remplacés.]
  it("(3a, 4b) en cours : Arrêt rouge, Pause désactivée ; « + Tour » enchaîne sans modale ni pause ; à la fin, exercice suivant aussitôt", async () => {
    const { at, service } = await started();
    expect(screen.queryByTestId("execution-reset")).toBeNull();
    expect(disabled("execution-stop")).toBe(false);
    expect(disabled("execution-pause")).toBe(true);
    expect(screen.queryByTestId("execution-validate")).toBeNull();
    expect(screen.queryByTestId("execution-next-command")).toBeNull();
    await press("execution-pause");
    expect(service.project()?.status).toBe("RUNNING");
    expect(screen.queryByTestId("execution-duration-mention")).toBeNull();
    expect(disabled("execution-plus-tour")).toBe(false);
    await at(15);
    await press("execution-plus-tour"); // S1
    expect(screen.queryByTestId("execution-closure")).toBeNull();
    expect(service.project()).toMatchObject({ phase: "ACTIVITY", series: { current: 2 }, format: { completedActivities: 1 } });
    await at(30);
    // Recette du 17/11/2026 (ft-sans-duree) : à la dernière série, la coche Succès remplace « + Tour ».
    expect(screen.queryByTestId("execution-plus-tour")).toBeNull();
    await press("execution-validate"); // S2 : fin du For time
    expect(screen.queryByTestId("execution-closure")).toBeNull();
    // Aucun écran de résultat ; B aussitôt.
    expect(screen.queryByTestId("execution-final-time")).toBeNull();
    expect(service.project()?.exerciseName).toBe("Mouvement B");
  });

  // Registre ch07 (16/11/2026, Hermann : « Le chrono continue ») : l'arrière-plan ne met pas le For time en Pause. Une Pause
  // venue d'ailleurs (reprise sans continuité) garde Arrêt et Redémarrer, « + Tour » désactivé. [(3b) Pause puis Redémarrer, ✓
  // inactif en Pause — remplacé.]
  it("(3b) arrière-plan : pas de Pause, le chrono a compté l'absence ; une Pause de reprise garde Arrêt, Redémarrer, + Tour inactif", async () => {
    const { at, service } = await started();
    await at(10);
    await act(async () => {
      appStateListener?.("background");
      await new Promise((resolve) => setImmediate(resolve));
    });
    expect(service.project()?.status).toBe("RUNNING");
    await at(70);
    await act(async () => {
      appStateListener?.("active");
      await new Promise((resolve) => setImmediate(resolve));
    });
    expect(service.project()?.timer).toEqual({ kind: "STOPWATCH", elapsedMs: 70 * S, nominalMs: null });
    await act(async () => {
      await service.dispatch({ type: "PAUSE", reason: "USER" });
    });
    expect(disabled("execution-plus-tour")).toBe(true);
    expect(screen.getByTestId("execution-stop")).toBeTruthy();
    await press("execution-resume");
    await at(75);
    expect(service.project()?.timer).toEqual({ kind: "STOPWATCH", elapsedMs: 75 * S, nominalMs: null });
    expect(disabled("execution-plus-tour")).toBe(false);
  });

  // Registre ch07 (16/11/2026) : l'Arrêt ouvre la modale sans Pause, « le chrono continue derrière la modale ».
  it("(3c, 4c) Arrêt en série : « Répétitions partielles » sans Pause ; la croix revient à l'exercice ; confirmé, séance arrêtée avec la saisie", async () => {
    const { at, repository, service } = await started();
    await at(12);
    await press("execution-stop");
    expect(screen.getByTestId("execution-partial")).toBeTruthy();
    expect(service.project()?.status).toBe("RUNNING");
    // Troisième recette du 17/11/2026 (ftr3-modale-duree) : « Arrêt du For Time », Annuler et Valider, Objectif, demi-roulette.
    // [« Entrer votre résultat » (seconde recette) — remplacé.]
    expect(screen.getByTestId("execution-partial-cancel").props.accessibilityLabel).toBe("Revenir à l’exercice");
    expect(screen.getByTestId("execution-partial-title")).toHaveTextContent("Arrêt du For Time");
    expect(screen.getByTestId("execution-partial-target")).toHaveTextContent("Objectif10 répétitions");
    await press("execution-partial-cancel");
    expect(screen.queryByTestId("execution-partial")).toBeNull();
    expect(service.project()?.status).toBe("RUNNING");
    await press("execution-stop");
    // Recette du 15/11/2026 (k5 : « Mettre la Valeur limite à 99 ») : jusqu'à 99, quelle que soit la cible.
    expect(screen.getByTestId("execution-partial-value-99")).toBeTruthy();
    expect(screen.queryByTestId("execution-partial-value-100")).toBeNull();
    await press("execution-partial-value-7");
    await at(20); // le chrono continue derrière la modale
    await press("execution-partial-validate");
    expect(screen.getByTestId("execution-end")).toBeTruthy();
    // Recette du 15/11/2026 (g7) : la fin de séance partielle montre les répétitions saisies.
    expect(screen.getByTestId("execution-end")).toHaveTextContent(/Partielle · 7 rép./);
    const results = await repository.listResults("exec-ft");
    const element = results.find((change) => change.type === "SCOPE" && (change.result as { format?: string }).format === "FOR_TIME");
    // Recette du 17/11/2026 (ft-arret-serie : « le temps enregistré doit être celui de l’instant où on a appuyé sur « Arrêt », pas
    // celui de la validation ») : second appui à 12 s, validation à 20 s. [Temps de la validation — remplacé.]
    expect(element?.result as ForTimeResult).toMatchObject({ completedActivities: 0, partialRepetitions: 7, measuredMs: 12 * S });
  });

  // Seconde recette du 17/11/2026 (constat c : « Si j'appuie sur Arrêter, que la modale est ouverte mais que je laisse ensuite courir
  // l'exercice jusqu'à la fin du temps max […] L'écran Résultat ne doit pas afficher »). [(4c) Arrêt pendant la pause entre les séries
  // — sans objet : plus de pause dans un For time.]
  it("(c) Arrêt, modale laissée ouverte jusqu'à la borne : pas d'écran Résultat ; la coche amène à la fin, temps de l'appui", async () => {
    const { at, repository } = await started(repetitionParameters(21, 2, 0), 60);
    await at(50);
    await press("execution-stop");
    await press("execution-partial-value-5");
    await at(65); // borne atteinte derrière la modale
    expect(screen.queryByTestId("execution-closure")).toBeNull();
    expect(screen.getByTestId("execution-partial-title")).toHaveTextContent("Arrêt du For Time");
    await press("execution-partial-validate");
    expect(screen.getByTestId("execution-end")).toBeTruthy();
    const results = await repository.listResults("exec-ft");
    const element = results.find((change) => change.type === "SCOPE" && (change.result as { format?: string }).format === "FOR_TIME");
    expect(element?.result as ForTimeResult).toMatchObject({ measuredMs: 50 * S, capReached: false, partialRepetitions: 5 });
  });

  // Précision FT-15 de Hermann du 14/11/2026 : « le cercle doit devenir bicolore, et non changer de couleur en entier ».
  // Seconde recette du 17/11/2026 : plus de pause dans un For time — l'anneau reste d'une couleur. [Portion orange de la pause — remplacé ;
  // le calcul des portions reste couvert par le test suivant.]
  it("(4a) sans pause : l'anneau reste bleu d'une série à l'autre ; minute révolue : tout au gris", async () => {
    const { at, service } = await started(repetitionParameters(10, 2, 30));
    const segments = () => {
      const projection = service.project()!;
      const timer = projection.timer as { elapsedMs: number };
      return ringSegmentsOf(projection.format!.phaseStarts.map((start) => ({ atMs: start.atMs, color: ringColorOf(start.kind) })), timer.elapsedMs);
    };
    await at(25);
    expect(ringColorOf(service.project()!.phase)).toBe(RING.progressColor);
    expect(segments()).toEqual({ past: [], currentFrom: 0 });
    await press("execution-plus-tour"); // S1 à 25 s ; S2 aussitôt
    await at(40);
    expect(ringColorOf(service.project()!.phase)).toBe(RING.progressColor);
    expect(service.project()!.timer).toEqual({ kind: "STOPWATCH", elapsedMs: 40 * S, nominalMs: null });
    expect(segments().past.every((segment) => segment.color === RING.progressColor)).toBe(true);
    await at(62);
    // Minute révolue : tout l'arc revient au gris, puis repart dans la couleur de la phase en cours.
    const wrapped = ringMotion(service.project()!.timer, true);
    expect(displayedFraction(wrapped.turns, wrapped.wrap)).toBeCloseTo(2 / 60, 5);
    expect(segments()).toEqual({ past: [], currentFrom: 0 });
  });

  it("(4a) plusieurs changements dans la minute : autant de portions que de phases, couleurs consécutives identiques fusionnées", () => {
    const blue = RING.progressColor;
    const orange = REST_RING_COLOR;
    const changes = [
      { atMs: 0, color: blue },
      { atMs: 10 * S, color: orange },
      { atMs: 20 * S, color: blue },
      { atMs: 30 * S, color: blue },
      { atMs: 40 * S, color: orange },
    ];
    expect(ringSegmentsOf(changes, 50 * S)).toEqual({
      past: [
        { from: 0, to: 10 / 60, color: blue },
        { from: 10 / 60, to: 20 / 60, color: orange },
        { from: 20 / 60, to: 40 / 60, color: blue },
      ],
      currentFrom: 40 / 60,
    });
    // Deuxième minute : seules les portions de la nouvelle minute (orange depuis 60 s, puis bleu à 70 s).
    expect(ringSegmentsOf([...changes, { atMs: 70 * S, color: blue }], 75 * S)).toEqual({ past: [{ from: 0, to: 10 / 60, color: orange }], currentFrom: 10 / 60 });
  });

  it("(4d) saisie ouverte, app en arrière-plan puis au premier plan : pas de Pause, valeur gardée, Valider actif", async () => {
    const { at, service, repository } = await started(repetitionParameters(21, 2, 0), 60);
    await at(20);
    await press("execution-plus-tour");
    await at(60); // borne pendant S2 : saisie des répétitions faites
    await press("execution-closure-value-9");
    await act(async () => {
      appStateListener?.("background");
      await new Promise((resolve) => setImmediate(resolve));
    });
    expect(service.project()?.status).toBe("RUNNING");
    await act(async () => {
      appStateListener?.("active");
      await new Promise((resolve) => setImmediate(resolve));
    });
    expect(screen.getByTestId("execution-closure-value-9").props.accessibilityState).toMatchObject({ selected: true });
    await press("execution-closure-validate");
    expect(screen.queryByTestId("execution-closure")).toBeNull();
    const results = await repository.listResults("exec-ft");
    const element = results.find((change) => change.type === "SCOPE" && (change.result as { format?: string }).format === "FOR_TIME");
    expect(element?.result as ForTimeResult).toMatchObject({ capReached: true, partialRepetitions: 9 });
  });

  it("(4d) saisie retrouvée en Pause (version antérieure) : la séance reprend, Valider fonctionne", async () => {
    const { at, service } = await started(repetitionParameters(21, 2, 0), 60);
    await at(20);
    await press("execution-plus-tour");
    await at(60);
    await act(async () => {
      await service.dispatch({ type: "PAUSE", reason: "USER" });
      await new Promise((resolve) => setImmediate(resolve));
    });
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    expect(service.project()?.status).toBe("RUNNING");
    await press("execution-closure-validate");
    expect(screen.queryByTestId("execution-closure")).toBeNull();
  });

  it("(3d) un exercice sans For time garde ses boutons (Suivant, Pause 72, Réinitialiser actif)", async () => {
    await setup(repetitionParameters(10, 2, 0), null, null);
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    await press("execution-start");
    expect(screen.getByTestId("execution-next-command")).toBeTruthy();
    expect(screen.queryByTestId("execution-validate")).toBeNull();
    expect(screen.getByTestId("execution-pause").props.style).toEqual(expect.arrayContaining([expect.objectContaining({ width: 72, height: 72 })]));
  });
});

// Demande de Hermann du 14/11/2026 (soir) : « Un exercice en durée : il doit avoir dans le triangle haut à gauche la durée cible de
// l'exercice ».
describe("exercice en Durée : durée cible dans le coin du haut à gauche (14/11/2026)", () => {
  // Seconde recette du 17/11/2026 (« utiliser le format 00:00 pour toutes les durées » ; textes des triangles sur deux lignes).
  // [« 45″ », « 1′30″ », « 10 rép. » sur une ligne — remplacés.]
  it("45 s : « 00:45 » dans le coin ; 1 min 30 : « 01:30 » ; un exercice en Répétitions : « 10 » puis « rép. »", async () => {
    for (const [parameters, expected] of [
      [durationParameters(45, 1, 0), "00:45"],
      [durationParameters(90, 1, 0), "01:30"],
      [repetitionParameters(10, 1, 0), "10rép."],
    ] as const) {
      const { at } = await setup(parameters, null, null);
      await act(async () => {
        await new Promise((resolve) => setImmediate(resolve));
      });
      await press("execution-start");
      await at(3);
      await act(async () => {
        fireEvent(screen.getByTestId("execution-ring-area"), "layout", { nativeEvent: { layout: { width: 398, height: 340, x: 0, y: 0 } } });
      });
      expect(screen.getByTestId("execution-objective")).toHaveTextContent(expected);
      screen.unmount();
    }
  });
});

// Recette du 14/11/2026 (Hermann : « Pause au changement de côté : mettre le titre "Changez de côté" » ; « la durée doit apparaître
// dans le triangle en haut à gauche pendant les pauses et les récupérations aussi »).
describe("pauses : titre « Changez de côté » et durée prévue dans le coin du haut à gauche (14/11/2026)", () => {
  async function at15(parameters: ExecutionParameters) {
    const { at } = await setup(parameters, null, null);
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    await press("execution-start");
    await at(15);
    await act(async () => {
      fireEvent(screen.getByTestId("execution-ring-area"), "layout", { nativeEvent: { layout: { width: 398, height: 340, x: 0, y: 0 } } });
    });
  }

  // Seconde recette du 17/11/2026 : format 00:00. [« 12″ », « 20″ » — remplacés.]
  it("Pause au changement de côté : titre « Changez de côté », « 00:12 » dans le coin", async () => {
    await at15(durationParameters(10, 1, 0, { sideMode: "RIGHT_LEFT", sideRecoverySeconds: 12 }));
    expect(screen.getByTestId("execution-title").props.children).toBe("Changez de côté");
    expect(screen.getByTestId("execution-objective")).toHaveTextContent("00:12");
    screen.unmount();
  });

  it("Pause entre Séries : titre « Pause », « 00:20 » dans le coin", async () => {
    await at15(durationParameters(10, 2, 20));
    expect(screen.getByTestId("execution-title").props.children).toBe("Pause");
    expect(screen.getByTestId("execution-objective")).toHaveTextContent("00:20");
    screen.unmount();
  });
});

// Recette du 14/11/2026 (Hermann, k5 : « Le cadre gris doit être au milieu, avec 0 à l’intérieur […] Un retour haptique à chaque
// passage de chiffre sur le cadre gris »).
describe("répétitions partielles : roulette horizontale (14/11/2026)", () => {
  // Troisième recette du 17/11/2026 (ftr3-modale-duree : « demi-roulette horizontale (elle s'arrête à gauche sur le cadre gris, au milieu
  // de l'écran, et à droite sur les chiffres croissants) ») : cadre au bord gauche de la roulette, posée sur la moitié droite de la
  // feuille. [Cadre au milieu de la roulette — remplacé.]
  it("demi-roulette : cadre fixe à gauche, 0 dedans au départ ; le défilement choisit le chiffre sous le cadre, avec un retour haptique par chiffre", async () => {
    const Haptics = jest.requireMock<{ selectionAsync: jest.Mock }>("expo-haptics");
    Haptics.selectionAsync.mockClear();
    const { at } = await setup(repetitionParameters(10, 2, 20), null);
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    await press("execution-start");
    await at(10);
    await press("execution-pause");
    await press("execution-stop");
    await act(async () => {
      fireEvent(screen.getByTestId("execution-partial-frame").parent!, "layout", { nativeEvent: { layout: { width: 360, height: 56, x: 0, y: 0 } } });
    });
    expect(screen.getByTestId("execution-partial-frame")).toHaveStyle({ left: 0 });
    expect(screen.getByTestId("execution-partial-values").props.contentContainerStyle).toEqual(expect.arrayContaining([{ paddingLeft: 6, paddingRight: 310 }]));
    expect(screen.getByTestId("execution-partial-value-0").props.accessibilityState).toEqual({ selected: true });
    fireEvent.scroll(screen.getByTestId("execution-partial-values"), { nativeEvent: { contentOffset: { x: 44 * 3 + 10, y: 0 } } });
    expect(screen.getByTestId("execution-partial-value-3").props.accessibilityState).toEqual({ selected: true });
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    fireEvent.scroll(screen.getByTestId("execution-partial-values"), { nativeEvent: { contentOffset: { x: 44 * 3 - 10, y: 0 } } });
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  // Recette du 15/11/2026 (k8 : « la roulette horizontale ne marche pas comme celle de la Pause + Arrêt qui doit [être] identique »).
  it("Durée maximum atteinte : même roulette (cadre fixe, 0 au départ, jusqu'à 99, haptique), sans croix", async () => {
    const Haptics = jest.requireMock<{ selectionAsync: jest.Mock }>("expo-haptics");
    Haptics.selectionAsync.mockClear();
    const { at } = await setup();
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    await press("execution-start");
    await at(60);
    expect(screen.getByTestId("execution-closure")).toBeTruthy();
    expect(screen.getByTestId("execution-closure-frame")).toBeTruthy();
    expect(screen.getByTestId("execution-closure-value-0").props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByTestId("execution-closure-value-99")).toBeTruthy();
    expect(screen.queryByTestId("execution-partial-close")).toBeNull();
    fireEvent.scroll(screen.getByTestId("execution-closure-values"), { nativeEvent: { contentOffset: { x: 44 * 4, y: 0 } } });
    expect(screen.getByTestId("execution-closure-value-4").props.accessibilityState).toEqual({ selected: true });
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });
});
