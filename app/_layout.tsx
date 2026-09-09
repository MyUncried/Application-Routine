import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { useFonts } from "@expo-google-fonts/inter/useFonts";
import { Stack } from "expo-router/stack";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { SessionServiceProvider } from "@/features/sessions/SessionServiceProvider";
import { KodjoSplash } from "@/shared/ui/KodjoSplash";
import { RootErrorBoundary } from "@/shared/ui/RootErrorBoundary";
import { RootErrorFallback } from "@/shared/ui/RootErrorFallback";

void SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  console.warn("Impossible de conserver le splash natif affiché.", error);
});

/**
 * Layout racine : une pile Stack contenant le groupe d’onglets principal.
 *
 * `RootErrorBoundary` et `SessionServiceProvider` sont montés dès le tout
 * premier rendu, inconditionnellement — le chargement des polices
 * (`useFonts`) et l’ouverture/migration de la base SQLite (portées par
 * `SessionServiceProvider`) démarrent donc réellement en parallèle. Le
 * `<Stack>` passé en enfant du provider ne s’affiche qu’une fois les deux
 * initialisations réglées : polices chargées (ou en erreur) ET
 * `SessionService` effectivement construit (signalé par `onReady`).
 * `SessionServiceProvider` relaie ce `children` variable directement à son
 * propre contexte, sans jamais le faire transiter par `SQLiteProvider`
 * (voir `SessionServiceProvider.tsx` pour le détail — `SQLiteProvider` est
 * mémoïsé par `expo-sqlite` avec un comparateur qui ignore `children`, ce
 * qui rendrait une telle mise à jour invisible).
 *
 * Le splash natif ne se masque que lorsque les polices ET l’initialisation
 * SQLite sont l’une et l’autre réglées (prêtes ou en erreur) — voir
 * docs/Specifications-fonctionnelles/12 – Architecture technique.
 *
 * Les écrans hors onglets (composition, exécution, planification, etc.)
 * seront ajoutés ici comme écrans de pile au fil des prochaines tranches
 * (voir docs/Specifications-fonctionnelles/06 – Écrans et navigation de la V1).
 *
 * `(creation)` (T01-S07) est le premier de ces groupes : il porte son
 * propre `SessionDraftProvider` et son propre `Stack` imbriqué (voir
 * `app/(creation)/_layout.tsx`) — `headerShown: false` n'est pas hérité par
 * ce navigateur imbriqué, il y est donc répété explicitement.
 *
 * **T02-S02 (seconde recette visuelle, point 4)** — `gestureEnabled: false`
 * sur `(creation)`. Le geste natif de retour par glissement horizontal était
 * déjà désactivé dans le `Stack` IMBRIQUÉ, sans effet observable : sur le
 * PREMIER écran de ce navigateur imbriqué (`composition`), la pile interne
 * n'a rien à dépiler, et c'est le navigateur PARENT — celui-ci — qui traite
 * le geste, pour revenir de `(creation)` vers `(tabs)`. Désactiver l'option
 * uniquement sur l'enfant ne pouvait donc pas neutraliser le geste ; les deux
 * niveaux doivent la porter.
 *
 * `(tabs)` conserve son comportement de navigation par défaut : seul le
 * parcours de création est concerné. Aucune navigation EXPLICITE n'est
 * touchée — `Retour`, `Terminer`, `Continuer`, `Enregistrer la séance` et
 * `router.dismissTo` restent identiques.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [databaseReady, setDatabaseReady] = useState(false);
  const [rootError, setRootError] = useState<Error | null>(null);
  const [minimumSplashElapsed, setMinimumSplashElapsed] = useState(false);
  const [showAppSplash, setShowAppSplash] = useState(true);
  const [splashOpacity] = useState(() => new Animated.Value(1));

  // Références stables : un unique setState par callback, sans dépendance
  // recréée à chaque rendu. setDatabaseReady(true) est intrinsèquement
  // idempotent — plusieurs appels successifs (par ex. lors d’un remontage
  // en développement) laissent l’état inchangé après le premier, sans
  // effet de bord supplémentaire.
  const handleDatabaseReady = useCallback(() => setDatabaseReady(true), []);
  const handleRootError = useCallback((error: Error) => setRootError(error), []);

  const fontsSettled = fontsLoaded || Boolean(fontError);
  const databaseSettled = databaseReady || rootError !== null;

  useEffect(() => {
    const timer = setTimeout(() => setMinimumSplashElapsed(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleSplashLayout = useCallback(() => {
    void SplashScreen.hideAsync().catch((error: unknown) => {
      console.warn("Impossible de masquer le splash natif.", error);
    });
  }, []);

  useEffect(() => {
    if (!minimumSplashElapsed || !fontsSettled || !databaseSettled) {
      return;
    }

    if (fontError) {
      console.error("Impossible de charger les polices Inter.", fontError);
    }

    const animation = Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) {
        setShowAppSplash(false);
      }
    });

    return () => animation.stop();
  }, [minimumSplashElapsed, fontsSettled, databaseSettled, fontError, splashOpacity]);

  return (
    <RootErrorBoundary fallback={<RootErrorFallback />} onError={handleRootError}>
      <SessionServiceProvider onReady={handleDatabaseReady}>
        <View style={styles.root}>
          {fontsSettled && databaseReady ? (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(creation)" options={{ gestureEnabled: false }} />
            </Stack>
          ) : null}
          {showAppSplash ? (
            <KodjoSplash opacity={splashOpacity} onLayout={handleSplashLayout} />
          ) : null}
        </View>
      </SessionServiceProvider>
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
