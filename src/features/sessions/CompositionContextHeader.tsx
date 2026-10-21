import { useEffect, useRef } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { Label } from "@/domain/labels/Label";
import { NAME_MAX_LENGTH } from "@/domain/sessions/validation";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
import { colors, fixedRadii, spacing, type } from "@/shared/ui/tokens";

/**
 * Cible tactile des actions de la bande de contexte (Figma `8328:28619`,
 * `8328:28620`, `8328:28633` : zones tactiles 44 × 44).
 */
const CONTEXT_TOUCH_TARGET = 44;

/** Puce Étiquette (Figma `8328:28613`) : hauteur 26, rayon 13, fond blanc à 35 %, icône 18. */
const LABEL_CHIP = {
  height: 26,
  radius: 13,
  background: "rgba(255, 255, 255, 0.35)",
  icon: 18,
  paddingLeft: spacing[8],
  paddingRight: spacing[10],
  gap: spacing[6],
} as const;

/** Libellé de la puce (Figma `8328:28617`) : Inter Regular 13, interligne Auto (D2). */
const LABEL_CHIP_TEXT = { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 13, lineHeight: 16 } as const;

/** Ligne « Durée + actions » (Figma `8328:28611`) : hauteur 32. */
const INFO_ROW_HEIGHT = 32;

/** Bouton « + » (Figma `8328:28630`) : cercle 34, croix 20 × 2,5, rayon des barres 1. */
const ADD_BUTTON = { size: 34, glyphLength: 20, glyphThickness: 2.5, glyphRadius: 1 } as const;

/**
 * Bouton « Ajouter un arrêt » (PRE-6 story 4.1, Figma `8328:28622` / `8328:29287`) : cercle 34,
 * contour 1 `primary`, icône posée à 5 du bord (contour compris) ; « + » à 44 de son origine
 * (écart 10, groupe `8328:28621`). Standard : fond blanc et ombre portée (0, 2, flou 4, noir à
 * 14 %) ; actif (placement) : fond lavande `#F1F1FF`, sans ombre — valeurs Figma sans jeton.
 */
const ADD_STOP_BUTTON = { size: 34, iconInset: 5 - 1, actionsGap: spacing[10] } as const;
const ADD_STOP_ACTIVE_SURFACE = "#F1F1FF";
const ADD_STOP_SHADOW = { color: "#000000", opacity: 0.14, offsetY: 2, radius: 2 } as const;

export type CompositionContextHeaderProps = {
  readonly name: string;
  readonly onChangeName: (name: string) => void;
  readonly onNameFocus: () => void;
  /** Étiquette affectée (référentiel chargé), `null` sinon. */
  readonly sessionLabel: Label | null;
  /** Couleur DÉRIVÉE de l'Étiquette (V2-PRE-1), affichée dans la pastille. */
  readonly sessionColor: string;
  readonly onOpenLabelPicker: () => void;
  /** Durée de séance déjà formatée (`formatCompositionSessionDuration`). */
  readonly sessionDuration: string;
  /** Ouvre l'arbre d'ajout existant (V2-CAT-01). */
  readonly onAdd: () => void;
  /** PRE-6 story 4.1 : entre en mode placement (« Ajouter un arrêt »). */
  readonly onAddStop: () => void;
  /** PRE-6 story 4.1 : mode placement en cours — bouton « Ajouter un arrêt » actif, « + » atténué et inactif. */
  readonly isPlacementActive?: boolean;
  /** PRE-6 story 4.1 : aucun emplacement où ajouter une pause (Composition vide, tout est déjà présent). */
  readonly isAddStopDisabled?: boolean;
  /** PRE-6 story 4.1 : demande de focus d'accessibilité sur « Ajouter un arrêt » (sortie du placement), jamais au montage. */
  readonly addStopFocusRequest?: number;
  readonly testID?: string;
};

/**
 * Bande de contexte de la Composition (PRE-6 story 2.1, AD-41, Figma
 * `8328:28608` « Titre de séance ») : nom de la séance ; dessous, sur une
 * ligne de 32, la puce Étiquette puis la durée de séance, et à droite les
 * boutons ronds « Ajouter un arrêt » (PRE-6 story 4.1 : entrée du mode placement, état actif
 * rempli pendant le placement) et « + » qui ouvre l'arbre d'ajout (remplace le bouton texte
 * « + Ajouter un exercice »).
 *
 * Comportements repris tels quels de la Composition : saisie du nom
 * (`NAME_MAX_LENGTH`, placeholder `text-primary`, R4-01), ouverture de
 * `LabelPickerModal` (V2-PRE-2, CE-T03-16) ; avec Étiquette, pastille de
 * couleur + nom (R7a) ; sans Étiquette, icône `label-outline` (r4).
 */
export function CompositionContextHeader({
  name,
  onChangeName,
  onNameFocus,
  sessionLabel,
  sessionColor,
  onOpenLabelPicker,
  sessionDuration,
  onAdd,
  onAddStop,
  isPlacementActive = false,
  isAddStopDisabled = false,
  addStopFocusRequest = 0,
  testID = "composition-context-header",
}: CompositionContextHeaderProps) {
  const composition = strings.screens.composition;
  const addStopRef = useRef<View>(null);
  const lastAddStopFocusRequestRef = useRef(addStopFocusRequest);
  useEffect(() => {
    if (addStopFocusRequest === lastAddStopFocusRequestRef.current) return;
    lastAddStopFocusRequestRef.current = addStopFocusRequest;
    if (addStopRef.current) AccessibilityInfo.sendAccessibilityEvent(addStopRef.current, "focus");
  }, [addStopFocusRequest]);
  const addStopUnavailable = !isPlacementActive && isAddStopDisabled;
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.nameRow} testID="composition-name-color-field">
        <TextInput
          value={name}
          onChangeText={onChangeName}
          onFocus={onNameFocus}
          placeholder={composition.name}
          placeholderTextColor={colors.textPrimary}
          accessibilityLabel={composition.name}
          maxLength={NAME_MAX_LENGTH}
          style={styles.nameInput}
        />
      </View>
      <View style={styles.infoRow} testID="composition-info-row">
        <View style={styles.infoGroup}>
          <Pressable
            onPress={onOpenLabelPicker}
            accessibilityRole="button"
            accessibilityLabel={composition.label.accessibilityLabel}
            hitSlop={{
              top: (CONTEXT_TOUCH_TARGET - LABEL_CHIP.height) / 2,
              bottom: (CONTEXT_TOUCH_TARGET - LABEL_CHIP.height) / 2,
              left: spacing[4],
              right: spacing[4],
            }}
            style={styles.labelChip}
            testID="composition-session-color-trigger"
          >
            {sessionLabel ? (
              <>
                <View
                  style={[styles.sessionColorSwatch, { backgroundColor: sessionColor }]}
                  testID="composition-session-color-swatch"
                />
                <Text style={[styles.labelChipText, styles.labelChipName]} numberOfLines={1} testID="composition-session-label-name">
                  {sessionLabel.name}
                </Text>
              </>
            ) : (
              <>
                <KodjoIcon
                  name="label-outline"
                  size={LABEL_CHIP.icon}
                  testID="composition-session-label-outline-icon"
                />
                <Text style={styles.labelChipText} numberOfLines={1}>
                  {composition.label.placeholder}
                </Text>
              </>
            )}
          </Pressable>
          <Text
            style={styles.sessionDuration}
            numberOfLines={1}
            accessibilityLabel={`${composition.sessionDurationAccessibilityLabel} ${sessionDuration}`}
            testID="composition-session-duration"
          >
            {sessionDuration}
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            ref={addStopRef}
            onPress={onAddStop}
            disabled={isPlacementActive || addStopUnavailable}
            accessibilityRole="button"
            accessibilityLabel={composition.placement.addStopAccessibilityLabel}
            accessibilityState={{ selected: isPlacementActive, disabled: isPlacementActive || addStopUnavailable }}
            hitSlop={(CONTEXT_TOUCH_TARGET - ADD_STOP_BUTTON.size) / 2}
            style={[
              styles.addStopButton,
              isPlacementActive ? styles.addStopButtonActive : styles.addStopButtonStandard,
              addStopUnavailable ? styles.attenuated : null,
            ]}
            testID="composition-add-stop-action"
          >
            <View style={styles.addStopIcon}>
              <KodjoIcon
                name={isPlacementActive ? "add-stop-active" : "add-stop"}
                testID={isPlacementActive ? "composition-add-stop-icon-active" : "composition-add-stop-icon"}
              />
            </View>
          </Pressable>
          <Pressable
            onPress={onAdd}
            disabled={isPlacementActive}
            accessibilityRole="button"
            accessibilityLabel={composition.addActivity}
            accessibilityState={{ disabled: isPlacementActive }}
            hitSlop={(CONTEXT_TOUCH_TARGET - ADD_BUTTON.size) / 2}
            style={[styles.addButton, isPlacementActive ? styles.attenuated : null]}
            testID="composition-add-activity-action"
          >
            <View style={styles.addGlyph} testID="composition-add-activity-icon">
              <View style={[styles.addGlyphBar, styles.addGlyphHorizontal]} testID="composition-add-activity-icon-bar" />
              <View style={[styles.addGlyphBar, styles.addGlyphVertical]} testID="composition-add-activity-icon-bar" />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Figma `8328:28608` : colonne, écart 10, posée à 20 du haut de la zone de
  // contexte (padding haut de `ContextBand` 12 + 8).
  container: {
    gap: spacing[10],
    paddingTop: spacing[8],
  },
  // Champ Nom transparent sur la bande colorée, sans contour (REWORK09, D-352).
  nameRow: {
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },
  // Inter Semi Bold 20 (`type.screenTitle`), `text-primary`.
  nameInput: {
    ...type.screenTitle,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  infoRow: {
    height: INFO_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[8],
  },
  infoGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[10],
  },
  labelChip: {
    height: LABEL_CHIP.height,
    flexDirection: "row",
    alignItems: "center",
    gap: LABEL_CHIP.gap,
    paddingLeft: LABEL_CHIP.paddingLeft,
    paddingRight: LABEL_CHIP.paddingRight,
    borderRadius: LABEL_CHIP.radius,
    backgroundColor: LABEL_CHIP.background,
    flexShrink: 1,
  },
  labelChipText: {
    ...LABEL_CHIP_TEXT,
    color: colors.primary,
    flexShrink: 1,
  },
  // Nom de l’Étiquette affectée : couleur `text-primary`, comme avant PRE-6 (R7a).
  labelChipName: {
    color: colors.textPrimary,
  },
  // Pastille de couleur DÉRIVÉE (R7a), à la taille de l'icône de la puce.
  sessionColorSwatch: {
    width: LABEL_CHIP.icon,
    height: LABEL_CHIP.icon,
    borderRadius: LABEL_CHIP.icon / 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Figma `8328:28618` : Inter Regular 14, `text-tertiary`.
  sessionDuration: {
    ...type.body,
    color: TEXT_TERTIARY,
    flexShrink: 0,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: ADD_STOP_BUTTON.actionsGap,
  },
  addStopButton: {
    width: ADD_STOP_BUTTON.size,
    height: ADD_STOP_BUTTON.size,
    borderRadius: fixedRadii[17],
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addStopButtonStandard: {
    backgroundColor: colors.background,
    shadowColor: ADD_STOP_SHADOW.color,
    shadowOpacity: ADD_STOP_SHADOW.opacity,
    shadowOffset: { width: 0, height: ADD_STOP_SHADOW.offsetY },
    shadowRadius: ADD_STOP_SHADOW.radius,
    elevation: 2,
  },
  addStopButtonActive: {
    backgroundColor: ADD_STOP_ACTIVE_SURFACE,
  },
  // Boîte 25 × 25 de l'export, posée à 5 du bord extérieur (4 dans le contour de 1).
  addStopIcon: {
    position: "absolute",
    left: ADD_STOP_BUTTON.iconInset,
    top: ADD_STOP_BUTTON.iconInset,
  },
  // Mode placement : le reste de l'en-tête d'actions est atténué et inactif.
  attenuated: {
    opacity: UNSELECTED_OPACITY,
  },
  addButton: {
    width: ADD_BUTTON.size,
    height: ADD_BUTTON.size,
    borderRadius: fixedRadii[17],
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  addGlyph: {
    width: ADD_BUTTON.glyphLength,
    height: ADD_BUTTON.glyphLength,
  },
  addGlyphBar: {
    position: "absolute",
    backgroundColor: colors.primary,
    borderRadius: ADD_BUTTON.glyphRadius,
  },
  addGlyphHorizontal: {
    left: 0,
    top: (ADD_BUTTON.glyphLength - ADD_BUTTON.glyphThickness) / 2,
    width: ADD_BUTTON.glyphLength,
    height: ADD_BUTTON.glyphThickness,
  },
  addGlyphVertical: {
    top: 0,
    left: (ADD_BUTTON.glyphLength - ADD_BUTTON.glyphThickness) / 2,
    width: ADD_BUTTON.glyphThickness,
    height: ADD_BUTTON.glyphLength,
  },
});
