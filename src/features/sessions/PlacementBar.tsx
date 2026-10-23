import { useEffect, useRef } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from "react-native";

import type { PlacementConfirmation } from "@/domain/sessions/placement";
import { strings } from "@/shared/i18n";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
import { colors, spacing } from "@/shared/ui/tokens";

/** Barre de placement (Figma `8328:29424`) : hauteur 48, rayon 24, marges 20 / 6, écart 12. */
const BAR = { height: 48, radius: 24, paddingLeft: spacing[20], paddingRight: spacing[6], gap: spacing[12] } as const;
/** Bouton « Annuler » (Figma `8328:29426`) : hauteur 36, rayon 18, marge 16 ; cible portée à 44. */
const CANCEL = { height: 36, radius: 18, paddingHorizontal: spacing[16], hitSlop: (44 - 36) / 2 } as const;
/** Fond du bouton « Annuler » (`#F3F4F6`, Figma `8328:29426`), sans jeton. */
const CANCEL_SURFACE = "#F3F4F6";

/** « Confirmer N … » : Inter Medium 14 (Figma `8328:29425`). */
const CONFIRM_TEXT = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 14, lineHeight: 17 } as const;
/** « Annuler » : Inter Semi Bold 14 (Figma `8328:29427`). */
const CANCEL_TEXT = { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 14, lineHeight: 17 } as const;

/**
 * Libellé du bouton Confirmer selon `placementConfirmation` (PRE-6 story 6.3, D-441, arbitrage du
 * 22/10/2026) : ajouts seuls → « Confirmer N pause(s) ajoutée(s) » (singulier à 0 et 1, comme en
 * français) ; retrait de point, mélange ou modification de durée seule → « Confirmer les
 * modifications » ; rien à confirmer → « Confirmer 0 pause ajoutée », bouton indisponible.
 */
export function formatPlacementConfirmLabel(confirmation: PlacementConfirmation): string {
  const t = strings.screens.composition.placement;
  if (confirmation.kind === "CHANGES") return t.confirmChanges;
  const count = confirmation.kind === "ADDITIONS_ONLY" ? confirmation.count : 0;
  return (count > 1 ? t.confirmPlural : t.confirmSingular).replace("{n}", String(count));
}

export type PlacementBarProps = {
  /**
   * Story 6.3 : nature de la confirmation (Domaine, `placementConfirmation` avec contexte) — elle
   * fixe le libellé et la disponibilité de « Confirmer » (indisponible à `NONE`).
   */
  readonly confirmation: PlacementConfirmation;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly testID?: string;
};

/**
 * Barre du mode placement (PRE-6 story 4.1, AD-43, Figma `8328:29423`), à la place de
 * « Continuer » : « Confirmer … » et « Annuler ». Story 6.3 (D-441) : libellé selon
 * `formatPlacementConfirmLabel` ; « Confirmer » est disponible dès qu'il y a un changement
 * applicable (ajout, retrait de point, modification de durée), indisponible sinon.
 * Revue 6.3 : la barre n'annonce plus rien d'elle-même ; l'écran annonce, en un seul message,
 * l'effet d'un toucher et le changement de disponibilité de « Confirmer » (son libellé), pour
 * qu'aucune annonce n'en interrompe une autre. Le libellé reste lu au focus du bouton.
 */
export function PlacementBar({ confirmation, onConfirm, onCancel, testID = "composition-placement-bar" }: PlacementBarProps) {
  const t = strings.screens.composition.placement;
  const label = formatPlacementConfirmLabel(confirmation);
  const disabled = confirmation.kind === "NONE";

  // À l'apparition de la barre, le focus d'accessibilité est porté sur « Confirmer ».
  const confirmRef = useRef<View>(null);
  useEffect(() => {
    if (confirmRef.current) AccessibilityInfo.sendAccessibilityEvent(confirmRef.current, "focus");
  }, []);


  return (
    <View style={styles.bar} testID={testID}>
      <Pressable
        ref={confirmRef}
        onPress={onConfirm}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        style={styles.confirm}
        testID={`${testID}-confirm`}
      >
        <Text style={[styles.confirmText, disabled ? styles.confirmTextDisabled : null]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel={t.cancel}
        hitSlop={{ top: CANCEL.hitSlop, bottom: CANCEL.hitSlop }}
        style={styles.cancel}
        testID={`${testID}-cancel`}
      >
        <Text style={styles.cancelText}>{t.cancel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: BAR.height,
    flexDirection: "row",
    alignItems: "center",
    gap: BAR.gap,
    paddingLeft: BAR.paddingLeft,
    paddingRight: BAR.paddingRight,
    borderRadius: BAR.radius,
    backgroundColor: colors.primary,
  },
  confirm: {
    flex: 1,
    height: BAR.height,
    justifyContent: "center",
  },
  confirmText: {
    ...CONFIRM_TEXT,
    color: colors.background,
  },
  confirmTextDisabled: {
    opacity: UNSELECTED_OPACITY,
  },
  cancel: {
    height: CANCEL.height,
    borderRadius: CANCEL.radius,
    paddingHorizontal: CANCEL.paddingHorizontal,
    justifyContent: "center",
    backgroundColor: CANCEL_SURFACE,
  },
  cancelText: {
    ...CANCEL_TEXT,
    color: colors.dialogNeutralActionText,
  },
});
