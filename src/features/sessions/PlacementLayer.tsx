import { Pressable, StyleSheet, Text, View } from "react-native";

import { isPlacementStopPointAdded, type PlacementDraft } from "@/domain/sessions/placement";
import type { StopPointLocation } from "@/domain/sessions/StopPoint";
import { formatCompactDuration } from "@/features/sessions/compositionPresentation";
import { OCCURRENCE_RECOVERY_FRAME } from "@/features/sessions/OccurrenceCard";
import { STOP_POINT_CHIP_HEIGHT, StopPointChipFace, StopPointSymbol } from "@/features/sessions/StopPointChip";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, spacing } from "@/shared/ui/tokens";

/**
 * PRE-6 story 5.3 (D-435, Figma `8328:29270`) : rangée d'un emplacement de point d'arrêt — celle
 * de la puce, 22 (`9840:18981`, « Emplacement — pause »), centrée entre les deux éléments qu'elle
 * sépare (écart 8, 9 dans le Circuit). Revue 5.3 : un point déjà présent garde aussi la rangée de
 * 22 (comme hors placement), sans saut de 2 à l'entrée (Figma `9843:18974` : 24).
 */
export const PLACEMENT_STOP_POINT_ROW_HEIGHT = STOP_POINT_CHIP_HEIGHT;

/**
 * Teintes du placement (ch13 CE-T03-08, Figma `9849:43089`, `9848:18968`) : contour pointillé et
 * texte `#0508E5`, soit `colors.primary` (même valeur, registre ch12) ; fond `#0508E5` à 5 %, sans
 * jeton (constante locale, `tokens.ts` verrouillé).
 */
const PLACEMENT_AVAILABLE_SURFACE = "rgba(5, 8, 229, 0.05)";
/** Rayon commun de la puce et du cadre (Figma : 10). */
const PLACEMENT_RADIUS = 10;

/**
 * Puce de point d'arrêt à ajouter (Figma `9849:43089`) : pointillé 1, rayon 10, marges 10 / 4,
 * intervalle 6, deux barres 3 × 10 orange (`warning`), texte Inter Medium 10 `text-label`
 * (« Point d'arrêt ») — mêmes mesures que la puce posée (`StopPointChip`), d'où 96 × 22.
 */
const STOP_POINT_PUCE = { borderWidth: 1, paddingHorizontal: spacing[10], paddingVertical: spacing[4], gap: spacing[6] } as const;
const PUCE_TEXT = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 10, lineHeight: 12 } as const;

/**
 * Cadre « Récupération » (Figma `9848:18968`) : pointillé 1,5, rayon 10, sablier dans la colonne des
 * symboles (à 4 du bord gauche du cadre, contour compris : le débord gauche est borné à l'écart entre
 * les colonnes), texte Inter Semi Bold 11 `#0508E5` calé à droite à 9,5 du bord droit (contour
 * compris, Figma). Contenu sur la boîte de contenu de la ligne 3 (3 sous le haut du cadre, 15 de haut).
 */
const RECOVERY_FRAME = {
  borderWidth: 1.5,
  paddingLeft: OCCURRENCE_RECOVERY_FRAME.horizontalOutset - 1.5,
  paddingRight: 9.5 - 1.5,
  paddingTop: OCCURRENCE_RECOVERY_FRAME.aboveContent - 1.5,
  // Écart minimal sablier → texte (calé à droite) : Figma laisse 5,5 entre le sablier et
  // « Récupération ».
  gap: spacing[4],
} as const;
const FRAME_TEXT = { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 11, lineHeight: 13 } as const;

function fill(template: string, values: Record<string, string>): string {
  // Remplacement par fonction : un nom contenant `$&` ou `$1` est inséré tel quel.
  return Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, () => value), template);
}

/** Point d'arrêt d'une rangée de placement : posé (affiché, non interactif) ou à ajouter. */
export type PlacementStopPointRowPoint =
  | { readonly kind: "EXISTING" }
  | { readonly kind: "AVAILABLE"; readonly location: StopPointLocation };

export type PlacementStopPointRowProps = {
  readonly point: PlacementStopPointRowPoint;
  readonly placement: PlacementDraft;
  /** Nom de l'exercice qui précède l'emplacement ; `null` pour l'emplacement « après le circuit ». */
  readonly exerciseName: string | null;
  readonly onToggleStopPoint: (location: StopPointLocation) => void;
  /**
   * Étendue verticale de la cible de la puce au-delà de la rangée, de chaque côté : l'écart qui la
   * sépare de ses voisins (8, 9 dans le Circuit) — la cible ne touche jamais une carte ni le Circuit.
   */
  readonly touchExtent: number;
  readonly testID: string;
};

/**
 * Emplacement de point d'arrêt du mode placement (PRE-6 story 4.1 ; story 5.3, D-435, Figma
 * `8328:29270`, demande de Hermann du 21/10 : points d'arrêt centrés entre les cartes). Rangée de 22
 * centrée sur la page, traversée par le rail (dessiné par l'élément porteur, story 5.2) :
 * - à ajouter : puce en pointillés (`9849:43089`), bouton nommé « Ajouter un point d'arrêt après
 *   {exercice} » ; ajoutée : puce pleine `primary`, symbole et texte blancs, état sélectionné et
 *   indice « Un toucher retire cet ajout. » ;
 * - déjà présent (y compris à un emplacement que le placement ne propose plus) : puce posée
 *   (`9843:18975`), non interactive (son retrait se fait hors placement, story 4.2), élément
 *   accessible « Point d'arrêt après {exercice} ».
 *
 * Revue 5.3 : la cible est une boîte réelle de 22 + 2 × écart (marges négatives : la rangée garde 22),
 * jamais un `hitSlop` qui dépasserait la rangée (sans effet sous Fabric iOS).
 */
export function PlacementStopPointRow({
  point,
  placement,
  exerciseName,
  onToggleStopPoint,
  touchExtent,
  testID,
}: PlacementStopPointRowProps) {
  const t = strings.screens.composition.placement;
  const anchor = exerciseName === null ? null : { exercise: exerciseName };

  if (point.kind === "EXISTING") {
    return (
      <View style={styles.row} testID={testID}>
        <View
          accessible
          accessibilityLabel={
            anchor === null
              ? t.existingStopPointAfterCircuitAccessibilityLabel
              : fill(t.existingStopPointAccessibilityLabel, anchor)
          }
          testID={`${testID}-stop-point-existing`}
        >
          <StopPointChipFace />
        </View>
      </View>
    );
  }

  const location = point.location;
  const added = isPlacementStopPointAdded(placement, location);
  return (
    <View style={styles.row} testID={testID}>
      <Pressable
        onPress={() => onToggleStopPoint(location)}
        accessibilityRole="button"
        accessibilityLabel={
          anchor === null ? t.addStopPointAfterCircuitAccessibilityLabel : fill(t.addStopPointAccessibilityLabel, anchor)
        }
        accessibilityState={{ selected: added }}
        accessibilityHint={added ? t.selectedHint : undefined}
        style={[
          styles.puceTarget,
          { height: PLACEMENT_STOP_POINT_ROW_HEIGHT + 2 * touchExtent, marginVertical: -touchExtent },
        ]}
        testID={`${testID}-stop-point`}
      >
        <View style={[styles.puce, added ? styles.added : styles.available]} testID={`${testID}-stop-point-face`}>
          <StopPointSymbol color={added ? colors.background : colors.warning} />
          <Text style={[styles.puceText, added ? styles.addedText : null]} numberOfLines={1}>
            {t.stopPoint}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export type PlacementRecoveryFrameProps = {
  readonly occurrenceId: string;
  readonly exerciseName: string;
  readonly placement: PlacementDraft;
  /** Toucher : roulette (à ajouter) ou désélection (déjà ajoutée), inchangé (story 4.1). */
  readonly onPress: (occurrenceId: string) => void;
  /** Étendue verticale de la cible au-delà du contenu de la ligne 3 (`occurrenceRecoveryTouchExtent`). */
  readonly touchExtent: { readonly top: number; readonly bottom: number };
  readonly testID: string;
};

/**
 * Emplacement de récupération du mode placement (PRE-6 story 4.1 ; story 5.3, D-435, Figma
 * `9848:18968`, ch13 L1486) : cadre en pointillés « Récupération » dans la ligne 3 de la carte
 * (colonne des valeurs, `OCCURRENCE_RECOVERY_FRAME`), seulement sur une occurrence SANS
 * récupération — une récupération présente, même à 0, interdit le cadre (`placementSlots`).
 *
 * Revue 5.3 : dans le flux, sa largeur suit son contenu (la colonne des valeurs s'élargit, les Zones
 * cèdent) ; débord gauche borné à l'écart entre les colonnes. La cible est la boîte du `Pressable`
 * (cadre + étendue verticale, marges négatives), jamais un `hitSlop`.
 *
 * Ajoutée (sous-brouillon) : cadre plein `primary`, sablier blanc de même taille (13, teinté) et durée
 * choisie seule (« 30 s », format de la ligne 3, story 5.1). Bouton nommé « Ajouter une récupération
 * après {exercice} », valeur et état sélectionné, indice de retrait.
 */
export function PlacementRecoveryFrame({
  occurrenceId,
  exerciseName,
  placement,
  onPress,
  touchExtent,
  testID,
}: PlacementRecoveryFrameProps) {
  const t = strings.screens.composition.placement;
  const seconds = placement.recoveries[occurrenceId];
  const added = seconds !== undefined;
  const frame = OCCURRENCE_RECOVERY_FRAME;
  return (
    <Pressable
      onPress={() => onPress(occurrenceId)}
      accessibilityRole="button"
      accessibilityLabel={fill(t.addRecoveryAccessibilityLabel, { exercise: exerciseName })}
      accessibilityValue={added ? { text: formatCompactDuration(seconds) } : undefined}
      accessibilityState={{ selected: added }}
      accessibilityHint={added ? t.selectedHint : undefined}
      style={{
        marginTop: -touchExtent.top,
        marginBottom: -touchExtent.bottom,
        marginHorizontal: -frame.horizontalOutset,
        paddingTop: touchExtent.top - frame.aboveContent,
        paddingBottom: touchExtent.bottom - (frame.height - frame.aboveContent - frame.lineContentHeight),
      }}
      testID={testID}
    >
      <View style={[styles.frame, added ? styles.added : styles.available]} testID={`${testID}-face`}>
        <KodjoIcon name="card-recovery-hourglass" tintColor={added ? colors.background : undefined} testID={`${testID}-icon`} />
        <Text style={[styles.frameText, added ? styles.addedText : null]} numberOfLines={1}>
          {added ? formatCompactDuration(seconds) : t.recovery}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: PLACEMENT_STOP_POINT_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  puceTarget: {
    justifyContent: "center",
  },
  puce: {
    flexDirection: "row",
    alignItems: "center",
    gap: STOP_POINT_PUCE.gap,
    paddingHorizontal: STOP_POINT_PUCE.paddingHorizontal,
    paddingVertical: STOP_POINT_PUCE.paddingVertical,
    borderRadius: PLACEMENT_RADIUS,
    borderWidth: STOP_POINT_PUCE.borderWidth,
    borderColor: colors.primary,
    overflow: "hidden",
  },
  available: {
    borderStyle: "dashed",
    backgroundColor: PLACEMENT_AVAILABLE_SURFACE,
  },
  added: {
    borderStyle: "solid",
    backgroundColor: colors.primary,
  },
  puceText: {
    ...PUCE_TEXT,
    color: colors.textLabel,
  },
  addedText: {
    color: colors.background,
  },
  frame: {
    height: OCCURRENCE_RECOVERY_FRAME.height,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: RECOVERY_FRAME.gap,
    paddingLeft: RECOVERY_FRAME.paddingLeft,
    paddingRight: RECOVERY_FRAME.paddingRight,
    paddingTop: RECOVERY_FRAME.paddingTop,
    paddingBottom: OCCURRENCE_RECOVERY_FRAME.height - OCCURRENCE_RECOVERY_FRAME.aboveContent - OCCURRENCE_RECOVERY_FRAME.lineContentHeight - RECOVERY_FRAME.borderWidth,
    borderRadius: PLACEMENT_RADIUS,
    borderWidth: RECOVERY_FRAME.borderWidth,
    borderColor: colors.primary,
    overflow: "hidden",
  },
  frameText: {
    ...FRAME_TEXT,
    flexGrow: 1,
    flexShrink: 1,
    textAlign: "right",
    color: colors.primary,
  },
});
