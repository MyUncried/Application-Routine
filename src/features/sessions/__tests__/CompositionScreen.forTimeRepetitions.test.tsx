import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react-native";
import { useMemo, useState, type ReactNode } from "react";
import { Platform, StyleSheet } from "react-native";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
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
 * Recette du 17/11/2026 (Hermann, captures de « For time a changer », créé après le rechargement : « le problème de vérification du mode
 * d'exécution n'est pas réglé. C'est au niveau de la composition de séance que le problème se pose ») : un For time dont la boucle n'a
 * aucun exercice en Répétitions — cartes de la boucle en rouge, message, Enregistrer indisponible (même contrôle que l'EMOM du 07/11).
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

function member(id: string, parameters: SessionDraftExercise["executionParameters"], circuitRole?: number): SessionDraftExercise {
  return {
    ...createExerciseDraft(id, 0),
    name: `Exercice ${id}`,
    structuralPosition: "BEFORE_TOUR",
    executionParameters: parameters,
    postActivityRecoverySeconds: 0,
    format: { key: "FOR_TIME", settings: circuitRole === undefined ? {} : { circuitRole } },
  };
}

/** Circuit For time × 3 [bird, burpee] (cas « For time a changer »), plus un buy-in en Répétitions si demandé. */
function forTimeDraft(members: readonly SessionDraftExercise[]): SessionDraft {
  const structure: SessionStructure<string, StructureStopPointLocation> = {
    elements: [{ kind: "CIRCUIT", circuit: { id: "cf", repeatCount: 3, nature: "SERIES", format: { key: "FOR_TIME", settings: {} }, exercises: members.map((item) => item.id) } }],
    stopPoints: [],
  };
  return withLocalMovements({ name: "Séance", labelId: null, initialCountdownSeconds: 10, finalPhaseSeconds: 5, exercises: [...members], structure });
}

const hidden = { includeHiddenElements: true } as const;
const cardStyle = (id: string) => StyleSheet.flatten(screen.getByTestId(`composition-exercise-row-${id}`, hidden).props.style);
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

describe("Composition — For time sans exercice de boucle en Répétitions (17/11/2026)", () => {
  it("boucle toute en Durée : cartes de la boucle en rouge, message, Enregistrer indisponible", async () => {
    await renderComposition(forTimeDraft([member("bird", durationParameters(10, 3, 0)), member("burpee", durationParameters(10, 3, 0))]));
    expect(cardStyle("bird").backgroundColor).toBe(colors.dangerSurface);
    expect(cardStyle("burpee").backgroundColor).toBe(colors.dangerSurface);
    expect(screen.getByTestId("composition-for-time-no-repetitions", hidden)).toHaveTextContent("For time : au moins un exercice de la boucle doit être en répétitions.");
    expect(saveDisabled()).toBe(true);
  });

  it("buy-in en Répétitions, boucle en Durée : le buy-in ne compte pas (16/11) ; seule la boucle est en rouge", async () => {
    await renderComposition(forTimeDraft([member("bi", repetitionParameters(5, 1, 0), 1), member("bird", durationParameters(10, 3, 0)), member("burpee", durationParameters(10, 3, 0))]));
    expect(cardStyle("bi").backgroundColor).not.toBe(colors.dangerSurface);
    expect(cardStyle("bird").backgroundColor).toBe(colors.dangerSurface);
    expect(screen.getByTestId("composition-for-time-no-repetitions", hidden)).toBeTruthy();
  });

  it("un exercice de la boucle en Répétitions : aucun message, aucune carte en rouge", async () => {
    await renderComposition(forTimeDraft([member("bird", durationParameters(10, 3, 0)), member("burpee", repetitionParameters(10, 3, 0))]));
    expect(cardStyle("bird").backgroundColor).not.toBe(colors.dangerSurface);
    expect(screen.queryByTestId("composition-for-time-no-repetitions", hidden)).toBeNull();
  });
});
