import type { Database } from "../Database";

/**
 * PRE-9 (recette iPhone n° 2 du 31/10/2026, constat e, version 19, `migration019`) — marque
 * « Paramètre à vérifier » d'un Exercice. Décision de Hermann du 31/10/2026 : « modifier un
 * mouvement : Ajouter une valeur par défaut doit mettre à jour les exercices qui utilisent cet
 * exercice, mais que les champs (et l'ensemble de la ligne de couleur) soient identifiés en orange,
 * avec le texte « Paramètre à vérifier » à la place de « Paramètre à compléter ». » ; réponses du
 * même jour : champs vides seulement, fin à l'ouverture de la feuille, Séances et Catalogue.
 *
 * Strictement ADDITIVE, sur le modèle de `migration018` : une colonne nullable
 * `phases_to_verify` (texte JSON : liste des identités de phase dont la durée a été reprise du
 * Mouvement, `NULL` = rien à vérifier) sur `activities` (occurrences de Séance) et
 * `activity_definitions` (Exercices du Catalogue). Aucune colonne existante ne pouvait la porter :
 * `execution_parameters` est le contrat canonique versionné des paramètres (ch09), et la marque
 * n'est pas un paramètre d'exécution. Aucune reconstruction de table ni reprise : tout Exercice
 * existant reste sans marque. Lecture stricte par les dépôts (`decodePhasesToVerify`).
 *
 * Exécutée dans la transaction exclusive unique de `migrateDatabase.ts` : un échec annule tout et
 * laisse `user_version` à 18. Idempotente : une colonne déjà présente n'est pas rajoutée.
 */
export const MIGRATION_019_TABLES = ["activities", "activity_definitions"] as const;

export async function applyMigration019(transaction: Database): Promise<void> {
  for (const table of MIGRATION_019_TABLES) {
    const columns = await transaction.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
    if (!columns.some((row) => row.name === "phases_to_verify")) {
      await transaction.execAsync(`ALTER TABLE ${table} ADD COLUMN phases_to_verify TEXT`);
    }
  }
}
