import { Pressable, StyleSheet, Text, View } from "react-native";

import { isPlacementStopPointAdded, isPlacementStopPointRemoved, type PlacementDraft } from "@/domain/sessions/placement";
import type { StopPointLocation } from "@/domain/sessions/StopPoint";
import { formatCompactDuration } from "@/features/sessions/compositionPresentation";
import { OCCURRENCE_RECOVERY_FRAME } from "@/features/sessions/OccurrenceCard";
import { STOP_POINT_CHIP_HEIGHT, StopPointSymbol } from "@/features/sessions/StopPointChip";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
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

/**
 * Point d'arrêt d'une rangée de placement, préparé par l'écran (story 6.3) :
 * - `EXISTING` : point existant (D-436, R3), visé par son IDENTIFIANT (deux points hérités sur la
 *   même clé se retirent indépendamment) ; `blocked` : retrait programmé dont l'annulation est
 *   refusée par le Domaine (un point ajouté le suivrait, RM-251) ;
 * - `AVAILABLE` : emplacement libre ou ajouté, visé par son emplacement.
 * Le nom accessible suit, pour les deux, la règle de la story 6.2 (dernier Exercice qui précède,
 * homonymes « n sur m », « après le circuit », têtes de portée).
 */
export type PlacementStopPointRowPoint =
  | {
      readonly kind: "EXISTING";
      readonly stopPointId: string;
      readonly accessibilityLabel: string;
      readonly blocked: boolean;
    }
  | { readonly kind: "AVAILABLE"; readonly location: StopPointLocation; readonly accessibilityLabel: string };

/** Étendue verticale de la cible au-delà de la rangée, au-dessus et au-dessous. */
export type PlacementTouchExtent = { readonly top: number; readonly bottom: number };

export type PlacementStopPointRowProps = {
  readonly point: PlacementStopPointRowPoint;
  readonly placement: PlacementDraft;
  /** Emplacement libre ou ajouté : bascule de l'ajout. */
  readonly onToggleStopPoint: (location: StopPointLocation) => void;
  /** Point existant : bascule de son retrait programmé, par identifiant. */
  readonly onToggleExistingStopPoint: (stopPointId: string) => void;
  /**
   * Étendue de la cible au-delà de la rangée : l'écart qui la sépare de ses voisins (8, 9 dans le
   * Circuit), ou sa moitié du côté d'une autre rangée de placement adjacente (revue 6.3 : deux cibles
   * voisines se partagent l'écart, jamais ne se recouvrent). Un nombre vaut pour les deux côtés.
   */
  readonly touchExtent: number | PlacementTouchExtent;
  readonly testID: string;
};

/**
 * Emplacement de point d'arrêt du mode placement (PRE-6 story 4.1 ; story 5.3, D-435, Figma
 * `8328:29270`, demande de Hermann du 21/10 : points d'arrêt centrés entre les cartes). Rangée de 22
 * centrée sur la page, traversée par le rail (dessiné par l'élément porteur, story 5.2) :
 * - à ajouter : puce en pointillés (`9849:43089`), bouton « Ajouter un point d'arrêt après
 *   {exercice} » ; ajoutée : puce pleine `primary`, symbole et texte blancs, état sélectionné et
 *   indice « Un toucher retire cet ajout. » ;
 * - déjà présent (y compris à un emplacement que le placement ne propose pas) — story 6.3 (D-436,
 *   R3) : bouton SÉLECTIONNÉ, même rendu que la puce ajoutée ; toucher le désélectionne (retrait
 *   programmé), retoucher le resélectionne. Désélectionné (« à retirer ») : pointillés ET opacité
 *   réduite (`UNSELECTED_OPACITY`), pour ne pas ressembler à un emplacement libre (revue 6.3).
 *   NON VÉRIFIABLE : Figma ne dessine aucun état sélectionné / désélectionné d'un point existant
 *   (`9843:18975` montre la puce posée d'avant D-436). Resélection refusée (`blocked`) : état
 *   indisponible et indice dédié ; le toucher reste reçu, l'écran en annonce le refus.
 *
 * Revue 5.3 : la cible est une boîte réelle de 22 + écarts (marges négatives : la rangée garde 22),
 * jamais un `hitSlop` qui dépasserait la rangée (sans effet sous Fabric iOS).
 */
export function PlacementStopPointRow({
  point,
  placement,
  onToggleStopPoint,
  onToggleExistingStopPoint,
  touchExtent,
  testID,
}: PlacementStopPointRowProps) {
  const t = strings.screens.composition.placement;
  const extent = typeof touchExtent === "number" ? { top: touchExtent, bottom: touchExtent } : touchExtent;
  let selected: boolean;
  let toRemove = false;
  let blocked = false;
  let hint: string | undefined;
  let targetTestID: string;
  let onPress: () => void;
  if (point.kind === "EXISTING") {
    // Story 6.3 (D-436) : sélectionné tant que son retrait n'est pas programmé.
    selected = !isPlacementStopPointRemoved(placement, point.stopPointId);
    toRemove = !selected;
    blocked = toRemove && point.blocked;
    hint = selected
      ? t.existingStopPointSelectedHint
      : blocked
        ? t.existingStopPointBlockedHint
        : t.existingStopPointRemovedHint;
    targetTestID = `${testID}-stop-point-existing`;
    const id = point.stopPointId;
    onPress = () => onToggleExistingStopPoint(id);
  } else {
    const location = point.location;
    selected = isPlacementStopPointAdded(placement, location);
    hint = selected ? t.selectedHint : undefined;
    targetTestID = `${testID}-stop-point`;
    onPress = () => onToggleStopPoint(location);
  }
  return (
    <View style={styles.row} testID={testID}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={point.accessibilityLabel}
        accessibilityState={blocked ? { selected, disabled: true } : { selected }}
        accessibilityHint={hint}
        style={[
          styles.puceTarget,
          {
            height: PLACEMENT_STOP_POINT_ROW_HEIGHT + extent.top + extent.bottom,
            marginTop: -extent.top,
            marginBottom: -extent.bottom,
          },
        ]}
        testID={targetTestID}
      >
        <View
          style={[styles.puce, selected ? styles.added : styles.available, toRemove ? styles.toRemove : null]}
          testID={`${targetTestID}-face`}
        >
          <StopPointSymbol color={selected ? colors.background : colors.warning} />
          <Text style={[styles.puceText, selected ? styles.addedText : null]} numberOfLines={1}>
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
  /**
   * PRE-6 story 7.2 (D-437) : durée SÉLECTIONNÉE de la zone (`placementRecoverySeconds` : ajout, ou
   * récupération existante — 0 comprise — modifiée ou non et non retirée), `null` si la zone n'est
   * pas sélectionnée.
   */
  readonly selectedSeconds: number | null;
  /** La récupération existe dans le brouillon (présente avant le placement, 0 comprise). */
  readonly existing: boolean;
  /** Toucher : désélection (zone sélectionnée) ou roulette (zone non sélectionnée). */
  readonly onPress: (occurrenceId: string) => void;
  /** Étendue verticale de la cible au-delà du contenu de la ligne 3 (`occurrenceRecoveryTouchExtent`). */
  readonly touchExtent: { readonly top: number; readonly bottom: number };
  readonly testID: string;
};

/**
 * Zone de récupération du mode placement (PRE-6 story 4.1 ; story 5.3, D-435, Figma `9848:18968`,
 * ch13 L1486) : cadre « Récupération » dans la ligne 3 de la carte (colonne des valeurs,
 * `OCCURRENCE_RECOVERY_FRAME`).
 *
 * PRE-6 story 7.2 (D-437, ch13 CE-T03-08 L1496) : toutes les zones de récupération des Exercices
 * sont sélectionnables, comme les Points d'arrêt.
 * - Sélectionnée (ajoutée, ou récupération existante — 0 comprise — conservée) : cadre plein
 *   `primary`, sablier blanc de même taille (13, teinté) et durée seule (« 30 s », format de la
 *   ligne 3) ; toucher la désélectionne (ajout jeté, ou retrait programmé de l'existante).
 * - Non sélectionnée : cadre en pointillés « Récupération » ; toucher ouvre la roulette (durée
 *   existante, sinon défaut du Profil). Une récupération existante désélectionnée (« à retirer »)
 *   garde aussi l'opacité réduite du point existant à retirer (story 6.3) — NON VÉRIFIABLE : Figma
 *   ne dessine pas cet état.
 *
 * Accessibilité : bouton nommé « Ajouter une récupération après {exercice} » (zone sans récupération
 * existante) ou « Récupération après {exercice} » (existante) ; valeur = durée sélectionnée ; état
 * sélectionné ; indices selon l'effet du toucher.
 *
 * Revue 5.3 : dans le flux, sa largeur suit son contenu (la colonne des valeurs s'élargit, les Zones
 * cèdent) ; débord gauche borné à l'écart entre les colonnes. La cible est la boîte du `Pressable`
 * (cadre + étendue verticale, marges négatives), jamais un `hitSlop`.
 */
export function PlacementRecoveryFrame({
  occurrenceId,
  exerciseName,
  selectedSeconds,
  existing,
  onPress,
  touchExtent,
  testID,
}: PlacementRecoveryFrameProps) {
  const t = strings.screens.composition.placement;
  const selected = selectedSeconds !== null;
  const toRemove = existing && !selected;
  const frame = OCCURRENCE_RECOVERY_FRAME;
  const hint = existing
    ? selected
      ? t.existingRecoverySelectedHint
      : t.existingRecoveryRemovedHint
    : selected
      ? t.selectedHint
      : undefined;
  return (
    <Pressable
      onPress={() => onPress(occurrenceId)}
      accessibilityRole="button"
      accessibilityLabel={fill(existing ? t.existingRecoveryAccessibilityLabel : t.addRecoveryAccessibilityLabel, {
        exercise: exerciseName,
      })}
      accessibilityValue={selected ? { text: formatCompactDuration(selectedSeconds) } : undefined}
      accessibilityState={{ selected }}
      accessibilityHint={hint}
      style={{
        marginTop: -touchExtent.top,
        marginBottom: -touchExtent.bottom,
        marginHorizontal: -frame.horizontalOutset,
        paddingTop: touchExtent.top - frame.aboveContent,
        paddingBottom: touchExtent.bottom - (frame.height - frame.aboveContent - frame.lineContentHeight),
      }}
      testID={testID}
    >
      <View
        style={[styles.frame, selected ? styles.added : styles.available, toRemove ? styles.toRemove : null]}
        testID={`${testID}-face`}
      >
        <KodjoIcon name="card-recovery-hourglass" tintColor={selected ? colors.background : undefined} testID={`${testID}-icon`} />
        <Text style={[styles.frameText, selected ? styles.addedText : null]} numberOfLines={1}>
          {selected ? formatCompactDuration(selectedSeconds) : t.recovery}
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
  // Revue 6.3 : point existant dont le retrait est programmé (NON VÉRIFIABLE, aucun état Figma).
  toRemove: {
    opacity: UNSELECTED_OPACITY,
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
