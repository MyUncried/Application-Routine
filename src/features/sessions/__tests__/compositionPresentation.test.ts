import { describe, expect, it } from "@jest/globals";

import {
  variableParameters,
  durationParameters,
  repetitionParameters,
  allFailureParameters,
  uniformParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import {
  COMPACT_LIST_SEPARATOR,
  formatActivityRecoveryLabel,
  formatCompactDuration,
  formatCompositionSummary,
  formatDurationRowValue,
  formatExerciseBodyZones,
  formatExerciseRowSummary,
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

  it("PRE4-1.2/AC6 (Q32) — zéro Exercice dans le Tour, d'autres hors Tour : « 0 exercice · 0 min », au singulier", () => {
    const summary = formatCompositionSummary({
      exercises: [
        { ...createExerciseDraft("before"), name: "Échauffement", structuralPosition: "BEFORE_TOUR", executionParameters: durationParameters(60) },
        { ...createExerciseDraft("after"), name: "Étirements", structuralPosition: "AFTER_TOUR", executionParameters: durationParameters(90) },
      ],
      tourRepeatCount: 2,
    });
    expect(summary).toBe("0 exercice · 0 min");
    expect(summary).not.toContain("exercices");
  });

  it("formats a single 45s Activity (1 série, sans pause) as '1 exercice · 1 min'", () => {
    expect(
      formatCompositionSummary({
        exercises: [{ ...inTourExercise("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }],
      }),
    ).toBe("1 exercice · 1 min");
  });

  it("rounds a non-exact minute up (61s) to '1 exercice · 2 min' (Math.ceil, never underestimating)", () => {
    expect(
      formatCompositionSummary({
        exercises: [{ ...inTourExercise("ex-1"), name: "Gainage", executionParameters: durationParameters(61) }],
      }),
    ).toBe("1 exercice · 2 min");
  });

  // PRE-3 (P3-12) : une cible Durée absente est un travail INCONNU — jamais
  // un zéro présenté comme exact ; seule la borne minimale connue (« ≥ »).
  it("treats a null exercise duration as unknown work (lower bound), never as an exact 0", () => {
    expect(
      formatCompositionSummary({
        exercises: [{ ...inTourExercise("ex-1"), name: "Gainage", executionParameters: durationParameters("UNSET") }],
      }),
    ).toBe("1 exercice · ≥ 0 min"); // PRE-4 (P47) : une borne de 0 s garde le rendu PRE-3
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
    const exercises = [{ ...inTourExercise("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }];
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
        executionParameters: repetitionParameters(repetitionCount, 2, pauseSeconds),
      };
    }

    it("prefixes the duration with '≥' and ignores the exercise's own duration entirely (only the pause contributes)", () => {
      expect(
        formatCompositionSummary({ exercises: [repetitionExercise(12, 20)] }),
      ).toBe("1 exercice · ≥ 40 s"); // 2 Séries × 20 s = 40 s ; PRE-4 (story 2.4, AC5) : borne sans arrondi
    });

    it("PRE-4 (story 2.4, AC5) — the lower bound keeps its seconds: no Math.ceil on the pause sum alone", () => {
      expect(
        formatCompositionSummary({ exercises: [repetitionExercise(20, 65)] }),
      ).toBe("1 exercice · ≥ 2 min 10 s"); // 2 Séries × 65 s = 130 s, sans arrondi (auparavant « ≥ 3 min »)
    });

    it("never underestimates: a repetition count change alone never changes the displayed minimum", () => {
      const first = formatCompositionSummary({ exercises: [repetitionExercise(5, 20)] });
      const second = formatCompositionSummary({ exercises: [repetitionExercise(50, 20)] });
      expect(first).toBe(second);
      expect(first).toBe("1 exercice · ≥ 40 s");
    });

    it("never shows the '≥' prefix in Duration mode", () => {
      const result = formatCompositionSummary({
        exercises: [{ ...inTourExercise("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }],
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
              executionParameters: durationParameters(90, 3, 15),
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
              executionParameters: durationParameters(90, 3, 15),
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
              executionParameters: durationParameters(90, 3, 15),
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
              executionParameters: repetitionParameters(12, 3, 20),
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
              executionParameters: durationParameters(45, 4, 0),
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
              executionParameters: durationParameters(45, 1, 0),
            },
          ],
        }),
      ).toBe("1 exercice · 1 min"); // 45s -> ceil(45/60) = 1 min
    });

    it("fait varier seriesCount seul : le résultat change en conséquence", () => {
      const oneSeries = formatCompositionSummary({
        exercises: [
          { ...inTourExercise("ex-1"), name: "Gainage", executionParameters: durationParameters(45, 1) },
        ],
      });
      const threeSeries = formatCompositionSummary({
        exercises: [
          { ...inTourExercise("ex-1"), name: "Gainage", executionParameters: durationParameters(45, 3) },
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
            executionParameters: durationParameters(45, 2, 0),
          },
        ],
      });
      const withPause = formatCompositionSummary({
        exercises: [
          {
            ...inTourExercise("ex-1"),
            name: "Gainage",
            executionParameters: durationParameters(45, 2, 60),
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
          { ...inTourExercise("ex-1"), name: "Gainage", executionParameters: durationParameters(45) },
          { ...inTourExercise("ex-2"), name: "Squats", executionParameters: durationParameters(30) },
        ],
      });
      expect(result).toBe("2 exercices · 2 min"); // 45 + 30 = 75s -> ceil(75/60) = 2 min
    });

    it("sums every Activity's own estimated duration (Durée + Répétitions mixed), once, at the very end", () => {
      const result = formatCompositionSummary({
        exercises: [
          { ...inTourExercise("ex-1"), name: "Gainage", executionParameters: durationParameters(90) },
          {
            ...inTourExercise("ex-2"),
            name: "Fentes",
            executionParameters: repetitionParameters(12, 1, 20),
          },
        ],
      });
      // 90 + (0 + 1*20) = 110 s (borne : plus d’arrondi depuis PRE-4 2.4) — la seconde Activité
      // n'a qu'UNE Série, mais aucune Récupération ne remplace sa Pause :
      // celle-ci est donc bien exécutée. Au moins une Activité en mode
      // Répétitions -> préfixe '≥' même si l'autre est en mode Durée.
      expect(result).toBe("2 exercices · ≥ 1 min 50 s"); // PRE-4 (story 2.4, AC5) : 110 s, sans arrondi
    });

    it("never prefixes with '≥' when every Activity is in Durée mode, even with several Activities", () => {
      const result = formatCompositionSummary({
        exercises: [
          { ...inTourExercise("ex-1"), name: "Gainage", executionParameters: durationParameters(45) },
          { ...inTourExercise("ex-2"), name: "Squats", executionParameters: durationParameters(45) },
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
      return { ...createExerciseDraft(id), name: id, structuralPosition, executionParameters: durationParameters(durationSeconds) };
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
        executionParameters: allFailureParameters(3, 20),
      };
      // Aucune durée conventionnelle : seules les pauses comptent — et sans
      // Récupération, la Pause suit chacune des 3 Séries, soit 60 s.
      expect(formatCompositionSummary({ exercises: [toFailure] })).toBe("1 exercice · ≥ 1 min");
    });

    it("adds the attached Récupération of each IN_TOUR Activity once, before the tour multiplication (T02-S02)", () => {
      const withRecovery: SessionDraftExercise = {
        ...inTourExercise("ex-1"),
        name: "Gainage",
        executionParameters: durationParameters(30, 3, 15),
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
        // PRE-4 : une ancienne Récupération autonome est représentée par une seule
        // Série chronométrée de sa durée, sans Pause (lecture défensive).
        executionParameters: durationParameters(90),
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
      const unilateral = [{ ...inTourExercise("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }];
      const bilateral = [
        { ...inTourExercise("ex-1"), name: "Gainage", executionParameters: durationParameters(45, 1, 0, { sideMode: "RIGHT_LEFT" }), sideMode: "RIGHT_LEFT" as const },
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
          executionParameters: durationParameters(45),
          sideMode: "LEFT_RIGHT" as const,
        },
        { ...inTourExercise("ex-2"), name: "Squats", executionParameters: durationParameters(30) },
      ];
      const summary = formatCompositionSummary({ exercises });
      expect(summary.startsWith("2 exercices")).toBe(true);
    });
  });


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
    expect(formatCompositionSummary({ exercises: [reps] })).toBe("1 exercice · ≈ 5 min");
    expect(
      formatCompositionSummary({
        exercises: [{ ...reps, executionParameters: { ...reps.executionParameters, cadenceBeepIntervalSeconds: 0 } }],
      }),
    ).toBe("1 exercice · ≥ 1 min");
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

  it("PRE4-2.4/AC5 — Composition `lowerBound` : « ≥ » en min s sans arrondi ; Circuit ×1 → ≥ 1 min 45 s, ×2 → ≥ 3 min 30 s", () => {
    // (30 + 45) + 3 × 10 = 105 s ; × 2 = 210 s.
    expect(formatCompositionSummary({ exercises: [r01InTour()], tourRepeatCount: 1 })).toBe("1 exercice · ≥ 1 min 45 s");
    expect(formatCompositionSummary({ exercises: [r01InTour()], tourRepeatCount: 2 })).toBe("1 exercice · ≥ 3 min 30 s");
  });

  it("PRE4-2.4/AC5 — Composition : Cible à renseigner (Q30) et Exercice omis contribuent leurs secondes connues, en « ≥ » sans arrondi", () => {
    // Copie Durée 30 s / UNSET / 45 s, Pauses 10 s × 3 : (30 + 45) + 30 = 105 s.
    expect(
      formatCompositionSummary({
        exercises: [
          {
            ...r01InTour(),
            executionParameters: variableParameters({ rows: [[30, 10], ["UNSET", 10], [45, 10]] }),
          },
        ],
      }),
    ).toBe("1 exercice · ≥ 1 min 45 s");
    // Omis : Répétitions Bip 0, Pauses 10 s × 3 = 30 s.
    expect(
      formatCompositionSummary({
        exercises: [{ ...r01InTour(), executionParameters: repetitionParameters(12, 3, 10) }],
      }),
    ).toBe("1 exercice · ≥ 30 s");
  });

  it("PRE4-2.4/AC5 — Composition `exact` et `estimated` : rendu actuel inchangé (arrondi à la minute supérieure, P41)", () => {
    // exact : 3 × 55 s = 165 s → ceil = 3 min.
    expect(
      formatCompositionSummary({
        exercises: [{ ...inTourExercise("e"), postActivityRecoverySeconds: 0, executionParameters: durationParameters(55, 3, 0) }],
      }),
    ).toBe("1 exercice · 3 min");
    // exact : 2 × 60 s = 120 s → 2 min.
    expect(
      formatCompositionSummary({
        exercises: [{ ...inTourExercise("e"), postActivityRecoverySeconds: 0, executionParameters: durationParameters(60, 2, 0) }],
      }),
    ).toBe("1 exercice · 2 min");
    // estimé : 2 × 13 rép. × 4 s = 104 s → ≈ 2 min.
    expect(
      formatCompositionSummary({
        exercises: [
          {
            ...inTourExercise("e"),
            postActivityRecoverySeconds: 0,
            executionParameters: repetitionParameters(13, 2, 0, { cadenceBeepIntervalSeconds: 4 }),
          },
        ],
      }),
    ).toBe("1 exercice · ≈ 2 min");
  });

  it("PRE4-2.4/AC5 — la ligne Exercice de Composition n’acquiert aucune durée propre (Q4)", () => {
    const row = formatExerciseRowSummary({ executionParameters: r01() });
    expect(row).toBe("3 séries variables");
  });

  it("PRE4-2.4/AC6 — symbole « ≥ » issu du lexique, montant issu du formateur du domaine, aucune Phrase", () => {
    expect(strings.shared.durationNature.lowerBoundPrefix).toBe("≥ ");
    const summary = formatCompositionSummary({ exercises: [r01InTour()] });
    expect(summary).toBe("1 exercice · ≥ 1 min 45 s");
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
