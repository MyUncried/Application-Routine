import { describe, expect, it } from "@jest/globals";

import { composeReminder, eligibleFamilies, REMINDER_BODY_MAX, REMINDER_TEMPLATES, REMINDER_TITLE_MAX, reminderBody, type ReminderContext } from "@/domain/planning/reminderMessages";

/**
 * Textes des rappels — spécification des notifications de rappel de séance (18/11/2026), fournie à la recette du
 * 19/11/2026 (t6) : § 3 (catalogue, familles) et § 4 (sélection, longueur du corps).
 */
const context = (patch: Partial<ReminderContext> = {}): ReminderContext => ({
  plannedAt: new Date(2030, 7, 5, 8, 0), // lundi 8 h
  name: "Mobilité douce",
  recurring: true,
  categoryIds: [],
  rank: 1,
  ...patch,
});

describe("catalogue des rappels", () => {
  it("titres de 30 caractères au plus, sans point final ; corps commençant par le nom ; identifiants uniques", () => {
    for (const template of REMINDER_TEMPLATES) {
      expect(template.title.length).toBeLessThanOrEqual(REMINDER_TITLE_MAX);
      expect(template.title.endsWith(".")).toBe(false);
      expect(template.body.startsWith("{nom}")).toBe(true);
    }
    expect(new Set(REMINDER_TEMPLATES.map((template) => template.id)).size).toBe(REMINDER_TEMPLATES.length);
  });

  it("corps : modèle s'il tient en 40 caractères, sinon le nom complet seul, jamais tronqué (§ 5)", () => {
    const template = REMINDER_TEMPLATES.find((candidate) => candidate.id === "RECUR-01")!;
    expect(reminderBody(template, "Cardio 30 min")).toBe("Cardio 30 min t’attend.");
    const long = "Renforcement musculaire du haut du corps et gainage";
    expect(reminderBody(template, long)).toBe(long);
    expect(reminderBody(template, "Renfo du haut du corps").length).toBeLessThanOrEqual(REMINDER_BODY_MAX);
    expect(reminderBody(template, "Mobilité du dos l’après-midi, épaules")).toBe("Mobilité du dos l’après-midi, épaules");
  });
});

describe("familles éligibles (§ 3)", () => {
  it("récurrente ou ponctuelle, jour du début planifié, créneau de l'heure planifiée, GEN toujours", () => {
    expect(eligibleFamilies(context())).toEqual(["RECUR", "MON", "MORNING", "GEN"]);
    expect(eligibleFamilies(context({ recurring: false, plannedAt: new Date(2030, 7, 7, 12, 30) }))).toEqual(["SINGLE", "MIDWEEK", "LUNCH", "GEN"]);
    expect(eligibleFamilies(context({ plannedAt: new Date(2030, 7, 9, 16, 0) }))).toEqual(["RECUR", "FRI", "AFTERNOON", "GEN"]);
    expect(eligibleFamilies(context({ plannedAt: new Date(2030, 7, 10, 19, 0) }))).toEqual(["RECUR", "SAT", "EVENING", "GEN"]);
    expect(eligibleFamilies(context({ plannedAt: new Date(2030, 7, 11, 23, 30) }))).toEqual(["RECUR", "SUN", "NIGHT", "GEN"]);
    expect(eligibleFamilies(context({ plannedAt: new Date(2030, 7, 11, 4, 59) }))).toContain("NIGHT");
    expect(eligibleFamilies(context({ plannedAt: new Date(2030, 7, 11, 5, 0) }))).toContain("MORNING");
  });

  it("catégorie : une seule catégorie connue → CAT-* ; plusieurs, personnalisée ou aucune → pas d'accroche CAT-*", () => {
    expect(eligibleFamilies(context({ categoryIds: ["cardio", "cardio"] }))).toContain("CAT-CARDIO");
    expect(eligibleFamilies(context({ categoryIds: ["recuperation"] }))).toContain("CAT-RECUP");
    expect(eligibleFamilies(context({ categoryIds: ["cardio", "mobilite"] })).some((family) => family.startsWith("CAT-"))).toBe(false);
    expect(eligibleFamilies(context({ categoryIds: ["ma-categorie"] })).some((family) => family.startsWith("CAT-"))).toBe(false);
  });
});

describe("sélection (§ 4)", () => {
  it("déterministe pour une même occurrence ; rotation des familles d'une occurrence à la suivante", () => {
    expect(composeReminder(context({ rank: 3 }), null)).toEqual(composeReminder(context({ rank: 3 }), null));
    const families = [1, 2, 3, 4].map((rank) => composeReminder(context({ rank }), null).templateId.split("-")[0]);
    expect(new Set(families).size).toBe(4);
  });

  it("jamais le même modèle sur deux notifications consécutives", () => {
    const first = composeReminder(context(), null);
    const second = composeReminder(context(), first.templateId);
    expect(second.templateId).not.toBe(first.templateId);
    let previous: string | null = null;
    for (let rank = 1; rank <= 40; rank += 1) {
      const message = composeReminder(context({ rank, plannedAt: new Date(2030, 7, 5 + rank, 8 + (rank % 12), 0) }), previous);
      expect(message.templateId).not.toBe(previous);
      expect(message.body.startsWith("Mobilité douce")).toBe(true);
      previous = message.templateId;
    }
  });

  it("exemples : nom long, corps réduit au nom ; séance mono-catégorie : accroche CAT-* dans la rotation", () => {
    const long = composeReminder(context({ name: "Renforcement musculaire du haut du corps et gainage" }), null);
    expect(long.body).toBe("Renforcement musculaire du haut du corps et gainage");
    const ids = [1, 2, 3, 4, 5].map((rank) => composeReminder(context({ name: "Cardio 30 min", categoryIds: ["cardio"], rank }), null).templateId);
    expect(ids.some((id) => id.startsWith("CAT-CARDIO"))).toBe(true);
  });
});
