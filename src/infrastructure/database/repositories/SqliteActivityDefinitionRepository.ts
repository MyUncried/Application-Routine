import * as Crypto from "expo-crypto";

import type { CreateCategoryInput } from "@/domain/categories/Category";
import { canonicalCategoryKey } from "@/domain/categories/validation";
import type {
  ActivityDefinition,
  ActivityDefinitionRepository,
  CreateActivityDefinitionInput,
  UpdateActivityDefinitionInput,
} from "@/domain/activities";
import {
  ExecutionParametersValidationError,
  projectScalars,
  readV2,
  serializeV2,
  validateForSave,
  type ExecutionParameters,
} from "@/domain/activities/ExecutionParameters";
import type { Database } from "@/infrastructure/database/Database";
import type {
  ActivityDefinitionBodyZoneRow,
  ActivityDefinitionRow,
} from "@/infrastructure/database/types/DatabaseRows";

import { listDefinitionMediaByIds, replaceDefinitionMediaLinks } from "./SqliteMediaRepository";

type UuidFactory = () => string;
type CategoryIdRow = { id: string; is_active: 0 | 1 };

/**
 * Garde « valeur retirée » côté stockage (T16, D-210, CE-UI-09 L2825/L2837) :
 * une référence `EXISTING` vers une Catégorie RETIRÉE est refusée, SAUF si
 * elle est identique à l'affectation déjà persistée de cet Exercice (une
 * modification qui ne touche pas la Catégorie reste permise même si celle-ci
 * a été retirée entre-temps). Le brouillon appelant reste intact : cette
 * erreur se propage telle quelle, jamais une écriture partielle.
 */
export class RetiredCategoryError extends Error {
  constructor() {
    super("The referenced category has been retired and cannot be newly assigned.");
    this.name = "RetiredCategoryError";
  }
}

const SELECT_COLUMNS = `
  id, name, description, execution_mode, duration_seconds, repetition_count,
  series_count, pause_seconds, category_id, side_mode, side_recovery_seconds,
  execution_parameters, created_at, updated_at
`;

/**
 * PRE-4 (story 1.1, AD-3, AD-13) : défense du repository — les paramètres
 * sont contrôlés au niveau structurel (`validateForSave(…, "STORAGE")`) AVANT
 * toute écriture (un troisième Mode ou une Cible `UNSET` est refusé, AC19),
 * puis les colonnes historiques reçoivent UNIQUEMENT la projection scalaire
 * unique (`projectScalars`) — jamais une écriture indépendante concurrente.
 */
function validatedParameters(input: CreateActivityDefinitionInput): ExecutionParameters {
  const validated = validateForSave(input.executionParameters, "STORAGE");
  if (!validated.ok) {
    throw new ExecutionParametersValidationError(validated.violations);
  }
  return validated.value;
}

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
  /** Catégorie déjà assignée à cet Exercice avant la modification — `null` à la création (T16). */
  currentCategoryId: string | null = null,
): Promise<string> {
  if (category.kind === "EXISTING") {
    const row = await transaction.getFirstAsync<CategoryIdRow>(
      "SELECT id, is_active FROM categories WHERE id = ?",
      [category.categoryId],
    );
    if (!row) {
      throw new Error("Referenced category does not exist.");
    }
    if (row.is_active === 0 && row.id !== currentCategoryId) {
      // PRE-4, décision Q53 (8) : à la création, une Catégorie retirée déjà affectée à une Définition ou une
      // occurrence est acceptée (Catégorie conservée par l'Éditeur après sa suppression depuis
      // la feuille, ou héritée) ; affectée nulle part, elle reste refusée (D-210).
      const used = await transaction.getFirstAsync<{ id: string }>(
        `SELECT id FROM activities WHERE category_id = ?
         UNION ALL
         SELECT id FROM activity_definitions WHERE category_id = ?
         LIMIT 1`,
        [row.id, row.id],
      );
      // Création seulement : une modification ne garde que sa propre Catégorie.
      if (!used || currentCategoryId !== null) {
        throw new RetiredCategoryError();
      }
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
    const canonical = validatedParameters(input);
    const values = projectScalars(canonical);
    const id = this.uuidFactory();
    const timestamp = this.now();

    // PRE-3 : asset(s) importé(s) + définition + liens ordonnés dans UNE
    // transaction (Terminer Catalogue) — aucune écriture partielle.
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const categoryId = await resolveCategoryId(transaction, input.category, this.uuidFactory, timestamp);
      await transaction.runAsync(
        `INSERT INTO activity_definitions (
          id, name, description, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, category_id, side_mode, side_recovery_seconds,
          execution_parameters, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.name,
          input.description,
          values.executionMode,
          values.durationSeconds,
          values.repetitionCount,
          values.seriesCount,
          values.pauseSeconds,
          categoryId,
          values.sideMode,
          values.sideRecoverySeconds,
          serializeV2(canonical),
          timestamp,
          timestamp,
        ],
      );
      await insertBodyZones(transaction, id, input.bodyZoneIds);
      await replaceDefinitionMediaLinks(transaction, id, input.media ?? [], this.uuidFactory);
    });

    const created = await this.findById(id);
    if (!created) {
      throw new Error("The created activity definition could not be read back.");
    }
    return created;
  }

  async update(
    id: string,
    input: UpdateActivityDefinitionInput,
  ): Promise<ActivityDefinition | null> {
    const canonical = validatedParameters(input);
    const values = projectScalars(canonical);
    const timestamp = this.now();
    let updated = false;

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const existing = await transaction.getFirstAsync<{
        id: string;
        created_at: string;
        category_id: string;
      }>("SELECT id, created_at, category_id FROM activity_definitions WHERE id = ?", [id]);
      if (!existing) {
        return;
      }
      const categoryId = await resolveCategoryId(
        transaction,
        input.category,
        this.uuidFactory,
        timestamp,
        existing.category_id,
      );

      await transaction.runAsync(
        `UPDATE activity_definitions SET
          name = ?, description = ?, execution_mode = ?, duration_seconds = ?,
          repetition_count = ?, series_count = ?, pause_seconds = ?,
          category_id = ?, side_mode = ?, side_recovery_seconds = ?,
          execution_parameters = ?, updated_at = ?
         WHERE id = ?`,
        [
          input.name,
          input.description,
          values.executionMode,
          values.durationSeconds,
          values.repetitionCount,
          values.seriesCount,
          values.pauseSeconds,
          categoryId,
          values.sideMode,
          values.sideRecoverySeconds,
          serializeV2(canonical),
          timestamp,
          id,
        ],
      );
      await transaction.runAsync(
        `DELETE FROM activity_definition_body_zones WHERE activity_definition_id = ?`,
        [id],
      );
      await insertBodyZones(transaction, id, input.bodyZoneIds);
      // PRE-3 : `media` absent (ancien appelant) conserve les liens ; une
      // liste explicite — même vide — les remplace. Les assets ne sont
      // jamais supprimés.
      if (input.media !== undefined) {
        await replaceDefinitionMediaLinks(transaction, id, input.media, this.uuidFactory);
      }
      updated = true;
    });

    if (!updated) {
      return null;
    }
    return this.findById(id);
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
    const media = await listDefinitionMediaByIds(this.database, [id]);
    return mapActivityDefinitionRow(row, bodyZoneIds.get(id) ?? [], media.get(id) ?? []);
  }

  async listAll(): Promise<readonly ActivityDefinition[]> {
    const rows = await this.database.getAllAsync<ActivityDefinitionRow>(
      `SELECT ${SELECT_COLUMNS} FROM activity_definitions ORDER BY updated_at DESC`,
    );
    const ids = rows.map((row) => row.id);
    const bodyZonesById = await getBodyZoneIds(this.database, ids);
    const mediaById = await listDefinitionMediaByIds(this.database, ids);
    return rows.map((row) =>
      mapActivityDefinitionRow(row, bodyZonesById.get(row.id) ?? [], mediaById.get(row.id) ?? []),
    );
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

/**
 * Projection d'une ligne. PRE-4 (story 1.1, AD-3) : `readV2` est le seul
 * lecteur ; NULL, JSON corrompu, v1 ou version inconnue lèvent une
 * `ExecutionParametersDataError` — jamais un repli sur les scalaires, qui ne
 * sont ni relus ni exposés. Le côté et la Pause entre les côtés exposés sont
 * ceux des paramètres.
 */
function mapActivityDefinitionRow(
  row: ActivityDefinitionRow,
  bodyZoneIds: readonly string[],
  media: ActivityDefinition["media"] = [],
): ActivityDefinition {
  const executionParameters = readV2(row.execution_parameters);
  return {
    executionParameters,
    media,
    id: row.id,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    bodyZoneIds,
    sideMode: executionParameters.sideMode,
    sideRecoverySeconds: executionParameters.sideRecoverySeconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
