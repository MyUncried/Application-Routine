import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { strings } from "@/shared/i18n";
import { colors, dimensions, type } from "@/shared/ui/tokens";

export type AbandonCreationModalProps = {
  /** « Annuler » — ferme la modale, conserve intégralement la création en cours. */
  onCancel: () => void;
  /** « Confirmer » — réinitialise le brouillon puis rejoue la navigation initialement bloquée. */
  onConfirm: () => void;
};

/**
 * Modale « Abandonner la création d'une séance » (CE-T01-08, docs §06,
 * « Les modales »). Titre et message repris mot pour mot de la
 * spécification fonctionnelle (inchangés depuis l'origine).
 *
 * **REWORK10** (`[ChatGPT] CHANGES_REQUESTED — REWORK10 — dialogue
 * d'abandon de création`, 2026-09-04) : anatomie entièrement réalignée sur
 * `Overlay / Decision Dialog` (`2590:2961`), vérifié directement sur son
 * instance concrète `2591:3083` (frame CE-T01-08, `2028:11298`), pas sur
 * l'ancien rapport ni l'implémentation précédente.
 *
 * - Libellés d'action : « Continuer la création »/« Abandonner » →
 *   « Annuler »/« Confirmer » (`strings.screens.composition.abandonModal
 *   .continueCreating`/`.abandon` — mêmes clés, valeurs mises à jour ;
 *   `onCancel`/`onConfirm`, les props de ce composant, portaient déjà la
 *   sémantique correcte, aucun renommage nécessaire).
 * - Titre centré horizontalement (`textAlign: "center"`), typographie
 *   canonique inchangée (`type.modalTitle`, `18/22` Semi Bold — déjà
 *   conforme avant ce cycle), comportement adaptatif conservé (aucune
 *   largeur ni nombre de lignes figés, `numberOfLines` absent).
 * - Deux actions sur une seule ligne (acquis gelé, inchangé),
 *   dimensions strictement identiques `147×48` chacune (`dimensions
 *   .decisionDialog.actionWidth/actionHeight`, auparavant dimensionnées
 *   par leur seul contenu via `padding`), écart horizontal `12`
 *   (`actionGap`), libellés centrés sur les deux axes. Annuler : fond
 *   `colors.dialogNeutralActionBackground` (`#F3F4F6`), texte
 *   `colors.dialogNeutralActionText` (`#292E38`), `16/20` Semi Bold.
 *   Confirmer : fond `colors.dialogDestructiveActionBackground`
 *   (`#E62B1E`) + liseré `colors.dialogDestructiveActionBorder`
 *   (`#DB2E2E`) — distinct de `colors.danger`/`#D92D20`, déjà utilisé
 *   ailleurs pour un rouge différent, jamais réutilisé à tort ici —,
 *   texte blanc, `16/20` **Medium** (graisse distincte du libellé Annuler,
 *   vérifiée explicitement sur le nœud Figma, pas une incohérence locale).
 * - Géométrie : carte `354` large (`dimensions.decisionDialog.width`,
 *   auparavant `"100%"` du fond assombri), rayon `18` (auparavant `16`),
 *   ombre canonique du composant (`shadowOffset: {0,8}`, `shadowRadius:
 *   24`, `shadowOpacity: 0.16`, absente avant ce cycle). Écart
 *   titre→message et message→actions : `dimensions.decisionDialog.gap`
 *   (`16`, `spacing/16`, seule valeur explicitement documentée par Figma
 *   pour cet interstice — appliquée uniformément aux deux, cohérente avec
 *   la mesure observée sur l'instance concrète). Hauteur totale (`194` en
 *   illustration Figma) volontairement NON figée en dur : dérivée du
 *   padding/gap et de la hauteur réelle du texte, jamais imposée — un
 *   message plus long ou une échelle de police plus grande grandirait la
 *   carte plutôt que d'être tronqué (même principe que le cadre
 *   récapitulatif de `ExerciseScreen.tsx`, REWORK09).
 *
 * **Acquis gelés, non modifiés par ce cycle** (`[ChatGPT] DEVICE
 * VALIDATION + LOT DIFFÉRÉ`, 2026-09-04, « Acquis explicitement validés à
 * préserver » ; confirmés à nouveau par REWORK10, « Acquis gelés —
 * PRESERVE ») : dialogue flottant centré au milieu de l'écran, voile
 * (`backdrop`) et son positionnement général, animation en fondu
 * (`animationType="fade"`) — aucune ligne de ces trois éléments modifiée.
 *
 * `onRequestClose` (bouton matériel Android pendant que la modale est
 * affichée) est traité comme `onCancel` — même issue que « Annuler » :
 * ferme la modale, conserve intégralement le brouillon, ne déclenche
 * jamais `onConfirm`. Comportement inchangé par ce cycle (point 5, Retour
 * système = Annuler).
 */
export function AbandonCreationModal({ onCancel, onConfirm }: AbandonCreationModalProps) {
  const modalStrings = strings.screens.composition.abandonModal;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop} testID="abandon-creation-backdrop">
        <View style={styles.card} accessibilityRole="alert" testID="abandon-creation-card">
          <Text style={styles.title}>{modalStrings.title}</Text>
          <Text style={styles.message}>{modalStrings.message}</Text>
          <View style={styles.actions} testID="abandon-creation-actions">
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={modalStrings.continueCreating}
              style={styles.neutralAction}
            >
              <Text style={styles.neutralLabel}>{modalStrings.continueCreating}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={modalStrings.abandon}
              style={styles.destructiveAction}
            >
              <Text style={styles.destructiveLabel}>{modalStrings.abandon}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Voile — acquis gelé (`[ChatGPT] DEVICE VALIDATION + LOT DIFFÉRÉ` +
  // REWORK10, « Acquis gelés »), aucune propriété modifiée par ce cycle.
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20, 20, 20, 0.5)",
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
  title: {
    ...type.modalTitle,
    color: colors.dialogTitleText,
    textAlign: "center",
  },
  message: {
    ...type.dialogMessage,
    color: colors.dialogMessageText,
    textAlign: "justify",
  },
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
    ...type.dialogNeutralActionLabel,
    color: colors.dialogNeutralActionText,
    textAlign: "center",
  },
  destructiveAction: {
    width: dimensions.decisionDialog.actionWidth,
    height: dimensions.decisionDialog.actionHeight,
    borderRadius: dimensions.decisionDialog.actionRadius,
    backgroundColor: colors.dialogDestructiveActionBackground,
    borderWidth: 1,
    borderColor: colors.dialogDestructiveActionBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  destructiveLabel: {
    ...type.dialogDestructiveActionLabel,
    color: colors.background,
    textAlign: "center",
  },
});
