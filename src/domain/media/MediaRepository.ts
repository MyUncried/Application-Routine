import type { ActivityMediaWithAsset } from "./ActivityMedia";
import type { MediaAsset } from "./MediaAsset";

/**
 * Contrat des médias ordonnés (V2-PRE-1, plan §3.3/§13/§8 ; PRE-3, D-333).
 *
 * Lecture ordonnée des liens d'une définition ou d'occurrences, lecture d'un
 * asset et compteur de références. Aucune suppression physique n'est
 * exposée : un fichier encore référencé par une définition, une copie ou un
 * brouillon actif n'est jamais supprimé (P3-23/file-preservation). Les
 * écritures d'assets et de liens se font dans la transaction de leur
 * propriétaire (Repository de définition ou de Séance), jamais isolément.
 */
export interface MediaRepository {
  /** Médias associés à un Exercice, déjà ordonnés par position croissante. */
  listForActivityDefinition(
    activityDefinitionId: string,
  ): Promise<readonly ActivityMediaWithAsset[]>;
  /** PRE-3 : asset persisté, ou `null`. */
  findAsset?(assetId: string): Promise<MediaAsset | null>;
  /** PRE-3 : nombre de liens référençant l'asset (PRE-7, R-3 : ceux des Mouvements seulement, C05). */
  countReferences?(assetId: string): Promise<number>;
}
