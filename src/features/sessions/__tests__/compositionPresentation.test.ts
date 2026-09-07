import { describe, expect, it } from "@jest/globals";

import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import {
  formatCompositionSummary,
  formatDurationRowValue,
  formatExerciseRecap,
  formatExerciseRowSummary,
} from "@/features/sessions/compositionPresentation";

/**
 * REWORK13 (R13-02, `[ChatGPT] CHANGES_REQUESTED — REWORK13 — typographie
 * Nom d'activité + périmètre synthèse Tour`, 2026-09-04) :
 * `initialCountdownSeconds`/`finalPhaseSeconds` sont retirés de
 * `CompositionSummaryFacts` — cette synthèse compte et totalise
 * EXCLUSIVEMENT les Activités du Tour, `Compte à rebours initial`/`Fin de
 * séance` (éléments structurels hors Tour) en sont désormais toujours
 * exclus. Tous les montants ci-dessous sont donc recalculés à partir des
 * seules contributions d'Activité (plus aucune constante `10`/`5` de
 * compte à rebours/fin de séance dans la formule).
 */
describe("formatCompositionSummary", () => {
  it("displays the exact local empty-state label when there is no Activity yet", () => {
    expect(formatCompositionSummary({ exercises: [] })).toBe("0 activité · 0 min");
  });

  it("formats a single 45s Activity (1 série, sans pause) as '1 activité · 1 min'", () => {
    expect(
      formatCompositionSummary({
        exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 }],
      }),
    ).toBe("1 activité · 1 min");
  });

  it("rounds a non-exact minute up (61s) to '1 activité · 2 min' (Math.ceil, never underestimating)", () => {
    expect(
      formatCompositionSummary({
        exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 61 }],
      }),
    ).toBe("1 activité · 2 min");
  });

  it("treats a null exercise duration as 0 seconds in the formula", () => {
    expect(
      formatCompositionSummary({
        exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: null }],
      }),
    ).toBe("1 activité · 0 min");
  });

  /**
   * R13-02, test obligatoire n°1 : une même liste d'Activités produit
   * exactement la même synthèse quelles que soient les valeurs du compte à
   * rebours initial et de la fin de séance — garanti ici par construction :
   * `CompositionSummaryFacts` (type exporté) n'expose plus que `exercises`,
   * ces deux champs ne peuvent donc structurellement plus influencer le
   * résultat. Preuve directe : deux appels avec la même collection
   * produisent toujours exactement la même chaîne.
   */
  it("REWORK13 (R13-02) — the summary is fully determined by the Activities collection alone (CompositionSummaryFacts exposes only 'exercises')", () => {
    const exercises = [{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 }];
    expect(formatCompositionSummary({ exercises })).toBe(formatCompositionSummary({ exercises }));
  });

  describe("mode Répétitions (T01-S08, arbitrage B — RM-072/D-070/D-008)", () => {
    function repetitionExercise(repetitionCount: number, pauseSeconds = 0): SessionDraftExercise {
      return {
        ...createExerciseDraft("ex-1"),
        name: "Fentes",
        executionMode: "REPETITIONS" as const,
        durationSeconds: null,
        repetitionCount,
        pauseSeconds,
      };
    }

    it("prefixes the duration with '≥' and ignores the exercise's own duration entirely (only the pause contributes)", () => {
      expect(
        formatCompositionSummary({ exercises: [repetitionExercise(12, 20)] }),
      ).toBe("1 activité · ≥ 1 min"); // 20s (pause) -> ceil(20/60) = 1 min
    });

    it("still applies Math.ceil to the pause sum alone", () => {
      expect(
        formatCompositionSummary({ exercises: [repetitionExercise(20, 65)] }),
      ).toBe("1 activité · ≥ 2 min"); // 65s -> ceil(65/60) = 2 min
    });

    it("never underestimates: a repetition count change alone never changes the displayed minimum", () => {
      const first = formatCompositionSummary({ exercises: [repetitionExercise(5, 20)] });
      const second = formatCompositionSummary({ exercises: [repetitionExercise(50, 20)] });
      expect(first).toBe(second);
      expect(first).toBe("1 activité · ≥ 1 min");
    });

    it("never shows the '≥' prefix in Duration mode", () => {
      const result = formatCompositionSummary({
        exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 }],
      });
      expect(result).not.toContain("≥");
    });
  });

  describe("Séries et Pause après Série (T01-S08, revue PR #9 — RM-036/RM-037/RM-071/RM-072)", () => {
    it("mode Durée : multiplie durationSeconds ET pauseSeconds par seriesCount (90s, 3 Séries, pause 15s -> 315s -> 6 min)", () => {
      expect(
        formatCompositionSummary({
          exercises: [
            {
              ...createExerciseDraft("ex-1"),
              name: "Gainage",
              durationSeconds: 90,
              seriesCount: 3,
              pauseSeconds: 15,
            },
          ],
        }),
      ).toBe("1 activité · 6 min"); // 3*90 + 3*15 = 315s -> ceil(315/60) = 6 min
    });

    it("mode Répétitions : la Pause après Série reste comptée (déterminable) même si la durée de l'Exercice ne l'est pas (3 Séries, pause 20s -> 60s -> ≥ 1 min)", () => {
      expect(
        formatCompositionSummary({
          exercises: [
            {
              ...createExerciseDraft("ex-1"),
              name: "Fentes",
              executionMode: "REPETITIONS",
              durationSeconds: null,
              repetitionCount: 12,
              seriesCount: 3,
              pauseSeconds: 20,
            },
          ],
        }),
      ).toBe("1 activité · ≥ 1 min"); // 3*20 = 60s -> ceil(60/60) = 1 min
    });

    it("Pause nulle : n'ajoute rien à la durée estimée, quel que soit seriesCount", () => {
      expect(
        formatCompositionSummary({
          exercises: [
            {
              ...createExerciseDraft("ex-1"),
              name: "Gainage",
              durationSeconds: 45,
              seriesCount: 4,
              pauseSeconds: 0,
            },
          ],
        }),
      ).toBe("1 activité · 3 min"); // 4*45 + 4*0 = 180s -> ceil(180/60) = 3 min
    });

    it("une seule Série : non-régression, formule équivalente au comportement historique (seriesCount=1)", () => {
      expect(
        formatCompositionSummary({
          exercises: [
            {
              ...createExerciseDraft("ex-1"),
              name: "Gainage",
              durationSeconds: 45,
              seriesCount: 1,
              pauseSeconds: 0,
            },
          ],
        }),
      ).toBe("1 activité · 1 min"); // 45s -> ceil(45/60) = 1 min
    });

    it("fait varier seriesCount seul : le résultat change en conséquence", () => {
      const oneSeries = formatCompositionSummary({
        exercises: [
          { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45, seriesCount: 1 },
        ],
      });
      const threeSeries = formatCompositionSummary({
        exercises: [
          { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45, seriesCount: 3 },
        ],
      });
      expect(oneSeries).toBe("1 activité · 1 min"); // 45s
      expect(threeSeries).toBe("1 activité · 3 min"); // 3*45 = 135s -> ceil(135/60) = 3 min
      expect(oneSeries).not.toBe(threeSeries);
    });

    it("fait varier pauseSeconds seul : le résultat change en conséquence", () => {
      const noPause = formatCompositionSummary({
        exercises: [
          {
            ...createExerciseDraft("ex-1"),
            name: "Gainage",
            durationSeconds: 45,
            seriesCount: 2,
            pauseSeconds: 0,
          },
        ],
      });
      const withPause = formatCompositionSummary({
        exercises: [
          {
            ...createExerciseDraft("ex-1"),
            name: "Gainage",
            durationSeconds: 45,
            seriesCount: 2,
            pauseSeconds: 30,
          },
        ],
      });
      expect(noPause).toBe("1 activité · 2 min"); // 2*45 = 90s -> ceil(90/60) = 2 min
      expect(withPause).toBe("1 activité · 3 min"); // 2*45 + 2*30 = 150s -> ceil(150/60) = 3 min
      expect(noPause).not.toBe(withPause);
    });
  });

  /**
   * Complétion REWORK12 (« Plusieurs activités et bouton persistant ») :
   * `formatCompositionSummary` accepte désormais une collection, jamais un
   * unique Exercice nullable — chaque Activité contribue sa propre durée,
   * sommée.
   */
  describe("plusieurs Activités (complétion REWORK12)", () => {
    it("counts every Activity in the collection (never hardcoded to 1)", () => {
      const result = formatCompositionSummary({
        exercises: [
          { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 },
          { ...createExerciseDraft("ex-2"), name: "Squats", durationSeconds: 30 },
        ],
      });
      expect(result).toBe("2 activités · 2 min"); // 45 + 30 = 75s -> ceil(75/60) = 2 min
    });

    it("sums every Activity's own estimated duration (Durée + Répétitions mixed), once Math.ceil at the very end", () => {
      const result = formatCompositionSummary({
        exercises: [
          { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 90 },
          {
            ...createExerciseDraft("ex-2"),
            name: "Fentes",
            executionMode: "REPETITIONS",
            durationSeconds: null,
            repetitionCount: 12,
            pauseSeconds: 20,
          },
        ],
      });
      // 90 + (0 + 1*20) = 110s -> ceil(110/60) = 2 min ; au moins une
      // Activité en mode Répétitions -> préfixe '≥' même si l'autre est en
      // mode Durée.
      expect(result).toBe("2 activités · ≥ 2 min");
    });

    it("never prefixes with '≥' when every Activity is in Durée mode, even with several Activities", () => {
      const result = formatCompositionSummary({
        exercises: [
          { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 },
          { ...createExerciseDraft("ex-2"), name: "Squats", durationSeconds: 45 },
        ],
      });
      expect(result).not.toContain("≥");
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

  it("formats 3599 seconds (upper bound) as '59 min 59 s' — R4-05, pas de 1, aucun arrondi", () => {
    expect(formatDurationRowValue(3599)).toBe("59 min 59 s");
  });

  it("pads both minutes and seconds to two digits", () => {
    expect(formatDurationRowValue(65)).toBe("01 min 05 s");
  });

  describe("maxTotalSeconds parameter (T01-S08, Exercise Durée/Pause — 5999s bound)", () => {
    it("still clamps to 59 min 59 s by default when maxTotalSeconds is omitted (R4-05, pas de 1)", () => {
      expect(formatDurationRowValue(5999)).toBe("59 min 59 s");
    });

    it("formats 5999 seconds as '99 min 59 s' when given the Exercise bound (R4-05, pas de 1)", () => {
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

  describe("mode À l'échec (T01-S10, D-111/D-112)", () => {
    it("synthèse compacte : {N} série(s) jusqu'à l'échec, avec {pause} de pause entre les séries — jamais de cible, jamais de nom", () => {
      expect(
        formatExerciseRowSummary({
          executionMode: "TO_FAILURE",
          durationSeconds: null,
          repetitionCount: null,
          seriesCount: 3,
          pauseSeconds: 15,
        }),
      ).toBe("3 séries jusqu’à l’échec, avec 15 s de pause entre les séries");
    });

    it("omet entièrement la clause de pause à 0 s", () => {
      expect(
        formatExerciseRowSummary({
          executionMode: "TO_FAILURE",
          durationSeconds: null,
          repetitionCount: null,
          seriesCount: 4,
          pauseSeconds: 0,
        }),
      ).toBe("4 séries jusqu’à l’échec");
    });

    it("omet la clause de pause quand une seule Série ne crée aucun intervalle", () => {
      expect(
        formatExerciseRowSummary({
          executionMode: "TO_FAILURE",
          durationSeconds: null,
          repetitionCount: null,
          seriesCount: 1,
          pauseSeconds: 30,
        }),
      ).toBe("1 série jusqu’à l’échec");
    });
  });
});

/**
 * REWORK09 (mission directe utilisateur, 2026-09-04, point 8 — cadre
 * récapitulatif de CE-T01-13), **reformulé par la complétion REWORK12**
 * (`[ChatGPT] Applique impérativement le protocole KODJO actif...`,
 * 2026-09-04, D-105) après mise à jour Figma/documentaire : plus de préfixe
 * `Exercice · Mode X ·`, le nom de l'Activité est désormais intégré au
 * texte, et la clause `entre les séries` ne s'ajoute que pour plusieurs
 * Séries — vérifié directement sur les nœuds Figma actuels
 * (`3261:4157`/`3261:4166`).
 */
describe("formatExerciseRecap (reformulé — complétion REWORK12)", () => {
  it("matches the exact Figma example, mode Durée, plusieurs Séries (nœud 3261:4157)", () => {
    const result = formatExerciseRecap({
      name: "squat sautés",
      executionMode: "DURATION",
      durationSeconds: 90,
      repetitionCount: null,
      seriesCount: 3,
      pauseSeconds: 15,
    });
    expect(result).toBe("3 séries de squat sautés de 1 min 30 s, avec 15 s de pause entre les séries.");
  });

  it("matches the exact Figma example, mode Répétition, plusieurs Séries (nœud 3261:4166)", () => {
    const result = formatExerciseRecap({
      name: "squat sautés",
      executionMode: "REPETITIONS",
      durationSeconds: null,
      repetitionCount: 12,
      seriesCount: 3,
      pauseSeconds: 15,
    });
    expect(result).toBe("3 séries de 12 squat sautés, avec 15 s de pause entre les séries.");
  });

  it("mode Durée, une seule Série : never appends 'entre les séries' (documented rule, not illustrated on Figma — both examples use 3 séries)", () => {
    const result = formatExerciseRecap({
      name: "squat sautés",
      executionMode: "DURATION",
      durationSeconds: 150,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 15,
    });
    expect(result).toBe("1 série de squat sautés de 2 min 30 s, avec 15 s de pause.");
    expect(result).not.toContain("entre les séries");
  });

  it("mode Répétitions, une seule Série : never appends 'entre les séries' either", () => {
    const result = formatExerciseRecap({
      name: "squat sautés",
      executionMode: "REPETITIONS",
      durationSeconds: null,
      repetitionCount: 12,
      seriesCount: 1,
      pauseSeconds: 15,
    });
    expect(result).toBe("1 série de 12 squat sautés, avec 15 s de pause.");
    expect(result).not.toContain("entre les séries");
  });

  it("omits the pause clause entirely when pauseSeconds is 0, never 'avec 0 s de pause'", () => {
    const result = formatExerciseRecap({
      name: "Gainage",
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
    });
    expect(result).toBe("1 série de Gainage de 30 s.");
    expect(result.toLowerCase()).not.toContain("pause");
  });

  it("uses the exact singular for a single série, never '1 séries'", () => {
    const result = formatExerciseRecap({
      name: "Gainage",
      executionMode: "DURATION",
      durationSeconds: 45,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
    });
    expect(result).toContain("1 série de");
    expect(result).not.toContain("1 séries");
  });

  it("never prefixes with 'Exercice · Mode X ·' any more — modePrefix removed", () => {
    const result = formatExerciseRecap({
      name: "Gainage",
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
    });
    expect(result).not.toContain("Exercice");
    expect(result).not.toContain("Mode");
  });

  it("integrates the Activity's own name, never a static Figma placeholder like 'squat sautés' when a different name is given", () => {
    const result = formatExerciseRecap({
      name: "Fentes avant",
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
    });
    expect(result).toContain("Fentes avant");
    expect(result).not.toContain("squat sautés");
  });

  it("uses a pause label ('de pause') distinct from formatExerciseRowSummary's own suffix ('de pause par série') — two different Figma screens, never conflated", () => {
    const recap = formatExerciseRecap({
      name: "Gainage",
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 15,
    });
    const rowSummary = formatExerciseRowSummary({
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 15,
    });
    expect(recap).toContain("de pause");
    expect(rowSummary).toContain("de pause par série");
    expect(recap).not.toContain("de pause par série");
  });

  it("recomputes fully from the given facts — never a static Figma placeholder value", () => {
    const first = formatExerciseRecap({
      name: "Gainage",
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
    });
    const second = formatExerciseRecap({
      name: "Gainage",
      executionMode: "DURATION",
      durationSeconds: 120,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
    });
    expect(first).not.toBe(second);
    expect(second).toContain("2 min");
  });

  describe("mode À l'échec (T01-S10, D-111/D-112)", () => {
    it("synthèse complète : {N} série(s) de {nom}, jusqu'à l'échec, avec {pause} de pause entre les séries. — jamais de durée ni de répétitions cible", () => {
      const result = formatExerciseRecap({
        name: "tractions",
        executionMode: "TO_FAILURE",
        durationSeconds: null,
        repetitionCount: null,
        seriesCount: 3,
        pauseSeconds: 15,
      });
      expect(result).toBe("3 séries de tractions, jusqu’à l’échec, avec 15 s de pause entre les séries.");
      expect(result).not.toContain("min");
    });

    it("omet la clause de pause à 0 s", () => {
      expect(
        formatExerciseRecap({
          name: "tractions",
          executionMode: "TO_FAILURE",
          durationSeconds: null,
          repetitionCount: null,
          seriesCount: 3,
          pauseSeconds: 0,
        }),
      ).toBe("3 séries de tractions, jusqu’à l’échec.");
    });

    it("omet la clause de pause quand une seule Série ne crée aucun intervalle", () => {
      expect(
        formatExerciseRecap({
          name: "tractions",
          executionMode: "TO_FAILURE",
          durationSeconds: null,
          repetitionCount: null,
          seriesCount: 1,
          pauseSeconds: 30,
        }),
      ).toBe("1 série de tractions, jusqu’à l’échec.");
    });
  });
});
