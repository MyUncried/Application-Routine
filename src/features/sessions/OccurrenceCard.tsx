import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { OccurrenceCategory } from "@/features/sessions/compositionPresentation";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, fixedRadii, spacing, type } from "@/shared/ui/tokens";

/**
 * Bord de la carte hors Circuit (Figma `9798:44464`, `#E4E7EF`) : couleur absente du registre ch12,
 * constante locale (choix D5 de l'epic 5 ; DSF-CARTES « Exception locale — Cartes de Composition de
 * séance v2 », ch13 CE-T03-08 §9). Ajout au registre proposé au lot documentaire.
 */
export const OCCURRENCE_CARD_BORDER_COLOR = "#E4E7EF";
/**
 * Fond du gabarit média (Figma `9798:19906`, variable `color/cards/media-placeholder`, `#EEF0F6`) :
 * hors registre ch12, constante locale (choix D5 ; DSF-CARTES, exception v2).
 */
export const OCCURRENCE_CARD_MEDIA_BACKGROUND = "#EEF0F6";
/**
 * Rayon UNIQUE de la carte d'occurrence (Figma `9798:44464` : 12 ; D-435), partagé par la surface,
 * le groupe d'actions glissées et l'état soulevé (même silhouette partout).
 */
export const OCCURRENCE_CARD_RADIUS = fixedRadii[12];
/** Épaisseur du bord hors Circuit (Figma : 1). */
export const OCCURRENCE_CARD_BORDER_WIDTH = 1;
/** Hauteur de la carte v2 (Figma `9798:44464` : 80 ; D-435), quelle que soit la variante. */
export const OCCURRENCE_CARD_HEIGHT = 80;

/** Gabarit média (Figma `9798:19906`) : 64 × 64, rayon 12, bord 1 `#7A7A80`, icône 24 centrée. */
const MEDIA_SIZE = 64;
const MEDIA_RADIUS = fixedRadii[12];
/** Marge gauche de la carte jusqu'au média (Figma : 8, à l'intérieur du bord). */
const CARD_PADDING_LEFT = spacing[8];
/**
 * Bord droit des valeurs, du symbole de côté et de la récupération : 8 du bord extérieur de la carte
 * (Figma : x 362 dans une carte de 370, avec ou sans bord ; ch13 « valeurs alignées sur x378 » à 402).
 */
const CARD_VALUE_INSET = spacing[8];
/** Écart média → texte (Figma : 12). */
const MEDIA_TEXT_GAP = spacing[12];

/** Lignes du texte (Figma `9798:19910`, cadre de 58 centré dans la carte de 80). */
const NAME_LINE_HEIGHT = type.listCardTitle.lineHeight; // 18
/** Écart nom → ligne 2 (Figma : 18 → 23, soit 5). */
const NAME_TO_WORK_GAP = 5;
/** Ligne 2, Catégorie et travail (Figma : cadre de 16). */
const WORK_LINE_HEIGHT = 16;
/** Écart ligne 2 → ligne 3 (Figma : 39 → 41, soit 2). */
const WORK_TO_ZONES_GAP = spacing[2];
/** Ligne 3, Zones et récupération (Figma : cadre de 17 dont 2 en haut). */
const ZONES_LINE_HEIGHT = 17;
const ZONES_LINE_PADDING_TOP = spacing[2];

/**
 * Géométrie verticale du cadre de texte, centré dans la carte (Figma `9798:19910` : 58). Exportée
 * pour la cible tactile de la récupération et pour les tests, qui la vérifient sans littéral.
 */
export const OCCURRENCE_CARD_TEXT_FRAME = {
  nameLineHeight: NAME_LINE_HEIGHT,
  nameToWorkGap: NAME_TO_WORK_GAP,
  workLineHeight: WORK_LINE_HEIGHT,
  workToZonesGap: WORK_TO_ZONES_GAP,
  zonesLineHeight: ZONES_LINE_HEIGHT,
  zonesLinePaddingTop: ZONES_LINE_PADDING_TOP,
  height: NAME_LINE_HEIGHT + NAME_TO_WORK_GAP + WORK_LINE_HEIGHT + WORK_TO_ZONES_GAP + ZONES_LINE_HEIGHT,
} as const;

/**
 * Cible tactile de la récupération en ligne 3 (revue de la story 5.1, écart assumé au choix D7,
 * soumis à Hermann au jalon J4) : la ligne 2 n'est jamais couverte — vers le haut, la marge s'arrête
 * au bas de la ligne 2 (écart 2 entre les lignes + 2 de marge haute de la ligne 3) ; vers le bas,
 * elle descend jusqu'au bord intérieur de la carte, sans le franchir. Aucune marge latérale. Hauteur
 * obtenue : 15 + 4 + 10 = 29 avec bord, 30 sans bord, au lieu de 44.
 */
export function occurrenceRecoveryHitSlop(bordered: boolean): { readonly top: number; readonly bottom: number } {
  const border = bordered ? OCCURRENCE_CARD_BORDER_WIDTH : 0;
  const innerHeight = OCCURRENCE_CARD_HEIGHT - 2 * border;
  return {
    top: WORK_TO_ZONES_GAP + ZONES_LINE_PADDING_TOP,
    bottom: (innerHeight - OCCURRENCE_CARD_TEXT_FRAME.height) / 2,
  };
}

/** Pastilles et symboles dessinés à 13 (Figma `9798:19913`, `9798:19919`, `9798:19927`). */
const SYMBOL_GAP = spacing[6];
/** Écart entre le nom et l'icône de changement de côté. */
const NAME_SIDE_CHANGE_GAP = spacing[12];
/** Écart entre la colonne de gauche (Catégorie, Zones) et la colonne des symboles. */
const COLUMNS_GAP = spacing[4];
/**
 * Colonne des symboles et des valeurs, exprimée par rapport à la largeur utile du texte et au bord
 * droit (jamais un x d'exemple) : au moins 35 % de la largeur utile (Figma à 402 : 96 sur 277, du
 * symbole x 266 au bord des valeurs x 362), élargie au besoin par la valeur la plus longue
 * (« 10 rép. / ≈ 1 min ») ; au plus 60 %, la valeur s'abrégeant alors par une ellipse.
 */
const VALUE_COLUMN_MIN_WIDTH = "35%";
const VALUE_COLUMN_MAX_WIDTH = "60%";

/** Texte secondaire (Figma : Inter Regular 12, `#7A7A80`, interligne « normal » 15). */
const REGULAR_12 = { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 12, lineHeight: 15 } as const;

/**
 * Hauteur de la carte. PRE-6 story 5.1 (D-435) : 80 dans toutes les variantes ; le couple
 * Répétitions + cadence reste sur la ligne 2 (DSF-CARTES, exception v2). Elle ne dépend plus de la
 * durée estimée (stories 2.2 et 2.3b : 64 / 70) ; `predictedInsertionHeight` garde son calcul.
 */
export function occurrenceCardHeight(): number {
  return OCCURRENCE_CARD_HEIGHT;
}

/**
 * Surface de la carte hors Circuit (fond blanc, bord 1 `#E4E7EF`, rayon 12) — portée par le
 * `Pressable` de l'occurrence (`CompositionActivityRow`), qui garde gestes, balayage et état
 * soulevé : l'état soulevé remplace fond, bord et rayon comme avant.
 */
export const occurrenceCardSurface = {
  backgroundColor: colors.background,
  borderWidth: OCCURRENCE_CARD_BORDER_WIDTH,
  borderColor: OCCURRENCE_CARD_BORDER_COLOR,
  borderRadius: OCCURRENCE_CARD_RADIUS,
} as const;

/** Dans le Circuit, aucun bord (D-435, Figma `9819:19961`) ; l'état soulevé garde le sien. */
export const occurrenceCardInCircuitSurface = { borderWidth: 0 } as const;

export type OccurrenceCardProps = {
  readonly name: string;
  readonly category: OccurrenceCategory | null;
  /** Zones corporelles déjà formatées (`formatExerciseBodyZones`), `null` sans zone. */
  readonly bodyZones: string | null;
  /** Synthèse D-238 (`formatOccurrenceSummary`). */
  readonly summary: string;
  /** Durée estimée (Répétitions avec bip), affichée après la synthèse sur la ligne 2 ; `null` sinon. */
  readonly estimatedDuration: string | null;
  /** `true` seulement si l'exercice a un changement de côté (bilatéral). */
  readonly hasSideChange: boolean;
  /** Carte dans le Circuit : le média est à 8 du bord extérieur (8 à l'intérieur du bord hors Circuit). */
  readonly inCircuit: boolean;
  /**
   * Bord affiché : hors Circuit, et dans le Circuit à l'état soulevé. Les marges compensent ce bord,
   * pour que ni le média ni le contenu ne bougent quand il apparaît ; le bord des valeurs reste à 8
   * du bord extérieur.
   */
  readonly bordered: boolean;
  /** Récupération de la ligne 3 (`OccurrenceRecovery`), `null` si rien n'est affichable. */
  readonly recovery: ReactNode;
  readonly sideChangeTestID?: string;
};

/**
 * Contenu de la carte d'occurrence de la Composition, v2 (PRE-6 story 5.1, D-435, Figma
 * `9798:44464`, instances `9798:19935` hors Circuit et `9819:19961` dans le Circuit ; ch08
 * « Présentation des occurrences — révision du 21/10/2026 » ; ch13 CE-T03-08 §7-§10) :
 * - média : gabarit 64 × 64 avec l'icône générique (choix D3), jamais une photo ;
 * - ligne 1 : nom (Inter Semi Bold 15, `#141414`, ellipse) et, à droite, l'icône neutre de
 *   changement de côté, absente sans changement de côté (RM-243, D-407, ARB-2) ;
 * - ligne 2 : pastille et Catégorie (Regular 12, `#7A7A80`, ellipse), puis, dans la colonne des
 *   symboles, le symbole de durée et la synthèse de travail calée à droite (avec la durée estimée
 *   des Répétitions avec bip : « 10 rép. / ≈ 1 min ») ;
 * - ligne 3 : pastille et Zones corporelles (coupées avant la colonne), puis la récupération
 *   fournie par l'appelant (sablier dans la colonne des symboles, valeur calée à droite).
 *
 * Catégorie et Zones viennent de leurs propriétés structurées (`resolveOccurrenceCategory`,
 * `formatExerciseBodyZones`), jamais d'un découpage. Sans Catégorie ou sans Zone : la pastille et
 * le libellé correspondants sont absents, la hauteur ne change pas. Aucune poignée (D-435) :
 * l'appui long reste porté par toute la carte. Non interactif hors la récupération : l'appelant
 * porte surface, gestes et nom accessible.
 */
export function OccurrenceCard({
  name,
  category,
  bodyZones,
  summary,
  estimatedDuration,
  hasSideChange,
  inCircuit,
  bordered,
  recovery,
  sideChangeTestID,
}: OccurrenceCardProps) {
  const border = bordered ? OCCURRENCE_CARD_BORDER_WIDTH : 0;
  return (
    <View
      style={[
        styles.content,
        {
          // Hors Circuit, le média est à 8 À L'INTÉRIEUR du bord (Figma x 9) ; dans le Circuit, à 8
          // du bord extérieur, bord de l'état soulevé compris.
          paddingLeft: inCircuit ? CARD_PADDING_LEFT - border : CARD_PADDING_LEFT,
          // Le bord droit des valeurs est mesuré depuis le bord EXTÉRIEUR.
          paddingRight: CARD_VALUE_INSET - border,
        },
      ]}
      testID="composition-activity-main-card"
    >
      <View style={styles.media} testID="composition-exercise-media">
        <KodjoIcon name="card-media-exercise" testID="composition-exercise-media-icon" />
      </View>
      <View style={styles.textColumn}>
        <View style={styles.nameRow} testID="composition-exercise-name-row">
          <Text style={styles.name} numberOfLines={1} testID="composition-exercise-name">
            {name}
          </Text>
          {hasSideChange ? (
            <View style={styles.sideChange} testID={sideChangeTestID}>
              <KodjoIcon name="card-side-change" testID="composition-exercise-side-change-icon" />
            </View>
          ) : null}
        </View>
        <View style={styles.body} testID="composition-exercise-secondary-row">
          <View style={styles.labelsColumn} testID="composition-exercise-labels-column">
            <View style={styles.workLine} testID="composition-exercise-classification">
              {category !== null ? (
                <>
                  <KodjoIcon name="card-category-badge" testID="composition-exercise-category-badge" />
                  <Text style={styles.label} numberOfLines={1} testID="composition-exercise-category">
                    {category.name}
                  </Text>
                </>
              ) : null}
            </View>
            <View style={styles.zonesLine} testID="composition-exercise-zones-line">
              {bodyZones !== null ? (
                <>
                  <KodjoIcon name="card-body-zone-badge" testID="composition-exercise-body-zones-badge" />
                  <Text style={styles.label} numberOfLines={1} testID="composition-exercise-body-zones">
                    {bodyZones}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
          <View style={styles.valuesColumn} testID="composition-exercise-values-column">
            <View style={[styles.workLine, styles.valueRow]}>
              <KodjoIcon name="card-work-duration" testID="composition-exercise-work-symbol" />
              <View style={styles.work} testID="composition-exercise-work">
                <Text style={[styles.value, styles.summary]} numberOfLines={1} testID="composition-exercise-summary">
                  {summary}
                </Text>
                {estimatedDuration !== null ? (
                  <>
                    <Text style={[styles.value, styles.separator]} testID="composition-exercise-estimate-separator">
                      {strings.screens.composition.occurrenceCard.workEstimateSeparator}
                    </Text>
                    <Text
                      style={[styles.value, styles.estimate]}
                      numberOfLines={1}
                      testID="composition-exercise-estimated-duration"
                    >
                      {estimatedDuration}
                    </Text>
                  </>
                ) : null}
              </View>
            </View>
            <View style={styles.recoveryLine} testID="composition-exercise-recovery-slot">
              {recovery}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: MEDIA_TEXT_GAP,
  },
  media: {
    width: MEDIA_SIZE,
    height: MEDIA_SIZE,
    borderRadius: MEDIA_RADIUS,
    borderWidth: OCCURRENCE_CARD_BORDER_WIDTH,
    borderColor: TEXT_TERTIARY,
    backgroundColor: OCCURRENCE_CARD_MEDIA_BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    height: NAME_LINE_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: NAME_SIDE_CHANGE_GAP,
  },
  name: {
    ...type.listCardTitle,
    flex: 1,
    color: colors.textPrimary,
  },
  sideChange: {
    width: 16,
    height: 16,
  },
  body: {
    marginTop: NAME_TO_WORK_GAP,
    flexDirection: "row",
    gap: COLUMNS_GAP,
  },
  labelsColumn: {
    flex: 1,
    minWidth: 0,
    gap: WORK_TO_ZONES_GAP,
  },
  valuesColumn: {
    flexShrink: 0,
    minWidth: VALUE_COLUMN_MIN_WIDTH,
    maxWidth: VALUE_COLUMN_MAX_WIDTH,
    gap: WORK_TO_ZONES_GAP,
  },
  workLine: {
    height: WORK_LINE_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: SYMBOL_GAP,
  },
  zonesLine: {
    height: ZONES_LINE_HEIGHT,
    paddingTop: ZONES_LINE_PADDING_TOP,
    flexDirection: "row",
    alignItems: "center",
    gap: SYMBOL_GAP,
  },
  // Ligne 3 de la colonne des valeurs : la récupération (`OccurrenceRecovery`, sablier puis valeur
  // calée à droite) occupe toute la largeur de la colonne, sablier sous le symbole de durée.
  recoveryLine: {
    height: ZONES_LINE_HEIGHT,
    paddingTop: ZONES_LINE_PADDING_TOP,
    justifyContent: "center",
  },
  valueRow: {
    alignSelf: "stretch",
  },
  label: {
    ...REGULAR_12,
    flexShrink: 1,
    color: TEXT_TERTIARY,
  },
  // Synthèse (et durée estimée) calée à droite de la colonne ; seule la synthèse s'abrège.
  work: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  // Priorité de réduction de la ligne 2 (revue 5.1) : la durée estimée s'abrège d'abord, la
  // synthèse de travail ensuite seulement ; le séparateur ne se réduit jamais.
  summary: {
    flexShrink: 1,
    textAlign: "right",
  },
  separator: {
    flexShrink: 0,
  },
  estimate: {
    flexShrink: 1000,
  },
  value: {
    ...REGULAR_12,
    color: TEXT_TERTIARY,
  },
});
