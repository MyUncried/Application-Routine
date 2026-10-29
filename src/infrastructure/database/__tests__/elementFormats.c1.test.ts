import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { ElementFormat } from "@/domain/sessions/formats";
import { toSessionDraft } from "@/domain/sessions/SessionDraft";
import { structureCircuits, structureExercises, type SessionStructure, type StructureCycleMember } from "@/domain/sessions/structure";
import type { StructureExerciseInput, StructureInput, StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SessionStructureNotRepresentableError, SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-9 (story C.1, ARB-03, ARB-16, ARB-17, FMT-02, `migration017`) — Format porté par un Circuit
 * ou un Exercice, sur SQLite réelle (`node:sqlite`) : plusieurs éléments formatés dans une Séance,
 * directement ou dans un Cycle ; écriture et relecture à l'identique ; Format conservé par
 * déplacement et par duplication ; origine de création écrite une fois ; Séance libre inchangée.
 */

const NOW = "2026-10-29T09:00:00.000Z";

let database: NodeSqliteDatabase;
let sequence = 0;
const repository = () => new SqliteSessionRepository(database, () => `gen-${++sequence}`, () => NOW);
const service = () => new SessionService(repository(), undefined, () => `container-${++sequence}`);

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  for (const [id, name] of [
    ["mv-squat", "Squat"],
    ["mv-pompes", "Pompes"],
  ] as const) {
    await database.runAsync(
      `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
       VALUES (?, ?, lower(?), NULL, 'cardio', 1, ?, ?)`,
      [id, name, name, NOW, NOW],
    );
    await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES (?, 'dos')", [id]);
  }
});

afterEach(() => {
  database.close();
});

const TABATA: ElementFormat = { key: "TABATA", settings: {} };
const EMOM: ElementFormat = { key: "EMOM", settings: { windowSeconds: 60, roundCount: 6 } };
const FOR_TIME: ElementFormat = { key: "FOR_TIME", settings: { volumePerRound: [21, 15, 9] } };

const exercise = (id: string, format?: ElementFormat, movementId = "mv-squat"): StructureExerciseInput => ({
  id,
  type: "EXERCISE",
  executionParameters: durationParameters(30),
  postActivityRecoverySeconds: 0,
  sourceMovementId: movementId,
  ...(format !== undefined ? { format } : {}),
});

/**
 * Exercice libre, Tabata en alternance (Circuit, 8 séries), Cycle × 2 [EMOM porté par un Exercice
 * direct, For time porté par un Circuit], Exercice libre.
 */
const formatted = (): StructureInput => ({
  elements: [
    { kind: "EXERCISE", exercise: exercise("warmup", undefined, "mv-pompes") },
    { kind: "CIRCUIT", circuit: { id: "tabata", repeatCount: 8, nature: "SERIES", exercises: [exercise("t1"), exercise("t2", undefined, "mv-pompes")], format: TABATA } },
    {
      kind: "CYCLE",
      cycle: {
        id: "cycle",
        repeatCount: 2,
        members: [
          { kind: "EXERCISE", exercise: exercise("emom", EMOM) } satisfies StructureCycleMember<StructureExerciseInput>,
          { kind: "CIRCUIT", circuit: { id: "for-time", repeatCount: 3, nature: "TOURS", exercises: [exercise("f1"), exercise("f2")], format: FOR_TIME } },
        ],
      },
    },
    { kind: "EXERCISE", exercise: exercise("cooldown", undefined, "mv-pompes") },
  ],
  stopPoints: [],
});

const input = (structure: StructureInput, origin?: StructuredSessionInput["origin"]): StructuredSessionInput => ({
  name: "Séance formatée",
  labelId: null,
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  structure,
  ...(origin !== undefined ? { origin } : {}),
});

type Carried = { readonly id: string; readonly format: ElementFormat | null };

const formatsOf = <E extends { readonly id: string; readonly format?: ElementFormat | null }>(structure: Pick<SessionStructure<E>, "elements">): Carried[] => [
  ...structureCircuits(structure).map((circuit) => ({ id: circuit.id, format: circuit.format ?? null })),
  ...structureExercises(structure).map((item) => ({ id: item.id, format: item.format ?? null })),
];

const EXPECTED: Carried[] = [
  { id: "tabata", format: TABATA },
  { id: "for-time", format: FOR_TIME },
  { id: "warmup", format: null },
  { id: "t1", format: null },
  { id: "t2", format: null },
  { id: "emom", format: EMOM },
  { id: "f1", format: null },
  { id: "f2", format: null },
  { id: "cooldown", format: null },
];

describe("PRE-9 C.1 — Format porté par l'élément, en base (migration 017)", () => {
  it("écrit et relit à l'identique plusieurs éléments formatés, au niveau principal et dans un Cycle, et l'origine", async () => {
    const created = await repository().createStructured(input(formatted(), "TABATA"));
    expect(formatsOf(created.structure)).toEqual(EXPECTED);
    expect(created.origin).toBe("TABATA");
    const reread = (await repository().findStructuredById(created.id))!;
    expect(reread.structure).toEqual(created.structure);
    expect(reread.origin).toBe("TABATA");

    expect(await database.getAllAsync("SELECT id, format_key, format_settings FROM tours ORDER BY id")).toEqual([
      { id: "for-time", format_key: "FOR_TIME", format_settings: '{"version":1,"values":{"volumePerRound":[21,15,9]}}' },
      { id: "tabata", format_key: "TABATA", format_settings: '{"version":1,"values":{}}' },
    ]);
    expect(await database.getAllAsync("SELECT id, format_key, format_settings FROM activities WHERE format_key IS NOT NULL")).toEqual([
      { id: "emom", format_key: "EMOM", format_settings: '{"version":1,"values":{"roundCount":6,"windowSeconds":60}}' },
    ]);
  });

  it("Séance libre : aucune colonne renseignée, aucune clé ajoutée à la lecture (FMT-40)", async () => {
    const created = await repository().createStructured(input({ elements: [{ kind: "EXERCISE", exercise: exercise("solo") }], stopPoints: [] }));
    expect(created).not.toHaveProperty("origin");
    expect(structureExercises(created.structure)[0]).not.toHaveProperty("format");
    expect(await database.getAllAsync("SELECT origin FROM sessions")).toEqual([{ origin: null }]);
    expect(await database.getAllAsync("SELECT format_key, format_settings FROM activities")).toEqual([{ format_key: null, format_settings: null }]);
  });

  it("déplacement dans la Séance : le Format suit l'élément ; l'origine n'est jamais réécrite par la modification", async () => {
    const created = await repository().createStructured(input(formatted(), "SESSION_CARD"));
    const outcome = await repository().updateStructured(created.id, {
      ...input({
        elements: [
          // L'Exercice EMOM sort du Cycle ; le Circuit For time passe au niveau principal.
          { kind: "EXERCISE", exercise: exercise("emom", EMOM) },
          { kind: "CIRCUIT", circuit: { id: "for-time", repeatCount: 3, nature: "TOURS", exercises: [exercise("f1"), exercise("f2")], format: FOR_TIME } },
          { kind: "CIRCUIT", circuit: { id: "tabata", repeatCount: 8, nature: "SERIES", exercises: [exercise("t1"), exercise("t2", undefined, "mv-pompes")], format: TABATA } },
        ],
        stopPoints: [],
      }),
      persistedActivityIds: structureExercises(created.structure).map((item) => item.id),
    });
    expect(outcome.status).toBe("UPDATED");
    const reread = (await repository().findStructuredById(created.id))!;
    expect(formatsOf(reread.structure)).toEqual([
      { id: "for-time", format: FOR_TIME },
      { id: "tabata", format: TABATA },
      { id: "emom", format: EMOM },
      { id: "f1", format: null },
      { id: "f2", format: null },
      { id: "t1", format: null },
      { id: "t2", format: null },
    ]);
    expect(reread.origin).toBe("SESSION_CARD");
  });

  it("refuse sans écrire : Format inconnu, Death by porté par un Circuit (R-03), constante enregistrée, réglage hors borne, origine inconnue", async () => {
    const circuitWith = (format: ElementFormat): StructureInput => ({
      elements: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 1, nature: "TOURS", exercises: [exercise("x")], format } }],
      stopPoints: [],
    });
    const single = (format: ElementFormat): StructureInput => ({ elements: [{ kind: "EXERCISE", exercise: exercise("x", format) }], stopPoints: [] });
    const cases: readonly [StructuredSessionInput, string, string][] = [
      [input(single({ key: "HIIT" as never, settings: {} })), "UNRECOGNIZED", "element.format"],
      [input(circuitWith({ key: "DEATH_BY", settings: {} })), "FORBIDDEN_PLACEMENT", "element.format"],
      [input(single({ key: "TABATA", settings: { workSeconds: 25 } })), "MUST_BE_ABSENT", "element.formatSettings"],
      [input(single({ key: "EMOM", settings: { roundCount: 0 } })), "OUT_OF_RANGE", "element.formatSettings"],
      [input(single({ key: "EMOM", settings: { cadence: 60 } })), "UNRECOGNIZED", "element.formatSettings"],
      [input(single(EMOM), "HIIT" as never), "UNRECOGNIZED", "session.origin"],
    ];
    for (const [candidate, code, field] of cases) {
      await expect(repository().createStructured(candidate)).rejects.toMatchObject({ violations: expect.arrayContaining([expect.objectContaining({ code, field })]) });
    }
    expect(await database.getAllAsync("SELECT id FROM sessions")).toEqual([]);
  });

  it("schéma : clé de Format hors liste, réglages sans Format ou Format sans réglages refusés (CHECK de la 017)", async () => {
    const created = await repository().createStructured(input(formatted()));
    await expect(database.runAsync("UPDATE tours SET format_key = 'HIIT' WHERE id = 'tabata'")).rejects.toThrow();
    await expect(database.runAsync("UPDATE tours SET format_key = NULL WHERE id = 'tabata'")).rejects.toThrow();
    await expect(database.runAsync("UPDATE activities SET format_settings = NULL WHERE id = 'emom'")).rejects.toThrow();
    await expect(database.runAsync("UPDATE sessions SET origin = 'HIIT' WHERE id = ?", [created.id])).rejects.toThrow();
  });

  it("donnée illisible : réglages corrompus → contrat rompu à la lecture, jamais un élément libre", async () => {
    const created = await repository().createStructured(input(formatted()));
    await database.runAsync("UPDATE activities SET format_settings = '{\"version\":9,\"values\":{}}' WHERE id = 'emom'");
    await expect(repository().findStructuredById(created.id)).rejects.toThrow();
  });

  it("l'ancien modèle ne réécrit jamais une Séance qui porte un Format", async () => {
    const created = await repository().createStructured(
      input({
        elements: [{ kind: "CIRCUIT", circuit: { id: "tabata", repeatCount: 1, nature: "TOURS", exercises: [exercise("t1")], format: TABATA } }],
        stopPoints: [],
      }),
    );
    await expect(
      repository().update(created.id, {
        sourceSessionId: created.id,
        name: "Ancien chemin",
        labelId: null,
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        tourRepeatCount: 1,
        activities: [{ id: "t1", type: "EXERCISE", structuralPosition: "IN_TOUR", position: 0, executionParameters: durationParameters(30), postActivityRecoverySeconds: 0, sourceMovementId: "mv-squat" }],
      }),
    ).rejects.toBeInstanceOf(SessionStructureNotRepresentableError);
    expect((await repository().findStructuredById(created.id))!.structure).toEqual(created.structure);
  });
});

describe("PRE-9 C.1 — service : ouverture, enregistrement et duplication conservent les Formats (ARB-17)", () => {
  it("brouillon rouvert et réenregistré sans modification : Formats et origine inchangés ; duplication : Formats copiés, origine non recopiée", async () => {
    const created = await repository().createStructured(input(formatted(), "EMOM"));
    const opened = await service().getSessionForEdit(created.id);
    if (opened.status !== "OK") throw new Error(opened.status);
    const draft = toSessionDraft(opened.session);
    expect(draft.origin).toBe("EMOM");
    expect(draft.exercises.find((item) => item.id === "emom")?.format).toEqual(EMOM);

    expect((await service().updateSession(created.id, { ...draft, name: "Renommée" })).status).toBe("UPDATED");
    const saved = (await repository().findStructuredById(created.id))!;
    expect(saved.structure).toEqual(created.structure);
    expect(saved.origin).toBe("EMOM");

    let next = 0;
    const duplicated = await service().duplicateSession(created.id, () => `dup-${++next}`);
    if (duplicated.status !== "DUPLICATED") throw new Error(duplicated.status);
    const copy = duplicated.session;
    expect(formatsOf(copy.structure).map((item) => item.format)).toEqual(EXPECTED.map((item) => item.format));
    expect([...structureCircuits(copy.structure).map((circuit) => circuit.id), ...structureExercises(copy.structure).map((item) => item.id)].every((id) => id.startsWith("dup-"))).toBe(true);
    expect(copy).not.toHaveProperty("origin");
    // L'original est intact.
    expect((await repository().findStructuredById(created.id))!.structure).toEqual(created.structure);
  });

  it("Séance de l'ancien modèle dont le Circuit porte un Format : rouverte et dupliquée avec son Format", async () => {
    const created = await repository().createStructured(
      input({
        elements: [
          { kind: "EXERCISE", exercise: exercise("before") },
          { kind: "CIRCUIT", circuit: { id: "tabata", repeatCount: 1, nature: "TOURS", exercises: [exercise("t1"), exercise("t2")], format: TABATA } },
        ],
        stopPoints: [],
      }),
    );
    const opened = await service().getSessionForEdit(created.id);
    if (opened.status !== "OK") throw new Error(opened.status);
    expect((await service().updateSession(created.id, toSessionDraft(opened.session))).status).toBe("UPDATED");
    expect((await repository().findStructuredById(created.id))!.structure).toEqual(created.structure);

    let next = 0;
    const duplicated = await service().duplicateSession(created.id, () => `dup-${++next}`);
    if (duplicated.status !== "DUPLICATED") throw new Error(duplicated.status);
    const [circuit] = structureCircuits(duplicated.session.structure);
    expect(circuit!.format).toEqual(TABATA);
    expect(circuit!.id).not.toBe("tabata");
  });
});
