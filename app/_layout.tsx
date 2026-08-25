import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { useFonts } from "@expo-google-fonts/inter/useFonts";
import { Stack } from "expo-router/stack";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

void SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  console.warn("Impossible de conserver le splash natif affiché.", error);
});

/**
 * Layout racine : une pile Stack contenant le groupe d’onglets principal.
 *
 * Les écrans hors onglets (composition, exécution, planification, etc.)
 * seront ajoutés ici comme écrans de pile au fil des prochaines tranches
 * (voir docs/Specifications-fonctionnelles/06 – Écrans et navigation de la V1).
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (!fontsLoaded && !fontError) {
      return;
    }

    if (fontError) {
      console.error("Impossible de charger les polices Inter.", fontError);
    }

    void SplashScreen.hideAsync().catch((error: unknown) => {
      console.warn("Impossible de masquer le splash natif.", error);
    });
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
