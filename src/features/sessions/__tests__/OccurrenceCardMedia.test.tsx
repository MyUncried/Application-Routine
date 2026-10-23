import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { clearCatalogueVideoCovers } from "@/features/activities/catalogueVideoCover";
import { firstMediaPreviewSource, type MediaPreviewSource } from "@/features/activities/MediaPreview";
import { OccurrenceCard } from "@/features/sessions/OccurrenceCard";

/**
 * PRE-6 story 5.1b (AC1, AC2 ; D3 remplacé par Hermann le 21/10/2026) : premier média de
 * l'occurrence dans le gabarit 64 × 64 de la carte v2, par le mécanisme de la vignette du Catalogue.
 *
 * La vidéo passe par le VRAI générateur d'affiche (`generateVideoPoster`) : seule la fabrique du
 * lecteur `expo-video` est remplacée (comme dans `VideoPoster.test.ts`), pour vérifier le lecteur
 * muet, jamais lancé, libéré aussitôt.
 */
const mockCreateVideoPlayer = jest.fn<(source: unknown) => unknown>();
jest.mock("expo-video", () => ({ createVideoPlayer: (source: unknown) => mockCreateVideoPlayer(source) }));

const hidden = { includeHiddenElements: true } as const;

function fakePlayer(thumbnails: readonly unknown[]) {
  return {
    muted: false,
    status: "readyToPlay" as const,
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    play: jest.fn(),
    replace: jest.fn(),
    generateThumbnailsAsync: jest.fn(async () => thumbnails),
    release: jest.fn(),
  };
}

function renderCard(
  media: MediaPreviewSource | null,
  options: { attenuated?: boolean; resolve?: (uri: string) => string } = {},
) {
  const service = { resolveMediaUri: options.resolve ?? ((uri: string) => `file:///documents/${uri}`) };
  return render(
    <ActivityDefinitionServiceContext.Provider value={service as unknown as ActivityDefinitionService}>
      <OccurrenceCard
        name="Squat assisté"
        category={null}
        bodyZones={null}
        summary="10 rép."
        estimatedDuration={null}
        hasSideChange={false}
        bordered
        recovery={null}
        attenuated={options.attenuated}
        media={media}
      />
    </ActivityDefinitionServiceContext.Provider>,
  );
}

const photo: MediaPreviewSource = { uri: "kodjo-media/p1.jpg", isVideo: false };
const video: MediaPreviewSource = { uri: "kodjo-media/v1.mov", isVideo: true };

describe("OccurrenceCard — photo ou affiche vidéo dans le gabarit (PRE-6 story 5.1b)", () => {
  beforeEach(async () => {
    await clearCatalogueVideoCovers();
    mockCreateVideoPlayer.mockReset();
  });
  afterEach(async () => {
    await clearCatalogueVideoCovers();
  });

  it("firstMediaPreviewSource: first media in gallery order, photo or video; null without media", () => {
    expect(firstMediaPreviewSource(undefined)).toBeNull();
    expect(firstMediaPreviewSource([])).toBeNull();
    expect(
      firstMediaPreviewSource([
        { asset: { uri: "kodjo-media/v1.mov", kind: "VIDEO" } },
        { asset: { uri: "kodjo-media/p1.jpg", kind: "PHOTO" } },
      ]),
    ).toEqual({ uri: "kodjo-media/v1.mov", isVideo: true });
    // Revue 5.1b : sans `kind`, le type MIME décide (`video/*`) ; sans l'un ni l'autre, photo.
    expect(firstMediaPreviewSource([{ asset: { uri: "a.mov", kind: null, mimeType: "video/quicktime" } }])).toEqual({ uri: "a.mov", isVideo: true });
    expect(firstMediaPreviewSource([{ asset: { uri: "a.mp4", mimeType: "VIDEO/MP4" } }])).toEqual({ uri: "a.mp4", isVideo: true });
    expect(firstMediaPreviewSource([{ asset: { uri: "a.jpg", kind: null, mimeType: "image/jpeg" } }])).toEqual({ uri: "a.jpg", isVideo: false });
    expect(firstMediaPreviewSource([{ asset: { uri: "a.jpg", kind: null } }])).toEqual({ uri: "a.jpg", isVideo: false });
    // `kind` présent : il l'emporte sur le type MIME.
    expect(firstMediaPreviewSource([{ asset: { uri: "a", kind: "PHOTO", mimeType: "video/mp4" } }])).toEqual({ uri: "a", isVideo: false });
  });

  it("photo: fills the 64 template (border, radius and fill kept), cover crop, resolved URI, no own accessibility label (the card's name is the alternative text), no generic icon", () => {
    renderCard(photo);
    const media = screen.getByTestId("composition-exercise-media", hidden);
    expect(StyleSheet.flatten(media.props.style)).toMatchObject({
      width: 64,
      height: 64,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#7A7A80",
      backgroundColor: "#EEF0F6",
      overflow: "hidden",
    });
    const image = within(media).getByTestId("composition-exercise-media-image", hidden);
    expect(image.props.source).toEqual([expect.objectContaining({ uri: "file:///documents/kodjo-media/p1.jpg" })]);
    expect(image.props.contentFit).toBe("cover");
    expect(StyleSheet.flatten(image.props.style)).toMatchObject({ width: "100%", height: "100%", borderRadius: 11 });
    // Pas d'arrêt d'accessibilité en double ni de libellé mort : la carte porte le nom.
    expect(image.props.accessible).toBe(false);
    expect(image.props.accessibilityLabel).toBeUndefined();
    expect(within(media).queryByTestId("composition-exercise-media-icon", hidden)).toBeNull();
    expect(within(media).queryByTestId("composition-exercise-media-placeholder", hidden)).toBeNull();
  });

  // Revue 5.1b : un média définitivement indisponible montre l'icône générique, pas un fond vide.
  it("photo error: the generic icon replaces the image (never an empty template)", () => {
    renderCard(photo);
    fireEvent(screen.getByTestId("composition-exercise-media-image", hidden), "error", { nativeEvent: { error: "introuvable" } });
    expect(screen.queryByTestId("composition-exercise-media-image", hidden)).toBeNull();
    expect(screen.queryByTestId("composition-exercise-media-placeholder", hidden)).toBeNull();
    expect(screen.getByTestId("composition-exercise-media-icon", hidden)).toBeTruthy();
  });

  it("photo error then another URI then back: each URI loads again (the failure is reset when the URI changes)", () => {
    const view = renderCard(photo);
    fireEvent(screen.getByTestId("composition-exercise-media-image", hidden), "error", { nativeEvent: { error: "introuvable" } });
    expect(screen.getByTestId("composition-exercise-media-icon", hidden)).toBeTruthy();
    const other = { uri: "kodjo-media/p2.jpg", isVideo: false };
    const element = (source: MediaPreviewSource) => (
      <ActivityDefinitionServiceContext.Provider
        value={{ resolveMediaUri: (uri: string) => `file:///documents/${uri}` } as unknown as ActivityDefinitionService}
      >
        <OccurrenceCard
          name="Squat assisté"
          category={null}
          bodyZones={null}
          summary="10 rép."
          estimatedDuration={null}
          hasSideChange={false}
          bordered
          recovery={null}
          media={source}
        />
      </ActivityDefinitionServiceContext.Provider>
    );
    view.rerender(element(other));
    expect(screen.getByTestId("composition-exercise-media-image", hidden).props.source).toEqual([
      expect.objectContaining({ uri: "file:///documents/kodjo-media/p2.jpg" }),
    ]);
    view.rerender(element(photo));
    expect(screen.getByTestId("composition-exercise-media-image", hidden).props.source).toEqual([
      expect.objectContaining({ uri: "file:///documents/kodjo-media/p1.jpg" }),
    ]);
  });

  it("a resolver that throws: the stored URI is used as is", () => {
    renderCard(photo, {
      resolve: () => {
        throw new Error("stockage indisponible");
      },
    });
    expect(screen.getByTestId("composition-exercise-media-image", hidden).props.source).toEqual([
      expect.objectContaining({ uri: "kodjo-media/p1.jpg" }),
    ]);
  });

  it("video: reserved place while the poster is generated, then the poster image; muted player, never played, released; nothing persisted", async () => {
    const poster = { width: 256, height: 144, release: jest.fn() };
    const player = fakePlayer([poster]);
    mockCreateVideoPlayer.mockReturnValue(player);
    renderCard(video);
    expect(screen.getByTestId("composition-exercise-media-placeholder", hidden)).toBeTruthy();
    const image = await screen.findByTestId("composition-exercise-media-image", hidden);
    expect(mockCreateVideoPlayer).toHaveBeenCalledWith("file:///documents/kodjo-media/v1.mov");
    expect(player.muted).toBe(true);
    expect(player.play).not.toHaveBeenCalled();
    expect(player.release).toHaveBeenCalledTimes(1);
    expect(image.props.source[0]).toBe(poster);
    expect(image.props.contentFit).toBe("cover");
    expect(image.props.accessible).toBe(false);
    expect(screen.queryByTestId("composition-exercise-media-placeholder", hidden)).toBeNull();
  });

  // Revue 5.1b : place réservée pendant la génération seulement ; vidéo sans affiche → icône générique.
  it("video without poster (unreadable): the generic icon once the generation has failed, never an empty template", async () => {
    const player = fakePlayer([]);
    mockCreateVideoPlayer.mockReturnValue(player);
    renderCard(video);
    await waitFor(() => expect(player.release).toHaveBeenCalledTimes(1));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByTestId("composition-exercise-media-placeholder", hidden)).toBeNull();
    expect(screen.queryByTestId("composition-exercise-media-image", hidden)).toBeNull();
    expect(screen.getByTestId("composition-exercise-media-icon", hidden)).toBeTruthy();
  });

  it("video poster already generated (remount): the poster is rendered at once, no placeholder", async () => {
    const poster = { width: 256, height: 144, release: jest.fn() };
    mockCreateVideoPlayer.mockReturnValue(fakePlayer([poster]));
    const first = renderCard(video);
    await screen.findByTestId("composition-exercise-media-image", hidden);
    first.unmount();
    renderCard(video);
    expect(screen.getByTestId("composition-exercise-media-image", hidden).props.source[0]).toBe(poster);
    expect(screen.queryByTestId("composition-exercise-media-placeholder", hidden)).toBeNull();
    expect(mockCreateVideoPlayer).toHaveBeenCalledTimes(1);
  });

  it("without media: the generic icon, no image", () => {
    renderCard(null);
    const media = screen.getByTestId("composition-exercise-media", hidden);
    expect(within(media).getByTestId("composition-exercise-media-icon", hidden)).toBeTruthy();
    expect(within(media).queryByTestId("composition-exercise-media-image", hidden)).toBeNull();
    expect(mockCreateVideoPlayer).not.toHaveBeenCalled();
  });

  it("no service (or partial service): the stored URI is used as is, never an exception", () => {
    render(
      <OccurrenceCard
        name="Squat assisté"
        category={null}
        bodyZones={null}
        summary="10 rép."
        estimatedDuration={null}
        hasSideChange={false}
        bordered={false}
        recovery={null}
        media={photo}
      />,
    );
    expect(screen.getByTestId("composition-exercise-media-image", hidden).props.source).toEqual([
      expect.objectContaining({ uri: "kodjo-media/p1.jpg" }),
    ]);
  });

  it("placement (arbitrage D6): the media is greyed with the rest of the card", () => {
    renderCard(photo, { attenuated: true });
    const media = screen.getByTestId("composition-exercise-media", hidden);
    expect(StyleSheet.flatten(media.props.style).opacity).toBe(0.45);
    expect(within(media).getByTestId("composition-exercise-media-image", hidden)).toBeTruthy();
  });

  it("the template is no touch target of its own (no responder, no press handler)", () => {
    renderCard(photo);
    const media = screen.getByTestId("composition-exercise-media", hidden);
    for (const node of [media, ...media.findAll(() => true)]) {
      expect(node.props.onPress).toBeUndefined();
      expect(node.props.onLongPress).toBeUndefined();
      expect(node.props.onStartShouldSetResponder).toBeUndefined();
    }
  });
});
