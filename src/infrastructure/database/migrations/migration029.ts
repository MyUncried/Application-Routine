import type { Database } from "../Database";

/**
 * Guidage sonore par événement (version 29, `migration029`) — documentation publiée sur main `ebe72f76` (RM-087,
 * CE-UI-07), demande de Hermann du 11/11/2026 (cahier, constat d) :
 * - `guidance_preferences.events_json` : son et vibration des neuf événements du Profil, `NULL` = valeurs par défaut ;
 * - `sessions.guidance_settings` : réglages validés dans la modale de Composition, `NULL` = comme le Profil.
 * Les colonnes `sessions.guidance_*` de `migration028` ne sont plus lues. 001..028 inchangées. Un échec laisse
 * `user_version` à 28.
 */
export const MIGRATION_029_GUIDANCE_EVENTS = [
  "ALTER TABLE guidance_preferences ADD COLUMN events_json TEXT NULL",
  "ALTER TABLE sessions ADD COLUMN guidance_settings TEXT NULL",
] as const;

export async function applyMigration029(transaction: Database): Promise<void> {
  for (const statement of MIGRATION_029_GUIDANCE_EVENTS) await transaction.execAsync(statement);
}
