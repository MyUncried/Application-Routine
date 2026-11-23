import { DEFAULT_ANNOUNCE_ROUNDS_ENABLED } from "@/domain/preferences/Profile";

import type { Database } from "../Database";

type ColumnRow = { name: string };

/**
 * Annonce des tours (version 39, `migration039`) — D-530 / RM-269 (Hermann, 18/11/2026) : interrupteur « Annonce des tours » du
 * Profil, colonne additive sur `guidance_preferences`, activée par défaut. Même patron que `migration027`.
 * Développée comme version 31 sur la branche Formats (PRE-11) ; renumérotée 39 à la consolidation du 24/11/2026
 * (CONSOLIDATION-2411), la version 31 étant déjà prise par la ligne Planification/Programmes. Sans effet si la colonne existe
 * déjà (base passée par la version 31 de la branche Formats). 001..038 inchangées. Un échec laisse `user_version` à 38.
 */
export const MIGRATION_039_ANNOUNCE_ROUNDS = `ALTER TABLE guidance_preferences ADD COLUMN announce_rounds_enabled INTEGER NOT NULL DEFAULT ${DEFAULT_ANNOUNCE_ROUNDS_ENABLED ? 1 : 0} CHECK (announce_rounds_enabled IN (0,1))`;

export async function applyMigration039(transaction: Database): Promise<void> {
  const columns = await transaction.getAllAsync<ColumnRow>("PRAGMA table_info(guidance_preferences)");
  if (columns.some((column) => column.name === "announce_rounds_enabled")) return;
  await transaction.execAsync(MIGRATION_039_ANNOUNCE_ROUNDS);
}
