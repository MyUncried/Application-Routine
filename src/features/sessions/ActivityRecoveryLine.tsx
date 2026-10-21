import { type ReactNode, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatActivityRecoveryLabel, formatCompactDuration } from "@/features/sessions/compositionPresentation";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { focusOnNextFrame } from "@/features/sessions/deferredAccessibilityFocus";
import { STOP_POINT_CHIP_HEIGHT, StopPointChip } from "@/features/sessions/StopPointChip";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, spacing } from "@/shared/ui/tokens";

/** Hauteur de la ligne structurelle (Figma `8328:28657`). */
export const ACTIVITY_RECOVERY_LINE_HEIGHT = 21;
/** Marge verticale de la ligne (Figma `8328:28657`). */
const LINE_PADDING_VERTICAL = spacing[4];
/** Hauteur de la ligne qui porte un point d'arrêt : puce 22 + marges 4 / 4 (Figma `8328:29531`). */
export const STOP_POINT_LINE_HEIGHT = STOP_POINT_CHIP_HEIGHT + 2 * LINE_PADDING_VERTICAL;

/** Libellé (Figma `8328:28660`) : Inter Medium 11, interligne Auto (D2). */
const RECOVERY_TEXT = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 11, lineHeight: 13 } as const;

/** Trait (Figma `8328:28661`) : épaisseur 1. */
const RULE_THICKNESS = 1;

/**
 * Cible tactile de la récupération (sablier + libellé, jamais le trait) : étendue aux seules
 * marges verticales de la ligne, pour ne jamais déborder sur la carte au-dessus, qui porte son
 * propre appui long (glisser).
 */
export const RECOVERY_HIT_SLOP = { top: LINE_PADDING_VERTICAL, bottom: LINE_PADDING_VERTICAL } as const;

/** Action accessible de retrait de la récupération (story 4.2). */
const REMOVE_ACTION = "remove";

export type ActivityRecoveryLineStopPoint = {
  /** « Point d'arrêt après {exercice} » / « … après le circuit ». */
  readonly accessibilityLabel: string;
  readonly onLongPress: (anchor: View | null) => void;
  readonly onRemove: () => void;
};

export type ActivityRecoveryLineProps = {
  /** `undefined` : ligne sans récupération (point « après le Circuit »). */
  readonly recoverySeconds?: number | null;
  /** Toucher une récupération positive : roulette « Durée de récupération » (story 4.2). */
  readonly onPressRecovery?: () => void;
  /** Appui long sur une récupération positive : bulle « Retirer la récupération ». */
  readonly onLongPressRecovery?: (anchor: View | null) => void;
  /** Alternative accessible : action « Retirer la récupération », même effet que la bulle. */
  readonly onRemoveRecovery?: () => void;
  /** Point d'arrêt de cet emplacement (story 4.2) ; `null` / absent : aucun. */
  readonly stopPoint?: ActivityRecoveryLineStopPoint | null;
  /**
   * Demande de focus (story 4.2, après un retrait) : chaque nouvelle valeur porte le focus
   * d'accessibilité, à l'image suivante, sur la récupération, sinon sur le point ; sans élément
   * accessible, `onFocusUnavailable`.
   */
  readonly focusRequest?: number;
  readonly onFocusUnavailable?: () => void;
  readonly testID?: string;
};

/**
 * Ligne structurelle sous une occurrence de la Composition (PRE-6 story 2.1, D-303, D-217, Figma
 * `8328:28657`) : hauteur 21, marges 14 / 4, trait `divider` sur toute la largeur restante —
 * TOUJOURS présent. Si R > 0 : sablier 13 et « Récupération {durée} » avant le trait ; R absente
 * ou 0 : trait seul, sans aucune information (remplace la sous-carte « Récupération 0 s », E5).
 *
 * Story 4.2 (`8328:29428`, `8328:29133`, `8328:33689`) :
 * - une récupération positive est un bouton « Récupération {durée}, toucher pour modifier » : le
 *   toucher ouvre sa roulette, l'appui long la bulle « Retirer la récupération », l'action
 *   accessible du même nom retire directement. R = 0 n'offre rien (D-303) ;
 * - un point d'arrêt est une puce à droite (récupération à gauche, point à droite), bord droit
 *   aligné sur celui des cartes ; le trait occupe la largeur restante ; ligne de 30.
 *
 * Elle appartient au bloc de l'occurrence, dont elle suit le déplacement et le balayage
 * (`CompositionActivityRow`).
 */
export function ActivityRecoveryLine({
  recoverySeconds,
  onPressRecovery,
  onLongPressRecovery,
  onRemoveRecovery,
  stopPoint = null,
  focusRequest,
  onFocusUnavailable,
  testID,
}: ActivityRecoveryLineProps) {
  const label = formatActivityRecoveryLabel(recoverySeconds);
  const recoveryRef = useRef<View>(null);
  const stopPointRef = useRef<View>(null);
  const t = strings.screens.composition.pauses;

  // Focus rendu à la ligne après un retrait (story 4.2) : jamais au premier rendu ; à l'image
  // suivante, la bulle (`Modal`) se démontant dans le même geste.
  const handledFocusRef = useRef(focusRequest);
  useEffect(() => {
    if (focusRequest === undefined || focusRequest === handledFocusRef.current) return undefined;
    handledFocusRef.current = focusRequest;
    if (recoveryRef.current === null && stopPointRef.current === null) {
      onFocusUnavailable?.();
      return undefined;
    }
    return focusOnNextFrame(() => recoveryRef.current ?? stopPointRef.current);
  }, [focusRequest, onFocusUnavailable]);

  const content =
    label === null ? null : (
      <>
        <KodjoIcon name="recovery-hourglass" testID="composition-recovery-line-icon" />
        <Text style={styles.label} numberOfLines={1} testID="composition-recovery-line-label">
          {label}
        </Text>
      </>
    );

  let recovery: ReactNode = null;
  if (label !== null && onPressRecovery !== undefined && typeof recoverySeconds === "number") {
    recovery = (
      <Pressable
        ref={recoveryRef}
        onPress={onPressRecovery}
        onLongPress={() => onLongPressRecovery?.(recoveryRef.current)}
        accessibilityRole="button"
        accessibilityLabel={t.modifiableRecoveryAccessibilityLabel.replace("{duration}", () =>
          formatCompactDuration(recoverySeconds),
        )}
        accessibilityActions={onRemoveRecovery ? [{ name: REMOVE_ACTION, label: t.removeRecovery }] : undefined}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === REMOVE_ACTION) onRemoveRecovery?.();
        }}
        hitSlop={RECOVERY_HIT_SLOP}
        style={styles.recovery}
        testID={testID === undefined ? undefined : `${testID}-recovery`}
      >
        {content}
      </Pressable>
    );
  } else if (label !== null) {
    recovery = (
      <View style={styles.recovery} accessible accessibilityLabel={label}>
        {content}
      </View>
    );
  }

  return (
    <View style={[styles.line, stopPoint !== null ? styles.lineWithStopPoint : null]} testID={testID}>
      {recovery}
      <View style={styles.rule} testID="composition-recovery-line-rule" />
      {stopPoint !== null ? (
        <StopPointChip
          ref={stopPointRef}
          accessibilityLabel={stopPoint.accessibilityLabel}
          onLongPress={() => stopPoint.onLongPress(stopPointRef.current)}
          onRemove={stopPoint.onRemove}
          testID={testID === undefined ? undefined : `${testID}-stop-point`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    height: ACTIVITY_RECOVERY_LINE_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[6],
    paddingHorizontal: spacing[14],
    paddingVertical: LINE_PADDING_VERTICAL,
  },
  // Point d'arrêt (ch13 L1258, PR #390) : bord droit de la puce aligné sur celui des cartes.
  lineWithStopPoint: {
    height: STOP_POINT_LINE_HEIGHT,
    paddingRight: 0,
  },
  recovery: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[6],
    flexShrink: 1,
  },
  label: {
    ...RECOVERY_TEXT,
    color: TEXT_TERTIARY,
    flexShrink: 1,
  },
  rule: {
    flex: 1,
    height: RULE_THICKNESS,
    backgroundColor: colors.divider,
  },
});
