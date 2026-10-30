import { Image } from "expo-image";
import { useEffect, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Reanimated, { FadeIn, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CREATE_MENU_FADE_IN_MS } from "@/features/sessions/CreateMenu";
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
/** Hauteur maximale de la feuille : 92 % de la fenêtre (valeur inchangée, posée en points). */
const SHEET_MAX_HEIGHT_RATIO = 0.92;
const HEADER_ACTION_HIT_SLOP = (minTouchTarget - HEADER_ACTION_SIZE) / 2;
const RESET = dimensions.resetAction;
const RESET_ICON = require("../../../assets/icons/filtre-reinitialiser.svg");
const CHEVRON_ICON = require("../../../assets/icons/filtre-chevron-modifier.svg");
/**
 * Contre-recette n° 2 du 30/10/2026 (Hermann : « le voile grisé doit apparaître en fondu progressif
 * et non pas de bas en haut avec la modale. Prendre l'exemple de l'apparition du voile à
 * l'activation du bouton Créer dans la composition de séance ») : le voile apparaît en fondu, à la
 * durée du menu Créer ; seule la feuille monte du bas (durée d'une feuille système, choix).
 */
const scrimEntering = FadeIn.duration(CREATE_MENU_FADE_IN_MS).reduceMotion(ReduceMotion.System);
const SHEET_SLIDE_IN_MS = 300;
/**
 * Recette iPhone CAT.1 du 30/10/2026 (Hermann, cat-resultats : « la modale du filtre de mouvements
 * […] ne fait pas apparaître toutes les sections (elle n'est pas assez haute), elle s'arrête avant
 * la fin et le défilement ne marche pas (blocage vers le haut avec effet ressort) ») — cause la plus
 * probable (déduite du code ; Jest ne joue ni la mise en page native ni les animations) : la
 * montée de la feuille était une animation de MISE EN PAGE de Reanimated (`entering={SlideInDown}`,
 * contre-recette n° 2), qui pilote le cadre natif (origine, taille) relevé au montage. Or la feuille
 * des Mouvements grandit juste après son montage (Catégories et Zones lues de façon asynchrone, toutes
 * sections ouvertes) : le cadre restait celui du premier rendu, plus court que le contenu, et le
 * défilement butait ; la feuille des Séances, sections repliées, ne grandit pas et n'était pas touchée. La montée est désormais une simple translation (`transform`), qui ne touche
 * jamais au cadre : la mise en page suit le contenu à tout moment. Feuille et zone défilante sont en
 * outre toujours réductibles sous la hauteur maximale (auparavant seulement avec un pied fixe).
 */
const SHEET_TIMING = { duration: SHEET_SLIDE_IN_MS, reduceMotion: ReduceMotion.System };

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
  const { height: windowHeight } = useWindowDimensions();
  const slide = useSharedValue(windowHeight);
  useEffect(() => {
    slide.value = withTiming(0, SHEET_TIMING);
  }, [slide]);
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slide.value }] }));
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} testID={`${testIDPrefix}-sheet`}>
      <View style={styles.backdrop}>
        <Reanimated.View
          entering={scrimEntering}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.scrim]}
          testID={`${testIDPrefix}-scrim`}
        />
        <Reanimated.View
          style={[styles.sheet, { maxHeight: windowHeight * SHEET_MAX_HEIGHT_RATIO, paddingBottom: insets.bottom + spacing[16] }, slideStyle]}
          accessibilityViewIsModal
          testID={`${testIDPrefix}-panel`}
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
          <ScrollView style={styles.scroll} contentContainerStyle={[styles.body, footer ? styles.bodyWithFooter : null]} testID={`${testIDPrefix}-scroll`}>
            {children}
          </ScrollView>
          {footer ? (
            <View style={styles.footer} testID={`${testIDPrefix}-footer`}>
              {footer}
            </View>
          ) : null}
        </Reanimated.View>
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

/**
 * Titre de section repliable (E.6, spécification du 27/10 §6 ; chevron `10671:20036`) : le titre est
 * le bouton qui ouvre ou ferme la section placée dessous, chevron accolé, vers le bas fermé, vers le
 * haut ouvert. Partagé par les feuilles des Séances et, depuis la recette iPhone CAT.1 du 30/10/2026
 * (Hermann : « il manque les chevrons aux titres de section »), des Mouvements.
 */
export function FilterSectionToggle({
  title,
  open,
  onPress,
  testID,
}: {
  readonly title: string;
  readonly open: boolean;
  readonly onPress: () => void;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ expanded: open }}
      hitSlop={{ top: 12, bottom: 12 }}
      style={styles.sectionHeader}
      testID={testID}
    >
      <Text style={filterSheetStyles.groupTitle}>{title}</Text>
      <Image source={CHEVRON_ICON} style={[styles.chevron, open ? styles.chevronOpen : null]} accessible={false} testID={`${testID}-chevron`} />
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
  },
  scrim: {
    backgroundColor: colors.overlayScrim,
  },
  // Cadre, poignée, en-tête, cercles et filet : valeurs de la feuille Paramètres d'exécution.
  sheet: {
    flexShrink: 1,
    borderTopLeftRadius: fixedRadii[24],
    borderTopRightRadius: fixedRadii[24],
    overflow: "hidden",
    backgroundColor: colors.background,
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
    flexGrow: 0,
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
  sectionHeader: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
  },
  // Chevron accolé, pointé vers le bas fermé, vers le haut ouvert (`10671:20036`).
  chevron: {
    width: 10,
    height: 5.75,
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
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
