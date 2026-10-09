import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Platform } from "react-native";

import { moveDraftMedia } from "@/domain/media/ActivityMedia";
import {
  ActivityMediaImportService,
  readyMedia,
  type ImportItem,
  type MediaCopyPort,
  type MediaPickerPort,
  type PickedMedia,
  type PickOutcome,
} from "@/domain/media/ActivityMediaImportService";
import { MediaDraftLeases } from "@/domain/media/MediaDraftLeases";

/**
 * PRE-3 (P3-23) — orchestration de l'import : ports injectés (le sélecteur
 * natif et la copie réelle sont prouvés par `LocalMediaStore.test.ts` et
 * l'adaptateur `PhotoLibraryPicker` ci-dessous avec le module SDK simulé).
 */

const mockLaunchImageLibraryAsync = jest.fn<(options: unknown) => Promise<unknown>>();
const mockRequestMediaLibraryPermissionsAsync = jest.fn<() => Promise<unknown>>();
const mockGetPendingResultAsync = jest.fn<() => Promise<unknown>>();
const mockLaunchCameraAsync = jest.fn();
const mockRequestCameraPermissionsAsync = jest.fn();

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: (options: unknown) => mockLaunchImageLibraryAsync(options),
  requestMediaLibraryPermissionsAsync: () => mockRequestMediaLibraryPermissionsAsync(),
  getPendingResultAsync: () => mockGetPendingResultAsync(),
  launchCameraAsync: () => mockLaunchCameraAsync(),
  requestCameraPermissionsAsync: () => mockRequestCameraPermissionsAsync(),
  UIImagePickerPreferredAssetRepresentationMode: { Automatic: "automatic", Compatible: "compatible", Current: "current" },
}));


// Import après les mocks (adaptateur natif).
// eslint-disable-next-line import/first
import { PhotoLibraryPicker, PHOTO_LIBRARY_OPTIONS } from "@/infrastructure/media/PhotoLibraryPicker";

function picked(name: string, kind: PickedMedia["kind"], overrides: Partial<PickedMedia> = {}): PickedMedia {
  return {
    uri: `file:///cache/${name}`,
    kind,
    mimeType: kind === "VIDEO" ? "video/quicktime" : kind === "PHOTO" ? "image/heic" : null,
    fileName: name,
    sizeBytes: 100,
    durationMs: kind === "VIDEO" ? 4200 : null,
    width: 10,
    height: 20,
    nativeAssetId: `native-${name}`,
    ...overrides,
  };
}

class FakePicker implements MediaPickerPort {
  constructor(public outcome: PickOutcome, public pending: PickOutcome | null = null) {}
  calls = 0;
  pickFromLibrary = async () => {
    this.calls += 1;
    return this.outcome;
  };
  consumePendingResult = async () => this.pending;
}

class FakeStore implements MediaCopyPort {
  copies: string[] = [];
  failures = new Set<string>();
  available: number | null = 1_000_000;
  deleted: string[] = [];
  async copyToInternal(source: PickedMedia, assetId: string) {
    if (this.failures.has(source.uri)) {
      throw new Error("copy failed");
    }
    this.copies.push(assetId);
    return { uri: `kodjo-media/${assetId}`, sizeBytes: source.sizeBytes };
  }
  availableBytes() {
    return this.available;
  }
  async deletePrepared(uri: string) {
    this.deleted.push(uri);
  }
}

let counter = 0;
const uuid = () => `asset-${++counter}`;
const now = () => "2026-10-09T10:00:00.000Z";

beforeEach(() => {
  counter = 0;
  jest.clearAllMocks();
  jest.replaceProperty(Platform, "OS", "ios");
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("ActivityMediaImportService — PRE-3", () => {
  it("P3-23/import-multiple — photo+vidéo+photo : trois éléments prêts, ordre conservé, état Importation visible, aucune conversion ni plafond", async () => {
    const picker = new FakePicker({
      status: "PICKED",
      items: [picked("a.heic", "PHOTO"), picked("b.mov", "VIDEO"), picked("c.heic", "PHOTO", { sizeBytes: 900_000 })],
      limitedAccess: false,
    });
    const store = new FakeStore();
    const service = new ActivityMediaImportService(picker, store, uuid, now, new MediaDraftLeases());
    const progress: (readonly ImportItem[])[] = [];

    const result = await service.importFromLibrary("draft-1", (items) => progress.push(items));

    expect(progress[0]!.map((item) => item.state)).toEqual(["IMPORTING", "IMPORTING", "IMPORTING"]);
    expect(result.status).toBe("IMPORTED");
    const items = result.status === "IMPORTED" ? result.items : [];
    expect(items.map((item) => item.state)).toEqual(["READY", "READY", "READY"]);
    const ready = readyMedia(items);
    expect(ready.map((item) => [item.asset.uri, item.asset.kind, item.asset.mimeType])).toEqual([
      ["kodjo-media/asset-1", "PHOTO", "image/heic"],
      ["kodjo-media/asset-2", "VIDEO", "video/quicktime"],
      ["kodjo-media/asset-3", "PHOTO", "image/heic"],
    ]);
    expect(ready[1]!.asset.durationMs).toBe(4200);
    expect(ready[0]!.asset.durationMs).toBeNull();
    // Ordre personnalisé (Monter/Descendre) : la liste de brouillon se réordonne sans recopie.
    expect(moveDraftMedia(ready, 2, 0).map((item) => item.assetId)).toEqual(["asset-3", "asset-1", "asset-2"]);
    expect(store.copies).toEqual(["asset-1", "asset-2", "asset-3"]);
  });

  it("P3-23/cancel-local-error — annulation neutre ; échec local isolé avec Réessayer sans doublon ; stockage plein et incompatibilité locales", async () => {
    const store = new FakeStore();
    const canceled = await new ActivityMediaImportService(new FakePicker({ status: "CANCELED" }), store, uuid, now).importFromLibrary("d");
    expect(canceled).toEqual({ status: "CANCELED" });
    expect(store.copies).toEqual([]);

    store.failures.add("file:///cache/b.mov");
    const picker = new FakePicker({
      status: "PICKED",
      items: [
        picked("a.jpg", "PHOTO"),
        picked("b.mov", "VIDEO"),
        picked("doc.pdf", null, { mimeType: "application/pdf" }),
        picked("huge.mov", "VIDEO", { sizeBytes: 5_000_000 }),
      ],
      limitedAccess: false,
    });
    const service = new ActivityMediaImportService(picker, store, uuid, now, new MediaDraftLeases());
    const result = await service.importFromLibrary("draft-1");
    const items = result.status === "IMPORTED" ? result.items : [];
    expect(items.map((item) => (item.state === "FAILED" ? item.error : item.state))).toEqual([
      "READY",
      "COPY_FAILED",
      "INCOMPATIBLE",
      "STORAGE_FULL",
    ]);

    // Réessayer l'élément échoué : même identité, aucune nouvelle copie de l'élément déjà prêt.
    store.failures.clear();
    const retried = await service.retry("draft-1", items[1]!);
    expect(retried.state).toBe("READY");
    expect(retried.key).toBe(items[1]!.key);
    expect(await service.retry("draft-1", items[0]!)).toBe(items[0]);
    expect(store.copies.filter((id) => id === items[0]!.key)).toHaveLength(1);
  });

  it("P3-23/permissions — photothèque seule, accès limité accepté, refus actionnable, résultat Android en attente consommé une fois, nom/assetId nuls non fatals", async () => {
    const libraryResult = {
      canceled: false,
      assets: [
        { uri: "file:///cache/x.jpg", type: "image", width: 4, height: 3, fileName: null, assetId: null, mimeType: "image/jpeg", fileSize: 12 },
        { uri: "file:///cache/y.mov", type: "video", width: 0, height: 0, duration: 1500, mimeType: "video/quicktime" },
      ],
    };
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: false, accessPrivileges: "limited", canAskAgain: true });
    mockLaunchImageLibraryAsync.mockResolvedValueOnce(libraryResult);
    const outcome = await new PhotoLibraryPicker().pickFromLibrary();
    expect(outcome.status === "PICKED" && outcome.limitedAccess).toBe(true);
    expect(outcome.status === "PICKED" && outcome.items.map((item) => [item.kind, item.fileName, item.nativeAssetId, item.durationMs])).toEqual([
      ["PHOTO", null, null, null],
      ["VIDEO", null, null, 1500],
    ]);
    expect(mockLaunchImageLibraryAsync).toHaveBeenCalledWith(PHOTO_LIBRARY_OPTIONS);
    expect(PHOTO_LIBRARY_OPTIONS).toEqual(
      expect.objectContaining({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        selectionLimit: 0,
        allowsEditing: false,
        preferredAssetRepresentationMode: "current",
      }),
    );

    // Refus définitif : résultat actionnable (ouvrir les réglages), aucun lancement.
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: false, accessPrivileges: "none", canAskAgain: false });
    expect(await new PhotoLibraryPicker().pickFromLibrary()).toEqual({ status: "PERMISSION_DENIED", canAskAgain: false });
    expect(mockLaunchImageLibraryAsync).toHaveBeenCalledTimes(1);

    // Android : aucune demande de permission préalable ; résultat en attente lu une seule fois.
    jest.replaceProperty(Platform, "OS", "android");
    mockGetPendingResultAsync.mockResolvedValue(libraryResult);
    const service = new ActivityMediaImportService(new PhotoLibraryPicker(), new FakeStore(), uuid, now);
    const pending = await service.importPendingResult("draft-1");
    expect(pending?.status).toBe("IMPORTED");
    expect(await service.importPendingResult("draft-1")).toBeNull();
    expect(mockGetPendingResultAsync).toHaveBeenCalledTimes(1);

    expect(mockLaunchCameraAsync).not.toHaveBeenCalled();
    expect(mockRequestCameraPermissionsAsync).not.toHaveBeenCalled();
  });
});
