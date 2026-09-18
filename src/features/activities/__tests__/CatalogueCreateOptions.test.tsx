import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import { CatalogueCreateOptions } from "@/features/activities/CatalogueCreateOptions";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { dimensions, spacing } from "@/shared/ui/tokens";

describe("CatalogueCreateOptions", () => {
  /**
   * Correction VISUAL_CORRECTION (revue iPhone du HEAD `fa4d803`, issue
   * #150 commentaire 5736165618) : l'arbre ne doit plus être démonté
   * (`return null`) tant qu'il est fermé — ce montage/démontage
   * conditionnel, combiné à l'animation pilotée nativement, entrait en
   * course avec la création de la vue native sur appareil réel et pouvait
   * y bloquer l'ouverture sans jamais produire le moindre changement
   * visuel. L'arbre reste désormais TOUJOURS monté ; fermé, il doit être
   * invisible ET non interactif (`pointerEvents: "none"`), jamais absent.
   */
  it("stays mounted but invisible and non-interactive when not visible (VISUAL_CORRECTION, issue #150 comment 5736165618)", () => {
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
    const menu = screen.getByTestId("catalogue-create-tree");
    const scrim = screen.getByTestId("catalogue-create-tree-scrim");
    expect(menu.props.pointerEvents).toBe("none");
    expect(scrim.props.pointerEvents).toBe("none");
  });

  /**
   * Correction VISUAL_CORRECTION (revue iPhone du HEAD `fa4d803`, issue
   * #150 commentaire 5736165618) : preuve ciblée du mécanisme fautif —
   * une transition RÉELLE `visible=false` → `visible=true` sur la MÊME
   * instance (via `rerender`, jamais un nouveau montage direct à `visible`)
   * doit rendre l'arbre effectivement interactif. `fireEvent.press` seul ne
   * suffit pas comme preuve (il invoque le gestionnaire JS directement,
   * sans jamais passer par `pointerEvents`/le montage réel) — ce test
   * vérifie donc l'état `pointerEvents` réellement exposé aux vues natives
   * avant et après la transition, sur l'arbre qui reste la même instance
   * tout du long (jamais démonté puis recréé).
   */
  it("transitions the overlay/menu from inert to interactive across a real visible=false → visible=true change (VISUAL_CORRECTION, issue #150 comment 5736165618)", () => {
    const { rerender } = render(
      <TestSafeAreaProvider>
        <CatalogueCreateOptions
          visible={false}
          onSelectNewActivity={jest.fn()}
          onSelectNewSession={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );

    expect(screen.getByTestId("catalogue-create-tree").props.pointerEvents).toBe("none");
    expect(screen.getByTestId("catalogue-create-tree-scrim").props.pointerEvents).toBe("none");

    rerender(
      <TestSafeAreaProvider>
        <CatalogueCreateOptions
          visible
          onSelectNewActivity={jest.fn()}
          onSelectNewSession={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );

    expect(screen.getByTestId("catalogue-create-tree").props.pointerEvents).toBe("auto");
    expect(screen.getByTestId("catalogue-create-tree-scrim").props.pointerEvents).toBe("auto");
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
