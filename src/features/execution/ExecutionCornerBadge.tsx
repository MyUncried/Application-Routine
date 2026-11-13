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
  above: 18,
  /**
   * Écart entre le bord intérieur et les repères de l'anneau. Recette du 13/11/2026 (Hermann : « il faut éloigner la
   * courbure du cercle, que cela fasse plus aéré et plus triangle ») : 18 ; puis « éloigner encore un peu plus du cercle » : 26.
   * [6, puis 18 — remplacés.] Puis « Rapprocher un peu les triangles du cercle permettait de gagner en hauteur des deux
   * côtés » : 16, débord au-dessus et en dessous de l’anneau 18 (au lieu de 28). [26 — remplacé.]
   */
  clearance: 16,
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
  if (rightY < inset + 16 || rightY > size || bottomX < inset || bottomX > size) return null;
  const n = (value: number) => Math.round(value * 10) / 10;
  return `M ${inset} ${inset} H ${size} V ${n(rightY)} A ${n(radius)} ${n(radius)} 0 0 0 ${n(bottomX)} ${size} H ${inset} Z`;
}

export function ExecutionCornerBadge({
  side,
  vertical = "top",
  areaWidth,
  children,
}: {
  readonly side: "left" | "right";
  /** Coin du haut (répétitions, charge) ou du bas (compteur automatique), symétrique par rapport au centre de l'anneau. */
  readonly vertical?: "top" | "bottom";
  /** Largeur de la zone du cercle (l'anneau y est centré, son haut à 0). */
  readonly areaWidth: number;
  readonly children: ReactNode;
}) {
  // Centre de l'anneau dans le carré du coin gauche (le coin droit est son symétrique).
  const path = hasSvg() ? cornerPath(areaWidth / 2, RING.size / 2 + RING.outset + BADGE.above) : null;
  const position = {
    ...(side === "left" ? { left: 0 } : { right: 0 }),
    ...(vertical === "top" ? { top: -BADGE.above } : { top: RING.size + 2 * RING.outset + BADGE.above - BADGE.size }),
  };
  const flipX = side === "right";
  const flipY = vertical === "bottom";
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
        <G transform={flipX || flipY ? `translate(${flipX ? BADGE.size : 0}, ${flipY ? BADGE.size : 0}) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})` : undefined}>
          <Path d={path} fill={BADGE.color} stroke={BADGE.color} strokeWidth={BADGE.round * 2} strokeLinejoin="round" />
        </G>
      </Svg>
      {/* Valeur décalée vers l’angle extérieur, où la forme est la plus épaisse. */}
      <View style={[styles.value, flipY ? styles.valueBottom : styles.valueTop, flipX ? styles.valueRight : styles.valueLeft]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  corner: { position: "absolute", width: BADGE.size, height: BADGE.size },
  value: { position: "absolute", left: 0, right: 0, height: BADGE.arm, alignItems: "center", justifyContent: "center" },
  valueLeft: { paddingLeft: 4, paddingRight: 16 },
  valueRight: { paddingLeft: 16, paddingRight: 4 },
  valueTop: { top: BADGE.round / 2 },
  valueBottom: { bottom: BADGE.round / 2 },
  fallback: {
    position: "absolute",
    height: BADGE.arm,
    width: BADGE.size,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: BADGE.color,
    alignItems: "center",
    justifyContent: "center",
  },
});
