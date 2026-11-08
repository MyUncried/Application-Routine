import type { CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import { validateForSave } from "@/domain/activities/ExecutionParameters";
import { splitResolvedParameters } from "@/domain/activities/Movement";
import { canonicalCategoryKey } from "@/domain/categories/validation";
import type { Database } from "@/infrastructure/database/Database";
import { insertMovement, joinMovementGroup } from "@/infrastructure/database/repositories/SqliteMovementRepository";

/** Origine d'un Mouvement de test : indépendant, ou niveau rattaché au groupe d'un Mouvement existant. */
export type TestMovementOrigin =
  | { readonly kind: "INDEPENDENT" }
  | {
      readonly kind: "VARIANT";
      readonly originMovementId: string;
      readonly joinOriginGroup: boolean;
      readonly placement?: "BEFORE_ORIGIN" | "AFTER_ORIGIN";
    };

/**
 * Tests seulement — crée un Mouvement complet (nom, description, Catégorie, Zones, médias, structure
 * de phases issue des paramètres saisis) dans UNE transaction, au besoin rattaché au groupe de niveaux
 * d'un Mouvement d'origine (avant / après), par les fonctions transactionnelles du dépôt des
 * Mouvements (`insertMovement`, `joinMovementGroup`).
 *
 * [PRE-9 A.3 du 04/11/2026 : remplace, dans les tests, la création d'un Mouvement au travers d'une
 * ancienne définition du Catalogue (`createActivityDefinitionWithOrigin`), retirée avec elles —
 * décision de Hermann du 04/11/2026 : « Hermann abandonne la conversion sans perte prévue par A.4 :
 * les anciens exercices concernés par cette conversion peuvent être supprimés plutôt que migrés. »
 * Aucune ligne de définition n'est écrite.]
 */
export async function createTestMovement(
  database: Database,
  input: CreateActivityDefinitionInput,
  origin: TestMovementOrigin = { kind: "INDEPENDENT" },
  ids: () => string,
  now: () => string = () => new Date().toISOString(),
): Promise<{ readonly movementId: string }> {
  const validated = validateForSave(input.executionParameters, "STORAGE");
  if (!validated.ok) {
    throw new Error(`Invalid test movement parameters: ${JSON.stringify(validated.violations)}`);
  }
  const split = splitResolvedParameters(validated.value);
  const movementId = ids();
  const timestamp = now();
  await database.withExclusiveTransactionAsync(async (transaction) => {
    let categoryId: string;
    if (input.category.kind === "EXISTING") {
      categoryId = input.category.categoryId;
    } else {
      const canonicalKey = canonicalCategoryKey(input.category.name);
      const existing = await transaction.getFirstAsync<{ id: string }>("SELECT id FROM categories WHERE canonical_key = ?", [
        canonicalKey,
      ]);
      if (existing) {
        categoryId = existing.id;
      } else {
        categoryId = ids();
        await transaction.runAsync(
          `INSERT INTO categories (id, name, canonical_key, color, is_predefined, display_order, is_active, created_at)
           VALUES (?, ?, ?, ?, 0, NULL, 1, ?)`,
          [categoryId, input.category.name, canonicalKey, input.category.color, timestamp],
        );
      }
    }
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
        aliases: [],
        levelGroup: null,
      },
      timestamp,
      () => ids(),
    );
    if (origin.kind === "VARIANT" && origin.joinOriginGroup) {
      const joined = await joinMovementGroup(
        transaction,
        movementId,
        origin.originMovementId,
        origin.placement ?? "AFTER_ORIGIN",
        ids,
        timestamp,
      );
      if (joined.status !== "OK") {
        throw new Error(`The test movement could not join the origin level group (${joined.status}).`);
      }
    }
  });
  return { movementId };
}
