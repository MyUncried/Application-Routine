import { describe, expect, it, jest } from "@jest/globals";

import { generateVideoPoster, POSTER_MAX_SIZE, type PosterPlayer } from "@/infrastructure/media/VideoPoster";

const mockCreateVideoPlayer = jest.fn();
jest.mock("expo-video", () => ({ createVideoPlayer: (source: unknown) => mockCreateVideoPlayer(source) }));

/**
 * PRE-3 (P3-23/video-thumbnail) — contrat d'usage de l'API expo-video SDK 57
 * (`createVideoPlayer` → `generateThumbnailsAsync` → `release`). Le rendu de
 * l'affiche sur appareil reste une vérification séparée (procédure device).
 */
describe("VideoPoster — PRE-3", () => {
  it("P3-23/video-thumbnail — affiche régénérée via l'API vérifiée, lecteur muet jamais lancé et libéré, référence native jamais persistée puis libérée", async () => {
    const image = { width: 256, height: 144, release: jest.fn() };
    const play = jest.fn();
    const player = {
      muted: false,
      play,
      generateThumbnailsAsync: jest.fn(async () => [image]),
      release: jest.fn(),
    };
    mockCreateVideoPlayer.mockReturnValue(player);

    const handle = await generateVideoPoster("file:///documents/kodjo-media/v1.mov");

    expect(mockCreateVideoPlayer).toHaveBeenCalledWith("file:///documents/kodjo-media/v1.mov");
    expect(player.generateThumbnailsAsync).toHaveBeenCalledWith(0, { maxWidth: POSTER_MAX_SIZE, maxHeight: POSTER_MAX_SIZE });
    expect(player.muted).toBe(true);
    expect(play).not.toHaveBeenCalled();
    expect(player.release).toHaveBeenCalledTimes(1);
    expect(handle?.image).toBe(image);
    // Aucune URI factice : la seule sortie est la référence native en mémoire.
    expect(JSON.stringify(handle)).not.toMatch(/file:|kodjo-media/);
    handle!.release();
    handle!.release();
    expect(image.release).toHaveBeenCalledTimes(1);

    // Réouverture : nouvelle génération (aucun cache persisté) ; vidéo illisible → null, lecteur libéré.
    const failing: PosterPlayer = {
      muted: false,
      generateThumbnailsAsync: async () => {
        throw new Error("unreadable");
      },
      release: jest.fn(),
    };
    expect(await generateVideoPoster("kodjo-media/broken.mov", () => failing)).toBeNull();
    expect(failing.release).toHaveBeenCalledTimes(1);
  });
});
