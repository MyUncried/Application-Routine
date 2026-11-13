import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { hasSvg } from "@/features/execution/ExecutionTimerRing";
import { RING } from "@/features/execution/timerRing";

/**
 * Recette du 13/11/2026 (Hermann : « À la place de rectangles pour la charge et les répétitions, une forme plus
 * triangulaire à bords ronds, formée par un deuxième rectangle de même taille mais vertical, juxtaposé, les deux étant
 * reliés par une forme arrondie qui épouse la forme circulaire du cercle. Dans l'esprit Apple Watch. ») : cadre en coin,
 * en haut à gauche (répétitions) ou à droite (charge) du cercle. Le carré `SIZE` × `SIZE` est privé d'un disque concentrique
 * à l'anneau (`CLEARANCE` au-delà des repères) : bras horizontal en haut, bras vertical sur le côté, bord intérieur qui suit
 * le cercle ; tous les angles arrondis (contour de même couleur, jointures rondes). La valeur est centrée dans le bras
 * horizontal. Sans le module SVG natif : cadre rectangulaire, comme avant.
 */
export const BADGE = {
  /** Côté du carré englobant (largeur du cadre rectangulaire précédent). */
  size: 92,
  /** Épaisseur du bras horizontal qui porte la valeur (hauteur du cadre précédent). */
  arm: 40,
  /** Débord au-dessus du haut de l'anneau. */
  above: 28,
  /** Écart entre le bord intérieur et les repères de l'anneau. */
  clearance: 6,
  /** Rayon des arrondis (moitié de l'épaisseur du contour). */
  round: 6,
  color: "#F0F1F5",
} as const;

type SvgModule = typeof import("react-native-svg");
let svgModule: SvgModule | null = null;
function svg(): SvgModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  if (svgModule === null) svgModule = require("react-native-svg") as SvgModule;
  return svgModule;
}

/**
 * Tracé du coin gauche dans son carré (origine en haut à gauche), le centre de l'anneau étant à (`cx`, `cy`).
 * `null` si le cercle ne coupe pas les deux bords intérieurs du carré (écran trop large) : cadre rectangulaire.
 */
export function cornerPath(cx: number, cy: number): string | null {
  const inset = BADGE.round;
  const size = BADGE.size - inset;
  const radius = RING.size / 2 + RING.outset + BADGE.clearance + inset;
  const dyRight = radius * radius - (cx - size) * (cx - size);
  const dxBottom = radius * radius - (cy - size) * (cy - size);
  if (dyRight <= 0 || dxBottom <= 0) return null;
  const rightY = cy - Math.sqrt(dyRight);
  const bottomX = cx - Math.sqrt(dxBottom);
  if (rightY < inset + BADGE.arm / 2 || rightY > size || bottomX < inset || bottomX > size) return null;
  const n = (value: number) => Math.round(value * 10) / 10;
  return `M ${inset} ${inset} H ${size} V ${n(rightY)} A ${n(radius)} ${n(radius)} 0 0 0 ${n(bottomX)} ${size} H ${inset} Z`;
}

export function ExecutionCornerBadge({
  side,
  areaWidth,
  children,
}: {
  readonly side: "left" | "right";
  /** Largeur de la zone du cercle (l'anneau y est centré, son haut à 0). */
  readonly areaWidth: number;
  readonly children: ReactNode;
}) {
  // Centre de l'anneau dans le carré du coin gauche (le coin droit est son symétrique).
  const path = hasSvg() ? cornerPath(areaWidth / 2, RING.size / 2 + RING.outset + BADGE.above) : null;
  const position = side === "left" ? { left: 0 } : { right: 0 };
  if (path === null) {
    return (
      <View style={[styles.fallback, position]}>
        {children}
      </View>
    );
  }
  const { default: Svg, Path, G } = svg();
  return (
    <View style={[styles.corner, position]} pointerEvents="none">
      <Svg width={BADGE.size} height={BADGE.size} style={StyleSheet.absoluteFill}>
        <G transform={side === "left" ? undefined : `translate(${BADGE.size}, 0) scale(-1, 1)`}>
          <Path d={path} fill={BADGE.color} stroke={BADGE.color} strokeWidth={BADGE.round * 2} strokeLinejoin="round" />
        </G>
      </Svg>
      <View style={styles.value}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  corner: { position: "absolute", top: -BADGE.above, width: BADGE.size, height: BADGE.size },
  value: { position: "absolute", top: 0, left: 0, right: 0, height: BADGE.arm + BADGE.round, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  fallback: {
    position: "absolute",
    top: -BADGE.above,
    height: BADGE.arm,
    width: BADGE.size,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: BADGE.color,
    alignItems: "center",
    justifyContent: "center",
  },
});
