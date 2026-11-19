import { describe, expect, it } from "@jest/globals";

import { firstDayOfShiftedMonth, formatAgendaMonth, formatAgendaTime, formatAgendaWeek, zonesLine } from "@/features/planning/agendaFormat";

/** Formats de l'Agenda (D-533, DSF Agenda — Planning § 2 et § 5). */
describe("agendaFormat", () => {
  it("heure « 8h00 », « 14h30 », sans zéro initial", () => {
    expect(formatAgendaTime("08:00")).toBe("8h00");
    expect(formatAgendaTime("14:30")).toBe("14h30");
  });

  it("mois « Novembre 2026 » et semaine « du 16 au 22 »", () => {
    expect(formatAgendaMonth("2026-11-19")).toBe("Novembre 2026");
    expect(formatAgendaWeek("2026-11-16")).toBe("du 16 au 22");
    expect(formatAgendaWeek("2026-10-26")).toBe("du 26 octobre au 1er novembre");
    expect(formatAgendaWeek("2026-06-01")).toBe("du 1er au 7");
  });

  it("changement de mois : premier jour du mois voisin, années comprises", () => {
    expect(firstDayOfShiftedMonth("2026-11-19", 1)).toBe("2026-12-01");
    expect(firstDayOfShiftedMonth("2026-12-31", 1)).toBe("2027-01-01");
    expect(firstDayOfShiftedMonth("2026-01-15", -1)).toBe("2025-12-01");
  });

  it("ligne 2 : une ou deux zones, « + » au-delà, sans doublon", () => {
    expect(zonesLine([])).toBe("");
    expect(zonesLine(["Genou"])).toBe("Genou");
    expect(zonesLine(["Genou", "Quadriceps", "Genou"])).toBe("Genou, Quadriceps");
    expect(zonesLine(["Quadriceps", "Dos", "Hanches"])).toBe("Quadriceps, Dos +");
  });
});
