import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  decodeFormatSettings,
  elementFormatsEqual,
  elementFormatViolations,
  encodeFormatSettings,
  ELEMENT_FORMAT_KEYS,
  FORMAT_REGISTRY,
  formatDefaultsComplete,
  type ElementFormat,
} from "@/domain/sessions/formats";
import type { Activity } from "@/domain/sessions/Session";
import type { StructuredSession } from "@/domain/sessions/SessionRepository";
import { exerciseEquals, toSessionDraft, toStructuredSessionInput } from "@/domain/sessions/SessionDraft";
import { toDuplicateSessionDraft } from "@/domain/sessions/sessionDuplication";
import { structureCircuits, structureExercises, type SessionStructure } from "@/domain/sessions/structure";
import { validateStructuredSessionInput, type StructureExerciseInput, type StructuredSessionInput } from "@/domain/sessions/structuredInput";

/**
 * PRE-9 (story C.1, ARB-03, ARB-04, ARB-17, ARB-25, FMT-01 à FMT-40) — registre déclaratif des
 * Formats, Format porté par un Circuit ou un Exercice : contrôle structurel, codage des réglages,
 * transport par le brouillon et la duplication. Les règles propres à chaque Format (C.3) et la
 * compatibilité des déplacements (C.4) ne sont pas éprouvées ici.
 */

const EMOM: ElementFormat = { key: "EMOM", settings: { windowSeconds: 60, roundCount: 6 } };

describe("PRE-9 C.1 — registre des Formats", () => {
  it("six Formats contraignants (FMT-01) ; constantes Tabata (FMT-10) et 30/30 (FMT-19) ; aucun réglage de répétition de l'ensemble (ARB-25)", () => {
    expect(ELEMENT_FORMAT_KEYS).toEqual(["TABATA", "INTERVALS_30_30", "EMOM", "AMRAP", "FOR_TIME", "DEATH_BY"]);
    const constants = (key: keyof typeof FORMAT_REGISTRY) =>
      Object.fromEntries(FORMAT_REGISTRY[key].parameters.filter((parameter) => parameter.lock === "LOCKED").map((parameter) => [parameter.id, parameter.value]));
    expect(constants("TABATA")).toEqual({ seriesPerExercise: 8, workSeconds: 20, pauseSeconds: 10 });
    expect(constants("INTERVALS_30_30")).toEqual({ workSeconds: 30, pauseSeconds: 30 });
    for (const key of ELEMENT_FORMAT_KEYS) {
      expect(FORMAT_REGISTRY[key].parameters.map((parameter) => parameter.id)).not.toContain("setRepeatCount");
    }
  });

  it("porteurs : Exercice pour tous ; Circuit Tabata groupé à 1 ou alterné à 8 (FMT-12/13) ; Death by à plusieurs Exercices réservé (R-03)", () => {
    for (const key of ELEMENT_FORMAT_KEYS) {
      expect(FORMAT_REGISTRY[key].carriers.EXERCISE).toBe("ALLOWED");
    }
    expect(FORMAT_REGISTRY.TABATA.carriers.CIRCUIT).toEqual({ status: "ALLOWED", natures: ["TOURS", "SERIES"], countByNature: { TOURS: 1, SERIES: 8 } });
    expect(FORMAT_REGISTRY.DEATH_BY.carriers.CIRCUIT.status).toBe("RESERVED");
    // For time : aucun sélecteur Par exercice / En alternance (FMT-31).
    expect(FORMAT_REGISTRY.FOR_TIME.carriers.CIRCUIT).toEqual({ status: "ALLOWED", natures: ["TOURS"] });
  });

  it("défauts comme données (ARB-04, ouvert) : aucun défaut inventé ; seul Tabata, sans réglable, a une configuration initiale complète", () => {
    for (const key of ELEMENT_FORMAT_KEYS) {
      expect(FORMAT_REGISTRY[key].parameters.every((parameter) => parameter.default === undefined)).toBe(true);
    }
    expect(ELEMENT_FORMAT_KEYS.filter(formatDefaultsComplete)).toEqual(["TABATA"]);
  });
});

describe("PRE-9 C.1 — contrôle structurel d'un Format porté", () => {
  it("accepte des réglages partiels (non renseignés) et refuse constante, valeur calculée, inconnu, hors borne, liste vide", () => {
    expect(elementFormatViolations(EMOM, "EXERCISE")).toEqual([]);
    expect(elementFormatViolations({ key: "EMOM", settings: { roundCount: 4 } }, "CIRCUIT")).toEqual([]);
    expect(elementFormatViolations({ key: "TABATA", settings: { workSeconds: 20 } }, "CIRCUIT")).toEqual(["FORMAT_SETTING_NOT_ADJUSTABLE"]);
    expect(elementFormatViolations({ key: "EMOM", settings: { totalSeconds: 360 } }, "EXERCISE")).toEqual(["FORMAT_SETTING_NOT_ADJUSTABLE"]);
    expect(elementFormatViolations({ key: "EMOM", settings: { cadence: 60 } }, "EXERCISE")).toEqual(["FORMAT_SETTING_UNKNOWN"]);
    expect(elementFormatViolations({ key: "EMOM", settings: { windowSeconds: 0.5 } }, "EXERCISE")).toEqual(["FORMAT_SETTING_INVALID"]);
    expect(elementFormatViolations({ key: "FOR_TIME", settings: { volumePerRound: [] } }, "CIRCUIT")).toEqual(["FORMAT_SETTING_INVALID"]);
    expect(elementFormatViolations({ key: "DEATH_BY", settings: {} }, "CIRCUIT")).toEqual(["FORMAT_CARRIER_RESERVED"]);
    expect(elementFormatViolations({ key: "HIIT" as never, settings: {} }, "EXERCISE")).toEqual(["FORMAT_UNKNOWN"]);
  });

  it("For time : zéro admis dans une position de l'échelle (ARB-18b) ; le volume total non nul relève de C.3", () => {
    expect(elementFormatViolations({ key: "FOR_TIME", settings: { volumePerRound: [21, 0, 9] } }, "CIRCUIT")).toEqual([]);
    expect(elementFormatViolations({ key: "FOR_TIME", settings: { volumePerRound: [21, -1] } }, "CIRCUIT")).toEqual(["FORMAT_SETTING_INVALID"]);
  });

  it("codage versionné, clés triées, lecture stricte", () => {
    const encoded = encodeFormatSettings({ windowSeconds: 60, roundCount: 6 });
    expect(encoded).toBe('{"version":1,"values":{"roundCount":6,"windowSeconds":60}}');
    expect(decodeFormatSettings(encoded)).toEqual({ roundCount: 6, windowSeconds: 60 });
    for (const corrupt of ["", "{", "null", '{"version":2,"values":{}}', '{"version":1,"values":[]}', '{"version":1,"values":{"a":"6"}}']) {
      expect(decodeFormatSettings(corrupt)).toBeNull();
    }
    expect(elementFormatsEqual(EMOM, { key: "EMOM", settings: { roundCount: 6, windowSeconds: 60 } })).toBe(true);
    expect(elementFormatsEqual(EMOM, { key: "EMOM", settings: { roundCount: 7, windowSeconds: 60 } })).toBe(false);
    expect(elementFormatsEqual(null, undefined)).toBe(true);
  });
});

const exerciseInput = (id: string, format?: ElementFormat): StructureExerciseInput => ({
  id,
  type: "EXERCISE",
  executionParameters: durationParameters(30),
  postActivityRecoverySeconds: 0,
  sourceMovementId: "mv-1",
  ...(format !== undefined ? { format } : {}),
});

const session = (structure: StructuredSessionInput["structure"], origin?: StructuredSessionInput["origin"]): StructuredSessionInput => ({
  name: "Séance",
  labelId: null,
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  structure,
  ...(origin !== undefined ? { origin } : {}),
});

describe("PRE-9 C.1 — validation d'une Séance à éléments formatés", () => {
  it("plusieurs éléments formatés, directement et dans un Cycle (ARB-03) : valide, Formats et origine conservés", () => {
    const result = validateStructuredSessionInput(
      session(
        {
          elements: [
            { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 8, nature: "SERIES", exercises: [exerciseInput("a"), exerciseInput("b")], format: { key: "TABATA", settings: {} } } },
            { kind: "CYCLE", cycle: { id: "y1", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: exerciseInput("e", EMOM) }] } },
            { kind: "EXERCISE", exercise: exerciseInput("libre") },
          ],
          stopPoints: [],
        },
        "TABATA",
      ),
    );
    if (!result.ok) throw new Error(JSON.stringify(result.violations));
    expect(result.value.origin).toBe("TABATA");
    expect(structureCircuits(result.value.structure)[0]!.format).toEqual({ key: "TABATA", settings: {} });
    expect(structureExercises(result.value.structure).map((item) => item.format ?? null)).toEqual([null, null, EMOM, null]);
  });

  it("violations agrégées, chacune une fois", () => {
    const result = validateStructuredSessionInput(
      session(
        {
          elements: [
            { kind: "EXERCISE", exercise: exerciseInput("a", { key: "EMOM", settings: { roundCount: 0 } }) },
            { kind: "EXERCISE", exercise: exerciseInput("b", { key: "EMOM", settings: { windowSeconds: -1 } }) },
            { kind: "CIRCUIT", circuit: { id: "c", repeatCount: 1, nature: "TOURS", exercises: [exerciseInput("x")], format: { key: "DEATH_BY", settings: {} } } },
          ],
          stopPoints: [],
        },
        "PLANK" as never,
      ),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Circuits contrôlés avant les Exercices ; deux réglages hors borne, une seule violation.
    expect(result.violations).toEqual([
      { code: "FORBIDDEN_PLACEMENT", field: "element.format" },
      { code: "OUT_OF_RANGE", field: "element.formatSettings" },
      { code: "UNRECOGNIZED", field: "session.origin" },
    ]);
  });
});

const activity = (id: string, format?: ElementFormat, structuralPosition: Activity["structuralPosition"] = "BEFORE_TOUR"): Activity => ({
  id,
  type: "EXERCISE",
  structuralPosition,
  position: 0,
  name: id,
  executionParameters: durationParameters(30),
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: "mv-1",
  ...(format !== undefined ? { format } : {}),
});

const stored = (structure: SessionStructure<Activity>, origin?: StructuredSession["origin"]): StructuredSession => ({
  id: "s1",
  ownerId: "u1",
  name: "Séance",
  color: "#9AA4B2" as StructuredSession["color"],
  labelId: null,
  status: "ACTIVE",
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  createdAt: "2026-10-29T00:00:00.000Z",
  updatedAt: "2026-10-29T00:00:00.000Z",
  structure,
  ...(origin !== undefined ? { origin } : {}),
});

describe("PRE-9 C.1 — brouillon et duplication", () => {
  const tabata: ElementFormat = { key: "TABATA", settings: {} };
  const legacyShaped = stored(
    {
      elements: [
        { kind: "EXERCISE", exercise: activity("avant", EMOM) },
        { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 1, nature: "TOURS", exercises: [activity("t1", undefined, "IN_TOUR"), activity("t2", undefined, "IN_TOUR")], format: tabata } },
      ],
      stopPoints: [],
    },
    "SESSION_CARD",
  );

  it("brouillon : Format de l'Exercice (copie indépendante), Format du Circuit et origine relus puis réécrits", () => {
    const draft = toSessionDraft(legacyShaped);
    expect(draft.origin).toBe("SESSION_CARD");
    const formatted = draft.exercises.find((item) => item.id === "avant")!;
    expect(formatted.format).toEqual(EMOM);
    expect(formatted.format).not.toBe(EMOM);
    const result = toStructuredSessionInput(draft, () => "unused");
    if (!result.ok) throw new Error(JSON.stringify(result.violations));
    expect(result.value.origin).toBe("SESSION_CARD");
    expect(structureCircuits(result.value.structure)).toEqual([expect.objectContaining({ id: "c1", format: tabata })]);
    expect(structureExercises(result.value.structure).map((item) => item.format ?? null)).toEqual([EMOM, null, null]);
  });

  it("un changement de réglage seul rend l'Exercice modifié", () => {
    const [item] = toSessionDraft(legacyShaped).exercises;
    expect(exerciseEquals(item!, { ...item!, format: { key: "EMOM", settings: { windowSeconds: 60, roundCount: 7 } } })).toBe(false);
    expect(exerciseEquals(item!, { ...item!, format: { key: "EMOM", settings: { roundCount: 6, windowSeconds: 60 } } })).toBe(true);
  });

  it("duplication (ARB-17) : Formats copiés, Circuit formaté renouvelé, origine non recopiée", () => {
    let next = 0;
    const draft = toDuplicateSessionDraft(legacyShaped, () => `dup-${++next}`, ["Séance"]);
    expect(draft).not.toHaveProperty("origin");
    expect(draft.exercises.map((item) => item.format ?? null)).toEqual([EMOM, null, null]);
    const result = toStructuredSessionInput(draft, () => "unused");
    if (!result.ok) throw new Error(JSON.stringify(result.violations));
    const [circuit] = structureCircuits(result.value.structure);
    expect(circuit!.format).toEqual(tabata);
    expect(circuit!.id).toMatch(/^dup-/);
  });
});
