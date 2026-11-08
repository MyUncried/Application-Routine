import type { Database } from "../Database";

/**
 * PRE-9 (décisions EMOM du 07/11/2026, version 23, `migration023`) — **Récupération des EMOM alternés et « dans chaque
 * intervalle » ramenée à 0 s**. Réponse 3 de Hermann du 07/11/2026 : « Quand un exercice entre dans un circuit alterné
 * ou « dans chaque intervalle », sa Récupération passe à 0 s dans les données, et pas seulement à l'affichage. Les
 * données existantes doivent être normalisées de la même façon. »
 *
 * Reprise de DONNÉES seule, sans changement de schéma : `activities.post_activity_recovery_seconds` mis à 0 pour tout
 * Exercice EMOM (`format_key = 'EMOM'`) d'un Circuit alterné (`tours.nature = 'SERIES'`) ou d'un Circuit porteur EMOM
 * (`tours.format_key = 'EMOM'`). `post_activity_recovery_present` est conservé (0 s reste une Récupération présente) ;
 * `updated_at` n'est pas modifié (normalisation, pas une modification de l'utilisateur). Exercices hors Circuit, EMOM
 * d'un Circuit groupé standard (« À la suite ») et autres Formats : inchangés. Séances jouées et instantanés : non
 * concernés (aucune colonne touchée hors `activities`).
 *
 * Numéro vérifié sur la branche le 07/11/2026 : 022 = nom du Circuit ; A.5 (suppression de la table des anciennes
 * définitions, non autorisée) prendra la suivante disponible. Exécutée dans la transaction exclusive unique de
 * `migrateDatabase.ts` : un échec annule tout et laisse `user_version` à 22. Idempotente : rejouée, elle ne trouve
 * plus aucune ligne à modifier.
 */
export const MIGRATION_023_NORMALIZE_EMOM_RECOVERY = `UPDATE activities
   SET post_activity_recovery_seconds = 0
 WHERE type = 'EXERCISE'
   AND format_key = 'EMOM'
   AND post_activity_recovery_seconds <> 0
   AND tour_id IN (SELECT id FROM tours WHERE nature = 'SERIES' OR format_key = 'EMOM')`;

export async function applyMigration023(transaction: Database): Promise<void> {
  await transaction.runAsync(MIGRATION_023_NORMALIZE_EMOM_RECOVERY);
}
