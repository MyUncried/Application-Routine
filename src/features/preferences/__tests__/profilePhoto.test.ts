import { describe, expect, it, jest } from "@jest/globals";

import {
  deletePreviousProfilePhoto,
  pickAndCopyProfilePhoto,
  profilePhotoFileExists,
} from "../profilePhoto";

const mockCopy = jest.fn<() => Promise<void>>();
const mockDelete = jest.fn<() => void>();
let mockExistsValue = true;

jest.mock("expo-file-system", () => {
  class FakeFile {
    uri: string;
    extension: string;
    exists = mockExistsValue;
    constructor(..._uris: unknown[]) {
      this.uri = String(_uris[_uris.length - 1]);
      const match = /\.[a-z0-9]+$/i.exec(this.uri);
      this.extension = match ? match[0] : "";
    }
    copy = mockCopy;
    delete = mockDelete;
  }
  return {
    File: FakeFile,
    Paths: { document: "file:///document/" },
  };
});

const mockLaunchImageLibraryAsync = jest.fn<
  (options: unknown) => Promise<{ canceled: boolean; assets: readonly { uri: string }[] | null }>
>();
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: (options: unknown) => mockLaunchImageLibraryAsync(options),
}));

describe("pickAndCopyProfilePhoto (D3)", () => {
  it("opens only the gallery (launchImageLibraryAsync), images only, a single image", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({ canceled: true, assets: null });
    await pickAndCopyProfilePhoto();

    expect(mockLaunchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ["images"], allowsMultipleSelection: false }),
    );
  });

  it("never modifies anything on cancellation — returns CANCELED", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({ canceled: true, assets: null });
    const result = await pickAndCopyProfilePhoto();
    expect(result).toEqual({ status: "CANCELED" });
    expect(mockCopy).not.toHaveBeenCalled();
  });

  it("copies a chosen image into the app's persistent local storage and returns its new URI", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file:///cache/picked-image.jpg" }],
    });
    mockCopy.mockResolvedValueOnce(undefined);

    const result = await pickAndCopyProfilePhoto(() => "fixed-id");
    expect(result.status).toBe("PICKED");
    if (result.status === "PICKED") {
      expect(result.uri).toContain("profile-photo-fixed-id");
    }
    expect(mockCopy).toHaveBeenCalledTimes(1);
  });

  it("returns ERROR without throwing when the copy fails — the caller's draft is never touched", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file:///cache/picked-image.jpg" }],
    });
    mockCopy.mockRejectedValueOnce(new Error("disk full"));

    const result = await pickAndCopyProfilePhoto();
    expect(result).toEqual({ status: "ERROR" });
  });

  it("returns ERROR without throwing when the picker itself fails", async () => {
    mockLaunchImageLibraryAsync.mockRejectedValueOnce(new Error("picker unavailable"));
    const result = await pickAndCopyProfilePhoto();
    expect(result).toEqual({ status: "ERROR" });
  });
});

describe("deletePreviousProfilePhoto — only after a successful save (D3)", () => {
  it("deletes the previous file when it exists", () => {
    mockExistsValue = true;
    deletePreviousProfilePhoto("file:///document/old-photo.jpg");
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it("does nothing for a null uri", () => {
    mockDelete.mockClear();
    deletePreviousProfilePhoto(null);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

describe("profilePhotoFileExists — an absent or missing photo shows initials without blocking the fields", () => {
  it("returns false for a null uri", () => {
    expect(profilePhotoFileExists(null)).toBe(false);
  });

  it("reflects the file's real existence", () => {
    mockExistsValue = true;
    expect(profilePhotoFileExists("file:///document/photo.jpg")).toBe(true);
    mockExistsValue = false;
    expect(profilePhotoFileExists("file:///document/missing.jpg")).toBe(false);
  });
});
