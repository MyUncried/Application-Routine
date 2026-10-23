import { useCallback, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View, type ViewProps } from "react-native";

import { EXECUTION_BOUNDS } from "@/domain/activities/ExecutionParameters";
import type { CircuitNature } from "@/domain/sessions/circuit";
import { CircuitNatureMenu } from "@/features/sessions/CircuitNatureMenu";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import {
  EXECUTION_UNIT_HOLD_POLICY,
  createHoldRepeater,
  steppedValue,
  type HoldRepeater,
} from "@/shared/ui/ProfileStepper";
import { colors, fixedRadii, spacing, type } from "@/shared/ui/tokens";

/**
 * Compte du Circuit (AD-38, D-058) : 1..99, la borne même de `clampSeriesCount` appliquée par
 * `setCircuitCount` / `circuitCountOutcome` — jamais une constante locale.
 */
const CIRCUIT_COUNT_MIN = EXECUTION_BOUNDS.seriesCount.min;
const CIRCUIT_COUNT_MAX = EXECUTION_BOUNDS.seriesCount.max;

/**
 * PRE-6 story 5.2 (D-435, Figma `9819:19948`) : en-tête de 40 — hauteur MINIMALE (revue : Dynamic
 * Type), contenu centré verticalement ; le titre commence après la colonne de l'anneau du rail
 * (`titleInset`, x 69 à 402).
 */
export const CIRCUIT_HEADER_HEIGHT = 40;

/** Titre « Circuit » : Inter Semi Bold 16, texte primaire. */
const TITLE_TEXT = type.cardTitle;
/**
 * PRE-6 story 7.3 (D-437, recette du 22/10, commentaire 9) : nombre et unité à la taille du titre
 * « Circuit » (16), graisse de la « Valeur modifiable » (Semi Bold). Dérivé des jetons existants,
 * sans toucher `tokens.ts`. Story 7.8 (D-438) : plus de durée du Circuit dans l'en-tête.
 */
const COUNTER_TEXT = { ...type.editableValue, fontSize: TITLE_TEXT.fontSize, lineHeight: TITLE_TEXT.lineHeight };

/**
 * PRE-6 story 7.3 (D-437) — géométrie du stepper toujours affiché (Figma `8328:28605`, nœud
 * `9819:19951` : fond blanc de 36, rayon 18, marge 4, cercles 28 `color/surface`).
 *
 * Cibles RÉELLES (jamais `hitSlop` : sous Fabric iOS, `RCTViewComponentView` écarte un toucher hors
 * des limites d'un parent qui ne mesure aucun débordement ; une boîte réelle qui dépasse crée ce
 * débordement chez ses ancêtres — revue 5.3) : − et + sont des boîtes de 44 × 44, cercle de 28
 * centré ; la pastille d'unité est posée dans une boîte de 44 de haut. Chaque boîte déborde du fond
 * de 4 en haut et en bas (marges verticales −4 : la rangée garde 36, l'en-tête 40 — le rail et la
 * bande du Circuit, qui dépendent de sa hauteur mesurée, ne bougent pas), et − / + débordent de 4
 * du côté du bord du fond (marge −8 contre la marge 4 du fond : le cercle reste à 4 du bord).
 *
 * Écarts (recette du 22/10, commentaire 8 : espacer, notamment avec la pastille) : cercle − →
 * chiffre 8 ; chiffre → pastille 6 ; pastille → cercle + 12, soit 4 entre la cible de la pastille et
 * celle du + ; titre → fond 8, soit 4 entre le titre et la cible du − (Figma : 20, avec des textes à
 * 13 ; à 16, l'écart est réduit pour que la durée tienne à 402).
 */
const STEP_TOUCH_TARGET = 44;
const STEP_CIRCLE = 28;
const STEPPER_HEIGHT = 36;
const STEPPER_PADDING = spacing[4];
/** Fond blanc du stepper (Figma `9819:19951`) : rayon 18, moitié de sa hauteur. */
const STEPPER_RADIUS = STEPPER_HEIGHT / 2;
/** Débordement vertical de chaque cible hors du fond de 36 (et de 2 hors de l'en-tête de 40). */
const TARGET_OVERFLOW_Y = (STEP_TOUCH_TARGET - STEPPER_HEIGHT) / 2;
/** Marge de la boîte − / + entre le cercle et le bord de la boîte. */
const STEP_CIRCLE_INSET = (STEP_TOUCH_TARGET - STEP_CIRCLE) / 2;
const MINUS_TO_DIGIT_GAP = spacing[8];
const DIGIT_TO_UNIT_GAP = spacing[6];
const UNIT_TO_PLUS_GAP = spacing[12];
const TITLE_TO_STEPPER_GAP = spacing[8];

/**
 * Exporté pour les tests de géométrie : bords des cibles, en points, le long de la ligne, depuis le
 * bord droit du bloc du titre (≥ 0 : aucun recouvrement du titre) ; les cibles ne se recouvrent pas.
 */
export const CIRCUIT_HEADER_TOUCH_GEOMETRY = {
  touchTarget: STEP_TOUCH_TARGET,
  stepCircle: STEP_CIRCLE,
  stepperHeight: STEPPER_HEIGHT,
  stepperPadding: STEPPER_PADDING,
  targetOverflowY: TARGET_OVERFLOW_Y,
  titleToStepperGap: TITLE_TO_STEPPER_GAP,
  minusToDigitGap: MINUS_TO_DIGIT_GAP,
  digitToUnitGap: DIGIT_TO_UNIT_GAP,
  unitToPlusGap: UNIT_TO_PLUS_GAP,
  /** Bord gauche de la cible du −, depuis le bloc du titre (écart minimal depuis la story 7.8 : le stepper est calé à droite). */
  minusTargetLeft: TITLE_TO_STEPPER_GAP + STEPPER_PADDING - STEP_CIRCLE_INSET,
  /** Écart entre la cible de la pastille (largeur de la pastille) et celle du +. */
  unitToPlusTargetGap: UNIT_TO_PLUS_GAP - STEP_CIRCLE_INSET,
} as const;

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
  /** Chaque pas (ou chaque action VoiceOver) : N demandé, appliqué par l'écran via `circuitCountOutcome` (story 7.2). */
  readonly onChangeCount: (count: number) => void;
  /** PRE-6 story 3.2 — Android / web : panneau du choix de nature ouvert. */
  readonly isNatureMenuOpen: boolean;
  /** Toucher de la pastille (Android / web) : l'écran ouvre le choix. */
  readonly onOpenNatureMenu: () => void;
  /** Second toucher de la pastille (Android / web) : fermeture sans choix, aucune mutation. */
  readonly onCloseNatureMenu: () => void;
  /** iOS : nature choisie dans le menu natif, confiée à l'écran (`prepareNatureChange` / `applyNatureChange`). */
  readonly onSelectNature: (nature: CircuitNature) => void;
  /** Demande de focus sur la pastille (voir `CircuitNatureMenu`). */
  readonly natureFocusRequest: number;
  /**
   * PRE-6 story 5.1b (revue) : référence vers l'élément accessible du compteur (le réglage
   * ajustable), renseignée par l'en-tête, pour que l'écran y porte le focus.
   */
  readonly counterRef?: { current: View | null };
  /** Mesure de l'en-tête dans le conteneur Circuit : ancrage du panneau Android / web par l'écran. */
  readonly onLayout?: ViewProps["onLayout"];
  /**
   * PRE-6 story 4.1 : mode placement — l'en-tête (stepper, pastille) est non interactif et
   * masqué à l'accessibilité. Revue 5.3 (Figma
   * `8328:29270`) : il n'est plus atténué (le nom de la prop est conservé).
   */
  readonly isAttenuated?: boolean;
  /**
   * PRE-6 story 7.3 (revue) : un dialogue de choix (Début / Fin de tour) attend la réponse — un
   * maintien en cours de − ou + s'arrête (aucun pas repris après la réponse). Faux par défaut.
   */
  readonly isChoicePending?: boolean;
  /**
   * PRE-6 story 2.3b : décalage vertical animé (pilote natif) — l'en-tête suit le bord haut du
   * conteneur Circuit pendant le glisser d'une carte. Translation seule : `onLayout` est inchangé.
   */
  readonly translateY?: Animated.Value;
  /**
   * PRE-6 story 5.2 : retrait du titre, depuis le bord gauche de l'en-tête, qui laisse la colonne
   * de l'anneau du rail (dessiné par l'écran) ; 0 par défaut.
   */
  readonly titleInset?: number;
  readonly testID: string;
};

/**
 * En-tête du Circuit (PRE-6 story 3.1, CIR-10, AD-41, AD-42), rendu dans le conteneur Circuit
 * existant ; remplace `TourCard` et sa roulette du compte.
 *
 * - PRE-6 story 5.2 (D-435, Figma `9819:19948`) : une seule ligne de 40 — « Circuit », puis le
 *   stepper ; le titre se tronque, le stepper garde sa taille. Story 7.8 (D-438, remplace sur ce
 *   point D-437) : plus de durée du Circuit ; le stepper est aligné à droite de la ligne.
 * - PRE-6 story 5.1b : l'œil des Volumes est dans la zone de contexte (`CompositionContextHeader`).
 * - PRE-6 story 7.3 (D-437, remplace le choix D8 du stepper révélé au toucher du chiffre, Figma
 *   `8328:28605`) : stepper toujours affiché et actif — − , le nombre en « Valeur modifiable », la
 *   pastille d'unité, + — sur le fond blanc arrondi ; textes de la ligne à 16 ; cibles réelles de 44
 *   (voir `CIRCUIT_HEADER_TOUCH_GEOMETRY`). Maintien appuyé : `EXECUTION_UNIT_HOLD_POLICY` (le même
 *   que l'ancien stepper révélé). La pastille seule ouvre le choix de nature (`CircuitNatureMenu`,
 *   menu natif sur iOS, story 3.2).
 * - Accessibilité : quatre éléments, dans l'ordre de lecture — bouton − (« Retirer un tour »),
 *   réglage ajustable « Nombre de tours » / « Nombre de séries » (valeur annoncée avec l'unité,
 *   incrémenter / décrémenter bornés), pastille « Nature du circuit », bouton + (« Ajouter un
 *   tour ») ; − et + annoncent la borne atteinte et leur état désactivé. Le stepper n'est pas un seul
 *   élément accessible (`InlineStepper`) : il engloberait la pastille, qui doit rester atteignable.
 */
export function CircuitHeader({
  nature,
  count,
  onChangeCount,
  isNatureMenuOpen,
  onOpenNatureMenu,
  onCloseNatureMenu,
  onSelectNature,
  natureFocusRequest,
  counterRef,
  onLayout,
  isAttenuated = false,
  isChoicePending = false,
  translateY,
  titleInset = 0,
  testID,
}: CircuitHeaderProps) {
  const t = strings.screens.composition.circuit;
  return (
    <Animated.View
      style={[
        styles.row,
        { paddingLeft: titleInset },
        translateY !== undefined ? { transform: [{ translateY }] } : null,
      ]}
      onLayout={onLayout}
      pointerEvents={isAttenuated ? "none" : "auto"}
      accessibilityElementsHidden={isAttenuated}
      importantForAccessibility={isAttenuated ? "no-hide-descendants" : "auto"}
      testID={testID}
    >
      <View style={styles.textBlock} testID={`${testID}-text-block`}>
        <View style={styles.titleRow} testID={`${testID}-title-row`}>
          <Text style={styles.title} numberOfLines={1} testID={`${testID}-title`}>
            {t.title}
          </Text>
        </View>
      </View>
      {/* Revue 5.2 : le stepper ne rétrécit jamais ni ne quitte la ligne ; sa cible ne remonte pas
          sur le titre (`CIRCUIT_HEADER_TOUCH_GEOMETRY.minusTargetLeft`). */}
      <View style={styles.counterSlot} testID={`${testID}-counter-slot`}>
        <CircuitCounter
          nature={nature}
          count={count}
          onChange={onChangeCount}
          isInterrupted={isAttenuated || isChoicePending}
          isNatureMenuOpen={isNatureMenuOpen}
          onOpenNatureMenu={onOpenNatureMenu}
          onCloseNatureMenu={onCloseNatureMenu}
          onSelectNature={onSelectNature}
          natureFocusRequest={natureFocusRequest}
          externalRef={counterRef}
          testID={`${testID}-counter`}
        />
      </View>
    </Animated.View>
  );
}

/**
 * Pastille d'unité (`DSF / Forms / Valeur modifiable`), dans une boîte de 44 de haut qui sert de
 * cible au déclencheur du choix de nature (marges verticales −4 portées par son conteneur).
 */
function UnitPill({ nature, count, testID }: { nature: CircuitNature; count: number; testID: string }) {
  return (
    <View style={styles.unitTarget} testID={`${testID}-target`}>
      <View style={styles.unitPill} testID={testID}>
        <Text style={styles.unitPillText} numberOfLines={1} testID={`${testID}-text`}>
          {circuitUnitLabel(nature, count)}
        </Text>
      </View>
    </View>
  );
}

/**
 * Revue 7.3 : délai avant le premier pas (`unstable_pressDelay` de `Pressable`). Le stepper est
 * désormais toujours visible dans la liste défilante : un défilement qui commence sur − ou + est
 * repris par le `ScrollView` avant ce délai, sans pas accidentel (un − à N = 1 peut retirer des
 * Points d'arrêt). Un toucher bref relâché avant le délai donne quand même son pas (Pressability
 * active puis désactive au relâchement).
 */
const STEP_PRESS_DELAY_MS = 100;

/**
 * Pas du stepper (premier pas, puis maintien `EXECUTION_UNIT_HOLD_POLICY`), même mécanique que
 * `InlineStepper` : le répéteur part de la valeur du dernier pas demandé (`countRef`), resynchronisée
 * sur N à chaque rendu ; un pas sans effet (borne) n'appelle rien ; arrêt au relâchement, au
 * démontage et dès que `isInterrupted` passe à vrai (placement, dialogue de Tour en attente : revue
 * 7.3 — un relâchement non transmis pendant un dialogue natif ne doit pas relancer les pas après la
 * réponse). Chaque pas passe par `onChange` — l'écran l'applique (ou ouvre le dialogue de Tour).
 *
 * `press` : activation sans toucher (TalkBack, clavier — `Pressability` n'appelle alors que
 * `onPress`) ; ignorée quand un `pressIn` vient de faire le pas (VoiceOver et le doigt passent par
 * `pressIn` / `pressOut` puis `onPress`).
 */
function useCountStepper(count: number, onChange: (count: number) => void, isInterrupted: boolean) {
  const countRef = useRef(count);
  const onChangeRef = useRef(onChange);
  const pressedInRef = useRef(false);
  useEffect(() => {
    countRef.current = count;
    onChangeRef.current = onChange;
  });
  const repeaterRef = useRef<HoldRepeater | null>(null);
  useEffect(() => () => repeaterRef.current?.stop(), []);
  useEffect(() => {
    if (isInterrupted) repeaterRef.current?.stop();
  }, [isInterrupted]);
  const applyStep = (direction: 1 | -1, stepSize = 1) => {
    const current = countRef.current;
    const next = steppedValue(current, direction, stepSize, CIRCUIT_COUNT_MIN, CIRCUIT_COUNT_MAX);
    if (next === current) return;
    countRef.current = next;
    onChangeRef.current(next);
  };
  const repeater = () => {
    repeaterRef.current ??= createHoldRepeater(EXECUTION_UNIT_HOLD_POLICY, applyStep);
    return repeaterRef.current;
  };
  return {
    start: (direction: 1 | -1) => {
      pressedInRef.current = true;
      repeater().start(direction);
    },
    stop: () => {
      repeaterRef.current?.stop();
      // Un `onPress` suit le relâchement dans le même événement ; un geste repris par le défilement
      // n'en a pas : le drapeau est effacé ensuite, pour ne pas avaler une activation ultérieure.
      setTimeout(() => {
        pressedInRef.current = false;
      }, 0);
    },
    press: (direction: 1 | -1) => {
      if (pressedInRef.current) {
        pressedInRef.current = false;
        return;
      }
      applyStep(direction);
    },
    /** Pas unique (action VoiceOver du réglage) : depuis la dernière valeur demandée. */
    step: (direction: 1 | -1) => applyStep(direction),
  };
}

function CircuitCounter({
  nature,
  count,
  onChange,
  isInterrupted,
  isNatureMenuOpen,
  onOpenNatureMenu,
  onCloseNatureMenu,
  onSelectNature,
  natureFocusRequest,
  externalRef,
  testID,
}: {
  nature: CircuitNature;
  count: number;
  onChange: (count: number) => void;
  isInterrupted: boolean;
  isNatureMenuOpen: boolean;
  onOpenNatureMenu: () => void;
  onCloseNatureMenu: () => void;
  onSelectNature: (nature: CircuitNature) => void;
  natureFocusRequest: number;
  externalRef?: { current: View | null };
  testID: string;
}) {
  const t = strings.screens.composition.circuit;
  const stepperStrings = strings.screens.profile.stepper;
  const stepper = useCountStepper(count, onChange, isInterrupted);
  const atMin = count <= CIRCUIT_COUNT_MIN;
  const atMax = count >= CIRCUIT_COUNT_MAX;
  // Revue 7.3 : ref de rappel stable (sinon détachée puis rattachée à chaque rendu).
  const attachCounter = useCallback(
    (node: View | null) => {
      if (externalRef) externalRef.current = node;
    },
    [externalRef],
  );
  const stepTestID = `${testID}-stepper`;

  return (
    <View style={styles.stepper} testID={stepTestID}>
      <StepButton
        direction={-1}
        disabled={atMin}
        accessibilityLabel={
          atMin
            ? `${t.decrementAccessibilityLabel[nature]} — ${stepperStrings.minimumReachedSuffix}`
            : t.decrementAccessibilityLabel[nature]
        }
        onPressIn={() => stepper.start(-1)}
        onPressOut={stepper.stop}
        onPress={() => stepper.press(-1)}
        testID={`${stepTestID}-decrement`}
      />
      <View
        ref={attachCounter}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t.countAccessibilityLabel[nature]}
        accessibilityValue={{
          min: CIRCUIT_COUNT_MIN,
          max: CIRCUIT_COUNT_MAX,
          now: count,
          text: circuitCountSpokenValue(nature, count),
        }}
        accessibilityActions={[...(atMax ? [] : [{ name: "increment" }]), ...(atMin ? [] : [{ name: "decrement" }])]}
        onAccessibilityAction={(event) => {
          const action = event.nativeEvent.actionName;
          if (action === "increment") stepper.step(1);
          if (action === "decrement") stepper.step(-1);
        }}
        style={styles.digitPill}
        testID={testID}
      >
        <Text style={styles.digit} testID={`${testID}-value`}>
          {count}
        </Text>
      </View>
      <View style={styles.unitSlot} testID={`${testID}-unit-slot`}>
        <CircuitNatureMenu
          nature={nature}
          trigger={<UnitPill nature={nature} count={count} testID={`${testID}-unit`} />}
          isOpen={isNatureMenuOpen}
          onOpen={onOpenNatureMenu}
          onClose={onCloseNatureMenu}
          onSelect={onSelectNature}
          focusRequest={natureFocusRequest}
          testID={`${testID}-nature`}
        />
      </View>
      <StepButton
        direction={1}
        disabled={atMax}
        accessibilityLabel={
          atMax
            ? `${t.incrementAccessibilityLabel[nature]} — ${stepperStrings.maximumReachedSuffix}`
            : t.incrementAccessibilityLabel[nature]
        }
        onPressIn={() => stepper.start(1)}
        onPressOut={stepper.stop}
        onPress={() => stepper.press(1)}
        testID={`${stepTestID}-increment`}
      />
    </View>
  );
}

/**
 * Bouton − ou + : boîte réelle de 44 × 44 (la cible), cercle de 28 `color/surface` centré ; à la
 * borne, désactivé, le signe passe en `color/disabled` (même rendu qu'`InlineStepper`).
 */
function StepButton({
  direction,
  disabled,
  accessibilityLabel,
  onPressIn,
  onPressOut,
  onPress,
  testID,
}: {
  direction: 1 | -1;
  disabled: boolean;
  accessibilityLabel: string;
  onPressIn: () => void;
  onPressOut: () => void;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      disabled={disabled}
      unstable_pressDelay={STEP_PRESS_DELAY_MS}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={direction === -1 ? styles.minusTarget : styles.plusTarget}
      testID={testID}
    >
      <View style={styles.stepCircle} testID={`${testID}-circle`}>
        <KodjoIcon
          name={direction === -1 ? "stepper-minus" : "stepper-plus"}
          tintColor={disabled ? colors.disabled : colors.primary}
          testID={`${testID}-icon`}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Revue 5.2 : hauteur minimale (Dynamic Type) ; espacements portés par chaque enfant.
  row: {
    minHeight: CIRCUIT_HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  // Story 7.8 (D-438) : le bloc du titre prend la place libre — le stepper est calé à droite ; à
  // court de place, le titre cède (ellipse), le stepper garde sa taille.
  textBlock: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  counterSlot: {
    flexShrink: 0,
    marginLeft: TITLE_TO_STEPPER_GAP,
  },
  // Ligne du titre : « Circuit » seul depuis la story 5.1b.
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  // Revue 5.2 : le titre cède (ellipse) ; le stepper jamais.
  title: {
    flexShrink: 1,
    minWidth: 0,
    ...TITLE_TEXT,
    color: colors.textPrimary,
  },
  // Fond blanc du stepper (Figma `9819:19951`) : 36 de haut, rayon 18, marge 4.
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    // Revue 7.3 : hauteur MINIMALE (Dynamic Type : les pastilles à 16 peuvent grandir).
    minHeight: STEPPER_HEIGHT,
    paddingHorizontal: STEPPER_PADDING,
    borderRadius: STEPPER_RADIUS,
    backgroundColor: colors.background,
  },
  minusTarget: {
    width: STEP_TOUCH_TARGET,
    height: STEP_TOUCH_TARGET,
    marginVertical: -TARGET_OVERFLOW_Y,
    // Contre la marge 4 du fond : boîte à −4 du bord du fond, cercle à 4 (Figma).
    marginLeft: -STEP_CIRCLE_INSET,
    marginRight: MINUS_TO_DIGIT_GAP - STEP_CIRCLE_INSET,
    alignItems: "center",
    justifyContent: "center",
  },
  plusTarget: {
    width: STEP_TOUCH_TARGET,
    height: STEP_TOUCH_TARGET,
    marginVertical: -TARGET_OVERFLOW_Y,
    marginLeft: UNIT_TO_PLUS_GAP - STEP_CIRCLE_INSET,
    marginRight: -STEP_CIRCLE_INSET,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircle: {
    width: STEP_CIRCLE,
    height: STEP_CIRCLE,
    borderRadius: STEP_CIRCLE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  // `DSF / Forms / Valeur modifiable` (recette du 22/10, commentaire 10) : fond `color/surface`,
  // rayon 10, marges 10 / 4, texte `color/primary`.
  digitPill: {
    flexShrink: 0,
    backgroundColor: colors.surface,
    borderRadius: fixedRadii[10],
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[4],
  },
  digit: {
    ...COUNTER_TEXT,
    color: colors.primary,
  },
  // Conteneur du déclencheur : la cible de 44 déborde de 4 en haut et en bas du fond de 36.
  unitSlot: {
    flexShrink: 0,
    marginLeft: DIGIT_TO_UNIT_GAP,
    marginVertical: -TARGET_OVERFLOW_Y,
  },
  unitTarget: {
    minHeight: STEP_TOUCH_TARGET,
    justifyContent: "center",
  },
  // `DSF / Forms / Valeur modifiable` : fond `color/surface`, rayon 10, marges 10 / 4,
  // Semi Bold `color/primary`.
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
});
