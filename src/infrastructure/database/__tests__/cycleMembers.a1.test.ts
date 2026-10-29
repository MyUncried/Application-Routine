import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft, createExerciseDraft, toSessionDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { structureExercises, type StructureCycleMember } from "@/domain/sessions/structure";
import type { StructureExerciseInput, StructureInput, StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-9 (story A.1, D-449 / D-451, `migration016`) — structure générale complète sur SQLite réelle
 * (`node:sqlite`) : Exercices directs de Cycle, plusieurs Cycles et Circuits, ordre et identités
 * conservés ; service sur le chemin structuré (création, ouverture, modification, consultation,
 * duplication) sans projection dans l'ancien modèle ; Point d'arrêt dans un Cycle persisté et relu.
 * L'écran de Composition n'est pas concerné (comportement inchangé, tests d'intégration existants).
 */

const NOW = "2026-10-29T09:00:00.000Z";
const LATER = "2026-10-29T10:00:00.000Z";

let database: NodeSqliteDatabase;
let clock = NOW;
let sequence = 0;
const repository = () => new SqliteSessionRepository(database, () => `gen-${++sequence}`, () => clock);
const service = () => new SessionService(repository(), undefined, () => `container-${++sequence}`);

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  clock = NOW;
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

const exercise = (id: string, movementId = "mv-squat", seconds = 30): StructureExerciseInput => ({
  id,
  type: "EXERCISE",
  executionParameters: durationParameters(seconds),
  postActivityRecoverySeconds: 0,
  sourceMovementId: movementId,
});

const circuit = (id: string, exercises: readonly StructureExerciseInput[], repeatCount = 1) => ({
  id,
  repeatCount,
  nature: "TOURS" as const,
  exercises,
});

const direct = (item: StructureExerciseInput): StructureCycleMember<StructureExerciseInput> => ({ kind: "EXERCISE", exercise: item });
const nested = (item: ReturnType<typeof circuit>): StructureCycleMember<StructureExerciseInput> => ({ kind: "CIRCUIT", circuit: item });

/**
 * Échauffement, Cycle A × 3 (Exercice direct, Circuit 1, Exercice direct), Circuit 2 au niveau
 * principal, Cycle B × 2 (Circuit 3 seul), retour au calme : D-451, plusieurs Cycles et Circuits.
 */
const d451 = (): StructureInput => ({
  elements: [
    { kind: "EXERCISE", exercise: exercise("warmup", "mv-pompes") },
    {
      kind: "CYCLE",
      cycle: { id: "cycle-a", repeatCount: 3, members: [direct(exercise("a-in")), nested(circuit("c1", [exercise("e1"), exercise("e2", "mv-pompes")], 2)), direct(exercise("a-out", "mv-pompes", 45))] },
    },
    { kind: "CIRCUIT", circuit: circuit("c2", [exercise("e3")]) },
    { kind: "CYCLE", cycle: { id: "cycle-b", repeatCount: 2, members: [nested(circuit("c3", [exercise("e4")]))] } },
    { kind: "EXERCISE", exercise: exercise("cooldown", "mv-pompes", 60) },
  ],
  stopPoints: [],
});

const input = (structure: StructureInput): StructuredSessionInput => ({
  name: "Séance D-451",
  labelId: null,
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  structure,
});

type Shape = string | { readonly circuit: string; readonly repeat: number; readonly exercises: readonly string[] } | { readonly cycle: string; readonly repeat: number; readonly members: readonly Shape[] };

const shapeOf = (structure: StructureInput | NonNullable<Awaited<ReturnType<SqliteSessionRepository["findStructuredById"]>>>["structure"]): Shape[] =>
  structure.elements.map((element): Shape => {
    switch (element.kind) {
      case "EXERCISE":
        return element.exercise.id;
      case "CIRCUIT":
        return { circuit: element.circuit.id, repeat: element.circuit.repeatCount, exercises: element.circuit.exercises.map((item) => item.id) };
      case "CYCLE":
        return {
          cycle: element.cycle.id,
          repeat: element.cycle.repeatCount,
          members: element.cycle.members.map((member) =>
            member.kind === "CIRCUIT"
              ? { circuit: member.circuit.id, repeat: member.circuit.repeatCount, exercises: member.circuit.exercises.map((item) => item.id) }
              : member.exercise.id,
          ),
        };
    }
  });

const EXPECTED_SHAPE: Shape[] = [
  "warmup",
  { cycle: "cycle-a", repeat: 3, members: ["a-in", { circuit: "c1", repeat: 2, exercises: ["e1", "e2"] }, "a-out"] },
  { circuit: "c2", repeat: 1, exercises: ["e3"] },
  { cycle: "cycle-b", repeat: 2, members: [{ circuit: "c3", repeat: 1, exercises: ["e4"] }] },
  "cooldown",
];

describe("PRE-9 A.1 — Exercices directs de Cycle en base (migration 016)", () => {
  it("crée et relit une structure D-451 : ordre, rangs partagés dans le Cycle, parents exclusifs", async () => {
    const created = await repository().createStructured(input(d451()));
    expect(shapeOf(created.structure)).toEqual(EXPECTED_SHAPE);
    const reread = (await repository().findStructuredById(created.id))!;
    expect(reread.structure).toEqual(created.structure);

    expect(
      await database.getAllAsync("SELECT id, tour_id, cycle_id, position FROM activities WHERE cycle_id IS NOT NULL ORDER BY position"),
    ).toEqual([
      { id: "a-in", tour_id: null, cycle_id: "cycle-a", position: 0 },
      { id: "a-out", tour_id: null, cycle_id: "cycle-a", position: 2 },
    ]);
    expect(await database.getAllAsync("SELECT id, cycle_id, position FROM tours WHERE id = 'c1'")).toEqual([
      { id: "c1", cycle_id: "cycle-a", position: 1 },
    ]);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  });

  it("compte et durée D-451 : un Exercice direct compte une fois et dure une fois par répétition du Cycle (RM-252)", async () => {
    const created = await repository().createStructured(input(d451()));
    const [summary] = await repository().listActive();
    expect(summary!.activityCount).toBe(8);
    // warmup 30 + Cycle A × 3 (a-in 30 + c1 × 2 (30 + 30) + a-out 45) + c2 30 + Cycle B × 2 (30) + cooldown 60.
    expect(summary!.estimatedDurationSeconds).toBe(30 + 3 * (30 + 2 * 60 + 45) + 30 + 2 * 30 + 60);
    expect(structureExercises(created.structure)).toHaveLength(8);
  });

  it("fusion par identité : un Exercice passe du niveau principal au Cycle, puis d'un Cycle dans un Circuit, sans changer d'identité", async () => {
    const created = await repository().createStructured(input(d451()));
    clock = LATER;
    const outcome = await repository().updateStructured(created.id, {
      ...input({
        elements: [
          {
            kind: "CYCLE",
            cycle: { id: "cycle-a", repeatCount: 4, members: [direct(exercise("warmup", "mv-pompes")), nested(circuit("c1", [exercise("a-in"), exercise("e1"), exercise("e2", "mv-pompes")], 2))] },
          },
          { kind: "EXERCISE", exercise: exercise("a-out", "mv-pompes", 45) },
        ],
        stopPoints: [],
      }),
      persistedActivityIds: structureExercises(created.structure).map((item) => item.id),
    });
    expect(outcome.status).toBe("UPDATED");
    const reread = (await repository().findStructuredById(created.id))!;
    expect(shapeOf(reread.structure)).toEqual([
      { cycle: "cycle-a", repeat: 4, members: ["warmup", { circuit: "c1", repeat: 2, exercises: ["a-in", "e1", "e2"] }] },
      "a-out",
    ]);
    expect(
      await database.getAllAsync("SELECT id, created_at, tour_id, cycle_id FROM activities WHERE id IN ('warmup', 'a-in', 'a-out') ORDER BY id"),
    ).toEqual([
      { id: "a-in", created_at: NOW, tour_id: "c1", cycle_id: null },
      { id: "a-out", created_at: NOW, tour_id: null, cycle_id: null },
      { id: "warmup", created_at: NOW, tour_id: null, cycle_id: "cycle-a" },
    ]);
    // Conteneurs retirés (c2, c3, cycle-b) et Exercices retirés supprimés ; aucun orphelin.
    expect(await database.getAllAsync("SELECT id FROM tours ORDER BY id")).toEqual([{ id: "c1" }]);
    expect(await database.getAllAsync("SELECT id FROM cycles")).toEqual([{ id: "cycle-a" }]);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  });

  it("refuse un Cycle vide ou un compte de Cycle hors 1..99 (D-451), sans écrire", async () => {
    const empty = { elements: [{ kind: "CYCLE" as const, cycle: { id: "x", repeatCount: 2, members: [] } }], stopPoints: [] };
    await expect(repository().createStructured(input(empty))).rejects.toThrow();
    const tooMany = { elements: [{ kind: "CYCLE" as const, cycle: { id: "x", repeatCount: 100, members: [direct(exercise("y"))] } }], stopPoints: [] };
    await expect(repository().createStructured(input(tooMany))).rejects.toThrow();
    expect(await database.getAllAsync("SELECT id FROM sessions")).toEqual([]);
  });

  it("schéma : un Exercice ou un Point n'a jamais deux parents ; rang unique par Cycle ; Point d'un Cycle relu à son emplacement", async () => {
    const created = await repository().createStructured(input(d451()));
    // Au plus un parent (CHECK de la 016).
    await expect(database.runAsync("UPDATE activities SET cycle_id = 'cycle-a' WHERE id = 'e1'")).rejects.toThrow();
    // Rang unique parmi les Exercices directs d'un Cycle (index partiel).
    await expect(database.runAsync("UPDATE activities SET position = 0 WHERE id = 'a-out'")).rejects.toThrow();
    // Point d'arrêt dans un Cycle (ARB-06) : écrit tel que B.6 l'écrira, relu à son emplacement.
    await database.runAsync(
      "INSERT INTO session_stop_points (id, session_id, tour_id, cycle_id, position) VALUES ('stop-cycle', ?, NULL, 'cycle-a', 1)",
      [created.id],
    );
    await expect(
      database.runAsync("INSERT INTO session_stop_points (id, session_id, tour_id, cycle_id, position) VALUES ('stop-two', ?, 'c1', 'cycle-a', 0)", [
        created.id,
      ]),
    ).rejects.toThrow();
    await expect(
      database.runAsync("INSERT INTO session_stop_points (id, session_id, tour_id, cycle_id, position) VALUES ('stop-dup', ?, NULL, 'cycle-a', 1)", [
        created.id,
      ]),
    ).rejects.toThrow();
    const reread = (await repository().findStructuredById(created.id))!;
    expect(reread.structure.stopPoints).toEqual([{ id: "stop-cycle", circuitId: null, cycleId: "cycle-a", position: 1 }]);
    // Suppression d'un Cycle : ses Exercices directs et ses Points suivent (CASCADE), les autres restent.
    await database.runAsync("DELETE FROM cycles WHERE id = 'cycle-b'");
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM session_stop_points")).toEqual([{ count: 1 }]);
  });
});

describe("PRE-9 A.1 — service sur le chemin structuré (aucune projection dans l'ancien modèle)", () => {
  it("ouvre, consulte, modifie et duplique une Séance à Cycles sans perte ni erreur", async () => {
    const created = await repository().createStructured(input(d451()));

    const opened = await service().getSessionForEdit(created.id);
    expect(opened.status).toBe("OK");
    if (opened.status !== "OK") return;
    expect(opened.session.structure).toEqual(created.structure);

    // Brouillon : la disposition générale fait foi ; enregistrer sans modification ne perd rien.
    const draft = toSessionDraft(opened.session);
    expect(draft.structure?.elements).toHaveLength(5);
    const saved = await service().updateSession(created.id, { ...draft, name: "Séance renommée" });
    expect(saved.status).toBe("UPDATED");
    const afterSave = (await repository().findStructuredById(created.id))!;
    expect(afterSave.name).toBe("Séance renommée");
    expect(afterSave.structure).toEqual(created.structure);

    // Paramètres d'un Exercice direct de Cycle modifiés dans le brouillon : écrits à sa place.
    const edited: SessionDraft = {
      ...draft,
      name: "Séance renommée",
      exercises: draft.exercises.map((item) => (item.id === "a-out" ? { ...item, executionParameters: durationParameters(50) } : item)),
    };
    expect((await service().updateSession(created.id, edited)).status).toBe("UPDATED");
    const afterEdit = (await repository().findStructuredById(created.id))!;
    expect(shapeOf(afterEdit.structure)).toEqual(EXPECTED_SHAPE);
    const aOut = structureExercises(afterEdit.structure).find((item) => item.id === "a-out")!;
    expect(aOut.executionParameters).toEqual(durationParameters(50));

    // Consultation (lecture seule) : structure entière.
    expect((await service().getSessionForConsultation(created.id))?.structure).toEqual(afterEdit.structure);

    // Duplication : même forme, identités nouvelles, Mouvements conservés.
    let next = 0;
    const duplicated = await service().duplicateSession(created.id, () => `dup-${++next}`);
    expect(duplicated.status).toBe("DUPLICATED");
    if (duplicated.status !== "DUPLICATED") return;
    expect(duplicated.session.name).toBe("Séance renommée (copie)");
    const copy = duplicated.session.structure;
    expect(copy.elements.map((element) => element.kind)).toEqual(["EXERCISE", "CYCLE", "CIRCUIT", "CYCLE", "EXERCISE"]);
    const copied = structureExercises(copy);
    expect(copied.map((item) => item.sourceMovementId)).toEqual(structureExercises(afterEdit.structure).map((item) => item.sourceMovementId));
    expect(copied.every((item) => item.id.startsWith("dup-"))).toBe(true);
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM cycles")).toEqual([{ count: 4 }]);
    // L'original est intact.
    expect((await repository().findStructuredById(created.id))!.structure).toEqual(afterEdit.structure);
  });

  it("Séance de l'ancien modèle : créée et rouverte par le service à l'identique, Circuit et Points conservés", async () => {
    const draft = withLocalMovements({
      ...createEmptyDraft(),
      name: "Ancien modèle",
      tourRepeatCount: 3,
      circuitNature: "SERIES",
      exercises: [
        { ...createExerciseDraft("before"), name: "Avant" },
        { ...createExerciseDraft("inside"), name: "Dedans", structuralPosition: "IN_TOUR" },
        { ...createExerciseDraft("inside-2"), name: "Dedans 2", structuralPosition: "IN_TOUR" },
        { ...createExerciseDraft("after"), name: "Après", structuralPosition: "AFTER_TOUR" },
      ],
      stopPoints: [{ id: "p1", scope: "IN_TOUR", position: 1 }],
    });
    const created = await service().createSession(draft);
    if (!created.ok) throw new Error(JSON.stringify(created.violations));
    const circuitId = (created.value.structure.elements[1] as { circuit: { id: string } }).circuit.id;
    expect(shapeOf(created.value.structure)).toEqual(["before", { circuit: circuitId, repeat: 3, exercises: ["inside", "inside-2"] }, "after"]);

    const opened = await service().getSessionForEdit(created.value.id);
    if (opened.status !== "OK") throw new Error(opened.status);
    const reopened = toSessionDraft(opened.session);
    expect(reopened.exercises.map((item) => [item.id, item.structuralPosition])).toEqual([
      ["before", "BEFORE_TOUR"],
      ["inside", "IN_TOUR"],
      ["inside-2", "IN_TOUR"],
      ["after", "AFTER_TOUR"],
    ]);
    expect(reopened.circuitNature).toBe("SERIES");
    expect(reopened.stopPoints?.map((point) => [point.scope, point.position])).toEqual([["IN_TOUR", 1]]);

    // Réenregistrée : le Circuit garde son identité, aucun conteneur créé.
    expect((await service().updateSession(created.value.id, { ...reopened, tourRepeatCount: 4 })).status).toBe("UPDATED");
    expect(await database.getAllAsync("SELECT id, repeat_count, nature FROM tours")).toEqual([{ id: circuitId, repeat_count: 4, nature: "SERIES" }]);
  });
});
