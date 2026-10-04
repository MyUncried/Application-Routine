import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { createDefaultProfile, type Profile } from "@/domain/preferences/Profile";
import { ProfileEditScreen } from "@/features/preferences/ProfileEditScreen";
import type { SaveIdentityResult, ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Écran Modifier le profil (V2-PRE-2, plan §6.5, CE-UI-01 L1965-2051). Seuls
 * `expo-router` (frontière de navigation) et `useCompositionExitGuard`
 * (mécanisme réel déjà testé séparément, même patron que
 * `ExerciseScreen.test.tsx`/`CompositionScreen.test.tsx`) sont mockés —
 * `profilePhoto.ts` est doublé en bloc, ses propres adaptateurs
 * (`expo-image-picker`/`expo-file-system`) étant déjà couverts par
 * `profilePhoto.test.ts`.
 */
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

const mockExitGuard = jest.fn();
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: (shouldBlock: boolean, onConfirmExit: () => void) =>
    mockExitGuard(shouldBlock, onConfirmExit),
}));

function defaultExitGuardResult() {
  return { isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() };
}

const mockPickAndCopyProfilePhoto = jest.fn<
  () => Promise<{ status: "PICKED"; uri: string } | { status: "CANCELED" } | { status: "ERROR" }>
>();
const mockDeletePreviousProfilePhoto = jest.fn();
let mockPhotoExists = false;
jest.mock("@/features/preferences/profilePhoto", () => ({
  pickAndCopyProfilePhoto: () => mockPickAndCopyProfilePhoto(),
  deletePreviousProfilePhoto: (uri: string | null) => mockDeletePreviousProfilePhoto(uri),
  profilePhotoFileExists: () => mockPhotoExists,
}));

function aProfile(overrides: Partial<Profile> = {}): Profile {
  return { ...createDefaultProfile("profile-1", "2026-01-01T00:00:00.000Z"), ...overrides };
}

function fakeProfileService(overrides: Partial<ProfileService> = {}): ProfileService {
  return {
    getProfile: jest.fn(async () => aProfile()),
    saveIdentity: jest.fn(async (): Promise<SaveIdentityResult> => ({ ok: true, value: aProfile() })),
    ...overrides,
  } as unknown as ProfileService;
}

async function renderScreen(service: ProfileService = fakeProfileService()) {
  render(
    <TestSafeAreaProvider>
      <ProfileServiceContext.Provider value={service}>
        <ProfileEditScreen />
      </ProfileServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await screen.findByTestId("profile-edit-body");
}

const t = strings.screens.profileEdit;

describe("ProfileEditScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockExitGuard.mockReset();
    mockExitGuard.mockReturnValue(defaultExitGuardResult());
    mockPickAndCopyProfilePhoto.mockReset();
    mockDeletePreviousProfilePhoto.mockReset();
    mockPhotoExists = false;
  });

  it("prefills the name, and shows the initials (no photo) with Silhouette homme selected by default (CE-UI-01 L1985, L2029)", async () => {
    await renderScreen(fakeProfileService({ getProfile: jest.fn(async () => aProfile({ displayName: "Ada Lovelace" })) }));

    expect(screen.getByTestId("profile-edit-name-input").props.value).toBe("Ada Lovelace");
    expect(screen.getByTestId("profile-edit-avatar-initials").props.children).toBe("AL");
    expect(screen.queryByTestId("profile-edit-avatar-image")).toBeNull();
    expect(
      screen.getByTestId("profile-edit-silhouette-homme").props.accessibilityState.selected,
    ).toBe(true);
    expect(
      screen.getByTestId("profile-edit-silhouette-femme").props.accessibilityState.selected,
    ).toBe(false);
  });

  it("announces Silhouette homme et Silhouette femme with their selected state, switching on tap (CE-UI-01 L2037)", async () => {
    await renderScreen();

    fireEvent.press(screen.getByTestId("profile-edit-silhouette-femme"));

    expect(
      screen.getByTestId("profile-edit-silhouette-femme").props.accessibilityState.selected,
    ).toBe(true);
    expect(
      screen.getByTestId("profile-edit-silhouette-homme").props.accessibilityState.selected,
    ).toBe(false);
    expect(screen.getByLabelText(t.silhouette.femme)).toBeTruthy();
    expect(screen.getByLabelText(t.silhouette.homme)).toBeTruthy();
  });

  it("opens only the gallery to add a photo; a cancellation never modifies the draft (D-258)", async () => {
    mockPickAndCopyProfilePhoto.mockResolvedValueOnce({ status: "CANCELED" });
    await renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-photo-action"));
    });

    expect(mockPickAndCopyProfilePhoto).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("profile-edit-avatar-image")).toBeNull();
    expect(screen.getByTestId("profile-edit-avatar-initials")).toBeTruthy();
  });

  it("copies a chosen image into local storage and reflects it immediately in the draft", async () => {
    mockPickAndCopyProfilePhoto.mockResolvedValueOnce({
      status: "PICKED",
      uri: "file:///document/profile-photo-1.jpg",
    });
    await renderScreen();

    mockPhotoExists = true;
    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-photo-action"));
    });

    await waitFor(() => expect(screen.getByTestId("profile-edit-avatar-image")).toBeTruthy());
    expect(screen.getByTestId("profile-edit-avatar-image").props.source).toContainEqual({
      uri: "file:///document/profile-photo-1.jpg",
    });
  });

  it("shows a message and keeps the draft intact when the photo read/copy fails", async () => {
    mockPickAndCopyProfilePhoto.mockResolvedValueOnce({ status: "ERROR" });
    await renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-photo-action"));
    });

    expect(screen.getByTestId("profile-edit-photo-error")).toBeTruthy();
    expect(screen.queryByTestId("profile-edit-avatar-image")).toBeNull();
  });

  it("accepts a 1-character name and saves, returning to Profil", async () => {
    const saveIdentity = jest.fn<ProfileService["saveIdentity"]>().mockResolvedValue({
      ok: true,
      value: aProfile(),
    });
    await renderScreen(fakeProfileService({ saveIdentity }));

    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "A");
    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-save-action"));
    });
    expect(screen.queryByTestId("profile-edit-name-error")).toBeNull();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("accepts an 80-character name and saves, returning to Profil", async () => {
    const saveIdentity = jest.fn<ProfileService["saveIdentity"]>().mockResolvedValue({
      ok: true,
      value: aProfile(),
    });
    await renderScreen(fakeProfileService({ saveIdentity }));

    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "A".repeat(80));
    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-save-action"));
    });
    expect(screen.queryByTestId("profile-edit-name-error")).toBeNull();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("shows a field error and keeps the screen open for an empty name or an 81-character name (CE-UI-01 L2021, L2033)", async () => {
    const saveIdentity = jest
      .fn<ProfileService["saveIdentity"]>()
      .mockResolvedValueOnce({ ok: false, code: "REQUIRED" })
      .mockResolvedValueOnce({ ok: false, code: "TOO_LONG" });
    await renderScreen(fakeProfileService({ saveIdentity }));

    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "");
    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-save-action"));
    });
    expect(screen.getByTestId("profile-edit-name-error").props.children).toBe(t.name.errorRequired);
    expect(mockBack).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "A".repeat(81));
    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-save-action"));
    });
    expect(screen.getByTestId("profile-edit-name-error").props.children).toBe(t.name.errorTooLong);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("saves name, photo and silhouette together, and deletes the previous photo copy only after success (D3)", async () => {
    mockPickAndCopyProfilePhoto.mockResolvedValueOnce({
      status: "PICKED",
      uri: "file:///document/profile-photo-new.jpg",
    });
    const saveIdentity = jest.fn<ProfileService["saveIdentity"]>().mockResolvedValue({
      ok: true,
      value: aProfile(),
    });
    await renderScreen(
      fakeProfileService({
        getProfile: jest.fn(async () => aProfile({ photoUri: "file:///document/profile-photo-old.jpg" })),
        saveIdentity,
      }),
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-photo-action"));
    });
    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "Grace Hopper");
    fireEvent.press(screen.getByTestId("profile-edit-silhouette-femme"));

    expect(mockDeletePreviousProfilePhoto).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-save-action"));
    });

    expect(saveIdentity).toHaveBeenCalledWith({
      displayName: "Grace Hopper",
      photoUri: "file:///document/profile-photo-new.jpg",
      silhouette: "femme",
    });
    expect(mockDeletePreviousProfilePhoto).toHaveBeenCalledWith("file:///document/profile-photo-old.jpg");
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("shows a message and keeps the draft when saving fails technically — never navigates away", async () => {
    const saveIdentity = jest.fn<ProfileService["saveIdentity"]>().mockRejectedValue(new Error("boom"));
    await renderScreen(fakeProfileService({ saveIdentity }));

    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "Ada");
    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-save-action"));
    });

    expect(screen.getByTestId("profile-edit-save-error")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.getByTestId("profile-edit-name-input").props.value).toBe("Ada");
  });

  it("intercepts a modified-draft exit with DecisionDialog: Annuler stays on the screen, Confirmer abandons and returns to Profil (CE-UI-01 L1981)", async () => {
    const cancelExit = jest.fn();
    const confirmExit = jest.fn();
    mockExitGuard.mockReturnValue({ isPendingExit: true, cancelExit, confirmExit });
    await renderScreen();

    expect(screen.getByText(t.abandonModal.title)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(t.abandonModal.continueEditing));
    expect(cancelExit).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByLabelText(t.abandonModal.abandon));
    expect(confirmExit).toHaveBeenCalledTimes(1);
  });

  it("never shows the abandon dialog without any modification, and arms the guard once the name changes", async () => {
    await renderScreen();
    expect(mockExitGuard).toHaveBeenLastCalledWith(false, expect.any(Function));
    expect(screen.queryByText(t.abandonModal.title)).toBeNull();

    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "Changed");

    expect(mockExitGuard).toHaveBeenLastCalledWith(true, expect.any(Function));
  });
});
