import { render } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { useEffect } from "react";
import { Text } from "react-native";

import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import {
  SessionDraftContext,
  useSessionDraft,
  type SessionDraftContextValue,
} from "@/features/sessions/SessionDraftContext";

// N'importe que SessionDraftContext.tsx — jamais SessionDraftProvider.tsx —
// même principe que SessionServiceContext.test.tsx : ces tests portent
// uniquement sur le contrat contexte/hook.

function Probe() {
  useSessionDraft();
  return null;
}

function aContextValue(overrides: Partial<SessionDraftContextValue> = {}): SessionDraftContextValue {
  return {
    draft: createEmptyDraft(),
    updateDraft: jest.fn(),
    resetDraft: jest.fn(),
    ...overrides,
  };
}

describe("useSessionDraft", () => {
  it("throws an explicit error when used outside a SessionDraftProvider", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Probe />)).toThrow(
        "useSessionDraft must be used within a SessionDraftProvider.",
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("returns exactly the value supplied by the context (referential identity)", () => {
    const value = aContextValue();
    const onCapture = jest.fn();

    function Capture() {
      const received = useSessionDraft();
      useEffect(() => {
        onCapture(received);
      }, [received]);
      return <Text>captured</Text>;
    }

    render(
      <SessionDraftContext.Provider value={value}>
        <Capture />
      </SessionDraftContext.Provider>,
    );

    expect(onCapture).toHaveBeenCalledTimes(1);
    expect(onCapture.mock.calls[0]?.[0]).toBe(value);
  });

  it("exposes the draft field supplied by the context", () => {
    const draft: SessionDraft = { ...createEmptyDraft(), name: "Séance simple" };
    const onCapture = jest.fn();

    function Capture() {
      const { draft: received } = useSessionDraft();
      useEffect(() => {
        onCapture(received);
      }, [received]);
      return <Text>captured</Text>;
    }

    render(
      <SessionDraftContext.Provider value={aContextValue({ draft })}>
        <Capture />
      </SessionDraftContext.Provider>,
    );

    expect(onCapture.mock.calls[0]?.[0]).toBe(draft);
  });

  /**
   * V2-PRE-2 (plan §6.1/§7, T18) : `creationBaseline` — brouillon de
   * création RÉELLEMENT initialisé (valeurs du Profil) — est un champ
   * optionnel de transition, exposé sans altération, exactement comme
   * `hydratedBaseline` (T01-S10).
   */
  it("exposes the creationBaseline field supplied by the context, undefined when the provider omits it", () => {
    const creationBaseline: SessionDraft = {
      ...createEmptyDraft(),
      initialCountdownSeconds: 30,
      finalPhaseSeconds: 20,
    };
    const onCapture = jest.fn();

    function Capture() {
      const { creationBaseline: received } = useSessionDraft();
      useEffect(() => {
        onCapture(received);
      }, [received]);
      return <Text>captured</Text>;
    }

    render(
      <SessionDraftContext.Provider value={aContextValue({ creationBaseline })}>
        <Capture />
      </SessionDraftContext.Provider>,
    );

    expect(onCapture.mock.calls[0]?.[0]).toBe(creationBaseline);

    onCapture.mockClear();
    render(
      <SessionDraftContext.Provider value={aContextValue()}>
        <Capture />
      </SessionDraftContext.Provider>,
    );

    expect(onCapture.mock.calls[0]?.[0]).toBeUndefined();
  });
});
