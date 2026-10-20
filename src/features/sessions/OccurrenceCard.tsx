import { StyleSheet, Text, View } from "react-native";

import { COMPACT_LIST_SEPARATOR, type OccurrenceCategory } from "@/features/sessions/compositionPresentation";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, fixedRadii, spacing, type } from "@/shared/ui/tokens";

/** Bordure de la carte (Figma `5544:6797`, couleur observée `#E4E4EB`, sans jeton DSF). */
export const OCCURRENCE_CARD_BORDER_COLOR = "#E4E4EB";
/**
 * Rayon UNIQUE de la carte d'occurrence (Figma `5544:6797` : 14), partagé par la surface,
 * le groupe d'actions glissées et l'état soulevé (même silhouette partout).
 */
export const OCCURRENCE_CARD_RADIUS = fixedRadii[14];
/** Épaisseur de la bordure (Figma : 1). */
const OCCURRENCE_CARD_BORDER_WIDTH = 1;
/** Hauteur de la carte : 1 + 12 + 18 (nom) + 4 + 16 (classement) + 12 + 1. */
export const OCCURRENCE_CARD_HEIGHT = 64;
/** Variante « Répétitions + cadence » (`9522:43875`) : seconde ligne « durée estimée » sous la synthèse. */
export const OCCURRENCE_CARD_ESTIMATED_HEIGHT = 70;
/** Pastille de Catégorie : disque de 6 (Figma `5544:6767`). */
const CATEGORY_DOT_SIZE = 6;
/** Écart pastille → texte (texte à x = 12, pastille de 6). */
const CATEGORY_DOT_GAP = 6;
/** Hauteur de la ligne de classement et de la synthèse (cadre Figma de 16). */
const SECONDARY_LINE_HEIGHT = 16;
/** Icône de changement de côté (16) : `top` 9 dans la carte (Figma `9522:20651`). */
const SIDE_CHANGE_ICON_SIZE = 16;
const SIDE_CHANGE_ICON_TOP = 9;

const MEDIUM_12 = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 12, lineHeight: SECONDARY_LINE_HEIGHT } as const;
const MEDIUM_11 = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 11, lineHeight: 13 } as const;
const SEMI_BOLD_12 = { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 12, lineHeight: SECONDARY_LINE_HEIGHT } as const;
const REGULAR_12 = { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 12, lineHeight: SECONDARY_LINE_HEIGHT } as const;

/** Hauteur de la carte selon la présence de la ligne « durée estimée ». */
export function occurrenceCardHeight(hasEstimatedDuration: boolean): number {
  return hasEstimatedDuration ? OCCURRENCE_CARD_ESTIMATED_HEIGHT : OCCURRENCE_CARD_HEIGHT;
}

/**
 * Surface de la carte (fond blanc, bordure 1 `#E4E4EB`, rayon 14) — portée par le
 * `Pressable` de l'occurrence (`CompositionActivityRow`), qui garde gestes, balayage
 * et état soulevé : l'état soulevé remplace fond, bordure et rayon comme avant.
 */
export const occurrenceCardSurface = {
  backgroundColor: colors.background,
  borderWidth: OCCURRENCE_CARD_BORDER_WIDTH,
  borderColor: OCCURRENCE_CARD_BORDER_COLOR,
  borderRadius: OCCURRENCE_CARD_RADIUS,
} as const;

export type OccurrenceCardProps = {
  readonly name: string;
  readonly category: OccurrenceCategory | null;
  /** Zones corporelles déjà formatées (`formatExerciseBodyZones`), `null` sans zone. */
  readonly bodyZones: string | null;
  /** Synthèse D-238 (`formatOccurrenceSummary`). */
  readonly summary: string;
  /** Seconde ligne « durée estimée » (Répétitions avec bip), `null` sinon. */
  readonly estimatedDuration: string | null;
  /** `true` seulement si l'exercice a un changement de côté (bilatéral). */
  readonly hasSideChange: boolean;
  readonly sideChangeTestID?: string;
};

/**
 * Contenu de la carte d'occurrence de la Composition (PRE-6 story 2.2,
 * `DSF / Cards / Composition — exercice` `5544:6797`, ch13 PR #390) :
 * - ligne 1 : nom, Inter Semi Bold 15, une ligne avec ellipse ;
 * - ligne 2 : pastille 6 de la couleur de Catégorie, Catégorie (Semi Bold 12,
 *   `#46464C`) puis « · zones » (Regular 12, tertiaire), sur une ligne — la fin
 *   (les zones) est tronquée en premier ; écart 8 avec la synthèse, en bas à
 *   droite (Medium 12, `#46464C`, alignée à droite) et jamais tronquée ;
 * - variante Répétitions + bip : « durée estimée » en Inter 11 sous la synthèse ;
 * - icône neutre de changement de côté (16) en haut à droite, bord droit aligné
 *   sur celui de la synthèse ; aucune flèche, aucun badge, aucune direction
 *   (RM-243, D-407, ARB-2).
 *
 * Sans Catégorie : ni pastille ni nom, zones seules ; sans zone : Catégorie
 * seule ; ni l'une ni l'autre : ligne vide (la hauteur de la carte ne change pas).
 * Non interactif : l'appelant porte surface, gestes et nom accessible.
 */
export function OccurrenceCard({
  name,
  category,
  bodyZones,
  summary,
  estimatedDuration,
  hasSideChange,
  sideChangeTestID,
}: OccurrenceCardProps) {
  return (
    <View
      style={[styles.content, estimatedDuration !== null ? styles.contentWithEstimate : null]}
      testID="composition-activity-main-card"
    >
      {/*
       * CE-T03-08 (ch13) : poignée de la carte d'Exercice = instance de `Icon / Structure /
       * Movable` (`3066:4676`) — tracé 20 dans un emplacement 28, opacité 50 % (défaut de
       * `composition-reorder`). Simple affordance : l'appui long reste porté par toute la carte.
       */}
      <View style={styles.handleSlot} testID="composition-boundary-handle-slot">
        <KodjoIcon name="composition-reorder" testID="composition-boundary-handle-icon" />
      </View>
      <View style={styles.textColumn}>
        <Text
          style={[styles.name, hasSideChange ? styles.nameBesideSideChange : null]}
          numberOfLines={1}
          testID="composition-exercise-name"
        >
          {name}
        </Text>
        <View style={styles.secondaryRow} testID="composition-exercise-secondary-row">
          <View style={styles.classification} testID="composition-exercise-classification">
            {category !== null ? (
              <View
                style={[styles.categoryDot, { backgroundColor: category.color }]}
                testID="composition-exercise-category-dot"
              />
            ) : null}
            <Text style={styles.classificationText} numberOfLines={1} testID="composition-exercise-classification-line">
              {category !== null ? (
                <Text style={styles.categoryName} testID="composition-exercise-category">
                  {category.name}
                </Text>
              ) : null}
              {category !== null && bodyZones !== null ? COMPACT_LIST_SEPARATOR : null}
              {bodyZones !== null ? <Text testID="composition-exercise-body-zones">{bodyZones}</Text> : null}
            </Text>
          </View>
          <View style={styles.summaryColumn}>
            <Text style={styles.summary} numberOfLines={1} testID="composition-exercise-summary">
              {summary}
            </Text>
            {estimatedDuration !== null ? (
              <Text style={styles.estimatedDuration} numberOfLines={1} testID="composition-exercise-estimated-duration">
                {estimatedDuration}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      {hasSideChange ? (
        <View style={styles.sideChange} testID={sideChangeTestID}>
          <KodjoIcon name="side-change" testID="composition-exercise-side-change-icon" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[14],
    paddingTop: spacing[12],
    paddingBottom: spacing[12],
    gap: spacing[8],
  },
  // Emplacement canonique 28 × 28 de la poignée (`dimensions.structureMovableIcon.slot`).
  handleSlot: {
    width: dimensions.structureMovableIcon.slot,
    height: dimensions.structureMovableIcon.slot,
    alignItems: "center",
    justifyContent: "center",
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing[4],
  },
  // Variante `9522:43875` : hauteur 70, la seconde ligne occupe la marge basse.
  contentWithEstimate: {
    paddingBottom: 0,
  },
  name: {
    ...type.listCardTitle,
    color: colors.textPrimary,
  },
  // Le nom ne passe jamais sous l'icône de côté (16 + écart 8).
  nameBesideSideChange: {
    marginRight: SIDE_CHANGE_ICON_SIZE + spacing[8],
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[8],
  },
  classification: {
    flex: 1,
    minWidth: 0,
    height: SECONDARY_LINE_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: CATEGORY_DOT_GAP,
  },
  categoryDot: {
    width: CATEGORY_DOT_SIZE,
    height: CATEGORY_DOT_SIZE,
    borderRadius: CATEGORY_DOT_SIZE / 2,
  },
  classificationText: {
    ...REGULAR_12,
    flexShrink: 1,
    color: TEXT_TERTIARY,
  },
  categoryName: {
    ...SEMI_BOLD_12,
    color: colors.textLabel,
  },
  summaryColumn: {
    flexShrink: 0,
    alignItems: "flex-end",
    gap: spacing[2],
  },
  summary: {
    ...MEDIUM_12,
    textAlign: "right",
    color: colors.textLabel,
  },
  // Figma `9522:43884` : calée à gauche de la colonne de la synthèse.
  estimatedDuration: {
    ...MEDIUM_11,
    alignSelf: "flex-start",
    color: colors.textLabel,
  },
  sideChange: {
    position: "absolute",
    top: SIDE_CHANGE_ICON_TOP,
    right: spacing[14],
    width: SIDE_CHANGE_ICON_SIZE,
    height: SIDE_CHANGE_ICON_SIZE,
  },
});
