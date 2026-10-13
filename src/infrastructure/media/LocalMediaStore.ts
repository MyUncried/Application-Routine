import { Directory, File, Paths } from "expo-file-system";

import type { MediaCopyPort, PickedMedia } from "../../domain/media/ActivityMediaImportService";
import { INTERNAL_MEDIA_URI_PREFIX, isInternalMediaUri } from "../../domain/media/MediaAsset";

/**
 * PRE-3 (D-333) — copies internes STABLES des médias importés.
 *
 * L'URI renvoyée par le sélecteur est en cache et non persistante : chaque
 * média est copié sous `<documents>/kodjo-media/<assetId><ext>`. La base ne
 * stocke que l'URI RELATIVE (`kodjo-media/...`) ; l'URI absolue est
 * recalculée à l'affichage (le conteneur iOS peut changer entre installations).
 *
 * Aucune suppression d'un fichier référencé : `deletePrepared` refuse toute
 * URI hors du répertoire interne, et l'appelant ne lui transmet que les
 * préparations éligibles calculées par `MediaDraftLeases`.
 */

/** Port du système de fichiers, injecté pour tester avec de vrais fichiers temporaires. */
export interface MediaFileSystem {
  /** Racine persistante (URI ou chemin), sans séparateur final. */
  documentRoot(): string;
  join(root: string, relative: string): string;
  ensureDirectory(path: string): void;
  copy(sourceUri: string, destinationPath: string): Promise<void>;
  exists(path: string): boolean;
  size(path: string): number | null;
  delete(path: string): void;
  availableBytes(): number | null;
}

const MIME_EXTENSIONS: Readonly<Record<string, string>> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "video/quicktime": ".mov",
  "video/mp4": ".mp4",
  "video/3gpp": ".3gp",
  "video/webm": ".webm",
};

/** Extension du fichier source conservée telle quelle (aucune conversion). */
export function mediaExtension(picked: Pick<PickedMedia, "fileName" | "uri" | "mimeType" | "kind">): string {
  for (const candidate of [picked.fileName, picked.uri]) {
    const match = candidate ? /(\.[a-z0-9]{1,8})$/i.exec(candidate.split(/[?#]/)[0]!) : null;
    if (match) {
      return match[1]!.toLowerCase();
    }
  }
  if (picked.mimeType && MIME_EXTENSIONS[picked.mimeType]) {
    return MIME_EXTENSIONS[picked.mimeType]!;
  }
  return picked.kind === "VIDEO" ? ".mov" : ".jpg";
}

export class LocalMediaStore implements MediaCopyPort {
  constructor(private readonly fileSystem: MediaFileSystem) {}

  private absolute(relativeUri: string): string {
    return this.fileSystem.join(this.fileSystem.documentRoot(), relativeUri);
  }

  /** URI absolue d'affichage pour une URI relative interne (les URI déjà absolues sont laissées telles quelles). */
  resolveUri(uri: string): string {
    return isInternalMediaUri(uri) ? this.absolute(uri) : uri;
  }

  availableBytes(): number | null {
    try {
      return this.fileSystem.availableBytes();
    } catch {
      return null;
    }
  }

  async copyToInternal(source: PickedMedia, assetId: string): Promise<{ readonly uri: string; readonly sizeBytes: number | null }> {
    const relative = `${INTERNAL_MEDIA_URI_PREFIX}${assetId}${mediaExtension(source)}`;
    const destination = this.absolute(relative);
    this.fileSystem.ensureDirectory(this.absolute(INTERNAL_MEDIA_URI_PREFIX.replace(/\/$/, "")));
    // Réessai après une copie partielle : la clé est stable et la préparation
    // n'est jamais référencée tant que la copie n'a pas réussi.
    if (this.fileSystem.exists(destination)) {
      this.fileSystem.delete(destination);
    }
    try {
      await this.fileSystem.copy(source.uri, destination);
    } catch (error) {
      if (this.fileSystem.exists(destination)) {
        this.fileSystem.delete(destination);
      }
      throw error;
    }
    return { uri: relative, sizeBytes: this.fileSystem.size(destination) };
  }

  async deletePrepared(uri: string): Promise<void> {
    if (!isInternalMediaUri(uri) || uri.includes("..")) {
      throw new Error(`Suppression refusée hors du stockage interne : ${uri}`);
    }
    const path = this.absolute(uri);
    if (this.fileSystem.exists(path)) {
      this.fileSystem.delete(path);
    }
  }

  fileExists(uri: string): boolean {
    try {
      return this.fileSystem.exists(this.resolveUri(uri));
    } catch {
      return false;
    }
  }
}

/** Adaptateur Expo SDK 57 (`File`, `Directory`, `Paths`). */
export function createExpoMediaFileSystem(): MediaFileSystem {
  return {
    documentRoot: () => Paths.document.uri.replace(/\/$/, ""),
    join: (root, relative) => `${root}/${relative}`,
    ensureDirectory: (path) => new Directory(path).create({ intermediates: true, idempotent: true }),
    copy: (sourceUri, destinationPath) => new File(sourceUri).copy(new File(destinationPath)),
    exists: (path) => new File(path).exists,
    size: (path) => new File(path).size,
    delete: (path) => new File(path).delete(),
    availableBytes: () => Paths.availableDiskSpace,
  };
}

let defaultStore: LocalMediaStore | null = null;

export function getLocalMediaStore(): LocalMediaStore {
  defaultStore ??= new LocalMediaStore(createExpoMediaFileSystem());
  return defaultStore;
}
