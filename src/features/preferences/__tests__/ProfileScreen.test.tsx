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
  // Recette du 11/11/2026 (Hermann : « ni le contenu des préférences ou je vois encore des anciennes entrées ») :
  // Figma `1992:684` — Notifications, Séance (deux réglages) ; plus de bloc identité ni de groupe Exercice.
  // [Remplacé — six réglages, groupes Exercice / Séance.]
  it("Préférences du Figma : Notifications puis Séance (deux réglages, valeurs « 10″ » et « 5″ ») ; anciennes entrées absentes", async () => {
    await renderScreen();

    expect(screen.getByTestId("profile-group-notifications")).toBeTruthy();
    expect(screen.getByTestId("profile-setting-sessionInitialCountdownSecondsDefault-value").props.children).toBe("10″");
    expect(screen.getByTestId("profile-setting-sessionFinalPhaseSecondsDefault-value").props.children).toBe("5″");
    for (const absent of [
      "profile-group-exercise",
      "profile-setting-sideChangeRecoverySecondsDefault",
      "profile-setting-exerciseCountdownSecondsDefault",
      "profile-setting-exerciseEndSecondsDefault",
      "profile-setting-postActivityRecoverySecondsDefault",
      "profile-identity-row",
      "profile-preference-soundsEnabled",
      "profile-preference-vibrationEnabled",
    ]) {
      expect(screen.queryByTestId(absent)).toBeNull();
    }
  });

  it("en-tête du Figma : onglets Profil, Préférences (sélectionné), Communauté (indisponible)", async () => {
    await renderScreen();

    expect(screen.getByTestId("profile-tabs-preferences").props.accessibilityState).toEqual({ selected: true, disabled: false });
    expect(screen.getByTestId("profile-tabs-community").props.accessibilityState).toEqual({ selected: false, disabled: true });
    fireEvent.press(screen.getByTestId("profile-tabs-community"));
    expect(mockPush).not.toHaveBeenCalled();
  });

  // Profil › Préférences (Figma `1992:684`, `12093:25010` ; documentation de main `ebe72f76`) : six annonces vocales
  // actives, Sons et vibrations aux valeurs du design, Notifications inactive.
  // [Remplacé le 11/11/2026 — interrupteurs Sons, Annonces vocales et Vibration.]
  it("Préférences : sections du design, annonces actives, sons et vibrations par défaut, Notifications inactive", async () => {
    await renderScreen();

    for (const announcement of ["session", "names", "phases", "objective", "pauses", "sides"]) {
      expect(screen.getByTestId(`profile-guidance-announcement-${announcement}`).props.accessibilityState).toEqual({ checked: true });
    }
    expect(screen.getByTestId("profile-guidance-event-COUNTDOWN-sound").props.accessibilityValue).toEqual({ text: "Par défaut" });
    expect(screen.getByTestId("profile-guidance-event-EVERY_MINUTES-sound").props.accessibilityValue).toEqual({ text: "Non" });
    expect(screen.getByTestId("profile-guidance-event-CADENCE-vibration").props.value).toBe(false);
    expect(screen.getByTestId("profile-guidance-event-HALF_TIME-vibration").props.value).toBe(true);
    expect(
      screen.getByTestId("profile-preference-notificationsEnabled-switch", { hidden: true }).props
        .value,
    ).toBe(false);
    expect(screen.queryByTestId("profile-preference-soundsEnabled")).toBeNull();
    expect(screen.queryByTestId("profile-preference-vibrationEnabled")).toBeNull();
  });

  it("vibration d'un événement enregistrée immédiatement ; le chevron du son ouvre « Choix d'un son »", async () => {
    const setGuidanceEvent = jest.fn(async () => aProfile());
    await renderScreen(fakeProfileService({ setGuidanceEvent: setGuidanceEvent as unknown as ProfileService["setGuidanceEvent"] }));

    await act(async () => {
      fireEvent(screen.getByTestId("profile-guidance-event-HALF_TIME-vibration"), "valueChange", false);
    });
    expect(setGuidanceEvent).toHaveBeenCalledWith("HALF_TIME", { sound: "DEFAULT", vibration: false });

    fireEvent.press(screen.getByTestId("profile-guidance-event-HALF_TIME-sound"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/profile-sound", params: { event: "HALF_TIME" } });
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

    fireEvent.press(screen.getByTestId("profile-setting-sessionInitialCountdownSecondsDefault"));
    expect(screen.getByTestId("profile-setting-sessionInitialCountdownSecondsDefault-increment")).toBeTruthy();

    fireEvent.press(screen.getByTestId("profile-setting-sessionFinalPhaseSecondsDefault"));
    expect(screen.queryByTestId("profile-setting-sessionInitialCountdownSecondsDefault-increment")).toBeNull();
    expect(screen.getByTestId("profile-setting-sessionFinalPhaseSecondsDefault-increment")).toBeTruthy();
  });

  it("persists a stepper change immediately via ProfileService.setDefault, leaving the other value unchanged (CE-UI-07 L2545, L2557, L2561)", async () => {
    const updated = aProfile({ sessionInitialCountdownSecondsDefault: 11 });
    const setDefault = jest.fn(async () => updated);
    await renderScreen(fakeProfileService({ setDefault: setDefault as unknown as ProfileService["setDefault"] }));

    fireEvent.press(screen.getByTestId("profile-setting-sessionInitialCountdownSecondsDefault"));
    const incrementButton = screen.getByTestId("profile-setting-sessionInitialCountdownSecondsDefault-increment");
    fireEvent(incrementButton, "pressIn");
    await act(async () => {
      fireEvent(incrementButton, "pressOut");
    });

    await waitFor(() => expect(setDefault).toHaveBeenCalledWith("sessionInitialCountdownSecondsDefault", 11));
    expect(screen.getByTestId("profile-setting-sessionFinalPhaseSecondsDefault-value").props.children).toBe("5″");
  });

  it("re-reads the Profile after a reopen (relecture après réouverture, useFocusEffect)", async () => {
    const getProfile = jest
      .fn<ProfileService["getProfile"]>()
      .mockResolvedValueOnce(aProfile())
      .mockResolvedValueOnce(aProfile({ sessionFinalPhaseSecondsDefault: 9 }));
    await renderScreen(fakeProfileService({ getProfile }));

    expect(screen.getByTestId("profile-setting-sessionFinalPhaseSecondsDefault-value").props.children).toBe("5″");

    await act(async () => {
      focusEffectHarness.effect?.();
    });

    await waitFor(() =>
      expect(screen.getByTestId("profile-setting-sessionFinalPhaseSecondsDefault-value").props.children).toBe("9″"),
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

    const row = screen.getByTestId("profile-preference-notificationsEnabled");
    expect(row.props.accessibilityRole).toBe("switch");
    expect(row.props.accessibilityState).toEqual({ checked: false });
    expect(row.props.accessibilityLabel).toBe(t.notifications.label);
    const announcement = screen.getByTestId("profile-guidance-announcement-names");
    expect(announcement.props.accessibilityRole).toBe("switch");
    expect(announcement.props.accessibilityLabel).toBe(strings.screens.soundGuidance.announcements.names);

    // Le `Switch` natif et son libellé texte sont retirés de l'arbre
    // d'accessibilité par défaut — la requête standard (sans `hidden: true`)
    // ne doit donc plus les exposer comme des éléments distincts.
    expect(screen.queryByTestId("profile-preference-notificationsEnabled-switch")).toBeNull();
    expect(screen.queryByTestId("profile-guidance-announcement-names-switch")).toBeNull();
  });

  // Section Profil non développée (Hermann, 11/11/2026) : l'onglet Profil ouvre l'écran existant Modifier le profil.
  // [Remplacé — bloc Identité et action Modifier le profil en tête de l'écran.]
  it("onglet Profil : ouvre Modifier le profil", async () => {
    await renderScreen();

    fireEvent.press(screen.getByTestId("profile-tabs-profile"));

    expect(mockPush).toHaveBeenCalledWith("/profile-edit");
  });

  /** D-267 (CE-UI-07 L2532) : un séparateur entre deux lignes consécutives d'un même groupe, jamais avant la première ni après la dernière. */
  it("renders a separator between each pair of consecutive rows, never before the first or after the last", async () => {
    await renderScreen();

    // Séance : 2 lignes → 1 séparateur (Figma `1992:684`). [Exercice/Séance : 3 lignes — remplacé le 11/11/2026.]
    const expectedDividerCountByGroup: Record<string, number> = {
      "profile-group-session": 1,
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
    ).toBe("70″");

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
