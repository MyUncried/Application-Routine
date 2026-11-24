import type { Database } from "../Database";

/**
 * Migration 037 — créneau ajouté hors de la répétition (D-554, RM-273, 21/11/2026 ; complément du 21/11/2026 du ch09 : « Une
 * occurrence peut être ajoutée à une routine en dehors de sa répétition. Elle est enregistrée avec sa date et son heure,
 * distinguée des occurrences issues de la répétition, et son groupe « date et heure » est marqué comme modifié à la main »).
 *
 * `routine_occurrences.added` : 1 = occurrence ajoutée à la main depuis le Plan, jamais rattachée à une occurrence produite par
 * la répétition ; 0 = occurrence issue de la répétition (modifiée à la main ou commencée, D-536). Les lignes existantes sont
 * toutes issues de la répétition (0). [Mécanisme proposé par Claude (mission PLAN-01) : colonne explicite plutôt qu'une
 * convention sur la clé.]
 *
 * Numéro : 035 (Programmes, PROG-CAT-01, locale) et 036 (nom des routines, AGENDA-SEANCES-01) sont pris ; 037 est le premier
 * numéro libre. Ajout d'une colonne ; aucune donnée réécrite. Idempotente.
 */
export const MIGRATION_037_ADDED_OCCURRENCE = "ALTER TABLE routine_occurrences ADD COLUMN added INTEGER NOT NULL DEFAULT 0 CHECK (added IN (0, 1))";

export async function applyMigration037(transaction: Database): Promise<void> {
  const columns = await transaction.getAllAsync<{ name: string }>("PRAGMA table_info(routine_occurrences)");
  if (columns.some((column) => column.name === "added")) return;
  await transaction.execAsync(MIGRATION_037_ADDED_OCCURRENCE);
}
