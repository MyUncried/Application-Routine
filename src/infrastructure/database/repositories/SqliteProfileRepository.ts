import type { Profile } from "@/domain/preferences/Profile";
import type { ProfileRepository } from "@/domain/preferences/ProfileRepository";
import { LOCAL_PROFILE_SINGLETON_KEY } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import type { ProfileRow } from "@/infrastructure/database/types/DatabaseRows";

/**
 * Lecture du Profil singleton (V2-PRE-1, plan §3.2, `migration007`). La ligne
 * unique est semée par la migration elle-même — jamais `null` après
 * initialisation (même garantie que `LOCAL_USER_SINGLETON_KEY`).
 */
export class SqliteProfileRepository implements ProfileRepository {
  constructor(private readonly database: Database) {}

  async get(): Promise<Profile> {
    const row = await this.database.getFirstAsync<ProfileRow>(
      `SELECT singleton_key, side_change_recovery_seconds_default, post_activity_recovery_seconds_default,
              exercise_countdown_seconds_default, exercise_end_seconds_default, updated_at
       FROM profiles
       WHERE singleton_key = ?`,
      [LOCAL_PROFILE_SINGLETON_KEY],
    );
    if (!row) {
      throw new Error("The singleton Profile row is missing — migration007 did not run.");
    }
    return mapProfileRow(row);
  }
}

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: String(row.singleton_key),
    sideChangeRecoverySecondsDefault: row.side_change_recovery_seconds_default,
    postActivityRecoverySecondsDefault: row.post_activity_recovery_seconds_default,
    exerciseCountdownSecondsDefault: row.exercise_countdown_seconds_default,
    exerciseEndSecondsDefault: row.exercise_end_seconds_default,
    updatedAt: row.updated_at,
  };
}
