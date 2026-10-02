import type { ActivityMediaWithAsset } from "./ActivityMedia";

/** Contrat de lecture des médias ordonnés d'un Exercice (V2-PRE-1, plan §3.3/§13/§8). */
export interface MediaRepository {
  /** Médias associés à un Exercice, déjà ordonnés par position croissante. */
  listForActivityDefinition(
    activityDefinitionId: string,
  ): Promise<readonly ActivityMediaWithAsset[]>;
}
