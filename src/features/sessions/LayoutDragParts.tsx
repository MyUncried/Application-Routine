/**
 * PRE-9 (story B.4) — pièces du glisser-déposer d'une disposition générale :
 * - `useBlockDragGesture` : geste d'un bloc saisi par son en-tête (Circuit, Cycle) — appui long (porté
 *   par l'en-tête, `Pressable`), puis suivi du doigt par le système de répondeurs natif, comme la carte
 *   d'occurrence (`CompositionActivityRow`) : mêmes primitives, même défilement automatique ;
 * - `VanishingBlock` : retrait progressif d'un conteneur vidé par une dépose (précision de Hermann du
 *   30/10/2026, ch07 « Retrait d'un Circuit » : « effacement progressif et lent du Circuit retiré, puis
 *   remontée douce des éléments suivants ») — fondu, PUIS fermeture de sa place ;
 * - [`LayoutDropLine` : repère d'insertion de la destination (éclairage, COMP §6) — retiré par la
 *   recette iPhone n° 2 du 31/10/2026 (Hermann : « Je ne veux pas d'encadré bleu et de trait
 *   d'insertion ») : la destination est montrée par le déplacement des voisins et des bords des
 *   conteneurs, `layoutDragShifts.ts`] ;
 * - `CardMotionBlock` (B.5) : carte supprimée (fondu puis fermeture de sa place) ou copie qui apparaît
 *   (ouverture de sa place et fondu), aux durées de l'ancien modèle (D-441, D-442, D-443).
 * Le dernier membre supprimé d'un conteneur emporte le conteneur, retiré par `VanishingBlock` (B.5).
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent, type ViewProps } from "react-native";
import Reanimated, { Easing as ReanimatedEasing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { CIRCUIT_HIDE_DURATION_MS, CIRCUIT_REVEAL_DURATION_MS } from "@/features/sessions/CircuitHeader";
import {
  MOTION_APPEAR_DURATION_MS,
  MOTION_FADE_DURATION_MS,
  MOTION_FADE_TO_SLIDE_DELAY_MS,
  MOTION_SHIFT_DURATION_MS,
} from "@/features/sessions/compositionMotion";
import type { DragAutoScroll } from "@/features/sessions/useDragAutoScroll";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

/**
 * Durées du retrait d'un conteneur vidé (valeurs de conception, Figma muet), alignées sur les
 * mouvements du Circuit de la contre-recette du 30/10 : fondu à la durée du repli (900 ms), puis
 * fermeture de la place à la durée du déploiement (700 ms). « Réduire les animations » : immédiat.
 */
export const LAYOUT_VANISH_FADE_MS = CIRCUIT_HIDE_DURATION_MS;
export const LAYOUT_VANISH_CLOSE_MS = CIRCUIT_REVEAL_DURATION_MS;
const VANISH_EASING = ReanimatedEasing.bezier(0.4, 0, 0.2, 1);

type BlockDragCallbacks = {
  /** Début du glisser ; `false` : refusé (un autre élément est saisi, géométrie incomplète). */
  readonly onStart: () => boolean;
  /** Translation du bloc (doigt et défilement accumulé). */
  readonly onMove: (translationY: number) => void;
  readonly onEnd: (translationY: number) => void;
  /** Recette n° 2 du 31/10 : translation atteinte, d'où le bloc revient à sa place. */
  readonly onCancel: (translationY: number) => void;
  readonly autoScroll: DragAutoScroll;
};

/**
 * Geste d'un bloc saisi par appui long : `begin` est appelé par l'appui long de l'en-tête ; les
 * gestionnaires (`handlers`) sont posés sur la vue du bloc, qui reçoit les touchers de ses
 * descendants (`onTouch*` sont dispatchés aux ancêtres) et capte le répondeur une fois le glisser
 * engagé. `translation` : valeur animée à appliquer au bloc.
 */
export function useBlockDragGesture({ onStart, onMove, onEnd, onCancel, autoScroll }: BlockDragCallbacks) {
  const [translation] = useState(() => new Animated.Value(0));
  const originRef = useRef<number | null>(null);
  const fingerDyRef = useRef(0);
  const translationRef = useRef(0);
  const draggingRef = useRef(false);
  const callbacks = useRef({ onMove, onEnd, onCancel });
  useEffect(() => {
    callbacks.current = { onMove, onEnd, onCancel };
  }, [onCancel, onEnd, onMove]);
  // Bloc démonté pendant son glisser : geste annulé.
  useEffect(
    () => () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        callbacks.current.onCancel(translationRef.current);
      }
    },
    [],
  );

  const apply = useCallback(
    (value: number) => {
      translationRef.current = value;
      translation.setValue(value);
      callbacks.current.onMove(value);
    },
    [translation],
  );

  const begin = useCallback(() => {
    if (draggingRef.current || !onStart()) return;
    draggingRef.current = true;
    autoScroll.attach((scrollDelta) => apply(fingerDyRef.current + scrollDelta));
    if (originRef.current !== null) autoScroll.track(originRef.current + fingerDyRef.current);
  }, [apply, autoScroll, onStart]);

  const track = useCallback(
    (event: GestureResponderEvent) => {
      if (originRef.current === null) return;
      fingerDyRef.current = event.nativeEvent.pageY - originRef.current;
      if (draggingRef.current) apply(fingerDyRef.current + autoScroll.track(event.nativeEvent.pageY));
    },
    [apply, autoScroll],
  );

  const finish = useCallback(
    (event?: GestureResponderEvent) => {
      if ((event?.nativeEvent.touches?.length ?? 0) > 0) return;
      originRef.current = null;
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const value = translationRef.current;
      // Recette n° 2 du 31/10 : l'écran pose d'abord la translation du registre qui relaie celle du
      // doigt (retour ou mise en place animés), puis celle-ci est remise à 0, dans la même tâche.
      callbacks.current.onEnd(value);
      translation.setValue(0);
    },
    [translation],
  );

  const cancel = useCallback(() => {
    originRef.current = null;
    if (!draggingRef.current) return;
    draggingRef.current = false;
    callbacks.current.onCancel(translationRef.current);
    translation.setValue(0);
  }, [translation]);

  const handlers: ViewProps = {
    onTouchStart: (event) => {
      if (draggingRef.current) return;
      originRef.current = event.nativeEvent.pageY;
      fingerDyRef.current = 0;
      translationRef.current = 0;
    },
    onTouchMove: track,
    onTouchEnd: finish,
    onTouchCancel: cancel,
    onMoveShouldSetResponderCapture: () => draggingRef.current,
    onResponderMove: track,
    onResponderRelease: finish,
    onResponderTerminationRequest: () => !draggingRef.current,
    onResponderTerminate: cancel,
  };
  return { begin, handlers, translation };
}

/**
 * Conteneur vidé par une dépose, encore rendu à sa place : fondu jusqu'à transparence
 * (`LAYOUT_VANISH_FADE_MS`), puis fermeture de sa hauteur et de l'écart qui le suit (`gap`) —
 * les éléments suivants remontent sans saut (`LAYOUT_VANISH_CLOSE_MS`) ; `onDone` à la fin.
 */
export function VanishingBlock({ gap, onDone, testID, children }: { gap: number; onDone: () => void; testID: string; children: ReactNode }) {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(1);
  const closing = useSharedValue(0);
  const height = useSharedValue(0);
  const [phase, setPhase] = useState<"FADE" | "CLOSE">("FADE");
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);
  useEffect(() => {
    if (reduceMotion) {
      done.current();
      return;
    }
    const finishClose = () => done.current();
    const startClose = () => {
      setPhase("CLOSE");
      closing.set(withTiming(1, { duration: LAYOUT_VANISH_CLOSE_MS, easing: VANISH_EASING }, (finished) => {
        if (finished === true) scheduleOnRN(finishClose);
      }));
    };
    opacity.set(withTiming(0, { duration: LAYOUT_VANISH_FADE_MS, easing: VANISH_EASING }, (finished) => {
      if (finished === true) scheduleOnRN(startClose);
    }));
  }, [closing, opacity, reduceMotion]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    maxHeight: closing.value <= 0 || height.value <= 0 ? undefined : (1 - closing.value) * height.value,
    marginBottom: -closing.value * gap,
  }));
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (closing.get() <= 0) height.set(event.nativeEvent.layout.height);
    },
    [closing, height],
  );
  return (
    <Reanimated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[phase === "CLOSE" ? styles.clip : null, style]}
      onLayout={onLayout}
      testID={testID}
    >
      {children}
    </Reanimated.View>
  );
}

/**
 * PRE-9 (story B.5) — durées et courbes de la carte supprimée ou dupliquée dans une disposition
 * générale : celles de l'ancien modèle (story 7.6 / 7.7, D-441, D-442, D-443, `compositionMotion.ts`).
 * Suppression : fondu de 450 ms, la place se referme à partir de 200 ms en 320 ms (les éléments
 * suivants remontent pendant la fin du fondu) ; duplication : la place s'ouvre en 320 ms pendant que la
 * copie apparaît en fondu de 450 ms. « Réduire les animations » : immédiat.
 */
const CARD_SHIFT_EASING = ReanimatedEasing.bezier(0.33, 1, 0.68, 1);
const CARD_FADE_EASING = ReanimatedEasing.bezier(0.4, 0, 0.2, 1);

/** Mouvement d'une carte : au repos, en disparition (suppression), en apparition (copie). */
export type CardMotionMode = "IDLE" | "LEAVING" | "APPEARING";

/**
 * Carte d'une disposition générale, toujours enveloppée (aucun remontage quand le mouvement commence
 * ou se termine) : au repos, transparent pour la mise en page ; en disparition, fondu puis fermeture
 * de sa hauteur et de l'écart qui la suit (`gap`) ; en apparition (au montage de la copie), ouverture
 * de sa place depuis 0 et fondu entrant. `onDone` à la fin du mouvement. La hauteur naturelle est
 * relevée sur la vue intérieure (non contrainte par la hauteur bornée de l'enveloppe). `style` et
 * `onLayout` : ceux de l'enveloppe, élément de la liste (sa position y est mesurée).
 */
export function CardMotionBlock({
  mode,
  gap,
  onDone,
  style: outerStyle,
  onLayout,
  testID,
  children,
}: {
  mode: CardMotionMode;
  gap: number;
  onDone: () => void;
  style?: ViewProps["style"];
  onLayout?: (event: LayoutChangeEvent) => void;
  testID: string;
  children: ReactNode;
}) {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(mode === "APPEARING" ? 0 : 1);
  /** 0 : place ouverte ; 1 : place refermée. */
  const closing = useSharedValue(mode === "APPEARING" ? 1 : 0);
  const height = useSharedValue(0);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);
  useEffect(() => {
    if (mode === "IDLE") return;
    const finish = () => done.current();
    if (reduceMotion) {
      opacity.set(mode === "APPEARING" ? 1 : 0);
      closing.set(mode === "APPEARING" ? 0 : 1);
      finish();
      return;
    }
    if (mode === "LEAVING") {
      opacity.set(withTiming(0, { duration: MOTION_FADE_DURATION_MS, easing: CARD_FADE_EASING }));
      closing.set(
        withDelay(
          MOTION_FADE_TO_SLIDE_DELAY_MS,
          withTiming(1, { duration: MOTION_SHIFT_DURATION_MS, easing: CARD_SHIFT_EASING }, (finished) => {
            if (finished === true) scheduleOnRN(finish);
          }),
        ),
      );
      return;
    }
    closing.set(withTiming(0, { duration: MOTION_SHIFT_DURATION_MS, easing: CARD_SHIFT_EASING }));
    opacity.set(
      withTiming(1, { duration: MOTION_APPEAR_DURATION_MS, easing: CARD_FADE_EASING }, (finished) => {
        if (finished === true) scheduleOnRN(finish);
      }),
    );
  }, [closing, mode, opacity, reduceMotion]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    maxHeight: closing.value <= 0 ? undefined : height.value <= 0 ? 0 : (1 - closing.value) * height.value,
    marginBottom: -closing.value * gap,
  }));
  const onInnerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      height.set(event.nativeEvent.layout.height);
    },
    [height],
  );
  const leaving = mode === "LEAVING";
  return (
    <Reanimated.View
      pointerEvents={leaving ? "none" : "auto"}
      accessibilityElementsHidden={leaving}
      importantForAccessibility={leaving ? "no-hide-descendants" : "auto"}
      style={[outerStyle, mode === "IDLE" ? null : styles.clip, style]}
      onLayout={onLayout}
      testID={testID}
    >
      <View onLayout={onInnerLayout}>{children}</View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
});
