import type { Database } from "../Database";

/**
 * PRE-9 (story C.1, version 17, `migration017`) — Format porté par l'élément (ARB-03) et origine
 * de création de la Séance (FMT-02).
 *
 * Strictement ADDITIVE, sur le modèle de `migration015` : colonnes nullables, sans reconstruction
 * de table ni reprise — toute Séance existante reste libre (FMT-40 : aucun Format déduit d'un
 * titre ou d'une coïncidence numérique) et sans origine connue.
 * - `tours.format_key`, `tours.format_settings` : Format porté par un Circuit ;
 * - `activities.format_key`, `activities.format_settings` : Format porté par un Exercice ;
 * - `sessions.origin` : entrée de la grille de création.
 * `format_settings` est un JSON versionné validé par le domaine (`encodeFormatSettings`), présent
 * si et seulement si `format_key` l'est. Aucune colonne d'organisation : celle d'un Circuit formaté
 * est sa nature (`tours.nature`). Aucune version de règle : elle n'est figée que dans l'instantané
 * (D.2).
 *
 * Exécutée dans la transaction exclusive unique de `migrateDatabase.ts` : un échec annule tout et
 * laisse `user_version` à 16. Idempotente : une colonne déjà présente n'est pas rajoutée.
 */
const quoted = (values: readonly string[]) => values.map((value) => `'${value}'`).join(", ");

/**
 * Valeurs figées à la version 17 (une migration ne change pas après sa livraison) ; égales au
 * registre du domaine (`ELEMENT_FORMAT_KEYS`, `SESSION_ORIGINS`), vérifié par `migration017.test.ts`.
 */
export const MIGRATION_017_FORMAT_KEYS = ["TABATA", "INTERVALS_30_30", "EMOM", "AMRAP", "FOR_TIME", "DEATH_BY"] as const;
export const MIGRATION_017_SESSION_ORIGINS = [
  "EXERCISE_CARD",
  "SESSION_CARD",
  ...MIGRATION_017_FORMAT_KEYS,
  "STRENGTH",
  "CORE_MOBILITY",
  "SUPERSET",
  "PROGRESSION",
  "UNTIL_FAILURE",
] as const;

const FORMAT_COLUMNS: readonly (readonly [column: string, definition: string])[] = [
  ["format_key", `TEXT CHECK ((format_key IS NULL) OR (format_key IN (${quoted(MIGRATION_017_FORMAT_KEYS)})))`],
  [
    "format_settings",
    "TEXT CHECK (((format_key IS NULL) AND (format_settings IS NULL)) OR ((format_key IS NOT NULL) AND (format_settings IS NOT NULL) AND (length(format_settings) >= 1)))",
  ],
];

async function addMissingColumns(
  transaction: Database,
  table: string,
  columns: readonly (readonly [column: string, definition: string])[],
): Promise<void> {
  const existing = await transaction.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  for (const [column, definition] of columns) {
    if (!existing.some((row) => row.name === column)) {
      await transaction.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
}

export async function applyMigration017(transaction: Database): Promise<void> {
  await addMissingColumns(transaction, "tours", FORMAT_COLUMNS);
  await addMissingColumns(transaction, "activities", FORMAT_COLUMNS);
  await addMissingColumns(transaction, "sessions", [
    ["origin", `TEXT CHECK ((origin IS NULL) OR (origin IN (${quoted(MIGRATION_017_SESSION_ORIGINS)})))`],
  ]);
}
