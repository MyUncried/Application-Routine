import { act, render } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { ExecutionServiceContext } from "@/features/execution/ExecutionServiceContext";
import { ReminderOpenGate } from "@/features/planning/ReminderOpenGate";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function fakePort() {
  let listener: ((sessionId: string) => void) | null = null;
  const unsubscribe = jest.fn();
  return {
    port: {
      onReminderOpened: (next: (sessionId: string) => void) => {
        listener = next;
        return unsubscribe;
      },
    },
    tap: (sessionId: string) => act(() => listener!(sessionId)),
    unsubscribe,
  };
}

describe("ReminderOpenGate (RM-054b, décision du 18/11/2026)", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("toucher un rappel ouvre l'écran d'Exécution de sa Séance, sans la démarrer", () => {
    const { port, tap } = fakePort();
    render(<ReminderOpenGate notifications={port} />);
    tap("s2");
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/execution", params: { sessionId: "s2" } });
  });

  it("une Exécution déjà ouverte n'est pas quittée", () => {
    const { port, tap } = fakePort();
    const execution = { service: { current: () => ({ executionId: "x" }) } };
    render(
      <ExecutionServiceContext.Provider value={execution as never}>
        <ReminderOpenGate notifications={port} />
      </ExecutionServiceContext.Provider>,
    );
    tap("s2");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("se désabonne au démontage", () => {
    const { port, unsubscribe } = fakePort();
    render(<ReminderOpenGate notifications={port} />).unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
