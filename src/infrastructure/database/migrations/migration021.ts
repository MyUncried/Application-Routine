import type { Database } from "../Database";

/**
 * PRE-9 (story A.3, version 21, `migration021`) — nettoyage des anciennes définitions d'Exercice du
 * Catalogue (`activity_definitions`), prérequis du retrait de l'ancien parcours (E.8-a « Modifier »,
 * `ActivitySelectionScreen`, éditeur d'une définition du Catalogue).
 *
 * Décision de Hermann du 04/11/2026 : « Hermann abandonne la conversion sans perte prévue par A.4 :
 * les anciens exercices concernés par cette conversion peuvent être supprimés plutôt que migrés. »
 * Elle remplace ARB-01 sur ce périmètre : aucune conversion, suppression des anciennes définitions.
 *
 * Portée STRICTE : `DELETE FROM activity_definitions` (toutes les lignes) ; la table et ses colonnes
 * RESTENT (vides). La suppression de la table (story A.5) demeure distincte et NON AUTORISÉE.
 * Aucune table ne référence `activity_definitions` (ses tables filles ont été supprimées par
 * `migration012`) : la suppression ne peut créer aucune violation de clé étrangère, et une violation
 * préexistante ailleurs reste tolérée comme dans `migration016` (incident de la recette du 29/10) —
 * aucun `PRAGMA foreign_key_check` bloquant ici. Ses médias sont lus par `movement_media` : aucun
 * média n'est libéré. Les Mouvements, les Séances, leurs Exercices (`activities`), l'historique et
 * les instantanés sont conservés à l'identique. Aucun avis de migration : la sélection de ces définitions n'était plus
 * atteignable depuis l'application ; seuls des comptes d'usage du Mouvement pouvaient les inclure.
 *
 * Exécutée dans la transaction exclusive unique de `migrateDatabase.ts` : un échec annule tout et
 * laisse `user_version` à 20. Idempotente : une table déjà vide reste vide.
 */
export async function applyMigration021(transaction: Database): Promise<void> {
  await transaction.runAsync("DELETE FROM activity_definitions");
}
