import type { Database } from "@/infrastructure/database/Database";
import { applyMigration011 } from "@/infrastructure/database/migrations/migration011";

import { buildVersion10 } from "./buildVersion10";

/**
 * Tests seulement (PRE-7, A1.2) — « Base v11 » : migrations 001 à 011 du code
 * de départ, telles quelles (`buildVersion10` puis `applyMigration011` dans une
 * transaction, comme le runner), avec l'utilisateur unique ;
 * `user_version = 11`. Point de départ des preuves de `migration012`.
 */
export async function buildVersion11(target: Database, now: () => string = () => "2026-10-01T00:00:00.000Z"): Promise<void> {
  await buildVersion10(target, now);
  await target.withExclusiveTransactionAsync(async (transaction) => {
    await applyMigration011(transaction);
    await transaction.execAsync("PRAGMA user_version = 11");
  });
}
