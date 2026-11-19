import { DEFAULT_ANNOUNCE_ROUNDS_ENABLED } from "@/domain/preferences/Profile";

import type { Database } from "../Database";

/**
 * Annonce des tours (version 31, `migration031`) — D-530 / RM-269 (Hermann, 18/11/2026) : interrupteur « Annonce des tours » du
 * Profil, colonne additive sur `guidance_preferences`, activée par défaut. Même patron que `migration027`. 001..030 inchangées.
 * Un échec laisse `user_version` à 30.
 */
export const MIGRATION_031_ANNOUNCE_ROUNDS = `ALTER TABLE guidance_preferences ADD COLUMN announce_rounds_enabled INTEGER NOT NULL DEFAULT ${DEFAULT_ANNOUNCE_ROUNDS_ENABLED ? 1 : 0} CHECK (announce_rounds_enabled IN (0,1))`;

export async function applyMigration031(transaction: Database): Promise<void> {
  await transaction.execAsync(MIGRATION_031_ANNOUNCE_ROUNDS);
}
