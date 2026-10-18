import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react-native";
import type { ComponentType, ReactNode } from "react";

/**
 * PRE-4 (story 1.2, AC5, AD-12, H24) — condition de montage de
 * `MigrationNoticeGate` vérifiée par le RENDU de `RootLayout` : le Gate n'est
 * monté ni pendant le splash applicatif ni tant que la base n'est pas prête ;
 * il l'est, une seule fois, une fois la base prête et le splash retiré.
 * Le Gate est remplacé par un marqueur : son comportement propre est vérifié
 * dans `src/features/migration/__tests__/MigrationNoticeGate.test.tsx`.
 */

jest.mock("expo-router/stack", () => {
  function Stack(props: { children?: ReactNode }) {
    return props.children ?? null;
  }
  Stack.Screen = function StackScreen() {
    return null;
  };
  return { Stack };
});

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("@expo-google-fonts/inter/useFonts", () => ({
  useFonts: () => [true, null],
}));
jest.mock("@expo-google-fonts/inter/400Regular", () => ({ Inter_400Regular: "Inter_400Regular" }));
jest.mock("@expo-google-fonts/inter/500Medium", () => ({ Inter_500Medium: "Inter_500Medium" }));
jest.mock("@expo-google-fonts/inter/600SemiBold", () => ({
  Inter_600SemiBold: "Inter_600SemiBold",
}));
jest.mock("@expo-google-fonts/inter/700Bold", () => ({ Inter_700Bold: "Inter_700Bold" }));

/** Pilote la disponibilité de la base : `onReady` n'est appelé que si vrai. */
let mockDatabaseReady = true;
/** Vrai : la frontière d'erreur signale une erreur racine, sans remplacer ses enfants. */
let mockReportRootError = false;

/**
 * Le provider simulé expose, comme le vrai, `MigrationNoticeRepositoryContext`
 * à ses enfants, avec un repository sentinelle : le marqueur du Gate n'est
 * rendu que s'il lit CE repository, donc s'il est monté sous le provider.
 */
jest.mock("@/features/sessions/SessionServiceProvider", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { MigrationNoticeRepositoryContext } = jest.requireActual<
    typeof import("@/features/sessions/MigrationNoticeRepositoryContext")
  >("@/features/sessions/MigrationNoticeRepositoryContext");
  const mockSentinelRepository = {
    findUnacknowledged: () => Promise.resolve(null),
    acknowledge: () => Promise.resolve(),
  };
  return {
    mockSentinelRepository,
    SessionServiceProvider: ({ children, onReady }: { children: ReactNode; onReady: () => void }) => {
      React.useEffect(() => {
        if (mockDatabaseReady) {
          onReady();
        }
      }, [onReady]);
      return (
        <MigrationNoticeRepositoryContext.Provider value={mockSentinelRepository}>
          {children}
        </MigrationNoticeRepositoryContext.Provider>
      );
    },
  };
});

jest.mock("@/features/migration/MigrationNoticeGate", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  const { MigrationNoticeRepositoryContext } = jest.requireActual<
    typeof import("@/features/sessions/MigrationNoticeRepositoryContext")
  >("@/features/sessions/MigrationNoticeRepositoryContext");
  const { mockSentinelRepository } = jest.requireMock<{ mockSentinelRepository: unknown }>(
    "@/features/sessions/SessionServiceProvider",
  );
  return {
    MigrationNoticeGate: () =>
      React.useContext(MigrationNoticeRepositoryContext) === mockSentinelRepository ? (
        <View testID="migration-notice-gate" />
      ) : null,
  };
});

/** Frontière d'erreur simulée : signale (si demandé) une erreur racine au montage et rend ses enfants. */
jest.mock("@/shared/ui/RootErrorBoundary", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    RootErrorBoundary: ({ children, onError }: { children: ReactNode; onError?: (error: Error) => void }) => {
      React.useEffect(() => {
        if (mockReportRootError) {
          onError?.(new Error("racine"));
        }
      }, [onError]);
      return children;
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const RootLayout = (require("../_layout") as { default: ComponentType }).default;

beforeEach(() => {
  jest.useFakeTimers();
  mockDatabaseReady = true;
  mockReportRootError = false;
});

afterEach(() => {
  jest.useRealTimers();
});

async function advance(ms: number): Promise<void> {
  await act(async () => {
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
  });
}

describe("PRE4-1.2/AC5 — montage du Gate dans RootLayout", () => {
  it("absent pendant le splash applicatif, présent une seule fois après son retrait, base prête", async () => {
    render(<RootLayout />);

    expect(screen.queryByTestId("migration-notice-gate")).toBeNull();
    await advance(1000);
    expect(screen.queryByTestId("migration-notice-gate")).toBeNull();

    // Durée minimale du splash (2 500 ms) puis fondu (300 ms).
    await advance(2500);
    await advance(1000);
    expect(screen.getAllByTestId("migration-notice-gate")).toHaveLength(1);
  });

  it("absent tant que la base n'est pas prête, même après la durée du splash", async () => {
    mockDatabaseReady = false;
    render(<RootLayout />);

    await advance(10000);
    expect(screen.queryByTestId("migration-notice-gate")).toBeNull();
  });

  it("absent quand le splash se retire sur une erreur racine alors que la base n'est pas prête", async () => {
    mockDatabaseReady = false;
    mockReportRootError = true;
    render(<RootLayout />);

    await advance(2500);
    await advance(1000);
    // Le splash est bien retiré (base « réglée » par l'erreur racine)…
    expect(screen.queryByTestId("kodjo-splash")).toBeNull();
    // …mais la base n'est pas prête : aucun Gate.
    expect(screen.queryByTestId("migration-notice-gate")).toBeNull();
  });
});
