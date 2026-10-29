import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AddActivityCircle } from "@/features/sessions/CompositionContextHeader";
import { strings } from "@/shared/i18n";
import { colors, type } from "@/shared/ui/tokens";

/**
 * PRE-9 (B.2, COMP §5) — menu Créer de la Composition, rendu de Figma `10705:20223` (« Composition
 * séance — Créer (menu) ») : voile modal ; « + » reposé au premier plan ; axe vertical gris qui
 * descend du « + » ; une rangée par action — pilule de 243 × 32 (fond blanc, contour et libellé
 * bleus, Semi Bold 14, rayon 16, ombre) et, à droite sur l'axe du « + », un bouton rond de 32
 * (fond bleu, icône blanche) ; « Annuler » en gris. Rangées de 32, écart 10 ; première rangée à 8 sous
 * la zone de contexte (`top`). Valeurs de Figma sans jeton : `#1414F5`, `#9499A8`, `#E5E8F0`,
 * `#BABFCC`, `#5C6170`, voile `rgba(31, 33, 41, 0.42)`.
 *
 * Action indisponible (« Utiliser une séance existante » avant B.8, « Ajouter un circuit / un
 * cycle » sans contenu éligible) : rangée à demi-opacité, non activable (traitement existant des
 * actions indisponibles), annoncée « … — indisponible ».
 */

const FIGMA_BLUE = "#1414F5";
const AXIS_COLOR = "#9499A8";
const CANCEL_SURFACE = "#E5E8F0";
const CANCEL_BORDER = "#BABFCC";
const CANCEL_TEXT = "#5C6170";
const SCRIM = "rgba(31, 33, 41, 0.42)";

const ROW_HEIGHT = 32;
const ROW_GAP = 10;
const PILL_WIDTH = 243;
const PILL_TO_ICON = 10;
const ICON_SIZE = 32;
/** Centre du « + » depuis le bord droit de l'écran (Figma : 402 − 361). */
const PLUS_CENTER_FROM_RIGHT = 41;
/** Centre vertical du « + » au-dessus de la première rangée (Figma : 212 − 172). */
const PLUS_CENTER_ABOVE_FIRST_ROW = 40;
/** Cible du « + » (44) : l'axe part de son bas (Figma `10705:20312`, y 194). */
const PLUS_TARGET = 44;

export type CreateMenuIcon = "exercise" | "movement" | "session" | "circuit" | "cycle";

export type CreateMenuOption = {
  readonly key: string;
  readonly label: string;
  readonly icon: CreateMenuIcon;
  /** Absent : action indisponible. */
  readonly onPress?: () => void;
  readonly testID: string;
};

const SVG_ICONS = {
  movement: require("../../../assets/composition/menu-mouvement.svg"),
  circuit: require("../../../assets/composition/menu-circuit.svg"),
  cycle: require("../../../assets/composition/menu-cycle.svg"),
  cancel: require("../../../assets/composition/menu-annuler.svg"),
} as const;

/** Haltère (Figma `10705:20315`) : barre, poids et bagues blancs. */
function ExerciseGlyph() {
  return (
    <>
      <View style={[styles.glyph, { left: 5, top: 14, width: 20, height: 2 }]} />
      <View style={[styles.glyph, { left: 3, top: 9, width: 3, height: 12 }]} />
      <View style={[styles.glyph, { left: 24, top: 9, width: 3, height: 12 }]} />
      <View style={[styles.glyph, { left: 7, top: 11, width: 2, height: 8 }]} />
      <View style={[styles.glyph, { left: 21, top: 11, width: 2, height: 8 }]} />
    </>
  );
}

/** Liste (Figma `10705:20327`) : trois repères et trois lignes blancs. */
function SessionGlyph() {
  return (
    <>
      {[8, 14, 20].map((top) => (
        <View key={top}>
          <View style={[styles.glyph, { left: 6, top, width: 3, height: 3 }]} />
          <View style={[styles.glyph, { left: 13, top: top + 1, width: 12, height: 2 }]} />
        </View>
      ))}
    </>
  );
}

function OptionIcon({ icon }: { readonly icon: CreateMenuIcon }) {
  switch (icon) {
    case "exercise":
      return (
        <View style={[styles.iconCircle, styles.iconBlue]}>
          <ExerciseGlyph />
        </View>
      );
    case "session":
      return (
        <View style={[styles.iconCircle, styles.iconBlue]}>
          <SessionGlyph />
        </View>
      );
    case "movement":
      // Figma `10705:20343` / `10705:20344` : fond rond bleu, pictogramme de 20 posé à 6.
      return (
        <View style={[styles.iconCircle, styles.iconBlue, styles.iconCentered]}>
          <Image source={SVG_ICONS.movement} style={styles.movementGlyph} contentFit="contain" />
        </View>
      );
    case "circuit":
      // Figma `10774:20132` : chemin de 23 × 22 posé à 4.
      return (
        <View style={[styles.iconCircle, styles.iconBlue]}>
          <Image source={SVG_ICONS.circuit} style={styles.circuitGlyph} contentFit="contain" />
        </View>
      );
    case "cycle":
      // Figma `10774:20144` : icône complète de 32 (fond rond compris).
      return <Image source={SVG_ICONS.cycle} style={styles.iconImage} contentFit="contain" />;
    default: {
      const unreachable: never = icon;
      return unreachable;
    }
  }
}

export function CreateMenu({
  top,
  options,
  onCancel,
  cancelLabel,
  cancelTestID,
}: {
  /** Ordonnée de la première rangée (8 sous la zone de contexte). */
  readonly top: number;
  readonly options: readonly CreateMenuOption[];
  readonly onCancel: () => void;
  readonly cancelLabel: string;
  readonly cancelTestID: string;
}) {
  const { width } = useWindowDimensions();
  const rows = options.length + 1;
  const iconLeft = width - PLUS_CENTER_FROM_RIGHT - ICON_SIZE / 2;
  const pillLeft = iconLeft - PILL_TO_ICON - PILL_WIDTH;
  const plusCenterY = top - PLUS_CENTER_ABOVE_FIRST_ROW;
  const axisTop = plusCenterY + PLUS_TARGET / 2;
  const lastRowCenter = top + (rows - 1) * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2;
  const unavailable = strings.screens.activities.addToSession.unavailableAccessibilityLabel;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID="composition-add-activity-tree">
      <Pressable onPress={onCancel} accessible={false} testID="composition-add-activity-tree-backdrop" style={[StyleSheet.absoluteFill, styles.scrim]} />
      <View
        pointerEvents="none"
        style={[styles.axis, { left: width - PLUS_CENTER_FROM_RIGHT - 1, top: axisTop, height: Math.max(0, lastRowCenter - axisTop) }]}
        testID="composition-add-activity-tree-axis"
      />
      {/* « + » au premier plan (Figma `10705:20340`) : le toucher referme le menu. */}
      <Pressable
        onPress={onCancel}
        // Doublon visuel du « + » de la zone de contexte : « Annuler » porte cette action pour VoiceOver.
        accessible={false}
        style={[styles.plus, { left: width - PLUS_CENTER_FROM_RIGHT - PLUS_TARGET / 2, top: plusCenterY - PLUS_TARGET / 2 }]}
        testID="composition-add-activity-tree-plus"
      >
        <AddActivityCircle />
      </Pressable>
      {options.map((option, index) => {
        const disabled = option.onPress === undefined;
        const rowTop = top + index * (ROW_HEIGHT + ROW_GAP);
        return (
          <Pressable
            key={option.key}
            onPress={option.onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={disabled ? unavailable.replace("{action}", option.label) : option.label}
            accessibilityState={{ disabled }}
            style={[styles.row, { top: rowTop, left: pillLeft }, disabled ? styles.disabled : null]}
            testID={option.testID}
          >
            <View style={[styles.pill, styles.pillOption]}>
              <Text style={[styles.label, styles.labelOption]} numberOfLines={1}>
                {option.label}
              </Text>
            </View>
            <OptionIcon icon={option.icon} />
          </Pressable>
        );
      })}
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel={cancelLabel}
        style={[styles.row, { top: top + options.length * (ROW_HEIGHT + ROW_GAP), left: pillLeft }]}
        testID={cancelTestID}
      >
        <View style={[styles.pill, styles.pillCancel]}>
          <Text style={[styles.label, styles.labelCancel]} numberOfLines={1}>
            {cancelLabel}
          </Text>
        </View>
        <View style={[styles.iconCircle, styles.iconCancel, styles.iconCentered]}>
          <Image source={SVG_ICONS.cancel} style={styles.cancelGlyph} contentFit="contain" />
        </View>
      </Pressable>
    </View>
  );
}

const shadow = {
  shadowColor: "#000000",
  shadowOpacity: 0.14,
  shadowRadius: 2,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  scrim: { backgroundColor: SCRIM },
  axis: { position: "absolute", width: 2, borderRadius: 1, backgroundColor: AXIS_COLOR },
  plus: { position: "absolute", width: PLUS_TARGET, height: PLUS_TARGET, alignItems: "center", justifyContent: "center" },
  row: { position: "absolute", flexDirection: "row", alignItems: "center", gap: PILL_TO_ICON, height: ROW_HEIGHT },
  disabled: { opacity: 0.5 },
  pill: {
    width: PILL_WIDTH,
    height: ROW_HEIGHT,
    borderRadius: ROW_HEIGHT / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    ...shadow,
  },
  pillOption: { backgroundColor: colors.background, borderColor: FIGMA_BLUE },
  pillCancel: { backgroundColor: CANCEL_SURFACE, borderColor: CANCEL_BORDER },
  label: { ...type.button, textAlign: "center" },
  labelOption: { color: FIGMA_BLUE },
  labelCancel: { color: CANCEL_TEXT },
  iconCircle: { width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2, borderWidth: 1, overflow: "hidden", ...shadow },
  iconBlue: { backgroundColor: FIGMA_BLUE, borderColor: FIGMA_BLUE },
  iconCancel: { backgroundColor: CANCEL_SURFACE, borderColor: CANCEL_BORDER },
  iconCentered: { alignItems: "center", justifyContent: "center" },
  iconImage: { width: ICON_SIZE, height: ICON_SIZE },
  glyph: { position: "absolute", backgroundColor: "#FFFFFF", borderRadius: 1 },
  movementGlyph: { width: 20, height: 20 },
  circuitGlyph: { position: "absolute", left: 4, top: 4, width: 23, height: 22 },
  // Figma `10705:20337` : « + » de 16 tourné de 45°.
  cancelGlyph: { width: 16, height: 16, transform: [{ rotate: "45deg" }] },
});
