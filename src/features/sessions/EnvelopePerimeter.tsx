/**
 * PRE-9 (story B.4b) — périmètre ajustable du conteneur en cours de pose (mode enveloppe).
 *
 * Demande de Hermann (29/10/2026) : « Lorsqu'on a sélectionné un exercice pour poser un circuit, deux
 * petits traits horizontaux apparaissent au dessus et en dessous des bords du cadre aux liserés pleins,
 * en haut et en bas, qui permettent de déplacer le périmètre du circuit (idem pour la séance) en
 * faisant glisser les bords en haut et en bas (appui sur les traits puis glissement). » ; précision du
 * 31/10 : « idem pour la séance » désigne « Le Cycle ».
 *
 * - `EnvelopeHandle` : trait d'un bord (haut ou bas). Appui puis glissement par le système de
 *   répondeurs natif (mêmes primitives que le glisser des cartes) ; le trait suit le doigt et, au
 *   relâchement, le bord se cale sur la limite d'élément la plus proche. Alternative accessible (P-4 : primitive native) : élément
 *   « ajustable » — balayer vers le haut étend, vers le bas réduit ; actions nommées « Étendre vers le
 *   haut / le bas », « Réduire par le haut / le bas ».
 * - `useEnvelopePerimeterDrag` : mesure (`measureInWindow`) des contenus atteignables au début du
 *   glisser et calage du bord (`edgeIndexAt`).
 * - Recette iPhone n° 2 du 31/10/2026 (Hermann) : b4b-etendre — liste figée pendant le glisser d'un trait,
 *   défilement automatique près des bords, trait sous le doigt ; b4b-saisie — les unités d'un périmètre
 *   comprennent les Points d'arrêt du parent (`EnvelopeUnit`), mesurés et calés comme les contenus.
 * - Contre-recette n° 4 du 01/11/2026 (b4b-etendre, Hermann : « le comportement est correct, mais ce
 *   n'est pas seulement le trait qui doit se déplacer mais le bord du cadre avec le trait ») : pendant le
 *   glisser, le bord du cadre (trait de bord, arrondis, fond) suit le trait sous le doigt
 *   (`EnvelopeMovingSegment`, `envelopeSegmentMotion`) ; le calage au relâchement est inchangé.
 *
 * Rendu des traits : aucune maquette Figma (`10819:20344`, `10836:20478` n'en montrent pas) — rendu
 * minimal choisi, cohérent avec le cadre désigné (même bleu), à juger en recette (ARB-19).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, View, type AccessibilityActionEvent, type GestureResponderEvent } from "react-native";

import {
  adjustEnvelopeSpan,
  envelopeSpanReach,
  type EnvelopeEdge,
  type EnvelopeSpan,
  type EnvelopeSpanReach,
  type EnvelopeUnit,
} from "@/domain/sessions/layoutOperations";
import type { SessionDraft } from "@/domain/sessions/SessionDraft";
import type { DragAutoScroll } from "@/features/sessions/useDragAutoScroll";
import { colors } from "@/shared/ui/tokens";

/** Clé d'une unité du mode enveloppe (contenu ou, recette n° 2 du 31/10, Point d'arrêt) : mesures, noms. */
export const envelopeTargetKey = (target: EnvelopeUnit): string => `${target.kind}:${target.id}`;

/** Limites verticales mesurées d'un contenu, en coordonnées de fenêtre. */
export type EnvelopeRect = { readonly top: number; readonly bottom: number };

/**
 * Rang de la limite d'élément la plus proche de `pageY` pour le bord `edge` (calage) : bord haut,
 * le haut d'un contenu de `0` à `reach.end` ; bord bas, le bas d'un contenu de `reach.start` à la fin
 * de l'étendue. `null` tant qu'aucune mesure n'est connue.
 */
export function edgeIndexAt(rects: readonly (EnvelopeRect | null)[], edge: EnvelopeEdge, reach: EnvelopeSpanReach, pageY: number): number | null {
  const [from, to] = edge === "TOP" ? [0, reach.end] : [reach.start, reach.run.length - 1];
  let best: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = from; index <= to; index += 1) {
    const rect = rects[index];
    if (rect === null || rect === undefined) continue;
    const distance = Math.abs((edge === "TOP" ? rect.top : rect.bottom) - pageY);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  }
  return best;
}

type DragSession = {
  readonly origin: EnvelopeSpan;
  readonly edge: EnvelopeEdge;
  readonly reach: EnvelopeSpanReach;
  readonly rects: (EnvelopeRect | null)[];
};

/**
 * Contre-recette n° 4 du 01/11/2026 (b4b-etendre) : glisser d'un trait en cours, une fois les unités du
 * périmètre mesurées — chaque cadre de ses unités en déduit sa part du bord qui suit le trait.
 */
export type EnvelopeEdgeDrag = {
  readonly span: EnvelopeSpan;
  readonly edge: EnvelopeEdge;
  /** Translation du trait (doigt et défilement automatique), repère du contenu. */
  readonly translation: Animated.Value;
  /** Limites mesurées au début du glisser (fenêtre) des unités du périmètre, par clé. */
  readonly rects: ReadonlyMap<string, EnvelopeRect>;
  /** Haut de la première unité et bas de la dernière (fenêtre), au début du glisser. */
  readonly top: number;
  readonly bottom: number;
};

/**
 * Glisser d'un trait : `registerFrame` reçoit la vue de chaque cadre du mode enveloppe ; `begin`
 * mesure les contenus atteignables ; au relâchement, `end` remplace dans la sélection le périmètre
 * saisi par celui dont le bord est calé sous le doigt (`onReplace`). Pendant le glisser, le trait suit
 * le doigt et reste monté : le périmètre ne change qu'au relâchement.
 */
export function useEnvelopePerimeterDrag({
  draft,
  container,
  spans,
  onReplace,
}: {
  draft: SessionDraft;
  container: "CIRCUIT" | "CYCLE";
  spans: readonly EnvelopeSpan[];
  onReplace: (previous: EnvelopeSpan, next: EnvelopeSpan) => void;
}) {
  const frames = useRef(new Map<string, View>());
  const session = useRef<DragSession | null>(null);
  const [edgeDrag, setEdgeDrag] = useState<EnvelopeEdgeDrag | null>(null);
  const registerFrame = useCallback((key: string, view: View | null) => {
    if (view === null) frames.current.delete(key);
    else frames.current.set(key, view);
  }, []);
  const begin = useCallback(
    (span: EnvelopeSpan, edge: EnvelopeEdge, translation?: Animated.Value) => {
      const reach = envelopeSpanReach(draft, container, span, spans);
      if (reach === null) return;
      const rects: (EnvelopeRect | null)[] = reach.run.map(() => null);
      const active: DragSession = { origin: span, edge, reach, rects };
      session.current = active;
      // Contre-recette n° 4 : unités du périmètre mesurées — le bord du cadre peut suivre le trait.
      const publish = () => {
        if (translation === undefined || session.current !== active) return;
        const own = new Map<string, EnvelopeRect>();
        for (let index = reach.start; index <= reach.end; index += 1) {
          const rect = rects[index];
          if (rect === null || rect === undefined) return;
          own.set(envelopeTargetKey(reach.run[index]!), rect);
        }
        setEdgeDrag({ span, edge, translation, rects: own, top: rects[reach.start]!.top, bottom: rects[reach.end]!.bottom });
      };
      reach.run.forEach((target, index) => {
        frames.current.get(envelopeTargetKey(target))?.measureInWindow((_x, y, _width, height) => {
          rects[index] = { top: y, bottom: y + height };
          publish();
        });
      });
    },
    [container, draft, spans],
  );
  /** Relâchement : le bord se cale sur la limite la plus proche du doigt ; `pageY` absent : annulé. */
  const end = useCallback(
    (pageY?: number) => {
      const active = session.current;
      session.current = null;
      setEdgeDrag(null);
      if (active === null || pageY === undefined) return;
      const index = edgeIndexAt(active.rects, active.edge, active.reach, pageY);
      if (index === null) return;
      const delta = index - (active.edge === "TOP" ? active.reach.start : active.reach.end);
      const next = adjustEnvelopeSpan(draft, container, active.origin, active.edge, delta, spans);
      if (next !== active.origin) onReplace(active.origin, next);
    },
    [container, draft, onReplace, spans],
  );
  return { registerFrame, begin, end, edgeDrag };
}

/**
 * Contre-recette n° 4 du 01/11/2026 (b4b-etendre) — mouvement de la bande d'une part de cadre (unité
 * du périmètre) pendant le glisser du trait `edge` : la part est faite d'une bande (bords gauche et
 * droit, fond), étirée ou réduite (`scaleY` autour de son bord opposé au trait) d'après la translation
 * du trait, et, pour la première et la dernière unité, d'un arrondi (trait de bord) — fixe du côté
 * opposé, porté par la translation du côté du trait. Repère de la part : 0 à `height` ; `edgeOffset` :
 * position du bord saisi au début du glisser dans ce repère (dernière unité, bord bas : `height` ;
 * première unité, bord haut : 0). Entrée de l'interpolation : translation du trait ; sortie : échelle.
 */
export type EnvelopeSegmentMotion = {
  readonly bandTop: number;
  readonly bandHeight: number;
  readonly origin: "top" | "bottom";
  readonly inputRange: readonly [number, number];
  readonly outputRange: readonly [number, number];
  readonly extrapolateLeft: "clamp" | "extend";
  readonly extrapolateRight: "clamp" | "extend";
};

export function envelopeSegmentMotion(
  edge: EnvelopeEdge,
  { height, radius, first, last, edgeOffset }: { height: number; radius: number; first: boolean; last: boolean; edgeOffset: number },
): EnvelopeSegmentMotion {
  const bandTop = first ? radius : 0;
  const bandEnd = last ? height - radius : height;
  const bandHeight = Math.max(1, bandEnd - bandTop);
  if (edge === "BOTTOM") {
    // Bande de `bandTop` jusqu'au haut de l'arrondi bas, posé sur le trait (`edgeOffset` + translation).
    const start = radius + bandTop - edgeOffset;
    return {
      bandTop,
      bandHeight,
      origin: "top",
      inputRange: [start, start + bandHeight],
      outputRange: [0, 1],
      extrapolateLeft: "clamp",
      extrapolateRight: last ? "extend" : "clamp",
    };
  }
  // Bord haut : bande du bas de l'arrondi haut, posé sous le trait, jusqu'à `bandEnd`.
  const end = bandEnd - edgeOffset - radius;
  return {
    bandTop,
    bandHeight,
    origin: "bottom",
    inputRange: [end - bandHeight, end],
    outputRange: [1, 0],
    extrapolateLeft: first ? "extend" : "clamp",
    extrapolateRight: "clamp",
  };
}

/**
 * Part du cadre d'une unité pendant le glisser d'un trait (voir `envelopeSegmentMotion`), à la place de
 * l'aplat du cadre désigné de cette unité. `limit` : translation au-delà de laquelle le bord ne suit
 * plus le trait (le cadre garde au moins la hauteur de ses deux arrondis : il ne se retourne pas).
 */
export function EnvelopeMovingSegment({
  edge,
  translation,
  height,
  radius,
  first,
  last,
  edgeOffset,
  limit,
  fill,
  borderColor,
  borderWidth,
  testID,
}: {
  edge: EnvelopeEdge;
  translation: Animated.Value;
  height: number;
  radius: number;
  first: boolean;
  last: boolean;
  edgeOffset: number;
  limit: number;
  fill: string;
  borderColor: string;
  borderWidth: number;
  testID: string;
}) {
  const motion = envelopeSegmentMotion(edge, { height, radius, first, last, edgeOffset });
  const bounded = useMemo(
    () =>
      edge === "BOTTOM"
        ? translation.interpolate({ inputRange: [limit, limit + 1], outputRange: [limit, limit + 1], extrapolateLeft: "clamp", extrapolateRight: "extend" })
        : translation.interpolate({ inputRange: [limit - 1, limit], outputRange: [limit - 1, limit], extrapolateLeft: "extend", extrapolateRight: "clamp" }),
    [edge, limit, translation],
  );
  const [inputFrom, inputTo] = motion.inputRange;
  const [outputFrom, outputTo] = motion.outputRange;
  const scale = useMemo(
    () =>
      bounded.interpolate({
        inputRange: [inputFrom, inputTo],
        outputRange: [outputFrom, outputTo],
        extrapolateLeft: motion.extrapolateLeft,
        extrapolateRight: motion.extrapolateRight,
      }),
    [bounded, inputFrom, inputTo, motion.extrapolateLeft, motion.extrapolateRight, outputFrom, outputTo],
  );
  const sides = { borderLeftWidth: borderWidth, borderRightWidth: borderWidth, borderColor, backgroundColor: fill };
  // Arrondi du côté du trait (première unité, bord haut ; dernière, bord bas) : porté par sa translation.
  const cap = (side: EnvelopeEdge) => (
    <Animated.View
      style={[
        sides,
        styles.layer,
        side === "TOP"
          ? { top: 0, height: radius, borderTopWidth: borderWidth, borderTopLeftRadius: radius, borderTopRightRadius: radius }
          : { top: height - radius, height: radius, borderBottomWidth: borderWidth, borderBottomLeftRadius: radius, borderBottomRightRadius: radius },
        side === edge ? { transform: [{ translateY: bounded }] } : null,
      ]}
      testID={`${testID}-${side === "TOP" ? "top" : "bottom"}`}
    />
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID}>
      <Animated.View
        style={[sides, styles.layer, { top: motion.bandTop, height: motion.bandHeight, transformOrigin: motion.origin, transform: [{ scaleY: scale }] }]}
        testID={`${testID}-band`}
      />
      {first ? cap("TOP") : null}
      {last ? cap("BOTTOM") : null}
    </View>
  );
}

/** Dimensions du trait (valeurs de conception locales, Figma muet ; `tokens.ts` gelé). */
const HANDLE_BAR_WIDTH = 32;
const HANDLE_BAR_HEIGHT = 4;
/** Zone tactile du trait : 64 × 28, centrée sur le trait ; le trait est 4 au-delà du bord du cadre. */
const HANDLE_HIT_WIDTH = 64;
const HANDLE_HIT_HEIGHT = 28;
const HANDLE_GAP_FROM_EDGE = 4;
const HANDLE_HIT_OFFSET = -(HANDLE_GAP_FROM_EDGE + HANDLE_BAR_HEIGHT / 2 + HANDLE_HIT_HEIGHT / 2);

export type EnvelopeHandleProps = {
  readonly edge: EnvelopeEdge;
  /** Nom accessible (« Bord haut du circuit »…). */
  readonly label: string;
  /** Valeur accessible : nombre de contenus du périmètre. */
  readonly value: string;
  readonly extendLabel: string;
  readonly reduceLabel: string;
  /** Étendre (`+1`) ou réduire (`-1`) d'un contenu. */
  readonly onStep: (direction: 1 | -1) => void;
  /** Contre-recette n° 4 du 01/11/2026 : reçoit la translation du trait (le bord du cadre la suit). */
  readonly onDragStart: (translation: Animated.Value) => void;
  /** Relâchement à `pageY` ; sans valeur : glisser interrompu (aucun changement). */
  readonly onDragEnd: (pageY?: number) => void;
  /**
   * Recette iPhone n° 2 du 31/10/2026 (b4b-etendre) : défilement automatique de la liste pendant le
   * glisser (story 7.4) ; `onDragStart` fige la liste (défilement par l'utilisateur coupé).
   */
  readonly autoScroll: DragAutoScroll;
  readonly testID: string;
};

/** Trait d'un bord du périmètre (voir l'en-tête). */
export function EnvelopeHandle({ edge, label, value, extendLabel, reduceLabel, onStep, onDragStart, onDragEnd, autoScroll, testID }: EnvelopeHandleProps) {
  const [translation] = useState(() => new Animated.Value(0));
  const originRef = useRef(0);
  /** Déplacement du doigt depuis l'appui (le défilement automatique s'y ajoute). */
  const fingerDyRef = useRef(0);
  const draggingRef = useRef(false);
  /**
   * Recette iPhone n° 2 du 31/10/2026 (b4b-etendre, Hermann : « Le trait doit rester sous le doigt
   * lorsqu'il se déplace, l'écran doit rester figé et se déplacer avec le défilement du train
   * uniquement s'il dépasse le cadre de l'écran ») : la liste est figée pendant le glisser
   * (`onDragStart` : défilement par l'utilisateur coupé, comme pour une carte saisie) ; près d'un bord
   * de la zone visible, elle défile d'elle-même (`useDragAutoScroll`, story 7.4) et le trait suit ce
   * défilement — il reste sous le doigt. Au relâchement, la position du doigt est rapportée au repère
   * des mesures prises à l'appui (défilement accumulé ajouté).
   */
  const finish = (pageY?: number) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const scrolled = pageY === undefined ? 0 : autoScroll.track(pageY);
    autoScroll.end();
    translation.setValue(0);
    onDragEnd(pageY === undefined ? undefined : pageY + scrolled);
  };
  // Trait démonté pendant son glisser (sortie du mode, Annuler d'un autre doigt) : défilement arrêté,
  // liste rendue, aucun changement.
  const unmountRef = useRef({ autoScroll, onDragEnd });
  useEffect(() => {
    unmountRef.current = { autoScroll, onDragEnd };
  });
  useEffect(
    () => () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      unmountRef.current.autoScroll.end();
      unmountRef.current.onDragEnd();
    },
    [],
  );
  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === "increment" || event.nativeEvent.actionName === "extend") onStep(1);
    if (event.nativeEvent.actionName === "decrement" || event.nativeEvent.actionName === "reduce") onStep(-1);
  };
  return (
    <Animated.View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: value }}
      accessibilityActions={[
        { name: "increment", label: extendLabel },
        { name: "decrement", label: reduceLabel },
        { name: "extend", label: extendLabel },
        { name: "reduce", label: reduceLabel },
      ]}
      onAccessibilityAction={onAccessibilityAction}
      onStartShouldSetResponder={() => true}
      // Recette n° 2 : le trait garde le geste dès l'appui (phase de capture), avant tout défilement.
      onStartShouldSetResponderCapture={() => true}
      onMoveShouldSetResponder={() => true}
      onMoveShouldSetResponderCapture={() => draggingRef.current}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event: GestureResponderEvent) => {
        originRef.current = event.nativeEvent.pageY;
        fingerDyRef.current = 0;
        draggingRef.current = true;
        onDragStart(translation);
        autoScroll.begin();
        // Story 7.4 : le trait suit le défilement automatique, même sans mouvement du doigt.
        autoScroll.attach((scrollDelta) => translation.setValue(fingerDyRef.current + scrollDelta));
      }}
      onResponderMove={(event: GestureResponderEvent) => {
        if (!draggingRef.current) return;
        fingerDyRef.current = event.nativeEvent.pageY - originRef.current;
        translation.setValue(fingerDyRef.current + autoScroll.track(event.nativeEvent.pageY));
      }}
      onResponderRelease={(event: GestureResponderEvent) => finish(event.nativeEvent.pageY)}
      onResponderTerminate={() => finish()}
      style={[styles.hit, edge === "TOP" ? { top: HANDLE_HIT_OFFSET } : { bottom: HANDLE_HIT_OFFSET }, { transform: [{ translateY: translation }] }]}
      testID={testID}
    >
      <View style={styles.bar} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Contre-recette n° 4 : couche d'une part de cadre qui suit le trait (bande, arrondis).
  layer: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  hit: {
    position: "absolute",
    left: "50%",
    marginLeft: -HANDLE_HIT_WIDTH / 2,
    width: HANDLE_HIT_WIDTH,
    height: HANDLE_HIT_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {
    width: HANDLE_BAR_WIDTH,
    height: HANDLE_BAR_HEIGHT,
    borderRadius: HANDLE_BAR_HEIGHT / 2,
    backgroundColor: colors.primary,
  },
});
