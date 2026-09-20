import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { ActivityDefinition } from "@/domain/activities";
import { ActivityCard } from "@/features/activities/ActivityCard";

const DEFINITION: ActivityDefinition = {
  id: "def-1",
  name: "Squat",
  description: null,
  executionMode: "DURATION",
  durationSeconds: 30,
  repetitionCount: null,
  seriesCount: 3,
  pauseSeconds: 10,
  recoverySeconds: 0,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("ActivityCard", () => {
  it("renders the activity name", () => {
    render(<ActivityCard definition={DEFINITION} />);
    expect(screen.getByText("Squat")).toBeTruthy();
  });

  it("opens editing when the main surface is pressed", () => {
    const onOpen = jest.fn();
    render(<ActivityCard definition={DEFINITION} onOpen={onOpen} />);

    fireEvent.press(screen.getByTestId("activity-card-open"));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("is not pressable without onOpen", () => {
    render(<ActivityCard definition={DEFINITION} />);
    expect(screen.queryByTestId("activity-card-open")).toBeNull();
  });

  it("renders Déployer and Lecture as disabled, without handlers", () => {
    render(<ActivityCard definition={DEFINITION} onOpen={jest.fn()} />);

    const play = screen.getByTestId("activity-card-play");
    expect(play.props.accessibilityState.disabled).toBe(true);

    const disclosure = screen.getByLabelText("Déployer l’activité");
    expect(disclosure.props.accessibilityState?.disabled ?? disclosure.props.disabled).toBeTruthy();
  });

  /**
   * V2-CAT-01 (UI-CAT-R-002) : chaque carte affiche une marque de couleur,
   * les Zones corporelles, le mode/la cible, les Séries, la Pause et la
   * Récupération — jamais seulement le nom.
   */
  it("shows a fixed color mark, the body zones, the mode/target/series/pause summary and the Recovery", () => {
    render(
      <ActivityCard
        definition={{
          ...DEFINITION,
          bodyZoneIds: ["dos"],
          recoverySeconds: 90,
        }}
      />,
    );

    expect(screen.getByTestId(`activity-card-color-bar-${DEFINITION.id}`)).toBeTruthy();
    expect(screen.getByTestId(`activity-card-body-zones-${DEFINITION.id}`)).toBeTruthy();
    expect(screen.getByText(/série/u)).toBeTruthy();
    expect(screen.getByTestId(`activity-card-recovery-${DEFINITION.id}`)).toBeTruthy();
  });

  it("omits the body zones and Recovery lines when absent, without an empty line", () => {
    render(<ActivityCard definition={DEFINITION} />);

    expect(screen.queryByTestId(`activity-card-body-zones-${DEFINITION.id}`)).toBeNull();
    expect(screen.queryByTestId(`activity-card-recovery-${DEFINITION.id}`)).toBeNull();
  });
});
