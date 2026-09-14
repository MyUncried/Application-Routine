import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { SideModeControl } from "@/features/sessions/SideModeControl";

/**
 * `SideModeControl` (V2-BILAT-01) : un seul appui fait AVANCER la direction
 * d'un cran (`cycleSideMode`) — jamais un sélecteur à trois options
 * distinctes. Partagé par `ExerciseScreen` (Activité) et `CompositionScreen`
 * (Tour) — voir la documentation de tête du composant.
 */
describe("SideModeControl", () => {
  it("displays the compact label 'Unilatéral' for UNILATERAL", () => {
    render(<SideModeControl value="UNILATERAL" onChange={jest.fn()} testID="side-mode" />);
    expect(screen.getByText("Unilatéral")).toBeTruthy();
  });

  it("displays the compact label 'D→G' for RIGHT_LEFT and 'G→D' for LEFT_RIGHT", () => {
    const { rerender } = render(
      <SideModeControl value="RIGHT_LEFT" onChange={jest.fn()} testID="side-mode" />,
    );
    expect(screen.getByText("D→G")).toBeTruthy();

    rerender(<SideModeControl value="LEFT_RIGHT" onChange={jest.fn()} testID="side-mode" />);
    expect(screen.getByText("G→D")).toBeTruthy();
  });

  it("exposes the accessible names Unilatéral / Bilatéral droite-gauche / Bilatéral gauche-droite", () => {
    const { rerender } = render(
      <SideModeControl value="UNILATERAL" onChange={jest.fn()} testID="side-mode" />,
    );
    expect(screen.getByTestId("side-mode-control").props.accessibilityLabel).toBe("Unilatéral");

    rerender(<SideModeControl value="RIGHT_LEFT" onChange={jest.fn()} testID="side-mode" />);
    expect(screen.getByTestId("side-mode-control").props.accessibilityLabel).toBe(
      "Bilatéral droite-gauche",
    );

    rerender(<SideModeControl value="LEFT_RIGHT" onChange={jest.fn()} testID="side-mode" />);
    expect(screen.getByTestId("side-mode-control").props.accessibilityLabel).toBe(
      "Bilatéral gauche-droite",
    );
  });

  it("advances the direction by one cycle step per press: Unilatéral → D→G → G→D → Unilatéral", () => {
    const onChange = jest.fn();
    render(<SideModeControl value="UNILATERAL" onChange={onChange} testID="side-mode" />);
    fireEvent.press(screen.getByTestId("side-mode-control"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("RIGHT_LEFT");
  });

  it("cycles LEFT_RIGHT back to UNILATERAL", () => {
    const onChange = jest.fn();
    render(<SideModeControl value="LEFT_RIGHT" onChange={onChange} testID="side-mode" />);
    fireEvent.press(screen.getByTestId("side-mode-control"));
    expect(onChange).toHaveBeenCalledWith("UNILATERAL");
  });

  it("is disabled — visible but non-interactive — when disabled is true", () => {
    const onChange = jest.fn();
    render(
      <SideModeControl value="UNILATERAL" onChange={onChange} disabled testID="side-mode" />,
    );
    const control = screen.getByTestId("side-mode-control");
    expect(control.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(control);
    expect(onChange).not.toHaveBeenCalled();
    // Toujours visible, valeur toujours affichée — jamais démonté.
    expect(screen.getByText("Unilatéral")).toBeTruthy();
  });

  it("is enabled by default", () => {
    render(<SideModeControl value="UNILATERAL" onChange={jest.fn()} testID="side-mode" />);
    expect(screen.getByTestId("side-mode-control").props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });
});
