import { Button as SwiftUIButton, Host, Menu, RNHostView } from "@expo/ui/swift-ui";
import {
  accessibilityLabel as swiftUIAccessibilityLabel,
  disabled as swiftUIDisabled,
} from "@expo/ui/swift-ui/modifiers";
import { useState, type RefObject } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type Insets,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import type { MovementLevelPosition } from "@/domain/activities/movementSuggestion";
import { AnchoredPanel, type AnchoredPanelPlacement } from "@/features/activities/AnchoredPanel";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, fixedRadii, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-7 story A3.1 (D-439, MFN-05, MFN-07 ; CE-T03-04 §9 ; relevé Figma MFN du 23/10) — pastille de
 * Niveau de la rangée de classification et popover « Changer de niveau / Ajouter un niveau »
 * (`9577:19843`).
 *
 * - Pastille (`9925:41506` vide, `9925:41515` renseignée) : jauge `icon/niveau` (`9932:44044`) et
 *   texte « Niveau » (vide : sans groupe ou singleton, rang masqué, MFN-05) ou « Niveau X » (rang
 *   dérivé, annoncé en texte, jamais par la jauge seule). Géométrie et couleurs des deux registres :
 *   celles des accès Catégorie / Zones, fournies par l'Éditeur (rien ne bouge entre les registres).
 * - iOS (primitives natives, AGENTS.md ; plan PRE-7 §3) : `Menu` SwiftUI d'`@expo/ui` hébergé par
 *   `Host` / `RNHostView`, même procédé que `CircuitNatureMenu.tsx` : la pastille est le libellé du
 *   menu. « Changer de niveau » est un sous-menu natif des niveaux (« Niveau r sur t · nom » : le
 *   total figure dans le choix) ; un niveau à plusieurs Exercices ouvre un sous-menu de leurs
 *   résumés de paramètres (MFN-07, MFN/AC16 : aucun choix silencieux) ; l'Exercice ouvert est coché.
 *   Un niveau sans Exercice au Catalogue (geste local) est indisponible ; sans niveaux, « Changer de
 *   niveau » l'est aussi. Un toucher extérieur ferme le menu sans rien choisir.
 * - Android et web : bouton (cible 44) et panneau `AnchoredPanel` à étapes (racine, niveaux,
 *   Exercices), hébergé par l'Éditeur dans un parent qui le contient entièrement — rendu
 *   `NON VÉRIFIABLE` (Figma ne dessine que le rendu iOS), lignes du panneau de `CircuitNatureMenu`.
 */

/** Exercice du Catalogue d'un niveau, distingué par le résumé de ses paramètres (MFN-10). */
export type LevelExerciseOption = {
  readonly definitionId: string;
  readonly summary: string;
};

/** Niveau du groupe : rang, total et nom du geste ; ses Exercices du Catalogue. */
export type LevelOption = {
  readonly rank: number;
  readonly total: number;
  readonly name: string;
  readonly exercises: readonly LevelExerciseOption[];
};

/** Popover disponible : Exercice ouvert, niveaux du groupe (vide sans groupe), actions. */
export type MovementLevelMenuModel = {
  readonly currentDefinitionId: string;
  readonly levels: readonly LevelOption[];
  readonly onChangeLevel: (definitionId: string) => void;
  readonly onAddLevel: () => void;
};

/** Pastille : position dérivée (`null` : vide) ; `menu` `null` : affichage seul, sans accès. */
export type EditorLevel = {
  readonly position: MovementLevelPosition | null;
  readonly menu: MovementLevelMenuModel | null;
};

/** Habillage des accès de la rangée, fourni par l'Éditeur. */
export type LevelAccessStyles = {
  readonly access: StyleProp<ViewStyle>;
  readonly accessUnset: StyleProp<ViewStyle>;
  readonly label: StyleProp<TextStyle>;
  readonly labelSet: StyleProp<TextStyle>;
};

export function levelPastilleLabel(position: MovementLevelPosition | null): string {
  const t = strings.screens.activities.editor.levelMenu;
  return position === null ? t.unsetLabel : fillTemplate(t.rank, { rank: String(position.rank) });
}

function levelAccessibilityLabel(position: MovementLevelPosition | null): string {
  return position === null ? strings.screens.activities.editor.levelMenu.unsetAccessibilityLabel : levelPastilleLabel(position);
}

export function levelOptionLabel(level: LevelOption): string {
  return fillTemplate(strings.screens.activities.editor.levelMenu.levelOption, {
    rank: String(level.rank),
    total: String(level.total),
    name: level.name,
  });
}

/** « Changer de niveau » disponible : au moins deux niveaux (aucun groupe singleton). */
function canChangeLevel(menu: MovementLevelMenuModel): boolean {
  return menu.levels.length >= 2;
}

/**
 * Jauge `icon/niveau` (`9932:44044`) : trois tranches empilées, les tranches atteintes pleines
 * (`primary`), les autres à 28 %. Transcription des proportions du composant (jauge à 12,5 % du
 * cadre, tranches de 55,56 % × 22,22 % de la jauge, rayon 1). Aucune limite à trois niveaux : au-delà
 * du rang 3, les trois tranches sont pleines (représentation à compléter dans Figma, relevé MFN) ;
 * vide : aucune tranche atteinte.
 */
const GAUGE_SEGMENT_TOPS = ["72.22%", "38.89%", "5.56%"] as const;
const GAUGE_INACTIVE_OPACITY = 0.28;
const GAUGE_SIZE = 18;

export function LevelGauge({ rank, testID }: { readonly rank: number | null; readonly testID: string }) {
  const reached = rank === null ? 0 : Math.min(rank, GAUGE_SEGMENT_TOPS.length);
  return (
    <View style={styles.gauge} testID={testID}>
      <View style={styles.gaugeInner}>
        {GAUGE_SEGMENT_TOPS.map((top, index) => (
          <View
            key={top}
            style={[styles.gaugeSegment, { top }, index < reached ? null : styles.gaugeSegmentInactive]}
            testID={`${testID}-segment-${index + 1}${index < reached ? "-reached" : ""}`}
          />
        ))}
      </View>
    </View>
  );
}

function LevelPastille({
  position,
  accessStyles,
  testID,
}: {
  readonly position: MovementLevelPosition | null;
  readonly accessStyles: LevelAccessStyles;
  readonly testID: string;
}) {
  return (
    <View style={[accessStyles.access, position === null ? accessStyles.accessUnset : null]} testID={`${testID}-pastille`}>
      <LevelGauge rank={position?.rank ?? null} testID={`${testID}-gauge`} />
      <Text style={[accessStyles.label, position === null ? null : accessStyles.labelSet]} numberOfLines={1} testID={`${testID}-label`}>
        {levelPastilleLabel(position)}
      </Text>
    </View>
  );
}

export type MovementLevelMenuProps = {
  readonly level: EditorLevel;
  readonly accessStyles: LevelAccessStyles;
  /**
   * Cible ≥ 44 (FR-22-04) autour de la pastille, sans recouvrir le Nom : mêmes débords que les
   * accès Catégorie / Zones (`hitSlop` hors iOS ; sur iOS, marge de la vue hébergée du libellé
   * natif, qui ne connaît pas `hitSlop`).
   */
  readonly hitSlop: Required<Insets>;
  /** Hors iOS : ouverture du panneau, ancré sous la pastille (mesure dans la fenêtre). */
  readonly onOpenPanel: (anchor: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }) => void;
  readonly isPanelOpen: boolean;
  readonly onClosePanel: () => void;
  readonly anchorRef: RefObject<View | null>;
  readonly testID: string;
};

/**
 * Pastille de Niveau : affichage seul (`menu` `null`), déclencheur du menu natif (iOS) ou bouton du
 * panneau de repli (Android, web).
 */
export function MovementLevelMenu({
  level,
  accessStyles,
  hitSlop,
  onOpenPanel,
  isPanelOpen,
  onClosePanel,
  anchorRef,
  testID,
}: MovementLevelMenuProps) {
  const { fontScale } = useWindowDimensions();
  const pastille = <LevelPastille position={level.position} accessStyles={accessStyles} testID={testID} />;
  const label = levelAccessibilityLabel(level.position);
  const menu = level.menu;

  if (menu === null) {
    return (
      <View ref={anchorRef} accessible accessibilityLabel={label} style={styles.static} testID={testID}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {pastille}
        </View>
      </View>
    );
  }

  if (Platform.OS === "ios") {
    const t = strings.screens.activities.editor.levelMenu;
    return (
      <View
        ref={anchorRef}
        collapsable={false}
        style={[
          styles.static,
          { marginTop: -hitSlop.top, marginBottom: -hitSlop.bottom, marginLeft: -hitSlop.left, marginRight: -hitSlop.right },
        ]}
        testID={`${testID}-focus`}
      >
        {/* Hôte remonté quand le texte change (procédé de `CircuitNatureMenu`, story 7.9). */}
        <Host key={`${levelPastilleLabel(level.position)}@${fontScale}`} matchContents testID={testID}>
          <Menu
            label={
              <RNHostView matchContents>
                <View
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={{ paddingTop: hitSlop.top, paddingBottom: hitSlop.bottom, paddingLeft: hitSlop.left, paddingRight: hitSlop.right }}
                  testID={`${testID}-target`}
                >
                  {pastille}
                </View>
              </RNHostView>
            }
            modifiers={[swiftUIAccessibilityLabel(label)]}
          >
            <Menu label={t.changeLevel} modifiers={[swiftUIDisabled(!canChangeLevel(menu))]} testID={`${testID}-change`}>
              {menu.levels.map((option) => (
                <NativeLevelItem key={option.rank} option={option} menu={menu} testID={`${testID}-level-${option.rank}`} />
              ))}
            </Menu>
            <SwiftUIButton label={t.addLevel} onPress={menu.onAddLevel} testID={`${testID}-add`} />
          </Menu>
        </Host>
      </View>
    );
  }

  return (
    <Pressable
      ref={anchorRef}
      // Mesure fiable : la vue native n'est pas aplatie (Android).
      collapsable={false}
      onPress={() => {
        if (isPanelOpen) {
          onClosePanel();
          return;
        }
        anchorRef.current?.measureInWindow((x, y, width, height) => onOpenPanel({ x, y, width, height }));
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: isPanelOpen }}
      hitSlop={hitSlop}
      style={styles.static}
      testID={testID}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {pastille}
      </View>
    </Pressable>
  );
}

/** Niveau du sous-menu natif : un Exercice → bouton ; plusieurs → sous-menu des résumés ; aucun → indisponible. */
function NativeLevelItem({
  option,
  menu,
  testID,
}: {
  readonly option: LevelOption;
  readonly menu: MovementLevelMenuModel;
  readonly testID: string;
}) {
  const label = levelOptionLabel(option);
  const isCurrentLevel = option.exercises.some((exercise) => exercise.definitionId === menu.currentDefinitionId);
  if (option.exercises.length > 1) {
    return (
      <Menu label={label} systemImage={isCurrentLevel ? "checkmark" : undefined} testID={testID}>
        {option.exercises.map((exercise) => (
          <SwiftUIButton
            key={exercise.definitionId}
            label={exercise.summary}
            systemImage={exercise.definitionId === menu.currentDefinitionId ? "checkmark" : undefined}
            onPress={() => selectExercise(menu, exercise.definitionId)}
            testID={`${testID}-${exercise.definitionId}`}
          />
        ))}
      </Menu>
    );
  }
  const only = option.exercises[0];
  return (
    <SwiftUIButton
      label={label}
      systemImage={isCurrentLevel ? "checkmark" : undefined}
      modifiers={only === undefined ? [swiftUIDisabled(true)] : undefined}
      onPress={() => {
        if (only !== undefined) selectExercise(menu, only.definitionId);
      }}
      testID={testID}
    />
  );
}

/** Choisir l'Exercice déjà ouvert ne fait rien (il est coché). */
function selectExercise(menu: MovementLevelMenuModel, definitionId: string) {
  if (definitionId !== menu.currentDefinitionId) menu.onChangeLevel(definitionId);
}

type PanelStep = { readonly kind: "ROOT" } | { readonly kind: "LEVELS" } | { readonly kind: "EXERCISES"; readonly rank: number };

export type MovementLevelPanelProps = {
  readonly menu: MovementLevelMenuModel;
  readonly placement: AnchoredPanelPlacement;
  /** Toucher extérieur ou échappement : fermeture sans choix. */
  readonly onDismiss: () => void;
  readonly testID: string;
};

/**
 * Android et web : panneau à étapes — « Changer de niveau » / « Ajouter un niveau », puis les niveaux,
 * puis les Exercices d'un niveau qui en compte plusieurs. Choisir ferme le panneau.
 */
export function MovementLevelPanel({ menu, placement, onDismiss, testID }: MovementLevelPanelProps) {
  const [step, setStep] = useState<PanelStep>({ kind: "ROOT" });
  const t = strings.screens.activities.editor.levelMenu;

  function choose(definitionId: string) {
    onDismiss();
    selectExercise(menu, definitionId);
  }

  let rows: readonly PanelRowProps[];
  if (step.kind === "ROOT") {
    rows = [
      { id: "change", label: t.changeLevel, disabled: !canChangeLevel(menu), onPress: () => setStep({ kind: "LEVELS" }) },
      {
        id: "add",
        label: t.addLevel,
        onPress: () => {
          onDismiss();
          menu.onAddLevel();
        },
      },
    ];
  } else if (step.kind === "LEVELS") {
    rows = menu.levels.map((option) => {
      const only = option.exercises.length === 1 ? option.exercises[0] : undefined;
      return {
        id: `level-${option.rank}`,
        label: levelOptionLabel(option),
        selected: option.exercises.some((exercise) => exercise.definitionId === menu.currentDefinitionId),
        disabled: option.exercises.length === 0,
        onPress: () => {
          if (only !== undefined) choose(only.definitionId);
          else setStep({ kind: "EXERCISES", rank: option.rank });
        },
      };
    });
  } else {
    const option = menu.levels.find((candidate) => candidate.rank === step.rank);
    rows = (option?.exercises ?? []).map((exercise) => ({
      id: exercise.definitionId,
      label: exercise.summary,
      selected: exercise.definitionId === menu.currentDefinitionId,
      onPress: () => choose(exercise.definitionId),
    }));
  }

  return (
    <AnchoredPanel placement={placement} onDismiss={onDismiss} style={styles.panel} testID={testID}>
      {rows.map((row) => (
        <PanelRow key={row.id} row={row} testID={`${testID}-${row.id}`} />
      ))}
    </AnchoredPanel>
  );
}

type PanelRowProps = {
  readonly id: string;
  readonly label: string;
  readonly selected?: boolean;
  readonly disabled?: boolean;
  readonly onPress: () => void;
};

function PanelRow({ row, testID }: { readonly row: PanelRowProps; readonly testID: string }) {
  const { label, selected = false, disabled = false, onPress } = row;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      style={styles.option}
      testID={testID}
    >
      <Text style={[styles.optionTitle, disabled ? styles.optionTitleDisabled : null]}>{label}</Text>
      <View style={styles.check}>
        {selected ? <KodjoIcon name="state-selected" size={CHECK_SIZE} tintColor={colors.primary} testID={`${testID}-check`} /> : null}
      </View>
    </Pressable>
  );
}

/** Repli Android / web (`NON VÉRIFIABLE`) : valeurs du panneau de `CircuitNatureMenu`. */
const PANEL_WIDTH = 280;
const TOUCH_TARGET = 44;
const CHECK_SIZE = 24;

/** Écart entre le bas de la pastille et le panneau (Android / web). */
export const MOVEMENT_LEVEL_PANEL_GAP = spacing[4];

const styles = StyleSheet.create({
  static: {
    flexShrink: 0,
  },
  gauge: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
  },
  gaugeInner: {
    position: "absolute",
    top: "12.5%",
    right: "12.5%",
    bottom: "12.5%",
    left: "12.5%",
  },
  gaugeSegment: {
    position: "absolute",
    left: "22.22%",
    right: "22.22%",
    height: "22.22%",
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  gaugeSegmentInactive: {
    opacity: GAUGE_INACTIVE_OPACITY,
  },
  panel: {
    width: PANEL_WIDTH,
    backgroundColor: colors.background,
    borderRadius: fixedRadii[12],
    paddingVertical: spacing[4],
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  option: {
    minHeight: TOUCH_TARGET,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[6],
  },
  optionTitle: {
    ...type.exerciseFieldValue,
    flex: 1,
    color: colors.textPrimary,
  },
  optionTitleDisabled: {
    color: colors.textSecondary,
  },
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
  },
});
