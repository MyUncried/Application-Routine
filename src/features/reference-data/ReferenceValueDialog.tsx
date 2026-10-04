import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { strings } from "@/shared/i18n";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

export type ReferenceValueDialogProps = {
  /** Nom COURANT de la valeur — utilisé tel quel dans le titre de confirmation de suppression (§4.10 L134). */
  name: string;
  /** Détermine le message de suppression (§4.10 L135) : utilisée ou non par des objets existants. */
  isUsed: boolean;
  /** « Annuler » du menu, ou du dialogue de confirmation — ferme sans rien modifier. */
  onCancel: () => void;
  /** « Modifier » — ferme ce dialogue et délègue l'édition (nom, couleur) à l'appelant (D4). */
  onModify: () => void;
  /** Confirmation de suppression — appelé uniquement après le second dialogue. */
  onDelete: () => void;
  testIDPrefix: string;
};

/**
 * Dialogue d'appui long partagé (D4, D-259) : composé de `DecisionDialog`
 * et de son propre menu de trois actions (`Annuler`, `Modifier`,
 * `Supprimer`) — l'appui long ne sélectionne ni ne désaffecte jamais la
 * valeur visée (D4). `Supprimer` ouvre un second dialogue de confirmation
 * (§4.10 L134/L135, titre exact « Supprimer « {nom} » ? », message
 * différent selon l'usage), réutilisant `DecisionDialog` tel quel (même
 * composant que les dialogues d'abandon canoniques).
 */
export function ReferenceValueDialog({
  name,
  isUsed,
  onCancel,
  onModify,
  onDelete,
  testIDPrefix,
}: ReferenceValueDialogProps) {
  const [step, setStep] = useState<"actions" | "delete">("actions");
  const t = strings.referenceData;

  if (step === "delete") {
    return (
      <DecisionDialog
        title={`${t.deleteConfirm.titlePrefix}${name}${t.deleteConfirm.titleSuffix}`}
        titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
        message={isUsed ? t.deleteConfirm.usedMessage : t.deleteConfirm.unusedMessage}
        messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText }}
        cancelLabel={t.deleteConfirm.cancel}
        cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
        confirmLabel={t.deleteConfirm.confirm}
        confirmLabelStyle={type.dialogDestructiveActionLabel}
        confirmBordered
        onCancel={onCancel}
        onConfirm={onDelete}
        testIDPrefix={`${testIDPrefix}-delete-confirm`}
      />
    );
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop} testID={`${testIDPrefix}-backdrop`}>
        <View style={styles.card} accessibilityRole="menu" accessibilityLabel={name} testID={`${testIDPrefix}-card`}>
          <Text style={styles.title} numberOfLines={1}>
            {name}
          </Text>
          <Pressable
            onPress={onCancel}
            accessibilityRole="menuitem"
            accessibilityLabel={t.longPressDialog.cancel}
            style={styles.actionRow}
            testID={`${testIDPrefix}-cancel`}
          >
            <Text style={styles.actionLabel}>{t.longPressDialog.cancel}</Text>
          </Pressable>
          <Pressable
            onPress={onModify}
            accessibilityRole="menuitem"
            accessibilityLabel={t.longPressDialog.modify}
            style={styles.actionRow}
            testID={`${testIDPrefix}-modify`}
          >
            <Text style={styles.actionLabel}>{t.longPressDialog.modify}</Text>
          </Pressable>
          <Pressable
            onPress={() => setStep("delete")}
            accessibilityRole="menuitem"
            accessibilityLabel={t.longPressDialog.delete}
            style={styles.actionRow}
            testID={`${testIDPrefix}-delete`}
          >
            <Text style={[styles.actionLabel, styles.destructiveLabel]}>{t.longPressDialog.delete}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[24],
  },
  card: {
    width: dimensions.decisionDialog.width,
    backgroundColor: colors.background,
    borderRadius: dimensions.decisionDialog.radius,
    padding: dimensions.decisionDialog.padding,
    gap: spacing[8],
  },
  title: {
    ...type.modalTitle,
    color: colors.dialogTitleText,
    textAlign: "center",
    marginBottom: spacing[8],
  },
  actionRow: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    ...type.button,
    color: colors.textPrimary,
  },
  destructiveLabel: {
    color: colors.danger,
  },
});
