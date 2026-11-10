import type { LocalMovement } from "@/domain/catalogue/catalogueLoadPlan";
import { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";
import type { Database } from "@/infrastructure/database/Database";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";

/**
 * Lecture fraîche des Mouvements locaux (archivés compris) pour le chargement de catalogue :
 * le service Catalogue existant est exécuté sur la connexion de la transaction. Avec expo-sqlite,
 * la connexion principale peut relire un instantané antérieur juste après une transaction
 * (incident du 9/11) : une fiche à peine installée paraîtrait « retirée localement » et une
 * opération à reprendre serait abandonnée à tort.
 */
export function freshLocalMovementReader(database: Database): () => Promise<readonly LocalMovement[]> {
  return async () => {
    let result: readonly LocalMovement[] = [];
    await database.withExclusiveTransactionAsync(async (transaction) => {
      const entries = await new MovementCatalogueService(new SqliteMovementRepository(transaction)).listEntries();
      result = entries.map((entry) => ({ movement: entry.movement, archived: entry.archived }));
    });
    return result;
  };
}
