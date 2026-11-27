import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { SessionSnapshot } from "@/domain/sessions/sessionSnapshot";
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
import type { ProgramService } from "@/features/programs/ProgramService";
import { ProgramServiceContext } from "@/features/programs/ProgramServiceContext";
import { SessionService } from "@/features/sessions/SessionService";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

import { compositionFingerprint, painColor, parsePain, sessionOutline, startScreenMode } from "../beforeSession";
import { BeforeSessionScreen } from "../BeforeSessionScreen";
import { nextInChain, parseChain, type ExecutionChain, type ExecutionOrigin } from "../executionChain";
import { CHAIN_AUTO_NEXT_MS, ExecutionScreen } from "../ExecutionScreen";
import { ExecutionService } from "../ExecutionService";
import { ExecutionServiceContext } from "../ExecutionServiceContext";
import { setStartScreenBackendForTests, startScreenStore } from "../startScreenStore";

/**
 * D-577 / D-427 (27/11/2026) — écran « Avant la séance » : liste, règles d'affichage (réglage global, case par séance), douleur
 * obligatoire avec l'option du Programme, version des séances suivantes, transmission de la douleur à la chaîne, accessibilité.
 * Aucun rendu iPhone n'est prouvé ici (voile, défilement réel, relief du bouton : à vérifier sur l'appareil).
 */

const calls: string[] = [];
const mockReplace = jest.fn((target: unknown) => calls.push(`replace ${JSON.stringify(target)}`));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: mockReplace, push: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn() }),
  useFocusEffect: (effect: () => void | (() => void)) => jest.requireActual<typeof import("react")>("react").useEffect(effect, [effect]),
}));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" } }));
jest.mock("expo-crypto", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  randomUUID: () => (require("node:crypto") as typeof import("node:crypto")).randomUUID(),
}));

// ————————————————————————————————————————————————————————— instantané de test
type Ex = { id: string; name: string; reps?: number };
const exercise = ({ id, name, reps = 10 }: Ex) => ({
  id,
  type: "EXERCISE",
  executionParameters: { reps },
  postActivityRecoverySeconds: null,
  format: null,
  exercise: { name, sourceMovementId: `mvt-${id}` },
});
function snapshot(elements: unknown[]): SessionSnapshot {
  return { snapshotVersion: 1, sessionId: "s1", name: "Mobilisation du genou", origin: null, initialCountdownSeconds: 3, finalPhaseSeconds: 0, structure: { elements, stopPoints: [] } } as unknown as SessionSnapshot;
}
const knee = (reps = 10, tabataTours = 8) =>
  snapshot([
    {
      kind: "CYCLE",
      cycle: {
        id: "y1",
        repeatCount: 2,
        members: [
          { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 3, nature: "TOURS", exercises: [exercise({ id: "a", name: "Squat assisté", reps }), exercise({ id: "b", name: "Extension du genou" })] } },
          {
            kind: "CIRCUIT",
            circuit: { id: "c2", repeatCount: tabataTours, nature: "SERIES", originModel: "TABATA", exercises: [exercise({ id: "c", name: "Fente avant" }), exercise({ id: "d", name: "Pont fessier" }), exercise({ id: "e", name: "Gainage latéral" })] },
          },
        ],
      },
    },
    { kind: "EXERCISE", exercise: exercise({ id: "f", name: "Étirement du quadriceps" }) },
  ]);

describe("liste de la séance (D-577)", () => {
  it("ordre de la composition, retrait par niveau, chiffre en premier, format en majuscules, « Circuit libre » sans format", () => {
    const lines = sessionOutline(knee());
    expect(lines.map((line) => [line.kind, line.depth, line.text])).toEqual([
      ["CYCLE", 0, "2 cycles"],
      ["CIRCUIT", 1, "3 tours · Circuit libre"],
      ["EXERCISE", 2, "Squat assisté"],
      ["EXERCISE", 2, "Extension du genou"],
      ["CIRCUIT", 1, "8 tours · TABATA"],
      ["EXERCISE", 2, "Fente avant"],
      ["EXERCISE", 2, "Pont fessier"],
      ["EXERCISE", 2, "Gainage latéral"],
      ["EXERCISE", 0, "Étirement du quadriceps"],
    ]);
    // Espaces DSF § 3 : 18 avant un circuit à format, 14 avant un circuit et avant l'exercice qui suit un bloc, 4 entre exercices.
    expect(lines.map((line) => line.spaceBefore)).toEqual([0, 4, 4, 4, 18, 4, 4, 4, 14]);
    // Ni durée ni nature (groupées / alternées).
    expect(lines.some((line) => /alternées|groupées|\d+\s*(min|s)\b/.test(line.text))).toBe(false);
  });

  it("empreinte : inchangée si seuls les paramètres d'exécution ou le nombre de tours/cycles changent ; changée si l'ordre ou le contenu change", () => {
    const base = compositionFingerprint(knee());
    expect(compositionFingerprint(knee(25))).toBe(base);
    // Réponse de Hermann du 27/11/2026 (point 4) : « changer le nombre de cycle ou de tour ne fait pas revenir l'écran ».
    expect(compositionFingerprint(knee(10, 6))).toBe(base);
    expect(compositionFingerprint(snapshot((knee().structure.elements as unknown[]).slice(0, 1)))).not.toBe(base);
    const reordered = snapshot([{ kind: "EXERCISE", exercise: exercise({ id: "f", name: "Étirement du quadriceps" }) }, ...((knee().structure.elements as unknown[]).slice(0, 1))]);
    expect(compositionFingerprint(reordered)).not.toBe(base);
  });
});

describe("règles d'affichage (D-577 point 7)", () => {
  const base = { showSetting: true, dismissedFingerprint: null, fingerprint: "F", painOption: false, rank: 1 };
  it("réglage global, case par séance, douleur seule, séances suivantes", () => {
    expect(startScreenMode(base)).toBe("FULL");
    expect(startScreenMode({ ...base, showSetting: false })).toBe("NONE");
    expect(startScreenMode({ ...base, dismissedFingerprint: "F" })).toBe("NONE");
    // Composition changée depuis la case : l'écran réapparaît.
    expect(startScreenMode({ ...base, dismissedFingerprint: "OLD" })).toBe("FULL");
    // La douleur ne dépend que du Programme : affichage désactivé → douleur seule.
    expect(startScreenMode({ ...base, painOption: true })).toBe("FULL");
    expect(startScreenMode({ ...base, painOption: true, showSetting: false })).toBe("PAIN_ONLY");
    expect(startScreenMode({ ...base, painOption: true, dismissedFingerprint: "F" })).toBe("PAIN_ONLY");
    expect(startScreenMode({ ...base, rank: 2 })).toBe("NEXT");
    expect(startScreenMode({ ...base, rank: 3, showSetting: false })).toBe("NONE");
  });

  it("douleur transmise à la chaîne par la route ; jamais 0 par défaut", () => {
    expect(nextInChain({ sessionIds: ["a", "b", "c"], rank: 1 }, null, 4)).toEqual({ sessionId: "b", chain: "a,b,c", rank: "2", pain: "4" });
    expect(nextInChain({ sessionIds: ["a", "b", "c"], rank: 2 }, null, 4)).toEqual({ sessionId: "c", chain: "a,b,c", rank: "3", pain: "4" });
    expect(nextInChain({ sessionIds: ["a", "b"], rank: 1 }, null, null)).toEqual({ sessionId: "b", chain: "a,b", rank: "2" });
    expect(parsePain("0")).toBe(0);
    expect(parsePain("10")).toBe(10);
    expect(parsePain(undefined)).toBeNull();
    expect(parsePain("")).toBeNull();
    expect(parsePain("11")).toBeNull();
  });

  it("couleurs de l'échelle : vert, jaune au milieu, rouge", () => {
    expect([painColor(0), painColor(5), painColor(10)]).toEqual(["#2EA85C", "#FAD133", "#DB332E"]);
  });
});

// ————————————————————————————————————————————————————————— composant
describe("BeforeSessionScreen (D-577, D-427)", () => {
  const lines = sessionOutline(knee());
  const renderScreen = (props: Partial<Parameters<typeof BeforeSessionScreen>[0]> = {}) => {
    const onStart = jest.fn();
    render(
      <TestSafeAreaProvider>
        <BeforeSessionScreen mode="FULL" title="Mobilisation du genou" lines={lines} painOption={false} startLabel="Appuyer pour démarrer la séance" onBack={jest.fn()} onStart={onStart} {...props} />
      </TestSafeAreaProvider>,
    );
    return onStart;
  };

  it("option douleur : aucune présélection, bouton inactif sans choix, actif après choix ; pas de case « Ne plus afficher »", () => {
    const onStart = renderScreen({ painOption: true });
    const button = screen.getByTestId("execution-start");
    expect(button.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    expect(button.props.accessibilityLabel).toBe("Appuyer pour démarrer la séance. Choisissez d’abord la douleur ressentie");
    for (let value = 0; value <= 10; value += 1) expect(screen.getByTestId(`before-session-pain-${value}`).props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
    fireEvent.press(button);
    expect(onStart).not.toHaveBeenCalled();
    expect(screen.queryByTestId("before-session-dismiss")).toBeNull();
    // Correction du 27/11/2026 (DSF § 4-5) : un seul cadre (liste, trait fin, douleur) ; Bouton primaire du Design system, état Désactivé.
    // [Bouton à relief 354 × 96, gris #CCD4D1 inactif — remplacé.]
    expect(StyleSheet.flatten(button.props.style).backgroundColor).toBe(colors.disabled);
    expect(screen.getByTestId("before-session-pain-separator")).toBeTruthy();
    expect(screen.getAllByTestId("before-session-list-card")).toHaveLength(1);
    fireEvent.press(screen.getByTestId("before-session-pain-3"));
    expect(screen.getByTestId("before-session-pain-3").props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    expect(StyleSheet.flatten(screen.getByTestId("before-session-pain-3").props.style)).toEqual(expect.objectContaining({ width: 40, height: 58 }));
    expect(screen.getByTestId("execution-start").props.accessibilityState).toEqual(expect.objectContaining({ disabled: false }));
    fireEvent.press(screen.getByTestId("execution-start"));
    expect(onStart).toHaveBeenCalledWith(3, false);
  });

  it("accessibilité de l'échelle : chiffre annoncé, rôle radio, groupe nommé ; le chiffre est toujours écrit", () => {
    renderScreen({ painOption: true });
    expect(screen.getByTestId("before-session-pain-scale").props.accessibilityRole).toBe("radiogroup");
    const cell = screen.getByTestId("before-session-pain-7");
    expect(cell.props.accessibilityRole).toBe("radio");
    expect(cell.props.accessibilityLabel).toBe("Douleur 7 sur 10");
    expect(screen.getByText("7")).toBeTruthy();
  });

  it("sans option douleur : pas d'échelle, bouton actif, case « Ne plus afficher cet écran » transmise au départ", () => {
    const onStart = renderScreen();
    expect(screen.queryByTestId("before-session-pain-scale")).toBeNull();
    expect(screen.getByTestId("execution-start").props.accessibilityState).toEqual(expect.objectContaining({ disabled: false }));
    // Correction du 27/11/2026 (DSF § 6) : case dans le second cadre accroché sous le cadre principal (#0D6950).
    expect(StyleSheet.flatten(screen.getByTestId("before-session-attached").props.style).backgroundColor).toBe("#0D6950");
    fireEvent.press(screen.getByTestId("before-session-dismiss"));
    expect(screen.getByTestId("before-session-dismiss").props.accessibilityState).toEqual({ checked: true });
    fireEvent.press(screen.getByTestId("execution-start"));
    expect(onStart).toHaveBeenCalledWith(null, true);
  });

  it("titre hors de la zone qui défile ; la liste seule défile (ScrollView native)", () => {
    renderScreen();
    const list = screen.getByTestId("before-session-list");
    expect(list.type).toBe("RCTScrollView");
    expect(screen.getByTestId("before-session-title").props.children).toBe("Mobilisation du genou");
    expect(() => screen.getByTestId("before-session-title", { exact: true })).not.toThrow();
    // Le titre n'est pas un descendant de la liste.
    const inList = (node: { parent: unknown; props: { testID?: string } } | null): boolean => (node === null ? false : node.props.testID === "before-session-list" || inList(node.parent as never));
    expect(inList(screen.getByTestId("before-session-title") as never)).toBe(false);
    expect(inList(screen.getByTestId("before-session-line-c:c2") as never)).toBe(true);
  });

  it("séances suivantes : un seul cadre, pas d'échelle même avec l'option, libellé au rang", () => {
    const onStart = renderScreen({ mode: "NEXT", painOption: true, startLabel: "Appuyer pour démarrer la 2ème séance" });
    expect(screen.getAllByTestId("before-session-list-card")).toHaveLength(1);
    expect(screen.queryByTestId("before-session-start-card")).toBeNull();
    expect(screen.queryByTestId("before-session-attached")).toBeNull();
    expect(screen.queryByTestId("before-session-pain-scale")).toBeNull();
    expect(screen.getByTestId("before-session-start-label").props.children).toBe("Appuyer pour démarrer la 2ème séance");
    fireEvent.press(screen.getByTestId("execution-start"));
    expect(onStart).toHaveBeenCalledWith(null, false);
  });

  it("douleur seule : le cadre vert ne porte que la zone douleur ; bouton hors du cadre", () => {
    renderScreen({ mode: "PAIN_ONLY", painOption: true });
    expect(screen.queryByTestId("before-session-title")).toBeNull();
    expect(screen.queryByTestId("before-session-list")).toBeNull();
    expect(screen.queryByTestId("before-session-pain-separator")).toBeNull();
    expect(screen.getByTestId("before-session-pain-scale")).toBeTruthy();
    const inCard = (node: { parent: unknown; props: { testID?: string } } | null): boolean => (node === null ? false : node.props.testID === "before-session-list-card" || inCard(node.parent as never));
    expect(inCard(screen.getByTestId("execution-start") as never)).toBe(false);
  });

  it("voiles : blanc 50 % puis vert #1F9E7A à 35 %", () => {
    renderScreen();
    expect(StyleSheet.flatten(screen.getByTestId("before-session-white-veil").props.style).backgroundColor).toBe("rgba(255, 255, 255, 0.5)");
    expect(StyleSheet.flatten(screen.getByTestId("before-session-green-veil").props.style).backgroundColor).toBe("rgba(31, 158, 122, 0.35)");
  });
});

// ————————————————————————————————————————————————————————— écran d'exécution
const S = 1000;
const T0 = Date.UTC(2026, 10, 27, 8, 0, 0);

async function setup() {
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const sessionService = new SessionService(new SqliteSessionRepository(database), new SqliteCategoryRepository(database));
  const create = async (name: string, seconds = 5) => {
    const created = await sessionService.createSession(
      withLocalMovements({
        ...createEmptyDraft(),
        name,
        initialCountdownSeconds: 3,
        finalPhaseSeconds: 0,
        exercises: [{ ...createExerciseDraft(`${name}-a`), name: `${name} A`, structuralPosition: "BEFORE_TOUR", executionParameters: durationParameters(seconds, 1, 0) }],
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
  const profileService = new ProfileService(new SqliteProfileRepository(database));
  const value = { service, signals: new ExecutionSignalAdapter(), screenAwake: { keepAwake: () => undefined } };
  const painOptionFor = jest.fn(async () => false);
  const recordPainBefore = jest.fn(async (_executionId: string, _value: number) => undefined);
  const finalizeExecution = jest.fn(async (_feedback: unknown) => undefined);
  const programService = { painOptionFor, recordPainBefore, finalizeExecution } as unknown as ProgramService;

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

  const show = (sessionId: string, chain: ExecutionChain | null = null, origin: ExecutionOrigin | null = null, chainPain: number | null = null) =>
    render(<ExecutionScreen key={`${sessionId}|${chain?.rank ?? 0}`} sessionId={sessionId} chain={chain} origin={origin} chainPain={chainPain} />, { wrapper: Wrapper });
  return { service, advance, show, first, second, sessionService, painOptionFor, recordPainBefore, finalizeExecution };
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
    await new Promise((resolve) => setImmediate(resolve));
  });
}

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setImmediate(resolve));
  });
}

describe("ExecutionScreen — écran « Avant la séance » (D-577)", () => {
  let files: Map<string, string>;
  beforeEach(() => {
    calls.length = 0;
    mockReplace.mockClear();
    files = new Map();
    setStartScreenBackendForTests({ read: () => files.get("f") ?? null, write: (content) => void files.set("f", content) });
  });
  afterEach(() => {
    setStartScreenBackendForTests();
    jest.restoreAllMocks();
  });

  it("séance seule : écran affiché sur l'écran d'exécution en fond, titre = nom de la séance ; le départ lance la séance", async () => {
    const { service, show, first } = await setup();
    const view = show(first);
    expect(await screen.findByTestId("before-session-FULL")).toBeTruthy();
    expect(screen.getByTestId("execution-running", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId("before-session-title").props.children).toBe("Alpha");
    expect(screen.getByTestId("before-session-start-label").props.children).toBe("Appuyer pour démarrer la séance");
    expect(service.current()).toBeNull();
    await press("execution-start");
    expect(service.current()?.plan.sessionName).toBe("Alpha");
    expect(screen.queryByTestId("before-session")).toBeNull();
    view.unmount();
  });

  it("réglage global désactivé, sans option douleur : aucun écran, la séance démarre aussitôt", async () => {
    startScreenStore.setShowStartScreen(false);
    const { service, show, first } = await setup();
    const view = show(first);
    await screen.findByTestId("execution-running");
    await settle();
    expect(screen.queryByTestId("before-session")).toBeNull();
    expect(service.current()?.plan.sessionName).toBe("Alpha");
    view.unmount();
  });

  it("case « Ne plus afficher » : écran masqué pour cette séance seulement ; réapparaît quand le contenu change, pas quand seuls les paramètres changent", async () => {
    const ctx = await setup();
    let view = ctx.show(ctx.first);
    await screen.findByTestId("before-session-FULL");
    await press("before-session-dismiss");
    await press("execution-start");
    view.unmount();
    await ctx.advance(20);
    ctx.service.release();

    // Même séance : pas d'écran. Autre séance : écran.
    view = ctx.show(ctx.first);
    await screen.findByTestId("execution-running");
    await settle();
    expect(screen.queryByTestId("before-session")).toBeNull();
    view.unmount();
    await ctx.advance(20);
    ctx.service.release();
    view = ctx.show(ctx.second);
    expect(await screen.findByTestId("before-session-FULL")).toBeTruthy();
    view.unmount();
    // Empreinte enregistrée pour la première séance seulement (paramètres d'exécution sans effet : test de l'empreinte ci-dessus).
    expect(startScreenStore.dismissedFingerprint(ctx.first)).not.toBeNull();
    expect(startScreenStore.dismissedFingerprint(ctx.second)).toBeNull();
  });

  it("option douleur du Programme : échelle obligatoire ; affichage désactivé → douleur seule (jamais supprimée)", async () => {
    const ctx = await setup();
    ctx.painOptionFor.mockResolvedValue(true);
    startScreenStore.setShowStartScreen(false);
    const view = ctx.show(ctx.first, null, { routineId: "r1", occurrenceKey: "2026-11-27T08:00" });
    expect(await screen.findByTestId("before-session-PAIN_ONLY")).toBeTruthy();
    expect(ctx.painOptionFor).toHaveBeenCalledWith("r1", "2026-11-27T08:00");
    await press("execution-start");
    expect(ctx.service.current()).toBeNull();
    expect(ctx.recordPainBefore).not.toHaveBeenCalled();
    await press("before-session-pain-0");
    await press("execution-start");
    expect(ctx.service.current()?.plan.sessionName).toBe("Alpha");
    // Réponse de Hermann du 27/11/2026 (« Oui il faut la stocker ») : 0 choisi explicitement est enregistré sur l'Exécution.
    expect(ctx.recordPainBefore).toHaveBeenCalledWith(ctx.service.current()?.executionId, 0);
    view.unmount();
  });

  it("lancement hors Agenda : jamais d'échelle (D-427), même si le Programme la demanderait", async () => {
    const ctx = await setup();
    ctx.painOptionFor.mockResolvedValue(true);
    const view = ctx.show(ctx.first);
    expect(await screen.findByTestId("before-session-FULL")).toBeTruthy();
    expect(screen.queryByTestId("before-session-pain-scale")).toBeNull();
    expect(ctx.painOptionFor).not.toHaveBeenCalled();
    view.unmount();
  });

  it("parcours : la douleur saisie en première séance est transmise à la séance suivante ; la suivante n'a pas d'échelle", async () => {
    const ctx = await setup();
    ctx.painOptionFor.mockResolvedValue(true);
    const origin = { routineId: "r1", occurrenceKey: "2026-11-27T08:00" };
    const chain = parseChain(ctx.first, `${ctx.first},${ctx.second}`, "1")!;
    const view = ctx.show(ctx.first, chain, origin);
    expect(await screen.findByTestId("before-session-pain-scale")).toBeTruthy();
    expect(screen.getByTestId("before-session-start-label").props.children).toBe("Appuyer pour démarrer le parcours");
    // Réponse de Hermann du 27/11/2026 (point 3) : titre = nom de la séance, même pour la première séance d'un parcours.
    expect(screen.getByTestId("before-session-title").props.children).toBe("Alpha");
    await press("before-session-pain-6");
    await press("execution-start");
    expect(ctx.recordPainBefore).toHaveBeenCalledWith("exec-1", 6);
    await ctx.advance(20);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, CHAIN_AUTO_NEXT_MS + 100));
    });
    expect(calls).toEqual([
      `replace ${JSON.stringify({ pathname: "/execution", params: { sessionId: ctx.second, chain: `${ctx.first},${ctx.second}`, rank: "2", routineId: "r1", occurrence: "2026-11-27T08:00", pain: "6" } })}`,
    ]);
    view.unmount();

    const next = ctx.show(ctx.second, parseChain(ctx.second, `${ctx.first},${ctx.second}`, "2"), origin, 6);
    expect(await screen.findByTestId("before-session-NEXT")).toBeTruthy();
    expect(screen.queryByTestId("before-session-pain-scale")).toBeNull();
    await press("execution-start");
    // La douleur saisie une fois est enregistrée aussi sur l'Exécution de la séance suivante.
    expect(ctx.recordPainBefore).toHaveBeenLastCalledWith("exec-2", 6);
    expect(ctx.recordPainBefore).toHaveBeenCalledTimes(2);
    next.unmount();
  });

  it("écran revenu après exclusion (composition changée) : case « Ne plus afficher » cochée par défaut ; décochée au départ, l'exclusion est retirée", async () => {
    const ctx = await setup();
    startScreenStore.dismiss(ctx.first, "EMPREINTE-ANCIENNE");
    let view = ctx.show(ctx.first);
    expect(await screen.findByTestId("before-session-FULL")).toBeTruthy();
    expect(screen.getByTestId("before-session-dismiss").props.accessibilityState).toEqual({ checked: true });
    await press("execution-start");
    // Cochée au départ : nouvelle empreinte enregistrée.
    expect(startScreenStore.dismissedFingerprint(ctx.first)).not.toBe("EMPREINTE-ANCIENNE");
    view.unmount();
    await ctx.advance(20);
    ctx.service.release();

    startScreenStore.dismiss(ctx.first, "EMPREINTE-ANCIENNE");
    view = ctx.show(ctx.first);
    await screen.findByTestId("before-session-FULL");
    await press("before-session-dismiss");
    await press("execution-start");
    expect(startScreenStore.dismissedFingerprint(ctx.first)).toBeNull();
    view.unmount();
  });

  it("aucune douleur sans option : rien n'est enregistré", async () => {
    const ctx = await setup();
    const view = ctx.show(ctx.first);
    await screen.findByTestId("before-session-FULL");
    expect(screen.getByTestId("before-session-dismiss").props.accessibilityState).toEqual({ checked: false });
    await press("execution-start");
    expect(ctx.recordPainBefore).not.toHaveBeenCalled();
    view.unmount();
  });
  it("D-578 : fin de séance — écran « Séance terminée » ; Enregistrer finalise l’Exécution (ressenti, commentaire, douleur après) puis quitte", async () => {
    const ctx = await setup();
    ctx.painOptionFor.mockResolvedValue(true);
    const origin = { routineId: "r1", occurrenceKey: "2026-11-27T08:00" };
    const view = ctx.show(ctx.first, null, origin);
    await screen.findByTestId("before-session-FULL");
    await press("before-session-pain-2");
    await press("execution-start");
    await ctx.advance(20);
    expect(screen.getByTestId("end-session-COMPLETED")).toBeTruthy();
    expect(screen.getByTestId("end-session-title").props.children).toBe("Séance terminée");
    expect(screen.getByTestId("end-session-exercises").props.children).toBe("1 / 1");
    expect(screen.getByTestId("end-session-pain-scale")).toBeTruthy();
    await press("end-session-feeling-GOOD");
    await press("end-session-pain-1");
    await press("end-session-save");
    expect(ctx.finalizeExecution).toHaveBeenCalledWith({ executionId: "exec-1", feeling: "GOOD", comment: null, painAfter: 1 });
    expect(ctx.service.current()).toBeNull();
    view.unmount();
  });

  it("D-580 : arrêt volontaire — écran « Séance arrêtée » (rouge)", async () => {
    const ctx = await setup();
    const view = ctx.show(ctx.first);
    await screen.findByTestId("before-session-FULL");
    await press("execution-start");
    await ctx.advance(4);
    await press("execution-pause");
    await press("execution-stop");
    expect(screen.getByTestId("end-session-STOPPED")).toBeTruthy();
    expect(screen.getByTestId("end-session-title").props.children).toBe("Séance arrêtée");
    expect(screen.queryByTestId("end-session-pain-scale")).toBeNull();
    view.unmount();
  });
});
