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
      status: "readyToPlay" as const,
      addListener: jest.fn(() => ({ remove: jest.fn() })),
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
      status: "readyToPlay",
      addListener: () => ({ remove: () => undefined }),
      generateThumbnailsAsync: async () => {
        throw new Error("unreadable");
      },
      release: jest.fn(),
    };
    expect(await generateVideoPoster("kodjo-media/broken.mov", () => failing)).toBeNull();
    expect(failing.release).toHaveBeenCalledTimes(1);
  });
});

/**
 * Recette 1 (M-01) — vignette grise permanente : sur iOS, la source d'un
 * lecteur créé par `createVideoPlayer` est chargée de façon asynchrone et
 * `generateThumbnailsAsync` renvoie `[]` SANS ERREUR tant que l'élément
 * courant n'est pas installé (expo-video 57.0.5, VideoModule.swift). Le faux
 * lecteur ci-dessous reproduit ce contrat natif.
 */
describe("VideoPoster — recette 1 (M-01)", () => {
  type Status = PosterPlayer["status"];
  function nativeLikePlayer(initial: Status) {
    let status: Status = initial;
    let listener: ((payload: { status: Status }) => void) | null = null;
    const remove = jest.fn(() => {
      listener = null;
    });
    const image = { width: 256, height: 144, release: jest.fn() };
    const player = {
      muted: false,
      get status() {
        return status;
      },
      addListener: jest.fn((_event: "statusChange", next: (payload: { status: Status }) => void) => {
        listener = next;
        return { remove };
      }),
      generateThumbnailsAsync: jest.fn(async () => (status === "readyToPlay" ? [image] : [])),
      release: jest.fn(),
    };
    const emit = (next: Status) => {
      status = next;
      listener?.({ status: next });
    };
    return { player, emit, image, remove };
  }

  it("M-01 — source encore en chargement : l'affiche est générée après readyToPlay (jamais sur un élément absent), abonnement retiré, lecteur libéré", async () => {
    const { player, emit, image, remove } = nativeLikePlayer("loading");
    const pending = generateVideoPoster("file:///documents/kodjo-media/v2.mov", () => player);
    await Promise.resolve();
    expect(player.generateThumbnailsAsync).not.toHaveBeenCalled();
    emit("readyToPlay");
    const handle = await pending;
    expect(handle?.image).toBe(image);
    expect(player.generateThumbnailsAsync).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(player.release).toHaveBeenCalledTimes(1);
  });

  it("M-01 — vidéo illisible (error) ou délai dépassé : aucune affiche, aucune génération, lecteur libéré", async () => {
    const failing = nativeLikePlayer("loading");
    const pending = generateVideoPoster("kodjo-media/broken.mov", () => failing.player);
    await Promise.resolve();
    failing.emit("error");
    expect(await pending).toBeNull();
    expect(failing.player.generateThumbnailsAsync).not.toHaveBeenCalled();
    expect(failing.player.release).toHaveBeenCalledTimes(1);

    jest.useFakeTimers();
    try {
      const stuck = nativeLikePlayer("loading");
      const waiting = generateVideoPoster("kodjo-media/slow.mov", () => stuck.player, 50);
      await Promise.resolve();
      jest.advanceTimersByTime(50);
      expect(await waiting).toBeNull();
      expect(stuck.remove).toHaveBeenCalledTimes(1);
      expect(stuck.player.release).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
