import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import type { DraftMediaItem } from "@/domain/media/ActivityMedia";
import type { ImportItem, PickedMedia } from "@/domain/media/ActivityMediaImportService";
import { ActivityMediaList } from "@/features/activities/ActivityMediaList";

/**
 * PRE-3 (P3-23, D-335) — rendu et actions de la liste ordonnée des médias.
 * L'import réel (copie, erreurs, réessai) est prouvé par
 * `ActivityMediaImportService.test.ts` et `LocalMediaStore.test.ts` ; la
 * persistance de l'ordre par les suites SQLite.
 */
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const photo = (id: string): DraftMediaItem => ({
  assetId: id,
  asset: { id, uri: `kodjo-media/${id}.jpg`, createdAt: "now", kind: "PHOTO" },
});
const video = (id: string): DraftMediaItem => ({
  assetId: id,
  asset: { id, uri: `kodjo-media/${id}.mov`, createdAt: "now", kind: "VIDEO", durationMs: 1000 },
});
const picked: PickedMedia = {
  uri: "file:///cache/c.jpg",
  kind: "PHOTO",
  mimeType: "image/jpeg",
  fileName: null,
  sizeBytes: 1,
  durationMs: null,
  width: 1,
  height: 1,
  nativeAssetId: null,
};

function renderList(overrides: Partial<React.ComponentProps<typeof ActivityMediaList>> = {}) {
  const props = {
    media: [photo("a"), video("b")],
    pending: [] as readonly ImportItem[],
    notice: null,
    canImport: true,
    resolveUri: (uri: string) => `file:///documents/${uri}`,
    onAdd: jest.fn(),
    onRemove: jest.fn(),
    onMove: jest.fn(),
    onRetry: jest.fn(),
    ...overrides,
  };
  render(<ActivityMediaList {...props} />);
  return props;
}

describe("ActivityMediaList — PRE-3", () => {
  it("INTERACTION/media-list — ajout depuis la photothèque, import visible, Réessayer local sans doublon, Retirer/Monter/Descendre ; ordre rendu = ordre du brouillon", () => {
    const failed: ImportItem = { key: "k2", state: "FAILED", picked, error: "COPY_FAILED" };
    const importing: ImportItem = { key: "k1", state: "IMPORTING", picked };
    const props = renderList({ pending: [importing, failed] });

    expect(screen.getByTestId("media-item-1-image").props.source).toEqual([
      expect.objectContaining({ uri: "file:///documents/kodjo-media/a.jpg" }),
    ]);
    expect(screen.getByText("Vidéo")).toBeTruthy();
    expect(screen.getByText("Importation…")).toBeTruthy();
    expect(screen.getByTestId("media-pending-2-error").props.children).toBe("Import impossible.");
    // Seul l'élément échoué porte Réessayer ; l'élément en cours n'en a pas.
    expect(screen.queryByTestId("media-pending-1-retry")).toBeNull();
    fireEvent.press(screen.getByTestId("media-pending-2-retry"));
    expect(props.onRetry).toHaveBeenCalledWith(failed);

    fireEvent.press(screen.getByTestId("media-add"));
    expect(props.onAdd).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByTestId("media-item-2-up"));
    expect(props.onMove).toHaveBeenCalledWith(1, 0);
    fireEvent.press(screen.getByTestId("media-item-1-down"));
    expect(props.onMove).toHaveBeenCalledWith(0, 1);
    fireEvent.press(screen.getByTestId("media-item-1-remove"));
    expect(props.onRemove).toHaveBeenCalledWith(0);

    // Refus d'accès définitif : message et accès aux réglages ; aucun ajout implicite.
    renderList({ notice: "PERMISSION_DENIED_FINAL" });
    expect(screen.getByText("Accès à la photothèque refusé.")).toBeTruthy();
    expect(screen.getByTestId("media-open-settings")).toBeTruthy();
  });

  it("ACCESSIBILITY/media-list — chaque média identifié par type et rang ; actions nommées pour ce média ; bornes inactives ; erreur annoncée", () => {
    renderList({ pending: [{ key: "k", state: "FAILED", picked, error: "STORAGE_FULL" }] });
    expect(screen.getByLabelText("Photo 1 sur 2")).toBeTruthy();
    expect(screen.getByLabelText("Vidéo 2 sur 2")).toBeTruthy();
    expect(screen.getByTestId("media-item-1-up").props.accessibilityLabel).toBe("Monter Photo 1 sur 2");
    expect(screen.getByTestId("media-item-1-up").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("media-item-2-down").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("media-item-2-remove").props.accessibilityLabel).toBe("Retirer Vidéo 2 sur 2");
    expect(screen.getByTestId("media-pending-1-error").props.accessibilityLiveRegion).toBe("polite");
    expect(screen.getByTestId("media-pending-1-retry").props.accessibilityLabel).toBe("Réessayer l’import de Photo 3 sur 3");
    expect(screen.getByTestId("media-add").props.accessibilityLabel).toBe("Ajouter des photos ou vidéos");
  });
});
