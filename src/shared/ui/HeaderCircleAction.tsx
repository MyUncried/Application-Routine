import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, minTouchTarget } from "@/shared/ui/tokens";

/**
 * Cercle Retour / Fermer de l'application, unique (D-593, Hermann, 24/11/2026 : « On doit assurer l'homogénéité de
 * présentation des écrans, on ne peut pas avoir un même bouton de différentes couleurs en fonction des écrans » ; puis, pour
 * les croix grises des fenêtres « Fermer et valider » et des feuilles : « Ces boutons doivent utiliser le même composant que
 * les autres »). Rond blanc de 38 (Figma, valeurs sans jeton), liseré blanc de 1, ombre légère, icône 24 `#14141A` ;
 * cible tactile 48 obtenue par `hitSlop` (D-142).
 *
 * Partagé par l'en-tête d'écran (`FixedHeader`), l'en-tête de modale (`ModalHeader` / `ModalCancelAction`), les feuilles
 * de filtres et de choix et les fenêtres sans en-tête d'écran (`CloseCircleAction`).
 */
export const HEADER_CIRCLE = { surface: "#FCFCFE", shadow: "#1A1A26" } as const;
/** Trait du ✕ et du chevron (instance Figma `#14141A`). */
export const HEADER_ICON_TINT = "#14141A";
export const HEADER_CIRCLE_HIT_SLOP = (minTouchTarget - dimensions.backAction.visualCircle) / 2;

export const headerCircleStyles = StyleSheet.create({
  circle: {
    width: dimensions.backAction.visualCircle,
    height: dimensions.backAction.visualCircle,
    borderRadius: dimensions.backAction.visualCircle / 2,
    backgroundColor: HEADER_CIRCLE.surface,
    borderWidth: 1,
    borderColor: colors.background,
    shadowColor: HEADER_CIRCLE.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

/**
 * Action circulaire « Fermer » standard : le même rond que le ✕ de `FixedHeader`. `icon="back"` (D-608, Figma « Exercice libre —
 * Modale de type format » `13269:26160`) : même rond, chevron Retour.
 */
export function CloseCircleAction({
  onPress,
  accessibilityLabel,
  style,
  testID,
  icon = "close",
}: {
  onPress: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  testID: string;
  icon?: "close" | "back";
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={HEADER_CIRCLE_HIT_SLOP}
      style={[headerCircleStyles.circle, style]}
      testID={testID}
    >
      <KodjoIcon name={icon === "back" ? "control-back" : "control-close"} size={dimensions.backAction.icon} tintColor={HEADER_ICON_TINT} testID={`${testID}-icon`} />
    </Pressable>
  );
}
