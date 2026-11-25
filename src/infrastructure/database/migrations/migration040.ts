import type { Database } from "../Database";

/**
 * Compte (version 40, `migration040`) — T1 Compte (plan `_bmad-output/compte/plan-lot-compte.md`, CPT-02, CPT-10, CPT-13,
 * CPT-14, CPT-32). Tables additives et singletons : aucune donnée métier modifiée ; `users.id` n'est jamais réécrit.
 * - `account_link` : lien avec le Compte (fournisseur, sujet, e-mail, nom, catalogue), lu hors ligne (É2).
 * - `account_lifecycle` : état du rattachement, reçu de suppression en cours, empreinte de l'identifiant du compte supprimé.
 * 001..039 inchangées. Un échec laisse `user_version` à 39.
 */
export const MIGRATION_040_ACCOUNT = `
CREATE TABLE IF NOT EXISTS account_link (
  singleton_key INTEGER PRIMARY KEY CHECK (singleton_key = 1),
  auth_user_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('apple', 'google')),
  provider_subject TEXT NOT NULL,
  email TEXT,
  email_is_private_relay INTEGER NOT NULL DEFAULT 0 CHECK (email_is_private_relay IN (0, 1)),
  given_name TEXT,
  family_name TEXT,
  catalogue_id TEXT,
  linked_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS account_lifecycle (
  singleton_key INTEGER PRIMARY KEY CHECK (singleton_key = 1),
  state TEXT NOT NULL DEFAULT 'NEVER_LINKED'
    CHECK (state IN ('NEVER_LINKED', 'LINKED', 'REAUTH_REQUIRED', 'DELETION_PENDING', 'DELETED_ON_THIS_DEVICE')),
  deletion_requested_at TEXT,
  deletion_receipt TEXT,
  deleted_provider_subject_hash TEXT,
  updated_at TEXT NOT NULL
);
INSERT OR IGNORE INTO account_lifecycle (singleton_key, state, updated_at)
VALUES (1, 'NEVER_LINKED', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
`;

export async function applyMigration040(transaction: Database): Promise<void> {
  await transaction.execAsync(MIGRATION_040_ACCOUNT);
}
