import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Alert, type AlertButton } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { AccountLink, AccountService, GateState, SignInOutcome } from "@/domain/account/AccountService";
import { AccountGate } from "@/features/account/AccountGate";
import { AccountSection } from "@/features/account/AccountSection";
import { AccountGateRefreshContext, AccountServiceContext } from "@/features/account/AccountServiceContext";
import { SignInScreen } from "@/features/account/SignInScreen";
import { strings } from "@/shared/i18n";

jest.mock("expo-network", () => ({ getNetworkStateAsync: jest.fn(async () => ({ isConnected: true })) }));
jest.mock("expo-apple-authentication", () => {
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    AppleAuthenticationButtonType: { CONTINUE: 1 },
    AppleAuthenticationButtonStyle: { BLACK: 2 },
    AppleAuthenticationButton: ({ onPress }: { onPress: () => void }) => (
      <Pressable onPress={onPress} testID="sign-in-apple-native">
        <Text>apple</Text>
      </Pressable>
    ),
  };
});

const t = strings.account;
const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

const LINK: AccountLink = {
  authUserId: "auth-x",
  provider: "apple",
  providerSubject: "sub-x",
  email: "abc@privaterelay.appleid.com",
  emailIsPrivateRelay: true,
  givenName: "Hermann",
  familyName: "Adjou",
  catalogueId: "cat",
  linkedAt: "t",
};

function fakeService(overrides: Partial<Record<keyof AccountService, unknown>> = {}): AccountService {
  return {
    gate: jest.fn(async (): Promise<GateState> => ({ kind: "open" })),
    getLink: jest.fn(async () => LINK),
    signIn: jest.fn(async (): Promise<SignInOutcome> => ({ kind: "linked" })),
    deleteAccount: jest.fn(async () => "deleted"),
    resumePendingDeletion: jest.fn(async () => "none"),
    checkSession: jest.fn(async () => "ok"),
    ...overrides,
  } as unknown as AccountService;
}

function wrap(service: AccountService, children: ReactNode, refresh: () => void = () => undefined) {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <AccountServiceContext.Provider value={service}>
        <AccountGateRefreshContext.Provider value={refresh}>{children}</AccountGateRefreshContext.Provider>
      </AccountServiceContext.Provider>
    </SafeAreaProvider>
  );
}

let alertSpy: jest.SpiedFunction<typeof Alert.alert>;
beforeEach(() => {
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});
afterEach(() => {
  alertSpy.mockRestore();
});

describe("É1 — écran de connexion", () => {
  it("textes validés ; variante installation existante", () => {
    const service = fakeService();
    const { rerender } = render(wrap(service, <SignInScreen existingInstallation={false} onLinked={() => undefined} />));
    expect(screen.getByText(t.signIn.title)).toBeTruthy();
    expect(screen.getByText(t.signIn.body)).toBeTruthy();
    rerender(wrap(service, <SignInScreen existingInstallation onLinked={() => undefined} />));
    expect(screen.getByText(t.signIn.bodyExistingInstallation)).toBeTruthy();
  });

  it("Google : connexion puis ouverture de l'application", async () => {
    const onLinked = jest.fn();
    const service = fakeService();
    render(wrap(service, <SignInScreen existingInstallation={false} onLinked={onLinked} />));
    await act(async () => {
      fireEvent.press(screen.getByTestId("sign-in-google"));
    });
    expect(service.signIn).toHaveBeenCalledWith("google");
    expect(onLinked).toHaveBeenCalled();
  });

  it("sans réseau : message de É1, aucune tentative", async () => {
    const network = jest.requireMock<{ getNetworkStateAsync: jest.Mock }>("expo-network");
    network.getNetworkStateAsync.mockImplementationOnce(async () => ({ isConnected: false }));
    const service = fakeService();
    render(wrap(service, <SignInScreen existingInstallation={false} onLinked={() => undefined} />));
    await act(async () => {
      fireEvent.press(screen.getByTestId("sign-in-google"));
    });
    expect(screen.getByText(t.signIn.offline)).toBeTruthy();
    expect(service.signIn).not.toHaveBeenCalled();
  });

  it("annulation : silencieuse ; erreur : alerte native", async () => {
    const service = fakeService({ signIn: jest.fn(async () => ({ kind: "cancelled" })) });
    render(wrap(service, <SignInScreen existingInstallation={false} onLinked={() => undefined} />));
    await act(async () => {
      fireEvent.press(screen.getByTestId("sign-in-google"));
    });
    expect(alertSpy).not.toHaveBeenCalled();
    (service.signIn as jest.Mock).mockImplementationOnce(async () => ({ kind: "error" }));
    await act(async () => {
      fireEvent.press(screen.getByTestId("sign-in-google"));
    });
    expect(alertSpy).toHaveBeenCalledWith(t.signIn.errorTitle, t.signIn.error, expect.any(Array));
  });

  it("É4 (R4) : fournisseur et e-mail du compte rattaché ; É4-R5 : sans fournisseur ni e-mail", async () => {
    const service = fakeService({
      signIn: jest.fn(async () => ({ kind: "refused_other_account", provider: "apple", email: "x@example.com" })),
    });
    render(wrap(service, <SignInScreen existingInstallation onLinked={() => undefined} />));
    await act(async () => {
      fireEvent.press(screen.getByTestId("sign-in-google"));
    });
    expect(alertSpy).toHaveBeenLastCalledWith(t.refusedOtherAccount.title, t.refusedOtherAccount.message("Apple", "x@example.com"), expect.any(Array));
    (service.signIn as jest.Mock).mockImplementationOnce(async () => ({ kind: "refused_deleted_account" }));
    await act(async () => {
      fireEvent.press(screen.getByTestId("sign-in-google"));
    });
    expect(alertSpy).toHaveBeenLastCalledWith(t.refusedDeletedAccount.title, t.refusedDeletedAccount.message, expect.any(Array));
    expect(t.refusedDeletedAccount.message).not.toContain("x@example.com");
  });
});

describe("É2 — section Compte", () => {
  it("fournisseur, nom, e-mail et mention de l'adresse masquée ; pseudo public grisé", async () => {
    render(wrap(fakeService(), <AccountSection />));
    expect(await screen.findByText(t.section.connectedWith.apple)).toBeTruthy();
    expect(screen.getByTestId("account-name").props.children).toBe("Hermann Adjou");
    expect(screen.getByText(LINK.email!)).toBeTruthy();
    expect(screen.getByText(t.section.privateRelay)).toBeTruthy();
    expect(screen.getByTestId("account-public-name").props.accessibilityState).toEqual({ disabled: true });
    expect(screen.queryByText(/se d[ée]connecter/i)).toBeNull();
  });

  it("nom absent : ligne non affichée, aucune valeur inventée", async () => {
    const service = fakeService({ getLink: jest.fn(async () => ({ ...LINK, givenName: null, familyName: null, emailIsPrivateRelay: false })) });
    render(wrap(service, <AccountSection />));
    await screen.findByTestId("account-provider");
    expect(screen.queryByTestId("account-name")).toBeNull();
    expect(screen.queryByTestId("account-email-relay")).toBeNull();
  });

  it("É3 : confirmation native ; Supprimer → suppression puis réévaluation de la porte", async () => {
    const refresh = jest.fn();
    const service = fakeService();
    render(wrap(service, <AccountSection />, refresh));
    fireEvent.press(await screen.findByTestId("account-delete"));
    const [title, message, buttons] = alertSpy.mock.calls[0] as [string, string, AlertButton[]];
    expect(title).toBe(t.deletion.title);
    expect(message).toContain("y compris les photos et vidéos déjà téléchargées");
    expect(buttons.map((button) => button.style)).toEqual(["cancel", "destructive"]);
    await act(async () => {
      buttons[1].onPress?.();
    });
    expect(service.deleteAccount).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it("É3 sans réseau : message dédié, porte inchangée", async () => {
    const refresh = jest.fn();
    const service = fakeService({ deleteAccount: jest.fn(async () => "offline") });
    render(wrap(service, <AccountSection />, refresh));
    fireEvent.press(await screen.findByTestId("account-delete"));
    const buttons = alertSpy.mock.calls[0][2] as AlertButton[];
    await act(async () => {
      buttons[1].onPress?.();
    });
    expect(alertSpy).toHaveBeenLastCalledWith(t.deletion.title, t.deletion.offline, expect.any(Array));
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("porte d'entrée", () => {
  it("lien présent : contenu de l'application ; sinon É1", async () => {
    const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
    const open = fakeService();
    const { unmount } = render(wrap(open, <AccountGate><Text>app</Text></AccountGate>));
    expect(await screen.findByText("app")).toBeTruthy();
    unmount();
    const closed = fakeService({ gate: jest.fn(async () => ({ kind: "sign_in", existingInstallation: true })) });
    render(wrap(closed, <AccountGate><Text>app</Text></AccountGate>));
    expect(await screen.findByTestId("sign-in-screen")).toBeTruthy();
    expect(screen.queryByText("app")).toBeNull();
    await waitFor(() => expect(closed.checkSession).toHaveBeenCalled());
  });
});
