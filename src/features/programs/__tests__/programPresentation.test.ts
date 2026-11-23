import { describe, expect, it } from "@jest/globals";

import { EVERY_TIME } from "@/domain/planning/Routine";
import type { Program } from "@/domain/programs/Program";
import { initialDraft, withEndKind } from "@/features/planning/planningDraft";
import { maxEndCount, windowStartMinimum, withinWindow } from "@/features/planning/programWindow";
import {
  cardCountsLine,
  cardStatusLine,
  deletionMessage,
  formatDayMonth,
  formatDayMonthYear,
  programCounts,
  routineSlotLine,
  usedByLine,
  visiblePrograms,
} from "@/features/programs/programPresentation";

/** PROG-CAT-01 — présentation des cartes, de la confirmation et de la fenêtre du programme dans la planification. */

const program = (patch: Partial<Program> = {}): Program => ({
  id: "p1",
  name: "Rééducation genou",
  objective: "Retrouver mobilité",
  startDate: "2026-09-15",
  endDate: "2026-12-15",
  painTracking: false,
  terminatedAt: null,
  createdAt: "t",
  updatedAt: "t",
  ...patch,
});

describe("cartes du catalogue (CE-PROG-01, Figma « PROG — 7 »)", () => {
  it("période · statut ; N planifications · N séances (Hermann, 21/11/2026, point 2)", () => {
    expect(formatDayMonth("2026-11-01")).toBe("1er nov.");
    expect(formatDayMonthYear("2026-09-15")).toBe("15 sept. 2026");
    // PROG-CAT-01, point 2 : 92 jours → 13 semaines ; 1er octobre = 17e jour → semaine 3 (Figma « PROG — 7 »).
    expect(cardStatusLine(program(), "2026-10-01")).toBe("15 sept. – 15 déc.   ·   En cours   ·   semaine 3 sur 13");
    expect(cardStatusLine(program(), "2026-09-15")).toBe("15 sept. – 15 déc.   ·   En cours   ·   semaine 1 sur 13");
    // Derniers jours (14e semaine entamée) : plafonné au total.
    expect(cardStatusLine(program(), "2026-12-15")).toBe("15 sept. – 15 déc.   ·   En cours   ·   semaine 13 sur 13");
    expect(cardStatusLine(program({ startDate: "2026-11-01", endDate: "2027-02-15" }), "2026-10-01")).toBe("1er nov. – 15 févr.   ·   À venir");
    expect(cardStatusLine(program({ terminatedAt: "x" }), "2026-10-01")).toBe("15 sept. – 15 déc.   ·   Terminé");
    expect(cardCountsLine({ routineCount: 3, sessionCount: 4 })).toBe("3 planifications   ·   4 séances");
    expect(cardCountsLine({ routineCount: 1, sessionCount: 1 })).toBe("1 planification   ·   1 séance");
    expect(cardCountsLine({ routineCount: 0, sessionCount: 0 })).toBe("0 planifications   ·   0 séances");
  });

  it("Actifs par défaut ; recherche sur le nom et l'objectif, sans accents", () => {
    const summaries = [
      { program: program(), routineCount: 0, sessionCount: 0 },
      { program: program({ id: "p2", name: "Trail", objective: null, endDate: "2026-09-30" }), routineCount: 0, sessionCount: 0 },
    ];
    expect(programCounts(summaries.map((item) => item.program), "2026-10-01")).toEqual({ ACTIVE: 1, TERMINATED: 1 });
    expect(visiblePrograms(summaries, "ACTIVE", "", "2026-10-01").map((item) => item.program.id)).toEqual(["p1"]);
    expect(visiblePrograms(summaries, "TERMINATED", "", "2026-10-01").map((item) => item.program.id)).toEqual(["p2"]);
    expect(visiblePrograms(summaries, "ACTIVE", "reeducation", "2026-10-01")).toHaveLength(1);
    expect(visiblePrograms(summaries, "ACTIVE", "mobilite", "2026-10-01")).toHaveLength(1);
    expect(visiblePrograms(summaries, "ACTIVE", "trail", "2026-10-01")).toHaveLength(0);
  });

  it("ligne d'une routine : « créneau · N contenus »", () => {
    const entries = [
      { id: "a", sessionId: "s", frequency: EVERY_TIME },
      { id: "b", sessionId: "t", frequency: EVERY_TIME },
    ];
    expect(
      routineSlotLine({ startDate: "2026-11-18", time: "14:00", entries, repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "UNTIL", date: "2026-12-01" } } }),
    ).toBe("tous les jours, 14 h  ·  2 contenus");
    expect(routineSlotLine({ startDate: "2026-11-18", time: "08:30", entries: entries.slice(0, 1), repetition: null })).toBe("le 18 nov., 8 h 30  ·  1 contenu");
  });
});

describe("confirmation de suppression (CE-PROG-03)", () => {
  it("message selon l'historique et le nombre de créneaux", () => {
    expect(deletionMessage({ history: true, slotCount: 12, canKeepRoutines: true })).toBe("12 créneaux non commencés seront supprimés. Le programme sera terminé.");
    expect(deletionMessage({ history: true, slotCount: 1, canKeepRoutines: true })).toBe("1 créneau non commencé sera supprimé. Le programme sera terminé.");
    expect(deletionMessage({ history: false, slotCount: 0, canKeepRoutines: false })).toBe("Le programme sera supprimé.");
  });
});

describe("Profil › Confidentialité (D-551)", () => {
  it("« Utilisé par 1 programme · Rééducation genou »", () => {
    expect(usedByLine([{ name: "Rééducation genou" }])).toBe("Utilisé par 1 programme · Rééducation genou");
    expect(usedByLine([{ name: "A" }, { name: "B" }])).toBe("Utilisé par 2 programmes · A, B");
    expect(usedByLine([])).toBe("Utilisé par aucun programme");
  });
});

describe("fenêtre du programme dans la planification (Hermann, 21/11/2026, point 5)", () => {
  const window = { start: "2030-08-10", end: "2030-08-31" };

  it("« Début le » au plus tôt aujourd'hui ou le début du programme", () => {
    expect(windowStartMinimum(window, "2030-08-01")).toBe("2030-08-10");
    expect(windowStartMinimum(window, "2030-08-20")).toBe("2030-08-20");
  });

  it("« pendant N » : valeur maximale dont la fin ne dépasse jamais la fin du programme", () => {
    // Semaines civiles depuis celle du 10 août 2030 (samedi) : la 4e se termine le 1er septembre.
    expect(maxEndCount("WEEK", "2030-08-10", "2030-08-31")).toBe(3);
    expect(maxEndCount("DAY", "2030-08-10", "2030-08-31")).toBe(22);
    expect(maxEndCount("DAY", "2030-08-31", "2030-08-31")).toBe(1);
  });

  it("brouillon ramené dans la fenêtre ; même objet s'il y est déjà", () => {
    const draft = initialDraft("2030-08-01", [], new Date(2030, 7, 1, 9, 0));
    const bounded = withinWindow({ ...draft, repetitionOn: true }, window, "2030-08-01");
    expect(bounded.startDate).toBe("2030-08-10");
    expect(bounded.endDate <= "2030-08-31").toBe(true);
    expect(withinWindow(bounded, window, "2030-08-01")).toBe(bounded);
    const during = withinWindow({ ...withEndKind(bounded), endCount: 10 }, window, "2030-08-01");
    expect(during.endCount).toBe(3);
  });
});
