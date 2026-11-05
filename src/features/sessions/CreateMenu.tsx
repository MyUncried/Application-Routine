import { Image } from "expo-image";
import { type RefObject, useCallback, useLayoutEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import Reanimated, { FadeIn, ReduceMotion } from "react-native-reanimated";

import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
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
 * [Remplacé par la recette iPhone du 29/10 (obs-4, Hermann : « Options inactives : le fond gris doit
 * rester sans opacité, le texte doit être gris un peu plus foncé ») : plus d'opacité sur la rangée ;
 * pilule grise opaque (fond `#E5E8F0`, contour `#BABFCC`, ceux d'« Annuler » dans Figma), libellé
 * gris foncé `#5C6170` ; icône recouverte d'un voile gris clair (`#E5E8F0` à 60 %) et cerclée de
 * `#BABFCC` — elle reste lisible et opaque. Figma ne dessine pas d'option inactive.]
 *
 * Recette du 29/10, autres demandes de Hermann (qui priment sur Figma `10705:20223`) :
 * - cre-figma : « Faire apparaître la ligne verticale bleue qui lie tous les boutons » — axe bleu
 *   `#1414F5` (gris `#9499A8` dans Figma), du « + » jusqu'au bouton rond d'« Annuler » [01/11/2026 : d'Annuler, le « + » transformé, jusqu'à
 *   « Ajouter un cycle »] ;
 * - obs-4 : « Bouton Annuler : le texte Annuler doit être bleu Kodjo » — `colors.primary` (gris
 *   `#5C6170` dans Figma) [sans objet depuis le 01/11/2026 : plus de rangée « Annuler »] ;
 * - f : « faire apparaître le voile grisé et le menu de boutons avec une apparition progressive
 *   lente » — fondu d'entrée de 600 ms (valeur de conception), immédiat si « Réduire les
 *   animations » est actif.
 *
 * Ordre de Hermann du 01/11/2026 (« Menu Créer et transformation du bouton »), règle écrite du
 * chapitre 13, CE-T03-08 « Menu Créer — état cible » (ancre `composition-menu-creer`) : exactement
 * quatre options, chacune avec son icône ronde à droite ; plus de rangée « Annuler » ni « Utiliser
 * un mouvement existant ». À l'ouverture, le « + » devient Annuler : croix standard (`icon/fermer`,
 * `6959:15825`) sur fond gris, 34, à l'emplacement exact du « + », au-dessus du voile ; son toucher
 * ferme le menu sans action ; à la fermeture, le « + » d'origine réapparaît (le menu se démonte).
 * L'axe, au-dessus du voile et sous les options, part d'Annuler et s'arrête au centre de la
 * dernière icône (« Ajouter un cycle »). [Remplacé le 01/11/2026 : « + » reposé au premier plan
 * (Figma `10705:20340`), rangée « Annuler » sous les options, axe jusqu'à son bouton rond.]
 * Écart assumé avec Figma `11059:18868` (fond `#FCFCFE`) : la règle écrite demande un fond gris —
 * celui de l'ancien Annuler de Figma (`#E5E8F0`, contour `#BABFCC`).
 *
 * Recette iPhone du 01/11/2026 (Hermann) :
 * - m11-annuler KO (« Le Bouton + ne devient pas X, et appuyer dessus n'a aucun effet ») — cause :
 *   depuis la contre-recette n° 2 du 30/10, la zone de contexte (`ContextBand` `fadeToTransparent`)
 *   porte `zIndex: 1` ; le menu, frère suivant sans `zIndex`, était peint et touché SOUS elle sur
 *   l'appareil (l'ordre de rendu ne compte qu'à `zIndex` égal ; Jest n'en tient pas compte) : le « + »
 *   de la zone de contexte recouvrait Annuler et recevait le toucher (ouvrir, déjà ouvert : sans
 *   effet). Le menu est désormais au-dessus de tous ses frères (`MENU_LAYER`) ; la mesure du « + »
 *   est reprise à la mise en page du repère (première mesure périmée ou absente).
 * - m11-menu (classe B) : « la zone de contexte doit être sous le voile grisé, seuls le bouton créer
 *   -> annuler, et les options doivent être visible dessus » — même correction : zone de contexte,
 *   « Pause / Ajouter un arrêt » compris, sous le voile ; seuls Annuler, l'axe et les options dessus.
 *   « il faut intégrer de nouveau l'option du menu « utiliser un mouvement existant » » — 2e, après
 *   « Créer un exercice », icône « Haltère (ancienne) » (Figma `10705:20315`) ; cinq options, l'axe
 *   s'arrête toujours à « Ajouter un cycle ».
 */

const FIGMA_BLUE = "#1414F5";
const AXIS_COLOR = FIGMA_BLUE;
const CANCEL_SURFACE = "#E5E8F0";
const CANCEL_BORDER = "#BABFCC";
const DISABLED_TEXT = "#5C6170";
const DISABLED_ICON_VEIL = "rgba(229, 232, 240, 0.6)";
const SCRIM = "rgba(31, 33, 41, 0.42)";
/**
 * Recette du 01/11/2026 (m11-annuler) : couche du menu, au-dessus de la zone de contexte (`zIndex: 1`,
 * `ContextBand`) et de tout autre frère de l'écran.
 */
export const CREATE_MENU_LAYER = 10;
/** Recette du 29/10 (f) : apparition progressive lente du voile et du menu. */
export const CREATE_MENU_FADE_IN_MS = 600;
const menuEntering = FadeIn.duration(CREATE_MENU_FADE_IN_MS).reduceMotion(ReduceMotion.System);

const ROW_HEIGHT = 32;
const ROW_GAP = 10;
const PILL_WIDTH = 243;
const PILL_TO_ICON = 10;
const ICON_SIZE = 32;
/** Centre du « + » depuis le bord droit de l'écran (Figma : 402 − 361). */
const PLUS_CENTER_FROM_RIGHT = 41;
/** Centre vertical du « + » au-dessus de la première rangée (Figma `11059:18868` : 212 − 165). */
const PLUS_CENTER_ABOVE_FIRST_ROW = 47;
/** Cible tactile d'Annuler (44), centrée sur le « + ». */
const PLUS_TARGET = 44;
/** Annuler (Figma `11059:18868`, « Action / Fermer — Annuler ») : cercle de 34, croix de 24. */
const CANCEL_SIZE = 34;
const CANCEL_GLYPH = 24;

export type CreateMenuIcon = "exercise" | "movement" | "session" | "format" | "circuit" | "cycle";

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
} as const;

/**
 * Haltère (Figma `10705:20315`) : barre, poids et bagues blancs. [Retiré le 01/11/2026 avec « Créer un
 * exercice » passé à la silhouette ; rétabli le même jour pour « Utiliser un mouvement existant »
 * (Hermann, recette du 01/11 : icône « Haltère (ancienne) »), puis passé à « Créer un exercice »
 * (contre-recette du 01/11, m12-menu : symboles des deux premières lignes inversés).]
 */
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

/** Pictogramme rond d'une option du menu Créer (repris par la carte « Exercice libre » de la modale de création). */
export function OptionIcon({ icon }: { readonly icon: CreateMenuIcon }) {
  switch (icon) {
    case "exercise":
      return (
        <View style={[styles.iconCircle, styles.iconBlue]} testID="create-menu-icon-exercise">
          <ExerciseGlyph />
        </View>
      );
    case "session":
      return (
        <View style={[styles.iconCircle, styles.iconBlue]}>
          <SessionGlyph />
        </View>
      );
    case "format":
      // Référence Formats du 02/11/2026 (Figma `11288:19968`) : cadre arrondi blanc de 20 posé à 6, trois traits de 12
      // (cotes diminuées du liseré de 1 du cercle, qui décale les enfants positionnés).
      return (
        <View style={[styles.iconCircle, styles.iconBlue]} testID="create-menu-icon-format">
          <View style={styles.formatFrame} />
          {[10, 14.2, 18.4].map((top) => (
            <View key={top} style={[styles.formatLine, { top }]} />
          ))}
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

/** Boîte du « + » d'origine, dans le repère du menu. */
type PlusAnchor = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

/**
 * Contre-recette iPhone du 30/10 (Hermann : « Le bouton "+" est dupliqué et décalé, on en voit deux.
 * Il ne faut qu'un seul bouton, l'original, qui apparaît activé. Les autres boutons restent alignés
 * dessous ») : le « + » du premier plan était posé aux cotes de Figma (402 − 41, 40 au-dessus de la
 * première rangée), alors que le « + » d'origine de la zone de contexte, visible sous le voile, est
 * placé par la mise en page réelle — deux « + » décalés. Le menu mesure désormais la boîte du « + »
 * d'origine (`measureInWindow`, rapportée à son propre repère) et y repose le sien, qui le recouvre
 * exactement : un seul « + » visible, au-dessus du voile ; l'axe et les boutons ronds s'alignent sur
 * son centre. Sans mesure (avant la première, ou en test), les cotes de Figma.
 */
function usePlusAnchor(
  menuRef: RefObject<View | null>,
  plusRef: RefObject<View | null> | undefined,
): { readonly anchor: PlusAnchor | null; readonly remeasure: () => void } {
  const [anchor, setAnchor] = useState<PlusAnchor | null>(null);
  const activeRef = useRef(true);
  // Recette du 01/11/2026 (m11-annuler) : mesure reprise à chaque mise en page du repère (une mesure
  // faite avant la mise en page native peut être absente ou périmée).
  const remeasure = useCallback(() => {
    const menu = menuRef.current;
    const plus = plusRef?.current;
    if (!menu || !plus) return;
    menu.measureInWindow((menuX, menuY) => {
      plus.measureInWindow((x, y, width, height) => {
        if (!activeRef.current || !(width > 0 && height > 0)) return;
        if (![x, y, menuX, menuY].every(Number.isFinite)) return;
        const next = { x: x - menuX, y: y - menuY, width, height };
        setAnchor((current) =>
          current !== null && current.x === next.x && current.y === next.y && current.width === next.width && current.height === next.height
            ? current
            : next,
        );
      });
    });
  }, [menuRef, plusRef]);
  useLayoutEffect(() => {
    activeRef.current = true;
    remeasure();
    return () => {
      activeRef.current = false;
    };
  }, [remeasure]);
  return { anchor, remeasure };
}

export function CreateMenu({
  top,
  options,
  onCancel,
  cancelLabel,
  cancelTestID,
  plusAnchorRef,
}: {
  /** Ordonnée de la première rangée (8 sous la zone de contexte). */
  readonly top: number;
  readonly options: readonly CreateMenuOption[];
  /** Annuler (le « + » transformé) et le voile : ferment le menu sans action. */
  readonly onCancel: () => void;
  readonly cancelLabel: string;
  readonly cancelTestID: string;
  /** Contre-recette du 30/10 : boîte du « + » d'origine, recouverte par Annuler. */
  readonly plusAnchorRef?: RefObject<View | null>;
}) {
  const { width } = useWindowDimensions();
  const menuRef = useRef<View>(null);
  const { anchor, remeasure } = usePlusAnchor(menuRef, plusAnchorRef);
  const plusCenterX = anchor ? anchor.x + anchor.width / 2 : width - PLUS_CENTER_FROM_RIGHT;
  const plusCenterY = anchor ? anchor.y + anchor.height / 2 : top - PLUS_CENTER_ABOVE_FIRST_ROW;
  const iconLeft = plusCenterX - ICON_SIZE / 2;
  const pillLeft = iconLeft - PILL_TO_ICON - PILL_WIDTH;
  // L'axe part du centre d'Annuler (recouvert par son cercle opaque) : il le relie aux icônes.
  const axisTop = plusCenterY;
  const lastRowCenter = top + (options.length - 1) * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2;
  const unavailable = strings.screens.activities.addToSession.unavailableAccessibilityLabel;

  return (
    <Reanimated.View
      entering={menuEntering}
      style={[StyleSheet.absoluteFill, styles.layer]}
      pointerEvents="box-none"
      testID="composition-add-activity-tree"
    >
      <Pressable onPress={onCancel} accessible={false} testID="composition-add-activity-tree-backdrop" style={[StyleSheet.absoluteFill, styles.scrim]} />
      {/* Repère du menu pour la mesure du « + » d'origine (sans dessin, sans toucher). */}
      <View
        ref={menuRef}
        collapsable={false}
        pointerEvents="none"
        onLayout={remeasure}
        style={StyleSheet.absoluteFill}
        testID="composition-add-activity-tree-frame"
      />
      <View
        pointerEvents="none"
        style={[styles.axis, { left: plusCenterX - 1, top: axisTop, height: Math.max(0, lastRowCenter - axisTop) }]}
        testID="composition-add-activity-tree-axis"
      />
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
            style={[styles.row, { top: rowTop, left: pillLeft }]}
            testID={option.testID}
          >
            <View style={[styles.pill, disabled ? styles.pillDisabled : styles.pillOption]} testID={`${option.testID}-pill`}>
              <Text style={[styles.label, disabled ? styles.labelDisabled : styles.labelOption]} numberOfLines={1} testID={`${option.testID}-label`}>
                {option.label}
              </Text>
            </View>
            <View testID={`${option.testID}-icon`}>
              <OptionIcon icon={option.icon} />
              {disabled ? <View style={styles.iconDisabledVeil} testID={`${option.testID}-icon-veil`} /> : null}
            </View>
          </Pressable>
        );
      })}
      {/* Annuler : le « + » transformé, à son emplacement exact, au-dessus du voile et de l'axe. */}
      <CloseCircleButton
        onPress={onCancel}
        label={cancelLabel}
        style={[styles.cancelTarget, { left: plusCenterX - PLUS_TARGET / 2, top: plusCenterY - PLUS_TARGET / 2 }]}
        testID={cancelTestID}
      />
    </Reanimated.View>
  );
}

/**
 * Croix standard sur fond gris, 34 px, cible de 44 (Figma « Action / Fermer — Annuler ») : Annuler du menu
 * Créer, et fermeture de la fenêtre Formats (référence Formats du 02/11/2026, `9977:19613`).
 */
export function CloseCircleButton({
  onPress,
  label,
  style,
  testID,
}: {
  readonly onPress: () => void;
  readonly label: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID: string;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={style} testID={testID}>
      <View style={styles.cancelCircle} testID={`${testID}-circle`}>
        <KodjoIcon name="control-close" size={CANCEL_GLYPH} testID={`${testID}-icon`} />
      </View>
    </Pressable>
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
  // Recette du 01/11/2026 (m11-annuler) : au-dessus de la zone de contexte (`zIndex` iOS, `elevation` Android).
  layer: { zIndex: CREATE_MENU_LAYER, elevation: CREATE_MENU_LAYER },
  scrim: { backgroundColor: SCRIM },
  axis: { position: "absolute", width: 2, borderRadius: 1, backgroundColor: AXIS_COLOR },
  cancelTarget: { position: "absolute", width: PLUS_TARGET, height: PLUS_TARGET, alignItems: "center", justifyContent: "center" },
  formatFrame: { position: "absolute", left: 5, top: 5, width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: "#FFFFFF" },
  formatLine: { position: "absolute", left: 9, width: 12, height: 1.6, borderRadius: 0.8, backgroundColor: "#FFFFFF" },
  cancelCircle: {
    width: CANCEL_SIZE,
    height: CANCEL_SIZE,
    borderRadius: CANCEL_SIZE / 2,
    borderWidth: 1,
    backgroundColor: CANCEL_SURFACE,
    borderColor: CANCEL_BORDER,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  row: { position: "absolute", flexDirection: "row", alignItems: "center", gap: PILL_TO_ICON, height: ROW_HEIGHT },
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
  pillDisabled: { backgroundColor: CANCEL_SURFACE, borderColor: CANCEL_BORDER },
  label: { ...type.button, textAlign: "center" },
  labelOption: { color: FIGMA_BLUE },
  // Contre-recette du 30/10 (Hermann : « Texte d'options inactive : pas en gras ») : Inter Regular.
  labelDisabled: { color: DISABLED_TEXT, fontFamily: "Inter_400Regular", fontWeight: "400" },
  // Voile opaque à l'œil (posé sur une icône pleine) : l'icône reste lisible, l'option paraît inactive.
  iconDisabledVeil: {
    ...StyleSheet.absoluteFill,
    borderRadius: ICON_SIZE / 2,
    borderWidth: 1,
    borderColor: CANCEL_BORDER,
    backgroundColor: DISABLED_ICON_VEIL,
  },
  iconCircle: { width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2, borderWidth: 1, overflow: "hidden", ...shadow },
  iconBlue: { backgroundColor: FIGMA_BLUE, borderColor: FIGMA_BLUE },
  iconCentered: { alignItems: "center", justifyContent: "center" },
  iconImage: { width: ICON_SIZE, height: ICON_SIZE },
  glyph: { position: "absolute", backgroundColor: "#FFFFFF", borderRadius: 1 },
  movementGlyph: { width: 20, height: 20 },
  circuitGlyph: { position: "absolute", left: 4, top: 4, width: 23, height: 22 },
});
