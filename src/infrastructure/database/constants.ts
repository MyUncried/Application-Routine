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
/**
 * **V2-PRE-1 (version 7, `migration007`)** : référentiels persistants
 * additifs `body_zones`/`labels`, Profil singleton `profiles` et médias
 * d'Exercice `media_assets`/`activity_media` (plan §3.1/§3.2/§3.3/§13/§14).
 * Migration strictement additive — voir `migration007.ts` pour la limite
 * disclosée de cette invocation bornée (aucune reconstruction des tables
 * existantes).
 *
 * **V2-PRE-2 (version 8, `migration008`)** : Profil complété (deux défauts
 * de Séance, quatre préférences, identité, silhouette), clé normalisée
 * obligatoire et unique pour Étiquettes et Zones, et `activity_body_zones`
 * reconstruite sans `CHECK` sur les 10 identifiants historiques — une Zone
 * créée devient liable à une occurrence de Séance (plan §6.2).
 *
 * **PRE-3 (version 9, `migration009`)** : paramètres d'exécution canoniques
 * (JSON versionné nullable) sur définitions et occurrences, Catégorie des
 * copies, métadonnées natives des médias et liens ordonnés des occurrences
 * (`session_activity_media`) — migration additive, 001..008 inchangées.
 */
export const DATABASE_VERSION = 9;
export const LOCAL_USER_SINGLETON_KEY = 1;
/** Même patron que `LOCAL_USER_SINGLETON_KEY` — le Profil reste un agrégat singleton unique (`migration007`, plan §3.2). */
export const LOCAL_PROFILE_SINGLETON_KEY = 1;

/** Pragmas appliqués à toute connexion SQLite de l'application, avant migration. */
export const STANDARD_PRAGMAS: readonly string[] = [
  "PRAGMA foreign_keys = ON",
  "PRAGMA journal_mode = WAL",
];
