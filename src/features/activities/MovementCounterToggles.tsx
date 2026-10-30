import { Pressable, StyleSheet, Text, View } from "react-native";

import { strings } from "@/shared/i18n";
import { CONTEXT_LINE_SELECTED, CONTEXT_TEXT_COLOR, countLabel } from "@/shared/ui/catalogueContext";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

import type { MovementCatalogueSummary, MovementCounter } from "./movementCatalogueCounters";

/**
 * PRE-9 CAT.1 (spécification « Zones de contexte des Catalogues » du 30/10/2026 §3 et §6 ;
 * CE-CAT-CTX-01 ; Figma `10266:20575`) — « N familles · N mouvements », première ligne de la zone de
 * contexte du Catalogue des Mouvements. Deux contrôles distincts, activables, un seul actif au
 * maximum : actif bleu Kodjo Semi Bold, inactif `#333333` Regular, 14 pt ; l'état est annoncé
 * (`selected`), et se distingue aussi par la graisse. Séparateur « · » non interactif.
 */

const t = strings.screens.catalogueContext;
const LINE = 17;
const VERTICAL_SLOP = Math.max(0, (minTouchTarget - LINE) / 2);
const HORIZONTAL_SLOP = spacing[4];

export function MovementCounterToggles({
  summary,
  active,
  onToggle,
}: {
  readonly summary: MovementCatalogueSummary;
  readonly active: MovementCounter | null;
  readonly onToggle: (counter: MovementCounter) => void;
}) {
  const options: readonly { readonly value: MovementCounter; readonly label: string }[] = [
    { value: "FAMILIES", label: countLabel(summary.families, { one: t.familiesOne, many: t.familiesMany }) },
    { value: "MOVEMENTS", label: countLabel(summary.movements, { one: t.movementsOne, many: t.movementsMany }) },
  ];
  return (
    <View style={styles.row} testID="movement-catalogue-counters">
      {options.map((option, index) => {
        const selected = active === option.value;
        return (
          <View key={option.value} style={styles.group}>
            {index > 0 ? (
              <Text style={styles.separator} accessible={false} importantForAccessibility="no">
                ·
              </Text>
            ) : null}
            <Pressable
              onPress={() => onToggle(option.value)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              accessibilityHint={selected ? t.counterDeselectHint : t.counterSelectHint}
              hitSlop={{ top: VERTICAL_SLOP, bottom: VERTICAL_SLOP, left: HORIZONTAL_SLOP, right: HORIZONTAL_SLOP }}
              testID={`movement-catalogue-counter-${option.value}`}
            >
              <Text
                style={[styles.label, selected ? styles.labelSelected : null]}
                numberOfLines={1}
                testID={`movement-catalogue-counter-${option.value}-label`}
              >
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
  },
  group: {
    flexDirection: "row",
    alignItems: "center",
  },
  // Figma `10266:20575` : « · » à 6 de « 2 familles », « 7 mouvements » à 6 du point.
  separator: {
    ...type.contextLine,
    color: CONTEXT_TEXT_COLOR,
    marginHorizontal: spacing[6],
  },
  label: {
    ...type.contextLine,
    color: CONTEXT_TEXT_COLOR,
  },
  labelSelected: {
    ...CONTEXT_LINE_SELECTED,
    color: colors.primary,
  },
});
