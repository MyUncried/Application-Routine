import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "@/shared/ui/tokens";

export type ListGridView = "LIST" | "GRID";

/**
 * « DSF / Controls / Bascule liste-grille » (Figma, états `Vue=Liste` `12548:29164` et `Vue=Grille` `12548:29163` ; ch13,
 * CE-MVT-03, rubrique Bascule, décision de Hermann du 16/11/2026) : 56 × 24, fond blanc, liseré 1,5 bleu KODJO, rayon 12 ;
 * vue active en bleu plein (segment de 28), pictogrammes en blanc sur la vue active et en bleu sur l'autre. Trois traits
 * 10 × 2 (liste) et quatre carrés 5 × 5 (grille), rayon 1. Rendu repris tel quel ; deux zones de toucher, une par vue.
 */
export function ListGridToggle({
  value,
  onChange,
  listLabel,
  gridLabel,
  testID,
}: {
  readonly value: ListGridView;
  readonly onChange: (view: ListGridView) => void;
  readonly listLabel: string;
  readonly gridLabel: string;
  readonly testID: string;
}) {
  const grid = value === "GRID";
  const listColor = grid ? colors.primary : colors.background;
  const gridColor = grid ? colors.background : colors.primary;
  return (
    <View style={styles.frame} accessibilityRole="tablist" testID={testID}>
      <View pointerEvents="none" style={[styles.active, grid ? styles.activeGrid : styles.activeList]} testID={`${testID}-active-${grid ? "grid" : "list"}`} />
      {LIST_LINES.map((top) => (
        <View key={`line-${top}`} pointerEvents="none" style={[styles.line, { top, backgroundColor: listColor }]} />
      ))}
      {GRID_SQUARES.map(([left, top]) => (
        <View key={`square-${left}-${top}`} pointerEvents="none" style={[styles.square, { left, top, backgroundColor: gridColor }]} />
      ))}
      <Pressable
        onPress={() => onChange("LIST")}
        accessibilityRole="tab"
        accessibilityLabel={listLabel}
        accessibilityState={{ selected: !grid }}
        hitSlop={HIT_SLOP_LIST}
        style={[styles.half, styles.halfList]}
        testID={`${testID}-list`}
      />
      <Pressable
        onPress={() => onChange("GRID")}
        accessibilityRole="tab"
        accessibilityLabel={gridLabel}
        accessibilityState={{ selected: grid }}
        hitSlop={HIT_SLOP_GRID}
        style={[styles.half, styles.halfGrid]}
        testID={`${testID}-grid`}
      />
    </View>
  );
}

export const LIST_GRID_TOGGLE_SIZE = { width: 56, height: 24 } as const;
const BORDER = 1.5;
/** Positions Figma, relatives à l'intérieur du liseré (repère des enfants absolus). */
const LIST_LINES = [5.5, 9.5, 13.5] as const;
const GRID_SQUARES = [
  [35.5, 5.5],
  [41.5, 5.5],
  [35.5, 11.5],
  [41.5, 11.5],
] as const;
/** Cible tactile portée à 44 de haut (24 + 10 + 10) ; vers l'extérieur seulement sur les côtés. */
const HIT_SLOP_LIST = { top: 10, bottom: 10, left: 8, right: 0 };
const HIT_SLOP_GRID = { top: 10, bottom: 10, left: 0, right: 8 };

const styles = StyleSheet.create({
  frame: {
    width: LIST_GRID_TOGGLE_SIZE.width,
    height: LIST_GRID_TOGGLE_SIZE.height,
    borderRadius: 12,
    borderWidth: BORDER,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  active: {
    position: "absolute",
    top: -BORDER,
    width: 28,
    height: LIST_GRID_TOGGLE_SIZE.height,
    backgroundColor: colors.primary,
  },
  activeList: { left: -BORDER },
  activeGrid: { left: 28 - BORDER },
  line: {
    position: "absolute",
    left: 7.5,
    width: 10,
    height: 2,
    borderRadius: 1,
  },
  square: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 1,
  },
  half: {
    position: "absolute",
    top: -BORDER,
    width: LIST_GRID_TOGGLE_SIZE.width / 2,
    height: LIST_GRID_TOGGLE_SIZE.height,
  },
  halfList: { left: -BORDER },
  halfGrid: { left: 28 - BORDER },
});
