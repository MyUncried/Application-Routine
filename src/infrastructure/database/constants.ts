export const DATABASE_NAME = "kodjo.db";
/**
 * **V2-BILAT-01 : version 5** — `migration005` ajoute la configuration de
 * bilatéralité PRÉALABLE à T03 (`activities.side_mode`, `tours.side_mode`,
 * défaut `'UNILATERAL'`) : `SideMode = UNILATERAL | RIGHT_LEFT | LEFT_RIGHT`
 * de l'occurrence d'Activité de Séance et du Tour. Elle ne persiste AUCUNE
 * donnée d'Exécution, d'Instantané ou de Résultat — celles-ci relèvent de
 * T03, qui utilisera la migration `006` et `DATABASE_VERSION = 6` (décision
 * fermée du plan technique de la tranche : « `migration004` = T02-S02/v4 ;
 * `migration005` = V2-BILAT-01/v5 ; `migration006` = T03/v6 »).
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
export const DATABASE_VERSION = 5;
export const LOCAL_USER_SINGLETON_KEY = 1;

/** Pragmas appliqués à toute connexion SQLite de l'application, avant migration. */
export const STANDARD_PRAGMAS: readonly string[] = [
  "PRAGMA foreign_keys = ON",
  "PRAGMA journal_mode = WAL",
];
