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
 * PRE-8 (epic E, E.4 ; Q-E4 option B complétée, Hermann 28/10) : `FilterCommand` variante
 * `compact` — filtre actif quand la forme étendue ne tient pas : deux commandes distinctes et
 * visibles, un rond actif (fond bleu pâle, bordure bleue) qui OUVRE le panneau et un rond « croix »
 * qui RÉINITIALISE en un seul toucher ; chacune cible 44. Précision UX hors Figma. Défaut : étendue.
 *
 * Les critères et règles de filtrage restent propres à chaque contexte (D-450 pour les familles
 * de Mouvements) : ce module ne porte que la présentation et l'interaction d'entrée. Les
 * pictogrammes Créer et Filtrer sont des rectangles Figma (`10579:21589`, `10579:21602`), rendus
 * tels quels ; Trier, Réinitialiser et le chevron sont des exports SVG du manifeste d'icônes.
 */

const COMMAND = dimensions.catalogueCommand;
const SLOP = (COMMAND.touchTarget - COMMAND.visual) / 2;
const HIT_SLOP = { top: SLOP, bottom: SLOP, left: SLOP, right: SLOP } as const;

const SORT_ICON = require("../../../assets/icons/icon-tri.svg");
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
      {icon === "sort" ? <Image source={SORT_ICON} style={styles.icon} accessible={false} testID={`${testID}-icon`} /> : null}
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
  variant = "extended",
  onOpen,
  onClear,
  testID,
}: {
  /** E.4 : forme du filtre actif (étendue par défaut). */
  readonly variant?: "extended" | "compact";
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
  if (variant === "compact") {
    return (
      <View style={styles.compact} testID={testID}>
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`${editLabel}, ${summary}`}
          hitSlop={HIT_SLOP}
          style={[styles.circle, styles.circleActive]}
          testID={`${testID}-edit`}
        >
          <FilterGlyph color={colors.primary} testID={`${testID}-icon`} />
        </Pressable>
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          hitSlop={HIT_SLOP}
          style={styles.circle}
          testID={`${testID}-clear`}
        >
          <View style={styles.icon}>
            <View style={[styles.crossBar, styles.clearBarForward]} />
            <View style={[styles.crossBar, styles.clearBarBackward]} />
          </View>
        </Pressable>
      </View>
    );
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
  testID,
}: {
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder: string;
  readonly accessibilityLabel: string;
  readonly clearLabel: string;
  readonly testID: string;
}) {
  return (
    <View style={styles.searchTarget}>
      <View style={styles.search}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.movementCardDescription}
          accessibilityLabel={accessibilityLabel}
          autoCorrect={false}
          returnKeyType="search"
          style={styles.searchInput}
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
  circleActive: {
    backgroundColor: colors.selectionSurface,
  },
  // E.4 : deux ronds 34 séparés de l'écart des commandes (cibles 44 sans chevauchement).
  compact: {
    flexDirection: "row",
    alignItems: "center",
    gap: COMMAND.gap,
  },
  crossBar: {
    position: "absolute",
    top: (COMMAND.icon - 1.875) / 2,
    left: 2,
    width: COMMAND.icon - 4,
    height: 1.875,
    borderRadius: 0.938,
    backgroundColor: colors.primary,
  },
  icon: {
    width: COMMAND.icon,
    height: COMMAND.icon,
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
  },
  pillTexts: {
    maxWidth: 96,
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
