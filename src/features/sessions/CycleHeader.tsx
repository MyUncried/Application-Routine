import { StyleSheet, Text, View, type ViewProps } from "react-native";

import { CYCLE_REPEAT_COUNT_MAX, CYCLE_REPEAT_COUNT_MIN } from "@/domain/sessions/structure";
import { CIRCUIT_HEADER_HEIGHT, CIRCUIT_HEADER_TOUCH_GEOMETRY, CountStepper, containerTitle } from "@/features/sessions/CircuitHeader";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { strings } from "@/shared/i18n";
import { colors, spacing, type } from "@/shared/ui/tokens";

/** Unité accordée du compteur du Cycle : « répétition » / « répétitions » (N = 1 singulier ; référence §4). */
export function cycleUnitLabel(count: number): string {
  const unit = strings.screens.composition.cycle.countUnit;
  return count === 1 ? unit.singular : unit.plural;
}

/** Valeur annoncée du réglage : « 2 répétitions ». */
export function cycleCountSpokenValue(count: number): string {
  return `${count} ${cycleUnitLabel(count)}`;
}

export type CycleHeaderProps = {
  /** ARB-13 : lettre de désignation (« A »…) ; absente pour un Cycle unique. */
  readonly letter?: string;
  /** Répétitions du Cycle (1..99, D-451). */
  readonly count: number;
  /** Durée du Cycle déjà formatée par l'écran (formateur de la Séance), calée à droite. */
  readonly duration: string;
  /** RM-027 : stepper révélé au toucher du nombre — un seul contrôle ouvert à la fois, contrôlé par l'écran. */
  readonly isCounterOpen: boolean;
  readonly onToggleCounter: () => void;
  /** Chaque pas : N demandé, appliqué par l'écran (`setLayoutCycleCount`). */
  readonly onChangeCount: (count: number) => void;
  /** Un dialogue en attente arrête un maintien de − / + (comme le Circuit). */
  readonly isChoicePending?: boolean;
  readonly counterRef?: { current: View | null };
  /** Mesure de la ligne d'en-tête : l'anneau du rail y est centré. */
  readonly onRowLayout?: ViewProps["onLayout"];
  /** Retrait du titre qui laisse la colonne de l'anneau du rail (dessiné par l'écran). */
  readonly titleInset?: number;
  readonly testID: string;
};

/**
 * PRE-9 B.1b — en-tête du Cycle (D-451 ; référence « Composition : circuits, cycles et création »
 * §4 ; Figma `10744:20108`), sur le modèle de `CircuitHeader` :
 * - le nom « Cycle » (Semi Bold 15), suivi de sa lettre quand plusieurs Cycles sont présents
 *   (« Cycle A », ARB-13) ; AUCUN chevron : un Cycle ne se replie pas ;
 * - le compteur, à abscisse fixe après le nom : « N répétitions » — toucher le nombre (bleu, 15)
 *   révèle le stepper − N + (`CountStepper`, même géométrie et même maintien que le Circuit), bornes
 *   1..99 ; l'unité (13) n'est pas interactive ; AUCUN adjectif de nature ;
 * - la durée du Cycle (12, tertiaire), calée à droite.
 *
 * Accessibilité : le titre est un en-tête lu avec la durée ; puis, stepper révélé, −, le réglage
 * ajustable « Nombre de répétitions » (valeur annoncée avec l'unité), +.
 */
export function CycleHeader({
  letter,
  count,
  duration,
  isCounterOpen,
  onToggleCounter,
  onChangeCount,
  isChoicePending = false,
  counterRef,
  onRowLayout,
  titleInset = 0,
  testID,
}: CycleHeaderProps) {
  const t = strings.screens.composition.cycle;
  const title = containerTitle(t.title, letter);
  return (
    <View style={[styles.header, { paddingLeft: titleInset }]} testID={testID}>
      <View style={styles.row} onLayout={onRowLayout} testID={`${testID}-row`}>
        <Text
          style={styles.title}
          numberOfLines={1}
          accessibilityRole="header"
          accessibilityLabel={`${title}, ${duration}`}
          testID={`${testID}-title`}
        >
          {title}
        </Text>
        <View style={styles.counterSlot} testID={`${testID}-counter-slot`}>
          <View style={styles.counter} testID={`${testID}-counter-row`}>
            <CountStepper
              count={count}
              min={CYCLE_REPEAT_COUNT_MIN}
              max={CYCLE_REPEAT_COUNT_MAX}
              isOpen={isCounterOpen}
              onToggle={onToggleCounter}
              onChange={onChangeCount}
              isInterrupted={isChoicePending || !isCounterOpen}
              accessibilityLabel={t.countAccessibilityLabel}
              spokenValue={cycleCountSpokenValue(count)}
              decrementAccessibilityLabel={t.decrementAccessibilityLabel}
              incrementAccessibilityLabel={t.incrementAccessibilityLabel}
              externalRef={counterRef}
              counterTestID={`${testID}-counter`}
            />
            {/* L'unité n'est pas interactive ; elle est annoncée avec la valeur du réglage. */}
            <Text
              style={styles.unit}
              numberOfLines={1}
              accessible={false}
              importantForAccessibility="no"
              testID={`${testID}-counter-unit`}
            >
              {cycleUnitLabel(count)}
            </Text>
          </View>
        </View>
        {/* Lue avec le nom (VoiceOver), elle est retirée de l'accessibilité ici. */}
        <Text
          style={styles.duration}
          numberOfLines={1}
          accessible={false}
          importantForAccessibility="no"
          testID={`${testID}-duration`}
        >
          {duration}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Même ligne que l'en-tête du Circuit : hauteur minimale 40 (Dynamic Type).
  header: {
    minHeight: CIRCUIT_HEADER_HEIGHT,
  },
  row: {
    minHeight: CIRCUIT_HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    flexShrink: 1,
    minWidth: 0,
    ...type.compactCardTitle,
    color: colors.textPrimary,
  },
  counterSlot: {
    flexShrink: 0,
    marginLeft: CIRCUIT_HEADER_TOUCH_GEOMETRY.titleToCounterGap,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  unit: {
    flexShrink: 0,
    ...type.segmentedCompactLabel,
    color: colors.textPrimary,
  },
  duration: {
    ...type.supporting,
    flex: 1,
    minWidth: 0,
    marginLeft: spacing[8],
    textAlign: "right",
    color: TEXT_TERTIARY,
  },
});
