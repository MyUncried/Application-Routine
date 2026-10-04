import { act, fireEvent, renderRouter, screen, testRouter, waitFor } from "expo-router/testing-library";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Text } from "react-native";

import { createDefaultProfile, type Profile } from "@/domain/preferences/Profile";
import { ProfileEditScreen } from "@/features/preferences/ProfileEditScreen";
import type { SaveIdentityResult, ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { strings } from "@/shared/i18n";

/**
 * Écran Modifier le profil (V2-PRE-2, plan §6.5, CE-UI-01 L1965-2051).
 *
 * Revue d'implémentation 5976315331 (UI-103FBF8D197A-AE1956416F3CB) :
 * `useCompositionExitGuard` n'est PLUS simulé ici — ce fichier utilise un
 * vrai navigateur (`renderRouter`/`testRouter`, sous-chemin public
 * `expo-router/testing-library`), même patron que
 * `ExerciseNavigationGuard.integration.test.tsx`, pour prouver de bout en
 * bout le mécanisme réel de garde de sortie (`usePreventRemove` non
 * mocké). Seul `profilePhoto.ts` reste doublé en bloc : ses propres
 * adaptateurs (`expo-image-picker`/`expo-file-system`) sont déjà couverts
 * par `profilePhoto.test.ts`.
 */
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

function renderProfileEditRouter(service: ProfileService) {
  return renderRouter(
    {
      index: () => <Text>index-screen</Text>,
      "profile-edit": () => (
        <ProfileServiceContext.Provider value={service}>
          <ProfileEditScreen />
        </ProfileServiceContext.Provider>
      ),
    },
    { initialUrl: "/" },
  );
}

/** Pousse `/profile-edit` sur le vrai navigateur et attend le premier rendu du brouillon chargé. */
async function renderScreen(service: ProfileService = fakeProfileService()) {
  const router = renderProfileEditRouter(service);
  testRouter.push("/profile-edit");
  await screen.findByTestId("profile-edit-body");
  return router;
}

const t = strings.screens.profileEdit;

describe("ProfileEditScreen", () => {
  beforeEach(() => {
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
    const router = await renderScreen(fakeProfileService({ saveIdentity }));

    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "A");
    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-save-action"));
    });
    expect(screen.queryByTestId("profile-edit-name-error")).toBeNull();
    expect(router.getPathname()).toBe("/");
  });

  it("accepts an 80-character name and saves, returning to Profil", async () => {
    const saveIdentity = jest.fn<ProfileService["saveIdentity"]>().mockResolvedValue({
      ok: true,
      value: aProfile(),
    });
    const router = await renderScreen(fakeProfileService({ saveIdentity }));

    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "A".repeat(80));
    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-save-action"));
    });
    expect(screen.queryByTestId("profile-edit-name-error")).toBeNull();
    expect(router.getPathname()).toBe("/");
  });

  it("shows a field error and keeps the screen open for an empty name or an 81-character name (CE-UI-01 L2021, L2033)", async () => {
    const saveIdentity = jest
      .fn<ProfileService["saveIdentity"]>()
      .mockResolvedValueOnce({ ok: false, code: "REQUIRED" })
      .mockResolvedValueOnce({ ok: false, code: "TOO_LONG" });
    const router = await renderScreen(fakeProfileService({ saveIdentity }));

    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "");
    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-save-action"));
    });
    expect(screen.getByTestId("profile-edit-name-error").props.children).toBe(t.name.errorRequired);
    expect(router.getPathname()).toBe("/profile-edit");

    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "A".repeat(81));
    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-save-action"));
    });
    expect(screen.getByTestId("profile-edit-name-error").props.children).toBe(t.name.errorTooLong);
    expect(router.getPathname()).toBe("/profile-edit");
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
    const router = await renderScreen(
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
    expect(router.getPathname()).toBe("/");
  });

  it("shows a message and keeps the draft when saving fails technically — never navigates away", async () => {
    const saveIdentity = jest.fn<ProfileService["saveIdentity"]>().mockRejectedValue(new Error("boom"));
    const router = await renderScreen(fakeProfileService({ saveIdentity }));

    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "Ada");
    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-save-action"));
    });

    expect(screen.getByTestId("profile-edit-save-error")).toBeTruthy();
    expect(router.getPathname()).toBe("/profile-edit");
    expect(screen.getByTestId("profile-edit-name-input").props.value).toBe("Ada");
  });

  /**
   * Revue 5976315331 : la VRAIE garde (`usePreventRemove`, non simulée) doit
   * intercepter un retour avec brouillon modifié ; Annuler ferme le
   * dialogue et conserve l'écran/le brouillon ; Confirmer restaure le
   * brouillon aux valeurs ENREGISTRÉES (jamais persistées — `saveIdentity`
   * n'est jamais appelé) puis rejoue la navigation vers Profil. Rouvrir
   * Modifier le profil après Confirmer prouve, de bout en bout, que rien de
   * l'édition abandonnée n'a survécu : le nom relu est à nouveau celui
   * ENREGISTRÉ, jamais "Changed".
   */
  it("intercepts a modified-draft exit with the real guard: Annuler stays on the screen, Confirmer restores saved values and returns to Profil (CE-UI-01 L1981)", async () => {
    const saveIdentity = jest.fn<ProfileService["saveIdentity"]>();
    const service = fakeProfileService({
      getProfile: jest.fn(async () => aProfile({ displayName: "Ada Lovelace" })),
      saveIdentity,
    });
    const router = await renderScreen(service);

    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "Changed");

    testRouter.back();
    expect(router.getPathname()).toBe("/profile-edit");
    expect(screen.getByText(t.abandonModal.title)).toBeTruthy();
    expect(screen.getByTestId("profile-edit-name-input").props.value).toBe("Changed");

    // Annuler : dialogue fermé, écran et brouillon modifié conservés.
    act(() => {
      fireEvent.press(screen.getByLabelText(t.abandonModal.continueEditing));
    });
    expect(screen.queryByText(t.abandonModal.title)).toBeNull();
    expect(router.getPathname()).toBe("/profile-edit");
    expect(screen.getByTestId("profile-edit-name-input").props.value).toBe("Changed");

    // Confirmer : restaure le brouillon aux valeurs enregistrées, jamais persisté, puis revient au Profil.
    testRouter.back();
    act(() => {
      fireEvent.press(screen.getByLabelText(t.abandonModal.abandon));
    });

    expect(router.getPathname()).toBe("/");
    expect(screen.getByText("index-screen")).toBeTruthy();
    expect(saveIdentity).not.toHaveBeenCalled();

    testRouter.push("/profile-edit");
    await screen.findByTestId("profile-edit-body");
    expect(screen.getByTestId("profile-edit-name-input").props.value).toBe("Ada Lovelace");
  });

  it("lets Retour navigate directly to Profil without any dialog when the draft is unmodified, and intercepts it once the name changes", async () => {
    const router = await renderScreen();

    testRouter.back();
    expect(router.getPathname()).toBe("/");
    expect(screen.queryByText(t.abandonModal.title)).toBeNull();

    testRouter.push("/profile-edit");
    await screen.findByTestId("profile-edit-body");
    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "Changed");

    testRouter.back();
    expect(router.getPathname()).toBe("/profile-edit");
    expect(screen.getByText(t.abandonModal.title)).toBeTruthy();
  });
});
