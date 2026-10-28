import { StyleSheet, Text, View } from "react-native";

import { colors, layout, spacing, type } from "@/shared/ui/tokens";

type PlaceholderScreenProps = {
  title: string;
  description: string;
};

/**
 * Écran d’attente utilisé par les onglets du socle technique tant que leurs
 * écrans métier ne sont pas développés (voir la tranche recommandée suivante
 * dans le rapport de développement).
 */
export function PlaceholderScreen({ title, description }: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    // A01 (recette PRE-8 A/B) : marge standard partagée.
    paddingHorizontal: layout.screenGutter,
    gap: spacing[8],
  },
  title: {
    ...type.activityTitle,
    color: colors.textPrimary,
    textAlign: "center",
  },
  description: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
