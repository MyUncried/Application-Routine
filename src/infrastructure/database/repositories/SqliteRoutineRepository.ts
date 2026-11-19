import type { ContentFrequency, Routine, RoutineRepetition, Weekday } from "@/domain/planning/Routine";
import type { RoutineRepository } from "@/domain/planning/RoutineRepository";

import { LOCAL_USER_SINGLETON_KEY } from "../constants";
import type { Database } from "../Database";

type RoutineRow = {
  id: string;
  name: string;
  start_date: string;
  start_time: string;
  repeat_unit: string | null;
  repeat_every: number | null;
  repeat_weekdays: string | null;
  end_kind: string | null;
  end_date: string | null;
  end_count: number | null;
  reminder_minutes: number | null;
  created_at: string;
  updated_at: string;
};

type EntryRow = {
  id: string;
  routine_id: string;
  position: number;
  session_id: string;
  frequency_x: number;
  frequency_n: number;
  frequency_positions: string;
};

type ExclusionRow = { routine_id: string; occurrence_key: string };

const ROUTINE_COLUMNS =
  "id, name, start_date, start_time, repeat_unit, repeat_every, repeat_weekdays, end_kind, end_date, end_count, reminder_minutes, created_at, updated_at";

function parseNumberList(value: string | null): number[] {
  if (value === null || value.trim() === "") return [];
  return value.split(",").map(Number).filter((number) => Number.isInteger(number));
}

function toRepetition(row: RoutineRow): RoutineRepetition | null {
  // Unités Semaine et Jour (RM-257). L'unité Mois, retirée (D-526), n'est pas interprétée (RM-264).
  if (row.repeat_every === null) return null;
  if (row.repeat_unit !== "WEEK" && row.repeat_unit !== "DAY") return null;
  const end =
    row.end_kind === "FOR" && row.end_count !== null
      ? ({ kind: "FOR", count: row.end_count } as const)
      : ({ kind: "UNTIL", date: row.end_date ?? row.start_date } as const);
  if (row.repeat_unit === "DAY") return { unit: "DAY", every: row.repeat_every, weekdays: [], end };
  return {
    unit: "WEEK",
    every: row.repeat_every,
    weekdays: parseNumberList(row.repeat_weekdays).filter((day): day is Weekday => day >= 1 && day <= 7),
    end,
  };
}

function toFrequency(row: EntryRow): ContentFrequency {
  return { x: row.frequency_x, n: row.frequency_n, positions: parseNumberList(row.frequency_positions) };
}

/** Routines du propriétaire local (chapitre 12 : racine d'agrégat portant `ownerId`). */
export class SqliteRoutineRepository implements RoutineRepository {
  constructor(private readonly database: Database) {}

  private async ownerId(database: Database = this.database): Promise<string> {
    const row = await database.getFirstAsync<{ id: string }>("SELECT id FROM users WHERE singleton_key = ?", [LOCAL_USER_SINGLETON_KEY]);
    if (row === null) throw new Error("Utilisateur local introuvable.");
    return row.id;
  }

  async list(): Promise<readonly Routine[]> {
    const owner = await this.ownerId();
    const rows = await this.database.getAllAsync<RoutineRow>(
      `SELECT ${ROUTINE_COLUMNS} FROM routines WHERE owner_id = ? ORDER BY created_at, id`,
      [owner],
    );
    if (rows.length === 0) return [];
    const entries = await this.database.getAllAsync<EntryRow>(
      `SELECT routine_entries.* FROM routine_entries JOIN routines ON routines.id = routine_entries.routine_id
       WHERE routines.owner_id = ? ORDER BY routine_entries.routine_id, routine_entries.position`,
      [owner],
    );
    const exclusions = await this.database.getAllAsync<ExclusionRow>(
      `SELECT routine_exclusions.routine_id, routine_exclusions.occurrence_key FROM routine_exclusions
       JOIN routines ON routines.id = routine_exclusions.routine_id WHERE routines.owner_id = ?
       ORDER BY routine_exclusions.occurrence_key`,
      [owner],
    );
    return rows.map((row) => this.assemble(row, entries, exclusions));
  }

  async get(routineId: string): Promise<Routine | null> {
    const owner = await this.ownerId();
    const row = await this.database.getFirstAsync<RoutineRow>(
      `SELECT ${ROUTINE_COLUMNS} FROM routines WHERE id = ? AND owner_id = ?`,
      [routineId, owner],
    );
    if (row === null) return null;
    const entries = await this.database.getAllAsync<EntryRow>("SELECT * FROM routine_entries WHERE routine_id = ? ORDER BY position", [routineId]);
    const exclusions = await this.database.getAllAsync<ExclusionRow>(
      "SELECT routine_id, occurrence_key FROM routine_exclusions WHERE routine_id = ? ORDER BY occurrence_key",
      [routineId],
    );
    return this.assemble(row, entries, exclusions);
  }

  private assemble(row: RoutineRow, entries: readonly EntryRow[], exclusions: readonly ExclusionRow[]): Routine {
    return {
      id: row.id,
      name: row.name,
      startDate: row.start_date,
      time: row.start_time,
      repetition: toRepetition(row),
      entries: entries
        .filter((entry) => entry.routine_id === row.id)
        .map((entry) => ({ id: entry.id, sessionId: entry.session_id, frequency: toFrequency(entry) })),
      exclusions: exclusions.filter((exclusion) => exclusion.routine_id === row.id).map((exclusion) => exclusion.occurrence_key),
      reminderMinutes: row.reminder_minutes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async save(routine: Routine): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const owner = await this.ownerId(transaction);
      const repetition = routine.repetition;
      const parameters = [
        routine.name,
        routine.startDate,
        routine.time,
        repetition === null ? null : repetition.unit,
        repetition === null ? null : repetition.every,
        repetition === null ? null : [...repetition.weekdays].sort((a, b) => a - b).join(","),
        repetition === null ? null : repetition.end.kind,
        repetition !== null && repetition.end.kind === "UNTIL" ? repetition.end.date : null,
        repetition !== null && repetition.end.kind === "FOR" ? repetition.end.count : null,
        routine.reminderMinutes,
        routine.updatedAt,
      ];
      const existing = await transaction.getFirstAsync<{ id: string }>("SELECT id FROM routines WHERE id = ? AND owner_id = ?", [routine.id, owner]);
      if (existing === null) {
        await transaction.runAsync(
          `INSERT INTO routines (name, start_date, start_time, repeat_unit, repeat_every, repeat_weekdays, end_kind, end_date, end_count, reminder_minutes, updated_at, id, owner_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [...parameters, routine.id, owner, routine.createdAt],
        );
      } else {
        await transaction.runAsync(
          `UPDATE routines SET name = ?, start_date = ?, start_time = ?, repeat_unit = ?, repeat_every = ?, repeat_weekdays = ?, end_kind = ?,
           end_date = ?, end_count = ?, reminder_minutes = ?, updated_at = ? WHERE id = ?`,
          [...parameters, routine.id],
        );
        await transaction.runAsync("DELETE FROM routine_entries WHERE routine_id = ?", [routine.id]);
        await transaction.runAsync("DELETE FROM routine_exclusions WHERE routine_id = ?", [routine.id]);
      }
      for (const [position, entry] of routine.entries.entries()) {
        await transaction.runAsync(
          `INSERT INTO routine_entries (id, routine_id, position, session_id, frequency_x, frequency_n, frequency_positions)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [entry.id, routine.id, position, entry.sessionId, entry.frequency.x, entry.frequency.n, entry.frequency.positions.join(",")],
        );
      }
      for (const key of routine.exclusions) {
        await transaction.runAsync("INSERT INTO routine_exclusions (routine_id, occurrence_key, created_at) VALUES (?, ?, ?)", [
          routine.id,
          key,
          routine.updatedAt,
        ]);
      }
    });
  }

  async delete(routineId: string): Promise<boolean> {
    const owner = await this.ownerId();
    const result = await this.database.runAsync("DELETE FROM routines WHERE id = ? AND owner_id = ?", [routineId, owner]);
    return result.changes > 0;
  }

  async addExclusion(routineId: string, occurrenceKey: string, at: string): Promise<boolean> {
    const owner = await this.ownerId();
    const routine = await this.database.getFirstAsync<{ id: string }>("SELECT id FROM routines WHERE id = ? AND owner_id = ?", [routineId, owner]);
    if (routine === null) return false;
    await this.database.runAsync("INSERT OR IGNORE INTO routine_exclusions (routine_id, occurrence_key, created_at) VALUES (?, ?, ?)", [
      routineId,
      occurrenceKey,
      at,
    ]);
    return true;
  }
}
