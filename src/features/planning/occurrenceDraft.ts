import { EVERY_TIME, type OccurrenceSession, type Routine, type RoutineEntry } from "@/domain/planning/Routine";
import { routineSessionsAt, type Occurrence } from "@/domain/planning/occurrences";
import { draftFromRoutine, type FormDraft } from "@/features/planning/planningDraft";
import { gridFromEntries, type PlanningGrid } from "@/features/planning/planningGrid";

/**
 * Modification d'une occurrence seule depuis l'Agenda (D-536, point 4 ; DSF Agenda § 8 ; 20/11/2026) — état local pur.
 *
 * Le formulaire de planification est réutilisé : lignes = séances de la routine, puis séances ajoutées à ce créneau ;
 * seule la colonne du créneau de l'occurrence est modifiable (« Seul le créneau de l'occurrence ouverte est coloré, les
 * autres sont grisés »). Un point de cette colonne = séance active dans l'occurrence. Une séance de la routine ne se retire
 * pas : on la désactive ; une séance ajoutée à la main se retire par « Changer ».
 */
export type OccurrenceEditing = {
  readonly routineId: string;
  readonly key: string;
  /** Colonne du créneau de l'occurrence (0 = #1) : rang de l'occurrence dans le cycle de rotation. */
  readonly column: number;
  /** Lignes ajoutées à la main (identités d'entrée locales au formulaire). */
  readonly added: ReadonlySet<string>;
  /** Entrées de la routine présentes dans l'occurrence (placées par la rotation ou déjà listées), actives ou non. */
  readonly listed: ReadonlySet<string>;
};

export function occurrenceForm(routine: Routine, occurrence: Occurrence, newId: () => string): { readonly form: FormDraft; readonly editing: OccurrenceEditing } {
  const base = draftFromRoutine(routine);
  const grid = gridFromEntries(routine.entries);
  const column = (occurrence.index - 1) % grid.cycle;
  const own = new Map(occurrence.sessions.flatMap((session) => (session.origin === "ROUTINE" && session.entryId !== null ? [[session.entryId, session] as const] : [])));
  const addedSessions = occurrence.sessions.filter((session) => session.origin === "ADDED");
  const addedEntries: RoutineEntry[] = addedSessions.map((session) => ({ id: newId(), sessionId: session.sessionId, frequency: EVERY_TIME }));
  const points = [
    ...routine.entries.map((entry, row) => (grid.points[row] ?? []).map((value, at) => (at === column ? own.get(entry.id)?.active === true : value))),
    ...addedSessions.map((session) => Array.from({ length: grid.cycle }, (_, at) => at === column && session.active)),
  ];
  const listed = new Set([...routineSessionsAt(routine, occurrence.index).map((session) => session.entryId!), ...own.keys()]);
  return {
    form: {
      ...base,
      name: routine.name,
      nameEdited: true,
      entries: [...routine.entries, ...addedEntries],
      grid: { cycle: grid.cycle, points },
      startDate: occurrence.date,
      time: occurrence.time,
      // La récurrence ne se change pas depuis l'Agenda (D-536, point 4).
      repetitionOn: false,
      reminderMinutes: occurrence.reminderMinutes,
    },
    editing: { routineId: routine.id, key: occurrence.key, column, added: new Set(addedEntries.map((entry) => entry.id)), listed },
  };
}

/** Bascule d'un point de la colonne du créneau ; refusée si l'occurrence resterait sans séance active. */
export function toggleOccurrencePoint(grid: PlanningGrid, row: number, column: number): PlanningGrid {
  const line = grid.points[row];
  if (line === undefined) return grid;
  const played = line[column] === true;
  if (played && grid.points.filter((other) => other[column] === true).length <= 1) return grid;
  return { ...grid, points: grid.points.map((other, index) => (index === row ? other.map((value, at) => (at === column ? !played : value)) : other)) };
}

/**
 * « Changer » sur une occurrence : les séances de la routine restent (elles se désactivent) ; les séances choisies hors de
 * la routine deviennent des séances ajoutées, actives dans ce seul créneau ; une séance ajoutée désélectionnée est retirée.
 */
export function withOccurrenceSelection(
  form: FormDraft,
  editing: OccurrenceEditing,
  selected: readonly string[],
  newId: () => string,
): { readonly form: FormDraft; readonly editing: OccurrenceEditing } {
  const rows = form.entries.map((entry, row) => ({ entry, points: form.grid.points[row] ?? [] }));
  const routineRows = rows.filter((item) => !editing.added.has(item.entry.id));
  const routineSessions = new Set(routineRows.map((item) => item.entry.sessionId));
  const wanted = selected.filter((sessionId, at) => !routineSessions.has(sessionId) && selected.indexOf(sessionId) === at);
  const keptAdded = rows.filter((item) => editing.added.has(item.entry.id) && wanted.includes(item.entry.sessionId));
  const newAdded = wanted
    .filter((sessionId) => !keptAdded.some((item) => item.entry.sessionId === sessionId))
    .map((sessionId) => ({
      entry: { id: newId(), sessionId, frequency: EVERY_TIME } as RoutineEntry,
      points: Array.from({ length: form.grid.cycle }, (_, at) => at === editing.column),
    }));
  const next = [...routineRows, ...keptAdded, ...newAdded];
  return {
    form: { ...form, entries: next.map((item) => item.entry), grid: { cycle: form.grid.cycle, points: next.map((item) => item.points) } },
    editing: { ...editing, added: new Set([...keptAdded, ...newAdded].map((item) => item.entry.id)) },
  };
}

/** Séances de l'occurrence, dans l'ordre des lignes, actives ou non (enregistrées si elles diffèrent de la routine). */
export function occurrenceSessions(form: FormDraft, editing: OccurrenceEditing): OccurrenceSession[] {
  return form.entries.flatMap((entry, row) => {
    const on = form.grid.points[row]?.[editing.column] === true;
    const added = editing.added.has(entry.id);
    if (!added && !on && !editing.listed.has(entry.id)) return [];
    return [{ sessionId: entry.sessionId, entryId: added ? null : entry.id, origin: added ? ("ADDED" as const) : ("ROUTINE" as const), active: on }];
  });
}
