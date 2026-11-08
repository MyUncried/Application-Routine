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
 *
 * [04/11/2026 — demande de Hermann : « Afficher en mode modale iOS (mode d'apparition identique à la fiche des
 * mouvements du questionnaire par exemple) […] Catalogue des mouvements : Filtres […] Catalogue des séances : Filtres » :
 * les feuilles des Catalogues sont désormais des feuilles natives (voile du système, `FilterSheetFrame.native.test.tsx`).
 * Ce cadre dessiné ne sert plus que de base à la variante `docked` (mode catalogue d'un Format).]
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
