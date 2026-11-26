import type { Database } from "../Database";

import { MIGRATION_017_SESSION_ORIGINS } from "./migration017";
import { MIGRATION_020_MODEL_KEYS } from "./migration020";

/**
 * Migration 041 — HIIT (D-608, D-573 de la branche de documentation, point 3, Hermann, 26/11/2026 ; Formats § 9.10) : nouveau
 * modèle de la fenêtre Formats, préconfiguration sur le modèle du 30/30. Ses clés sont persistées comme celles des autres
 * modèles : `sessions.origin` (migration 017) et `tours.origin_model` (migration 020), deux colonnes bornées par un `CHECK` à des
 * listes FIGÉES (« un modèle ajouté plus tard demandera sa propre migration », migration 020). Cette migration élargit ces deux
 * listes à `HIIT`.
 *
 * SQLite ne modifie pas un `CHECK` : chaque colonne est remplacée par une colonne de même nom et de même type, nullable, au `CHECK`
 * élargi (ajout d'une colonne temporaire, copie des valeurs, suppression de l'ancienne, renommage). Aucune reconstruction de table :
 * pas de `DROP TABLE` (qui déclencherait les cascades des tables filles), aucune ligne supprimée ni réécrite hors de la valeur
 * copiée à l'identique. Les deux colonnes ne portent ni index, ni clé étrangère, ni déclencheur. Seule leur position dans la table
 * change (dernière colonne) ; le dépôt nomme toujours ses colonnes.
 *
 * Développée comme version 41 : la version 40 est réservée à la migration 040 des branches parallèles (marquage des photos,
 * `feat/marquage-photos-20261125` ; compte, `compte/lot-1`), absente de cette branche — passage sans effet ici, à réconcilier à
 * l'intégration. Idempotente : une colonne dont le `CHECK` admet déjà `HIIT` n'est pas retouchée (base passée par un autre numéro).
 * Exécutée dans la transaction exclusive unique de `migrateDatabase.ts` : un échec annule tout et laisse `user_version` à 40.
 */
export const MIGRATION_041_SESSION_ORIGINS = [...MIGRATION_017_SESSION_ORIGINS, "HIIT"] as const;
export const MIGRATION_041_MODEL_KEYS = [...MIGRATION_020_MODEL_KEYS, "HIIT"] as const;

const quoted = (values: readonly string[]) => values.map((value) => `'${value}'`).join(", ");

type TableRow = { readonly sql: string | null };

async function widenCheckedColumn(transaction: Database, table: string, column: string, keys: readonly string[]): Promise<void> {
  const columns = await transaction.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((row) => row.name === column)) return;
  const definition = await transaction.getFirstAsync<TableRow>("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?", [table]);
  // Déjà élargie (même liste sous un autre numéro de migration) : rien à faire.
  if (definition?.sql?.includes("'HIIT'") === true) return;
  const temporary = `${column}_v41`;
  if (!columns.some((row) => row.name === temporary)) {
    await transaction.execAsync(
      `ALTER TABLE ${table} ADD COLUMN ${temporary} TEXT CHECK ((${temporary} IS NULL) OR (${temporary} IN (${quoted(keys)})))`,
    );
  }
  await transaction.execAsync(`UPDATE ${table} SET ${temporary} = ${column}`);
  await transaction.execAsync(`ALTER TABLE ${table} DROP COLUMN ${column}`);
  await transaction.execAsync(`ALTER TABLE ${table} RENAME COLUMN ${temporary} TO ${column}`);
}

export async function applyMigration041(transaction: Database): Promise<void> {
  await widenCheckedColumn(transaction, "sessions", "origin", MIGRATION_041_SESSION_ORIGINS);
  await widenCheckedColumn(transaction, "tours", "origin_model", MIGRATION_041_MODEL_KEYS);
}
