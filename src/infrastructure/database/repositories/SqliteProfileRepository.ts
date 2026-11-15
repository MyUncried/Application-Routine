import { parseGuidanceEvents, serializeGuidanceEvents, type EventGuidance, type GuidanceEvent } from "@/domain/preferences/guidanceSettings";
import {
  DEFAULT_ANNOUNCE_OBJECTIVE_ENABLED,
  DEFAULT_ANNOUNCE_PAUSES_ENABLED,
  DEFAULT_ANNOUNCE_PHASES_ENABLED,
  DEFAULT_ANNOUNCE_SESSION_ENABLED,
  DEFAULT_ANNOUNCE_SIDES_ENABLED,
  type Profile,
  type ProfileDurationSetting,
} from "@/domain/preferences/Profile";
import type {
  ProfileIdentityInput,
  ProfilePreference,
  ProfileRepository,
} from "@/domain/preferences/ProfileRepository";
import { LOCAL_PROFILE_SINGLETON_KEY } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import type { ProfileRow } from "@/infrastructure/database/types/DatabaseRows";

const SELECT_COLUMNS = `
  p.singleton_key, p.side_change_recovery_seconds_default, p.post_activity_recovery_seconds_default,
  p.exercise_countdown_seconds_default, p.exercise_end_seconds_default,
  p.session_initial_countdown_seconds_default, p.session_final_phase_seconds_default,
  p.sounds_enabled, p.voice_announcements_enabled, p.vibration_enabled, p.notifications_enabled,
  COALESCE(g.announce_objective_enabled, ${DEFAULT_ANNOUNCE_OBJECTIVE_ENABLED ? 1 : 0}) AS announce_objective_enabled,
  COALESCE(g.announce_pauses_enabled, ${DEFAULT_ANNOUNCE_PAUSES_ENABLED ? 1 : 0}) AS announce_pauses_enabled,
  COALESCE(g.announce_session_enabled, ${DEFAULT_ANNOUNCE_SESSION_ENABLED ? 1 : 0}) AS announce_session_enabled,
  COALESCE(g.announce_sides_enabled, ${DEFAULT_ANNOUNCE_SIDES_ENABLED ? 1 : 0}) AS announce_sides_enabled,
  COALESCE(g.announce_phases_enabled, ${DEFAULT_ANNOUNCE_PHASES_ENABLED ? 1 : 0}) AS announce_phases_enabled,
  g.events_json AS guidance_events_json,
  p.display_name, p.photo_uri, p.silhouette, p.updated_at
`;

/** Préférences de guidage (`migration025`), table singleton dédiée jointe au Profil. */
const FROM_PROFILE = "profiles p LEFT JOIN guidance_preferences g ON g.singleton_key = p.singleton_key";

/** Colonne SQL de chaque réglage de durée — jamais une concaténation de nom d'origine utilisateur (clé fermée, `ProfileDurationSetting`). */
const DURATION_SETTING_COLUMNS: Readonly<Record<ProfileDurationSetting, string>> = {
  sideChangeRecoverySecondsDefault: "side_change_recovery_seconds_default",
  postActivityRecoverySecondsDefault: "post_activity_recovery_seconds_default",
  exerciseCountdownSecondsDefault: "exercise_countdown_seconds_default",
  exerciseEndSecondsDefault: "exercise_end_seconds_default",
  sessionInitialCountdownSecondsDefault: "session_initial_countdown_seconds_default",
  sessionFinalPhaseSecondsDefault: "session_final_phase_seconds_default",
};

/** Colonne SQL de chaque préférence de `profiles` — même garde que ci-dessus. */
const PREFERENCE_COLUMNS: Readonly<Record<Exclude<ProfilePreference, GuidancePreference>, string>> = {
  soundsEnabled: "sounds_enabled",
  voiceAnnouncementsEnabled: "voice_announcements_enabled",
  vibrationEnabled: "vibration_enabled",
  notificationsEnabled: "notifications_enabled",
};

/** Préférences rangées dans `guidance_preferences` (suite PRE-10 son et voix, `migration025`). */
type GuidancePreference = "announceObjectiveEnabled" | "announcePausesEnabled" | "announceSessionEnabled" | "announceSidesEnabled" | "announcePhasesEnabled";
const GUIDANCE_COLUMNS: Readonly<Record<GuidancePreference, string>> = {
  announceObjectiveEnabled: "announce_objective_enabled",
  announcePausesEnabled: "announce_pauses_enabled",
  announceSessionEnabled: "announce_session_enabled",
  announceSidesEnabled: "announce_sides_enabled",
  announcePhasesEnabled: "announce_phases_enabled",
};

function isGuidancePreference(preference: ProfilePreference): preference is GuidancePreference {
  return preference in GUIDANCE_COLUMNS;
}

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
      `SELECT ${SELECT_COLUMNS} FROM ${FROM_PROFILE} WHERE p.singleton_key = ?`,
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
    const timestamp = this.now();
    if (isGuidancePreference(preference)) {
      const guidanceColumn = GUIDANCE_COLUMNS[preference];
      await this.database.runAsync(
        `INSERT INTO guidance_preferences (singleton_key, ${guidanceColumn}, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(singleton_key) DO UPDATE SET ${guidanceColumn} = excluded.${guidanceColumn}, updated_at = excluded.updated_at`,
        [LOCAL_PROFILE_SINGLETON_KEY, value ? 1 : 0, timestamp],
      );
      return this.get();
    }
    const column = PREFERENCE_COLUMNS[preference];
    await this.database.runAsync(
      `UPDATE profiles SET ${column} = ?, updated_at = ? WHERE singleton_key = ?`,
      [value ? 1 : 0, timestamp, LOCAL_PROFILE_SINGLETON_KEY],
    );
    return this.get();
  }

  /** Son et vibration d'un événement (`migration029`) ; les huit autres restent inchangés. */
  async updateGuidanceEvent(event: GuidanceEvent, setting: EventGuidance): Promise<Profile> {
    const current = await this.get();
    const events = serializeGuidanceEvents({ ...current.guidanceEvents, [event]: { sound: setting.sound, vibration: setting.vibration } });
    await this.database.runAsync(
      `INSERT INTO guidance_preferences (singleton_key, events_json, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(singleton_key) DO UPDATE SET events_json = excluded.events_json, updated_at = excluded.updated_at`,
      [LOCAL_PROFILE_SINGLETON_KEY, events, this.now()],
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
    announceObjectiveEnabled: row.announce_objective_enabled === 1,
    announcePausesEnabled: row.announce_pauses_enabled === 1,
    announceSessionEnabled: row.announce_session_enabled === 1,
    announceSidesEnabled: row.announce_sides_enabled === 1,
    announcePhasesEnabled: row.announce_phases_enabled === 1,
    guidanceEvents: parseGuidanceEvents(row.guidance_events_json),
    displayName: row.display_name,
    photoUri: row.photo_uri,
    silhouette: row.silhouette,
    updatedAt: row.updated_at,
  };
}
