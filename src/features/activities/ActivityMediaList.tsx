import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { DraftMediaItem } from "@/domain/media/ActivityMedia";
import type { ImportItem } from "@/domain/media/ActivityMediaImportService";
import { generateVideoPoster, type VideoPosterHandle } from "@/infrastructure/media/VideoPoster";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-3 (D-333/D-334/D-335, P3-23) — médias ORDONNÉS de l'Exercice dans
 * l'éditeur : aperçus de la galerie (`Media / Gallery`), tuile d'ajout
 * depuis la photothèque, éléments en cours d'importation ou en erreur
 * locale avec Réessayer, et commandes accessibles Retirer / Monter /
 * Descendre (alternative au glisser). Composant contrôlé : l'ordre de
 * `media` est celui du brouillon parent ; aucune écriture SQLite ici.
 */
export type MediaNotice = "PERMISSION_DENIED" | "PERMISSION_DENIED_FINAL" | "LIMITED" | "ERROR" | null;

export type ActivityMediaListProps = {
  readonly media: readonly DraftMediaItem[];
  /** Imports en cours ou en échec — affichés après les médias prêts, dans l'ordre de sélection. */
  readonly pending: readonly ImportItem[];
  readonly notice: MediaNotice;
  readonly canImport: boolean;
  readonly resolveUri: (uri: string) => string;
  readonly onAdd: () => void;
  readonly onRemove: (index: number) => void;
  readonly onMove: (from: number, to: number) => void;
  readonly onRetry: (item: ImportItem) => void;
};

const m = strings.executionParameters.media;

function itemLabel(kind: DraftMediaItem["asset"]["kind"], rank: number, total: number): string {
  return m.item
    .replace("{type}", kind === "VIDEO" ? m.video : m.photo)
    .replace("{rank}", String(rank))
    .replace("{total}", String(total));
}

export function ActivityMediaList({
  media,
  pending,
  notice,
  canImport,
  resolveUri,
  onAdd,
  onRemove,
  onMove,
  onRetry,
}: ActivityMediaListProps) {
  const total = media.length;
  const visiblePending = pending.filter((item) => item.state !== "READY");
  return (
    <View style={styles.container} testID="media-list">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gallery}
        style={styles.galleryFrame}
        accessibilityLabel={m.section}
        testID="media-gallery"
      >
        {media.map((item, index) => {
          const label = itemLabel(item.asset.kind, index + 1, total);
          return (
            <View key={item.assetId} style={styles.tile} testID={`media-item-${index + 1}`}>
              <View style={styles.preview} accessible accessibilityRole="image" accessibilityLabel={label}>
                {item.asset.kind === "VIDEO" ? (
                  <VideoPreview uri={resolveUri(item.asset.uri)} />
                ) : (
                  <Image
                    source={{ uri: resolveUri(item.asset.uri) }}
                    style={styles.image}
                    contentFit="cover"
                    accessible={false}
                    testID={`media-item-${index + 1}-image`}
                  />
                )}
                {item.asset.kind === "VIDEO" ? (
                  <Text style={styles.kindBadge}>{m.video}</Text>
                ) : null}
              </View>
              <View style={styles.actions}>
                <MediaAction
                  label={m.moveUp.replace("{item}", label)}
                  icon="control-chevron-up"
                  disabled={index === 0}
                  onPress={() => onMove(index, index - 1)}
                  testID={`media-item-${index + 1}-up`}
                />
                <MediaAction
                  label={m.moveDown.replace("{item}", label)}
                  icon="control-chevron-down"
                  disabled={index === total - 1}
                  onPress={() => onMove(index, index + 1)}
                  testID={`media-item-${index + 1}-down`}
                />
                <Pressable
                  onPress={() => onRemove(index)}
                  accessibilityRole="button"
                  accessibilityLabel={m.remove.replace("{item}", label)}
                  hitSlop={8}
                  style={styles.removeAction}
                  testID={`media-item-${index + 1}-remove`}
                >
                  <Text style={styles.removeLabel}>{m.remove.replace(" {item}", "")}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {visiblePending.map((item, index) => {
          const label = itemLabel(item.picked.kind, total + index + 1, total + visiblePending.length);
          return (
            <View key={item.key} style={styles.tile} testID={`media-pending-${index + 1}`}>
              <View style={[styles.preview, styles.previewPending]} accessible accessibilityLabel={label}>
                {item.state === "IMPORTING" ? (
                  <>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={styles.pendingText} accessibilityLiveRegion="polite">
                      {m.importing}
                    </Text>
                  </>
                ) : item.state === "FAILED" ? (
                  <>
                    <Text style={styles.errorText} accessibilityLiveRegion="polite" testID={`media-pending-${index + 1}-error`}>
                      {m.errors[item.error]}
                    </Text>
                    <Pressable
                      onPress={() => onRetry(item)}
                      accessibilityRole="button"
                      accessibilityLabel={m.retryAccessibilityLabel.replace("{item}", label)}
                      style={styles.retryAction}
                      testID={`media-pending-${index + 1}-retry`}
                    >
                      <Text style={styles.retryLabel}>{m.retry}</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            </View>
          );
        })}

        {canImport ? (
          <Pressable
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={m.add}
            style={[styles.preview, styles.addTile]}
            testID="media-add"
          >
            <KodjoIcon name="action-add" tintColor={colors.textSecondary} />
          </Pressable>
        ) : null}
      </ScrollView>

      {notice ? (
        <View style={styles.notice} accessibilityLiveRegion="polite" testID="media-notice">
          <Text style={styles.noticeText}>
            {notice === "LIMITED"
              ? m.limitedAccess
              : notice === "ERROR"
                ? m.errors.ERROR
                : m.permissionDenied}
          </Text>
          {notice === "PERMISSION_DENIED_FINAL" || notice === "LIMITED" ? (
            <Pressable
              onPress={() => {
                Linking.openSettings().catch(() => undefined);
              }}
              accessibilityRole="button"
              accessibilityLabel={m.openSettings}
              testID="media-open-settings"
            >
              <Text style={styles.retryLabel}>{m.openSettings}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function MediaAction({
  label,
  icon,
  disabled,
  onPress,
  testID,
}: {
  label: string;
  icon: "control-chevron-up" | "control-chevron-down";
  disabled: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={8}
      style={styles.iconAction}
      testID={testID}
    >
      <View style={styles.horizontalChevron}>
        <KodjoIcon name={icon} size={20} opacity={disabled ? 0.3 : 1} />
      </View>
    </Pressable>
  );
}

/**
 * Affiche régénérée à l'ouverture (expo-video SDK 57), libérée au démontage ;
 * aucune lecture ni audio. Vidéo illisible : tuile neutre avec son type.
 */
function VideoPreview({ uri }: { uri: string }) {
  const [poster, setPoster] = useState<VideoPosterHandle | null>(null);
  useEffect(() => {
    let active = true;
    let handle: VideoPosterHandle | null = null;
    generateVideoPoster(uri).then((generated) => {
      handle = generated;
      if (active) {
        setPoster(generated);
      } else {
        generated?.release();
      }
    });
    return () => {
      active = false;
      handle?.release();
    };
  }, [uri]);
  return poster ? (
    <Image source={poster.image as never} style={styles.image} contentFit="cover" accessible={false} />
  ) : (
    <View style={[styles.image, styles.videoFallback]} />
  );
}

const PREVIEW_WIDTH = 260;
const PREVIEW_HEIGHT = 213;

const styles = StyleSheet.create({
  container: {
    gap: spacing[8],
  },
  galleryFrame: {
    backgroundColor: colors.mediaSurface,
    borderRadius: fixedRadii[16],
  },
  gallery: {
    padding: spacing[8],
    gap: spacing[8],
  },
  tile: {
    width: PREVIEW_WIDTH,
    gap: spacing[4],
  },
  preview: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: fixedRadii[12],
    borderWidth: 1,
    borderColor: colors.mediaBorder,
    backgroundColor: colors.background,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  previewPending: {
    gap: spacing[8],
    padding: spacing[12],
  },
  addTile: {
    borderColor: colors.mediaBorder,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  videoFallback: {
    backgroundColor: colors.surface,
  },
  kindBadge: {
    ...type.supporting,
    position: "absolute",
    left: spacing[8],
    bottom: spacing[8],
    color: colors.background,
    backgroundColor: colors.snackbar,
    borderRadius: fixedRadii[6],
    overflow: "hidden",
    paddingHorizontal: spacing[6],
    paddingVertical: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  iconAction: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  horizontalChevron: {
    transform: [{ rotate: "-90deg" }],
  },
  removeAction: {
    marginLeft: "auto",
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing[8],
  },
  removeLabel: {
    ...type.button,
    color: colors.danger,
  },
  pendingText: {
    ...type.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...type.body,
    color: colors.danger,
    textAlign: "center",
  },
  retryAction: {
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing[12],
  },
  retryLabel: {
    ...type.button,
    color: colors.primary,
  },
  notice: {
    gap: spacing[4],
  },
  noticeText: {
    ...type.body,
    color: colors.textSecondary,
  },
});
