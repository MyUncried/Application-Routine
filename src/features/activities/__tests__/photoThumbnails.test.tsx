import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react-native";
import { Image } from "expo-image";
import { View } from "react-native";

/**
 * Recette iPhone du 19/11/2026 : la vignette d'une photo est une miniature réduite (`THUMBNAIL_MAX_PIXELS`), chargée une
 * fois et gardée en mémoire ; place réservée pendant le premier chargement ; photo d'origine si la miniature échoue.
 * Module réel (le simulacre global de `jest.setup.js` est écarté ici).
 */
jest.unmock("@/features/activities/photoThumbnails");
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const thumbnails = jest.requireActual("@/features/activities/photoThumbnails") as typeof import("@/features/activities/photoThumbnails");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MediaPreview } = require("@/features/activities/MediaPreview") as typeof import("@/features/activities/MediaPreview");

const URI = "file:///docs/kodjo-media/catalogue-abc.webp";
const native = { width: 288, height: 236 } as never;
/** `expo-image` présente sa source sous forme de liste. */
const shown = () => {
  const source = screen.getByTestId("photo").props.source as unknown;
  return Array.isArray(source) ? source[0] : source;
};

beforeEach(() => thumbnails.resetPhotoThumbnailsForTests());
afterEach(() => {
  jest.restoreAllMocks();
});

const preview = (uri = URI) => (
  <View>
    <MediaPreview uri={uri} isVideo={false} imageStyle={{ width: 64, height: 64 }} fallbackStyle={{ width: 64, height: 64 }} imageTestID="photo" fallbackTestID="placeholder" />
  </View>
);

describe("miniatures de photos en mémoire", () => {
  it("premier affichage : place réservée, puis miniature réduite ; affichage suivant immédiat, un seul chargement", async () => {
    const loadAsync = jest.spyOn(Image, "loadAsync").mockResolvedValue(native);
    const first = render(preview());
    expect(screen.getByTestId("placeholder")).toBeTruthy();
    await act(async () => {});
    expect(shown()).toBe(native);
    expect(loadAsync).toHaveBeenCalledWith({ uri: URI }, { maxWidth: thumbnails.THUMBNAIL_MAX_PIXELS, maxHeight: thumbnails.THUMBNAIL_MAX_PIXELS });
    first.unmount();
    render(preview());
    expect(shown()).toBe(native);
    expect(loadAsync).toHaveBeenCalledTimes(1);
  });

  it("miniature impossible : photo d'origine, comme avant", async () => {
    jest.spyOn(Image, "loadAsync").mockRejectedValue(new Error("illisible"));
    render(preview());
    await act(async () => {});
    expect(shown()).toEqual({ uri: URI });
  });

  it("préchargement : la vignette montée ensuite s'affiche sans place réservée", async () => {
    const loadAsync = jest.spyOn(Image, "loadAsync").mockResolvedValue(native);
    thumbnails.preloadPhotoThumbnails([URI, URI]);
    await act(async () => {});
    render(preview());
    expect(shown()).toBe(native);
    expect(loadAsync).toHaveBeenCalledTimes(1);
  });
});
