import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { UpdatesDiagnosticScreen } from "../UpdatesDiagnosticScreen";

const mockCheck = jest.fn<() => Promise<unknown>>();
const mockReadLogs = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.mock("expo-router", () => ({
  useRouter: () => ({ canGoBack: () => true, back: jest.fn(), replace: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { nativeAppVersion: "1.0.0", nativeBuildVersion: "8" },
}));

jest.mock("expo-updates", () => ({
  updateId: "01a12fae-53ec-72ca-b260-4e89a5f74e96",
  isEmbeddedLaunch: false,
  createdAt: new Date("2026-10-12T10:35:16.332Z"),
  isEmergencyLaunch: true,
  emergencyLaunchReason: "launch failed",
  channel: "review",
  runtimeVersion: "1.1.0",
  isEnabled: true,
  checkAutomatically: "ON_LOAD",
  useUpdates: () => ({
    lastCheckForUpdateTimeSinceRestart: undefined,
    availableUpdate: undefined,
    downloadedUpdate: undefined,
    isUpdatePending: false,
    checkError: new Error("network down"),
    downloadError: undefined,
  }),
  readLogEntriesAsync: (...args: unknown[]) => mockReadLogs(...args),
  checkForUpdateAsync: () => mockCheck(),
}));

describe("UpdatesDiagnosticScreen (blocage OTA-NON-APPLIQUEE)", () => {
  beforeEach(() => {
    mockCheck.mockReset();
    mockReadLogs.mockReset();
  });

  it("affiche l’identifiant exécuté, la nature du lancement, les erreurs et le journal", async () => {
    mockReadLogs.mockResolvedValueOnce([
      { timestamp: Date.parse("2026-10-12T12:00:00Z"), level: "error", code: "UpdateFailedToLoad", message: "boom", updateId: "x" },
    ]);
    render(<UpdatesDiagnosticScreen />);
    await act(async () => {});

    expect(screen.getByTestId("updates-diagnostic-Mise à jour exécutée")).toHaveTextContent("01a12fae-53ec-72ca-b260-4e89a5f74e96");
    expect(screen.getByTestId("updates-diagnostic-Lancement")).toHaveTextContent("mise à jour OTA");
    expect(screen.getByTestId("updates-diagnostic-Lancement d’urgence")).toHaveTextContent("oui — launch failed");
    expect(screen.getByTestId("updates-diagnostic-Build")).toHaveTextContent("1.0.0 (8)");
    expect(screen.getByTestId("updates-diagnostic-Erreur de vérification")).toHaveTextContent("network down");
    expect(mockReadLogs).toHaveBeenCalledWith(7 * 24 * 60 * 60 * 1000);
    expect(screen.getByTestId("updates-diagnostic-log")).toHaveTextContent(/^2026-10-12T12:00:00\.000Z error UpdateFailedToLoad \[x\] boom$/);
  });

  it("la vérification manuelle interroge le serveur et affiche le résultat ou l’erreur", async () => {
    mockReadLogs.mockResolvedValue([]);
    render(<UpdatesDiagnosticScreen />);
    await act(async () => {});

    mockCheck.mockResolvedValueOnce({ isAvailable: true, manifest: { id: "01a1-next" } });
    await act(async () => fireEvent.press(screen.getByTestId("updates-diagnostic-check")));
    expect(screen.getByTestId("updates-diagnostic-check-result")).toHaveTextContent("Mise à jour disponible : 01a1-next");

    mockCheck.mockRejectedValueOnce(new Error("timeout"));
    await act(async () => fireEvent.press(screen.getByTestId("updates-diagnostic-check")));
    expect(screen.getByTestId("updates-diagnostic-check-result")).toHaveTextContent("Erreur : timeout");
  });
});
