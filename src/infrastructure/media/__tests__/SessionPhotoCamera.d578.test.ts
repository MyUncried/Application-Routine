import { describe, expect, it, jest } from "@jest/globals";

import { SESSION_CAMERA_IN_BUILD, takeSessionPhoto } from "../SessionPhotoCamera";

/** D-578 : le bouton photo ouvre l'appareil photo natif du système (expo-image-picker), après la demande d'autorisation. */
const mockRequest = jest.fn(async () => ({ granted: true }));
const mockLaunch = jest.fn(async (_options: unknown) => ({ canceled: false, assets: [{ uri: "file:///photo.jpg" }] }));
jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: () => mockRequest(),
  launchCameraAsync: (options: unknown) => mockLaunch(options),
}));

describe("SessionPhotoCamera (D-578)", () => {
  it("appareil photo natif : autorisation puis prise de vue ; refus → null", async () => {
    expect(await takeSessionPhoto()).toBe("file:///photo.jpg");
    expect(mockLaunch).toHaveBeenCalledWith({ mediaTypes: "images", quality: 0.6 });
    mockRequest.mockResolvedValueOnce({ granted: false });
    expect(await takeSessionPhoto()).toBeNull();
    expect(mockLaunch).toHaveBeenCalledTimes(1);
  });

  it("disponible à partir du build portant le texte d’autorisation de l’appareil photo (décision de Hermann du 27/11/2026)", () => {
    expect(SESSION_CAMERA_IN_BUILD).toBe(true);
  });
});
