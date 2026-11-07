import type { MediaAsset } from "./MediaAsset";

/**
 * Contrat des médias ordonnés (V2-PRE-1, plan §3.3/§13/§8 ; PRE-3, D-333).
 *
 * Lecture d'un asset et compteur de références. [PRE-9 A.3 du 04/11/2026 : la
 * lecture des liens d'une ancienne définition du Catalogue est retirée avec elles.] Aucune suppression physique n'est
 * exposée : un fichier encore référencé par une définition, une copie ou un
 * brouillon actif n'est jamais supprimé (P3-23/file-preservation). Les
 * écritures d'assets et de liens se font dans la transaction de leur
 * propriétaire (Repository de définition ou de Séance), jamais isolément.
 */
export interface MediaRepository {
  /** PRE-3 : asset persisté, ou `null`. */
  findAsset?(assetId: string): Promise<MediaAsset | null>;
  /** PRE-3 : nombre de liens référençant l'asset (PRE-7, R-3 : ceux des Mouvements seulement, C05). */
  countReferences?(assetId: string): Promise<number>;
}
