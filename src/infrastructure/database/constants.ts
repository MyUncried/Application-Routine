export const DATABASE_NAME = "kodjo.db";
/**
 * T01-S10 : version 3 — `migration003` étend le `CHECK` de
 * `activities.execution_mode` au mode `TO_FAILURE` (D-111) par reconstruction
 * additive de la table. Aucune table d'Exécution/Instantané/Résultat n'est
 * ajoutée dans cette version.
 */
export const DATABASE_VERSION = 3;
export const LOCAL_USER_SINGLETON_KEY = 1;

/** Pragmas appliqués à toute connexion SQLite de l'application, avant migration. */
export const STANDARD_PRAGMAS: readonly string[] = [
  "PRAGMA foreign_keys = ON",
  "PRAGMA journal_mode = WAL",
];
