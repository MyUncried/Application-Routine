import { useEffect, useRef } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from "react-native";

import { EXECUTION_BOUNDS } from "@/domain/activities/ExecutionParameters";
import type { CircuitNature } from "@/domain/sessions/circuit";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { strings } from "@/shared/i18n";
import { EXECUTION_UNIT_HOLD_POLICY, InlineStepper } from "@/shared/ui/ProfileStepper";
import { colors, fixedRadii, spacing, type } from "@/shared/ui/tokens";

/**
 * Compte du Circuit (AD-38, D-058) : 1..99, la borne même de `clampSeriesCount` appliquée par
 * `setCircuitCount` — jamais une constante locale.
 */
const CIRCUIT_COUNT_MIN = EXECUTION_BOUNDS.seriesCount.min;
const CIRCUIT_COUNT_MAX = EXECUTION_BOUNDS.seriesCount.max;

/** Cible tactile du chiffre au repos (Figma `8328:28667`) : 44 de haut, 44 de large avec la marge gauche. */
const COUNTER_TOUCH_TARGET = 44;
const COUNTER_DIGIT_MIN_WIDTH = 32;
const COUNTER_DIGIT_HIT_SLOP = { left: COUNTER_TOUCH_TARGET - COUNTER_DIGIT_MIN_WIDTH } as const;

/** Fond du stepper révélé (Figma `8328:28671`) : blanc, rayon 18 (pilule de 36). */
const OPEN_COUNTER_RADIUS = 18;

/** Titre « Circuit » : Inter Semi Bold 16, texte primaire. */
const TITLE_TEXT = type.cardTitle;
/** Durée du Circuit : Inter Regular 12, texte tertiaire. */
const DURATION_TEXT = type.supporting;
/** Chiffre et pastille : Inter Semi Bold 13. */
const COUNTER_TEXT = type.editableValue;

/** Unité accordée du compteur : « tour » / « tours », « série » / « séries » (N = 1 singulier). */
export function circuitUnitLabel(nature: CircuitNature, count: number): string {
  const unit = strings.screens.composition.circuit.unit[nature];
  return count === 1 ? unit.singular : unit.plural;
}

/** Valeur annoncée du réglage : « 4 tours ». */
export function circuitCountSpokenValue(nature: CircuitNature, count: number): string {
  return `${count} ${circuitUnitLabel(nature, count)}`;
}

export type CircuitHeaderProps = {
  readonly nature: CircuitNature;
  /** N du Circuit (1..99). */
  readonly count: number;
  /** Durée du Circuit déjà formatée (`formatCompositionSummary` : durée seule, « — min » à vide, ≈ / ≥). */
  readonly duration: string;
  /** Stepper révélé — un seul champ numérique actif à la fois, contrôlé par l'écran. */
  readonly isCounterOpen: boolean;
  /** Révèle ou referme le stepper. */
  readonly onToggleCounter: () => void;
  /** Chaque pas (ou chaque action VoiceOver) : N demandé, appliqué par l'écran via `setCircuitCount`. */
  readonly onChangeCount: (count: number) => void;
  readonly testID: string;
};

/**
 * En-tête du Circuit (PRE-6 story 3.1, CIR-10, AD-41, AD-42, Figma `8328:28667`), rendu dans
 * le conteneur Circuit existant ; remplace `TourCard` et sa roulette du compte.
 *
 * - À gauche : « Circuit » et, dessous, la seule durée du Circuit (D-382, D-390, D-399). La
 *   durée se tronque en premier ; le compteur garde sa taille.
 * - À droite, au repos : le chiffre (cible 44) puis la pastille d'unité (`Valeur modifiable`),
 *   accordée selon la nature. La pastille est sans action dans cette story (nature : 3.2).
 * - Toucher le chiffre révèle `InlineStepper` (sans pilule, sur le fond blanc arrondi 18 de
 *   `8328:28671`, cercles 28 `color/surface`) : − et + autour de « chiffre + pastille », bornes
 *   1..99. Toucher la valeur le referme (RC-4) ; l'écran le referme aussi sur un toucher
 *   ailleurs. Mêmes actions d'échappement et même focus VoiceOver que les champs ± révélés de
 *   la Feuille (PRE-5).
 * - VoiceOver : réglage ajustable « Nombre de tours » / « Nombre de séries », valeur annoncée
 *   avec l'unité, utilisable sans révéler le stepper (incrémenter / décrémenter) ; « activer »
 *   révèle le stepper.
 */
export function CircuitHeader({
  nature,
  count,
  duration,
  isCounterOpen,
  onToggleCounter,
  onChangeCount,
  testID,
}: CircuitHeaderProps) {
  const t = strings.screens.composition.circuit;
  return (
    <View style={styles.row} testID={testID}>
      <View style={styles.textBlock} testID={`${testID}-text-block`}>
        <Text style={styles.title} numberOfLines={1} testID={`${testID}-title`}>
          {t.title}
        </Text>
        <Text style={styles.duration} numberOfLines={1} testID={`${testID}-duration`}>
          {duration}
        </Text>
      </View>
      <CircuitCounter
        nature={nature}
        count={count}
        isOpen={isCounterOpen}
        onToggle={onToggleCounter}
        onChange={onChangeCount}
        testID={`${testID}-counter`}
      />
    </View>
  );
}

function UnitPill({ nature, count, testID }: { nature: CircuitNature; count: number; testID: string }) {
  return (
    <View style={styles.unitPill} testID={testID}>
      <Text style={styles.unitPillText} numberOfLines={1} testID={`${testID}-text`}>
        {circuitUnitLabel(nature, count)}
      </Text>
    </View>
  );
}

/**
 * Focus VoiceOver du stepper révélé — même logique que `useOpenFieldFocus` de la Feuille
 * (H13) : à l'ouverture, le focus passe au champ ; à une fermeture demandée par l'action
 * accessible du champ, il revient au compteur au repos.
 */
function useCounterFocus(isOpen: boolean, onToggle: () => void) {
  const fieldRef = useRef<View>(null);
  const restRef = useRef<View>(null);
  const closedByAccessibilityRef = useRef(false);
  useEffect(() => {
    const target = isOpen ? fieldRef.current : closedByAccessibilityRef.current ? restRef.current : null;
    closedByAccessibilityRef.current = false;
    if (target) AccessibilityInfo.sendAccessibilityEvent(target, "focus");
  }, [isOpen]);
  const closeFromAccessibility = () => {
    closedByAccessibilityRef.current = true;
    onToggle();
  };
  return { fieldRef, restRef, closeFromAccessibility };
}

function CircuitCounter({
  nature,
  count,
  isOpen,
  onToggle,
  onChange,
  testID,
}: {
  nature: CircuitNature;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (count: number) => void;
  testID: string;
}) {
  const t = strings.screens.composition.circuit;
  const { fieldRef, restRef, closeFromAccessibility } = useCounterFocus(isOpen, onToggle);
  const accessibilityLabel = t.countAccessibilityLabel[nature];
  const spoken = circuitCountSpokenValue(nature, count);
  const atMin = count <= CIRCUIT_COUNT_MIN;
  const atMax = count >= CIRCUIT_COUNT_MAX;

  if (!isOpen) {
    return (
      <View
        ref={restRef}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: CIRCUIT_COUNT_MIN, max: CIRCUIT_COUNT_MAX, now: count, text: spoken }}
        accessibilityState={{ expanded: false }}
        accessibilityActions={[
          ...(atMax ? [] : [{ name: "increment" }]),
          ...(atMin ? [] : [{ name: "decrement" }]),
          { name: "activate" },
        ]}
        onAccessibilityAction={(event) => {
          const action = event.nativeEvent.actionName;
          if (action === "increment" && !atMax) onChange(count + 1);
          if (action === "decrement" && !atMin) onChange(count - 1);
          if (action === "activate") onToggle();
        }}
        style={styles.counter}
        testID={testID}
      >
        <Pressable
          onPress={onToggle}
          hitSlop={COUNTER_DIGIT_HIT_SLOP}
          style={styles.digitTouch}
          testID={`${testID}-value-press`}
        >
          <Text style={styles.digit} testID={`${testID}-value`}>
            {count}
          </Text>
        </Pressable>
        <UnitPill nature={nature} count={count} testID={`${testID}-unit`} />
      </View>
    );
  }

  return (
    <View
      ref={fieldRef}
      // Le champ retient tout toucher qui n'atteint pas un ± actif (± à la borne, pastille) :
      // ce toucher ne remonte pas à l'appui extérieur de l'écran (même règle que la Feuille).
      // Échappement et Magic Tap remontent depuis l'élément focalisé jusqu'à ce conteneur ;
      // l'action nommée « Fermer », elle, est portée par le réglage focalisé (`closeAction`).
      onStartShouldSetResponder={() => true}
      onAccessibilityEscape={closeFromAccessibility}
      onMagicTap={closeFromAccessibility}
      style={styles.openField}
      testID={`${testID}-field`}
    >
      <InlineStepper
        value={count}
        min={CIRCUIT_COUNT_MIN}
        max={CIRCUIT_COUNT_MAX}
        policy={EXECUTION_UNIT_HOLD_POLICY}
        formatValue={(value) => String(value ?? count)}
        spokenValue={(value) => circuitCountSpokenValue(nature, value ?? count)}
        onChange={onChange}
        // Toucher la valeur referme (RC-4), comme `onValuePress={onClose}` de la Feuille : la
        // fermeture « accessible » (focus rendu au compteur) reste réservée aux chemins VoiceOver
        // (« activer », échappement, Magic Tap, « Fermer »).
        onValuePress={onToggle}
        onValueActivate={closeFromAccessibility}
        closeAction={{ label: strings.executionParameters.sheet.closeField, onClose: closeFromAccessibility }}
        accessibilityLabel={accessibilityLabel}
        appearance="bare"
        valueStyle={styles.openDigit}
        stepButtonStyle={styles.stepButton}
        accessory={<UnitPill nature={nature} count={count} testID={`${testID}-unit`} />}
        testID={`${testID}-stepper`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
  },
  // La durée (et au besoin le titre) se tronque ; le compteur, lui, ne rétrécit jamais.
  textBlock: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    gap: spacing[2],
  },
  // Le titre ne se tronque jamais avant la durée (`flexShrink: 0`).
  title: {
    flexShrink: 0,
    ...TITLE_TEXT,
    color: colors.textPrimary,
  },
  duration: {
    ...DURATION_TEXT,
    color: TEXT_TERTIARY,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: spacing[4],
  },
  digitTouch: {
    minWidth: COUNTER_DIGIT_MIN_WIDTH,
    minHeight: COUNTER_TOUCH_TARGET,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  digit: {
    ...COUNTER_TEXT,
    color: colors.textPrimary,
  },
  // `DSF / Forms / Valeur modifiable` : fond `color/surface`, rayon 10, marges 10 / 4,
  // Semi Bold 13 `color/primary`.
  unitPill: {
    backgroundColor: colors.surface,
    borderRadius: fixedRadii[10],
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[4],
  },
  unitPillText: {
    ...COUNTER_TEXT,
    color: colors.primary,
  },
  openField: {
    flexShrink: 0,
    backgroundColor: colors.background,
    borderRadius: OPEN_COUNTER_RADIUS,
    padding: spacing[4],
  },
  openDigit: {
    color: colors.textPrimary,
    minWidth: 0,
  },
  stepButton: {
    backgroundColor: colors.surface,
  },
});
