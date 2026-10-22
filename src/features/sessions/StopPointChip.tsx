import { forwardRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { LONG_PRESS_DELAY_MS } from "@/features/sessions/compositionGesture";
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
 * voisine, qui porte son propre appui long (glisser), ni au-delà des écarts de la séquence. Revue 5.3 : portée par la BOÎTE du
 * `Pressable` (30 de haut, marges négatives : la rangée garde 22), jamais par `hitSlop` — sous
 * Fabric iOS, un toucher hors des limites d'un parent sans débordement mesuré n'atteint pas l'enfant.
 */
export const STOP_POINT_CHIP_TOUCH_EXTENT = spacing[4];

export type StopPointChipProps = {
  /** Nom accessible : « Point d'arrêt après {exercice} » / « … après le circuit ». */
  readonly accessibilityLabel: string;
  readonly accessibilityHint?: string;
  /** PRE-6 story 6.2 : appui long — saisie du point (glisser). */
  readonly onLongPress: () => void;
  /** PRE-6 story 6.2 : actions accessibles « Monter » / « Descendre » (absentes si refusées). */
  readonly accessibilityActions: readonly { readonly name: string; readonly label: string }[];
  readonly onAccessibilityAction: (name: string) => void;
  readonly testID?: string;
};

/**
 * Point d'arrêt hors placement (PRE-6 story 4.2, Figma `8328:29428`, ch13 L1258 PR #390) : puce
 * « ❚❚ Point d'arrêt » — symbole orange (`warning`), texte Medium 10 `text-label`, fond blanc,
 * contour 1 `#C8C8D7`, rayon 12, marges 10 / 4, intervalle 6. Posée par la ligne structurelle,
 * bord droit aligné sur celui des cartes.
 *
 * Élément accessible (pas un bouton : un toucher ne fait rien). PRE-6 story 6.2 (D-436) : l'appui
 * long saisit le point (glisser) ; la bulle « Retirer » et l'action de retrait sont retirées (le
 * retrait d'un point revient en placement, story 6.3) ; actions « Monter » / « Descendre ».
 */
export const StopPointChip = forwardRef<View, StopPointChipProps>(function StopPointChip(
  { accessibilityLabel, accessibilityHint, onLongPress, accessibilityActions, onAccessibilityAction, testID },
  ref,
) {
  return (
    <Pressable
      ref={ref}
      onLongPress={onLongPress}
      delayLongPress={LONG_PRESS_DELAY_MS}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityActions={accessibilityActions.map((action) => ({ name: action.name, label: action.label }))}
      onAccessibilityAction={(event) => onAccessibilityAction(event.nativeEvent.actionName)}
      style={styles.target}
      testID={testID}
    >
      <View style={styles.chip} testID={testID === undefined ? undefined : `${testID}-face`}>
        <StopPointSymbol color={colors.warning} />
        <Text style={styles.text} numberOfLines={1}>
          {strings.screens.composition.placement.stopPoint}
        </Text>
      </View>
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
  target: {
    height: STOP_POINT_CHIP_HEIGHT + 2 * STOP_POINT_CHIP_TOUCH_EXTENT,
    marginVertical: -STOP_POINT_CHIP_TOUCH_EXTENT,
    justifyContent: "center",
  },
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
