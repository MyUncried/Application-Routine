import type { VideoThumbnail } from "expo-video";

/**
 * PRE-3 (D-333, P3-23/video-thumbnail) — affiche d'une vidéo enregistrée,
 * RÉGÉNÉRÉE à chaque ouverture avec l'API expo-video SDK 57 vérifiée :
 * `createVideoPlayer(source)` puis `player.generateThumbnailsAsync(times,
 * { maxWidth, maxHeight })`, qui retourne des `VideoThumbnail`
 * (`SharedRef<'image'>`) utilisables comme source d'`expo-image`.
 *
 * - Aucun objet natif ni URI factice n'est persisté : l'affiche vit en
 *   mémoire du composant et est libérée (`release()`) à sa fermeture.
 * - Le lecteur est créé muet, jamais lancé (`play()` n'est jamais appelé),
 *   puis libéré immédiatement après la génération — la documentation SDK 57
 *   impose d'appeler `release()` sur un lecteur créé par `createVideoPlayer`.
 * - Aucune lecture, aucun audio, aucune lecture d'exécution (hors PRE-3).
 */

/** Sous-ensemble du lecteur SDK 57 utilisé ici (injectable pour les tests). */
export type PosterPlayer = {
  muted: boolean;
  generateThumbnailsAsync(times: number | number[], options?: { maxWidth?: number; maxHeight?: number }): Promise<readonly PosterImage[]>;
  release(): void;
};

/** Référence native d'image (`VideoThumbnail`), jamais sérialisée. */
export type PosterImage = Pick<VideoThumbnail, "width" | "height" | "release">;

export type PosterPlayerFactory = (uri: string) => PosterPlayer;

export const POSTER_MAX_SIZE = 256;

/**
 * Module natif chargé à la première affiche seulement : l'éditeur reste
 * importable sans le module natif expo-video (tests, plateformes sans vidéo).
 */
const expoPlayerFactory: PosterPlayerFactory = (uri) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createVideoPlayer } = require("expo-video") as typeof import("expo-video");
  return createVideoPlayer(uri) as unknown as PosterPlayer;
};

export type VideoPosterHandle = {
  readonly image: PosterImage;
  /** Libère la référence native de l'affiche (fermeture de l'écran). */
  release(): void;
};

/**
 * Génère l'affiche de la première image ; `null` si la vidéo est illisible
 * (l'élément reste affiché avec son type, sans erreur bloquante).
 */
export async function generateVideoPoster(
  uri: string,
  createPlayer: PosterPlayerFactory = expoPlayerFactory,
): Promise<VideoPosterHandle | null> {
  let player: PosterPlayer | null = null;
  try {
    player = createPlayer(uri);
    player.muted = true;
    const [image] = await player.generateThumbnailsAsync(0, { maxWidth: POSTER_MAX_SIZE, maxHeight: POSTER_MAX_SIZE });
    if (!image) {
      return null;
    }
    let released = false;
    return {
      image,
      release: () => {
        if (!released) {
          released = true;
          image.release();
        }
      },
    };
  } catch {
    return null;
  } finally {
    player?.release();
  }
}
