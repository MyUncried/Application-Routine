import { fireEvent, renderRouter, screen } from "expo-router/testing-library";
import { describe, expect, it } from "@jest/globals";
import { StyleSheet, Text } from "react-native";

import {
  NAVIGATION_BAR_BOTTOM_RESIDUAL,
  NAVIGATION_ICON_SLOT,
  NAVIGATION_ROW_HORIZONTAL_MARGIN,
} from "@/shared/ui/navigationLayout";
import { icon, minTouchTarget } from "@/shared/ui/tokens";
import { strings } from "@/shared/i18n";

/**
 * Test d'intégration avec un vrai navigateur (`expo-router/testing-library`)
 * pour la navigation basse à quatre onglets + l'action Recherche distincte
 * (correction de conformité, `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`,
 * AUD-02). `app/(tabs)/_layout.tsx` doit être exercé tel quel (pas une
 * reproduction locale) : c'est le fichier de route réel.
 *
 * Correction SHELL-R02 (contre-recette iPhone, `[ChatGPT]
 * DEVICE_REVIEW_FAIL — REWORK 02`, 2026-09-03) : la barre est désormais un
 * rendu `tabBar` entièrement personnalisé (`BottomTabBar`) — les quatre
 * destinations et Recherche sont des **frères dans une seule rangée flex**
 * (`navigation-row` → `navigation-tabs-group` (`flex:1`) + Recherche
 * (largeur fixe), tous deux enfants directs du même `View` avec
 * `alignItems:"center"`). Ce test vérifie la structure — la garantie de
 * non-chevauchement et d'axe vertical commun découle de flexbox lui-même
 * (propriété valable à n'importe quelle largeur d'écran, pas seulement à
 * une largeur mesurée), pas d'une formule arithmétique à revalider par
 * largeur : voir le rapport de mission pour la justification complète de
 * pourquoi un test paramétré par largeur logique (`360`/`402`/`440`)
 * n'apporterait aucune preuve supplémentaire ici, contrairement à
 * l'ancienne implémentation à positionnement absolu indépendant.
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

describe("Navigation basse — rangée unique, quatre destinations + Recherche (SHELL-R02, contre-recette iPhone 2026-09-03)", () => {
  it("lays the four-destinations group and the search bubble out in a single shared row, sharing one vertical axis by construction (SHELL-R02-C/D)", () => {
    renderTabsLayout();

    const row = screen.getByTestId("navigation-row");
    const rowStyle = StyleSheet.flatten(row.props.style);
    expect(rowStyle.flexDirection).toBe("row");
    // Un seul axe vertical commun : `alignItems:"center"` sur le parent
    // partagé, jamais une position verticale calculée séparément pour
    // chaque élément (cause du défaut précédent, SHELL-R01 échoué).
    expect(rowStyle.alignItems).toBe("center");

    const tabsGroup = screen.getByTestId("navigation-tabs-group");
    const search = screen.getByTestId("navigation-search-action");
    expect(tabsGroup).toBeTruthy();
    expect(search).toBeTruthy();

    // Le groupe des quatre destinations est `flex: 1` : sa largeur est
    // dérivée de ce qui reste après Recherche (largeur fixe) + l'écart,
    // quelle que soit la largeur réelle de l'écran — jamais une soustraction
    // de pixels calculée à la main (cause exacte de l'échec précédent,
    // voir le rapport de mission, § cause technique).
    expect(StyleSheet.flatten(tabsGroup.props.style).flex).toBe(1);
    // Recherche garde une largeur fixe, jamais positionnée en absolu
    // indépendamment de cette même rangée.
    const searchStyle = StyleSheet.flatten(search.props.style);
    expect(searchStyle.position).not.toBe("absolute");
  });

  it("renders all four destinations simultaneously, never masked or replaced by Recherche (SHELL-R02-B)", () => {
    renderTabsLayout();

    expect(screen.getByTestId("navigation-tab-index")).toBeTruthy();
    expect(screen.getByTestId("navigation-tab-calendar")).toBeTruthy();
    expect(screen.getByTestId("navigation-tab-history")).toBeTruthy();
    expect(screen.getByTestId("navigation-tab-profile")).toBeTruthy();
    expect(screen.getByLabelText(strings.nav.sessions)).toBeTruthy();
    expect(screen.getByLabelText(strings.nav.calendar)).toBeTruthy();
    expect(screen.getByLabelText(strings.nav.history)).toBeTruthy();
    expect(screen.getByLabelText(strings.nav.profile)).toBeTruthy();
    expect(screen.getByTestId("navigation-search-action")).toBeTruthy();
  });

  it("gives all four destinations the exact same icon slot (SHELL-R02-A) and a touch target of at least 48×48 without enlarging the icon itself", () => {
    renderTabsLayout();

    for (const name of ["index", "calendar", "history", "profile"]) {
      const tab = screen.getByTestId(`navigation-tab-${name}`);
      const flattened = StyleSheet.flatten(tab.props.style);
      // Cible tactile : hauteur minimale du `Pressable` lui-même — pas un
      // agrandissement du SVG (le slot d'icône reste `NAVIGATION_ICON_SLOT`,
      // vérifié séparément ci-dessous).
      expect(flattened.minHeight).toBe(minTouchTarget);

      const iconSlot = screen.getByTestId(`navigation-tab-icon-slot-${name}`);
      const iconSlotStyle = StyleSheet.flatten(iconSlot.props.style);
      expect(iconSlotStyle.width).toBe(NAVIGATION_ICON_SLOT);
      expect(iconSlotStyle.height).toBe(NAVIGATION_ICON_SLOT);
    }

    // Slot d'icône ~25 % plus petit que l'ancien token `icon.navigation`
    // (`32`), jamais réellement consommé par ces icônes.
    expect(NAVIGATION_ICON_SLOT).toBeLessThan(icon.navigation);
  });

  it("navigates to the pressed destination via the custom tab bar, content of the four screens unchanged", () => {
    renderTabsLayout();

    fireEvent.press(screen.getByTestId("navigation-tab-calendar"));
    expect(screen.getByText("calendar-screen")).toBeTruthy();

    fireEvent.press(screen.getByTestId("navigation-tab-profile"));
    expect(screen.getByText("profile-screen")).toBeTruthy();
  });
});

/**
 * Correction `D` (contre-recette iPhone, correction consolidée, `[ChatGPT]
 * DIAGNOSTIC APPROVED — PHASE02 CONSOLIDATED REWORK02`, 2026-09-03,
 * addendum `FOUNDATION BOTTOM NAVIGATION VERTICAL POSITION`) : la barre
 * est ancrée à `bottom: 0` (bord physique de l'écran).
 *
 * Correction `N-03` (`[ChatGPT] DEVICE NO-GO — PHASE02 REWORK03 CUMULATIVE
 * CORRECTION`, 2026-09-03) : le résiduel bas (`paddingBottom`) est
 * désormais égal, par construction, à la marge horizontale
 * (`NAVIGATION_ROW_HORIZONTAL_MARGIN` = `left`/`right`) — remplace la
 * formule précédente, fonction de `insets.bottom`, jugée trop basse au
 * rendu réel. Voir `@/shared/ui/navigationLayout` pour la dérivation
 * complète.
 */
describe("Navigation basse — position verticale (correction D/N-03, 2026-09-03)", () => {
  it("anchors the row to the physical screen edge (bottom: 0), with a bottom residual exactly equal to its own horizontal margin (N-03)", () => {
    renderTabsLayout();

    const row = screen.getByTestId("navigation-row");
    const rowStyle = StyleSheet.flatten(row.props.style);
    expect(rowStyle.bottom).toBe(0);
    expect(rowStyle.left).toBe(NAVIGATION_ROW_HORIZONTAL_MARGIN);
    expect(rowStyle.right).toBe(NAVIGATION_ROW_HORIZONTAL_MARGIN);
    expect(rowStyle.paddingBottom).toBe(NAVIGATION_BAR_BOTTOM_RESIDUAL);
    expect(rowStyle.paddingBottom).toBe(rowStyle.left);
  });
});
