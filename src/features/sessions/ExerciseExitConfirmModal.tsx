import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { strings } from "@/shared/i18n";
import { colors, spacing, type } from "@/shared/ui/tokens";

export type ExerciseExitConfirmModalProps = {
  /** « Continuer la modification » — ferme la modale, conserve intégralement la copie de travail locale. */
  onCancel: () => void;
  /** « Abandonner » — abandonne la copie de travail locale puis rejoue la navigation initialement bloquée. */
  onConfirm: () => void;
};

/**
 * Modale « Abandonner les modifications ? » de l'écran Exercice (T01-S08,
 * D-094). Titre, message et libellés d'action repris mot pour mot de
 * l'arbitrage validé — distincte d'`AbandonCreationModal` (Composition,
 * T01-S07) : celle-ci porte sur la copie de travail locale de l'Exercice,
 * jamais sur le `SessionDraft` partagé.
 *
 * `onRequestClose` (bouton matériel Android) traité comme `onCancel`, même
 * convention qu'`AbandonCreationModal` (micro-arbitrage fonctionnel
 * conventionnel, validation native différée).
 */
export function ExerciseExitConfirmModal({
  onCancel,
  onConfirm,
}: ExerciseExitConfirmModalProps) {
  const modalStrings = strings.screens.exercise.exitConfirmModal;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert">
          <Text style={styles.title}>{modalStrings.title}</Text>
          <Text style={styles.message}>{modalStrings.message}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={modalStrings.continueEditing}
              style={styles.secondaryAction}
            >
              <Text style={styles.secondaryLabel}>{modalStrings.continueEditing}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={modalStrings.abandon}
              style={styles.primaryAction}
            >
              <Text style={styles.primaryLabel}>{modalStrings.abandon}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20, 20, 20, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[24],
  },
  card: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing[24],
    gap: spacing[12],
  },
  title: {
    ...type.modalTitle,
    color: colors.textPrimary,
  },
  message: {
    ...type.body,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing[12],
    marginTop: spacing[12],
  },
  secondaryAction: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    borderRadius: 20,
  },
  secondaryLabel: {
    ...type.button,
    color: colors.textSecondary,
  },
  primaryAction: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    borderRadius: 20,
    backgroundColor: colors.danger,
  },
  primaryLabel: {
    ...type.button,
    color: colors.background,
  },
});
