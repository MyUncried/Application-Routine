import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatCompactDuration } from "@/features/sessions/compositionPresentation";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { focusOnNextFrame } from "@/features/sessions/deferredAccessibilityFocus";
import { STOP_POINT_CHIP_HEIGHT, StopPointChip } from "@/features/sessions/StopPointChip";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { spacing } from "@/shared/ui/tokens";

/**
 * Hauteur de la rangée qui porte un point d'arrêt hors placement : celle de la puce, 22 (PRE-6
 * story 5.2, D-435, Figma `9819:20018` « Espace — Point d'arrêt » ; ch13 CE-T03-08 L1478). Les
 * écarts de la séquence l'encadrent (8 hors Circuit, 9 dans le Circuit).
 */
export const STOP_POINT_LINE_HEIGHT = STOP_POINT_CHIP_HEIGHT;

/**
 * Valeur de la récupération en ligne 3 de la carte v2 (Figma `9798:19934`) : Inter Regular 12,
 * `#7A7A80`, interligne « normal » d'Inter (15).
 */
export const RECOVERY_VALUE_TEXT = { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 12, lineHeight: 15 } as const;
/** Écart sablier → valeur, identique à celui du symbole de durée de la ligne 2 (Figma : 6). */
const RECOVERY_ICON_GAP = spacing[6];

/**
 * Récupération affichable sur la carte : un nombre fini strictement positif (choix D2 de l'epic 5).
 * Absente, nulle, négative ou non finie (NaN, ∞, donnée corrompue) : rien n'est affiché ni proposé ;
 * la donnée n'est pas modifiée.
 */
export function isDisplayableRecovery(recoverySeconds: number | null | undefined): recoverySeconds is number {
  return typeof recoverySeconds === "number" && Number.isFinite(recoverySeconds) && recoverySeconds > 0;
}

export type OccurrenceRecoveryProps = {
  /** Récupération à afficher ; non affichable (`isDisplayableRecovery`) : rien n'est rendu. */
  readonly recoverySeconds: number | null | undefined;
  /**
   * Toucher : roulette « Durée de récupération » (story 4.2). Absent — placement, actions glissées
   * révélées, carte bloquée par une autre révélation, glisser en cours — : simple affichage, le
   * toucher revient à la carte.
   */
  readonly onPress?: () => void;
  /** Appui long : bulle « Retirer la récupération », ancrée sur la récupération (`measureAnchor`). */
  readonly onLongPress?: (anchor: View | null) => void;
  /**
   * Étendue verticale de la cible tactile au-delà du contenu, calculée par la carte
   * (`occurrenceRecoveryTouchExtent`). Revue 5.3 : portée par la BOÎTE du `Pressable` (marges
   * internes compensées par des marges négatives, mise en page inchangée), jamais par `hitSlop` —
   * sous Fabric iOS, un toucher hors des limites du parent (sans débordement mesuré) n'atteint pas
   * l'enfant, et `hitSlop` ne crée aucun débordement.
   */
  readonly touchExtent?: { readonly top: number; readonly bottom: number };
  /**
   * PRE-6 story 5.3 : en placement, récupération DÉJÀ présente — affichée même à 0 (valeur finie
   * positive ou nulle) pour rester modifiable, comme en story 4.2 (`Récupération 0 s, toucher pour
   * modifier`). Hors placement : jamais (choix D2, rien à 0).
   */
  readonly showZero?: boolean;
  /**
   * PRE-6 story 5.3 : nom accessible du contrôle. Fourni en placement, où la carte n'est plus un
   * élément accessible : le contrôle devient alors un bouton exposé (« Récupération 20 s, toucher
   * pour modifier »). Absent (hors placement) : retiré de l'accessibilité, la carte porte la
   * récupération dans son nom et ses actions (revue 5.1).
   */
  readonly accessibilityLabel?: string;
  readonly testID?: string;
};

/**
 * Récupération contextuelle en troisième ligne de la carte v2 (PRE-6 story 5.1, D-435, Figma
 * `9798:19931`, `9798:19932`, `9798:19934`) : sablier 13 dans la colonne des symboles puis valeur
 * SANS préfixe, calée à droite (« 20 s »). Reprend le contrôle de la story 4.2, qui était porté par
 * la ligne structurelle sous la carte :
 * - toucher → roulette existante, sans ouvrir l'Exercice : ce `Pressable`, plus profond que celui
 *   de la carte, prend le toucher à sa place ;
 * - appui long → bulle « Retirer la récupération », ancrée sur ce contrôle.
 *
 * Accessibilité (revue 5.1) : le contrôle est imbriqué dans la carte, élément accessible que
 * VoiceOver ne traverse pas ; il est donc retiré de l'arbre d'accessibilité (sans double exposition
 * sous TalkBack). La carte porte la récupération dans son nom et les actions « Modifier la
 * récupération » / « Retirer la récupération ».
 *
 * PRE-6 story 5.3 (D-435) : en placement, une récupération DÉJÀ présente reste ici, touchable pour
 * être modifiée (story 4.2 : sous-brouillon, non comptée dans N), même à 0 (`showZero`). La carte,
 * inactive, n'est alors plus un élément accessible : le contrôle est exposé comme bouton
 * (`accessibilityLabel`). Une occurrence sans récupération reçoit à la place le cadre
 * « Récupération » (`PlacementRecoveryFrame`).
 */
export function OccurrenceRecovery({
  recoverySeconds,
  onPress,
  onLongPress,
  touchExtent = { top: 0, bottom: 0 },
  showZero = false,
  accessibilityLabel,
  testID,
}: OccurrenceRecoveryProps) {
  const recoveryRef = useRef<View>(null);
  const isShownZero = showZero && recoverySeconds === 0;
  if (!isDisplayableRecovery(recoverySeconds) && !isShownZero) {
    return null;
  }
  const content = (
    <>
      <KodjoIcon name="card-recovery-hourglass" testID="composition-recovery-line-icon" />
      <Text style={styles.value} numberOfLines={1} testID="composition-recovery-line-label">
        {formatCompactDuration(recoverySeconds as number)}
      </Text>
    </>
  );

  if (onPress === undefined) {
    // Revue 5.3 : simple affichage, retiré de l'accessibilité (en placement, la carte n'est plus un
    // élément accessible et ne le couvre plus).
    return (
      <View
        style={styles.recovery}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID={testID}
      >
        {content}
      </View>
    );
  }
  const accessibility =
    accessibilityLabel === undefined
      ? ({ accessible: false, importantForAccessibility: "no" } as const)
      : ({ accessible: true, accessibilityRole: "button", accessibilityLabel } as const);
  return (
    <Pressable
      onPress={onPress}
      // Revue 5.3 : sans appui long (placement), un appui lent reste un toucher (roulette).
      onLongPress={onLongPress === undefined ? undefined : () => onLongPress(recoveryRef.current)}
      {...accessibility}
      style={{
        marginTop: -touchExtent.top,
        marginBottom: -touchExtent.bottom,
        paddingTop: touchExtent.top,
        paddingBottom: touchExtent.bottom,
      }}
      testID={testID}
    >
      {/* Ancre de la bulle « Retirer » : le contenu seul (sablier et valeur), pas la cible. */}
      <View ref={recoveryRef} collapsable={false} style={styles.recovery} testID={testID === undefined ? undefined : `${testID}-content`}>
        {content}
      </View>
    </Pressable>
  );
}

export type ActivityRecoveryLineStopPoint = {
  /** « Point d'arrêt après {exercice} » / « … après le circuit ». */
  readonly accessibilityLabel: string;
  readonly onLongPress: (anchor: View | null) => void;
  readonly onRemove: () => void;
};

export type ActivityRecoveryLineProps = {
  /** Point d'arrêt de cet emplacement (story 4.2). */
  readonly stopPoint: ActivityRecoveryLineStopPoint;
  /**
   * Demande de focus (story 4.2, après un retrait) : chaque nouvelle valeur porte le focus
   * d'accessibilité, à l'image suivante, sur le point.
   */
  readonly focusRequest?: number;
  readonly testID?: string;
};

/**
 * Rangée du point d'arrêt sous une occurrence, ou sous le Circuit (PRE-6 story 4.2, Figma
 * `8328:29428`). PRE-6 story 5.2 (D-435, Figma `9819:20018`, `9819:20063` ; demande de Hermann
 * du 21/10 : points d'arrêt centrés entre les cartes) : rangée de 22, puce existante centrée sur la
 * page ; le point de raccord sur le rail est dessiné par l'élément porteur (`RailDot`).
 *
 * PRE-6 story 5.1 (D-435, choix D1 de l'epic 5) : la récupération a quitté cette rangée pour la
 * ligne 3 de la carte (`OccurrenceRecovery`) et le trait de démarcation est supprimé. La rangée
 * n'existe plus que pour un point d'arrêt. Elle appartient au bloc de l'occurrence, dont elle suit le
 * déplacement et le balayage (`CompositionActivityRow`). Quand le retrait du point la vide,
 * l'appelant ne la monte plus et reporte lui-même le focus sur la carte.
 */
export function ActivityRecoveryLine({ stopPoint, focusRequest, testID }: ActivityRecoveryLineProps) {
  const stopPointRef = useRef<View>(null);

  // Focus rendu au point après un retrait (story 4.2) : jamais au premier rendu ; à l'image
  // suivante, la bulle (`Modal`) se démontant dans le même geste. La rangée n'est montée qu'avec
  // son point : la puce existe toujours.
  const handledFocusRef = useRef(focusRequest);
  useEffect(() => {
    if (focusRequest === undefined || focusRequest === handledFocusRef.current) return undefined;
    handledFocusRef.current = focusRequest;
    return focusOnNextFrame(() => stopPointRef.current);
  }, [focusRequest]);

  return (
    <View style={styles.line} testID={testID}>
      <StopPointChip
        ref={stopPointRef}
        accessibilityLabel={stopPoint.accessibilityLabel}
        onLongPress={() => stopPoint.onLongPress(stopPointRef.current)}
        onRemove={stopPoint.onRemove}
        testID={testID === undefined ? undefined : `${testID}-stop-point`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // PRE-6 story 5.2 (D-435) : puce centrée sur la page (la rangée a la largeur des cartes, ou de la
  // colonne de la séquence sous le Circuit — même axe, x 201 à 402).
  line: {
    height: STOP_POINT_LINE_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  // Sablier dans la colonne des symboles (sous le symbole de durée), valeur calée à droite.
  recovery: {
    flexDirection: "row",
    alignItems: "center",
    gap: RECOVERY_ICON_GAP,
  },
  value: {
    ...RECOVERY_VALUE_TEXT,
    color: TEXT_TERTIARY,
    flexGrow: 1,
    flexShrink: 1,
    textAlign: "right",
  },
});
