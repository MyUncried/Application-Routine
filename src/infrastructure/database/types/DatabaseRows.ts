import type {
  ActivityType,
  ExerciseExecutionMode,
  StructuralPosition,
} from "@/domain/sessions/Session";

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
  color: string;
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
  instruction: string | null;
};

export type ActivityBodyZoneRow = {
  activity_id: string;
  body_zone_id: string;
};

export type SessionCategoryRow = {
  id: string;
  name: string;
  canonical_key: string;
  is_predefined: 0 | 1;
  display_order: number | null;
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
export type SessionSummaryRow = {
  id: string;
  name: string;
  color: string;
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
