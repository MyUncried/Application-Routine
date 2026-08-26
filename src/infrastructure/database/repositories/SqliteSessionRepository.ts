import * as Crypto from "expo-crypto";

import {
  computeActivityCount,
  computeEstimatedDurationSeconds,
} from "@/domain/sessions/calculations";
import {
  FIXED_ACTIVITY_POSITION,
  FIXED_ACTIVITY_STRUCTURAL_POSITION,
  FIXED_CYCLE_REPEAT_COUNT,
  FIXED_PAUSE_SECONDS,
  FIXED_SERIES_COUNT,
  FIXED_TOUR_REPEAT_COUNT,
} from "@/domain/sessions/defaults";
import { SessionValidationError } from "@/domain/sessions/errors";
import {
  SESSION_COLORS,
  type CreateSessionInput,
  type Session,
  type SessionColor,
  type SessionSummary,
} from "@/domain/sessions/Session";
import type {
  SessionRepository,
  UpdateSessionOutcome,
} from "@/domain/sessions/SessionRepository";
import { validateCreateSessionInput } from "@/domain/sessions/validation";
import { LOCAL_USER_SINGLETON_KEY } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import type {
  SessionAggregateRow,
  SessionSummaryRow,
} from "@/infrastructure/database/types/DatabaseRows";

type LocalUserRow = { id: string };
type UuidFactory = () => string;

const AGGREGATE_QUERY = `
SELECT
  sessions.id AS session_id,
  sessions.owner_id,
  sessions.name AS session_name,
  sessions.color,
  sessions.status,
  sessions.initial_countdown_seconds,
  sessions.final_phase_seconds,
  sessions.created_at AS session_created_at,
  sessions.updated_at AS session_updated_at,
  cycles.id AS cycle_id,
  cycles.position AS cycle_position,
  cycles.repeat_count AS cycle_repeat_count,
  tours.id AS tour_id,
  tours.position AS tour_position,
  tours.repeat_count AS tour_repeat_count,
  activities.id AS activity_id,
  activities.name AS activity_name,
  activities.structural_position,
  activities.position AS activity_position,
  activities.execution_mode,
  activities.duration_seconds,
  activities.repetition_count,
  activities.series_count,
  activities.pause_seconds,
  activities.instruction
FROM sessions
JOIN cycles ON cycles.session_id = sessions.id
JOIN tours ON tours.cycle_id = cycles.id AND tours.session_id = sessions.id
JOIN activities
  ON activities.session_id = sessions.id
  AND activities.cycle_id = cycles.id
  AND activities.tour_id = tours.id
WHERE sessions.id = ? AND sessions.owner_id = ?
`;

export class SqliteSessionRepository implements SessionRepository {
  constructor(
    private readonly database: Database,
    private readonly uuidFactory: UuidFactory = Crypto.randomUUID,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async create(input: CreateSessionInput): Promise<Session> {
    const validated = validateCreateSessionInput(input);
    if (!validated.ok) {
      throw new SessionValidationError(validated.violations);
    }
    const normalized = validated.value;
    const sessionId = this.uuidFactory();
    const cycleId = this.uuidFactory();
    const tourId = this.uuidFactory();
    const activityId = this.uuidFactory();
    let created: Session | null = null;

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const timestamp = this.now();
      const user = await getLocalUser(transaction);

      await transaction.runAsync(
        `INSERT INTO sessions (
          id, owner_id, name, color, status,
          initial_countdown_seconds, final_phase_seconds,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)`,
        [
          sessionId,
          user.id,
          normalized.name,
          normalized.color,
          normalized.initialCountdownSeconds,
          normalized.finalPhaseSeconds,
          timestamp,
          timestamp,
        ],
      );

      await transaction.runAsync(
        `INSERT INTO cycles (id, session_id, position, repeat_count)
         VALUES (?, ?, 1, ?)`,
        [cycleId, sessionId, FIXED_CYCLE_REPEAT_COUNT],
      );

      await transaction.runAsync(
        `INSERT INTO tours (id, cycle_id, session_id, position, repeat_count)
         VALUES (?, ?, ?, 1, ?)`,
        [tourId, cycleId, sessionId, FIXED_TOUR_REPEAT_COUNT],
      );

      await transaction.runAsync(
        `INSERT INTO activities (
          id, session_id, cycle_id, tour_id, type, structural_position,
          position, name, execution_mode, duration_seconds,
          repetition_count, series_count, pause_seconds, instruction,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, 'EXERCISE', ?,
          ?, ?, 'DURATION', ?,
          NULL, ?, ?, ?, ?, ?
        )`,
        [
          activityId,
          sessionId,
          cycleId,
          tourId,
          FIXED_ACTIVITY_STRUCTURAL_POSITION,
          FIXED_ACTIVITY_POSITION,
          normalized.exercise.name,
          normalized.exercise.durationSeconds,
          FIXED_SERIES_COUNT,
          FIXED_PAUSE_SECONDS,
          normalized.exercise.instruction ?? null,
          timestamp,
          timestamp,
        ],
      );

      const row = await transaction.getFirstAsync<SessionAggregateRow>(AGGREGATE_QUERY, [
        sessionId,
        user.id,
      ]);
      created = row ? mapSessionRow(row) : null;
    });

    if (!created) {
      throw new Error("The created session could not be read back.");
    }

    return created;
  }

  async update(sessionId: string, input: CreateSessionInput): Promise<UpdateSessionOutcome> {
    const validated = validateCreateSessionInput(input);
    if (!validated.ok) {
      throw new SessionValidationError(validated.violations);
    }
    const normalized = validated.value;

    let outcome: UpdateSessionOutcome = { status: "NOT_FOUND" };

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const timestamp = this.now();
      const user = await getLocalUser(transaction);

      const existingRow = await transaction.getFirstAsync<SessionAggregateRow>(AGGREGATE_QUERY, [
        sessionId,
        user.id,
      ]);
      if (!existingRow) {
        return;
      }
      if (existingRow.status !== "ACTIVE") {
        outcome = { status: "ARCHIVED" };
        return;
      }

      assertT01S01Row(existingRow);
      const activityId = existingRow.activity_id;

      const sessionUpdate = await transaction.runAsync(
        `UPDATE sessions SET name = ?, color = ?, initial_countdown_seconds = ?,
           final_phase_seconds = ?, updated_at = ?
         WHERE id = ? AND owner_id = ?`,
        [
          normalized.name,
          normalized.color,
          normalized.initialCountdownSeconds,
          normalized.finalPhaseSeconds,
          timestamp,
          sessionId,
          user.id,
        ],
      );
      if (sessionUpdate.changes !== 1) {
        throw new Error("Expected exactly one session row to be updated.");
      }

      const activityUpdate = await transaction.runAsync(
        `UPDATE activities SET name = ?, duration_seconds = ?, instruction = ?, updated_at = ?
         WHERE id = ? AND session_id = ?`,
        [
          normalized.exercise.name,
          normalized.exercise.durationSeconds,
          normalized.exercise.instruction ?? null,
          timestamp,
          activityId,
          sessionId,
        ],
      );
      if (activityUpdate.changes !== 1) {
        throw new Error("Expected exactly one activity row to be updated.");
      }

      const reread = await transaction.getFirstAsync<SessionAggregateRow>(AGGREGATE_QUERY, [
        sessionId,
        user.id,
      ]);
      if (
        !reread ||
        reread.session_id !== sessionId ||
        reread.activity_id !== activityId ||
        reread.cycle_id !== existingRow.cycle_id ||
        reread.tour_id !== existingRow.tour_id
      ) {
        throw new Error("The updated session could not be read back coherently.");
      }

      outcome = { status: "UPDATED", session: mapSessionRow(reread) };
    });

    return outcome;
  }

  async findById(sessionId: string): Promise<Session | null> {
    const user = await getLocalUser(this.database);
    const rows = await this.database.getAllAsync<SessionAggregateRow>(AGGREGATE_QUERY, [
      sessionId,
      user.id,
    ]);

    if (rows.length === 0) {
      return null;
    }

    if (rows.length !== 1) {
      throw new Error("T01-S01 sessions must contain exactly one activity.");
    }

    return mapSessionRow(rows[0]);
  }

  async listActive(): Promise<readonly SessionSummary[]> {
    const user = await getLocalUser(this.database);
    const rows = await this.database.getAllAsync<SessionSummaryRow>(
      `SELECT
        sessions.id,
        sessions.name,
        sessions.color,
        COUNT(activities.id) AS activity_count,
        sessions.initial_countdown_seconds,
        sessions.final_phase_seconds,
        SUM(activities.duration_seconds) AS exercise_duration_seconds,
        tours.repeat_count AS tour_repeat_count,
        sessions.updated_at
      FROM sessions
      JOIN cycles ON cycles.session_id = sessions.id
      JOIN tours ON tours.cycle_id = cycles.id AND tours.session_id = sessions.id
      JOIN activities
        ON activities.session_id = sessions.id
        AND activities.cycle_id = cycles.id
        AND activities.tour_id = tours.id
      WHERE sessions.owner_id = ? AND sessions.status = 'ACTIVE'
      GROUP BY sessions.id, tours.id
      ORDER BY COALESCE(sessions.last_executed_at, sessions.updated_at) DESC`,
      [user.id],
    );

    return rows.map(mapSummaryRow);
  }
}

async function getLocalUser(database: Database): Promise<LocalUserRow> {
  const user = await database.getFirstAsync<LocalUserRow>(
    "SELECT id FROM users WHERE singleton_key = ?",
    [LOCAL_USER_SINGLETON_KEY],
  );

  if (!user) {
    throw new Error("The stable local user is missing.");
  }

  return user;
}

export function mapSessionRow(row: SessionAggregateRow): Session {
  assertT01S01Row(row);

  return {
    id: row.session_id,
    ownerId: row.owner_id,
    name: row.session_name,
    color: row.color as SessionColor,
    status: "ACTIVE",
    initialCountdownSeconds: row.initial_countdown_seconds,
    finalPhaseSeconds: row.final_phase_seconds,
    createdAt: row.session_created_at,
    updatedAt: row.session_updated_at,
    cycle: {
      id: row.cycle_id,
      position: 1,
      repeatCount: 1,
      tour: {
        id: row.tour_id,
        position: 1,
        repeatCount: 1,
        exercise: {
          id: row.activity_id,
          type: "EXERCISE",
          executionMode: "DURATION",
          structuralPosition: "IN_TOUR",
          position: 0,
          name: row.activity_name,
          durationSeconds: row.duration_seconds,
          repetitionCount: null,
          seriesCount: 1,
          pauseSeconds: 0,
          instruction: row.instruction,
        },
      },
    },
  };
}

function mapSummaryRow(row: SessionSummaryRow): SessionSummary {
  if (row.activity_count !== 1 || row.tour_repeat_count !== FIXED_TOUR_REPEAT_COUNT) {
    throw new Error("T01-S01 summaries require one activity and one tour repetition.");
  }

  const activityCount = computeActivityCount({
    compositionActivityCount: row.activity_count,
    tourRepeatCount: row.tour_repeat_count,
  });
  const estimatedDurationSeconds = computeEstimatedDurationSeconds({
    initialCountdownSeconds: row.initial_countdown_seconds,
    finalPhaseSeconds: row.final_phase_seconds,
    activityDurationSeconds: row.exercise_duration_seconds,
  });

  return {
    id: row.id,
    name: row.name,
    color: row.color as SessionColor,
    activityCount: activityCount as 1,
    estimatedDurationSeconds,
    tourRepeatCount: 1,
    updatedAt: row.updated_at,
  };
}

function assertT01S01Row(row: SessionAggregateRow): void {
  if (!SESSION_COLORS.includes(row.color as SessionColor)) {
    throw new Error("Persisted session color is invalid.");
  }
  if (
    row.status !== "ACTIVE" ||
    row.cycle_position !== 1 ||
    row.cycle_repeat_count !== FIXED_CYCLE_REPEAT_COUNT ||
    row.tour_position !== 1 ||
    row.tour_repeat_count !== FIXED_TOUR_REPEAT_COUNT ||
    row.structural_position !== FIXED_ACTIVITY_STRUCTURAL_POSITION ||
    row.activity_position !== FIXED_ACTIVITY_POSITION ||
    row.execution_mode !== "DURATION" ||
    row.repetition_count !== null ||
    row.series_count !== FIXED_SERIES_COUNT ||
    row.pause_seconds !== FIXED_PAUSE_SECONDS
  ) {
    throw new Error("Persisted session does not satisfy the T01-S01 aggregate contract.");
  }
}
