import type { BusinessStatus } from "@/domain/execution/results";
import type { OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";

import type { Database } from "../Database";

type Row = {
  execution_id: string;
  routine_id: string;
  occurrence_key: string;
  session_rank: number;
  started_at: string;
  business_status: string | null;
};

const STATUSES: readonly BusinessStatus[] = ["COMPLETED", "PARTIAL", "INTERRUPTED"];

/** Lecture des Exécutions liées à une occurrence de routine (migration 033). */
export class SqliteOccurrenceExecutionRepository {
  constructor(private readonly database: Database) {}

  async list(): Promise<readonly OccurrenceExecution[]> {
    const rows = await this.database.getAllAsync<Row>(
      `SELECT link.execution_id, link.routine_id, link.occurrence_key, link.session_rank, execution.started_at, execution.business_status
         FROM occurrence_executions link JOIN executions execution ON execution.id = link.execution_id`,
    );
    return rows.map((row) => ({
      executionId: row.execution_id,
      routineId: row.routine_id,
      occurrenceKey: row.occurrence_key,
      rank: row.session_rank,
      startedAt: row.started_at,
      businessStatus: STATUSES.find((status) => status === row.business_status) ?? null,
    }));
  }
}
