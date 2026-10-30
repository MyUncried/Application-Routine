import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, minTouchTarget } from "@/shared/ui/tokens";

/**
 * Recette iPhone CAT.1 du 30/10/2026 (Hermann, cat-titre : « Adopter le style texte de Figma ») —
 * navigation des Catalogues Mouvements / Séances / Programmes dans l'en-tête, au style texte de
 * Figma (`10266:20575` : `10923:19889` à `10923:19893` ; `1992:9910` : `10931:19889` à
 * `10931:19893`), à la place du contrôle segmenté encadré. [Remplace, au 30/10/2026, la conservation
 * « telle quelle » du `SegmentedControl` dans l'en-tête (CAT.1).]
 *
 * - Libellés Inter 17 : sélectionné Bold bleu Kodjo (`#0508E5`), autres Regular noir (`#000000`) ;
 *   séparateurs « | » : traits noirs 1,5 × 12,2, à 14 des libellés de part et d'autre ; groupe centré.
 * - Comportement inchangé : un seul Catalogue sélectionné, Programmes visible et indisponible
 *   (aucune navigation, annoncé indisponible) ; rôles `tablist` / `tab`, état `selected` annoncé.
 *   Programmes garde le style des libellés non sélectionnés, comme dans Figma.
 *
 * Constantes locales : le jeu de jetons de `tokens.ts` est figé (contrats PRE-3 / PRE-4).
 */

export type CatalogueNavigationOption<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
};

const NAVIGATION_TEXT_COLOR = "#000000";
const NAVIGATION_LINE = 21;
const SEPARATOR_GAP = 14;
const VERTICAL_SLOP = Math.max(0, (minTouchTarget - NAVIGATION_LINE) / 2);
const HORIZONTAL_SLOP = SEPARATOR_GAP / 2;

export function CatalogueNavigation<T extends string>({
  options,
  value,
  onChange,
  testID,
}: {
  readonly options: readonly CatalogueNavigationOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly testID: string;
}) {
  return (
    <View style={styles.row} accessibilityRole="tablist" testID={testID}>
      {options.map((option, index) => {
        const selected = option.value === value;
        const disabled = Boolean(option.disabled);
        return (
          <View key={option.value} style={styles.group}>
            {index > 0 ? (
              <View
                style={styles.separator}
                accessible={false}
                importantForAccessibility="no"
                testID={`${testID}-separator-${index}`}
              />
            ) : null}
            <Pressable
              onPress={() => {
                if (!disabled && !selected) onChange(option.value);
              }}
              disabled={disabled}
              accessibilityRole="tab"
              accessibilityLabel={option.accessibilityLabel ?? option.label}
              accessibilityState={{ selected, disabled }}
              hitSlop={{ top: VERTICAL_SLOP, bottom: VERTICAL_SLOP, left: HORIZONTAL_SLOP, right: HORIZONTAL_SLOP }}
              testID={`${testID}-${option.value}`}
            >
              <Text
                style={[styles.label, selected ? styles.labelSelected : null]}
                numberOfLines={1}
                testID={`${testID}-${option.value}-label`}
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
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  group: {
    flexDirection: "row",
    alignItems: "center",
  },
  separator: {
    width: 1.5,
    height: 12.2,
    marginHorizontal: SEPARATOR_GAP,
    backgroundColor: NAVIGATION_TEXT_COLOR,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    fontSize: 17,
    lineHeight: NAVIGATION_LINE,
    color: NAVIGATION_TEXT_COLOR,
  },
  labelSelected: {
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    color: colors.primary,
  },
});
