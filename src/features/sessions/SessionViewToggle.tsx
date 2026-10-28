import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { strings } from "@/shared/i18n";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

import type { SessionCatalogueView } from "./sessionCatalogueView";

/**
 * PRE-8 (epic E, story E.4 ; spécification du 27/10 §4) — bascule de vue « Un exercice | Plusieurs »,
 * deux textes simples à gauche de la rangée des commandes, sans option « Toutes ». Aucune option
 * choisie : collection complète ; toucher l'option active la désélectionne (annoncé). Cibles de
 * 44 de haut par `hitSlop` vertical, sans débord horizontal entre les deux options.
 */

const t = strings.screens.sessions.view;

const OPTIONS: readonly { readonly value: SessionCatalogueView; readonly label: string }[] = [
  { value: "SINGLE", label: t.single },
  { value: "MULTIPLE", label: t.multiple },
];

const LABEL_LINE = 16;
const VERTICAL_SLOP = Math.max(0, (minTouchTarget - LABEL_LINE) / 2);

export function SessionViewToggle({
  value,
  onToggle,
  onLayout,
  testID,
}: {
  readonly value: SessionCatalogueView | null;
  readonly onToggle: (view: SessionCatalogueView) => void;
  readonly onLayout?: (event: LayoutChangeEvent) => void;
  readonly testID: string;
}) {
  return (
    <View style={styles.row} onLayout={onLayout} accessibilityRole="radiogroup" testID={testID}>
      {OPTIONS.map((option, index) => {
        const selected = value === option.value;
        return (
          <View key={option.value} style={styles.optionGroup}>
            {index > 0 ? <View style={styles.separator} accessible={false} /> : null}
            <Pressable
              onPress={() => onToggle(option.value)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              accessibilityHint={selected ? t.deselectHint : t.selectHint}
              hitSlop={{ top: VERTICAL_SLOP, bottom: VERTICAL_SLOP }}
              style={styles.option}
              testID={`${testID}-${option.value}`}
            >
              <Text style={[styles.label, selected ? styles.labelSelected : null]} numberOfLines={1}>
                {option.label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    minHeight: minTouchTarget,
  },
  optionGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  option: {
    minHeight: LABEL_LINE,
    justifyContent: "center",
  },
  separator: {
    width: 1,
    height: 14,
    marginHorizontal: spacing[8],
    backgroundColor: colors.cardsBorder,
  },
  label: {
    ...type.segmentedCompactLabel,
    color: colors.textSecondary,
  },
  labelSelected: {
    ...type.editableValue,
    color: colors.primary,
  },
});
