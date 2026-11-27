import {
  FEEDBACK_FEELINGS,
  type ExecutionFeedback,
  type ExecutionFeedbackRepository,
  type FeedbackFeeling,
  type SeriesRepetitionsWrite,
} from "@/domain/feedback/ExecutionFeedbackRepository";

import type { Database } from "../Database";

/**
 * Finalisation d'une Exécution (D-578 à D-581, D-427 ; migrations 044 et 045) : ressenti, commentaire et photo
 * (`execution_feedback`), douleur après la séance (`execution_pain_readings`, moment `AFTER`) et répétitions faites par série
 * (`execution_results`), dans une seule transaction (CE-UI-08 § 15 : atomique, idempotente).
 *
 * Répétitions faites (arbitrage de Hermann du 28/11/2026, option A ajustée) : seul le champ des répétitions du résultat de la série est
 * réécrit dans `execution_results.payload_json` — `repetitionsDone` du résultat d'étape (première étape de la série), ou, pour une série
 * interrompue d'un format, `partialRepetitions` / `maxSeries[].repetitions` du résultat du format (écrasés). Tous les autres champs, la
 * révision et le moteur sont inchangés. Une seule valeur par série.
 */
type PayloadRow = { payload_json: string };

async function writeSeriesRepetitions(transaction: Database, executionId: string, write: SeriesRepetitionsWrite): Promise<void> {
  if (write.partialKey === null) {
    const row = await transaction.getFirstAsync<PayloadRow>("SELECT payload_json FROM execution_results WHERE execution_id = ? AND result_key = ? AND kind = 'STEP'", [
      executionId,
      write.stepKey,
    ]);
    if (row === null) throw new Error(`Résultat de série introuvable : ${write.stepKey}`);
    const payload = { ...(JSON.parse(row.payload_json) as Record<string, unknown>), repetitionsDone: write.repetitions };
    await transaction.runAsync("UPDATE execution_results SET payload_json = ? WHERE execution_id = ? AND result_key = ?", [JSON.stringify(payload), executionId, write.stepKey]);
    return;
  }
  // Série interrompue d'un format : la valeur déjà enregistrée par le format est écrasée (pas de second champ).
  const rows = await transaction.getAllAsync<PayloadRow & { result_key: string }>("SELECT result_key, payload_json FROM execution_results WHERE execution_id = ? AND kind = 'SCOPE'", [
    executionId,
  ]);
  for (const row of rows) {
    const payload = JSON.parse(row.payload_json) as {
      interruptedKey?: string | null;
      partialRepetitions?: number | null;
      maxSeries?: { key: string; repetitions: number | null }[];
    };
    let changed = false;
    if (payload.interruptedKey === write.partialKey && typeof payload.partialRepetitions === "number") {
      payload.partialRepetitions = write.repetitions;
      changed = true;
    }
    if (Array.isArray(payload.maxSeries))
      for (const entry of payload.maxSeries)
        if (entry.key === write.partialKey && typeof entry.repetitions === "number") {
          entry.repetitions = write.repetitions;
          changed = true;
        }
    if (changed) {
      await transaction.runAsync("UPDATE execution_results SET payload_json = ? WHERE execution_id = ? AND result_key = ?", [JSON.stringify(payload), executionId, row.result_key]);
      return;
    }
  }
  throw new Error(`Répétitions de format introuvables : ${write.partialKey}`);
}

export class SqliteExecutionFeedbackRepository implements ExecutionFeedbackRepository {
  constructor(private readonly database: Database) {}

  async save(feedback: ExecutionFeedback, at: string): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `INSERT INTO execution_feedback (execution_id, feeling, comment, photo_path, recorded_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(execution_id) DO UPDATE SET feeling = excluded.feeling, comment = excluded.comment, photo_path = excluded.photo_path, recorded_at = excluded.recorded_at`,
        [feedback.executionId, feedback.feeling, feedback.comment, feedback.photoPath ?? null, at],
      );
      for (const write of feedback.seriesRepetitions ?? []) {
        if (!Number.isInteger(write.repetitions) || write.repetitions < 0) throw new Error(`Répétitions invalides : ${write.repetitions}`);
        await writeSeriesRepetitions(transaction, feedback.executionId, write);
      }
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
