import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteAccountRepository } from "@/infrastructure/database/repositories/SqliteAccountRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

type CountRow = { count: number };

const LINK = {
  authUserId: "00000000-0000-0000-0000-00000000000a",
  provider: "apple" as const,
  providerSubject: "sub-x",
  email: "abc@privaterelay.appleid.com",
  emailIsPrivateRelay: true,
  givenName: "Hermann",
  familyName: null,
  catalogueId: "cat-1",
  linkedAt: "2026-11-25T10:00:00.000Z",
};

describe("migration041 — compte (T1)", () => {
  it("base neuve : version 41, état NEVER_LINKED, aucun lien", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(41);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 41 });
    const accounts = new SqliteAccountRepository(database);
    expect(await accounts.getLink()).toBeNull();
    expect(await accounts.getLifecycle()).toEqual({ state: "NEVER_LINKED", deletionReceipt: null, deletedProviderSubjectHash: null });
    expect(await accounts.hasBusinessData()).toBe(false);
  });

  it("mise à niveau d'une base peuplée (version 40) : lignes et identifiant local conservés", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 40);
    const user = await database.getFirstAsync<{ id: string }>("SELECT id FROM users WHERE singleton_key = 1");
    await database.runAsync(
      "INSERT INTO sessions (id, owner_id, name, created_at, updated_at) VALUES ('ses_1', ?, 'Jambes', 't', 't')",
      [user!.id],
    );
    const tables = ["sessions", "users", "routines", "executions", "movements", "categories"];
    const before: Record<string, number> = {};
    for (const table of tables) before[table] = (await database.getFirstAsync<CountRow>(`SELECT COUNT(*) AS count FROM ${table}`))!.count;

    await migrateDatabase(database);

    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 41 });
    for (const table of tables) {
      expect((await database.getFirstAsync<CountRow>(`SELECT COUNT(*) AS count FROM ${table}`))!.count).toBe(before[table]);
    }
    const accounts = new SqliteAccountRepository(database);
    expect(await accounts.getLocalUserId()).toBe(user!.id);
    expect(await accounts.hasBusinessData()).toBe(true);
  });

  it("dépôt : lien, suppression en suspens, suppression achevée (lien effacé, empreinte conservée)", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    const accounts = new SqliteAccountRepository(database);
    await accounts.saveLink(LINK);
    expect(await accounts.getLink()).toEqual(LINK);
    expect((await accounts.getLifecycle()).state).toBe("LINKED");

    await accounts.beginDeletion("receipt-1");
    expect(await accounts.getLifecycle()).toEqual({ state: "DELETION_PENDING", deletionReceipt: "receipt-1", deletedProviderSubjectHash: null });
    expect(await accounts.getLink()).toEqual(LINK);

    await accounts.completeDeletion("hash-x");
    expect(await accounts.getLink()).toBeNull();
    expect(await accounts.getLifecycle()).toEqual({ state: "DELETED_ON_THIS_DEVICE", deletionReceipt: null, deletedProviderSubjectHash: "hash-x" });

    await accounts.saveLink({ ...LINK, authUserId: "00000000-0000-0000-0000-00000000000b" });
    expect(await accounts.getLifecycle()).toEqual({ state: "LINKED", deletionReceipt: null, deletedProviderSubjectHash: null });

    await accounts.setState("REAUTH_REQUIRED");
    expect((await accounts.getLifecycle()).state).toBe("REAUTH_REQUIRED");
  });
});
