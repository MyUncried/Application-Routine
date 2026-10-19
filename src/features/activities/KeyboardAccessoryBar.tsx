import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import type { KeyboardFrame } from "@/features/activities/useSheetKeyboard";
import { strings } from "@/shared/i18n";

/**
 * PRE-5 story 2.2 (FR-25, §9-8, AD-26) — barre du clavier de la Feuille : « ← Précédent »
 * et « Suivant → », « Fermer » à droite. Extrémités indisponibles, sans boucle (état
 * d'accessibilité `disabled`).
 *
 * D-434 (décision de Hermann du 19/10) : de gauche à droite « À l'échec » | « ← Précédent »
 * | « Suivant → » | « Fermer », sur une seule ligne. « À l'échec » n'est rendu que pour une
 * cellule Cible d'une série (`failure`), avec son état annoncé (sélectionné quand la cellule
 * est à l'échec) ; jamais pour une Pause ou une Charge. Si la largeur ne suffit pas aux
 * libellés complets (mesurés hors écran, texte agrandi compris), Précédent et Suivant sont
 * réduits à leurs flèches, avec leurs libellés d'accessibilité inchangés ; les zones
 * tactiles (44 de haut, 44 de large au moins) sont préservées.
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
/** D-434 : largeur minimale d'un bouton (flèche seule comprise), zone tactile préservée. */
const BAR_BUTTON_MIN_WIDTH = 44;
/** D-434 : largeur offerte à la mesure des libellés complets (hors écran, jamais affichée). */
const BAR_MEASURE_WIDTH = 2000;
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

/**
 * D-434 : Précédent / Suivant réduits à leurs flèches quand la ligne des libellés complets
 * (`fullWidth`, marges comprises) dépasse la largeur de la barre ; rien n'est réduit tant que
 * l'une des deux mesures manque.
 */
export function keyboardBarCompact(barWidth: number, fullWidth: number): boolean {
  return barWidth > 0 && fullWidth > 0 && fullWidth + 2 * BAR_SIDE_INSET > barWidth;
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
  failure = null,
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
  /** D-434 : « À l'échec » (cellule Cible d'une série), ou `null` (Pause, Charge). */
  failure?: { readonly selected: boolean; readonly onPress: () => void } | null;
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
  // D-434 : largeur de la barre et largeur naturelle des libellés complets.
  const [barWidth, setBarWidth] = useState(0);
  const [fullWidth, setFullWidth] = useState(0);
  const compact = keyboardBarCompact(barWidth, fullWidth);

  const button = (
    label: string,
    spoken: string,
    enabled: boolean,
    onPress: () => void,
    testID: string,
    selected?: boolean,
  ) => (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityState={selected === undefined ? { disabled: !enabled } : { disabled: !enabled, selected }}
      hitSlop={{ top: 0, bottom: 0, left: BAR_BUTTON_GAP / 2, right: BAR_BUTTON_GAP / 2 }}
      style={[styles.button, enabled ? null : styles.disabled]}
      testID={testID}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
  const failureButton =
    failure === null
      ? null
      : button(labels.failure, labels.failure, true, failure.onPress, "execution-sheet-keyboard-failure", failure.selected);
  return (
    <Animated.View
      style={[styles.host, { transform: [{ translateY }] }]}
      onLayout={(event) => onHeight(event.nativeEvent.layout.height)}
      testID="execution-sheet-keyboard-bar-host"
    >
      {/* D-434 : mesure hors écran des libellés complets, sur une seule ligne. */}
      <View
        style={styles.measureHost}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View
          style={styles.measureRow}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setFullWidth((current) => (current === width ? current : width));
          }}
          testID="execution-sheet-keyboard-bar-measure"
        >
          {/* « À l'échec » mesuré en Semi Bold (sa graisse la plus large) ; chaque libellé au moins 44. */}
          {failure === null ? null : (
            <View style={styles.measureItem}>
              <Text style={[styles.label, styles.labelSelected]}>{labels.failure}</Text>
            </View>
          )}
          {[labels.previous, labels.next, labels.close].map((label) => (
            <View key={label} style={styles.measureItem}>
              <Text style={styles.label}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View
        style={styles.bar}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setBarWidth((current) => (current === width ? current : width));
        }}
        testID="execution-sheet-keyboard-bar"
      >
        {failureButton}
        <View style={styles.group}>
          {button(
            compact ? labels.previousArrow : labels.previous,
            labels.previousSpoken,
            canPrevious,
            onPrevious,
            "execution-sheet-keyboard-previous",
          )}
          {button(compact ? labels.nextArrow : labels.next, labels.nextSpoken, canNext, onNext, "execution-sheet-keyboard-next")}
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
    gap: BAR_BUTTON_GAP,
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
    minWidth: BAR_BUTTON_MIN_WIDTH,
    alignItems: "center",
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
  // D-434 : « À l'échec » sélectionné (cellule à l'échec) : même texte, en Semi Bold.
  labelSelected: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  // Mesure : hors écran, invisible, sans effet sur la mise en page de la barre.
  measureHost: {
    position: "absolute",
    top: 0,
    left: 0,
    width: BAR_MEASURE_WIDTH,
    opacity: 0,
  },
  measureRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: BAR_BUTTON_GAP,
  },
  measureItem: {
    minWidth: BAR_BUTTON_MIN_WIDTH,
  },
});
