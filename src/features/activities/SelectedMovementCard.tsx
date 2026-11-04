import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { formatExerciseBodyZones } from "@/features/sessions/compositionPresentation";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";

import { MediaPreview, firstMediaPreviewSource, useMediaUriResolver } from "./MediaPreview";
import { fillTemplate } from "./movementChoicePresentation";
import { useBodyZonesReferential } from "./useBodyZonesReferential";

/**
 * PRE-9 C.3 — « Carte — Mouvement sélectionné » (référence Formats du 02/11/2026 §16.2, Design system —
 * Fondations) : 370 × 52, photo de 44, nom et Niveau ; aucune croix — la suppression se fait par
 * glissement vers la gauche dans les récapitulatifs (variantes Suppression = Possible | Bloquée), les
 * résultats de saisie ne se glissent pas (Suppression = Aucune). Constantes locales (`tokens.ts` inchangé).
 *
 * Mise à jour consolidée du 04/11/2026 (§5, §3 bis) : la description tronquée est remplacée par les **zones
 * corporelles**, précédées de leur pastille (12 px gris, comme les cartes de la Composition) ; un appui sur
 * la **photo** (`onPhotoPress`) ouvre la Fiche du mouvement, le reste de la carte garde son comportement.
 * Mode catalogue : carte choisie (`selected`).
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
  onPhotoPress,
  selected = false,
  testID,
}: {
  readonly movement: Movement;
  readonly levelRank: number | null;
  /** Mention ajoutée au nom (ex. : « (buy-in) »). */
  readonly suffix?: string;
  readonly onPress?: () => void;
  /** Appui sur la photo : Fiche du mouvement en consultation (§3 bis). */
  readonly onPhotoPress?: () => void;
  /** Mode catalogue : carte choisie. */
  readonly selected?: boolean;
  readonly testID: string;
}) {
  const resolveUri = useMediaUriResolver();
  const preview = firstMediaPreviewSource(movement.media);
  const zones = formatExerciseBodyZones(movement.bodyZoneIds, useBodyZonesReferential()) ?? "";
  const level = levelRank === null ? null : fillTemplate(strings.screens.activities.editor.movementSuggestion.level, { rank: String(levelRank) });
  const summary = [`${movement.name}${suffix ?? ""}`, level, zones].filter((part) => part !== null && part.length > 0).join(", ");
  const photo = preview ? (
    <MediaPreview
      uri={resolveUri(preview.uri)}
      isVideo={preview.isVideo}
      imageStyle={styles.photoFill}
      fallbackStyle={styles.photoFill}
      imageTestID={`${testID}-photo`}
      fallbackTestID={`${testID}-photo-fallback`}
    />
  ) : null;
  const body = (
    <>
      {onPhotoPress !== undefined ? (
        <Pressable
          onPress={onPhotoPress}
          accessibilityRole="button"
          accessibilityLabel={fillTemplate(strings.screens.formatModel.openMovementSheet, { name: movement.name })}
          style={styles.photo}
          testID={`${testID}-photo-press`}
        >
          {photo}
        </Pressable>
      ) : (
        <View style={styles.photo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {photo}
        </View>
      )}
      <View style={styles.texts}>
        <View style={styles.firstLine}>
          <Text style={styles.name} numberOfLines={1}>
            {movement.name}
            {suffix ?? ""}
          </Text>
          {level !== null ? <Text style={styles.level}>{level}</Text> : null}
        </View>
        {zones.length > 0 ? (
          <View style={styles.zonesLine}>
            <KodjoIcon name="card-body-zone-badge" testID={`${testID}-zones-badge`} />
            <Text style={styles.zones} numberOfLines={1} testID={`${testID}-zones`}>
              {zones}
            </Text>
          </View>
        ) : null}
      </View>
    </>
  );
  return onPress !== undefined ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={summary}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.card, selected ? styles.selected : null, pressed ? styles.pressed : null]}
      testID={testID}
    >
      {body}
    </Pressable>
  ) : (
    <View style={[styles.card, selected ? styles.selected : null]} accessible={onPhotoPress === undefined} accessibilityLabel={summary} testID={testID}>
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
  selected: { borderColor: LEVEL_COLOR },
  pressed: { opacity: 0.7 },
  photo: { width: PHOTO, height: PHOTO, borderRadius: 8, overflow: "hidden", backgroundColor: PHOTO_FILL },
  photoFill: { width: PHOTO, height: PHOTO },
  texts: { flex: 1, paddingRight: 8, gap: 2 },
  firstLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 15, color: NAME_COLOR },
  level: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 12, color: LEVEL_COLOR },
  zonesLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  zones: { flex: 1, fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 12, color: DESCRIPTION_COLOR },
});
