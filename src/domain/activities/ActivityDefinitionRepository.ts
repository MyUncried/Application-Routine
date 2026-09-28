import type {
  ActivityDefinition,
  CreateActivityDefinitionInput,
  UpdateActivityDefinitionInput,
} from "./ActivityDefinition";

/** Repository de persistance des `ActivityDefinition` (V2-CAT-01). Aucune suppression, archivage ni restauration ne sont exposés : hors périmètre de cette tranche. */
export interface ActivityDefinitionRepository {
  create(input: CreateActivityDefinitionInput): Promise<ActivityDefinition>;
  findById(id: string): Promise<ActivityDefinition | null>;
  /** Triée par `updatedAt DESC` — tri implicite, jamais une préférence persistée (plan §4.1). */
  listAll(): Promise<readonly ActivityDefinition[]>;
  /** `null` si l'identifiant est inconnu. */
  update(id: string, input: UpdateActivityDefinitionInput): Promise<ActivityDefinition | null>;
}
