import { readCheckpoint, serializeCheckpoint } from "@/domain/execution/checkpoint";
import {
  ExecutionRevisionConflictError,
  type ExecutionRecord,
  type ExecutionRepository,
  type ExecutionSave,
  type StoredResult,
} from "@/domain/execution/ExecutionRepository";
import type { ResultChange } from "@/domain/execution/kernel";
import type { BusinessStatus } from "@/domain/execution/results";

import type { Database } from "../Database";

/**
 * PRE-10.2 — persistance SQLite des Exécutions (`migration024`). Checkpoint et résultats d'une transition
 * dans une transaction exclusive unique, conditionnée par la révision attendue (§15.2) ; résultats mis à
 * jour par clé logique `(execution_id, result_key)` (idempotence, T20).
 */

type ExecutionRow = {
  id: string;
  origin: "SESSION";
  session_id: string | null;
  snapshot_json: string;
  snapshot_version: number;
  plan_version: number;
  engine_version: number;
  status: string;
  business_status: BusinessStatus | null;
  checkpoint_json: string;
  checkpoint_revision: number;
  started_at: string;
  ended_at: string | null;
  last_saved_at: string;
  clock_wall_ms: number;
};

type ResultRow = { result_key: string; kind: "STEP" | "SCOPE"; payload_json: string };

const UPSERT_RESULT = `INSERT INTO execution_results (execution_id, result_key, kind, payload_json, revision)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT (execution_id, result_key) DO UPDATE SET kind = excluded.kind, payload_json = excluded.payload_json, revision = excluded.revision`;

function toRecord(row: ExecutionRow): ExecutionRecord {
  return {
    id: row.id,
    origin: row.origin,
    sessionId: row.session_id,
    snapshotJson: row.snapshot_json,
    snapshotVersion: row.snapshot_version,
    planVersion: row.plan_version,
    engineVersion: row.engine_version,
    state: readCheckpoint(row.checkpoint_json),
    revision: row.checkpoint_revision,
    businessStatus: row.business_status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    clockWallMs: row.clock_wall_ms,
  };
}

async function upsertResults(transaction: Database, executionId: string, results: readonly ResultChange[], revision: number) {
  for (const change of results) {
    const payload = change.type === "STEP" ? change.result : change.result;
    await transaction.runAsync(UPSERT_RESULT, [executionId, change.key, change.type, JSON.stringify(payload), revision]);
  }
}

export class SqliteExecutionRepository implements ExecutionRepository {
  constructor(private readonly database: Database) {}

  async create(record: Omit<ExecutionRecord, "revision" | "businessStatus" | "endedAt">, results: readonly ResultChange[]): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `INSERT INTO executions (id, origin, session_id, snapshot_json, snapshot_version, plan_version, engine_version, status, business_status,
           checkpoint_json, checkpoint_revision, started_at, ended_at, last_saved_at, clock_wall_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 1, ?, NULL, ?, ?)`,
        [
          record.id,
          record.origin,
          record.sessionId,
          record.snapshotJson,
          record.snapshotVersion,
          record.planVersion,
          record.engineVersion,
          record.state.status,
          serializeCheckpoint(record.state),
          record.startedAt,
          record.startedAt,
          record.clockWallMs,
        ],
      );
      await upsertResults(transaction, record.id, results, 1);
    });
  }

  async save(save: ExecutionSave): Promise<number> {
    const revision = save.expectedRevision + 1;
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const updated = await transaction.runAsync(
        `UPDATE executions SET status = ?, business_status = ?, checkpoint_json = ?, checkpoint_revision = ?, ended_at = ?, last_saved_at = ?, clock_wall_ms = ?
         WHERE id = ? AND checkpoint_revision = ?`,
        [save.state.status, save.businessStatus, serializeCheckpoint(save.state), revision, save.endedAt, save.savedAt, save.clockWallMs, save.executionId, save.expectedRevision],
      );
      if (updated.changes !== 1) {
        throw new ExecutionRevisionConflictError(`Execution ${save.executionId} is not at revision ${save.expectedRevision}.`);
      }
      await upsertResults(transaction, save.executionId, save.results, revision);
    });
    return revision;
  }

  async findById(executionId: string): Promise<ExecutionRecord | null> {
    const row = await this.database.getFirstAsync<ExecutionRow>("SELECT * FROM executions WHERE id = ?", [executionId]);
    return row === null ? null : toRecord(row);
  }

  async findUnfinished(): Promise<ExecutionRecord | null> {
    const row = await this.database.getFirstAsync<ExecutionRow>("SELECT * FROM executions WHERE status <> 'FINISHED' ORDER BY started_at DESC LIMIT 1");
    return row === null ? null : toRecord(row);
  }

  async listResults(executionId: string): Promise<readonly StoredResult[]> {
    const rows = await this.database.getAllAsync<ResultRow>("SELECT result_key, kind, payload_json FROM execution_results WHERE execution_id = ? ORDER BY rowid", [executionId]);
    return rows.map((row): StoredResult => (row.kind === "STEP" ? { type: "STEP", key: row.result_key, result: JSON.parse(row.payload_json) } : { type: "SCOPE", key: row.result_key, result: JSON.parse(row.payload_json) }));
  }
}
