import type {
  MigrationNotice,
  MigrationNoticeKind,
  MigrationNoticeRepository,
} from "@/domain/migration/MigrationNotice";
import type { Database } from "@/infrastructure/database/Database";
import type { MigrationNoticeRow } from "@/infrastructure/database/types/DatabaseRows";

/**
 * PRE-4 (story 1.1, AD-12) : lecture et acquittement des avis de migration
 * (`migration_notices`, créée par `migration010`). Exposé par
 * `SessionServiceProvider` ; seul `MigrationNoticeGate` le lit (story 1.2).
 * `now` injectable pour les tests (dates ISO 8601 UTC, comme les autres
 * `created_at`).
 */
export class SqliteMigrationNoticeRepository implements MigrationNoticeRepository {
  constructor(
    private readonly database: Database,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async findUnacknowledged(): Promise<MigrationNotice | null> {
    const row = await this.database.getFirstAsync<MigrationNoticeRow>(
      `SELECT id, kind, count, created_at, acknowledged_at FROM migration_notices
       WHERE acknowledged_at IS NULL ORDER BY id ASC LIMIT 1`,
    );
    return row ? mapMigrationNoticeRow(row) : null;
  }

  async acknowledge(id: number): Promise<void> {
    await this.database.runAsync(
      "UPDATE migration_notices SET acknowledged_at = ? WHERE id = ? AND acknowledged_at IS NULL",
      [this.now(), id],
    );
  }
}

function mapMigrationNoticeRow(row: MigrationNoticeRow): MigrationNotice {
  return {
    id: row.id,
    kind: row.kind as MigrationNoticeKind,
    count: row.count,
    createdAt: row.created_at,
    acknowledgedAt: row.acknowledged_at,
  };
}
