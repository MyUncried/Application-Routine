import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatCompactDuration } from "@/features/sessions/compositionPresentation";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { focusOnNextFrame } from "@/features/sessions/deferredAccessibilityFocus";
import { STOP_POINT_CHIP_HEIGHT, StopPointChip } from "@/features/sessions/StopPointChip";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { spacing } from "@/shared/ui/tokens";

/** Marge verticale de la rangée du point d'arrêt (Figma `8328:29531`). */
const LINE_PADDING_VERTICAL = spacing[4];
/** Hauteur de la rangée qui porte un point d'arrêt : puce 22 + marges 4 / 4 (Figma `8328:29531`). */
export const STOP_POINT_LINE_HEIGHT = STOP_POINT_CHIP_HEIGHT + 2 * LINE_PADDING_VERTICAL;

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
  /** Marge tactile, calculée par la carte (`occurrenceRecoveryHitSlop`). */
  readonly hitSlop?: { readonly top: number; readonly bottom: number };
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
 */
export function OccurrenceRecovery({ recoverySeconds, onPress, onLongPress, hitSlop, testID }: OccurrenceRecoveryProps) {
  const recoveryRef = useRef<View>(null);
  if (!isDisplayableRecovery(recoverySeconds)) {
    return null;
  }
  const content = (
    <>
      <KodjoIcon name="card-recovery-hourglass" testID="composition-recovery-line-icon" />
      <Text style={styles.value} numberOfLines={1} testID="composition-recovery-line-label">
        {formatCompactDuration(recoverySeconds)}
      </Text>
    </>
  );

  if (onPress === undefined) {
    return (
      <View style={styles.recovery} accessible={false} importantForAccessibility="no" testID={testID}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      ref={recoveryRef}
      onPress={onPress}
      onLongPress={() => onLongPress?.(recoveryRef.current)}
      accessible={false}
      importantForAccessibility="no"
      hitSlop={hitSlop}
      style={styles.recovery}
      testID={testID}
    >
      {content}
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
 * `8328:29428`) : puce à droite, bord droit aligné sur celui des cartes, hauteur 30.
 *
 * PRE-6 story 5.1 (D-435, choix D1 de l'epic 5) : la récupération a quitté cette rangée pour la
 * ligne 3 de la carte (`OccurrenceRecovery`) et le trait de démarcation est supprimé. La rangée
 * n'existe plus que pour un point d'arrêt, avec son rendu provisoire jusqu'à la story 5.2 (points
 * centrés entre les cartes). Elle appartient au bloc de l'occurrence, dont elle suit le
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
  // Point d'arrêt (ch13 L1258, PR #390) : bord droit de la puce aligné sur celui des cartes.
  line: {
    height: STOP_POINT_LINE_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: LINE_PADDING_VERTICAL,
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
