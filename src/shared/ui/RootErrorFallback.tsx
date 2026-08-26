import { StyleSheet, Text, View } from "react-native";

import { strings } from "@/shared/i18n";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * Écran de secours minimal affiché par `RootErrorBoundary` en cas d'erreur
 * fatale racine. Distinct de `PlaceholderScreen` (réservé aux écrans
 * fonctionnels provisoires du socle technique) : ceci n'est ni un écran
 * fonctionnel, ni associé à une route Expo Router — seulement le contenu
 * rendu à la place de l'application quand celle-ci ne peut pas s'afficher.
 *
 * N'affiche qu'un message générique et non technique. Aucun bouton
 * « Réessayer » : aucune stratégie fiable de réinitialisation complète de
 * SQLite n'est définie dans cette tranche.
 */
export function RootErrorFallback() {
  return (
    <View style={styles.container}>
      <Text style={styles.message} accessibilityRole="alert">
        {strings.errors.root.message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    paddingHorizontal: spacing[24],
  },
  message: {
    ...type.body,
    color: colors.textPrimary,
    textAlign: "center",
  },
});
