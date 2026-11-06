import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-8, recette A/B (D01 à D05 ; ch13 §4.5 ; Figma `10579:21580`, `10465:23141`) — commandes de
 * la zone de contexte des Catalogues, communes à tous les segments et aux listes compatibles :
 *
 * - `CommandCircle` : bouton rond inactif (`Créer`, `Trier`, `Filtrer` sans critère) — cercle
 *   visible 34, pictogramme 20, cible 44 (`hitSlop`), jamais agrandi visuellement ;
 * - `FilterCommand` : `Filtrer` ; sans critère, bouton rond ; avec critère, pilule étendue bleue
 *   (rond bleu qui RETIRE les filtres, zone texte « Filtres » + résumé + chevron qui OUVRE la
 *   feuille) — même hauteur visible 34 ; la largeur suit le résumé ;
 * - `CatalogueSearchField` : champ Rechercher sur la même rangée, hauteur visible 34, largeur
 *   flexible (il se réduit quand `Filtrer` s'étend, sans retour à la ligne), croix d'effacement
 *   à droite dès qu'une saisie existe (D03).
 *
 * PRE-8 (epic E, recette du 28/10/2026, Hermann q4-02) : la variante `compact` de E.4 (deux ronds,
 * ouvrir et croix) est retirée ; le filtre actif garde toujours la forme étendue.
 *
 * Les critères et règles de filtrage restent propres à chaque contexte (D-450 pour les familles
 * de Mouvements) : ce module ne porte que la présentation et l'interaction d'entrée. Les
 * pictogrammes Créer et Filtrer sont des rectangles Figma (`10579:21589`, `10579:21602`), rendus
 * tels quels ; Trier, Réinitialiser et le chevron sont des exports SVG du manifeste d'icônes.
 */

const COMMAND = dimensions.catalogueCommand;
const SLOP = (COMMAND.touchTarget - COMMAND.visual) / 2;
const HIT_SLOP = { top: SLOP, bottom: SLOP, left: SLOP, right: SLOP } as const;

const CHEVRON_ICON = require("../../../assets/icons/filtre-chevron-modifier.svg");

export function CommandCircle({
  label,
  icon,
  disabled = false,
  onPress,
  testID,
}: {
  readonly label: string;
  readonly icon: "create" | "sort" | "filter";
  readonly disabled?: boolean;
  readonly onPress?: () => void;
  readonly testID: string;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={label}
      hitSlop={HIT_SLOP}
      style={[styles.circle, disabled ? styles.circleDisabled : null]}
      testID={testID}
    >
      {icon === "create" ? <PlusGlyph color={disabled ? colors.disabled : colors.primary} testID={`${testID}-icon`} /> : null}
      {icon === "filter" ? <FilterGlyph color={disabled ? colors.disabled : colors.primary} testID={`${testID}-icon`} /> : null}
      {icon === "sort" ? <SortGlyph testID={`${testID}-icon`} /> : null}
    </Pressable>
  );
}

export function FilterCommand({
  label,
  title,
  summary,
  clearLabel,
  editLabel,
  disabled = false,
  onOpen,
  onClear,
  testID,
}: {
  /** Libellé accessible du bouton rond inactif. */
  readonly label: string;
  /** « Filtres » (pilule étendue). */
  readonly title: string;
  /** Résumé des critères ; `null` : aucun critère, bouton rond. */
  readonly summary: string | null;
  readonly clearLabel: string;
  readonly editLabel: string;
  readonly disabled?: boolean;
  readonly onOpen: () => void;
  readonly onClear: () => void;
  readonly testID: string;
}) {
  if (summary === null || disabled) {
    return <CommandCircle label={label} icon="filter" disabled={disabled} onPress={onOpen} testID={testID} />;
  }
  return (
    <View style={styles.pill} testID={testID}>
      <Pressable
        onPress={onClear}
        accessibilityRole="button"
        accessibilityLabel={clearLabel}
        hitSlop={HIT_SLOP}
        style={styles.pillCircle}
        testID={`${testID}-clear`}
      >
        <FilterGlyph color={colors.background} testID={`${testID}-icon`} />
      </Pressable>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${editLabel}, ${summary}`}
        hitSlop={{ top: SLOP, bottom: SLOP, right: SLOP }}
        style={styles.pillText}
        testID={`${testID}-edit`}
      >
        <View style={styles.pillTexts}>
          <Text style={styles.pillTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.pillSummary} numberOfLines={1} testID={`${testID}-summary`}>
            {summary}
          </Text>
        </View>
        <Image source={CHEVRON_ICON} style={styles.chevron} accessible={false} />
      </Pressable>
    </View>
  );
}

export function CatalogueSearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  clearLabel,
  width,
  testID,
}: {
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder: string;
  readonly accessibilityLabel: string;
  readonly clearLabel: string;
  /**
   * PRE-9 CAT.1 (zones de contexte, CE-CAT-CTX-01 ; Figma `10266:20575`, `10465:23141`) : champ de
   * la zone de contexte des Catalogues — largeur de référence (216 ou 107 pt, réductible sur un
   * écran plus étroit), hauteur visible 44, fond `#F3F4F9` fondu vers la transparence. Absente :
   * champ flexible de hauteur visible 34.
   *
   * `{ fillFrom }` [Recette iPhone CAT.1 du 30/10/2026, Hermann (cat-commandes) : « le champ de la
   * zone de recherche est trop raccourci, il faut qu'il conserve le même espace qu'entre deux boutons
   * d'action »] : état filtré ou archivé — le champ s'étend jusqu'à la commande suivante, à l'écart
   * des commandes (`gap` de la rangée), sans descendre sous `fillFrom` (107 de la spécification §2).
   */
  readonly width?: number | { readonly fillFrom: number };
  readonly testID: string;
}) {
  const context = width !== undefined;
  const targetStyle =
    width === undefined
      ? styles.searchTarget
      : typeof width === "number"
        ? [styles.searchContextTarget, { width }]
        : // Recette CAT.1 du 31/10 : le champ prend l'espace restant après la pilule Filtre, même s'il
          // descend sous `fillFrom` (la pilule complète prime).
          [styles.searchContextTarget, styles.searchContextFill];
  return (
    <View style={targetStyle} testID={`${testID}-field`}>
      <View style={context ? styles.searchContext : styles.search}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.movementCardDescription}
          accessibilityLabel={accessibilityLabel}
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.searchInput, context ? styles.searchContextInput : null]}
          testID={testID}
        />
        {value.length > 0 ? (
          <Pressable
            onPress={() => onChangeText("")}
            accessibilityRole="button"
            accessibilityLabel={clearLabel}
            hitSlop={{ top: SLOP, bottom: SLOP, left: spacing[4], right: SLOP }}
            style={styles.clear}
            testID={`${testID}-clear`}
          >
            <View style={[styles.clearBar, styles.clearBarForward]} />
            <View style={[styles.clearBar, styles.clearBarBackward]} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Figma `Contrôle créer — Bouton rond` : deux barres 20 × 2,5, rayon 1. */
function PlusGlyph({ color, testID }: { readonly color: string; readonly testID: string }) {
  return (
    <View style={styles.icon} testID={testID}>
      <View style={[styles.plusHorizontal, { backgroundColor: color }]} />
      <View style={[styles.plusVertical, { backgroundColor: color }]} />
    </View>
  );
}

/** Figma `Icône filtre` : trois traits 17,5 / 12,5 / 7,5 × 1,875, centrés, espacés de 6,25. */
function FilterGlyph({ color, testID }: { readonly color: string; readonly testID: string }) {
  return (
    <View style={styles.icon} testID={testID}>
      <View style={[styles.filterBar, { top: 1.25, left: 1.25, width: 17.5, backgroundColor: color }]} />
      <View style={[styles.filterBar, { top: 7.5, left: 3.75, width: 12.5, backgroundColor: color }]} />
      <View style={[styles.filterBar, { top: 13.75, left: 6.25, width: 7.5, backgroundColor: color }]} />
    </View>
  );
}

/**
 * Recette iPhone du 06/11/2026 (t-catalogue, Hermann : « l'affichage se fait en deux temps : le symbole de la zone de contexte
 * et du tri (pas son cercle) apparaissent avec un décalage d'une seconde environs ») : le pictogramme Trier était l'export SVG
 * `icon-tri.svg` affiché par `expo-image`, chargé et décodé de façon asynchrone (en développement, servi par Metro) — le
 * cercle, simple vue, s'affichait aussitôt, le symbole ensuite. Il est désormais tracé en vues, comme Créer et Filtrer, dans
 * la même image que le cercle, d'après le tracé du maître vectoriel `icon/tri` (Figma `6939:26387`, 20 × 20) : axe
 * `M10 2V18`, chevrons `M15 7L10 2L5 7` et `M15 13L10 18L5 13`, trait 2, `#9499A8` à 85 %.
 * [Avant : `<Image source={icon-tri.svg} />` — remplacé.]
 */
function SortGlyph({ testID }: { readonly testID: string }) {
  return (
    <View style={[styles.icon, styles.sortGlyph]} accessible={false} testID={testID}>
      <View style={styles.sortAxis} />
      <View style={[styles.sortArm, { top: 4.5 - SORT_STROKE / 2, left: 12.5 - SORT_ARM / 2, transform: [{ rotate: "45deg" }] }]} />
      <View style={[styles.sortArm, { top: 4.5 - SORT_STROKE / 2, left: 7.5 - SORT_ARM / 2, transform: [{ rotate: "-45deg" }] }]} />
      <View style={[styles.sortArm, { top: 15.5 - SORT_STROKE / 2, left: 12.5 - SORT_ARM / 2, transform: [{ rotate: "-45deg" }] }]} />
      <View style={[styles.sortArm, { top: 15.5 - SORT_STROKE / 2, left: 7.5 - SORT_ARM / 2, transform: [{ rotate: "45deg" }] }]} />
    </View>
  );
}

/** Trait du maître `icon/tri` ; branche de chevron de 5√2, prolongée d'un demi-trait à chaque bout (jonction en pointe). */
const SORT_STROKE = 2;
const SORT_ARM = 5 * Math.SQRT2 + SORT_STROKE / 2;
const SORT_COLOR = "#9499A8";

const CLEAR_SIZE = 16;

const styles = StyleSheet.create({
  circle: {
    width: COMMAND.visual,
    height: COMMAND.visual,
    borderRadius: COMMAND.radius,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  circleDisabled: {
    borderColor: colors.disabled,
  },
  icon: {
    width: COMMAND.icon,
    height: COMMAND.icon,
  },
  sortGlyph: {
    opacity: 0.85,
  },
  sortAxis: {
    position: "absolute",
    left: 10 - SORT_STROKE / 2,
    top: 2,
    width: SORT_STROKE,
    height: 16,
    backgroundColor: SORT_COLOR,
  },
  sortArm: {
    position: "absolute",
    width: SORT_ARM,
    height: SORT_STROKE,
    backgroundColor: SORT_COLOR,
  },
  plusHorizontal: {
    position: "absolute",
    left: 0,
    top: (COMMAND.icon - 2.5) / 2,
    width: COMMAND.icon,
    height: 2.5,
    borderRadius: 1,
  },
  plusVertical: {
    position: "absolute",
    top: 0,
    left: (COMMAND.icon - 2.5) / 2,
    width: 2.5,
    height: COMMAND.icon,
    borderRadius: 1,
  },
  filterBar: {
    position: "absolute",
    height: 1.875,
    borderRadius: 0.938,
  },
  // Figma `Contrôle filtre — Actif étendu` (`10465:23252`) : 34 de haut, bordure bleue, rond bleu.
  pill: {
    height: COMMAND.visual,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: COMMAND.radius,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    // PRE-9 CAT.1 : la pilule cède de la place (résumé tronqué) plutôt que de chevaucher le champ Rechercher.
    // [Remplacé le 31/10/2026, recette CAT.1 (Hermann, cat1r-champ : « Filtre actif : la largeur du
    // filtre étendu est réduite, le texte Filtres, le texte en dessous et le chevron ne sont plus
    // visibles ») : la pilule garde sa largeur naturelle ; c'est le champ Rechercher qui cède.]
    flexShrink: 0,
  },
  pillCircle: {
    width: COMMAND.visual,
    height: COMMAND.visual,
    marginLeft: -1,
    borderRadius: COMMAND.radius,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: {
    height: COMMAND.visual - 2,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    paddingLeft: spacing[12],
    paddingRight: spacing[12],
    flexShrink: 1,
    minWidth: 0,
  },
  pillTexts: {
    maxWidth: 96,
    flexShrink: 1,
    minWidth: 0,
  },
  pillTitle: {
    ...type.filterCommandTitle,
    color: colors.primary,
  },
  pillSummary: {
    ...type.filterCommandSummary,
    color: colors.primary,
  },
  chevron: {
    width: 9.5,
    height: 5.5,
  },
  // D04 : cible tactile 44 de haut, champ visible 34 (hauteur des commandes).
  searchTarget: {
    flex: 1,
    minWidth: 0,
    height: COMMAND.touchTarget,
    justifyContent: "center",
  },
  search: {
    height: COMMAND.visual,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: colors.searchFieldSurface,
  },
  // PRE-9 CAT.1 (Figma `Champ — Rechercher`, `10457:23120`) : 44 de haut, rayon 12, dégradé vertical
  // `#F3F4F9` → transparent ; réductible (jamais au-delà de la largeur de référence).
  searchContextTarget: {
    flexShrink: 1,
    minWidth: 0,
    height: COMMAND.touchTarget,
  },
  searchContextFill: {
    flexGrow: 1,
    flexBasis: 0,
  },
  searchContext: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    experimental_backgroundImage: `linear-gradient(to bottom, ${colors.searchFieldSurface} 0%, ${colors.searchFieldSurface}00 100%)`,
  },
  searchContextInput: {
    height: COMMAND.touchTarget,
  },
  searchInput: {
    ...type.searchField,
    flex: 1,
    minWidth: 0,
    height: COMMAND.visual,
    paddingVertical: 0,
    paddingLeft: spacing[16],
    paddingRight: spacing[4],
    color: colors.textPrimary,
  },
  clear: {
    width: CLEAR_SIZE,
    height: CLEAR_SIZE,
    marginRight: spacing[10],
    borderRadius: CLEAR_SIZE / 2,
    backgroundColor: colors.movementCardDescription,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBar: {
    position: "absolute",
    width: 8,
    height: 1.5,
    borderRadius: 0.75,
    backgroundColor: colors.background,
  },
  clearBarForward: {
    transform: [{ rotate: "45deg" }],
  },
  clearBarBackward: {
    transform: [{ rotate: "-45deg" }],
  },
});
