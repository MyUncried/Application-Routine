import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import { EVERY_TIME } from "@/domain/planning/Routine";
import { PlanningFrequencySheet } from "@/features/planning/PlanningFrequencySheet";
import { formatRecurrence } from "@/features/planning/planningSummary";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/** « Fréquence » (CE-UI-11 ; Figma `7594:34653`) : x fois sur n, pastilles, remise au gris, validation à x positions. */

const tap = (testID: string) => {
  fireEvent(screen.getByTestId(testID), "pressIn");
  fireEvent(screen.getByTestId(testID), "pressOut");
};
const checked = (position: number) => screen.getByTestId(`planning-frequency-position-${position}`).props.accessibilityState.checked as boolean;
const validate = () => screen.getByTestId("planning-frequency-validate");

function renderSheet(onValidate = jest.fn()) {
  render(
    <TestSafeAreaProvider>
      <PlanningFrequencySheet name="Étirements du soir" frequency={EVERY_TIME} onCancel={jest.fn()} onValidate={onValidate} />
    </TestSafeAreaProvider>,
  );
  return onValidate;
}

describe("feuille Fréquence", () => {
  it("à chaque fois : une pastille cochée, coche active", () => {
    renderSheet();
    expect(screen.getByText("Étirements du soir")).toBeTruthy();
    expect(checked(1)).toBe(true);
    expect(validate().props.accessibilityState).toMatchObject({ disabled: false });
  });

  it("2 fois sur 3, positions 1 et 3 ; changer n ou x remet les pastilles au gris", () => {
    const onValidate = renderSheet();
    tap("planning-frequency-n-increment");
    tap("planning-frequency-n-increment");
    expect([1, 2, 3].map(checked)).toEqual([false, false, false]);
    tap("planning-frequency-x-increment");
    fireEvent.press(screen.getByTestId("planning-frequency-position-1"));
    expect(validate().props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("planning-frequency-position-3"));
    expect(validate().props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(validate());
    expect(onValidate).toHaveBeenCalledWith({ x: 2, n: 3, positions: [1, 3] });
    tap("planning-frequency-x-decrement");
    expect([1, 2, 3].map(checked)).toEqual([false, false, false]);
  });

  it("récurrence d'une carte déployée : « Chaque lundi », « Toutes les 2 semaines, lundi et jeudi »", () => {
    expect(formatRecurrence({ repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "FOR", count: 2 } } })).toBe("Chaque lundi");
    expect(formatRecurrence({ repetition: { unit: "WEEK", every: 2, weekdays: [4, 1], end: { kind: "FOR", count: 2 } } })).toBe(
      "Toutes les 2 semaines, lundi et jeudi",
    );
  });
});
