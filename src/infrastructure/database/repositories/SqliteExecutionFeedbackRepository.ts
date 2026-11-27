import {
  FEEDBACK_FEELINGS,
  type ExecutionFeedback,
  type ExecutionFeedbackRepository,
  type FeedbackFeeling,
} from "@/domain/feedback/ExecutionFeedbackRepository";

import type { Database } from "../Database";

/**
 * Finalisation d'une Exécution (D-578 à D-581, D-427 ; migration 044) : ressenti et commentaire (`execution_feedback`), douleur
 * après la séance (`execution_pain_readings`, moment `AFTER`), dans une seule transaction (CE-UI-08 § 15 : atomique, idempotente).
 */
export class SqliteExecutionFeedbackRepository implements ExecutionFeedbackRepository {
  constructor(private readonly database: Database) {}

  async save(feedback: ExecutionFeedback, at: string): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `INSERT INTO execution_feedback (execution_id, feeling, comment, photo_path, recorded_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(execution_id) DO UPDATE SET feeling = excluded.feeling, comment = excluded.comment, photo_path = excluded.photo_path, recorded_at = excluded.recorded_at`,
        [feedback.executionId, feedback.feeling, feedback.comment, feedback.photoPath ?? null, at],
      );
      for (const correction of feedback.repetitionCorrections ?? [])
        await transaction.runAsync(
          `INSERT INTO execution_repetition_corrections (execution_id, series_key, repetitions, recorded_at) VALUES (?, ?, ?, ?)
           ON CONFLICT(execution_id, series_key) DO UPDATE SET repetitions = excluded.repetitions, recorded_at = excluded.recorded_at`,
          [feedback.executionId, correction.seriesKey, correction.repetitions, at],
        );
      if (feedback.painAfter === null)
        await transaction.runAsync("DELETE FROM execution_pain_readings WHERE execution_id = ? AND moment = 'AFTER'", [feedback.executionId]);
      else
        await transaction.runAsync(
          `INSERT INTO execution_pain_readings (execution_id, moment, value, recorded_at) VALUES (?, 'AFTER', ?, ?)
           ON CONFLICT(execution_id, moment) DO UPDATE SET value = excluded.value, recorded_at = excluded.recorded_at`,
          [feedback.executionId, feedback.painAfter, at],
        );
    });
  }

  async repetitionCorrections(executionId: string): Promise<ReadonlyMap<string, number>> {
    const rows = await this.database.getAllAsync<{ series_key: string; repetitions: number }>(
      "SELECT series_key, repetitions FROM execution_repetition_corrections WHERE execution_id = ?",
      [executionId],
    );
    return new Map(rows.map((row) => [row.series_key, row.repetitions]));
  }

  async get(executionId: string): Promise<ExecutionFeedback | null> {
    const row = await this.database.getFirstAsync<{ feeling: string; comment: string | null; photo_path: string | null }>(
      "SELECT feeling, comment, photo_path FROM execution_feedback WHERE execution_id = ?",
      [executionId],
    );
    if (row === null || !(FEEDBACK_FEELINGS as readonly string[]).includes(row.feeling)) return null;
    const pain = await this.database.getFirstAsync<{ value: number }>("SELECT value FROM execution_pain_readings WHERE execution_id = ? AND moment = 'AFTER'", [executionId]);
    return { executionId, feeling: row.feeling as FeedbackFeeling, comment: row.comment, painAfter: pain?.value ?? null, photoPath: row.photo_path };
  }
}
