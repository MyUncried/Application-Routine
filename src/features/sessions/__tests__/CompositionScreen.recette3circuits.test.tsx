import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Platform, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SessionStructure, StructureElement, StructureStopPointLocation } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { CIRCUIT_NATURE_PANEL_GAP } from "@/features/sessions/CircuitNatureMenu";
import { LONG_PRESS_DELAY_MS } from "@/features/sessions/compositionGesture";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";
import { toVerifyColors } from "@/shared/ui/toVerifyColors";

/**
 * PRE-9 — recette iPhone n° 3 du 03/11/2026 (autres constats, Composition de séance) : appui long actif
 * sur toute la surface d'un Circuit (point 4) ; Circuit replié teinté comme ses cartes à compléter ou à
 * vérifier (point 3). Harnais repris de B.4 ; mesures injectées. Jest ne prouve ni le rendu ni le geste
 * sur iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactActual = require("react") as typeof import("react");
  return {
    ...actual,
    useRouter: () => ({ push: jest.fn(), back: jest.fn(), dismissTo: jest.fn() }),
    useFocusEffect: (callback: () => void) => {
      ReactActual.useEffect(() => callback(), []);
    },
  };
});
const mockExitGuard = jest.fn();
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: (shouldBlock: boolean, onConfirmExit: () => void) => mockExitGuard(shouldBlock, onConfirmExit),
}));

const activityDefinitionService = {
  listBodyZones: jest.fn(async () => []),
  listLabels: jest.fn(async () => []),
  listCategories: jest.fn(async () => []),
} as unknown as ActivityDefinitionService;
const referentialService = { listLabels: jest.fn(async () => []) } as unknown as ReferentialService;

const probe: { draft: SessionDraft | null } = { draft: null };

function DraftHost({ initial, children }: { initial: SessionDraft; children: ReactNode }) {
  const [draft, setDraft] = useState(initial);
  useLayoutEffect(() => {
    probe.draft = draft;
  });
  const value = useMemo<SessionDraftContextValue>(
    () => ({
      draft,
      updateDraft: (update: SessionDraftUpdate) =>
        setDraft((current) => ({ ...current, ...(typeof update === "function" ? update(current) : update) })),
      resetDraft: jest.fn(),
    }),
    [draft],
  );
  return <SessionDraftContext.Provider value={value}>{children}</SessionDraftContext.Provider>;
}

async function renderComposition(draft: SessionDraft) {
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={activityDefinitionService}>
        <ReferentialServiceContext.Provider value={referentialService}>
          <DraftHost initial={draft}>
            <CompositionScreen />
          </DraftHost>
        </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await act(async () => undefined);
}

function exercise(id: string, seriesCount = 1): SessionDraftExercise {
  return {
    ...createExerciseDraft(id, 0),
    name: `Exercice ${id}`,
    structuralPosition: "BEFORE_TOUR",
    executionParameters: durationParameters(30, seriesCount),
  };
}

type Layout = SessionStructure<string, StructureStopPointLocation>;

/** e0, Circuit A groupé × 1 [a1, a2], Circuit B alterné × 2 [b1], e9. */
const twoCircuits: Layout = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1", "a2"] } },
    { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 2, nature: "SERIES", exercises: ["b1"] } },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [],
};

function draftOf(structure: Layout, exercises: readonly SessionDraftExercise[]): SessionDraft {
  return withLocalMovements({ name: "Séance", labelId: null, initialCountdownSeconds: 10, finalPhaseSeconds: 5, exercises, structure });
}

const twoCircuitsDraft = (overrides: Partial<Record<string, SessionDraftExercise>> = {}) =>
  draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"].map((id) => overrides[id] ?? exercise(id, id === "b1" ? 2 : 1)));

const hidden = { includeHiddenElements: true } as const;

function layout(testID: string, y: number, height: number) {
  fireEvent(screen.getByTestId(testID, hidden), "layout", { nativeEvent: { layout: { x: 0, y, width: 354, height } } });
}

/**
 * Mesures (repère du contenu défilant) : e0 0–80 ; Circuit A 100–320 (en-tête 114–132, cartes a1
 * 141–221, a2 230–310) ; Circuit B 340–470 (en-tête 354–372, carte b1 381–461) ; e9 490–570.
 */
function measureTwoCircuits() {
  layout("composition-layout-exercise-e0", 0, 80);
  layout("composition-layout-circuit-ca", 100, 220);
  layout("composition-layout-circuit-ca-header", 14, 18);
  layout("composition-layout-circuit-ca-exercises", 41, 169);
  layout("composition-activity-a1", 0, 80);
  layout("composition-activity-a2", 89, 80);
  layout("composition-layout-circuit-cb", 340, 130);
  layout("composition-layout-circuit-cb-header", 14, 18);
  layout("composition-layout-circuit-cb-exercises", 41, 80);
  layout("composition-activity-b1", 0, 80);
  layout("composition-layout-exercise-e9", 490, 80);
}

function shape(draft: SessionDraft | null): string {
  return (draft?.structure?.elements ?? [])
    .map((element: StructureElement<string>) =>
      element.kind === "EXERCISE"
        ? element.exercise
        : element.kind === "CIRCUIT"
          ? `${element.circuit.id}[${element.circuit.exercises.join(",")}]`
          : `${element.cycle.id}{…}`,
    )
    .join(" ");
}

let originalPlatformOS: typeof Platform.OS;
beforeAll(() => {
  originalPlatformOS = Platform.OS;
  Platform.OS = "ios";
});
afterAll(() => {
  Platform.OS = originalPlatformOS;
});
beforeEach(() => {
  mockExitGuard.mockReset();
  mockExitGuard.mockReturnValue({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() });
});

/** Attente réelle (minuterie de l'appui long de surface). */
async function wait(ms: number) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

function withPhases(durations: readonly number[]): ExecutionParameters {
  const base = durationParameters(30, 2, 10);
  return {
    ...base,
    series: { ...base.series, workPhases: durations.map((durationSeconds, index) => ({ id: index + 1, label: `P${index + 1}`, durationSeconds })) },
  } as ExecutionParameters;
}

describe("Recette iPhone n° 3 du 03/11/2026 — Circuits de la Composition", () => {
  it("point 4 : appui long sur la SURFACE du Circuit (hors en-tête et cartes) — le Circuit entier se déplace", async () => {
    await renderComposition(twoCircuitsDraft());
    measureTwoCircuits();
    const block = screen.getByTestId("composition-layout-circuit-cb", hidden);
    // Le bloc prend un toucher qu'aucun descendant n'a pris (marge, écart entre cartes).
    expect(block.props.onStartShouldSetResponder()).toBe(true);
    fireEvent(block, "touchStart", { nativeEvent: { pageX: 100, pageY: 466 } });
    fireEvent(block, "responderGrant", { nativeEvent: { pageX: 100, pageY: 466 } });
    // Avant le délai : rien.
    await wait(LONG_PRESS_DELAY_MS / 2);
    expect(screen.getByTestId("composition-layout-circuit-cb-header-collapse").props.accessibilityState).toMatchObject({ expanded: true });
    await wait(LONG_PRESS_DELAY_MS / 2 + 50);
    // Saisi : le Circuit déployé est replié (COMP §6), puis suit le doigt.
    expect(screen.getByTestId("composition-layout-circuit-cb-header-collapse").props.accessibilityState).toMatchObject({ expanded: false });
    fireEvent(block, "responderMove", { nativeEvent: { pageX: 100, pageY: -8 } });
    fireEvent(block, "touchEnd", { nativeEvent: { pageX: 100, pageY: -8, touches: [] } });
    expect(shape(probe.draft)).toBe("cb[b1] e0 ca[a1,a2] e9");
  });

  it("point 4 : un mouvement avant le délai (défilement) annule l'appui long de surface", async () => {
    await renderComposition(twoCircuitsDraft());
    measureTwoCircuits();
    const before = probe.draft;
    const block = screen.getByTestId("composition-layout-circuit-cb", hidden);
    fireEvent(block, "touchStart", { nativeEvent: { pageX: 100, pageY: 466 } });
    fireEvent(block, "responderGrant", { nativeEvent: { pageX: 100, pageY: 466 } });
    fireEvent(block, "responderMove", { nativeEvent: { pageX: 100, pageY: 480 } });
    await wait(LONG_PRESS_DELAY_MS + 50);
    fireEvent(block, "responderRelease", { nativeEvent: { pageX: 100, pageY: 480, touches: [] } });
    expect(screen.getByTestId("composition-layout-circuit-cb-header-collapse").props.accessibilityState).toMatchObject({ expanded: true });
    expect(probe.draft).toBe(before);
  });

  it("point 3 : Circuit replié dont une carte est à compléter — fond et liseré rouges ; déplié — aplat habituel", async () => {
    const incomplete: SessionDraftExercise = { ...exercise("b1", 2), executionParameters: withPhases([0, 4]) };
    await renderComposition(twoCircuitsDraft({ b1: incomplete }));
    const surface = () => StyleSheet.flatten(screen.getByTestId("composition-layout-circuit-cb-surface", hidden).props.style);
    expect(surface().backgroundColor).not.toBe(colors.dangerSurface);
    fireEvent.press(screen.getByTestId("composition-layout-circuit-cb-header-collapse", hidden));
    await act(async () => undefined);
    expect(surface()).toMatchObject({ backgroundColor: colors.dangerSurface, borderColor: colors.danger, borderWidth: 1 });
    // L'autre Circuit, replié sans carte signalée, garde son aplat.
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse", hidden));
    await act(async () => undefined);
    expect(StyleSheet.flatten(screen.getByTestId("composition-layout-circuit-ca-surface", hidden).props.style).borderWidth).toBeUndefined();
    fireEvent.press(screen.getByTestId("composition-layout-circuit-cb-header-collapse", hidden));
    await act(async () => undefined);
    expect(surface().backgroundColor).not.toBe(colors.dangerSurface);
  });

  // [Liseré orange `toVerifyColors.border` — retiré le 08/11/2026 (constat F : « Supprimer le liseré du cadre orange du circuit ») : bord transparent.]
  it("point 3 : Circuit replié dont une carte est à vérifier — orange, sans liseré", async () => {
    const toVerify: SessionDraftExercise = { ...exercise("b1", 2), executionParameters: withPhases([6, 4]), phasesToVerify: [2] };
    await renderComposition(twoCircuitsDraft({ b1: toVerify }));
    fireEvent.press(screen.getByTestId("composition-layout-circuit-cb-header-collapse", hidden));
    await act(async () => undefined);
    expect(StyleSheet.flatten(screen.getByTestId("composition-layout-circuit-cb-surface", hidden).props.style)).toMatchObject({
      backgroundColor: toVerifyColors.surface,
      borderColor: "transparent",
    });
  });

  // Hermann, 08/11/2026 : « le liseré orange de la carte d'exercice « à vérifier » : pas de liseré orange ».
  it("carte d'Exercice à vérifier — fond orange, sans liseré (bord transparent : le contenu ne bouge pas)", async () => {
    const toVerify: SessionDraftExercise = { ...exercise("b1", 2), executionParameters: withPhases([6, 4]), phasesToVerify: [2] };
    await renderComposition(twoCircuitsDraft({ b1: toVerify }));
    expect(StyleSheet.flatten(screen.getByTestId("composition-exercise-row-b1", hidden).props.style)).toMatchObject({
      backgroundColor: toVerifyColors.surface,
      borderColor: "transparent",
    });
  });
});

/**
 * Recette iPhone du 08/11/2026 (constat C, Hermann : « il y a un problème d'affichage des circuit lors des défilements, les lignes
 * d'en-tête des circuit flottent au milieu de l'écran ») — cause : depuis le correctif t-depli (5d5a5ec0), le bloc d'un Circuit est
 * toujours dans les vues de son cadre d'enveloppe ; sa mesure (y relatif au cadre, 0) remplaçait sa position dans la liste. La
 * position du cadre est désormais ajoutée : les plages collantes et l'ancre du panneau de nature sont à nouveau justes.
 */
describe("Recette iPhone du 08/11/2026 — constat C : position des Circuits dans leur cadre", () => {
  it("le Circuit mesuré dans son cadre (y = 0) prend la position du cadre dans la liste (panneau de nature ancré dessous)", async () => {
    // Panneau de nature (hors iOS, où le menu est natif) : ancré sous l'en-tête du Circuit, dans le repère de la liste.
    Platform.OS = "android";
    await renderComposition(twoCircuitsDraft());
    layout("composition-layout-exercise-e0", 0, 80);
    // Mesures réelles : le cadre (hors mode) est dans la liste à 100, le bloc à 0 dans le cadre.
    layout("composition-envelope-circuit-ca-off", 100, 220);
    layout("composition-layout-circuit-ca", 0, 220);
    layout("composition-layout-circuit-ca-header", 14, 18);
    layout("composition-layout-circuit-ca-exercises", 41, 169);
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-counter-nature", hidden));
    await act(async () => undefined);
    const panel = screen.getByTestId("composition-layout-circuit-ca-header-counter-nature-panel", hidden);
    const top = StyleSheet.flatten(panel.props.style as StyleProp<ViewStyle>)?.top;
    // 100 (cadre) + 0 (bloc) + 32 (bas de l'en-tête) + 4 : et non 36 (bloc lu à 0).
    expect(top).toBe(100 + 14 + 18 + CIRCUIT_NATURE_PANEL_GAP);
    Platform.OS = "ios";
  });
});
