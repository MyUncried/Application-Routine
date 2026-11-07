import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { ElementFormat } from "@/domain/sessions/formats";
import { toSessionDraft } from "@/domain/sessions/SessionDraft";
import {
  structureCircuits,
  structureExercises,
  type SessionStructure,
  type StructureCircuit,
  type StructureCycleMember,
} from "@/domain/sessions/structure";
import type { StructureExerciseInput, StructureInput, StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SessionStructureNotRepresentableError, SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-9 (story C.1, ARB-16, ARB-17, FMT-02, `migration017` ; réalignement du 02/11/2026, référence
 * `docs/KODJO-Formats-entrainement-2026-11-02.md` §1, §2, §6.1, §14) — Format porté par un Exercice
 * autonome ou par un Circuit porteur (« Format d'origine »), sur SQLite réelle (`node:sqlite`) :
 * plusieurs Exercices aux Formats différents dans des Circuits standards, directement ou dans un
 * Cycle ; Circuits porteurs (For time alterné, AMRAP dans chaque tour) écrits dans `tours.format_*`
 * et leurs membres avec la même clé ; écriture et relecture à l'identique ; Format et réglages
 * conservés par déplacement et par duplication ; aucun Format transmis à un Exercice entrant ;
 * clés Tabata et 30/30 écrites avant le 02/11 relues comme des éléments libres ; origine écrite une fois.
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

// Exercices autonomes (§14, rôle Exercice).
const EMOM: ElementFormat = { key: "EMOM", settings: { intervalSeconds: 60 } };
const DEATH_BY: ElementFormat = { key: "DEATH_BY", settings: { intervalSeconds: 60, incrementPerRound: 1 } };
const FOR_TIME: ElementFormat = { key: "FOR_TIME", settings: { timeCapSeconds: 600 } };
const AMRAP: ElementFormat = { key: "AMRAP", settings: { durationSeconds: 720, incrementPerRound: 0 } };
// Circuit porteur For time alterné (§11) et ses membres : boucle et buy-out « Une fois » (§3).
const FOR_TIME_CIRCUIT: ElementFormat = { key: "FOR_TIME", settings: { timeCapSeconds: 900, restBetweenRoundsSeconds: 60 } };
const FOR_TIME_MEMBER: ElementFormat = { key: "FOR_TIME", settings: {} };
const FOR_TIME_BUY_OUT: ElementFormat = { key: "FOR_TIME", settings: { passageOnce: 1 } };
// Circuit porteur AMRAP dans chaque tour (§2) et son membre (Incrément).
const AMRAP_CIRCUIT: ElementFormat = { key: "AMRAP", settings: { blockSeconds: 300, restBetweenBlocksSeconds: 120 } };
const AMRAP_MEMBER: ElementFormat = { key: "AMRAP", settings: { incrementPerRound: 2 } };

const exercise = (id: string, format?: ElementFormat, movementId = "mv-squat"): StructureExerciseInput => ({
  id,
  type: "EXERCISE",
  executionParameters: durationParameters(30),
  postActivityRecoverySeconds: 0,
  sourceMovementId: movementId,
  ...(format !== undefined ? { format } : {}),
});

const forTimeCarrier = (): StructureCircuit<StructureExerciseInput> => ({
  id: "ft",
  repeatCount: 3,
  nature: "SERIES",
  format: FOR_TIME_CIRCUIT,
  exercises: [exercise("m1", FOR_TIME_MEMBER), exercise("m2", FOR_TIME_BUY_OUT, "mv-pompes")],
});

/**
 * Exercice libre ; Circuit alterné standard × 8 [EMOM, libre] (EMOM admis en alternance, §6.1) ;
 * Cycle × 2 [Death by direct, Circuit groupé standard × 3 [For time, AMRAP, libre], Circuit porteur
 * AMRAP × 2 [membre]] ; Circuit porteur For time alterné × 3 [membre, buy-out] ; Exercice libre.
 */
const formatted = (): StructureInput => ({
  elements: [
    { kind: "EXERCISE", exercise: exercise("warmup", undefined, "mv-pompes") },
    { kind: "CIRCUIT", circuit: { id: "alt", repeatCount: 8, nature: "SERIES", exercises: [exercise("e1", EMOM), exercise("t2", undefined, "mv-pompes")] } },
    {
      kind: "CYCLE",
      cycle: {
        id: "cycle",
        repeatCount: 2,
        members: [
          { kind: "EXERCISE", exercise: exercise("db", DEATH_BY) } satisfies StructureCycleMember<StructureExerciseInput>,
          { kind: "CIRCUIT", circuit: { id: "mixed", repeatCount: 3, nature: "TOURS", exercises: [exercise("f1", FOR_TIME), exercise("a1", AMRAP), exercise("f2")] } },
          { kind: "CIRCUIT", circuit: { id: "amrap", repeatCount: 2, nature: "TOURS", format: AMRAP_CIRCUIT, exercises: [exercise("am1", AMRAP_MEMBER)] } },
        ],
      },
    },
    { kind: "CIRCUIT", circuit: forTimeCarrier() },
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

const circuitFormatsOf = <E,>(structure: Pick<SessionStructure<E>, "elements">): Carried[] =>
  structureCircuits(structure).map((circuit) => ({ id: circuit.id, format: circuit.format ?? null }));

const EXPECTED: Carried[] = [
  { id: "warmup", format: null },
  { id: "e1", format: EMOM },
  { id: "t2", format: null },
  { id: "db", format: DEATH_BY },
  { id: "f1", format: FOR_TIME },
  { id: "a1", format: AMRAP },
  { id: "f2", format: null },
  { id: "am1", format: AMRAP_MEMBER },
  { id: "m1", format: FOR_TIME_MEMBER },
  { id: "m2", format: FOR_TIME_BUY_OUT },
  { id: "cooldown", format: null },
];

const EXPECTED_CIRCUITS: Carried[] = [
  { id: "alt", format: null },
  { id: "mixed", format: null },
  { id: "amrap", format: AMRAP_CIRCUIT },
  { id: "ft", format: FOR_TIME_CIRCUIT },
];

const TOURS_ROWS = [
  { id: "alt", format_key: null, format_settings: null },
  { id: "amrap", format_key: "AMRAP", format_settings: '{"version":1,"values":{"blockSeconds":300,"restBetweenBlocksSeconds":120}}' },
  { id: "ft", format_key: "FOR_TIME", format_settings: '{"version":1,"values":{"restBetweenRoundsSeconds":60,"timeCapSeconds":900}}' },
  { id: "mixed", format_key: null, format_settings: null },
];

const persistedIds = (structure: Pick<SessionStructure<{ readonly id: string }>, "elements">) => structureExercises(structure).map((item) => item.id);

describe("PRE-9 C.1 — Format porté par l'Exercice ou le Circuit porteur, en base (migration 017)", () => {
  it("écrit et relit à l'identique des Exercices aux Formats différents dans des Circuits standards, au niveau principal et dans un Cycle, les Circuits porteurs et leurs membres, et l'origine", async () => {
    // L'origine « Tabata » reste une origine de création (préconfiguration), sans identité de Format.
    const created = await repository().createStructured(input(formatted(), "TABATA"));
    expect(formatsOf(created.structure)).toEqual(EXPECTED);
    expect(circuitFormatsOf(created.structure)).toEqual(EXPECTED_CIRCUITS);
    expect(created.origin).toBe("TABATA");
    const reread = (await repository().findStructuredById(created.id))!;
    expect(reread.structure).toEqual(created.structure);
    expect(circuitFormatsOf(reread.structure)).toEqual(EXPECTED_CIRCUITS);
    expect(reread.origin).toBe("TABATA");
    // Circuit standard : aucune clé `format` ajoutée à la lecture.
    for (const circuit of structureCircuits(reread.structure).filter((item) => item.id === "alt" || item.id === "mixed")) {
      expect(circuit).not.toHaveProperty("format");
    }

    // Format d'origine dans `tours.format_*` ; Circuits standards : deux `NULL`.
    expect(await database.getAllAsync("SELECT id, format_key, format_settings FROM tours ORDER BY id")).toEqual(TOURS_ROWS);
    expect(await database.getAllAsync("SELECT id, format_key, format_settings FROM activities WHERE format_key IS NOT NULL ORDER BY id")).toEqual([
      { id: "a1", format_key: "AMRAP", format_settings: '{"version":1,"values":{"durationSeconds":720,"incrementPerRound":0}}' },
      { id: "am1", format_key: "AMRAP", format_settings: '{"version":1,"values":{"incrementPerRound":2}}' },
      { id: "db", format_key: "DEATH_BY", format_settings: '{"version":1,"values":{"incrementPerRound":1,"intervalSeconds":60}}' },
      { id: "e1", format_key: "EMOM", format_settings: '{"version":1,"values":{"intervalSeconds":60}}' },
      { id: "f1", format_key: "FOR_TIME", format_settings: '{"version":1,"values":{"timeCapSeconds":600}}' },
      { id: "m1", format_key: "FOR_TIME", format_settings: '{"version":1,"values":{}}' },
      { id: "m2", format_key: "FOR_TIME", format_settings: '{"version":1,"values":{"passageOnce":1}}' },
    ]);
  });

  it("Séance libre : aucune colonne renseignée, aucune clé ajoutée à la lecture (FMT-40)", async () => {
    const created = await repository().createStructured(input({ elements: [{ kind: "EXERCISE", exercise: exercise("solo") }], stopPoints: [] }));
    expect(created).not.toHaveProperty("origin");
    expect(structureExercises(created.structure)[0]).not.toHaveProperty("format");
    expect(await database.getAllAsync("SELECT origin FROM sessions")).toEqual([{ origin: null }]);
    expect(await database.getAllAsync("SELECT format_key, format_settings FROM activities")).toEqual([{ format_key: null, format_settings: null }]);
  });

  it("déplacement : l'Exercice formaté entre dans un Circuit avec son Format et ses réglages ; rien n'est transmis aux membres ni à un Exercice libre entrant ; le Circuit porteur garde son Format ; l'origine n'est pas réécrite", async () => {
    const created = await repository().createStructured(input(formatted(), "FOR_TIME"));
    const outcome = await repository().updateStructured(created.id, {
      ...input({
        elements: [
          // Le Death by sort du Cycle et entre dans le Circuit groupé (admis, §6.1) ; l'Exercice libre « warmup » entre dans le Circuit alterné.
          { kind: "CIRCUIT", circuit: { id: "alt", repeatCount: 8, nature: "SERIES", exercises: [exercise("warmup", undefined, "mv-pompes"), exercise("e1", EMOM), exercise("t2", undefined, "mv-pompes")] } },
          { kind: "CIRCUIT", circuit: { id: "mixed", repeatCount: 3, nature: "TOURS", exercises: [exercise("f1", FOR_TIME), exercise("db", DEATH_BY), exercise("a1", AMRAP), exercise("f2")] } },
          { kind: "CIRCUIT", circuit: { id: "amrap", repeatCount: 2, nature: "TOURS", format: AMRAP_CIRCUIT, exercises: [exercise("am1", AMRAP_MEMBER)] } },
          { kind: "CIRCUIT", circuit: forTimeCarrier() },
          { kind: "EXERCISE", exercise: exercise("cooldown", undefined, "mv-pompes") },
        ],
        stopPoints: [],
      }),
      persistedActivityIds: persistedIds(created.structure),
    });
    expect(outcome.status).toBe("UPDATED");
    const reread = (await repository().findStructuredById(created.id))!;
    expect(formatsOf(reread.structure)).toEqual([
      { id: "warmup", format: null },
      { id: "e1", format: EMOM },
      { id: "t2", format: null },
      { id: "f1", format: FOR_TIME },
      { id: "db", format: DEATH_BY },
      { id: "a1", format: AMRAP },
      { id: "f2", format: null },
      { id: "am1", format: AMRAP_MEMBER },
      { id: "m1", format: FOR_TIME_MEMBER },
      { id: "m2", format: FOR_TIME_BUY_OUT },
      { id: "cooldown", format: null },
    ]);
    expect(await database.getAllAsync("SELECT id, format_key, format_settings FROM tours ORDER BY id")).toEqual(TOURS_ROWS);
    expect(reread.origin).toBe("FOR_TIME");
  });

  it("refuse sans écrire : Format inconnu, clé Tabata (préconfiguration), nature non admise pour le Circuit porteur, membre d'une autre clé, réglage d'un autre rôle, réglage hors borne, origine inconnue", async () => {
    const carrier = (format: ElementFormat, nature: "TOURS" | "SERIES", members: readonly StructureExerciseInput[]): StructureInput => ({
      elements: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 2, nature, format, exercises: [...members] } }],
      stopPoints: [],
    });
    const single = (format: ElementFormat): StructureInput => ({ elements: [{ kind: "EXERCISE", exercise: exercise("x", format) }], stopPoints: [] });
    const cases: readonly [string, StructuredSessionInput, string, string][] = [
      ["clé inconnue", input(single({ key: "HIIT" as never, settings: {} })), "UNRECOGNIZED", "element.format"],
      ["Tabata n'est plus un Format", input(single({ key: "TABATA" as never, settings: {} })), "UNRECOGNIZED", "element.format"],
      ["AMRAP porté par un Circuit alterné", input(carrier(AMRAP_CIRCUIT, "SERIES", [exercise("x", { key: "AMRAP", settings: {} })])), "FORBIDDEN_PLACEMENT", "element.format"],
      ["For time porté par un Circuit dans chaque tour", input(carrier(FOR_TIME_CIRCUIT, "TOURS", [exercise("x", FOR_TIME_MEMBER)])), "FORBIDDEN_PLACEMENT", "element.format"],
      ["membre EMOM dans un Circuit porteur AMRAP (aucun Format imbriqué, §6)", input(carrier(AMRAP_CIRCUIT, "TOURS", [exercise("x", EMOM)])), "FORBIDDEN_PLACEMENT", "element.format"],
      ["réglage du Circuit porté par un Exercice", input(single({ key: "EMOM", settings: { windowSeconds: 60 } })), "UNRECOGNIZED", "element.formatSettings"],
      ["réglage d'Exercice porté par le Circuit", input(carrier({ key: "AMRAP", settings: { durationSeconds: 720 } }, "TOURS", [exercise("x", AMRAP_MEMBER)])), "UNRECOGNIZED", "element.formatSettings"],
      ["réglage inconnu", input(single({ key: "EMOM", settings: { cadence: 60 } })), "UNRECOGNIZED", "element.formatSettings"],
      ["intervalle nul", input(single({ key: "EMOM", settings: { intervalSeconds: 0 } })), "OUT_OF_RANGE", "element.formatSettings"],
      ["incrément du Death by nul", input(single({ key: "DEATH_BY", settings: { intervalSeconds: 60, incrementPerRound: 0 } })), "OUT_OF_RANGE", "element.formatSettings"],
      ["Passage hors drapeau", input(carrier(FOR_TIME_CIRCUIT, "SERIES", [exercise("x", FOR_TIME_MEMBER), exercise("y", { key: "FOR_TIME", settings: { passageOnce: 2 } })])), "OUT_OF_RANGE", "element.formatSettings"],
      ["origine inconnue", input(single(EMOM), "HIIT" as never), "UNRECOGNIZED", "session.origin"],
    ];
    for (const [label, candidate, code, field] of cases) {
      await expect(repository().createStructured(candidate).then(() => label)).rejects.toMatchObject({
        violations: expect.arrayContaining([expect.objectContaining({ code, field })]),
      });
    }
    expect(await database.getAllAsync("SELECT id FROM sessions")).toEqual([]);
    expect(await database.getAllAsync("SELECT id FROM tours")).toEqual([]);
  });

  it("schéma : clé de Format hors liste, réglages sans Format ou Format sans réglages refusés, sur l'Exercice comme sur le Circuit (CHECK de la 017, inchangée)", async () => {
    const created = await repository().createStructured(input(formatted()));
    await expect(database.runAsync("UPDATE tours SET format_key = 'HIIT' WHERE id = 'ft'")).rejects.toThrow();
    await expect(database.runAsync("UPDATE tours SET format_settings = NULL WHERE id = 'ft'")).rejects.toThrow();
    await expect(database.runAsync("UPDATE tours SET format_key = NULL WHERE id = 'amrap'")).rejects.toThrow();
    await expect(database.runAsync("UPDATE activities SET format_key = 'HIIT' WHERE id = 'e1'")).rejects.toThrow();
    await expect(database.runAsync("UPDATE activities SET format_key = NULL WHERE id = 'e1'")).rejects.toThrow();
    await expect(database.runAsync("UPDATE activities SET format_settings = NULL WHERE id = 'db'")).rejects.toThrow();
    await expect(database.runAsync("UPDATE sessions SET origin = 'HIIT' WHERE id = ?", [created.id])).rejects.toThrow();
    // Rien n'a été modifié par les écritures refusées.
    expect(await database.getAllAsync("SELECT id, format_key, format_settings FROM tours ORDER BY id")).toEqual(TOURS_ROWS);
  });

  it("donnée antérieure au 02/11 : clés TABATA et INTERVALS_30_30 (Exercice ou Circuit) relues comme des éléments libres, sans erreur ; le réenregistrement les écrit libres", async () => {
    const created = await repository().createStructured(input(formatted()));
    // Écritures de l'ancien code : Tabata sur un Exercice libre et sur le Circuit standard, 30/30 sur un autre Exercice.
    await database.runAsync("UPDATE activities SET format_key = 'TABATA', format_settings = '{\"version\":1,\"values\":{}}' WHERE id = 'f2'");
    await database.runAsync("UPDATE activities SET format_key = 'INTERVALS_30_30', format_settings = '{\"version\":1,\"values\":{}}' WHERE id = 't2'");
    await database.runAsync("UPDATE tours SET format_key = 'TABATA', format_settings = '{\"version\":1,\"values\":{}}' WHERE id = 'mixed'");

    const reread = (await repository().findStructuredById(created.id))!;
    expect(reread.structure).toEqual(created.structure);
    const byId = new Map(structureExercises(reread.structure).map((item) => [item.id, item]));
    expect(byId.get("f2")).not.toHaveProperty("format");
    expect(byId.get("t2")).not.toHaveProperty("format");
    expect(structureCircuits(reread.structure).find((circuit) => circuit.id === "mixed")).not.toHaveProperty("format");
    // Les Formats actuels restent lus.
    expect(formatsOf(reread.structure)).toEqual(EXPECTED);
    expect(circuitFormatsOf(reread.structure)).toEqual(EXPECTED_CIRCUITS);

    // Réenregistrement de la structure relue (identique à `formatted()`, vérifié ci-dessus).
    expect(await repository().updateStructured(created.id, { ...input(formatted()), persistedActivityIds: persistedIds(reread.structure) })).toMatchObject({ status: "UPDATED" });
    expect(await database.getAllAsync("SELECT id, format_key FROM activities WHERE id IN ('f2', 't2') ORDER BY id")).toEqual([
      { id: "f2", format_key: null },
      { id: "t2", format_key: null },
    ]);
    expect(await database.getAllAsync("SELECT id, format_key, format_settings FROM tours ORDER BY id")).toEqual(TOURS_ROWS);
  });

  it("donnée illisible : réglages corrompus d'un Exercice ou d'un Circuit porteur → contrat rompu à la lecture, jamais un élément libre", async () => {
    const created = await repository().createStructured(input(formatted()));
    await database.runAsync("UPDATE activities SET format_settings = '{\"version\":9,\"values\":{}}' WHERE id = 'e1'");
    await expect(repository().findStructuredById(created.id)).rejects.toThrow();

    await database.runAsync("UPDATE activities SET format_settings = '{\"version\":1,\"values\":{\"intervalSeconds\":60}}' WHERE id = 'e1'");
    expect(formatsOf((await repository().findStructuredById(created.id))!.structure)).toEqual(EXPECTED);
    await database.runAsync("UPDATE tours SET format_settings = 'pas du JSON' WHERE id = 'ft'");
    await expect(repository().findStructuredById(created.id)).rejects.toThrow();
  });

  it("l'ancien modèle ne réécrit jamais une Séance dont un Exercice ou un Circuit porte un Format", async () => {
    const legacyUpdate = (id: string, activityId: string) =>
      repository().update(id, {
        sourceSessionId: id,
        name: "Ancien chemin",
        labelId: null,
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        tourRepeatCount: 1,
        activities: [{ id: activityId, type: "EXERCISE", structuralPosition: "IN_TOUR", position: 0, executionParameters: durationParameters(30), postActivityRecoverySeconds: 0, sourceMovementId: "mv-squat" }],
      });

    // Exercice formaté autonome dans un Circuit standard.
    const exerciseFormatted = await repository().createStructured(
      input({ elements: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 1, nature: "TOURS", exercises: [exercise("f1", FOR_TIME)] } }], stopPoints: [] }),
    );
    await expect(legacyUpdate(exerciseFormatted.id, "f1")).rejects.toBeInstanceOf(SessionStructureNotRepresentableError);
    expect((await repository().findStructuredById(exerciseFormatted.id))!.structure).toEqual(exerciseFormatted.structure);

    // Circuit porteur seul formaté (membre relu sans Format) : le Format du Circuit suffit à refuser.
    const carrierFormatted = await repository().createStructured(
      input({ elements: [{ kind: "CIRCUIT", circuit: { id: "p", repeatCount: 3, nature: "SERIES", format: FOR_TIME_CIRCUIT, exercises: [exercise("m1", FOR_TIME_MEMBER)] } }], stopPoints: [] }),
    );
    await database.runAsync("UPDATE activities SET format_key = NULL, format_settings = NULL WHERE id = 'm1'");
    const before = (await repository().findStructuredById(carrierFormatted.id))!;
    expect(structureExercises(before.structure)[0]).not.toHaveProperty("format");
    expect(structureCircuits(before.structure)[0]!.format).toEqual(FOR_TIME_CIRCUIT);
    await expect(legacyUpdate(carrierFormatted.id, "m1")).rejects.toBeInstanceOf(SessionStructureNotRepresentableError);
    expect((await repository().findStructuredById(carrierFormatted.id))!.structure).toEqual(before.structure);
  });
});

describe("PRE-9 C.1 — service : ouverture, enregistrement et duplication conservent les Formats (ARB-17)", () => {
  it("brouillon rouvert et réenregistré sans modification : Formats, Formats d'origine et origine inchangés ; duplication : Formats et réglages copiés avec chaque Exercice et chaque Circuit porteur, origine non recopiée", async () => {
    const created = await repository().createStructured(input(formatted(), "EMOM"));
    const opened = await service().getSessionForEdit(created.id);
    if (opened.status !== "OK") throw new Error(opened.status);
    const draft = toSessionDraft(opened.session);
    expect(draft.origin).toBe("EMOM");
    expect(draft.exercises.find((item) => item.id === "e1")?.format).toEqual(EMOM);
    expect(draft.exercises.find((item) => item.id === "m2")?.format).toEqual(FOR_TIME_BUY_OUT);

    expect((await service().updateSession(created.id, { ...draft, name: "Renommée" })).status).toBe("UPDATED");
    const saved = (await repository().findStructuredById(created.id))!;
    expect(saved.structure).toEqual(created.structure);
    expect(saved.origin).toBe("EMOM");

    let next = 0;
    const duplicated = await service().duplicateSession(created.id, () => `dup-${++next}`);
    if (duplicated.status !== "DUPLICATED") throw new Error(duplicated.status);
    const copy = duplicated.session;
    expect(formatsOf(copy.structure).map((item) => item.format)).toEqual(EXPECTED.map((item) => item.format));
    expect(circuitFormatsOf(copy.structure).map((item) => item.format)).toEqual(EXPECTED_CIRCUITS.map((item) => item.format));
    expect([...structureCircuits(copy.structure).map((circuit) => circuit.id), ...structureExercises(copy.structure).map((item) => item.id)].every((id) => id.startsWith("dup-"))).toBe(true);
    expect(copy).not.toHaveProperty("origin");
    // Deux Circuits porteurs dans l'original, deux dans la copie.
    expect(await database.getAllAsync("SELECT format_key, COUNT(*) AS count FROM tours WHERE format_key IS NOT NULL GROUP BY format_key ORDER BY format_key")).toEqual([
      { format_key: "AMRAP", count: 2 },
      { format_key: "FOR_TIME", count: 2 },
    ]);
    // L'original est intact.
    expect((await repository().findStructuredById(created.id))!.structure).toEqual(created.structure);
  });

  it("Séance de l'ancien modèle dont un membre du Circuit standard porte un Format : rouverte, réenregistrée et dupliquée avec ce Format ; le membre libre reste libre", async () => {
    const created = await repository().createStructured(
      input({
        elements: [
          { kind: "EXERCISE", exercise: exercise("before") },
          { kind: "CIRCUIT", circuit: { id: "c", repeatCount: 2, nature: "TOURS", exercises: [exercise("f1", FOR_TIME), exercise("t2")] } },
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
    expect(circuit!.exercises.map((item) => item.format ?? null)).toEqual([FOR_TIME, null]);
  });
});
