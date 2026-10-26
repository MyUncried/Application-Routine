import type { CircuitNature } from "@/domain/sessions/circuit";
import type { ActivityType, StructuralPosition } from "@/domain/sessions/Session";
import type { SideMode } from "@/domain/sessions/sideMode";

/**
 * Valeurs historiques de la colonne `execution_mode` (AD-1) : type de ligne
 * SQL déclaré localement, comme dans `migration010` — jamais importé du lecteur
 * v1 (garde de cantonnement, AC4).
 */
export type LegacyExecutionMode = "DURATION" | "REPETITIONS" | "TO_FAILURE";

/**
 * Une ligne par Activité (T01-S09 ; T01-S10 : toutes zones structurelles) :
 * la jointure `sessions ⋈ cycles ⋈ tours ⋈ activities` produit AUTANT de
 * lignes que d'Activités de la Séance (avant, dans et après le Tour
 * confondus) — les champs `session_*`/`cycle_*`/`tour_*` sont répétés à
 * l'identique sur chaque ligne d'une même Séance ; seuls les champs
 * `activity_*` varient. `SqliteSessionRepository` regroupe ces lignes par
 * `session_id` puis les partitionne par `structural_position` avant de les
 * assembler en `Session`.
 *
 * `execution_mode` est TOUJOURS renseigné en base (colonne `NOT NULL`) —
 * pour une Récupération il vaut `'DURATION'` par contrainte SQL, mais le
 * Domaine expose `null` (voir `assembleSession`).
 */
export type SessionAggregateRow = {
  session_id: string;
  owner_id: string;
  session_name: string;
  /** V2-PRE-1 (plan §3.3) : Étiquette facultative — `null` si aucune. */
  label_id: string | null;
  /** V2-PRE-1 : couleur de l'Étiquette jointe — `null` si `label_id` est `null` (présentation neutre résolue par le Repository). */
  label_color: string | null;
  status: "ACTIVE" | "ARCHIVED";
  initial_countdown_seconds: number;
  final_phase_seconds: number;
  session_created_at: string;
  session_updated_at: string;
  cycle_id: string;
  cycle_position: 1;
  cycle_repeat_count: 1;
  tour_id: string;
  tour_position: 1;
  /** T01-S10 : `1..99` (D-058). */
  tour_repeat_count: number;
  /** V2-BILAT-01 : direction du Tour (`Session.cycle.tour.sideMode`, `migration005`, défaut `'UNILATERAL'`). */
  tour_side_mode: SideMode;
  /** PRE-6 (story 1.1, AD-34) : nature du Circuit (`migration011`, défaut `'TOURS'`). */
  tour_nature: CircuitNature;
  activity_id: string;
  /** T01-S10 : `'EXERCISE'` ou `'RECOVERY'` (D-061). */
  activity_type: ActivityType;
  /** T01-S10 : `'BEFORE_TOUR'` / `'IN_TOUR'` / `'AFTER_TOUR'` (D-061). */
  structural_position: StructuralPosition;
  activity_position: number;
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
  /** V2-PRE-1 : récupération post-exercice de l'occurrence, `0..5999` s — `0` = aucune (renommée depuis `recovery_seconds`, `migration007`). */
  post_activity_recovery_seconds: number;
  /**
   * PRE-6 (story 1.1, AD-35) : présence de la récupération (`migration011`) —
   * `0` = absente (secondes alors à 0), `1` = présente (0 compris).
   */
  post_activity_recovery_present: number;
  /** V2-BILAT-01 : direction propre de cette Activité (`Activity.sideMode`, `migration005`, défaut `'UNILATERAL'`). */
  activity_side_mode: SideMode;
  /** PRE-7 (R-3) : JSON de la forme Catalogue v5 (`readCatalogExecutionParameters`) — `NULL` seulement pour une ancienne ligne `RECOVERY`. */
  activity_execution_parameters: string | null;
  /** PRE-7 (R-3, `migration013`, C05) : Mouvement de l'occurrence, clé étrangère RESTRICT ; son contenu est relu dans le Mouvement. */
  activity_source_movement_id: string;
  /** PRE-7 (R-3, Q3) : numéro de copie, `NULL` pour l'original. */
  activity_copy_number: number | null;
};

/** PRE-4 (story 1.2, P39) : colonnes propres à une occurrence dans `SessionAggregateRow`. */
export type SessionAggregateOccurrenceColumn =
  | "activity_id"
  | "activity_type"
  | "structural_position"
  | "activity_position"
  | "execution_mode"
  | "duration_seconds"
  | "repetition_count"
  | "series_count"
  | "pause_seconds"
  | "post_activity_recovery_seconds"
  | "post_activity_recovery_present"
  | "activity_side_mode"
  | "activity_execution_parameters"
  | "activity_source_movement_id"
  | "activity_copy_number";

/**
 * PRE-4 (story 1.2, FR-18-20 sixième conséquence, P39) : ligne de la lecture
 * d'agrégat, qui fait un `LEFT JOIN activities`. Une Séance sans occurrence
 * (toutes ses Copies écartées par `migration010`) produit UNE ligne dont les
 * colonnes d'occurrence sont toutes `NULL` ; elle ne porte que l'en-tête
 * (Séance, Cycle, Tour). `isSessionOccurrenceRow` distingue les deux formes.
 */
export type SessionAggregateQueryRow =
  | SessionAggregateRow
  | (Omit<SessionAggregateRow, SessionAggregateOccurrenceColumn> & {
      [K in SessionAggregateOccurrenceColumn]: null;
    });

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
/**
 * Une ligne par `ActivityDefinition` persistée (PRE-7, A1.2, `migration012`) :
 * relation intègre vers son Mouvement et paramètres propres en forme
 * Catalogue v4 (`readCatalogExecutionParameters`). Le contenu partagé est
 * porté par `movements`.
 */
export type ActivityDefinitionRow = {
  id: string;
  movement_id: string;
  execution_parameters: string;
  created_at: string;
  updated_at: string;
};

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

export type SessionSummaryRow = {
  id: string;
  name: string;
  label_id: string | null;
  label_color: string | null;
  before_tour_activity_count: number;
  in_tour_activity_count: number;
  after_tour_activity_count: number;
  /**
   * PRE-3 : les anciennes colonnes de durée SQL (somme scalaire divergente)
   * sont retirées de la projection — le total de liste est calculé par
   * l'autorité unique du Domaine à partir des paramètres des occurrences.
   */
  tour_repeat_count: number;
  /** PRE-6 (story 1.3) : nature du Circuit (`tours.nature`, `migration011`), pour la durée de liste. */
  tour_nature: string;
  updated_at: string;
};

/** PRE-4 (`migration010`, AD-12) : un avis de migration — aucun identifiant ni contenu d'Exercice écarté. */
export type MigrationNoticeRow = {
  id: number;
  kind: string;
  count: number;
  created_at: string;
  acknowledged_at: string | null;
};
