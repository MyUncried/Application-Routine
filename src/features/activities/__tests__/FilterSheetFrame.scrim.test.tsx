import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";

import { FilterSheetFrame } from "@/features/activities/FilterSheetPrimitives";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

/**
 * Contre-recette n° 2 du 30/10/2026 (Hermann) : à l'ouverture d'une feuille de filtres, le voile
 * grisé apparaît en fondu (comme celui du menu Créer de la Composition) ; il ne monte plus du bas
 * avec la modale, qui seule glisse.
 */
describe("FilterSheetFrame — voile en fondu", () => {
  it("la modale ne glisse plus d'un bloc ; le voile est une couche distincte de la feuille, sans toucher", () => {
    render(
      <TestSafeAreaProvider>
        <FilterSheetFrame title="Filtres" closeLabel="Fermer" applyLabel="Appliquer" onClose={jest.fn()} onApply={jest.fn()} testIDPrefix="f">
          <Text>Critères</Text>
        </FilterSheetFrame>
      </TestSafeAreaProvider>,
    );
    expect(screen.getByTestId("f-sheet").props.animationType).toBe("none");
    const scrim = screen.getByTestId("f-scrim", { includeHiddenElements: true });
    expect(StyleSheet.flatten(scrim.props.style).backgroundColor).toBe(colors.overlayScrim);
    expect(scrim.props.pointerEvents).toBe("none");
    expect(screen.getByText("Critères")).toBeTruthy();
  });
});
