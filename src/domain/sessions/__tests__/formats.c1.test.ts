import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  circuitCompatibility,
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
import { insertExerciseInLayout, withLayout } from "@/domain/sessions/layoutOperations";
import { toDuplicateSessionDraft } from "@/domain/sessions/sessionDuplication";
import { structureCircuits, structureExercises, type SessionStructure, type StructureCircuit } from "@/domain/sessions/structure";
import { validateStructuredSessionInput, type StructureExerciseInput, type StructuredSessionInput } from "@/domain/sessions/structuredInput";

/**
 * PRE-9 (story C.1, ARB-03, ARB-04, ARB-17, ARB-25, FMT-01 à FMT-40 ; correction du 30/10, D-02) —
 * registre déclaratif des Formats, Format porté par l'Exercice seul (jamais par le Circuit) :
 * contrôle structurel, compatibilité avec l'organisation du Circuit (matrice §2.2), codage des
 * réglages, transport par le brouillon et la duplication. Les règles propres à chaque Format (C.3)
 * et les gestes de dépose (C.4) ne sont pas éprouvés ici.
 */

const EMOM: ElementFormat = { key: "EMOM", settings: { windowSeconds: 60, roundCount: 6 } };
const TABATA: ElementFormat = { key: "TABATA", settings: {} };

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

  it("aucun porteur Circuit : le registre ne décrit que la compatibilité de l'Exercice formaté avec l'organisation de son Circuit (D-02)", () => {
    for (const key of ELEMENT_FORMAT_KEYS) {
      expect(FORMAT_REGISTRY[key]).not.toHaveProperty("carriers");
      expect(Object.keys(FORMAT_REGISTRY[key].inCircuit).sort()).toEqual(["SERIES", "TOURS"]);
    }
  });

  it("matrice §2.2 : groupées admises pour les six, quel que soit le compte (D-15) ; alternées cellule par cellule (D-16) ; For time alterné non décidé, jamais bloquant", () => {
    const status = (key: (typeof ELEMENT_FORMAT_KEYS)[number], nature: "TOURS" | "SERIES", repeatCount: number) =>
      circuitCompatibility(key, { nature, repeatCount }).status;
    for (const key of ELEMENT_FORMAT_KEYS) {
      for (const count of [1, 3, 8]) {
        expect(status(key, "TOURS", count)).toBe("ADMITTED");
      }
    }
    // Tabata groupé : l'ancien « Circuit d'un tour » n'est plus exigé.
    expect(status("TABATA", "TOURS", 4)).toBe("ADMITTED");
    expect(status("TABATA", "SERIES", 8)).toBe("ADMITTED");
    expect(circuitCompatibility("TABATA", { nature: "SERIES", repeatCount: 6 })).toEqual({ status: "REFUSED", cause: "COUNT", sources: ["D-16", "FMT-13"] });
    expect(status("EMOM", "SERIES", 5)).toBe("ADMITTED");
    expect(FORMAT_REGISTRY.EMOM.inCircuit.SERIES).toMatchObject({ status: "ADMITTED", adaptsSetting: "roundCount" });
    expect(status("DEATH_BY", "SERIES", 4)).toBe("ADMITTED");
    expect(circuitCompatibility("INTERVALS_30_30", { nature: "SERIES", repeatCount: 6 })).toEqual({ status: "REFUSED", cause: "ORGANISATION", sources: ["D-16"] });
    expect(status("AMRAP", "SERIES", 3)).toBe("REFUSED");
    const forTime = circuitCompatibility("FOR_TIME", { nature: "SERIES", repeatCount: 3 });
    expect(forTime.status).toBe("UNDECIDED");
    expect(forTime.status === "UNDECIDED" && forTime.question).toMatch(/À CLARIFIER/);
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
    expect(elementFormatViolations(EMOM)).toEqual([]);
    expect(elementFormatViolations({ key: "EMOM", settings: { roundCount: 4 } })).toEqual([]);
    expect(elementFormatViolations({ key: "TABATA", settings: { workSeconds: 20 } })).toEqual(["FORMAT_SETTING_NOT_ADJUSTABLE"]);
    expect(elementFormatViolations({ key: "EMOM", settings: { totalSeconds: 360 } })).toEqual(["FORMAT_SETTING_NOT_ADJUSTABLE"]);
    expect(elementFormatViolations({ key: "EMOM", settings: { cadence: 60 } })).toEqual(["FORMAT_SETTING_UNKNOWN"]);
    expect(elementFormatViolations({ key: "EMOM", settings: { windowSeconds: 0.5 } })).toEqual(["FORMAT_SETTING_INVALID"]);
    expect(elementFormatViolations({ key: "FOR_TIME", settings: { volumePerRound: [] } })).toEqual(["FORMAT_SETTING_INVALID"]);
    expect(elementFormatViolations({ key: "DEATH_BY", settings: {} })).toEqual([]);
    expect(elementFormatViolations({ key: "HIIT" as never, settings: {} })).toEqual(["FORMAT_UNKNOWN"]);
  });

  it("For time : zéro admis dans une position de l'échelle (ARB-18b) ; le volume total non nul relève de C.3", () => {
    expect(elementFormatViolations({ key: "FOR_TIME", settings: { volumePerRound: [21, 0, 9] } })).toEqual([]);
    expect(elementFormatViolations({ key: "FOR_TIME", settings: { volumePerRound: [21, -1] } })).toEqual(["FORMAT_SETTING_INVALID"]);
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
  it("plusieurs Exercices formatés, dans un Circuit, directement et dans un Cycle (D-01) : valide, Formats et origine conservés", () => {
    const result = validateStructuredSessionInput(
      session(
        {
          elements: [
            { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 8, nature: "SERIES", exercises: [exerciseInput("a", TABATA), exerciseInput("b", TABATA)] } },
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
    expect(structureCircuits(result.value.structure)[0]).not.toHaveProperty("format");
    expect(structureExercises(result.value.structure).map((item) => item.format ?? null)).toEqual([TABATA, TABATA, EMOM, null]);
  });

  it("violations agrégées, chacune une fois", () => {
    const result = validateStructuredSessionInput(
      session(
        {
          elements: [
            { kind: "EXERCISE", exercise: exerciseInput("a", { key: "EMOM", settings: { roundCount: 0 } }) },
            { kind: "EXERCISE", exercise: exerciseInput("b", { key: "EMOM", settings: { windowSeconds: -1 } }) },
            // Entrée non typée portant un Format sur le Circuit (D-02) : refusée, jamais transmise.
            { kind: "CIRCUIT", circuit: { id: "c", repeatCount: 1, nature: "TOURS", exercises: [exerciseInput("x")], format: { key: "DEATH_BY", settings: {} } } as never },
          ],
          stopPoints: [],
        },
        "PLANK" as never,
      ),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Format sur un Circuit contrôlé avant les Exercices ; deux réglages hors borne, une seule violation.
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
  // Circuit sans Format ; son premier membre porte Tabata, le second est libre.
  const legacyShaped = stored(
    {
      elements: [
        { kind: "EXERCISE", exercise: activity("avant", EMOM) },
        { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 1, nature: "TOURS", exercises: [activity("t1", TABATA, "IN_TOUR"), activity("t2", undefined, "IN_TOUR")] } },
      ],
      stopPoints: [],
    },
    "SESSION_CARD",
  );

  it("brouillon : Format de chaque Exercice (copie indépendante), membre de Circuit compris, et origine relus puis réécrits ; aucun Format de Circuit", () => {
    const draft = toSessionDraft(legacyShaped);
    expect(draft.origin).toBe("SESSION_CARD");
    const formatted = draft.exercises.find((item) => item.id === "avant")!;
    expect(formatted.format).toEqual(EMOM);
    expect(formatted.format).not.toBe(EMOM);
    const result = toStructuredSessionInput(draft, () => "unused");
    if (!result.ok) throw new Error(JSON.stringify(result.violations));
    expect(result.value.origin).toBe("SESSION_CARD");
    expect(structureCircuits(result.value.structure)).toEqual([expect.objectContaining({ id: "c1" })]);
    expect(structureCircuits(result.value.structure)[0]).not.toHaveProperty("format");
    expect(structureExercises(result.value.structure).map((item) => item.format ?? null)).toEqual([EMOM, TABATA, null]);
  });

  it("un changement de réglage seul rend l'Exercice modifié", () => {
    const [item] = toSessionDraft(legacyShaped).exercises;
    expect(exerciseEquals(item!, { ...item!, format: { key: "EMOM", settings: { windowSeconds: 60, roundCount: 7 } } })).toBe(false);
    expect(exerciseEquals(item!, { ...item!, format: { key: "EMOM", settings: { roundCount: 6, windowSeconds: 60 } } })).toBe(true);
  });

  it("duplication (ARB-17) : Format et réglages de chaque Exercice copiés (membre de Circuit compris), rien transmis au voisin, origine non recopiée", () => {
    let next = 0;
    const draft = toDuplicateSessionDraft(legacyShaped, () => `dup-${++next}`, ["Séance"]);
    expect(draft).not.toHaveProperty("origin");
    expect(draft.exercises.map((item) => item.format ?? null)).toEqual([EMOM, TABATA, null]);
    const result = toStructuredSessionInput(draft, () => "fresh-circuit");
    if (!result.ok) throw new Error(JSON.stringify(result.violations));
    const [circuit] = structureCircuits(result.value.structure);
    expect(circuit).not.toHaveProperty("format");
    expect(circuit!.exercises.map((item) => item.format ?? null)).toEqual([TABATA, null]);
  });

  it("le type interdit un Format sur un Circuit", () => {
    const circuit: StructureCircuit<StructureExerciseInput> = {
      id: "c",
      repeatCount: 1,
      nature: "TOURS",
      exercises: [],
      // @ts-expect-error — le Circuit ne porte aucun Format (D-02).
      format: TABATA,
    };
    expect(circuit.id).toBe("c");
  });
});

describe("PRE-9 C.1 — dépose, déplacement et duplication dans un Circuit : aucun Format transmis (D-12, D-26, D-27)", () => {
  // Disposition générale : Exercice AMRAP direct, Circuit groupé [libre], Cycle [EMOM].
  const AMRAP: ElementFormat = { key: "AMRAP", settings: { durationSeconds: 600 } };
  const richSession = stored({
    elements: [
      { kind: "EXERCISE", exercise: activity("amrap", AMRAP) },
      { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 3, nature: "TOURS", exercises: [activity("libre", undefined, "IN_TOUR")] } },
      { kind: "CYCLE", cycle: { id: "y1", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: activity("emom", EMOM) }] } },
    ],
    stopPoints: [],
  });

  it("l'Exercice AMRAP déplacé dans le Circuit garde Format et réglages ; le membre libre reste libre ; un Exercice libre inséré après lui n'adopte rien ; la duplication conserve tout", () => {
    const draft = toSessionDraft(richSession);
    const moved = withLayout(draft, {
      elements: [
        { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 3, nature: "TOURS", exercises: ["libre", "amrap"] } },
        { kind: "CYCLE", cycle: { id: "y1", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: "emom" }] } },
      ],
      stopPoints: [],
    });
    const entering = { ...draft.exercises.find((item) => item.id === "libre")!, id: "entrant" };
    const withEntering = insertExerciseInLayout(moved, entering, "amrap");
    const result = toStructuredSessionInput(withEntering, () => "unused");
    if (!result.ok) throw new Error(JSON.stringify(result.violations));
    const [circuit] = structureCircuits(result.value.structure);
    expect(circuit).not.toHaveProperty("format");
    expect(circuit!.exercises.map((item) => [item.id, item.format ?? null])).toEqual([
      ["libre", null],
      ["amrap", AMRAP],
      ["entrant", null],
    ]);
    expect(structureExercises(result.value.structure).find((item) => item.id === "emom")!.format).toEqual(EMOM);

    let next = 0;
    const duplicated = toDuplicateSessionDraft(
      {
        ...richSession,
        structure: {
          elements: [
            { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 3, nature: "TOURS", exercises: [activity("libre", undefined, "IN_TOUR"), activity("amrap", AMRAP, "IN_TOUR")] } },
            { kind: "CYCLE", cycle: { id: "y1", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: activity("emom", EMOM) }] } },
          ],
          stopPoints: [],
        },
      },
      () => `dup-${++next}`,
      ["Séance"],
    );
    const duplicatedInput = toStructuredSessionInput(duplicated, () => "unused");
    if (!duplicatedInput.ok) throw new Error(JSON.stringify(duplicatedInput.violations));
    const [copiedCircuit] = structureCircuits(duplicatedInput.value.structure);
    expect(copiedCircuit).not.toHaveProperty("format");
    expect(copiedCircuit!.exercises.map((item) => item.format ?? null)).toEqual([null, AMRAP]);
    // Copie indépendante des réglages.
    expect(copiedCircuit!.exercises[1]!.format).not.toBe(AMRAP);
  });
});
