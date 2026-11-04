import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";

import { FilterSheetFrame } from "@/features/activities/FilterSheetPrimitives";
import { PendingFilterSheet } from "@/features/activities/FilterSheetRoute";
import { releaseFilterSheet, requestFilterSheet } from "@/features/activities/filterSheetRelay";
import { EMPTY_MOVEMENT_FILTERS } from "@/features/activities/movementCatalogueView";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Demande de Hermann du 04/11/2026 (texte exact) : « Afficher en mode modale iOS (mode d'apparition identique à la fiche
 * des mouvements du questionnaire par exemple) les 3 modales et écrans suivants : Catalogue des mouvements : Filtres ;
 * Catalogue des mouvements : Créer un mouvement ; Catalogue des séances : Filtres ».
 *
 * Les feuilles de filtres des Catalogues sont le contenu d'une feuille native iOS (route `formSheet`) : ni `Modal`, ni
 * voile, ni translation, ni poignée dessinés (le système les porte, comme pour la fiche du questionnaire). La montée, la
 * descente et le voile ne sont pas observables sous Jest : seul le contrat de rendu et de relais l'est.
 */
describe("FilterSheetFrame — feuille native (04/11/2026)", () => {
  const renderFrame = (onNeededHeight?: (height: number) => void) => {
    const onClose = jest.fn();
    const onApply = jest.fn();
    render(
      <TestSafeAreaProvider>
        <FilterSheetFrame
          title="Filtres"
          closeLabel="Fermer"
          applyLabel="Appliquer"
          onClose={onClose}
          onApply={onApply}
          testIDPrefix="f"
          native={onNeededHeight === undefined ? {} : { onNeededHeight }}
        >
          <Text>Critères</Text>
        </FilterSheetFrame>
      </TestSafeAreaProvider>,
    );
    return { onClose, onApply };
  };

  it("sans Modal, voile, panneau glissant ni poignée ; contenu et en-tête inchangés ; ✕ et ✓ rendent la main aussitôt", () => {
    const { onClose, onApply } = renderFrame();
    expect(screen.queryByTestId("f-scrim", { includeHiddenElements: true })).toBeNull();
    expect(screen.queryByTestId("f-panel")).toBeNull();
    expect(screen.queryByTestId("f-handle")).toBeNull();
    expect(screen.getByTestId("f-sheet").props.animationType).toBeUndefined();
    expect(screen.getByText("Critères")).toBeTruthy();
    expect(screen.getByTestId("f-header-divider")).toBeTruthy();
    fireEvent.press(screen.getByTestId("f-close"));
    fireEvent.press(screen.getByTestId("f-apply"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("recette du 04/11 (captures de Hermann) : en-tête fixé en haut, au premier plan ; la liste réserve sa hauteur", () => {
    renderFrame();
    const header = screen.getByTestId("f-native-header");
    expect(StyleSheet.flatten(header.props.style)).toMatchObject({ position: "absolute", top: 0, zIndex: 2 });
    expect(within(header).getByTestId("f-close")).toBeTruthy();
    expect(within(header).getByTestId("f-apply")).toBeTruthy();
    fireEvent(header, "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 80 } } });
    expect(StyleSheet.flatten(screen.getByTestId("f-scroll").props.contentContainerStyle).paddingTop).toBe(96);
  });

  it("hauteur utile = feuille − partie visible du défilement + contenu, pour ajuster la feuille à son contenu", () => {
    const onNeededHeight = jest.fn<(height: number) => void>();
    renderFrame(onNeededHeight);
    fireEvent(screen.getByTestId("f-sheet"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 700 } } });
    fireEvent(screen.getByTestId("f-scroll"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 500 } } });
    fireEvent(screen.getByTestId("f-scroll"), "contentSizeChange", 390, 320);
    expect(onNeededHeight).toHaveBeenLastCalledWith(520);
  });
});

describe("PendingFilterSheet — relais des filtres de l'écran appelant (04/11/2026)", () => {
  const referentials = {
    listCategories: async () => [],
    listBodyZones: async () => [],
  } as unknown as ReferentialService;

  it("affiche la feuille demandée ; ✓ applique puis rend la main une seule fois", async () => {
    const onApply = jest.fn();
    const onLeave = jest.fn(() => releaseFilterSheet());
    render(
      <TestSafeAreaProvider>
        <ReferentialServiceContext.Provider value={referentials}>
          <PendingFilterSheet onLeave={onLeave} />
        </ReferentialServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
    expect(screen.queryByTestId("movement-filter-sheet")).toBeNull();
    act(() => requestFilterSheet({ kind: "movements", filters: EMPTY_MOVEMENT_FILTERS, onApply }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByTestId("movement-filter-handle")).toBeNull();
    fireEvent.press(screen.getByTestId("movement-filter-status-archived"));
    fireEvent.press(screen.getByTestId("movement-filter-apply"));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("movement-filter-sheet")).toBeNull();
  });

  it("✕ rend la main sans appliquer", async () => {
    const onApply = jest.fn();
    const onLeave = jest.fn();
    render(
      <TestSafeAreaProvider>
        <ReferentialServiceContext.Provider value={referentials}>
          <PendingFilterSheet onLeave={onLeave} />
        </ReferentialServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
    act(() => requestFilterSheet({ kind: "movements", filters: EMPTY_MOVEMENT_FILTERS, onApply }));
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.press(screen.getByTestId("movement-filter-close"));
    fireEvent.press(screen.getByTestId("movement-filter-close"));
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
    // Sans démontage (feuille encore en descente), le contenu reste affiché.
    expect(screen.getByTestId("movement-filter-sheet")).toBeTruthy();
    act(() => releaseFilterSheet());
  });
});
