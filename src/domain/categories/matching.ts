import { canonicalCategoryKey } from "./validation";

export type CategoryMatchCandidate = {
  readonly id: string;
  readonly canonicalKey: string;
};

/**
 * Recherche une Catégorie déjà connue (persistée OU déjà ajoutée au
 * brouillon dans ce même parcours) dont la clé canonique correspond à
 * `rawName` (T01-S09, D-106) : « Après la normalisation canonique de
 * comparaison, une saisie correspondant à une Catégorie existante ne crée
 * aucun doublon : elle sélectionne l'existante et ferme la ligne de
 * création. » Fonction pure — l'appelant (écran Catégories) est responsable
 * de constituer `candidates` (Catégories persistées + Catégories déjà
 * ajoutées au brouillon) et d'interpréter `null` comme « aucune
 * correspondance, une nouvelle Catégorie doit être ajoutée au brouillon ».
 */
export function findCategoryMatch(
  candidates: readonly CategoryMatchCandidate[],
  rawName: string,
): CategoryMatchCandidate | null {
  const key = canonicalCategoryKey(rawName);
  return candidates.find((candidate) => candidate.canonicalKey === key) ?? null;
}
