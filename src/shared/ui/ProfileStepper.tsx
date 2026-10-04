import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { nextGridValue, previousGridValue } from "@/domain/preferences/Profile";
import { strings } from "@/shared/i18n";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/** Maintien : immédiat, puis 450 ms, puis toutes les 150 ms (T5, ANI-06, CE-UI-07 L2549). */
const INITIAL_REPEAT_DELAY_MS = 450;
const REPEAT_INTERVAL_MS = 150;

export type ProfileStepperProps = {
  readonly label: string;
  readonly unit: string;
  /** Valeur confirmée (dernière valeur persistée) — relue après réouverture. */
  readonly value: number;
  readonly min: number;
  readonly max: number;
  /** Pause entre les côtés / Récupération après exercice : grille v12 L93-100 (T2/T3), jamais un pas de 1 s. */
  readonly gridBased?: boolean;
  /** Un seul stepper ouvert à la fois (D-227) — contrôlé par l'écran appelant. */
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  /**
   * Une seule écriture atomique par geste, au relâchement (T6) — jamais à
   * chaque cran. Retourne `true` en cas de succès ; `false` restitue la
   * dernière valeur confirmée et affiche un message d'erreur.
   */
  readonly onCommit: (value: number) => Promise<boolean>;
  readonly testID: string;
};

/**
 * Stepper canonique du Profil (D-227, ANI-06, CE-UI-07 L2533/L2541/L2545/
 * L2549/L2557/L2561/L2565/L2569) : la ligne affiche la valeur ; un appui sur
 * la ligne l'ouvre (remplace la valeur par les contrôles −/valeur/+, rendu
 * lavande DSF) ; un appui incrémente immédiatement ; un maintien répète
 * après 450 ms puis toutes les 150 ms, jusqu'au relâchement, où une seule
 * écriture est tentée.
 */
export function ProfileStepper({
  label,
  unit,
  value,
  min,
  max,
  gridBased = false,
  isOpen,
  onToggle,
  onCommit,
  testID,
}: ProfileStepperProps) {
  const [working, setWorking] = useState(value);
  // Patron React recommandé pour ajuster un état depuis une prop SANS effet
  // (https://react.dev/learn/you-might-not-need-an-effect) — `value` change
  // uniquement entre deux gestes (relecture après confirmation, ou échec
  // restituant la dernière valeur confirmée — géré explicitement dans
  // `stopRepeating`), jamais pendant un maintien. Un ref n'est jamais écrit
  // ici (interdit pendant le rendu) : `workingRef` se resynchronise depuis
  // `working` au DÉBUT de chaque geste (`startRepeating`, un gestionnaire
  // d'événement).
  const [observedValue, setObservedValue] = useState(value);
  if (value !== observedValue) {
    setObservedValue(value);
    setWorking(value);
  }
  const workingRef = useRef(value);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasChangedRef = useRef(false);
  const t = strings.screens.profile.stepper;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function clearTimers() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function step(direction: 1 | -1) {
    const current = workingRef.current;
    const stepped = gridBased
      ? direction === 1
        ? nextGridValue(current)
        : previousGridValue(current)
      : current + direction;
    const bounded = Math.min(max, Math.max(min, stepped));
    if (bounded === current) {
      return;
    }
    workingRef.current = bounded;
    setWorking(bounded);
    hasChangedRef.current = true;
  }

  function startRepeating(direction: 1 | -1) {
    setErrorMessage(null);
    workingRef.current = working;
    step(direction);
    timeoutRef.current = setTimeout(() => {
      step(direction);
      intervalRef.current = setInterval(() => step(direction), REPEAT_INTERVAL_MS);
    }, INITIAL_REPEAT_DELAY_MS);
  }

  async function stopRepeating() {
    clearTimers();
    if (!hasChangedRef.current) {
      return;
    }
    hasChangedRef.current = false;
    const committedValue = workingRef.current;
    const succeeded = await onCommit(committedValue);
    if (!succeeded) {
      workingRef.current = value;
      setWorking(value);
      setErrorMessage(t.saveError);
    }
  }

  const atMin = working <= min;
  const atMax = working >= max;
  const valueLabel = `${working} ${unit}`;

  if (!isOpen) {
    return (
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${valueLabel}`}
        style={styles.closedRow}
        testID={testID}
      >
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.closedValue} testID={`${testID}-value`}>
          {valueLabel}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.openRow} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable
          disabled={atMin}
          onPressIn={() => startRepeating(-1)}
          onPressOut={stopRepeating}
          accessibilityRole="button"
          accessibilityLabel={atMin ? `${t.decrementAccessibilityLabel} — ${t.minimumReachedSuffix}` : t.decrementAccessibilityLabel}
          accessibilityState={{ disabled: atMin }}
          hitSlop={(minTouchTarget - 32) / 2}
          style={[styles.stepButton, atMin ? styles.stepButtonDisabled : null]}
          testID={`${testID}-decrement`}
        >
          <Text style={[styles.stepButtonLabel, atMin ? styles.stepButtonLabelDisabled : null]}>−</Text>
        </Pressable>
        <Text
          style={styles.openValue}
          accessibilityLabel={valueLabel}
          testID={`${testID}-value`}
        >
          {valueLabel}
        </Text>
        <Pressable
          disabled={atMax}
          onPressIn={() => startRepeating(1)}
          onPressOut={stopRepeating}
          accessibilityRole="button"
          accessibilityLabel={atMax ? `${t.incrementAccessibilityLabel} — ${t.maximumReachedSuffix}` : t.incrementAccessibilityLabel}
          accessibilityState={{ disabled: atMax }}
          hitSlop={(minTouchTarget - 32) / 2}
          style={[styles.stepButton, atMax ? styles.stepButtonDisabled : null]}
          testID={`${testID}-increment`}
        >
          <Text style={[styles.stepButtonLabel, atMax ? styles.stepButtonLabelDisabled : null]}>+</Text>
        </Pressable>
      </View>
      {errorMessage ? (
        <Text style={styles.errorText} testID={`${testID}-error`}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  closedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: minTouchTarget,
    paddingVertical: spacing[8],
  },
  openRow: {
    paddingVertical: spacing[8],
    gap: spacing[8],
  },
  label: {
    ...type.body,
    color: colors.textPrimary,
  },
  closedValue: {
    ...type.label,
    color: colors.textSecondary,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing[12],
  },
  // D-227 : rendu lavande DSF — réutilise `colors.selectionSurface`/`colors.selection`, déjà les tokens canoniques du projet pour cette teinte.
  openValue: {
    ...type.label,
    minWidth: 56,
    textAlign: "center",
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[12],
    borderRadius: 16,
    backgroundColor: colors.selectionSurface,
    color: colors.selection,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.selectionSurface,
  },
  stepButtonDisabled: {
    backgroundColor: colors.surface,
  },
  stepButtonLabel: {
    ...type.button,
    color: colors.selection,
  },
  stepButtonLabelDisabled: {
    color: colors.disabled,
  },
  errorText: {
    ...type.caption,
    color: colors.danger,
  },
});
