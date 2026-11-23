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
 *
 * Schéma v2 (P0, 11/11/2026) — base distincte, donc sans concurrence avec les migrations de la base
 * principale (PRE-10) : Bibliothèques installées (A-1, composition par références), opérations de
 * Bibliothèque en cours (reprise après interruption), décisions sur une mise à jour de Bibliothèque.
 * Passage v1 → v2 additif : tables ajoutées, fiches déjà installées converties au format v2
 * (`authors[]` → `author`) et empreinte recalculée, sans perte ni changement d'identité.
 *
 * Schéma v3 (Bibliothèques personnelles, 12/11/2026) — additif, même base distincte : identité d'auteur locale
 * (identifiant invisible créé une fois, décision de Hermann du 12/11/2026), Bibliothèques personnelles et leurs
 * membres ordonnés (références de Mouvements, jamais des copies). Aucune donnée existante modifiée.
 *
 * Schéma v4 (format catalogue 3.0.0, 18/11/2026, MOUV-ADM-20261117) — dans la même transaction :
 * 1. sauvegarde récupérable des tables converties (`*_backup_v3`, copies intégrales, jamais relues par
 *    l'application ; une migration interrompue annule toute la transaction et laisse le schéma 3 intact) ;
 * 2. instantanés installés et opérations en cours convertis au format 3.0.0 **sans reprise de la position de
 *    départ ni changement de révision** (`normalizeStoredSheet`), notes internes retirées, empreinte recalculée :
 *    la révision convertie du fichier source arrive comme une mise à jour ordinaire ;
 * 3. Bibliothèques installées sans éditeur ni case de publication ; leur clé cible recalculée seulement quand
 *    l'ancienne est reproduite à l'identique (sinon conservée : la mise à jour reste proposée) ;
 * 4. opérations de Bibliothèque en cours : fichier relu et converti (`parseMovementCatalogueFile`), clé recalculée ;
 * 5. table `installed_references` : référentiels de classification de chaque catalogue (libellés des
 *    spécialités, familles gestuelles, problèmes cliniques, cibles anatomiques) pour les filtres validés.
 * Aucune identité (catalogue, fiche, Mouvement, Bibliothèque) ni décision n'est modifiée.
 *
 * Schéma v5 (19/11/2026, décision de Hermann : « je ne veux pas conserver deux photos sur le téléphone ») —
 * les photos d'une fiche sont des médias du Mouvement (`catalogueMedia.ts`) ; l'instantané installé et l'opération
 * en cours n'en gardent que l'empreinte (`compactSheetMedia`). Conversion des lignes existantes et empreinte de
 * fiche recalculée (la photo y est représentée par son empreinte). Sans sauvegarde : le contenu retiré est déjà
 * enregistré comme média du Mouvement, ou reviendra avec la révision suivante de la fiche.
 */
import type { Movement } from "@/domain/activities/Movement";
import {
  normalizeStoredLibrary,
  normalizeStoredSheet,
  compactSheetMedia,
  parseMovementCatalogueFile,
  sheetFingerprint,
  withoutInternalNotes,
  type CatalogueLibrary,
  type CatalogueReferences,
  type CatalogueSheet,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";
import {
  libraryCompositionKey,
  libraryTargetKey,
  type InstalledLibraryRecord,
  type LibraryDecisionRecord,
  type LibraryKey,
  type LibraryOperation,
} from "@/domain/catalogue/libraryPlan";
import type {
  InstalledSheetRecord,
  PendingOperation,
  RegistryState,
  SavedLocalValue,
  SheetDecision,
  SheetDecisionRecord,
  SheetKey,
} from "@/domain/catalogue/catalogueLoadPlan";
import {
  DuplicateLibraryTitleError,
  libraryTitleKey,
  normalizeLibraryTitle,
  type PersonalLibrary,
} from "@/domain/catalogue/personalLibrary";
import type { Database } from "@/infrastructure/database/Database";

export const CATALOGUE_REGISTRY_DATABASE_NAME = "kodjo-catalogue-registry.db";
export const CATALOGUE_REGISTRY_SCHEMA_VERSION = 5;

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

/** v2 : Bibliothèques (A-1). Additif. */
const SCHEMA_V2 = `
CREATE TABLE IF NOT EXISTS installed_libraries (
  catalogue_id TEXT NOT NULL,
  library_id TEXT NOT NULL,
  revision TEXT NOT NULL,
  target_key TEXT NOT NULL,
  library_json TEXT NOT NULL,
  installed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (catalogue_id, library_id)
);
CREATE TABLE IF NOT EXISTS library_operations (
  catalogue_id TEXT NOT NULL,
  library_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('INSTALL', 'UPDATE')),
  target_key TEXT NOT NULL,
  file_json TEXT NOT NULL,
  started_at TEXT NOT NULL,
  PRIMARY KEY (catalogue_id, library_id)
);
CREATE TABLE IF NOT EXISTS library_decisions (
  catalogue_id TEXT NOT NULL,
  library_id TEXT NOT NULL,
  target_key TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('REFUSED', 'DEFERRED')),
  decided_at TEXT NOT NULL,
  PRIMARY KEY (catalogue_id, library_id, target_key)
);`;

/** v3 : Bibliothèques personnelles. Additif. */
const SCHEMA_V3 = `
CREATE TABLE IF NOT EXISTS local_author (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  author_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS personal_libraries (
  library_id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  title_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (author_id, title_key)
);
CREATE TABLE IF NOT EXISTS personal_library_members (
  library_id TEXT NOT NULL,
  movement_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (library_id, movement_id)
);`;

/** v4 : référentiels de classification par catalogue (filtres). Additif. */
const SCHEMA_V4 = `
CREATE TABLE IF NOT EXISTS installed_references (
  catalogue_id TEXT PRIMARY KEY,
  references_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`;

/** Tables sauvegardées avant la conversion du schéma 4 (copie intégrale, même base). */
const V4_BACKED_UP_TABLES = ["installed_sheets", "pending_operations", "installed_libraries", "library_operations"] as const;

type PersonalLibraryRow = {
  library_id: string; author_id: string; title: string; title_key: string; created_at: string; updated_at: string;
};

type InstalledRow = {
  catalogue_id: string; sheet_id: string; movement_id: string; revision: string; fingerprint: string;
  sheet_json: string; installed_at: string; updated_at: string;
};
/**
 * Conversion du registre au format catalogue 3.0.0 (voir l'en-tête) : sauvegarde, puis conversion des
 * instantanés, des Bibliothèques et des opérations en cours, dans la transaction de `open`.
 */
async function migrateToSchema4(transaction: Database): Promise<void> {
  for (const table of V4_BACKED_UP_TABLES) {
    await transaction.execAsync(`DROP TABLE IF EXISTS ${table}_backup_v3; CREATE TABLE ${table}_backup_v3 AS SELECT * FROM ${table};`);
  }
  const installed = await transaction.getAllAsync<{ catalogue_id: string; sheet_id: string; revision: string; sheet_json: string }>(
    "SELECT catalogue_id, sheet_id, revision, sheet_json FROM installed_sheets");
  const revisions = new Map<string, string>();
  for (const row of installed) {
    revisions.set(row.catalogue_id + "\u0000" + row.sheet_id, row.revision);
    const sheet = normalizeStoredSheet(JSON.parse(row.sheet_json) as CatalogueSheet);
    await transaction.runAsync(
      "UPDATE installed_sheets SET sheet_json = ?, fingerprint = ? WHERE catalogue_id = ? AND sheet_id = ?",
      [JSON.stringify(sheet), sheetFingerprint(sheet), row.catalogue_id, row.sheet_id]);
  }
  const pending = await transaction.getAllAsync<{ catalogue_id: string; sheet_id: string; sheet_json: string }>(
    "SELECT catalogue_id, sheet_id, sheet_json FROM pending_operations");
  for (const row of pending) {
    const sheet = normalizeStoredSheet(JSON.parse(row.sheet_json) as CatalogueSheet);
    await transaction.runAsync(
      "UPDATE pending_operations SET sheet_json = ? WHERE catalogue_id = ? AND sheet_id = ?",
      [JSON.stringify(sheet), row.catalogue_id, row.sheet_id]);
  }
  const libraries = await transaction.getAllAsync<{ catalogue_id: string; library_id: string; target_key: string; library_json: string }>(
    "SELECT catalogue_id, library_id, target_key, library_json FROM installed_libraries");
  for (const row of libraries) {
    const stored = JSON.parse(row.library_json) as CatalogueLibrary;
    if (!Array.isArray((stored as { members?: unknown }).members)) continue; // illisible : conservée telle quelle (sauvegarde comprise)
    const library = normalizeStoredLibrary(stored);
    const revisionOf = (sheetId: string) => revisions.get(row.catalogue_id + "\u0000" + sheetId);
    // Clé recalculée seulement si l'ancienne est reproduite (révisions installées = révisions de la cible).
    const reproduced = libraryCompositionKey(stored, row.catalogue_id, revisionOf) === row.target_key;
    const targetKey = reproduced ? libraryCompositionKey(library, row.catalogue_id, revisionOf) : row.target_key;
    await transaction.runAsync(
      "UPDATE installed_libraries SET library_json = ?, target_key = ? WHERE catalogue_id = ? AND library_id = ?",
      [JSON.stringify(library), targetKey, row.catalogue_id, row.library_id]);
  }
  const operations = await transaction.getAllAsync<{ catalogue_id: string; library_id: string; file_json: string }>(
    "SELECT catalogue_id, library_id, file_json FROM library_operations");
  for (const row of operations) {
    const parsed = parseMovementCatalogueFile(JSON.parse(row.file_json));
    if (!parsed.ok) continue; // conservée telle quelle (sauvegarde comprise) : la reprise la signalera
    const file = withoutInternalNotes(parsed.file);
    const library = file.libraries.find((entry) => entry.libraryId === row.library_id);
    if (!library) continue;
    await transaction.runAsync(
      "UPDATE library_operations SET file_json = ?, target_key = ? WHERE catalogue_id = ? AND library_id = ?",
      [JSON.stringify(file), libraryTargetKey(file, library), row.catalogue_id, row.library_id]);
  }
}

/** Schéma 5 : instantanés et opérations en cours sans contenu de photo intégrée, empreinte recalculée. */
async function migrateToSchema5(transaction: Database): Promise<void> {
  const installed = await transaction.getAllAsync<{ catalogue_id: string; sheet_id: string; sheet_json: string }>(
    "SELECT catalogue_id, sheet_id, sheet_json FROM installed_sheets");
  for (const row of installed) {
    const sheet = compactSheetMedia(JSON.parse(row.sheet_json) as CatalogueSheet);
    await transaction.runAsync(
      "UPDATE installed_sheets SET sheet_json = ?, fingerprint = ? WHERE catalogue_id = ? AND sheet_id = ?",
      [JSON.stringify(sheet), sheetFingerprint(sheet), row.catalogue_id, row.sheet_id]);
  }
  const pending = await transaction.getAllAsync<{ catalogue_id: string; sheet_id: string; sheet_json: string }>(
    "SELECT catalogue_id, sheet_id, sheet_json FROM pending_operations");
  for (const row of pending) {
    const sheet = compactSheetMedia(JSON.parse(row.sheet_json) as CatalogueSheet);
    await transaction.runAsync(
      "UPDATE pending_operations SET sheet_json = ? WHERE catalogue_id = ? AND sheet_id = ?",
      [JSON.stringify(sheet), row.catalogue_id, row.sheet_id]);
  }
}

type PendingRow = {
  catalogue_id: string; sheet_id: string; kind: "INSTALL" | "UPDATE"; movement_id: string;
  sheet_json: string; movement_json: string; saved_local_values_json: string; created_at: string;
};
type DecisionRow = { catalogue_id: string; sheet_id: string; revision: string; decision: SheetDecision; decided_at: string };
type LibraryRow = {
  catalogue_id: string; library_id: string; revision: string; target_key: string; library_json: string;
  installed_at: string; updated_at: string;
};
type LibraryOperationRow = {
  catalogue_id: string; library_id: string; kind: "INSTALL" | "UPDATE"; target_key: string; file_json: string; started_at: string;
};
type LibraryDecisionRow = { catalogue_id: string; library_id: string; target_key: string; decision: SheetDecision; decided_at: string };

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
        if (version < 1) await transaction.execAsync(SCHEMA);
        await transaction.execAsync(SCHEMA_V2);
        await transaction.execAsync(SCHEMA_V3);
        await transaction.execAsync(SCHEMA_V4);
        if (version >= 1 && version < 4) await migrateToSchema4(transaction);
        if (version >= 1) await migrateToSchema5(transaction);
        if (version === 1) {
          // Fiches installées et opérations en cours écrites en v1 : conversion sans perte, même identité.
          const installed = await transaction.getAllAsync<{ catalogue_id: string; sheet_id: string; sheet_json: string }>(
            "SELECT catalogue_id, sheet_id, sheet_json FROM installed_sheets");
          for (const row of installed) {
            const sheet = normalizeStoredSheet(JSON.parse(row.sheet_json) as CatalogueSheet);
            await transaction.runAsync(
              "UPDATE installed_sheets SET sheet_json = ?, fingerprint = ? WHERE catalogue_id = ? AND sheet_id = ?",
              [JSON.stringify(sheet), sheetFingerprint(sheet), row.catalogue_id, row.sheet_id]);
          }
          const pending = await transaction.getAllAsync<{ catalogue_id: string; sheet_id: string; sheet_json: string }>(
            "SELECT catalogue_id, sheet_id, sheet_json FROM pending_operations");
          for (const row of pending) {
            const sheet = normalizeStoredSheet(JSON.parse(row.sheet_json) as CatalogueSheet);
            await transaction.runAsync(
              "UPDATE pending_operations SET sheet_json = ? WHERE catalogue_id = ? AND sheet_id = ?",
              [JSON.stringify(sheet), row.catalogue_id, row.sheet_id]);
          }
        }
        await transaction.execAsync("PRAGMA user_version = " + CATALOGUE_REGISTRY_SCHEMA_VERSION);
      });
    }
    return new SqliteCatalogueRegistry(database, now);
  }

  /**
   * Référentiels de classification du catalogue chargé (filtres validés, MOUV-UX-20261117) : enregistrés à
   * chaque acceptation d'une Bibliothèque ou d'une fiche, remplacés par la dernière version reçue.
   */
  async saveReferences(catalogueId: string, references: CatalogueReferences): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `INSERT INTO installed_references (catalogue_id, references_json, updated_at) VALUES (?, ?, ?)
         ON CONFLICT (catalogue_id) DO UPDATE SET references_json = excluded.references_json, updated_at = excluded.updated_at`,
        [catalogueId, JSON.stringify(references), this.now()]);
    });
  }

  /** Référentiels enregistrés, par catalogue. */
  async installedReferences(): Promise<ReadonlyMap<string, CatalogueReferences>> {
    const result = new Map<string, CatalogueReferences>();
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const rows = await transaction.getAllAsync<{ catalogue_id: string; references_json: string }>(
        "SELECT catalogue_id, references_json FROM installed_references ORDER BY catalogue_id");
      for (const row of rows) result.set(row.catalogue_id, JSON.parse(row.references_json) as CatalogueReferences);
    });
    return result;
  }

  /**
   * Identifiant d'auteur de ce téléphone : créé une seule fois (`create`), puis toujours le même (décision de Hermann
   * du 12/11/2026). Jamais affiché ; le nom affiché de l'auteur est le Nom du Profil.
   */
  async localAuthorId(create: () => string): Promise<string> {
    let authorId = "";
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const row = await transaction.getFirstAsync<{ author_id: string }>("SELECT author_id FROM local_author WHERE singleton = 1");
      if (row) {
        authorId = row.author_id;
        return;
      }
      authorId = create();
      await transaction.runAsync("INSERT INTO local_author (singleton, author_id, created_at) VALUES (1, ?, ?)", [authorId, this.now()]);
    });
    return authorId;
  }

  /** Bibliothèques personnelles, dans l'ordre de création, avec leurs membres ordonnés. */
  async personalLibraries(): Promise<readonly PersonalLibrary[]> {
    let result: PersonalLibrary[] = [];
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const rows = await transaction.getAllAsync<PersonalLibraryRow>(
        "SELECT * FROM personal_libraries ORDER BY created_at, library_id");
      const members = await transaction.getAllAsync<{ library_id: string; movement_id: string }>(
        "SELECT library_id, movement_id FROM personal_library_members ORDER BY library_id, position");
      result = rows.map((row) => ({
        libraryId: row.library_id,
        authorId: row.author_id,
        title: row.title,
        movementIds: members.filter((member) => member.library_id === row.library_id).map((member) => member.movement_id),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    });
    return result;
  }

  /**
   * Crée ou remplace une Bibliothèque personnelle (nom et membres) en une transaction. Refus
   * `DuplicateLibraryTitleError` si le même auteur a déjà une autre Bibliothèque de ce nom (sans casse).
   */
  async savePersonalLibrary(input: {
    readonly libraryId: string;
    readonly authorId: string;
    readonly title: string;
    readonly movementIds: readonly string[];
  }): Promise<PersonalLibrary> {
    const title = normalizeLibraryTitle(input.title);
    const key = libraryTitleKey(title);
    const timestamp = this.now();
    let createdAt = timestamp;
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const taken = await transaction.getFirstAsync<{ library_id: string }>(
        "SELECT library_id FROM personal_libraries WHERE author_id = ? AND title_key = ? AND library_id <> ?",
        [input.authorId, key, input.libraryId]);
      if (taken) throw new DuplicateLibraryTitleError(title);
      const existing = await transaction.getFirstAsync<{ created_at: string }>(
        "SELECT created_at FROM personal_libraries WHERE library_id = ?", [input.libraryId]);
      if (existing) createdAt = existing.created_at;
      await transaction.runAsync(
        `INSERT INTO personal_libraries (library_id, author_id, title, title_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (library_id) DO UPDATE SET title = excluded.title, title_key = excluded.title_key,
           updated_at = excluded.updated_at`,
        [input.libraryId, input.authorId, title, key, createdAt, timestamp]);
      await transaction.runAsync("DELETE FROM personal_library_members WHERE library_id = ?", [input.libraryId]);
      const unique = [...new Set(input.movementIds)];
      for (const [position, movementId] of unique.entries()) {
        await transaction.runAsync(
          "INSERT INTO personal_library_members (library_id, movement_id, position) VALUES (?, ?, ?)",
          [input.libraryId, movementId, position]);
      }
    });
    return {
      libraryId: input.libraryId,
      authorId: input.authorId,
      title,
      movementIds: [...new Set(input.movementIds)],
      createdAt,
      updatedAt: timestamp,
    };
  }

  /** Supprime une Bibliothèque personnelle et sa composition ; aucun Mouvement n'est touché. */
  async deletePersonalLibrary(libraryId: string): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync("DELETE FROM personal_library_members WHERE library_id = ?", [libraryId]);
      await transaction.runAsync("DELETE FROM personal_libraries WHERE library_id = ?", [libraryId]);
    });
  }

  /**
   * Désinstallation (décisions de Hermann du 13/11/2026) : retire la Bibliothèque, ses opérations et décisions, et les
   * fiches dont le Mouvement a quitté le Catalogue (`removedSheets`). Les fiches conservées (utilisées dans une Séance,
   * une autre Bibliothèque installée ou une Bibliothèque personnelle) gardent leur enregistrement : elles restent
   * importées et protégées (A-2). Appelé APRÈS la suppression des Mouvements : une interruption laisse la Bibliothèque
   * installée et la désinstallation se rejoue sans dommage.
   */
  async uninstallLibrary(key: LibraryKey, removedSheets: readonly SheetKey[]): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const params = [key.catalogueId, key.libraryId];
      await transaction.runAsync("DELETE FROM installed_libraries WHERE catalogue_id = ? AND library_id = ?", params);
      await transaction.runAsync("DELETE FROM library_operations WHERE catalogue_id = ? AND library_id = ?", params);
      await transaction.runAsync("DELETE FROM library_decisions WHERE catalogue_id = ? AND library_id = ?", params);
      for (const sheet of removedSheets) {
        const sheetParams = [sheet.catalogueId, sheet.sheetId];
        for (const table of ["installed_sheets", "pending_operations", "sheet_decisions", "saved_local_values"]) {
          await transaction.runAsync(`DELETE FROM ${table} WHERE catalogue_id = ? AND sheet_id = ?`, sheetParams);
        }
      }
    });
  }

  /** Instantané complet d'un catalogue, lu dans une transaction (lecture fraîche). */
  async state(catalogueId: string): Promise<RegistryState> {
    let result: RegistryState = { installed: [], pending: [], decisions: [] };
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
          JSON.stringify(compactSheetMedia(operation.sheet)), JSON.stringify(operation.movement),
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
          JSON.stringify(compactSheetMedia(entry.sheet)), timestamp, timestamp],
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

  /**
   * Garde de lecture seule (A-2) : vrai si le Mouvement est rattaché à une fiche installée
   * (ou en cours d'installation). Aucune heuristique sur le nom.
   */
  async isInstalledMovement(movementId: string): Promise<boolean> {
    let found = false;
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const row = await transaction.getFirstAsync<{ n: number }>(
        "SELECT (SELECT COUNT(*) FROM installed_sheets WHERE movement_id = ?) + (SELECT COUNT(*) FROM pending_operations WHERE movement_id = ?) AS n",
        [movementId, movementId]);
      found = (row?.n ?? 0) > 0;
    });
    return found;
  }

  /** Fiche installée rattachée à un Mouvement (provenance affichée sur la fiche), `null` sinon. */
  async installedSheetOfMovement(movementId: string): Promise<InstalledSheetRecord | null> {
    let row: InstalledRow | null = null;
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      row = await transaction.getFirstAsync<InstalledRow>("SELECT * FROM installed_sheets WHERE movement_id = ?", [movementId]);
    });
    return row ? toInstalled(row) : null;
  }

  /** Toutes les fiches installées, tous catalogues confondus (lecture fraîche). */
  async allInstalledSheets(): Promise<readonly InstalledSheetRecord[]> {
    let rows: InstalledRow[] = [];
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      rows = await transaction.getAllAsync<InstalledRow>("SELECT * FROM installed_sheets ORDER BY catalogue_id, sheet_id");
    });
    return rows.map(toInstalled);
  }

  /** Bibliothèques installées, dans l'ordre d'installation. */
  async installedLibraries(): Promise<readonly InstalledLibraryRecord[]> {
    let rows: LibraryRow[] = [];
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      rows = await transaction.getAllAsync<LibraryRow>("SELECT * FROM installed_libraries ORDER BY installed_at, catalogue_id, library_id");
    });
    return rows.map(toLibrary);
  }

  /** Opérations de Bibliothèque commencées et non terminées (reprise après interruption). */
  async libraryOperations(): Promise<readonly LibraryOperation[]> {
    let rows: LibraryOperationRow[] = [];
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      rows = await transaction.getAllAsync<LibraryOperationRow>("SELECT * FROM library_operations ORDER BY started_at");
    });
    return rows.map((row) => ({
      catalogueId: row.catalogue_id,
      libraryId: row.library_id,
      kind: row.kind,
      targetKey: row.target_key,
      file: JSON.parse(row.file_json) as MovementCatalogueFile,
      startedAt: row.started_at,
    }));
  }

  /** Intention durable d'installer ou de mettre à jour une Bibliothèque, avant toute écriture. */
  async beginLibraryOperation(operation: Omit<LibraryOperation, "startedAt">): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `INSERT INTO library_operations (catalogue_id, library_id, kind, target_key, file_json, started_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (catalogue_id, library_id) DO UPDATE SET kind = excluded.kind, target_key = excluded.target_key,
           file_json = excluded.file_json, started_at = excluded.started_at`,
        [operation.catalogueId, operation.libraryId, operation.kind, operation.targetKey, JSON.stringify(operation.file), this.now()],
      );
    });
  }

  /** Abandon explicite d'une opération de Bibliothèque (« Plus tard » ne l'abandonne pas). */
  async abandonLibraryOperation(key: LibraryKey): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync("DELETE FROM library_operations WHERE catalogue_id = ? AND library_id = ?",
        [key.catalogueId, key.libraryId]);
    });
  }

  /** Fin d'une opération : Bibliothèque installée (composition), opération et décisions levées, en une transaction. */
  async commitLibrary(key: LibraryKey, library: CatalogueLibrary, targetKey: string): Promise<void> {
    const timestamp = this.now();
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const params = [key.catalogueId, key.libraryId];
      await transaction.runAsync(
        `INSERT INTO installed_libraries (catalogue_id, library_id, revision, target_key, library_json, installed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (catalogue_id, library_id) DO UPDATE SET revision = excluded.revision, target_key = excluded.target_key,
           library_json = excluded.library_json, updated_at = excluded.updated_at`,
        [key.catalogueId, key.libraryId, library.revision, targetKey, JSON.stringify(library), timestamp, timestamp],
      );
      await transaction.runAsync("DELETE FROM library_operations WHERE catalogue_id = ? AND library_id = ?", params);
      await transaction.runAsync("DELETE FROM library_decisions WHERE catalogue_id = ? AND library_id = ?", params);
    });
  }

  /** « Reporter » ou « Refuser » une mise à jour de Bibliothèque (cible exacte). */
  async recordLibraryDecision(key: LibraryKey, targetKey: string, decision: SheetDecision): Promise<void> {
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `INSERT INTO library_decisions (catalogue_id, library_id, target_key, decision, decided_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (catalogue_id, library_id, target_key) DO UPDATE SET decision = excluded.decision, decided_at = excluded.decided_at`,
        [key.catalogueId, key.libraryId, targetKey, decision, this.now()],
      );
    });
  }

  async libraryDecisions(): Promise<readonly LibraryDecisionRecord[]> {
    let rows: LibraryDecisionRow[] = [];
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      rows = await transaction.getAllAsync<LibraryDecisionRow>("SELECT * FROM library_decisions ORDER BY decided_at");
    });
    return rows.map((row) => ({
      catalogueId: row.catalogue_id,
      libraryId: row.library_id,
      targetKey: row.target_key,
      decision: row.decision,
      decidedAt: row.decided_at,
    }));
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

function toLibrary(row: LibraryRow): InstalledLibraryRecord {
  return {
    catalogueId: row.catalogue_id,
    libraryId: row.library_id,
    revision: row.revision,
    targetKey: row.target_key,
    library: JSON.parse(row.library_json) as CatalogueLibrary,
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
