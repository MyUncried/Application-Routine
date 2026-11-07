import { normalizeMovementName } from "@/domain/activities/Movement";
import type { Database } from "@/infrastructure/database/Database";

/**
 * Tests seulement — insère directement en SQL un Mouvement (ligne `movements`, nom normalisé
 * UNIQUE : deux appels de même nom lèvent) et ses Zones.
 *
 * [PRE-9 A.3 du 04/11/2026 : remplace \`seedCatalogueDefinition\`, qui insérait aussi une ancienne
 * définition du Catalogue — supprimées par la migration 021 (décision de Hermann du 04/11/2026 :
 * « Hermann abandonne la conversion sans perte prévue par A.4 : les anciens exercices concernés par
 * cette conversion peuvent être supprimés plutôt que migrés. »).]
 */
export async function seedMovement(
  database: Database,
  options: {
    readonly movementId: string;
    readonly name?: string;
    readonly categoryId?: string;
    readonly bodyZoneIds?: readonly string[];
  },
): Promise<{ readonly movementId: string }> {
  const { movementId } = options;
  const name = options.name ?? "Squat";
  await database.runAsync(
    `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
     VALUES (?, ?, ?, NULL, ?, 1, 'now', 'now')`,
    [movementId, name, normalizeMovementName(name), options.categoryId ?? "cardio"],
  );
  for (const bodyZoneId of options.bodyZoneIds ?? ["cuisses"]) {
    await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES (?, ?)", [
      movementId,
      bodyZoneId,
    ]);
  }
  return { movementId };
}
