import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { useFonts } from "@expo-google-fonts/inter/useFonts";
import { Mali_500Medium_Italic } from "@expo-google-fonts/mali/500Medium_Italic";
import { Stack } from "expo-router/stack";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { movementRouteOptions } from "@/features/activities/movementRoutePresentation";
import { ExecutionRecoveryGate } from "@/features/execution/ExecutionRecoveryGate";
import { MigrationNoticeGate } from "@/features/migration/MigrationNoticeGate";
import { CreationDraftProviders } from "@/features/sessions/CreationDraftProviders";
import { SessionServiceProvider } from "@/features/sessions/SessionServiceProvider";
import { KodjoSplash } from "@/shared/ui/KodjoSplash";
import { NATIVE_SHEET_OPTIONS } from "@/shared/ui/nativeSheet";
import { RootErrorBoundary } from "@/shared/ui/RootErrorBoundary";
import { RootErrorFallback } from "@/shared/ui/RootErrorFallback";
import { installDevPerformanceGuard } from "@/shared/utils/devPerformanceGuard";

// Recette PRE-8 A/B : garde de développement contre l’échec natif de la mesure de rendu de React
// (écran de démarrage bloqué au rechargement) ; sans effet hors __DEV__.
installDevPerformanceGuard();

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
 * **PRE-4 (story 1.2, AD-12, H24)** — `MigrationNoticeGate`, unique lecteur
 * de l’avis de migration, est monté ici une seule fois, à l’intérieur de
 * `SessionServiceProvider` (dont il lit le repository des avis) et donc
 * jamais en `children` de `SQLiteProvider`. Il n’est monté qu’une fois la
 * base prête et le splash applicatif retiré, pour que l’`Alert` native ne
 * s’affiche pas par-dessus le splash.
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
    Mali_500Medium_Italic,
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
            // Règle de Hermann du 06/11/2026 (registre ch07) : brouillons de séance et de Format au niveau de l'application.
            <CreationDraftProviders>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(creation)" options={{ gestureEnabled: false }} />
              <Stack.Screen name="profile-edit" />
              {/* Demande de Hermann du 04/11/2026 (« Afficher en mode modale iOS (mode d'apparition identique à la fiche
                  des mouvements du questionnaire par exemple) […] Catalogue des mouvements : Créer un mouvement ») :
                  la création d'un Mouvement est une feuille native iOS ; consultation, modification et ajout d'un
                  niveau restent des écrans poussés. [Création en écran poussé — remplacée.] */}
              <Stack.Screen name="movement" options={({ route }) => movementRouteOptions(route.params)} />
              {/* Même demande : Filtres des Catalogues (Mouvements, Séances) en feuille native iOS. */}
              <Stack.Screen name="catalogue-filters" options={NATIVE_SHEET_OPTIONS} />
              {/* Règle de Hermann du 06/11/2026 (registre ch07 : « Je veux qu’on suive l’ordre des écrans et des modèles lorsqu’on les
                  ouvre et qu’on les ferme en fonction des décisions qu’ils ont prises ») : modale « Créer un exercice » (feuille native
                  ajustée à son contenu), questionnaire et récapitulatif d'un Format, fiche d'un mouvement en lecture seule — feuilles
                  natives iOS posées au-dessus de l'écran qui les ouvre (Catalogue des séances ou Composition), vitesse d'iOS.
                  [Feuilles du groupe `(creation)`, au-dessus d'une Composition ouverte d'avance — remplacées.] */}
              <Stack.Screen name="formats-window" options={{ presentation: "formSheet", sheetGrabberVisible: false, contentStyle: CREATION_SHEET_CONTENT, sheetAllowedDetents: "fitToContents", gestureEnabled: false }} />
              <Stack.Screen name="format-questionnaire" options={{ presentation: "formSheet", sheetGrabberVisible: false, contentStyle: CREATION_SHEET_CONTENT, gestureEnabled: false }} />
              <Stack.Screen name="format-summary" options={{ presentation: "formSheet", sheetGrabberVisible: false, contentStyle: CREATION_SHEET_CONTENT, gestureEnabled: false }} />
              <Stack.Screen name="movement-sheet" options={{ presentation: "formSheet", gestureEnabled: false }} />
              {/* PRE-10.3 (CE-EXEC-SESSION-01) : Exécution plein écran, sans geste de retour (aucun abandon silencieux du moteur). */}
              <Stack.Screen name="execution" options={{ gestureEnabled: false, animation: "fade" }} />
            </Stack>
            </CreationDraftProviders>
          ) : null}
          {databaseReady && !showAppSplash ? <MigrationNoticeGate /> : null}
          {/* PRE-10.2 (ch12 §12.33) : Exécution interrompue détectée au démarrage → Reprendre / Arrêter la séance. */}
          {fontsSettled && databaseReady && !showAppSplash ? <ExecutionRecoveryGate /> : null}
          {showAppSplash ? (
            <KodjoSplash opacity={splashOpacity} onLayout={handleSplashLayout} />
          ) : null}
        </View>
      </SessionServiceProvider>
    </RootErrorBoundary>
  );
}

/** Feuilles natives de la création (04/11/2026, Hermann : « l'écran blanc s'arrête avant la fin de l'écran ») : fond blanc plein. */
const CREATION_SHEET_CONTENT = { backgroundColor: "#FFFFFF" } as const;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
