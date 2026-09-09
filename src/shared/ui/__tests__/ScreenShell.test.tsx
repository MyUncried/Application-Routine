import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { StyleSheet, Text } from "react-native";

import { ContextBand, FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, minTouchTarget } from "@/shared/ui/tokens";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * `Screen Shell` Foundation partagé (`CMP-01`, contre-recette iPhone,
 * correction consolidée, `[ChatGPT] DIAGNOSTIC APPROVED — PHASE02
 * CONSOLIDATED REWORK02`, 2026-09-03). `CatalogueScreen.test.tsx` et
 * `CompositionScreen.test.tsx` couvrent déjà chaque écran consommateur en
 * contexte réel ; ce fichier couvre le composant partagé lui-même, isolé.
 */
function renderWithSafeArea(children: React.ReactElement) {
  return render(<TestSafeAreaProvider>{children}</TestSafeAreaProvider>);
}

describe("ScreenShell", () => {
  it("renders its children inside a full-height container", () => {
    renderWithSafeArea(
      <ScreenShell>
        <Text>contenu</Text>
      </ScreenShell>,
    );
    expect(screen.getByText("contenu")).toBeTruthy();
  });
});

describe("FixedHeader", () => {
  it("renders the title, with no Retour circle when onBack is omitted (Catalogue, a bottom-navigation root screen)", () => {
    renderWithSafeArea(<FixedHeader title="Mes séances" />);

    expect(screen.getByText("Mes séances")).toBeTruthy();
    expect(screen.queryByTestId("screen-header-back")).toBeNull();
  });

  /**
   * **T02-S02 (D-142)** : « Les actions circulaires Retour, Annuler et
   * Valider/Confirmer utilisent un cercle visible `38 × 38`, une icône
   * `24 × 24` et une cible tactile `48 × 48` ». Révise R4-02 (`28 × 28`),
   * antérieur à cette décision. La cible tactile, elle, est INCHANGÉE —
   * elle reste portée par `hitSlop`, jamais par la boîte visuelle.
   */
  it("renders a Retour circle (pale-fill, 38×38 visual, D-142) with a 48×48 touch target via hitSlop, calling it on press", () => {
    const onBack = jest.fn();
    renderWithSafeArea(
      <FixedHeader title="Composition" onBack={onBack} backAccessibilityLabel="Retour" />,
    );

    const back = screen.getByTestId("screen-header-back");
    const flattened = StyleSheet.flatten(back.props.style);
    expect(flattened.width).toBe(38);
    expect(flattened.height).toBe(38);
    expect(flattened.borderRadius).toBe(19);
    expect(flattened.width + back.props.hitSlop * 2).toBe(minTouchTarget);
    expect(minTouchTarget).toBe(48);
    expect(flattened.backgroundColor).toBe(colors.selectionSurface);
    expect(back.props.accessibilityLabel).toBe("Retour");

    fireEvent.press(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("D-142 — the Retour icon renders at the canonical 24×24 inside the 38×38 circle / 48×48 touch target", () => {
    renderWithSafeArea(
      <FixedHeader title="Composition" onBack={jest.fn()} backAccessibilityLabel="Retour" />,
    );

    const icon = screen.getByTestId("screen-header-back-icon");
    const flattened = StyleSheet.flatten(icon.props.style);
    expect(flattened.width).toBe(24);
    expect(flattened.height).toBe(24);
  });

  it("reserves the real top safe-area inset in the header's own height, exactly once", () => {
    renderWithSafeArea(<FixedHeader title="Composition" />);

    const header = screen.getByTestId("screen-header");
    const flattened = StyleSheet.flatten(header.props.style);
    // `TestSafeAreaProvider` : insets.top = 47.
    expect(flattened.paddingTop).toBe(47);
  });
});

describe("HeaderSeparator", () => {
  it("renders a thin divider, distinct from the general background", () => {
    renderWithSafeArea(<HeaderSeparator />);

    const separator = screen.getByTestId("screen-header-separator");
    const flattened = StyleSheet.flatten(separator.props.style);
    expect(flattened.height).toBe(1);
    expect(flattened.backgroundColor).not.toBe(colors.background);
  });
});

describe("ContextBand", () => {
  it("renders its children on a pale background, not elevated by default", () => {
    renderWithSafeArea(
      <ContextBand>
        <Text>filtre</Text>
      </ContextBand>,
    );

    const band = screen.getByTestId("screen-context-band");
    const flattened = StyleSheet.flatten(band.props.style);
    expect(flattened.backgroundColor).toBe(colors.selectionSurface);
    expect(flattened.height).toBe(115);
    expect(flattened.paddingTop).toBe(12);
    expect(flattened.paddingBottom).toBe(16);
    expect(flattened.justifyContent).toBe("space-between");
    expect(flattened.zIndex).toBeUndefined();
    expect(screen.getByText("filtre")).toBeTruthy();
  });

  it("elevates itself (zIndex: 1) above sibling content when elevated=true (an integrated selector is open)", () => {
    renderWithSafeArea(
      <ContextBand elevated>
        <Text>filtre</Text>
      </ContextBand>,
    );

    const band = screen.getByTestId("screen-context-band");
    expect(StyleSheet.flatten(band.props.style).zIndex).toBe(1);
  });
});
