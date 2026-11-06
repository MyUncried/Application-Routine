import type { Movement } from "@/domain/activities/Movement";
import { normalizeMovementName, validateMovement } from "@/domain/activities/Movement";
import type { Database } from "@/infrastructure/database/Database";
import {
  insertMovement,
  readMovementRecords,
} from "@/infrastructure/database/repositories/SqliteMovementRepository";

/**
 * Seed strictement réservé aux bases de TEST isolées.
 *
 * Réutilise les validateurs du Domaine et insertMovement, qui écrit les
 * associations d'un Mouvement dans la transaction fournie. Aucun mécanisme
 * alternatif de persistance, aucune API de production, aucun changement moteur.
 *
 * Ne reçoit que des Mouvements déjà classés avec les IDs KODJO existants.
 * Le corpus éditorial pilote (catalogue/pilote) ne doit JAMAIS être injecté ici.
 */
export async function seedMovementTestCorpus(
  database: Database,
  movements: readonly Movement[],
  timestamp: string,
): Promise<{ readonly inserted: number; readonly unchanged: number }> {
  const byId = new Set<string>();
  const byName = new Set<string>();
  const ready: Movement[] = [];

  // Prévalidation complète : aucune écriture avant la première erreur.
  for (const movement of movements) {
    const result = validateMovement(movement);
    if (!result.ok) {
      throw new Error(
        `Invalid test Movement ${movement.id}: ${result.violations.map((v) => v.field).join(", ")}`,
      );
    }
    const normalized = result.value;
    // Pas de média (fichier physique) ni de famille de niveaux dans le smoke
    // seed ; ces variantes ont des fixtures spécialisées existantes.
    if (normalized.media.length !== 0 || normalized.levelGroup !== null) {
      throw new Error(`Only standalone movements without media can be seeded: ${normalized.id}`);
    }
    const key = normalizeMovementName(normalized.name);
    if (byId.has(normalized.id) || byName.has(key)) {
      throw new Error(`Duplicate movement identity or name in seed: ${normalized.id}`);
    }
    byId.add(normalized.id);
    byName.add(key);
    ready.push(normalized);
  }

  const equivalent = (a: Movement, b: Movement): boolean =>
    a.id === b.id &&
    a.name === b.name &&
    a.description === b.description &&
    a.categoryId === b.categoryId &&
    a.nextPhaseId === b.nextPhaseId &&
    JSON.stringify([...a.bodyZoneIds].sort()) === JSON.stringify([...b.bodyZoneIds].sort()) &&
    JSON.stringify(a.phases) === JSON.stringify(b.phases) &&
    JSON.stringify(a.aliases) === JSON.stringify(b.aliases) &&
    a.media.length === 0 &&
    a.levelGroup === null;

  let inserted = 0;
  let unchanged = 0;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const existing = await readMovementRecords(
      transaction,
      ready.map((movement) => movement.id),
    );

    for (const movement of ready) {
      const stored = existing.get(movement.id)?.movement;
      if (stored !== undefined) {
        if (!equivalent(stored, movement)) {
          throw new Error(`Refusing to overwrite an existing test Movement: ${movement.id}`);
        }
        unchanged++;
        continue;
      }
      // insertMovement n'ouvre pas de transaction : tout le batch est atomique.
      await insertMovement(transaction, { ...movement, media: [] }, timestamp, (i) =>
        `seed-media-${movement.id}-${i}`,
      );
      inserted++;
    }
  });
  return { inserted, unchanged };
}
