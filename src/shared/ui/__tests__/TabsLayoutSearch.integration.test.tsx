import { fireEvent, renderRouter, screen } from "expo-router/testing-library";
import { describe, expect, it } from "@jest/globals";
import { StyleSheet, Text } from "react-native";

import {
  NAVIGATION_ACTIVE_FRAME,
  NAVIGATION_BAR_BOTTOM_RESIDUAL,
  NAVIGATION_BAR_HEIGHT,
  NAVIGATION_ICON_BOX,
  NAVIGATION_ROW_HORIZONTAL_MARGIN,
} from "@/shared/ui/navigationLayout";
import { colors, minTouchTarget } from "@/shared/ui/tokens";
import { strings } from "@/shared/i18n";

/**
 * Test d'intégration avec un vrai navigateur (`expo-router/testing-library`) :
 * `app/(tabs)/_layout.tsx` est exercé tel quel (fichier de route réel).
 *
 * PRE-8, recette A/B (E01) : barre Figma `Navigation / Bottom — 5 onglets`
 * (`6513:20151`) — cinq destinations (Catalogues, Calendrier, Suivi,
 * Communauté désactivée, Profil), plus aucun bouton Recherche.
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

const DESTINATIONS = ["index", "calendar", "history", "community", "profile"] as const;

describe("Navigation basse — cinq destinations (PRE-8 E01)", () => {
  it("renders the five destinations in the Figma order, with no search button", () => {
    renderTabsLayout();

    const group = screen.getByTestId("navigation-tabs-group");
    const ids = screen
      .getAllByTestId(/^navigation-tab-(index|calendar|history|community|profile)$/)
      .map((node) => node.props.testID as string);
    expect(ids).toEqual(DESTINATIONS.map((name) => `navigation-tab-${name}`));
    expect(group).toBeTruthy();

    expect(screen.getByLabelText(strings.screens.sessions.navLabel)).toBeTruthy();
    expect(screen.getByLabelText(strings.nav.calendar)).toBeTruthy();
    expect(screen.getByLabelText(strings.nav.history)).toBeTruthy();
    expect(screen.getByLabelText(strings.nav.community)).toBeTruthy();
    expect(screen.getByLabelText(strings.nav.profile)).toBeTruthy();

    expect(screen.queryByTestId("navigation-search-action")).toBeNull();
    expect(screen.queryByLabelText(strings.nav.search)).toBeNull();
  });

  it("keeps Communauté visible but disabled: pressing it navigates nowhere", () => {
    renderTabsLayout();

    const community = screen.getByTestId("navigation-tab-community");
    expect(community.props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("navigation-tab-icon-slot-community")).toBeTruthy();

    fireEvent.press(community);
    expect(screen.getByText("index-screen")).toBeTruthy();
    expect(screen.getByTestId("navigation-tab-index").props.accessibilityState).toMatchObject({ selected: true });
  });

  it("shows the label of the active destination only", () => {
    renderTabsLayout();

    expect(screen.getByTestId("navigation-tab-label-index")).toHaveTextContent(strings.screens.sessions.navLabel);
    expect(screen.queryByTestId("navigation-tab-label-calendar")).toBeNull();

    fireEvent.press(screen.getByTestId("navigation-tab-calendar"));
    expect(screen.getByText("calendar-screen")).toBeTruthy();
    expect(screen.getByTestId("navigation-tab-label-calendar")).toHaveTextContent(strings.nav.calendar);
    expect(screen.queryByTestId("navigation-tab-label-index")).toBeNull();
    const labelStyle = StyleSheet.flatten(screen.getByTestId("navigation-tab-label-calendar").props.style);
    expect(labelStyle.color).toBe(colors.primary);
    expect(labelStyle.fontSize).toBe(11);
  });

  it("navigates to the pressed destination via the custom tab bar", () => {
    renderTabsLayout();

    fireEvent.press(screen.getByTestId("navigation-tab-history"));
    expect(screen.getByText("history-screen")).toBeTruthy();

    fireEvent.press(screen.getByTestId("navigation-tab-profile"));
    expect(screen.getByText("profile-screen")).toBeTruthy();
  });

  it("gives every destination the same 32 icon box and a touch target of at least 48", () => {
    renderTabsLayout();

    for (const name of DESTINATIONS) {
      const tab = StyleSheet.flatten(screen.getByTestId(`navigation-tab-${name}`).props.style);
      expect(tab.flex).toBe(1);
      expect(tab.minHeight).toBe(minTouchTarget);
      const box = StyleSheet.flatten(screen.getByTestId(`navigation-tab-icon-slot-${name}`).props.style);
      expect(box.width).toBe(NAVIGATION_ICON_BOX);
      expect(box.height).toBe(NAVIGATION_ICON_BOX);
    }
    expect(NAVIGATION_BAR_HEIGHT).toBeGreaterThanOrEqual(minTouchTarget);
  });
});

describe("Navigation basse — barre Figma (PRE-8 E01)", () => {
  it("uses the Figma bar surface: 62 high, radius 33, subtle surface, white border", () => {
    renderTabsLayout();

    const bar = StyleSheet.flatten(screen.getByTestId("navigation-tabs-group").props.style);
    expect(bar.height).toBe(62);
    expect(bar.borderRadius).toBe(33);
    expect(bar.backgroundColor).toBe(colors.surfaceSubtle);
    expect(bar.borderColor).toBe(colors.background);
    expect(bar.borderWidth).toBe(1);
  });

  it("anchors the row to the physical screen edge with the Figma margins (24 sides, 16 bottom)", () => {
    renderTabsLayout();

    const row = StyleSheet.flatten(screen.getByTestId("navigation-row").props.style);
    expect(row.bottom).toBe(0);
    expect(row.left).toBe(NAVIGATION_ROW_HORIZONTAL_MARGIN);
    expect(row.right).toBe(NAVIGATION_ROW_HORIZONTAL_MARGIN);
    expect(NAVIGATION_ROW_HORIZONTAL_MARGIN).toBe(24);
    expect(row.paddingBottom).toBe(NAVIGATION_BAR_BOTTOM_RESIDUAL);
    expect(NAVIGATION_BAR_BOTTOM_RESIDUAL).toBe(16);
  });
});

/** V2-CAT-01 : le cadre actif reste visible et glisse continûment entre destinations. */
describe("Navigation basse — cadre actif animé (V2-CAT-01)", () => {
  it("renders the 66 × 50 active frame centred in the measured destination", () => {
    renderTabsLayout();

    fireEvent(screen.getByTestId("navigation-tab-index"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 70.8, height: 60 } },
    });

    const indicator = StyleSheet.flatten(screen.getByTestId("navigation-active-indicator").props.style);
    expect(indicator.width).toBe(NAVIGATION_ACTIVE_FRAME.width);
    expect(indicator.height).toBe(NAVIGATION_ACTIVE_FRAME.height);
    expect(indicator.borderRadius).toBe(28);
    // Centré verticalement dans la boîte intérieure de la barre (bordure de 1).
    const top = indicator.top as number;
    expect(top + NAVIGATION_ACTIVE_FRAME.height + top).toBe(NAVIGATION_BAR_HEIGHT - 2);
  });

  it("remains present (never masked) across a destination change", () => {
    renderTabsLayout();

    fireEvent(screen.getByTestId("navigation-tab-index"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 70.8, height: 60 } },
    });
    fireEvent(screen.getByTestId("navigation-tab-calendar"), "layout", {
      nativeEvent: { layout: { x: 70.8, y: 0, width: 70.8, height: 60 } },
    });

    fireEvent.press(screen.getByTestId("navigation-tab-calendar"));

    expect(screen.getByTestId("navigation-active-indicator")).toBeTruthy();
  });
});
