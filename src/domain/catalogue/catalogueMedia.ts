import type { Movement } from "@/domain/activities/Movement";
import type { DraftMediaItem } from "@/domain/media/ActivityMedia";

import { cyrb53, type CatalogueSheet } from "./MovementCatalogueFile";

/**
 * Médias d'une fiche de catalogue enregistrés comme médias du Mouvement (décision de Hermann du 19/11/2026) :
 * « Je n'ai jamais exprimé le besoin d'avoir les médias d'une part et la photo d'autre part. Dans mon esprit c'était
 * toujours la même chose. » Un Mouvement n'a qu'une liste de médias, affichée partout (fiche, Catalogue, Formats).
 *
 * - À l'installation et à chaque mise à jour acceptée, les photos intégrées de la fiche dont les droits sont confirmés
 *   deviennent des médias du Mouvement (fichier interne `kodjo-media/`, comme une photo importée sur le téléphone).
 * - Une mise à jour remplace les médias venus de la fiche ; les autres médias du Mouvement sont conservés après eux.
 * - L'identité de l'asset dérive du contenu : réinstaller ou recevoir la même photo réutilise le même fichier.
 */

/** Préfixe des assets venus d'une fiche de catalogue (jamais produit par l'import du téléphone, qui utilise un UUID). */
export const CATALOGUE_MEDIA_ASSET_PREFIX = "catalogue-";

const EMBEDDED_PHOTO = /^data:(image\/(?:jpeg|webp|png));base64,([A-Za-z0-9+/=]+)$/;
const EXTENSIONS: Readonly<Record<string, string>> = { "image/jpeg": ".jpg", "image/webp": ".webp", "image/png": ".png" };

/** Photo de fiche à enregistrer comme fichier interne. */
export type CatalogueMediaFile = {
  readonly assetId: string;
  readonly mimeType: string;
  readonly extension: string;
  readonly fileName: string | null;
  readonly base64: string;
};

/** Photos de la fiche à reprendre comme médias du Mouvement, dans l'ordre de la fiche. */
export function catalogueMediaFiles(catalogueId: string, sheet: CatalogueSheet): readonly CatalogueMediaFile[] {
  const files: CatalogueMediaFile[] = [];
  for (const media of sheet.media) {
    if (media.kind !== "PHOTO" || media.storage !== "EMBEDDED" || media.rightsStatus !== "PERMISSION_CONFIRMED") continue;
    const match = EMBEDDED_PHOTO.exec(media.url);
    if (!match) continue;
    const mimeType = match[1] as string;
    const base64 = match[2] as string;
    files.push({
      assetId: CATALOGUE_MEDIA_ASSET_PREFIX + cyrb53([catalogueId, sheet.sheetId, media.id, base64].join("|")),
      mimeType,
      extension: EXTENSIONS[mimeType] ?? ".jpg",
      fileName: typeof media.fileName === "string" && media.fileName.length > 0 ? media.fileName : null,
      base64,
    });
  }
  return files;
}

export function isCatalogueMediaAsset(assetId: string): boolean {
  return assetId.startsWith(CATALOGUE_MEDIA_ASSET_PREFIX);
}

/** Médias de la fiche en tête, puis les médias du Mouvement qui ne viennent pas d'une fiche. */
export function withCatalogueMedia(movement: Movement, catalogueMedia: readonly DraftMediaItem[]): Movement {
  const kept = movement.media.filter((item) => !isCatalogueMediaAsset(item.assetId));
  return { ...movement, media: [...catalogueMedia, ...kept] };
}

/** Mêmes médias, dans le même ordre (identités d'asset). */
export function sameMediaLinks(a: Movement, b: Movement): boolean {
  return a.media.length === b.media.length && a.media.every((item, index) => item.assetId === b.media[index]?.assetId);
}
