import { memo, useEffect, useState, type ReactNode } from "react";
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { hasSvg } from "@/features/execution/ExecutionTimerRing";
import { RING } from "@/features/execution/timerRing";

/**
 * Recette du 13/11/2026 (Hermann : « À la place de rectangles pour la charge et les répétitions, une forme plus
 * triangulaire à bords ronds, formée par un deuxième rectangle de même taille mais vertical, juxtaposé, les deux étant
 * reliés par une forme arrondie qui épouse la forme circulaire du cercle. Dans l'esprit Apple Watch. ») : cadre en coin,
 * en haut à gauche (répétitions) ou à droite (charge) du cercle. Le carré `SIZE` × `SIZE` est privé d'un disque concentrique
 * à l'anneau (`CLEARANCE` au-delà des repères) : bras horizontal en haut, bras vertical sur le côté, bord intérieur qui suit
 * le cercle ; tous les angles arrondis (contour de même couleur, jointures rondes). La valeur tient sur deux lignes calées
 * contre l'angle extérieur (seconde recette du 17/11/2026). [Centrée dans le bras horizontal — remplacé.] Sans le module SVG natif : cadre rectangulaire, comme avant.
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
  color = BADGE.color,
  pulse = null,
  children,
}: {
  /**
   * Troisième recette du 17/11/2026 (Hermann, autres remarques, d : « pendant le compte à rebours du For Time en durée (3 secondes), faire clignoter le triangle du compte à rebours à chaque seconde (vert actuel > vert plus foncé > vert actuel) ») : à chaque changement de `key` (seconde affichée), la forme passe à `color` puis revient (fondu aller-retour) ; `null` :
   * aucun clignotement.
   */
  readonly pulse?: { readonly key: number; readonly color: string } | null;
  /** Fond du coin (vert quand le compteur automatique atteint l'objectif, recette du 13/11/2026). */
  readonly color?: string;
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
      <View style={[styles.fallback, position, { backgroundColor: color }]}>
        {pulse !== null ? <PulseLayer pulseKey={pulse.key} style={[StyleSheet.absoluteFill, { borderRadius: 12, backgroundColor: pulse.color }]} /> : null}
        {children}
      </View>
    );
  }
  return (
    <View style={[styles.corner, position]} pointerEvents="none">
      <CornerShape path={path} flipX={flipX} flipY={flipY} color={color} />
      {pulse !== null ? <CornerPulse pulseKey={pulse.key} path={path} flipX={flipX} flipY={flipY} color={pulse.color} /> : null}
      {/* Seconde recette du 17/11/2026 (Hermann : « En bas et en haut à droite : sur deux lignes, alignées à droite ; en bas et en
          haut à gauche : sur deux lignes, alignées à gauche ; lorsqu'il n'y a que la durée sans autre information, s'assurer du bon
          positionnement (en bas sur la deuxième ligne, en haut sur la première ligne) ») : deux lignes calées contre l'angle
          extérieur, en partant du haut (coins du haut) ou du bas (coins du bas). [Valeur centrée dans le bras horizontal, sauf
          Durée maximum et compteur « mouv. » — remplacé.] */}
      <View style={[styles.value, flipX ? styles.valueRight : styles.valueLeft, flipY ? styles.valueBottom : styles.valueTop]}>{children}</View>
    </View>
  );
}

/** Couche plus foncée posée sur le coin, visible un instant à chaque seconde (aller-retour en 600 ms). */
function PulseLayer({ pulseKey, style, children }: { pulseKey: number; style: StyleProp<ViewStyle>; children?: ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [pulseKey, opacity]);
  return (
    <Animated.View pointerEvents="none" style={[style, { opacity }]} testID="execution-corner-pulse">
      {children}
    </Animated.View>
  );
}

function CornerPulse({ pulseKey, path, flipX, flipY, color }: { pulseKey: number; path: string; flipX: boolean; flipY: boolean; color: string }) {
  return (
    <PulseLayer pulseKey={pulseKey} style={StyleSheet.absoluteFill}>
      <CornerShape path={path} flipX={flipX} flipY={flipY} color={color} />
    </PulseLayer>
  );
}

/**
 * Forme du coin, redessinée seulement si elle change (recette du 13/11/2026, Hermann : « À chaque incrément, le compteur
 * a un effet flash lent ») : le changement de la valeur ne redessine pas la forme.
 */
const CornerShape = memo(function CornerShape({ path, flipX, flipY, color }: { path: string; flipX: boolean; flipY: boolean; color: string }) {
  const { default: Svg, Path, G } = svg();
  return (
    <Svg width={BADGE.size} height={BADGE.size} style={StyleSheet.absoluteFill}>
      <G transform={flipX || flipY ? `translate(${flipX ? BADGE.size : 0}, ${flipY ? BADGE.size : 0}) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})` : undefined}>
        <Path d={path} fill={color} stroke={color} strokeWidth={BADGE.round * 2} strokeLinejoin="round" />
      </G>
    </Svg>
  );
});

const styles = StyleSheet.create({
  corner: { position: "absolute", width: BADGE.size, height: BADGE.size },
  value: { position: "absolute", left: 0, right: 0, height: BADGE.arm + 10 },
  valueLeft: { alignItems: "flex-start", paddingLeft: 12, paddingRight: 4 },
  valueRight: { alignItems: "flex-end", paddingLeft: 4, paddingRight: 12 },
  valueTop: { top: 10, justifyContent: "flex-start" },
  // Recette du 13/11/2026 (Hermann : « Alignés à droite, assurer assez de marge entre le texte et le bas du cadre ») : 12 au-dessus
  // du bas du coin et 12 du bord extérieur.
  valueBottom: { bottom: 12, justifyContent: "flex-end" },
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
