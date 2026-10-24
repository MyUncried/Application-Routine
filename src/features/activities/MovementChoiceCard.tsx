import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fixedRadii } from "@/shared/ui/tokens";

import type { MovementChoice } from "./ActivityDefinitionService";
import { MediaPreview, firstMediaPreviewSource, useMediaUriResolver } from "./MediaPreview";
import { formatMovementChoiceSubtitle } from "./movementChoicePresentation";

/**
 * Valeurs relevées en lecture seule (MCP, 24/10) : carte du geste proposé `9882:19128` (fond
 * `#F3F4F9`, sans liseré) et cartes de résultat `9959:19705` (fond blanc, liseré 1 `#E4E7EF`) —
 * 354 × 72 (hauteur minimale ici : le texte agrandi grandit), rayon 12 ; gabarit photo 48, rayon
 * 10, `#DEE2EC`, à 12 du bord ; nom Semi Bold 16 `#141414` ; sous-titre Regular 13 `#7A7A80`.
 * Constantes locales : `tokens.ts` inchangé.
 */
const CARD_MIN_HEIGHT = 72;
const THUMBNAIL = 48;
const THUMBNAIL_RADIUS = 10;
const THUMBNAIL_FILL = "#DEE2EC";
const SUMMARY_FILL = "#F3F4F9";
const RESULT_BORDER = "#E4E7EF";
const SECONDARY_TEXT = "#7A7A80";

export type MovementChoiceCardProps = {
  readonly choice: MovementChoice;
  /** `summary` : geste proposé par la suggestion (non touchable) ; `result` : résultat de recherche. */
  readonly variant: "summary" | "result";
  readonly onPress?: () => void;
  readonly testID: string;
};

/**
 * PRE-7 (A2.3, MFN-06 ; `9882:19049`, `9959:19623`) — carte d'un geste : vignette du premier
 * média (`MediaPreview`, rendu du Catalogue), à défaut le gabarit gris ; nom ; sous-titre calculé
 * (`formatMovementChoiceSubtitle`). Le nom accessible porte le nom et le sous-titre.
 */
export function MovementChoiceCard({ choice, variant, onPress, testID }: MovementChoiceCardProps) {
  const resolveUri = useMediaUriResolver();
  const subtitle = formatMovementChoiceSubtitle(choice);
  const preview = firstMediaPreviewSource(choice.movement.media);
  const label = subtitle ? `${choice.movement.name}, ${subtitle}` : choice.movement.name;
  const content = (
    <>
      <View
        style={styles.thumbnail}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID={`${testID}-thumbnail`}
      >
        {preview ? (
          <MediaPreview
            uri={resolveUri(preview.uri)}
            isVideo={preview.isVideo}
            imageStyle={styles.thumbnailFill}
            fallbackStyle={styles.thumbnailFill}
            imageTestID={`${testID}-thumbnail-image`}
            fallbackTestID={`${testID}-thumbnail-fallback`}
          />
        ) : null}
      </View>
      <View style={styles.texts}>
        <Text style={styles.name} testID={`${testID}-name`}>
          {choice.movement.name}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} testID={`${testID}-subtitle`}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </>
  );
  if (variant === "summary" || onPress === undefined) {
    return (
      <View style={[styles.card, styles.summary]} accessible accessibilityLabel={label} testID={testID}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.card, styles.result]}
      testID={testID}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: CARD_MIN_HEIGHT,
    borderRadius: fixedRadii[12],
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    overflow: "hidden",
  },
  summary: {
    backgroundColor: SUMMARY_FILL,
  },
  result: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: RESULT_BORDER,
    paddingHorizontal: 11,
    paddingVertical: 11,
  },
  thumbnail: {
    width: THUMBNAIL,
    height: THUMBNAIL,
    borderRadius: THUMBNAIL_RADIUS,
    backgroundColor: THUMBNAIL_FILL,
    overflow: "hidden",
  },
  thumbnailFill: {
    width: THUMBNAIL,
    height: THUMBNAIL,
    backgroundColor: THUMBNAIL_FILL,
  },
  texts: {
    flex: 1,
    gap: 5,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    fontSize: 13,
    lineHeight: 16,
    color: SECONDARY_TEXT,
  },
});
