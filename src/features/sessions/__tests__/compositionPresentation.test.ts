import { describe, expect, it } from "@jest/globals";

import {
  variableParameters,
  durationParameters,
  repetitionParameters,
  allFailureParameters,
  uniformParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import type { SessionDurationResult } from "@/domain/activities/executionCalculations";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import {
  COMPACT_LIST_SEPARATOR,
  formatActivityRecoveryLabel,
  formatCompactDuration,
  formatBoundarySecondsValue,
  formatCompositionSessionDuration,
  formatDurationRowValue,
  formatExerciseBodyZones,
  formatExerciseRowSummary,
  formatOccurrenceAccessibilityLabel,
  formatOccurrenceEstimatedDuration,
  formatOccurrenceSummary,
  formatSessionDurationEstimate,
  resolveOccurrenceCategory,
} from "@/features/sessions/compositionPresentation";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { strings } from "@/shared/i18n";

/**
 * V2-PRE-1 (plan §3.1, UI-CDBCCFD16078) : `formatExerciseBodyZones` reçoit
 * désormais les Zones persistées en second argument explicite — `BODY_ZONES`
 * ne sert plus ici qu'à dériver une fixture de test aux mêmes identifiants/
 * noms/ordre que le référentiel historique, jamais comme autorité runtime.
 */
const TEST_BODY_ZONES: readonly BodyZone[] = BODY_ZONES.map((zone) => ({
  id: zone.id,
  name: zone.name,
  isActive: true,
  createdAt: `2026-01-01T00:00:${String(zone.order).padStart(2, "0")}.000Z`,
}));

/** Occurrence placée dans le Circuit (`createExerciseDraft` la place avant le Circuit par défaut). */
function inTourExercise(id: string): SessionDraftExercise {
  return { ...createExerciseDraft(id), structuralPosition: "IN_TOUR" };
}

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
        executionParameters: durationParameters(90, 3, 15),
      }),
    ).toBe("3 séries de 1 min 30 s avec 15 s de pause par série");
  });

  it("mode Répétitions, plusieurs Séries, pause non nulle — exemple exact 'Squats'", () => {
    expect(
      formatExerciseRowSummary({
        executionParameters: repetitionParameters(12, 3, 20),
      }),
    ).toBe("3 séries de 12 répétitions avec 20 s de pause par série");
  });

  it("une seule Série, durée inférieure à une minute, pause nulle — exemple exact 'Étirement'", () => {
    expect(
      formatExerciseRowSummary({
        executionParameters: durationParameters(45, 1, 0),
      }),
    ).toBe("1 série de 45 s");
  });

  it("durée inférieure à une minute (0 minute) : n'affiche jamais '0 min'", () => {
    const result = formatExerciseRowSummary({
      executionParameters: durationParameters(45, 2, 0),
    });
    expect(result).not.toContain("0 min");
    expect(result).toBe("2 séries de 45 s");
  });

  it("durée exactement sur une minute (secondes nulles) : n'affiche jamais '0 s'", () => {
    const result = formatExerciseRowSummary({
      executionParameters: durationParameters(120, 1, 0),
    });
    expect(result).not.toContain("0 s");
    expect(result).toBe("1 série de 2 min");
  });

  it("singulier de Série (1) distinct du pluriel (2+)", () => {
    const singular = formatExerciseRowSummary({
      executionParameters: durationParameters(30, 1, 0),
    });
    const plural = formatExerciseRowSummary({
      executionParameters: durationParameters(30, 2, 0),
    });
    expect(singular).toContain("1 série de");
    expect(singular).not.toContain("1 séries");
    expect(plural).toContain("2 séries de");
  });

  it("singulier de Répétition (1) distinct du pluriel (2+)", () => {
    const singular = formatExerciseRowSummary({
      executionParameters: repetitionParameters(1, 1, 0),
    });
    const plural = formatExerciseRowSummary({
      executionParameters: repetitionParameters(5, 1, 0),
    });
    expect(singular).toBe("1 série de 1 répétition");
    expect(singular).not.toContain("1 répétitions");
    expect(plural).toBe("1 série de 5 répétitions");
  });

  it("pause nulle : la clause de pause est entièrement absente, jamais 'avec 0 s de pause'", () => {
    const result = formatExerciseRowSummary({
      executionParameters: durationParameters(30, 1, 0),
    });
    expect(result).not.toContain("avec");
    expect(result).not.toContain("pause");
  });

  it("pause non nulle inférieure à une minute : affichée en secondes seules", () => {
    const result = formatExerciseRowSummary({
      executionParameters: durationParameters(30, 1, 10),
    });
    expect(result).toBe("1 série de 30 s avec 10 s de pause par série");
  });

  it("pause non nulle avec minutes et secondes : affichée complètement", () => {
    const result = formatExerciseRowSummary({
      executionParameters: durationParameters(30, 1, 75),
    });
    expect(result).toBe("1 série de 30 s avec 1 min 15 s de pause par série");
  });

  it("ne mentionne jamais la Consigne ni les Zones corporelles", () => {
    const result = formatExerciseRowSummary({
      executionParameters: durationParameters(90, 3, 15),
    });
    expect(result.toLowerCase()).not.toContain("consigne");
    expect(result.toLowerCase()).not.toContain("zone");
  });

  describe("mode À l'échec (T01-S10, D-111/D-112)", () => {
    it("synthèse compacte : {N} série(s) jusqu'à l'échec, avec {pause} de pause entre les séries — jamais de cible, jamais de nom", () => {
      expect(
        formatExerciseRowSummary({
          executionParameters: allFailureParameters(3, 15),
        }),
      ).toBe("3 séries à l’échec, avec 15 s de pause entre les séries");
    });

    it("omet entièrement la clause de pause à 0 s", () => {
      expect(
        formatExerciseRowSummary({
          executionParameters: allFailureParameters(4, 0),
        }),
      ).toBe("4 séries à l’échec");
    });

    it("omet la clause de pause quand une seule Série ne crée aucun intervalle", () => {
      expect(
        formatExerciseRowSummary({
          executionParameters: allFailureParameters(1, 30),
        }),
      ).toBe("1 série à l’échec");
    });
  });
});



/**
 * **Correction compacte LOT_3_OF_3 — Zones corporelles d'une Activité.**
 * Demande utilisateur directe, autorisée bien qu'absente de Figma ; aucune
 * nouvelle persistance (`bodyZoneIds` existe depuis T01-S08 — seule sa
 * RESTITUTION est ajoutée).
 */
describe("formatExerciseBodyZones", () => {
  it("returns null when the Activity has no body zone — never an empty string (the caller omits the line entirely)", () => {
    expect(formatExerciseBodyZones([], TEST_BODY_ZONES)).toBeNull();
  });

  it("returns the single zone's name when exactly one is selected", () => {
    expect(formatExerciseBodyZones(["dos"], TEST_BODY_ZONES)).toBe("Dos");
  });

  it("orders the names by the referential order, never by the user's selection order", () => {
    // `epaules` (order 1) précède `dos` (order 4) et `genoux` (order 7),
    // quelle que soit la façon dont l'utilisateur les a cochées.
    expect(formatExerciseBodyZones(["genoux", "dos", "epaules"], TEST_BODY_ZONES)).toBe(
      "Épaules · Dos · Genoux",
    );
    expect(formatExerciseBodyZones(["dos", "epaules"], TEST_BODY_ZONES)).toBe("Épaules · Dos");
  });

  it("joins the names with the canonical separator shared with the Composition summary", () => {
    expect(COMPACT_LIST_SEPARATOR).toBe(" · ");
    expect(formatExerciseBodyZones(["cou", "bras"], TEST_BODY_ZONES)).toBe(
      `Cou${COMPACT_LIST_SEPARATOR}Bras`,
    );
  });

  it("silently ignores an identifier unknown to the referential — never renders a raw id", () => {
    expect(formatExerciseBodyZones(["dos", "zone-inconnue"], TEST_BODY_ZONES)).toBe("Dos");
    expect(formatExerciseBodyZones(["zone-inconnue"], TEST_BODY_ZONES)).toBeNull();
  });

  it("deduplicates repeated identifiers by construction (the referential is walked once, never the selection)", () => {
    expect(formatExerciseBodyZones(["dos", "dos", "epaules"], TEST_BODY_ZONES)).toBe(
      "Épaules · Dos",
    );
  });

  it("renders every zone of the MVP referential when all ten are selected", () => {
    const all = [
      "chevilles-pieds",
      "jambes",
      "genoux",
      "cuisses",
      "hanches-bassin",
      "dos",
      "poignets-mains",
      "bras",
      "epaules",
      "cou",
    ];
    expect(formatExerciseBodyZones(all, TEST_BODY_ZONES)).toBe(
      "Cou · Épaules · Bras · Poignets et mains · Dos · Hanches et bassin · Cuisses · Genoux · Jambes · Chevilles et pieds",
    );
  });

  it("passes a retired zone through unchanged when it is still referenced by the selection (V2-PRE-1, plan §3.1)", () => {
    const retired: readonly BodyZone[] = TEST_BODY_ZONES.map((zone) =>
      zone.id === "dos" ? { ...zone, isActive: false } : zone,
    );
    expect(formatExerciseBodyZones(["dos", "epaules"], retired)).toBe("Épaules · Dos");
  });
});

/**
 * PRE-6 story 2.1 (D-303, D-217, écart E5) : l'information de la ligne structurelle de
 * récupération n'existe que si R > 0 — R absente (`null`) ou nulle : `null`, trait seul
 * (remplace la règle V2-PRE-1 « Récupération 0 s » toujours rendue).
 */
describe("formatActivityRecoveryLabel (PRE-6 story 2.1)", () => {
  it("PRE6-2.1 — R absente ou R = 0 : aucune information (null), jamais « Récupération 0 s »", () => {
    expect(formatActivityRecoveryLabel(null)).toBeNull();
    expect(formatActivityRecoveryLabel(undefined)).toBeNull();
    expect(formatActivityRecoveryLabel(0)).toBeNull();
  });

  it("PRE6-2.1 — R = 20 : « Récupération 20 s » ; R = 90 : « Récupération 1 min 30 s »", () => {
    expect(formatActivityRecoveryLabel(20)).toBe("Récupération 20 s");
    expect(formatActivityRecoveryLabel(90)).toBe("Récupération 1 min 30 s");
  });
});

/**
 * PRE-6 story 2.1 (RM-159, CE-T03-08) : durée de séance de l'en-tête — toutes les
 * occurrences, développées selon la nature du Circuit, sans Compte à rebours ni Fin ; même
 * format et mêmes préfixes que le résumé du Circuit.
 */
describe("formatCompositionSessionDuration (PRE-6 story 2.1)", () => {
  it("PRE6-2.1, story 7.8 — séance vide : « 0 s »", () => {
    expect(formatCompositionSessionDuration({ exercises: [] })).toBe("0 s");
  });

  it("PRE6-2.1 — additionne les trois zones, Circuit développé (× Tours)", () => {
    const exercises: SessionDraftExercise[] = [
      { ...createExerciseDraft("before"), structuralPosition: "BEFORE_TOUR", executionParameters: durationParameters(60) },
      { ...inTourExercise("in"), executionParameters: durationParameters(60) },
      { ...createExerciseDraft("after"), structuralPosition: "AFTER_TOUR", executionParameters: durationParameters(60) },
    ];
    // 60 + 60 × 3 + 60 = 300 s → « ≈ 5 min » (story 7.8 : estimation arrondie aux 15 s).
    expect(formatCompositionSessionDuration({ exercises, tourRepeatCount: 3 })).toBe("≈ 5 min");
  });

  it("PRE6-2.1 — une cible À l'échec donne une borne minimale « ≥ … »", () => {
    const exercises: SessionDraftExercise[] = [
      { ...createExerciseDraft("known"), structuralPosition: "BEFORE_TOUR", executionParameters: durationParameters(90) },
      { ...createExerciseDraft("failure"), structuralPosition: "AFTER_TOUR", executionParameters: allFailureParameters(3, 20) },
    ];
    expect(formatCompositionSessionDuration({ exercises })).toMatch(/^≥ /u);
  });

  it("PRE6-2.1 — suit la nature du Circuit (Tours : contenu × N ; Séries : passages)", () => {
    const exercises: SessionDraftExercise[] = [{ ...inTourExercise("in"), executionParameters: durationParameters(45, 3, 15) }];
    expect(formatCompositionSessionDuration({ exercises, tourRepeatCount: 2, circuitNature: "TOURS" })).not.toBe(
      formatCompositionSessionDuration({ exercises, tourRepeatCount: 1, circuitNature: "TOURS" }),
    );
    expect(formatCompositionSessionDuration({ exercises, tourRepeatCount: 2, circuitNature: "SERIES" })).toMatch(/^≈ /u);
    // Revue 7.8 : valeurs exactes (Séries ≠ Tours).
    expect(formatCompositionSessionDuration({ exercises, tourRepeatCount: 2, circuitNature: "TOURS" })).toBe("≈ 6 min");
    expect(formatCompositionSessionDuration({ exercises, tourRepeatCount: 2, circuitNature: "SERIES" })).toBe("≈ 2 min");
  });
});

describe("V2-BILAT-01 / V2-PRE-1 — side mode in the Tour summary and the exercise duration line", () => {
  describe("formatExerciseRowSummary — carte de Composition (correction bornée, plan `## 4.4`)", () => {
    it("mode Durée, direction PROPRE RIGHT_LEFT : « par côté » après {N} série(s), MAIS jamais la direction développée", () => {
      expect(
        formatExerciseRowSummary({
          executionParameters: durationParameters(90, 3, 15),
          sideMode: "RIGHT_LEFT",
        }),
      ).toBe("3 séries par côté de 1 min 30 s avec 15 s de pause par série");
    });

    it("mode Répétitions, direction PROPRE LEFT_RIGHT : « par côté » présent, aucun suffixe développé", () => {
      expect(
        formatExerciseRowSummary({
          executionParameters: repetitionParameters(12, 3, 0),
          sideMode: "LEFT_RIGHT",
        }),
      ).toBe("3 séries par côté de 12 répétitions");
    });

    it("mode À l'échec, direction PROPRE RIGHT_LEFT : « par côté » présent, aucun suffixe développé", () => {
      expect(
        formatExerciseRowSummary({
          executionParameters: allFailureParameters(3, 15),
          sideMode: "RIGHT_LEFT",
        }),
      ).toBe("3 séries par côté à l’échec, avec 15 s de pause entre les séries");
    });

    it("la carte ne contient JAMAIS les suffixes développés « à droite, puis à gauche » / « à gauche, puis à droite » (plan `## 4.4`)", () => {
      const rightLeft = formatExerciseRowSummary({
        executionParameters: durationParameters(90, 3, 15),
        sideMode: "RIGHT_LEFT",
      });
      const leftRight = formatExerciseRowSummary({
        executionParameters: repetitionParameters(12, 3, 0),
        sideMode: "LEFT_RIGHT",
      });
      expect(rightLeft).not.toContain("à droite, puis à gauche");
      expect(leftRight).not.toContain("à gauche, puis à droite");
    });

    it("Activité unilatérale (sideMode omis ou UNILATERAL) : aucune clause « par côté » — non-régression exacte", () => {
      const facts = {
        executionParameters: durationParameters(90, 3, 15),
      };
      expect(formatExerciseRowSummary(facts)).toBe(formatExerciseRowSummary({ ...facts, sideMode: "UNILATERAL" }));
      expect(formatExerciseRowSummary(facts)).not.toContain("par côté");
    });

    it("direction bilatérale HÉRITÉE du Tour (`isSideModeInherited`) : aucune clause « par côté », comme une Activité unilatérale", () => {
      const inherited = formatExerciseRowSummary({
        executionParameters: durationParameters(90, 3, 15),
        sideMode: "RIGHT_LEFT",
        isSideModeInherited: true,
      });
      expect(inherited).toBe(
        formatExerciseRowSummary({
          executionParameters: durationParameters(90, 3, 15),
        }),
      );
      expect(inherited).not.toContain("par côté");
    });
  });

});

/**
 * PRE-3 — adaptations minimales des consommateurs partagés (P3-22).
 */
describe("PRE-3 — synthèses de Composition (adaptation minimale, P3-22)", () => {
  const canonical = (overrides: Partial<ExecutionParameters> = {}): ExecutionParameters =>
    variableParameters({
      mode: "DURATION",
      rows: [
        [30, 10],
        [45, 20],
        [60, 30],
      ],
      countdownSeconds: 10,
      endSeconds: 5,
      ...overrides,
    });

  it("P3-22/scope-regression — carte : indicateur « N séries variables » sans détail des valeurs (v13 §7) ; Régime identiques inchangé ; ≈ pour un travail estimé", () => {
    const base = {
      executionParameters: durationParameters(30, 3, 10),
    };
    // Régime identiques : synthèse historique rigoureusement inchangée.
    expect(formatExerciseRowSummary(base)).toBe("3 séries de 30 s avec 10 s de pause par série");
    expect(formatExerciseRowSummary({ ...base, executionParameters: canonical() })).toBe("3 séries variables");
    expect(
      formatExerciseRowSummary({
        ...base,
        sideMode: "RIGHT_LEFT",
        executionParameters: canonical({ sideMode: "RIGHT_LEFT" }),
      }),
    ).toBe("3 séries variables par côté");
    // PRE-4 (story 1.1, Q24, H20) : Régime variables dont toutes les Cibles sont
    // à l'échec (ancien mode migré) → « N séries à l’échec » (auparavant « N
    // séries variables »).
    expect(
      formatExerciseRowSummary({
        ...base,
        executionParameters: variableParameters({
          mode: "REPETITIONS",
          rows: [
            ["FAILURE", 10],
            ["FAILURE", 20],
          ],
        }),
      }),
    ).toBe("2 séries à l’échec");

    // Répétitions avec bip : contribution ESTIMÉE (≈) ; sans bip : borne (≥).
    const reps = {
      ...inTourExercise("ex-r"),
      executionParameters: repetitionParameters(15, 4, 15, { cadenceBeepIntervalSeconds: 4, countdownSeconds: 10, endSeconds: 5 }),
    };
    // Story 7.8 : la durée de séance (seul affichage de durée de la Composition) garde le préfixe.
    expect(formatCompositionSessionDuration({ exercises: [reps] })).toMatch(/^≈ /u);
    expect(
      formatCompositionSessionDuration({
        exercises: [{ ...reps, executionParameters: { ...reps.executionParameters, cadenceBeepIntervalSeconds: 0 } }],
      }),
    ).toMatch(/^≥ /u);
  });

  it("PRE4-1.1/AC21 — tout échec : « N séries à l’échec », jamais « 0 s » ni « 0 rép. » ; Cible à renseigner : « Paramètres à compléter. »", () => {
    const failure = formatExerciseRowSummary({ executionParameters: allFailureParameters(3, 10, { cadenceBeepIntervalSeconds: 2 }) });
    expect(failure).toBe("3 séries à l’échec, avec 10 s de pause entre les séries");
    expect(failure).not.toMatch(/(^|[^0-9])0 s|0 rép/);
    expect(formatExerciseRowSummary({ executionParameters: repetitionParameters("UNSET", 3, 10) })).toBe(
      "Paramètres à compléter.",
    );
  });
});

describe("PRE-4 story 2.2 — AC1 `formatCompactDuration` converge sur le formateur du domaine", () => {
  it("PRE4-2.2/AC1 — mêmes sorties « 45 s », « 1 min », « 1 min 30 s », et valeurs de l'AC1", () => {
    const cases: readonly (readonly [number, string])[] = [
      [0, "0 s"],
      [15, "15 s"],
      [45, "45 s"],
      [60, "1 min"],
      [90, "1 min 30 s"],
      [1265, "21 min 5 s"],
      [3665, "61 min 5 s"],
      [3960, "66 min"],
      [4500, "75 min"],
    ];
    for (const [seconds, expected] of cases) {
      expect(formatCompactDuration(seconds)).toBe(expected);
      expect(formatCompactDuration(seconds)).toBe(formatPhraseDuration(seconds));
    }
  });
});

/**
 * PRE-4 story 2.4 — résumé de Composition (AC5, AC6) et résumé compact des
 * Séries (AC3, AC4). Attendus écrits en constantes ou en formules dans le
 * test (AD-10), jamais recalculés par le code testé.
 */
describe("PRE-4 story 2.4 — durées et résumés des cartes", () => {
  // R01 : Durée, Régime variables, 30 s / 45 s / à l’échec, Pauses 10 s × 3.
  const r01 = (): ExecutionParameters =>
    variableParameters({
      rows: [
        [30, 10],
        [45, 10],
        ["FAILURE", 10],
      ],
    });
  const r01InTour = (): SessionDraftExercise => ({
    ...inTourExercise("r01"),
    name: "R01",
    postActivityRecoverySeconds: 0,
    executionParameters: r01(),
  });

  it("PRE4-2.4/AC5, story 7.8 — Composition `lowerBound` : « ≥ » en min s, arrondi aux 15 s ; Circuit ×1 → ≥ 1 min 45 s, ×2 → ≥ 3 min 30 s", () => {
    // (30 + 45) + 3 × 10 = 105 s ; × 2 = 210 s (multiples de 15 : inchangés).
    expect(formatCompositionSessionDuration({ exercises: [r01InTour()], tourRepeatCount: 1 })).toBe("≥ 1 min 45 s");
    expect(formatCompositionSessionDuration({ exercises: [r01InTour()], tourRepeatCount: 2 })).toBe("≥ 3 min 30 s");
  });

  it("PRE4-2.4/AC5 — Composition : Cible à renseigner (Q30) et Exercice omis contribuent leurs secondes connues, en « ≥ » sans arrondi", () => {
    // Copie Durée 30 s / UNSET / 45 s, Pauses 10 s × 3 : (30 + 45) + 30 = 105 s.
    expect(
      formatCompositionSessionDuration({
        exercises: [
          {
            ...r01InTour(),
            executionParameters: variableParameters({ rows: [[30, 10], ["UNSET", 10], [45, 10]] }),
          },
        ],
      }),
    ).toBe("≥ 1 min 45 s");
    // Omis : Répétitions Bip 0, Pauses 10 s × 3 = 30 s.
    expect(
      formatCompositionSessionDuration({
        exercises: [{ ...r01InTour(), executionParameters: repetitionParameters(12, 3, 10) }],
      }),
    ).toBe("≥ 30 s");
  });

  it("PRE4-2.4/AC5, story 7.8 — Composition `exact` et `estimated` : estimation « ≈ » arrondie aux 15 s (D-443)", () => {
    // exact : 3 × 55 s = 165 s → « ≈ 2 min 45 s ».
    expect(
      formatCompositionSessionDuration({
        exercises: [{ ...inTourExercise("e"), postActivityRecoverySeconds: 0, executionParameters: durationParameters(55, 3, 0) }],
      }),
    ).toBe("≈ 2 min 45 s");
    // exact : 2 × 60 s = 120 s → « ≈ 2 min ».
    expect(
      formatCompositionSessionDuration({
        exercises: [{ ...inTourExercise("e"), postActivityRecoverySeconds: 0, executionParameters: durationParameters(60, 2, 0) }],
      }),
    ).toBe("≈ 2 min");
    // estimé : 2 × 13 rép. × 4 s = 104 s → 105 s, « ≈ 1 min 45 s ».
    expect(
      formatCompositionSessionDuration({
        exercises: [
          {
            ...inTourExercise("e"),
            postActivityRecoverySeconds: 0,
            executionParameters: repetitionParameters(13, 2, 0, { cadenceBeepIntervalSeconds: 4 }),
          },
        ],
      }),
    ).toBe("≈ 1 min 45 s");
  });

  it("PRE4-2.4/AC5 — la ligne Exercice de Composition n’acquiert aucune durée propre (Q4)", () => {
    const row = formatExerciseRowSummary({ executionParameters: r01() });
    expect(row).toBe("3 séries variables");
  });

  it("PRE4-2.4/AC6 — symbole « ≥ » issu du lexique, montant issu du formateur du domaine, aucune Phrase", () => {
    expect(strings.shared.durationNature.lowerBoundPrefix).toBe("≥ ");
    const summary = formatCompositionSessionDuration({ exercises: [r01InTour()] });
    expect(summary).toBe("≥ 1 min 45 s");
  });

  it("PRE4-2.4/AC3 — Cible à renseigner : « Paramètres à compléter. », aucune valeur ni durée", () => {
    expect(strings.executionParameters.card.incomplete).toBe("Paramètres à compléter.");
    for (const executionParameters of [
      durationParameters("UNSET", 3, 10),
      repetitionParameters("UNSET", 3, 10),
      variableParameters({ rows: [[30, 10], ["UNSET", 10], [45, 10]] }),
      variableParameters({ mode: "REPETITIONS", rows: [[12, 10], ["UNSET", 10], ["FAILURE", 10]] }),
    ]) {
      expect(formatExerciseRowSummary({ executionParameters })).toBe("Paramètres à compléter.");
    }
  });

  /**
   * AC4 : matrice Mode × Régime × position de l’échec × bilatéralité (propre
   * ou héritée), avec ou sans Pause et Bip, y compris des Cibles `UNSET`.
   * Jamais « 0 s », « 0 min » ni « 0 rép. ».
   */
  it("PRE4-2.4/AC4 — matrice Mode × Régime × position de l’échec × bilatéral : jamais « 0 s » ni « 0 rép. »", () => {
    const ZERO = /(^|[^0-9])0 (s|min|rép\.)/u;
    const INCOMPLETE = "Paramètres à compléter.";
    const modes = ["DURATION", "REPETITIONS"] as const;
    const failurePositions = ["none", "first", "middle", "last", "all", "unset", "unsetAndFailure"] as const;
    // Bilatéralité héritée : les paramètres propres de l’Exercice restent UNILATERAL.
    const sides = [
      { sideMode: "UNILATERAL", ownSideMode: "UNILATERAL", inherited: false, perSide: "" },
      { sideMode: "RIGHT_LEFT", ownSideMode: "RIGHT_LEFT", inherited: false, perSide: " par côté" },
      { sideMode: "RIGHT_LEFT", ownSideMode: "UNILATERAL", inherited: true, perSide: "" },
    ] as const;
    const pauses = [0, 10] as const;
    const beeps = [0, 2] as const;
    const numberFor = (mode: (typeof modes)[number], index: number): number =>
      mode === "DURATION" ? [30, 45, 60][index]! : [12, 10, 8][index]!;
    let cases = 0;

    for (const mode of modes) {
      for (const position of failurePositions) {
        for (const side of sides) {
          for (const pause of pauses) {
            for (const beep of beeps) {
              const targets = [0, 1, 2].map((index) => {
                if ((position === "unset" || position === "unsetAndFailure") && index === 1) {
                  return "UNSET" as const;
                }
                const isFailure =
                  position === "all" ||
                  ((position === "first" || position === "unsetAndFailure") && index === 0) ||
                  (position === "middle" && index === 1) ||
                  (position === "last" && index === 2);
                return isFailure ? ("FAILURE" as const) : numberFor(mode, index);
              });
              const options = { sideMode: side.ownSideMode, cadenceBeepIntervalSeconds: beep };
              const isUnset = position === "unset" || position === "unsetAndFailure";

              // Régime variables : toutes les positions.
              const variable = formatExerciseRowSummary({
                executionParameters: variableParameters({
                  ...options,
                  mode,
                  rows: targets.map((target) => [target, pause] as const),
                }),
                sideMode: side.sideMode,
                isSideModeInherited: side.inherited,
              });
              expect(variable).not.toMatch(ZERO);
              expect(variable).toBe(
                isUnset
                  ? INCOMPLETE
                  : position === "all"
                    ? `3 séries${side.perSide} à l’échec`
                    : `3 séries variables${side.perSide}`,
              );
              cases += 1;

              // Régime identiques : l’échec n’y est que « aucun » ou « toutes » ; Cible `UNSET`.
              if (position === "unset") {
                const unset = formatExerciseRowSummary({
                  executionParameters: uniformParameters({ ...options, mode, count: 3, target: "UNSET", pauseSeconds: pause }),
                  sideMode: side.sideMode,
                  isSideModeInherited: side.inherited,
                });
                expect(unset).toBe(INCOMPLETE);
                cases += 1;
              }
              if (position === "none" || position === "all") {
                const target = position === "all" ? ("FAILURE" as const) : numberFor(mode, 0);
                const uniform = formatExerciseRowSummary({
                  executionParameters: uniformParameters({ ...options, mode, count: 3, target, pauseSeconds: pause }),
                  sideMode: side.sideMode,
                  isSideModeInherited: side.inherited,
                });
                expect(uniform).not.toMatch(ZERO);
                const pauseClause =
                  pause === 0 ? "" : position === "all" ? ", avec 10 s de pause entre les séries" : " avec 10 s de pause par série";
                const work = mode === "DURATION" ? "30 s" : "12 répétitions";
                expect(uniform).toBe(
                  position === "all"
                    ? `3 séries${side.perSide} à l’échec${pauseClause}`
                    : `3 séries${side.perSide} de ${work}${pauseClause}`,
                );
                cases += 1;
              }
            }
          }
        }
      }
    }
    // Variables : 2 Modes × 7 positions × 3 bilatéralités × 2 Pauses × 2 Bips = 168 ;
    // identiques : 2 × 3 (aucun, toutes, `UNSET`) × 3 × 2 × 2 = 72.
    expect(cases).toBe(168 + 72);
  });

  it("PRE4-2.4/AC4 — Cibles mixtes : « 3 séries variables » ; tout échec : « 3 séries à l’échec » dans les deux Régimes et les deux Modes", () => {
    expect(formatExerciseRowSummary({ executionParameters: r01() })).toBe("3 séries variables");
    for (const mode of ["DURATION", "REPETITIONS"] as const) {
      expect(
        formatExerciseRowSummary({
          executionParameters: variableParameters({ mode, rows: [["FAILURE", 10], ["FAILURE", 20], ["FAILURE", 30]] }),
        }),
      ).toBe("3 séries à l’échec");
      expect(formatExerciseRowSummary({ executionParameters: uniformParameters({ mode, count: 3, target: "FAILURE" }) })).toBe(
        "3 séries à l’échec",
      );
    }
    // Cibles numériques : formateur du domaine, mêmes sorties que le code de départ.
    expect(formatExerciseRowSummary({ executionParameters: durationParameters(90, 3, 75) })).toBe(
      "3 séries de 1 min 30 s avec 1 min 15 s de pause par série",
    );
  });
});

/** PRE-6 (story 1.3, D-382, D-390, D-399) : résumé = durée de ce seul Circuit, selon sa nature. */
describe("formatOccurrenceSummary (PRE-6 story 2.2, D-238)", () => {
  const summaryOf = (executionParameters: ExecutionParameters) => formatOccurrenceSummary({ executionParameters });

  it("one series: the target alone (« 45 s », « 10 rép. »)", () => {
    expect(summaryOf(durationParameters(45, 1, 0, { sideMode: "RIGHT_LEFT" }))).toBe("45 s");
    expect(summaryOf(repetitionParameters(10))).toBe("10 rép.");
  });

  it("identical series: « N × cible » with unit, compact duration format", () => {
    expect(summaryOf(durationParameters(90, 3, 15))).toBe(`3 × ${formatCompactDuration(90)}`);
    expect(summaryOf(durationParameters(90, 3, 15))).toBe("3 × 1 min 30 s");
    expect(summaryOf(repetitionParameters(10, 3, 30))).toBe("3 × 10 rép.");
    // Circuit de Séries N = 4 : N des paramètres adaptés (story 1.4), aucune règle propre.
    expect(summaryOf(repetitionParameters(10, 4))).toBe("4 × 10 rép.");
  });

  it("variable series: values separated by « · », unit at the end, three values at most then « … »", () => {
    expect(
      summaryOf(variableParameters({ mode: "REPETITIONS", rows: [[10, 0], [12, 0], [14, 0], [16, 0]] })),
    ).toBe("10 · 12 · 14 … rép.");
    expect(summaryOf(variableParameters({ mode: "REPETITIONS", rows: [[10, 0], [12, 0], [14, 0]] }))).toBe(
      "10 · 12 · 14 rép.",
    );
    expect(summaryOf(variableParameters({ rows: [[30, 0], [45, 0]] }))).toBe("30 s · 45 s");
    expect(summaryOf(variableParameters({ mode: "REPETITIONS", rows: [[10, 0], ["FAILURE", 0]] }))).toBe(
      "10 · à l’échec rép.",
    );
  });

  it("all targets at failure: existing business label (same wording as formatExerciseRowSummary, no pause)", () => {
    expect(summaryOf(allFailureParameters(1))).toBe("1 série à l’échec");
    expect(summaryOf(allFailureParameters(3, 30))).toBe("3 séries à l’échec");
    expect(summaryOf(allFailureParameters(3, 30, { sideMode: "RIGHT_LEFT" }))).toBe("3 séries à l’échec");
  });

  it("no series at all: incomplete label first, never the failure label (`[].every()` is true)", () => {
    expect(summaryOf(variableParameters({ mode: "REPETITIONS", rows: [] }))).toBe(
      strings.executionParameters.card.incomplete,
    );
  });

  it("incomplete parameters: existing « Paramètres à compléter. » label", () => {
    expect(summaryOf(repetitionParameters("UNSET", 3))).toBe(strings.executionParameters.card.incomplete);
    expect(summaryOf({ ...durationParameters(45), mode: null } as unknown as ExecutionParameters)).toBe(
      strings.executionParameters.card.incomplete,
    );
    // PRE-7 (D-446, MFN-08) : frère incomplet (durée de phase manquante) à Cible chiffrée ou à
    // l'échec — « Paramètres à compléter. » dans la synthèse d'occurrence et dans celle de la ligne.
    for (const target of [6, "FAILURE"] as const) {
      const incomplete = uniformParameters({
        mode: "DURATION",
        count: 3,
        target,
        pauseSeconds: 10,
        workPhases: [
          { id: 1, label: "a", durationSeconds: 6 },
          { id: 2, label: "b", durationSeconds: 0 },
        ],
      });
      expect(summaryOf(incomplete)).toBe(strings.executionParameters.card.incomplete);
      expect(formatExerciseRowSummary({ executionParameters: incomplete })).toBe(strings.executionParameters.card.incomplete);
    }
  });

  it("never repeats the name nor the mode, never shows a pause or a recovery", () => {
    const summary = summaryOf(durationParameters(90, 3, 15));
    expect(summary).not.toMatch(/pause|Récupération|Durée|série/u);
  });
});

describe("formatOccurrenceEstimatedDuration / formatOccurrenceAccessibilityLabel (PRE-6 story 2.2)", () => {
  const occurrence = (overrides: Partial<SessionDraftExercise>): SessionDraftExercise => ({
    ...createExerciseDraft("ex-1"),
    name: "Gainage",
    structuralPosition: "BEFORE_TOUR",
    ...overrides,
  });

  it("estimated line only for Répétitions with a beep", () => {
    expect(
      formatOccurrenceEstimatedDuration(
        occurrence({ executionParameters: repetitionParameters(10, 1, 0, { cadenceBeepIntervalSeconds: 6 }) }),
      ),
    ).toBe("≈ 1 min");
    expect(formatOccurrenceEstimatedDuration(occurrence({ executionParameters: repetitionParameters(10) }))).toBeNull();
    expect(formatOccurrenceEstimatedDuration(occurrence({ executionParameters: durationParameters(45) }))).toBeNull();
  });

  it("accessibility label: type, name, « n sur m », occurrence duration (one pass in a Tours Circuit)", () => {
    expect(
      formatOccurrenceAccessibilityLabel(occurrence({ executionParameters: durationParameters(45) }), { index: 0, count: 3 }),
    ).toBe("Exercice, Gainage, 1 sur 3, 1 min");
    expect(
      formatOccurrenceAccessibilityLabel(
        occurrence({ structuralPosition: "IN_TOUR", executionParameters: durationParameters(150) }),
        { index: 1, count: 2 },
        { circuitNature: "TOURS", tourRepeatCount: 5 },
      ),
    ).toBe("Exercice, Gainage, 2 sur 2, 3 min");
  });

  it("PRE-7 (R-3, Q3) : accessibility label of a copy carries its derived suffix", () => {
    expect(
      formatOccurrenceAccessibilityLabel(occurrence({ executionParameters: durationParameters(45), copyNumber: 1 }), { index: 0, count: 1 }),
    ).toBe("Exercice, Gainage (copie), 1 sur 1, 1 min");
    expect(
      formatOccurrenceAccessibilityLabel(occurrence({ executionParameters: durationParameters(45), copyNumber: 2 }), { index: 0, count: 1 }),
    ).toBe("Exercice, Gainage (copie 2), 1 sur 1, 1 min");
  });

  it("accessibility label: omits a duration without amount (never « ≥ 0 min »), appends « changement de côté » when bilateral", () => {
    expect(
      formatOccurrenceAccessibilityLabel(occurrence({ executionParameters: repetitionParameters(10, 3, 30) }), { index: 0, count: 1 }),
    ).toBe("Exercice, Gainage, 1 sur 1");
    expect(
      formatOccurrenceAccessibilityLabel(
        occurrence({ executionParameters: durationParameters(45), sideMode: "LEFT_RIGHT" }),
        { index: 0, count: 1 },
      ),
    ).toBe(`Exercice, Gainage, 1 sur 1, 1 min, ${strings.screens.composition.occurrenceCard.accessibilitySideChange}`);
  });

  // Revue 7.8 : branche « ≈ » du nom accessible d'une carte (`formatSessionDurationResult`),
  // autrefois couvertes par les tests du résumé du Circuit.
  it("accessibility label: « ≈ » for Répétitions with a beep (an unknown work has no amount: omitted, see above)", () => {
    expect(
      formatOccurrenceAccessibilityLabel(
        occurrence({ executionParameters: repetitionParameters(10, 1, 0, { cadenceBeepIntervalSeconds: 6 }) }),
        { index: 0, count: 1 },
      ),
    ).toBe("Exercice, Gainage, 1 sur 1, ≈ 1 min");
  });

  it("SERIES Circuit: label gives the total of the passes, estimated line follows the passes too", () => {
    const series = { circuitNature: "SERIES", tourRepeatCount: 2 } as const;
    // Deux passages : (90 + 30) × 2 = 240 s.
    expect(
      formatOccurrenceAccessibilityLabel(
        occurrence({ structuralPosition: "IN_TOUR", executionParameters: durationParameters(90, 2, 30) }),
        { index: 0, count: 1 },
        series,
      ),
    ).toBe("Exercice, Gainage, 1 sur 1, 4 min");
    expect(
      formatOccurrenceEstimatedDuration(
        occurrence({
          structuralPosition: "IN_TOUR",
          executionParameters: repetitionParameters(10, 2, 30, { cadenceBeepIntervalSeconds: 6 }),
        }),
        series,
      ),
    ).toMatch(/^≈ /u);
    expect(
      formatOccurrenceEstimatedDuration(
        occurrence({ structuralPosition: "IN_TOUR", executionParameters: durationParameters(90, 2, 30) }),
        series,
      ),
    ).toBeNull();
  });
});

describe("resolveOccurrenceCategory (PRE-6 story 2.2)", () => {
  const categories = [
    {
      id: "mobilite",
      name: "Mobilité",
      canonicalKey: "mobilite",
      color: "#2E9B62",
      isPredefined: true,
      displayOrder: 2,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ] as const;

  it("resolves name and color, null without id or for an unknown id", () => {
    expect(resolveOccurrenceCategory("mobilite", categories)).toEqual({ name: "Mobilité", color: "#2E9B62" });
    expect(resolveOccurrenceCategory(null, categories)).toBeNull();
    expect(resolveOccurrenceCategory(undefined, categories)).toBeNull();
    expect(resolveOccurrenceCategory("inconnue", categories)).toBeNull();
  });
});

/**
 * PRE-6 story 7.8 (D-443) : durée de la Séance de la zone de contexte — estimation arrondie aux 15 s
 * les plus proches, « ≥ » pour une borne minimale, « ≈ » sinon ; bornes de séance en secondes.
 */
describe("formatSessionDurationEstimate / formatBoundarySecondsValue (PRE-6 story 7.8)", () => {
  it.each([
    [{ kind: "exact", seconds: 0 }, "0 s"],
    [{ kind: "exact", seconds: 45 }, "≈ 45 s"],
    [{ kind: "exact", seconds: 52 }, "≈ 45 s"],
    [{ kind: "exact", seconds: 53 }, "≈ 1 min"],
    [{ kind: "exact", seconds: 7.5 }, "≈ 15 s"],
    [{ kind: "exact", seconds: 734 }, "≈ 12 min 15 s"],
    [{ kind: "exact", seconds: 180 }, "≈ 3 min"],
    [{ kind: "estimated", seconds: 104 }, "≈ 1 min 45 s"],
    [{ kind: "lowerBound", seconds: 0 }, "≥ 0 s"],
    // Revue 7.8 : « ≥ » prend la tranche inférieure (le minimum affiché reste vrai).
    [{ kind: "lowerBound", seconds: 97 }, "≥ 1 min 30 s"],
    [{ kind: "lowerBound", seconds: 104 }, "≥ 1 min 30 s"],
    [{ kind: "lowerBound", seconds: 105 }, "≥ 1 min 45 s"],
    // Revue 7.8 : une durée positive n'affiche jamais « ≈ 0 s ».
    [{ kind: "exact", seconds: 5 }, "≈ 15 s"],
    [{ kind: "estimated", seconds: 7 }, "≈ 15 s"],
    [{ kind: "exact", seconds: Number.NaN }, "0 s"],
    [{ kind: "lowerBound", seconds: 210 }, "≥ 3 min 30 s"],
  ] as [SessionDurationResult, string][])("%o → « %s »", (duration, expected) => {
    expect(formatSessionDurationEstimate(duration)).toBe(expected);
  });

  it("bornes de séance : secondes seules, bornées à 0..60", () => {
    expect(formatBoundarySecondsValue(0)).toBe("0 s");
    expect(formatBoundarySecondsValue(45)).toBe("45 s");
    expect(formatBoundarySecondsValue(60)).toBe("60 s");
    expect(formatBoundarySecondsValue(90)).toBe("60 s");
    expect(formatBoundarySecondsValue(3599)).toBe("60 s");
  });
});
