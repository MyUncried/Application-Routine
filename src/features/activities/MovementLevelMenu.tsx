import { Button as SwiftUIButton, Host, Menu, RNHostView } from "@expo/ui/swift-ui";
import {
  accessibilityLabel as swiftUIAccessibilityLabel,
  disabled as swiftUIDisabled,
  onAppear as swiftUIOnAppear,
  onDisappear as swiftUIOnDisappear,
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
import type { VariantPlacement } from "@/features/activities/MovementResultCard";
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
 * - PRE-7 story A3.2 : « Réordonner les niveaux », dernière entrée du sous-menu « Changer de niveau »
 *   (et de l'étape des niveaux du panneau), ouvre l'écran des niveaux (`MovementLevelsScreen`) ; les
 *   deux actions documentées restent seules à la racine du popover (`9577:19843`).
 * - PRE-7 story R-6 (D-445 C09, v7 §5 l.67, MFN-07 l.371, MFN-09 l.410 ; CE-UI-NIV-01) : la commande
 *   est active hors crayon dans tous les contextes. Choix PAR EXERCICE au Catalogue (inchangé) ; choix
 *   PAR MOUVEMENT (`movementChoice`) en reprise et sur une occurrence de Séance, où un niveau est un
 *   mouvement du groupe, local compris : chaque niveau est alors un bouton, le mouvement courant coché.
 *   « Ajouter un niveau » est un sous-menu natif « Plus facile / Plus difficile » (déploiement
 *   `10152:20369`, MFN-07 : insertion avant / après l'origine) ; indisponible sans `onAddLevel`.
 * - PRE-7 story R-9 (D-448 point 9, recette JA2 ; remplace la place de « Réordonner » fixée par
 *   A3.2) : racine à trois entrées dans les trois contextes — sous-menu des niveaux, intitulé
 *   « Naviguer vers » au Catalogue (choix par Exercice) et « Changer de niveau » en Séance et en
 *   reprise (`movementChoice`) ; « Ajouter un niveau » ; « Réordonner les niveaux », sorti du
 *   sous-menu des niveaux, indisponible comme lui sous deux niveaux. Comportements inchangés.
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
  /** PRE-7 (R-6) : mouvement du niveau, cible du choix par mouvement (`movementChoice`). */
  readonly movementId?: string;
  /** Recette A/B B.10 (q6-2) : membre archivé, signalé « (archivé) » dans le libellé du choix. */
  readonly archived?: boolean;
  /**
   * Recette A/B (b8-3) : rang affiché, lorsqu'il diffère de `rank` (position dans la famille
   * complète, qui reste la clé du choix). Absent : `rank`.
   */
  readonly displayRank?: number;
};

/**
 * PRE-7 (R-6, C09, MFN-09) : choix par mouvement — reprise et occurrence de Séance. Le choix
 * prépare un remplacement ; il ne reclasse jamais le mouvement courant.
 */
export type LevelMovementChoice = {
  readonly currentMovementId: string;
  readonly onChangeMovement: (movementId: string) => void;
};

/** Popover disponible : Exercice ouvert, niveaux du groupe (vide sans groupe), actions. */
export type MovementLevelMenuModel = {
  /** Exercice du Catalogue ouvert ; `null` hors fiche d'un Exercice existant. */
  readonly currentDefinitionId: string | null;
  readonly levels: readonly LevelOption[];
  /** Choix par Exercice (Catalogue) ; ignoré lorsque `movementChoice` est fourni. */
  readonly onChangeLevel: (definitionId: string) => void;
  /** PRE-7 (R-6, MFN-07) : sens choisi, avant / après l'origine ; `null` : « Ajouter » indisponible. */
  readonly onAddLevel: ((placement: VariantPlacement) => void) | null;
  /** PRE-7 (A3.2) : ouverture de l'écran de consultation et de réordonnancement des niveaux. */
  readonly onReorderLevels: () => void;
  readonly movementChoice?: LevelMovementChoice;
  /**
   * Recette A/B B.10 (b2-8) : intitulé du sous-menu des niveaux propre à l'appelant (fiche Mouvement :
   * « Ouvrir un autre niveau ») ; absent : « Naviguer vers » ou « Changer de niveau » (R-9).
   */
  readonly levelsLabel?: string;
  /**
   * Recette A/B B.10 (b2-8) : textes du panneau de repli réduits (`type.supporting`) ; le menu natif
   * iOS garde la taille du système. Absent : taille inchangée.
   */
  readonly compact?: boolean;
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
  const t = strings.screens.activities.editor.levelMenu;
  return fillTemplate(level.archived === true ? t.levelOptionArchived : t.levelOption, {
    rank: String(level.displayRank ?? level.rank),
    total: String(level.total),
    name: level.name,
  });
}

/**
 * Sous-menu des niveaux et « Réordonner les niveaux » disponibles : au moins deux niveaux (aucun
 * groupe singleton).
 */
function canChangeLevel(menu: MovementLevelMenuModel): boolean {
  return menu.levels.length >= 2;
}

/**
 * PRE-7 (R-9, D-448 point 9, précision de Hermann « Structure partout, libellé adapté ») : « Naviguer
 * vers » au Catalogue en modification (choix par Exercice) ; « Changer de niveau » en Séance et en
 * reprise (choix par mouvement, qui remplace le mouvement de l'occurrence).
 */
function levelsSubmenuLabel(menu: MovementLevelMenuModel): string {
  const t = strings.screens.activities.editor.levelMenu;
  if (menu.levelsLabel !== undefined) return menu.levelsLabel;
  return menu.movementChoice === undefined ? t.navigateTo : t.changeLevel;
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
  /**
   * iOS, recette du 27/10 (remarque 3) : menu natif affiché / retiré (apparition et disparition de
   * son contenu), pour qu'un toucher hors du menu le ferme sans atteindre l'écran.
   */
  readonly onNativeMenuVisibilityChange?: (visible: boolean) => void;
  /**
   * Recette du 27/10 (r11-menu-dehors) : génération de l'hôte natif — l'appelant l'incrémente à chaque
   * fermeture pour que l'ouverture suivante signale de nouveau l'apparition du menu.
   */
  readonly nativeMenuGeneration?: number;
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
  onNativeMenuVisibilityChange,
  nativeMenuGeneration = 0,
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
        <Host key={`${levelPastilleLabel(level.position)}@${fontScale}#${nativeMenuGeneration}`} matchContents testID={testID}>
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
            <Menu label={levelsSubmenuLabel(menu)} modifiers={[swiftUIDisabled(!canChangeLevel(menu))]} testID={`${testID}-change`}>
              {menu.levels.map((option) => (
                <NativeLevelItem key={option.rank} option={option} menu={menu} testID={`${testID}-level-${option.rank}`} />
              ))}
            </Menu>
            {/* PRE-7 (R-6, MFN-07, `10152:20369`) : sens explicite, avant / après l'origine. */}
            <Menu
              label={t.addLevel}
              modifiers={menu.onAddLevel === null ? [swiftUIDisabled(true)] : undefined}
              testID={`${testID}-add`}
            >
              <SwiftUIButton label={t.addEasier} onPress={() => menu.onAddLevel?.("BEFORE_ORIGIN")} testID={`${testID}-add-easier`} />
              <SwiftUIButton label={t.addHarder} onPress={() => menu.onAddLevel?.("AFTER_ORIGIN")} testID={`${testID}-add-harder`} />
            </Menu>
            {/* PRE-7 (A3.2 ; R-9, D-448 point 9) : écran des niveaux, à la racine (au moins deux niveaux). */}
            <SwiftUIButton
              label={t.reorderLevels}
              modifiers={[
                swiftUIDisabled(!canChangeLevel(menu)),
                // Entrée toujours présente à la racine du menu : son apparition marque l'ouverture.
                ...(onNativeMenuVisibilityChange
                  ? [
                      swiftUIOnAppear(() => onNativeMenuVisibilityChange(true)),
                      swiftUIOnDisappear(() => onNativeMenuVisibilityChange(false)),
                    ]
                  : []),
              ]}
              onPress={menu.onReorderLevels}
              testID={`${testID}-reorder`}
            />
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
  const choice = menu.movementChoice;
  if (choice !== undefined) {
    // PRE-7 (R-6) : un niveau = un mouvement ; le mouvement courant est coché, le choisir ne fait rien.
    const movementId = option.movementId;
    const isCurrent = movementId === choice.currentMovementId;
    return (
      <SwiftUIButton
        label={label}
        systemImage={isCurrent ? "checkmark" : undefined}
        modifiers={movementId === undefined ? [swiftUIDisabled(true)] : undefined}
        onPress={() => selectMovement(choice, movementId)}
        testID={testID}
      />
    );
  }
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

/** PRE-7 (R-6) : choisir le mouvement courant ne fait rien (il est coché). */
function selectMovement(choice: LevelMovementChoice, movementId: string | undefined) {
  if (movementId !== undefined && movementId !== choice.currentMovementId) choice.onChangeMovement(movementId);
}

type PanelStep =
  | { readonly kind: "ROOT" }
  | { readonly kind: "LEVELS" }
  | { readonly kind: "EXERCISES"; readonly rank: number }
  | { readonly kind: "ADD" };

export type MovementLevelPanelProps = {
  readonly menu: MovementLevelMenuModel;
  readonly placement: AnchoredPanelPlacement;
  /** Toucher extérieur ou échappement : fermeture sans choix. */
  readonly onDismiss: () => void;
  readonly testID: string;
};

/**
 * Android et web : panneau à étapes — « Naviguer vers » (ou « Changer de niveau ») / « Ajouter un
 * niveau » / « Réordonner les niveaux » (R-9), puis les niveaux,
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
      { id: "change", label: levelsSubmenuLabel(menu), disabled: !canChangeLevel(menu), onPress: () => setStep({ kind: "LEVELS" }) },
      { id: "add", label: t.addLevel, disabled: menu.onAddLevel === null, onPress: () => setStep({ kind: "ADD" }) },
      // PRE-7 (A3.2 ; R-9, D-448 point 9) : écran des niveaux, à la racine (comme dans le menu natif).
      {
        id: "reorder",
        label: t.reorderLevels,
        disabled: !canChangeLevel(menu),
        onPress: () => {
          onDismiss();
          menu.onReorderLevels();
        },
      },
    ];
  } else if (step.kind === "ADD") {
    // PRE-7 (R-6, MFN-07) : sens explicite, avant / après l'origine.
    const add = (placement: VariantPlacement) => {
      onDismiss();
      menu.onAddLevel?.(placement);
    };
    rows = [
      { id: "add-easier", label: t.addEasier, onPress: () => add("BEFORE_ORIGIN") },
      { id: "add-harder", label: t.addHarder, onPress: () => add("AFTER_ORIGIN") },
    ];
  } else if (step.kind === "LEVELS") {
    const choice = menu.movementChoice;
    rows = menu.levels.map((option): PanelRowProps => {
      if (choice !== undefined) {
        // PRE-7 (R-6) : choix par mouvement, une ligne par niveau.
        return {
          id: `level-${option.rank}`,
          label: levelOptionLabel(option),
          selected: option.movementId === choice.currentMovementId,
          disabled: option.movementId === undefined,
          onPress: () => {
            onDismiss();
            selectMovement(choice, option.movementId);
          },
        };
      }
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
        <PanelRow key={row.id} row={row} compact={menu.compact === true} testID={`${testID}-${row.id}`} />
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

function PanelRow({ row, compact, testID }: { readonly row: PanelRowProps; readonly compact: boolean; readonly testID: string }) {
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
      <Text style={[styles.optionTitle, compact ? styles.optionTitleCompact : null, disabled ? styles.optionTitleDisabled : null]}>{label}</Text>
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
  // Recette A/B B.10 (b2-8) : 12 au lieu de 13, comme les sous-titres de `CircuitNatureMenu`.
  optionTitleCompact: {
    ...type.supporting,
  },
  optionTitleDisabled: {
    color: colors.textSecondary,
  },
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
  },
});
