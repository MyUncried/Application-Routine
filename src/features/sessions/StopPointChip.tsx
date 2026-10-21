import { forwardRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { strings } from "@/shared/i18n";
import { colors, spacing } from "@/shared/ui/tokens";

/** Puce (Figma `8328:29533`) : rayon 12, marges 10 / 4, intervalle 6, contour 1. */
const CHIP = { radius: 12, paddingHorizontal: spacing[10], paddingVertical: spacing[4], gap: spacing[6], borderWidth: 1 } as const;
/** Contour de la puce `#C8C8D7` (Figma `8328:29533`), sans jeton. */
const CHIP_BORDER = "#C8C8D7";
/** Symbole (Figma `8328:29534`) : deux barres 3 × 10, rayon 1, écartées de 4. */
export const STOP_POINT_SYMBOL_BAR = { width: 3, height: 10, radius: 1, gap: spacing[4] } as const;
/** Libellé : Inter Medium 10, interligne Auto (Figma `8328:29537`). */
const CHIP_TEXT = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 10, lineHeight: 12 } as const;
/** Hauteur de la puce : texte 12 + marges 4 + 4 + contours 1 + 1. */
export const STOP_POINT_CHIP_HEIGHT = CHIP_TEXT.lineHeight + 2 * CHIP.paddingVertical + 2 * CHIP.borderWidth;
/**
 * Cible tactile étendue aux seules marges verticales de sa ligne (4 / 4) : jamais sur la carte
 * au-dessus, qui porte son propre appui long (glisser).
 */
export const STOP_POINT_CHIP_HIT_SLOP = { top: spacing[4], bottom: spacing[4] } as const;

/** Action accessible de retrait (story 4.2). */
const REMOVE_ACTION = "remove";

export type StopPointChipProps = {
  /** Nom accessible : « Point d'arrêt après {exercice} » / « … après le circuit ». */
  readonly accessibilityLabel: string;
  /** Appui long : bulle « Retirer le point d'arrêt ». */
  readonly onLongPress: () => void;
  /** Alternative accessible : action « Retirer le point d'arrêt », même effet que la bulle. */
  readonly onRemove: () => void;
  readonly testID?: string;
};

/**
 * Point d'arrêt hors placement (PRE-6 story 4.2, Figma `8328:29428`, ch13 L1258 PR #390) : puce
 * « ❚❚ Point d'arrêt » — symbole orange (`warning`), texte Medium 10 `text-label`, fond blanc,
 * contour 1 `#C8C8D7`, rayon 12, marges 10 / 4, intervalle 6. Posée par la ligne structurelle,
 * bord droit aligné sur celui des cartes.
 *
 * Élément accessible (pas un bouton : un toucher ne fait rien) portant l'action « Retirer le point
 * d'arrêt » ; l'appui long ouvre la bulle de même nom.
 */
export const StopPointChip = forwardRef<View, StopPointChipProps>(function StopPointChip(
  { accessibilityLabel, onLongPress, onRemove, testID },
  ref,
) {
  const removeLabel = strings.screens.composition.pauses.removeStopPoint;
  return (
    <Pressable
      ref={ref}
      onLongPress={onLongPress}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityActions={[{ name: REMOVE_ACTION, label: removeLabel }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === REMOVE_ACTION) onRemove();
      }}
      hitSlop={STOP_POINT_CHIP_HIT_SLOP}
      style={styles.chip}
      testID={testID}
    >
      <StopPointSymbol color={colors.warning} />
      <Text style={styles.text} numberOfLines={1}>
        {strings.screens.composition.placement.stopPoint}
      </Text>
    </Pressable>
  );
});

/** Symbole « ❚❚ » du point d'arrêt (Figma `8328:29534` ; blanc dans la bulle `8328:33832`). */
export function StopPointSymbol({ color }: { color: string }) {
  const bar = [styles.bar, { backgroundColor: color }];
  return (
    <View style={styles.symbol}>
      <View style={bar} />
      <View style={bar} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: CHIP.gap,
    paddingHorizontal: CHIP.paddingHorizontal,
    paddingVertical: CHIP.paddingVertical,
    borderRadius: CHIP.radius,
    borderWidth: CHIP.borderWidth,
    borderColor: CHIP_BORDER,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  text: {
    ...CHIP_TEXT,
    color: colors.textLabel,
  },
  symbol: {
    flexDirection: "row",
    alignItems: "center",
    gap: STOP_POINT_SYMBOL_BAR.gap,
  },
  bar: {
    width: STOP_POINT_SYMBOL_BAR.width,
    height: STOP_POINT_SYMBOL_BAR.height,
    borderRadius: STOP_POINT_SYMBOL_BAR.radius,
  },
});
