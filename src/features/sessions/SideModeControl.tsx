import { Pressable, StyleSheet, Text, View } from "react-native";

import { cycleSideMode, type SideMode } from "@/domain/sessions/sideMode";
import { strings } from "@/shared/i18n";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

export type SideModeControlProps = {
  readonly value: SideMode;
  /** Reçoit directement la valeur SUIVANTE (`cycleSideMode(value)`, déjà calculée) — jamais l'appelant qui recalcule le cycle. */
  readonly onChange: (next: SideMode) => void;
  /**
   * Enfant `IN_TOUR` d'un Tour bilatéral (plan `## UI`, « enfant visible,
   * désactivé, proprement `UNILATERAL` ») : le contrôle reste visible mais
   * n'accepte plus aucun appui. `value` doit alors déjà valoir `UNILATERAL`
   * (remis par `applyTourSideModeTransition` au moment de l'activation) —
   * ce composant ne le force pas lui-même, il reste purement présentational.
   */
  readonly disabled?: boolean;
  readonly testID?: string;
};

/**
 * Contrôle `Côtés` (V2-BILAT-01, `sideMode.ts`) — un seul appui fait AVANCER
 * la direction d'un cran (`cycleSideMode` : `Unilatéral → D→G → G→D →
 * Unilatéral`), jamais un sélecteur à trois options distinctes. Partagé par
 * `ExerciseScreen` (Activité, « après le segment de mode et avant les
 * paramètres », dans les trois modes d'exécution) et `CompositionScreen`
 * (Tour, « après Nombre de tours ») — un seul composant, jamais deux copies
 * locales pouvant diverger.
 *
 * Anatomie minimale, cohérente avec les contrôles compacts déjà établis
 * (`ParameterField` d'`ExerciseScreen.tsx`, `Nombre de tours` de
 * `CompositionScreen.tsx`) : libellé court au-dessus, valeur affichée dans un
 * cadre pressable en dessous. Aucune référence Figma dédiée n'accompagne
 * cette tranche (plan `V2-BILAT-01` — configuration préalable à T03, hors
 * recette visuelle) : la géométrie réutilise donc des tokens déjà canoniques
 * (`dimensions.exerciseParameterRow`) plutôt que d'en publier de nouveaux,
 * écart disclosé dans le rapport de mission.
 */
export function SideModeControl({ value, onChange, disabled = false, testID }: SideModeControlProps) {
  const t = strings.shared.sideMode;
  const valueLabel = t.valueLabels[value];
  const accessibilityLabel = t.accessibilityLabels[value];

  function handlePress() {
    onChange(cycleSideMode(value));
  }

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label} numberOfLines={1}>
        {t.compactLabel}
      </Text>
      <Pressable
        disabled={disabled}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        hitSlop={HIT_SLOP}
        style={[styles.control, disabled ? styles.controlDisabled : null]}
        testID={testID ? `${testID}-control` : undefined}
      >
        <Text
          style={[styles.value, disabled ? styles.valueDisabled : null]}
          numberOfLines={1}
          testID={testID ? `${testID}-value` : undefined}
        >
          {valueLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const HIT_SLOP = {
  top: (minTouchTarget - dimensions.exerciseParameterRow.controlHeight) / 2,
  bottom: (minTouchTarget - dimensions.exerciseParameterRow.controlHeight) / 2,
  left: 0,
  right: 0,
} as const;

const styles = StyleSheet.create({
  container: {
    gap: dimensions.exerciseParameterRow.labelGap,
  },
  label: {
    ...type.parameterColumnLabel,
    color: colors.exerciseParameterLabelText,
  },
  control: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: dimensions.exerciseParameterRow.controlHeight,
    minWidth: dimensions.exerciseParameterRow.narrowColumnWidth,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.exerciseParameterControlBorder,
    borderRadius: dimensions.exerciseParameterRow.controlRadius,
    paddingHorizontal: spacing[12],
  },
  controlDisabled: {
    opacity: 0.5,
  },
  value: {
    ...type.label,
    color: colors.exerciseParameterValueText,
  },
  valueDisabled: {
    color: colors.disabled,
  },
});
