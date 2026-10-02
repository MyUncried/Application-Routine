import type {
  ActivityType,
  ExerciseExecutionMode,
  StructuralPosition,
} from "@/domain/sessions/Session";
import type { SideMode } from "@/domain/sessions/sideMode";

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
  activity_id: string;
  /** T01-S10 : `'EXERCISE'` ou `'RECOVERY'` (D-061). */
  activity_type: ActivityType;
  activity_name: string;
  /** T01-S10 : `'BEFORE_TOUR'` / `'IN_TOUR'` / `'AFTER_TOUR'` (D-061). */
  structural_position: StructuralPosition;
  activity_position: number;
  /** T01-S10 : `'DURATION'` / `'REPETITIONS'` / `'TO_FAILURE'` — jamais `null` en base. */
  execution_mode: ExerciseExecutionMode;
  duration_seconds: number | null;
  repetition_count: number | null;
  /** `null` pour une Récupération (T01-S10). */
  series_count: number | null;
  pause_seconds: number;
  /** V2-PRE-1 : récupération post-exercice de l'occurrence, `0..5999` s — `0` = aucune (renommée depuis `recovery_seconds`, `migration007`). */
  post_activity_recovery_seconds: number;
  instruction: string | null;
  /** V2-BILAT-01 : direction propre de cette Activité (`Activity.sideMode`, `migration005`, défaut `'UNILATERAL'`). */
  activity_side_mode: SideMode;
};

export type ActivityBodyZoneRow = {
  activity_id: string;
  body_zone_id: string;
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
/** Une ligne par `ActivityDefinition` persistée (V2-CAT-01, `migration006`). */
export type ActivityDefinitionRow = {
  id: string;
  name: string;
  description: string | null;
  execution_mode: ExerciseExecutionMode;
  duration_seconds: number | null;
  repetition_count: number | null;
  series_count: number;
  pause_seconds: number;
  /** V2-PRE-1 (D-211) : Catégorie exactement une, obligatoire. */
  category_id: string;
  side_mode: SideMode;
  /** V2-PRE-1 : pause de changement de côté propre à l'Exercice. */
  side_recovery_seconds: number;
  created_at: string;
  updated_at: string;
};

export type ActivityDefinitionBodyZoneRow = {
  activity_definition_id: string;
  body_zone_id: string;
};

/** Une ligne par Zone corporelle persistée (V2-PRE-1, `migration007`). */
export type BodyZoneRow = {
  id: string;
  name: string;
  is_active: 0 | 1;
  created_at: string;
};

/** Une ligne par Étiquette persistée (V2-PRE-1, `migration007`). */
export type LabelRow = {
  id: string;
  name: string;
  color: string;
  is_active: 0 | 1;
  created_at: string;
};

/** Ligne unique du Profil singleton (V2-PRE-1, `migration007`, décision D-240). */
export type ProfileRow = {
  singleton_key: number;
  side_change_recovery_seconds_default: number;
  post_activity_recovery_seconds_default: number;
  exercise_countdown_seconds_default: number;
  exercise_end_seconds_default: number;
  updated_at: string;
};

/** Une ligne par média persisté (V2-PRE-1, `migration007`). */
export type MediaAssetRow = {
  id: string;
  uri: string;
  created_at: string;
};

/** Une ligne par association média↔Exercice, jointe à son média (V2-PRE-1, `migration007`). */
export type ActivityMediaRow = {
  id: string;
  activity_definition_id: string;
  asset_id: string;
  position: number;
  asset_uri: string;
  asset_created_at: string;
};

export type SessionSummaryRow = {
  id: string;
  name: string;
  label_id: string | null;
  label_color: string | null;
  before_tour_activity_count: number;
  in_tour_activity_count: number;
  after_tour_activity_count: number;
  before_tour_duration_seconds: number;
  in_tour_duration_seconds: number;
  after_tour_duration_seconds: number;
  /** `1` dès qu'au moins une Activité de la Séance est en mode Répétitions ou « À l'échec » (T01-S09/T01-S10, RM-072/D-112) — sinon `0`. */
  has_repetition_activity: 0 | 1;
  tour_repeat_count: number;
  updated_at: string;
};
