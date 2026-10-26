import { act, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { ActivityDefinition } from "@/domain/activities";
import type { WorkPhase } from "@/domain/activities/ExecutionParameters";
import { computeIntrinsicDuration } from "@/domain/activities/executionCalculations";
import { totalClauseAmount } from "@/domain/activities/executionPhrase";
import { uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { ActivityCard, catalogueDuration } from "@/features/activities/ActivityCard";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { strings } from "@/shared/i18n";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-7 story R-7 (D-448) — carte du Catalogue : « Paramètres à compléter. » en `colors.danger`
 * (point 7) ; durée affichée en Durée malgré une phase vide (PH-5), absente en Répétitions.
 */

jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const service = {
  listBodyZones: jest.fn(async () => []),
  resolveMediaUri: (uri: string) => uri,
} as unknown as ActivityDefinitionService;

const phases = (...durations: number[]): WorkPhase[] =>
  durations.map((durationSeconds, index) => ({ id: index + 1, label: `P${index + 1}`, durationSeconds }));

function definition(mode: "DURATION" | "REPETITIONS", workPhases: readonly WorkPhase[]): ActivityDefinition {
  return {
    id: "def-r7",
    movementId: "mov-r7",
    name: "Squat",
    description: null,
    executionParameters: uniformParameters({ mode, count: 3, target: mode === "DURATION" ? 30 : 10, pauseSeconds: 60, workPhases }),
    categoryId: "cardio",
    bodyZoneIds: [],
    sideMode: "UNILATERAL",
    sideRecoverySeconds: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

const summaryStyle = () => StyleSheet.flatten(screen.getByTestId("activity-card-summary-def-r7").props.style);

describe("R-7 — ActivityCard", () => {
  it("Durée, phase vide : « Paramètres à compléter. » en rouge ; durée totale affichée (PH-5)", async () => {
    const incomplete = definition("DURATION", phases(3, 0));
    render(
      <ActivityDefinitionServiceContext.Provider value={service}>
        <ActivityCard definition={incomplete} />
      </ActivityDefinitionServiceContext.Provider>,
    );
    await act(async () => undefined);
    expect(screen.getByText(strings.executionParameters.card.incomplete)).toBeTruthy();
    expect(summaryStyle().color).toBe(colors.danger);
    const expected = totalClauseAmount(computeIntrinsicDuration(definition("DURATION", []).executionParameters));
    expect(catalogueDuration(incomplete)).toBe(expected);
  });

  it("Répétitions, phase vide : aucune durée (PHC) ; synthèse complète en couleur ordinaire", async () => {
    expect(catalogueDuration(definition("REPETITIONS", phases(3, 0)))).toBeNull();
    render(
      <ActivityDefinitionServiceContext.Provider value={service}>
        <ActivityCard definition={definition("DURATION", phases(3, 2))} />
      </ActivityDefinitionServiceContext.Provider>,
    );
    await act(async () => undefined);
    expect(summaryStyle().color).toBe(colors.textSecondary);
  });
});
