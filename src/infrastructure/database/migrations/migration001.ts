export const MIGRATION_001 = `
CREATE TABLE users (
  singleton_key INTEGER PRIMARY KEY CHECK (singleton_key = 1),
  id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  color TEXT NOT NULL CHECK (color IN (
    '#E5484D', '#F47B20', '#F7D154', '#2E9B62',
    '#20B2AA', '#32B8D8', '#3B82F6', '#5A5BD7',
    '#7B61D1', '#A34AB7', '#E45C9A', '#8E8E93'
  )),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  initial_countdown_seconds INTEGER NOT NULL DEFAULT 10 CHECK (initial_countdown_seconds >= 0),
  final_phase_seconds INTEGER NOT NULL DEFAULT 5 CHECK (final_phase_seconds >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_executed_at TEXT,
  archived_at TEXT,
  CHECK (
    ((status = 'ACTIVE') AND (archived_at IS NULL))
    OR
    ((status = 'ARCHIVED') AND (archived_at IS NOT NULL))
  )
);

CREATE INDEX sessions_owner_status_updated_idx
ON sessions(owner_id, status, updated_at DESC);

CREATE TABLE cycles (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL UNIQUE REFERENCES sessions(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 1 CHECK (position = 1),
  repeat_count INTEGER NOT NULL DEFAULT 1 CHECK (repeat_count = 1),
  UNIQUE (id, session_id)
);

CREATE TABLE tours (
  id TEXT PRIMARY KEY NOT NULL,
  cycle_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 1 CHECK (position = 1),
  repeat_count INTEGER NOT NULL DEFAULT 1 CHECK (repeat_count BETWEEN 1 AND 99),
  UNIQUE (cycle_id),
  UNIQUE (id, cycle_id, session_id),
  FOREIGN KEY (cycle_id, session_id)
    REFERENCES cycles(id, session_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE
);

CREATE TABLE activities (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  tour_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('EXERCISE', 'RECOVERY')),
  structural_position TEXT NOT NULL CHECK (
    structural_position IN ('BEFORE_TOUR', 'IN_TOUR', 'AFTER_TOUR')
  ),
  position INTEGER NOT NULL CHECK (position >= 0),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  execution_mode TEXT NOT NULL CHECK (execution_mode IN ('DURATION', 'REPETITIONS')),
  duration_seconds INTEGER,
  repetition_count INTEGER,
  series_count INTEGER,
  pause_seconds INTEGER NOT NULL DEFAULT 0,
  instruction TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (session_id, structural_position, position),
  FOREIGN KEY (cycle_id, session_id)
    REFERENCES cycles(id, session_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
  FOREIGN KEY (tour_id, cycle_id, session_id)
    REFERENCES tours(id, cycle_id, session_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
  CHECK (
    (
      (structural_position = 'IN_TOUR')
      AND (tour_id IS NOT NULL)
    )
    OR
    (
      (structural_position IN ('BEFORE_TOUR', 'AFTER_TOUR'))
      AND (tour_id IS NULL)
    )
  ),
  CHECK (
    (
      (type = 'EXERCISE')
      AND (series_count IS NOT NULL)
      AND (series_count >= 1)
      AND (pause_seconds BETWEEN 0 AND 5999)
      AND (
        (
          (execution_mode = 'DURATION')
          AND (duration_seconds IS NOT NULL)
          AND (duration_seconds BETWEEN 1 AND 5999)
          AND (repetition_count IS NULL)
        )
        OR
        (
          (execution_mode = 'REPETITIONS')
          AND (duration_seconds IS NULL)
          AND (repetition_count IS NOT NULL)
          AND (repetition_count >= 1)
        )
      )
    )
    OR
    (
      (type = 'RECOVERY')
      AND (execution_mode = 'DURATION')
      AND (duration_seconds IS NOT NULL)
      AND (duration_seconds BETWEEN 1 AND 5999)
      AND (repetition_count IS NULL)
      AND (series_count IS NULL)
      AND (pause_seconds = 0)
    )
  ),
  CHECK ((instruction IS NULL) OR (length(instruction) <= 1000))
);

CREATE INDEX activities_session_position_idx
ON activities(session_id, structural_position, position);
`;
