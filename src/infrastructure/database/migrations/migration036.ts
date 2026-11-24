import type { Database } from "../Database";

/**
 * Migration 036 — mode du nom des Routines (D-553, 21/11/2026 ; spécification « Agenda centré sur les Séances », § 2 :
 * « mécanisme explicite distinguant nom généré et nom personnalisé, y compris pour les Routines existantes ; ne pas inférer
 * ce mode d'un simple test d'égalité textuelle »).
 *
 * - `routines.name_generated` : 1 = nom généré (nom de la Séance, ou noms des Séances reliés par « + »), qui suit la
 *   composition ; 0 = nom personnalisé, fixe.
 * - Routines existantes (mission AGENDA-SEANCES-01, reprise proposée par défaut) : une routine nommée garde son nom,
 *   considéré comme personnalisé, sans changement visible (0). Une routine sans nom (antérieure au 18/11/2026, RM-264)
 *   reçoit le nom généré (1) — RM-264 remplacé par D-553 : « nom généré par défaut ». [Reprise des routines sans nom :
 *   interprétation technique.]
 *
 * Numéro : 035 est pris par la mission parallèle PROG-CAT-01 (programmes, branche locale `feat/programmes-catalogue-20261121`,
 * non envoyée le 21/11/2026) ; 036 est le premier numéro libre. Ajout d'une colonne ; seule la colonne ajoutée est écrite.
 * Idempotente.
 */
export const MIGRATION_036_ROUTINE_NAME_GENERATED = "ALTER TABLE routines ADD COLUMN name_generated INTEGER NOT NULL DEFAULT 0 CHECK (name_generated IN (0, 1))";

export const MIGRATION_036_UNNAMED_GENERATED = "UPDATE routines SET name_generated = 1 WHERE trim(name) = ''";

export async function applyMigration036(transaction: Database): Promise<void> {
  const columns = await transaction.getAllAsync<{ name: string }>("PRAGMA table_info(routines)");
  if (columns.some((column) => column.name === "name_generated")) return;
  await transaction.execAsync(MIGRATION_036_ROUTINE_NAME_GENERATED);
  await transaction.execAsync(MIGRATION_036_UNNAMED_GENERATED);
}
