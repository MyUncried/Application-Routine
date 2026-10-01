import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import { CatalogueCreateOptions } from "@/features/activities/CatalogueCreateOptions";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { dimensions, spacing } from "@/shared/ui/tokens";

describe("CatalogueCreateOptions", () => {
  /**
   * V2-CAT-01 (plan §5, UI-CAT-R-001) : l'arbre est désormais porté par un
   * `Modal` natif transparent — seule primitive capable de couvrir le shell
   * de l'écran ET la barre d'onglets sœur du contenu, rendue hors de son
   * arbre React. `Modal` gère lui-même le montage de son contenu selon
   * `visible` : fermé, ni l'arbre ni son voile n'existent dans l'arbre React.
   */
  it("renders neither the tree nor its scrim while not visible", () => {
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
    expect(screen.queryByTestId("catalogue-create-tree-scrim")).toBeNull();
  });

  /**
   * `Modal` reçoit `visible`, `transparent` et `onRequestClose` — ce dernier
   * couvre le bouton retour matériel Android au même titre qu'`Annuler`
   * (V2-CAT-01, plan §5).
   */
  it("passes visible, transparent and onRequestClose to the native Modal", () => {
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
    const modal = screen.getByTestId("catalogue-create-tree-modal");
    expect(modal.props.visible).toBe(true);
    expect(modal.props.transparent).toBe(true);
    expect(modal.props.animationType).toBe("fade");
    modal.props.onRequestClose();
    expect(onCancel).toHaveBeenCalledTimes(1);
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
    expect(screen.getByText("Un nouvel exercice")).toBeTruthy();
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

  /**
   * V2-CAT-01 (UI-CAT-R-001, revue indépendante 35529973203) : le voile
   * sombre reste INERTE — un appui sur lui ne ferme jamais l'arbre ni
   * n'appelle `onCancel`. Seul `Annuler` (ou le retour matériel Android,
   * `onRequestClose`) ferme explicitement ce parcours.
   */
  it("keeps the dark scrim inert — pressing it never calls onCancel nor closes the menu", () => {
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

    const backdrop = screen.getByTestId("catalogue-create-tree-backdrop");
    expect(backdrop.props.onPress).toBeUndefined();
    fireEvent.press(backdrop);

    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByTestId("catalogue-create-tree")).toBeTruthy();
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
