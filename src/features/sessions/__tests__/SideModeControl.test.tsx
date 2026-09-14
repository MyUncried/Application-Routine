import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { SideModeControl } from "@/features/sessions/SideModeControl";

/**
 * `SideModeControl` (V2-BILAT-01) : un seul appui fait AVANCER la direction
 * d'un cran (`cycleSideMode`) — jamais un sélecteur à trois options
 * distinctes. Partagé par `ExerciseScreen` (Activité) et `CompositionScreen`
 * (Tour) — voir la documentation de tête du composant. Titre et nom
 * accessible sont des props explicites, entièrement composées par
 * l'appelant (plan `## UI` : les deux contextes portent des textes
 * distincts) — ce composant ne les dérive jamais lui-même.
 */
describe("SideModeControl", () => {
  it("displays no visible text for UNILATERAL — visually empty, never the word 'Unilatéral' (plan '## UI')", () => {
    render(
      <SideModeControl
        value="UNILATERAL"
        onChange={jest.fn()}
        accessibilityLabel="Côté : unilatéral"
        testID="side-mode"
      />,
    );
    expect(screen.queryByText("Unilatéral")).toBeNull();
    expect(screen.getByTestId("side-mode-value").props.children).toBe("");
  });

  it("displays the visible value 'D→G' for RIGHT_LEFT and 'G→D' for LEFT_RIGHT", () => {
    const { rerender } = render(
      <SideModeControl
        value="RIGHT_LEFT"
        onChange={jest.fn()}
        accessibilityLabel="Côté : bilatéral, droite puis gauche"
        testID="side-mode"
      />,
    );
    expect(screen.getByText("D→G")).toBeTruthy();

    rerender(
      <SideModeControl
        value="LEFT_RIGHT"
        onChange={jest.fn()}
        accessibilityLabel="Côté : bilatéral, gauche puis droite"
        testID="side-mode"
      />,
    );
    expect(screen.getByText("G→D")).toBeTruthy();
  });

  it("exposes exactly the accessibilityLabel prop transmitted by the caller, never a value it derives itself", () => {
    const { rerender } = render(
      <SideModeControl
        value="UNILATERAL"
        onChange={jest.fn()}
        accessibilityLabel="Côté : unilatéral"
        testID="side-mode"
      />,
    );
    expect(screen.getByTestId("side-mode-control").props.accessibilityLabel).toBe(
      "Côté : unilatéral",
    );

    rerender(
      <SideModeControl
        value="RIGHT_LEFT"
        onChange={jest.fn()}
        accessibilityLabel="Direction du Tour : droite puis gauche"
        testID="side-mode"
      />,
    );
    expect(screen.getByTestId("side-mode-control").props.accessibilityLabel).toBe(
      "Direction du Tour : droite puis gauche",
    );
  });

  it("renders no title line by default, and the exact title text when provided", () => {
    const { rerender } = render(
      <SideModeControl
        value="UNILATERAL"
        onChange={jest.fn()}
        accessibilityLabel="Direction du Tour : unilatéral"
        testID="side-mode"
      />,
    );
    expect(screen.queryByText("Côté")).toBeNull();

    rerender(
      <SideModeControl
        value="UNILATERAL"
        onChange={jest.fn()}
        accessibilityLabel="Côté : unilatéral"
        title="Côté"
        testID="side-mode"
      />,
    );
    expect(screen.getByText("Côté")).toBeTruthy();
  });

  it("applies the transmitted local width/height, defaulting to the Activity geometry (74 × 42)", () => {
    render(
      <SideModeControl
        value="UNILATERAL"
        onChange={jest.fn()}
        accessibilityLabel="Côté : unilatéral"
        testID="side-mode"
      />,
    );
    const flattened = Object.assign(
      {},
      ...([] as object[]).concat(screen.getByTestId("side-mode-control").props.style),
    );
    expect(flattened.width).toBe(74);
    expect(flattened.height).toBe(42);
  });

  it("applies the Tour geometry (42 × 34) when explicitly transmitted", () => {
    render(
      <SideModeControl
        value="UNILATERAL"
        onChange={jest.fn()}
        accessibilityLabel="Direction du Tour : unilatéral"
        width={42}
        height={34}
        testID="side-mode"
      />,
    );
    const flattened = Object.assign(
      {},
      ...([] as object[]).concat(screen.getByTestId("side-mode-control").props.style),
    );
    expect(flattened.width).toBe(42);
    expect(flattened.height).toBe(34);
  });

  it("advances the direction by one cycle step per press: Unilatéral → D→G → G→D → Unilatéral", () => {
    const onChange = jest.fn();
    render(
      <SideModeControl
        value="UNILATERAL"
        onChange={onChange}
        accessibilityLabel="Côté : unilatéral"
        testID="side-mode"
      />,
    );
    fireEvent.press(screen.getByTestId("side-mode-control"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("RIGHT_LEFT");
  });

  it("cycles LEFT_RIGHT back to UNILATERAL", () => {
    const onChange = jest.fn();
    render(
      <SideModeControl
        value="LEFT_RIGHT"
        onChange={onChange}
        accessibilityLabel="Côté : bilatéral, gauche puis droite"
        testID="side-mode"
      />,
    );
    fireEvent.press(screen.getByTestId("side-mode-control"));
    expect(onChange).toHaveBeenCalledWith("UNILATERAL");
  });

  it("is disabled — visible but non-interactive — when disabled is true, and never dispatches onChange", () => {
    const onChange = jest.fn();
    render(
      <SideModeControl
        value="UNILATERAL"
        onChange={onChange}
        accessibilityLabel="Côté : unilatéral — défini par le Tour, indisponible"
        disabled
        testID="side-mode"
      />,
    );
    const control = screen.getByTestId("side-mode-control");
    expect(control.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(control);
    expect(onChange).not.toHaveBeenCalled();
    // Toujours visible, valeur toujours affichée — jamais démonté.
    expect(screen.getByTestId("side-mode-value")).toBeTruthy();
  });

  it("is enabled by default", () => {
    render(
      <SideModeControl
        value="UNILATERAL"
        onChange={jest.fn()}
        accessibilityLabel="Côté : unilatéral"
        testID="side-mode"
      />,
    );
    expect(screen.getByTestId("side-mode-control").props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });
});
