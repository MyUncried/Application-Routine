import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { EVERY_TIME, generatedRoutineName, routineDisplayName, type Routine, type RoutineDraft, type RoutineEntry } from "@/domain/planning/Routine";
import type { AgendaExecution, OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";
import { routineOccurrences, withExpiry } from "@/domain/planning/occurrences";
import { buildAgendaGroups } from "@/features/planning/agendaCards";
import { PlanningService } from "@/features/planning/PlanningService";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteRoutineRepository } from "@/infrastructure/database/repositories/SqliteRoutineRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * AGENDA-SEANCES-01 (D-553, 21/11/2026 ; spécification « Agenda centré sur les Séances, Journal et filtre », § 2 à § 5,
 * arbitrages 1 à 9) — règles sans écran : nom de Routine, rattachement des Exécutions lancées hors Agenda, suppression d'une
 * Séance de parcours, ordre du filtre, cartes de l'Agenda. Une suite verte ne remplace pas la recette sur iPhone.
 */

const entry = (sessionId: string, id = `e-${sessionId}`): RoutineEntry => ({ id, sessionId, frequency: EVERY_TIME });
const at = (day: number, hours: number, minutes = 0) => new Date(2030, 7, day, hours, minutes);

describe("nom de Routine (D-553, § 2)", () => {
  it("nom généré : Séance seule, ou noms dans l'ordre reliés par « + » ; nom personnalisé tel quel", () => {
    expect(generatedRoutineName(["Gainage"])).toBe("Gainage");
    expect(generatedRoutineName(["Échauffement", "Étirement du quadriceps"])).toBe("Échauffement + Étirement du quadriceps");
    expect(generatedRoutineName(["A", undefined, "C"])).toBe("A + C");
    const names = new Map([
      ["s-a", "Alpha"],
      ["s-b", "Bravo"],
    ]);
    const nameOf = (id: string) => names.get(id);
    const routine = { name: "Alpha", nameGenerated: true, entries: [entry("s-a"), entry("s-b")] };
    // Le nom généré suit la composition actuelle ; le nom personnalisé ne change pas.
    expect(routineDisplayName(routine, nameOf)).toBe("Alpha + Bravo");
    expect(routineDisplayName({ ...routine, nameGenerated: undefined }, nameOf)).toBe("Alpha");
    names.set("s-a", "Alpha renommée");
    expect(routineDisplayName(routine, nameOf)).toBe("Alpha renommée + Bravo");
  });
});

describe("PlanningService — D-553", () => {
  let database: NodeSqliteDatabase;
  let planning: PlanningService;
  let linked: OccurrenceExecution[];
  let ids: number;
  let now: Date;

  const draft = (patch: Partial<RoutineDraft> = {}): RoutineDraft => ({
    name: "Matin",
    startDate: "2030-08-05",
    time: "08:00",
    repetition: null,
    entries: [entry("s-a")],
    ...patch,
  });
  let entryIds = 0;
  // Identifiants d'entrée uniques dans la base (une entrée appartient à une seule routine).
  const create = async (patch: Partial<RoutineDraft> = {}) => {
    const base = draft(patch);
    const result = await planning.createRoutine({ ...base, entries: base.entries.map((item) => ({ ...item, id: `${item.id}-${++entryIds}` })) });
    if (result.status !== "SAVED") throw new Error(result.status);
    return result.routine;
  };

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    linked = [];
    ids = 0;
    now = at(5, 7, 30);
    planning = new PlanningService({
      repository: new SqliteRoutineRepository(database),
      newId: () => `r${++ids}`,
      now: () => now,
      occurrenceExecutions: () => Promise.resolve(linked),
    });
  });

  afterEach(() => {
    database.close();
  });

  // D-563 nom (Hermann, 23/11/2026) : nom unique parmi les routines actives (détail : `routineNameUnique.test.ts`).
  // [D-553 : noms identiques autorisés — remplacé pour les routines actives.]
  it("nom pris par une routine active refusé ; nom vide bloquant ; renommage : nom personnalisé fixe, nom généré enregistré comme tel", async () => {
    const first = await create({ name: "Mobilité" });
    expect(await planning.createRoutine(draft({ name: "Mobilité", entries: [entry("s-a", "e-other")] }))).toEqual({ status: "NAME_TAKEN", proposal: "Mobilité (2)" });
    expect(await planning.createRoutine(draft({ name: "   " }))).toEqual({ status: "INVALID", issues: ["NAME_REQUIRED"] });
    const generated = await create({ name: "Alpha", nameGenerated: true });
    expect((await planning.getRoutine(generated.id))?.nameGenerated).toBe(true);
    // Renommage : le nom devient personnalisé.
    expect((await planning.updateRoutine(generated.id, draft({ name: "Genou" }))).status).toBe("SAVED");
    const renamed = await planning.getRoutine(generated.id);
    expect(renamed?.name).toBe("Genou");
    expect(renamed?.nameGenerated).toBeUndefined();
    // Copie : création, nom généré.
    expect(await planning.prepareDuplicate(first.id)).toMatchObject({ name: "", nameGenerated: true });
  });

  it("modifier les Séances d'un seul créneau ne change pas le nom de la Routine (arbitrage 4)", async () => {
    const routine = await create({ name: "A + B", nameGenerated: true, entries: [entry("s-a"), entry("s-b")] });
    const result = await planning.updateOccurrence(routine.id, "2030-08-05T08:00", {
      date: "2030-08-05",
      time: "08:00",
      sessions: [
        { sessionId: "s-a", entryId: "e-s-a", origin: "ROUTINE", active: true },
        { sessionId: "s-b", entryId: "e-s-b", origin: "ROUTINE", active: false },
      ],
      reminderMinutes: null,
    });
    expect(result.status).toBe("SAVED");
    expect(await planning.getRoutine(routine.id)).toMatchObject({ name: "A + B", nameGenerated: true });
  });

  it("rattachement : créneau autonome du jour, non commencé et non expiré ; le plus proche, puis le plus ancien (§ 4)", async () => {
    // D-563 nom : deux routines actives, deux noms.
    const early = await create({ name: "Tôt", time: "07:00" });
    const late = await create({ name: "Tard", time: "08:00" });
    // 7h30 : à égale distance de 7h00 et 8h00 → le plus ancien (7h00).
    expect(await planning.autoAttachment("s-a", at(5, 7, 30))).toEqual({ routineId: early.id, occurrenceKey: "2030-08-05T07:00", rank: 1 });
    // 7h50 : 8h00 est le plus proche.
    expect(await planning.autoAttachment("s-a", at(5, 7, 50))).toEqual({ routineId: late.id, occurrenceKey: "2030-08-05T08:00", rank: 1 });
    // Créneau commencé : plus éligible.
    linked = [{ executionId: "x", routineId: late.id, occurrenceKey: "2030-08-05T08:00", rank: 1, startedAt: "t", businessStatus: "COMPLETED" }];
    expect(await planning.autoAttachment("s-a", at(5, 7, 50))).toEqual({ routineId: early.id, occurrenceKey: "2030-08-05T07:00", rank: 1 });
    // Autre jour, autre Séance : hors planification.
    expect(await planning.autoAttachment("s-a", at(6, 8, 0))).toBeNull();
    expect(await planning.autoAttachment("s-z", at(5, 7, 50))).toBeNull();
  });

  it("rattachement : créneau expiré exclu ; Séance de parcours hors planification ; créneau autonome prioritaire sur le parcours (§ 4, arbitrage 1)", async () => {
    // Créneau du lundi 5 à 1h, routine quotidienne : le créneau suivant (mardi 1h) n'est pas encore passé → le lundi 5 reste
    // rattrapable ; un créneau d'une routine dont le suivant est passé (dimanche 4 à 6h, lundi 5 à 6h) est expiré.
    await create({ name: "Expiré", startDate: "2030-08-04", time: "06:00", repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "UNTIL", date: "2030-08-05" } } });
    expect(await planning.autoAttachment("s-a", at(5, 7, 30))).toEqual({ routineId: "r1", occurrenceKey: "2030-08-05T06:00", rank: 1 });
    now = at(5, 7, 30);
    const parcours = await create({ name: "Parcours", time: "07:30", entries: [entry("s-b"), entry("s-c")] });
    expect(await planning.autoAttachment("s-b", at(5, 7, 30))).toBeNull();
    const single = await create({ name: "Seule", time: "18:00", entries: [entry("s-b", "e-single")] });
    expect(await planning.autoAttachment("s-b", at(5, 7, 30))).toEqual({ routineId: single.id, occurrenceKey: "2030-08-05T18:00", rank: 1 });
    expect((await planning.getRoutine(parcours.id))?.overrides).toBeUndefined();
  });

  it("rattachement : un créneau expiré ne reçoit jamais d'Exécution", async () => {
    // Routine quotidienne du 5 au 6 à 20h ; le créneau du 6 est déplacé au 5 à 7h : celui-ci expire au début du créneau suivant
    // (le 5 à 20h). Le créneau du 5 à 20h est commencé. À 21h, plus aucun créneau éligible ce jour-là.
    const routine = await create({ time: "20:00", repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "UNTIL", date: "2030-08-06" } } });
    const moved = await planning.updateOccurrence(routine.id, "2030-08-06T20:00", {
      date: "2030-08-05",
      time: "07:00",
      sessions: [{ sessionId: "s-a", entryId: "e-s-a", origin: "ROUTINE", active: true }],
      reminderMinutes: null,
    });
    expect(moved.status).toBe("SAVED");
    linked = [{ executionId: "x", routineId: routine.id, occurrenceKey: "2030-08-05T20:00", rank: 1, startedAt: "t", businessStatus: "COMPLETED" }];
    expect(await planning.autoAttachment("s-a", at(5, 19, 0))).toEqual({ routineId: routine.id, occurrenceKey: "2030-08-06T20:00", rank: 1 });
    expect(await planning.autoAttachment("s-a", at(5, 21, 0))).toBeNull();
  });

  it("suppression d'une Séance de parcours : elle seule ; Séance exécutée refusée ; la dernière supprime le créneau (arbitrage 9)", async () => {
    const routine = await create({ entries: [entry("s-a"), entry("s-b"), entry("s-c")] });
    const key = "2030-08-05T08:00";
    linked = [{ executionId: "x", routineId: routine.id, occurrenceKey: key, rank: 1, sessionId: "s-a", startedAt: "t", businessStatus: "COMPLETED" }];
    // Séance exécutée : refusée.
    expect(await planning.removeOccurrenceSession(routine.id, key, 0)).toBe("EXECUTED");
    // Séance non exécutée d'un parcours commencé : supprimée seule ; le créneau reste commencé et figé.
    expect(await planning.removeOccurrenceSession(routine.id, key, 1)).toBe("REMOVED");
    const [occurrence] = await planning.rangeOccurrences("2030-08-05", "2030-08-05", () => true);
    expect(occurrence?.contents.map((content) => content.sessionId)).toEqual(["s-a", "s-c"]);
    expect(occurrence?.started).toBe(true);
    // L'exécution déjà liée reste rattachée à sa Séance malgré le décalage des rangs.
    expect(await planning.removeOccurrenceSession(routine.id, key, 0)).toBe("EXECUTED");
    expect(await planning.removeOccurrenceSession(routine.id, key, 2)).toBe("REMOVED");
    // Dernière Séance non exécutée d'un créneau non commencé : le créneau est supprimé.
    const other = await create({ startDate: "2030-08-06", entries: [entry("s-a"), entry("s-b")] });
    expect(await planning.removeOccurrenceSession(other.id, "2030-08-06T08:00", 0)).toBe("REMOVED");
    expect(await planning.removeOccurrenceSession(other.id, "2030-08-06T08:00", 1)).toBe("SLOT_REMOVED");
    expect((await planning.getRoutine(other.id))?.exclusions).toEqual(["2030-08-06T08:00"]);
  });

  it("historique après suppression de la routine : le créneau commencé reste, les autres sont retirés (D-540)", async () => {
    const routine = await create({ entries: [entry("s-a"), entry("s-b")], repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "UNTIL", date: "2030-08-07" } } });
    linked = [{ executionId: "x", routineId: routine.id, occurrenceKey: "2030-08-05T08:00", rank: 1, sessionId: "s-a", startedAt: "t", businessStatus: "COMPLETED" }];
    expect(await planning.deleteRoutine(routine.id)).toBe(true);
    const left = await planning.rangeOccurrences("2030-08-01", "2030-08-31", () => true);
    expect(left.map((occurrence) => occurrence.key)).toEqual(["2030-08-05T08:00"]);
  });

  it("filtre : routines actives d'abord, puis terminées, par ordre alphabétique (arbitrage 3)", async () => {
    now = at(20, 12, 0);
    await create({ name: "Zeta", startDate: "2030-08-25" });
    await create({ name: "Alpha passée", startDate: "2030-08-01" });
    await create({ name: "Beta", startDate: "2030-08-28" });
    const choices = await planning.routineFilterChoices();
    expect(choices.map((choice) => [choice.routine.name, choice.active])).toEqual([
      ["Beta", true],
      ["Zeta", true],
      ["Alpha passée", false],
    ]);
  });
});

describe("cartes de l'Agenda (D-553, § 1, § 3 à § 5)", () => {
  const projection = (id: string, name: string) =>
    ({ id, name, status: "ACTIVE", duration: { kind: "exact", seconds: 600 }, bodyZoneIds: [], categories: [], tree: [] }) as unknown as SessionCatalogueProjection;
  const projections = new Map([
    ["s-a", projection("s-a", "Échauffement")],
    ["s-b", projection("s-b", "Étirement")],
    ["s-c", projection("s-c", "Gainage")],
  ]);
  const routine = (patch: Partial<Routine>): Routine => ({
    id: "r",
    name: "Mobilité du matin",
    startDate: "2030-08-05",
    time: "23:30",
    repetition: null,
    entries: [entry("s-a"), entry("s-b")],
    exclusions: [],
    reminderMinutes: null,
    createdAt: "t",
    updatedAt: "t",
    ...patch,
  });
  const iso = (day: number, hours: number, minutes = 0) => at(day, hours, minutes).toISOString();
  const execution = (patch: Partial<AgendaExecution>): AgendaExecution => ({
    executionId: "x",
    sessionId: "s-a",
    sessionName: "Échauffement",
    startedAt: iso(5, 23, 35),
    endedAt: iso(5, 23, 45),
    businessStatus: "COMPLETED",
    link: { routineId: "r", occurrenceKey: "2030-08-05T23:30", rank: 1 },
    ...patch,
  });
  const build = (routines: readonly Routine[], executions: readonly AgendaExecution[], nowAt: Date, routineFilter: ReadonlySet<string> | null = null) => {
    const started = new Set(executions.flatMap((item) => (item.link === null ? [] : [`${item.link.routineId}|${item.link.occurrenceKey}`])));
    const occurrences = routines.flatMap((item) => withExpiry(routineOccurrences(item, (id, key) => started.has(`${id}|${key}`)), nowAt));
    return buildAgendaGroups({ occurrences, executions, projections, isPlannable: () => true, routineFilter, now: nowAt.getTime() });
  };

  it("parcours à cheval sur minuit : groupé sous le jour du créneau, heure réelle ; trait « — » ; statut individuel (arbitrage 2)", () => {
    const groups = build(
      [routine({})],
      [execution({}), execution({ executionId: "y", sessionId: "s-b", sessionName: "Étirement", startedAt: iso(6, 0, 10), endedAt: iso(6, 0, 20), businessStatus: "PARTIAL", link: { routineId: "r", occurrenceKey: "2030-08-05T23:30", rank: 2 } })],
      at(6, 9, 0),
    );
    expect([...groups.keys()]).toEqual(["2030-08-05"]);
    const [group] = groups.get("2030-08-05")!;
    expect(group!.parcours).toBe(true);
    expect(group!.cards.map((card) => [card.title, card.timeLabel, card.status, card.duration])).toEqual([
      ["Échauffement", "23h35", "COMPLETED", "10′00″"],
      ["Étirement", "0h10", "PARTIAL", "10′00″"],
    ]);
    // Non exécutée : heure prévue pour la première, « — » pour la suivante, durée estimée.
    const [pending] = build([routine({ startDate: "2030-08-12" })], [], at(6, 9, 0)).get("2030-08-12")!;
    expect(pending!.cards.map((card) => [card.timeLabel, card.status, card.action])).toEqual([
      ["23h30", "UPCOMING", "START_CHAIN"],
      ["—", "UPCOMING", null],
    ]);
  });

  it("Séance seule exécutée : carte à sa date et heure réelles ; double Exécution de la même Séance hors planification : deux cartes (§ 3, § 4)", () => {
    const single = routine({ entries: [entry("s-c")], time: "08:00" });
    const groups = build(
      [single],
      [
        execution({ sessionId: "s-c", sessionName: "Gainage", startedAt: iso(7, 18, 0), endedAt: iso(7, 18, 5), link: { routineId: "r", occurrenceKey: "2030-08-05T08:00", rank: 1 } }),
        execution({ executionId: "f1", sessionId: "s-c", sessionName: "Gainage", startedAt: iso(7, 9, 0), endedAt: iso(7, 9, 30), link: null }),
        execution({ executionId: "f2", sessionId: "s-c", sessionName: "Gainage", startedAt: iso(7, 10, 0), endedAt: iso(7, 10, 30), link: null }),
      ],
      at(8, 9, 0),
    );
    expect(groups.get("2030-08-05")).toBeUndefined();
    expect(groups.get("2030-08-07")!.map((group) => [group.cards[0]!.timeLabel, group.cards[0]!.planned])).toEqual([
      ["9h00", false],
      ["10h00", false],
      ["18h00", true],
    ]);
  });

  it("parcours commencé : Séance non exécutée « Rattraper » seule jusqu'au créneau suivant, puis « Expirée » (arbitrage 8)", () => {
    const daily = routine({ time: "08:00", repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "UNTIL", date: "2030-08-06" } } });
    const executions = [execution({ startedAt: iso(5, 8, 0), endedAt: iso(5, 8, 10), link: { routineId: "r", occurrenceKey: "2030-08-05T08:00", rank: 1 } })];
    const before = build([daily], executions, at(5, 20, 0)).get("2030-08-05")![0]!;
    expect(before.cards[1]).toMatchObject({ status: "MISSED", action: "CATCH_UP_ONE", timeLabel: "—" });
    const after = build([daily], executions, at(6, 8, 1)).get("2030-08-05")![0]!;
    expect(after.cards[1]).toMatchObject({ status: "EXPIRED", action: null });
    // Le créneau du 6, non commencé et passé, reste rattrapable 10 jours (dernier créneau) : la chaîne complète.
    expect(build([daily], executions, at(6, 9, 0)).get("2030-08-06")![0]!.cards[0]).toMatchObject({ status: "MISSED", action: "START_CHAIN" });
  });

  it("filtre : seulement les routines choisies, toutes leurs Séances, sans doublon ; Exécutions hors planification masquées (§ 5)", () => {
    const first = routine({ id: "r1", time: "08:00" });
    const second = routine({ id: "r2", time: "09:00", entries: [entry("s-c")] });
    const free = execution({ executionId: "f", sessionId: "s-c", startedAt: iso(5, 10, 0), endedAt: iso(5, 10, 5), link: null });
    const all = build([first, second], [free], at(4, 9, 0)).get("2030-08-05")!;
    expect(all.map((group) => group.key)).toEqual(["r1|2030-08-05T08:00", "r2|2030-08-05T09:00", "free|f"]);
    const filtered = build([first, second], [free], at(4, 9, 0), new Set(["r1"])).get("2030-08-05")!;
    expect(filtered.map((group) => [group.key, group.cards.length])).toEqual([["r1|2030-08-05T08:00", 2]]);
    const both = build([first, second], [free], at(4, 9, 0), new Set(["r1", "r2"])).get("2030-08-05")!;
    expect(both.flatMap((group) => group.cards.map((card) => card.key))).toEqual(["r1|2030-08-05T08:00|1", "r1|2030-08-05T08:00|2", "r2|2030-08-05T09:00"]);
  });

  // D-560 (22/11/2026), développé le 23/11/2026 : séance hors de la répétition — Exécution hors planification (`planned: false`),
  // créneau ajouté à la main (RM-273) et créneau unique d'une routine sans répétition (D-559 ; Hermann, 23/11/2026 : « Oui. C'est
  // le même concept ») ; trace « Supprimée » comprise. [Créneau unique non marqué (D-560, choix de Claude) — remplacé le 23/11/2026]
  it("D-560 : créneau ajouté et créneau unique marqués (`addedSlot`), créneaux de la répétition non ; statuts inchangés", () => {
    const daily = routine({
      id: "d",
      entries: [entry("s-c")],
      time: "08:00",
      repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "UNTIL", date: "2030-08-06" } },
      overrides: [{ key: "2030-08-05T17:05+A1", index: 1, date: "2030-08-05", time: "17:05", sessions: null, reminderOverridden: false, reminderMinutes: null, startedAt: null, added: true }],
    });
    const single = routine({ id: "u", entries: [entry("s-a")], time: "18:30", startDate: "2030-08-06" });
    const free = execution({ executionId: "f", sessionId: "s-c", startedAt: iso(6, 10, 0), endedAt: iso(6, 10, 5), link: null });
    const occurrences = [daily, single].flatMap((item) => withExpiry(routineOccurrences(item), at(4, 9, 0)));
    const input = { occurrences, executions: [free], projections, isPlannable: () => true, routineFilter: null, now: at(4, 9, 0).getTime() };
    const cards = (groups: ReturnType<typeof buildAgendaGroups>) =>
      [...groups.values()].flat().flatMap((group) => group.cards.map((card) => [card.timeLabel, card.planned, card.addedSlot === true, card.status]));
    expect(cards(buildAgendaGroups({ ...input, singleSlotRoutines: new Set(["u"]) }))).toEqual([
      ["8h00", true, false, "UPCOMING"],
      ["17h05", true, true, "UPCOMING"],
      ["8h00", true, false, "UPCOMING"],
      ["10h00", false, false, "COMPLETED"],
      ["18h30", true, true, "UPCOMING"],
    ]);
    // Sans la liste des créneaux uniques : seul le créneau ajouté à la main est marqué.
    expect(cards(buildAgendaGroups(input)).map((card) => card[2])).toEqual([false, true, false, false, false]);
    // Trace « Supprimée » d'un créneau ajouté : la marque reste.
    const added = occurrences.find((item) => item.added === true)!;
    const trace = { ...added, sessions: added.sessions.map((session) => ({ ...session, deleted: true as const })), deleted: true as const };
    const traced = buildAgendaGroups({ ...input, occurrences: [], executions: [], deletedOccurrences: [trace] });
    expect([...traced.values()].flat()[0]!.cards[0]).toMatchObject({ status: "DELETED", addedSlot: true });
  });

  it("créneaux multiples et expirés d'une même routine : une carte par créneau, l'expiré marqué « Expirée » (D-540)", () => {
    const daily = routine({ entries: [entry("s-c")], time: "08:00", repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "UNTIL", date: "2030-08-07" } } });
    const groups = build([daily], [], at(6, 9, 0));
    expect([...groups.entries()].map(([day, list]) => [day, list[0]!.cards[0]!.status])).toEqual([
      ["2030-08-05", "EXPIRED"],
      ["2030-08-06", "MISSED"],
      ["2030-08-07", "UPCOMING"],
    ]);
  });
});
