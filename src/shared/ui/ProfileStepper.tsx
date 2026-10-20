import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

import { stepWithinBounds } from "@/domain/activities/ExecutionParameters";
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
/**
 * Story 3.6 (NFR-09) : valeur tactile d'une cellule (texte Semi Bold 13, environ 16 de
 * haut) portée à au moins 44 de haut, sans changer le dessin.
 */
const VALUE_HIT_SLOP = { top: 14, bottom: 14 };

/** Maintien : immédiat, puis 450 ms, puis toutes les 150 ms (T5, ANI-06, CE-UI-07 L2549). */
const INITIAL_REPEAT_DELAY_MS = 450;
const REPEAT_INTERVAL_MS = 150;

/**
 * PRE-3 (P3-19, `perimetre-et-couverture.md` §8) — politique de geste
 * OPTIONNELLE des steppers de la feuille Paramètres. La politique du Profil
 * (`PROFILE_HOLD_POLICY`, D-227) reste celle de `ProfileStepper`, inchangée ;
 * aucune accélération PRE-3 n'est propagée au Profil.
 *
 * - tap : un pas de 1, immédiat ;
 * - maintien : aucune répétition avant 500 ms, puis toutes les 150 ms ;
 * - champs accélérés : pas 1, puis 5 après 2 s, puis 10 après 4 s de
 *   maintien, en multiples directionnels (37 → 40 → 45 au pas 5) ;
 * - Bip, Compte à rebours, Fin : pas 1 quel que soit le maintien ;
 * - relâchement : arrêt immédiat, aucun pas supplémentaire.
 */
export type StepperHoldPolicy = {
  readonly initialDelayMs: number;
  readonly intervalMs: number;
  /** Pas applicable après `elapsedMs` de maintien. */
  readonly stepAfter: (elapsedMs: number) => number;
};

export const PROFILE_HOLD_POLICY: StepperHoldPolicy = {
  initialDelayMs: INITIAL_REPEAT_DELAY_MS,
  intervalMs: REPEAT_INTERVAL_MS,
  stepAfter: () => 1,
};

export const EXECUTION_ACCELERATED_HOLD_POLICY: StepperHoldPolicy = {
  initialDelayMs: 500,
  intervalMs: 150,
  stepAfter: (elapsedMs) => (elapsedMs >= 4000 ? 10 : elapsedMs >= 2000 ? 5 : 1),
};

export const EXECUTION_UNIT_HOLD_POLICY: StepperHoldPolicy = {
  initialDelayMs: 500,
  intervalMs: 150,
  stepAfter: () => 1,
};

/**
 * Valeur suivante en multiples DIRECTIONNELS du pas, bornée : au pas 5, 37
 * monte à 40 et descend à 35 ; au pas 1, ±1.
 *
 * PRE-4 story 3.6 (AD-16, P38) : délègue à `stepWithinBounds` du domaine, qui ne
 * renvoie JAMAIS une valeur inférieure à la courante pour + ni supérieure pour −
 * (correction de `steppedValue(5999, +1, 5, 5, 3535)`, qui renvoyait 3535) : la
 * valeur courante est alors renvoyée, et le pas est sans effet. Les valeurs dans
 * les bornes (Profil compris, `PROFILE_HOLD_POLICY` inchangée) ne changent pas de
 * résultat.
 */
export function steppedValue(current: number, direction: 1 | -1, stepSize: number, min: number, max: number): number {
  return stepWithinBounds(current, direction, stepSize, min, max);
}

export type HoldRepeater = {
  start(direction: 1 | -1): void;
  stop(): void;
};

/**
 * Contrôleur de maintien (minuteries JS) : `onStep(direction, pas)` reçoit
 * le tap initial puis chaque répétition ; `stop` coupe immédiatement toute
 * minuterie, sans pas au relâchement.
 */
export function createHoldRepeater(
  policy: StepperHoldPolicy,
  onStep: (direction: 1 | -1, stepSize: number) => void,
  now: () => number = Date.now,
): HoldRepeater {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  const clear = () => {
    if (timeout) clearTimeout(timeout);
    if (interval) clearInterval(interval);
    timeout = null;
    interval = null;
  };
  return {
    start(direction) {
      clear();
      const startedAt = now();
      onStep(direction, 1);
      timeout = setTimeout(() => {
        const tick = () => onStep(direction, policy.stepAfter(now() - startedAt));
        tick();
        interval = setInterval(tick, policy.intervalMs);
      }, policy.initialDelayMs);
    },
    stop: clear,
  };
}

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
export type InlineStepperProps = {
  /** Valeur courante du brouillon (contrôlée) ; `null` = cible non renseignée. */
  readonly value: number | null;
  readonly min: number;
  readonly max: number;
  readonly policy: StepperHoldPolicy;
  /** Texte affiché pour la valeur (`"3 séries"`, `"15 s"`, `"Aucun"`, `"—"`). */
  readonly formatValue: (value: number | null) => string;
  /** Appelé à CHAQUE pas (tap ou répétition) — le parent met à jour son brouillon, sans écriture. */
  readonly onChange: (value: number) => void;
  /** Nom du réglage (avec unité) annoncé par l'ajustable. */
  readonly accessibilityLabel: string;
  readonly disabled?: boolean;
  /** Valeur posée lorsqu'une cible non renseignée (`null`) reçoit un premier pas. */
  readonly emptyStart?: number;
  /** Largeur fixe du stepper (DSF : 137 en premier niveau, 128 dans le tableau, à 402). */
  readonly width?: number;
  /** Cellule signalée (cible active requise non renseignée, v13 §6). */
  readonly invalid?: boolean;
  /** Indice annoncé quand `invalid` (PRE-4) ; par défaut « Valeur à renseigner ». */
  readonly invalidHint?: string;
  /**
   * PRE-4 story 3.6 (AD-16, Q13, Q26, P38) — règle de pas fournie par l'appelant (la
   * règle du domaine `stepTarget` pour une Cible) : valeur après un pas de `stepSize`
   * dans le sens `direction`, ou `"unavailable"` (bouton indisponible, aucun pas). Les
   * ± sont indisponibles quand le pas de 1 l'est. Absente : comportement inchangé
   * (`steppedValue`, `emptyStart`, bornes `min` / `max`).
   */
  readonly stepRule?: (value: number | null, direction: 1 | -1, stepSize: number) => number | "unavailable";
  /**
   * PRE-4 story 3.6 (FR-10-03, Q13) — toucher la VALEUR (entre − et +) ouvre une autre
   * surface (le Sélecteur de la Cible de la ligne). Aussi offert à VoiceOver par
   * l'action « activer » du réglage. Absente : la valeur n'est pas tactile.
   */
  readonly onValuePress?: () => void;
  /**
   * PRE-4 story 3.8 (AC2, FR-22-08) — texte ANNONCÉ de la valeur, quand il diffère du
   * texte affiché (« — » annoncé « aucune valeur »). Absente : la valeur est annoncée
   * telle qu'affichée (`formatValue`).
   */
  readonly spokenValue?: (value: number | null) => string;
  /**
   * PRE-4 story 3.8 (AC2, ch. 13 §18 « limites annoncées ») — opt-in explicite de la
   * Feuille : une valeur DANS les bornes et à une borne est annoncée avec « minimum
   * atteint » et/ou « maximum atteint ». Absente : valeur annoncée sans suffixe.
   */
  readonly announceLimits?: boolean;
  /**
   * PRE-5 story 2.8 (D-432, AD-24) — ajout additif, défaut inchangé. `pill` (défaut) : pilule
   * lavande de 36 (marge 4). `bare` : ni fond, ni marge, ni hauteur minimale, pour loger le
   * stepper dans l'option Avec sélectionnée de la ligne « Phases de l'exercice » (option de
   * 26) ; mêmes cercles de 28, même mécanisme et même accessibilité ajustable.
   */
  readonly appearance?: "pill" | "bare";
  /** PRE-5 story 2.8 : style de la valeur, appliqué après le style par défaut (texte blanc sur le violet de l'option). */
  readonly valueStyle?: StyleProp<TextStyle>;
  /**
   * Recette du 20/10 (RC-16) — ajout additif, absent par défaut : élément rendu entre la valeur et
   * le + (chevron du tableau des phases, désactivé pendant le réglage). Le réglage restant un seul
   * élément ajustable pour VoiceOver, l'état de cet élément est annoncé par `hint`.
   */
  readonly accessory?: ReactNode;
  /** RC-16 : indice annoncé hors valeur signalée (`invalid` garde `invalidHint`). */
  readonly hint?: string;
  /**
   * PRE-6 story 3.1 — ajout additif, absent par défaut : fond des cercles − et + (cercles
   * `color/surface` du compteur du Circuit, sur fond blanc). Seul le fond est réglable : taille
   * et marge de toucher restent celles de `STEP_CIRCLE` ; mécanisme et accessibilité inchangés.
   */
  readonly stepButtonStyle?: Pick<ViewStyle, "backgroundColor">;
  /**
   * PRE-6 story 3.1 — ajout additif, absent par défaut : action accessible nommée « close »
   * (libellé fourni) portée par le réglage ajustable lui-même, seul élément focalisé par
   * VoiceOver ; elle appelle `onClose`. Absente : actions inchangées.
   */
  readonly closeAction?: { readonly label: string; readonly onClose: () => void };
  /**
   * PRE-6 story 3.1 — ajout additif : appelé par l'action VoiceOver « activer » à la place de
   * `onValuePress` (qui reste celui du toucher). Absent : « activer » appelle `onValuePress`.
   */
  readonly onValueActivate?: () => void;
  readonly testID: string;
};

/**
 * Stepper EN PLACE de la feuille Paramètres (PRE-3) — même rendu DSF
 * `Stepper` (pilule 36, cercles 28, valeur Semi Bold 13) que le Profil, mais
 * toujours ouvert et sans écriture : chaque pas met à jour le brouillon de
 * la feuille. Exposé à VoiceOver comme un réglage ajustable (incrémenter /
 * décrémenter), valeur et bornes annoncées.
 */
export function InlineStepper({
  value,
  min,
  max,
  policy,
  formatValue,
  onChange,
  accessibilityLabel,
  disabled = false,
  emptyStart,
  width,
  invalid = false,
  invalidHint = strings.executionParameters.sheet.invalidHint,
  stepRule,
  onValuePress,
  spokenValue,
  announceLimits = false,
  appearance = "pill",
  valueStyle,
  accessory,
  hint,
  stepButtonStyle,
  closeAction,
  onValueActivate,
  testID,
}: InlineStepperProps) {
  const t = strings.screens.profile.stepper;
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  // Recette 2 (T-10 / F-02) : le répéteur est créé au PREMIER appui et garde la
  // fonction de pas de ce rendu. Bornes et valeur de départ sont donc relues ici,
  // à jour à chaque rendu : après un changement de mode, une ligne vide démarre
  // à la valeur du NOUVEAU mode (1 rép.), jamais à celle de l'ancien (30 s).
  // Story 3.6 : la règle de pas de l'appelant est relue de même.
  const configRef = useRef({ min, max, emptyStart, stepRule });
  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
    configRef.current = { min, max, emptyStart, stepRule };
  });
  const repeaterRef = useRef<HoldRepeater | null>(null);
  const repeaterPolicyRef = useRef(policy);

  function applyStep(direction: 1 | -1, stepSize: number) {
    const { min, max, emptyStart, stepRule } = configRef.current;
    const current = valueRef.current;
    const ruled = stepRule ? stepRule(current, direction, stepSize) : null;
    if (ruled === "unavailable") {
      return;
    }
    const next =
      ruled !== null
        ? ruled
        : current === null
          ? Math.min(max, Math.max(min, emptyStart ?? min))
          : steppedValue(current, direction, stepSize, min, max);
    if (next === current) {
      return;
    }
    valueRef.current = next;
    onChangeRef.current(next);
  }

  function repeater(): HoldRepeater {
    // Une politique de maintien différente (autre champ) recrée le répéteur.
    if (!repeaterRef.current || repeaterPolicyRef.current !== policy) {
      repeaterRef.current?.stop();
      repeaterRef.current = createHoldRepeater(policy, applyStep);
      repeaterPolicyRef.current = policy;
    }
    return repeaterRef.current;
  }

  useEffect(() => () => repeaterRef.current?.stop(), []);

  // Story 3.6 : avec une règle de pas, un bouton est indisponible quand le pas de 1 l'est
  // (Cible à l'échec, − sur une Cible à renseigner, + au-delà de la borne haute).
  const atMin = disabled || (stepRule ? stepRule(value, -1, 1) === "unavailable" : value !== null && value <= min);
  const atMax = disabled || (stepRule ? stepRule(value, 1, 1) === "unavailable" : value !== null && value >= max);
  const display = formatValue(value);
  // Story 3.6 (AC13) : avec une règle de pas, VoiceOver ne propose que les pas disponibles
  // (aucun à l'échec, aucun + au-delà de la borne) ; sans règle, les deux actions comme avant.
  // L'action « activer » ouvre la surface de la valeur, sauf réglage désactivé.
  const valuePressable = onValuePress !== undefined && !disabled;
  const stepActions = stepRule
    ? [...(atMax ? [] : [{ name: "increment" }]), ...(atMin ? [] : [{ name: "decrement" }])]
    : [{ name: "increment" }, { name: "decrement" }];
  // PRE-4 story 3.8 (AC2, FR-22-08, ch. 13 §18 « limites annoncées »), sur opt-in
  // `announceLimits` : une valeur numérique DANS les bornes et à une borne est annoncée
  // avec « minimum atteint » et/ou « maximum atteint » (les deux si min = max ; clés
  // existantes du stepper du Profil). Une valeur hors bornes (ancienne 4 s, 5999 s), une
  // valeur sans nombre (« — », « à l’échec ») ou un réglage désactivé : aucun suffixe.
  const spoken = spokenValue ? spokenValue(value) : display;
  const inBounds = value !== null && value >= min && value <= max;
  const limits =
    announceLimits && inBounds && !disabled
      ? [...(atMin ? [t.minimumReachedSuffix] : []), ...(atMax ? [t.maximumReachedSuffix] : [])]
      : [];
  const valueText = [spoken, ...limits].join(", ");

  return (
    <View
      style={[
        styles.controls,
        appearance === "bare" ? styles.controlsBare : null,
        width !== undefined ? { width, justifyContent: "space-between" } : null,
        invalid ? styles.controlsInvalid : null,
        disabled ? styles.controlsDisabled : null,
      ]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={value === null ? { text: valueText } : { min, max, now: value, text: valueText }}
      accessibilityState={{ disabled }}
      accessibilityHint={invalid ? invalidHint : hint}
      accessibilityActions={[
        ...stepActions,
        ...(valuePressable ? [{ name: "activate" }] : []),
        ...(closeAction ? [{ name: "close", label: closeAction.label }] : []),
      ]}
      onAccessibilityAction={(event) => {
        if (disabled) return;
        if (event.nativeEvent.actionName === "increment" && !atMax) applyStep(1, 1);
        if (event.nativeEvent.actionName === "decrement" && !atMin) applyStep(-1, 1);
        if (event.nativeEvent.actionName === "activate" && valuePressable) (onValueActivate ?? onValuePress)?.();
        if (event.nativeEvent.actionName === "close") closeAction?.onClose();
      }}
      testID={testID}
    >
      <Pressable
        disabled={atMin}
        onPressIn={() => repeater().start(-1)}
        onPressOut={() => repeater().stop()}
        accessibilityRole="button"
        accessibilityLabel={
          atMin && !disabled ? `${t.decrementAccessibilityLabel} — ${t.minimumReachedSuffix}` : t.decrementAccessibilityLabel
        }
        accessibilityState={{ disabled: atMin }}
        hitSlop={(minTouchTarget - STEP_CIRCLE) / 2}
        style={[styles.stepButton, stepButtonStyle]}
        testID={`${testID}-decrement`}
      >
        <KodjoIcon name="stepper-minus" tintColor={atMin ? colors.disabled : colors.primary} />
      </Pressable>
      {onValuePress ? (
        // Story 3.6 : la valeur seule est tactile ; 44 de haut par `hitSlop`, sans agrandir le dessin.
        // Réglage désactivé : la valeur n'ouvre rien. Des ± indisponibles par la règle de pas
        // (échec, borne) ne désactivent pas la valeur, qui reste touchable.
        <Pressable
          onPress={onValuePress}
          disabled={!valuePressable}
          hitSlop={VALUE_HIT_SLOP}
          testID={`${testID}-value-press`}
        >
          <Text style={[styles.openValue, valueStyle]} testID={`${testID}-value`}>
            {display}
          </Text>
        </Pressable>
      ) : (
        <Text style={[styles.openValue, valueStyle]} testID={`${testID}-value`}>
          {display}
        </Text>
      )}
      {accessory}
      <Pressable
        disabled={atMax}
        onPressIn={() => repeater().start(1)}
        onPressOut={() => repeater().stop()}
        accessibilityRole="button"
        accessibilityLabel={
          atMax && !disabled ? `${t.incrementAccessibilityLabel} — ${t.maximumReachedSuffix}` : t.incrementAccessibilityLabel
        }
        accessibilityState={{ disabled: atMax }}
        hitSlop={(minTouchTarget - STEP_CIRCLE) / 2}
        style={[styles.stepButton, stepButtonStyle]}
        testID={`${testID}-increment`}
      >
        <KodjoIcon name="stepper-plus" tintColor={atMax ? colors.disabled : colors.primary} />
      </Pressable>
    </View>
  );
}

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
  controlsDisabled: {
    opacity: 0.45,
  },
  // PRE-5 story 2.8 (`appearance="bare"`) : ni fond, ni marge, ni hauteur minimale.
  controlsBare: {
    minHeight: 0,
    padding: 0,
    backgroundColor: "transparent",
  },
  // Cellule à renseigner : fond rouge léger, sans liseré (décision Q35 de Hermann du
  // 2026-10-17, recette iPhone PRE-4 ; remplace le contour figé #FF8D28 de la recette 1,
  // A-02/A-07). Jeton existant `color.dangerSurface` (#FFF1F0, ch. 12).
  controlsInvalid: {
    backgroundColor: colors.dangerSurface,
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
