import { render, screen } from "@testing-library/react-native";
import { describe, expect, it } from "@jest/globals";
import { Text } from "react-native";

import { WheelPickerOverlay } from "@/features/sessions/WheelPickerOverlay";

describe("WheelPickerOverlay (T01-S09 correction VISUAL, point D)", () => {
  it("renders nothing when not visible", () => {
    render(
      <WheelPickerOverlay visible={false}>
        <Text>contenu</Text>
      </WheelPickerOverlay>,
    );
    expect(screen.queryByText("contenu")).toBeNull();
    expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
  });

  it("renders its children inside a full-screen Modal when visible", () => {
    render(
      <WheelPickerOverlay visible>
        <Text>contenu</Text>
      </WheelPickerOverlay>,
    );
    expect(screen.getByText("contenu")).toBeTruthy();
    expect(screen.getByTestId("wheel-picker-overlay")).toBeTruthy();
  });

  it("the backdrop is not pressable (no onPress) — only Annuler/Confirmer inside the children can close it", () => {
    render(
      <WheelPickerOverlay visible>
        <Text>contenu</Text>
      </WheelPickerOverlay>,
    );
    const backdrop = screen.getByTestId("wheel-picker-overlay-backdrop");
    expect(backdrop.props.onPress).toBeUndefined();
  });
});
