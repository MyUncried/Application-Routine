import { Directory, File, Paths } from "expo-file-system";

import type { CatalogueMediaFile } from "../../domain/catalogue/catalogueMedia";
import type { DraftMediaItem } from "../../domain/media/ActivityMedia";
import { INTERNAL_MEDIA_URI_PREFIX } from "../../domain/media/MediaAsset";

/**
 * Photos d'une fiche de catalogue écrites comme fichiers internes (`kodjo-media/<assetId><ext>`), au même endroit et
 * sous la même forme qu'une photo importée sur le téléphone (`LocalMediaStore`) : la base ne stocke que l'URI relative.
 * Un fichier déjà présent (même contenu, même identité) n'est pas réécrit.
 */

/** Port du système de fichiers, injecté pour tester avec de vrais fichiers temporaires. */
export interface CatalogueMediaFileSystem {
  documentRoot(): string;
  join(root: string, relative: string): string;
  ensureDirectory(path: string): void;
  exists(path: string): boolean;
  size(path: string): number | null;
  writeBase64(path: string, base64: string): void;
  delete(path: string): void;
}

export type CatalogueMediaWriter = (files: readonly CatalogueMediaFile[]) => Promise<readonly DraftMediaItem[]>;

export function createCatalogueMediaWriter(fileSystem: CatalogueMediaFileSystem, now: () => string): CatalogueMediaWriter {
  return async (files) => {
    if (files.length === 0) return [];
    const root = fileSystem.documentRoot();
    fileSystem.ensureDirectory(fileSystem.join(root, INTERNAL_MEDIA_URI_PREFIX.replace(/\/$/, "")));
    const items: DraftMediaItem[] = [];
    for (const file of files) {
      const relative = `${INTERNAL_MEDIA_URI_PREFIX}${file.assetId}${file.extension}`;
      const absolute = fileSystem.join(root, relative);
      if (!fileSystem.exists(absolute)) {
        try {
          fileSystem.writeBase64(absolute, file.base64);
        } catch (error) {
          if (fileSystem.exists(absolute)) fileSystem.delete(absolute);
          throw error;
        }
      }
      items.push({
        assetId: file.assetId,
        asset: {
          id: file.assetId,
          uri: relative,
          createdAt: now(),
          kind: "PHOTO",
          mimeType: file.mimeType,
          fileName: file.fileName,
          sizeBytes: fileSystem.size(absolute),
          view: file.view,
        },
      });
    }
    return items;
  };
}

/** Adaptateur Expo SDK 57 (`File.write` en base64, `Directory`, `Paths`). */
export function createExpoCatalogueMediaFileSystem(): CatalogueMediaFileSystem {
  return {
    documentRoot: () => Paths.document.uri.replace(/\/$/, ""),
    join: (root, relative) => `${root}/${relative}`,
    ensureDirectory: (path) => new Directory(path).create({ intermediates: true, idempotent: true }),
    exists: (path) => new File(path).exists,
    size: (path) => new File(path).size,
    writeBase64: (path, base64) => new File(path).write(base64, { encoding: "base64" }),
    delete: (path) => new File(path).delete(),
  };
}

let defaultWriter: CatalogueMediaWriter | null = null;

export function getCatalogueMediaWriter(): CatalogueMediaWriter {
  defaultWriter ??= createCatalogueMediaWriter(createExpoCatalogueMediaFileSystem(), () => new Date().toISOString());
  return defaultWriter;
}
