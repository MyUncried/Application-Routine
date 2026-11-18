import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { exerciseActivity, structuredSession } from "@/domain/execution/testing/simulation";
import type { ForTimeResult } from "@/domain/execution/policies/forTime";
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
 * Registre ch07, « For time — exécution : exercices en durée, « + Tour », sans Pause » (Hermann, 16/11/2026) ; Formats §11.1 ;
 * mission FORTIME-EXEC-DUREE (règles 1 à 6). Cas de Hermann : squat 15 rép., planche 2 min, pompes 10 rép., 3 tours.
 * Aucun contrôle visuel : couleurs et positions se vérifient sur iPhone.
 */

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() }),
  useFocusEffect: (effect: () => void | (() => void)) => jest.requireActual<typeof import("react")>("react").useEffect(effect, [effect]),
}));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" } }));

const S = 1000;
const T0 = Date.UTC(2026, 10, 17, 9, 0, 0);

async function setup(capSeconds: number | null = null) {
  jest.spyOn(AppState, "addEventListener").mockImplementation(((_type: string, _listener: (state: AppStateStatus) => void) => ({ remove: () => undefined })) as never);
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const member = (id: string, parameters: ReturnType<typeof repetitionParameters>) => exerciseActivity(id, parameters, { format: { key: "FOR_TIME", settings: {} } });
  const session = structuredSession(
    {
      elements: [
        {
          kind: "CIRCUIT",
          circuit: {
            id: "c",
            repeatCount: 3,
            nature: "SERIES",
            format: { key: "FOR_TIME", settings: { restBetweenRoundsSeconds: 0, ...(capSeconds === null ? {} : { timeCapSeconds: capSeconds }) } },
            exercises: [member("squat", repetitionParameters(15, 3, 0)), member("planche", durationParameters(120, 3, 0)), member("pompes", repetitionParameters(10, 3, 0))],
          },
        },
      ],
      stopPoints: [],
    },
    { name: "For time jambes" },
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
  const service = new ExecutionService({ repository, clock, scheduler, newId: () => "exec-ftd", loadSession: async () => session });
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
  await act(async () => {
    fireEvent(screen.getByTestId("execution-ring-area"), "layout", { nativeEvent: { layout: { width: 398, height: 340, x: 0, y: 0 } } });
  });
  return { service, at, repository };
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
    await new Promise((resolve) => setImmediate(resolve));
  });
}

const disabled = (testID: string) => screen.getByTestId(testID).props.accessibilityState?.disabled === true;

describe("For time — exercices en durée à l'écran (16/11/2026)", () => {
  it("squat : aucun texte de lancement ; appui dans le cercle : planche en cours, décompte dans le coin ; retenue ; reprise ; à 00:00, pompes et + Tour actif", async () => {
    const { at, service } = await setup();
    // État initial (règle 3) : objectif en rép. en haut à gauche, mention de lancement, « + Tour » désactivé.
    expect(screen.getByTestId("execution-objective")).toHaveTextContent("15rép.");
    // Recette du 17/11/2026 (Hermann : « Supprimer le texte "Appuyer pour lancer..." »). [« Appuyez pour lancer Mouvement planche » — remplacé.]
    expect(screen.queryByTestId("execution-duration-mention")).toBeNull();
    // Recette du 17/11/2026 (ftr2-regle-suivant : « désactiver l'appui sur le cercle lorsque rien n'est écrit »).
    expect(screen.queryByTestId("execution-duration-zone")).toBeNull();
    // Recette du 17/11/2026 (ft-barre) : avant le dernier exercice du tour, « Suivant » (72) à la place de « + Tour ». Mission du
    // 17/11/2026, règle 7 : actif, il lance la planche « comme un appui sur le cercle ». [Désactivé tant que la planche reste à
    // lancer — remplacé.]
    expect(screen.queryByTestId("execution-plus-tour")).toBeNull();
    expect(disabled("execution-for-time-next")).toBe(false);
    await at(20);
    await press("execution-for-time-next");
    expect(service.project()?.exerciseName).toBe("Mouvement planche");
    expect(screen.getByTestId("execution-duration-countdown")).toHaveTextContent("02:00");
    expect(screen.getByTestId("execution-duration-mention")).toHaveTextContent("Appuyez pour faire pause");
    // Règle 8 : exercice en durée du tour qui n'est pas le dernier — « + Tour » inactif. [Suivant inactif — remplacé.]
    expect(screen.queryByTestId("execution-for-time-next")).toBeNull();
    expect(disabled("execution-plus-tour")).toBe(true);
    await at(50);
    expect(service.project()?.format?.duration?.remainingMs).toBe(90 * S);
    await press("execution-duration-zone"); // retenue
    expect(screen.getByTestId("execution-duration-mention")).toHaveTextContent("Appuyez pour repartir");
    await at(70);
    // Le décompte est figé, le chrono du For time continue.
    expect(service.project()?.format?.duration?.remainingMs).toBe(90 * S);
    expect(service.project()?.format?.duration?.state).toBe("HELD");
    expect(service.project()?.timer).toEqual({ kind: "STOPWATCH", elapsedMs: 70 * S, nominalMs: null });
    await press("execution-duration-zone"); // reprise
    await at(160);
    expect(service.project()?.exerciseName).toBe("Mouvement pompes");
    expect(screen.queryByTestId("execution-duration-countdown")).toBeNull();
    // Mission du 17/11/2026 : « aucun texte dans les autres cas ». [« Appuyez à chaque tour terminé » — remplacé.]
    expect(screen.queryByTestId("execution-duration-mention")).toBeNull();
    expect(disabled("execution-plus-tour")).toBe(false);
    await press("execution-plus-tour");
    expect(service.project()).toMatchObject({ exerciseName: "Mouvement squat", tour: { current: 2, total: 3 } });
  });

  // Recette du 17/11/2026 (ftr2-modale-duree : « il faut remettre la modale d'arrêt de confirmation de la durée retenue » ; autres
  // remarques, b : titre « Durée tenue », une seule ligne nom et durée, boutons annuler et valider).
  it("Arrêt pendant la planche : modale « Durée tenue » sans Pause ; validée, la durée tenue est enregistrée", async () => {
    const { at, service, repository } = await setup();
    await at(10);
    await press("execution-for-time-next");
    await at(55);
    await press("execution-stop");
    expect(service.project()?.status).toBe("RUNNING");
    // Troisième recette du 17/11/2026 (ftr3-modale-duree : « Arrêt en durée : Titre : Arrêt du For Time ; Deux boutons Annuler et Valider ;
    // Nom de l'exercice ; Objectif : 00:00 ; Résultat : Durée de l'appui sur le bouton d'arrêt »). [« Durée tenue », nom et durée sur
    // une ligne — remplacé.]
    expect(screen.getByTestId("execution-partial-title")).toHaveTextContent("Arrêt du For Time");
    expect(screen.getByTestId("execution-partial-name")).toHaveTextContent("Mouvement planche");
    expect(screen.getByTestId("execution-partial-target")).toHaveTextContent("Objectif02:00");
    expect(screen.getByTestId("execution-partial-held")).toHaveTextContent("Résultat00:45");
    expect(screen.getByTestId("execution-partial-cancel")).toBeTruthy();
    await press("execution-partial-validate");
    expect(screen.getByTestId("execution-end")).toBeTruthy();
    const results = await repository.listResults("exec-ftd");
    const element = results.find((change) => change.type === "SCOPE" && (change.result as { format?: string }).format === "FOR_TIME");
    expect(element?.result as ForTimeResult).toMatchObject({ completedActivities: 1, partialRepetitions: null, partialDurationMs: 45 * S });
  });

  // Recette du 17/11/2026 (ftr2-modale-borne : « il faut s'arrêter sur la fin du dernier exercice et ne pas changer d'écran ; il faut aller
  // directement à la synthèse de la séance quand on ferme la modale, ne pas exécuter le compte à rebours de la fin de séance »).
  it("Arrêt, modale laissée ouverte jusqu'à la fin du For time : écran figé sur le dernier exercice, aucune fin de séance ; la coche mène à la synthèse", async () => {
    const { at, service } = await setup();
    await at(5);
    await press("execution-for-time-next"); // planche du tour 1
    await at(10);
    await press("execution-stop");
    // On laisse filer : la planche s'achève, les pompes s'ouvrent ; on va jusqu'au bout du For time sans valider.
    await at(130);
    expect(screen.getByTestId("execution-title").props.children).toBe("Mouvement planche");
    expect(screen.getByTestId("execution-partial-title")).toHaveTextContent("Arrêt du For Time");
    expect(screen.queryByTestId("execution-closure")).toBeNull();
    await press("execution-partial-validate");
    expect(screen.getByTestId("execution-end")).toBeTruthy();
    expect(service.current()?.state.finish).toMatchObject({ reason: "STOPPED", atMs: expect.any(Number) });
  });

  // Recette du 18/11/2026 (Hermann, For time arrêté par la limite de temps pendant un exercice en répétitions : « Je ne veux pas de cet
  // écran résultat à la fin » ; « Je ne veux pas de fin de séance lorsqu'on a validé la modale »).
  it("Durée maximum pendant le squat : l'écran reste sur le squat, la validation mène directement à la synthèse", async () => {
    const { at, service } = await setup(30);
    await at(5);
    await at(40); // Durée maximum atteinte pendant le squat
    expect(screen.getByTestId("execution-closure")).toBeTruthy();
    expect(screen.getByTestId("execution-title")).not.toHaveTextContent("Résultat");
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Mouvement squat");
    await press("execution-closure-validate");
    expect(screen.queryByTestId("execution-closure")).toBeNull();
    expect(screen.getByTestId("execution-end")).toBeTruthy();
    expect(service.current()?.state.finish).toMatchObject({ reason: "COMPLETED" });
  });

  // Recette du 18/11/2026 (Hermann, borne pendant un exercice en durée : « il remet le compte à rebours de durée à l'objectif, et remplis
  // l'anneau en vert. Il ne faut pas »).
  it("Durée maximum pendant la planche : décompte figé à l'instant de la borne, pas remis à l'objectif", async () => {
    const { at } = await setup(60);
    await at(20);
    await press("execution-for-time-next"); // planche lancée à 20 s
    await at(75); // borne à 60 s : 40 s tenues
    expect(screen.getByTestId("execution-closure")).toBeTruthy();
    expect(screen.getByTestId("execution-title")).toHaveTextContent("Mouvement planche");
    expect(screen.getByTestId("execution-duration-countdown")).toHaveTextContent("01:20");
    expect(screen.getByTestId("execution-closure-held-value")).toHaveTextContent("00:40");
  });

  // Troisième recette du 17/11/2026 (ftr3-modale-figee : « l'appuie sur la croix amène directement à l'écran de synthèse de la séance »).
  it("écran figé : la croix mène directement à la synthèse (ni fenêtre Résultat, ni fin de séance)", async () => {
    const { at } = await setup();
    await at(5);
    await press("execution-for-time-next");
    await at(10);
    await press("execution-stop");
    await at(130); // la planche s'est achevée derrière la modale : écran figé
    expect(screen.getByTestId("execution-title").props.children).toBe("Mouvement planche");
    await press("execution-partial-cancel");
    expect(screen.getByTestId("execution-end")).toBeTruthy();
  });


});
