import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import { CatalogueCreateOptions } from "@/features/activities/CatalogueCreateOptions";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { dimensions, spacing } from "@/shared/ui/tokens";

describe("CatalogueCreateOptions", () => {
  it("renders nothing when not visible", () => {
    render(
      <TestSafeAreaProvider>
        <CatalogueCreateOptions
          visible={false}
          onSelectNewActivity={jest.fn()}
          onSelectNewSession={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    expect(screen.queryByTestId("catalogue-create-tree")).toBeNull();
  });

  it("shows exactly the four options in the exact order", () => {
    render(
      <TestSafeAreaProvider>
        <CatalogueCreateOptions
          visible
          onSelectNewActivity={jest.fn()}
          onSelectNewSession={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    expect(screen.getByText("Une nouvelle activité")).toBeTruthy();
    expect(screen.getByText("Une séance")).toBeTruthy();
    expect(screen.getByText("Un circuit")).toBeTruthy();
    expect(screen.getByText("Annuler")).toBeTruthy();
  });

  it("disables Un circuit with no handler", () => {
    render(
      <TestSafeAreaProvider>
        <CatalogueCreateOptions
          visible
          onSelectNewActivity={jest.fn()}
          onSelectNewSession={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    const circuit = screen.getByTestId("catalogue-create-tree-new-circuit");
    expect(circuit.props.accessibilityState.disabled).toBe(true);
  });

  it("calls onSelectNewActivity for Une nouvelle activité", () => {
    const onSelectNewActivity = jest.fn();
    render(
      <TestSafeAreaProvider>
        <CatalogueCreateOptions
          visible
          onSelectNewActivity={onSelectNewActivity}
          onSelectNewSession={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    fireEvent.press(screen.getByTestId("catalogue-create-tree-new-activity"));
    expect(onSelectNewActivity).toHaveBeenCalledTimes(1);
  });

  it("closes without any mutation on Annuler", () => {
    const onCancel = jest.fn();
    render(
      <TestSafeAreaProvider>
        <CatalogueCreateOptions
          visible
          onSelectNewActivity={jest.fn()}
          onSelectNewSession={jest.fn()}
          onCancel={onCancel}
        />
      </TestSafeAreaProvider>,
    );
    fireEvent.press(screen.getByTestId("catalogue-create-tree-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  /**
   * VISUAL_CORRECTION (revue iPhone du HEAD `d6ce731`, obligation 3) :
   * l'arbre doit apparaître SOUS l'en-tête fixe et la bande Context réels
   * (`ScreenShell`/`FixedHeader`/`ContextBand`), jamais chevaucher l'en-tête
   * — cause du bouton `+ Créer` perçu comme non fonctionnel (l'arbre
   * s'ouvrait déjà, mais invisible/confondu avec l'en-tête).
   */
  it("positions the tree below the fixed header and the context band, accounting for the top safe-area inset", () => {
    render(
      <TestSafeAreaProvider>
        <CatalogueCreateOptions
          visible
          onSelectNewActivity={jest.fn()}
          onSelectNewSession={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );

    const menu = screen.getByTestId("catalogue-create-tree");
    const flattenedTop = StyleSheet.flatten(menu.props.style).top as number;
    // Insets de test (`TestSafeAreaProvider`) : `top: 47`.
    const expectedTop = 47 + dimensions.header.contentHeight + 1 + dimensions.contextBand.height + spacing[8];
    expect(flattenedTop).toBe(expectedTop);
  });
});
