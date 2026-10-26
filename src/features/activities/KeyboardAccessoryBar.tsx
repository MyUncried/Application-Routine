import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import type { KeyboardFrame } from "@/features/activities/useSheetKeyboard";
import { strings } from "@/shared/i18n";
import { colors } from "@/shared/ui/tokens";

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
 * tactiles (44 de haut) sont préservées.
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
 *
 * PRE-7 story B.3 (B9, D-447, arbitrage A4) : une seule ligne de QUATRE EMPLACEMENTS STABLES, de
 * largeur et de hauteur égales — « À l'échec » (ou un emplacement réservé vide, non accessible,
 * quand il ne s'applique pas : Pause, Charge), Précédent, Suivant, Fermer ; Précédent et Suivant
 * restent donc au même endroit quel que soit le champ. Boutons arrondis (rayon local 8) sur le
 * blanc des touches iOS claires (`colors.background`), texte inchangé ; Fermer bleu KODJO
 * (`colors.primary`), texte blanc. Fond de barre conservé. Flèches seules quand le plus large des
 * libellés complets de Précédent et de Suivant (mesurés hors écran) ne tient pas dans un
 * emplacement. Mécanisme RC-1 (position, montée, focus) inchangé.
 */

const BAR_HEIGHT = 44;
const BAR_BACKGROUND = "#E6E9ED";
const BAR_TEXT_COLOR = "#5C4DFF";
const BAR_FONT_SIZE = 14;
/**
 * PRE-7 B.3 (B9) : marges latérales de la barre et écart entre deux emplacements — valeurs
 * d'intégration (non tirées de Figma), choisies pour que « ← Précédent » (85,4 en Regular 14)
 * s'affiche complet à 402 et 440 (emplacements de 92 et 101,5) et réduit à sa flèche à 360
 * (81,5), et que « À l'échec » (62,9 en Semi Bold 14) tienne sur une ligne à 360.
 */
const BAR_SIDE_INSET = 8;
const BAR_SLOT_GAP = 6;
/** PRE-7 B.3 (B9) : nombre d'emplacements de la barre (D-434 : À l'échec, Précédent, Suivant, Fermer). */
const BAR_SLOT_COUNT = 4;
/** PRE-7 B.3 (B9) : marge verticale de la barre ; boutons de 36 dans la ligne de 44. */
const BAR_VERTICAL_INSET = 4;
const BAR_BUTTON_HEIGHT = BAR_HEIGHT - 2 * BAR_VERTICAL_INSET;
/**
 * PRE-7 B.3 (B9, arbitrage A4) : rayon local des boutons et marge horizontale du libellé dans son
 * bouton (valeur d'intégration, même justification que les marges de la barre).
 */
const BAR_BUTTON_RADIUS = 8;
const BAR_BUTTON_INSET = 2;
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
/** D-434 : zone tactile de 44 de haut préservée (bouton de 36 + marges), écart partagé de chaque côté. */
const BAR_BUTTON_HIT_SLOP = {
  top: BAR_VERTICAL_INSET,
  bottom: BAR_VERTICAL_INSET,
  left: BAR_SLOT_GAP / 2,
  right: BAR_SLOT_GAP / 2,
};

const labels = strings.executionParameters.sheet.keyboardBar;

/** Décalage de la barre au-dessus du bas de sa zone : hauteur du clavier qui recouvre cette zone. */
export function keyboardBarLift(frame: KeyboardFrame, containerBottom: number): number {
  return Math.max(0, containerBottom - frame.screenY);
}

/** PRE-7 B.3 (B9) : largeur d'un des quatre emplacements égaux, marges et écarts déduits. */
export function keyboardBarSlotWidth(barWidth: number): number {
  return Math.max(0, (barWidth - 2 * BAR_SIDE_INSET - (BAR_SLOT_COUNT - 1) * BAR_SLOT_GAP) / BAR_SLOT_COUNT);
}

/**
 * D-434 ; PRE-7 B.3 (B9, arbitrage A4) : Précédent / Suivant réduits à leurs flèches quand le plus
 * large de leurs libellés complets (`widestLabel`), avec sa marge dans le bouton, ne tient pas dans
 * un emplacement de la barre de largeur `barWidth` ; rien n'est réduit tant que l'une des deux
 * mesures manque.
 */
export function keyboardBarCompact(barWidth: number, widestLabel: number): boolean {
  return barWidth > 0 && widestLabel > 0 && widestLabel + 2 * BAR_BUTTON_INSET > keyboardBarSlotWidth(barWidth);
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
  // D-434 ; B9 : largeur de la barre et largeurs naturelles des libellés complets de Précédent et Suivant.
  const [barWidth, setBarWidth] = useState(0);
  const [labelWidths, setLabelWidths] = useState<{ readonly previous: number; readonly next: number }>({ previous: 0, next: 0 });
  const widestLabel = labelWidths.previous > 0 && labelWidths.next > 0 ? Math.max(labelWidths.previous, labelWidths.next) : 0;
  const compact = keyboardBarCompact(barWidth, widestLabel);

  const button = (
    label: string,
    spoken: string,
    enabled: boolean,
    onPress: () => void,
    testID: string,
    options: { readonly selected?: boolean; readonly primary?: boolean } = {},
  ) => (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityState={options.selected === undefined ? { disabled: !enabled } : { disabled: !enabled, selected: options.selected }}
      hitSlop={BAR_BUTTON_HIT_SLOP}
      style={[styles.slot, styles.button, options.primary ? styles.buttonPrimary : null, enabled ? null : styles.disabled]}
      testID={testID}
    >
      <Text style={[styles.label, options.selected ? styles.labelSelected : null, options.primary ? styles.labelPrimary : null]}>
        {label}
      </Text>
    </Pressable>
  );
  const measureLabel = (label: string, key: "previous" | "next") => (
    <View
      style={styles.measureItem}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setLabelWidths((current) => (current[key] === width ? current : { ...current, [key]: width }));
      }}
      testID={`execution-sheet-keyboard-bar-measure-${key}`}
    >
      <Text style={styles.label}>{label}</Text>
    </View>
  );
  return (
    <Animated.View
      style={[styles.host, { transform: [{ translateY }] }]}
      onLayout={(event) => onHeight(event.nativeEvent.layout.height)}
      testID="execution-sheet-keyboard-bar-host"
    >
      {/* D-434 ; B9 : mesure hors écran des libellés complets de Précédent et Suivant. */}
      <View
        style={styles.measureHost}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID="execution-sheet-keyboard-bar-measure"
      >
        {measureLabel(labels.previous, "previous")}
        {measureLabel(labels.next, "next")}
      </View>
      <View
        style={styles.bar}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setBarWidth((current) => (current === width ? current : width));
        }}
        testID="execution-sheet-keyboard-bar"
      >
        {failure === null ? (
          // B9 (arbitrage A4) : emplacement réservé, vide et non accessible.
          <View
            style={styles.slot}
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            testID="execution-sheet-keyboard-failure-slot"
          />
        ) : (
          button(labels.failure, labels.failure, true, failure.onPress, "execution-sheet-keyboard-failure", {
            selected: failure.selected,
          })
        )}
        {button(
          compact ? labels.previousArrow : labels.previous,
          labels.previousSpoken,
          canPrevious,
          onPrevious,
          "execution-sheet-keyboard-previous",
        )}
        {button(compact ? labels.nextArrow : labels.next, labels.nextSpoken, canNext, onNext, "execution-sheet-keyboard-next")}
        {button(labels.close, labels.close, true, onClose, "execution-sheet-keyboard-close", { primary: true })}
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
  // Hauteur minimale (texte agrandi jamais rogné, story 3.8 AC7) ; B9 : quatre emplacements égaux.
  bar: {
    minHeight: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "stretch",
    gap: BAR_SLOT_GAP,
    paddingHorizontal: BAR_SIDE_INSET,
    paddingVertical: BAR_VERTICAL_INSET,
    backgroundColor: BAR_BACKGROUND,
  },
  // B9 : emplacement de largeur égale (base nulle, même part de la ligne), bouton ou réserve.
  slot: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: BAR_BUTTON_MIN_WIDTH,
    minHeight: BAR_BUTTON_HEIGHT,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: BAR_BUTTON_INSET,
    borderRadius: BAR_BUTTON_RADIUS,
    backgroundColor: colors.background,
  },
  // B9 : Fermer bleu KODJO, texte blanc.
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  disabled: {
    opacity: BAR_DISABLED_OPACITY,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    fontSize: BAR_FONT_SIZE,
    color: BAR_TEXT_COLOR,
    textAlign: "center",
  },
  // D-434 : « À l'échec » sélectionné (cellule à l'échec) : même texte, en Semi Bold.
  labelSelected: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  labelPrimary: {
    color: colors.background,
  },
  // Mesure : hors écran, invisible, sans effet sur la mise en page de la barre.
  measureHost: {
    position: "absolute",
    top: 0,
    left: 0,
    width: BAR_MEASURE_WIDTH,
    opacity: 0,
    alignItems: "flex-start",
  },
  measureItem: {
    alignSelf: "flex-start",
  },
});
