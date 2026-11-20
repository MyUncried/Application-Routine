import { StyleSheet, Text, View } from "react-native";

import { planningStrings } from "@/features/planning/planningStrings";
import { colors } from "@/shared/ui/tokens";

/**
 * Repère « parcours » devant le nom d'une routine à plusieurs séances, dans l'Agenda et le Journal (recette du 20/11/2026,
 * constat A — Hermann : « plusieurs séances : le nom est libre et obligatoire, dans l'agenda et le journal mettre un P
 * (pour parcours) entouré d'un cercle devant le nom choisi »). [Dessin : interprétation technique — cercle de 16, filet
 * de 1,5 et lettre de 10 dans la couleur du nom ; aucune maquette Figma.]
 */
export const PARCOURS_BADGE_SIZE = 16;

export function ParcoursBadge({ testID }: { readonly testID?: string }) {
  return (
    <View style={styles.circle} accessible accessibilityLabel={planningStrings.parcours} testID={testID}>
      <Text style={styles.letter} allowFontScaling={false}>
        P
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: PARCOURS_BADGE_SIZE,
    height: PARCOURS_BADGE_SIZE,
    borderRadius: PARCOURS_BADGE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  letter: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 10, lineHeight: 12, color: colors.textPrimary },
});
