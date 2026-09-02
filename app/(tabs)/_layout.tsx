import { Tabs } from "expo-router/js-tabs";

import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors } from "@/shared/ui/tokens";
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
 */
export default function TabsLayout() {
  return (
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
  );
}
