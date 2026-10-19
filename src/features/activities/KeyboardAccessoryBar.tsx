import { InputAccessoryView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { strings } from "@/shared/i18n";

/**
 * PRE-5 story 2.2 (FR-25, §9-8, AD-26) — barre du clavier décimal de la Feuille : « ←
 * Précédent » et « Suivant → » à gauche, « Fermer » à droite. Sur iOS, mécanisme standard
 * `InputAccessoryView`, rattaché aux champs par `inputAccessoryViewID` ; rien sur Android
 * et le web (le clavier natif suffit, rendu non recetté). Extrémités indisponibles, sans
 * boucle (état d'accessibilité `disabled`).
 *
 * Relevé Figma `9292:18077` (lecture seule), constantes locales nommées (`tokens.ts`
 * inchangé, NFR-3) : hauteur 44, fond `#E6E9ED`, texte `#5C4DFF` 14 regular.
 */

/** Identifiant de la barre, partagé par les champs décimaux de la Feuille. */
export const KEYBOARD_ACCESSORY_ID = "execution-sheet-keyboard-bar";

const BAR_HEIGHT = 44;
const BAR_BACKGROUND = "#E6E9ED";
const BAR_TEXT_COLOR = "#5C4DFF";
const BAR_FONT_SIZE = 14;
const BAR_SIDE_INSET = 16;
const BAR_BUTTON_GAP = 20;
/** Bouton indisponible (extrémité) : atténué. */
const BAR_DISABLED_OPACITY = 0.35;

const labels = strings.executionParameters.sheet.keyboardBar;

export function KeyboardAccessoryBar({
  nativeID = KEYBOARD_ACCESSORY_ID,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  onClose,
}: {
  nativeID?: string;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  if (Platform.OS !== "ios") return null;
  const button = (label: string, spoken: string, enabled: boolean, onPress: () => void, testID: string) => (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityState={{ disabled: !enabled }}
      hitSlop={{ top: 0, bottom: 0, left: BAR_BUTTON_GAP / 2, right: BAR_BUTTON_GAP / 2 }}
      style={[styles.button, enabled ? null : styles.disabled]}
      testID={testID}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
  return (
    <InputAccessoryView nativeID={nativeID} backgroundColor={BAR_BACKGROUND}>
      <View style={styles.bar} testID="execution-sheet-keyboard-bar">
        <View style={styles.group}>
          {button(labels.previous, labels.previousSpoken, canPrevious, onPrevious, "execution-sheet-keyboard-previous")}
          {button(labels.next, labels.nextSpoken, canNext, onNext, "execution-sheet-keyboard-next")}
        </View>
        {button(labels.close, labels.close, true, onClose, "execution-sheet-keyboard-close")}
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  // Hauteur minimale (texte agrandi jamais rogné, story 3.8 AC7).
  bar: {
    minHeight: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: BAR_SIDE_INSET,
    backgroundColor: BAR_BACKGROUND,
  },
  group: {
    flexDirection: "row",
    alignItems: "center",
    gap: BAR_BUTTON_GAP,
  },
  button: {
    minHeight: BAR_HEIGHT,
    justifyContent: "center",
  },
  disabled: {
    opacity: BAR_DISABLED_OPACITY,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    fontSize: BAR_FONT_SIZE,
    color: BAR_TEXT_COLOR,
  },
});
