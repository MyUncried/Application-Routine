/**
 * Une ligne par Activité (T01-S09) : la jointure `sessions ⋈ cycles ⋈ tours
 * ⋈ activities` produit désormais, par construction, AUTANT de lignes que
 * d'Activités dans le Tour — les champs `session_*`/`cycle_*`/`tour_*` sont
 * répétés à l'identique sur chaque ligne d'une même Séance ; seuls les
 * champs `activity_*` varient. `SqliteSessionRepository` regroupe ces
 * lignes par `session_id` avant de les assembler en `Session`.
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
  tour_repeat_count: 1;
  activity_id: string;
  activity_name: string;
  structural_position: "IN_TOUR";
  activity_position: number;
  execution_mode: "DURATION" | "REPETITIONS";
  duration_seconds: number | null;
  repetition_count: number | null;
  series_count: number;
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

export type SessionSummaryRow = {
  id: string;
  name: string;
  color: string;
  activity_count: number;
  initial_countdown_seconds: number;
  final_phase_seconds: number;
  activity_duration_seconds: number;
  /** `1` dès qu'au moins une Activité de la Séance est en mode Répétitions (T01-S09, RM-072) — sinon `0`. */
  has_repetition_activity: 0 | 1;
  tour_repeat_count: number;
  updated_at: string;
};
