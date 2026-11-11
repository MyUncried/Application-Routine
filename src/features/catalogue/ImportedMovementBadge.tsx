import { StyleSheet, Text, View } from "react-native";

import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * A-2 (Figma 12119:25304) : pastille de provenance d'un Mouvement importé, à la place du crayon
 * « Modifier le mouvement » : « Bibliothèque · rév. N ». Information seule, aucune action.
 *
 * Correction du 11/11/2026 (mise en page Figma, `Source — Bibliothèque et révision` 12119:25408) : fond
 * #EAEAFF, hauteur 28, rayon 14, icône livre exportée de Figma (12119:25409, trait bleu) au lieu du symbole
 * système « book.closed » (dessin différent), libellé Inter Semi Bold 12 bleu KODJO.
 */
export function ImportedMovementBadge({ label }: { readonly label: string }) {
  return (
    <View
      style={styles.badge}
      accessible
      accessibilityLabel={"Importé de la bibliothèque " + label + ", lecture seule"}
      testID="movement-imported-badge"
    >
      <KodjoIcon name="library-book-source" />
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[6],
    maxWidth: 170,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: spacing[10],
    backgroundColor: colors.contextBand,
  },
  label: { ...type.cardDuration, color: colors.primary, flexShrink: 1 },
});
