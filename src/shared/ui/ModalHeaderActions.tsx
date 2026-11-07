import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * En-tête de modale « Fermer et valider » — croix (ou Retour) à gauche, titre centré, coche à droite.
 *
 * Source : Figma « En-tête modal — Paramètres d'exécution » (`DSF / Overlays / En-tête de modale`, actions
 * `DSF / Actions / Fermer et valider`, pictogrammes `wheel-action-cancel` / `wheel-action-validate`, cercles de 38).
 * Complément du 5 novembre 2026 (Hermann), §18–§19 : toute modale qui crée ou modifie se valide par la coche de son
 * en-tête, en face de la croix ; le bouton de validation du bas est supprimé. La coche est bleue (couleur de marque)
 * quand la validation est possible, grise quand un paramètre requis manque ou est incohérent.
 *
 * Extrait de la feuille des Paramètres d'exécution (même géométrie, mêmes couleurs) pour être partagé par les
 * questionnaires et récapitulatifs des Formats, le choix des mouvements, la planification et la Fréquence.
 */
export const MODAL_HEADER_ACTION_SIZE = 38;
const HIT_SLOP = (minTouchTarget - MODAL_HEADER_ACTION_SIZE) / 2;

export type ModalValidateActionProps = {
  readonly onPress: () => void;
  /** Validation possible : coche bleue. Sinon grise. */
  readonly enabled: boolean;
  /**
   * Appui refusé. Par défaut `!enabled`. La feuille des Paramètres d'exécution laisse la coche grise recevoir l'appui
   * tant qu'une surface est ouverte (Story 3.8, AC5 : l'appui ferme la surface).
   */
  readonly disabled?: boolean;
  readonly accessibilityLabel: string;
  readonly testID: string;
  readonly style?: StyleProp<ViewStyle>;
};

export function ModalValidateAction({ onPress, enabled, disabled, accessibilityLabel, testID, style }: ModalValidateActionProps) {
  const refused = disabled ?? !enabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={refused}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: refused }}
      hitSlop={HIT_SLOP}
      style={[styles.validateCircle, enabled ? null : styles.validateCircleDisabled, style]}
      testID={testID}
    >
      <KodjoIcon name="wheel-action-validate" />
    </Pressable>
  );
}

export type ModalCancelActionProps = {
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
  readonly testID: string;
  readonly style?: StyleProp<ViewStyle>;
};

export function ModalCancelAction({ onPress, accessibilityLabel, testID, style }: ModalCancelActionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={HIT_SLOP}
      style={[styles.cancelCircle, style]}
      testID={testID}
    >
      <KodjoIcon name="wheel-action-cancel" />
    </Pressable>
  );
}

export type ModalHeaderProps = {
  readonly title: string;
  readonly onCancel: () => void;
  readonly cancelLabel: string;
  readonly onValidate: () => void;
  readonly validateEnabled: boolean;
  readonly validateDisabled?: boolean;
  readonly validateLabel: string;
  /** Identifiants : `${prefix}-header`, `${prefix}-cancel`, `${prefix}-validate`, `${prefix}-title`. */
  readonly testIDPrefix: string;
  readonly style?: StyleProp<ViewStyle>;
};

/** Ligne d'en-tête complète : croix, titre centré, coche. */
export function ModalHeader({
  title,
  onCancel,
  cancelLabel,
  onValidate,
  validateEnabled,
  validateDisabled,
  validateLabel,
  testIDPrefix,
  style,
}: ModalHeaderProps) {
  return (
    <View style={[styles.header, style]} testID={`${testIDPrefix}-header`}>
      <ModalCancelAction onPress={onCancel} accessibilityLabel={cancelLabel} testID={`${testIDPrefix}-cancel`} />
      <Text style={styles.title} accessibilityRole="header" testID={`${testIDPrefix}-title`}>
        {title}
      </Text>
      <ModalValidateAction
        onPress={onValidate}
        enabled={validateEnabled}
        {...(validateDisabled !== undefined ? { disabled: validateDisabled } : {})}
        accessibilityLabel={validateLabel}
        testID={`${testIDPrefix}-validate`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // Recette 1 (T-61) : hauteur minimale, jamais fixe — le titre agrandi n'est pas rogné.
    minHeight: 56,
    paddingHorizontal: spacing[12] + 5,
  },
  title: {
    ...type.modalTitle,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: "center",
  },
  cancelCircle: {
    width: MODAL_HEADER_ACTION_SIZE,
    height: MODAL_HEADER_ACTION_SIZE,
    borderRadius: MODAL_HEADER_ACTION_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.wheelActionCancelBackground,
  },
  validateCircle: {
    width: MODAL_HEADER_ACTION_SIZE,
    height: MODAL_HEADER_ACTION_SIZE,
    borderRadius: MODAL_HEADER_ACTION_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.wheelActionValidateBackground,
  },
  validateCircleDisabled: {
    backgroundColor: colors.disabled,
  },
});
