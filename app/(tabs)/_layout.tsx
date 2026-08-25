import { Tabs } from "expo-router/js-tabs";

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
 * MVP (§12.30). Les icônes définitives seront ajoutées avec les maquettes
 * Figma lors du développement des écrans métier correspondants.
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
      <Tabs.Screen name="index" options={{ title: strings.nav.sessions }} />
      <Tabs.Screen name="calendar" options={{ title: strings.nav.calendar }} />
      <Tabs.Screen name="history" options={{ title: strings.nav.history }} />
      <Tabs.Screen name="profile" options={{ title: strings.nav.profile }} />
    </Tabs>
  );
}
