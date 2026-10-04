import type { Profile, ProfileDurationSetting } from "@/domain/preferences/Profile";
import type {
  ProfileIdentityInput,
  ProfilePreference,
  ProfileRepository,
} from "@/domain/preferences/ProfileRepository";
import { LOCAL_PROFILE_SINGLETON_KEY } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import type { ProfileRow } from "@/infrastructure/database/types/DatabaseRows";

const SELECT_COLUMNS = `
  singleton_key, side_change_recovery_seconds_default, post_activity_recovery_seconds_default,
  exercise_countdown_seconds_default, exercise_end_seconds_default,
  session_initial_countdown_seconds_default, session_final_phase_seconds_default,
  sounds_enabled, voice_announcements_enabled, vibration_enabled, notifications_enabled,
  display_name, photo_uri, silhouette, updated_at
`;

/** Colonne SQL de chaque réglage de durée — jamais une concaténation de nom d'origine utilisateur (clé fermée, `ProfileDurationSetting`). */
const DURATION_SETTING_COLUMNS: Readonly<Record<ProfileDurationSetting, string>> = {
  sideChangeRecoverySecondsDefault: "side_change_recovery_seconds_default",
  postActivityRecoverySecondsDefault: "post_activity_recovery_seconds_default",
  exerciseCountdownSecondsDefault: "exercise_countdown_seconds_default",
  exerciseEndSecondsDefault: "exercise_end_seconds_default",
  sessionInitialCountdownSecondsDefault: "session_initial_countdown_seconds_default",
  sessionFinalPhaseSecondsDefault: "session_final_phase_seconds_default",
};

/** Colonne SQL de chaque préférence — même garde que ci-dessus. */
const PREFERENCE_COLUMNS: Readonly<Record<ProfilePreference, string>> = {
  soundsEnabled: "sounds_enabled",
  voiceAnnouncementsEnabled: "voice_announcements_enabled",
  vibrationEnabled: "vibration_enabled",
  notificationsEnabled: "notifications_enabled",
};

/**
 * Lecture et mise à jour du Profil singleton (V2-PRE-1, plan §3.2,
 * `migration007` ; V2-PRE-2, plan §6.1/§6.3, `migration008`). La ligne
 * unique est semée par `migration007` — jamais `null` après initialisation.
 * Chaque opération d'écriture est une seule instruction `UPDATE` ciblée (une
 * seule colonne pour `updateDefault`/`updatePreference`, trois pour
 * `updateIdentity`) : les autres réglages restent inchangés par
 * construction, sans lecture-modification-écriture séparée.
 */
export class SqliteProfileRepository implements ProfileRepository {
  constructor(
    private readonly database: Database,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async get(): Promise<Profile> {
    const row = await this.database.getFirstAsync<ProfileRow>(
      `SELECT ${SELECT_COLUMNS} FROM profiles WHERE singleton_key = ?`,
      [LOCAL_PROFILE_SINGLETON_KEY],
    );
    if (!row) {
      throw new Error("The singleton Profile row is missing — migration007 did not run.");
    }
    return mapProfileRow(row);
  }

  async updateDefault(setting: ProfileDurationSetting, value: number): Promise<Profile> {
    const column = DURATION_SETTING_COLUMNS[setting];
    const timestamp = this.now();
    await this.database.runAsync(
      `UPDATE profiles SET ${column} = ?, updated_at = ? WHERE singleton_key = ?`,
      [value, timestamp, LOCAL_PROFILE_SINGLETON_KEY],
    );
    return this.get();
  }

  async updatePreference(preference: ProfilePreference, value: boolean): Promise<Profile> {
    const column = PREFERENCE_COLUMNS[preference];
    const timestamp = this.now();
    await this.database.runAsync(
      `UPDATE profiles SET ${column} = ?, updated_at = ? WHERE singleton_key = ?`,
      [value ? 1 : 0, timestamp, LOCAL_PROFILE_SINGLETON_KEY],
    );
    return this.get();
  }

  async updateIdentity(input: ProfileIdentityInput): Promise<Profile> {
    const timestamp = this.now();
    await this.database.runAsync(
      `UPDATE profiles SET display_name = ?, photo_uri = ?, silhouette = ?, updated_at = ? WHERE singleton_key = ?`,
      [input.displayName, input.photoUri, input.silhouette, timestamp, LOCAL_PROFILE_SINGLETON_KEY],
    );
    return this.get();
  }
}

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: String(row.singleton_key),
    sideChangeRecoverySecondsDefault: row.side_change_recovery_seconds_default,
    postActivityRecoverySecondsDefault: row.post_activity_recovery_seconds_default,
    exerciseCountdownSecondsDefault: row.exercise_countdown_seconds_default,
    exerciseEndSecondsDefault: row.exercise_end_seconds_default,
    sessionInitialCountdownSecondsDefault: row.session_initial_countdown_seconds_default,
    sessionFinalPhaseSecondsDefault: row.session_final_phase_seconds_default,
    soundsEnabled: row.sounds_enabled === 1,
    voiceAnnouncementsEnabled: row.voice_announcements_enabled === 1,
    vibrationEnabled: row.vibration_enabled === 1,
    notificationsEnabled: row.notifications_enabled === 1,
    displayName: row.display_name,
    photoUri: row.photo_uri,
    silhouette: row.silhouette,
    updatedAt: row.updated_at,
  };
}
