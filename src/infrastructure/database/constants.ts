export const DATABASE_NAME = "kodjo.db";
/**
 * **V2-CAT-01 : version 6** — `migration006` ajoute la persistance des
 * `ActivityDefinition` du Catalogue des activités (`activity_definitions`,
 * `activity_definition_body_zones`) — une racine persistante autonome,
 * distincte d'une `SessionActivity` de Séance. Elle ne convertit aucune
 * `SessionActivity` historique et n'introduit aucune donnée d'exécution,
 * d'archivage, de suppression ou de média fonctionnel (hors périmètre de
 * cette tranche). Le nom réservé `migration006`/`DATABASE_VERSION = 6` avait
 * été annoncé par `migration005` pour T03 — cette tranche V2-CAT-01
 * l'occupe à sa place ; T03 utilisera la prochaine version disponible.
 *
 * **V2-BILAT-01 (version 5, `migration005`)** : configuration de
 * bilatéralité (`activities.side_mode`, `tours.side_mode`, défaut
 * `'UNILATERAL'`) : `SideMode = UNILATERAL | RIGHT_LEFT | LEFT_RIGHT` de
 * l'occurrence d'Activité de Séance et du Tour.
 *
 * **T02-S02 (version 4, `migration004`)** : Récupération ATTACHÉE
 * (`activities.recovery_seconds`), conversion des anciennes lignes
 * techniques `RECOVERY` vers l'Activité qui les précède dans la même zone,
 * puis suppression. Elle ne persiste NI la Durée totale NI le pilote
 * d'interface (DM-015/DM-016 : dérivés, jamais canoniques).
 *
 * T01-S10 (version 3, `migration003`) : extension du `CHECK` de
 * `activities.execution_mode` au mode `TO_FAILURE` (D-111).
 */
export const DATABASE_VERSION = 6;
export const LOCAL_USER_SINGLETON_KEY = 1;

/** Pragmas appliqués à toute connexion SQLite de l'application, avant migration. */
export const STANDARD_PRAGMAS: readonly string[] = [
  "PRAGMA foreign_keys = ON",
  "PRAGMA journal_mode = WAL",
];
