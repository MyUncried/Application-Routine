import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { planningStrings } from "@/features/planning/planningStrings";
import { colors, dimensions, type } from "@/shared/ui/tokens";

/**
 * « Supprimer des occurrences ? » — planification périodique (Figma `1992:6102`, CE-UI-03 §14) : première ligne
 * avec les deux actions destructives « Seulement cette occurrence » et « Toutes les occurrences à venir »,
 * puis « Annuler » en pleine largeur. Mêmes jetons que les dialogues de décision (`dimensions.decisionDialog`).
 */
export function OccurrenceDeleteDialog({
  onThisOne,
  onAllUpcoming,
  onCancel,
}: {
  readonly onThisOne: () => void;
  readonly onAllUpcoming: () => void;
  readonly onCancel: () => void;
}) {
  const t = planningStrings.deleteOccurrences;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop} testID="occurrence-delete-backdrop">
        <View style={styles.card} accessibilityRole="alert" accessibilityViewIsModal testID="occurrence-delete-dialog">
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.message}>{t.message}</Text>
          <View style={styles.row}>
            <Pressable onPress={onThisOne} accessibilityRole="button" accessibilityLabel={t.thisOne} style={[styles.action, styles.danger]} testID="occurrence-delete-this">
              <Text style={[styles.label, styles.dangerLabel]} numberOfLines={2}>
                {t.thisOne}
              </Text>
            </Pressable>
            <Pressable
              onPress={onAllUpcoming}
              accessibilityRole="button"
              accessibilityLabel={t.allUpcoming}
              style={[styles.action, styles.danger]}
              testID="occurrence-delete-all"
            >
              <Text style={[styles.label, styles.dangerLabel]} numberOfLines={2}>
                {t.allUpcoming}
              </Text>
            </Pressable>
          </View>
          <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel={t.cancel} style={[styles.action, styles.neutral]} testID="occurrence-delete-cancel">
            <Text style={[styles.label, styles.neutralLabel]}>{t.cancel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlayScrim, alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    width: dimensions.decisionDialog.width,
    maxWidth: "100%",
    backgroundColor: colors.background,
    borderRadius: dimensions.decisionDialog.radius,
    padding: dimensions.decisionDialog.padding,
    gap: dimensions.decisionDialog.gap,
  },
  title: { ...type.modalTitle, color: colors.dialogTitleText, textAlign: "center" },
  message: { ...type.body, color: colors.dialogMessageText, textAlign: "center" },
  row: { flexDirection: "row", gap: dimensions.decisionDialog.actionGap },
  action: {
    flex: 1,
    minHeight: dimensions.decisionDialog.actionHeight,
    borderRadius: dimensions.decisionDialog.actionRadius,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  danger: { backgroundColor: colors.danger },
  neutral: { flex: 0, alignSelf: "stretch", backgroundColor: colors.surface },
  label: { ...type.button, textAlign: "center" },
  dangerLabel: { color: colors.background },
  neutralLabel: { color: colors.dialogNeutralActionText },
});
