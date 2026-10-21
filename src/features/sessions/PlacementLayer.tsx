import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  isPlacementStopPointAdded,
  type PlacementDraft,
  type PlacementSlot,
} from "@/domain/sessions/placement";
import type { StopPointLocation } from "@/domain/sessions/StopPoint";
import { formatCompactDuration } from "@/features/sessions/compositionPresentation";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, spacing } from "@/shared/ui/tokens";

/** Hauteur d'un emplacement du placement (Figma `8328:29323`, « Emplacement — pause »). */
export const PLACEMENT_SLOT_HEIGHT = 24;

/** Puces (Figma `8328:29383`, `8328:29328`) : hauteur 24, rayon 10, contour 1,5. */
const CHIP = { radius: 10, borderWidth: 1.5 } as const;
/** Fond de la puce à ajouter (pointillés) : `#0508E5` à 5 % (Figma `8328:29383`), sans jeton. */
const CHIP_AVAILABLE_SURFACE = "rgba(5, 8, 229, 0.05)";
/** Puce « Récupération » : sablier à 13 du bord (contour compris), écart 4 avec le texte. */
const RECOVERY_CHIP = { paddingLeft: 13 - CHIP.borderWidth, gap: spacing[4] } as const;
/**
 * Puce « Point d'arrêt » (ch13 L1258, PR #390) : bord droit aligné sur les cartes, symbole et
 * texte alignés à droite, marge interne 14, intervalle 6.
 */
const STOP_POINT_CHIP = { paddingRight: spacing[14] - CHIP.borderWidth, gap: spacing[6] } as const;
/** Symbole du point d'arrêt (Figma `8328:29329`) : deux barres 3 × 9, rayon 1, écartées de 4. */
const STOP_POINT_BAR = { width: 3, height: 9, radius: 1, gap: spacing[4] } as const;

/** Libellé des puces : Inter Semi Bold 11, interligne Auto (Figma `8328:29384`). */
const CHIP_TEXT = { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 11, lineHeight: 13 } as const;
/** Récupération existante : Inter Medium 11, `text-tertiary` (Figma `8328:29327`, comme la ligne structurelle). */
/** Cible tactile des puces (24 de haut) portée à 44. */
const CHIP_HIT_SLOP = { top: (44 - 24) / 2, bottom: (44 - 24) / 2 } as const;

const EXISTING_TEXT = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 11, lineHeight: 13 } as const;

function fill(template: string, values: Record<string, string>): string {
  // Remplacement par fonction : un nom contenant `$&` ou `$1` est inséré tel quel.
  return Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, () => value), template);
}

export type PlacementSlotRowProps = {
  readonly slot: PlacementSlot;
  readonly placement: PlacementDraft;
  /** Nom de l'exercice qui précède l'emplacement ; `null` pour l'emplacement « après le circuit ». */
  readonly exerciseName: string | null;
  /** Toucher la récupération : roulette (à ajouter) ou désélection (déjà ajoutée). */
  readonly onPressRecovery: (occurrenceId: string) => void;
  /** Story 4.2 : toucher une récupération existante ouvre sa roulette (modification non comptée dans N). */
  readonly onPressExistingRecovery: (occurrenceId: string) => void;
  readonly onToggleStopPoint: (location: StopPointLocation) => void;
  readonly testID: string;
};

/**
 * Emplacement du mode placement (PRE-6 story 4.1, Figma `8328:29270`), sur la ligne
 * structurelle sous l'occurrence (le trait de démarcation y est masqué, D-303) ou après le
 * Circuit : à gauche la récupération, à droite le point d'arrêt.
 *
 * - Récupération : puce en pointillés « Récupération » (ajout possible) ; puce pleine
 *   « Récupération {durée} » une fois ajoutée ; récupération déjà présente (0 ou positive)
 *   affichée comme existante, sans puce — story 4.2 : un bouton qui ouvre sa roulette, la
 *   nouvelle durée (sous-brouillon, non comptée dans N) étant affichée à sa place.
 * - Point d'arrêt : puce en pointillés (ajout possible), pleine une fois ajouté ; un point déjà
 *   présent est affiché comme existant (symbole et texte tertiaire, comme une récupération
 *   existante), non interactif (son retrait se fait hors placement, story 4.2).
 *
 * Chaque puce est un bouton nommé (cible 44) avec son état sélectionné ; sélectionnée, son indice
 * dit qu'un toucher la retire. L'ordre de lecture suit la ligne : récupération puis point.
 */
export function PlacementSlotRow({
  slot,
  placement,
  exerciseName,
  onPressRecovery,
  onPressExistingRecovery,
  onToggleStopPoint,
  testID,
}: PlacementSlotRowProps) {
  const t = strings.screens.composition.placement;
  const anchor = exerciseName === null ? null : { exercise: exerciseName };
  const occurrenceId = slot.occurrenceId;

  let recovery: ReactNode = <View style={styles.half} />;
  if (slot.recovery !== null && occurrenceId !== null) {
    if (slot.recovery.kind === "EXISTING") {
      const seconds = placement.recoveryChanges[occurrenceId] ?? slot.recovery.seconds;
      const label = `${t.recovery} ${formatCompactDuration(seconds)}`;
      recovery = (
        <Pressable
          onPress={() => onPressExistingRecovery(occurrenceId)}
          accessibilityRole="button"
          accessibilityLabel={fill(strings.screens.composition.pauses.modifiableRecoveryAccessibilityLabel, {
            duration: formatCompactDuration(seconds),
          })}
          hitSlop={CHIP_HIT_SLOP}
          style={[styles.half, styles.existingRecovery]}
          testID={`${testID}-recovery-existing`}
        >
          <KodjoIcon name="recovery-hourglass" />
          <Text style={styles.existingText} numberOfLines={1}>
            {label}
          </Text>
        </Pressable>
      );
    } else {
      const seconds = placement.recoveries[occurrenceId];
      const added = seconds !== undefined;
      recovery = (
        <Pressable
          onPress={() => onPressRecovery(occurrenceId)}
          accessibilityRole="button"
          accessibilityLabel={fill(t.addRecoveryAccessibilityLabel, { exercise: exerciseName ?? "" })}
          accessibilityValue={added ? { text: formatCompactDuration(seconds) } : undefined}
          accessibilityState={{ selected: added }}
          accessibilityHint={added ? t.selectedHint : undefined}
          hitSlop={CHIP_HIT_SLOP}
          style={[styles.half, styles.chip, styles.recoveryChip, added ? styles.chipAdded : styles.chipAvailable]}
          testID={`${testID}-recovery`}
        >
          <KodjoIcon name={added ? "placement-recovery-added" : "placement-recovery"} />
          <Text style={[styles.chipText, added ? styles.chipTextAdded : null]} numberOfLines={1}>
            {added ? `${t.recovery} ${formatCompactDuration(seconds)}` : t.recovery}
          </Text>
        </Pressable>
      );
    }
  }

  let stopPoint: ReactNode = <View style={styles.half} />;
  if (slot.stopPoint !== null) {
    const location = slot.stopPoint.location;
    if (slot.stopPoint.existing) {
      stopPoint = (
        <View
          style={[styles.half, styles.existingStopPoint]}
          accessible
          accessibilityLabel={
            anchor === null
              ? t.existingStopPointAfterCircuitAccessibilityLabel
              : fill(t.existingStopPointAccessibilityLabel, anchor)
          }
          testID={`${testID}-stop-point-existing`}
        >
          <StopPointSymbol added={false} />
          <Text style={styles.existingText} numberOfLines={1}>
            {t.stopPoint}
          </Text>
        </View>
      );
    } else {
      const added = isPlacementStopPointAdded(placement, location);
      stopPoint = (
        <Pressable
          onPress={() => onToggleStopPoint(location)}
          accessibilityRole="button"
          accessibilityLabel={
            anchor === null ? t.addStopPointAfterCircuitAccessibilityLabel : fill(t.addStopPointAccessibilityLabel, anchor)
          }
          accessibilityState={{ selected: added }}
          accessibilityHint={added ? t.selectedHint : undefined}
          hitSlop={CHIP_HIT_SLOP}
          style={[styles.half, styles.chip, styles.stopPointChip, added ? styles.chipAdded : styles.chipAvailable]}
          testID={`${testID}-stop-point`}
        >
          <StopPointSymbol added={added} />
          <Text style={[styles.chipText, added ? styles.chipTextAdded : null]} numberOfLines={1}>
            {t.stopPoint}
          </Text>
        </Pressable>
      );
    }
  }

  return (
    <View style={styles.row} testID={testID}>
      {recovery}
      {stopPoint}
    </View>
  );
}

/** Symbole du point d'arrêt : barres orange (`warning`) à ajouter, blanches sur la puce pleine. */
function StopPointSymbol({ added }: { added: boolean }) {
  const barStyle = [styles.stopPointBar, { backgroundColor: added ? colors.background : colors.warning }];
  return (
    <View style={styles.stopPointSymbol}>
      <View style={barStyle} />
      <View style={barStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: PLACEMENT_SLOT_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
  },
  half: {
    flex: 1,
    height: PLACEMENT_SLOT_HEIGHT,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: CHIP.radius,
    borderWidth: CHIP.borderWidth,
    borderColor: colors.primary,
    overflow: "hidden",
  },
  chipAvailable: {
    borderStyle: "dashed",
    backgroundColor: CHIP_AVAILABLE_SURFACE,
  },
  chipAdded: {
    borderStyle: "solid",
    backgroundColor: colors.primary,
  },
  recoveryChip: {
    justifyContent: "flex-start",
    paddingLeft: RECOVERY_CHIP.paddingLeft,
    gap: RECOVERY_CHIP.gap,
  },
  stopPointChip: {
    justifyContent: "flex-end",
    paddingRight: STOP_POINT_CHIP.paddingRight,
    gap: STOP_POINT_CHIP.gap,
  },
  chipText: {
    ...CHIP_TEXT,
    color: colors.primary,
    flexShrink: 1,
  },
  chipTextAdded: {
    color: colors.background,
  },
  existingRecovery: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[6],
    paddingHorizontal: spacing[14],
  },
  // Point déjà présent : même rendu « existant » que la récupération, aligné à droite (marge 14, intervalle 6).
  existingStopPoint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing[6],
    paddingRight: spacing[14],
  },
  existingText: {
    ...EXISTING_TEXT,
    color: TEXT_TERTIARY,
    flexShrink: 1,
  },
  stopPointSymbol: {
    flexDirection: "row",
    gap: STOP_POINT_BAR.gap,
  },
  stopPointBar: {
    width: STOP_POINT_BAR.width,
    height: STOP_POINT_BAR.height,
    borderRadius: STOP_POINT_BAR.radius,
  },
});
