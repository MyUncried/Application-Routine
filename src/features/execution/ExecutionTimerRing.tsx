import type { ReactNode } from "react";
import { StyleSheet, TurboModuleRegistry, View } from "react-native";

import { arcPath, MINOR_MARKS, pointAt, QUARTER_MARKS, RING } from "@/features/execution/timerRing";

/**
 * Fin de PRE-10 — chrono circulaire (Figma `1992:8132`) : anneau de fond, repères, anneau de progression à embouts
 * arrondis et pastille de position, dessinés avec `react-native-svg` ; le contenu (côté, chrono) est centré dedans.
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

export function ExecutionTimerRing({ fraction, children, testID }: { readonly fraction: number; readonly children: ReactNode; readonly testID?: string }) {
  if (!hasSvg()) return <View testID={testID === undefined ? undefined : `${testID}-plain`}>{children}</View>;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Svg = require("react-native-svg") as typeof import("react-native-svg");
  const canvas = RING.size + 2 * RING.outset;
  const center = canvas / 2;
  const radial = (fraction: number, inner: number, outer: number) => {
    const from = pointAt(fraction, inner, center);
    const to = pointAt(fraction, outer, center);
    return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
  };
  const knob = pointAt(fraction, RING.progressRadius, center);
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
        {fraction >= 0.9999 ? (
          <Svg.Circle cx={center} cy={center} r={RING.progressRadius} stroke={RING.progressColor} strokeWidth={RING.progressWidth} fill="none" />
        ) : fraction > 0 ? (
          <Svg.Path d={arcPath(fraction, RING.progressRadius, center)} stroke={RING.progressColor} strokeWidth={RING.progressWidth} strokeLinecap="round" fill="none" />
        ) : null}
        <Svg.Circle cx={knob.x} cy={knob.y} r={RING.knobRadius} fill={RING.progressColor} stroke="#FFFFFF" strokeWidth={RING.knobStroke} />
      </Svg.default>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignSelf: "center", alignItems: "center", justifyContent: "center" },
  content: { alignItems: "center", justifyContent: "center", maxWidth: RING.trackRadius * 2 - RING.trackWidth * 2 },
});
