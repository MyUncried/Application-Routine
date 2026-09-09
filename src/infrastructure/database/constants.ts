export const DATABASE_NAME = "kodjo.db";
/**
 * **T02-S02 : version 4** — `migration004` ajoute la Récupération ATTACHÉE
 * (`activities.recovery_seconds`), convertit les anciennes lignes techniques
 * `RECOVERY` vers l'Activité qui les précède dans la même zone, puis les
 * supprime (`12 – Architecture technique.md` : « T02-S02 consomme
 * définitivement la migration SQLite additive `004` et fixe
 * `DATABASE_VERSION = 4` »).
 *
 * Elle ne persiste NI la Durée totale NI le pilote d'interface (DM-015/
 * DM-016 : dérivés, jamais canoniques). Aucune table d'Exécution, d'Instantané
 * ou de Résultat n'est ajoutée : celles-ci relèvent de T03, qui utilisera la
 * migration `005` et `DATABASE_VERSION = 5` — le numérotage est réservé
 * explicitement pour éviter toute collision.
 *
 * T01-S10 (version 3, `migration003`) : extension du `CHECK` de
 * `activities.execution_mode` au mode `TO_FAILURE` (D-111).
 */
export const DATABASE_VERSION = 4;
export const LOCAL_USER_SINGLETON_KEY = 1;

/** Pragmas appliqués à toute connexion SQLite de l'application, avant migration. */
export const STANDARD_PRAGMAS: readonly string[] = [
  "PRAGMA foreign_keys = ON",
  "PRAGMA journal_mode = WAL",
];
