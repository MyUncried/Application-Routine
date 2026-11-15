import type { Database } from "../Database";

/**
 * Fin de PRE-10 (version 28, `migration028`) — guidage propre à une Séance (spec `spec-guidage-reglages` §3.2,
 * validée par Hermann le 10/11/2026) : trois colonnes additives nullables sur `sessions` ; `NULL` = comme le Profil.
 * Séances existantes : `NULL` partout, donc inchangées. 001..027 inchangées. Un échec laisse `user_version` à 27.
 */
export const MIGRATION_028_SESSION_GUIDANCE = [
  "ALTER TABLE sessions ADD COLUMN guidance_sounds_enabled INTEGER NULL CHECK (guidance_sounds_enabled IN (0,1))",
  "ALTER TABLE sessions ADD COLUMN guidance_voice_enabled INTEGER NULL CHECK (guidance_voice_enabled IN (0,1))",
  "ALTER TABLE sessions ADD COLUMN guidance_announce_objective INTEGER NULL CHECK (guidance_announce_objective IN (0,1))",
] as const;

export async function applyMigration028(transaction: Database): Promise<void> {
  for (const statement of MIGRATION_028_SESSION_GUIDANCE) await transaction.execAsync(statement);
}
