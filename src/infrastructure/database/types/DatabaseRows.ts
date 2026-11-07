import type { CircuitNature } from "@/domain/sessions/circuit";
import type { ActivityType } from "@/domain/sessions/Session";
import type { SideMode } from "@/domain/sessions/sideMode";

/**
 * Valeurs historiques de la colonne `execution_mode` (AD-1) : type de ligne
 * SQL déclaré localement, comme dans `migration010` — jamais importé du lecteur
 * v1 (garde de cantonnement, AC4).
 */
export type LegacyExecutionMode = "DURATION" | "REPETITIONS" | "TO_FAILURE";

/**
 * PRE-8 (A.4, `migration014`) : en-tête d'une Séance. V2-PRE-1 (plan §3.3) : Étiquette
 * facultative et couleur de l'Étiquette jointe (`null` sans Étiquette, présentation neutre
 * résolue par le Repository).
 */
export type SessionHeaderRow = {
  session_id: string;
  owner_id: string;
  session_name: string;
  label_id: string | null;
  label_color: string | null;
  status: "ACTIVE" | "ARCHIVED";
  /** PRE-8 (E.1) : horodatage d'archivage (`migration001`), `NULL` pour une Séance active ; absent des fixtures antérieures. */
  archived_at?: string | null;
  initial_countdown_seconds: number;
  final_phase_seconds: number;
  session_created_at: string;
  session_updated_at: string;
  /** PRE-9 (C.1, `migration017`) : origine de création, `NULL` si inconnue ; absente des fixtures antérieures. */
  origin?: string | null;
};

/** PRE-8 (A.4) : Cycle utilisateur ; `position` = rang au niveau principal ; `repeat_count ≥ 1`. */
export type CycleRow = {
  id: string;
  session_id: string;
  position: number;
  repeat_count: number;
};

/**
 * PRE-8 (A.4) : Circuit (table `tours`) ; `cycle_id` `null` au niveau principal ; `position` =
 * rang au niveau principal ou dans le Cycle ; `repeat_count` 1..99 (D-058) ; direction technique
 * (`migration005`) et nature (`migration011`, AD-34).
 */
export type CircuitRow = {
  id: string;
  session_id: string;
  cycle_id: string | null;
  position: number;
  repeat_count: number;
  side_mode: SideMode;
  nature: CircuitNature;
  // PRE-9 (réalignement C.1 du 02/11/2026) : Format d'origine d'un Circuit porteur (migration 017).
  // [30/10 : « vestiges inutilisés, ni lus ni écrits » — remplacé le 02/11/2026.]
  format_key?: string | null;
  format_settings?: string | null;
  // Recette iPhone n° 3 du 03/11/2026 : modèle d'origine (nom affiché), `NULL` = « Circuit » (migration 020).
  origin_model?: string | null;
  /** Reprise Formats du 04/11/2026 (migration 022) : nom du Circuit, `NULL` = nom par défaut. */
  name?: string | null;
};

/**
 * PRE-8 (A.4) : Exercice (table `activities`) ; `tour_id` `null` au niveau principal ;
 * `position` = rang au niveau principal ou dans le Circuit.
 */
export type ActivityRow = {
  id: string;
  session_id: string;
  tour_id: string | null;
  /** T01-S10 : `'EXERCISE'` ou `'RECOVERY'` (D-061). */
  type: ActivityType;
  position: number;
  /**
   * Colonne historique projetée, jamais relue comme source (AD-3) :
   * `'DURATION'` ou `'REPETITIONS'` après `migration010` ; le type de ligne
   * garde les valeurs historiques (`LegacyExecutionMode`, AD-1).
   */
  execution_mode: LegacyExecutionMode;
  duration_seconds: number | null;
  repetition_count: number | null;
  /** `null` pour une Récupération (T01-S10). */
  series_count: number | null;
  pause_seconds: number;
  /** V2-PRE-1 : récupération post-exercice de l'occurrence, `0..5999` s. */
  post_activity_recovery_seconds: number;
  /** PRE-6 (story 1.1, AD-35) : `0` = absente (secondes alors à 0), `1` = présente (0 compris). */
  post_activity_recovery_present: number;
  created_at: string;
  updated_at: string;
  /** V2-BILAT-01 : direction propre de l'Exercice (`migration005`). */
  side_mode: SideMode;
  /** PRE-7 (R-3) : JSON de la forme Catalogue v5 — `NULL` seulement pour une ancienne ligne `RECOVERY`. */
  execution_parameters: string | null;
  /** PRE-7 (R-3, C05) : Mouvement de l'Exercice, clé étrangère RESTRICT. */
  source_movement_id: string;
  /** PRE-7 (R-3, Q3) : numéro de copie, `NULL` pour l'original. */
  copy_number: number | null;
  /** PRE-9 (A.1, `migration016`) : Cycle dont l'Exercice est membre direct, `null` sinon ; jamais avec `tour_id`. */
  cycle_id: string | null;
  /** PRE-9 (C.1, `migration017`) : Format porté par l'Exercice, `NULL` = libre ; absent des fixtures antérieures. */
  format_key?: string | null;
  /** PRE-9 (C.1) : réglages JSON versionnés, présents si et seulement si `format_key` l'est. */
  format_settings?: string | null;
  /**
   * PRE-9 (recette iPhone n° 2 du 31/10/2026, constat e, `migration019`) : identités des phases « à
   * vérifier » (liste JSON), `NULL` = aucune ; absente des fixtures et des lectures antérieures.
   */
  phases_to_verify?: string | null;
};

/**
 * PRE-8 (A.4) : Point d'arrêt ; `tour_id` `null` au niveau principal, sinon son Circuit. PRE-9
 * (A.1, `migration016`) : `cycle_id` désigne un Cycle lorsque le Point y est placé (jamais avec
 * `tour_id`).
 */
export type StopPointRow = {
  id: string;
  session_id: string;
  tour_id: string | null;
  cycle_id: string | null;
  position: number;
};

/** Une ligne par Catégorie persistée (V2-PRE-1 : `color`/`is_active` ajoutées, plan §3.1). */
export type CategoryRow = {
  id: string;
  name: string;
  canonical_key: string;
  color: string;
  is_predefined: 0 | 1;
  display_order: number | null;
  is_active: 0 | 1;
  created_at: string;
};

/**
 * Projection de résumé du Catalogue (`SqliteSessionRepository.listActive`).
 *
 * **T02-S01** : nombres et durées sont désormais agrégés PAR ZONE
 * STRUCTURELLE — trois colonnes de chacun — au lieu d'un compte et d'une
 * durée globaux. SQL ne peut pas pondérer lui-même la zone `IN_TOUR` par
 * `tourRepeatCount` sans mélanger les zones : cette pondération appartient au
 * Domaine (`calculations.ts`), qui reçoit donc les trois colonnes brutes.
 * `initial_countdown_seconds`/`final_phase_seconds` disparaissent : le Compte
 * à rebours initial et la Fin de séance sont exclus de la durée affichée.
 */
/*
 * [PRE-9 A.3 du 04/11/2026 : le type de ligne des anciennes définitions du Catalogue
 * (`ActivityDefinitionRow`) est retiré avec leur dépôt ; la table reste, vidée par `migration021`.]
 */

/** PRE-7 (A1.2, `migration012`) : une ligne par Mouvement (contenu partagé du geste, D-437). */
export type MovementRow = {
  id: string;
  name: string;
  normalized_name: string;
  description: string | null;
  category_id: string;
  next_phase_id: number;
  level_group_id: string | null;
  level_sort_key: number | null;
  created_at: string;
  updated_at: string;
};

/** PRE-7 (R-3, `migration013`, C01) : alias d'un Mouvement, ordonné par `position`. */
export type MovementAliasRow = {
  movement_id: string;
  position: number;
  alias: string;
};

/** PRE-7 (A1.2) : phase de la structure d'un Mouvement, ordonnée par `position`. */
export type MovementPhaseRow = {
  movement_id: string;
  phase_id: number;
  position: number;
  label: string;
  /** PRE-9 (A.2b, `migration018`) : durée facultative de la phase, `null` = aucune. */
  duration_seconds: number | null;
};

/** PRE-7 (A1.2) : Zone corporelle d'un Mouvement. */
export type MovementBodyZoneRow = {
  movement_id: string;
  body_zone_id: string;
};

/** PRE-7 (A1.2) : lien ordonné de média d'un Mouvement, joint à son asset. */
export type MovementMediaRow = JoinedMediaAssetColumns & {
  id: string;
  movement_id: string;
  asset_id: string;
  position: number;
};

/** Une ligne par Zone corporelle persistée (V2-PRE-1, `migration007` ; `canonical_key` ajoutée NOT NULL/UNIQUE par `migration008`, V2-PRE-2). */
export type BodyZoneRow = {
  id: string;
  name: string;
  canonical_key: string;
  is_active: 0 | 1;
  created_at: string;
};

/** Une ligne par Étiquette persistée (V2-PRE-1, `migration007` ; `canonical_key` ajoutée NOT NULL/UNIQUE par `migration008`, V2-PRE-2). */
export type LabelRow = {
  id: string;
  name: string;
  canonical_key: string;
  color: string;
  is_active: 0 | 1;
  created_at: string;
};

/** Ligne unique du Profil singleton (V2-PRE-1, `migration007`, décision D-240 ; complétée par `migration008`, V2-PRE-2). */
export type ProfileRow = {
  singleton_key: number;
  side_change_recovery_seconds_default: number;
  post_activity_recovery_seconds_default: number;
  exercise_countdown_seconds_default: number;
  exercise_end_seconds_default: number;
  session_initial_countdown_seconds_default: number;
  session_final_phase_seconds_default: number;
  sounds_enabled: 0 | 1;
  voice_announcements_enabled: 0 | 1;
  vibration_enabled: 0 | 1;
  notifications_enabled: 0 | 1;
  display_name: string | null;
  photo_uri: string | null;
  silhouette: "homme" | "femme" | null;
  updated_at: string;
};

/** Une ligne par média persisté (V2-PRE-1, `migration007`). */
export type MediaAssetRow = {
  id: string;
  uri: string;
  created_at: string;
  /** PRE-3 (`migration009`) : métadonnées natives nullables. */
  kind: "PHOTO" | "VIDEO" | null;
  mime_type: string | null;
  file_name: string | null;
  size_bytes: number | null;
  duration_ms: number | null;
  width: number | null;
  height: number | null;
};

/** PRE-3 : colonnes de l'asset jointes à un lien de média (préfixe `asset_`). */
export type JoinedMediaAssetColumns = {
  asset_uri: string;
  asset_created_at: string;
  asset_kind: "PHOTO" | "VIDEO" | null;
  asset_mime_type: string | null;
  asset_file_name: string | null;
  asset_size_bytes: number | null;
  asset_duration_ms: number | null;
  asset_width: number | null;
  asset_height: number | null;
};


/** PRE-4 (`migration010`, AD-12) : un avis de migration — aucun identifiant ni contenu d'Exercice écarté. */
export type MigrationNoticeRow = {
  id: number;
  kind: string;
  count: number;
  created_at: string;
  acknowledged_at: string | null;
};
