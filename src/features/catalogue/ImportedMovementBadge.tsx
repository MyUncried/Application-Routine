import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * A-2 (Figma 12119:25304) : pastille de provenance d'un Mouvement importé, à la place du crayon
 * « Modifier le mouvement » : « Bibliothèque · rév. N ». Information seule, aucune action.
 */
export function ImportedMovementBadge({ label }: { readonly label: string }) {
  return (
    <View
      style={styles.badge}
      accessible
      accessibilityLabel={"Importé de la bibliothèque " + label + ", lecture seule"}
      testID="movement-imported-badge"
    >
      {/* Symbole système natif iOS (SF Symbols), comme l’icône livre de la maquette. */}
      <SymbolView name="book.closed" size={14} tintColor={colors.textPrimary} />
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    maxWidth: 170,
    borderRadius: 14,
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[4],
    backgroundColor: colors.surface,
  },
  label: { ...type.supporting, color: colors.textPrimary, flexShrink: 1 },
});
