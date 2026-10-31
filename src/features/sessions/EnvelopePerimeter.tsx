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
 *
 * Rendu des traits : aucune maquette Figma (`10819:20344`, `10836:20478` n'en montrent pas) — rendu
 * minimal choisi, cohérent avec le cadre désigné (même bleu), à juger en recette (ARB-19).
 */

import { useCallback, useEffect, useRef, useState } from "react";
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
  const registerFrame = useCallback((key: string, view: View | null) => {
    if (view === null) frames.current.delete(key);
    else frames.current.set(key, view);
  }, []);
  const begin = useCallback(
    (span: EnvelopeSpan, edge: EnvelopeEdge) => {
      const reach = envelopeSpanReach(draft, container, span, spans);
      if (reach === null) return;
      const rects: (EnvelopeRect | null)[] = reach.run.map(() => null);
      session.current = { origin: span, edge, reach, rects };
      reach.run.forEach((target, index) => {
        frames.current.get(envelopeTargetKey(target))?.measureInWindow((_x, y, _width, height) => {
          rects[index] = { top: y, bottom: y + height };
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
      if (active === null || pageY === undefined) return;
      const index = edgeIndexAt(active.rects, active.edge, active.reach, pageY);
      if (index === null) return;
      const delta = index - (active.edge === "TOP" ? active.reach.start : active.reach.end);
      const next = adjustEnvelopeSpan(draft, container, active.origin, active.edge, delta, spans);
      if (next !== active.origin) onReplace(active.origin, next);
    },
    [container, draft, onReplace, spans],
  );
  return { registerFrame, begin, end };
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
  readonly onDragStart: () => void;
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
        onDragStart();
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
