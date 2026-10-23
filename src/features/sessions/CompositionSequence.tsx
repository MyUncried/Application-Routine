import { useMemo, type Ref } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fixedRadii, spacing, type } from "@/shared/ui/tokens";

/**
 * Séquence de la Composition (PRE-6 story 2.1, AD-41 ; PRE-6 story 5.2, D-435, CE-T03-08 ch13
 * L1478, Figma Standard `8328:28605`) : bornes « Compte à rebours » et « Fin de séance » avec
 * pastille de valeur modifiable, et primitives du RAIL SEGMENTÉ.
 *
 * Story 5.2 : le rail n'est plus un trait continu avec un repère par étape. Il est fait de segments
 * de 1,5 (`#7A7A80`) qui relient, d'un bord à l'autre, les anneaux (Compte à rebours, Circuit, Fin
 * de séance) et les médias des cartes — le média sert d'ancrage, plus aucun repère par occurrence —,
 * avec un point de 6 au niveau d'un point d'arrêt. Chaque élément de la séquence porte ses propres
 * segments (voir `compositionRail.ts`) ; ce module ne fournit que leur dessin. Tous les éléments du
 * rail sont décoratifs : ni toucher, ni accessibilité.
 */

/**
 * Couleur `color/text-tertiary` de Figma (`#7A7A80`, ch12 L1010) — aucun jeton dans `tokens.ts` :
 * constante unique de la Composition (durée du Circuit, récupération, rail).
 */
export const TEXT_TERTIARY = "#7A7A80";

/** Rail (Figma `9819:20056` à `9819:20061`) : segments de 1,5, `#7A7A80`. */
const RAIL_WIDTH = 1.5;
const RAIL_COLOR = TEXT_TERTIARY;

/**
 * Anneau (Figma `9819:19909`, `9819:20017`, `9819:20052`) : cercle de 10 à fond blanc, contour
 * EXTÉRIEUR de 1,5 `#7A7A80` (boîte de 13). Les segments s'arrêtent au bord du cercle de 10.
 */
export const RAIL_RING_DIAMETER = 10;
const RAIL_RING_STROKE = 1.5;
const RAIL_RING_BOX = RAIL_RING_DIAMETER + 2 * RAIL_RING_STROKE;

/** Point de raccord d'un point d'arrêt (Figma `9819:20062`) : 6 × 6, `#7A7A80`, posé sur le rail. */
const RAIL_DOT_DIAMETER = 6;

/** Écart vertical de la séquence hors Circuit (Figma `9819:19905` : 8 ; ch13 CE-T03-08 L1478). */
export const SEQUENCE_GAP = spacing[8];

/** Rangée d'une borne (Figma `9819:19910`, `9819:20053`) : 24, contenu centré. */
const BOUNDARY_CONTENT_HEIGHT = 24;
/** Marge basse du Compte à rebours (Figma `9819:19907` : rangée de 27, `pb 3`). */
const START_BOUNDARY_PADDING_BOTTOM = 27 - BOUNDARY_CONTENT_HEIGHT;
/** Centre vertical de l'anneau d'une borne (centré sur le contenu de 24). */
const BOUNDARY_RING_CENTER_Y = BOUNDARY_CONTENT_HEIGHT / 2;
/** Écart entre la colonne de l'anneau et le libellé (Figma : 8 ; libellé à x 69 à 402). */
const BOUNDARY_LABEL_GAP = spacing[8];

/** Cible tactile de la rangée (hauteur minimale 44, zones tactiles Figma). */
const VALUE_TOUCH_TARGET = 44;

/** Hauteur d'une borne : Compte à rebours (27), Fin de séance (24). */
function boundaryStepHeight(kind: BoundaryKind): number {
  return kind === "start" ? BOUNDARY_CONTENT_HEIGHT + START_BOUNDARY_PADDING_BOTTOM : BOUNDARY_CONTENT_HEIGHT;
}

/**
 * Ancre d'une borne : haut et bas de son anneau, depuis le haut de la rangée (Fin : 7 → 17).
 * Le lien de Fin de séance s'arrête au haut de l'anneau ; la queue du Compte à rebours part du bas.
 */
export const BOUNDARY_RING_TOP = BOUNDARY_RING_CENTER_Y - RAIL_RING_DIAMETER / 2;
const BOUNDARY_RING_BOTTOM = BOUNDARY_RING_CENTER_Y + RAIL_RING_DIAMETER / 2;

/**
 * Étendue tactile d'une borne au-delà de sa rangée, portée à 44 sans jamais empiéter sur l'élément
 * voisin (zones tactiles disjointes, story 5.2) : au plus l'écart de la séquence du côté d'une carte,
 * moins l'étendue tactile de l'élément voisin (`neighborSlop`) — revue 5.2 : la puce d'un point
 * d'arrêt juste au-dessus de la Fin déborde de 4 dans l'écart.
 *
 * Revue 5.3 : portée par la BOÎTE du `Pressable` (44 de haut, marges négatives : la rangée garde
 * 27 / 24), jamais par `hitSlop` — sous Fabric iOS, `RCTViewComponentView` écarte un toucher hors
 * des limites d'un parent qui ne mesure aucun débordement ; une boîte réelle crée ce débordement.
 */
export function boundaryTouchExtent(kind: BoundaryKind, neighborSlop = 0): { readonly top: number; readonly bottom: number } {
  const height = boundaryStepHeight(kind);
  const half = (VALUE_TOUCH_TARGET - BOUNDARY_CONTENT_HEIGHT) / 2;
  const limit = Math.max(0, SEQUENCE_GAP - neighborSlop);
  if (kind === "start") {
    // En haut : la marge du corps ; en bas : l'écart avant la première étape.
    const bottom = Math.min(limit, VALUE_TOUCH_TARGET - height - half);
    return { top: VALUE_TOUCH_TARGET - height - bottom, bottom };
  }
  const top = Math.min(limit, half);
  return { top, bottom: VALUE_TOUCH_TARGET - height - top };
}

export type BoundaryKind = "start" | "end";

const decorative = {
  pointerEvents: "none",
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

/** Segment fixe, de `top` à `top + height` (ou jusqu'à `bottom` du parent), centré sur `centerX`. */
export function RailSegment({
  centerX,
  top,
  height,
  bottom,
  testID,
}: {
  centerX: number;
  top: number;
  height?: number;
  bottom?: number;
  testID?: string;
}) {
  return (
    <View
      {...decorative}
      style={[styles.segment, { left: centerX - RAIL_WIDTH / 2, top }, height !== undefined ? { height } : { bottom: bottom ?? 0 }]}
      testID={testID}
    />
  );
}

/**
 * Lien vers le prédécesseur (`compositionRail.ts`) : segment qui part de l'ancre de l'élément
 * (`entryY`, dans son repère) et remonte de `length` jusqu'au bord bas de l'élément visible qui
 * le précède. Pendant le glisser, l'élément est translaté de `shift` et son prédécesseur de
 * `prevShift` (valeurs animées partagées) : le segment garde son bas sur l'ancre et s'étire ou se
 * rétracte de `shift - prevShift` par transformations seules (pilote natif), sans recalcul de mise
 * en page. `anchorBottom` : l'ancre est le bas du parent (bas du Circuit) au lieu de `entryY`.
 *
 * PRE-6 story 5.2b : une rétraction ne descend jamais sous `minLength`, la part du lien posée sur
 * la surface même de l'élément (carte : du haut de la carte au haut du média, `entryY` ; en-tête
 * du Circuit : marge du Circuit + décalage de l'anneau, `entryY` ; bas du Circuit : sa marge
 * basse) — remplace l'écrasement à 0. Ce morceau, sur l'élément lui-même, ne peut traverser aucun
 * autre média ; quand un voisin le chevauche, la jonction visible se fait à son bord.
 */
export function RailLink({
  centerX,
  entryY = 0,
  anchorBottom = false,
  length,
  minLength = anchorBottom ? 0 : entryY,
  shift,
  prevShift,
  testID,
}: {
  centerX: number;
  entryY?: number;
  anchorBottom?: boolean;
  length: number;
  /** Longueur visible minimale (surface propre de l'élément) ; par défaut `entryY`. */
  minLength?: number;
  shift: Animated.Value;
  prevShift: Animated.Value;
  testID?: string;
}) {
  // Base finie et non nulle.
  const base = Number.isFinite(length) && length > 0 ? length : 1;
  // Échelle minimale : la surface propre, jamais plus que la longueur au repos.
  const minScale = Math.min(1, Math.max(0, minLength) / base);
  const transform = useMemo(() => {
    const stretch = Animated.subtract(shift, prevShift);
    const scale = Animated.add(1, Animated.divide(stretch, base)).interpolate({
      inputRange: [minScale, minScale + 1],
      outputRange: [minScale, minScale + 1],
      extrapolateLeft: "clamp",
      extrapolateRight: "extend",
    });
    return [
      // Bas fixe : la mise à l'échelle autour du centre est compensée de la moitié de la variation.
      { translateY: Animated.multiply(Animated.subtract(1, scale), base / 2) },
      { scaleY: scale },
    ];
  }, [base, minScale, prevShift, shift]);
  return (
    <Animated.View
      {...decorative}
      style={[
        styles.segment,
        { left: centerX - RAIL_WIDTH / 2, height: base, transform },
        anchorBottom ? { bottom: 0 } : { top: entryY - base },
      ]}
      testID={testID}
    />
  );
}

/** Anneau sur le rail (cercle de 10, contour extérieur 1,5). */
export function RailRing({ centerX, centerY, testID }: { centerX: number; centerY: number; testID?: string }) {
  return (
    <View
      {...decorative}
      style={[styles.ring, { left: centerX - RAIL_RING_BOX / 2, top: centerY - RAIL_RING_BOX / 2 }]}
      testID={testID}
    />
  );
}

/** Point de raccord d'un point d'arrêt, posé sur le rail. */
export function RailDot({ centerX, centerY, testID }: { centerX: number; centerY: number; testID?: string }) {
  return (
    <View
      {...decorative}
      style={[styles.dot, { left: centerX - RAIL_DOT_DIAMETER / 2, top: centerY - RAIL_DOT_DIAMETER / 2 }]}
      testID={testID}
    />
  );
}

/**
 * Borne de la Séquence (Compte à rebours, Fin de séance — Figma `9819:19907`, `9819:20050`) :
 * anneau sur le rail, libellé Inter Medium 14 `#46464C` (`text-label`) à 45 de la colonne, et
 * pastille de valeur modifiable à droite (`DSF / Forms / Valeur modifiable`, `6944:26423`,
 * Texte=13 : fond `surface`, rayon 10, marges 10 / 4, Inter Semi Bold 13 `primary`). Le toucher de
 * la rangée entière (libellé et pastille) ouvre la roulette existante (CE-T03-08) ; les bornes
 * restent immobiles (RM-030, RM-031).
 *
 * Compte à rebours : rangée de 27 (contenu 24 + 3) ; Fin de séance : rangée de 24. L'anneau et la
 * queue sont dessinés à part (`BoundaryRail`), hors de l'atténuation du placement (revue 5.2 :
 * opacité uniforme du rail). `railCenterX` : centre du rail dans le repère de la rangée (colonne de
 * la séquence), dont le libellé laisse la colonne de l'anneau. `neighborSlop` : marge tactile de
 * l'élément voisin (`boundaryTouchExtent`).
 */
export function BoundaryStep({
  kind,
  label,
  value,
  isOpen,
  onPress,
  railCenterX,
  neighborSlop = 0,
  ref,
  testID,
}: {
  kind: BoundaryKind;
  label: string;
  value: string;
  isOpen: boolean;
  onPress: () => void;
  railCenterX: number;
  neighborSlop?: number;
  /** PRE-6 story 5.1b (revue) : élément accessible de la borne, cible de focus de l'écran. */
  ref?: Ref<View>;
  testID?: string;
}) {
  const height = boundaryStepHeight(kind);
  // Toute la rangée (libellé + pastille) ouvre la roulette, comme l'ancienne carte limite
  // (acquis conservé) ; revue 5.3 : la cible est la boîte du `Pressable`, 44 de haut.
  const extent = boundaryTouchExtent(kind, neighborSlop);
  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={{ text: value }}
      accessibilityState={{ expanded: isOpen }}
      style={[
        styles.boundary,
        {
          height: height + extent.top + extent.bottom,
          marginTop: -extent.top,
          marginBottom: -extent.bottom,
          paddingTop: extent.top,
          paddingBottom: height - BOUNDARY_CONTENT_HEIGHT + extent.bottom,
        },
      ]}
      testID={testID}
    >
      {/* Colonne de l'anneau : le libellé commence à son bord droit plus l'écart. */}
      <View style={{ width: railCenterX + RAIL_RING_DIAMETER / 2 }} testID={testID === undefined ? undefined : `${testID}-ring-column`} />
      <Text style={styles.boundaryLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.valuePill} testID={testID === undefined ? undefined : `${testID}-value`}>
        <Text style={styles.valueText}>{value}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Rail d'une borne, posé par l'écran sur la rangée (même repère, hors atténuation) : anneau centré
 * sur le contenu de 24 et, pour le Compte à rebours, queue du bas de l'anneau au bas de la rangée.
 */
export function BoundaryRail({ kind, railCenterX, testID }: { kind: BoundaryKind; railCenterX: number; testID: string }) {
  return (
    <>
      {kind === "start" ? (
        <RailSegment
          centerX={railCenterX}
          top={BOUNDARY_RING_BOTTOM}
          height={boundaryStepHeight(kind) - BOUNDARY_RING_BOTTOM}
          testID={`${testID}-rail-tail`}
        />
      ) : null}
      <RailRing centerX={railCenterX} centerY={BOUNDARY_RING_CENTER_Y} testID={`${testID}-rail-ring`} />
    </>
  );
}

const styles = StyleSheet.create({
  segment: {
    position: "absolute",
    width: RAIL_WIDTH,
    backgroundColor: RAIL_COLOR,
  },
  ring: {
    position: "absolute",
    width: RAIL_RING_BOX,
    height: RAIL_RING_BOX,
    borderRadius: RAIL_RING_BOX / 2,
    borderWidth: RAIL_RING_STROKE,
    borderColor: RAIL_COLOR,
    backgroundColor: colors.background,
  },
  dot: {
    position: "absolute",
    width: RAIL_DOT_DIAMETER,
    height: RAIL_DOT_DIAMETER,
    borderRadius: RAIL_DOT_DIAMETER / 2,
    backgroundColor: RAIL_COLOR,
  },
  boundary: {
    flexDirection: "row",
    alignItems: "center",
    gap: BOUNDARY_LABEL_GAP,
  },
  boundaryLabel: {
    ...type.label,
    flex: 1,
    color: colors.textLabel,
  },
  valuePill: {
    backgroundColor: colors.surface,
    borderRadius: fixedRadii[10],
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[4],
  },
  valueText: {
    ...type.editableValue,
    color: colors.primary,
  },
});
