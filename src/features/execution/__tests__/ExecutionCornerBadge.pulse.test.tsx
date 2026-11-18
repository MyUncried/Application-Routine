import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { ExecutionCornerBadge } from "../ExecutionCornerBadge";

/**
 * Troisième recette du 17/11/2026 (Hermann, autres remarques, d : « pendant le compte à rebours du For Time en durée (3 secondes), faire
 * clignoter le triangle du compte à rebours à chaque seconde (vert actuel > vert plus foncé > vert actuel) ») : couche plus foncée posée
 * sur le coin, rejouée à chaque seconde (`pulse.key`). L'écran la demande pendant les 3 dernières secondes d'une durée en cours.
 */
describe("Coin du décompte : clignotement", () => {
  it("avec `pulse`, une couche de clignotement ; sans, aucune", () => {
    render(
      <ExecutionCornerBadge side="left" vertical="bottom" areaWidth={398} pulse={{ key: 3, color: "#7FD39A" }}>
        <Text>00:03</Text>
      </ExecutionCornerBadge>,
    );
    expect(screen.getByTestId("execution-corner-pulse")).toBeTruthy();
    screen.unmount();
    render(
      <ExecutionCornerBadge side="left" vertical="bottom" areaWidth={398}>
        <Text>00:04</Text>
      </ExecutionCornerBadge>,
    );
    expect(screen.queryByTestId("execution-corner-pulse")).toBeNull();
  });
});
