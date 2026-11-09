import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, dimensions, type } from "@/shared/ui/tokens";

/**
 * PRE-10.3 — dialogue centré de l'Exécution (`Overlay / Decision Dialog`, CE-EXEC-SESSION-01 :
 * Réinitialiser `1992:8224`, Suivant `1992:8326`, Pause `1992:8428`) : deux actions côte à côte,
 * neutre/primaire ou primaire/destructive. Ne se ferme que par l'une de ses actions.
 */
export type ExecutionDialogAction = { readonly label: string; readonly tone: "neutral" | "primary" | "danger"; readonly onPress: () => void; readonly testID: string };

export function ExecutionDialog({
  title,
  message,
  actions,
  testID,
  visible = true,
}: {
  readonly title: string;
  readonly message: string;
  readonly actions: readonly [ExecutionDialogAction, ExecutionDialogAction];
  readonly testID: string;
  /**
   * Recette PRE-10 du 09/11/2026 : l'écran d'Exécution garde un seul `Modal` monté et bascule `visible`.
   * Démonter un dialogue et en monter un autre dans la même image laissait sur iOS une présentation vide
   * qui bloquait tous les touchers, jusqu'à la fermeture de l'application.
   */
  readonly visible?: boolean;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.backdrop} testID={`${testID}-backdrop`}>
        <View style={styles.card} accessibilityRole="alert" accessibilityViewIsModal testID={testID}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            {actions.map((action) => (
              <Pressable
                key={action.testID}
                onPress={action.onPress}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                style={[styles.action, toneStyles[action.tone]]}
                testID={action.testID}
              >
                <Text style={[styles.actionLabel, action.tone === "neutral" ? styles.neutralLabel : styles.strongLabel]} numberOfLines={2}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
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
  actions: { flexDirection: "row", gap: dimensions.decisionDialog.actionGap },
  action: {
    flex: 1,
    minHeight: dimensions.decisionDialog.actionHeight,
    borderRadius: dimensions.decisionDialog.actionRadius,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  actionLabel: { ...type.button, textAlign: "center" },
  neutralLabel: { color: colors.dialogNeutralActionText },
  strongLabel: { color: colors.background },
});

const toneStyles = StyleSheet.create({
  neutral: { backgroundColor: colors.dialogNeutralActionBackground },
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.dialogDestructiveActionBackground },
});
