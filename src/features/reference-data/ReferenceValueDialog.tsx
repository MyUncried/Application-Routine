import { useEffect, useRef, useState, type RefObject } from "react";
import { AccessibilityInfo, findNodeHandle, Keyboard, Pressable, StyleSheet, Text, View } from "react-native";

import { recordKeyboardJournal } from "@/features/diagnostics/keyboardJournal";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

export type ReferenceValueDialogProps = {
  /** Nom COURANT de la valeur — utilisé tel quel dans le titre de confirmation de suppression (§4.10 L134). */
  name: string;
  /** Détermine le message de suppression (§4.10 L135) : utilisée ou non par des objets existants. */
  isUsed: boolean;
  /**
   * PRE-4 story 4.3 (FR-20-09, AC11) : message d'une valeur UTILISÉE propre au
   * référentiel appelant (Catégorie, Zone corporelle). Absent : message commun
   * du code de départ (Étiquette, inchangée). Le message d'une valeur non
   * utilisée reste toujours celui du code de départ (P34).
   */
  usedMessage?: string;
  /** ✕ du menu, ou « Annuler » de la confirmation — ferme sans rien modifier. */
  onCancel: () => void;
  /** « Modifier » — ferme ce dialogue et délègue l'édition (nom, couleur) à l'appelant (D4). */
  onModify: () => void;
  /** Confirmation de suppression — appelé uniquement après la confirmation. */
  onDelete: () => void;
  testIDPrefix: string;
  /**
   * R10 (CE-UI-09 L2840 ; CE-T03-16 L1677) : référence de la liste des
   * valeurs — le focus d'accessibilité y revient explicitement après
   * ✕ / Annuler ou après Supprimer confirmé. Jamais après Modifier : le
   * champ de nom du formulaire d'édition prend alors le focus par son propre
   * `autoFocus`. Optionnel : `undefined` préserve le comportement existant.
   */
  returnFocusRef?: RefObject<View | null>;
  /**
   * PRE-4 story 4.6 (FR-22-10, AC9), opt-in passé par les seules feuilles Catégorie et Zones :
   * le focus VoiceOver va au nom de l'entrée à l'ouverture, puis au titre de la confirmation.
   * Absent (Étiquette, Composition) : aucun focus envoyé, comportement PRE-3 inchangé.
   */
  focusOnOpen?: boolean;
};

/**
 * Dialogue d'appui long partagé (D4, D-259) par les feuilles Catégorie, Zones
 * corporelles et Étiquette. L'appui long ne sélectionne ni ne désaffecte
 * jamais la valeur visée (D4).
 *
 * Recette 3 (N-01) : rendu en CALQUE dans la fenêtre de la feuille appelante,
 * et non dans un `Modal` imbriqué. Sur iOS, présenter un nouveau `Modal`
 * (contrôleur de vue) retire le focus du champ actif de la feuille : le clavier
 * se cachait puis réapparaissait. Le calque laisse le champ actif et le clavier
 * en place ; la carte se centre dans l'espace visible au-dessus du clavier.
 * L'appelant le monte à la racine de son `Modal` (après le contenu de la feuille).
 *
 * Recette 3 (N-04, D-354) : ✕ rond standard en haut à gauche (à la place
 * d'« Annuler ») ; « Modifier » (fond bleu Kodjo) puis « Supprimer » (fond
 * rouge) sur une même ligne, texte blanc — disposition standard D-102 (deux
 * choix alignés, boutons 147 × 48 dans le dialogue de 354, adaptés à la largeur
 * disponible). « Supprimer » ouvre la confirmation destructive (§4.10 L134/L135,
 * titre « Supprimer « {nom} » ? », message selon l'usage), dans le même calque.
 */
export function ReferenceValueDialog({
  name,
  isUsed,
  usedMessage,
  onCancel,
  onModify,
  onDelete,
  testIDPrefix,
  returnFocusRef,
  focusOnOpen = false,
}: ReferenceValueDialogProps) {
  const [step, setStep] = useState<"actions" | "delete">("actions");
  const keyboardHeight = useKeyboardHeight();
  // Recette 3 (N-01) : journal observateur (routine://diagnostic-updates).
  useEffect(() => {
    recordKeyboardJournal(`menu d’appui long ouvert « ${name} »`);
    return () => recordKeyboardJournal("menu d’appui long fermé");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const t = strings.referenceData;
  // PRE-4 story 4.6 (FR-22-10, AC9), sur opt-in (`focusOnOpen`) : le focus VoiceOver va au
  // dialogue à son ouverture (nom de l'entrée, en tête du menu), puis au titre de la
  // confirmation quand elle le remplace. Le dialogue est un calque sans animation, rendu dans
  // la fenêtre de la feuille déjà présentée : son montage EST sa présentation, il n'y a pas de
  // fin d'animation à attendre. `sendAccessibilityEvent` seul : `setAccessibilityFocus` reste
  // réservé au retour à la liste (R10), inchangé. L'effet réel se juge sur iPhone (R-48).
  // L'appelant monte ce dialogue avec `key` = identifiant de l'entrée : une autre entrée
  // repart toujours de l'étape `actions`.
  const menuTitleRef = useRef<Text>(null);
  const confirmTitleRef = useRef<Text>(null);
  useEffect(() => {
    if (!focusOnOpen) return;
    const title = step === "delete" ? confirmTitleRef.current : menuTitleRef.current;
    if (title) AccessibilityInfo.sendAccessibilityEvent(title, "focus");
  }, [step, focusOnOpen]);

  function returnFocusToList() {
    if (!returnFocusRef) {
      return;
    }
    // `findNodeHandle` ne résout un nœud natif réel que sur un appareil ;
    // l'appel inconditionnel reste observable par les tests, sans risque en
    // production (un appareil fournit toujours un tag valide pour une Vue montée).
    AccessibilityInfo.setAccessibilityFocus(findNodeHandle(returnFocusRef.current) as number);
  }

  function handleCancel() {
    returnFocusToList();
    onCancel();
  }

  function handleDeleteConfirmed() {
    returnFocusToList();
    onDelete();
  }

  return (
    <View
      style={[styles.backdrop, { paddingBottom: spacing[24] + keyboardHeight }]}
      accessibilityViewIsModal
      testID={step === "delete" ? `${testIDPrefix}-delete-confirm-backdrop` : `${testIDPrefix}-backdrop`}
    >
      {step === "delete" ? (
        <View style={styles.card} accessibilityRole="alert" testID={`${testIDPrefix}-delete-confirm-card`}>
          <Text ref={confirmTitleRef} style={styles.title}>{`${t.deleteConfirm.titlePrefix}${name}${t.deleteConfirm.titleSuffix}`}</Text>
          <Text style={styles.message}>{isUsed ? (usedMessage ?? t.deleteConfirm.usedMessage) : t.deleteConfirm.unusedMessage}</Text>
          <View style={styles.actions} testID={`${testIDPrefix}-delete-confirm-actions`}>
            <Pressable
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel={t.deleteConfirm.cancel}
              style={[styles.action, styles.neutralAction]}
              testID={`${testIDPrefix}-delete-confirm-cancel`}
            >
              <Text style={[styles.actionLabel, styles.neutralActionLabel]}>{t.deleteConfirm.cancel}</Text>
            </Pressable>
            <Pressable
              onPress={handleDeleteConfirmed}
              accessibilityRole="button"
              accessibilityLabel={t.deleteConfirm.confirm}
              style={[styles.action, styles.destructiveConfirmAction]}
              testID={`${testIDPrefix}-delete-confirm-confirm`}
            >
              <Text style={styles.actionLabel}>{t.deleteConfirm.confirm}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.card} accessibilityRole="menu" accessibilityLabel={name} testID={`${testIDPrefix}-card`}>
          <View style={styles.header}>
            <Pressable
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel={t.longPressDialog.cancel}
              hitSlop={5}
              style={styles.close}
              testID={`${testIDPrefix}-cancel`}
            >
              <KodjoIcon name="wheel-action-cancel" />
            </Pressable>
            <Text ref={menuTitleRef} style={styles.headerTitle} numberOfLines={2}>
              {name}
            </Text>
            {/* Contrepoids du ✕ : le nom reste centré dans le dialogue. */}
            <View style={styles.closeBalance} />
          </View>
          <View style={styles.actions} testID={`${testIDPrefix}-actions`}>
            <Pressable
              onPress={onModify}
              accessibilityRole="menuitem"
              accessibilityLabel={t.longPressDialog.modify}
              style={[styles.action, styles.modifyAction]}
              testID={`${testIDPrefix}-modify`}
            >
              <Text style={styles.actionLabel}>{t.longPressDialog.modify}</Text>
            </Pressable>
            <Pressable
              onPress={() => setStep("delete")}
              accessibilityRole="menuitem"
              accessibilityLabel={t.longPressDialog.delete}
              style={[styles.action, styles.deleteAction]}
              testID={`${testIDPrefix}-delete`}
            >
              <Text style={styles.actionLabel}>{t.longPressDialog.delete}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

/** Hauteur du clavier affiché (0 s'il est fermé) — la carte se centre au-dessus de lui. */
function useKeyboardHeight(): number {
  const [height, setHeight] = useState(() => Keyboard.metrics?.()?.height ?? 0);
  useEffect(() => {
    const shown = Keyboard.addListener("keyboardWillShow", (event) => setHeight(event?.endCoordinates?.height ?? 0));
    const changed = Keyboard.addListener("keyboardWillChangeFrame", (event) => {
      if (Keyboard.isVisible?.()) setHeight(event?.endCoordinates?.height ?? 0);
    });
    const hidden = Keyboard.addListener("keyboardWillHide", () => setHeight(0));
    return () => {
      shown.remove();
      changed.remove();
      hidden.remove();
    };
  }, []);
  return height;
}

/** ✕ rond standard des feuilles (38). */
const CLOSE_SIZE = 38;

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayScrim,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing[24],
    paddingHorizontal: spacing[24],
  },
  card: {
    width: dimensions.decisionDialog.width,
    maxWidth: "100%",
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
  },
  close: {
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    borderRadius: CLOSE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSubtle,
  },
  closeBalance: {
    width: CLOSE_SIZE,
  },
  headerTitle: {
    ...type.modalTitle,
    flex: 1,
    color: colors.dialogTitleText,
    textAlign: "center",
  },
  title: {
    ...type.modalTitle,
    color: colors.dialogTitleText,
    textAlign: "center",
  },
  message: {
    ...type.dialogMessage,
    color: colors.dialogMessageText,
  },
  // D-102 : deux choix alignés sur une ligne (147 × 48 dans 354), adaptés à la largeur.
  actions: {
    flexDirection: "row",
    gap: dimensions.decisionDialog.actionGap,
  },
  action: {
    flex: 1,
    minHeight: dimensions.decisionDialog.actionHeight,
    borderRadius: dimensions.decisionDialog.actionRadius,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[8],
  },
  modifyAction: {
    backgroundColor: colors.primary,
  },
  deleteAction: {
    backgroundColor: colors.danger,
  },
  neutralAction: {
    backgroundColor: colors.dialogNeutralActionBackground,
  },
  destructiveConfirmAction: {
    backgroundColor: colors.dialogDestructiveActionBackground,
    borderWidth: 1,
    borderColor: colors.dialogDestructiveActionBorder,
  },
  actionLabel: {
    ...type.dialogDestructiveActionLabel,
    color: colors.background,
    textAlign: "center",
  },
  neutralActionLabel: {
    ...type.dialogNeutralActionLabel,
    color: colors.dialogNeutralActionText,
  },
});
