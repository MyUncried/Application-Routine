import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import { CatalogueCreateOptions } from "@/features/activities/CatalogueCreateOptions";

describe("CatalogueCreateOptions", () => {
  it("renders nothing when not visible", () => {
    render(
      <CatalogueCreateOptions
        visible={false}
        onSelectNewActivity={jest.fn()}
        onSelectNewSession={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.queryByTestId("catalogue-create-tree")).toBeNull();
  });

  it("shows exactly the four options in the exact order", () => {
    render(
      <CatalogueCreateOptions
        visible
        onSelectNewActivity={jest.fn()}
        onSelectNewSession={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText("Une nouvelle activité")).toBeTruthy();
    expect(screen.getByText("Une séance")).toBeTruthy();
    expect(screen.getByText("Un circuit")).toBeTruthy();
    expect(screen.getByText("Annuler")).toBeTruthy();
  });

  it("disables Un circuit with no handler", () => {
    render(
      <CatalogueCreateOptions
        visible
        onSelectNewActivity={jest.fn()}
        onSelectNewSession={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    const circuit = screen.getByTestId("catalogue-create-tree-new-circuit");
    expect(circuit.props.accessibilityState.disabled).toBe(true);
  });

  it("calls onSelectNewActivity for Une nouvelle activité", () => {
    const onSelectNewActivity = jest.fn();
    render(
      <CatalogueCreateOptions
        visible
        onSelectNewActivity={onSelectNewActivity}
        onSelectNewSession={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByTestId("catalogue-create-tree-new-activity"));
    expect(onSelectNewActivity).toHaveBeenCalledTimes(1);
  });

  it("closes without any mutation on Annuler", () => {
    const onCancel = jest.fn();
    render(
      <CatalogueCreateOptions
        visible
        onSelectNewActivity={jest.fn()}
        onSelectNewSession={jest.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(screen.getByTestId("catalogue-create-tree-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
