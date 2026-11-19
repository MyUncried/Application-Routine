import { describe, expect, it } from "@jest/globals";

import { popoverPosition } from "@/features/planning/PlanningWheelPopover";

/**
 * Position des popovers de la planification (recette du 19/11/2026, k13 / e2 : « la roulette s'affiche en bas à droite et
 * est tronquée ») : sous le champ s'il y tient, sinon au-dessus ; jamais hors de l'écran.
 */
const screenRect = { width: 402, height: 874, top: 59, bottom: 34 };

describe("popoverPosition", () => {
  it("sous le champ quand le panneau y tient", () => {
    expect(popoverPosition({ x: 100, y: 300, width: 40, height: 32 }, { width: 160, height: 232 }, screenRect)).toEqual({ left: 40, top: 338 });
  });

  it("au-dessus du champ quand il ne tient pas dessous (Rappel « Autre », en bas de l'écran)", () => {
    const position = popoverPosition({ x: 300, y: 760, width: 70, height: 32 }, { width: 320, height: 232 }, screenRect);
    expect(position.top).toBe(760 - 6 - 232);
    // Bord droit : le panneau reste dans la marge de 16.
    expect(position.left).toBe(402 - 16 - 320);
  });

  it("ni dessous ni dessus : collé au bas de la zone utile, sans sortir de l'écran", () => {
    const position = popoverPosition({ x: 100, y: 300, width: 40, height: 32 }, { width: 360, height: 700 }, screenRect);
    expect(position.top).toBeGreaterThanOrEqual(59);
    expect(position.top + 700).toBeLessThanOrEqual(874 - 34);
  });
});
