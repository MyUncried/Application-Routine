import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fixedRadii, spacing, type } from "@/shared/ui/tokens";

/**
 * Séquence de la Composition (PRE-6 story 2.1, AD-41, Figma `8328:28634`) :
 * rail vertical à gauche, un repère par étape, bornes « Compte à rebours
 * initial » et « Fin de séance » avec pastille de valeur modifiable.
 *
 * Géométrie Figma : colonne des repères de 16 de large, écart 10 avec le
 * contenu (étapes à x 26) ; rail de 2 à x 7 ; repères centrés sur x 8.
 * Les repères sont posés en position ABSOLUE dans le contenu de chaque étape
 * (`left` négatif) : aucune enveloppe supplémentaire ne change le repère des
 * mesures `onLayout` dont dépend la résolution d'une dépose
 * (`compositionGesture.ts`).
 */

/**
 * Couleur `color/text-tertiary` de Figma (`#7A7A80`) — aucun jeton dans `tokens.ts` : constante
 * unique de la Composition (durée de séance de l'en-tête, ligne de récupération).
 */
export const TEXT_TERTIARY = "#7A7A80";

/** Largeur de la colonne des repères (Figma `8328:28637`). */
const MARKER_COLUMN_WIDTH = 16;
/** Décalage horizontal du contenu des étapes par rapport au rail (Figma : x 26). */
export const SEQUENCE_CONTENT_OFFSET = MARKER_COLUMN_WIDTH + spacing[10];

/** Rail (Figma `8328:28635`) : largeur 2, à x 7, couleur `color/border`. */
const RAIL = { width: 2, left: 7 } as const;

/**
 * Repères (Figma `8328:28638`, `8328:28644`) : anneau de 10 au contour
 * extérieur gris de 2 (fond blanc), ou point plein de 8 cerclé d'un halo
 * blanc de 3 — l'un et l'autre occupent une boîte de 14 centrée sur le rail.
 */
const MARKER_BOX = 14;
const RING_STROKE = 2;
const DOT_HALO = 3;

/** Hauteur d'une borne (Figma `8328:28636`) ; le rail court du centre de la première à celui de la dernière. */
export const BOUNDARY_STEP_HEIGHT = 24;

/** Cible tactile de la pastille de valeur (hauteur minimale 44, zones tactiles Figma). */
const VALUE_TOUCH_TARGET = 44;

export type SequenceMarkerKind = "ring" | "dot";

/**
 * Rail vertical de la Séquence. À placer en premier enfant du contenu
 * défilant, dont `left` est le bord gauche de la colonne des repères ;
 * `top`/`bottom` placent ses extrémités au centre des deux bornes.
 */
export function SequenceRail({ left, top, bottom }: { left: number; top: number; bottom: number }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.rail, { left: left + RAIL.left, top, bottom }]}
      testID="composition-sequence-rail"
    />
  );
}

/**
 * Repère d'une étape, posé dans le CONTENU de l'étape : `centerY` est la
 * position verticale de son centre dans ce contenu ; `contentLeft` le
 * décalage horizontal du contenu par rapport au rail (par défaut
 * `SEQUENCE_CONTENT_OFFSET`).
 */
export function SequenceMarker({
  kind,
  centerY,
  contentLeft = SEQUENCE_CONTENT_OFFSET,
  translateY = 0,
  testID,
}: {
  kind: SequenceMarkerKind;
  centerY: number;
  contentLeft?: number;
  /** Décalage vertical (carte soulevée qui suit le doigt) ; jamais horizontal : le rail ne glisse pas. */
  translateY?: number;
  testID?: string;
}) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.marker,
        kind === "ring" ? styles.markerRing : styles.markerDot,
        {
          left: -contentLeft + (MARKER_COLUMN_WIDTH - MARKER_BOX) / 2,
          top: centerY - MARKER_BOX / 2,
          transform: [{ translateY }],
        },
      ]}
      testID={testID ?? `composition-sequence-marker-${kind}`}
    />
  );
}

/** Centre vertical du repère d'une borne (rangée de 24). */
export const BOUNDARY_MARKER_CENTER_Y = BOUNDARY_STEP_HEIGHT / 2;
/** Centre vertical du point d'une occurrence (Figma `8328:28644` : y 20, diamètre 8). */
export const OCCURRENCE_MARKER_CENTER_Y = 24;
/** Centre vertical de l'anneau du Circuit (Figma `8328:28665` : y 22, diamètre 10). */
export const CIRCUIT_MARKER_CENTER_Y = 27;

/**
 * Borne de la Séquence (Compte à rebours initial, Fin de séance — Figma
 * `8328:28636`, `8328:28723`) : libellé Inter Medium 14 (`text-label`) et
 * pastille de valeur modifiable à droite (`DSF / Forms / Valeur modifiable`,
 * `6944:26423`, Texte=13 : fond `surface`, rayon 10, marges 10 / 4, Inter
 * Semi Bold 13 `primary`). Le toucher de la rangée entière (libellé et
 * pastille) ouvre la roulette existante (CE-T03-08) ; les bornes restent immobiles (RM-030, RM-031).
 */
export function BoundaryStep({
  label,
  value,
  isOpen,
  onPress,
  testID,
}: {
  label: string;
  value: string;
  isOpen: boolean;
  onPress: () => void;
  testID?: string;
}) {
  // Toute la rangée (libellé + pastille) ouvre la roulette, comme l'ancienne carte limite
  // (acquis conservé) ; la cible tactile atteint 44 de haut par `hitSlop`.
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={{ text: value }}
      accessibilityState={{ expanded: isOpen }}
      hitSlop={{
        top: (VALUE_TOUCH_TARGET - BOUNDARY_STEP_HEIGHT) / 2,
        bottom: (VALUE_TOUCH_TARGET - BOUNDARY_STEP_HEIGHT) / 2,
      }}
      style={styles.boundary}
      testID={testID}
    >
      <SequenceMarker kind="ring" centerY={BOUNDARY_MARKER_CENTER_Y} />
      <Text style={styles.boundaryLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.valuePill} testID={testID === undefined ? undefined : `${testID}-value`}>
        <Text style={styles.valueText}>{value}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: "absolute",
    width: RAIL.width,
    backgroundColor: colors.border,
  },
  marker: {
    position: "absolute",
    width: MARKER_BOX,
    height: MARKER_BOX,
    borderRadius: MARKER_BOX / 2,
  },
  markerRing: {
    borderWidth: RING_STROKE,
    borderColor: colors.disabled,
    backgroundColor: colors.background,
  },
  markerDot: {
    borderWidth: DOT_HALO,
    borderColor: colors.background,
    backgroundColor: colors.disabled,
  },
  boundary: {
    height: BOUNDARY_STEP_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
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
