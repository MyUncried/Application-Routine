import type { ContentFrequency, OccurrenceOverride, OccurrenceSession, Routine, RoutineRepetition, Weekday } from "@/domain/planning/Routine";
import type { RoutineRepository } from "@/domain/planning/RoutineRepository";

import { LOCAL_USER_SINGLETON_KEY } from "../constants";
import type { Database } from "../Database";

type RoutineRow = {
  id: string;
  name: string;
  /** Migration 036 (D-553) : 1 = nom généré. */
  name_generated: number;
  start_date: string;
  start_time: string;
  repeat_unit: string | null;
  repeat_every: number | null;
  repeat_weekdays: string | null;
  end_kind: string | null;
  end_date: string | null;
  end_count: number | null;
  reminder_minutes: number | null;
  archived_at: string | null;
  program_id: string | null;
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

/** Occurrence enregistrée (migration 034, D-536). */
type OccurrenceRow = {
  routine_id: string;
  occurrence_key: string;
  occurrence_index: number;
  /** Migration 037 (D-554) : 1 = créneau ajouté hors de la répétition. */
  added: number;
  occurrence_date: string | null;
  occurrence_time: string | null;
  sessions_json: string | null;
  reminder_overridden: number;
  reminder_minutes: number | null;
  started_at: string | null;
};

const ROUTINE_COLUMNS =
  "id, name, name_generated, start_date, start_time, repeat_unit, repeat_every, repeat_weekdays, end_kind, end_date, end_count, reminder_minutes, archived_at, program_id, created_at, updated_at";

function parseSessions(value: string | null): OccurrenceSession[] | null {
  if (value === null) return null;
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) return null;
  return parsed.flatMap((item: unknown) => {
    if (typeof item !== "object" || item === null) return [];
    const record = item as Record<string, unknown>;
    if (typeof record.sessionId !== "string") return [];
    return [
      {
        sessionId: record.sessionId,
        entryId: typeof record.entryId === "string" ? record.entryId : null,
        origin: record.origin === "ADDED" ? ("ADDED" as const) : ("ROUTINE" as const),
        active: record.active !== false,
        // D-568 : trace d'une séance supprimée depuis l'Agenda (champ du JSON `sessions_json`, sans changement de schéma).
        ...(record.deleted === true ? { deleted: true as const } : {}),
      },
    ];
  });
}

function toOverride(row: OccurrenceRow): OccurrenceOverride {
  return {
    key: row.occurrence_key,
    index: row.occurrence_index,
    date: row.occurrence_date,
    time: row.occurrence_time,
    sessions: parseSessions(row.sessions_json),
    reminderOverridden: row.reminder_overridden === 1,
    reminderMinutes: row.reminder_minutes,
    startedAt: row.started_at,
    // D-554 / RM-273 : présent seulement pour un créneau ajouté (forme antérieure inchangée).
    ...(row.added === 1 ? { added: true } : {}),
  };
}

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
    const occurrences = await this.database.getAllAsync<OccurrenceRow>(
      `SELECT routine_occurrences.* FROM routine_occurrences JOIN routines ON routines.id = routine_occurrences.routine_id
       WHERE routines.owner_id = ? ORDER BY routine_occurrences.occurrence_key`,
      [owner],
    );
    return rows.map((row) => this.assemble(row, entries, exclusions, occurrences));
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
    const occurrences = await this.database.getAllAsync<OccurrenceRow>(
      "SELECT * FROM routine_occurrences WHERE routine_id = ? ORDER BY occurrence_key",
      [routineId],
    );
    return this.assemble(row, entries, exclusions, occurrences);
  }

  private assemble(row: RoutineRow, entries: readonly EntryRow[], exclusions: readonly ExclusionRow[], occurrences: readonly OccurrenceRow[]): Routine {
    return {
      id: row.id,
      name: row.name,
      // D-553 : présent seulement pour un nom généré (forme antérieure inchangée pour un nom personnalisé).
      ...(row.name_generated === 1 ? { nameGenerated: true } : {}),
      startDate: row.start_date,
      time: row.start_time,
      repetition: toRepetition(row),
      entries: entries
        .filter((entry) => entry.routine_id === row.id)
        .map((entry) => ({ id: entry.id, sessionId: entry.session_id, frequency: toFrequency(entry) })),
      exclusions: exclusions.filter((exclusion) => exclusion.routine_id === row.id).map((exclusion) => exclusion.occurrence_key),
      reminderMinutes: row.reminder_minutes,
      // Champs absents tant que la Routine n'a ni occurrence enregistrée ni archivage (forme antérieure inchangée).
      ...this.extras(row, occurrences),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private extras(row: RoutineRow, occurrences: readonly OccurrenceRow[]): Pick<Routine, "overrides" | "archivedAt" | "programId"> {
    const own = occurrences.filter((occurrence) => occurrence.routine_id === row.id).map(toOverride);
    return {
      ...(own.length > 0 ? { overrides: own } : {}),
      ...(row.archived_at !== null ? { archivedAt: row.archived_at } : {}),
      // PROG-CAT-01 (migration 035) : présent seulement pour une routine rattachée.
      ...(row.program_id !== null ? { programId: row.program_id } : {}),
    };
  }

  async save(routine: Routine): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const owner = await this.ownerId(transaction);
      const repetition = routine.repetition;
      const parameters = [
        routine.name,
        routine.nameGenerated === true ? 1 : 0,
        routine.startDate,
        routine.time,
        repetition === null ? null : repetition.unit,
        repetition === null ? null : repetition.every,
        repetition === null ? null : [...repetition.weekdays].sort((a, b) => a - b).join(","),
        repetition === null ? null : repetition.end.kind,
        repetition !== null && repetition.end.kind === "UNTIL" ? repetition.end.date : null,
        repetition !== null && repetition.end.kind === "FOR" ? repetition.end.count : null,
        routine.reminderMinutes,
        routine.archivedAt ?? null,
        routine.programId ?? null,
        routine.updatedAt,
      ];
      const existing = await transaction.getFirstAsync<{ id: string }>("SELECT id FROM routines WHERE id = ? AND owner_id = ?", [routine.id, owner]);
      if (existing === null) {
        await transaction.runAsync(
          `INSERT INTO routines (name, name_generated, start_date, start_time, repeat_unit, repeat_every, repeat_weekdays, end_kind, end_date, end_count, reminder_minutes, archived_at, program_id, updated_at, id, owner_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [...parameters, routine.id, owner, routine.createdAt],
        );
      } else {
        await transaction.runAsync(
          `UPDATE routines SET name = ?, name_generated = ?, start_date = ?, start_time = ?, repeat_unit = ?, repeat_every = ?, repeat_weekdays = ?, end_kind = ?,
           end_date = ?, end_count = ?, reminder_minutes = ?, archived_at = ?, program_id = ?, updated_at = ? WHERE id = ?`,
          [...parameters, routine.id],
        );
        await transaction.runAsync("DELETE FROM routine_entries WHERE routine_id = ?", [routine.id]);
        await transaction.runAsync("DELETE FROM routine_exclusions WHERE routine_id = ?", [routine.id]);
        await transaction.runAsync("DELETE FROM routine_occurrences WHERE routine_id = ?", [routine.id]);
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
      for (const saved of routine.overrides ?? []) {
        await transaction.runAsync(
          `INSERT INTO routine_occurrences (routine_id, occurrence_key, occurrence_index, occurrence_date, occurrence_time, sessions_json, reminder_overridden,
           reminder_minutes, started_at, added) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            routine.id,
            saved.key,
            saved.index,
            saved.date,
            saved.time,
            saved.sessions === null ? null : JSON.stringify(saved.sessions),
            saved.reminderOverridden ? 1 : 0,
            saved.reminderMinutes,
            saved.startedAt,
            saved.added === true ? 1 : 0,
          ],
        );
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
