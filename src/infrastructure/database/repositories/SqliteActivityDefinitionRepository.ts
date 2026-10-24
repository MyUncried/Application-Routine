import * as Crypto from "expo-crypto";

import type { CreateCategoryInput } from "@/domain/categories/Category";
import { canonicalCategoryKey } from "@/domain/categories/validation";
import type {
  ActivityDefinition,
  ActivityDefinitionOrigin,
  ActivityDefinitionRepository,
  CreateActivityDefinitionInput,
  UpdateActivityDefinitionInput,
} from "@/domain/activities";
import {
  ExecutionParametersValidationError,
  readCatalogExecutionParameters,
  serializeCatalogExecutionParameters,
  validateForSave,
  type ExecutionParameters,
} from "@/domain/activities/ExecutionParameters";
import {
  allocatePhaseIdentities,
  resolveCatalogParameters,
  splitResolvedParameters,
  type Movement,
} from "@/domain/activities/Movement";
import { MovementNotFoundError } from "@/domain/activities/MovementRepository";
import {
  planSiblingsCorrection,
  SharedCorrectionRefusedError,
  type SiblingCompletion,
  type SiblingDefinition,
} from "@/domain/activities/sharedCorrection";
import type { Database } from "@/infrastructure/database/Database";
import type { ActivityDefinitionRow } from "@/infrastructure/database/types/DatabaseRows";

import {
  insertMovement,
  joinMovementGroup,
  readMovementRecords,
  updateMovementContent,
  type MovementRecord,
} from "./SqliteMovementRepository";

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

const SELECT_COLUMNS = "id, movement_id, execution_parameters, created_at, updated_at";

/**
 * PRE-4 (story 1.1, AD-3, AD-13) : défense du repository — les paramètres
 * sont contrôlés au niveau structurel (`validateForSave(…, "STORAGE")`) AVANT
 * toute écriture (un troisième Mode ou une Cible `UNSET` est refusé, AC19).
 * PRE-7 (A1.1, D-438) : une durée de phase manquante est refusée — l'Exercice
 * édité doit être complet (MFN/AC25).
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
 * identifiant réellement persisté (D-211) : `EXISTING` doit référencer une
 * Catégorie déjà présente (défense en profondeur) ; `NEW` retrouve la
 * Catégorie de même clé canonique si elle existe déjà (D-106, jamais de
 * doublon) ou la crée sinon. PRE-7 (A1.2) : la Catégorie est portée par le
 * Mouvement (`movements.category_id`).
 */
async function resolveCategoryId(
  transaction: Database,
  category: CreateCategoryInput,
  uuidFactory: UuidFactory,
  timestamp: string,
  /** Catégorie déjà assignée au Mouvement de cet Exercice avant la modification — `null` à la création (T16). */
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
      // PRE-4, décision Q53 (8) : à la création, une Catégorie retirée déjà affectée à un
      // Mouvement ou une occurrence est acceptée (Catégorie conservée par l'Éditeur après sa
      // suppression depuis la feuille, ou héritée) ; affectée nulle part, elle reste refusée (D-210).
      const used = await transaction.getFirstAsync<{ id: string }>(
        `SELECT id FROM activities WHERE category_id = ?
         UNION ALL
         SELECT id FROM movements WHERE category_id = ?
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
 * Autres définitions du Mouvement (`excludedId` exclu), paramètres résolus par
 * sa structure COURANTE — frères incomplets compris. Ordre stable :
 * `updated_at DESC`, puis identifiant.
 */
async function readSiblingDefinitions(
  transaction: Database,
  movement: Movement,
  excludedId: string | null,
): Promise<readonly SiblingDefinition[]> {
  const rows = await transaction.getAllAsync<{ id: string; execution_parameters: string }>(
    "SELECT id, execution_parameters FROM activity_definitions WHERE movement_id = ? ORDER BY updated_at DESC, id ASC",
    [movement.id],
  );
  return rows
    .filter((row) => row.id !== excludedId)
    .map((row) => ({
      definitionId: row.id,
      parameters: resolveCatalogParameters(movement.phases, readCatalogExecutionParameters(row.execution_parameters)).parameters,
    }));
}

/**
 * Persistance SQLite des `ActivityDefinition` — PRE-7 (A1.2, D-437,
 * `migration012`) : une définition référence son Mouvement
 * (`activity_definitions.movement_id`, intègre) et porte ses paramètres
 * propres en forme Catalogue v4 ; le contenu partagé (nom, description,
 * médias, Catégorie, Zones, structure des phases) est porté par le Mouvement.
 *
 * - `create` (PRE-7 A1.3 : origine explicite, `ActivityDefinitionOrigin`) :
 *   geste indépendant ou variante → Mouvement neuf (« déjà utilisé » faux) et
 *   sa définition, la variante étant au besoin insérée après l'origine dans
 *   son groupe ; même geste → définition sur le Mouvement existant, contenu
 *   appliqué comme correction partagée. Toujours dans UNE transaction : une
 *   erreur ne laisse ni Mouvement ni média orphelin. Pour un Mouvement neuf,
 *   les identités de phases du brouillon sont reprises, le compteur posé à
 *   max(`id`) + 1.
 * - `update` (correction partagée, MFN-08) garde l'identité des phases déjà
 *   présentes dans la structure du Mouvement et alloue par le compteur celles
 *   qui n'y sont pas (`allocatePhaseIdentities`, MFN-02) ; si l'ensemble des
 *   phases change, chaque frère est réassocié par `phaseId` selon les
 *   complétions fournies (`planSiblingsCorrection`), incomplets explicitement
 *   acceptés compris ; un frère non prêt lève `SharedCorrectionRefusedError`
 *   sans écriture.
 * - la lecture résout structure + valeurs (`resolveCatalogParameters`) : un
 *   exercice frère incomplet est relu avec `missingPhaseIds` ; un écart
 *   structure ≠ valeurs lève `ExecutionParametersDataError`.
 *
 * `uuidFactory`/`now` injectables pour les tests ; ordre de consommation :
 * définition, Mouvement (sauf même geste), Catégorie nouvelle, liens de médias,
 * groupe nouveau d'une variante rattachée.
 */
export class SqliteActivityDefinitionRepository implements ActivityDefinitionRepository {
  constructor(
    private readonly database: Database,
    private readonly uuidFactory: UuidFactory = Crypto.randomUUID,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async create(
    input: CreateActivityDefinitionInput,
    origin: ActivityDefinitionOrigin = { kind: "INDEPENDENT" },
  ): Promise<ActivityDefinition> {
    const canonical = validatedParameters(input);
    const id = this.uuidFactory();
    const timestamp = this.now();

    if (origin.kind === "SAME_MOVEMENT") {
      // PRE-7 (A1.3, MFN-06) : même geste — la définition référence le
      // Mouvement existant ; le contenu saisi lui est appliqué comme une
      // correction partagée, frères compris, dans UNE transaction.
      await this.database.withExclusiveTransactionAsync(async (transaction) => {
        const parameters = await this.applySharedCorrection(
          transaction,
          origin.movementId,
          null,
          input,
          canonical,
          origin.siblingCompletions ?? [],
          timestamp,
        );
        await transaction.runAsync(
          `INSERT INTO activity_definitions (id, movement_id, execution_parameters, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
          [id, origin.movementId, serializeCatalogExecutionParameters(splitResolvedParameters(parameters).parameters), timestamp, timestamp],
        );
      });
      return this.readCreated(id);
    }

    const split = splitResolvedParameters(canonical);
    const movementId = this.uuidFactory();
    // Asset(s) importé(s) + Mouvement + définition + liens ordonnés dans UNE
    // transaction (Terminer Catalogue) — aucune écriture partielle.
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      if (origin.kind === "VARIANT") {
        const originRow = await transaction.getFirstAsync<{ id: string }>("SELECT id FROM movements WHERE id = ?", [
          origin.originMovementId,
        ]);
        if (!originRow) {
          throw new MovementNotFoundError(origin.originMovementId);
        }
      }
      const categoryId = await resolveCategoryId(transaction, input.category, this.uuidFactory, timestamp);
      await insertMovement(
        transaction,
        {
          id: movementId,
          name: input.name,
          description: input.description,
          media: input.media ?? [],
          categoryId,
          bodyZoneIds: input.bodyZoneIds,
          phases: split.phases,
          nextPhaseId: split.phases.reduce((max, phase) => Math.max(max, phase.id), 0) + 1,
          used: false,
          levelGroup: null,
        },
        timestamp,
        () => this.uuidFactory(),
      );
      await transaction.runAsync(
        `INSERT INTO activity_definitions (id, movement_id, execution_parameters, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, movementId, serializeCatalogExecutionParameters(split.parameters), timestamp, timestamp],
      );
      if (origin.kind === "VARIANT" && origin.joinOriginGroup) {
        // MFN-07 : « un niveau créé s'insère immédiatement après celui dont il est issu ».
        const joined = await joinMovementGroup(
          transaction,
          movementId,
          origin.originMovementId,
          "AFTER_ORIGIN",
          this.uuidFactory,
          timestamp,
        );
        if (joined.status !== "OK") {
          throw new Error(`The variant could not join the origin level group (${joined.status}).`);
        }
      }
    });

    return this.readCreated(id);
  }

  private async readCreated(id: string): Promise<ActivityDefinition> {
    const created = await this.findById(id);
    if (!created) {
      throw new Error("The created activity definition could not be read back.");
    }
    return created;
  }

  async update(
    id: string,
    input: UpdateActivityDefinitionInput,
    siblingCompletions: readonly SiblingCompletion[] = [],
  ): Promise<ActivityDefinition | null> {
    const canonical = validatedParameters(input);
    const timestamp = this.now();
    let updated = false;

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const existing = await transaction.getFirstAsync<{ id: string; movement_id: string }>(
        "SELECT id, movement_id FROM activity_definitions WHERE id = ?",
        [id],
      );
      if (!existing) {
        return;
      }
      const parameters = await this.applySharedCorrection(
        transaction,
        existing.movement_id,
        id,
        input,
        canonical,
        siblingCompletions,
        timestamp,
      );
      await transaction.runAsync(
        "UPDATE activity_definitions SET execution_parameters = ?, updated_at = ? WHERE id = ?",
        [serializeCatalogExecutionParameters(splitResolvedParameters(parameters).parameters), timestamp, id],
      );
      updated = true;
    });

    if (!updated) {
      return null;
    }
    return this.findById(id);
  }

  /**
   * PRE-7 (A1.3, MFN-08, ch11 « Enregistrer une correction ») — correction
   * partagée dans la transaction COURANTE : contenu du Mouvement (nom,
   * description, médias, Catégorie, Zones, structure) réécrit une fois pour
   * tous les Exercices qui le partagent ; identités de phases allouées par le
   * compteur (`allocatePhaseIdentities`) ; frères (`editedDefinitionId`
   * exclu ; `null` pour une création sur le même geste) réassociés par
   * `phaseId` (`planSiblingsCorrection`) et réécrits en v4, incomplets compris.
   * Frères non prêts → `SharedCorrectionRefusedError` AVANT toute écriture.
   * Les copies de Séance et les instantanés ne sont jamais lus ni écrits.
   * Retourne les paramètres résolus de l'Exercice édité (identités allouées).
   */
  private async applySharedCorrection(
    transaction: Database,
    movementId: string,
    editedDefinitionId: string | null,
    input: CreateActivityDefinitionInput,
    canonical: ExecutionParameters,
    siblingCompletions: readonly SiblingCompletion[],
    timestamp: string,
  ): Promise<ExecutionParameters> {
    const record = (await readMovementRecords(transaction, [movementId])).get(movementId);
    if (!record) {
      if (editedDefinitionId === null) {
        throw new MovementNotFoundError(movementId);
      }
      throw new Error("The movement of the activity definition is missing.");
    }
    const current = record.movement;
    const allocation = allocatePhaseIdentities(current, canonical);
    const siblings = await readSiblingDefinitions(transaction, current, editedDefinitionId);
    const plan = planSiblingsCorrection(current.phases, allocation.movement.phases, siblings, siblingCompletions);
    if (plan.status === "REFUSED") {
      throw new SharedCorrectionRefusedError(plan.refusal);
    }
    const categoryId = await resolveCategoryId(
      transaction,
      input.category,
      this.uuidFactory,
      timestamp,
      current.categoryId,
    );
    const split = splitResolvedParameters(allocation.parameters);
    // PRE-3 : `media` absent (ancien appelant) conserve les liens ; une
    // liste explicite — même vide — les remplace. Les assets ne sont
    // jamais supprimés.
    await updateMovementContent(
      transaction,
      {
        ...allocation.movement,
        name: input.name,
        description: input.description,
        categoryId,
        bodyZoneIds: input.bodyZoneIds,
        phases: split.phases,
        ...(input.media !== undefined ? { media: input.media } : {}),
      },
      timestamp,
      () => this.uuidFactory(),
    );
    for (const sibling of plan.updates) {
      await transaction.runAsync(
        "UPDATE activity_definitions SET execution_parameters = ?, updated_at = ? WHERE id = ?",
        [serializeCatalogExecutionParameters(sibling.parameters), timestamp, sibling.definitionId],
      );
    }
    return allocation.parameters;
  }

  async findById(id: string): Promise<ActivityDefinition | null> {
    const row = await this.database.getFirstAsync<ActivityDefinitionRow>(
      `SELECT ${SELECT_COLUMNS} FROM activity_definitions WHERE id = ?`,
      [id],
    );
    if (!row) {
      return null;
    }
    const records = await readMovementRecords(this.database, [row.movement_id]);
    return mapActivityDefinitionRow(row, records);
  }

  async listAll(): Promise<readonly ActivityDefinition[]> {
    const rows = await this.database.getAllAsync<ActivityDefinitionRow>(
      `SELECT ${SELECT_COLUMNS} FROM activity_definitions ORDER BY updated_at DESC`,
    );
    const records = await readMovementRecords(
      this.database,
      rows.map((row) => row.movement_id),
    );
    return rows.map((row) => mapActivityDefinitionRow(row, records));
  }
}

/**
 * Projection d'une ligne (PRE-7, A1.2) : contenu du Mouvement + paramètres
 * Catalogue v4 (`readCatalogExecutionParameters`, strict ; aucune lecture
 * v2/v3) résolus par la structure du Mouvement (`resolveCatalogParameters`).
 * Le côté et la Pause entre les côtés exposés sont ceux des paramètres.
 */
function mapActivityDefinitionRow(
  row: ActivityDefinitionRow,
  records: ReadonlyMap<string, MovementRecord>,
): ActivityDefinition {
  const record = records.get(row.movement_id);
  if (!record) {
    throw new Error("The movement of the activity definition is missing.");
  }
  const { movement } = record;
  const resolution = resolveCatalogParameters(movement.phases, readCatalogExecutionParameters(row.execution_parameters));
  const executionParameters = resolution.parameters;
  return {
    executionParameters,
    ...(resolution.status === "INCOMPLETE" ? { missingPhaseIds: resolution.missingPhaseIds } : {}),
    media: record.mediaLinks.map((link) => ({
      id: link.id,
      activityDefinitionId: row.id,
      assetId: link.assetId,
      position: link.position,
      asset: { ...link.asset },
    })),
    id: row.id,
    movementId: movement.id,
    name: movement.name,
    description: movement.description,
    categoryId: movement.categoryId,
    bodyZoneIds: [...movement.bodyZoneIds],
    sideMode: executionParameters.sideMode,
    sideRecoverySeconds: executionParameters.sideRecoverySeconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
