/**
 * Tests seulement — PRE-6 (story 1.1). Les preuves de `migration010` (PRE-4)
 * comparent une base v9 à la même base après `migrateDatabase`, qui enchaîne
 * désormais `migration011`. Les deux colonnes ADDITIVES de 011 (hors objet de
 * ces preuves, couvertes par leurs propres tests) sont retirées des lignes
 * relues avant comparaison ; toute autre différence reste détectée.
 */
const MIGRATION_011_COLUMNS: Readonly<Record<string, readonly string[]>> = {
  tours: ["nature"],
  activities: ["post_activity_recovery_present"],
};

export function withoutMigration011Columns(table: string, rows: unknown): unknown {
  const columns = MIGRATION_011_COLUMNS[table];
  if (!columns || !Array.isArray(rows)) {
    return rows;
  }
  return rows.map((row: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(row).filter(([name]) => !columns.includes(name))),
  );
}

/** Colonnes `pragma_table_info` d'une table, sans celles ajoutées par `migration011`. */
export function withoutMigration011TableInfo(table: string, columns: unknown): unknown {
  const added = MIGRATION_011_COLUMNS[table];
  if (!added || !Array.isArray(columns)) {
    return columns;
  }
  return columns.filter((column: { name?: unknown }) => !added.includes(String(column.name)));
}
