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
/**
 * **PRE-9 (version 16, `migration016`, story A.1)** : structure D-451 complète —
 * Exercice direct de Cycle (`activities.cycle_id`) et Point d'arrêt dans un
 * Cycle (`session_stop_points.cycle_id`), au plus un parent. Tables reconstruites,
 * lignes recopiées à l'identique, aucune donnée supprimée. 001..015 inchangées.
 */
/**
 * **PRE-9 (version 17, `migration017`, story C.1)** : Format porté par l'élément
 * (`tours.format_key`/`format_settings`, `activities.format_key`/`format_settings`)
 * et origine de création (`sessions.origin`) — colonnes additives nullables, toute
 * Séance existante reste libre. 001..016 inchangées.
 * [Correction C.1 du 30/10 (décision de Hermann, D-02) : le Format est porté par
 * l'Exercice seul. `tours.format_key` / `tours.format_settings` restent dans le
 * schéma comme vestiges inutilisés : ni lus ni écrits par le code actif ; aucune
 * migration de suppression. Leur vacuité sur l'iPhone n'est pas vérifiée.]
 */
/**
 * **PRE-9 (version 18, `migration018`, story A.2b)** : durée facultative d'une phase du
 * Mouvement (`movement_phases.duration_seconds`, 1..3535 s, `NULL` = aucune durée) — colonne
 * additive nullable, toute phase existante reste sans durée. 001..017 inchangées.
 */
/**
 * **PRE-9 (version 19, `migration019`, recette iPhone n° 2 du 31/10/2026, constat e)** : marque
 * « Paramètre à vérifier » d'un Exercice (`activities.phases_to_verify`,
 * `activity_definitions.phases_to_verify`, liste JSON d'identités de phase, `NULL` = rien à
 * vérifier) — colonnes additives nullables, tout Exercice existant reste sans marque. 001..018
 * inchangées. [Plan : A.4 → 020, A.5 → 021.]
 */
/**
 * **PRE-9 (version 20, `migration020`, recette iPhone n° 3 du 03/11/2026, autres constats, décision de
 * Hermann du 03/11)** : modèle d'origine d'un Circuit créé par la fenêtre Formats (`tours.origin_model`,
 * `CHECK` sur les dix clés de modèle figées, `NULL` = « Circuit ») — colonne additive nullable, tout
 * Circuit existant reste « Circuit ». 001..019 inchangées. [Le plan « A.4 → 020, A.5 → 021 » est
 * décalé d'un rang : A.4 et A.5 prendront les prochaines versions disponibles.]
 */
/**
 * **PRE-9 (version 21, `migration021`, story A.3, décision de Hermann du 04/11/2026 : « Hermann
 * abandonne la conversion sans perte prévue par A.4 : les anciens exercices concernés par cette
 * conversion peuvent être supprimés plutôt que migrés. »)** : suppression de toutes les anciennes
 * définitions d'Exercice du Catalogue ; la table reste, vide (sa suppression, A.5, reste non
 * autorisée et prendra la version 23, la 22 étant réservée au nom du Circuit). Mouvements, Séances,
 * historique et instantanés conservés. 001..020 inchangées.
 */
/**
 * **PRE-9 (version 22, `migration022`, reprise Formats du 04/11/2026)** : nom du Circuit (`tours.name`, `NULL` =
 * nom par défaut) — colonne additive nullable. 001..021 inchangées.
 */
/**
 * **PRE-9 (version 23, `migration023`, décisions EMOM du 07/11/2026, réponse 3 de Hermann)** : Récupération des
 * Exercices EMOM d'un Circuit alterné ou d'un Circuit porteur EMOM ramenée à 0 s — reprise de données, aucun
 * changement de schéma. 001..022 inchangées. [A.5, non autorisée, prendra la prochaine version disponible.]
 */
/**
 * **PRE-10 (version 24, `migration024`, moteur d'exécution)** : tables additives `executions` (instantané,
 * checkpoint révisé, statuts) et `execution_results` (résultats idempotents par clé). 001..023 inchangées.
 */
/**
 * **Suite PRE-10 son et voix (version 25, `migration025`)** : table additive `guidance_preferences` (singleton,
 * préférence « Annoncer les répétitions ou la durée », activée par défaut). 001..024 inchangées.
 */
/**
 * **Suite PRE-10 son et voix (version 26, `migration026`)** : colonnes additives `guidance_preferences`
 * (annonces des pauses, du début et de la fin de séance, des changements de côté). 001..025 inchangées.
 */
/**
 * **Suite PRE-10 son et voix (version 27, `migration027`)** : colonne additive `guidance_preferences.announce_phases_enabled`.
 * 001..026 inchangées.
 */
/**
 * **Fin de PRE-10 (version 28, `migration028`)** : colonnes additives nullables `sessions.guidance_*` (guidage propre
 * à une Séance). 001..027 inchangées.
 */
export const DATABASE_VERSION = 28;
export const LOCAL_USER_SINGLETON_KEY = 1;
/** Même patron que `LOCAL_USER_SINGLETON_KEY` — le Profil reste un agrégat singleton unique (`migration007`, plan §3.2). */
export const LOCAL_PROFILE_SINGLETON_KEY = 1;

/** Pragmas appliqués à toute connexion SQLite de l'application, avant migration. */
export const STANDARD_PRAGMAS: readonly string[] = [
  "PRAGMA foreign_keys = ON",
  "PRAGMA journal_mode = WAL",
];
