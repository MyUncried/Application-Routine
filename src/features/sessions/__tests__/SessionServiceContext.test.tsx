import { render } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { useEffect } from "react";
import { Text } from "react-native";

import {
  SessionServiceContext,
  useSessionService,
} from "@/features/sessions/SessionServiceContext";
import type { SessionService } from "@/features/sessions/SessionService";

// Ce fichier n'importe que SessionServiceContext.tsx — jamais
// SessionServiceProvider.tsx — afin qu'aucun module `expo-sqlite` ne soit
// chargé pour ces tests du contrat contexte/hook.

function Probe() {
  useSessionService();
  return null;
}

describe("useSessionService", () => {
  it("throws an explicit error when used outside a SessionServiceProvider", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Probe />)).toThrow(
        "useSessionService must be used within a SessionServiceProvider.",
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("returns exactly the service supplied by the context", () => {
    const fakeService = {} as SessionService;
    const onCapture = jest.fn();

    function Capture() {
      const service = useSessionService();
      // Communiquer la valeur hors du rendu via un effet : muter une
      // variable externe pendant le rendu serait un effet de bord impur.
      useEffect(() => {
        onCapture(service);
      }, [service]);
      return <Text>captured</Text>;
    }

    render(
      <SessionServiceContext.Provider value={fakeService}>
        <Capture />
      </SessionServiceContext.Provider>,
    );

    // `toHaveBeenCalledWith` effectue une égalité structurelle (comme
    // `toEqual`) : avec un objet vide, elle passerait même si une autre
    // instance était retournée. La preuve d'identité exigée ici (« reçoit
    // exactement la même instance ») nécessite une égalité référentielle
    // explicite (`Object.is`, via `toBe`) sur l'argument effectivement reçu.
    expect(onCapture).toHaveBeenCalledTimes(1);
    expect(onCapture.mock.calls[0]?.[0]).toBe(fakeService);
  });
});
