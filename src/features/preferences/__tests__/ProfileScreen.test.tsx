import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import { createDefaultProfile, type Profile } from "@/domain/preferences/Profile";
import { ProfileScreen } from "@/features/preferences/ProfileScreen";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Écran Profil (V2-PRE-2, plan §6.5, CE-UI-07 L2495-2583). Seul
 * `expo-router` est mocké (frontière de navigation, même patron que
 * `CatalogueScreen.test.tsx`) — `useFocusEffect` capture son callback,
 * rejoué explicitement pour prouver la relecture après réouverture (L2545,
 * L2557, L2561).
 */
const focusEffectHarness: { effect: (() => (() => void) | void) | null } = { effect: null };
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => (() => void) | void) => {
    focusEffectHarness.effect = effect;
  },
  useRouter: () => ({ push: mockPush }),
}));

/**
 * T7 : « aucune demande de permission système n'est faite depuis le
 * Profil ; un état « refusé » n'affiche jamais Notifications actif » —
 * seul le LECTEUR D'ÉTAT (jamais une demande réelle) est doublé ici, pour
 * piloter explicitement l'état refusé sans dépendre d'un module de
 * notifications réel (absent de cette tranche, `notificationPermission.ts`).
 */
const mockGetNotificationPermissionStatus = jest.fn<() => Promise<string>>(async () => "undetermined");
jest.mock("@/features/preferences/notificationPermission", () => ({
  getNotificationPermissionStatus: () => mockGetNotificationPermissionStatus(),
  isNotificationPermissionDenied: (status: string) => status === "denied",
}));

function aProfile(overrides: Partial<Profile> = {}): Profile {
  return { ...createDefaultProfile("profile-1", "2026-01-01T00:00:00.000Z"), ...overrides };
}

function fakeProfileService(overrides: Partial<ProfileService> = {}): ProfileService {
  return {
    getProfile: jest.fn(async () => aProfile()),
    setDefault: jest.fn(async (_setting: unknown, _value: unknown) => aProfile()),
    setPreference: jest.fn(async (_preference: unknown, _value: unknown) => aProfile()),
    ...overrides,
  } as unknown as ProfileService;
}

async function renderScreen(service: ProfileService = fakeProfileService()) {
  render(
    <TestSafeAreaProvider>
      <ProfileServiceContext.Provider value={service}>
        <ProfileScreen />
      </ProfileServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  if (!focusEffectHarness.effect) {
    throw new Error("No useFocusEffect callback captured yet.");
  }
  await act(async () => {
    focusEffectHarness.effect?.();
  });
  await screen.findByTestId("profile-screen-body");
}

const t = strings.screens.profile;

describe("ProfileScreen", () => {
  it("shows the six settings, unmodified, at their exact canonical values, grouped Exercice/Séance (CE-UI-07 L2515, L2519)", async () => {
    await renderScreen();

    const exerciseGroup = screen.getByTestId("profile-group-exercise");
    const sessionGroup = screen.getByTestId("profile-group-session");

    expect(screen.getByTestId("profile-setting-sideChangeRecoverySecondsDefault-value").props.children).toBe(
      "10 s",
    );
    expect(
      screen.getByTestId("profile-setting-exerciseCountdownSecondsDefault-value").props.children,
    ).toBe("10 s");
    expect(screen.getByTestId("profile-setting-exerciseEndSecondsDefault-value").props.children).toBe(
      "5 s",
    );
    expect(
      screen.getByTestId("profile-setting-postActivityRecoverySecondsDefault-value").props.children,
    ).toBe("30 s");
    expect(
      screen.getByTestId("profile-setting-sessionInitialCountdownSecondsDefault-value").props.children,
    ).toBe("10 s");
    expect(
      screen.getByTestId("profile-setting-sessionFinalPhaseSecondsDefault-value").props.children,
    ).toBe("5 s");

    // Le groupe Exercice porte Pause entre les côtés/Compte à rebours
    // d'exercice/Fin d'exercice ; le groupe Séance porte Récupération après
    // exercice/Compte à rebours initial/Fin de séance — jamais mélangés.
    expect(
      exerciseGroup.findByProps({ testID: "profile-setting-sideChangeRecoverySecondsDefault" }),
    ).toBeTruthy();
    expect(
      sessionGroup.findByProps({ testID: "profile-setting-postActivityRecoverySecondsDefault" }),
    ).toBeTruthy();
  });

  it("defaults Sons/Annonces vocales/Vibration to active and Notifications to inactive, each independent (CE-UI-07 L2515, L2519, L2573)", async () => {
    await renderScreen();

    expect(screen.getByTestId("profile-preference-soundsEnabled-switch").props.value).toBe(true);
    expect(
      screen.getByTestId("profile-preference-voiceAnnouncementsEnabled-switch").props.value,
    ).toBe(true);
    expect(screen.getByTestId("profile-preference-vibrationEnabled-switch").props.value).toBe(true);
    expect(screen.getByTestId("profile-preference-notificationsEnabled-switch").props.value).toBe(
      false,
    );
  });

  it("never renders an Exercise wheel picker (DurationWheelPicker/NumberWheelPicker) — every duration uses ProfileStepper (CE-UI-07 L2533)", async () => {
    await renderScreen();

    expect(screen.queryByTestId("duration-wheel-minutes")).toBeNull();
    expect(screen.queryByTestId("duration-wheel-seconds")).toBeNull();
    expect(screen.getByTestId("profile-setting-sessionInitialCountdownSecondsDefault")).toBeTruthy();
  });

  /** D-227 : un seul stepper ouvert à la fois. */
  it("keeps only one stepper open at a time", async () => {
    await renderScreen();

    fireEvent.press(screen.getByTestId("profile-setting-sideChangeRecoverySecondsDefault"));
    expect(screen.getByTestId("profile-setting-sideChangeRecoverySecondsDefault-increment")).toBeTruthy();

    fireEvent.press(screen.getByTestId("profile-setting-exerciseCountdownSecondsDefault"));
    expect(
      screen.queryByTestId("profile-setting-sideChangeRecoverySecondsDefault-increment"),
    ).toBeNull();
    expect(screen.getByTestId("profile-setting-exerciseCountdownSecondsDefault-increment")).toBeTruthy();
  });

  it("persists a stepper change immediately via ProfileService.setDefault, leaving the five other values unchanged (CE-UI-07 L2545, L2557, L2561)", async () => {
    const updated = aProfile({ exerciseCountdownSecondsDefault: 11 });
    const setDefault = jest.fn(async () => updated);
    await renderScreen(fakeProfileService({ setDefault: setDefault as unknown as ProfileService["setDefault"] }));

    fireEvent.press(screen.getByTestId("profile-setting-exerciseCountdownSecondsDefault"));
    const incrementButton = screen.getByTestId(
      "profile-setting-exerciseCountdownSecondsDefault-increment",
    );
    fireEvent(incrementButton, "pressIn");
    await act(async () => {
      fireEvent(incrementButton, "pressOut");
    });

    await waitFor(() => expect(setDefault).toHaveBeenCalledWith("exerciseCountdownSecondsDefault", 11));
    expect(
      screen.getByTestId("profile-setting-sideChangeRecoverySecondsDefault-value").props.children,
    ).toBe("10 s");
  });

  it("re-reads the Profile after a reopen (relecture après réouverture, useFocusEffect)", async () => {
    const getProfile = jest
      .fn<ProfileService["getProfile"]>()
      .mockResolvedValueOnce(aProfile())
      .mockResolvedValueOnce(aProfile({ exerciseEndSecondsDefault: 9 }));
    await renderScreen(fakeProfileService({ getProfile }));

    expect(screen.getByTestId("profile-setting-exerciseEndSecondsDefault-value").props.children).toBe(
      "5 s",
    );

    await act(async () => {
      focusEffectHarness.effect?.();
    });

    await waitFor(() =>
      expect(screen.getByTestId("profile-setting-exerciseEndSecondsDefault-value").props.children).toBe(
        "9 s",
      ),
    );
  });

  it("toggles a preference immediately via ProfileService.setPreference", async () => {
    const updated = aProfile({ vibrationEnabled: false });
    const setPreference = jest.fn(async () => updated);
    await renderScreen(
      fakeProfileService({ setPreference: setPreference as unknown as ProfileService["setPreference"] }),
    );

    await act(async () => {
      fireEvent(screen.getByTestId("profile-preference-vibrationEnabled-switch"), "valueChange", false);
    });

    expect(setPreference).toHaveBeenCalledWith("vibrationEnabled", false);
    await waitFor(() =>
      expect(screen.getByTestId("profile-preference-vibrationEnabled-switch").props.value).toBe(false),
    );
  });

  /** T7 : aucune demande de permission système n'est faite depuis le Profil ; un état refusé n'affiche jamais Notifications actif. */
  it("never shows Notifications active when the permission is denied, even if the preference itself is enabled", async () => {
    mockGetNotificationPermissionStatus.mockResolvedValueOnce("denied");

    await renderScreen(
      fakeProfileService({ getProfile: jest.fn(async () => aProfile({ notificationsEnabled: true })) }),
    );

    expect(screen.getByTestId("profile-preference-notificationsEnabled-switch").props.value).toBe(
      false,
    );
  });

  it("navigates to Modifier le profil", async () => {
    await renderScreen();

    fireEvent.press(screen.getByLabelText(t.editProfileAction));

    expect(mockPush).toHaveBeenCalledWith("/profile-edit");
  });
});
