import * as Crypto from "expo-crypto";

import {
  normalizeMovementName,
  validateMovement,
  type Movement,
  type MovementPhase,
} from "@/domain/activities/Movement";
import {
  DuplicateMovementNameError,
  type DeleteMovementOutcome,
  type MovementGroupOutcome,
  type MovementRepository,
} from "@/domain/activities/MovementRepository";
import type { DraftMediaItem, MediaLinkInput } from "@/domain/media/ActivityMedia";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import type { Database } from "@/infrastructure/database/Database";
import type {
  MovementAliasRow,
  MovementBodyZoneRow,
  MovementMediaRow,
  MovementPhaseRow,
  MovementRow,
} from "@/infrastructure/database/types/DatabaseRows";

import { ensureMediaAssets, JOINED_ASSET_COLUMNS, mapJoinedAsset } from "./SqliteMediaRepository";

type UuidFactory = () => string;

/**
 * PRE-7 (A1.2, D-437, D-439, MFN-01 à MFN-05, MFN-08) — persistance SQLite du
 * Mouvement (`migration012` : `movements`, `movement_phases`,
 * `movement_body_zones`, `movement_media`). Les fonctions transactionnelles
 * exportées (`insertMovement`, `updateMovementContent`, `readMovementRecords`,
 * `countMovementDefinitions`, `countMovementOccurrences`) sont réutilisées par les
 * repositories de définitions et de Séances, dans LEUR transaction : création
 * Catalogue (Mouvement + définition), création et correction depuis une Séance.
 *
 * PRE-7 (R-3, `migration013`, D-445 C01, C03, C05) : nom principal unique sur la
 * clé canonique — contrôlé avant l'écriture et garanti par l'index UNIQUE en
 * écriture concurrente, les deux traduits en `DuplicateMovementNameError` ; alias
 * (`movement_aliases`) ; plus d'indicateur « déjà utilisé » ; les occurrences de
 * Séance référencent le Mouvement par clé étrangère RESTRICT et lisent son contenu.
 *
 * Aucun ramassage automatique (MFN-04) ; suppression refusée si une définition
 * référence le Mouvement (MFN-03) ; les filiations des copies ne sont jamais
 * lues ni modifiées. Groupe de niveaux (MFN-05, D-439) : identifiant et clé de
 * tri toujours ensemble, au plus un groupe ; les clés sont renumérotées
 * 0..n-1 dans l'ordre du groupe à chaque opération (aucun rang persisté : le
 * rang reste dérivé de l'ordre des clés).
 */

/**
 * Contenu d'un Mouvement à écrire : `media` est une liste de liens (asset
 * complet pour un fichier fraîchement préparé, créé dans la même transaction ;
 * simple identifiant pour un asset déjà persisté, jamais réécrit).
 */
export type MovementContent = Omit<Movement, "media"> & { readonly media: readonly MediaLinkInput[] };

/** Lien de média relu, avec son identité propre et sa position. */
export type MovementMediaLink = {
  readonly id: string;
  readonly assetId: string;
  readonly position: number;
  readonly asset: MediaAsset;
};

/** Mouvement relu, avec ses liens de médias et ses dates. */
export type MovementRecord = {
  readonly movement: Movement;
  readonly mediaLinks: readonly MovementMediaLink[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

/**
 * PRE-7 (R-3, C01) : refuse un nom dont la clé canonique est déjà celle d'un AUTRE
 * Mouvement (`DuplicateMovementNameError`). L'index UNIQUE reste la garantie finale.
 */
async function assertNameAvailable(transaction: Database, movementId: string, name: string): Promise<void> {
  const key = normalizeMovementName(name);
  const taken = await transaction.getFirstAsync<{ id: string }>(
    "SELECT id FROM movements WHERE normalized_name = ? AND id <> ? LIMIT 1",
    [key, movementId],
  );
  if (taken) {
    throw new DuplicateMovementNameError(key);
  }
}

/** Violation de l'index UNIQUE du nom (écriture concurrente) → `DuplicateMovementNameError`. */
async function withNameUniqueness<T>(name: string, write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (error instanceof Error && /UNIQUE/i.test(error.message) && /normalized_name/i.test(error.message)) {
      throw new DuplicateMovementNameError(normalizeMovementName(name));
    }
    throw error;
  }
}

async function replaceAliases(transaction: Database, movementId: string, aliases: readonly string[]): Promise<void> {
  await transaction.runAsync("DELETE FROM movement_aliases WHERE movement_id = ?", [movementId]);
  for (const [position, alias] of aliases.entries()) {
    await transaction.runAsync(
      "INSERT INTO movement_aliases (movement_id, position, alias, normalized_alias) VALUES (?, ?, ?, ?)",
      [movementId, position, alias, normalizeMovementName(alias)],
    );
  }
}

/** Contrôle de l'entrée (lève) : `validateMovement`, médias contrôlés à part (liens). */
function validatedContent(content: MovementContent): MovementContent {
  const result = validateMovement({ ...content, media: [] });
  if (!result.ok) {
    throw new Error(
      `Invalid movement: ${result.violations.map((violation) => `${violation.field} ${violation.code}`).join(", ")}.`,
    );
  }
  if (content.media.some((item) => item.assetId.trim().length === 0)) {
    throw new Error("Invalid movement: movement.media REQUIRED.");
  }
  return { ...result.value, media: content.media };
}

async function insertPhases(transaction: Database, movementId: string, phases: readonly MovementPhase[]): Promise<void> {
  for (const [position, phase] of phases.entries()) {
    await transaction.runAsync(
      "INSERT INTO movement_phases (movement_id, phase_id, position, label) VALUES (?, ?, ?, ?)",
      [movementId, phase.id, position, phase.label],
    );
  }
}

async function insertBodyZones(transaction: Database, movementId: string, bodyZoneIds: readonly string[]): Promise<void> {
  for (const bodyZoneId of bodyZoneIds) {
    await transaction.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES (?, ?)", [
      movementId,
      bodyZoneId,
    ]);
  }
}

/**
 * Remplace les liens de médias du Mouvement (position = rang du tableau). Les
 * assets ne sont jamais supprimés ; un asset invalide ou absent annule la
 * transaction. `mediaId` fournit l'identité de chaque lien.
 */
export async function replaceMovementMediaLinks(
  transaction: Database,
  movementId: string,
  media: readonly MediaLinkInput[],
  mediaId: (position: number) => string,
): Promise<void> {
  await ensureMediaAssets(transaction, media);
  await transaction.runAsync("DELETE FROM movement_media WHERE movement_id = ?", [movementId]);
  for (const [position, item] of media.entries()) {
    await transaction.runAsync(
      "INSERT INTO movement_media (id, movement_id, asset_id, position) VALUES (?, ?, ?, ?)",
      [mediaId(position), movementId, item.assetId, position],
    );
  }
}

/**
 * Insère un Mouvement complet dans la transaction courante (ligne, phases,
 * Zones, médias). `mediaId` fournit l'identité des liens de médias : une
 * fabrique d'identifiants (Catalogue) ou une identité dérivée (Mouvement local
 * d'une Séance, qui ne consomme aucun identifiant supplémentaire).
 */
export async function insertMovement(
  transaction: Database,
  content: MovementContent,
  timestamp: string,
  mediaId: (position: number) => string,
): Promise<void> {
  const movement = validatedContent(content);
  await assertNameAvailable(transaction, movement.id, movement.name);
  await withNameUniqueness(movement.name, () =>
    transaction.runAsync(
      `INSERT INTO movements (
        id, name, normalized_name, description, category_id, next_phase_id,
        level_group_id, level_sort_key, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movement.id,
        movement.name,
        normalizeMovementName(movement.name),
        movement.description,
        movement.categoryId,
        movement.nextPhaseId,
        movement.levelGroup?.groupId ?? null,
        movement.levelGroup?.sortKey ?? null,
        timestamp,
        timestamp,
      ],
    ),
  );
  await replaceAliases(transaction, movement.id, movement.aliases);
  await insertPhases(transaction, movement.id, movement.phases);
  await insertBodyZones(transaction, movement.id, movement.bodyZoneIds);
  await replaceMovementMediaLinks(transaction, movement.id, movement.media, mediaId);
}

/**
 * Réécrit le contenu partagé d'un Mouvement existant (nom, alias, description,
 * Catégorie, Zones, structure et compteur de phase), dans la transaction
 * courante. `media` `undefined` conserve les liens. Le groupe de niveaux n'est
 * jamais modifié ici (MFN-05 : opérations de groupe dédiées). Le compteur ne
 * recule jamais. Un nom déjà pris par un autre Mouvement lève
 * `DuplicateMovementNameError` (C01).
 */
export async function updateMovementContent(
  transaction: Database,
  content: Omit<MovementContent, "media"> & { readonly media?: readonly MediaLinkInput[] },
  timestamp: string,
  mediaId: (position: number) => string,
): Promise<void> {
  const movement = validatedContent({ ...content, media: content.media ?? [] });
  await assertNameAvailable(transaction, movement.id, movement.name);
  const result = await withNameUniqueness(movement.name, () =>
    transaction.runAsync(
      `UPDATE movements SET name = ?, normalized_name = ?, description = ?, category_id = ?,
         next_phase_id = MAX(next_phase_id, ?), updated_at = ?
       WHERE id = ?`,
      [
        movement.name,
        normalizeMovementName(movement.name),
        movement.description,
        movement.categoryId,
        movement.nextPhaseId,
        timestamp,
        movement.id,
      ],
    ),
  );
  if (result.changes !== 1) {
    throw new Error("Expected exactly one movement row to be updated.");
  }
  await replaceAliases(transaction, movement.id, movement.aliases);
  await transaction.runAsync("DELETE FROM movement_phases WHERE movement_id = ?", [movement.id]);
  await insertPhases(transaction, movement.id, movement.phases);
  await transaction.runAsync("DELETE FROM movement_body_zones WHERE movement_id = ?", [movement.id]);
  await insertBodyZones(transaction, movement.id, movement.bodyZoneIds);
  if (content.media !== undefined) {
    await replaceMovementMediaLinks(transaction, movement.id, content.media, mediaId);
  }
}

function placeholders(values: readonly unknown[]): string {
  return values.map(() => "?").join(", ");
}

/**
 * Relit des Mouvements par identifiant, en une requête par table (aucun N+1).
 * Une donnée corrompue (structure invalide, compteur ≤ max(`id`), groupe
 * incomplet) lève : jamais une lecture approchée.
 */
export async function readMovementRecords(
  database: Database,
  ids: readonly string[],
): Promise<ReadonlyMap<string, MovementRecord>> {
  const unique = [...new Set(ids)];
  const records = new Map<string, MovementRecord>();
  if (unique.length === 0) {
    return records;
  }
  const rows = await database.getAllAsync<MovementRow>(
    `SELECT ${MOVEMENT_COLUMNS} FROM movements WHERE id IN (${placeholders(unique)})`,
    unique,
  );
  return assembleRecords(database, rows);
}

async function assembleRecords(
  database: Database,
  rows: readonly MovementRow[],
): Promise<ReadonlyMap<string, MovementRecord>> {
  const records = new Map<string, MovementRecord>();
  if (rows.length === 0) {
    return records;
  }
  const ids = rows.map((row) => row.id);
  const phaseRows = await database.getAllAsync<MovementPhaseRow>(
    `SELECT movement_id, phase_id, position, label FROM movement_phases
     WHERE movement_id IN (${placeholders(ids)}) ORDER BY movement_id ASC, position ASC`,
    ids,
  );
  const zoneRows = await database.getAllAsync<MovementBodyZoneRow>(
    `SELECT movement_id, body_zone_id FROM movement_body_zones WHERE movement_id IN (${placeholders(ids)})`,
    ids,
  );
  const mediaRows = await database.getAllAsync<MovementMediaRow>(
    `SELECT
       movement_media.id AS id,
       movement_media.movement_id AS movement_id,
       movement_media.asset_id AS asset_id,
       movement_media.position AS position,
       ${JOINED_ASSET_COLUMNS}
     FROM movement_media
     JOIN media_assets ON media_assets.id = movement_media.asset_id
     WHERE movement_media.movement_id IN (${placeholders(ids)})
     ORDER BY movement_media.movement_id ASC, movement_media.position ASC`,
    ids,
  );
  const aliasRows = await database.getAllAsync<MovementAliasRow>(
    `SELECT movement_id, position, alias FROM movement_aliases
     WHERE movement_id IN (${placeholders(ids)}) ORDER BY movement_id ASC, position ASC`,
    ids,
  );
  const aliasesById = groupBy(aliasRows, (row) => row.movement_id);
  const phasesById = groupBy(phaseRows, (row) => row.movement_id);
  const zonesById = groupBy(zoneRows, (row) => row.movement_id);
  const mediaById = groupBy(mediaRows, (row) => row.movement_id);
  for (const row of rows) {
    const mediaLinks = (mediaById.get(row.id) ?? []).map((media) => ({
      id: media.id,
      assetId: media.asset_id,
      position: media.position,
      asset: mapJoinedAsset(media.asset_id, media),
    }));
    const media: DraftMediaItem[] = mediaLinks.map((link) => ({ assetId: link.assetId, asset: link.asset }));
    const movement: Movement = {
      id: row.id,
      name: row.name,
      description: row.description,
      media,
      categoryId: row.category_id,
      bodyZoneIds: (zonesById.get(row.id) ?? []).map((zone) => zone.body_zone_id),
      phases: (phasesById.get(row.id) ?? []).map((phase) => ({ id: phase.phase_id, label: phase.label })),
      nextPhaseId: row.next_phase_id,
      aliases: (aliasesById.get(row.id) ?? []).map((alias) => alias.alias),
      levelGroup:
        row.level_group_id !== null && row.level_sort_key !== null
          ? { groupId: row.level_group_id, sortKey: row.level_sort_key }
          : null,
    };
    const checked = validateMovement(movement);
    if (!checked.ok) {
      throw new Error("Persisted movement does not satisfy the movement contract.");
    }
    records.set(row.id, { movement, mediaLinks, createdAt: row.created_at, updatedAt: row.updated_at });
  }
  return records;
}

function groupBy<T>(rows: readonly T[], key: (row: T) => string): Map<string, T[]> {
  const byKey = new Map<string, T[]>();
  for (const row of rows) {
    const list = byKey.get(key(row)) ?? [];
    list.push(row);
    byKey.set(key(row), list);
  }
  return byKey;
}

/** PRE-7 (R-3, C03, C05) : nombre d'occurrences de Séance persistées qui référencent le Mouvement. */
export async function countMovementOccurrences(database: Database, id: string): Promise<number> {
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM activities WHERE source_movement_id = ?",
    [id],
  );
  return row?.count ?? 0;
}

/** Nombre de définitions du Catalogue qui référencent le Mouvement. */
export async function countMovementDefinitions(database: Database, id: string): Promise<number> {
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM activity_definitions WHERE movement_id = ?",
    [id],
  );
  return row?.count ?? 0;
}

const MOVEMENT_COLUMNS = `id, name, normalized_name, description, category_id, next_phase_id,
  level_group_id, level_sort_key, created_at, updated_at`;

export class SqliteMovementRepository implements MovementRepository {
  constructor(
    private readonly database: Database,
    private readonly uuidFactory: UuidFactory = Crypto.randomUUID,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async create(movement: Movement): Promise<Movement> {
    const timestamp = this.now();
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await insertMovement(transaction, movement, timestamp, () => this.uuidFactory());
    });
    const created = await this.findById(movement.id);
    if (!created) {
      throw new Error("The created movement could not be read back.");
    }
    return created;
  }

  async findById(id: string): Promise<Movement | null> {
    const records = await readMovementRecords(this.database, [id]);
    return records.get(id)?.movement ?? null;
  }

  async search(query: string): Promise<readonly Movement[]> {
    const key = normalizeMovementName(query);
    // `instr` évite l'échappement des jokers de `LIKE` dans la saisie.
    const rows = await this.database.getAllAsync<MovementRow>(
      `SELECT ${MOVEMENT_COLUMNS} FROM movements
       WHERE ? = '' OR instr(normalized_name, ?) > 0
       ORDER BY normalized_name ASC, id ASC`,
      [key, key],
    );
    const records = await assembleRecords(this.database, rows);
    return rows.map((row) => records.get(row.id)!.movement);
  }

  async countOccurrences(id: string, excludingSessionId?: string): Promise<number> {
    if (excludingSessionId === undefined) {
      return countMovementOccurrences(this.database, id);
    }
    // PRE-7 (R-4, C04) : occurrences des AUTRES Séances seulement.
    const row = await this.database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM activities WHERE source_movement_id = ? AND session_id <> ?",
      [id, excludingSessionId],
    );
    return row?.count ?? 0;
  }

  async countDefinitions(id: string): Promise<number> {
    return countMovementDefinitions(this.database, id);
  }

  async delete(id: string): Promise<DeleteMovementOutcome> {
    let outcome: DeleteMovementOutcome = { status: "NOT_FOUND" };
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const existing = await transaction.getFirstAsync<{ id: string; level_group_id: string | null }>(
        "SELECT id, level_group_id FROM movements WHERE id = ?",
        [id],
      );
      if (!existing) {
        return;
      }
      const definitionCount = await countMovementDefinitions(transaction, id);
      // PRE-7 (R-3, D-445) : une occurrence de Séance est une référence active, intègre.
      const occurrenceCount = await countMovementOccurrences(transaction, id);
      if (definitionCount > 0 || occurrenceCount > 0) {
        outcome = { status: "REFERENCED", definitionCount, occurrenceCount };
        return;
      }
      // Phases, Zones, alias et liens de médias partent en cascade ; les assets ne sont jamais touchés.
      await transaction.runAsync("DELETE FROM movements WHERE id = ?", [id]);
      // Les autres membres du groupe gardent des clés 0..n-1 contiguës.
      if (existing.level_group_id !== null) {
        const remaining = await groupMemberIds(transaction, existing.level_group_id);
        await writeGroupOrder(transaction, existing.level_group_id, remaining, this.now());
      }
      outcome = { status: "DELETED" };
    });
    return outcome;
  }

  attachToGroup(movementId: string, originId: string): Promise<MovementGroupOutcome> {
    return this.join(movementId, originId, "END");
  }

  insertAfter(movementId: string, originId: string): Promise<MovementGroupOutcome> {
    return this.join(movementId, originId, "AFTER_ORIGIN");
  }

  async reorder(groupId: string, orderedIds: readonly string[]): Promise<MovementGroupOutcome> {
    let outcome: MovementGroupOutcome = { status: "NOT_FOUND" };
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const members = await groupMemberIds(transaction, groupId);
      if (members.length === 0) {
        return;
      }
      const expected = new Set(members);
      if (orderedIds.length !== members.length || new Set(orderedIds).size !== members.length || orderedIds.some((id) => !expected.has(id))) {
        outcome = { status: "INVALID_ORDER" };
        return;
      }
      await writeGroupOrder(transaction, groupId, orderedIds, this.now());
      outcome = { status: "OK", members: await this.readGroup(transaction, groupId) };
    });
    return outcome;
  }

  async detachFromGroup(movementId: string): Promise<MovementGroupOutcome> {
    let outcome: MovementGroupOutcome = { status: "NOT_FOUND" };
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const row = await transaction.getFirstAsync<{ level_group_id: string | null }>(
        "SELECT level_group_id FROM movements WHERE id = ?",
        [movementId],
      );
      if (!row) {
        return;
      }
      const timestamp = this.now();
      if (row.level_group_id === null) {
        outcome = { status: "OK", members: [] };
        return;
      }
      const groupId = row.level_group_id;
      await transaction.runAsync(
        "UPDATE movements SET level_group_id = NULL, level_sort_key = NULL, updated_at = ? WHERE id = ?",
        [timestamp, movementId],
      );
      // Les autres membres gardent contenu et identité ; le groupe, même
      // réduit à un membre, garde son identifiant (MFN-05).
      const remaining = await groupMemberIds(transaction, groupId);
      await writeGroupOrder(transaction, groupId, remaining, timestamp);
      outcome = { status: "OK", members: await this.readGroup(transaction, groupId) };
    });
    return outcome;
  }

  async listGroup(groupId: string): Promise<readonly Movement[]> {
    return this.readGroup(this.database, groupId);
  }

  private async readGroup(database: Database, groupId: string): Promise<readonly Movement[]> {
    const rows = await database.getAllAsync<MovementRow>(
      `SELECT ${MOVEMENT_COLUMNS} FROM movements WHERE level_group_id = ? ORDER BY level_sort_key ASC, id ASC`,
      [groupId],
    );
    const records = await assembleRecords(database, rows);
    return rows.map((row) => records.get(row.id)!.movement);
  }

  /**
   * Rattachement explicite (MFN-05) : jamais de fusion d'identités. Le groupe
   * est créé (identifiant neuf, origine en premier) si l'origine n'en a pas ;
   * un Mouvement déjà membre d'un AUTRE groupe est refusé (au plus un groupe).
   * Un membre du même groupe est simplement replacé.
   */
  private async join(movementId: string, originId: string, placement: "END" | "AFTER_ORIGIN"): Promise<MovementGroupOutcome> {
    let outcome: MovementGroupOutcome = { status: "NOT_FOUND" };
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const joined = await joinMovementGroup(transaction, movementId, originId, placement, this.uuidFactory, this.now());
      outcome = joined.status === "OK" ? { status: "OK", members: await this.readGroup(transaction, joined.groupId) } : joined;
    });
    return outcome;
  }
}

/**
 * Place d'un Mouvement qui rejoint le groupe de son origine : en dernier (`attachToGroup`), juste
 * après l'origine (« Ajouter un niveau », Plus difficile) ou, PRE-7 (R-5, C02, MFN-07 l.371),
 * juste avant elle (Plus facile).
 */
export type MovementGroupPlacement = "END" | "AFTER_ORIGIN" | "BEFORE_ORIGIN";

/** Issue de `joinMovementGroup` : identifiant du groupe rejoint, ou cas attendu de refus. */
export type JoinMovementGroupOutcome =
  | { readonly status: "OK"; readonly groupId: string }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "ALREADY_IN_GROUP" }
  | { readonly status: "INVALID_ORDER" };

/**
 * Rattachement dans la transaction COURANTE (MFN-05, MFN-07) — réutilisé par
 * `SqliteMovementRepository` et par la création d'une variante rattachée
 * (`SqliteActivityDefinitionRepository`, même transaction que la création).
 * L'identifiant d'un groupe nouveau n'est consommé qu'après les refus.
 */
export async function joinMovementGroup(
  transaction: Database,
  movementId: string,
  originId: string,
  placement: MovementGroupPlacement,
  uuidFactory: UuidFactory,
  timestamp: string,
): Promise<JoinMovementGroupOutcome> {
  if (movementId === originId) {
    return { status: "INVALID_ORDER" };
  }
  const movement = await transaction.getFirstAsync<{ level_group_id: string | null }>(
    "SELECT level_group_id FROM movements WHERE id = ?",
    [movementId],
  );
  const origin = await transaction.getFirstAsync<{ level_group_id: string | null }>(
    "SELECT level_group_id FROM movements WHERE id = ?",
    [originId],
  );
  if (!movement || !origin) {
    return { status: "NOT_FOUND" };
  }
  if (movement.level_group_id !== null && movement.level_group_id !== origin.level_group_id) {
    return { status: "ALREADY_IN_GROUP" };
  }
  const groupId = origin.level_group_id ?? uuidFactory();
  const members = origin.level_group_id === null ? [originId] : await groupMemberIds(transaction, groupId);
  const others = members.filter((id) => id !== movementId);
  const originIndex = others.indexOf(originId);
  // Origine absente de son propre groupe (donnée incohérente) : aucune place à déduire.
  if (placement !== "END" && originIndex < 0) {
    return { status: "INVALID_ORDER" };
  }
  const insertAt = placement === "END" ? others.length : placement === "BEFORE_ORIGIN" ? originIndex : originIndex + 1;
  const ordered = [...others.slice(0, insertAt), movementId, ...others.slice(insertAt)];
  await writeGroupOrder(transaction, groupId, ordered, timestamp);
  return { status: "OK", groupId };
}

async function groupMemberIds(transaction: Database, groupId: string): Promise<string[]> {
  const rows = await transaction.getAllAsync<{ id: string }>(
    "SELECT id FROM movements WHERE level_group_id = ? ORDER BY level_sort_key ASC, id ASC",
    [groupId],
  );
  return rows.map((row) => row.id);
}

/** Écrit l'appartenance et des clés de tri 0..n-1 dans l'ordre donné. */
async function writeGroupOrder(transaction: Database, groupId: string, orderedIds: readonly string[], timestamp: string): Promise<void> {
  for (const [sortKey, id] of orderedIds.entries()) {
    await transaction.runAsync(
      "UPDATE movements SET level_group_id = ?, level_sort_key = ?, updated_at = ? WHERE id = ?",
      [groupId, sortKey, timestamp, id],
    );
  }
}
