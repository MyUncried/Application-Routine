import { StyleSheet, Text, View } from "react-native";

import { formatActivityRecoveryLabel } from "@/features/sessions/compositionPresentation";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, spacing } from "@/shared/ui/tokens";

/** Hauteur de la ligne structurelle (Figma `8328:28657`). */
export const ACTIVITY_RECOVERY_LINE_HEIGHT = 21;

/** Libellé (Figma `8328:28660`) : Inter Medium 11, interligne Auto (D2). */
const RECOVERY_TEXT = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 11, lineHeight: 13 } as const;

/** Trait (Figma `8328:28661`) : épaisseur 1. */
const RULE_THICKNESS = 1;

/**
 * Ligne structurelle de récupération sous une occurrence de la Composition
 * (PRE-6 story 2.1, D-303, D-217, Figma `8328:28657`) : hauteur 21, marges
 * 14 / 4, trait `divider` sur toute la largeur restante — TOUJOURS présent.
 * Si R > 0 : sablier 13 et « Récupération {durée} » avant le trait ; R
 * absente ou 0 : trait seul, sans aucune information (remplace la sous-carte
 * « Récupération 0 s », écart E5).
 *
 * Non interactive : elle appartient au bloc de l'occurrence, dont elle suit
 * le déplacement et le balayage (`CompositionActivityRow`).
 */
export function ActivityRecoveryLine({
  recoverySeconds,
  testID,
}: {
  recoverySeconds: number | null | undefined;
  testID?: string;
}) {
  const label = formatActivityRecoveryLabel(recoverySeconds);
  return (
    <View
      style={styles.line}
      accessible={label !== null}
      accessibilityLabel={label ?? undefined}
      testID={testID}
    >
      {label !== null ? (
        <>
          <KodjoIcon name="recovery-hourglass" testID="composition-recovery-line-icon" />
          <Text style={styles.label} numberOfLines={1} testID="composition-recovery-line-label">
            {label}
          </Text>
        </>
      ) : null}
      <View style={styles.rule} testID="composition-recovery-line-rule" />
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    height: ACTIVITY_RECOVERY_LINE_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[6],
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[4],
  },
  label: {
    ...RECOVERY_TEXT,
    color: TEXT_TERTIARY,
  },
  rule: {
    flex: 1,
    height: RULE_THICKNESS,
    backgroundColor: colors.divider,
  },
});
