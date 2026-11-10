/**
 * CA-3 — Registre d'installation des catalogues, dans une base SQLite distincte et provisoire
 * (`kodjo-catalogue-registry.db`, décision de Hermann du 10/11/2026). Indépendant de la base
 * principale : aucune migration de son schéma (`DATABASE_VERSION` inchangé). Son intégration
 * éventuelle sera réévaluée après PRE-10, sans engagement automatique.
 *
 * Cohérence entre les deux bases (pas de transaction commune) : une écriture de Mouvement est
 * précédée d'une opération `pending`, puis confirmée en une seule transaction du registre
 * (`commit`). Les lectures se font dans une transaction exclusive : avec expo-sqlite, la
 * connexion principale peut relire un instantané antérieur juste après une transaction
 * (incident « could not be read back » du 9/11).
 */
import type { Movement } from "@/domain/activities/Movement";
import type { CatalogueSheet } from "@/domain/catalogue/MovementCatalogueFile";
import type {
  InstalledSheetRecord,
  PendingOperation,
  RegistrySnapshot,
  SavedLocalValue,
  SheetDecision,
  SheetDecisionRecord,
  SheetKey,
} from "@/domain/catalogue/catalogueLoadPlan";
import type { Database } from "@/infrastructure/database/Database";

export const CATALOGUE_REGISTRY_DATABASE_NAME = "kodjo-catalogue-registry.db";
export const CATALOGUE_REGISTRY_SCHEMA_VERSION = 1;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS installed_sheets (
  catalogue_id TEXT NOT NULL,
  sheet_id TEXT NOT NULL,
  movement_id TEXT NOT NULL UNIQUE,
  revision TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  sheet_json TEXT NOT NULL,
  installed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (catalogue_id, sheet_id)
);
CREATE TABLE IF NOT EXISTS pending_operations (
  catalogue_id TEXT NOT NULL,
  sheet_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('INSTALL', 'UPDATE')),
  movement_id TEXT NOT NULL,
  sheet_json TEXT NOT NULL,
  movement_json TEXT NOT NULL,
  saved_local_values_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (catalogue_id, sheet_id)
);
CREATE TABLE IF NOT EXISTS sheet_decisions (
  catalogue_id TEXT NOT NULL,
  sheet_id TEXT NOT NULL,
  revision TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('REFUSED', 'DEFERRED')),
  decided_at TEXT NOT NULL,
  PRIMARY KEY (catalogue_id, sheet_id, revision)
);
CREATE TABLE IF NOT EXISTS saved_local_values (
  catalogue_id TEXT NOT NULL,
  sheet_id TEXT NOT NULL,
  revision TEXT NOT NULL,
  field TEXT NOT NULL,
  value_json TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  PRIMARY KEY (catalogue_id, sheet_id, revision, field)
);`;

type InstalledRow = {
  catalogue_id: string; sheet_id: string; movement_id: string; revision: string; fingerprint: string;
  sheet_json: string; installed_at: string; updated_at: string;
};
type PendingRow = {
  catalogue_id: string; sheet_id: string; kind: "INSTALL" | "UPDATE"; movement_id: string;
  sheet_json: string; movement_json: string; saved_local_values_json: string; created_at: string;
};
type DecisionRow = { catalogue_id: string; sheet_id: string; revision: string; decision: SheetDecision; decided_at: string };

/** Confirmation atomique : B devient la fiche installée, l'opération en cours et les décisions de la fiche disparaissent. */
export type RegistryCommit = SheetKey & {
  readonly movementId: string;
  readonly revision: string;
  readonly fingerprint: string;
  readonly sheet: CatalogueSheet;
  readonly savedLocalValues: readonly SavedLocalValue[];
};

export class SqliteCatalogueRegistry {
  private constructor(
    private readonly database: Database,
    private readonly now: () => string,
  ) {}

  /** Ouvre le registre sur une base distincte et crée son schéma si nécessaire. */
  static async open(database: Database, now: () => string = () => new Date().toISOString()): Promise<SqliteCatalogueRegistry> {
    const row = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    const version = row?.user_version ?? 0;
    if (version > CATALOGUE_REGISTRY_SCHEMA_VERSION) {
      throw new Error("Registre de catalogue d'une version plus récente (" + version + ") : aucune écriture.");
    }
    if (version < CATALOGUE_REGISTRY_SCHEMA_VERSION) {
      await database.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.execAsync(SCHEMA);
        await transaction.execAsync("PRAGMA user_version = " + CATALOGUE_REGISTRY_SCHEMA_VERSION);
      });
    }
    return new SqliteCatalogueRegistry(database, now);
  }

  /** Instantané complet d'un catalogue, lu dans une transaction (lecture fraîche). */
  async snapshot(catalogueId: string): Promise<RegistrySnapshot> {
    let result: RegistrySnapshot = { installed: [], pending: [], decisions: [] };
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const installed = await transaction.getAllAsync<InstalledRow>(
        "SELECT * FROM installed_sheets WHERE catalogue_id = ? ORDER BY sheet_id", [catalogueId]);
      const pending = await transaction.getAllAsync<PendingRow>(
        "SELECT * FROM pending_operations WHERE catalogue_id = ? ORDER BY sheet_id", [catalogueId]);
      const decisions = await transaction.getAllAsync<DecisionRow>(
        "SELECT * FROM sheet_decisions WHERE catalogue_id = ? ORDER BY sheet_id, revision", [catalogueId]);
      // Identifiants de Mouvement de tous les catalogues : un Mouvement n'est rattaché qu'à une fiche.
      const others = await transaction.getAllAsync<InstalledRow>(
        "SELECT * FROM installed_sheets WHERE catalogue_id <> ?", [catalogueId]);
      result = {
        installed: [...installed, ...others].map(toInstalled),
        pending: pending.map(toPending),
        decisions: decisions.map(toDecision),
      };
    });
    return result;
  }

  /** Étape 1 d'une écriture de Mouvement : l'intention est durable avant l'écriture. */
  async beginPending(operation: Omit<PendingOperation, "createdAt">): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `INSERT INTO pending_operations
           (catalogue_id, sheet_id, kind, movement_id, sheet_json, movement_json, saved_local_values_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [operation.catalogueId, operation.sheetId, operation.kind, operation.movementId,
          JSON.stringify(operation.sheet), JSON.stringify(operation.movement),
          JSON.stringify(operation.savedLocalValues), this.now()],
      );
    });
  }

  /** Abandon d'une opération dont l'écriture n'a pas eu lieu (aucune autre donnée modifiée). */
  async abandonPending(key: SheetKey): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync("DELETE FROM pending_operations WHERE catalogue_id = ? AND sheet_id = ?",
        [key.catalogueId, key.sheetId]);
    });
  }

  /** Étape finale, en une transaction : fiche installée, valeurs locales sauvegardées, décisions levées. */
  async commit(entry: RegistryCommit): Promise<void> {
    const timestamp = this.now();
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const key = [entry.catalogueId, entry.sheetId];
      await transaction.runAsync("DELETE FROM pending_operations WHERE catalogue_id = ? AND sheet_id = ?", key);
      await transaction.runAsync(
        `INSERT INTO installed_sheets
           (catalogue_id, sheet_id, movement_id, revision, fingerprint, sheet_json, installed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (catalogue_id, sheet_id) DO UPDATE SET
           movement_id = excluded.movement_id, revision = excluded.revision,
           fingerprint = excluded.fingerprint, sheet_json = excluded.sheet_json, updated_at = excluded.updated_at`,
        [entry.catalogueId, entry.sheetId, entry.movementId, entry.revision, entry.fingerprint,
          JSON.stringify(entry.sheet), timestamp, timestamp],
      );
      for (const saved of entry.savedLocalValues) {
        await transaction.runAsync(
          `INSERT OR REPLACE INTO saved_local_values (catalogue_id, sheet_id, revision, field, value_json, saved_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [entry.catalogueId, entry.sheetId, entry.revision, saved.field, JSON.stringify(saved.value), timestamp],
        );
      }
      await transaction.runAsync("DELETE FROM sheet_decisions WHERE catalogue_id = ? AND sheet_id = ?", key);
    });
  }

  /** Refus ou report d'une révision, par le destinataire. */
  async recordDecision(key: SheetKey, revision: string, decision: SheetDecision): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `INSERT INTO sheet_decisions (catalogue_id, sheet_id, revision, decision, decided_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (catalogue_id, sheet_id, revision) DO UPDATE SET decision = excluded.decision, decided_at = excluded.decided_at`,
        [key.catalogueId, key.sheetId, revision, decision, this.now()],
      );
    });
  }

  /** Valeurs locales sauvegardées avant leur remplacement explicite. */
  async savedLocalValues(key: SheetKey): Promise<readonly (SavedLocalValue & { revision: string; savedAt: string })[]> {
    let rows: { revision: string; field: string; value_json: string; saved_at: string }[] = [];
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      rows = await transaction.getAllAsync(
        "SELECT revision, field, value_json, saved_at FROM saved_local_values WHERE catalogue_id = ? AND sheet_id = ? ORDER BY saved_at, field",
        [key.catalogueId, key.sheetId]);
    });
    return rows.map((row) => ({
      revision: row.revision,
      field: row.field as SavedLocalValue["field"],
      value: JSON.parse(row.value_json) as unknown,
      savedAt: row.saved_at,
    }));
  }
}

function toInstalled(row: InstalledRow): InstalledSheetRecord {
  return {
    catalogueId: row.catalogue_id,
    sheetId: row.sheet_id,
    movementId: row.movement_id,
    revision: row.revision,
    fingerprint: row.fingerprint,
    sheet: JSON.parse(row.sheet_json) as CatalogueSheet,
    installedAt: row.installed_at,
    updatedAt: row.updated_at,
  };
}

function toPending(row: PendingRow): PendingOperation {
  return {
    catalogueId: row.catalogue_id,
    sheetId: row.sheet_id,
    kind: row.kind,
    movementId: row.movement_id,
    sheet: JSON.parse(row.sheet_json) as CatalogueSheet,
    movement: JSON.parse(row.movement_json) as Movement,
    savedLocalValues: JSON.parse(row.saved_local_values_json) as SavedLocalValue[],
    createdAt: row.created_at,
  };
}

function toDecision(row: DecisionRow): SheetDecisionRecord {
  return {
    catalogueId: row.catalogue_id,
    sheetId: row.sheet_id,
    revision: row.revision,
    decision: row.decision,
    decidedAt: row.decided_at,
  };
}
