import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useMemo, useState, type ReactNode } from "react";
import { Platform, StyleSheet } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

/**
 * Décisions de Hermann du 07/11/2026 (EMOM), C11-C12 et réponse 2 — Composition : un Circuit porteur EMOM dont le
 * travail prévu de ses membres, au même rang, atteint la durée de tour : cartes des membres en rouge, Circuit replié
 * en rouge (règle générale de la recette n° 3 du 03/11), durée de tour de l'en-tête en rouge, message, Enregistrer
 * indisponible. Jest ne prouve que l'arbre JS : le rendu relève de la recette iPhone.
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

function DraftHost({ initial, children }: { initial: SessionDraft; children: ReactNode }) {
  const [draft, setDraft] = useState(initial);
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

/** Membre EMOM d'un Circuit porteur : `seconds` de travail par série, deux séries (une par tour), Récupération 0 s. */
function member(id: string, seconds: number): SessionDraftExercise {
  return {
    ...createExerciseDraft(id, 0),
    name: `Exercice ${id}`,
    structuralPosition: "BEFORE_TOUR",
    executionParameters: durationParameters(seconds, 2, 0),
    postActivityRecoverySeconds: 0,
    format: { key: "EMOM", settings: {} },
  };
}

function plain(id: string): SessionDraftExercise {
  return { ...createExerciseDraft(id, 0), name: `Exercice ${id}`, structuralPosition: "BEFORE_TOUR", executionParameters: durationParameters(30, 1) };
}

/** Circuit porteur EMOM × 2 (durée de tour 1 min) [m1, m2], Circuit standard [s1]. */
function draftWith(seconds: number): SessionDraft {
  const structure: SessionStructure<string, StructureStopPointLocation> = {
    elements: [
      { kind: "CIRCUIT", circuit: { id: "ce", repeatCount: 2, nature: "TOURS", format: { key: "EMOM", settings: { windowSeconds: 60 } }, exercises: ["m1", "m2"] } },
      { kind: "CIRCUIT", circuit: { id: "cs", repeatCount: 1, nature: "TOURS", exercises: ["s1"] } },
    ],
    stopPoints: [],
  };
  return withLocalMovements({
    name: "Séance",
    labelId: null,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    exercises: [member("m1", seconds), member("m2", seconds), plain("s1")],
    structure,
  });
}

const hidden = { includeHiddenElements: true } as const;
const cardStyle = (id: string) => StyleSheet.flatten(screen.getByTestId(`composition-exercise-row-${id}`, hidden).props.style);
const surface = () => StyleSheet.flatten(screen.getByTestId("composition-layout-circuit-ce-surface", hidden).props.style);
function durationColor(): unknown {
  const target = screen.getByTestId("composition-layout-circuit-ce-header-duration", hidden);
  const text = target.findAll((node) => (node.type as unknown) === "Text")[0] ?? target;
  return StyleSheet.flatten(text.props.style).color;
}
const saveDisabled = () => screen.getByTestId("composition-save-action", hidden).props.accessibilityState?.disabled;

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

describe("Composition — EMOM « dans chaque intervalle » : durée de tour dépassée (07/11/2026)", () => {
  it("dépassement : cartes des membres, Circuit replié et durée de tour en rouge ; message ; Enregistrer indisponible", async () => {
    await renderComposition(draftWith(40));
    expect(cardStyle("m1").backgroundColor).toBe(colors.dangerSurface);
    expect(cardStyle("m2").backgroundColor).toBe(colors.dangerSurface);
    expect(durationColor()).toBe(colors.danger);
    expect(screen.getByTestId("composition-emom-overflow", hidden)).toBeTruthy();
    expect(saveDisabled()).toBe(true);
    expect(surface().backgroundColor).not.toBe(colors.dangerSurface);
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ce-header-collapse", hidden));
    await act(async () => undefined);
    expect(surface()).toMatchObject({ backgroundColor: colors.dangerSurface, borderColor: colors.danger, borderWidth: 1 });
  });

  it("sans dépassement : couleurs habituelles, aucun message, durée de tour en bleu", async () => {
    await renderComposition(draftWith(10));
    expect(cardStyle("m1").backgroundColor).not.toBe(colors.dangerSurface);
    expect(durationColor()).toBe(colors.primary);
    expect(screen.queryByTestId("composition-emom-overflow", hidden)).toBeNull();
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ce-header-collapse", hidden));
    await act(async () => undefined);
    expect(surface().backgroundColor).not.toBe(colors.dangerSurface);
  });
});
