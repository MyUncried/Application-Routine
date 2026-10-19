import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import type { KeyboardFrame } from "@/features/activities/useSheetKeyboard";
import { strings } from "@/shared/i18n";

/**
 * PRE-5 story 2.2 (FR-25, §9-8, AD-26) — barre du clavier décimal de la Feuille : « ←
 * Précédent » et « Suivant → » à gauche, « Fermer » à droite. Extrémités indisponibles,
 * sans boucle (état d'accessibilité `disabled`).
 *
 * Recette du 19/10 (RC-1) : `InputAccessoryView` ne s'affiche pas dans la `Modal` de la
 * Feuille. La barre est rendue par la Feuille elle-même, en position absolue au bas de la
 * zone de la `Modal`, et remontée juste au-dessus du clavier : son décalage est l'écart
 * entre le bas mesuré de cette zone (`containerBottom`, coordonnées de la fenêtre) et le
 * haut du clavier (`keyboardFrame`, événements `Keyboard` standards). Elle monte avec le
 * clavier (translation sur le fil natif, durée de l'animation du clavier) ; « Réduire les
 * animations » : placée directement. Un toucher de la barre ne retire pas le focus du
 * champ (aucun `ScrollView` ni `TextInput` ne la contient) : Précédent / Suivant passent
 * au champ voisin sans fermer ni rouvrir le clavier.
 *
 * Relevé Figma `9292:18077` (lecture seule), constantes locales nommées (`tokens.ts`
 * inchangé, NFR-3) : hauteur 44, fond `#E6E9ED`, texte `#5C4DFF` 14 regular.
 */

const BAR_HEIGHT = 44;
const BAR_BACKGROUND = "#E6E9ED";
const BAR_TEXT_COLOR = "#5C4DFF";
const BAR_FONT_SIZE = 14;
const BAR_SIDE_INSET = 16;
const BAR_BUTTON_GAP = 20;
/** Bouton indisponible (extrémité) : atténué. */
const BAR_DISABLED_OPACITY = 0.35;
/** Durée de la première montée quand l'événement du clavier n'en donne aucune. */
const BAR_FALLBACK_DURATION_MS = 250;
/** Courbe proche de celle du clavier iOS. */
const BAR_EASING = Easing.out(Easing.cubic);

const labels = strings.executionParameters.sheet.keyboardBar;

/** Décalage de la barre au-dessus du bas de sa zone : hauteur du clavier qui recouvre cette zone. */
export function keyboardBarLift(frame: KeyboardFrame, containerBottom: number): number {
  return Math.max(0, containerBottom - frame.screenY);
}

export function KeyboardAccessoryBar({
  keyboardFrame,
  containerBottom,
  reduceMotion,
  onHeight,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  onClose,
}: {
  keyboardFrame: KeyboardFrame;
  /** Bas de la zone de la `Modal` qui contient la barre (coordonnées de la fenêtre). */
  containerBottom: number;
  reduceMotion: boolean;
  /** Hauteur mesurée (texte agrandi : jamais rognée), pour la révélation de la ligne active. */
  onHeight: (height: number) => void;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const lift = keyboardBarLift(keyboardFrame, containerBottom);
  // Première montée : la barre part de sous le bas de sa zone, comme une barre native.
  const [translateY] = useState(() => new Animated.Value(reduceMotion ? -lift : BAR_HEIGHT));
  const firstRef = useRef(true);
  useEffect(() => {
    const first = firstRef.current;
    firstRef.current = false;
    const duration = reduceMotion ? 0 : keyboardFrame.duration > 0 ? keyboardFrame.duration : first ? BAR_FALLBACK_DURATION_MS : 0;
    if (duration === 0) {
      translateY.stopAnimation();
      translateY.setValue(-lift);
      return;
    }
    const animation = Animated.timing(translateY, { toValue: -lift, duration, easing: BAR_EASING, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [translateY, lift, keyboardFrame.duration, reduceMotion]);

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
    <Animated.View
      style={[styles.host, { transform: [{ translateY }] }]}
      onLayout={(event) => onHeight(event.nativeEvent.layout.height)}
      testID="execution-sheet-keyboard-bar-host"
    >
      <View style={styles.bar} testID="execution-sheet-keyboard-bar">
        <View style={styles.group}>
          {button(labels.previous, labels.previousSpoken, canPrevious, onPrevious, "execution-sheet-keyboard-previous")}
          {button(labels.next, labels.nextSpoken, canNext, onNext, "execution-sheet-keyboard-next")}
        </View>
        {button(labels.close, labels.close, true, onClose, "execution-sheet-keyboard-close")}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Au bas de la zone de la `Modal`, sur toute la largeur, au-dessus de la Feuille.
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
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
