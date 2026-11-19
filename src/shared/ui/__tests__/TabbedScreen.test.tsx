import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { StyleSheet, Text } from "react-native";

import { CONTEXT_ZONE_GEOMETRY } from "@/shared/ui/catalogueContext";
import { TabbedScreen } from "@/shared/ui/TabbedScreen";
import { colors } from "@/shared/ui/tokens";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Haut d'écran à onglets partagé (« EcranAOnglets », Hermann, 19/11/2026) : un seul assemblage pour les Catalogues, le
 * Calendrier et le Profil. Les écrans consommateurs sont couverts par leurs propres tests ; ce fichier verrouille la
 * géométrie commune. Jest n'exerce pas la mise en page : vérification sur iPhone nécessaire.
 */
const tabs = {
  options: [
    { value: "a", label: "Journal" },
    { value: "b", label: "Agenda" },
    { value: "c", label: "Vue d’ensemble", disabled: true },
  ],
  value: "a",
  onChange: jest.fn(),
  testID: "tabs",
} as const;
const search = { value: "", onChangeText: jest.fn(), placeholder: "Rechercher", accessibilityLabel: "Rechercher", clearLabel: "Effacer", testID: "search" };
const band = () => StyleSheet.flatten(screen.getByTestId("screen-context-band").props.style);

describe("TabbedScreen", () => {
  it("zone standard : bande de la couleur de la palette, marges des Catalogues, Rechercher, Filtre, Tri, Planifier standard", () => {
    const onPlan = jest.fn();
    render(
      <TestSafeAreaProvider>
        <TabbedScreen
          title="Calendrier"
          tabs={tabs}
          palette={{ context: colors.catalogueSessionsContext, header: colors.catalogueSessionsBackground }}
          context={{
            kind: "catalogue",
            summary: <Text>Actives 2</Text>,
            results: null,
            search,
            filter: <Text>filtre</Text>,
            sortLabel: "Trier",
            action: { label: "Planifier", icon: "plan", onPress: onPlan, testID: "plan" },
          }}
        >
          <Text>corps</Text>
        </TabbedScreen>
      </TestSafeAreaProvider>,
    );
    expect(band().paddingTop).toBe(CONTEXT_ZONE_GEOMETRY.paddingTop);
    expect(band().paddingBottom).toBe(CONTEXT_ZONE_GEOMETRY.paddingBottom);
    expect(band().height).toBe(115);
    expect(StyleSheet.flatten(screen.getByTestId("screen-context-band-solid", { includeHiddenElements: true }).props.style).backgroundColor).toBe(colors.catalogueSessionsContext);
    expect(StyleSheet.flatten(screen.getByTestId("screen-header").props.style).backgroundColor).toBe(colors.catalogueSessionsBackground);
    expect(screen.getByTestId("catalogue-context-zone")).toBeTruthy();
    expect(screen.getByTestId("catalogue-sort-action").props.accessibilityState).toMatchObject({ disabled: true });
    // Planifier : le cercle de commande standard (même cercle que Créer), icône `icon-planifier`.
    expect(screen.getByTestId("plan-icon")).toBeTruthy();
    fireEvent.press(screen.getByTestId("plan"));
    expect(onPlan).toHaveBeenCalled();
    expect(screen.getByTestId("tabs")).toBeTruthy();
    expect(screen.getByText("corps")).toBeTruthy();
  });

  it("Créer garde l'identifiant des Catalogues ; zone libre « centered » : contenu centré, sans marges verticales", () => {
    const { rerender } = render(
      <TestSafeAreaProvider>
        <TabbedScreen
          title="Catalogue"
          tabs={tabs}
          palette={{ context: colors.catalogueMovementsContext, background: colors.catalogueMovementsBackground }}
          context={{ kind: "catalogue", summary: null, results: null, search, filter: null, sortLabel: "Trier", action: { label: "Créer", icon: "create", onPress: jest.fn() } }}
        />
      </TestSafeAreaProvider>,
    );
    expect(screen.getByTestId("catalogue-create-action")).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId("screen-shell").props.style).backgroundColor).toBe(colors.catalogueMovementsBackground);
    rerender(
      <TestSafeAreaProvider>
        <TabbedScreen title="Agenda" tabs={tabs} palette={{ context: colors.catalogueSessionsContext }} context={{ kind: "custom", layout: "centered", content: <Text>mois</Text> }} />
      </TestSafeAreaProvider>,
    );
    expect(band().paddingTop).toBe(0);
    expect(band().paddingBottom).toBe(0);
    expect(StyleSheet.flatten(screen.getByTestId("tabbed-screen-centered-context").props.style)).toMatchObject({ flex: 1, justifyContent: "center" });
  });

  it("compteurs en lecture : format des compteurs des Catalogues (libellé gris, nombre #333 à 6, « · » à 8)", () => {
    render(
      <TestSafeAreaProvider>
        <TabbedScreen
          title="Calendrier"
          tabs={tabs}
          palette={{ context: colors.catalogueSessionsContext }}
          context={{
            kind: "catalogue",
            summary: { counters: [{ label: "Actives", value: "13", testID: "a" }, { label: "Terminées", value: "0", testID: "f" }] },
            results: null,
            search,
            filter: null,
            sortLabel: "Trier",
          }}
        />
      </TestSafeAreaProvider>,
    );
    expect(StyleSheet.flatten(screen.getByText("Actives").props.style).color).toBe(colors.textSecondary);
    expect(StyleSheet.flatten(screen.getByTestId("a").props.style)).toMatchObject({ color: "#333333", marginLeft: 6 });
    expect(StyleSheet.flatten(screen.getByText("·").props.style)).toMatchObject({ color: "#333333", marginHorizontal: 8 });
    expect(screen.getByTestId("f").props.children).toBe("0");
  });

  it("zone libre par défaut : marges des Catalogues ; sans zone : bande courte sous les onglets", () => {
    const { rerender } = render(
      <TestSafeAreaProvider>
        <TabbedScreen title="Profil" tabs={tabs} palette={{ context: colors.catalogueSessionsContext }} context={{ kind: "custom", content: <Text>identité</Text> }} />
      </TestSafeAreaProvider>,
    );
    expect(band().paddingTop).toBe(CONTEXT_ZONE_GEOMETRY.paddingTop);
    rerender(
      <TestSafeAreaProvider>
        <TabbedScreen title="Profil" tabs={tabs} palette={{ context: colors.catalogueSessionsContext, background: colors.catalogueSessionsBackground }} />
      </TestSafeAreaProvider>,
    );
    expect(screen.queryByTestId("screen-context-band")).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("profile-tab-band", { includeHiddenElements: true }).props.style)).toMatchObject({ height: 14, backgroundColor: colors.catalogueSessionsContext });
  });
});
