import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import { Animated, StyleSheet, View, type ViewProps } from "react-native";

import { RailRing, RailSegment, TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";

/**
 * PRE-9 B.4c (COMP §7, CS-D2 à CS-D8) : en-têtes collantes de Circuit et de Cycle.
 *
 * L'en-tête reste dans son conteneur (commandes actives, CS-D5) : il est translaté vers le bas du
 * défilement au-delà du seuil, borné par le bas du conteneur — relève par poussée entre conteneurs
 * frères (CS-D3). La translation est une interpolation du décalage de défilement, sur le pilote
 * natif (aucun décalage d'une trame). Un fond opaque à la couleur du conteneur le sépare des cartes
 * qui défilent dessous ; le rail y est redessiné (« Le rail doit rester lisible à travers la zone
 * collante »).
 */

/** Défilement du corps de la Composition, partagé par les en-têtes collantes. */
export type StickyScroll = {
  /** Décalage de défilement, mis à jour sur le pilote natif (`Animated.event`). */
  readonly scrollY: Animated.Value;
  /** Dernier décalage connu (JS), pour le recalage au repliage (CS-D6). */
  readonly offset: () => number;
  readonly scrollTo: (offset: number) => void;
  /** Seuil de la zone collante dans le repère du corps défilant (sous la part fondue de la zone de contexte). */
  readonly top: number;
  /** CS-D7 : faux pendant un déplacement — les en-têtes sont décollés. */
  readonly enabled: boolean;
};

export const StickyScrollContext = createContext<StickyScroll | null>(null);

export function useStickyScroll(): StickyScroll | null {
  return useContext(StickyScrollContext);
}

/**
 * Géométrie d'un en-tête collant, dans le repère du contenu défilant. `start` : décalage à partir
 * duquel le haut du conteneur dépasse le seuil (CS-D2) ; `travel` : translation maximale, atteinte
 * quand le bas du conteneur (moins sa marge basse) rejoint le bas de l'en-tête — au-delà, l'en-tête
 * est poussé avec son conteneur. `null` : géométrie inconnue ou conteneur sans place pour coller.
 */
export type StickyRange = { readonly start: number; readonly travel: number };

export function stickyRange({
  containerY,
  containerHeight,
  headerBottom,
  bottomInset,
  stickTop,
}: {
  /** Haut du conteneur dans le contenu défilant. */
  containerY: number | null;
  containerHeight: number | null;
  /** Bas de l'en-tête dans le conteneur (marge haute comprise). */
  headerBottom: number | null;
  /** Marge basse du conteneur, que l'en-tête ne franchit pas. */
  bottomInset: number;
  /** Seuil, dans le repère du corps défilant (deux niveaux : sous l'en-tête collé du Cycle, CS-D4). */
  stickTop: number;
}): StickyRange | null {
  if (containerY === null || containerHeight === null || headerBottom === null) return null;
  const travel = containerHeight - headerBottom - bottomInset;
  if (!(travel > 0)) return null;
  return { start: containerY - stickTop, travel };
}

/** CS-D6 : décalage qui garde l'en-tête collé à sa place au repliage — `null` s'il n'est pas collé. */
export function stickyCollapseOffset(range: StickyRange | null, offset: number): number | null {
  if (range === null || offset <= range.start) return null;
  return range.start;
}

/** Rail redessiné dans le fond collé. */
export type StickyRail = {
  /** Axe du rail, dans le repère du conteneur (bord gauche du fond collé). */
  readonly centerX: number;
  /** Centre de l'anneau dans le repère de l'en-tête (rangée de titre). */
  readonly ringY: number;
  /** Cycle : anneau extérieur (diamètre). */
  readonly outerRing?: number;
};

export function StickyHeaderFrame({
  range,
  enabled,
  color,
  outsetLeft,
  outsetRight,
  insetTop,
  extension,
  rail,
  style,
  onLayout,
  pointerEvents,
  accessibilityElementsHidden,
  importantForAccessibility,
  testID,
  children,
}: {
  range: StickyRange | null;
  /** CS-D7 : décollé pendant un déplacement (et tant qu'aucun défilement n'est fourni). */
  enabled: boolean;
  /** Couleur (opaque) du conteneur. */
  color: string;
  /** Débord du fond jusqu'aux bords du conteneur (marges horizontales de l'en-tête). */
  outsetLeft: number;
  outsetRight: number;
  /** Marge haute du conteneur, couverte par le fond collé. */
  insetTop: number;
  /** Fond prolongé au-dessus de la marge haute (niveau Séance : part fondue de la zone de contexte). */
  extension: number;
  rail: StickyRail | null;
  style?: ViewProps["style"];
  onLayout?: ViewProps["onLayout"];
  pointerEvents?: ViewProps["pointerEvents"];
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: ViewProps["importantForAccessibility"];
  testID: string;
  children: ReactNode;
}) {
  const sticky = useStickyScroll();
  const rest = useRef(new Animated.Value(0)).current;
  const active = enabled && sticky !== null && sticky.enabled && range !== null;
  const start = range?.start ?? 0;
  const travel = range?.travel ?? 0;
  const translateY = useMemo(
    () =>
      active
        ? sticky.scrollY.interpolate({ inputRange: [start, start + travel], outputRange: [0, travel], extrapolate: "clamp" })
        : rest,
    [active, rest, start, sticky, travel],
  );
  const opacity = useMemo(
    () => (active ? sticky.scrollY.interpolate({ inputRange: [start, start + 1], outputRange: [0, 1], extrapolate: "clamp" }) : rest),
    [active, rest, start, sticky],
  );
  const slabTop = -(insetTop + extension);
  return (
    <Animated.View
      pointerEvents={pointerEvents ?? "box-none"}
      accessibilityElementsHidden={accessibilityElementsHidden}
      importantForAccessibility={importantForAccessibility}
      style={[style, styles.frame, { transform: [{ translateY }] }]}
      onLayout={onLayout}
      testID={testID}
    >
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.slab, { left: -outsetLeft, right: -outsetRight, top: slabTop, backgroundColor: color, opacity }]}
        testID={`${testID}-sticky-surface`}
      >
        {rail === null ? null : (
          <View style={StyleSheet.absoluteFill}>
            <RailSegment centerX={rail.centerX} top={0} bottom={0} testID={`${testID}-sticky-rail`} />
            <RailRing centerX={rail.centerX} centerY={-slabTop + rail.ringY} />
            {rail.outerRing === undefined ? null : (
              <View
                style={[
                  styles.outerRing,
                  {
                    width: rail.outerRing,
                    height: rail.outerRing,
                    borderRadius: rail.outerRing / 2,
                    left: rail.centerX - rail.outerRing / 2,
                    top: -slabTop + rail.ringY - rail.outerRing / 2,
                  },
                ]}
              />
            )}
          </View>
        )}
      </Animated.View>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Au-dessus des membres du conteneur, qui défilent sous lui.
  frame: {
    zIndex: 2,
  },
  slab: {
    position: "absolute",
    bottom: 0,
  },
  outerRing: {
    position: "absolute",
    borderWidth: 1,
    borderColor: TEXT_TERTIARY,
  },
});
