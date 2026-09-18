import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, dimensions, type } from "@/shared/ui/tokens";

export type SegmentedControlOption<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
  /** Nom accessible du segment — `label` par défaut. Utile pour annoncer explicitement un segment désactivé (D-108). */
  readonly accessibilityLabel?: string;
};

export type SegmentedControlProps<T extends string> = {
  readonly options: readonly SegmentedControlOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
};

/**
 * `Controls / Segmented — Source exact` (V2-CAT-01, plan §7 étape 7),
 * extrait comme composant canonique partagé — auparavant deux copies locales
 * divergentes (`ExerciseScreen.tsx`, `CatalogueScreen.tsx`
 * `ContentTypeSelector`). Répartit ses options par Flexbox (largeur égale,
 * dérivée de l'espace disponible — jamais une largeur figée), conserve la
 * géométrie DSF canonique (`dimensions.segmentedControl`) et anime la
 * transition d'état du segment sélectionné (opacité/couleur, RN natif —
 * jamais de saut brutal).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
}: SegmentedControlProps<T>) {
  return (
    <View
      style={styles.container}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            disabled={option.disabled}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled: Boolean(option.disabled) }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            style={[styles.segment, selected ? styles.segmentSelected : null]}
            testID={testID ? `${testID}-${option.value}` : undefined}
          >
            <Text
              style={[
                styles.label,
                selected ? styles.labelSelected : null,
                option.disabled ? styles.labelDisabled : null,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    height: dimensions.segmentedControl.height,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.segmentedControl.containerRadius,
    padding: dimensions.segmentedControl.padding,
    gap: dimensions.segmentedControl.gap,
  },
  segment: {
    flex: 1,
    height: dimensions.segmentedControl.segmentHeight,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dimensions.segmentedControl.segmentRadius,
  },
  segmentSelected: {
    backgroundColor: colors.selection,
  },
  label: {
    ...type.label,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.background,
  },
  labelDisabled: {
    color: colors.disabled,
  },
});
