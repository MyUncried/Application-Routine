import type { Database } from "../Database";

/**
 * Migration 032 — nom des planifications (D-522, RM-258, RM-261, RM-264 ; 18/11/2026).
 *
 * `routines.name` : texte libre, unique parmi les planifications de l'utilisateur (contrôle applicatif, sans casse
 * ni espaces de bord, RM-261). Les planifications existantes reçoivent un nom vide, à compléter à leur première
 * modification (RM-264). Ajout de colonne seulement : aucune Routine, entrée ou occurrence n'est réécrite.
 * Idempotente : une colonne déjà présente n'est pas rajoutée.
 */
export async function applyMigration032(transaction: Database): Promise<void> {
  const columns = await transaction.getAllAsync<{ name: string }>("PRAGMA table_info(routines)");
  if (columns.some((column) => column.name === "name")) return;
  await transaction.execAsync("ALTER TABLE routines ADD COLUMN name TEXT NOT NULL DEFAULT ''");
}
