import { describe, expect, it } from "@jest/globals";

import {
  decodeInstructionSteps,
  encodeInstructionSteps,
  insertPastedText,
  instructionStepsLength,
  splitStepAt,
} from "@/domain/activities/instructionSteps";
import { INSTRUCTION_MAX_LENGTH, normalizeInstruction, validateInstruction } from "@/domain/sessions/validation";

/**
 * PRE-5 (story 1.1, AC9, AD-22, FR-34, FR-35, NFR-9) — codec unique des étapes
 * de la Description. Stockage inchangé : la chaîne encodée.
 */

describe("PRE5-1.1/AC9 — decodeInstructionSteps", () => {
  it("null ou chaîne vide → aucune étape", () => {
    expect(decodeInstructionSteps(null)).toEqual([]);
    expect(decodeInstructionSteps("")).toEqual([]);
  });

  it("un texte PRE-4 multiligne donne une étape par ligne (FR-35, sans conversion)", () => {
    expect(decodeInstructionSteps("Pieds écartés\nDescendre lentement\nRemonter")).toEqual([
      "Pieds écartés",
      "Descendre lentement",
      "Remonter",
    ]);
    expect(decodeInstructionSteps("Une seule consigne")).toEqual(["Une seule consigne"]);
  });

  it("NFR-9 — fins de ligne \\r\\n : aucune étape fantôme ni \\r résiduel", () => {
    const steps = decodeInstructionSteps("Pieds écartés\r\nDescendre\r\nRemonter");
    expect(steps).toEqual(["Pieds écartés", "Descendre", "Remonter"]);
    expect(steps.some((step) => step.includes("\r"))).toBe(false);
  });
});

describe("PRE5-1.1/AC9 — encodeInstructionSteps", () => {
  it("joint par \\n, sans numéro, étapes vides retirées après suppression des espaces extérieurs", () => {
    expect(encodeInstructionSteps(["Pieds écartés", "  Descendre  ", "", "   ", "Remonter"])).toBe("Pieds écartés\nDescendre\nRemonter");
  });

  it("liste vide ou seulement des étapes blanches → null", () => {
    expect(encodeInstructionSteps([])).toBeNull();
    expect(encodeInstructionSteps(["", "  "])).toBeNull();
  });

  it("une étape ne contient jamais de saut de ligne : un saut résiduel l'éclate", () => {
    expect(encodeInstructionSteps(["a\nb", "c\r\nd"])).toBe("a\nb\nc\nd");
  });

  it("aller-retour : decode(encode(steps)) = steps pour des étapes déjà normalisées ; encode(decode(texte PRE-4)) = texte normalisé", () => {
    const steps = ["Pieds écartés", "Descendre lentement", "Remonter 💪"];
    expect(decodeInstructionSteps(encodeInstructionSteps(steps))).toEqual(steps);
    expect(encodeInstructionSteps(decodeInstructionSteps("A\r\n\r\nB\n"))).toBe("A\nB");
    // La chaîne encodée reste une instruction valide, sans seconde règle.
    expect(normalizeInstruction(encodeInstructionSteps(steps))).toBe(encodeInstructionSteps(steps));
  });
});

describe("PRE5-1.1/AC9 — splitStepAt et insertPastedText (PRD §9-6)", () => {
  it("Entrée au milieu d'une étape la coupe au curseur ; aucune autre étape modifiée", () => {
    expect(splitStepAt(["Pieds écartés", "Descendre lentement", "Remonter"], 1, 9)).toEqual([
      "Pieds écartés",
      "Descendre",
      " lentement",
      "Remonter",
    ]);
    expect(splitStepAt(["abc"], 0, 0)).toEqual(["", "abc"]);
    expect(splitStepAt(["abc"], 0, 3)).toEqual(["abc", ""]);
    expect(splitStepAt(["abc"], 0, 99)).toEqual(["abc", ""]);
  });

  it("index hors bornes : liste inchangée (copie)", () => {
    const steps = ["a", "b"];
    expect(splitStepAt(steps, 2, 0)).toEqual(steps);
    expect(splitStepAt(steps, -1, 0)).toEqual(steps);
    expect(insertPastedText(steps, 5, { start: 0, end: 0 }, "x")).toEqual(steps);
  });

  it("un collage multiligne donne une étape par ligne, autour du curseur ; \\r\\n sans étape fantôme", () => {
    expect(insertPastedText(["Avant|Après", "Suite"], 0, { start: 5, end: 6 }, "un\r\ndeux\ntrois")).toEqual([
      "Avantun",
      "deux",
      "troisAprès",
      "Suite",
    ]);
    expect(insertPastedText(["ab"], 0, { start: 1, end: 1 }, "X")).toEqual(["aXb"]);
    expect(insertPastedText([""], 0, { start: 0, end: 0 }, "un\ndeux")).toEqual(["un", "deux"]);
  });
});

describe("PRE5-1.1/AC9 — instructionStepsLength, seule mesure de la limite (QN-1)", () => {
  it("compte la chaîne encodée en points de code, séparateurs \\n compris, sans numérotation", () => {
    expect(instructionStepsLength([])).toBe(0);
    expect(instructionStepsLength(["abc", "de"])).toBe(6);
    expect(instructionStepsLength(["  abc  ", "", "de"])).toBe(6);
    expect(instructionStepsLength(["💪💪", "é"])).toBe(4);
  });

  it("la limite de 1 000 garantit le CHECK length(instruction) <= 1000 de la chaîne encodée", () => {
    const atLimit = ["a".repeat(499), "b".repeat(500)];
    expect(instructionStepsLength(atLimit)).toBe(INSTRUCTION_MAX_LENGTH);
    expect(validateInstruction(encodeInstructionSteps(atLimit)).ok).toBe(true);
    const over = ["a".repeat(500), "b".repeat(500)];
    expect(instructionStepsLength(over)).toBe(INSTRUCTION_MAX_LENGTH + 1);
    expect(validateInstruction(encodeInstructionSteps(over)).ok).toBe(false);
  });
});
