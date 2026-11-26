import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

import { MOTION_EASING, MOTION_SHIFT_DURATION_MS } from "@/features/sessions/compositionMotion";
import { clampSwipeTranslateX, shouldFollowSwipe, shouldRevealAfterSwipe } from "@/features/sessions/compositionGesture";
import { resolveSwipeRelease } from "@/shared/gestures/swipeReveal";
import { useSwipeRevealPan } from "@/shared/gestures/useSwipeRevealPan";
import { useSwipeScrollLock } from "@/shared/ui/swipeScrollLock";
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
 *
 * PRE-9, recette iPhone du 04/11/2026 (Circuit replié à actions glissées) :
 * - `passive` : rangée montée mais inerte (ni glissement, ni action, ni toucher simple, ni accessibilité propre ;
 *   l'appui long reste transmis) — l'appelant la
 *   garde montée quel que soit l'état de la carte, pour ne pas remonter son contenu (le remontage relançait
 *   les mesures et les animations de l'en-tête du Circuit : soubresaut au repli et au déploiement) ;
 * - `translation` : valeur animée fournie par l'appelant, pour faire glisser avec la carte d'autres couches
 *   (le cadre du Circuit) ;
 * - `actionsInsets` : débords du bloc d'actions au-delà de la rangée (hauteur du cadre entier, bord droit) ;
 * - toucher d'une action : le geste en cours est clos (un léger glissé du doigt pendant l'appui ne rouvre
 *   pas les actions que l'action vient de refermer).
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
  passive = false,
  translation,
  actionsInsets,
  actionWidth = SWIPE_ACTION_WIDTH,
  actionsRadius,
  actionsRightMargin = 0,
  slideActions = false,
  nativeGesture = false,
  lockSwipeDirection = false,
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
  /** Recette du 04/11 : rangée inerte, gardée montée (contenu jamais remonté). */
  readonly passive?: boolean;
  /** Recette du 04/11 : translation horizontale partagée avec l'appelant (valeur stable). */
  readonly translation?: Animated.Value;
  /** Recette du 04/11 : débords du bloc d'actions (valeurs positives : au-delà de la rangée). */
  readonly actionsInsets?: { readonly top?: number; readonly bottom?: number; readonly right?: number };
  /** Recette du 04/11 (CE-FMT-05, §7.9.6) : largeur d'une action (68 par défaut, Catalogue). */
  readonly actionWidth?: number;
  /** Recette du 04/11 (CE-FMT-05) : rayon des extrémités du bloc d'actions (12 par défaut). */
  readonly actionsRadius?: number;
  /** Marge entre le bloc d'actions et le bord droit de la rangée (Agenda, recette du 19/11/2026 au soir) ; la carte glisse d'autant plus. */
  readonly actionsRightMargin?: number;
  /**
   * Recette du 05/11/2026 (e-replie-glisse, Hermann : « il faut que le cadre des options apparaisse par glissement de droite à
   * gauche aussi en même temps que le circuit, et qu'il disparaisse de la même manière de gauche à droite par glissement ») :
   * le bloc d'actions suit la translation de la rangée au lieu d'être découvert sur place.
   */
  readonly slideActions?: boolean;
  /**
   * Contre-recette du 23/11/2026 (r3, Hermann, modale du programme : « Il y a une perte de suivi du glisser gauche suivi d'un
   * rebond qui ferme l'option lorsque le geste part un peu à l'horizontale ou à la verticale, même chose à la fermeture ») :
   * rangée posée dans une feuille native iOS (`formSheet`). Le geste de la feuille, extérieur à la vue React Native, annule les
   * touchers de React Native (`RCTSurfaceTouchHandler.canBePreventedByGestureRecognizer`) dès qu'il démarre — le glissement
   * perdait le doigt puis revenait à sa position (`onTouchCancel`). Le glissement est alors suivi par le `Pan` natif de
   * react-native-gesture-handler (actif dès 8 de déplacement horizontal, avant 8 de déplacement vertical ; ensuite il suit le
   * doigt quelle que soit sa direction), qui empêche celui de la feuille — même correctif que le questionnaire des Formats et la
   * feuille Planifier (ch12). L'appelant fournit la `GestureHandlerRootView` de la feuille. Absent : système de touchers de React
   * Native (rendu et comportement inchangés pour les autres écrans).
   *
   * Recette iPhone du 26/11/2026 (après-midi, Hermann : « Défini une règle une bonne fois pour toute pour ce geste ») : le `Pan`
   * natif applique la règle unique du glisser-pour-options (`@/shared/gestures/swipeReveal`) — actif dès 10 à l'horizontale avant
   * 24 à la verticale (départ en diagonale accepté) ; au relâchement, un geste court (24) ou un lancer suffit à ouvrir ou fermer.
   * [Avant : actif dès 8 avant 8 à la verticale, ouverture au-delà de la moitié de la course — remplacé.] Composition (en-têtes
   * de Circuit) et feuille du programme ; même jour (« réutilise-la ») : toutes les autres listes à actions glissées — Catalogue
   * des mouvements, Catalogue des séances, Agenda, Journal, catalogue des Programmes, blocs For time (lignes des formats).
   * [Responder system de React Native pour ces listes (capture si |dx| > |dy| au-delà de 8, décision à mi-course) — remplacé.]
   */
  readonly nativeGesture?: boolean;
  /**
   * Remarque c de Hermann du 26/11/2026 (Composition : « le glisser-gauche fait un rebond et revient à sa position initiale si
   * le doigt se déplace aussi à la verticale ») : un glissement engagé suit le doigt quelle que soit sa composante verticale
   * (`shouldFollowSwipe`). Absent : inchangé (Catalogue, Agenda, Journal).
   */
  readonly lockSwipeDirection?: boolean;
  readonly children: ReactNode;
  readonly testID: string;
}) {
  const groupWidth = enabled && !passive ? actions.length * actionWidth : 0;
  const offset = groupWidth > 0 ? groupWidth + SWIPE_ACTIONS_GAP + actionsRightMargin : 0;
  const reduceMotion = useReduceMotion();
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const isSwipingRef = useRef(false);
  const baseRef = useRef(0);
  const [translateX, setTranslateX] = useState(revealed ? -offset : 0);
  const translateXRef = useRef(translateX);
  const [swipeX] = useState(() => {
    const initial = revealed ? -offset : 0;
    if (translation === undefined) return new Animated.Value(initial);
    translation.setValue(initial);
    return translation;
  });
  const [isSettling, setIsSettling] = useState(false);
  const settleTokenRef = useRef(0);
  // Recette du 16/11/2026 (constats e et f) : la liste reste immobile pendant le glissement.
  const scrollLock = useSwipeScrollLock();

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
      scrollLock.hold();
      const x = clampSwipeTranslateX(baseRef.current + dx, offset);
      translateXRef.current = x;
      setTranslateX(x);
      settleTokenRef.current += 1;
      swipeX.setValue(x);
    },
    [offset, swipeX, scrollLock],
  );

  const delta = (event: GestureResponderEvent) => {
    const start = originRef.current;
    return start === null
      ? { dx: 0, dy: 0 }
      : { dx: event.nativeEvent.pageX - start.x, dy: event.nativeEvent.pageY - start.y };
  };

  const end = () => {
    originRef.current = null;
    scrollLock.release();
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;
    const open = shouldRevealAfterSwipe(translateXRef.current, offset);
    moveTo(open ? -offset : 0);
    if (open && !revealed) onReveal();
    else if (!open && revealed) onHide();
  };

  /** Règle unique du 26/11/2026 (`resolveSwipeRelease`) : fin d'un glisser porté par le `Pan` natif. */
  const endNative = (translationX: number, velocityX: number) => {
    originRef.current = null;
    scrollLock.release();
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;
    const open = resolveSwipeRelease({ wasOpen: baseRef.current < 0, translationX, velocityX });
    moveTo(open ? -offset : 0);
    if (open && !revealed) onReveal();
    else if (!open && revealed) onHide();
  };

  // r3 (23/11/2026) : en feuille native, le geste natif porte seul le glissement ; les touchers de React Native ne servent plus
  // qu'à l'appui (annulés à l'activation du geste natif, sans effet sur la position).
  const native = nativeGesture && offset > 0;
  // Lot 4 du 23/11/2026 (x4, Hermann : « le glisser gauche provoque l'ouverture systématique de l'écran de planification d'une
  // séance ») : en feuille native, les touchers de React Native ne sont pas annulés à l'activation du Pan — la fin du glissé
  // arrivait au `Pressable` comme un appui, après `onFinalize` (qui remet `isSwipingRef` à faux) et avant que `revealed` ne
  // change. Un toucher dont le Pan s'est activé n'est donc jamais un appui ; le marqueur est remis à zéro au toucher suivant.
  const pannedRef = useRef(false);
  const pan = useSwipeRevealPan({
    enabled: native,
    testID: `${testID}-pan`,
    onBegin: () => {
      pannedRef.current = true;
      baseRef.current = revealed ? -offset : 0;
    },
    onUpdate: follow,
    onRelease: endNative,
  });

  const showActions = translateX < 0 || isSettling;
  const actionsSlide = useMemo(
    () =>
      offset > 0 ? swipeX.interpolate({ inputRange: [-offset, 0], outputRange: [0, offset], extrapolate: "clamp" }) : swipeX,
    [offset, swipeX],
  );

  const row = (
    <View
      onTouchStart={(event) => {
        if (native) {
          pannedRef.current = false;
          return;
        }
        originRef.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
        isSwipingRef.current = false;
        baseRef.current = revealed ? -offset : 0;
      }}
      onTouchMove={(event) => {
        if (native) return;
        // Reçu même quand une action révélée détient le responder (balayage droit de fermeture).
        const { dx, dy } = delta(event);
        if (offset === 0 || !shouldFollowSwipe(dx, dy, lockSwipeDirection && isSwipingRef.current)) return;
        follow(dx);
      }}
      onTouchEnd={native ? undefined : end}
      onTouchCancel={() => {
        if (native) return;
        originRef.current = null;
        isSwipingRef.current = false;
        scrollLock.release();
        moveTo(revealed ? -offset : 0);
      }}
      onMoveShouldSetResponderCapture={(event) => {
        // Recette du 26/11/2026 (après-midi, branchement de toutes les listes sur la règle unique) : glisser natif engagé — la
        // rangée prend le toucher de React Native (sans suivre : le `Pan` porte la position), pour qu'aucun bouton du contenu
        // (ouvrir, démarrer, photo…) ni aucune action révélée ne reçoive la fin du glissé comme un appui, lorsque l'activation du
        // `Pan` n'a pas annulé les touchers de React Native (feuille native).
        if (native) return isSwipingRef.current;
        const { dx, dy } = delta(event);
        if (offset === 0 || !shouldFollowSwipe(dx, dy, lockSwipeDirection && isSwipingRef.current)) return false;
        follow(dx);
        return true;
      }}
      onResponderMove={(event) => {
        if (native) return;
        const { dx, dy } = delta(event);
        if ((lockSwipeDirection && isSwipingRef.current) || Math.abs(dx) > Math.abs(dy)) follow(dx);
      }}
      onResponderRelease={native ? undefined : end}
      onResponderTerminationRequest={() => !isSwipingRef.current}
      style={styles.container}
      testID={testID}
    >
      {showActions ? (
        <Animated.View
          pointerEvents={translateX < 0 ? "auto" : "none"}
          accessibilityElementsHidden={translateX >= 0}
          importantForAccessibility={translateX < 0 ? "auto" : "no-hide-descendants"}
          style={[
            styles.actions,
            { width: groupWidth },
            actionsHeight !== undefined ? { bottom: undefined, height: actionsHeight } : null,
            actionsRightMargin > 0 ? { right: actionsRightMargin } : null,
            actionsInsets === undefined
              ? null
              : { top: -(actionsInsets.top ?? 0), bottom: -(actionsInsets.bottom ?? 0), right: -(actionsInsets.right ?? 0) },
            slideActions && offset > 0 ? { transform: [{ translateX: actionsSlide }] } : null,
          ]}
          testID={`${testID}-actions`}
        >
          {actions.map((action, index) => (
            <Pressable
              key={action.key}
              onPress={() => {
                // Recette du 04/11 : le geste est clos — la fin du toucher ne réévalue pas l'ouverture.
                originRef.current = null;
                isSwipingRef.current = false;
                scrollLock.release();
                action.onPress();
              }}
              disabled={action.disabled === true}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityState={{ disabled: action.disabled === true }}
              style={[
                styles.action,
                index === 0 ? styles.actionFirst : null,
                index === actions.length - 1 ? styles.actionLast : null,
                actionWidth !== SWIPE_ACTION_WIDTH ? { width: actionWidth } : null,
                actionsRadius === undefined
                  ? null
                  : index === 0
                    ? { borderTopLeftRadius: actionsRadius, borderBottomLeftRadius: actionsRadius }
                    : index === actions.length - 1
                      ? { borderTopRightRadius: actionsRadius, borderBottomRightRadius: actionsRadius }
                      : null,
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
        </Animated.View>
      ) : null}
      <AnimatedPressable
        // Inerte, la carte reste une cible active (jamais `disabled`) : elle garde les touchers non pris par son
        // contenu, dont l'appui long transmis à l'appelant (saisie du bloc), comme au repli.
        accessible={!passive}
        onPress={() => {
          // Carte ouverte : appui neutre (seul un balayage droit la referme).
          if (!passive && !revealed && !isSwipingRef.current && !pannedRef.current) onPress();
        }}
        onLongPress={
          onLongPress === undefined
            ? undefined
            : () => {
                if (!revealed && !isSwipingRef.current && !pannedRef.current) onLongPress();
              }
        }
        accessibilityRole={passive ? undefined : "button"}
        accessibilityLabel={passive ? undefined : accessibilityLabel}
        accessibilityHint={passive ? undefined : accessibilityHint}
        accessibilityState={passive ? undefined : accessibilityState}
        accessibilityActions={
          passive
            ? []
            : [
                ...(enabled ? actions.filter((action) => action.disabled !== true) : []).map(
                  (action): AccessibilityActionInfo => ({ name: action.key, label: action.label }),
                ),
                ...extraAccessibilityActions.map((action): AccessibilityActionInfo => ({ name: action.name, label: action.label })),
              ]
        }
        onAccessibilityAction={(event) => {
          if (passive) return;
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
  // r3 (23/11/2026) : `Pan` natif du glissement en feuille native — règle unique du 26/11/2026 (`useSwipeRevealPan`).
  // Recette du 26/11/2026 (après-midi) : `GestureDetector` exige un ancêtre `GestureHandlerRootView` (erreur en développement
  // sinon ; nécessaire sur Android) — les listes branchées sur la règle unique (Catalogues, Agenda, Journal, Programmes) n'en ont
  // pas. Racine posée autour de la rangée, sans style de mise en page (vue neutre ; sur iOS, simple vue).
  return nativeGesture ? (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <GestureDetector gesture={pan}>{row}</GestureDetector>
    </GestureHandlerRootView>
  ) : (
    row
  );
}

const JOIN_EASIER = require("../../../assets/icons/catalogue-raccord-plus-facile.svg");
const JOIN_HARDER = require("../../../assets/icons/catalogue-raccord-plus-difficile.svg");

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  // Racine des gestes de la rangée : aucun style propre (pas le `flex: 1` par défaut de `GestureHandlerRootView`).
  gestureRoot: {},
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
