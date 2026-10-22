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

/**
 * PRE-6 story 5.1b (D4 remplacé par Hermann le 22/10/2026) : œil des Volumes du circuit dans les
 * commandes contextuelles. Figma (`8328:28611` Standard, `5271:5461` modification) ne le dessine pas
 * dans la zone de contexte : gabarit des commandes contextuelles de la Composition (ch13 CE-T03-08
 * L1480 et L1591 : cercle 34, dessin 20, écart 10, cibles 44 sans chevauchement), même cercle que le
 * « + » (fond blanc, contour 1 `primary`, rayon 17) ; icône `view-volumes` (`8165:13756`) dessinée à 20.
 * Placé en tête du groupe, avant « Ajouter un arrêt » et « + ».
 */
const VOLUMES_ICON_SIZE = 20;

/**
 * Revue 5.1b — cibles RÉELLES des trois commandes (œil, « Ajouter un arrêt », « + »), contenues dans
 * les limites de leurs parents (Fabric iOS écarte un toucher hors des limites d'un parent : revue
 * 5.3). Chaque commande est une boîte de 44 × 44, cercle de 34 centré ; les boîtes se touchent sans
 * écart (Figma `8328:28619` / `8328:28620` : zones de 44 à x 271 et 315), ce qui rend entre les cercles
 * l'écart de 10 (44 − 34). La dernière boîte dépasse de 5 le bord droit de la colonne (Figma : zone
 * jusqu'à x 359 pour une colonne qui finit à 354) et la rangée de 44 dépasse de 6 en haut et en bas la
 * bande de 32 : la rangée et l'en-tête s'agrandissent d'autant par des marges négatives compensées
 * (`marginVertical` / `marginRight` négatifs, marges internes égales) — la mise en page ne change pas,
 * les limites de chaque parent contiennent les cibles.
 */
const CONTEXT_COMMAND_INSET = (CONTEXT_TOUCH_TARGET - ADD_BUTTON.size) / 2;
const INFO_ROW_TOUCH_OVERFLOW = (CONTEXT_TOUCH_TARGET - INFO_ROW_HEIGHT) / 2;
/** Écart visuel bande d'informations → premier cercle, inchangé (8), moins la marge de la boîte. */
const INFO_ROW_GAP = spacing[8] - CONTEXT_COMMAND_INSET;

/** Exporté pour les tests de géométrie (dimensions réelles des boîtes et des parents). */
export const CONTEXT_COMMANDS_GEOMETRY = {
  touchTarget: CONTEXT_TOUCH_TARGET,
  circle: ADD_BUTTON.size,
  icon: VOLUMES_ICON_SIZE,
  commandInset: CONTEXT_COMMAND_INSET,
  infoRowHeight: INFO_ROW_HEIGHT,
  infoRowTouchOverflow: INFO_ROW_TOUCH_OVERFLOW,
} as const;

export type CompositionContextHeaderProps = {
  readonly name: string;
  readonly onChangeName: (name: string) => void;
  readonly onNameFocus: () => void;
  /** Étiquette affectée (référentiel chargé), `null` sinon. */
  readonly sessionLabel: Label | null;
  /** Couleur DÉRIVÉE de l'Étiquette (V2-PRE-1), teinte de son icône (story 7.2, D-437). */
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
  /**
   * PRE-6 story 6.3 (revue) : indice d'accessibilité de « Ajouter un arrêt » — quand le placement
   * n'offre qu'un retrait (aucun ajout possible, des points existants).
   */
  readonly addStopAccessibilityHint?: string;
  /**
   * PRE-6 story 5.1b (story 3.4, CE-CIR-03) : toucher de l'œil — l'écran ouvre « Volumes du
   * circuit » et referme le compteur et le choix de nature (un seul contrôle actif). Indisponible
   * en placement, comme le « + » (atténué et inactif).
   */
  readonly onOpenVolumes: () => void;
  /** Story 3.4 : demande de focus sur l'œil (fermeture de la feuille des volumes), jamais au montage. */
  readonly volumesFocusRequest?: number;
  /** Revue 5.1b : œil inactif pendant le glisser d'une carte (sans atténuation, état passager). */
  readonly isVolumesDisabled?: boolean;
  readonly testID?: string;
};

/**
 * Bande de contexte de la Composition (PRE-6 story 2.1, AD-41, Figma
 * `8328:28608` « Titre de séance ») : nom de la séance ; dessous, sur une
 * ligne de 32, la puce Étiquette puis la durée de séance, et à droite les
 * boutons ronds « Voir les volumes du circuit » (PRE-6 story 5.1b, l'œil quitte l'en-tête du
 * Circuit), « Ajouter un arrêt » (PRE-6 story 4.1 : entrée du mode placement, état actif
 * rempli pendant le placement) et « + » qui ouvre l'arbre d'ajout (remplace le bouton texte
 * « + Ajouter un exercice »).
 *
 * Comportements repris tels quels de la Composition : saisie du nom
 * (`NAME_MAX_LENGTH`, placeholder `text-primary`, R4-01), ouverture de
 * `LabelPickerModal` (V2-PRE-2, CE-T03-16) ; avec Étiquette, icône `label-outline` teintée de
 * sa couleur + nom (R7a ; PRE-6 story 7.2, D-437, remplace la pastille ronde) ; sans Étiquette,
 * icône `label-outline` (r4).
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
  addStopAccessibilityHint,
  onOpenVolumes,
  volumesFocusRequest = 0,
  isVolumesDisabled = false,
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
  // Story 3.4, repris par la story 5.1b : focus rendu à l'œil à la fermeture des volumes.
  const volumesRef = useRef<View>(null);
  const lastVolumesFocusRequestRef = useRef(volumesFocusRequest);
  useEffect(() => {
    if (volumesFocusRequest === lastVolumesFocusRequestRef.current) return;
    lastVolumesFocusRequestRef.current = volumesFocusRequest;
    if (volumesRef.current) AccessibilityInfo.sendAccessibilityEvent(volumesRef.current, "focus");
  }, [volumesFocusRequest]);
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
        <View style={styles.infoGroup} testID="composition-info-group">
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
                {/* PRE-6 story 7.2 (D-437, remplace la pastille ronde) : icône d'étiquette (contour)
                    dans la couleur de l'Étiquette. */}
                <KodjoIcon
                  name="label-outline"
                  size={LABEL_CHIP.icon}
                  tintColor={sessionColor}
                  testID="composition-session-label-icon"
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
        {/* Revue 5.1b : trois boîtes tactiles réelles de 44, sans écart, cercles de 34 centrés. */}
        <View style={styles.actions} testID="composition-context-actions">
          <Pressable
            ref={volumesRef}
            onPress={onOpenVolumes}
            disabled={isPlacementActive || isVolumesDisabled}
            accessibilityRole="button"
            accessibilityLabel={composition.circuit.volumes.openAccessibilityLabel}
            accessibilityState={{ disabled: isPlacementActive || isVolumesDisabled }}
            style={[styles.commandTarget, isPlacementActive ? styles.attenuated : null]}
            testID="composition-volumes-action"
          >
            <View style={[styles.commandCircle, styles.plainCircle]} testID="composition-volumes-action-circle">
              <KodjoIcon name="view-volumes" size={VOLUMES_ICON_SIZE} testID="composition-volumes-action-icon" />
            </View>
          </Pressable>
          <Pressable
            ref={addStopRef}
            onPress={onAddStop}
            disabled={isPlacementActive || addStopUnavailable}
            accessibilityRole="button"
            accessibilityLabel={composition.placement.addStopAccessibilityLabel}
            accessibilityHint={isPlacementActive ? undefined : addStopAccessibilityHint}
            accessibilityState={{ selected: isPlacementActive, disabled: isPlacementActive || addStopUnavailable }}
            style={[styles.commandTarget, addStopUnavailable ? styles.attenuated : null]}
            testID="composition-add-stop-action"
          >
            <View
              style={[
                styles.commandCircle,
                styles.addStopButton,
                isPlacementActive ? styles.addStopButtonActive : styles.addStopButtonStandard,
              ]}
              testID="composition-add-stop-action-circle"
            >
              <View style={styles.addStopIcon}>
                <KodjoIcon
                  name={isPlacementActive ? "add-stop-active" : "add-stop"}
                  testID={isPlacementActive ? "composition-add-stop-icon-active" : "composition-add-stop-icon"}
                />
              </View>
            </View>
          </Pressable>
          <Pressable
            onPress={onAdd}
            disabled={isPlacementActive}
            accessibilityRole="button"
            accessibilityLabel={composition.addActivity}
            accessibilityState={{ disabled: isPlacementActive }}
            style={[styles.commandTarget, isPlacementActive ? styles.attenuated : null]}
            testID="composition-add-activity-action"
          >
            <View style={[styles.commandCircle, styles.plainCircle]} testID="composition-add-activity-action-circle">
              <View style={styles.addGlyph} testID="composition-add-activity-icon">
                <View style={[styles.addGlyphBar, styles.addGlyphHorizontal]} testID="composition-add-activity-icon-bar" />
                <View style={[styles.addGlyphBar, styles.addGlyphVertical]} testID="composition-add-activity-icon-bar" />
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Figma `8328:28608` : colonne, écart 10, posée à 20 du haut de la zone de
  // contexte (padding haut de `ContextBand` 12 + 8). Revue 5.1b : l'en-tête s'étend de 5 à droite et
  // de 6 en bas (marges négatives compensées) pour CONTENIR les cibles de 44 des commandes ; le nom
  // garde sa largeur (`nameRow.marginRight`).
  container: {
    gap: spacing[10],
    paddingTop: spacing[8],
    marginRight: -CONTEXT_COMMAND_INSET,
    paddingBottom: INFO_ROW_TOUCH_OVERFLOW,
    marginBottom: -INFO_ROW_TOUCH_OVERFLOW,
  },
  // Champ Nom transparent sur la bande colorée, sans contour (REWORK09, D-352).
  nameRow: {
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    marginRight: CONTEXT_COMMAND_INSET,
  },
  // Inter Semi Bold 20 (`type.screenTitle`), `text-primary`.
  nameInput: {
    ...type.screenTitle,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  // Bande « Durée + actions » de 32 (Figma `8328:28611`), revue 5.1b : boîte de 44 aux marges
  // verticales de −6, pour contenir les cibles de 44 ; l'encombrement reste 32.
  infoRow: {
    height: CONTEXT_TOUCH_TARGET,
    marginVertical: -INFO_ROW_TOUCH_OVERFLOW,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: INFO_ROW_GAP,
  },
  // Revue 5.1b : écran étroit — le groupe peut céder jusqu'à 0 ; jamais sous les commandes.
  infoGroup: {
    flex: 1,
    minWidth: 0,
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
  // Figma `8328:28618` : Inter Regular 14, `text-tertiary`. Revue 5.1b : s'abrège (ellipse) sur un
  // écran étroit plutôt que de passer sous les commandes.
  sessionDuration: {
    ...type.body,
    color: TEXT_TERTIARY,
    flexShrink: 1,
    minWidth: 0,
  },
  // Revue 5.1b : boîtes jointives de 44 (l'écart de 10 entre cercles vient de leurs marges).
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    height: CONTEXT_TOUCH_TARGET,
  },
  commandTarget: {
    width: CONTEXT_TOUCH_TARGET,
    height: CONTEXT_TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  commandCircle: {
    width: ADD_BUTTON.size,
    height: ADD_BUTTON.size,
    borderRadius: fixedRadii[17],
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addStopButton: {
    width: ADD_STOP_BUTTON.size,
    height: ADD_STOP_BUTTON.size,
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
  // Cercle du « + » et de l'œil (story 5.1b : même gabarit) : fond blanc, contenu centré.
  plainCircle: {
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
