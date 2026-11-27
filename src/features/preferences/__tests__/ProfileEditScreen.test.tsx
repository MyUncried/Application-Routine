import { act, fireEvent, renderRouter, screen, testRouter, waitFor, within } from "expo-router/testing-library";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { StyleSheet, Text } from "react-native";

import { createDefaultProfile, type Profile } from "@/domain/preferences/Profile";
import { ProfileEditScreen } from "@/features/preferences/ProfileEditScreen";
import type { SaveIdentityResult, ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { strings } from "@/shared/i18n";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { CONTEXT_BAND_FADE_HEIGHT } from "@/shared/ui/ScreenShell";

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
    saveAppearance: jest.fn(async () => aProfile()),
    ...overrides,
  } as unknown as ProfileService;
}

function renderProfileEditRouter(service: ProfileService) {
  return renderRouter(
    {
      index: () => <Text>index-screen</Text>,
      profile: () => <Text>profile-screen</Text>,
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

/** Demande de Hermann du 13/11/2026 : « Retirer le bouton enregistrer de l'écran d'accueil du profil ». */
describe("ProfileEditScreen — sans « Enregistrer » (13/11/2026)", () => {
  it("has neither « Enregistrer » nor a fixed action zone; the body keeps a bottom margin", async () => {
    await renderScreen();
    expect(screen.queryByTestId("profile-edit-save-action")).toBeNull();
    expect(screen.queryByTestId("profile-edit-action-zone")).toBeNull();
    expect(screen.queryByText(t.saveAction)).toBeNull();
    const reserve = StyleSheet.flatten(screen.getByTestId("profile-edit-body").props.contentContainerStyle)
      .paddingBottom as number;
    // 14/11 : la liste se termine au-dessus de la barre de navigation KODJO (même réserve que l'écran Préférences).
    expect(reserve).toBe(navigationBarTotalHeight() + 16);
  });
});

describe("ProfileEditScreen", () => {
  beforeEach(() => {
    mockPickAndCopyProfilePhoto.mockReset();
    mockDeletePreviousProfilePhoto.mockReset();
    mockPhotoExists = false;
  });

  /** R1/UI-96E7FD739BF0 (CE-UI-01 L2004) : l'écran défile dans les Safe Areas, clavier affiché ou masqué. */
  it("scrolls within the Safe Areas and keeps working with the keyboard shown (keyboardShouldPersistTaps)", async () => {
    await renderScreen();

    const body = screen.getByTestId("profile-edit-body");
    expect(body.props.keyboardShouldPersistTaps).toBe("handled");
  });

  it("prefills the name, and shows the initials (no photo) with Silhouette homme selected by default (CE-UI-01 L1985, L2029)", async () => {
    await renderScreen(fakeProfileService({ getProfile: jest.fn(async () => aProfile({ displayName: "Ada Lovelace" })) }));

    expect(screen.getByTestId("profile-edit-name-input").props.value).toBe("Ada Lovelace");
    expect(screen.getByTestId("profile-edit-avatar-initials").props.children).toBe("AL");
    expect(screen.queryByTestId("profile-edit-avatar-image")).toBeNull();
    expect(screen.getByTestId("profile-edit-silhouette").props.accessibilityLabel).toBe(t.silhouette.homme);
    expect(screen.getByTestId("profile-edit-silhouette-homme-icon")).toBeTruthy();
  });

  it("shows one silhouette circle, the chosen one; a tap switches it, with an accessible name and hint (Figma 12116:25028)", async () => {
    await renderScreen();
    const circle = screen.getByTestId("profile-edit-silhouette");
    expect(circle.props.accessibilityRole).toBe("button");
    expect(circle.props.accessibilityHint).toBe(t.silhouette.toggleHint);

    await act(async () => {
      fireEvent.press(circle);
    });
    expect(screen.getByTestId("profile-edit-silhouette").props.accessibilityLabel).toBe(t.silhouette.femme);
    expect(screen.getByTestId("profile-edit-silhouette-femme-icon")).toBeTruthy();
    expect(screen.queryByTestId("profile-edit-silhouette-homme-icon")).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-silhouette"));
    });
    expect(screen.getByTestId("profile-edit-silhouette").props.accessibilityLabel).toBe(t.silhouette.homme);
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

  it("saves a 1-character and an 80-character name at the end of typing, without leaving the screen", async () => {
    const saveIdentity = jest.fn<ProfileService["saveIdentity"]>().mockResolvedValue({ ok: true, value: aProfile() });
    const router = await renderScreen(fakeProfileService({ saveIdentity }));
    const input = screen.getByTestId("profile-edit-name-input");

    fireEvent.changeText(input, "A");
    await act(async () => {
      fireEvent(input, "endEditing", { nativeEvent: { text: "A" } });
    });
    expect(saveIdentity).toHaveBeenLastCalledWith({ displayName: "A", photoUri: null, silhouette: null });

    fireEvent.changeText(input, "B".repeat(80));
    await act(async () => {
      fireEvent(input, "endEditing", { nativeEvent: { text: "B".repeat(80) } });
    });
    expect(saveIdentity).toHaveBeenLastCalledWith({ displayName: "B".repeat(80), photoUri: null, silhouette: null });
    expect(screen.queryByTestId("profile-edit-name-error")).toBeNull();
    expect(router.getPathname()).toBe("/profile-edit");
  });

  it("does not write when the name did not change", async () => {
    const saveIdentity = jest.fn<ProfileService["saveIdentity"]>();
    await renderScreen(fakeProfileService({ getProfile: jest.fn(async () => aProfile({ displayName: "Ada" })), saveIdentity }));

    await act(async () => {
      fireEvent(screen.getByTestId("profile-edit-name-input"), "endEditing", { nativeEvent: { text: "Ada" } });
    });
    expect(saveIdentity).not.toHaveBeenCalled();
  });

  it("shows a field error for an empty or an 81-character name; the saved name stays (CE-UI-01 L2021, L2033)", async () => {
    const saveIdentity = jest
      .fn<ProfileService["saveIdentity"]>()
      .mockResolvedValueOnce({ ok: false, code: "REQUIRED" })
      .mockResolvedValueOnce({ ok: false, code: "TOO_LONG" });
    const service = fakeProfileService({ getProfile: jest.fn(async () => aProfile({ displayName: "Ada" })), saveIdentity });
    await renderScreen(service);
    const input = screen.getByTestId("profile-edit-name-input");

    fireEvent.changeText(input, "");
    await act(async () => {
      fireEvent(input, "endEditing", { nativeEvent: { text: "" } });
    });
    expect(screen.getByTestId("profile-edit-name-error").props.children).toBe(t.name.errorRequired);

    fireEvent.changeText(input, "A".repeat(81));
    await act(async () => {
      fireEvent(input, "endEditing", { nativeEvent: { text: "A".repeat(81) } });
    });
    expect(screen.getByTestId("profile-edit-name-error").props.children).toBe(t.name.errorTooLong);

    // Un choix de silhouette pendant l'erreur repart du nom ENREGISTRÉ, jamais de la saisie invalide.
    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-silhouette"));
    });
    expect(service.saveAppearance).toHaveBeenCalledWith({ photoUri: null, silhouette: "femme" });
  });

  it("saves the silhouette as soon as it is chosen", async () => {
    const saveAppearance = jest.fn<ProfileService["saveAppearance"]>().mockResolvedValue(aProfile({ silhouette: "femme" }));
    await renderScreen(fakeProfileService({ saveAppearance }));

    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-silhouette"));
    });
    expect(saveAppearance).toHaveBeenCalledWith({ photoUri: null, silhouette: "femme" });
  });

  it("saves a chosen photo at once, and deletes the previous photo copy only after success (D3)", async () => {
    mockPickAndCopyProfilePhoto.mockResolvedValueOnce({ status: "PICKED", uri: "file:///document/profile-photo-new.jpg" });
    let release: (profile: Profile) => void = () => undefined;
    const saveAppearance = jest.fn<ProfileService["saveAppearance"]>(
      () => new Promise<Profile>((resolve) => (release = resolve)),
    );
    await renderScreen(
      fakeProfileService({
        getProfile: jest.fn(async () => aProfile({ photoUri: "file:///document/profile-photo-old.jpg", silhouette: "homme" })),
        saveAppearance,
      }),
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-photo-action"));
    });
    expect(saveAppearance).toHaveBeenCalledWith({ photoUri: "file:///document/profile-photo-new.jpg", silhouette: "homme" });
    expect(mockDeletePreviousProfilePhoto).not.toHaveBeenCalled();

    await act(async () => {
      release(aProfile({ photoUri: "file:///document/profile-photo-new.jpg", silhouette: "homme" }));
    });
    expect(mockDeletePreviousProfilePhoto).toHaveBeenCalledWith("file:///document/profile-photo-old.jpg");
  });

  it("shows a message when saving fails technically and keeps the typed name", async () => {
    const saveIdentity = jest.fn<ProfileService["saveIdentity"]>().mockRejectedValue(new Error("boom"));
    const router = await renderScreen(fakeProfileService({ saveIdentity }));
    const input = screen.getByTestId("profile-edit-name-input");

    fireEvent.changeText(input, "Ada");
    await act(async () => {
      fireEvent(input, "endEditing", { nativeEvent: { text: "Ada" } });
    });

    expect(screen.getByTestId("profile-edit-save-error")).toBeTruthy();
    expect(router.getPathname()).toBe("/profile-edit");
    expect(screen.getByTestId("profile-edit-name-input").props.value).toBe("Ada");
  });

  it("leaves to Profil without any « Abandonner » dialog, even after a change (13/11/2026)", async () => {
    const router = await renderScreen();
    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "Changed");

    act(() => {
      testRouter.back();
    });
    expect(router.getPathname()).toBe("/");
    expect(screen.queryByText(t.abandonModal.title)).toBeNull();
  });
});

/**
 * Écran Profil aligné sur Figma 12119:25611 (11/11/2026) : en-tête à trois onglets à la place du titre et du
 * Retour, carte « Profil » (avatar 64 + pastille appareil photo, ligne « Nom », silhouettes 40), fond #F7F7FF.
 */
describe("ProfileEditScreen — alignement Figma 12119:25611", () => {
  beforeEach(() => {
    mockPickAndCopyProfilePhoto.mockReset();
    mockPhotoExists = false;
  });

  // PROG-CAT-01 (CE-PRF-01, D-552) : Compte · Préférences · Confidentialité. [Avant : Profil · Préférences · Communauté
  // (désactivée) — remplacé.]
  it("shows the three tabs: Compte selected, Préférences returns to the Profil screen; former greyed account card removed", async () => {
    const router = await renderScreen();

    expect(screen.queryByTestId("screen-header-back")).toBeNull();
    const accountTab = screen.getByTestId("profile-edit-tabs-account");
    expect(accountTab.props.accessibilityLabel).toBe("Compte");
    expect(accountTab.props.accessibilityState).toMatchObject({ selected: true, disabled: false });
    expect(screen.getByTestId("profile-edit-tabs-account-shape", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId("profile-edit-tabs-privacy").props.accessibilityLabel).toBe("Confidentialité");
    expect(screen.queryByTestId("profile-edit-tabs-community")).toBeNull();
    // T1 Compte (25/11/2026, CE-CPT-02) : la carte grisée est remplacée par la section Compte, testée dans
    // `src/features/account/__tests__`. [Avant : carte « profile-edit-account » grisée — remplacée.]
    expect(screen.queryByTestId("profile-edit-account")).toBeNull();
    // Recette du 23/11/2026 (p6-compte, Hermann : « Supprime le texte "Disponible avec la gestion des comptes" »).
    expect(screen.queryByText("Disponible avec la gestion des comptes")).toBeNull();

    fireEvent.press(accountTab);
    expect(router.getPathname()).toBe("/profile-edit");

    act(() => {
      fireEvent.press(screen.getByTestId("profile-edit-tabs-preferences"));
    });
    await waitFor(() => expect(router.getPathname()).toBe("/profile"));
  });

  it("leaves through the Préférences tab without any dialog, even after a change (13/11/2026)", async () => {
    const router = await renderScreen();
    fireEvent.changeText(screen.getByTestId("profile-edit-name-input"), "Changed");

    act(() => {
      fireEvent.press(screen.getByTestId("profile-edit-tabs-preferences"));
    });
    await waitFor(() => expect(router.getPathname()).toBe("/profile"));
    expect(screen.queryByText(t.abandonModal.title)).toBeNull();
  });

  it("lays out the Profil zone: no section label, initials on the dark avatar, camera badge (no label, no frame), name without « Nom »", async () => {
    await renderScreen(fakeProfileService({ getProfile: jest.fn(async () => aProfile({ displayName: "Hermann Adjo" })) }));

    // Recette c2 du 12/11 : plus d'intitulé « Profil » ni de libellé « Nom ».
    // Seul l'onglet portait « Profil » ; depuis D-552 (PROG-CAT-01), l'onglet est « Compte » : aucun intitulé « Profil ».
    expect(screen.queryAllByText(t.sectionLabel)).toHaveLength(0);
    expect(screen.getByTestId("profile-edit-avatar-background")).toBeTruthy();
    const initials = screen.getByTestId("profile-edit-avatar-initials");
    expect(initials.props.children).toBe("HA");
    expect(StyleSheet.flatten(initials.props.style)).toMatchObject({ fontSize: 22, color: "#FFFFFF" });
    // Recette c2 du 11/11 : pastille réduite (22), seule commande de la photo ; plus de libellé « Modifier la photo ».
    expect(StyleSheet.flatten(screen.getByTestId("profile-edit-photo-action").props.style)).toMatchObject({
      width: 22,
      height: 22,
      backgroundColor: "#0508E5",
    });
    expect(screen.queryByText(t.photo.editLabel)).toBeNull();
    expect(screen.getByTestId("profile-edit-photo-action").props.accessibilityLabel).toBe(t.photo.addAccessibilityLabel);
    expect(screen.queryByText(t.name.label)).toBeNull();
    expect(screen.getByTestId("profile-edit-name-input").props.accessibilityLabel).toBe(t.name.label);
    // Aucune donnée « pseudo » ni « type de compte » dans le Profil : rien n'est inventé.
    expect(screen.queryByText("Pseudo")).toBeNull();
    expect(screen.queryByText("Compte gratuit")).toBeNull();
  });

  it("opens the photo picker from the camera badge", async () => {
    mockPickAndCopyProfilePhoto.mockResolvedValue({ status: "CANCELED" });
    await renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId("profile-edit-photo-action"));
    });
    expect(mockPickAndCopyProfilePhoto).toHaveBeenCalledTimes(1);
  });

  it("draws the silhouette in a transparent circle the size of the photo (64), outlined blue, icon filled blue with a margin", async () => {
    await renderScreen();

    expect(StyleSheet.flatten(screen.getByTestId("profile-edit-silhouette").props.style)).toMatchObject({
      width: 64,
      height: 64,
      borderWidth: 1.25,
      borderColor: "#0508E5",
      backgroundColor: "transparent",
    });
    const icon = screen.getByTestId("profile-edit-silhouette-homme-icon");
    // Silhouette pleine bleue (icône « plein » des Zones corporelles), 48 dans le rond de 64 (8 de marge), contain.
    expect(StyleSheet.flatten(icon.props.style)).toMatchObject({ width: 48, height: 48 });
    expect(icon.props.source).toEqual([require("../../../../assets/icons/body-zone-homme-plein.svg")]);
    expect(icon.props.contentFit).toBe("contain");
  });

  it("paints the screen #F7F7FF", async () => {
    await renderScreen();

    expect(StyleSheet.flatten(screen.getByTestId("screen-shell").props.style)).toMatchObject({ backgroundColor: "#F7F7FF" });
    expect(screen.getByTestId("screen-context-band")).toBeTruthy();
  });

  it("recette c2 du 13/11 (Figma 12116:25015) : photo, nom et silhouette sur une ligne dans la zone de contexte standard ; Bibliothèques dessous", async () => {
    await renderScreen(fakeProfileService({ getProfile: jest.fn(async () => aProfile({ displayName: "Hermann" })) }));

    // Zone de contexte canonique des Catalogues (`ContextBand`, hauteur 115, fondu par couches), couleur de l'onglet.
    const band = screen.getByTestId("screen-context-band");
    expect(StyleSheet.flatten(band.props.style)).toMatchObject({ height: 115, paddingTop: 21, paddingBottom: 22, backgroundColor: "transparent" });
    expect(StyleSheet.flatten(screen.getByTestId("screen-context-band-solid", { includeHiddenElements: true }).props.style)).toMatchObject({ backgroundColor: "#EAEAFF" });
    expect(screen.getByTestId("screen-context-band-fade", { includeHiddenElements: true })).toBeTruthy();

    const identity = within(band).getByTestId("profile-edit-identity");
    expect(StyleSheet.flatten(identity.props.style)).toMatchObject({ flexDirection: "row", alignItems: "center", paddingLeft: 8 });
    expect(within(identity).getByTestId("profile-edit-avatar")).toBeTruthy();
    expect(within(identity).getByTestId("profile-edit-photo-action")).toBeTruthy();
    expect(within(identity).getByTestId("profile-edit-name-input").props.value).toBe("Hermann");
    expect(StyleSheet.flatten(within(identity).getByTestId("profile-edit-name-input").props.style)).toMatchObject({ fontSize: 14, marginLeft: 24 });
    expect(within(identity).getByTestId("profile-edit-silhouette")).toBeTruthy();

    // Le corps ne porte plus la photo ni le nom ; il commence par les Bibliothèques, sous la part fondue.
    const body = screen.getByTestId("profile-edit-body");
    expect(within(body).queryByTestId("profile-edit-name-input")).toBeNull();
    expect(within(body).queryByTestId("profile-edit-avatar")).toBeNull();
    expect(StyleSheet.flatten(body.props.contentContainerStyle)).toMatchObject({ paddingTop: 8 + CONTEXT_BAND_FADE_HEIGHT });
    expect(StyleSheet.flatten(body.props.style)).toMatchObject({ marginTop: -CONTEXT_BAND_FADE_HEIGHT });
    // Ni pseudo (après la fusion de PRE-10) ni « Compte gratuit » (retiré de la maquette).
    expect(screen.queryByText(/^@/)).toBeNull();
    expect(screen.queryByText("Compte gratuit")).toBeNull();
  });
});
