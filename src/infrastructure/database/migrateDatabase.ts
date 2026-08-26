import { DATABASE_VERSION, LOCAL_USER_SINGLETON_KEY } from "./constants";
import type { Database } from "./Database";
import { MIGRATION_001 } from "./migrations/migration001";

type UserVersionRow = { user_version: number };
type CountRow = { count: number };

export async function migrateDatabase(database: Database): Promise<void> {
  const versionRow = await database.getFirstAsync<UserVersionRow>("PRAGMA user_version");
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion > DATABASE_VERSION) {
    throw new Error(
      `Database version ${currentVersion} is newer than supported version ${DATABASE_VERSION}.`,
    );
  }

  if (currentVersion === DATABASE_VERSION) {
    return;
  }

  await database.withExclusiveTransactionAsync(async (transaction) => {
    if (currentVersion === 0) {
      await transaction.execAsync(MIGRATION_001);
      await transaction.runAsync(
        `INSERT OR IGNORE INTO users (singleton_key, id, created_at)
         VALUES (?, 'usr_' || lower(hex(randomblob(16))), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        [LOCAL_USER_SINGLETON_KEY],
      );
    }

    const userCount = await transaction.getFirstAsync<CountRow>(
      "SELECT COUNT(*) AS count FROM users WHERE singleton_key = ?",
      [LOCAL_USER_SINGLETON_KEY],
    );

    if (userCount?.count !== 1) {
      throw new Error("The local user could not be initialized.");
    }

    await transaction.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}
