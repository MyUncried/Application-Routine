import type { Database } from "../Database";

/**
 * Relevés de douleur (version 43, `migration043`) — D-427 / D-577, réponse de Hermann du 27/11/2026 (« Oui il faut la stocker ») :
 * douleur 0–10 saisie sur l'écran « Avant la séance » d'un lancement dans un Programme dont le suivi est actif, rattachée à
 * l'Exécution. Pour un parcours, la douleur saisie une fois (séance 1) est enregistrée sur l'Exécution de chaque séance du parcours.
 * `moment` : `BEFORE` seulement aujourd'hui (la douleur après la séance, D-427, viendra avec son écran). Aucune localisation à la
 * saisie avant (D-427). Table additive : aucune table existante modifiée ; supprimée avec son Exécution (`ON DELETE CASCADE`) et
 * par « Effacer mes relevés » (D-551). 001..042 inchangées. Un échec laisse `user_version` à 42.
 * [Risque signalé : numéro de version 43 pris sur `feat/avant-seance-d577` ; une autre branche qui prendrait aussi 43 devra être
 * renumérotée à l'intégration (précédents : versions 40 et 41).]
 */
export const MIGRATION_043_PAIN_READINGS = `CREATE TABLE IF NOT EXISTS execution_pain_readings (
  execution_id TEXT NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  moment TEXT NOT NULL CHECK (moment IN ('BEFORE')),
  value INTEGER NOT NULL CHECK (value BETWEEN 0 AND 10),
  recorded_at TEXT NOT NULL,
  PRIMARY KEY (execution_id, moment)
)`;

export async function applyMigration043(transaction: Database): Promise<void> {
  await transaction.execAsync(MIGRATION_043_PAIN_READINGS);
}
