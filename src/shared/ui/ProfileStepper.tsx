import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { nextGridValue, previousGridValue } from "@/domain/preferences/Profile";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * Alignement DSF 07/10 — `DSF / Controls / Stepper / Profil` (`5544:4732`) :
 * pilule `#F2F2FF` de 36 de haut, rayon 18, marge interne 4, écart 2 ;
 * deux cercles blancs de 28 (rayon 14) portant les signes « − »/« + » ;
 * valeur Inter Semi Bold 13 en `color/primary`, centrée sur 50. La cible
 * tactile reste 48 × 48 via `hitSlop`.
 */
const STEP_CIRCLE = 28;
const STEPPER_HEIGHT = 36;
const STEPPER_VALUE_WIDTH = 50;

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
  // CE-UI-07 L2569 : la valeur annonce, en TOUTE position (mi-course, borne
  // basse, borne haute), sa valeur, son unité ET les bornes du réglage —
  // jamais seulement au bouton désactivé à la limite.
  const boundsLabel = t.boundsAccessibilityLabel
    .replace("{value}", valueLabel)
    .replace("{min}", String(min))
    .replace("{max}", `${max} ${unit}`);

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
      <View style={styles.openLine}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.controls}>
          <Pressable
            disabled={atMin}
            onPressIn={() => startRepeating(-1)}
            onPressOut={stopRepeating}
            accessibilityRole="button"
            accessibilityLabel={atMin ? `${t.decrementAccessibilityLabel} — ${t.minimumReachedSuffix}` : t.decrementAccessibilityLabel}
            accessibilityState={{ disabled: atMin }}
            hitSlop={(minTouchTarget - STEP_CIRCLE) / 2}
            style={styles.stepButton}
            testID={`${testID}-decrement`}
          >
            <KodjoIcon
              name="stepper-minus"
              tintColor={atMin ? colors.disabled : colors.primary}
              testID={`${testID}-decrement-icon`}
            />
          </Pressable>
          <Text
            style={styles.openValue}
            accessibilityLabel={boundsLabel}
            accessibilityValue={{ min, max, now: working }}
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
            hitSlop={(minTouchTarget - STEP_CIRCLE) / 2}
            style={styles.stepButton}
            testID={`${testID}-increment`}
          >
            <KodjoIcon
              name="stepper-plus"
              tintColor={atMax ? colors.disabled : colors.primary}
              testID={`${testID}-increment-icon`}
            />
          </Pressable>
        </View>
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
  // Alignement DSF 07/10 : le stepper ouvert remplace la valeur SUR LA MÊME
  // LIGNE que le libellé (`Profil — Stepper Pause changement de côté`,
  // `1992:474`), sans étirer le groupe ; le message d'erreur éventuel
  // reste sous la ligne.
  openRow: {
    paddingVertical: spacing[6],
    gap: spacing[8],
  },
  openLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[8],
  },
  label: {
    ...type.body,
    flexShrink: 1,
    color: colors.textPrimary,
  },
  // `DSF / Forms / Valeur modifiable` (`6944:26423`, `Texte=13, État=Normal`) :
  // fond `color/surface`, rayon 10, marges 4 × 10, texte Semi Bold 13 en
  // `color/primary`.
  closedValue: {
    ...type.editableValue,
    color: colors.primary,
    backgroundColor: colors.surface,
    borderRadius: fixedRadii[10],
    overflow: "hidden",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[10],
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: STEPPER_HEIGHT,
    padding: spacing[4],
    gap: spacing[2],
    borderRadius: STEPPER_HEIGHT / 2,
    backgroundColor: colors.stepperSurface,
  },
  openValue: {
    ...type.editableValue,
    minWidth: STEPPER_VALUE_WIDTH,
    textAlign: "center",
    paddingHorizontal: spacing[4],
    color: colors.primary,
  },
  // Le cercle reste identique aux bornes : seul le signe passe en
  // `color/disabled` (l'état reste annoncé par `accessibilityState`).
  stepButton: {
    width: STEP_CIRCLE,
    height: STEP_CIRCLE,
    borderRadius: STEP_CIRCLE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  errorText: {
    ...type.caption,
    color: colors.danger,
  },
});
