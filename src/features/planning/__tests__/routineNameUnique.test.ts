import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { EVERY_TIME, firstFreeRoutineName, routineNameKey, type RoutineDraft, type RoutineEntry } from "@/domain/planning/Routine";
import { canonicalSessionNameKey } from "@/domain/sessions/validation";
import { PlanningService } from "@/features/planning/PlanningService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteRoutineRepository } from "@/infrastructure/database/repositories/SqliteRoutineRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * D-563 nom (Hermann, 23/11/2026 ; DSF Journal § 6 bis) : le nom d'une routine est unique parmi les routines actives, sans
 * distinguer majuscules, minuscules, accents ni espaces de bord ; une routine terminée garde son nom et n'entre pas dans le
 * contrôle ; premier nom libre « Tabata (2) », « Tabata (3) » ; la réactivation vérifie le nom. Une suite verte ne remplace pas la
 * recette sur iPhone.
 */

let entryIds = 0;
const entry = (sessionId: string): RoutineEntry => ({ id: `e-${sessionId}-${++entryIds}`, sessionId, frequency: EVERY_TIME });

describe("firstFreeRoutineName / routineNameKey (D-563 nom)", () => {
  it("clé sans casse, accents ni espaces de bord, identique à celle des Séances (RM-261) ; suffixes (2), (3)", () => {
    expect(routineNameKey("  Équilibre ")).toBe(routineNameKey("equilibre"));
    expect(routineNameKey("Mobilité")).toBe(canonicalSessionNameKey("Mobilité"));
    expect(firstFreeRoutineName("Tabata", [])).toBe("Tabata");
    expect(firstFreeRoutineName(" Tabata ", ["tabata"])).toBe("Tabata (2)");
    expect(firstFreeRoutineName("Tabata", ["TABATA", "tabata (2)"])).toBe("Tabata (3)");
    // Un rang libéré est repris.
    expect(firstFreeRoutineName("Tabata", ["Tabata", "Tabata (3)"])).toBe("Tabata (2)");
  });
});

describe("PlanningService — D-563 nom", () => {
  let database: NodeSqliteDatabase;
  let planning: PlanningService;
  let repository: SqliteRoutineRepository;
  let ids: number;

  // Maintenant : 1er janvier 2030. « Actif » : créneau à venir ; « terminé » : dernier créneau passé depuis plus de 10 jours.
  const active = (patch: Partial<RoutineDraft> = {}): RoutineDraft => ({
    name: "Tabata",
    startDate: "2030-08-05",
    time: "08:00",
    repetition: null,
    entries: [entry("s-a")],
    ...patch,
  });
  const finished = (patch: Partial<RoutineDraft> = {}): RoutineDraft =>
    active({ startDate: "2029-11-05", repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2029-11-12" } }, ...patch });
  const created = async (draft: RoutineDraft) => {
    const result = await planning.createRoutine(draft);
    if (result.status !== "SAVED") throw new Error(result.status);
    return result.routine;
  };

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    ids = 0;
    repository = new SqliteRoutineRepository(database);
    planning = new PlanningService({ repository, newId: () => `r${++ids}`, now: () => new Date(2030, 0, 1) });
  });

  afterEach(() => {
    database.close();
  });

  it("unicité normalisée parmi les actives : refus, rien n'enregistré, premier nom libre (2) puis (3)", async () => {
    await created(active({ name: "Tabata" }));
    expect(await planning.createRoutine(active({ name: "  TABATA ", entries: [entry("s-a")] }))).toEqual({ status: "NAME_TAKEN", proposal: "TABATA (2)" });
    expect(await planning.createRoutine(active({ name: "tâbata", entries: [entry("s-a")] }))).toMatchObject({ status: "NAME_TAKEN" });
    expect(await planning.listRoutines()).toHaveLength(1);
    expect(await planning.routineNameProposal(active({ name: "Tabata" }))).toBe("Tabata (2)");
    await created(active({ name: "Tabata (2)", entries: [entry("s-a")] }));
    expect(await planning.routineNameProposal(active({ name: "tabata" }))).toBe("tabata (3)");
    expect(await planning.activeRoutineNames()).toEqual(["Tabata", "Tabata (2)"]);
    // Nom libre : enregistré.
    expect((await planning.createRoutine(active({ name: "Tabata (3)", entries: [entry("s-a")] }))).status).toBe("SAVED");
  });

  it("une routine terminée garde son nom et n'entre pas dans le contrôle", async () => {
    const old = await created(finished({ name: "Tabata" }));
    expect((await planning.routineActivity()).get(old.id)).toBe(false);
    // Une routine active peut reprendre le nom d'une terminée.
    const current = await created(active({ name: "Tabata", entries: [entry("s-a")] }));
    expect(current.name).toBe("Tabata");
    expect(await planning.activeRoutineNames()).toEqual(["Tabata"]);
    // Modifier la terminée sans la réactiver (heure) : nom conservé, aucun contrôle.
    expect((await planning.updateRoutine(old.id, finished({ name: "Tabata", time: "09:00", entries: old.entries }))).status).toBe("SAVED");
    expect((await planning.getRoutine(old.id))?.name).toBe("Tabata");
    // Une routine terminée peut aussi être créée sous un nom pris.
    expect((await planning.createRoutine(finished({ name: "Tabata", entries: [entry("s-a")] }))).status).toBe("SAVED");
  });

  it("réactivation (période étendue) : nom pris par une active → refus et premier nom libre ; rien n'est enregistré tant que le nom n'est pas libre", async () => {
    const old = await created(finished({ name: "Tabata" }));
    await created(active({ name: "Tabata", entries: [entry("s-a")] }));
    const extended = finished({ name: "Tabata", entries: old.entries, repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2030-03-25" } } });
    expect(await planning.routineNameProposal(extended, old.id)).toBe("Tabata (2)");
    expect(await planning.updateRoutine(old.id, extended)).toEqual({ status: "NAME_TAKEN", proposal: "Tabata (2)" });
    expect(await planning.getRoutine(old.id)).toMatchObject({ name: "Tabata", repetition: old.repetition });
    expect((await planning.updateRoutine(old.id, { ...extended, name: "Tabata (2)" })).status).toBe("SAVED");
    expect(await planning.getRoutine(old.id)).toMatchObject({ name: "Tabata (2)", repetition: extended.repetition });
    expect((await planning.routineActivity()).get(old.id)).toBe(true);
  });

  it("modification d'une active : son propre nom ne la bloque pas ; un nom pris est refusé", async () => {
    const first = await created(active({ name: "Matin" }));
    await created(active({ name: "Soir", entries: [entry("s-a")] }));
    expect((await planning.updateRoutine(first.id, active({ name: " matin ", time: "07:00", entries: first.entries }))).status).toBe("SAVED");
    expect(await planning.updateRoutine(first.id, active({ name: "SOIR", entries: first.entries }))).toEqual({ status: "NAME_TAKEN", proposal: "SOIR (2)" });
    expect((await planning.getRoutine(first.id))?.name).toBe("matin");
  });

  it("homonymes actifs déjà en base : jamais renommés d'office ; le contrôle joue à leur prochaine modification", async () => {
    const one = await created(active({ name: "Tabata" }));
    // Écriture directe (données d'avant D-563).
    await repository.save({ ...one, id: "legacy", entries: [entry("s-a")] });
    expect((await planning.listRoutines()).map((routine) => routine.name)).toEqual(["Tabata", "Tabata"]);
    expect(await planning.updateRoutine("legacy", active({ name: "Tabata", time: "09:00", entries: [entry("s-a")] }))).toEqual({ status: "NAME_TAKEN", proposal: "Tabata (2)" });
    expect((await planning.getRoutine("legacy"))?.time).toBe("08:00");
  });

  it("nom vide : « Nom obligatoire » (inchangé), avant tout contrôle d'unicité", async () => {
    await created(active({ name: "Tabata" }));
    expect(await planning.createRoutine(active({ name: "  " }))).toEqual({ status: "INVALID", issues: ["NAME_REQUIRED"] });
    expect(await planning.routineNameProposal(active({ name: "" }))).toBeNull();
  });
});
