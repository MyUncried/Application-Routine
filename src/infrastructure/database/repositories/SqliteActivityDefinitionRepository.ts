import * as Crypto from "expo-crypto";

import type { CreateCategoryInput } from "@/domain/categories/Category";
import { canonicalCategoryKey } from "@/domain/categories/validation";
import type {
  ActivityDefinition,
  ActivityDefinitionRepository,
  CreateActivityDefinitionInput,
  UpdateActivityDefinitionInput,
} from "@/domain/activities";
import { DEFAULT_SIDE_MODE } from "@/domain/sessions/defaults";
import type { ExerciseExecutionMode } from "@/domain/sessions/Session";
import type { SideMode } from "@/domain/sessions/sideMode";
import type { Database } from "@/infrastructure/database/Database";
import type {
  ActivityDefinitionBodyZoneRow,
  ActivityDefinitionRow,
} from "@/infrastructure/database/types/DatabaseRows";

type UuidFactory = () => string;
type CategoryIdRow = { id: string };

const SELECT_COLUMNS = `
  id, name, description, execution_mode, duration_seconds, repetition_count,
  series_count, pause_seconds, category_id, side_mode, side_recovery_seconds,
  created_at, updated_at
`;

/**
 * Résout une référence de Catégorie (`CreateCategoryInput`) vers un
 * identifiant réellement persisté (D-211) — même patron que l'ancienne
 * résolution `session_categories` (`SqliteSessionRepository`), désormais
 * portée par l'Exercice : `EXISTING` doit référencer une Catégorie déjà
 * présente (défense en profondeur) ; `NEW` retrouve la Catégorie de même clé
 * canonique si elle existe déjà (D-106, jamais de doublon) ou la crée sinon.
 */
async function resolveCategoryId(
  transaction: Database,
  category: CreateCategoryInput,
  uuidFactory: UuidFactory,
  timestamp: string,
): Promise<string> {
  if (category.kind === "EXISTING") {
    const row = await transaction.getFirstAsync<CategoryIdRow>(
      "SELECT id FROM categories WHERE id = ?",
      [category.categoryId],
    );
    if (!row) {
      throw new Error("Referenced category does not exist.");
    }
    return row.id;
  }

  const canonicalKey = canonicalCategoryKey(category.name);
  const existing = await transaction.getFirstAsync<CategoryIdRow>(
    "SELECT id FROM categories WHERE canonical_key = ?",
    [canonicalKey],
  );
  if (existing) {
    return existing.id;
  }
  const categoryId = uuidFactory();
  await transaction.runAsync(
    `INSERT INTO categories (id, name, canonical_key, color, is_predefined, display_order, is_active, created_at)
     VALUES (?, ?, ?, ?, 0, NULL, 1, ?)`,
    [categoryId, category.name, canonicalKey, category.color, timestamp],
  );
  return categoryId;
}

/**
 * Persistance SQLite des `ActivityDefinition` (V2-CAT-01, `migration006` ;
 * V2-PRE-1, `migration007` : Catégorie obligatoire, pause de changement de
 * côté propre, retrait de la récupération post-exercice). Même patron que
 * `SqliteCategoryRepository`/`SqliteSessionRepository` : aucune dépendance à
 * `expo-sqlite` directement (`Database`, interface partagée),
 * `uuidFactory`/`now` injectables pour les tests.
 */
export class SqliteActivityDefinitionRepository implements ActivityDefinitionRepository {
  constructor(
    private readonly database: Database,
    private readonly uuidFactory: UuidFactory = Crypto.randomUUID,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async create(input: CreateActivityDefinitionInput): Promise<ActivityDefinition> {
    const id = this.uuidFactory();
    const timestamp = this.now();
    const sideMode = input.sideMode ?? DEFAULT_SIDE_MODE;
    let categoryId = "";

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      categoryId = await resolveCategoryId(transaction, input.category, this.uuidFactory, timestamp);
      await transaction.runAsync(
        `INSERT INTO activity_definitions (
          id, name, description, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, category_id, side_mode, side_recovery_seconds,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.name,
          input.description,
          input.executionMode,
          input.durationSeconds,
          input.repetitionCount,
          input.seriesCount,
          input.pauseSeconds,
          categoryId,
          sideMode,
          input.sideRecoverySeconds,
          timestamp,
          timestamp,
        ],
      );
      await insertBodyZones(transaction, id, input.bodyZoneIds);
    });

    return {
      id,
      name: input.name,
      description: input.description,
      executionMode: input.executionMode,
      durationSeconds: input.durationSeconds,
      repetitionCount: input.repetitionCount,
      seriesCount: input.seriesCount,
      pauseSeconds: input.pauseSeconds,
      categoryId,
      bodyZoneIds: input.bodyZoneIds,
      sideMode,
      sideRecoverySeconds: input.sideRecoverySeconds,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  async update(
    id: string,
    input: UpdateActivityDefinitionInput,
  ): Promise<ActivityDefinition | null> {
    const timestamp = this.now();
    const sideMode = input.sideMode ?? DEFAULT_SIDE_MODE;
    let updated = false;
    let createdAt: string | null = null;
    let categoryId = "";

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const existing = await transaction.getFirstAsync<{ id: string; created_at: string }>(
        "SELECT id, created_at FROM activity_definitions WHERE id = ?",
        [id],
      );
      if (!existing) {
        return;
      }
      createdAt = existing.created_at;
      categoryId = await resolveCategoryId(transaction, input.category, this.uuidFactory, timestamp);

      await transaction.runAsync(
        `UPDATE activity_definitions SET
          name = ?, description = ?, execution_mode = ?, duration_seconds = ?,
          repetition_count = ?, series_count = ?, pause_seconds = ?,
          category_id = ?, side_mode = ?, side_recovery_seconds = ?, updated_at = ?
         WHERE id = ?`,
        [
          input.name,
          input.description,
          input.executionMode,
          input.durationSeconds,
          input.repetitionCount,
          input.seriesCount,
          input.pauseSeconds,
          categoryId,
          sideMode,
          input.sideRecoverySeconds,
          timestamp,
          id,
        ],
      );
      await transaction.runAsync(
        `DELETE FROM activity_definition_body_zones WHERE activity_definition_id = ?`,
        [id],
      );
      await insertBodyZones(transaction, id, input.bodyZoneIds);
      updated = true;
    });

    if (!updated || createdAt === null) {
      return null;
    }

    return {
      id,
      name: input.name,
      description: input.description,
      executionMode: input.executionMode,
      durationSeconds: input.durationSeconds,
      repetitionCount: input.repetitionCount,
      seriesCount: input.seriesCount,
      pauseSeconds: input.pauseSeconds,
      categoryId,
      bodyZoneIds: input.bodyZoneIds,
      sideMode,
      sideRecoverySeconds: input.sideRecoverySeconds,
      createdAt,
      updatedAt: timestamp,
    };
  }

  async findById(id: string): Promise<ActivityDefinition | null> {
    const row = await this.database.getFirstAsync<ActivityDefinitionRow>(
      `SELECT ${SELECT_COLUMNS} FROM activity_definitions WHERE id = ?`,
      [id],
    );
    if (!row) {
      return null;
    }
    const bodyZoneIds = await getBodyZoneIds(this.database, [id]);
    return mapActivityDefinitionRow(row, bodyZoneIds.get(id) ?? []);
  }

  async listAll(): Promise<readonly ActivityDefinition[]> {
    const rows = await this.database.getAllAsync<ActivityDefinitionRow>(
      `SELECT ${SELECT_COLUMNS} FROM activity_definitions ORDER BY updated_at DESC`,
    );
    const ids = rows.map((row) => row.id);
    const bodyZonesById = await getBodyZoneIds(this.database, ids);
    return rows.map((row) => mapActivityDefinitionRow(row, bodyZonesById.get(row.id) ?? []));
  }
}

async function insertBodyZones(
  transaction: Database,
  activityDefinitionId: string,
  bodyZoneIds: readonly string[],
): Promise<void> {
  for (const bodyZoneId of bodyZoneIds) {
    await transaction.runAsync(
      `INSERT INTO activity_definition_body_zones (activity_definition_id, body_zone_id) VALUES (?, ?)`,
      [activityDefinitionId, bodyZoneId],
    );
  }
}

async function getBodyZoneIds(
  database: Database,
  activityDefinitionIds: readonly string[],
): Promise<ReadonlyMap<string, readonly string[]>> {
  if (activityDefinitionIds.length === 0) {
    return new Map();
  }
  // `activityDefinitionIds` provient toujours de lignes déjà relues depuis
  // SQLite (jamais une saisie utilisateur directe) — même garantie que
  // `SqliteSessionRepository.getBodyZonesForActivities`.
  const placeholders = activityDefinitionIds.map(() => "?").join(", ");
  const rows = await database.getAllAsync<ActivityDefinitionBodyZoneRow>(
    `SELECT activity_definition_id, body_zone_id FROM activity_definition_body_zones
     WHERE activity_definition_id IN (${placeholders})`,
    activityDefinitionIds,
  );
  const byId = new Map<string, string[]>();
  for (const row of rows) {
    const list = byId.get(row.activity_definition_id) ?? [];
    list.push(row.body_zone_id);
    byId.set(row.activity_definition_id, list);
  }
  return byId;
}

function mapActivityDefinitionRow(
  row: ActivityDefinitionRow,
  bodyZoneIds: readonly string[],
): ActivityDefinition {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    executionMode: row.execution_mode as ExerciseExecutionMode,
    durationSeconds: row.duration_seconds,
    repetitionCount: row.repetition_count,
    seriesCount: row.series_count,
    pauseSeconds: row.pause_seconds,
    categoryId: row.category_id,
    bodyZoneIds,
    sideMode: row.side_mode as SideMode,
    sideRecoverySeconds: row.side_recovery_seconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
