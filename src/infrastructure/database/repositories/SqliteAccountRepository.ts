import type { AccountLifecycle, AccountLink, AccountStore, LifecycleState } from "@/domain/account/AccountService";

import { LOCAL_USER_SINGLETON_KEY } from "../constants";
import type { Database } from "../Database";

type LinkRow = {
  auth_user_id: string;
  provider: "apple" | "google";
  provider_subject: string;
  email: string | null;
  email_is_private_relay: number;
  given_name: string | null;
  family_name: string | null;
  catalogue_id: string | null;
  linked_at: string;
};

type LifecycleRow = {
  state: LifecycleState;
  deletion_receipt: string | null;
  deleted_provider_subject_hash: string | null;
};

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

/** T1 Compte — stockage local du lien de compte (`migration040`). Ne touche à aucune donnée métier. */
export class SqliteAccountRepository implements AccountStore {
  constructor(private readonly database: Database) {}

  async getLink(): Promise<AccountLink | null> {
    const row = await this.database.getFirstAsync<LinkRow>("SELECT * FROM account_link WHERE singleton_key = 1");
    if (!row) return null;
    return {
      authUserId: row.auth_user_id,
      provider: row.provider,
      providerSubject: row.provider_subject,
      email: row.email,
      emailIsPrivateRelay: row.email_is_private_relay === 1,
      givenName: row.given_name,
      familyName: row.family_name,
      catalogueId: row.catalogue_id,
      linkedAt: row.linked_at,
    };
  }

  async getLifecycle(): Promise<AccountLifecycle> {
    const row = await this.database.getFirstAsync<LifecycleRow>(
      "SELECT state, deletion_receipt, deleted_provider_subject_hash FROM account_lifecycle WHERE singleton_key = 1",
    );
    return {
      state: row?.state ?? "NEVER_LINKED",
      deletionReceipt: row?.deletion_receipt ?? null,
      deletedProviderSubjectHash: row?.deleted_provider_subject_hash ?? null,
    };
  }

  async saveLink(link: AccountLink): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `INSERT INTO account_link (singleton_key, auth_user_id, provider, provider_subject, email, email_is_private_relay,
           given_name, family_name, catalogue_id, linked_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (singleton_key) DO UPDATE SET auth_user_id = excluded.auth_user_id, provider = excluded.provider,
           provider_subject = excluded.provider_subject, email = excluded.email,
           email_is_private_relay = excluded.email_is_private_relay, given_name = excluded.given_name,
           family_name = excluded.family_name, catalogue_id = excluded.catalogue_id, linked_at = excluded.linked_at`,
        [
          link.authUserId,
          link.provider,
          link.providerSubject,
          link.email,
          link.emailIsPrivateRelay ? 1 : 0,
          link.givenName,
          link.familyName,
          link.catalogueId,
          link.linkedAt,
        ],
      );
      await transaction.runAsync(
        `UPDATE account_lifecycle SET state = 'LINKED', deletion_requested_at = NULL, deletion_receipt = NULL,
           deleted_provider_subject_hash = NULL, updated_at = ${NOW} WHERE singleton_key = 1`,
      );
    });
  }

  async setState(state: "REAUTH_REQUIRED" | "LINKED"): Promise<void> {
    await this.database.runAsync(`UPDATE account_lifecycle SET state = ?, updated_at = ${NOW} WHERE singleton_key = 1`, [state]);
  }

  async beginDeletion(receipt: string): Promise<void> {
    await this.database.runAsync(
      `UPDATE account_lifecycle SET state = 'DELETION_PENDING', deletion_receipt = ?,
         deletion_requested_at = COALESCE(deletion_requested_at, ${NOW}), updated_at = ${NOW} WHERE singleton_key = 1`,
      [receipt],
    );
  }

  async completeDeletion(deletedProviderSubjectHash: string): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync("DELETE FROM account_link WHERE singleton_key = 1");
      await transaction.runAsync(
        `UPDATE account_lifecycle SET state = 'DELETED_ON_THIS_DEVICE', deletion_receipt = NULL, deletion_requested_at = NULL,
           deleted_provider_subject_hash = ?, updated_at = ${NOW} WHERE singleton_key = 1`,
        [deletedProviderSubjectHash],
      );
    });
  }

  async hasBusinessData(): Promise<boolean> {
    const row = await this.database.getFirstAsync<{ found: number }>(
      `SELECT (EXISTS (SELECT 1 FROM sessions) OR EXISTS (SELECT 1 FROM routines)
         OR EXISTS (SELECT 1 FROM executions) OR EXISTS (SELECT 1 FROM movements)) AS found`,
    );
    return row?.found === 1;
  }

  async getLocalUserId(): Promise<string> {
    const row = await this.database.getFirstAsync<{ id: string }>("SELECT id FROM users WHERE singleton_key = ?", [
      LOCAL_USER_SINGLETON_KEY,
    ]);
    if (!row) throw new Error("The local user is missing.");
    return row.id;
  }
}
