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
});
