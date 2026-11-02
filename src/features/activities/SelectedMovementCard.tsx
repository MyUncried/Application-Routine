import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { decodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { strings } from "@/shared/i18n";

import { MediaPreview, firstMediaPreviewSource, useMediaUriResolver } from "./MediaPreview";
import { fillTemplate } from "./movementChoicePresentation";

/**
 * PRE-9 C.3 — « Carte — Mouvement sélectionné » (référence Formats du 02/11/2026 §16.2, Design system —
 * Fondations) : 370 × 52, photo de 44, nom, Niveau et description sur une ligne ; aucune croix — la
 * suppression se fait par glissement vers la gauche dans les récapitulatifs (variantes Suppression =
 * Possible | Bloquée), les résultats de saisie ne se glissent pas (Suppression = Aucune). Constantes
 * locales (\`tokens.ts\` inchangé).
 */
const CARD_HEIGHT = 52;
const PHOTO = 44;
const INSET = 4;
const BORDER_COLOR = "#E3E5EB";
const SURFACE = "#F9FAFC";
const NAME_COLOR = "#14171C";
const DESCRIPTION_COLOR = "#5C636E";
const LEVEL_COLOR = "#0508E5";
const PHOTO_FILL = "#DEE2EC";

export function SelectedMovementCard({
  movement,
  levelRank,
  suffix,
  onPress,
  testID,
}: {
  readonly movement: Movement;
  readonly levelRank: number | null;
  /** Mention ajoutée au nom (ex. : « (buy-in) »). */
  readonly suffix?: string;
  readonly onPress?: () => void;
  readonly testID: string;
}) {
  const resolveUri = useMediaUriResolver();
  const preview = firstMediaPreviewSource(movement.media);
  const description = decodeInstructionSteps(movement.description).join(" ");
  const level = levelRank === null ? null : fillTemplate(strings.screens.activities.editor.movementSuggestion.level, { rank: String(levelRank) });
  const summary = [`${movement.name}${suffix ?? ""}`, level, description].filter((part) => part !== null && part.length > 0).join(", ");
  const body = (
    <>
      <View style={styles.photo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {preview ? <MediaPreview uri={resolveUri(preview.uri)} isVideo={preview.isVideo} imageStyle={styles.photoFill} fallbackStyle={styles.photoFill} imageTestID={`${testID}-photo`} fallbackTestID={`${testID}-photo-fallback`} /> : null}
      </View>
      <View style={styles.texts}>
        <View style={styles.firstLine}>
          <Text style={styles.name} numberOfLines={1}>
            {movement.name}
            {suffix ?? ""}
          </Text>
          {level !== null ? <Text style={styles.level}>{level}</Text> : null}
        </View>
        {description.length > 0 ? (
          <Text style={styles.description} numberOfLines={1}>
            {description}
          </Text>
        ) : null}
      </View>
    </>
  );
  return onPress !== undefined ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={summary} style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]} testID={testID}>
      {body}
    </Pressable>
  ) : (
    <View style={styles.card} accessible accessibilityLabel={summary} testID={testID}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: CARD_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: INSET,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: SURFACE,
    shadowColor: "#1A1A26",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  pressed: { opacity: 0.7 },
  photo: { width: PHOTO, height: PHOTO, borderRadius: 8, overflow: "hidden", backgroundColor: PHOTO_FILL },
  photoFill: { width: PHOTO, height: PHOTO },
  texts: { flex: 1, paddingRight: 8, gap: 2 },
  firstLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 15, color: NAME_COLOR },
  level: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 12, color: LEVEL_COLOR },
  description: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 12, color: DESCRIPTION_COLOR },
});
