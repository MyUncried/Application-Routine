import { Pressable, StyleSheet, Text, View, type ViewProps } from "react-native";

import { spokenDurations } from "@/domain/activities/durationFormat";
import { CYCLE_REPEAT_COUNT_MAX, CYCLE_REPEAT_COUNT_MIN } from "@/domain/sessions/structure";
import {
  CIRCUIT_HEADER_HEIGHT,
  CIRCUIT_HEADER_TOUCH_GEOMETRY,
  CONTAINER_TITLE_MIN_WIDTH,
  CountStepper,
  containerMoveAccessibility,
  containerTitle,
  durationGrabProps,
  useContainerColumns,
  type ContainerMoveActions,
} from "@/features/sessions/CircuitHeader";
import { LONG_PRESS_DELAY_MS } from "@/features/sessions/compositionGesture";
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
  /** PRE-9 B.4 (ARB-09) : appui long sur le titre — saisie du Cycle entier pour le glisser ; recette n° 2 du 31/10 : aussi sur la durée. */
  readonly onLongPress?: () => void;
  /** PRE-9 B.4 : alternatives accessibles au glisser (« Monter » / « Descendre »). */
  readonly moveActions?: ContainerMoveActions;
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
 * Recette iPhone du 29/10 (obs-3 c, Hermann) : compteur à l'abscisse de celui du Circuit, nombre calé
 * à droite ; unité contiguë au nombre, dans le stepper, en gras ; durée noire et en gras.
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
  onLongPress,
  moveActions,
  testID,
}: CycleHeaderProps) {
  const t = strings.screens.composition.cycle;
  const title = containerTitle(t.title, letter);
  // Recette n° 2 du 31/10 : la durée porte aussi l'appui long de saisie (comme le titre).
  const durationGrab = durationGrabProps(onLongPress);
  // Recette n° 3 bis du 03/11/2026 (f3s-nom) : compteur à la même abscisse que celui du Circuit, depuis le bord droit.
  const columns = useContainerColumns();
  return (
    <View style={[styles.header, { paddingLeft: titleInset }]} testID={testID}>
      {columns.probe}
      <View style={styles.row} onLayout={onRowLayout} testID={`${testID}-row`}>
        {/* PRE-9 B.4 : le titre porte l'appui long (aucun appui court) ; il reste un en-tête pour VoiceOver. */}
        <Pressable
          onLongPress={onLongPress}
          delayLongPress={LONG_PRESS_DELAY_MS}
          disabled={onLongPress === undefined}
          accessible={false}
          style={[styles.titleTarget, columns.title]}
          testID={`${testID}-grab`}
        >
          <Text
            style={[styles.title, columns.title === null ? null : styles.titleShrinkable]}
            numberOfLines={1}
            accessibilityRole="header"
            accessibilityLabel={spokenDurations(`${title}, ${duration}`)}
            {...containerMoveAccessibility(moveActions)}
            testID={`${testID}-title`}
          >
            {title}
          </Text>
        </Pressable>
        <View style={[styles.counterSlot, columns.counter]} testID={`${testID}-counter-slot`}>
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
              // Recette du 29/10 (obs-3 c) : unité contiguë au nombre, dans le stepper, en gras ;
              // annoncée avec la valeur du réglage.
              unitLabel={cycleUnitLabel(count)}
              counterTestID={`${testID}-counter`}
            />
          </View>
        </View>
        {/* Lue avec le nom (VoiceOver), elle est retirée de l'accessibilité ici. */}
        <Text
          {...durationGrab}
          style={[styles.duration, columns.duration, durationGrab.style]}
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
  // Même ligne que l'en-tête du Circuit : hauteur minimale de son texte, 18 (recette du 29/10).
  header: {
    minHeight: CIRCUIT_HEADER_HEIGHT,
  },
  row: {
    minHeight: CIRCUIT_HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  // PRE-9 B.4 : cible de l'appui long, à la place du titre dans la ligne.
  titleTarget: {
    flexShrink: 1,
    minWidth: CONTAINER_TITLE_MIN_WIDTH,
  },
  // Recette du 29/10 (obs-3 c) : compteur à la même abscisse que celui du Circuit.
  title: {
    flexShrink: 1,
    minWidth: CONTAINER_TITLE_MIN_WIDTH,
    ...type.compactCardTitle,
    color: colors.textPrimary,
  },
  // f3s-nom : colonnes mesurées — le nom cède (ellipse) avant le compteur.
  titleShrinkable: {
    minWidth: 0,
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
  // Recette du 29/10 (obs-3 c) : durée noire et en gras (Semi Bold 12).
  duration: {
    ...type.cardDuration,
    flex: 1,
    minWidth: 0,
    marginLeft: spacing[8],
    textAlign: "right",
    color: colors.textPrimary,
  },
});
