import type { Database } from "@/infrastructure/database/Database";
import { applyMigration010 } from "@/infrastructure/database/migrations/migration010";

import { buildVersion9 } from "./buildVersion9";

/**
 * Tests seulement (PRE-6, story 1.1) — « Base v10 » : migrations 001 à 010 du
 * code de départ, telles quelles (`buildVersion9` puis `applyMigration010`
 * dans une transaction, comme le runner), avec l'utilisateur unique ;
 * `user_version = 10`. Point de départ des preuves de `migration011`.
 */
export async function buildVersion10(target: Database, now: () => string = () => "2026-10-01T00:00:00.000Z"): Promise<void> {
  await buildVersion9(target);
  await target.withExclusiveTransactionAsync(async (transaction) => {
    await applyMigration010(transaction, now);
    await transaction.execAsync("PRAGMA user_version = 10");
  });
}
