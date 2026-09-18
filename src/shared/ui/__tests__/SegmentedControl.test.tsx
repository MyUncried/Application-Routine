import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import { SegmentedControl } from "@/shared/ui/SegmentedControl";

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
});
