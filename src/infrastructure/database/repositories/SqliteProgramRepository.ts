import type { Program } from "@/domain/programs/Program";
import type { ProgramRepository } from "@/domain/programs/ProgramRepository";

import { LOCAL_USER_SINGLETON_KEY } from "../constants";
import type { Database } from "../Database";

type ProgramRow = {
  id: string;
  name: string;
  objective: string | null;
  start_date: string;
  end_date: string;
  pain_tracking: number;
  terminated_at: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS = "id, name, objective, start_date, end_date, pain_tracking, terminated_at, created_at, updated_at";

function toProgram(row: ProgramRow): Program {
  return {
    id: row.id,
    name: row.name,
    objective: row.objective,
    startDate: row.start_date,
    endDate: row.end_date,
    painTracking: row.pain_tracking === 1,
    terminatedAt: row.terminated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Programmes du propriétaire local (migration 035, PROG-CAT-01). */
export class SqliteProgramRepository implements ProgramRepository {
  constructor(private readonly database: Database) {}

  private async ownerId(database: Database = this.database): Promise<string> {
    const row = await database.getFirstAsync<{ id: string }>("SELECT id FROM users WHERE singleton_key = ?", [LOCAL_USER_SINGLETON_KEY]);
    if (row === null) throw new Error("Utilisateur local introuvable.");
    return row.id;
  }

  async list(): Promise<readonly Program[]> {
    const owner = await this.ownerId();
    const rows = await this.database.getAllAsync<ProgramRow>(`SELECT ${COLUMNS} FROM programs WHERE owner_id = ? ORDER BY start_date, name, id`, [owner]);
    return rows.map(toProgram);
  }

  async get(programId: string): Promise<Program | null> {
    const owner = await this.ownerId();
    const row = await this.database.getFirstAsync<ProgramRow>(`SELECT ${COLUMNS} FROM programs WHERE id = ? AND owner_id = ?`, [programId, owner]);
    return row === null ? null : toProgram(row);
  }

  async save(program: Program): Promise<void> {
    const owner = await this.ownerId();
    await this.database.runAsync(
      `INSERT INTO programs (id, owner_id, name, objective, start_date, end_date, pain_tracking, terminated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, objective = excluded.objective, start_date = excluded.start_date,
         end_date = excluded.end_date, pain_tracking = excluded.pain_tracking, terminated_at = excluded.terminated_at,
         updated_at = excluded.updated_at`,
      [
        program.id,
        owner,
        program.name,
        program.objective,
        program.startDate,
        program.endDate,
        program.painTracking ? 1 : 0,
        program.terminatedAt,
        program.createdAt,
        program.updatedAt,
      ],
    );
  }

  async delete(programId: string): Promise<boolean> {
    const owner = await this.ownerId();
    const result = await this.database.runAsync("DELETE FROM programs WHERE id = ? AND owner_id = ?", [programId, owner]);
    return result.changes > 0;
  }

  async setRoutineProgram(routineId: string, programId: string | null): Promise<void> {
    const owner = await this.ownerId();
    await this.database.runAsync("UPDATE routines SET program_id = ? WHERE id = ? AND owner_id = ?", [programId, routineId, owner]);
  }

  async detachAll(programId: string): Promise<void> {
    const owner = await this.ownerId();
    await this.database.runAsync("UPDATE routines SET program_id = NULL WHERE program_id = ? AND owner_id = ?", [programId, owner]);
  }

  async executionCount(programId: string): Promise<number> {
    const row = await this.database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM executions WHERE program_id = ?", [programId]);
    return row?.count ?? 0;
  }

  async painConsentAt(): Promise<string | null> {
    const owner = await this.ownerId();
    const row = await this.database.getFirstAsync<{ pain_consent_at: string | null }>("SELECT pain_consent_at FROM user_privacy WHERE owner_id = ?", [owner]);
    return row?.pain_consent_at ?? null;
  }

  async setPainConsentAt(at: string | null): Promise<void> {
    const owner = await this.ownerId();
    await this.database.runAsync(
      "INSERT INTO user_privacy (owner_id, pain_consent_at) VALUES (?, ?) ON CONFLICT(owner_id) DO UPDATE SET pain_consent_at = excluded.pain_consent_at",
      [owner, at],
    );
  }

  async disablePainTrackingEverywhere(at: string): Promise<void> {
    const owner = await this.ownerId();
    await this.database.runAsync("UPDATE programs SET pain_tracking = 0, updated_at = ? WHERE owner_id = ? AND pain_tracking = 1", [at, owner]);
  }
}
