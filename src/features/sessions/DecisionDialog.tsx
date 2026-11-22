import { useEffect, useRef, useState } from "react";
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
  /**
   * Recette du 05/11/2026 au soir (r-libre, Hermann : « appuyer sur la croix, confirmer l’annulation > le message disparaît puis
   * l’écran est bloqué ») : la confirmation n'est rendue qu'après la fermeture du dialogue (`onDismiss` iOS, ou au plus tard
   * après le fondu) — une feuille native ne se retire pas pendant qu'un dialogue se ferme par-dessus elle. Absent : immédiat.
   */
  confirmAfterDismiss?: boolean;
  /** Préfixe des `testID` internes (`${testIDPrefix}-backdrop`/`-card`/`-actions`) — un contexte par appelant, jamais partagé entre deux instances simultanées. */
  testIDPrefix: string;
  /**
   * D-537 (20/11/2026) : variantes « Titre seul » (`12759:24520`) et « Titre et message » (`12759:24619`) de `DSF / Overlays /
   * Confirmation` — « Annuler » en pastille en haut à gauche, « Confirmer » sur toute la largeur. Absent : deux actions
   * côte à côte (variantes d'origine).
   */
  cancelOnTop?: boolean;
  /**
   * PROG-CAT-01 (CE-PROG-03 ; spécification Programme §7, Figma `12874:28` « Titre, message et action secondaire ») : actions
   * empilées sur toute la largeur, sans croix — principale (rouge), secondaire facultative (violet clair `#EAEAFF`, texte
   * bleu), « Annuler » (gris). Absent : variantes d'origine.
   */
  secondaryAction?: { readonly label: string; readonly onPress: () => void } | null;
  stacked?: boolean;
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
  confirmAfterDismiss = false,
  testIDPrefix,
  cancelOnTop = false,
  secondaryAction = null,
  stacked = false,
}: DecisionDialogProps) {
  const [closing, setClosing] = useState(false);
  const confirmedRef = useRef(false);
  const confirmOnce = useRef(onConfirm);
  useEffect(() => {
    confirmOnce.current = onConfirm;
  }, [onConfirm]);
  const fire = () => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    confirmOnce.current();
  };
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(fire, CONFIRM_FALLBACK_MS);
    return () => clearTimeout(timer);
  });
  return (
    <Modal
      transparent
      visible={!closing}
      animationType="fade"
      onRequestClose={onCancel}
      {...(confirmAfterDismiss ? { onDismiss: () => { if (closing) fire(); } } : {})}
    >
      <View style={styles.backdrop} testID={`${testIDPrefix}-backdrop`}>
        {stacked ? (
          <View style={[styles.card, styles.stackedCard]} accessibilityRole="alert" testID={`${testIDPrefix}-card`}>
            <Text style={[styles.title, titleStyle]}>{title}</Text>
            {message === "" ? null : <Text style={[styles.message, messageStyle, styles.stackedMessage]}>{message}</Text>}
            <View style={styles.stackedActions} testID={`${testIDPrefix}-actions`}>
              <Pressable
                onPress={confirmAfterDismiss ? () => setClosing(true) : onConfirm}
                accessibilityRole="button"
                accessibilityLabel={confirmLabel}
                style={[styles.destructiveAction, styles.stackedAction, confirmBordered ? styles.destructiveActionBorder : null]}
                testID={`${testIDPrefix}-confirm`}
              >
                <Text style={[styles.destructiveLabel, confirmLabelStyle]}>{confirmLabel}</Text>
              </Pressable>
              {secondaryAction !== null ? (
                <Pressable
                  onPress={secondaryAction.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={secondaryAction.label}
                  style={[styles.stackedAction, styles.secondaryAction]}
                  testID={`${testIDPrefix}-secondary`}
                >
                  <Text style={[styles.neutralLabel, cancelLabelStyle, styles.secondaryLabel]}>{secondaryAction.label}</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={onCancel}
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
                style={[styles.stackedAction, styles.stackedCancel]}
                testID={`${testIDPrefix}-cancel`}
              >
                <Text style={[styles.neutralLabel, cancelLabelStyle]}>{cancelLabel}</Text>
              </Pressable>
            </View>
          </View>
        ) : cancelOnTop ? (
          <View style={[styles.card, styles.topCard]} accessibilityRole="alert" testID={`${testIDPrefix}-card`}>
            <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel={cancelLabel} style={styles.topCancel} testID={`${testIDPrefix}-cancel`}>
              <Text style={[styles.neutralLabel, cancelLabelStyle]}>{cancelLabel}</Text>
            </Pressable>
            <Text style={[styles.title, titleStyle, styles.topTitle]}>{title}</Text>
            {message === "" ? null : <Text style={[styles.message, messageStyle, styles.topMessage]}>{message}</Text>}
            <View style={styles.topActions} testID={`${testIDPrefix}-actions`}>
              <Pressable
                onPress={confirmAfterDismiss ? () => setClosing(true) : onConfirm}
                accessibilityRole="button"
                accessibilityLabel={confirmLabel}
                style={[styles.destructiveAction, styles.topConfirm, confirmBordered ? styles.destructiveActionBorder : null]}
                testID={`${testIDPrefix}-confirm`}
              >
                <Text style={[styles.destructiveLabel, confirmLabelStyle]}>{confirmLabel}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
        <View style={styles.card} accessibilityRole="alert" testID={`${testIDPrefix}-card`}>
          <Text style={[styles.title, titleStyle]}>{title}</Text>
          {/* Message vide : dialogue « titre seul » (suppression d'une occurrence, recette du 20/11/2026, constat D). */}
          {message === "" ? null : <Text style={[styles.message, messageStyle]}>{message}</Text>}
          <View style={styles.actions} testID={`${testIDPrefix}-actions`}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              style={styles.neutralAction}
              testID={`${testIDPrefix}-cancel`}
            >
              <Text style={[styles.neutralLabel, cancelLabelStyle]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={confirmAfterDismiss ? () => setClosing(true) : onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              style={[styles.destructiveAction, confirmBordered ? styles.destructiveActionBorder : null]}
              testID={`${testIDPrefix}-confirm`}
            >
              <Text style={[styles.destructiveLabel, confirmLabelStyle]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
        )}
      </View>
    </Modal>
  );
}

/** Délai de secours de la confirmation différée (fondu du dialogue, ~300 ms) si `onDismiss` n'arrive pas. */
const CONFIRM_FALLBACK_MS = 350;

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
  // Variantes « Titre seul » / « Titre et message » (`12759:24520`, `12759:24619`) : carte 370, rayon 18 ; « Annuler »
  // 88 × 32 à 16 du bord, rayon 16, fond #F3F4F6 ; titre à 16 sous la pastille ; message à 8 sous le titre ; « Confirmer »
  // 322 × 48 (marges 24), rayon 24, à 16 du texte ; marge basse 24.
  topCard: { width: 370, maxWidth: "100%", paddingTop: 16, paddingHorizontal: 24, paddingBottom: 24, gap: 0 },
  topCancel: {
    alignSelf: "flex-start",
    marginLeft: -8,
    width: 88,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { marginTop: 16 },
  topMessage: { marginTop: 8 },
  topActions: { marginTop: 16 },
  topConfirm: { width: "100%", borderRadius: 24 },
  // Figma `12874:28` (PROG — 7c, 370 de large) : titre à 24 du haut, message 8 dessous, actions 322 × 48 à 16 du message,
  // écart 12, rayon 24, 24 sous la dernière action.
  stackedCard: { width: 370, maxWidth: "100%", padding: 24, gap: 0 },
  stackedMessage: { marginTop: 8 },
  stackedActions: { marginTop: 16, gap: 12 },
  stackedAction: { width: "100%", height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  secondaryAction: { backgroundColor: colors.catalogueSessionsContext },
  secondaryLabel: { color: colors.primary },
  stackedCancel: { backgroundColor: "#F3F4F6" },
});
