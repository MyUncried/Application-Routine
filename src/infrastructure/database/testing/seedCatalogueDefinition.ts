import { serializeCatalogExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { normalizeMovementName, splitResolvedParameters } from "@/domain/activities/Movement";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Database } from "@/infrastructure/database/Database";

/**
 * Tests seulement (PRE-7, A1.2) — insère directement en SQL, sur le schéma de
 * `migration012`, un Exercice du Catalogue et son Mouvement : ligne
 * `movements` (identifiant `mov-{id}` par défaut), Zones du Mouvement et
 * définition aux paramètres Catalogue v4 (Durée 30 s × 3, Pause 10 s).
 * Remplace les anciennes insertions directes dans `activity_definitions`
 * (schéma aplati v11).
 */
export async function seedCatalogueDefinition(
  database: Database,
  options: {
    readonly id: string;
    readonly movementId?: string;
    readonly name?: string;
    readonly categoryId?: string;
    readonly bodyZoneIds?: readonly string[];
  },
): Promise<{ readonly movementId: string }> {
  const movementId = options.movementId ?? `mov-${options.id}`;
  const name = options.name ?? "Squat";
  await database.runAsync(
    `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, used, created_at, updated_at)
     VALUES (?, ?, ?, NULL, ?, 1, 0, 'now', 'now')`,
    [movementId, name, normalizeMovementName(name), options.categoryId ?? "cardio"],
  );
  for (const bodyZoneId of options.bodyZoneIds ?? ["cuisses"]) {
    await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES (?, ?)", [
      movementId,
      bodyZoneId,
    ]);
  }
  const { parameters } = splitResolvedParameters(durationParameters(30, 3, 10));
  await database.runAsync(
    `INSERT INTO activity_definitions (id, movement_id, execution_parameters, created_at, updated_at)
     VALUES (?, ?, ?, 'now', 'now')`,
    [options.id, movementId, serializeCatalogExecutionParameters(parameters)],
  );
  return { movementId };
}
