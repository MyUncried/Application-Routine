import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import { BodyZoneSelector } from "@/features/sessions/BodyZoneSelector";

const ZONES = [
  { id: "cou", name: "Cou", order: 0 },
  { id: "epaules", name: "Épaules", order: 1 },
  { id: "dos", name: "Dos", order: 2 },
] as const;

describe("BodyZoneSelector", () => {
  it("renders one control per supplied zone, using its name as the accessibility label", () => {
    render(
      <BodyZoneSelector
        zones={ZONES}
        selectedIds={[]}
        onToggle={jest.fn()}
        accessibilityLabel="Zones corporelles"
      />,
    );

    expect(screen.getByLabelText("Cou")).toBeTruthy();
    expect(screen.getByLabelText("Épaules")).toBeTruthy();
    expect(screen.getByLabelText("Dos")).toBeTruthy();
  });

  it("exposes accessibilityState.checked=true only for the selected zones", () => {
    render(
      <BodyZoneSelector
        zones={ZONES}
        selectedIds={["epaules"]}
        onToggle={jest.fn()}
        accessibilityLabel="Zones corporelles"
      />,
    );

    expect(screen.getByLabelText("Cou").props.accessibilityState).toEqual({ checked: false });
    expect(screen.getByLabelText("Épaules").props.accessibilityState).toEqual({ checked: true });
    expect(screen.getByLabelText("Dos").props.accessibilityState).toEqual({ checked: false });
  });

  it("calls onToggle with exactly the pressed zone's id", () => {
    const onToggle = jest.fn();
    render(
      <BodyZoneSelector
        zones={ZONES}
        selectedIds={[]}
        onToggle={onToggle}
        accessibilityLabel="Zones corporelles"
      />,
    );

    fireEvent.press(screen.getByLabelText("Dos"));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("dos");
  });

  it("supports multiple simultaneous selections (never a single-select radio)", () => {
    render(
      <BodyZoneSelector
        zones={ZONES}
        selectedIds={["cou", "dos"]}
        onToggle={jest.fn()}
        accessibilityLabel="Zones corporelles"
      />,
    );

    expect(screen.getByLabelText("Cou").props.accessibilityState).toEqual({ checked: true });
    expect(screen.getByLabelText("Dos").props.accessibilityState).toEqual({ checked: true });
  });

  it("renders an empty container without error when zones is empty", () => {
    render(
      <BodyZoneSelector
        zones={[]}
        selectedIds={[]}
        onToggle={jest.fn()}
        accessibilityLabel="Zones corporelles"
      />,
    );

    expect(screen.getByTestId("body-zone-selector")).toBeTruthy();
  });

  it("carries the container-level accessibilityLabel and radiogroup role", () => {
    render(
      <BodyZoneSelector
        zones={ZONES}
        selectedIds={[]}
        onToggle={jest.fn()}
        accessibilityLabel="Zones corporelles"
      />,
    );

    const container = screen.getByTestId("body-zone-selector");
    expect(container.props.accessibilityRole).toBe("radiogroup");
    expect(container.props.accessibilityLabel).toBe("Zones corporelles");
  });
});
