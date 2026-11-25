import { describe, expect, it } from "@jest/globals";

import { REMINDER_TEMPLATES, reminderBody } from "@/domain/planning/reminderMessages";
import { localizedReminder } from "@/features/planning/ReminderScheduler";

describe("J1.8 — notifications de rappel dans la langue de l'interface", () => {
  it("en français : titre et corps identiques à ceux du domaine, pour chaque modèle", () => {
    for (const template of REMINDER_TEMPLATES) {
      for (const name of ["Gainage", "Une séance au nom vraiment très long à couper"]) {
        expect(localizedReminder(template.id, name)).toEqual({ title: template.title, body: reminderBody(template, name) });
      }
    }
  });

  it("modèle inconnu : texte du domaine", () => {
    expect(localizedReminder("INCONNU", "Gainage")).toBeNull();
  });
});
