import { useEffect, useRef, type ReactNode } from "react";
import { StyleSheet, TurboModuleRegistry, View } from "react-native";
import Reanimated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";

import { displayedFraction, MINOR_MARKS, pointAt, QUARTER_MARKS, RING, type RingMotion } from "@/features/execution/timerRing";

/**
 * Fin de PRE-10 — chrono circulaire (Figma `1992:8132`) : anneau de fond, repères, anneau de progression à embouts
 * arrondis et pastille de position, dessinés avec `react-native-svg` ; le contenu (côté, chrono) est centré dedans.
 *
 * Recette x2 du 11/11/2026 (« le mouvement circulaire est saccadé, il doit être fluide et continu quelque soit la
 * durée ») : l'avancée est animée sur le fil d'affichage (Reanimated), à vitesse constante, entre deux projections ;
 * une projection ne relance l'animation que si l'anneau s'est écarté de la position réelle (Suivant, reprise, pause).
 * [Remplacé le 11/11/2026 — anneau redessiné à chaque rafraîchissement de l'écran, environ une fois par seconde.]
 *
 * `react-native-svg` vérifie son module natif dès son import : il n'est chargé que si la version installée de
 * l'application le contient (build du 11/11/2026). Sinon, le contenu est rendu seul, comme avant.
 */
export function hasSvg(): boolean {
  try {
    return TurboModuleRegistry.get("RNSVGSvgViewModule") != null;
  } catch {
    return false;
  }
}

/** Écart (en tours) au-delà duquel l'anneau est recalé sur la position réelle : un peu plus d'un degré. */
const RESYNC_TURNS = 0.004;
/** Horizon d'une animation de chronomètre : une heure, relancée bien avant son terme par les projections. */
const STOPWATCH_HORIZON_MS = 3_600_000;

type SvgModule = typeof import("react-native-svg");
function createAnimatedSvg(svg: SvgModule) {
  return { svg, Circle: Reanimated.createAnimatedComponent(svg.Circle) };
}
let animated: ReturnType<typeof createAnimatedSvg> | null = null;

function animatedSvg(): ReturnType<typeof createAnimatedSvg> {
  if (animated === null) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    animated = createAnimatedSvg(require("react-native-svg") as SvgModule);
  }
  return animated;
}

/** Fondu de l'anneau de couleur : celui des textes de l'écran (`FADE_OUT_MS` - 50). */
const ARC_FADE_MS = 450;

/**
 * Recette du 12/11/2026 (Hermann : « Entre deux exercices le cercle gris disparaît aussi, il ne faut pas, seul le cercle
 * de couleur doit disparaître ») : `fading` efface l'anneau de couleur et sa pastille pendant la dernière demi-seconde
 * d'une étape, en même temps que les textes ; l'anneau gris et les repères restent affichés.
 */
export function ExecutionTimerRing({
  motion,
  fading = false,
  color = RING.progressColor,
  children,
  testID,
}: {
  readonly motion: RingMotion;
  readonly fading?: boolean;
  /** Couleur de l'anneau qui tourne et de sa trace (recette du 13/11/2026, `ringColorOf`). */
  readonly color?: string;
  readonly children: ReactNode;
  readonly testID?: string;
}) {
  if (!hasSvg()) return <View testID={testID === undefined ? undefined : `${testID}-plain`}>{children}</View>;
  return (
    <AnimatedRing motion={motion} fading={fading} color={color} testID={testID}>
      {children}
    </AnimatedRing>
  );
}

function AnimatedRing({
  motion,
  fading,
  color = RING.progressColor,
  children,
  testID,
}: {
  readonly motion: RingMotion;
  readonly fading: boolean;
  /** Couleur de l'anneau qui tourne et de sa trace (`ringColorOf`). */
  readonly color?: string;
  readonly children: ReactNode;
  readonly testID?: string | undefined;
}) {
  const { svg: Svg, Circle: AnimatedCircle } = animatedSvg();
  const canvas = RING.size + 2 * RING.outset;
  const center = canvas / 2;
  const circumference = 2 * Math.PI * RING.progressRadius;
  const turns = useSharedValue(motion.turns);
  const wrap = motion.wrap;
  // Vitesse et mode de l'animation en cours (`null` : immobile).
  const runningKey = useRef<string | null>(null);
  // Opacité de l'anneau de couleur : fondu à la fin d'une étape, retour immédiat à l'étape suivante (anneau vide).
  const arcOpacity = useSharedValue(1);
  useEffect(() => {
    cancelAnimation(arcOpacity);
    arcOpacity.value = fading ? withTiming(0, { duration: ARC_FADE_MS }) : 1;
  }, [fading, arcOpacity]);

  useEffect(() => {
    const key = motion.ratePerMs > 0 ? `${wrap}:${motion.ratePerMs}` : null;
    if (key !== null && key === runningKey.current && Math.abs(turns.value - motion.turns) < RESYNC_TURNS) return;
    cancelAnimation(turns);
    turns.value = motion.turns;
    runningKey.current = key;
    if (key === null) return;
    const target = wrap ? motion.turns + STOPWATCH_HORIZON_MS * motion.ratePerMs : 1;
    const duration = Math.max(0, (target - motion.turns) / motion.ratePerMs);
    turns.value = withTiming(target, { duration, easing: Easing.linear });
  }, [motion.turns, motion.ratePerMs, wrap, turns]);

  const arcProps = useAnimatedProps(() => {
    const fraction = displayedFraction(turns.value, wrap);
    return { strokeDashoffset: circumference * (1 - fraction), strokeOpacity: fraction > 0.0005 ? arcOpacity.value : 0 };
  });
  const knobProps = useAnimatedProps(() => {
    const point = pointAt(displayedFraction(turns.value, wrap), RING.progressRadius, center);
    return { cx: point.x, cy: point.y, opacity: arcOpacity.value };
  });

  const radial = (fraction: number, inner: number, outer: number) => {
    const from = pointAt(fraction, inner, center);
    const to = pointAt(fraction, outer, center);
    return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
  };
  const start = pointAt(0, RING.progressRadius, center);
  return (
    <View style={[styles.frame, { width: canvas, height: canvas }]} testID={testID}>
      <Svg.default width={canvas} height={canvas} style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg.Circle cx={center} cy={center} r={RING.trackRadius} stroke={RING.trackColor} strokeWidth={RING.trackWidth} fill="none" />
        {MINOR_MARKS.map((mark) => (
          <Svg.Line key={mark} {...radial(mark, RING.minorMark.inner, RING.minorMark.outer)} stroke={RING.minorMark.color} strokeOpacity={RING.minorMark.opacity} strokeWidth={RING.minorMark.width} strokeLinecap="round" />
        ))}
        {QUARTER_MARKS.map((mark) => (
          <Svg.Line key={mark} {...radial(mark, RING.quarterMark.inner, RING.quarterMark.outer)} stroke={RING.quarterMark.color} strokeWidth={RING.quarterMark.width} strokeLinecap="round" />
        ))}
        <Svg.Line {...radial(0, RING.startMark.inner, RING.startMark.outer)} stroke={RING.startMark.color} strokeWidth={RING.startMark.width} strokeLinecap="round" />
        {/* Anneau de progression : cercle tracé depuis le haut, dans le sens horaire, longueur animée. */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={RING.progressRadius}
          stroke={color}
          strokeWidth={RING.progressWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          fill="none"
          rotation={-90}
          origin={`${center}, ${center}`}
          animatedProps={arcProps}
        />
        <AnimatedCircle cx={start.x} cy={start.y} r={RING.knobRadius} fill={color} stroke="#FFFFFF" strokeWidth={RING.knobStroke} animatedProps={knobProps} />
      </Svg.default>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignSelf: "center", alignItems: "center", justifyContent: "center" },
  content: { alignItems: "center", justifyContent: "center", maxWidth: RING.trackRadius * 2 - RING.trackWidth * 2 },
});
