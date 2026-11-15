import { DEFAULT_ANNOUNCE_OBJECTIVE_ENABLED } from "@/domain/preferences/Profile";

import type { Database } from "../Database";

/**
 * Suite PRE-10 son et voix (version 25, `migration025`, spec `spec-guidage-reglages` §3.1) — préférences de
 * guidage du Profil, dans une table singleton dédiée : « Annoncer les répétitions ou la durée », activée par
 * défaut. La table accueillera les réglages de guidage suivants (guidage écran verrouillé, §3.5).
 *
 * Migration additive : une table nouvelle, aucune table existante modifiée (`profiles` reste inchangée).
 * 001..024 inchangées. La transaction de `migrateDatabase.ts` est exclusive et unique : un échec laisse
 * `user_version` à 24.
 */
export const MIGRATION_025_GUIDANCE_PREFERENCES = `CREATE TABLE guidance_preferences (
  singleton_key INTEGER PRIMARY KEY NOT NULL CHECK (singleton_key = 1),
  announce_objective_enabled INTEGER NOT NULL DEFAULT ${DEFAULT_ANNOUNCE_OBJECTIVE_ENABLED ? 1 : 0} CHECK (announce_objective_enabled IN (0,1)),
  updated_at TEXT NOT NULL
)`;

export async function applyMigration025(transaction: Database): Promise<void> {
  await transaction.execAsync(MIGRATION_025_GUIDANCE_PREFERENCES);
}
