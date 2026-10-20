import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import type { CircuitNature } from "@/domain/sessions/circuit";
import {
  CircuitHeader,
  circuitCountSpokenValue,
  circuitUnitLabel,
} from "@/features/sessions/CircuitHeader";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { colors } from "@/shared/ui/tokens";

function renderHeader(overrides: Partial<{ nature: CircuitNature; count: number; isCounterOpen: boolean; duration: string }> = {}) {
  const onToggleCounter = jest.fn();
  const onChangeCount = jest.fn<(count: number) => void>();
  render(
    <CircuitHeader
      nature={overrides.nature ?? "TOURS"}
      count={overrides.count ?? 1}
      duration={overrides.duration ?? "— min"}
      isCounterOpen={overrides.isCounterOpen ?? false}
      onToggleCounter={onToggleCounter}
      onChangeCount={onChangeCount}
      testID="header"
    />,
  );
  return { onToggleCounter, onChangeCount };
}

function accessibilityAction(testID: string, actionName: string) {
  fireEvent(screen.getByTestId(testID), "accessibilityAction", { nativeEvent: { actionName } });
}

describe("CircuitHeader (PRE-6 story 3.1)", () => {
  it("accords the unit with the nature and N (N = 1 singular)", () => {
    expect(circuitUnitLabel("TOURS", 1)).toBe("tour");
    expect(circuitUnitLabel("TOURS", 2)).toBe("tours");
    expect(circuitUnitLabel("SERIES", 1)).toBe("série");
    expect(circuitUnitLabel("SERIES", 3)).toBe("séries");
    expect(circuitCountSpokenValue("TOURS", 4)).toBe("4 tours");
  });

  it("renders « Circuit », the duration (one line, tertiary) and the counter at rest", () => {
    renderHeader({ duration: "≈ 12 min", count: 3, nature: "SERIES" });

    expect(screen.getByTestId("header-title").props.children).toBe("Circuit");
    const duration = screen.getByTestId("header-duration");
    expect(duration.props.children).toBe("≈ 12 min");
    expect(duration.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(duration.props.style).color).toBe(TEXT_TERTIARY);
    expect(screen.getByTestId("header-counter-value").props.children).toBe(3);
    expect(screen.getByTestId("header-counter-unit-text").props.children).toBe("séries");
    expect(screen.queryByTestId("header-counter-stepper")).toBeNull();
  });

  it("touching the digit asks to reveal the stepper; the pill does nothing", () => {
    const { onToggleCounter, onChangeCount } = renderHeader();
    fireEvent.press(screen.getByTestId("header-counter-unit"));
    expect(onToggleCounter).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("header-counter-value-press"));
    expect(onToggleCounter).toHaveBeenCalledTimes(1);
    expect(onChangeCount).not.toHaveBeenCalled();
  });

  it("at rest, VoiceOver increments / decrements within 1..99 and « activate » reveals", () => {
    const { onToggleCounter, onChangeCount } = renderHeader({ count: 5 });
    const counter = screen.getByTestId("header-counter");
    expect(counter.props.accessibilityLabel).toBe("Nombre de tours");
    expect(counter.props.accessibilityValue).toEqual({ min: 1, max: 99, now: 5, text: "5 tours" });

    accessibilityAction("header-counter", "increment");
    accessibilityAction("header-counter", "decrement");
    expect(onChangeCount.mock.calls).toEqual([[6], [4]]);
    accessibilityAction("header-counter", "activate");
    expect(onToggleCounter).toHaveBeenCalledTimes(1);
  });

  it("at 99, no increment is offered nor applied", () => {
    const { onChangeCount } = renderHeader({ count: 99 });
    const actions = (screen.getByTestId("header-counter").props.accessibilityActions as { name: string }[]).map(
      (action) => action.name,
    );
    expect(actions).toEqual(["decrement", "activate"]);
    accessibilityAction("header-counter", "increment");
    expect(onChangeCount).not.toHaveBeenCalled();
  });

  it("revealed: each step calls onChangeCount; touching the value or escaping closes", () => {
    const { onToggleCounter, onChangeCount } = renderHeader({ count: 2, isCounterOpen: true });

    const plus = screen.getByTestId("header-counter-stepper-increment");
    fireEvent(plus, "pressIn");
    fireEvent(plus, "pressOut");
    expect(onChangeCount).toHaveBeenLastCalledWith(3);

    fireEvent.press(screen.getByTestId("header-counter-stepper-value-press"));
    expect(onToggleCounter).toHaveBeenCalledTimes(1);
    fireEvent(screen.getByTestId("header-counter-field"), "accessibilityEscape");
    expect(onToggleCounter).toHaveBeenCalledTimes(2);
  });

  it("revealed: « Fermer » (closeField) and « activer » are offered by the focused adjustable itself and close", () => {
    const { onToggleCounter } = renderHeader({ count: 2, isCounterOpen: true });
    const stepper = screen.getByTestId("header-counter-stepper");
    const actions = stepper.props.accessibilityActions as { name: string; label?: string }[];
    expect(actions).toContainEqual({ name: "close", label: "Fermer" });
    expect(actions.map((action) => action.name)).toContain("activate");

    accessibilityAction("header-counter-stepper", "close");
    expect(onToggleCounter).toHaveBeenCalledTimes(1);
    accessibilityAction("header-counter-stepper", "activate");
    expect(onToggleCounter).toHaveBeenCalledTimes(2);
  });

  it("the title never truncates before the duration", () => {
    renderHeader();
    expect(StyleSheet.flatten(screen.getByTestId("header-title").props.style).flexShrink).toBe(0);
  });

  it("revealed: white field radius 18, surface circles, the counter never shrinks", () => {
    renderHeader({ isCounterOpen: true });
    const field = screen.getByTestId("header-counter-field");
    expect(StyleSheet.flatten(field.props.style)).toMatchObject({
      backgroundColor: colors.background,
      borderRadius: 18,
      flexShrink: 0,
    });
    expect(StyleSheet.flatten(screen.getByTestId("header-counter-stepper-decrement").props.style).backgroundColor).toBe(
      colors.surface,
    );
    // Stepper ajustable annonçant l'unité.
    expect(screen.getByTestId("header-counter-stepper").props.accessibilityValue).toMatchObject({ text: "1 tour" });
  });
});
