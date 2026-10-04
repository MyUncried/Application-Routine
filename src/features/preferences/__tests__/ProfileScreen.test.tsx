import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import { createDefaultProfile, type Profile } from "@/domain/preferences/Profile";
import { ProfileScreen } from "@/features/preferences/ProfileScreen";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { strings } from "@/shared/i18n";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
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

    // R10 : le `Switch` natif est retiré de l'arbre d'accessibilité (la ligne
    // elle-même, un `Pressable` de rôle `switch`, porte le nom et l'état) —
    // `hidden: true` l'inclut néanmoins dans cette requête technique directe.
    expect(
      screen.getByTestId("profile-preference-soundsEnabled-switch", { hidden: true }).props.value,
    ).toBe(true);
    expect(
      screen.getByTestId("profile-preference-voiceAnnouncementsEnabled-switch", { hidden: true })
        .props.value,
    ).toBe(true);
    expect(
      screen.getByTestId("profile-preference-vibrationEnabled-switch", { hidden: true }).props.value,
    ).toBe(true);
    expect(
      screen.getByTestId("profile-preference-notificationsEnabled-switch", { hidden: true }).props
        .value,
    ).toBe(false);
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
      fireEvent(
        screen.getByTestId("profile-preference-vibrationEnabled-switch", { hidden: true }),
        "valueChange",
        false,
      );
    });

    expect(setPreference).toHaveBeenCalledWith("vibrationEnabled", false);
    await waitFor(() =>
      expect(
        screen.getByTestId("profile-preference-vibrationEnabled-switch", { hidden: true }).props.value,
      ).toBe(false),
    );
  });

  /** T7 : aucune demande de permission système n'est faite depuis le Profil ; un état refusé n'affiche jamais Notifications actif. */
  it("never shows Notifications active when the permission is denied, even if the preference itself is enabled", async () => {
    mockGetNotificationPermissionStatus.mockResolvedValueOnce("denied");

    await renderScreen(
      fakeProfileService({ getProfile: jest.fn(async () => aProfile({ notificationsEnabled: true })) }),
    );

    expect(
      screen.getByTestId("profile-preference-notificationsEnabled-switch", { hidden: true }).props
        .value,
    ).toBe(false);
  });

  /** R10 (CE-UI-07 L2568) : chaque ligne d'interrupteur forme un SEUL élément accessible de rôle interrupteur, nommé et dont l'état est annoncé. */
  it("exposes each preference row as a single accessible switch element (name + checked state)", async () => {
    await renderScreen();

    const row = screen.getByTestId("profile-preference-vibrationEnabled");
    expect(row.props.accessibilityRole).toBe("switch");
    expect(row.props.accessibilityState).toEqual({ checked: true });
    expect(row.props.accessibilityLabel).toBe(t.preferencesSwitches.vibration);

    // Le `Switch` natif et son libellé texte sont retirés de l'arbre
    // d'accessibilité par défaut — la requête standard (sans `hidden: true`)
    // ne doit donc plus les exposer comme des éléments distincts.
    expect(screen.queryByTestId("profile-preference-vibrationEnabled-switch")).toBeNull();
  });

  it("navigates to Modifier le profil", async () => {
    await renderScreen();

    fireEvent.press(screen.getByLabelText(t.editProfileAction));

    expect(mockPush).toHaveBeenCalledWith("/profile-edit");
  });

  /** R1 (CE-UI-07 L2522) : bloc Identité en tête — initiales de repli, nom non renseigné, action Modifier. */
  it("shows an identity block (initials fallback + unset-name label) before the groups, with the edit action", async () => {
    await renderScreen(fakeProfileService({ getProfile: jest.fn(async () => aProfile({ displayName: "Ada Lovelace" })) }));

    expect(screen.getByTestId("profile-identity-avatar-initials").props.children).toBe("AL");
    expect(screen.getByTestId("profile-identity-name").props.children).toBe("Ada Lovelace");
    expect(screen.queryByTestId("profile-identity-avatar-image")).toBeNull();
    expect(screen.getByTestId("profile-identity-edit-action")).toBeTruthy();
  });

  it("shows the unset-display-name placeholder when no name was ever saved (T8)", async () => {
    await renderScreen();

    expect(screen.getByTestId("profile-identity-name").props.children).toBe(
      t.identity.unsetDisplayNameAccessibilityLabel,
    );
  });

  /** D-267 (CE-UI-07 L2532) : un séparateur entre deux lignes consécutives d'un même groupe, jamais avant la première ni après la dernière. */
  it("renders a separator between each pair of consecutive rows, never before the first or after the last", async () => {
    await renderScreen();

    // Exercice/Séance : 3 lignes → 2 séparateurs. Préférences : 4 lignes → 3 séparateurs.
    const expectedDividerCountByGroup: Record<string, number> = {
      "profile-group-exercise": 2,
      "profile-group-session": 2,
      "profile-group-preferences": 3,
    };
    for (const [groupTestID, dividerCount] of Object.entries(expectedDividerCountByGroup)) {
      expect(screen.queryByTestId(`${groupTestID}-divider-0`)).toBeNull();
      for (let index = 1; index <= dividerCount; index += 1) {
        expect(screen.getByTestId(`${groupTestID}-divider-${index}`)).toBeTruthy();
      }
      expect(screen.queryByTestId(`${groupTestID}-divider-${dividerCount + 1}`)).toBeNull();
    }
  });

  /** CE-UI-07 L2536 (R1) : marge finale défilante = hauteur de la navigation + 16. */
  it("reserves a bottom scroll margin equal to the navigation bar height plus 16", async () => {
    await renderScreen();

    const scrollView = screen.getByTestId("profile-screen-body");
    const contentStyle = Array.isArray(scrollView.props.contentContainerStyle)
      ? Object.assign({}, ...scrollView.props.contentContainerStyle)
      : scrollView.props.contentContainerStyle;
    expect(contentStyle.paddingBottom).toBe(navigationBarTotalHeight() + 16);
  });

  /**
   * D-265 (D-256 L417) : une valeur de Compte à rebours initial/Fin de
   * séance déjà enregistrée au-delà de 60 s est affichée et conservée
   * exacte ; `+` est inactif ; `−` la ramène d'abord à 60 s.
   */
  it("displays a stored Session default above 60 s exactly, disables +, and steps − down to 60 first (D-265)", async () => {
    const setDefault = jest.fn(async () => aProfile({ sessionFinalPhaseSecondsDefault: 60 }));
    await renderScreen(
      fakeProfileService({
        getProfile: jest.fn(async () => aProfile({ sessionFinalPhaseSecondsDefault: 70 })),
        setDefault: setDefault as unknown as ProfileService["setDefault"],
      }),
    );

    expect(
      screen.getByTestId("profile-setting-sessionFinalPhaseSecondsDefault-value").props.children,
    ).toBe("70 s");

    fireEvent.press(screen.getByTestId("profile-setting-sessionFinalPhaseSecondsDefault"));
    expect(
      screen.getByTestId("profile-setting-sessionFinalPhaseSecondsDefault-increment").props
        .accessibilityState,
    ).toEqual({ disabled: true });

    const decrementButton = screen.getByTestId(
      "profile-setting-sessionFinalPhaseSecondsDefault-decrement",
    );
    fireEvent(decrementButton, "pressIn");
    await act(async () => {
      fireEvent(decrementButton, "pressOut");
    });

    await waitFor(() =>
      expect(setDefault).toHaveBeenCalledWith("sessionFinalPhaseSecondsDefault", 60),
    );
  });

  /** CE-UI-07 L2556 ; C08 L1103 : quitter le Profil n'ouvre jamais de garde de sortie, chaque réglage étant déjà enregistré. */
  it("never renders an exit-confirmation dialog (no exit guard on this screen)", async () => {
    await renderScreen();

    expect(screen.queryByText(/Abandonner/)).toBeNull();
  });
});
