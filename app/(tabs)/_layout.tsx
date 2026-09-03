import { Tabs } from "expo-router/js-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, spacing } from "@/shared/ui/tokens";
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
 * barre à quatre onglets, jamais rendu jusqu'ici. `dimensions.globalSearch`
 * porte ce diamètre canonique ; l'action reste désactivée dans la
 * livraison partielle T01 (CE-T01-02/03 : « présente mais désactivée »,
 * aucune tranche ne livre encore la recherche globale) — visible, mais
 * sans navigation ni faux résultat produit.
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
        }}
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

      <Pressable
        disabled
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={strings.nav.search}
        testID="navigation-search-action"
        style={[styles.search, { bottom: insets.bottom + spacing[16] }]}
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
  search: {
    position: "absolute",
    right: spacing[16],
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
