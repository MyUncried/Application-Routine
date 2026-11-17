import type { Database } from "../Database";

/**
 * Présentation du catalogue des Mouvements (version 30, `migration030`) — décisions de Hermann du 16/11/2026 (chapitre 07,
 * « Catalogue des Mouvements — présentation en grille » puis « grille à quatre colonnes » ; chapitre 13, CE-MVT-03,
 * rubrique Bascule : « le choix est mémorisé »). Même patron que `migration025` : table singleton dédiée jointe au Profil,
 * aucune table existante modifiée (`profiles` reste inchangée). `movement_catalogue_grid` : `1` = grille, `0` = liste
 * (présentation d'origine, par défaut ; ligne absente = liste). 001..029 inchangées. Un échec laisse `user_version` à 29.
 */
export const MIGRATION_030_CATALOGUE_PREFERENCES = `CREATE TABLE catalogue_preferences (
  singleton_key INTEGER PRIMARY KEY NOT NULL CHECK (singleton_key = 1),
  movement_catalogue_grid INTEGER NOT NULL DEFAULT 0 CHECK (movement_catalogue_grid IN (0,1)),
  updated_at TEXT NOT NULL
)`;

export async function applyMigration030(transaction: Database): Promise<void> {
  await transaction.execAsync(MIGRATION_030_CATALOGUE_PREFERENCES);
}
