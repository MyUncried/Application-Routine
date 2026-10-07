import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { TextStyle } from "react-native";

import { colors, dimensions } from "@/shared/ui/tokens";

export type DecisionDialogProps = {
  title: string;
  /** Style complet du titre (police/taille/couleur) — chaque contexte fournit le sien, vérifié sur son propre nœud Figma. */
  titleStyle: TextStyle;
  message: string;
  /** Style complet du message (police/taille/couleur/alignement) — idem. */
  messageStyle: TextStyle;
  cancelLabel: string;
  cancelLabelStyle: TextStyle;
  confirmLabel: string;
  confirmLabelStyle: TextStyle;
  /** L'action destructive porte-t-elle un liseré distinct de son fond (vérifié présent pour le dialogue Séance, absent pour le dialogue Activité) ? */
  confirmBordered: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** Préfixe des `testID` internes (`${testIDPrefix}-backdrop`/`-card`/`-actions`) — un contexte par appelant, jamais partagé entre deux instances simultanées. */
  testIDPrefix: string;
};

/**
 * `Overlay / Decision Dialog` (`2590:2961`) — composant partagé, extrait par
 * REWORK11 (`[ChatGPT] CHANGES_REQUESTED — REWORK11 — dialogue d'abandon
 * d'une Activité`, 2026-09-04, « Réutilisation canonique obligatoire ») à
 * partir d'`AbandonCreationModal.tsx` (REWORK10, dialogue d'abandon de
 * création de séance, `2591:3083`, validé sur iPhone). Porte la géométrie
 * et le comportement **strictement identiques** entre les deux contextes
 * consommateurs (dialogue Séance et dialogue Activité) : voile, carte
 * flottante centrée (`354` large, rayon `18`, ombre canonique), deux
 * actions `147×48` sur une seule ligne (écart `12`), écart vertical
 * `spacing/16` entre chaque bloc, animation en fondu, `onRequestClose`
 * traité comme Annuler.
 *
 * **Ce qui reste délibérément propre à chaque contexte** (REWORK11 :
 * « les textes et callbacks restent propres à chaque contexte » — étendu
 * ici à la typographie du texte, vérifiée distincte entre les deux
 * instances Figma concrètes, `2591:3083` Séance vs `3224:4140` Activité :
 * taille/graisse des libellés d'action `16/16` vs `14/14` Semi Bold,
 * couleur/alignement/interligne du message, présence d'un liseré sur
 * l'action destructive) : `titleStyle`/`messageStyle`/`cancelLabelStyle`/
 * `confirmLabelStyle`/`confirmBordered` sont donc des props explicites,
 * jamais une valeur unique imposée aux deux contextes. La géométrie
 * commune (largeur, rayon, dimensions/espacement des actions, fond
 * neutre/destructif) reste, elle, entièrement interne à ce composant —
 * aucune duplication locale n'est permise pour ces valeurs (REWORK11).
 */
export function DecisionDialog({
  title,
  titleStyle,
  message,
  messageStyle,
  cancelLabel,
  cancelLabelStyle,
  confirmLabel,
  confirmLabelStyle,
  confirmBordered,
  onCancel,
  onConfirm,
  testIDPrefix,
}: DecisionDialogProps) {
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop} testID={`${testIDPrefix}-backdrop`}>
        <View style={styles.card} accessibilityRole="alert" testID={`${testIDPrefix}-card`}>
          <Text style={[styles.title, titleStyle]}>{title}</Text>
          <Text style={[styles.message, messageStyle]}>{message}</Text>
          <View style={styles.actions} testID={`${testIDPrefix}-actions`}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              style={styles.neutralAction}
            >
              <Text style={[styles.neutralLabel, cancelLabelStyle]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              style={[styles.destructiveAction, confirmBordered ? styles.destructiveActionBorder : null]}
            >
              <Text style={[styles.destructiveLabel, confirmLabelStyle]}>{confirmLabel}</Text>
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
    // Alignement DSF 07/10 : même valeur que `colors.overlayScrim`, désormais
    // référencée plutôt que recopiée (rendu inchangé).
    backgroundColor: colors.overlayScrim,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: dimensions.decisionDialog.width,
    backgroundColor: colors.background,
    borderRadius: dimensions.decisionDialog.radius,
    padding: dimensions.decisionDialog.padding,
    gap: dimensions.decisionDialog.gap,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  // Base minimale — chaque appelant fournit la totalité de la police/
  // couleur/alignement via `titleStyle`/`messageStyle`/`*LabelStyle`
  // (vérifiés distincts entre contextes, voir la documentation ci-dessus).
  title: {
    textAlign: "center",
  },
  message: {},
  actions: {
    flexDirection: "row",
    gap: dimensions.decisionDialog.actionGap,
  },
  neutralAction: {
    width: dimensions.decisionDialog.actionWidth,
    height: dimensions.decisionDialog.actionHeight,
    borderRadius: dimensions.decisionDialog.actionRadius,
    backgroundColor: colors.dialogNeutralActionBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  neutralLabel: {
    textAlign: "center",
  },
  destructiveAction: {
    width: dimensions.decisionDialog.actionWidth,
    height: dimensions.decisionDialog.actionHeight,
    borderRadius: dimensions.decisionDialog.actionRadius,
    backgroundColor: colors.dialogDestructiveActionBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  destructiveActionBorder: {
    borderWidth: 1,
    borderColor: colors.dialogDestructiveActionBorder,
  },
  destructiveLabel: {
    textAlign: "center",
    color: colors.background,
  },
});
