/**
 * PRE-9 (story B.4) — pièces du glisser-déposer d'une disposition générale :
 * - `useBlockDragGesture` : geste d'un bloc saisi par son en-tête (Circuit, Cycle) — appui long (porté
 *   par l'en-tête, `Pressable`), puis suivi du doigt par le système de répondeurs natif, comme la carte
 *   d'occurrence (`CompositionActivityRow`) : mêmes primitives, même défilement automatique ;
 * - `VanishingBlock` : retrait progressif d'un conteneur vidé par une dépose (précision de Hermann du
 *   30/10/2026, ch07 « Retrait d'un Circuit » : « effacement progressif et lent du Circuit retiré, puis
 *   remontée douce des éléments suivants ») — fondu, PUIS fermeture de sa place ;
 * - `LayoutDropLine` : repère d'insertion de la destination (éclairage, COMP §6).
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent, type ViewProps } from "react-native";
import Reanimated, { Easing as ReanimatedEasing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { CIRCUIT_HIDE_DURATION_MS, CIRCUIT_REVEAL_DURATION_MS } from "@/features/sessions/CircuitHeader";
import type { DragAutoScroll } from "@/features/sessions/useDragAutoScroll";
import { colors } from "@/shared/ui/tokens";
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
  readonly onCancel: () => void;
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
        callbacks.current.onCancel();
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
      translation.setValue(0);
      callbacks.current.onEnd(value);
    },
    [translation],
  );

  const cancel = useCallback(() => {
    originRef.current = null;
    if (!draggingRef.current) return;
    draggingRef.current = false;
    translation.setValue(0);
    callbacks.current.onCancel();
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

/** Repère d'insertion de la destination, dans le repère du contenu défilant. */
export function LayoutDropLine({ y, testID }: { y: number; testID: string }) {
  return <View pointerEvents="none" style={[styles.line, { top: y - LINE_THICKNESS / 2 }]} testID={testID} />;
}

const LINE_THICKNESS = 3;

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  line: {
    position: "absolute",
    left: 0,
    right: 0,
    height: LINE_THICKNESS,
    borderRadius: LINE_THICKNESS / 2,
    backgroundColor: colors.primary,
    zIndex: 20,
  },
});
