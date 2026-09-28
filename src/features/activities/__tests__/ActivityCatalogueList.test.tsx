import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { ActivityDefinition } from "@/domain/activities";
import { ActivityCatalogueList } from "@/features/activities/ActivityCatalogueList";

function makeDefinition(id: string): ActivityDefinition {
  return {
    id,
    name: `Activité ${id}`,
    description: null,
    executionMode: "DURATION",
    durationSeconds: 30,
    repetitionCount: null,
    seriesCount: 1,
    pauseSeconds: 0,
    recoverySeconds: 0,
    bodyZoneIds: [],
    sideMode: "UNILATERAL",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("ActivityCatalogueList", () => {
  it("renders the empty state message", () => {
    render(
      <ActivityCatalogueList
        state={{ status: "empty" }}
        onRetry={jest.fn()}
        onOpenDefinition={jest.fn()}
      />,
    );
    expect(screen.getByTestId("activity-catalogue-empty-frame")).toBeTruthy();
  });

  it("renders the error state and retries on press", () => {
    const onRetry = jest.fn();
    render(
      <ActivityCatalogueList
        state={{ status: "error", error: new Error("boom") }}
        onRetry={onRetry}
        onOpenDefinition={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText("Réessayer"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders every definition in the order provided (updatedAt DESC upstream)", () => {
    const definitions = [makeDefinition("b"), makeDefinition("a")];
    render(
      <ActivityCatalogueList
        state={{ status: "ready", definitions }}
        onRetry={jest.fn()}
        onOpenDefinition={jest.fn()}
      />,
    );
    expect(screen.getByTestId("activity-card-b")).toBeTruthy();
    expect(screen.getByTestId("activity-card-a")).toBeTruthy();
  });

  it("opens the definition when its card is pressed", () => {
    const onOpenDefinition = jest.fn();
    render(
      <ActivityCatalogueList
        state={{ status: "ready", definitions: [makeDefinition("a")] }}
        onRetry={jest.fn()}
        onOpenDefinition={onOpenDefinition}
      />,
    );
    fireEvent.press(screen.getByTestId("activity-card-open"));
    expect(onOpenDefinition).toHaveBeenCalledWith("a");
  });
});
