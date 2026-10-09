import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import type { MediaPickerPort, PickedMedia, PickOutcome } from "../../domain/media/ActivityMediaImportService";

/**
 * PRE-3 (D-334/D-335) — acquisition depuis la PHOTOTHÈQUE uniquement
 * (expo-image-picker SDK 57, API vérifiée dans les types installés et la
 * documentation versionnée v57.0.0) :
 *
 * - `launchImageLibraryAsync` seul — jamais `launchCameraAsync`, jamais de
 *   permission caméra ou micro ;
 * - photos et vidéos, sélection multiple ordonnée, sans plafond produit
 *   (`selectionLimit: 0`) ni édition/recadrage ;
 * - `preferredAssetRepresentationMode: Current` : aucune conversion
 *   systématique du format d'origine ;
 * - iOS : la documentation impose une demande MANUELLE d'accès à la
 *   photothèque pour les vidéos lorsque `allowsEditing` est faux ; un accès
 *   LIMITÉ est accepté ; un refus est rendu actionnable (réglages) ;
 * - Android : un résultat en attente (`getPendingResultAsync`) est lu une
 *   seule fois par le service d'import.
 */

type PickerAsset = ImagePicker.ImagePickerAsset;

function toKind(type: PickerAsset["type"], mimeType: string | undefined): PickedMedia["kind"] {
  if (type === "video" || type === "pairedVideo" || mimeType?.startsWith("video/")) {
    return "VIDEO";
  }
  if (type === "image" || type === "livePhoto" || mimeType?.startsWith("image/")) {
    return "PHOTO";
  }
  return null;
}

const positiveOrNull = (value: number | null | undefined): number | null =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : null;

/** Conversion d'un asset natif ; `fileName`/`assetId` nuls ne sont jamais fatals. */
export function toPickedMedia(asset: PickerAsset): PickedMedia {
  const kind = toKind(asset.type, asset.mimeType);
  return {
    uri: asset.uri,
    kind,
    mimeType: asset.mimeType ?? null,
    fileName: asset.fileName ?? null,
    sizeBytes: positiveOrNull(asset.fileSize),
    // SDK 57 : `duration` est exprimée en millisecondes.
    durationMs: kind === "VIDEO" ? positiveOrNull(asset.duration) : null,
    width: positiveOrNull(asset.width),
    height: positiveOrNull(asset.height),
    nativeAssetId: asset.assetId ?? null,
  };
}

export const PHOTO_LIBRARY_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images", "videos"],
  allowsMultipleSelection: true,
  selectionLimit: 0,
  orderedSelection: true,
  allowsEditing: false,
  preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
  shouldDownloadFromNetwork: false,
  legacy: false,
};

function toOutcome(
  result: ImagePicker.ImagePickerResult | ImagePicker.ImagePickerErrorResult,
  limitedAccess: boolean,
): PickOutcome {
  if ("code" in result) {
    return { status: "ERROR" };
  }
  if (result.canceled || !result.assets || result.assets.length === 0) {
    return { status: "CANCELED" };
  }
  return { status: "PICKED", items: result.assets.map(toPickedMedia), limitedAccess };
}

export class PhotoLibraryPicker implements MediaPickerPort {
  async pickFromLibrary(): Promise<PickOutcome> {
    let limitedAccess = false;
    try {
      if (Platform.OS === "ios") {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted && permission.accessPrivileges !== "limited") {
          return { status: "PERMISSION_DENIED", canAskAgain: permission.canAskAgain };
        }
        limitedAccess = permission.accessPrivileges === "limited";
      }
      const result = await ImagePicker.launchImageLibraryAsync(PHOTO_LIBRARY_OPTIONS);
      return toOutcome(result, limitedAccess);
    } catch (error) {
      console.error("La photothèque n'a pas pu être ouverte.", error);
      return { status: "ERROR" };
    }
  }

  async consumePendingResult(): Promise<PickOutcome | null> {
    if (Platform.OS !== "android") {
      return null;
    }
    try {
      const pending = await ImagePicker.getPendingResultAsync();
      return pending ? toOutcome(pending, false) : null;
    } catch {
      return null;
    }
  }
}
