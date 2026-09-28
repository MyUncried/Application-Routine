import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { dimensions } from "@/shared/ui/tokens";

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
      const containerBorderWidth = 1;
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
});
