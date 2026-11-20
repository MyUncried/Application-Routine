import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ContentFrequency } from "@/domain/planning/Routine";
import { FREQUENCY_N_MAX, fromFrequency, isComplete, toFrequency, togglePosition, withN, withX } from "@/features/planning/frequencyDraft";
import { planningStrings } from "@/features/planning/planningStrings";
import { ModalHeader } from "@/shared/ui/ModalHeaderActions";
import { InlineStepper, PROFILE_HOLD_POLICY } from "@/shared/ui/ProfileStepper";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";

/**
 * « Fréquence » (CE-UI-11 ; Figma `7594:34653`) : en-tête ✕ / Fréquence / ✓ (D-499), nom du contenu, stepper x,
 * « fois sur », stepper n, « Occurrences retenues », n pastilles numérotées. Retenu #5F60EE texte blanc Semi Bold ;
 * non retenu #F9FAFC texte #141414 Regular. Règles du brouillon : `frequencyDraft`.
 */
export function PlanningFrequencySheet({
  name,
  frequency,
  onCancel,
  onValidate,
}: {
  readonly name: string;
  readonly frequency: ContentFrequency;
  readonly onCancel: () => void;
  readonly onValidate: (frequency: ContentFrequency) => void;
}) {
  const t = planningStrings.frequency;
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(() => fromFrequency(frequency));
  const complete = isComplete(draft);
  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[16] }]} testID="planning-frequency-sheet">
      <ModalHeader
        title={t.title}
        onCancel={onCancel}
        cancelLabel={t.cancel}
        onValidate={() => complete && onValidate(toFrequency(draft))}
        validateEnabled={complete}
        validateLabel={t.validate}
        testIDPrefix="planning-frequency"
      />
      <Text style={styles.name} numberOfLines={2} testID="planning-frequency-name">
        {name}
      </Text>
      <View style={styles.steppers}>
        <InlineStepper
          value={draft.x}
          min={1}
          max={draft.n}
          policy={PROFILE_HOLD_POLICY}
          formatValue={(value) => String(value ?? "")}
          onChange={(value) => setDraft((current) => withX(current, value))}
          accessibilityLabel={t.xAccessibility}
          testID="planning-frequency-x"
        />
        <Text style={styles.timesOn}>{t.timesOn}</Text>
        <InlineStepper
          value={draft.n}
          min={1}
          max={FREQUENCY_N_MAX}
          policy={PROFILE_HOLD_POLICY}
          formatValue={(value) => String(value ?? "")}
          onChange={(value) => setDraft((current) => withN(current, value))}
          accessibilityLabel={t.nAccessibility}
          testID="planning-frequency-n"
        />
      </View>
      <Text style={styles.retained}>{t.retained}</Text>
      <View style={styles.pastilles} testID="planning-frequency-positions">
        {Array.from({ length: draft.n }, (_, index) => index + 1).map((position) => {
          const selected = draft.positions.includes(position);
          return (
            <Pressable
              key={position}
              onPress={() => setDraft((current) => togglePosition(current, position))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={t.position.replace("{position}", String(position))}
              style={[styles.pastille, selected ? styles.pastilleSelected : null]}
              testID={`planning-frequency-position-${position}`}
            >
              <Text style={[styles.pastilleLabel, selected ? styles.pastilleLabelSelected : null]}>{position}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const PASTILLE = 40;

const styles = StyleSheet.create({
  sheet: { backgroundColor: colors.background, paddingTop: spacing[8] },
  name: { ...type.body, color: colors.textSecondary, textAlign: "center", paddingHorizontal: layout.screenGutter },
  steppers: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: layout.screenGutter, marginTop: spacing[16] },
  timesOn: { ...type.sectionTitle, color: colors.textPrimary },
  retained: { ...type.sectionTitle, color: colors.textPrimary, paddingHorizontal: layout.screenGutter, marginTop: spacing[20] },
  pastilles: { flexDirection: "row", flexWrap: "wrap", gap: spacing[12], paddingHorizontal: layout.screenGutter, marginTop: spacing[12] },
  pastille: {
    width: PASTILLE,
    height: PASTILLE,
    borderRadius: PASTILLE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.cardsBorder,
  },
  pastilleSelected: { backgroundColor: colors.selection, borderColor: colors.selection },
  pastilleLabel: { ...type.body, color: colors.textPrimary },
  pastilleLabelSelected: { fontFamily: "Inter_600SemiBold", fontWeight: "600", color: colors.background },
});
