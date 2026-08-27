import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { strings } from "@/shared/i18n";
import { colors, spacing, type } from "@/shared/ui/tokens";

export type AbandonCreationModalProps = {
  /** « Continuer la création » — ferme la modale, conserve intégralement la création en cours. */
  onCancel: () => void;
  /** « Abandonner » — réinitialise le brouillon puis rejoue la navigation initialement bloquée. */
  onConfirm: () => void;
};

/**
 * Modale « Abandonner la création d'une séance » (docs §06, « Les modales »).
 * Titre, message et libellés d'action repris mot pour mot de la
 * spécification fonctionnelle.
 *
 * `onRequestClose` (bouton matériel Android pendant que la modale est
 * affichée) est traité comme `onCancel` — même issue que « Continuer la
 * création » : ferme la modale, conserve intégralement le brouillon, ne
 * déclenche jamais `onConfirm`. Micro-arbitrage fonctionnel conventionnel
 * validé (contre-vérification T01-S07) — son fonctionnement physique réel
 * reste une validation native différée, faute d'émulateur/device.
 */
export function AbandonCreationModal({ onCancel, onConfirm }: AbandonCreationModalProps) {
  const modalStrings = strings.screens.composition.abandonModal;

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
              accessibilityLabel={modalStrings.continueCreating}
              style={styles.secondaryAction}
            >
              <Text style={styles.secondaryLabel}>{modalStrings.continueCreating}</Text>
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
