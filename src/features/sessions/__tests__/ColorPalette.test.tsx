import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import { SESSION_COLORS } from "@/domain/sessions/Session";
import { ColorPalette } from "@/features/sessions/ColorPalette";
import { strings } from "@/shared/i18n";
import { minTouchTarget } from "@/shared/ui/tokens";

describe("ColorPalette", () => {
  it("shows only the compact swatch when closed, never the grid", () => {
    render(
      <ColorPalette value={SESSION_COLORS[0]} onChange={jest.fn()} isOpen={false} onToggle={jest.fn()} />,
    );

    expect(
      screen.queryByLabelText(strings.screens.composition.colorPicker.paletteAccessibilityLabel),
    ).toBeNull();
  });

  it("calls onToggle when the compact swatch is pressed", () => {
    const onToggle = jest.fn();
    render(
      <ColorPalette value={SESSION_COLORS[0]} onChange={jest.fn()} isOpen={false} onToggle={onToggle} />,
    );

    fireEvent.press(screen.getByLabelText(strings.screens.composition.colorPicker.label));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders exactly the 12 canonical colors as a radiogroup when open", () => {
    render(
      <ColorPalette value={SESSION_COLORS[0]} onChange={jest.fn()} isOpen={true} onToggle={jest.fn()} />,
    );

    const group = screen.getByLabelText(
      strings.screens.composition.colorPicker.paletteAccessibilityLabel,
    );
    expect(group.props.accessibilityRole).toBe("radiogroup");
    expect(SESSION_COLORS).toHaveLength(12);

    for (const color of SESSION_COLORS) {
      expect(
        screen.getByLabelText(`${strings.screens.composition.colorPicker.swatchAccessibilityLabel} ${color}`),
      ).toBeTruthy();
    }
  });

  it("marks exactly the currently selected color as selected=true, every other as selected=false", () => {
    render(
      <ColorPalette value={SESSION_COLORS[2]} onChange={jest.fn()} isOpen={true} onToggle={jest.fn()} />,
    );

    for (const color of SESSION_COLORS) {
      const swatch = screen.getByLabelText(
        `${strings.screens.composition.colorPicker.swatchAccessibilityLabel} ${color}`,
      );
      expect(swatch.props.accessibilityState).toMatchObject({ selected: color === SESSION_COLORS[2] });
    }
  });

  it("calls onChange with the pressed color", () => {
    const onChange = jest.fn();
    render(
      <ColorPalette value={SESSION_COLORS[0]} onChange={onChange} isOpen={true} onToggle={jest.fn()} />,
    );

    fireEvent.press(
      screen.getByLabelText(
        `${strings.screens.composition.colorPicker.swatchAccessibilityLabel} ${SESSION_COLORS[5]}`,
      ),
    );

    expect(onChange).toHaveBeenCalledWith(SESSION_COLORS[5]);
  });

  describe("corrections de conformité (T01_S01_S08_CONFORMITY_AUDIT_20260902.md — AUD-04/AUD-05)", () => {
    it("shows the state-selected icon only on the currently selected swatch, never on the others", () => {
      render(
        <ColorPalette value={SESSION_COLORS[2]} onChange={jest.fn()} isOpen={true} onToggle={jest.fn()} />,
      );

      expect(screen.getByTestId("color-palette-selected-icon")).toBeTruthy();
      expect(screen.getAllByTestId("color-palette-selected-icon")).toHaveLength(1);
    });

    it("carries a hitSlop on the compact swatch and every grid swatch reaching the 48×48 minimum touch target", () => {
      render(
        <ColorPalette value={SESSION_COLORS[0]} onChange={jest.fn()} isOpen={true} onToggle={jest.fn()} />,
      );

      const compactSwatch = screen.getByLabelText(strings.screens.composition.colorPicker.label);
      expect(compactSwatch.props.hitSlop).toBeGreaterThan(0);

      const flattenedCompact = StyleSheet.flatten(compactSwatch.props.style);
      const compactEffectiveSize = flattenedCompact.width + 2 * compactSwatch.props.hitSlop;
      expect(compactEffectiveSize).toBeGreaterThanOrEqual(minTouchTarget);

      const gridSwatch = screen.getByLabelText(
        `${strings.screens.composition.colorPicker.swatchAccessibilityLabel} ${SESSION_COLORS[5]}`,
      );
      expect(gridSwatch.props.hitSlop).toBeGreaterThan(0);
      const flattenedGrid = StyleSheet.flatten(gridSwatch.props.style);
      const gridEffectiveSize = flattenedGrid.width + 2 * gridSwatch.props.hitSlop;
      expect(gridEffectiveSize).toBeGreaterThanOrEqual(minTouchTarget);
    });

    it("anchors the popover as a superposed overlay (position: absolute), never pushing the layout below (CE-T01-06)", () => {
      render(
        <ColorPalette value={SESSION_COLORS[0]} onChange={jest.fn()} isOpen={true} onToggle={jest.fn()} />,
      );

      const popover = screen.getByTestId("color-palette-popover");
      const flattened = StyleSheet.flatten(popover.props.style);
      expect(flattened.position).toBe("absolute");
    });
  });

  /**
   * R4 (plan §6.5, §4.10 L133) : `variant="inline"` — seuls consommateurs
   * `CategoryPickerModal`/`LabelPickerModal` — rend la grille dans le flux
   * normal de la carte, jamais une superposition `position: "absolute"`.
   */
  describe('variant="inline" (R4)', () => {
    it("never positions the grid as an absolute overlay", () => {
      render(
        <ColorPalette
          value={SESSION_COLORS[0]}
          onChange={jest.fn()}
          isOpen={true}
          onToggle={jest.fn()}
          variant="inline"
        />,
      );

      const palette = screen.getByTestId("color-palette-popover");
      const flattened = StyleSheet.flatten(palette.props.style);
      expect(flattened.position).not.toBe("absolute");
    });

    it("still renders the 12 colours as an accessible radiogroup, and still applies onChange", () => {
      const onChange = jest.fn();
      render(
        <ColorPalette
          value={SESSION_COLORS[0]}
          onChange={onChange}
          isOpen={true}
          onToggle={jest.fn()}
          variant="inline"
        />,
      );

      const group = screen.getByLabelText(
        strings.screens.composition.colorPicker.paletteAccessibilityLabel,
      );
      expect(group.props.accessibilityRole).toBe("radiogroup");

      fireEvent.press(
        screen.getByLabelText(
          `${strings.screens.composition.colorPicker.swatchAccessibilityLabel} ${SESSION_COLORS[5]}`,
        ),
      );
      expect(onChange).toHaveBeenCalledWith(SESSION_COLORS[5]);
    });

    it("renders nothing extra when closed, defaulting variant to popover (backwards compatible)", () => {
      render(
        <ColorPalette value={SESSION_COLORS[0]} onChange={jest.fn()} isOpen={false} onToggle={jest.fn()} />,
      );

      expect(screen.queryByTestId("color-palette-popover")).toBeNull();
    });
  });
});
