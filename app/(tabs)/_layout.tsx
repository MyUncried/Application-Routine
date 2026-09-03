import { Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import {
  NAVIGATION_ICON_SLOT,
  NAVIGATION_ITEM_VERTICAL_PADDING,
  NAVIGATION_LABEL_GAP,
} from "@/shared/ui/navigationLayout";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";
import { strings } from "@/shared/i18n";

/**
 * Navigation principale à quatre onglets (docs/Specifications-fonctionnelles/
 * 06 – Écrans et navigation de la V1, « Navigation principale »).
 *
 * `expo-router/js-tabs` est utilisé plutôt que la barre d’onglets native
 * (`expo-router/unstable-native-tabs`, encore instable dans cette version
 * d’Expo Router) afin de garder un rendu personnalisable et cohérent entre
 * iOS et Android, conformément au layout unique de référence visé par le
 * MVP (§12.30). Les icônes utilisent les exports SVG canoniques du
 * Design System Figma, avec une variante active et inactive explicite.
 *
 * Correction de conformité (audit `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`,
 * AUD-02) : `12 – Architecture technique.md` §Design tokens décrit la
 * navigation basse comme « composée d'une barre principale flexible et
 * d'une recherche de diamètre fixe 58 » — un élément **distinct** de la
 * barre à quatre onglets. L'action reste désactivée dans la livraison
 * partielle T01 (CE-T01-02/03 : « présente mais désactivée »).
 *
 * Correction SHELL-R02 (contre-recette iPhone, `[ChatGPT]
 * DEVICE_REVIEW_FAIL — REWORK 02`, 2026-09-03) : la tentative précédente
 * (`tabBarStyle` avec marges + bouton Recherche positionné indépendamment
 * en absolu) a échoué au rendu réel — `tabBarStyle` du rendu par défaut
 * d'`expo-router/js-tabs` ne garantit pas la largeur/hauteur externes
 * demandées, et deux éléments positionnés en absolu indépendamment ne
 * peuvent pas se garantir mutuellement une même rangée sans chevauchement.
 * Remplacé par un **rendu de barre entièrement personnalisé** (`tabBar`,
 * point d'extension standard de `@react-navigation/bottom-tabs`, dont
 * `createBottomTabNavigator` d'`expo-router/js-tabs` est un fork direct —
 * confirmé par lecture de `node_modules/expo-router/build/layouts/
 * TabsClient.js`) : les quatre destinations et le cercle Recherche sont
 * désormais des **frères dans une seule rangée flex** (`flexDirection:
 * "row"`), le groupe des quatre destinations en `flex: 1` et Recherche à
 * largeur fixe — la largeur du groupe de quatre est donc *dérivée* de la
 * largeur réellement disponible moins Recherche et l'écart, à n'importe
 * quelle largeur d'écran, jamais un calcul de pixels dupliqué à la main.
 * Le même parent `alignItems: "center"` garantit un axe vertical commun
 * (SHELL-R02-D) sans assertion arithmétique séparée à maintenir.
 *
 * Hauteur et position basses (SHELL-R02-E) : plus aucune hauteur fixe
 * empruntée à `dimensions.mainNavigation.visualHeight` (`66`, jamais
 * vérifiée contre le rendu réel) — la rangée se dimensionne à son
 * contenu réel (`NAVIGATION_ICON_SLOT` + libellé + espacements DS,
 * `NAVIGATION_CONTENT_HEIGHT`, partagées depuis
 * `@/shared/ui/navigationLayout` — valeur exacte par construction
 * puisque c'est la même valeur qui détermine le padding de chaque item),
 * positionnée à `bottom: insets.bottom` — aucune marge flottante
 * supplémentaire, la Safe Area n'est appliquée qu'une seule fois ici.
 * `CatalogueScreen.tsx` importe `NAVIGATION_CONTENT_HEIGHT` pour réserver
 * exactement cet espace dans son propre calcul de centrage (CAT-R04) —
 * une seule source de vérité, pas deux estimations indépendantes.
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
            title: strings.nav.sessions,
            tabBarIcon: ({ focused }) => (
              <KodjoIcon
                name={focused ? "navigation-sessions-active" : "navigation-sessions-inactive"}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: strings.nav.calendar,
            tabBarIcon: ({ focused }) => (
              <KodjoIcon
                name={focused ? "navigation-calendar-active" : "navigation-calendar-inactive"}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: strings.nav.history,
            tabBarIcon: ({ focused }) => (
              <KodjoIcon
                name={focused ? "navigation-history-active" : "navigation-history-inactive"}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: strings.nav.profile,
            tabBarIcon: ({ focused }) => (
              <KodjoIcon
                name={focused ? "navigation-profile-active" : "navigation-profile-inactive"}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.navigationRow, { bottom: insets.bottom }]} testID="navigation-row">
      <View style={styles.tabsGroup} testID="navigation-tabs-group">
        {state.routes.map((route, index) => {
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

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              testID={`navigation-tab-${route.name}`}
              style={styles.tabItem}
            >
              <View style={styles.tabIconSlot} testID={`navigation-tab-icon-slot-${route.name}`}>
                {options.tabBarIcon?.({
                  focused: isFocused,
                  color: isFocused ? colors.primary : colors.textSecondary,
                  size: NAVIGATION_ICON_SLOT,
                })}
              </View>
              <Text
                style={[styles.tabLabel, isFocused ? styles.tabLabelActive : null]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        disabled
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={strings.nav.search}
        testID="navigation-search-action"
        style={styles.search}
      >
        <KodjoIcon name="navigation-search" testID="navigation-search-icon" opacity={0.4} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  navigationRow: {
    position: "absolute",
    left: spacing[16],
    right: spacing[16],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[12],
  },
  tabsGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: dimensions.mainNavigation.radius,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: minTouchTarget,
    paddingVertical: NAVIGATION_ITEM_VERTICAL_PADDING,
    gap: NAVIGATION_LABEL_GAP,
  },
  tabIconSlot: {
    width: NAVIGATION_ICON_SLOT,
    height: NAVIGATION_ICON_SLOT,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    ...type.navLabel,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  search: {
    width: dimensions.globalSearch.visualDiameter,
    height: dimensions.globalSearch.visualDiameter,
    borderRadius: dimensions.globalSearch.radius,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
