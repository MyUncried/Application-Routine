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
 * PRE-9 (story C.1, ARB-16, ARB-17, FMT-02, `migration017` ; correction du 30/10, D-02, D-26, D-27)
 * — Format porté par l'Exercice seul, sur SQLite réelle (`node:sqlite`) : plusieurs Exercices aux
 * Formats différents dans un même Circuit, directement ou dans un Cycle ; écriture et relecture à
 * l'identique ; Format et réglages conservés par déplacement (Circuit compris) et par duplication ;
 * aucun Format transmis à un autre membre ni à un Exercice entrant ; colonnes `tours.format_*`
 * (vestiges de la 017) ni écrites ni lues ; origine de création écrite une fois.
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
const AMRAP: ElementFormat = { key: "AMRAP", settings: { durationSeconds: 720 } };

const exercise = (id: string, format?: ElementFormat, movementId = "mv-squat"): StructureExerciseInput => ({
  id,
  type: "EXERCISE",
  executionParameters: durationParameters(30),
  postActivityRecoverySeconds: 0,
  sourceMovementId: movementId,
  ...(format !== undefined ? { format } : {}),
});

/**
 * Exercice libre ; Circuit alterné × 8 [Tabata, libre] ; Cycle × 2 [EMOM direct, Circuit groupé × 3
 * [For time, AMRAP, libre]] ; Exercice libre. Aucun Circuit ne porte de Format.
 */
const formatted = (): StructureInput => ({
  elements: [
    { kind: "EXERCISE", exercise: exercise("warmup", undefined, "mv-pompes") },
    { kind: "CIRCUIT", circuit: { id: "alt", repeatCount: 8, nature: "SERIES", exercises: [exercise("t1", TABATA), exercise("t2", undefined, "mv-pompes")] } },
    {
      kind: "CYCLE",
      cycle: {
        id: "cycle",
        repeatCount: 2,
        members: [
          { kind: "EXERCISE", exercise: exercise("emom", EMOM) } satisfies StructureCycleMember<StructureExerciseInput>,
          { kind: "CIRCUIT", circuit: { id: "mixed", repeatCount: 3, nature: "TOURS", exercises: [exercise("f1", FOR_TIME), exercise("a1", AMRAP), exercise("f2")] } },
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

const formatsOf = <E extends { readonly id: string; readonly format?: ElementFormat | null }>(structure: Pick<SessionStructure<E>, "elements">): Carried[] =>
  structureExercises(structure).map((item) => ({ id: item.id, format: item.format ?? null }));

const EXPECTED: Carried[] = [
  { id: "warmup", format: null },
  { id: "t1", format: TABATA },
  { id: "t2", format: null },
  { id: "emom", format: EMOM },
  { id: "f1", format: FOR_TIME },
  { id: "a1", format: AMRAP },
  { id: "f2", format: null },
  { id: "cooldown", format: null },
];

const NO_CIRCUIT_FORMAT = [
  { id: "alt", format_key: null, format_settings: null },
  { id: "mixed", format_key: null, format_settings: null },
];

describe("PRE-9 C.1 — Format porté par l'Exercice, en base (migration 017)", () => {
  it("écrit et relit à l'identique plusieurs Exercices aux Formats différents dans un même Circuit, au niveau principal et dans un Cycle, et l'origine", async () => {
    const created = await repository().createStructured(input(formatted(), "TABATA"));
    expect(formatsOf(created.structure)).toEqual(EXPECTED);
    expect(created.origin).toBe("TABATA");
    const reread = (await repository().findStructuredById(created.id))!;
    expect(reread.structure).toEqual(created.structure);
    expect(reread.origin).toBe("TABATA");
    for (const circuit of structureCircuits(reread.structure)) {
      expect(circuit).not.toHaveProperty("format");
    }

    // Vestiges de la 017 : jamais écrits.
    expect(await database.getAllAsync("SELECT id, format_key, format_settings FROM tours ORDER BY id")).toEqual(NO_CIRCUIT_FORMAT);
    expect(await database.getAllAsync("SELECT id, format_key, format_settings FROM activities WHERE format_key IS NOT NULL ORDER BY id")).toEqual([
      { id: "a1", format_key: "AMRAP", format_settings: '{"version":1,"values":{"durationSeconds":720}}' },
      { id: "emom", format_key: "EMOM", format_settings: '{"version":1,"values":{"roundCount":6,"windowSeconds":60}}' },
      { id: "f1", format_key: "FOR_TIME", format_settings: '{"version":1,"values":{"volumePerRound":[21,15,9]}}' },
      { id: "t1", format_key: "TABATA", format_settings: '{"version":1,"values":{}}' },
    ]);
  });

  it("Séance libre : aucune colonne renseignée, aucune clé ajoutée à la lecture (FMT-40)", async () => {
    const created = await repository().createStructured(input({ elements: [{ kind: "EXERCISE", exercise: exercise("solo") }], stopPoints: [] }));
    expect(created).not.toHaveProperty("origin");
    expect(structureExercises(created.structure)[0]).not.toHaveProperty("format");
    expect(await database.getAllAsync("SELECT origin FROM sessions")).toEqual([{ origin: null }]);
    expect(await database.getAllAsync("SELECT format_key, format_settings FROM activities")).toEqual([{ format_key: null, format_settings: null }]);
  });

  it("déplacement : l'Exercice formaté entre dans un Circuit avec son Format et ses réglages ; rien n'est transmis aux membres ni à un Exercice libre entrant ; l'origine n'est pas réécrite", async () => {
    const created = await repository().createStructured(input(formatted(), "SESSION_CARD"));
    const outcome = await repository().updateStructured(created.id, {
      ...input({
        elements: [
          // L'EMOM sort du Cycle et entre dans le Circuit alterné ; l'Exercice libre « warmup » entre dans le Circuit groupé.
          { kind: "CIRCUIT", circuit: { id: "alt", repeatCount: 8, nature: "SERIES", exercises: [exercise("t1", TABATA), exercise("emom", EMOM), exercise("t2", undefined, "mv-pompes")] } },
          { kind: "CIRCUIT", circuit: { id: "mixed", repeatCount: 3, nature: "TOURS", exercises: [exercise("warmup", undefined, "mv-pompes"), exercise("f1", FOR_TIME), exercise("a1", AMRAP), exercise("f2")] } },
          { kind: "EXERCISE", exercise: exercise("cooldown", undefined, "mv-pompes") },
        ],
        stopPoints: [],
      }),
      persistedActivityIds: structureExercises(created.structure).map((item) => item.id),
    });
    expect(outcome.status).toBe("UPDATED");
    const reread = (await repository().findStructuredById(created.id))!;
    expect(formatsOf(reread.structure)).toEqual([
      { id: "t1", format: TABATA },
      { id: "emom", format: EMOM },
      { id: "t2", format: null },
      { id: "warmup", format: null },
      { id: "f1", format: FOR_TIME },
      { id: "a1", format: AMRAP },
      { id: "f2", format: null },
      { id: "cooldown", format: null },
    ]);
    expect(await database.getAllAsync("SELECT id, format_key, format_settings FROM tours ORDER BY id")).toEqual(NO_CIRCUIT_FORMAT);
    expect(reread.origin).toBe("SESSION_CARD");
  });

  it("refuse sans écrire : Format inconnu, Format sur un Circuit (entrée non typée, D-02), constante enregistrée, réglage hors borne, origine inconnue", async () => {
    const circuitWith = (format: ElementFormat): StructureInput => ({
      elements: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 1, nature: "TOURS", exercises: [exercise("x")], format } as never }],
      stopPoints: [],
    });
    const single = (format: ElementFormat): StructureInput => ({ elements: [{ kind: "EXERCISE", exercise: exercise("x", format) }], stopPoints: [] });
    const cases: readonly [StructuredSessionInput, string, string][] = [
      [input(single({ key: "HIIT" as never, settings: {} })), "UNRECOGNIZED", "element.format"],
      [input(circuitWith(TABATA)), "FORBIDDEN_PLACEMENT", "element.format"],
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

  it("schéma : clé de Format hors liste, réglages sans Format ou Format sans réglages refusés (CHECK de la 017, inchangée)", async () => {
    const created = await repository().createStructured(input(formatted()));
    await expect(database.runAsync("UPDATE tours SET format_key = 'HIIT' WHERE id = 'alt'")).rejects.toThrow();
    await expect(database.runAsync("UPDATE activities SET format_key = NULL WHERE id = 't1'")).rejects.toThrow();
    await expect(database.runAsync("UPDATE activities SET format_settings = NULL WHERE id = 'emom'")).rejects.toThrow();
    await expect(database.runAsync("UPDATE sessions SET origin = 'HIIT' WHERE id = ?", [created.id])).rejects.toThrow();
  });

  it("vestige `tours.format_*` renseigné hors du code actif : ignoré à la lecture, non réécrit, jamais transmis aux membres", async () => {
    const created = await repository().createStructured(input(formatted()));
    await database.runAsync("UPDATE tours SET format_key = 'EMOM', format_settings = '{\"version\":1,\"values\":{}}' WHERE id = 'mixed'");
    const reread = (await repository().findStructuredById(created.id))!;
    expect(reread.structure).toEqual(created.structure);
    expect(await repository().updateStructured(created.id, { ...input(formatted()), persistedActivityIds: structureExercises(created.structure).map((item) => item.id) })).toMatchObject({
      status: "UPDATED",
    });
    expect(formatsOf((await repository().findStructuredById(created.id))!.structure)).toEqual(EXPECTED);
    // Colonne non touchée par la mise à jour : la donnée existante n'est ni effacée ni interprétée.
    expect(await database.getAllAsync("SELECT format_key FROM tours WHERE id = 'mixed'")).toEqual([{ format_key: "EMOM" }]);
  });

  it("donnée illisible : réglages corrompus d'un Exercice → contrat rompu à la lecture, jamais un Exercice libre", async () => {
    const created = await repository().createStructured(input(formatted()));
    await database.runAsync("UPDATE activities SET format_settings = '{\"version\":9,\"values\":{}}' WHERE id = 'emom'");
    await expect(repository().findStructuredById(created.id)).rejects.toThrow();
  });

  it("l'ancien modèle ne réécrit jamais une Séance dont un Exercice porte un Format", async () => {
    const created = await repository().createStructured(
      input({
        elements: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 1, nature: "TOURS", exercises: [exercise("t1", TABATA)] } }],
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
  it("brouillon rouvert et réenregistré sans modification : Formats et origine inchangés ; duplication : Formats et réglages copiés avec chaque Exercice, origine non recopiée", async () => {
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
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM tours WHERE format_key IS NOT NULL")).toEqual([{ count: 0 }]);
    // L'original est intact.
    expect((await repository().findStructuredById(created.id))!.structure).toEqual(created.structure);
  });

  it("Séance de l'ancien modèle dont un membre du Circuit porte un Format : rouverte, réenregistrée et dupliquée avec ce Format ; le membre libre reste libre", async () => {
    const created = await repository().createStructured(
      input({
        elements: [
          { kind: "EXERCISE", exercise: exercise("before") },
          { kind: "CIRCUIT", circuit: { id: "c", repeatCount: 2, nature: "TOURS", exercises: [exercise("t1", TABATA), exercise("t2")] } },
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
    expect(circuit).not.toHaveProperty("format");
    expect(circuit!.id).not.toBe("c");
    expect(circuit!.exercises.map((item) => item.format ?? null)).toEqual([TABATA, null]);
  });
});
