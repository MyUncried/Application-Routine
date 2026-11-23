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

export function ParcoursBadge({
  testID,
  placement = "before",
  stroke = 1.5,
  size = PARCOURS_BADGE_SIZE,
}: {
  readonly testID?: string;
  /**
   * Recette du 20/11/2026 (Hermann, cartes de l'Agenda : « mettre le symbole du Parcours après le nom, pas avant ») : `after`
   * place l'écart à gauche du cercle. Défaut `before` : rendu du Journal inchangé.
   */
  readonly placement?: "before" | "after" | "alone";
  /** Épaisseur du cercle ; Agenda : « affiner le trait du cercle » (même recette). Défaut 1,5 : Journal inchangé. */
  readonly stroke?: number;
  /** D-553 : ligne « Ⓟ » d'un parcours dans l'Agenda — cercle de 18, lettre de 11 (Figma `12906:103`). Défaut 16. */
  readonly size?: number;
}) {
  return (
    <View
      style={[
        styles.circle,
        placement === "after" ? styles.after : placement === "before" ? styles.before : null,
        { borderWidth: stroke },
        size !== PARCOURS_BADGE_SIZE ? { width: size, height: size, borderRadius: size / 2 } : null,
      ]}
      accessible
      accessibilityLabel={planningStrings.parcours}
      testID={testID}
    >
      <Text style={[styles.letter, size !== PARCOURS_BADGE_SIZE ? styles.letterLarge : null]} allowFontScaling={false}>
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
    borderColor: colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  before: { marginRight: 4 },
  after: { marginLeft: 4 },
  letterLarge: { fontFamily: "Inter_700Bold", fontWeight: "700", fontSize: 11, lineHeight: 13 },
  letter: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 10, lineHeight: 12, color: colors.textPrimary },
});
