import type { Database } from "./Database";

/**
 * Recette iPhone du 20/11/2026 (Routine BMAD) : « Ce mouvement est utilisé par 51 exercices » avec deux Séances
 * seulement, aucune archivée. Sur l'appareil, les écritures se faisaient dans une transaction exclusive
 * d'expo-sqlite, ouverte sur une NOUVELLE connexion où `PRAGMA foreign_keys` restait désactivé : la suppression d'une
 * Séance n'emportait pas ses Exercices, Circuits, Cycles et Points d'arrêt (`ON DELETE CASCADE` jamais appliqué),
 * alors que les tests, sur une connexion unique, l'appliquaient. `ExpoDatabase` active désormais les clés étrangères
 * sur la connexion de transaction ; cette réparation retire les lignes restées orphelines avant cette correction.
 *
 * Portée : les tables passées en paramètre (au démarrage, l'arbre des Séances `SESSION_TREE_TABLES`, comme la
 * décision de Hermann du 29/10/2026 sur les Exercices orphelins, migration 016). Les autres incohérences
 * préexistantes restent tolérées et intactes (même incident du 29/10).
 *
 * Elle applique exactement ce que les clés étrangères déclarées auraient fait : `ON DELETE CASCADE` → ligne
 * supprimée ; `ON DELETE SET NULL` → colonnes remises à `NULL`. Les autres règles (`RESTRICT`, `NO ACTION`) ne sont
 * pas réparées et sont seulement comptées. Répété jusqu'à stabilité (une suppression peut en orpheliner d'autres).
 * Aucune écriture quand la base est cohérente.
 */
/** Arbre d'une Séance : supprimé avec elle par `ON DELETE CASCADE`. */
export const SESSION_TREE_TABLES: readonly string[] = ["cycles", "tours", "activities", "session_stop_points"];

export type OrphanRepairReport = {
  readonly deleted: Readonly<Record<string, number>>;
  readonly nulled: Readonly<Record<string, number>>;
  readonly unrepaired: number;
};

type ForeignKeyRow = {
  readonly id: number;
  readonly seq: number;
  readonly table: string;
  readonly from: string;
  readonly to: string | null;
  readonly on_delete: string;
};

type ForeignKey = {
  readonly child: string;
  readonly parent: string;
  readonly from: readonly string[];
  readonly to: readonly string[];
  readonly onDelete: string;
};

const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;

async function primaryKeyColumns(database: Database, table: string): Promise<readonly string[]> {
  const rows = await database.getAllAsync<{ name: string; pk: number }>(`PRAGMA table_info(${quote(table)})`);
  return rows.filter((row) => row.pk > 0).sort((a, b) => a.pk - b.pk).map((row) => row.name);
}

async function readForeignKeys(database: Database, scope: readonly string[]): Promise<readonly ForeignKey[]> {
  const tables = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  const keys: ForeignKey[] = [];
  for (const { name } of tables) {
    if (!scope.includes(name)) continue;
    const rows = await database.getAllAsync<ForeignKeyRow>(`PRAGMA foreign_key_list(${quote(name)})`);
    const byId = new Map<number, ForeignKeyRow[]>();
    for (const row of rows) byId.set(row.id, [...(byId.get(row.id) ?? []), row]);
    for (const group of byId.values()) {
      const ordered = [...group].sort((a, b) => a.seq - b.seq);
      const first = ordered[0] as ForeignKeyRow;
      const to = ordered.every((row) => row.to !== null)
        ? ordered.map((row) => row.to as string)
        : await primaryKeyColumns(database, first.table);
      keys.push({ child: name, parent: first.table, from: ordered.map((row) => row.from), to, onDelete: first.on_delete.toUpperCase() });
    }
  }
  return keys;
}

/** Condition « la ligne enfant référence un parent absent » (colonnes toutes renseignées, comme SQLite). */
function orphanCondition(key: ForeignKey): string {
  const child = quote(key.child);
  const notNull = key.from.map((column) => `${child}.${quote(column)} IS NOT NULL`).join(" AND ");
  const match = key.from.map((column, index) => `p.${quote(key.to[index] as string)} = ${child}.${quote(column)}`).join(" AND ");
  return `${notNull} AND NOT EXISTS (SELECT 1 FROM ${quote(key.parent)} AS p WHERE ${match})`;
}

export async function repairOrphanRows(database: Database, tables: readonly string[]): Promise<OrphanRepairReport> {
  const keys = await readForeignKeys(database, tables);
  const count = async (key: ForeignKey) =>
    (await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${quote(key.child)} WHERE ${orphanCondition(key)}`))?.count ?? 0;

  const repairable = (key: ForeignKey) => key.onDelete === "CASCADE" || key.onDelete === "SET NULL";
  let pending = false;
  for (const key of keys) if (repairable(key) && (await count(key)) > 0) pending = true;

  const deleted: Record<string, number> = {};
  const nulled: Record<string, number> = {};
  if (pending) {
    await database.withExclusiveTransactionAsync(async (transaction) => {
      for (let changed = true; changed; ) {
        changed = false;
        for (const key of keys) {
          if (!repairable(key)) continue;
          const statement = key.onDelete === "CASCADE"
            ? `DELETE FROM ${quote(key.child)} WHERE ${orphanCondition(key)}`
            : `UPDATE ${quote(key.child)} SET ${key.from.map((column) => `${quote(column)} = NULL`).join(", ")} WHERE ${orphanCondition(key)}`;
          const { changes } = await transaction.runAsync(statement);
          if (changes > 0) {
            changed = true;
            const target = key.onDelete === "CASCADE" ? deleted : nulled;
            target[key.child] = (target[key.child] ?? 0) + changes;
          }
        }
      }
    });
  }

  let unrepaired = 0;
  for (const key of keys) if (!repairable(key)) unrepaired += await count(key);
  return { deleted, nulled, unrepaired };
}
