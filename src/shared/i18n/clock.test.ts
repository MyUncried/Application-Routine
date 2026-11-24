import { describe, expect, it } from "@jest/globals";

import { planTimeLabel } from "@/features/planning/planWeek";

import { planning as enPlanning } from "./resources/enPlanning";
import { programs as enPrograms } from "./resources/enPrograms";
import { planning as frPlanning } from "./resources/frPlanning";
import { programs as frPrograms } from "./resources/frPrograms";

describe("J1.8 — heures (anglais sur 12 heures avec AM / PM, demande de Hermann du 24/11/2026)", () => {
  it("anglais : AM / PM, minuit 12:00 AM, midi 12:00 PM", () => {
    expect(enPlanning.time.compact(18, "30")).toBe("6:30 PM");
    expect(enPlanning.time.compact(8, "05")).toBe("8:05 AM");
    expect(enPlanning.time.compactHour(0)).toBe("12:00 AM");
    expect(enPlanning.time.spokenHour(12)).toBe("12:00 PM");
    expect(enPrograms.dates.hour(14)).toBe("2:00 PM");
    expect(enPrograms.dates.hourMinutes(9, "45")).toBe("9:45 AM");
  });

  it("français : inchangé", () => {
    expect(frPlanning.time.compact(18, "30")).toBe("18h30");
    expect(frPlanning.time.compactHour(8)).toBe("8h");
    expect(frPlanning.time.spoken(8, "30")).toBe("8 h 30");
    expect(frPrograms.dates.hour(14)).toBe("14 h");
  });

  it("Plan : heure pleine abrégée dans les deux langues", () => {
    expect(planTimeLabel("8:00 AM")).toBe("8 AM");
    expect(planTimeLabel("8:30 AM")).toBe("8:30 AM");
    expect(planTimeLabel("8h00")).toBe("8h");
  });
});
