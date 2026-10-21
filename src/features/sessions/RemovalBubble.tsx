import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { focusOnNextFrame } from "@/features/sessions/deferredAccessibilityFocus";
import type { AnchorRect } from "@/features/sessions/measureAnchor";
import { StopPointSymbol } from "@/features/sessions/StopPointChip";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, spacing } from "@/shared/ui/tokens";

/** Bulle (Figma `8328:29267`, `8328:33831`) : pilule `danger`, rayon 12, marges 12 / 8, intervalle 8. */
const BUBBLE = { radius: 12, paddingHorizontal: spacing[12], paddingVertical: spacing[8], gap: spacing[8] } as const;
/** Libellé : Inter Medium 12 blanc, interligne Auto (Figma `8328:29268`, `8328:33835`). */
const BUBBLE_TEXT = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 12, lineHeight: 15 } as const;
/** Hauteur de la bulle : texte 15 + marges 8 + 8 (Figma : 31). */
export const REMOVAL_BUBBLE_HEIGHT = BUBBLE_TEXT.lineHeight + 2 * BUBBLE.paddingVertical;
/** Marge minimale entre la bulle et les bords de l'écran. */
const SCREEN_MARGIN = spacing[8];

/** Rectangle d'ancrage en coordonnées de fenêtre (`measureAnchor`). */
export type RemovalBubbleAnchor = AnchorRect;

export type RemovalBubbleKind = "RECOVERY" | "STOP_POINT";

export type RemovalBubbleProps = {
  readonly kind: RemovalBubbleKind;
  /** Élément touché, mesuré (la bulle n'est montée qu'une fois la mesure connue et non vide). */
  readonly anchor: RemovalBubbleAnchor;
  readonly onRemove: () => void;
  /** Toucher hors de la bulle, retour système, geste d'échappement VoiceOver : fermeture sans mutation. */
  readonly onDismiss: () => void;
  readonly testID?: string;
};

/**
 * Bulle contextuelle « Retirer » (PRE-6 story 4.2, ch13 : « Il ne s'agit pas de modales de
 * confirmation », ch10 L631 : aucun second dialogue) — « Retirer la récupération » (sablier,
 * `8328:29133`) ou « Retirer le point d'arrêt » (symbole ❚❚, `8328:33689`), juste au-dessus de
 * l'élément touché (dessous s'il manque la place en haut) : alignée à gauche sur la récupération
 * (sablier sur sablier), à droite sur la puce du point, toujours maintenue dans l'écran. Choisir Retirer exécute le retrait ; tout toucher ailleurs ferme sans mutation.
 *
 * Rendue dans une `Modal` transparente (coordonnées de fenêtre, cible tactile complète sur
 * Android, où un toucher hors des limites du parent n'atteint pas l'enfant) : le voile invisible
 * capte le premier toucher hors bulle, si bien qu'aucun défilement, glisser de carte ou autre
 * contrôle ne peut s'ouvrir tant qu'elle est affichée — une seule bulle à la fois.
 */
export function RemovalBubble({ kind, anchor, onRemove, onDismiss, testID = "composition-removal-bubble" }: RemovalBubbleProps) {
  const t = strings.screens.composition.pauses;
  const label = kind === "RECOVERY" ? t.removeRecovery : t.removeStopPoint;
  const windowSize = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bubbleRef = useRef<View>(null);
  // Largeur rendue de la bulle, nécessaire à son ancrage à droite et au maintien dans l'écran ;
  // la bulle reste invisible tant qu'elle n'est pas connue (aucune première image mal placée).
  const [bubbleWidth, setBubbleWidth] = useState<number | null>(null);
  // À l'ouverture, le focus d'accessibilité est porté sur la bulle, à l'image suivante (montage
  // de la `Modal`).
  useEffect(() => focusOnNextFrame(() => bubbleRef.current), []);

  const width = bubbleWidth ?? 0;
  // Sablier de la bulle (12 du bord) aligné sur celui de la ligne ; bord droit sur la puce du point.
  const desiredLeft = kind === "RECOVERY" ? anchor.x - BUBBLE.paddingHorizontal : anchor.x + anchor.width - width;
  const left = Math.max(SCREEN_MARGIN, Math.min(desiredLeft, windowSize.width - SCREEN_MARGIN - width));
  // Au-dessus de l'élément ; sous lui s'il n'y a pas la place sous la zone protégée du haut.
  const fitsAbove = anchor.y - REMOVAL_BUBBLE_HEIGHT >= insets.top + SCREEN_MARGIN;
  const top = fitsAbove ? anchor.y - REMOVAL_BUBBLE_HEIGHT : anchor.y + anchor.height;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onDismiss} testID={testID}>
      <Pressable onPress={onDismiss} accessible={false} style={StyleSheet.absoluteFill} testID={`${testID}-backdrop`} />
      <Pressable
        ref={bubbleRef}
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={label}
        onAccessibilityEscape={onDismiss}
        onLayout={(event) => {
          const measured = event.nativeEvent.layout.width;
          setBubbleWidth((current) => (current === measured ? current : measured));
        }}
        style={[styles.bubble, { left, top }, bubbleWidth === null ? styles.unmeasured : null]}
        testID={`${testID}-remove`}
      >
        {kind === "RECOVERY" ? (
          <KodjoIcon name="remove-recovery" testID={`${testID}-icon`} />
        ) : (
          <StopPointSymbol color={colors.background} />
        )}
        <Text style={styles.text} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: BUBBLE.gap,
    height: REMOVAL_BUBBLE_HEIGHT,
    paddingHorizontal: BUBBLE.paddingHorizontal,
    paddingVertical: BUBBLE.paddingVertical,
    borderRadius: BUBBLE.radius,
    backgroundColor: colors.danger,
    overflow: "hidden",
  },
  unmeasured: {
    opacity: 0,
  },
  text: {
    ...BUBBLE_TEXT,
    color: colors.background,
  },
});
