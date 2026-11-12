import {
  DEFAULT_ANNOUNCE_PAUSES_ENABLED,
  DEFAULT_ANNOUNCE_SESSION_ENABLED,
  DEFAULT_ANNOUNCE_SIDES_ENABLED,
} from "@/domain/preferences/Profile";

import type { Database } from "../Database";

/**
 * Suite PRE-10 son et voix (version 26, `migration026`) — catégories d'annonces séparées, décision de Hermann du
 * 10/11/2026 (« Il faut séparer : noms d'exercices ; pauses / récupérations / point d'arrêt ; début / fin de
 * séance ; changements de côté »). Trois colonnes additives sur `guidance_preferences`, activées par défaut.
 * 001..025 inchangées. Un échec laisse `user_version` à 25.
 */
const column = (name: string, enabled: boolean) =>
  `ALTER TABLE guidance_preferences ADD COLUMN ${name} INTEGER NOT NULL DEFAULT ${enabled ? 1 : 0} CHECK (${name} IN (0,1))`;

export const MIGRATION_026_ANNOUNCEMENT_CATEGORIES: readonly string[] = [
  column("announce_pauses_enabled", DEFAULT_ANNOUNCE_PAUSES_ENABLED),
  column("announce_session_enabled", DEFAULT_ANNOUNCE_SESSION_ENABLED),
  column("announce_sides_enabled", DEFAULT_ANNOUNCE_SIDES_ENABLED),
];

export async function applyMigration026(transaction: Database): Promise<void> {
  for (const statement of MIGRATION_026_ANNOUNCEMENT_CATEGORIES) await transaction.execAsync(statement);
}
