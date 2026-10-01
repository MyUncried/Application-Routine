/**
 * Média persistable (V2-PRE-1, plan §3.3/§13) : identité et métadonnées
 * indépendantes d'un média, distinctes de son association à un Exercice
 * (`ActivityMedia`). Aucun comportement de lecture vidéo, galerie, plein
 * écran ou exécution n'est modélisé ici — hors périmètre de cette tranche.
 */

export type MediaAsset = {
  readonly id: string;
  readonly uri: string;
  readonly createdAt: string;
};
