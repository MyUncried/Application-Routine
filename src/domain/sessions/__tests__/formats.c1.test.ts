import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  circuitCompatibility,
  circuitFormatParametersOf,
  decodeFormatSettings,
  elementFormatsEqual,
  elementFormatViolations,
  encodeFormatSettings,
  ELEMENT_FORMAT_KEYS,
  initialFormatSettings,
  PRECONFIGURATION_KEYS,
  type ElementFormat,
} from "@/domain/sessions/formats";
import type { Activity } from "@/domain/sessions/Session";
import type { StructuredSession } from "@/domain/sessions/SessionRepository";
import { exerciseEquals, toSessionDraft, toStructuredSessionInput } from "@/domain/sessions/SessionDraft";
import { insertExerciseInLayout, withLayout } from "@/domain/sessions/layoutOperations";
import { toDuplicateSessionDraft } from "@/domain/sessions/sessionDuplication";
import { structureCircuits, structureExercises, type SessionStructure } from "@/domain/sessions/structure";
import { validateStructuredSessionInput, type StructureExerciseInput, type StructuredSessionInput } from "@/domain/sessions/structuredInput";

/**
 * PRE-9 (story C.1, réalignement du 02/11/2026 — référence Formats §1, §2, §6.1, §14 ; FMT-01, FMT-02,
 * FMT-09) — registre des quatre Formats spécialisés, porteurs (Exercice autonome, Circuit porteur,
 * membre), compatibilité d'un Exercice formaté autonome avec un Circuit standard, codage des réglages,
 * transport par le brouillon et la duplication.
 */

const EMOM: ElementFormat = { key: "EMOM", settings: { intervalSeconds: 60 } };
const AMRAP_CIRCUIT: ElementFormat = { key: "AMRAP", settings: { blockSeconds: 720, restBetweenBlocksSeconds: 120 } };
const AMRAP_MEMBER: ElementFormat = { key: "AMRAP", settings: { incrementPerRound: 0 } };
const BUY_IN: ElementFormat = { key: "AMRAP", settings: { incrementPerRound: 0, passageOnce: 1 } };

describe("PRE-9 C.1 — registre des Formats (02/11/2026)", () => {
  it("quatre Formats spécialisés ; Tabata et cinq départs rapides sont des préconfigurations sans identité de Format (FMT-01, FMT-02)", () => {
    expect(ELEMENT_FORMAT_KEYS).toEqual(["EMOM", "AMRAP", "FOR_TIME", "DEATH_BY"]);
    expect(PRECONFIGURATION_KEYS).toEqual(["TABATA", "INTERVALS_30_30", "STRENGTH", "SUPERSET", "PROGRESSION", "UNTIL_FAILURE"]);
  });

  it("valeurs initiales de chaque rôle : AMRAP 12 min, incrément 0 ; Circuit AMRAP bloc 12 min, repos 2 min ; EMOM et Death by intervalle 1 min ; Death by incrément 1 ; For time sans limite", () => {
    expect(initialFormatSettings("AMRAP", { kind: "EXERCISE" })).toEqual({ durationSeconds: 720, incrementPerRound: 0 });
    expect(initialFormatSettings("AMRAP", { kind: "CIRCUIT", nature: "TOURS" })).toEqual({ blockSeconds: 720, restBetweenBlocksSeconds: 120 });
    expect(initialFormatSettings("AMRAP", { kind: "MEMBER", nature: "TOURS" })).toEqual({ incrementPerRound: 0 });
    expect(initialFormatSettings("EMOM", { kind: "EXERCISE" })).toEqual({ intervalSeconds: 60 });
    expect(initialFormatSettings("EMOM", { kind: "CIRCUIT", nature: "TOURS" })).toEqual({ windowSeconds: 60 });
    expect(initialFormatSettings("DEATH_BY", { kind: "EXERCISE" })).toEqual({ intervalSeconds: 60, incrementPerRound: 1 });
    expect(initialFormatSettings("DEATH_BY", { kind: "MEMBER", nature: "SERIES" })).toEqual({ incrementPerRound: 1, intervalSeconds: 60 });
    expect(initialFormatSettings("FOR_TIME", { kind: "EXERCISE" })).toEqual({});
    expect(initialFormatSettings("FOR_TIME", { kind: "CIRCUIT", nature: "SERIES" })).toEqual({ restBetweenRoundsSeconds: 0 });
  });

  it("Circuit porteur : nature fixée par le Format (§1) ; Death by alterné sans intervalle au Circuit (A2)", () => {
    expect(circuitFormatParametersOf("AMRAP", "SERIES")).toBeNull();
    expect(circuitFormatParametersOf("FOR_TIME", "TOURS")).toBeNull();
    expect(circuitFormatParametersOf("EMOM", "SERIES")).toBeNull();
    expect(circuitFormatParametersOf("DEATH_BY", "TOURS")!.map((parameter) => parameter.id)).toEqual(["windowSeconds"]);
    expect(circuitFormatParametersOf("DEATH_BY", "SERIES")).toEqual([]);
  });

  it("Exercice formaté autonome dans un Circuit standard (§6.1, FMT-09) : groupées admises ; alternées refusées sauf EMOM (séries adaptées)", () => {
    for (const key of ELEMENT_FORMAT_KEYS) {
      expect(circuitCompatibility(key, { nature: "TOURS" }).status).toBe("ADMITTED");
    }
    expect(circuitCompatibility("EMOM", { nature: "SERIES" })).toEqual({ status: "ADMITTED", adaptsSeriesCount: true });
    for (const key of ["AMRAP", "FOR_TIME", "DEATH_BY"] as const) {
      expect(circuitCompatibility(key, { nature: "SERIES" }).status).toBe("REFUSED");
    }
  });
});

describe("PRE-9 C.1 — contrôle structurel d'un Format porté, selon son rôle", () => {
  it("réglages partiels admis ; inconnu, hors borne et rôle impossible refusés ; incrément Death by ≥ 1, AMRAP ≥ 0 (§14.1)", () => {
    expect(elementFormatViolations(EMOM)).toEqual([]);
    expect(elementFormatViolations({ key: "EMOM", settings: {} })).toEqual([]);
    expect(elementFormatViolations({ key: "EMOM", settings: { cadence: 60 } })).toEqual(["FORMAT_SETTING_UNKNOWN"]);
    expect(elementFormatViolations({ key: "EMOM", settings: { intervalSeconds: 0.5 } })).toEqual(["FORMAT_SETTING_INVALID"]);
    expect(elementFormatViolations({ key: "DEATH_BY", settings: { incrementPerRound: 0 } })).toEqual(["FORMAT_SETTING_INVALID"]);
    expect(elementFormatViolations({ key: "AMRAP", settings: { incrementPerRound: 0 } })).toEqual([]);
    expect(elementFormatViolations({ key: "HIIT" as never, settings: {} })).toEqual(["FORMAT_UNKNOWN"]);
    expect(elementFormatViolations(AMRAP_CIRCUIT, { kind: "CIRCUIT", nature: "TOURS" })).toEqual([]);
    expect(elementFormatViolations(AMRAP_CIRCUIT, { kind: "CIRCUIT", nature: "SERIES" })).toEqual(["FORMAT_ROLE_FORBIDDEN"]);
    expect(elementFormatViolations(BUY_IN, { kind: "MEMBER", nature: "TOURS" })).toEqual([]);
    expect(elementFormatViolations({ key: "AMRAP", settings: { passageOnce: 2 } }, { kind: "MEMBER", nature: "TOURS" })).toEqual([
      "FORMAT_SETTING_INVALID",
    ]);
    // Passage n'existe pas pour l'Exercice autonome (§3).
    expect(elementFormatViolations(BUY_IN)).toEqual(["FORMAT_SETTING_UNKNOWN"]);
  });

  it("codage versionné, clés triées, lecture stricte", () => {
    const encoded = encodeFormatSettings({ windowSeconds: 60, roundCount: 6 });
    expect(encoded).toBe('{"version":1,"values":{"roundCount":6,"windowSeconds":60}}');
    expect(decodeFormatSettings(encoded)).toEqual({ roundCount: 6, windowSeconds: 60 });
    for (const corrupt of ["", "{", "null", '{"version":2,"values":{}}', '{"version":1,"values":[]}', '{"version":1,"values":{"a":"6"}}']) {
      expect(decodeFormatSettings(corrupt)).toBeNull();
    }
    expect(elementFormatsEqual(EMOM, { key: "EMOM", settings: { intervalSeconds: 60 } })).toBe(true);
    expect(elementFormatsEqual(EMOM, { key: "EMOM", settings: { intervalSeconds: 75 } })).toBe(false);
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
  it("Circuit porteur AMRAP (buy-in et membre de boucle), Exercice EMOM dans un Cycle, Exercice libre : valide, Formats et origine conservés", () => {
    const result = validateStructuredSessionInput(
      session(
        {
          elements: [
            {
              kind: "CIRCUIT",
              circuit: { id: "c1", repeatCount: 3, nature: "TOURS", format: AMRAP_CIRCUIT, exercises: [exerciseInput("a", BUY_IN), exerciseInput("b", AMRAP_MEMBER)] },
            },
            { kind: "CYCLE", cycle: { id: "y1", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: exerciseInput("e", EMOM) }] } },
            { kind: "EXERCISE", exercise: exerciseInput("libre") },
          ],
          stopPoints: [],
        },
        "AMRAP",
      ),
    );
    if (!result.ok) throw new Error(JSON.stringify(result.violations));
    expect(result.value.origin).toBe("AMRAP");
    expect(structureCircuits(result.value.structure)[0]!.format).toEqual(AMRAP_CIRCUIT);
    expect(structureExercises(result.value.structure).map((item) => item.format ?? null)).toEqual([BUY_IN, AMRAP_MEMBER, EMOM, null]);
  });

  it("refus : nature non admise par le Format du Circuit, membre d'une autre clé (aucun Format imbriqué, §6), réglage hors borne, origine inconnue", () => {
    const refused = (circuit: Parameters<typeof session>[0]["elements"][number]) =>
      validateStructuredSessionInput(session({ elements: [circuit], stopPoints: [] }));
    const nature = refused({ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 3, nature: "SERIES", format: AMRAP_CIRCUIT, exercises: [exerciseInput("x", AMRAP_MEMBER)] } });
    expect(nature.ok).toBe(false);
    const nested = refused({ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 3, nature: "TOURS", format: AMRAP_CIRCUIT, exercises: [exerciseInput("x", EMOM)] } });
    expect(nested.ok).toBe(false);
    const result = validateStructuredSessionInput(
      session({ elements: [{ kind: "EXERCISE", exercise: exerciseInput("a", { key: "EMOM", settings: { intervalSeconds: 0 } }) }], stopPoints: [] }, "PLANK" as never),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.violations).toEqual([
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
  // Exercice EMOM autonome, puis Circuit porteur AMRAP [buy-in, membre de boucle].
  const carrier = stored(
    {
      elements: [
        { kind: "EXERCISE", exercise: activity("avant", EMOM) },
        {
          kind: "CIRCUIT",
          circuit: { id: "c1", repeatCount: 3, nature: "TOURS", format: AMRAP_CIRCUIT, exercises: [activity("t1", BUY_IN, "IN_TOUR"), activity("t2", AMRAP_MEMBER, "IN_TOUR")] },
        },
      ],
      stopPoints: [],
    },
    "AMRAP",
  );

  it("brouillon : Format du Circuit porteur et de chaque Exercice (copies indépendantes) relus puis réécrits ; origine conservée", () => {
    const draft = toSessionDraft(carrier);
    expect(draft.origin).toBe("AMRAP");
    // Circuit porteur : disposition générale (absent de l'ancien modèle).
    expect(structureCircuits(draft.structure!)[0]!.format).toEqual(AMRAP_CIRCUIT);
    const formatted = draft.exercises.find((item) => item.id === "avant")!;
    expect(formatted.format).toEqual(EMOM);
    expect(formatted.format).not.toBe(EMOM);
    const result = toStructuredSessionInput(draft, () => "unused");
    if (!result.ok) throw new Error(JSON.stringify(result.violations));
    expect(result.value.origin).toBe("AMRAP");
    expect(structureCircuits(result.value.structure)[0]!.format).toEqual(AMRAP_CIRCUIT);
    expect(structureExercises(result.value.structure).map((item) => item.format ?? null)).toEqual([EMOM, BUY_IN, AMRAP_MEMBER]);
  });

  it("un changement de réglage seul rend l'Exercice modifié", () => {
    const [item] = toSessionDraft(carrier).exercises;
    expect(exerciseEquals(item!, { ...item!, format: { key: "EMOM", settings: { intervalSeconds: 75 } } })).toBe(false);
    expect(exerciseEquals(item!, { ...item!, format: { key: "EMOM", settings: { intervalSeconds: 60 } } })).toBe(true);
  });

  it("duplication (ARB-17) : Format du Circuit porteur et de ses membres copiés, identités nouvelles, origine non recopiée", () => {
    let next = 0;
    const draft = toDuplicateSessionDraft(carrier, () => `dup-${++next}`, ["Séance"]);
    expect(draft).not.toHaveProperty("origin");
    const result = toStructuredSessionInput(draft, () => "fresh-circuit");
    if (!result.ok) throw new Error(JSON.stringify(result.violations));
    const [circuit] = structureCircuits(result.value.structure);
    expect(circuit!.id).not.toBe("c1");
    expect(circuit!.format).toEqual(AMRAP_CIRCUIT);
    expect(circuit!.exercises.map((item) => item.format ?? null)).toEqual([BUY_IN, AMRAP_MEMBER]);
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
