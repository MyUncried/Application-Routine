import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react-native";
import { useMemo, type ReactNode } from "react";
import { StyleSheet } from "react-native";

import type { WorkPhase } from "@/domain/activities/ExecutionParameters";
import { transferParametersByRank } from "@/domain/activities/Movement";
import { uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-7 story R-7 (D-448, point 7, recette JA2 nv-5) — carte de Composition d'une occurrence
 * dont une phase manque après un changement de niveau : fond `colors.dangerSurface`,
 * « Paramètres à compléter. » en `colors.danger`. Jest ne prouve pas le rendu sur iPhone.
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

const referentialService = {
  listLabels: jest.fn(async () => []),
} as unknown as ReferentialService;

function DraftHost({ exercises, children }: { exercises: readonly SessionDraftExercise[]; children: ReactNode }) {
  const value = useMemo<SessionDraftContextValue>(
    () => ({
      draft: withLocalMovements({
        name: "Séance",
        labelId: null,
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        exercises,
      }),
      updateDraft: jest.fn(),
      resetDraft: jest.fn(),
    }),
    [exercises],
  );
  return <SessionDraftContext.Provider value={value}>{children}</SessionDraftContext.Provider>;
}

async function renderComposition(exercises: readonly SessionDraftExercise[]) {
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={activityDefinitionService}>
        <ReferentialServiceContext.Provider value={referentialService}>
          <DraftHost exercises={exercises}>
            <CompositionScreen />
          </DraftHost>
        </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  // Référentiels chargés (Zones, Étiquettes, Catégories) avant les assertions.
  await act(async () => undefined);
}

const phases = (...durations: number[]): WorkPhase[] =>
  durations.map((durationSeconds, index) => ({ id: index + 1, label: `P${index + 1}`, durationSeconds }));

function occurrence(id: string, workPhases: readonly WorkPhase[]): SessionDraftExercise {
  return {
    ...createExerciseDraft(id),
    name: id,
    structuralPosition: "BEFORE_TOUR",
    executionParameters: uniformParameters({ mode: "DURATION", count: 3, target: 30, pauseSeconds: 60, workPhases }),
  };
}

const hidden = { includeHiddenElements: true } as const;
const cardStyle = (id: string) => StyleSheet.flatten(screen.getByTestId(`composition-exercise-row-${id}`, hidden).props.style);
const summaries = () => screen.getAllByTestId("composition-exercise-summary", hidden);

describe("R-7 — Composition : occurrence incomplète après un changement de niveau", () => {
  beforeEach(() => {
    mockExitGuard.mockReset();
    mockExitGuard.mockReturnValue({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() });
  });

  it("phase surnuméraire sans durée : fond `dangerSurface` et « Paramètres à compléter. » en rouge ; carte complète inchangée", async () => {
    const complete = occurrence("complete", phases(5, 2));
    const changed = occurrence("changed", phases(5, 2));
    // Changement de niveau vers un mouvement à trois phases : troisième durée vide (NV-3, jamais 0 s inventé).
    const leveled: SessionDraftExercise = {
      ...changed,
      executionParameters: transferParametersByRank(changed.executionParameters, [
        { id: 10, label: "Montée" },
        { id: 11, label: "Tenue" },
        { id: 12, label: "Descente" },
      ]),
    };
    await renderComposition([complete, leveled]);

    expect(cardStyle("changed").backgroundColor).toBe(colors.dangerSurface);
    expect(cardStyle("complete").backgroundColor).toBe(colors.background);

    const [completeSummary, incompleteSummary] = summaries();
    expect(String(incompleteSummary!.props.children)).toBe(strings.executionParameters.card.incomplete);
    expect(StyleSheet.flatten(incompleteSummary!.props.style).color).toBe(colors.danger);
    expect(StyleSheet.flatten(completeSummary!.props.style).color).not.toBe(colors.danger);
  });
});
