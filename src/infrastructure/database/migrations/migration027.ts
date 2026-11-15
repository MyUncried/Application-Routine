import { DEFAULT_ANNOUNCE_PHASES_ENABLED } from "@/domain/preferences/Profile";

import type { Database } from "../Database";

/**
 * Suite PRE-10 son et voix (version 27, `migration027`) — recette du 10/11/2026 (constat B) : préférence « Annoncer
 * les phases du mouvement », colonne additive sur `guidance_preferences`, activée par défaut. 001..026
 * inchangées. Un échec laisse `user_version` à 26.
 */
export const MIGRATION_027_ANNOUNCE_PHASES = `ALTER TABLE guidance_preferences ADD COLUMN announce_phases_enabled INTEGER NOT NULL DEFAULT ${DEFAULT_ANNOUNCE_PHASES_ENABLED ? 1 : 0} CHECK (announce_phases_enabled IN (0,1))`;

export async function applyMigration027(transaction: Database): Promise<void> {
  await transaction.execAsync(MIGRATION_027_ANNOUNCE_PHASES);
}
