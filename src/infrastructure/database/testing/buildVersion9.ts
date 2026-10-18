import { canonicalBodyZoneKey } from "@/domain/body-zones/BodyZone";
import { canonicalLabelKey } from "@/domain/labels/Label";
import type { Database } from "@/infrastructure/database/Database";
import { MIGRATION_001 } from "@/infrastructure/database/migrations/migration001";
import { MIGRATION_002 } from "@/infrastructure/database/migrations/migration002";
import { MIGRATION_003 } from "@/infrastructure/database/migrations/migration003";
import { MIGRATION_004 } from "@/infrastructure/database/migrations/migration004";
import { MIGRATION_005 } from "@/infrastructure/database/migrations/migration005";
import { MIGRATION_006 } from "@/infrastructure/database/migrations/migration006";
import { MIGRATION_007 } from "@/infrastructure/database/migrations/migration007";
import { MIGRATION_008_COLUMNS, MIGRATION_008_FINALIZE } from "@/infrastructure/database/migrations/migration008";
import { MIGRATION_009 } from "@/infrastructure/database/migrations/migration009";

/**
 * Tests seulement (AD-10) — « Base v9 » : migrations 001 à 009 du code de
 * départ, telles quelles, rejouées dans une transaction comme le runner,
 * avec l'utilisateur unique ; `user_version = 9`. Partagée par
 * `migration010.test.ts` et les preuves de la story 1.3.
 */
export async function buildVersion9(target: Database): Promise<void> {
  await target.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.execAsync(MIGRATION_001);
    await transaction.runAsync(
      "INSERT INTO users (singleton_key, id, created_at) VALUES (1, 'usr_0123456789abcdef0123456789abcdef', '2026-01-01T00:00:00.000Z')",
    );
    for (const migration of [MIGRATION_002, MIGRATION_003, MIGRATION_004, MIGRATION_005, MIGRATION_006, MIGRATION_007]) {
      await transaction.execAsync(migration);
    }
    await transaction.execAsync(MIGRATION_008_COLUMNS);
    for (const row of await transaction.getAllAsync<{ id: string; name: string }>("SELECT id, name FROM labels")) {
      await transaction.runAsync("UPDATE labels SET canonical_key = ? WHERE id = ?", [canonicalLabelKey(row.name), row.id]);
    }
    for (const row of await transaction.getAllAsync<{ id: string; name: string }>("SELECT id, name FROM body_zones")) {
      await transaction.runAsync("UPDATE body_zones SET canonical_key = ? WHERE id = ?", [canonicalBodyZoneKey(row.name), row.id]);
    }
    await transaction.execAsync(MIGRATION_008_FINALIZE);
    await transaction.execAsync(MIGRATION_009);
    await transaction.execAsync("PRAGMA user_version = 9");
  });
}
