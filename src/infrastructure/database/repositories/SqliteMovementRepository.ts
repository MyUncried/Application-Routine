import * as Crypto from "expo-crypto";

import {
  normalizeMovementName,
  validateMovement,
  type Movement,
  type MovementPhase,
} from "@/domain/activities/Movement";
import type {
  DeleteMovementOutcome,
  MovementGroupOutcome,
  MovementRepository,
} from "@/domain/activities/MovementRepository";
import type { DraftMediaItem, MediaLinkInput } from "@/domain/media/ActivityMedia";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import type { Database } from "@/infrastructure/database/Database";
import type {
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
 * `markMovementsUsed`, `countMovementDefinitions`) sont réutilisées par les
 * repositories de définitions et de Séances, dans LEUR transaction : création
 * Catalogue (Mouvement + définition), création locale en Séance (MFN-04),
 * marquage « déjà utilisé » au succès de l'enregistrement (MFN-08).
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
  await transaction.runAsync(
    `INSERT INTO movements (
      id, name, normalized_name, description, category_id, next_phase_id, used,
      level_group_id, level_sort_key, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movement.id,
      movement.name,
      normalizeMovementName(movement.name),
      movement.description,
      movement.categoryId,
      movement.nextPhaseId,
      movement.used ? 1 : 0,
      movement.levelGroup?.groupId ?? null,
      movement.levelGroup?.sortKey ?? null,
      timestamp,
      timestamp,
    ],
  );
  await insertPhases(transaction, movement.id, movement.phases);
  await insertBodyZones(transaction, movement.id, movement.bodyZoneIds);
  await replaceMovementMediaLinks(transaction, movement.id, movement.media, mediaId);
}

/**
 * Réécrit le contenu partagé d'un Mouvement existant (nom, description,
 * Catégorie, Zones, structure et compteur de phase), dans la transaction
 * courante. `media` `undefined` conserve les liens. « Déjà utilisé » et le
 * groupe de niveaux ne sont jamais modifiés ici (MFN-08 : irréversible ;
 * MFN-05 : opérations de groupe dédiées). Le compteur ne recule jamais.
 */
export async function updateMovementContent(
  transaction: Database,
  content: Omit<MovementContent, "media"> & { readonly media?: readonly MediaLinkInput[] },
  timestamp: string,
  mediaId: (position: number) => string,
): Promise<void> {
  const movement = validatedContent({ ...content, media: content.media ?? [] });
  const result = await transaction.runAsync(
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
  );
  if (result.changes !== 1) {
    throw new Error("Expected exactly one movement row to be updated.");
  }
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
    `SELECT id, name, normalized_name, description, category_id, next_phase_id, used,
            level_group_id, level_sort_key, created_at, updated_at
     FROM movements WHERE id IN (${placeholders(unique)})`,
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
      used: row.used === 1,
      levelGroup:
        row.level_group_id !== null && row.level_sort_key !== null
          ? { groupId: row.level_group_id, sortKey: row.level_sort_key }
          : null,
    };
    const checked = validateMovement(movement);
    if (!checked.ok || (row.used !== 0 && row.used !== 1)) {
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

/** MFN-08 : marque « déjà utilisé », irréversible ; identifiants inconnus ignorés. */
export async function markMovementsUsed(transaction: Database, ids: readonly string[], timestamp: string): Promise<void> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) {
    return;
  }
  await transaction.runAsync(
    `UPDATE movements SET used = 1, updated_at = ? WHERE used = 0 AND id IN (${placeholders(unique)})`,
    [timestamp, ...unique],
  );
}

/** Nombre de définitions du Catalogue qui référencent le Mouvement. */
export async function countMovementDefinitions(database: Database, id: string): Promise<number> {
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM activity_definitions WHERE movement_id = ?",
    [id],
  );
  return row?.count ?? 0;
}

const MOVEMENT_COLUMNS = `id, name, normalized_name, description, category_id, next_phase_id, used,
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

  async markUsed(ids: readonly string[]): Promise<void> {
    const timestamp = this.now();
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      await markMovementsUsed(transaction, ids, timestamp);
    });
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
      if (definitionCount > 0) {
        outcome = { status: "REFERENCED", definitionCount };
        return;
      }
      // Phases, Zones et liens de médias partent en cascade ; les assets et
      // les filiations des copies ne sont jamais touchés.
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
      if (movementId === originId) {
        outcome = { status: "INVALID_ORDER" };
        return;
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
        return;
      }
      if (movement.level_group_id !== null && movement.level_group_id !== origin.level_group_id) {
        outcome = { status: "ALREADY_IN_GROUP" };
        return;
      }
      const groupId = origin.level_group_id ?? this.uuidFactory();
      const members = origin.level_group_id === null ? [originId] : await groupMemberIds(transaction, groupId);
      const others = members.filter((id) => id !== movementId);
      const originIndex = others.indexOf(originId);
      const ordered =
        placement === "END"
          ? [...others, movementId]
          : [...others.slice(0, originIndex + 1), movementId, ...others.slice(originIndex + 1)];
      await writeGroupOrder(transaction, groupId, ordered, this.now());
      outcome = { status: "OK", members: await this.readGroup(transaction, groupId) };
    });
    return outcome;
  }
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
