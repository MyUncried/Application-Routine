import { describe, expect, it } from "@jest/globals";

import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import {
  COMPACT_LIST_SEPARATOR,
  formatActivityRecoveryLabel,
  formatCompositionSummary,
  formatDurationRowValue,
  formatExerciseBodyZones,
  formatExerciseDurationLine,
  formatExerciseRecap,
  formatExerciseRowSummary,
} from "@/features/sessions/compositionPresentation";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";

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
/**
 * `formatCompositionSummary` est la synthèse DU TOUR (affichée sous
 * `Nombre de tours`), pas celle de la Composition entière — elle n'agrège
 * donc que les Activités `IN_TOUR` (correctif T02 post-test-utilisateur,
 * 2026-09-08 ; voir le docstring de la fonction). Comme `createExerciseDraft`
 * positionne toute nouvelle Activité `BEFORE_TOUR` par défaut (T02-S01,
 * `DEFAULT_STRUCTURAL_POSITION`), les fixtures ci-dessous qui n'exercent que
 * la FORMULE (durée/pluriel/bornes), indépendamment des zones, placent
 * explicitement leur unique Activité `IN_TOUR` via ce petit alias — sans
 * quoi elles seraient silencieusement exclues de la synthèse et
 * produiraient toujours `"0 exercice · 0 min"`.
 */
function inTourExercise(id: string): SessionDraftExercise {
  return { ...createExerciseDraft(id), structuralPosition: "IN_TOUR" };
}

describe("formatCompositionSummary", () => {
  it("displays the exact local empty-state label when there is no Activity yet", () => {
    expect(formatCompositionSummary({ exercises: [] })).toBe("0 exercice · 0 min");
  });

  it("formats a single 45s Activity (1 série, sans pause) as '1 exercice · 1 min'", () => {
    expect(
      formatCompositionSummary({
        exercises: [{ ...inTourExercise("ex-1"), name: "Gainage", durationSeconds: 45 }],
      }),
    ).toBe("1 exercice · 1 min");
  });

  it("rounds a non-exact minute up (61s) to '1 exercice · 2 min' (Math.ceil, never underestimating)", () => {
    expect(
      formatCompositionSummary({
        exercises: [{ ...inTourExercise("ex-1"), name: "Gainage", durationSeconds: 61 }],
      }),
    ).toBe("1 exercice · 2 min");
  });

  // PRE-3 (P3-12) : une cible Durée absente est un travail INCONNU — jamais
  // un zéro présenté comme exact ; seule la borne minimale connue (« ≥ »).
  it("treats a null exercise duration as unknown work (lower bound), never as an exact 0", () => {
    expect(
      formatCompositionSummary({
        exercises: [{ ...inTourExercise("ex-1"), name: "Gainage", durationSeconds: null }],
      }),
    ).toBe("1 exercice · ≥ 0 min");
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
    const exercises = [{ ...inTourExercise("ex-1"), name: "Gainage", durationSeconds: 45 }];
    expect(formatCompositionSummary({ exercises })).toBe(formatCompositionSummary({ exercises }));
  });

  describe("mode Répétitions (T01-S08, arbitrage B — RM-072/D-070/D-008)", () => {
    /**
     * T02-S02 (RM-129) : la Pause n'est développée que `C − 1` fois. Une
     * fixture à UNE Série ne produirait donc plus AUCUNE pause et rendrait
     * tous les attendus `≥ N min` ci-dessous égaux à `0 min` — la fixture
     * porte désormais DEUX Séries, ce qui produit exactement une occurrence
     * de Pause et conserve la valeur que ces tests mesurent.
     */
    function repetitionExercise(repetitionCount: number, pauseSeconds = 0): SessionDraftExercise {
      return {
        ...inTourExercise("ex-1"),
        name: "Fentes",
        executionMode: "REPETITIONS" as const,
        durationSeconds: null,
        repetitionCount,
        seriesCount: 2,
        pauseSeconds,
      };
    }

    it("prefixes the duration with '≥' and ignores the exercise's own duration entirely (only the pause contributes)", () => {
      expect(
        formatCompositionSummary({ exercises: [repetitionExercise(12, 20)] }),
      ).toBe("1 exercice · ≥ 1 min"); // 2 Séries × 20 s = 40 s -> ceil(40/60) = 1 min
    });

    it("still applies Math.ceil to the pause sum alone", () => {
      expect(
        formatCompositionSummary({ exercises: [repetitionExercise(20, 65)] }),
      ).toBe("1 exercice · ≥ 3 min"); // 2 Séries × 65 s = 130 s -> ceil(130/60) = 3 min
    });

    it("never underestimates: a repetition count change alone never changes the displayed minimum", () => {
      const first = formatCompositionSummary({ exercises: [repetitionExercise(5, 20)] });
      const second = formatCompositionSummary({ exercises: [repetitionExercise(50, 20)] });
      expect(first).toBe(second);
      expect(first).toBe("1 exercice · ≥ 1 min");
    });

    it("never shows the '≥' prefix in Duration mode", () => {
      const result = formatCompositionSummary({
        exercises: [{ ...inTourExercise("ex-1"), name: "Gainage", durationSeconds: 45 }],
      });
      expect(result).not.toContain("≥");
    });
  });

  describe("Séries et Pause après Série (T01-S08, revue PR #9 — RM-036/RM-037/RM-071/RM-072)", () => {
    it("mode Durée, SANS Récupération : multiplie durationSeconds ET la Pause par seriesCount (90s, 3 Séries, pause 15s -> 315s -> 6 min)", () => {
      expect(
        formatCompositionSummary({
          exercises: [
            {
              ...inTourExercise("ex-1"),
              name: "Gainage",
              durationSeconds: 90,
              seriesCount: 3,
              pauseSeconds: 15,
            },
          ],
        }),
      ).toBe("1 exercice · 6 min"); // 3*90 + 3*15 = 315s -> ceil(315/60) = 6 min
    });

    it("mode Durée, AVEC une Récupération ÉGALE à la Pause : total inchangé — elle REMPLACE la dernière Pause au lieu de s'y ajouter", () => {
      expect(
        formatCompositionSummary({
          exercises: [
            {
              ...inTourExercise("ex-1"),
              name: "Gainage",
              durationSeconds: 90,
              seriesCount: 3,
              pauseSeconds: 15,
              postActivityRecoverySeconds: 15,
            },
          ],
        }),
        // 3*90 + 2*15 + 15 = 315 s — strictement la même valeur que sans
        // Récupération (3*90 + 3*15). Un cumul aurait donné 330 s.
      ).toBe("1 exercice · 6 min");
    });

    it("mode Durée, AVEC une Récupération PLUS LONGUE que la Pause : le total augmente exactement de l'écart", () => {
      expect(
        formatCompositionSummary({
          exercises: [
            {
              ...inTourExercise("ex-1"),
              name: "Gainage",
              durationSeconds: 90,
              seriesCount: 3,
              pauseSeconds: 15,
              postActivityRecoverySeconds: 75,
            },
          ],
        }),
        // 3*90 + 2*15 + 75 = 375 s, soit `315 + (75 − 15)`.
      ).toBe("1 exercice · 7 min");
    });

    it("mode Répétitions : la Pause après Série reste comptée (déterminable) même si la durée de l'Exercice ne l'est pas (3 Séries, pause 20s -> 40s -> ≥ 1 min)", () => {
      expect(
        formatCompositionSummary({
          exercises: [
            {
              ...inTourExercise("ex-1"),
              name: "Fentes",
              executionMode: "REPETITIONS",
              durationSeconds: null,
              repetitionCount: 12,
              seriesCount: 3,
              pauseSeconds: 20,
            },
          ],
        }),
      ).toBe("1 exercice · ≥ 1 min"); // 3*20 = 60s -> ceil(60/60) = 1 min
    });

    it("Pause nulle : n'ajoute rien à la durée estimée, quel que soit seriesCount", () => {
      expect(
        formatCompositionSummary({
          exercises: [
            {
              ...inTourExercise("ex-1"),
              name: "Gainage",
              durationSeconds: 45,
              seriesCount: 4,
              pauseSeconds: 0,
            },
          ],
        }),
      ).toBe("1 exercice · 3 min"); // 4*45 + 4*0 = 180s -> ceil(180/60) = 3 min
    });

    it("une seule Série : non-régression, formule équivalente au comportement historique (seriesCount=1)", () => {
      expect(
        formatCompositionSummary({
          exercises: [
            {
              ...inTourExercise("ex-1"),
              name: "Gainage",
              durationSeconds: 45,
              seriesCount: 1,
              pauseSeconds: 0,
            },
          ],
        }),
      ).toBe("1 exercice · 1 min"); // 45s -> ceil(45/60) = 1 min
    });

    it("fait varier seriesCount seul : le résultat change en conséquence", () => {
      const oneSeries = formatCompositionSummary({
        exercises: [
          { ...inTourExercise("ex-1"), name: "Gainage", durationSeconds: 45, seriesCount: 1 },
        ],
      });
      const threeSeries = formatCompositionSummary({
        exercises: [
          { ...inTourExercise("ex-1"), name: "Gainage", durationSeconds: 45, seriesCount: 3 },
        ],
      });
      expect(oneSeries).toBe("1 exercice · 1 min"); // 45s
      expect(threeSeries).toBe("1 exercice · 3 min"); // 3*45 = 135s -> ceil(135/60) = 3 min
      expect(oneSeries).not.toBe(threeSeries);
    });

    it("fait varier pauseSeconds seul : le résultat change en conséquence", () => {
      const noPause = formatCompositionSummary({
        exercises: [
          {
            ...inTourExercise("ex-1"),
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
            ...inTourExercise("ex-1"),
            name: "Gainage",
            durationSeconds: 45,
            seriesCount: 2,
            pauseSeconds: 60,
          },
        ],
      });
      expect(noPause).toBe("1 exercice · 2 min"); // 2*45 = 90s -> ceil(90/60) = 2 min
      // Aucune Récupération : la Pause suit chacune des 2 Séries —
      // 2*45 + 2*60 = 210s -> ceil(210/60) = 4 min.
      expect(withPause).toBe("1 exercice · 4 min");
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
          { ...inTourExercise("ex-1"), name: "Gainage", durationSeconds: 45 },
          { ...inTourExercise("ex-2"), name: "Squats", durationSeconds: 30 },
        ],
      });
      expect(result).toBe("2 exercices · 2 min"); // 45 + 30 = 75s -> ceil(75/60) = 2 min
    });

    it("sums every Activity's own estimated duration (Durée + Répétitions mixed), once Math.ceil at the very end", () => {
      const result = formatCompositionSummary({
        exercises: [
          { ...inTourExercise("ex-1"), name: "Gainage", durationSeconds: 90 },
          {
            ...inTourExercise("ex-2"),
            name: "Fentes",
            executionMode: "REPETITIONS",
            durationSeconds: null,
            repetitionCount: 12,
            pauseSeconds: 20,
          },
        ],
      });
      // 90 + (0 + 1*20) = 110s -> ceil(110/60) = 2 min — la seconde Activité
      // n'a qu'UNE Série, mais aucune Récupération ne remplace sa Pause :
      // celle-ci est donc bien exécutée. Au moins une Activité en mode
      // Répétitions -> préfixe '≥' même si l'autre est en mode Durée.
      expect(result).toBe("2 exercices · ≥ 2 min");
    });

    it("never prefixes with '≥' when every Activity is in Durée mode, even with several Activities", () => {
      const result = formatCompositionSummary({
        exercises: [
          { ...inTourExercise("ex-1"), name: "Gainage", durationSeconds: 45 },
          { ...inTourExercise("ex-2"), name: "Squats", durationSeconds: 45 },
        ],
      });
      expect(result).not.toContain("≥");
    });
  });

  /**
   * T02-S01 (CE-T02-01 « Calculs », AC-10/AC-11), **corrigé le 2026-09-08
   * après test utilisateur** : la synthèse du Tour n'agrège QUE la zone
   * `IN_TOUR` (nombre ET durée) ; `BEFORE_TOUR`/`AFTER_TOUR` en sont exclues
   * à la source, jamais seulement à l'affichage. La répétition du Tour ne
   * multiplie que cette zone ; le NOMBRE affiché ne multiplie jamais, quelle
   * que soit `tourRepeatCount` ; la borne minimale `≥` couvre aussi « À
   * l'échec ».
   */
  describe("trois zones structurelles et répétitions du Tour (T02, correctif 2026-09-08)", () => {
    function activity(
      id: string,
      structuralPosition: SessionDraftExercise["structuralPosition"],
      durationSeconds: number,
    ): SessionDraftExercise {
      return { ...createExerciseDraft(id), name: id, structuralPosition, durationSeconds };
    }

    // Deux Activités IN_TOUR (60s chacune) entourées d'une Activité
    // BEFORE_TOUR et d'une Activité AFTER_TOUR : la seconde Activité IN_TOUR
    // est nécessaire pour distinguer sans ambiguïté « exclu de la zone » de
    // « jamais multiplié pour le compte », ce qu'une unique Activité IN_TOUR
    // ne peut pas démontrer à elle seule.
    const threeZones = [
      activity("warmup", "BEFORE_TOUR", 30),
      activity("core-1", "IN_TOUR", 60),
      activity("core-2", "IN_TOUR", 60),
      activity("stretch", "AFTER_TOUR", 30),
    ];

    it("excludes BEFORE_TOUR and AFTER_TOUR from both the count and the duration, and multiplies only the IN_TOUR duration by tourRepeatCount", () => {
      // BEFORE_TOUR (30s) et AFTER_TOUR (30s) ignorées ; IN_TOUR seule :
      // (60 + 60) × 3 = 360 s -> ceil(360/60) = 6 min ; deux Activités.
      expect(formatCompositionSummary({ exercises: threeZones, tourRepeatCount: 3 })).toBe(
        "2 exercices · 6 min",
      );
    });

    it("counts each IN_TOUR Activity ONCE in the displayed number, never tourRepeatCount times", () => {
      const summary = formatCompositionSummary({ exercises: threeZones, tourRepeatCount: 9 });
      expect(summary.startsWith("2 exercices")).toBe(true);
    });

    it("behaves exactly as the IN_TOUR-only formula when the tour repeat count is 1 or omitted (non-regression)", () => {
      // BEFORE_TOUR/AFTER_TOUR toujours exclues ; 60 + 60 = 120 s -> 2 min.
      expect(formatCompositionSummary({ exercises: threeZones, tourRepeatCount: 1 })).toBe(
        "2 exercices · 2 min",
      );
      expect(formatCompositionSummary({ exercises: threeZones })).toBe("2 exercices · 2 min");
    });

    it("is unaffected by the tour repeat count when no Activity is inside the Tour", () => {
      const outOfTour = [activity("warmup", "BEFORE_TOUR", 30), activity("stretch", "AFTER_TOUR", 30)];
      expect(formatCompositionSummary({ exercises: outOfTour, tourRepeatCount: 1 })).toBe(
        formatCompositionSummary({ exercises: outOfTour, tourRepeatCount: 42 }),
      );
    });

    it("correctif T02 (2026-09-08) — BEFORE_TOUR/AFTER_TOUR alone produce the exact empty-state label, never a residual count or duration", () => {
      const outOfTour = [activity("warmup", "BEFORE_TOUR", 600), activity("stretch", "AFTER_TOUR", 600)];
      expect(formatCompositionSummary({ exercises: outOfTour, tourRepeatCount: 5 })).toBe(
        "0 exercice · 0 min",
      );
    });

    it("prefixes with '≥' for an À l'échec Activity too, not only for Répétitions (AC-11/D-112)", () => {
      const toFailure: SessionDraftExercise = {
        ...inTourExercise("ex-1"),
        name: "Tractions",
        executionMode: "TO_FAILURE",
        durationSeconds: null,
        repetitionCount: null,
        seriesCount: 3,
        pauseSeconds: 20,
      };
      // Aucune durée conventionnelle : seules les pauses comptent — et sans
      // Récupération, la Pause suit chacune des 3 Séries, soit 60 s.
      expect(formatCompositionSummary({ exercises: [toFailure] })).toBe("1 exercice · ≥ 1 min");
    });

    it("adds the attached Récupération of each IN_TOUR Activity once, before the tour multiplication (T02-S02)", () => {
      const withRecovery: SessionDraftExercise = {
        ...inTourExercise("ex-1"),
        name: "Gainage",
        durationSeconds: 30,
        seriesCount: 3,
        pauseSeconds: 15,
        postActivityRecoverySeconds: 20,
      };
      // 3×30 + 2×15 + 20 = 140 s -> ceil(140/60) = 3 min.
      expect(formatCompositionSummary({ exercises: [withRecovery] })).toBe("1 exercice · 3 min");
    });

    it("counts a legacy standalone Récupération's own duration once, without series multiplication nor pause (D-041)", () => {
      const recovery: SessionDraftExercise = {
        ...inTourExercise("rec"),
        name: "Récupération",
        type: "RECOVERY",
        durationSeconds: 90,
        seriesCount: 3,
        pauseSeconds: 30,
      };
      // 90 s exactement (jamais 3×90 + 3×30) -> ceil(90/60) = 2 min.
      expect(formatCompositionSummary({ exercises: [recovery] })).toBe("1 exercice · 2 min");
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

  /**
   * T02-S02 (`06` Écran 4) : « Lorsque la Récupération est non nulle, ajouter
   * `, puis {récupération} de récupération` ». La proposition se place
   * TOUJOURS en dernier, après l'éventuelle clause de Pause — la Récupération
   * s'exécute après toutes les Séries, donc après toutes les Pauses.
   */
  describe("Récupération attachée (T02-S02)", () => {
    it("appends ', puis {durée} de récupération' after the pause clause, before the final period", () => {
      expect(
        formatExerciseRecap({
          name: "squat sautés",
          executionMode: "DURATION",
          durationSeconds: 90,
          repetitionCount: null,
          seriesCount: 3,
          pauseSeconds: 15,
          postActivityRecoverySeconds: 60,
        }),
      ).toBe(
        "3 séries de squat sautés de 1 min 30 s, avec 15 s de pause entre les séries, puis 1 min de récupération.",
      );
    });

    it("appends it even when there is no pause clause at all", () => {
      expect(
        formatExerciseRecap({
          name: "Gainage",
          executionMode: "DURATION",
          durationSeconds: 30,
          repetitionCount: null,
          seriesCount: 1,
          pauseSeconds: 0,
          postActivityRecoverySeconds: 20,
        }),
      ).toBe("1 série de Gainage de 30 s, puis 20 s de récupération.");
    });

    it("appends it in the À l'échec mode too", () => {
      expect(
        formatExerciseRecap({
          name: "tractions",
          executionMode: "TO_FAILURE",
          durationSeconds: null,
          repetitionCount: null,
          seriesCount: 3,
          pauseSeconds: 0,
          postActivityRecoverySeconds: 45,
        }),
      ).toBe("3 séries de tractions, jusqu’à l’échec, puis 45 s de récupération.");
    });

    it("omits the clause entirely at 0 s, and behaves identically when the field is simply absent", () => {
      const zero = formatExerciseRecap({
        name: "Gainage",
        executionMode: "DURATION",
        durationSeconds: 30,
        repetitionCount: null,
        seriesCount: 1,
        pauseSeconds: 0,
        postActivityRecoverySeconds: 0,
      });
      const absent = formatExerciseRecap({
        name: "Gainage",
        executionMode: "DURATION",
        durationSeconds: 30,
        repetitionCount: null,
        seriesCount: 1,
        pauseSeconds: 0,
      });
      expect(zero).toBe("1 série de Gainage de 30 s.");
      expect(zero.toLowerCase()).not.toContain("récupération");
      expect(absent).toBe(zero);
    });
  });
});

/**
 * T02-S02 (`06` Écran 4) — seconde ligne de la synthèse fixe : la durée
 * TOTALE en mode Durée (valeur exacte, RM-129), une BORNE MINIMALE dans les
 * modes non chronométrés (RM-132). Jamais une donnée persistée
 * (DM-015/DM-016) : toujours recalculée depuis les paramètres affichés.
 *
 * V2-BILAT-01 (BIL-068) : le libellé visible reste `Durée totale` dans les
 * trois modes — le préfixe `≥` reste le seul signal de la borne inférieure.
 */
describe("formatExerciseDurationLine (T02-S02)", () => {
  it("shows the exact total in Durée mode, applying the conditional canonical formula", () => {
    expect(
      formatExerciseDurationLine({
        name: "Gainage",
        executionMode: "DURATION",
        durationSeconds: 30,
        repetitionCount: null,
        seriesCount: 3,
        pauseSeconds: 15,
        postActivityRecoverySeconds: 20,
      }),
      // Récupération présente : elle remplace la dernière Pause —
      // 3×30 + 2×15 + 20 = 140 s.
    ).toBe("Durée totale : 2 min 20 s");
  });

  // PRE-3 (P3-12, périmètre §6) : Répétitions sans bip et À l'échec → durée
  // d'Exercice OMISE dans l'éditeur (aucune ligne, ni zéro, ni « ≥ ») ; les
  // pauses connues restent comptées au niveau Séance (borne « ≥ »).
  it("omits the line in Répétitions mode without beep (no value, no zero, no '≥')", () => {
    expect(
      formatExerciseDurationLine({
        name: "Squats",
        executionMode: "REPETITIONS",
        durationSeconds: null,
        repetitionCount: 12,
        seriesCount: 4,
        pauseSeconds: 10,
        postActivityRecoverySeconds: 25,
      }),
    ).toBeNull();
  });

  it("omits the line in Répétitions mode without beep, even without Récupération", () => {
    expect(
      formatExerciseDurationLine({
        name: "Squats",
        executionMode: "REPETITIONS",
        durationSeconds: null,
        repetitionCount: 12,
        seriesCount: 4,
        pauseSeconds: 10,
        postActivityRecoverySeconds: 0,
      }),
    ).toBeNull();
  });

  it("omits the line in À l'échec mode as well", () => {
    expect(
      formatExerciseDurationLine({
        name: "Tractions",
        executionMode: "TO_FAILURE",
        durationSeconds: null,
        repetitionCount: null,
        seriesCount: 2,
        pauseSeconds: 30,
        postActivityRecoverySeconds: 0,
      }),
    ).toBeNull();
  });

  it("never invents a conventional duration for the Exercise itself in a non-timed mode", () => {
    // Deux nombres de répétitions différents, tout le reste identique : la
    // borne affichée ne bouge pas — elle ne dépend que des parts connues.
    const twelve = formatExerciseDurationLine({
      name: "Squats",
      executionMode: "REPETITIONS",
      durationSeconds: null,
      repetitionCount: 12,
      seriesCount: 3,
      pauseSeconds: 10,
    });
    const fifty = formatExerciseDurationLine({
      name: "Squats",
      executionMode: "REPETITIONS",
      durationSeconds: null,
      repetitionCount: 50,
      seriesCount: 3,
      pauseSeconds: 10,
    });
    expect(twelve).toBe(fifty);
  });

  it("recomputes from the facts, never from a persisted total (DM-015/DM-016)", () => {
    const before = formatExerciseDurationLine({
      name: "Gainage",
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 2,
      pauseSeconds: 0,
    });
    const after = formatExerciseDurationLine({
      name: "Gainage",
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 5,
      pauseSeconds: 0,
    });
    expect(before).toBe("Durée totale : 1 min");
    expect(after).toBe("Durée totale : 2 min 30 s");
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
 * V2-PRE-1 (plan §3.2, UI-CDBCCFD16078) : `postActivityRecoverySeconds` est
 * désormais un champ OBLIGATOIRE de l'occurrence — `formatActivityRecoveryLabel`
 * retourne donc toujours une chaîne non vide, y compris `"Récupération 0 s"`
 * pour une valeur nulle, jamais `null` (comportement historique retiré).
 */
describe("formatActivityRecoveryLabel (V2-PRE-1)", () => {
  it("renders a non-null label even for a zero recovery", () => {
    expect(formatActivityRecoveryLabel(0)).toBe("Récupération 0 s");
  });

  it("renders the formatted positive duration unchanged", () => {
    expect(formatActivityRecoveryLabel(90)).toBe("Récupération 1 min 30 s");
  });
});

describe("V2-BILAT-01 / V2-PRE-1 — side mode in the Tour summary and the exercise duration line", () => {
  describe("formatCompositionSummary — direction propre à chaque Activité (V2-PRE-1, plan §3.3)", () => {
    it("doubles the Tour occurrence duration when an IN_TOUR Activity is itself bilateral", () => {
      const unilateral = [{ ...inTourExercise("ex-1"), name: "Gainage", durationSeconds: 45 }];
      const bilateral = [
        { ...inTourExercise("ex-1"), name: "Gainage", durationSeconds: 45, sideMode: "RIGHT_LEFT" as const },
      ];
      // Unilatéral : 45 s -> ceil(45/60) = 1 min. Bilatéral : 90 s -> 2 min.
      expect(formatCompositionSummary({ exercises: unilateral })).toBe("1 exercice · 1 min");
      expect(formatCompositionSummary({ exercises: bilateral })).toBe("1 exercice · 2 min");
    });

    it("never multiplies the displayed count by the side mode — only the duration", () => {
      const exercises = [
        {
          ...inTourExercise("ex-1"),
          name: "Gainage",
          durationSeconds: 45,
          sideMode: "LEFT_RIGHT" as const,
        },
        { ...inTourExercise("ex-2"), name: "Squats", durationSeconds: 30 },
      ];
      const summary = formatCompositionSummary({ exercises });
      expect(summary.startsWith("2 exercices")).toBe(true);
    });
  });

  describe("formatExerciseDurationLine — sideMode (autonome, jamais la Récupération)", () => {
    it("is unaffected by an UNILATERAL side mode (non-regression)", () => {
      const facts = {
        name: "Gainage",
        executionMode: "DURATION" as const,
        durationSeconds: 30,
        repetitionCount: null,
        seriesCount: 3,
        pauseSeconds: 15,
        postActivityRecoverySeconds: 20,
      };
      expect(formatExerciseDurationLine({ ...facts, sideMode: "UNILATERAL" })).toBe(
        formatExerciseDurationLine(facts),
      );
    });

    it("doubles the Series + Pauses part but never the Récupération", () => {
      // PRE-3 (registre d'événements, « un côté après l'autre ») : chaque côté
      // porte ses Séries ET leurs Pauses : 2 × (3×30 + 3×15) = 270 ; la
      // Récupération (20, jamais doublée) remplace la seule Pause terminale :
      // 270 − 15 + 20 = 275 s (l'ancienne formule omettait la Pause finale
      // du premier côté).
      expect(
        formatExerciseDurationLine({
          name: "Gainage",
          executionMode: "DURATION",
          durationSeconds: 30,
          repetitionCount: null,
          seriesCount: 3,
          pauseSeconds: 15,
          postActivityRecoverySeconds: 20,
          sideMode: "RIGHT_LEFT",
        }),
      ).toBe("Durée totale : 4 min 35 s");
    });
  });

  describe("formatExerciseRowSummary — carte de Composition (correction bornée, plan `## 4.4`)", () => {
    it("mode Durée, direction PROPRE RIGHT_LEFT : « par côté » après {N} série(s), MAIS jamais la direction développée", () => {
      expect(
        formatExerciseRowSummary({
          executionMode: "DURATION",
          durationSeconds: 90,
          repetitionCount: null,
          seriesCount: 3,
          pauseSeconds: 15,
          sideMode: "RIGHT_LEFT",
        }),
      ).toBe("3 séries par côté de 1 min 30 s avec 15 s de pause par série");
    });

    it("mode Répétitions, direction PROPRE LEFT_RIGHT : « par côté » présent, aucun suffixe développé", () => {
      expect(
        formatExerciseRowSummary({
          executionMode: "REPETITIONS",
          durationSeconds: null,
          repetitionCount: 12,
          seriesCount: 3,
          pauseSeconds: 0,
          sideMode: "LEFT_RIGHT",
        }),
      ).toBe("3 séries par côté de 12 répétitions");
    });

    it("mode À l'échec, direction PROPRE RIGHT_LEFT : « par côté » présent, aucun suffixe développé", () => {
      expect(
        formatExerciseRowSummary({
          executionMode: "TO_FAILURE",
          durationSeconds: null,
          repetitionCount: null,
          seriesCount: 3,
          pauseSeconds: 15,
          sideMode: "RIGHT_LEFT",
        }),
      ).toBe("3 séries par côté jusqu’à l’échec, avec 15 s de pause entre les séries");
    });

    it("la carte ne contient JAMAIS les suffixes développés « à droite, puis à gauche » / « à gauche, puis à droite » (plan `## 4.4`)", () => {
      const rightLeft = formatExerciseRowSummary({
        executionMode: "DURATION",
        durationSeconds: 90,
        repetitionCount: null,
        seriesCount: 3,
        pauseSeconds: 15,
        sideMode: "RIGHT_LEFT",
      });
      const leftRight = formatExerciseRowSummary({
        executionMode: "REPETITIONS",
        durationSeconds: null,
        repetitionCount: 12,
        seriesCount: 3,
        pauseSeconds: 0,
        sideMode: "LEFT_RIGHT",
      });
      expect(rightLeft).not.toContain("à droite, puis à gauche");
      expect(leftRight).not.toContain("à gauche, puis à droite");
    });

    it("Activité unilatérale (sideMode omis ou UNILATERAL) : aucune clause « par côté » — non-régression exacte", () => {
      const facts = {
        executionMode: "DURATION" as const,
        durationSeconds: 90,
        repetitionCount: null,
        seriesCount: 3,
        pauseSeconds: 15,
      };
      expect(formatExerciseRowSummary(facts)).toBe(formatExerciseRowSummary({ ...facts, sideMode: "UNILATERAL" }));
      expect(formatExerciseRowSummary(facts)).not.toContain("par côté");
    });

    it("direction bilatérale HÉRITÉE du Tour (`isSideModeInherited`) : aucune clause « par côté », comme une Activité unilatérale", () => {
      const inherited = formatExerciseRowSummary({
        executionMode: "DURATION",
        durationSeconds: 90,
        repetitionCount: null,
        seriesCount: 3,
        pauseSeconds: 15,
        sideMode: "RIGHT_LEFT",
        isSideModeInherited: true,
      });
      expect(inherited).toBe(
        formatExerciseRowSummary({
          executionMode: "DURATION",
          durationSeconds: 90,
          repetitionCount: null,
          seriesCount: 3,
          pauseSeconds: 15,
        }),
      );
      expect(inherited).not.toContain("par côté");
    });
  });

  describe("formatExerciseRecap — direction développée (correction bornée, plan `## 4.5`)", () => {
    const base = {
      name: "Gainage",
      executionMode: "DURATION" as const,
      durationSeconds: 90,
      repetitionCount: null,
      seriesCount: 3,
      pauseSeconds: 15,
      postActivityRecoverySeconds: 0,
    };

    it("mode Durée, direction PROPRE RIGHT_LEFT : base « {N} série(s) par côté … », suffixe après la cible, avant la Pause", () => {
      expect(formatExerciseRecap({ ...base, sideMode: "RIGHT_LEFT" })).toBe(
        "3 séries par côté de Gainage de 1 min 30 s, à droite, puis à gauche, avec 15 s de pause entre les séries.",
      );
    });

    it("mode Répétitions, direction PROPRE LEFT_RIGHT : suffixe exact « , à gauche, puis à droite »", () => {
      expect(
        formatExerciseRecap({
          name: "Squats",
          executionMode: "REPETITIONS",
          durationSeconds: null,
          repetitionCount: 12,
          seriesCount: 3,
          pauseSeconds: 0,
          postActivityRecoverySeconds: 0,
          sideMode: "LEFT_RIGHT",
        }),
      ).toBe("3 séries par côté de 12 Squats, à gauche, puis à droite.");
    });

    it("mode À l'échec, direction PROPRE RIGHT_LEFT : suffixe après `jusqu'à l'échec`, avant la Pause", () => {
      expect(
        formatExerciseRecap({
          name: "Gainage",
          executionMode: "TO_FAILURE",
          durationSeconds: null,
          repetitionCount: null,
          seriesCount: 3,
          pauseSeconds: 15,
          postActivityRecoverySeconds: 0,
          sideMode: "RIGHT_LEFT",
        }),
      ).toBe(
        "3 séries par côté de Gainage, jusqu’à l’échec, à droite, puis à gauche, avec 15 s de pause entre les séries.",
      );
    });

    it("Activité unilatérale (sideMode omis ou UNILATERAL) : aucune clause « par côté » ni suffixe — non-régression exacte", () => {
      expect(formatExerciseRecap(base)).toBe(formatExerciseRecap({ ...base, sideMode: "UNILATERAL" }));
      expect(formatExerciseRecap(base)).not.toContain("par côté");
      expect(formatExerciseRecap(base)).not.toContain("à droite");
      expect(formatExerciseRecap(base)).not.toContain("à gauche");
    });

    it("direction bilatérale HÉRITÉE du Tour (`isSideModeInherited`) : aucune clause « par côté » ni suffixe — l'éditeur omet la direction du Tour", () => {
      const inherited = formatExerciseRecap({ ...base, sideMode: "RIGHT_LEFT", isSideModeInherited: true });
      expect(inherited).toBe(formatExerciseRecap(base));
      expect(inherited).not.toContain("par côté");
      expect(inherited).not.toContain("à droite");
    });
  });
});

/**
 * PRE-3 — adaptations minimales des consommateurs partagés (P3-22).
 */
describe("PRE-3 — synthèses de Composition (adaptation minimale, P3-22)", () => {
  const canonical = (overrides: Partial<ExecutionParameters> = {}): ExecutionParameters => ({
    version: 1,
    mode: "DURATION",
    series: {
      kind: "VARIABLE",
      rows: [
        { target: 30, pauseSeconds: 10 },
        { target: 45, pauseSeconds: 20 },
        { target: 60, pauseSeconds: 30 },
      ],
    },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    ...overrides,
  });

  it("P3-22/scope-regression — carte : indicateur « N séries variables » sans détail des valeurs (v13 §7) ; scalaires inchangés sans paramètres canoniques ; ≈ pour un travail estimé", () => {
    const base = {
      executionMode: "DURATION" as const,
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 3,
      pauseSeconds: 10,
    };
    // Sans paramètres canoniques : synthèse historique rigoureusement inchangée.
    expect(formatExerciseRowSummary(base)).toBe("3 séries de 30 s avec 10 s de pause par série");
    expect(formatExerciseRowSummary({ ...base, executionParameters: canonical() })).toBe("3 séries variables");
    expect(
      formatExerciseRowSummary({
        ...base,
        sideMode: "RIGHT_LEFT",
        executionParameters: canonical({ sideMode: "RIGHT_LEFT" }),
      }),
    ).toBe("3 séries variables par côté");
    expect(
      formatExerciseRowSummary({
        ...base,
        executionMode: "TO_FAILURE",
        executionParameters: canonical({
          mode: "TO_FAILURE",
          series: { kind: "VARIABLE", rows: [{ target: null, pauseSeconds: 10 }, { target: null, pauseSeconds: 20 }] },
        }),
      }),
    ).toBe("2 séries variables");

    // Répétitions avec bip : contribution ESTIMÉE (≈) ; sans bip : borne (≥).
    const reps = {
      ...inTourExercise("ex-r"),
      executionMode: "REPETITIONS" as const,
      durationSeconds: null,
      repetitionCount: 15,
      seriesCount: 4,
      pauseSeconds: 15,
      executionParameters: canonical({
        mode: "REPETITIONS",
        series: { kind: "UNIFORM", count: 4, target: 15, pauseSeconds: 15 },
        cadenceBeepIntervalSeconds: 4,
      }),
    };
    expect(formatCompositionSummary({ exercises: [reps] })).toBe("1 exercice · ≈ 5 min");
    expect(
      formatCompositionSummary({
        exercises: [{ ...reps, executionParameters: { ...reps.executionParameters, cadenceBeepIntervalSeconds: 0 } }],
      }),
    ).toBe("1 exercice · ≥ 1 min");
    // Ligne de durée : délégation à l'autorité Domaine (≈ 300 s).
    expect(formatExerciseDurationLine({ ...reps, name: "Squats" })).toBe("Durée totale : ≈ 5 min");
  });
});
