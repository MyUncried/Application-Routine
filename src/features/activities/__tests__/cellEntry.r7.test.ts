import { describe, expect, it } from "@jest/globals";

import { EXECUTION_BOUNDS } from "@/domain/activities/ExecutionParameters";
import { cellDurationSeconds, cellPhaseDurationSeconds } from "@/features/activities/cellEntry";

/** PRE-7 story R-7 (D-448, point 6) — sortie d'une cellule de durée de phase. */
describe("R-7 — cellPhaseDurationSeconds", () => {
  const bounds = EXECUTION_BOUNDS.durationTarget;

  it("0 s saisi reste 0 s (« 0 », « 0000 ») ; vide → `null` ; bornes hautes et report des secondes inchangés", () => {
    expect(cellPhaseDurationSeconds("0", bounds)).toBe(0);
    expect(cellPhaseDurationSeconds("0000", bounds)).toBe(0);
    expect(cellPhaseDurationSeconds("", bounds)).toBeNull();
    expect(cellPhaseDurationSeconds("175", bounds)).toBe(135);
    expect(cellPhaseDurationSeconds("9999", bounds)).toBe(bounds.max);
  });

  it("la cellule Cible garde son minimum : 0 → 1 s", () => {
    expect(cellDurationSeconds("0", bounds)).toBe(bounds.min);
  });
});
