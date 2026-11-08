import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { MediaPreview, type MediaPreviewSource, useMediaUriResolver } from "@/features/activities/MediaPreview";
import { isIncompleteSummary, isToVerifySummary, type OccurrenceCategory } from "@/features/sessions/compositionPresentation";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { formatPrimeDuration } from "@/domain/activities/durationFormat";
import { toVerifyColors } from "@/shared/ui/toVerifyColors";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
import { borderWidths, colors, fixedRadii, spacing, type } from "@/shared/ui/tokens";

/**
 * Carte d'exercice de la Composition — composant « DSF / Cards / Exercice — Composition » (Figma
 * `11810:2159`, page « Design system — Fondations » ; variantes « Hors circuit » `11810:2102` et
 * « Dans un circuit » `11810:2132` ; écran de référence `11789:21914`). Décisions D-511 et D-513
 * (Hermann, 06/11/2026) ; demande de Hermann du 08/11/2026 (« Utiliser le composant « Carte
 * d'exercice » dans la Composition de séance »).
 * [Carte v2 de 370 × 80 (PRE-6 story 5.1, D-435, Figma `9798:44464`) : média à 8 du bord, rayon 12,
 * bord 1 `#E4E7EF` hors Circuit et aucun dans le Circuit, colonne des valeurs avec le symbole de durée
 * (chronomètre) et la durée estimée « / ≈ … » — remplacée le 08/11/2026.]
 */

/**
 * Liseré de la carte : couleur des cartes de séance (`colors.cardsBorder`, `#CCD1E0`) à 50 %
 * d'opacité — même valeur dérivée que `SessionCard` (D-504) et la carte Mouvement (D-508).
 * [`#E4E7EF` plein (carte v2) — remplacé le 08/11/2026.]
 */
export const OCCURRENCE_CARD_BORDER_COLOR = "rgba(204, 209, 224, 0.5)";
/** Hermann, 09/11/2026 : « Couleur pleine pour la couleur du liseré de l’exercice hors circuit et cycle. Pour le reste ne change rien. » Carte directement dans la Séance : `colors.cardsBorder` (#CCD1E0) plein. */
export const OCCURRENCE_CARD_SESSION_LEVEL_BORDER_COLOR = colors.cardsBorder;
/**
 * Épaisseur du liseré de la carte (D-511 : 0,5) — dans un Circuit ou un Cycle depuis le 08/11/2026 au soir ; directement dans
 * la Séance : `OCCURRENCE_CARD_SESSION_LEVEL_HAIRLINE_WIDTH` (0,75). Valeurs du thème (`borderWidths`). [Carte v2 : 1 — remplacé le 08/11/2026.]
 */
export const OCCURRENCE_CARD_HAIRLINE_WIDTH = borderWidths.exerciseCard;
/** Hermann, 08/11/2026 au soir : « Sur l'écran de composition de séance, change uniquement le liseré de la carte d'exercice lorsqu'elle est hors circuit (directement dans la séance, pas dans un circuit ni un cycle). Épaisseur : 0,75 pt (au lieu de 0,5 pt). Couleur #CCD1E0, tracé à l'intérieur de la carte, rayon 12 pt : inchangés. Le liseré de la carte d'exercice dans un circuit reste à 0,5 pt. Centralise la valeur dans une constante de thème ». */
export const OCCURRENCE_CARD_SESSION_LEVEL_HAIRLINE_WIDTH = borderWidths.exerciseCardSessionLevel;
/**
 * Fond du gabarit photo (Figma `color/cards/media-placeholder`, `#EEF0F6`) : hors registre ch12,
 * constante locale (choix D5 ; DSF-CARTES, exception v2).
 */
export const OCCURRENCE_CARD_MEDIA_BACKGROUND = "#EEF0F6";
/**
 * Rayon UNIQUE de la carte (12), partagé par la surface, le groupe d'actions glissées et l'état
 * soulevé (même silhouette partout).
 */
export const OCCURRENCE_CARD_RADIUS = fixedRadii[12];
/**
 * Liseré d'une carte à compléter (rouge, recette du 29/10), à vérifier (transparent) et de l'état
 * soulevé (`#D1D1D6`) : 1, inchangé.
 */
export const OCCURRENCE_CARD_BORDER_WIDTH = 1;
/** Hauteur de la carte (D-511 : 72), quelle que soit la variante. [Carte v2 : 80 — remplacé le 08/11/2026.] */
export const OCCURRENCE_CARD_HEIGHT = 72;

/** Photo (D-511) : 64 × 64 à 4 du bord extérieur, rayon 8 (concentrique : 12 − 4) ; bord 1 `#7A7A80` sans photo. */
const MEDIA_SIZE = 64;
const MEDIA_INSET = spacing[4];
const MEDIA_RADIUS = fixedRadii[8];
const MEDIA_FRAME_BORDER = 1;
/** Textes à 8 de la photo (Figma : ligne 1 à x 76 depuis le bord extérieur). */
const MEDIA_TEXT_GAP = spacing[8];
/** Valeurs de droite terminées à 12 du bord extérieur (Figma : x 350 dans une carte de 362). */
const VALUE_RIGHT_INSET = spacing[12];

/**
 * Grille verticale (D-511) : lignes à 8, 30 et 48 du haut de la carte ; ligne 1 de 20, lignes 2 et 3
 * de 16 (Figma `11810:2107`, `11810:2110`, `11810:2120`). Exportée pour les tests.
 */
export const OCCURRENCE_CARD_LINES = {
  nameTop: 8,
  nameHeight: 20,
  workTop: 30,
  workHeight: 16,
  zonesTop: 48,
  zonesHeight: 16,
} as const;
/**
 * Icônes des lignes 2 et 3 centrées dans une colonne de 10 (D-511) ; les pastilles et le sablier sont
 * dessinés à 13 (Figma), débordant de 1,5 de chaque côté de la colonne. Textes à 7 de la colonne
 * (Figma : pastille de 13 à x 75, texte à x 93), comme la carte Séance (`SessionCard`, D-504).
 */
export const OCCURRENCE_CARD_SYMBOL_COLUMN = 10;
const SYMBOL_SIZE = 13;
const SYMBOL_TEXT_GAP = 7;
/** Écart entre les éléments de droite d'une ligne (Figma : 5). */
const VALUE_GAP = 5;

/**
 * Position de la photo depuis les bords extérieurs de la carte : ancre du rail (centré sur la photo,
 * il s'arrête à ses bords haut et bas) et du bouton « Ouvrir le mouvement ».
 */
export const OCCURRENCE_CARD_MEDIA = {
  top: MEDIA_INSET,
  centerX: MEDIA_INSET + MEDIA_SIZE / 2,
  bottom: MEDIA_INSET + MEDIA_SIZE,
} as const;

/** Texte Regular 12 / 16 (Figma : catégorie, zones, rôle, durée de récupération). */
const REGULAR_12 = { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 12, lineHeight: 16 } as const;
/** Prescription (D-511) : Semi Bold 12 / 16, `text-primary`. */
const SEMI_BOLD_12 = { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 12, lineHeight: 16 } as const;

/** Hauteur de la carte : 72 dans toutes les variantes ; `predictedInsertionHeight` garde son calcul. */
export function occurrenceCardHeight(): number {
  return OCCURRENCE_CARD_HEIGHT;
}

/**
 * Surface de la carte (D-511) : fond blanc, liseré 0,5 à 50 %, rayon 12 — dans le Circuit comme hors
 * Circuit — portée par le `Pressable` de l'occurrence (`CompositionActivityRow`), qui garde gestes,
 * balayage et état soulevé. [Dans le Circuit, aucun bord (`occurrenceCardInCircuitSurface`, D-435) —
 * remplacé le 08/11/2026 : les deux variantes ont le même liseré.]
 */
export const occurrenceCardSurface = {
  backgroundColor: colors.background,
  borderWidth: OCCURRENCE_CARD_HAIRLINE_WIDTH,
  borderColor: OCCURRENCE_CARD_BORDER_COLOR,
  borderRadius: OCCURRENCE_CARD_RADIUS,
} as const;

/**
 * PRE-7 (D-448, point 7, recette JA2 nv-5) : fond d'une carte dont la prescription est « Paramètres à
 * compléter. ». PRE-9, recette iPhone du 29/10 (Hermann : « ajouter un liseré fin rouge à la carte ») :
 * bord de 1 `colors.danger`. L'état soulevé garde le sien.
 */
export const occurrenceCardIncompleteSurface = {
  backgroundColor: colors.dangerSurface,
  borderWidth: OCCURRENCE_CARD_BORDER_WIDTH,
  borderColor: colors.danger,
} as const;

/**
 * PRE-9 — recette iPhone n° 2 du 31/10/2026 (constat e) : carte « Paramètre à vérifier », en orange
 * (`toVerifyColors`) ; « Paramètres à compléter » prime. Hermann, 08/11/2026 (« pas de liseré
 * orange ») : bord transparent. [Liseré `toVerifyColors.border` — retiré le 08/11/2026.]
 */
export const occurrenceCardToVerifySurface = {
  backgroundColor: toVerifyColors.surface,
  borderWidth: OCCURRENCE_CARD_BORDER_WIDTH,
  borderColor: "transparent",
} as const;

/** Variante du composant : déduite de l'appartenance effective à un Circuit (un Cycle n'en est pas un). */
export type OccurrenceCardVariant = "OUT_OF_CIRCUIT" | "IN_CIRCUIT";

export type OccurrenceCardProps = {
  /** Nom affiché (suffixe de copie compris), sans le niveau, qui a sa place à droite. */
  readonly name: string;
  /** « Niveau N » si le mouvement a un niveau ; `null` : l'espace revient au nom. */
  readonly level: string | null;
  readonly category: OccurrenceCategory | null;
  /** Zones corporelles déjà formatées (`formatExerciseBodyZones`), `null` sans zone. */
  readonly bodyZones: string | null;
  /** Prescription (`formatOccurrenceSummary`) : nombre de séries et cible, ou départ et incrément. */
  readonly summary: string;
  /** `true` seulement si l'exercice a un changement de côté (bilatéral). */
  readonly hasSideChange: boolean;
  /** « Hors circuit » (pictogramme noir) ou « Dans un circuit » (pictogramme gris). */
  readonly variant: OccurrenceCardVariant;
  /**
   * Épaisseur du bord porté par le `Pressable` de l'appelant (0,5, ou 1 à compléter, à vérifier ou
   * soulevée) : le contenu est mesuré depuis le bord EXTÉRIEUR, il ne bouge pas quand le bord change.
   */
  readonly borderWidth: number;
  /** Rôle « Buy-in » / « Buy-out » du membre d'un Circuit porteur ; `null` sinon. */
  readonly role?: string | null;
  /** Récupération après l'exercice (secondes) ; absente, nulle ou 0 : ni sablier ni valeur. */
  readonly recoverySeconds?: number | null;
  /** En placement, le contenu est retiré de l'accessibilité (seuls les emplacements répondent). */
  readonly hideContentFromAccessibility?: boolean;
  /** Arbitrage D6 (PR #391) : en placement, la carte est grisée. */
  readonly attenuated?: boolean;
  /** Premier média de l'occurrence (`firstMediaPreviewSource`) ; `null` ou absent : pictogramme. */
  readonly media?: MediaPreviewSource | null;
  readonly sideChangeTestID?: string;
  readonly roleTestID?: string;
  readonly recoveryTestID?: string;
};

/**
 * PRE-6 story 5.1b : photo, ou image d'affiche d'une vidéo, dans le gabarit 64 × 64, par le
 * mécanisme de la vignette du Catalogue (`MediaPreview`) ; place réservée pendant la génération de
 * l'affiche ; média définitivement indisponible → pictogramme, comme sans média.
 */
function OccurrenceMediaPreview({ source, variant }: { source: MediaPreviewSource; variant: OccurrenceCardVariant }) {
  const resolveUri = useMediaUriResolver();
  return (
    <MediaPreview
      uri={resolveUri(source.uri)}
      isVideo={source.isVideo}
      imageStyle={styles.mediaImage}
      fallbackStyle={styles.mediaPlaceholder}
      unavailable={<GenericMediaIcon variant={variant} />}
      imageTestID="composition-exercise-media-image"
      fallbackTestID="composition-exercise-media-placeholder"
    />
  );
}

/** Pictogramme du gabarit : noir hors Circuit (`11810:2104`), gris dans un Circuit (`11810:2134`). */
function GenericMediaIcon({ variant }: { variant: OccurrenceCardVariant }) {
  return variant === "OUT_OF_CIRCUIT" ? (
    <KodjoIcon name="card-media-exercise-out-of-circuit" testID="composition-exercise-media-icon" />
  ) : (
    <KodjoIcon name="card-media-exercise" testID="composition-exercise-media-icon" />
  );
}

/** Icône de 13 centrée dans la colonne de 10 des lignes 2 et 3. */
function SymbolColumn({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <View style={styles.symbolColumn} testID={testID}>
      {children}
    </View>
  );
}

/** Props qui retirent un élément (et ses descendants) de l'accessibilité, iOS et Android. */
const HIDDEN_FROM_ACCESSIBILITY = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

/**
 * Contenu de la carte d'exercice de la Composition (D-511) :
 * - photo 64 × 64 à 4 du bord, rayon 8 ; premier média de l'occurrence, sinon le pictogramme de la
 *   variante ;
 * - ligne 1 (y 8) : nom Semi Bold 15, tronqué avant le niveau ; niveau Medium 12 `text-primary` à
 *   droite, sur la ligne de base du nom ; sans niveau, l'espace revient au nom ;
 * - ligne 2 (y 30) : pastille et catégorie ; à droite, changement de côté puis prescription Semi
 *   Bold 12 `text-primary` ; aucun chronomètre ;
 * - ligne 3 (y 48) : pastille et zones ; à droite, rôle Buy-in / Buy-out puis sablier et durée de
 *   récupération (Regular 12 `text-secondary`) lorsqu'une récupération est prévue.
 *
 * Aucun chevron : la carte ne se déplie pas. Non interactive : l'appelant porte surface, gestes,
 * actions et nom accessibles.
 */
export function OccurrenceCard({
  name,
  level,
  category,
  bodyZones,
  summary,
  hasSideChange,
  variant,
  borderWidth,
  role = null,
  recoverySeconds = null,
  hideContentFromAccessibility = false,
  attenuated = false,
  media = null,
  sideChangeTestID,
  roleTestID,
  recoveryTestID,
}: OccurrenceCardProps) {
  const hidden = hideContentFromAccessibility ? HIDDEN_FROM_ACCESSIBILITY : null;
  const hasRecovery = typeof recoverySeconds === "number" && Number.isFinite(recoverySeconds) && recoverySeconds > 0;
  const summaryTone = isIncompleteSummary(summary) ? styles.incompleteSummary : isToVerifySummary(summary) ? styles.toVerifySummary : null;
  return (
    <View
      // Repère : le bord EXTÉRIEUR de la carte, quelle que soit l'épaisseur du bord de l'appelant ; la
      // carte de 72 est centrée verticalement (l'état soulevé, plus haut de 4, ne déplace pas le contenu).
      style={[styles.frame, { top: -borderWidth, left: -borderWidth, right: -borderWidth, bottom: -borderWidth }]}
      pointerEvents="box-none"
      testID="composition-activity-main-card"
      {...hidden}
    >
      <View style={[styles.content, attenuated ? styles.attenuated : null]} pointerEvents="box-none" testID="composition-exercise-card-content">
        <View style={[styles.media, media !== null ? styles.mediaWithPhoto : null]} testID="composition-exercise-media">
          {media !== null ? <OccurrenceMediaPreview source={media} variant={variant} /> : <GenericMediaIcon variant={variant} />}
        </View>
        <View style={styles.nameRow} testID="composition-exercise-name-row">
          <Text style={styles.name} numberOfLines={1} testID="composition-exercise-name">
            {name}
          </Text>
          {level !== null ? (
            <Text style={styles.level} numberOfLines={1} testID="composition-exercise-level">
              {level}
            </Text>
          ) : null}
        </View>
        <View style={[styles.line, styles.workLine]} testID="composition-exercise-work-row">
          {category !== null ? (
            <>
              <SymbolColumn testID="composition-exercise-category-column">
                <KodjoIcon name="card-category-badge" testID="composition-exercise-category-badge" />
              </SymbolColumn>
              <Text style={styles.label} numberOfLines={1} testID="composition-exercise-category">
                {category.name}
              </Text>
            </>
          ) : (
            <View style={styles.spacer} />
          )}
          {hasSideChange ? (
            <View style={styles.sideChange} testID={sideChangeTestID}>
              <KodjoIcon name="card-side-change" testID="composition-exercise-side-change-icon" />
            </View>
          ) : null}
          <Text style={[styles.prescription, summaryTone]} numberOfLines={1} testID="composition-exercise-summary">
            {summary}
          </Text>
        </View>
        <View style={[styles.line, styles.zonesLine]} testID="composition-exercise-zones-line">
          {bodyZones !== null ? (
            <>
              <SymbolColumn testID="composition-exercise-body-zones-column">
                <KodjoIcon name="card-body-zone-badge" testID="composition-exercise-body-zones-badge" />
              </SymbolColumn>
              <Text style={styles.label} numberOfLines={1} testID="composition-exercise-body-zones">
                {bodyZones}
              </Text>
            </>
          ) : (
            <View style={styles.spacer} />
          )}
          {role !== null ? (
            <Text style={styles.role} numberOfLines={1} testID={roleTestID ?? "composition-exercise-role"}>
              {role}
            </Text>
          ) : null}
          {hasRecovery ? (
            // Story 7.2 (D-442) : simple affichage — ni bouton ni élément accessible propre (la carte porte la valeur dans son
            // nom), le toucher traverse jusqu'à la carte.
            <View
              accessible={false}
              importantForAccessibility="no"
              style={[styles.recovery, styles.passThrough]}
              testID={recoveryTestID ?? "composition-exercise-recovery"}
            >
              <SymbolColumn testID="composition-recovery-line-column">
                <KodjoIcon name="card-recovery-hourglass" testID="composition-recovery-line-icon" />
              </SymbolColumn>
              <Text style={styles.recoveryValue} numberOfLines={1} testID="composition-recovery-line-label">
                {formatPrimeDuration(recoverySeconds)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const TEXT_LEFT = MEDIA_INSET + MEDIA_SIZE + MEDIA_TEXT_GAP;

const styles = StyleSheet.create({
  frame: {
    position: "absolute",
    justifyContent: "center",
  },
  // La carte de 72, depuis son bord extérieur.
  content: {
    height: OCCURRENCE_CARD_HEIGHT,
  },
  // Arbitrage D6 : grisé de la carte en placement.
  attenuated: {
    opacity: UNSELECTED_OPACITY,
  },
  media: {
    position: "absolute",
    top: MEDIA_INSET,
    left: MEDIA_INSET,
    width: MEDIA_SIZE,
    height: MEDIA_SIZE,
    borderRadius: MEDIA_RADIUS,
    borderWidth: MEDIA_FRAME_BORDER,
    borderColor: TEXT_TERTIARY,
    backgroundColor: OCCURRENCE_CARD_MEDIA_BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  // Figma (« Photo — image » `11810:2106`) : la photo couvre tout le gabarit, bord compris.
  mediaWithPhoto: {
    borderWidth: 0,
  },
  mediaImage: {
    width: "100%",
    height: "100%",
    borderRadius: MEDIA_RADIUS,
  },
  // Place réservée : le fond du gabarit, sans icône (chargement, photo illisible, affiche absente).
  mediaPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: OCCURRENCE_CARD_MEDIA_BACKGROUND,
  },
  // Ligne 1 : nom et niveau, alignés sur la ligne de base du nom.
  nameRow: {
    position: "absolute",
    top: OCCURRENCE_CARD_LINES.nameTop,
    left: TEXT_LEFT,
    right: VALUE_RIGHT_INSET,
    height: OCCURRENCE_CARD_LINES.nameHeight,
    // Nom (interligne 18) centré dans la ligne de 20 (Figma : y 9).
    paddingTop: (OCCURRENCE_CARD_LINES.nameHeight - type.listCardTitle.lineHeight) / 2,
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing[8],
  },
  name: {
    ...type.listCardTitle,
    flex: 1,
    minWidth: 0,
    color: colors.textPrimary,
  },
  level: {
    ...type.movementCardLevel,
    flexShrink: 0,
    color: colors.textPrimary,
  },
  line: {
    position: "absolute",
    left: TEXT_LEFT,
    right: VALUE_RIGHT_INSET,
    flexDirection: "row",
    alignItems: "center",
    gap: VALUE_GAP,
  },
  workLine: {
    top: OCCURRENCE_CARD_LINES.workTop,
    height: OCCURRENCE_CARD_LINES.workHeight,
  },
  zonesLine: {
    top: OCCURRENCE_CARD_LINES.zonesTop,
    height: OCCURRENCE_CARD_LINES.zonesHeight,
  },
  symbolColumn: {
    width: OCCURRENCE_CARD_SYMBOL_COLUMN,
    height: SYMBOL_SIZE,
    // Texte à 7 de la colonne : écart de la ligne (5) + 2.
    marginRight: SYMBOL_TEXT_GAP - VALUE_GAP,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  spacer: {
    flex: 1,
  },
  label: {
    ...REGULAR_12,
    flex: 1,
    minWidth: 0,
    color: TEXT_TERTIARY,
  },
  sideChange: {
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  // Prescription : jamais abrégée — catégorie et zones cèdent la place.
  prescription: {
    ...SEMI_BOLD_12,
    flexShrink: 0,
    color: colors.textPrimary,
  },
  // PRE-7 (D-448, point 7) : « Paramètres à compléter. » en `colors.danger`.
  incompleteSummary: {
    color: colors.danger,
  },
  // Recette iPhone n° 2 (constat e) : « Paramètre à vérifier » en orange.
  toVerifySummary: {
    color: toVerifyColors.text,
  },
  role: {
    ...REGULAR_12,
    flexShrink: 0,
    color: TEXT_TERTIARY,
  },
  // Sablier dans la colonne de 10, durée à 7 (Figma : sablier de 13 puis 5).
  recovery: {
    flexDirection: "row",
    alignItems: "center",
    gap: VALUE_GAP,
    flexShrink: 0,
  },
  passThrough: {
    pointerEvents: "none",
  },
  recoveryValue: {
    ...REGULAR_12,
    color: colors.textSecondary,
  },
});
