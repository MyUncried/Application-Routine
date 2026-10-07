import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { colors, dimensions, type } from "@/shared/ui/tokens";

describe("SegmentedControl", () => {
  const options = [
    { value: "activities" as const, label: "Activités" },
    { value: "sessions" as const, label: "Séances" },
    { value: "circuits" as const, label: "Circuits", disabled: true, accessibilityLabel: "Circuits — indisponible" },
  ];

  it("renders every option with the selected one marked accordingly", () => {
    render(<SegmentedControl options={options} value="sessions" onChange={jest.fn()} testID="seg" />);

    expect(screen.getByTestId("seg-activities").props.accessibilityState.selected).toBe(false);
    expect(screen.getByTestId("seg-sessions").props.accessibilityState.selected).toBe(true);
  });

  it("calls onChange with the pressed option's value", () => {
    const onChange = jest.fn();
    render(<SegmentedControl options={options} value="sessions" onChange={onChange} testID="seg" />);

    fireEvent.press(screen.getByTestId("seg-activities"));

    expect(onChange).toHaveBeenCalledWith("activities");
  });

  it("disables a segment and exposes its unavailability accessibility label, without a handler firing", () => {
    const onChange = jest.fn();
    render(<SegmentedControl options={options} value="sessions" onChange={onChange} testID="seg" />);

    const circuits = screen.getByTestId("seg-circuits");
    expect(circuits.props.accessibilityState.disabled).toBe(true);
    expect(circuits.props.accessibilityLabel).toBe("Circuits — indisponible");

    fireEvent.press(circuits);
    expect(onChange).not.toHaveBeenCalled();
  });

  /** V2-CAT-01 (revue 5732014381, obligation 3) : cadre unique animé, jamais un fond par segment. */
  describe("cadre animé (V2-CAT-01)", () => {
    it("renders no indicator before the container is measured", () => {
      render(<SegmentedControl options={options} value="sessions" onChange={jest.fn()} testID="seg" />);
      expect(screen.queryByTestId("seg-indicator")).toBeNull();
    });

    it("renders the indicator once the container is measured, positioned toward the selected segment", () => {
      render(<SegmentedControl options={options} value="sessions" onChange={jest.fn()} testID="seg" />);

      fireEvent(screen.getByTestId("seg"), "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 354, height: 42 } },
      });

      expect(screen.getByTestId("seg-indicator")).toBeTruthy();
    });

    it("keeps a single shared indicator (never a background on each segment) after a selection change", () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <SegmentedControl options={options} value="sessions" onChange={onChange} testID="seg" />,
      );
      fireEvent(screen.getByTestId("seg"), "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 354, height: 42 } },
      });

      rerender(<SegmentedControl options={options} value="activities" onChange={onChange} testID="seg" />);

      expect(screen.getAllByTestId("seg-indicator")).toHaveLength(1);
      expect(screen.getByTestId("seg-activities").props.accessibilityState.selected).toBe(true);
    });

    /**
     * VISUAL_CORRECTION (revue iPhone du HEAD `d6ce731`, obligation 2) : le
     * cadre coloré doit rester centré verticalement, marges haute et basse
     * ÉGALES — la bordure du conteneur (`1` pt, `styles.container.borderWidth`)
     * doit être prise en compte, pas seulement le padding déclaré.
     */
    it("centers the indicator vertically, with equal top and bottom margins (accounting for the container border)", () => {
      render(<SegmentedControl options={options} value="sessions" onChange={jest.fn()} testID="seg" />);
      fireEvent(screen.getByTestId("seg"), "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 354, height: 42 } },
      });

      const indicator = screen.getByTestId("seg-indicator");
      const flattenedTop = StyleSheet.flatten(indicator.props.style).top as number;
      // Complément d'alignement du 07/10 (ajout C) : cadre sans contour.
      const containerBorderWidth = 0;
      const expectedTop =
        (dimensions.segmentedControl.height -
          containerBorderWidth * 2 -
          dimensions.segmentedControl.segmentHeight) /
        2;
      const marginBottom =
        dimensions.segmentedControl.height -
        containerBorderWidth * 2 -
        (flattenedTop + dimensions.segmentedControl.segmentHeight);

      expect(flattenedTop).toBe(expectedTop);
      expect(marginBottom).toBe(flattenedTop);
    });
  });

  // Complément d'alignement du 07/10 (ajout C, `DSF / Controls / Segmenté`
  // `7388:13779`) : style visuel seulement — mêmes options, mêmes valeurs.
  describe("style visuel standard (ajout C)", () => {
    it("draws a #EAEAFF tile (radius 10) under every option, beneath the selection indicator, without giving the pressable segments a background", () => {
      render(<SegmentedControl options={options} value="sessions" onChange={jest.fn()} testID="seg" />);
      fireEvent(screen.getByTestId("seg"), "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 354, height: 42 } },
      });

      for (const option of options) {
        const tile = StyleSheet.flatten(screen.getByTestId(`seg-tile-${option.value}`).props.style);
        expect(tile.backgroundColor).toBe(colors.segmentedInactiveSurface);
        expect(tile.borderRadius).toBe(10);
        expect(tile.height).toBe(34);
        expect(StyleSheet.flatten(screen.getByTestId(`seg-${option.value}`).props.style).backgroundColor).toBeUndefined();
      }
      expect(colors.segmentedInactiveSurface).toBe("#EAEAFF");
    });

    it("uses a borderless white 50 % frame of radius 14 with a 4 gap", () => {
      render(<SegmentedControl options={options} value="sessions" onChange={jest.fn()} testID="seg" />);
      const frame = StyleSheet.flatten(screen.getByTestId("seg").props.style);
      expect(frame.backgroundColor).toBe("rgba(255, 255, 255, 0.5)");
      expect(frame.borderWidth).toBe(0);
      expect(frame.borderRadius).toBe(14);
      expect(frame.gap).toBe(4);
      expect(frame.padding).toBe(4);
      expect(frame.height).toBe(42);
    });

    it("renders every label in Semi Bold 16/20, text-label when inactive and white when selected", () => {
      render(<SegmentedControl options={options} value="sessions" onChange={jest.fn()} testID="seg" />);
      const inactive = StyleSheet.flatten(screen.getByText("Activités").props.style);
      const selected = StyleSheet.flatten(screen.getByText("Séances").props.style);
      for (const style of [inactive, selected]) {
        expect(style.fontSize).toBe(type.segmentedLabel.fontSize);
        expect(style.lineHeight).toBe(20);
        expect(style.fontWeight).toBe("600");
      }
      expect(inactive.color).toBe(colors.textLabel);
      expect(selected.color).toBe(colors.background);
    });
  });
});
