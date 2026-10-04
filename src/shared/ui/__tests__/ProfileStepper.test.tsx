import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import { ProfileStepper } from "@/shared/ui/ProfileStepper";

describe("ProfileStepper — closed state (D-227)", () => {
  it("shows the label and the confirmed value, replacing nothing until opened", () => {
    render(
      <ProfileStepper
        label="Compte à rebours d’exercice"
        unit="s"
        value={10}
        min={0}
        max={60}
        isOpen={false}
        onToggle={() => {}}
        onCommit={async () => true}
        testID="stepper"
      />,
    );
    expect(screen.getByTestId("stepper-value").props.children).toBe("10 s");
  });

  it("opens on press (only one stepper open at a time, controlled by the caller)", () => {
    const onToggle = jest.fn();
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={5}
        min={0}
        max={60}
        isOpen={false}
        onToggle={onToggle}
        onCommit={async () => true}
        testID="stepper"
      />,
    );
    fireEvent.press(screen.getByTestId("stepper"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe("ProfileStepper — open state, bounds (T4)", () => {
  it("disables the − button at the lower bound and announces it", () => {
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={0}
        min={0}
        max={60}
        isOpen
        onToggle={() => {}}
        onCommit={async () => true}
        testID="stepper"
      />,
    );
    const decrement = screen.getByTestId("stepper-decrement");
    expect(decrement.props.accessibilityState.disabled).toBe(true);
    expect(decrement.props.accessibilityLabel).toContain("minimum atteint");
  });

  it("disables the + button at the upper bound and announces it", () => {
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={60}
        min={0}
        max={60}
        isOpen
        onToggle={() => {}}
        onCommit={async () => true}
        testID="stepper"
      />,
    );
    const increment = screen.getByTestId("stepper-increment");
    expect(increment.props.accessibilityState.disabled).toBe(true);
    expect(increment.props.accessibilityLabel).toContain("maximum atteint");
  });

  it("announces the value, unit and (none at mid-range) via accessibilityLabel", () => {
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={10}
        min={0}
        max={60}
        isOpen
        onToggle={() => {}}
        onCommit={async () => true}
        testID="stepper"
      />,
    );
    expect(screen.getByTestId("stepper-value").props.accessibilityLabel).toBe("10 s");
  });
});

describe("ProfileStepper — interaction (T5/T6, CE-UI-07 L2549/L2545/L2557/L2565)", () => {
  it("a simple tap increments by one step immediately and commits exactly once on release", async () => {
    jest.useFakeTimers();
    const onCommit = jest.fn(async () => true);
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={10}
        min={0}
        max={60}
        isOpen
        onToggle={() => {}}
        onCommit={onCommit}
        testID="stepper"
      />,
    );
    const increment = screen.getByTestId("stepper-increment");

    fireEvent(increment, "pressIn");
    expect(screen.getByTestId("stepper-value").props.children).toBe("11 s");

    await act(async () => {
      fireEvent(increment, "pressOut");
      await Promise.resolve();
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(11);
    jest.useRealTimers();
  });

  it("a hold repeats after 450 ms, then every 150 ms, stopping on release — a single write for the whole gesture", async () => {
    jest.useFakeTimers();
    const onCommit = jest.fn(async () => true);
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={10}
        min={0}
        max={60}
        isOpen
        onToggle={() => {}}
        onCommit={onCommit}
        testID="stepper"
      />,
    );
    const increment = screen.getByTestId("stepper-increment");

    fireEvent(increment, "pressIn");
    expect(screen.getByTestId("stepper-value").props.children).toBe("11 s");

    act(() => {
      jest.advanceTimersByTime(450);
    });
    expect(screen.getByTestId("stepper-value").props.children).toBe("12 s");

    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.getByTestId("stepper-value").props.children).toBe("13 s");

    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.getByTestId("stepper-value").props.children).toBe("14 s");

    await act(async () => {
      fireEvent(increment, "pressOut");
      await Promise.resolve();
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(14);

    // Plus aucun tic après le relâchement — même en avançant le temps.
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("stepper-value").props.children).toBe("14 s");
    jest.useRealTimers();
  });

  it("restores the last confirmed value and shows an error message when the write fails (T6)", async () => {
    const onCommit = jest.fn(async () => false);
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={10}
        min={0}
        max={60}
        isOpen
        onToggle={() => {}}
        onCommit={onCommit}
        testID="stepper"
      />,
    );
    const increment = screen.getByTestId("stepper-increment");

    await act(async () => {
      fireEvent(increment, "pressIn");
      fireEvent(increment, "pressOut");
      await Promise.resolve();
    });

    expect(screen.getByTestId("stepper-value").props.children).toBe("10 s");
    expect(screen.getByTestId("stepper-error")).toBeTruthy();
  });

  it("uses the pause grid (not a 1 s step) when gridBased is set", () => {
    render(
      <ProfileStepper
        label="Récupération après exercice"
        unit="s"
        value={5}
        min={0}
        max={300}
        gridBased
        isOpen
        onToggle={() => {}}
        onCommit={async () => true}
        testID="stepper"
      />,
    );
    fireEvent(screen.getByTestId("stepper-increment"), "pressIn");
    expect(screen.getByTestId("stepper-value").props.children).toBe("10 s");
  });
});
