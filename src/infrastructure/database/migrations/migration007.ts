import {
  DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
  DEFAULT_EXERCISE_END_SECONDS,
  DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS,
  DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS,
} from "@/domain/preferences/Profile";
import { LOCAL_PROFILE_SINGLETON_KEY } from "../constants";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";

/**
 * Migration V2-PRE-1 : fondations du modèle cible — référentiels persistants
 * `body_zones`/`labels`, Profil singleton `profiles`, médias d'Exercice
 * (`media_assets`/`activity_media`), et convergence du schéma cible (plan
 * §7) : Catégorie d'Exercice enrichie (couleur, état actif/retiré), Exercice
 * (`activity_definitions.category_id`/`side_recovery_seconds`, retrait de
 * `recovery_seconds`), Séance (Étiquette `label_id`, retrait de la couleur
 * autonome et de la relation `session_categories` N:N), occurrence
 * (`activities.recovery_seconds` renommée `post_activity_recovery_seconds`).
 *
 * N'ALTÈRE JAMAIS `migration001.ts`…`migration006.ts` (« Conservation des
 * acquis ») : chaque instruction ci-dessous porte exclusivement sur les
 * tables déjà créées par ces migrations (`ALTER TABLE`/`CREATE TABLE`/
 * `DROP TABLE`), jamais sur leur propre code. Les colonnes `NOT NULL` qui ne
 * portent aucune clé étrangère portent toutes un `DEFAULT` littéral —
 * SQLite l'autorise explicitement sur une table déjà peuplée (même stratégie
 * que `migration005`) — jamais une reconstruction complète des lignes
 * existantes : les données de développement incompatibles restent
 * réinitialisées à une valeur par défaut plutôt que supprimées, conformément
 * au plan §7 (« Les données de développement incompatibles peuvent être
 * supprimées ou réinitialisées »).
 *
 * `activity_definitions.category_id` référence `categories(id)` : SQLite
 * refuse explicitement (« Cannot add a REFERENCES column with non-NULL
 * default value ») l'ajout d'une colonne `REFERENCES` portant à la fois un
 * `NOT NULL` et un `DEFAULT` littéral sur une table déjà peuplée — une
 * installation existante peut déjà porter des `ActivityDefinition`
 * (`migration006`, V2-CAT-01, antérieure à cette tranche). La colonne est
 * donc ajoutée NULLABLE (sans `DEFAULT`, sans `NOT NULL` — même patron déjà
 * établi par `sessions.label_id` ci-dessous), puis un `UPDATE` distinct la
 * rétablit à la Catégorie prédéfinie `Autre` (`PREDEFINED_CATEGORIES`,
 * `migration002`, qui existe TOUJOURS à ce point de la chaîne de migration)
 * pour toute ligne existante — un simple `UPDATE` ne porte pas la même
 * restriction qu'un `ALTER TABLE ADD COLUMN`. Une installation neuve n'a
 * aucune ligne à cet instant : cet `UPDATE` y est un no-op. Le Domaine/les
 * Repository continuent de traiter cette colonne comme TOUJOURS renseignée
 * en pratique (D-211) — seule son absence de `NOT NULL` SQL reste disclosée.
 *
 * `body_zones` est semé depuis `BODY_ZONES` (`@/features/reference-data/
 * bodyZones.ts`), qui reste la source historique de seed (plan §3.1) — jamais
 * modifiée par cette migration, jamais remplacée par un re-export.
 *
 * `profiles` reste un singleton (`singleton_key` fixe, même patron que
 * `users.singleton_key`, `migration001`) — semé une seule fois avec les
 * quatre valeurs par défaut normatives du plan §3.2/décision D-240 (`10` s /
 * `30` s / `10` s / `5` s).
 *
 * `activity_media` référence `activity_definitions(id)` (déjà persistée,
 * `migration006`) — `UNIQUE(activity_definition_id, position)` garantit une
 * position stable et unique PAR Exercice, sans jamais contraindre l'Exercice
 * seul : plusieurs médias distincts par Exercice restent possibles (plan
 * §13, compatibilité future des variantes).
 *
 * `session_stop_points` référence `sessions(id)` directement (jamais le
 * Cycle/Circuit, plan §7 : « avec Session, portée et ordre ») —
 * `UNIQUE(session_id, scope, position)` garantit un ordre stable et sans
 * doublon PAR portée structurelle, même patron que `activities(session_id,
 * structural_position, position)` (`migration001`).
 *
 * **Limite disclosée** : la neutralisation SQL du `sideMode` du Circuit
 * (colonnes `tours.side_mode`/`activities.side_mode` conservées inchangées,
 * simplement plus jamais lues fonctionnellement par le Domaine) n'a pas pu
 * être couverte par cette invocation bornée — voir le rapport de mission
 * final (`KODJO_IMPLEMENTATION_CONFORMANCE`).
 */
const BODY_ZONES_SEED = BODY_ZONES.map((zone) => {
  const escapedName = zone.name.replace(/'/g, "''");
  return `('${zone.id}', '${escapedName}', 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;
}).join(",\n  ");

export const MIGRATION_007 = `
CREATE TABLE body_zones (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL
);

INSERT INTO body_zones (id, name, is_active, created_at) VALUES
  ${BODY_ZONES_SEED};

CREATE TABLE labels (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  color TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE TABLE profiles (
  singleton_key INTEGER PRIMARY KEY CHECK (singleton_key = ${LOCAL_PROFILE_SINGLETON_KEY}),
  side_change_recovery_seconds_default INTEGER NOT NULL CHECK (side_change_recovery_seconds_default >= 0),
  post_activity_recovery_seconds_default INTEGER NOT NULL CHECK (post_activity_recovery_seconds_default >= 0),
  exercise_countdown_seconds_default INTEGER NOT NULL CHECK (exercise_countdown_seconds_default >= 0),
  exercise_end_seconds_default INTEGER NOT NULL CHECK (exercise_end_seconds_default >= 0),
  updated_at TEXT NOT NULL
);

INSERT INTO profiles (
  singleton_key, side_change_recovery_seconds_default, post_activity_recovery_seconds_default,
  exercise_countdown_seconds_default, exercise_end_seconds_default, updated_at
) VALUES (
  ${LOCAL_PROFILE_SINGLETON_KEY}, ${DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS}, ${DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS},
  ${DEFAULT_EXERCISE_COUNTDOWN_SECONDS}, ${DEFAULT_EXERCISE_END_SECONDS},
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);

CREATE TABLE media_assets (
  id TEXT PRIMARY KEY NOT NULL,
  uri TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE activity_media (
  id TEXT PRIMARY KEY NOT NULL,
  activity_definition_id TEXT NOT NULL REFERENCES activity_definitions(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES media_assets(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  UNIQUE (activity_definition_id, position)
);

CREATE INDEX activity_media_activity_definition_idx
ON activity_media(activity_definition_id, position);

CREATE TABLE session_stop_points (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('BEFORE_TOUR', 'IN_TOUR', 'AFTER_TOUR')),
  position INTEGER NOT NULL CHECK (position >= 0),
  UNIQUE (session_id, scope, position)
);

CREATE INDEX session_stop_points_session_idx
ON session_stop_points(session_id, scope, position);

ALTER TABLE categories ADD COLUMN color TEXT NOT NULL DEFAULT '#8E8E93';
ALTER TABLE categories ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1));

ALTER TABLE activity_definitions ADD COLUMN category_id TEXT
  REFERENCES categories(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
UPDATE activity_definitions SET category_id = 'autre' WHERE category_id IS NULL;
ALTER TABLE activity_definitions ADD COLUMN side_recovery_seconds INTEGER NOT NULL DEFAULT 0
  CHECK (side_recovery_seconds BETWEEN 0 AND 5999);
ALTER TABLE activity_definitions DROP COLUMN recovery_seconds;

ALTER TABLE sessions ADD COLUMN label_id TEXT REFERENCES labels(id) ON UPDATE RESTRICT ON DELETE SET NULL;
ALTER TABLE sessions DROP COLUMN color;

DROP TABLE session_categories;

ALTER TABLE activities RENAME COLUMN recovery_seconds TO post_activity_recovery_seconds;
`;
