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
/**
 * **PRE-4 (version 10, `migration010`, story 1.1)** : deux Modes et Cible
 * typée par Série — JSON v2 dans `activity_definitions` et `activities`,
 * écart dénombré des Exercices illisibles, reconstruction d'`activities`
 * (CHECK sans l'ancien troisième mode, cible scalaire NULL admise) et table
 * `migration_notices` ; 001..009 inchangées.
 */
/**
 * **PRE-6 (version 11, `migration011`, story 1.1)** : nature du Circuit
 * (`tours.nature`, `TOURS` par défaut) et présence de la récupération
 * post-exercice (`activities.post_activity_recovery_present`, reprise à 1
 * pour toute valeur > 0) — `ADD COLUMN` seulement, idempotente ; 001..010
 * inchangées.
 */
/**
 * **PRE-7 (version 12, `migration012`, story A1.2)** : schéma « Mouvement,
 * filiation et niveaux » (`movements`, phases, Zones et médias du Mouvement,
 * `activity_definitions.movement_id` intègre, `activities.source_movement_id`
 * non nul sans clé étrangère) et transition PONCTUELLE de D-440 assouplie :
 * Exercices, Séances et associations supprimés une seule fois, Profil,
 * Catégories, Zones et Étiquettes conservés, avis `EXERCISES_AND_SESSIONS_RESET`.
 * 001..011 inchangées.
 */
/**
 * **PRE-7 (version 13, `migration013`, story R-3)** : modèle D-445 C05 —
 * occurrence sans copie de contenu (`activities` sans nom, description ni
 * Catégorie, `copy_number`, clé étrangère RESTRICT vers `movements`), nom de
 * Mouvement unique (C01), `movement_aliases`, retrait de `used` (C03) ;
 * `activity_body_zones` et `session_activity_media` supprimées. Transition
 * PONCTUELLE (Q2 de Hermann, 26/10/2026) : Mouvements, Niveaux, Exercices et
 * Séances supprimés une seule fois ; Profil, Catégories, Zones et Étiquettes
 * conservés ; avis `EXERCISES_AND_SESSIONS_RESET`. 001..012 inchangées.
 */
/**
 * **PRE-8 (version 14, `migration014`, story A.3)** : structure générale de la
 * Séance (D-449 §4) — Exercices, Circuits et Cycles successifs au niveau
 * principal, sans imbrication. Conversion SANS PERTE des Séances existantes,
 * aucune donnée supprimée. 001..013 inchangées.
 */
/**
 * **PRE-8 (version 15, `migration015`, story B.8)** : archivage du Mouvement —
 * colonne additive `movements.archived_at`, aucun Mouvement archivé par la
 * migration. 001..014 inchangées.
 */
export const DATABASE_VERSION = 15;
export const LOCAL_USER_SINGLETON_KEY = 1;
/** Même patron que `LOCAL_USER_SINGLETON_KEY` — le Profil reste un agrégat singleton unique (`migration007`, plan §3.2). */
export const LOCAL_PROFILE_SINGLETON_KEY = 1;

/** Pragmas appliqués à toute connexion SQLite de l'application, avant migration. */
export const STANDARD_PRAGMAS: readonly string[] = [
  "PRAGMA foreign_keys = ON",
  "PRAGMA journal_mode = WAL",
];
