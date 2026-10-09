import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ActionSheetIOS, Alert, Platform } from "react-native";

import type { DraftMediaItem } from "@/domain/media/ActivityMedia";
import type { ImportItem, PickedMedia } from "@/domain/media/ActivityMediaImportService";
import { ActivityMediaList } from "@/features/activities/ActivityMediaList";

/**
 * PRE-3 (P3-23, D-335) — rendu et actions de la liste ordonnée des médias.
 * L'import réel (copie, erreurs, réessai) est prouvé par
 * `ActivityMediaImportService.test.ts` et `LocalMediaStore.test.ts` ; la
 * persistance de l'ordre par les suites SQLite. Correction revue 1 : D-335
 * prévoit un MENU par média (Retirer / Monter / Descendre) — feuille
 * d'actions native iOS, alerte ailleurs, mêmes actions pour VoiceOver.
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

afterEach(() => {
  jest.restoreAllMocks();
});

describe("ActivityMediaList — PRE-3", () => {
  it("INTERACTION/media-list — ajout depuis la photothèque, import visible, Réessayer local sans doublon ; menu par média Retirer/Monter/Descendre ; ordre rendu = ordre du brouillon", () => {
    const failed: ImportItem = { key: "k2", state: "FAILED", picked, error: "COPY_FAILED" };
    const importing: ImportItem = { key: "k1", state: "IMPORTING", picked };
    const props = renderList({ pending: [importing, failed] });

    expect(screen.getByTestId("media-item-1-image").props.source).toEqual([
      expect.objectContaining({ uri: "file:///documents/kodjo-media/a.jpg" }),
    ]);
    expect(screen.getByText("Vidéo")).toBeTruthy();
    expect(screen.getByText("Importation…")).toBeTruthy();
    expect(screen.getByTestId("media-pending-2-error").props.children).toBe("Import impossible.");
    expect(screen.queryByTestId("media-pending-1-retry")).toBeNull();
    fireEvent.press(screen.getByTestId("media-pending-2-retry"));
    expect(props.onRetry).toHaveBeenCalledWith(failed);

    fireEvent.press(screen.getByTestId("media-add"));
    expect(props.onAdd).toHaveBeenCalledTimes(1);

    // Aucune commande dessinée sur la galerie : le menu natif porte les actions.
    expect(screen.queryByTestId("media-item-1-remove")).toBeNull();
    const sheet = jest.spyOn(ActionSheetIOS, "showActionSheetWithOptions").mockImplementation((options, callback) => {
      expect(options.options).toEqual(["Retirer", "Descendre", "Annuler"]);
      expect(options.title).toBe("Photo 1 sur 2");
      callback(1);
    });
    jest.replaceProperty(Platform, "OS", "ios");
    fireEvent.press(screen.getByTestId("media-item-1"));
    expect(sheet).toHaveBeenCalledTimes(1);
    expect(props.onMove).toHaveBeenCalledWith(0, 1);

    jest.replaceProperty(Platform, "OS", "android");
    const alert = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      expect(buttons!.map((button) => button.text)).toEqual(["Retirer", "Monter", "Annuler"]);
      buttons![0]!.onPress!();
    });
    fireEvent.press(screen.getByTestId("media-item-2"));
    expect(alert).toHaveBeenCalledTimes(1);
    expect(props.onRemove).toHaveBeenCalledWith(1);

    // Refus d'accès définitif : message et accès aux réglages ; aucun ajout implicite.
    renderList({ notice: "PERMISSION_DENIED_FINAL" });
    expect(screen.getByText("Accès à la photothèque refusé.")).toBeTruthy();
    expect(screen.getByTestId("media-open-settings")).toBeTruthy();
  });

  it("ACCESSIBILITY/media-list — chaque média identifié par type et rang ; actions nommées pour CE média, bornes exclues ; erreur annoncée ; Réessayer sur le seul élément échoué", () => {
    const props = renderList({ pending: [{ key: "k", state: "FAILED", picked, error: "STORAGE_FULL" }] });
    const first = screen.getByTestId("media-item-1");
    expect(first.props.accessibilityLabel).toBe("Photo 1 sur 2");
    expect(first.props.accessibilityHint).toBe("Ouvre les actions Retirer, Monter et Descendre");
    expect(first.props.accessibilityActions).toEqual([
      { name: "remove", label: "Retirer Photo 1 sur 2" },
      { name: "moveDown", label: "Descendre Photo 1 sur 2" },
    ]);
    expect(screen.getByTestId("media-item-2").props.accessibilityActions).toEqual([
      { name: "remove", label: "Retirer Vidéo 2 sur 2" },
      { name: "moveUp", label: "Monter Vidéo 2 sur 2" },
    ]);
    fireEvent(screen.getByTestId("media-item-2"), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    expect(props.onMove).toHaveBeenCalledWith(1, 0);
    fireEvent(first, "accessibilityAction", { nativeEvent: { actionName: "remove" } });
    expect(props.onRemove).toHaveBeenCalledWith(0);
    expect(screen.getByTestId("media-pending-1-error").props.accessibilityLiveRegion).toBe("polite");
    expect(screen.getByTestId("media-pending-1-retry").props.accessibilityLabel).toBe("Réessayer l’import de Photo 3 sur 3");
    expect(screen.getByTestId("media-add").props.accessibilityLabel).toBe("Ajouter des photos ou vidéos");
  });
});
