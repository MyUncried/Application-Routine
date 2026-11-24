import { describe, expect, it, jest } from "@jest/globals";

import { twelveHourColumns } from "@/features/planning/PlanningScreen";
import { planTimeLabel } from "@/features/planning/planWeek";

import { clock12, clockTime } from "./format";
import { planning as enPlanning } from "./resources/enPlanning";
import { programs as enPrograms } from "./resources/enPrograms";
import { planning as frPlanning } from "./resources/frPlanning";
import { programs as frPrograms } from "./resources/frPrograms";

describe("J1.8 — heures selon le réglage 12 / 24 heures de l'iPhone (choix « A » de Hermann, 24/11/2026)", () => {
  it("24 heures : format de la langue — français inchangé, anglais « 08:30 »", () => {
    expect(clockTime(18, "30", frPlanning.time.compact(18, "30"), true)).toBe("18h30");
    expect(clockTime(8, "00", frPlanning.time.compactHour(8), true)).toBe("8h");
    expect(frPlanning.time.spoken(8, "30")).toBe("8 h 30");
    expect(frPrograms.dates.hour(14)).toBe("14 h");
    expect(clockTime(8, "30", enPlanning.time.compact(8, "30"), true)).toBe("08:30");
    expect(enPrograms.dates.hour(14)).toBe("14:00");
  });

  it("12 heures : AM / PM, minuit 12:00 AM, midi 12:00 PM", () => {
    expect(clockTime(18, "30", enPlanning.time.compact(18, "30"), false)).toBe("6:30 PM");
    expect(clockTime(8, "05", "ignoré", false)).toBe("8:05 AM");
    expect(clock12(0, "00")).toBe("12:00 AM");
    expect(clock12(12, "00")).toBe("12:00 PM");
  });

  it("Plan : heure pleine abrégée", () => {
    expect(planTimeLabel("8:00 AM")).toBe("8 AM");
    expect(planTimeLabel("8:30 AM")).toBe("8:30 AM");
    expect(planTimeLabel("8h00")).toBe("8h");
  });

  it("roulette sur 12 heures : 1 à 12, minutes, AM / PM ; chaque colonne garde les deux autres", () => {
    const onChange = jest.fn<(minutes: number) => void>();
    const [hours, minutes, period] = twelveHourColumns(18 * 60 + 30, onChange);
    expect(hours!.values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect([hours!.selected, minutes!.selected, period!.selected]).toEqual([6, 30, 1]);
    expect(period!.format(0)).toBe("AM");
    hours!.onChange(12);
    expect(onChange).toHaveBeenLastCalledWith(12 * 60 + 30);
    period!.onChange(0);
    expect(onChange).toHaveBeenLastCalledWith(6 * 60 + 30);
    minutes!.onChange(5);
    expect(onChange).toHaveBeenLastCalledWith(18 * 60 + 5);
    expect(twelveHourColumns(0, onChange)[0]!.selected).toBe(12);
  });
});
