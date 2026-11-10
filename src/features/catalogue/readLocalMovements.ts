import type { LocalMovement } from "@/domain/catalogue/catalogueLoadPlan";
import type { FreshMovementReader } from "@/features/activities/ActivityDefinitionService";
import { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";

/**
 * Lecture fraîche des Mouvements locaux (archivés compris) pour le chargement de catalogue :
 * le service Catalogue existant est exécuté dans une transaction du repository
 * (`SqliteMovementRepository.readFresh`). Avec expo-sqlite, la connexion principale peut relire un
 * instantané antérieur juste après une transaction (incident du 9/11) : une fiche à peine installée
 * paraîtrait « retirée localement » et une opération à reprendre serait abandonnée à tort.
 */
export function freshLocalMovementReader(source: FreshMovementReader): () => Promise<readonly LocalMovement[]> {
  return () =>
    source.readFresh(async (repository) =>
      (await new MovementCatalogueService(repository).listEntries())
        .map((entry) => ({ movement: entry.movement, archived: entry.archived })));
}
