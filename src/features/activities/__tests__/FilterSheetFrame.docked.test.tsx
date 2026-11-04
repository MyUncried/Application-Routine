import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";

import { FilterSheetFrame } from "@/features/activities/FilterSheetPrimitives";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette du 04/11/2026 (mode catalogue d'un Format, Hermann : « apparition de la fenêtre du filtre doit se faire plus
 * lentement, jusqu'à la limite de la zone de contexte » ; « la disparition de la page du filtre doit se faire de haut en
 * bas, plus lentement ») — variante `docked`.
 */
describe("FilterSheetFrame — variante docked", () => {
  const renderSheet = (docked?: { top: number }) => {
    const onClose = jest.fn();
    const onApply = jest.fn();
    render(
      <TestSafeAreaProvider>
        <FilterSheetFrame title="Filtres" closeLabel="Fermer" applyLabel="Appliquer" onClose={onClose} onApply={onApply} testIDPrefix="f" {...(docked ? { docked } : {})}>
          <Text>Critères</Text>
        </FilterSheetFrame>
      </TestSafeAreaProvider>,
    );
    return { onClose, onApply };
  };

  it("haut de la feuille à la limite donnée ; fermeture et validation après la descente, une seule fois", async () => {
    const { onClose, onApply } = renderSheet({ top: 300 });
    const panel = StyleSheet.flatten(screen.getByTestId("f-panel").props.style);
    expect(panel.height).toBeGreaterThan(0);
    expect(panel.maxHeight).toBeUndefined();
    fireEvent.press(screen.getByTestId("f-close"));
    fireEvent.press(screen.getByTestId("f-apply"));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onApply).not.toHaveBeenCalled();
  });

  it("sans variante : feuille standard, fermeture immédiate", () => {
    const { onClose } = renderSheet();
    expect(StyleSheet.flatten(screen.getByTestId("f-panel").props.style).maxHeight).toBeGreaterThan(0);
    fireEvent.press(screen.getByTestId("f-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
