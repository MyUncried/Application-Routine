import { describe, expect, it } from "@jest/globals";

import { openPeriodSelection, pressPeriodDate } from "@/features/programs/periodSelection";

/** D-563 (`docs/KODJO-Programme-recette-2026-11-23.md` § 3) : période choisie dans un seul calendrier, en deux appuis. */
describe("période d'un programme — sélection en deux appuis (D-563)", () => {
  it("1. début : un appui sélectionne, un autre déplace, un second appui sur la même date confirme", () => {
    let state = openPeriodSelection("START", null, null);
    let step = pressPeriodDate(state, "2030-08-05");
    expect(step).toEqual({ state: { phase: "START", selected: "2030-08-05", start: null, end: null }, write: {}, close: false });
    step = pressPeriodDate(step.state, "2030-08-07");
    expect(step.state.selected).toBe("2030-08-07");
    expect(step.write).toEqual({});
    step = pressPeriodDate(step.state, "2030-08-07");
    expect(step.state).toEqual({ phase: "END", selected: null, start: "2030-08-07", end: null });
    expect(step.write).toEqual({ startDate: "2030-08-07" });
    state = step.state;
    // 2. fin : sélectionnée (écrite aussitôt, règle 3), puis confirmée par un second appui — fermeture.
    step = pressPeriodDate(state, "2030-09-30");
    expect(step.write).toEqual({ endDate: "2030-09-30" });
    expect(step.close).toBe(false);
    step = pressPeriodDate(step.state, "2030-10-02");
    expect(step.write).toEqual({ endDate: "2030-10-02" });
    step = pressPeriodDate(step.state, "2030-10-02");
    expect(step).toMatchObject({ write: {}, close: true });
  });

  it("4. un appui avant le début confirmé recommence la sélection du début", () => {
    const state = openPeriodSelection("END", "2030-08-07", "2030-09-30");
    const step = pressPeriodDate(state, "2030-08-01");
    expect(step.state).toEqual({ phase: "START", selected: "2030-08-01", start: "2030-08-07", end: "2030-09-30" });
    expect(step.write).toEqual({});
    // Confirmé : la fin, postérieure, est gardée.
    const confirmed = pressPeriodDate(step.state, "2030-08-01");
    expect(confirmed.write).toEqual({ startDate: "2030-08-01" });
    expect(confirmed.state).toEqual({ phase: "END", selected: "2030-09-30", start: "2030-08-01", end: "2030-09-30" });
  });

  it("début confirmé après la fin : la fin, devenue antérieure, est effacée", () => {
    const state = openPeriodSelection("START", "2030-08-01", "2030-08-10");
    const step = pressPeriodDate(pressPeriodDate(state, "2030-08-20").state, "2030-08-20");
    expect(step.write).toEqual({ startDate: "2030-08-20", endDate: null });
    expect(step.state).toEqual({ phase: "END", selected: null, start: "2030-08-20", end: null });
  });

  it("6. « au » ouvre avec le début déjà confirmé : un second appui sur la fin affichée confirme et ferme", () => {
    const state = openPeriodSelection("END", "2030-08-01", "2030-09-30");
    expect(state).toEqual({ phase: "END", selected: "2030-09-30", start: "2030-08-01", end: "2030-09-30" });
    expect(pressPeriodDate(state, "2030-09-30").close).toBe(true);
    // Sans début, « au » commence par le début.
    expect(openPeriodSelection("END", null, null).phase).toBe("START");
  });
});
