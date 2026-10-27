import { Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";

import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import {
  NAVIGATION_ACTIVE_FRAME,
  NAVIGATION_BAR_BOTTOM_RESIDUAL,
  NAVIGATION_BAR_HEIGHT,
  NAVIGATION_BAR_RADIUS,
  NAVIGATION_BAR_SHADOW,
  NAVIGATION_ICON_BOX,
  NAVIGATION_ICON_BOX_TOP,
  NAVIGATION_ICON_BOX_TOP_ACTIVE,
  NAVIGATION_LABEL_CENTER_Y,
  NAVIGATION_ROW_HORIZONTAL_MARGIN,
} from "@/shared/ui/navigationLayout";
import { colors, minTouchTarget, type } from "@/shared/ui/tokens";
import { strings } from "@/shared/i18n";

/**
 * Navigation principale (docs/Specifications-fonctionnelles/06 – Écrans et
 * navigation de la V1, « Navigation principale »).
 *
 * PRE-8, recette A/B (E01) : composant Figma `Navigation / Bottom — 5 onglets`
 * (`6513:20151`) — Catalogues, Calendrier, Suivi, Communauté, Profil, sans
 * bouton Recherche. Communauté est visible mais désactivée : ce n'est pas une
 * route (aucun écran, aucune navigation), seulement une destination inerte
 * rendue par la barre entre Suivi et Profil. Géométrie : voir
 * `@/shared/ui/navigationLayout`.
 *
 * `expo-router/js-tabs` et le rendu de barre entièrement personnalisé
 * (`tabBar`, SHELL-R02) sont conservés : la barre est ancrée au bord bas
 * physique de l'écran, son cadre actif mesure la position réelle de chaque
 * destination (`onLayout`) et glisse continûment de l'une à l'autre
 * (V2-CAT-01).
 */
export default function TabsLayout() {
  return (
    <View style={styles.root}>
      <Tabs
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen
          name="index"
          options={{
            // V2-CAT-01 (plan §4.5, revue 5732014381 obligation 1) : libellé
            // PERMANENT `Catalogues` — distinct de `strings.nav.sessions`
            // (« Séances »), verrouillé ailleurs par un test hors périmètre.
            title: strings.screens.sessions.navLabel,
            tabBarIcon: ({ focused }) => (
              <KodjoIcon name={focused ? "nav5-catalogue-active" : "nav5-catalogue-inactive"} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: strings.nav.calendar,
            tabBarIcon: ({ focused }) => (
              <KodjoIcon name={focused ? "nav5-calendar-active" : "nav5-calendar-inactive"} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: strings.nav.history,
            tabBarIcon: ({ focused }) => (
              <KodjoIcon name={focused ? "nav5-history-active" : "nav5-history-inactive"} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: strings.nav.profile,
            tabBarIcon: ({ focused }) => (
              <KodjoIcon name={focused ? "nav5-profile-active" : "nav5-profile-inactive"} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

/** Route devant laquelle la destination désactivée Communauté est rendue (ordre Figma). */
const COMMUNITY_BEFORE_ROUTE = "profile";

/**
 * Cadre actif de navigation (V2-CAT-01) : un unique `Animated.View`, centré
 * dans l'emplacement RÉEL de la destination active (`onLayout`, jamais une
 * géométrie supposée), glisse vers celui de la nouvelle destination à chaque
 * changement de focus — jamais un saut instantané, jamais masqué.
 */
function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const layoutsRef = useRef<Record<string, { x: number; width: number }>>({});
  // `useState` : instance `Animated.Value` stable, jamais lue via un ref pendant le rendu.
  const [indicatorX] = useState(() => new Animated.Value(0));
  const [isIndicatorReady, setIsIndicatorReady] = useState(false);
  const activeRouteKey = state.routes[state.index]?.key;

  useEffect(() => {
    if (!activeRouteKey || !isIndicatorReady) {
      return;
    }
    const layout = layoutsRef.current[activeRouteKey];
    if (!layout) {
      return;
    }
    Animated.timing(indicatorX, { toValue: indicatorLeft(layout), duration: 250, useNativeDriver: false }).start();
  }, [activeRouteKey, isIndicatorReady, indicatorX]);

  function handleItemLayout(routeKey: string, event: LayoutChangeEvent) {
    const { x, width } = event.nativeEvent.layout;
    layoutsRef.current[routeKey] = { x, width };
    if (routeKey === activeRouteKey && !isIndicatorReady) {
      // Premier positionnement connu : placé directement, sans animation depuis l'origine.
      indicatorX.setValue(indicatorLeft({ x, width }));
      setIsIndicatorReady(true);
    }
  }

  const items: ReactNode[] = [];
  state.routes.forEach((route, index) => {
    if (route.name === COMMUNITY_BEFORE_ROUTE) {
      items.push(<CommunityDestination key="community" />);
    }
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const label = typeof options.title === "string" ? options.title : route.name;

    function onPress() {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    }

    items.push(
      <Pressable
        key={route.key}
        onPress={onPress}
        onLayout={(event) => handleItemLayout(route.key, event)}
        accessibilityRole="button"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={label}
        testID={`navigation-tab-${route.name}`}
        style={[styles.tabItem, isFocused ? styles.tabItemActive : null]}
      >
        <View style={styles.tabIconBox} testID={`navigation-tab-icon-slot-${route.name}`}>
          {options.tabBarIcon?.({
            focused: isFocused,
            color: isFocused ? colors.primary : colors.textSecondary,
            size: NAVIGATION_ICON_BOX,
          })}
        </View>
        {isFocused ? (
          <Text style={styles.tabLabel} numberOfLines={1} testID={`navigation-tab-label-${route.name}`}>
            {label}
          </Text>
        ) : null}
      </Pressable>,
    );
  });

  return (
    <View style={styles.navigationRow} testID="navigation-row">
      <View style={styles.tabsGroup} testID="navigation-tabs-group">
        {isIndicatorReady ? (
          <Animated.View
            pointerEvents="none"
            testID="navigation-active-indicator"
            style={[styles.activeIndicator, { left: indicatorX }]}
          />
        ) : null}
        {items}
      </View>
    </View>
  );
}

/** Communauté : visible (Figma), désactivée, sans écran ni navigation. */
function CommunityDestination() {
  return (
    <Pressable
      disabled
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      accessibilityLabel={strings.nav.community}
      testID="navigation-tab-community"
      style={styles.tabItem}
    >
      <View style={styles.tabIconBox} testID="navigation-tab-icon-slot-community">
        <KodjoIcon name="nav5-community-inactive" />
      </View>
    </Pressable>
  );
}

function indicatorLeft(layout: { x: number; width: number }): number {
  return layout.x + (layout.width - NAVIGATION_ACTIVE_FRAME.width) / 2;
}

const BAR_BORDER_WIDTH = 1;
/** Hauteur intérieure de la barre (les enfants se placent dans la boîte intérieure à la bordure). */
const BAR_INNER_HEIGHT = NAVIGATION_BAR_HEIGHT - BAR_BORDER_WIDTH * 2;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  navigationRow: {
    position: "absolute",
    left: NAVIGATION_ROW_HORIZONTAL_MARGIN,
    right: NAVIGATION_ROW_HORIZONTAL_MARGIN,
    bottom: 0,
    paddingBottom: NAVIGATION_BAR_BOTTOM_RESIDUAL,
    flexDirection: "row",
    alignItems: "center",
  },
  tabsGroup: {
    flex: 1,
    height: NAVIGATION_BAR_HEIGHT,
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: NAVIGATION_BAR_RADIUS,
    borderWidth: BAR_BORDER_WIDTH,
    borderColor: colors.background,
    elevation: NAVIGATION_BAR_SHADOW.elevation,
    shadowColor: NAVIGATION_BAR_SHADOW.color,
    shadowOffset: { width: 0, height: NAVIGATION_BAR_SHADOW.offsetY },
    shadowOpacity: NAVIGATION_BAR_SHADOW.opacity,
    shadowRadius: NAVIGATION_BAR_SHADOW.radius,
  },
  // Cadre actif, sous les destinations (premier enfant), centré verticalement dans la barre.
  activeIndicator: {
    position: "absolute",
    top: (BAR_INNER_HEIGHT - NAVIGATION_ACTIVE_FRAME.height) / 2,
    width: NAVIGATION_ACTIVE_FRAME.width,
    height: NAVIGATION_ACTIVE_FRAME.height,
    borderRadius: NAVIGATION_ACTIVE_FRAME.radius,
    backgroundColor: NAVIGATION_ACTIVE_FRAME.color,
  },
  // Cinq emplacements égaux, sur toute la hauteur de la barre : cible tactile ≥ 48 × 48.
  tabItem: {
    flex: 1,
    alignItems: "center",
    minHeight: minTouchTarget,
    paddingTop: NAVIGATION_ICON_BOX_TOP - BAR_BORDER_WIDTH,
  },
  tabItemActive: {
    paddingTop: NAVIGATION_ICON_BOX_TOP_ACTIVE - BAR_BORDER_WIDTH,
  },
  tabIconBox: {
    width: NAVIGATION_ICON_BOX,
    height: NAVIGATION_ICON_BOX,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    ...type.navLabel,
    position: "absolute",
    left: 0,
    right: 0,
    top: NAVIGATION_LABEL_CENTER_Y - BAR_BORDER_WIDTH - type.navLabel.lineHeight / 2,
    textAlign: "center",
    color: colors.primary,
  },
});
