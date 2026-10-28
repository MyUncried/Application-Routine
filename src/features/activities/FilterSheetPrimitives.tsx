import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-8 (epic E, E.6 ; extraites de `MovementFilterSheet`, B.7 et recette A/B du 27/10) — primitives
 * communes des feuilles de filtres des Catalogues : cadre standard (poignée, ✕ et ✓ ronds 38 à cible
 * 44, titre de modale, filet), pastille de choix, action « Réinitialiser » (`10460:23176`). Les
 * critères et leurs règles restent propres à chaque Catalogue (Mouvements : B.7 ; Séances : E.6).
 *
 * `footer` (E.6, spécification du 27/10 §6) : contenu fixé en pied de modale, hors défilement.
 */

/** Cercles d'en-tête 38 (feuille Paramètres d'exécution), cible tactile minimale (`minTouchTarget`). */
const HEADER_ACTION_SIZE = 38;
const HEADER_ACTION_HIT_SLOP = (minTouchTarget - HEADER_ACTION_SIZE) / 2;
const RESET = dimensions.resetAction;
const RESET_ICON = require("../../../assets/icons/filtre-reinitialiser.svg");

export function FilterSheetFrame({
  title,
  closeLabel,
  applyLabel,
  onClose,
  onApply,
  footer,
  testIDPrefix,
  children,
}: {
  readonly title: string;
  readonly closeLabel: string;
  readonly applyLabel: string;
  readonly onClose: () => void;
  readonly onApply: () => void;
  readonly footer?: ReactNode;
  /** `${prefix}-sheet`, `-handle`, `-header`, `-close`, `-apply`, `-header-divider`. */
  readonly testIDPrefix: string;
  readonly children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose} testID={`${testIDPrefix}-sheet`}>
      <View style={styles.backdrop}>
        <View
          style={[styles.sheet, footer ? styles.sheetWithFooter : null, { paddingBottom: insets.bottom + spacing[16] }]}
          accessibilityViewIsModal
        >
          <View style={styles.handle} testID={`${testIDPrefix}-handle`} />
          <View style={styles.header} testID={`${testIDPrefix}-header`}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              hitSlop={HEADER_ACTION_HIT_SLOP}
              style={styles.cancelCircle}
              testID={`${testIDPrefix}-close`}
            >
              <KodjoIcon name="wheel-action-cancel" />
            </Pressable>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Pressable
              onPress={onApply}
              accessibilityRole="button"
              accessibilityLabel={applyLabel}
              hitSlop={HEADER_ACTION_HIT_SLOP}
              style={styles.validateCircle}
              testID={`${testIDPrefix}-apply`}
            >
              <KodjoIcon name="wheel-action-validate" />
            </Pressable>
          </View>
          <View style={styles.headerDivider} testID={`${testIDPrefix}-header-divider`} />
          <ScrollView style={footer ? styles.scroll : null} contentContainerStyle={[styles.body, footer ? styles.bodyWithFooter : null]}>
            {children}
          </ScrollView>
          {footer ? (
            <View style={styles.footer} testID={`${testIDPrefix}-footer`}>
              {footer}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

export function FilterChip({
  label,
  selected,
  dotColor,
  disabled = false,
  accessibilityLabel,
  onPress,
  testID,
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly dotColor?: string;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
  readonly onPress: () => void;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: selected, disabled }}
      hitSlop={{ top: 6, bottom: 6 }}
      style={[styles.chip, selected ? styles.chipSelected : null, disabled ? styles.disabled : null]}
      testID={testID}
    >
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>{label}</Text>
    </Pressable>
  );
}

export function ResetFiltersButton({ label, onPress, testID }: { readonly label: string; readonly onPress: () => void; readonly testID: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: (minTouchTarget - RESET.height) / 2, bottom: (minTouchTarget - RESET.height) / 2 }}
      style={styles.reset}
      testID={testID}
    >
      <Image source={RESET_ICON} style={styles.resetIcon} accessible={false} testID={`${testID}-icon`} />
      <Text style={styles.resetLabel}>{label}</Text>
    </Pressable>
  );
}

export const filterSheetStyles = StyleSheet.create({
  group: {
    gap: spacing[12],
  },
  groupTitle: {
    ...type.sectionTitle,
    color: colors.textPrimary,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[8],
  },
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlayScrim,
  },
  // Cadre, poignée, en-tête, cercles et filet : valeurs de la feuille Paramètres d'exécution.
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: fixedRadii[24],
    borderTopRightRadius: fixedRadii[24],
    overflow: "hidden",
    backgroundColor: colors.background,
  },
  sheetWithFooter: {
    flexShrink: 1,
  },
  handle: {
    alignSelf: "center",
    width: 50,
    height: 4,
    borderRadius: 2,
    marginTop: spacing[8],
    backgroundColor: colors.disabled,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: spacing[12] + 5,
  },
  cancelCircle: {
    width: HEADER_ACTION_SIZE,
    height: HEADER_ACTION_SIZE,
    borderRadius: HEADER_ACTION_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.wheelActionCancelBackground,
  },
  validateCircle: {
    width: HEADER_ACTION_SIZE,
    height: HEADER_ACTION_SIZE,
    borderRadius: HEADER_ACTION_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.wheelActionValidateBackground,
  },
  title: {
    ...type.modalTitle,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: "center",
  },
  headerDivider: {
    height: 1,
    marginHorizontal: spacing[12],
    backgroundColor: colors.divider,
  },
  scroll: {
    flexShrink: 1,
  },
  body: {
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
    gap: spacing[16],
  },
  bodyWithFooter: {
    paddingBottom: spacing[16],
  },
  footer: {
    alignItems: "center",
    paddingTop: spacing[8],
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    minHeight: 32,
    paddingHorizontal: spacing[12],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  chipSelected: {
    borderColor: colors.selection,
    backgroundColor: colors.selectionSurface,
  },
  disabled: {
    opacity: 0.4,
  },
  chipLabel: {
    ...type.supporting,
    color: colors.textPrimary,
  },
  chipLabelSelected: {
    color: colors.selection,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  reset: {
    alignSelf: "center",
    width: RESET.width,
    height: RESET.height,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[8],
    borderRadius: RESET.radius,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  resetIcon: {
    position: "absolute",
    left: RESET.iconLeft,
    width: RESET.icon,
    height: RESET.icon,
  },
  resetLabel: {
    ...type.resetActionLabel,
    color: colors.primary,
    marginLeft: RESET.icon,
  },
});
