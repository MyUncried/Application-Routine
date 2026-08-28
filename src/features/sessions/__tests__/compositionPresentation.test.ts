import { describe, expect, it } from "@jest/globals";

import { createExerciseDraft } from "@/domain/sessions/SessionDraft";
import {
  formatCompositionSummary,
  formatDurationRowValue,
  formatExerciseRowSummary,
} from "@/features/sessions/compositionPresentation";

describe("formatCompositionSummary", () => {
  it("displays the exact local empty-state label when there is no exercise yet", () => {
    expect(
      formatCompositionSummary({
        exercise: null,
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      }),
    ).toBe("0 activité · 0 min");
  });

  it("ignores initial/final phase seconds entirely while the draft is empty (not part of the formula)", () => {
    expect(
      formatCompositionSummary({
        exercise: null,
        initialCountdownSeconds: 999,
        finalPhaseSeconds: 999,
      }),
    ).toBe("0 activité · 0 min");
  });

  it("formats 10s + 45s + 5s = 60s as '1 activité · 1 min'", () => {
    expect(
      formatCompositionSummary({
        exercise: { ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 },
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      }),
    ).toBe("1 activité · 1 min");
  });

  it("formats 10s + 60s + 5s = 75s as '1 activité · 2 min' (Math.ceil, never underestimating)", () => {
    expect(
      formatCompositionSummary({
        exercise: { ...createExerciseDraft(), name: "Gainage", durationSeconds: 60 },
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      }),
    ).toBe("1 activité · 2 min");
  });

  it("treats a null exercise duration as 0 seconds in the formula", () => {
    expect(
      formatCompositionSummary({
        exercise: { ...createExerciseDraft(), name: "Gainage", durationSeconds: null },
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      }),
    ).toBe("1 activité · 1 min");
  });

  describe("mode Répétitions (T01-S08, arbitrage B — RM-072/D-070/D-008)", () => {
    function repetitionExercise(repetitionCount: number) {
      return {
        ...createExerciseDraft(),
        name: "Fentes",
        executionMode: "REPETITIONS" as const,
        durationSeconds: null,
        repetitionCount,
      };
    }

    it("prefixes the duration with '≥' and ignores the exercise's own duration entirely", () => {
      expect(
        formatCompositionSummary({
          exercise: repetitionExercise(12),
          initialCountdownSeconds: 10,
          finalPhaseSeconds: 5,
        }),
      ).toBe("1 activité · ≥ 1 min"); // 10 + 0 + 5 = 15s -> ceil = 1 min
    });

    it("still applies Math.ceil to the Compte à rebours/Fin de séance sum alone", () => {
      expect(
        formatCompositionSummary({
          exercise: repetitionExercise(20),
          initialCountdownSeconds: 40,
          finalPhaseSeconds: 25,
        }),
      ).toBe("1 activité · ≥ 2 min"); // 40 + 0 + 25 = 65s -> ceil = 2 min
    });

    it("never underestimates: a repetition count change alone never changes the displayed minimum", () => {
      const first = formatCompositionSummary({
        exercise: repetitionExercise(5),
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      });
      const second = formatCompositionSummary({
        exercise: repetitionExercise(50),
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      });
      expect(first).toBe(second);
      expect(first).toBe("1 activité · ≥ 1 min");
    });

    it("never shows the '≥' prefix in Duration mode", () => {
      const result = formatCompositionSummary({
        exercise: { ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 },
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      });
      expect(result).not.toContain("≥");
    });
  });

  describe("Séries et Pause après Série (T01-S08, revue PR #9 — RM-036/RM-037/RM-071/RM-072)", () => {
    it("mode Durée : multiplie durationSeconds ET pauseSeconds par seriesCount (90s, 3 Séries, pause 15s -> 330s -> 6 min)", () => {
      expect(
        formatCompositionSummary({
          exercise: {
            ...createExerciseDraft(),
            name: "Gainage",
            durationSeconds: 90,
            seriesCount: 3,
            pauseSeconds: 15,
          },
          initialCountdownSeconds: 10,
          finalPhaseSeconds: 5,
        }),
      ).toBe("1 activité · 6 min"); // 10 + 3*90 + 3*15 + 5 = 330s -> ceil(330/60) = 6 min
    });

    it("mode Répétitions : la Pause après Série reste comptée (déterminable) même si la durée de l'Exercice ne l'est pas (3 Séries, pause 20s -> 75s min -> ≥ 2 min)", () => {
      expect(
        formatCompositionSummary({
          exercise: {
            ...createExerciseDraft(),
            name: "Fentes",
            executionMode: "REPETITIONS",
            durationSeconds: null,
            repetitionCount: 12,
            seriesCount: 3,
            pauseSeconds: 20,
          },
          initialCountdownSeconds: 10,
          finalPhaseSeconds: 5,
        }),
      ).toBe("1 activité · ≥ 2 min"); // 10 + 3*20 + 5 = 75s -> ceil(75/60) = 2 min
    });

    it("Pause nulle : n'ajoute rien à la durée estimée, quel que soit seriesCount", () => {
      expect(
        formatCompositionSummary({
          exercise: {
            ...createExerciseDraft(),
            name: "Gainage",
            durationSeconds: 45,
            seriesCount: 4,
            pauseSeconds: 0,
          },
          initialCountdownSeconds: 10,
          finalPhaseSeconds: 5,
        }),
      ).toBe("1 activité · 4 min"); // 10 + 4*45 + 4*0 + 5 = 195s -> ceil(195/60) = 4 min
    });

    it("une seule Série : non-régression, formule équivalente à l'ancienne (seriesCount=1)", () => {
      expect(
        formatCompositionSummary({
          exercise: {
            ...createExerciseDraft(),
            name: "Gainage",
            durationSeconds: 45,
            seriesCount: 1,
            pauseSeconds: 0,
          },
          initialCountdownSeconds: 10,
          finalPhaseSeconds: 5,
        }),
      ).toBe("1 activité · 1 min"); // 10 + 45 + 5 = 60s -> ceil = 1 min, identique au comportement T01-S07
    });

    it("fait varier seriesCount seul : le résultat change en conséquence", () => {
      const oneSeries = formatCompositionSummary({
        exercise: { ...createExerciseDraft(), name: "Gainage", durationSeconds: 45, seriesCount: 1 },
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      });
      const threeSeries = formatCompositionSummary({
        exercise: { ...createExerciseDraft(), name: "Gainage", durationSeconds: 45, seriesCount: 3 },
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      });
      expect(oneSeries).toBe("1 activité · 1 min"); // 10 + 45 + 5 = 60s
      expect(threeSeries).toBe("1 activité · 3 min"); // 10 + 135 + 5 = 150s -> ceil(150/60) = 3 min
      expect(oneSeries).not.toBe(threeSeries);
    });

    it("fait varier pauseSeconds seul : le résultat change en conséquence", () => {
      const noPause = formatCompositionSummary({
        exercise: {
          ...createExerciseDraft(),
          name: "Gainage",
          durationSeconds: 45,
          seriesCount: 2,
          pauseSeconds: 0,
        },
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      });
      const withPause = formatCompositionSummary({
        exercise: {
          ...createExerciseDraft(),
          name: "Gainage",
          durationSeconds: 45,
          seriesCount: 2,
          pauseSeconds: 30,
        },
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      });
      expect(noPause).toBe("1 activité · 2 min"); // 10 + 90 + 0 + 5 = 105s -> ceil = 2 min
      expect(withPause).toBe("1 activité · 3 min"); // 10 + 90 + 60 + 5 = 165s -> ceil = 3 min
      expect(noPause).not.toBe(withPause);
    });
  });
});

describe("formatDurationRowValue", () => {
  it("formats 0 seconds as '00 min 00 s'", () => {
    expect(formatDurationRowValue(0)).toBe("00 min 00 s");
  });

  it("formats 10 seconds as '00 min 10 s'", () => {
    expect(formatDurationRowValue(10)).toBe("00 min 10 s");
  });

  it("formats 3599 seconds (upper bound) as '59 min 59 s'", () => {
    expect(formatDurationRowValue(3599)).toBe("59 min 59 s");
  });

  it("pads both minutes and seconds to two digits", () => {
    expect(formatDurationRowValue(65)).toBe("01 min 05 s");
  });

  describe("maxTotalSeconds parameter (T01-S08, Exercise Durée/Pause — 5999s bound)", () => {
    it("still clamps to 59 min 59 s by default when maxTotalSeconds is omitted", () => {
      expect(formatDurationRowValue(5999)).toBe("59 min 59 s");
    });

    it("formats 5999 seconds as '99 min 59 s' when given the Exercise bound", () => {
      expect(formatDurationRowValue(5999, 5999)).toBe("99 min 59 s");
    });
  });
});

describe("formatExerciseRowSummary (T01-S08, CHANGES_REQUESTED — commentaire GitHub 5442860439, D-095)", () => {
  it("mode Durée avec minutes et secondes, plusieurs Séries, pause non nulle — exemple exact 'Gainage'", () => {
    expect(
      formatExerciseRowSummary({
        executionMode: "DURATION",
        durationSeconds: 90,
        repetitionCount: null,
        seriesCount: 3,
        pauseSeconds: 15,
      }),
    ).toBe("3 séries de 1 min 30 s avec 15 s de pause par série");
  });

  it("mode Répétitions, plusieurs Séries, pause non nulle — exemple exact 'Squats'", () => {
    expect(
      formatExerciseRowSummary({
        executionMode: "REPETITIONS",
        durationSeconds: null,
        repetitionCount: 12,
        seriesCount: 3,
        pauseSeconds: 20,
      }),
    ).toBe("3 séries de 12 répétitions avec 20 s de pause par série");
  });

  it("une seule Série, durée inférieure à une minute, pause nulle — exemple exact 'Étirement'", () => {
    expect(
      formatExerciseRowSummary({
        executionMode: "DURATION",
        durationSeconds: 45,
        repetitionCount: null,
        seriesCount: 1,
        pauseSeconds: 0,
      }),
    ).toBe("1 série de 45 s");
  });

  it("durée inférieure à une minute (0 minute) : n'affiche jamais '0 min'", () => {
    const result = formatExerciseRowSummary({
      executionMode: "DURATION",
      durationSeconds: 45,
      repetitionCount: null,
      seriesCount: 2,
      pauseSeconds: 0,
    });
    expect(result).not.toContain("0 min");
    expect(result).toBe("2 séries de 45 s");
  });

  it("durée exactement sur une minute (secondes nulles) : n'affiche jamais '0 s'", () => {
    const result = formatExerciseRowSummary({
      executionMode: "DURATION",
      durationSeconds: 120,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
    });
    expect(result).not.toContain("0 s");
    expect(result).toBe("1 série de 2 min");
  });

  it("singulier de Série (1) distinct du pluriel (2+)", () => {
    const singular = formatExerciseRowSummary({
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
    });
    const plural = formatExerciseRowSummary({
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 2,
      pauseSeconds: 0,
    });
    expect(singular).toContain("1 série de");
    expect(singular).not.toContain("1 séries");
    expect(plural).toContain("2 séries de");
  });

  it("singulier de Répétition (1) distinct du pluriel (2+)", () => {
    const singular = formatExerciseRowSummary({
      executionMode: "REPETITIONS",
      durationSeconds: null,
      repetitionCount: 1,
      seriesCount: 1,
      pauseSeconds: 0,
    });
    const plural = formatExerciseRowSummary({
      executionMode: "REPETITIONS",
      durationSeconds: null,
      repetitionCount: 5,
      seriesCount: 1,
      pauseSeconds: 0,
    });
    expect(singular).toBe("1 série de 1 répétition");
    expect(singular).not.toContain("1 répétitions");
    expect(plural).toBe("1 série de 5 répétitions");
  });

  it("pause nulle : la clause de pause est entièrement absente, jamais 'avec 0 s de pause'", () => {
    const result = formatExerciseRowSummary({
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
    });
    expect(result).not.toContain("avec");
    expect(result).not.toContain("pause");
  });

  it("pause non nulle inférieure à une minute : affichée en secondes seules", () => {
    const result = formatExerciseRowSummary({
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 10,
    });
    expect(result).toBe("1 série de 30 s avec 10 s de pause par série");
  });

  it("pause non nulle avec minutes et secondes : affichée complètement", () => {
    const result = formatExerciseRowSummary({
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 75,
    });
    expect(result).toBe("1 série de 30 s avec 1 min 15 s de pause par série");
  });

  it("ne mentionne jamais la Consigne ni les Zones corporelles", () => {
    const result = formatExerciseRowSummary({
      executionMode: "DURATION",
      durationSeconds: 90,
      repetitionCount: null,
      seriesCount: 3,
      pauseSeconds: 15,
    });
    expect(result.toLowerCase()).not.toContain("consigne");
    expect(result.toLowerCase()).not.toContain("zone");
  });
});
