import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Image } from "expo-image";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AccessibilityActionInfo,
  type AccessibilityState,
  type GestureResponderEvent,
} from "react-native";

import { MOTION_EASING, MOTION_SHIFT_DURATION_MS } from "@/features/sessions/compositionMotion";
import { clampSwipeTranslateX, isTap, shouldRevealAfterSwipe } from "@/features/sessions/compositionGesture";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";
import { colors, fixedRadii, type } from "@/shared/ui/tokens";

/**
 * PRE-8 (stories B.6 et B.8, Figma `10475:47634`, `10496:23705`) — carte du Catalogue des
 * Mouvements à actions glissées. Même mécanisme que la carte de Composition
 * (`CompositionActivityRow`, D-128, CE-T03-08), sans le déplacement par appui long :
 *
 * - le glissement gauche est arbitré par le *responder system* natif en phase de CAPTURE (un
 *   balayage annule l'appui du `Pressable` interne : il n'ouvre jamais la fiche) ; le geste
 *   vertical reste à la liste qui défile ;
 * - la carte suit le doigt (révélation proportionnelle) ; à la relâche, au-delà de la moitié de la
 *   course, elle s'aligne ouverte, sinon fermée (`shouldRevealAfterSwipe`) ; même décélération ;
 * - carte ouverte : un appui sur la carte est neutre, seul un balayage droit la referme ;
 * - chaque action reste un bouton accessible ; une action indisponible est grisée et inerte
 *   (« Partager », non opérationnel).
 *
 * Les seuils et bornes viennent des modules purs de la Composition (`compositionGesture.ts`,
 * `compositionMotion.ts`) : aucune valeur de geste propre à ce composant.
 *
 * Recette A/B du 27/10 (Figma `10579:21580`) :
 * - B09 : `enabled={false}` (carte du dessus d'une pile condensée) — aucun glissement, aucune
 *   action révélée ni annoncée ;
 * - B10 : la carte ouverte s'arrête à 8 du bord de « Partager » (`SWIPE_ACTIONS_GAP`) ;
 * - B11 : `joined` — le choix Plus facile / Plus difficile est déployé sous les actions : les
 *   raccords Figma comblent les coins bas du groupe ;
 * - B08 : `onLongPress` (réordonnancement d'une pile déployée) et `extraAccessibilityActions`.
 *
 * PRE-8 (epic E, E.5 ; spécification du 27/10 §5) : `actionsHeight` — bloc d'actions de hauteur fixe,
 * aligné sur le bord supérieur, quelle que soit la hauteur de la carte (carte de Séance déployée) ;
 * `accessibilityState` transmis à la carte (déploiement annoncé). Sans ces options, comportement B
 * inchangé (bloc de la hauteur de la carte).
 */

export type SwipeAction = {
  readonly key: string;
  readonly label: string;
  /** Fond de l'action (Figma) ; une action indisponible est grisée quel que soit son fond. */
  readonly backgroundColor: string;
  readonly disabled?: boolean;
  readonly onPress: () => void;
};

/** Largeur d'une action révélée (Figma `10475:47634` : trois actions de 68 sur 204). */
export const SWIPE_ACTION_WIDTH = 68;
/** B10 (Figma `10579:21580`) : écart entre la carte ouverte et la première action. */
export const SWIPE_ACTIONS_GAP = 8;
/** B11 : raccord Figma (`10585:21534` / `10585:21535`), 12 × 12, 10 dans la rangée et 2 sous elle. */
const JOIN_SIZE = 12;
const JOIN_OVERHANG = 2;

export type SwipeAccessibilityAction = { readonly name: string; readonly label: string; readonly onAction: () => void };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SwipeActionsRow({
  actions,
  revealed,
  onReveal,
  onHide,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  enabled = true,
  joined = false,
  onLongPress,
  extraAccessibilityActions = [],
  actionsHeight,
  accessibilityState,
  children,
  testID,
}: {
  readonly actions: readonly SwipeAction[];
  readonly revealed: boolean;
  readonly onReveal: () => void;
  readonly onHide: () => void;
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
  readonly accessibilityHint?: string;
  /** B09 : faux — aucun glissement ni action (pile condensée). */
  readonly enabled?: boolean;
  /** B11 : choix d'ajout de Niveau déployé sous les actions. */
  readonly joined?: boolean;
  readonly onLongPress?: () => void;
  readonly extraAccessibilityActions?: readonly SwipeAccessibilityAction[];
  /** E.5 : hauteur fixe du bloc d'actions, aligné en haut ; absent : hauteur de la carte. */
  readonly actionsHeight?: number;
  readonly accessibilityState?: AccessibilityState;
  readonly children: ReactNode;
  readonly testID: string;
}) {
  const groupWidth = enabled ? actions.length * SWIPE_ACTION_WIDTH : 0;
  const offset = groupWidth > 0 ? groupWidth + SWIPE_ACTIONS_GAP : 0;
  const reduceMotion = useReduceMotion();
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const isSwipingRef = useRef(false);
  const baseRef = useRef(0);
  const [translateX, setTranslateX] = useState(revealed ? -offset : 0);
  const translateXRef = useRef(translateX);
  const [swipeX] = useState(() => new Animated.Value(revealed ? -offset : 0));
  const [isSettling, setIsSettling] = useState(false);
  const settleTokenRef = useRef(0);

  const moveTo = useCallback(
    (target: number) => {
      translateXRef.current = target;
      setTranslateX(target);
      const token = ++settleTokenRef.current;
      if (reduceMotion) {
        swipeX.setValue(target);
        setIsSettling(false);
        return;
      }
      setIsSettling(true);
      Animated.timing(swipeX, {
        toValue: target,
        duration: MOTION_SHIFT_DURATION_MS,
        easing: MOTION_EASING,
        useNativeDriver: true,
      }).start(() => {
        if (settleTokenRef.current === token) setIsSettling(false);
      });
    },
    [reduceMotion, swipeX],
  );

  // État révélé changé hors du geste (autre carte ouverte, action exécutée) : position de repos.
  useEffect(() => {
    if (isSwipingRef.current) return;
    const rest = revealed ? -offset : 0;
    if (rest !== translateXRef.current) moveTo(rest);
  }, [revealed, offset, moveTo]);

  const follow = useCallback(
    (dx: number) => {
      isSwipingRef.current = true;
      const x = clampSwipeTranslateX(baseRef.current + dx, offset);
      translateXRef.current = x;
      setTranslateX(x);
      settleTokenRef.current += 1;
      swipeX.setValue(x);
    },
    [offset, swipeX],
  );

  const delta = (event: GestureResponderEvent) => {
    const start = originRef.current;
    return start === null
      ? { dx: 0, dy: 0 }
      : { dx: event.nativeEvent.pageX - start.x, dy: event.nativeEvent.pageY - start.y };
  };

  const end = () => {
    originRef.current = null;
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;
    const open = shouldRevealAfterSwipe(translateXRef.current, offset);
    moveTo(open ? -offset : 0);
    if (open && !revealed) onReveal();
    else if (!open && revealed) onHide();
  };

  const showActions = translateX < 0 || isSettling;

  return (
    <View
      onTouchStart={(event) => {
        originRef.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
        isSwipingRef.current = false;
        baseRef.current = revealed ? -offset : 0;
      }}
      onTouchMove={(event) => {
        // Reçu même quand une action révélée détient le responder (balayage droit de fermeture).
        const { dx, dy } = delta(event);
        if (offset === 0 || isTap(dx, dy) || Math.abs(dx) <= Math.abs(dy)) return;
        follow(dx);
      }}
      onTouchEnd={end}
      onTouchCancel={() => {
        originRef.current = null;
        isSwipingRef.current = false;
        moveTo(revealed ? -offset : 0);
      }}
      onMoveShouldSetResponderCapture={(event) => {
        const { dx, dy } = delta(event);
        if (offset === 0 || isTap(dx, dy) || Math.abs(dx) <= Math.abs(dy)) return false;
        follow(dx);
        return true;
      }}
      onResponderMove={(event) => {
        const { dx, dy } = delta(event);
        if (Math.abs(dx) > Math.abs(dy)) follow(dx);
      }}
      onResponderRelease={end}
      onResponderTerminationRequest={() => !isSwipingRef.current}
      style={styles.container}
      testID={testID}
    >
      {showActions ? (
        <View
          pointerEvents={translateX < 0 ? "auto" : "none"}
          accessibilityElementsHidden={translateX >= 0}
          importantForAccessibility={translateX < 0 ? "auto" : "no-hide-descendants"}
          style={[styles.actions, { width: groupWidth }, actionsHeight !== undefined ? { bottom: undefined, height: actionsHeight } : null]}
          testID={`${testID}-actions`}
        >
          {actions.map((action, index) => (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              disabled={action.disabled === true}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityState={{ disabled: action.disabled === true }}
              style={[
                styles.action,
                index === 0 ? styles.actionFirst : null,
                index === actions.length - 1 ? styles.actionLast : null,
                { backgroundColor: action.disabled === true ? colors.disabled : action.backgroundColor },
              ]}
              testID={`${testID}-action-${action.key}`}
            >
              <Text style={styles.actionLabel} numberOfLines={2}>
                {action.label}
              </Text>
            </Pressable>
          ))}
          {joined ? (
            <>
              <Image source={JOIN_EASIER} style={[styles.join, styles.joinLeft]} accessible={false} testID={`${testID}-join-easier`} />
              <Image source={JOIN_HARDER} style={[styles.join, styles.joinRight]} accessible={false} testID={`${testID}-join-harder`} />
            </>
          ) : null}
        </View>
      ) : null}
      <AnimatedPressable
        onPress={() => {
          // Carte ouverte : appui neutre (seul un balayage droit la referme).
          if (!revealed && !isSwipingRef.current) onPress();
        }}
        onLongPress={
          onLongPress === undefined
            ? undefined
            : () => {
                if (!revealed && !isSwipingRef.current) onLongPress();
              }
        }
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={accessibilityState}
        accessibilityActions={[
          ...(enabled ? actions.filter((action) => action.disabled !== true) : []).map(
            (action): AccessibilityActionInfo => ({ name: action.key, label: action.label }),
          ),
          ...extraAccessibilityActions.map((action): AccessibilityActionInfo => ({ name: action.name, label: action.label })),
        ]}
        onAccessibilityAction={(event) => {
          const name = event.nativeEvent.actionName;
          const extra = extraAccessibilityActions.find((action) => action.name === name);
          if (extra) extra.onAction();
          else if (enabled) actions.find((action) => action.key === name && action.disabled !== true)?.onPress();
        }}
        style={{ transform: [{ translateX: swipeX }] }}
        testID={`${testID}-card`}
      >
        {children}
      </AnimatedPressable>
    </View>
  );
}

const JOIN_EASIER = require("../../../assets/icons/catalogue-raccord-plus-facile.svg");
const JOIN_HARDER = require("../../../assets/icons/catalogue-raccord-plus-difficile.svg");

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  actions: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
  },
  action: {
    width: SWIPE_ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  // Figma `10579:21622` / `10579:21617` : coins arrondis aux extrémités du groupe seulement.
  actionFirst: {
    borderTopLeftRadius: fixedRadii[12],
    borderBottomLeftRadius: fixedRadii[12],
  },
  actionLast: {
    borderTopRightRadius: fixedRadii[12],
    borderBottomRightRadius: fixedRadii[12],
  },
  // `KODJO / Texte / Inter Semi Bold 11`, blanc.
  actionLabel: {
    ...type.swipeActionLabel,
    color: colors.background,
    textAlign: "center",
  },
  join: {
    position: "absolute",
    width: JOIN_SIZE,
    height: JOIN_SIZE,
    bottom: -JOIN_OVERHANG,
  },
  joinLeft: {
    left: 0,
  },
  joinRight: {
    right: 0,
  },
});
