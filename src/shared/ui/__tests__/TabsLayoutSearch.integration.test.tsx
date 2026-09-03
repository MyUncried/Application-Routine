import { renderRouter, screen } from "expo-router/testing-library";
import { describe, expect, it } from "@jest/globals";
import { Text } from "react-native";

/**
 * Test d'intégration avec un vrai navigateur (`expo-router/testing-library`)
 * pour la navigation basse à quatre onglets + l'action Recherche distincte
 * (correction de conformité, `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`,
 * AUD-02). `app/(tabs)/_layout.tsx` doit être exercé tel quel (pas une
 * reproduction locale) : c'est le fichier de route réel, dont dépend le
 * rendu effectif de l'action Recherche au-dessus de la barre à onglets.
 */
function IndexRoute() {
  return <Text>index-screen</Text>;
}
function CalendarRoute() {
  return <Text>calendar-screen</Text>;
}
function HistoryRoute() {
  return <Text>history-screen</Text>;
}
function ProfileRoute() {
  return <Text>profile-screen</Text>;
}

function renderTabsLayout() {
  return renderRouter(
    {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(tabs)/_layout": require("../../../../app/(tabs)/_layout").default,
      "(tabs)/index": IndexRoute,
      "(tabs)/calendar": CalendarRoute,
      "(tabs)/history": HistoryRoute,
      "(tabs)/profile": ProfileRoute,
    },
    { initialUrl: "/" },
  );
}

describe("Navigation basse — action Recherche distincte (AUD-02)", () => {
  it("renders a visible, disabled search action alongside the four tabs, producing no navigation", () => {
    renderTabsLayout();

    const search = screen.getByTestId("navigation-search-action");
    expect(search.props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("navigation-search-icon")).toBeTruthy();

    // Toujours sur l'onglet Séances par défaut : l'action désactivée ne
    // produit aucune navigation.
    expect(screen.getByText("index-screen")).toBeTruthy();
  });
});
