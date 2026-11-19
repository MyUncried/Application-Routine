import { Pressable, StyleSheet } from "react-native";

import { KodjoIcon } from "@/shared/ui/KodjoIcon";

/**
 * Bouton d'édition carré — composant Figma « DSF / Actions / Édition — carré » (`12747:24962` ; D-535, DSF Journal § 3) :
 * 32 × 32, crayon `icon/modifier` 20 × 20 à 6 du bord, fond #F3F4F9, coins 10. Cible tactile étendue à 44 × 44.
 * [La description Figma du composant indique 40 × 32 ; le DSF et l'écran « Calendrier — Journal — MVP » donnent 32 × 32 :
 * retenu le DSF.]
 */
export const EDIT_SQUARE_SIZE = 32;
const HIT_SLOP = (44 - EDIT_SQUARE_SIZE) / 2;

export function EditSquareButton({ onPress, accessibilityLabel, testID }: { readonly onPress: () => void; readonly accessibilityLabel: string; readonly testID: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} hitSlop={HIT_SLOP} style={styles.button} testID={testID}>
      <KodjoIcon name="edit-movement" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: EDIT_SQUARE_SIZE,
    height: EDIT_SQUARE_SIZE,
    borderRadius: 10,
    backgroundColor: "#F3F4F9",
    alignItems: "center",
    justifyContent: "center",
  },
});
