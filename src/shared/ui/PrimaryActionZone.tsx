import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FINAL_ACTION_BUTTON,
  FINAL_ACTION_BUTTON_HEIGHT,
  FINAL_ACTION_GRADIENT,
  finalActionSideMargin,
  finalActionContentPadding,
  finalActionZoneHeight,
} from "@/shared/ui/finalAction";
import { colors, type } from "@/shared/ui/tokens";

/**
 * Zone d'action principale fixe (D-439, PRE-6 story 7.10) — composant unique des écrans dotés d'un
 * bouton d'action principal (et des barres de mode qui le remplacent, placement ✓ / Annuler).
 *
 * - Posée en absolu au bas du conteneur de l'écran (`ScreenShell`), pleine largeur, indépendante du
 *   défilement ; le contenu défilant passe dessous et réserve sa hauteur en fin de défilement
 *   (`usePrimaryActionZone().scrollReserve`).
 * - Dégradé blanc 0 → 100 % (`FINAL_ACTION_GRADIENT`) sur toute la zone protégée, de hauteur
 *   `finalActionZoneHeight` ; le contenu (bouton, barre de mode) y est centré verticalement
 *   (correctif J6f : `finalActionVerticalPadding`, 33 au-dessus et au-dessous sur iPhone).
 * - `pointerEvents="box-none"` : la zone et son dégradé ne captent aucun toucher ; seuls ses
 *   enfants (le bouton, la barre) en reçoivent. Un élément du contenu visible sous la partie
 *   transparente reste touchable.
 * - Clavier (revue 7.10) : sur iOS, la zone reste sous le clavier (D-349 : visible à sa fermeture).
 *   Sur Android, la fenêtre se redimensionne et la zone remonterait au-dessus du clavier, sur le
 *   champ actif : elle est masquée (ni affichée, ni touchable, ni lue) tant que le clavier est ouvert.
 */
export type PrimaryActionZoneProps = {
  readonly children: ReactNode;
  /** Hauteur mesurée du contenu (bouton, message d'erreur, barre de mode). */
  readonly onContentHeightChange?: (height: number) => void;
  /** Masque la zone à VoiceOver / TalkBack et aux touchers (ex. : feuille ouverte au-dessus). */
  readonly hidden?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  /** Style du conteneur du contenu (ex. : écart entre un message et le bouton). */
  readonly contentStyle?: StyleProp<ViewStyle>;
  readonly testID: string;
};

export function PrimaryActionZone({ children, onContentHeightChange, hidden = false, style, contentStyle, testID }: PrimaryActionZoneProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const keyboardHidesZone = useAndroidKeyboardVisible();
  const isHidden = hidden || keyboardHidesZone;
  const padding = finalActionContentPadding(Platform.OS, insets.bottom);
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => onContentHeightChange?.(event.nativeEvent.layout.height),
    [onContentHeightChange],
  );
  return (
    <View
      pointerEvents={isHidden ? "none" : "box-none"}
      accessibilityElementsHidden={isHidden}
      importantForAccessibility={isHidden ? "no-hide-descendants" : "auto"}
      style={[
        styles.zone,
        keyboardHidesZone ? styles.zoneHidden : null,
        {
          // Correctif J6f (D-439) : contenu centré verticalement dans la zone protégée.
          paddingTop: padding.top,
          paddingBottom: padding.bottom,
          paddingHorizontal: finalActionSideMargin(width),
        },
        style,
      ]}
      testID={testID}
    >
      <View pointerEvents="none" style={styles.gradient} testID={`${testID}-gradient`} />
      <View pointerEvents="box-none" onLayout={onLayout} style={contentStyle} testID={`${testID}-content`}>
        {children}
      </View>
    </View>
  );
}

/** Android seulement : clavier ouvert (la fenêtre est redimensionnée, la zone remonterait). */
function useAndroidKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const show = Keyboard.addListener("keyboardDidShow", () => setVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

/**
 * Réserve de défilement des écrans à zone d'action : hauteur de la zone, recalculée depuis la
 * hauteur mesurée de son contenu (48 avant toute mesure : le bouton seul).
 */
export function usePrimaryActionZone() {
  const insets = useSafeAreaInsets();
  const [contentHeight, setContentHeight] = useState<number>(FINAL_ACTION_BUTTON_HEIGHT);
  const onContentHeightChange = useCallback((height: number) => {
    if (height > 0) setContentHeight((current) => (current === height ? current : height));
  }, []);
  return { scrollReserve: finalActionZoneHeight(insets.bottom, contentHeight), onContentHeightChange };
}

export type PrimaryActionButtonProps = {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  /** Nom accessible, s'il diffère du libellé. */
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID: string;
  readonly labelTestID?: string;
};

/** Bouton d'action principal (format `Terminer`) : seuls libellé, état et action varient. */
export function PrimaryActionButton({ label, onPress, disabled = false, accessibilityLabel, style, testID, labelTestID }: PrimaryActionButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.button, disabled ? styles.buttonDisabled : null, style]}
      testID={testID}
    >
      <Text style={styles.label} testID={labelTestID}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  zone: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  zoneHidden: {
    opacity: 0,
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    experimental_backgroundImage: FINAL_ACTION_GRADIENT,
  },
  button: FINAL_ACTION_BUTTON,
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  label: {
    ...type.button,
    color: colors.background,
  },
});
