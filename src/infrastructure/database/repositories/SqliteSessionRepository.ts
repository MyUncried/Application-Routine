import * as Crypto from "expo-crypto";

import {
  computeActivityCount,
  computeEstimatedDurationSeconds,
} from "@/domain/sessions/calculations";
import { FIXED_CYCLE_REPEAT_COUNT } from "@/domain/sessions/defaults";
import { SessionValidationError } from "@/domain/sessions/errors";
import {
  DEFAULT_SESSION_COLOR,
  type Activity,
  type ActivityType,
  type CreateSessionActivityInput,
  type CreateSessionInput,
  type CreateStopPointInput,
  type ExerciseExecutionMode,
  type Session,
  type SessionColor,
  type SessionSummary,
  type StructuralPosition,
  type UpdateSessionActivityInput,
  type UpdateSessionInput,
} from "@/domain/sessions/Session";
import type { StopPoint } from "@/domain/sessions/StopPoint";
import type {
  SessionRepository,
  UpdateSessionOutcome,
} from "@/domain/sessions/SessionRepository";
import { SIDE_MODES, type SideMode } from "@/domain/sessions/sideMode";
import {
  validateCreateSessionInput,
  validateUpdateSessionInput,
} from "@/domain/sessions/validation";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";
import { LOCAL_USER_SINGLETON_KEY } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import type {
  ActivityBodyZoneRow,
  SessionAggregateRow,
  SessionSummaryRow,
} from "@/infrastructure/database/types/DatabaseRows";

type LocalUserRow = { id: string };
type UuidFactory = () => string;

/** Ordre canonique de restitution des zones structurelles (D-061). */
const STRUCTURAL_ORDER_SQL = `
  CASE activities.structural_position
    WHEN 'BEFORE_TOUR' THEN 0
    WHEN 'IN_TOUR' THEN 1
    WHEN 'AFTER_TOUR' THEN 2
    ELSE 3
  END
`;

/**
 * Une ligne par Activité (T01-S09 ; T01-S10 : toutes zones structurelles,
 * voir `DatabaseRows.ts`) — regroupées par `SqliteSessionRepository` avant
 * assemblage, jamais consommées une par une par l'appelant. La jointure
 * `activities` porte uniquement sur `session_id`/`cycle_id` (jamais
 * `tour_id`, `NULL` pour les Activités hors Tour). Ordre : zone structurelle
 * (avant → dans → après le Tour) puis `activities.position` — cet ordre EST
 * celui restitué dans `Session.cycle.beforeTour` / `cycle.tour.exercises` /
 * `cycle.afterTour`.
 *
 * V2-PRE-1 (plan §3.3) : `sessions.color` autonome et `session_categories`
 * N:N sont retirés — la couleur est DÉRIVÉE d'une jointure externe (gauche)
 * avec `labels` (`label_color`, `NULL` sans Étiquette).
 */
const AGGREGATE_QUERY = `
SELECT
  sessions.id AS session_id,
  sessions.owner_id,
  sessions.name AS session_name,
  sessions.label_id AS label_id,
  labels.color AS label_color,
  sessions.status,
  sessions.initial_countdown_seconds,
  sessions.final_phase_seconds,
  sessions.created_at AS session_created_at,
  sessions.updated_at AS session_updated_at,
  cycles.id AS cycle_id,
  cycles.position AS cycle_position,
  cycles.repeat_count AS cycle_repeat_count,
  tours.id AS tour_id,
  tours.position AS tour_position,
  tours.repeat_count AS tour_repeat_count,
  tours.side_mode AS tour_side_mode,
  activities.id AS activity_id,
  activities.type AS activity_type,
  activities.name AS activity_name,
  activities.structural_position,
  activities.position AS activity_position,
  activities.execution_mode,
  activities.duration_seconds,
  activities.repetition_count,
  activities.series_count,
  activities.pause_seconds,
  activities.post_activity_recovery_seconds,
  activities.instruction,
  activities.side_mode AS activity_side_mode
FROM sessions
LEFT JOIN labels ON labels.id = sessions.label_id
JOIN cycles ON cycles.session_id = sessions.id
JOIN tours ON tours.cycle_id = cycles.id AND tours.session_id = sessions.id
JOIN activities
  ON activities.session_id = sessions.id
  AND activities.cycle_id = cycles.id
WHERE sessions.id = ? AND sessions.owner_id = ?
ORDER BY ${STRUCTURAL_ORDER_SQL} ASC, activities.position ASC
`;

/**
 * Durée estimée d'UNE Activité, en SQL — transcription EXACTE de
 * `computeActivityDurationSeconds` (`calculations.ts`), dont la parité est
 * testée (`SqliteSessionRepository.test.ts`).
 *
 * **T02-S02** : la formule canonique est CONDITIONNELLE — la Récupération
 * REMPLACE la dernière Pause lorsqu'elle existe :
 *
 * - `post_activity_recovery_seconds = 0` : `C × A + C × B` ;
 * - `post_activity_recovery_seconds > 0` : `C × A + (C − 1) × B + R`.
 *
 * Le nombre d'occurrences de Pause est donc lui-même un `CASE`, transcription
 * exacte de `computePauseOccurrences`. `MAX(X, Y)` à deux arguments est la
 * fonction SCALAIRE de SQLite, jamais l'agrégat `max(X)` à un argument.
 *
 * **V2-PRE-1 (plan §3.3)** : le Circuit (Tour) n'a plus aucune influence
 * fonctionnelle sur la direction — chaque Activité applique sa PROPRE
 * direction (`activities.side_mode`), jamais celle du Tour.
 */
const ACTIVITY_PAUSE_OCCURRENCES_SQL = `
  CASE
    WHEN activities.post_activity_recovery_seconds > 0
      THEN MAX(COALESCE(activities.series_count, 0) - 1, 0)
    ELSE MAX(COALESCE(activities.series_count, 0), 0)
  END
`;

/** V2-BILAT-01, portée exclusivement par l'Exercice (V2-PRE-1) — transcription SQL EXACTE de `sideMultiplier(activity.sideMode)` : `1` pour `UNILATERAL`, `2` pour toute direction bilatérale. */
const ACTIVITY_SIDE_MULTIPLIER_SQL = `
  CASE WHEN activities.side_mode <> 'UNILATERAL' THEN 2 ELSE 1 END
`;

/**
 * Durée estimée d'UNE Activité, en SQL — transcription EXACTE de
 * `computeActivityDurationSeconds` (`calculations.ts`), dont la parité est
 * testée (`SqliteSessionRepository.test.ts`).
 *
 * La branche `RECOVERY` reste une défense en profondeur sur une donnée
 * ancienne : `migration004` a converti puis supprimé toutes ces lignes ;
 * une Récupération n'est jamais elle-même côtée (D-041), aucun
 * multiplicateur ne s'y applique. La récupération post-exercice n'est,
 * elle, jamais multipliée par côté (V2-PRE-1 : le Circuit n'a plus de
 * direction propre).
 */
const ACTIVITY_DURATION_SQL = `
  CASE
    WHEN activities.type = 'RECOVERY'
      THEN COALESCE(activities.duration_seconds, 0)
    ELSE (
      COALESCE(activities.series_count, 0) * COALESCE(activities.duration_seconds, 0)
      + (${ACTIVITY_PAUSE_OCCURRENCES_SQL}) * activities.pause_seconds
    ) * (${ACTIVITY_SIDE_MULTIPLIER_SQL})
      + activities.post_activity_recovery_seconds
  END
`;

/**
 * T02-S01 (clarification n° 5 du verdict de revue : « la projection SQL
 * `listActive` doit appliquer exactement ces règles PAR COLONNE ET PAR
 * ZONE ») — une colonne de durée et une colonne de compte par zone
 * structurelle, agrégées ensuite par le Domaine (`calculations.ts`), plutôt
 * qu'un total déjà mélangé que SQL ne pourrait plus pondérer par
 * `tourRepeatCount`.
 *
 * `zone` est toujours l'une des trois constantes littérales du Domaine
 * ci-dessous — jamais une valeur d'origine utilisateur.
 */
function zoneDurationSql(zone: StructuralPosition): string {
  return `SUM(CASE WHEN activities.structural_position = '${zone}' THEN ${ACTIVITY_DURATION_SQL} ELSE 0 END)`;
}

function zoneActivityCountSql(zone: StructuralPosition): string {
  return `SUM(CASE WHEN activities.structural_position = '${zone}' THEN 1 ELSE 0 END)`;
}

export class SqliteSessionRepository implements SessionRepository {
  constructor(
    private readonly database: Database,
    private readonly uuidFactory: UuidFactory = Crypto.randomUUID,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  /**
   * Persiste, dans une UNIQUE transaction SQLite (D-107) : la Séance, le
   * Cycle, le Tour et TOUTES les Activités ordonnées du brouillon, avec
   * leurs Zones corporelles. Toute erreur au sein de cette transaction
   * annule l'intégralité de l'écriture (§`withExclusiveTransactionAsync`,
   * propagation d'exception) — aucune donnée partielle n'est jamais laissée.
   *
   * V2-PRE-1 (plan §3.3) : la relation historique Catégorie de Séance N:N
   * est retirée — seule une Étiquette facultative (`labelId`) est persistée.
   * Le `sideMode` du Tour n'a plus aucune influence fonctionnelle : la
   * colonne SQL reste écrite `'UNILATERAL'` (compatibilité technique), plus
   * jamais lue depuis `CreateSessionInput`/`UpdateSessionInput` (retirés de
   * ces contrats).
   */
  async create(input: CreateSessionInput): Promise<Session> {
    const validated = validateCreateSessionInput(input);
    if (!validated.ok) {
      throw new SessionValidationError(validated.violations);
    }
    const normalized = validated.value;
    const sessionId = this.uuidFactory();
    const cycleId = this.uuidFactory();
    const tourId = this.uuidFactory();
    let created: Session | null = null;

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const timestamp = this.now();
      const user = await getLocalUser(transaction);

      await transaction.runAsync(
        `INSERT INTO sessions (
          id, owner_id, name, label_id, status,
          initial_countdown_seconds, final_phase_seconds,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)`,
        [
          sessionId,
          user.id,
          normalized.name,
          normalized.labelId ?? null,
          normalized.initialCountdownSeconds,
          normalized.finalPhaseSeconds,
          timestamp,
          timestamp,
        ],
      );

      await transaction.runAsync(
        `INSERT INTO cycles (id, session_id, position, repeat_count)
         VALUES (?, ?, 1, ?)`,
        [cycleId, sessionId, FIXED_CYCLE_REPEAT_COUNT],
      );

      // T02-S01 : répétition RÉELLE du Tour (`1..99`, D-058). V2-PRE-1 : le
      // Tour n'a plus de direction propre — toujours `'UNILATERAL'` en base.
      await transaction.runAsync(
        `INSERT INTO tours (id, cycle_id, session_id, position, repeat_count, side_mode)
         VALUES (?, ?, ?, 1, ?, 'UNILATERAL')`,
        [tourId, cycleId, sessionId, normalized.tourRepeatCount],
      );

      await insertActivities(
        transaction,
        sessionId,
        cycleId,
        tourId,
        normalized.exercises,
        this.uuidFactory,
        timestamp,
      );
      await insertStopPoints(transaction, sessionId, normalized.stopPoints ?? [], this.uuidFactory);

      created = await readSession(transaction, sessionId, user.id);
    });

    if (!created) {
      throw new Error("The created session could not be read back.");
    }

    return created;
  }

  /**
   * Modification bout en bout d'une Séance persistée (T01-S10, plan §5.2 ;
   * Q3-A — `UpdateSessionInput` distinct de `CreateSessionInput`, `create()`
   * jamais appelé). Réutilise la MÊME transaction exclusive et les mêmes
   * issues métier `UPDATED` / `NOT_FOUND` / `ARCHIVED`.
   *
   * Les Activités sont **fusionnées par identité** (§6.4 « FORBIDDEN :
   * régénérer l'identifiant d'une Activité inchangée ») : une Activité déjà
   * présente est mise à jour en place (son `id` et son `created_at` sont
   * conservés), une nouvelle Activité est insérée avec l'identifiant fourni
   * par le brouillon, une Activité retirée est supprimée (ses Zones partent
   * en cascade).
   */
  async update(sessionId: string, input: UpdateSessionInput): Promise<UpdateSessionOutcome> {
    const validated = validateUpdateSessionInput(input);
    if (!validated.ok) {
      throw new SessionValidationError(validated.violations);
    }
    const normalized = validated.value;

    let outcome: UpdateSessionOutcome = { status: "NOT_FOUND" };

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const timestamp = this.now();
      const user = await getLocalUser(transaction);

      const existingRows = await transaction.getAllAsync<SessionAggregateRow>(AGGREGATE_QUERY, [
        sessionId,
        user.id,
      ]);
      if (existingRows.length === 0) {
        return;
      }
      const existingRow = existingRows[0]!;
      if (existingRow.status !== "ACTIVE") {
        outcome = { status: "ARCHIVED" };
        return;
      }

      const sessionUpdate = await transaction.runAsync(
        `UPDATE sessions SET name = ?, label_id = ?, initial_countdown_seconds = ?,
           final_phase_seconds = ?, updated_at = ?
         WHERE id = ? AND owner_id = ?`,
        [
          normalized.name,
          normalized.labelId ?? null,
          normalized.initialCountdownSeconds,
          normalized.finalPhaseSeconds,
          timestamp,
          sessionId,
          user.id,
        ],
      );
      if (sessionUpdate.changes !== 1) {
        throw new Error("Expected exactly one session row to be updated.");
      }

      await transaction.runAsync(
        `UPDATE tours SET repeat_count = ? WHERE id = ? AND session_id = ?`,
        [normalized.tourRepeatCount, existingRow.tour_id, sessionId],
      );

      await mergeActivities(
        transaction,
        sessionId,
        existingRow.cycle_id,
        existingRow.tour_id,
        existingRows.map((row) => row.activity_id),
        normalized.activities,
        timestamp,
      );

      // V2-PRE-1 (plan §3.3/§7, REQ-001108DC7F67664C) : les Points d'arrêt
      // n'exposent aucune identité à l'appelant (contrairement aux
      // Activités, fusionnées par `id`) — remplacés intégralement, même
      // politique que les Zones corporelles d'un Exercice.
      await transaction.runAsync(`DELETE FROM session_stop_points WHERE session_id = ?`, [
        sessionId,
      ]);
      await insertStopPoints(transaction, sessionId, normalized.stopPoints ?? [], this.uuidFactory);

      const session = await readSession(transaction, sessionId, user.id);
      if (!session) {
        throw new Error("The updated session could not be read back coherently.");
      }
      outcome = { status: "UPDATED", session };
    });

    return outcome;
  }

  async findById(sessionId: string): Promise<Session | null> {
    const user = await getLocalUser(this.database);
    return readSession(this.database, sessionId, user.id);
  }

  async findSessionStatus(sessionId: string): Promise<"ACTIVE" | "ARCHIVED" | null> {
    const user = await getLocalUser(this.database);
    const row = await this.database.getFirstAsync<{ status: "ACTIVE" | "ARCHIVED" }>(
      "SELECT status FROM sessions WHERE id = ? AND owner_id = ?",
      [sessionId, user.id],
    );
    return row?.status ?? null;
  }

  async listActive(): Promise<readonly SessionSummary[]> {
    const user = await getLocalUser(this.database);
    const rows = await this.database.getAllAsync<SessionSummaryRow>(
      `SELECT
        sessions.id,
        sessions.name,
        sessions.label_id AS label_id,
        labels.color AS label_color,
        ${zoneActivityCountSql("BEFORE_TOUR")} AS before_tour_activity_count,
        ${zoneActivityCountSql("IN_TOUR")} AS in_tour_activity_count,
        ${zoneActivityCountSql("AFTER_TOUR")} AS after_tour_activity_count,
        ${zoneDurationSql("BEFORE_TOUR")} AS before_tour_duration_seconds,
        ${zoneDurationSql("IN_TOUR")} AS in_tour_duration_seconds,
        ${zoneDurationSql("AFTER_TOUR")} AS after_tour_duration_seconds,
        MAX(
          CASE
            WHEN activities.type = 'EXERCISE'
              AND activities.execution_mode IN ('REPETITIONS', 'TO_FAILURE')
            THEN 1 ELSE 0
          END
        ) AS has_repetition_activity,
        tours.repeat_count AS tour_repeat_count,
        sessions.updated_at
      FROM sessions
      LEFT JOIN labels ON labels.id = sessions.label_id
      JOIN cycles ON cycles.session_id = sessions.id
      JOIN tours ON tours.cycle_id = cycles.id AND tours.session_id = sessions.id
      JOIN activities
        ON activities.session_id = sessions.id
        AND activities.cycle_id = cycles.id
      WHERE sessions.owner_id = ? AND sessions.status = 'ACTIVE'
      GROUP BY sessions.id, tours.id
      ORDER BY sessions.updated_at DESC`,
      [user.id],
    );

    const sessionIds = rows.map((row) => row.id);
    const bodyZoneNamesBySession = await getBodyZoneNamesBySession(this.database, sessionIds);

    return rows.map((row) => mapSummaryRow(row, bodyZoneNamesBySession.get(row.id) ?? []));
  }
}

async function getLocalUser(database: Database): Promise<LocalUserRow> {
  const user = await database.getFirstAsync<LocalUserRow>(
    "SELECT id FROM users WHERE singleton_key = ?",
    [LOCAL_USER_SINGLETON_KEY],
  );

  if (!user) {
    throw new Error("The stable local user is missing.");
  }

  return user;
}

/**
 * Insère une Activité par élément de `activities`, puis ses Zones corporelles
 * associées.
 *
 * **T02-S01 (plan §6.2/§10.3)** — l'insertion portait jusqu'ici trois
 * littéraux fixes (`'EXERCISE'`, `FIXED_ACTIVITY_STRUCTURAL_POSITION`, le
 * `tourId` du Tour pour TOUTE Activité) et dérivait `position` de l'index
 * GLOBAL de la collection. Elle applique désormais la structure réelle :
 *
 * - `type` et `structural_position` proviennent de l'entrée validée ;
 * - `position` est renumérotée SÉPARÉMENT DANS CHAQUE ZONE (0-indexée),
 *   seule façon de respecter `UNIQUE(session_id, structural_position,
 *   position)` sans dépendre de l'ordre relatif entre zones ;
 * - `tour_id` vaut le Tour pour `IN_TOUR` et `NULL` pour
 *   `BEFORE_TOUR`/`AFTER_TOUR` (`CHECK` de `migration001`/`migration003`) ;
 * - l'identifiant du brouillon est conservé lorsqu'il est fourni, généré
 *   sinon.
 */
async function insertActivities(
  transaction: Database,
  sessionId: string,
  cycleId: string,
  tourId: string,
  activities: readonly CreateSessionActivityInput[],
  uuidFactory: UuidFactory,
  timestamp: string,
): Promise<void> {
  const positionByZone = new Map<StructuralPosition, number>();

  for (const activity of activities) {
    const zone = activity.structuralPosition;
    const position = positionByZone.get(zone) ?? 0;
    positionByZone.set(zone, position + 1);

    const activityId = activity.id ?? uuidFactory();
    const activityTourId = activityTourIdFor(zone, tourId);
    const { executionMode, seriesCount, pauseSeconds, postActivityRecoverySeconds, bodyZoneIds, sideMode } =
      toActivitySqlValues(activity);

    await transaction.runAsync(
      `INSERT INTO activities (${ACTIVITY_ROW_COLUMNS})
       VALUES (${ACTIVITY_ROW_PLACEHOLDERS})`,
      [
        activityId,
        sessionId,
        cycleId,
        activityTourId,
        activity.type,
        zone,
        position,
        activity.name,
        executionMode,
        activity.durationSeconds,
        activity.repetitionCount,
        seriesCount,
        pauseSeconds,
        postActivityRecoverySeconds,
        activity.instruction ?? null,
        timestamp,
        timestamp,
        sideMode,
      ],
    );

    for (const bodyZoneId of bodyZoneIds) {
      await transaction.runAsync(
        `INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES (?, ?)`,
        [activityId, bodyZoneId],
      );
    }
  }
}

/**
 * Insère les Points d'arrêt de la Séance (V2-PRE-1, plan §3.3/§7,
 * REQ-001108DC7F67664C) — `position` est renumérotée SÉPARÉMENT DANS CHAQUE
 * portée (0-indexée, même politique que `insertActivities`), seule façon de
 * respecter `UNIQUE(session_id, scope, position)` sans dépendre de l'ordre
 * relatif entre portées. `session_stop_points` référence `sessions(id)`
 * directement (jamais le Cycle/Circuit).
 */
async function insertStopPoints(
  transaction: Database,
  sessionId: string,
  stopPoints: readonly CreateStopPointInput[],
  uuidFactory: UuidFactory,
): Promise<void> {
  const positionByScope = new Map<StructuralPosition, number>();

  for (const stopPoint of stopPoints) {
    const scope = stopPoint.scope;
    const position = positionByScope.get(scope) ?? 0;
    positionByScope.set(scope, position + 1);

    await transaction.runAsync(
      `INSERT INTO session_stop_points (id, session_id, scope, position) VALUES (?, ?, ?, ?)`,
      [uuidFactory(), sessionId, scope, position],
    );
  }
}

const ACTIVITY_ROW_COLUMNS = `
  id, session_id, cycle_id, tour_id, type, structural_position,
  position, name, execution_mode, duration_seconds,
  repetition_count, series_count, pause_seconds, post_activity_recovery_seconds,
  instruction, created_at, updated_at, side_mode
`;

/**
 * Liste de paramètres liés DÉRIVÉE de `ACTIVITY_ROW_COLUMNS` — jamais une
 * suite de `?` recopiée à la main.
 */
const ACTIVITY_ROW_PLACEHOLDERS = ACTIVITY_ROW_COLUMNS.split(",")
  .map(() => "?")
  .join(", ");

/** Colonne SQL `tour_id` d'une Activité selon sa zone (T01-S10) : le Tour pour `IN_TOUR`, `NULL` sinon (contrainte `migration001`). */
function activityTourIdFor(structuralPosition: string, tourId: string): string | null {
  return structuralPosition === "IN_TOUR" ? tourId : null;
}

/**
 * Valeurs SQL d'une Activité, à la création comme à la modification (T01-S10 ;
 * T02-S01 : partagée avec `insertActivities`). `execution_mode` est une
 * colonne `NOT NULL` : une Récupération y stocke `'DURATION'` (imposé par le
 * `CHECK` de `migration001`), tandis que le Domaine réexpose `null`. Une
 * Récupération n'a ni Séries, ni pause, ni Zones corporelles (D-041).
 */
function toActivitySqlValues(activity: {
  readonly type: ActivityType;
  readonly executionMode: ExerciseExecutionMode | null;
  readonly seriesCount: number | null;
  readonly pauseSeconds: number;
  readonly postActivityRecoverySeconds: number;
  readonly bodyZoneIds: readonly string[];
  readonly sideMode?: SideMode;
}): {
  executionMode: string;
  seriesCount: number | null;
  pauseSeconds: number;
  postActivityRecoverySeconds: number;
  bodyZoneIds: readonly string[];
  sideMode: SideMode;
} {
  const isRecovery = activity.type === "RECOVERY";
  return {
    executionMode: isRecovery ? "DURATION" : (activity.executionMode ?? "DURATION"),
    seriesCount: isRecovery ? null : activity.seriesCount,
    pauseSeconds: isRecovery ? 0 : activity.pauseSeconds,
    postActivityRecoverySeconds: isRecovery ? 0 : activity.postActivityRecoverySeconds,
    bodyZoneIds: isRecovery ? [] : activity.bodyZoneIds,
    // V2-BILAT-01 : une Activité `RECOVERY` (défense en profondeur, jamais
    // produite par le Domaine — D-041) n'est jamais elle-même côtée : sa
    // direction reste `UNILATERAL`, quelle que soit la valeur transportée.
    sideMode: isRecovery ? "UNILATERAL" : (activity.sideMode ?? "UNILATERAL"),
  };
}

/**
 * Fusionne les Activités d'un `UpdateSessionInput` avec celles déjà
 * persistées (T01-S10, plan §5.2 étapes 6–10). Fusion PAR IDENTITÉ :
 * - une Activité retirée est supprimée (Zones en cascade) ;
 * - une Activité conservée est mise à jour EN PLACE (identifiant et
 *   `created_at` inchangés) ;
 * - une nouvelle Activité est insérée avec l'identifiant fourni.
 *
 * Les positions des Activités conservées sont d'abord écartées vers une
 * plage haute avant réécriture des positions finales, pour ne jamais violer
 * `UNIQUE(session_id, structural_position, position)` pendant une
 * réorganisation. Les positions finales sont recalculées par zone dans
 * l'ordre du brouillon.
 */
async function mergeActivities(
  transaction: Database,
  sessionId: string,
  cycleId: string,
  tourId: string,
  existingActivityIds: readonly string[],
  activities: readonly UpdateSessionActivityInput[],
  timestamp: string,
): Promise<void> {
  const existing = new Set(existingActivityIds);
  const incoming = new Set(activities.map((activity) => activity.id));

  for (const id of existingActivityIds) {
    if (!incoming.has(id)) {
      await transaction.runAsync(`DELETE FROM activity_body_zones WHERE activity_id = ?`, [id]);
      await transaction.runAsync(`DELETE FROM activities WHERE id = ? AND session_id = ?`, [
        id,
        sessionId,
      ]);
    }
  }

  let stagingPosition = 1_000_000;
  for (const id of existingActivityIds) {
    if (incoming.has(id)) {
      await transaction.runAsync(
        `UPDATE activities SET position = ? WHERE id = ? AND session_id = ?`,
        [stagingPosition, id, sessionId],
      );
      stagingPosition += 1;
    }
  }

  const positionByZone = new Map<string, number>();
  for (const activity of activities) {
    const zone = activity.structuralPosition;
    const position = positionByZone.get(zone) ?? 0;
    positionByZone.set(zone, position + 1);

    const activityTourId = activityTourIdFor(zone, tourId);
    const { executionMode, seriesCount, pauseSeconds, postActivityRecoverySeconds, bodyZoneIds, sideMode } =
      toActivitySqlValues(activity);
    const instruction = activity.instruction ?? null;

    if (existing.has(activity.id)) {
      await transaction.runAsync(
        `UPDATE activities SET
           type = ?, structural_position = ?, position = ?, name = ?,
           execution_mode = ?, duration_seconds = ?, repetition_count = ?,
           series_count = ?, pause_seconds = ?, post_activity_recovery_seconds = ?, instruction = ?,
           tour_id = ?, cycle_id = ?, updated_at = ?, side_mode = ?
         WHERE id = ? AND session_id = ?`,
        [
          activity.type,
          zone,
          position,
          activity.name,
          executionMode,
          activity.durationSeconds,
          activity.repetitionCount,
          seriesCount,
          pauseSeconds,
          postActivityRecoverySeconds,
          instruction,
          activityTourId,
          cycleId,
          timestamp,
          sideMode,
          activity.id,
          sessionId,
        ],
      );
      await transaction.runAsync(`DELETE FROM activity_body_zones WHERE activity_id = ?`, [
        activity.id,
      ]);
    } else {
      await transaction.runAsync(
        `INSERT INTO activities (${ACTIVITY_ROW_COLUMNS})
         VALUES (${ACTIVITY_ROW_PLACEHOLDERS})`,
        [
          activity.id,
          sessionId,
          cycleId,
          activityTourId,
          activity.type,
          zone,
          position,
          activity.name,
          executionMode,
          activity.durationSeconds,
          activity.repetitionCount,
          seriesCount,
          pauseSeconds,
          postActivityRecoverySeconds,
          instruction,
          timestamp,
          timestamp,
          sideMode,
        ],
      );
    }

    for (const bodyZoneId of bodyZoneIds) {
      await transaction.runAsync(
        `INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES (?, ?)`,
        [activity.id, bodyZoneId],
      );
    }
  }
}

/**
 * Relit et assemble l'agrégat complet d'une Séance : lignes d'Activités
 * (une par Activité, déjà ordonnées par `AGGREGATE_QUERY`) et leurs Zones
 * corporelles. `null` si la Séance n'existe pas (ou n'appartient pas à
 * `ownerId`) — jamais une exception pour ce cas attendu.
 */
async function readSession(
  database: Database,
  sessionId: string,
  ownerId: string,
): Promise<Session | null> {
  const rows = await database.getAllAsync<SessionAggregateRow>(AGGREGATE_QUERY, [
    sessionId,
    ownerId,
  ]);
  if (rows.length === 0) {
    return null;
  }

  const activityIds = rows.map((row) => row.activity_id);
  const bodyZoneRows = await getBodyZonesForActivities(database, activityIds);
  const bodyZonesByActivity = new Map<string, string[]>();
  for (const zoneRow of bodyZoneRows) {
    const list = bodyZonesByActivity.get(zoneRow.activity_id) ?? [];
    list.push(zoneRow.body_zone_id);
    bodyZonesByActivity.set(zoneRow.activity_id, list);
  }

  const stopPoints = await getStopPoints(database, sessionId);

  return assembleSession(rows, bodyZonesByActivity, stopPoints);
}

/**
 * Points d'arrêt persistés de la Séance (V2-PRE-1, plan §3.3/§7,
 * REQ-001108DC7F67664C), ordonnés par portée PUIS par position — même
 * convention de tri que `AGGREGATE_QUERY` pour les Activités.
 */
async function getStopPoints(
  database: Database,
  sessionId: string,
): Promise<readonly StopPoint[]> {
  const rows = await database.getAllAsync<{ id: string; scope: StructuralPosition; position: number }>(
    `SELECT id, scope, position FROM session_stop_points
     WHERE session_id = ? ORDER BY scope ASC, position ASC`,
    [sessionId],
  );
  return rows.map((row) => ({ id: row.id, scope: row.scope, order: row.position }));
}

async function getBodyZonesForActivities(
  database: Database,
  activityIds: readonly string[],
): Promise<readonly ActivityBodyZoneRow[]> {
  if (activityIds.length === 0) {
    return [];
  }
  // `activityIds` provient toujours de lignes déjà relues depuis SQLite
  // (jamais une saisie utilisateur directe) : la construction de la liste
  // de paramètres liés ci-dessous reste sûre (aucune concaténation de
  // valeur dans le texte de la requête elle-même).
  const placeholders = activityIds.map(() => "?").join(", ");
  return database.getAllAsync<ActivityBodyZoneRow>(
    `SELECT activity_id, body_zone_id FROM activity_body_zones WHERE activity_id IN (${placeholders})`,
    activityIds,
  );
}

/**
 * Noms des Zones corporelles couvertes par chacune des Séances données
 * (T01-S09, correction VISUAL tentative 2, point B) — union SANS PERTE de
 * `bodyZoneIds` de TOUTES les Activités persistées de chaque Séance (jamais
 * une seule Activité), dédupliquée puis ordonnée selon le référentiel
 * (`BODY_ZONES`, `order` croissant) — jamais l'ordre d'insertion en base.
 */
async function getBodyZoneNamesBySession(
  database: Database,
  sessionIds: readonly string[],
): Promise<ReadonlyMap<string, readonly string[]>> {
  if (sessionIds.length === 0) {
    return new Map();
  }
  // `sessionIds` provient toujours de lignes déjà relues depuis SQLite
  // (jamais une saisie utilisateur directe) : la construction de la liste
  // de paramètres liés ci-dessous reste sûre.
  const placeholders = sessionIds.map(() => "?").join(", ");
  const rows = await database.getAllAsync<{ session_id: string; body_zone_id: string }>(
    `SELECT DISTINCT activities.session_id AS session_id, activity_body_zones.body_zone_id AS body_zone_id
     FROM activities
     JOIN activity_body_zones ON activity_body_zones.activity_id = activities.id
     WHERE activities.session_id IN (${placeholders})`,
    sessionIds,
  );

  const idsBySession = new Map<string, Set<string>>();
  for (const row of rows) {
    const ids = idsBySession.get(row.session_id) ?? new Set<string>();
    ids.add(row.body_zone_id);
    idsBySession.set(row.session_id, ids);
  }

  const namesBySession = new Map<string, readonly string[]>();
  for (const [sessionId, ids] of idsBySession) {
    const names = BODY_ZONES.filter((zone) => ids.has(zone.id))
      .sort((a, b) => a.order - b.order)
      .map((zone) => zone.name);
    namesBySession.set(sessionId, names);
  }
  return namesBySession;
}

function toActivity(
  row: SessionAggregateRow,
  bodyZonesByActivity: ReadonlyMap<string, readonly string[]>,
): Activity {
  const isRecovery = row.activity_type === "RECOVERY";
  return {
    id: row.activity_id,
    type: row.activity_type,
    // Une Récupération stocke `execution_mode = 'DURATION'` en base
    // (contrainte SQL) mais n'expose aucun mode d'Exercice (T01-S10, D-041).
    executionMode: isRecovery ? null : row.execution_mode,
    structuralPosition: row.structural_position,
    position: row.activity_position,
    name: row.activity_name,
    durationSeconds: row.duration_seconds,
    repetitionCount: row.repetition_count,
    seriesCount: isRecovery ? null : row.series_count,
    pauseSeconds: row.pause_seconds,
    // V2-PRE-1 : récupération post-exercice de l'occurrence (`migration007`,
    // colonne renommée depuis `recovery_seconds`). Une ancienne ligne
    // `RECOVERY` n'en porte jamais (`CHECK` SQL) — le `?? 0` couvre la seule
    // autre origine possible d'une valeur absente, une projection partielle
    // de test antérieure à cette colonne.
    postActivityRecoverySeconds: isRecovery ? 0 : (row.post_activity_recovery_seconds ?? 0),
    instruction: row.instruction,
    bodyZoneIds: isRecovery ? [] : (bodyZonesByActivity.get(row.activity_id) ?? []),
    // V2-BILAT-01 : une Récupération n'est jamais elle-même côtée (D-041) ;
    // `?? "UNILATERAL"` couvre la même défense que `postActivityRecoverySeconds`
    // ci-dessus (colonne `NOT NULL`, filet pour une projection partielle de
    // test antérieure à cette colonne).
    sideMode: isRecovery ? "UNILATERAL" : (row.activity_side_mode ?? "UNILATERAL"),
  };
}

export function assembleSession(
  rows: readonly SessionAggregateRow[],
  bodyZonesByActivity: ReadonlyMap<string, readonly string[]>,
  stopPoints: readonly StopPoint[] = [],
): Session {
  for (const row of rows) {
    assertSessionAggregateRow(row);
  }
  const first = rows[0]!;

  const beforeTour: Activity[] = [];
  const inTour: Activity[] = [];
  const afterTour: Activity[] = [];
  for (const row of rows) {
    const activity = toActivity(row, bodyZonesByActivity);
    if (activity.structuralPosition === "BEFORE_TOUR") {
      beforeTour.push(activity);
    } else if (activity.structuralPosition === "AFTER_TOUR") {
      afterTour.push(activity);
    } else {
      inTour.push(activity);
    }
  }

  return {
    id: first.session_id,
    ownerId: first.owner_id,
    name: first.session_name,
    // V2-PRE-1 (plan §3.3) : couleur DÉRIVÉE de l'Étiquette jointe — présentation neutre sans Étiquette.
    color: (first.label_color as SessionColor | null) ?? DEFAULT_SESSION_COLOR,
    labelId: first.label_id,
    status: "ACTIVE",
    initialCountdownSeconds: first.initial_countdown_seconds,
    finalPhaseSeconds: first.final_phase_seconds,
    // V2-PRE-1 (plan §3.3/§7, REQ-001108DC7F67664C) : absent plutôt que `[]`
    // quand la Séance ne porte aucun Point d'arrêt — même convention que
    // `cycle.beforeTour`/`cycle.afterTour` ci-dessous.
    ...(stopPoints.length > 0 ? { stopPoints } : {}),
    createdAt: first.session_created_at,
    updatedAt: first.session_updated_at,
    cycle: {
      id: first.cycle_id,
      position: 1,
      repeatCount: 1,
      // Champs optionnels (T01-S10) : absents quand la zone est vide, pour
      // rester identiques à une Séance S01–S09 (Tour uniquement).
      ...(beforeTour.length > 0 ? { beforeTour } : {}),
      ...(afterTour.length > 0 ? { afterTour } : {}),
      tour: {
        id: first.tour_id,
        position: 1,
        repeatCount: first.tour_repeat_count,
        exercises: inTour,
      },
    },
  };
}

/** @deprecated Conservé pour compatibilité de test direct (une seule ligne) — voir `assembleSession` pour l'assemblage réel multi-lignes. */
export function mapSessionRow(row: SessionAggregateRow): Session {
  return assembleSession([row], new Map());
}

function mapSummaryRow(
  row: SessionSummaryRow,
  bodyZoneNames: readonly string[],
): SessionSummary {
  // T02-S01 : le Catalogue affiche le nombre d'Activités RÉELLEMENT
  // COMPOSÉES — chacune une seule fois, jamais multipliée par
  // `tourRepeatCount` (ce compteur ne représente pas des occurrences
  // d'Exécution). La durée, elle, développe les répétitions du Tour sur la
  // seule zone `IN_TOUR`, et exclut Compte à rebours initial et Fin de séance.
  const activityCount = computeActivityCount({
    beforeTourActivityCount: row.before_tour_activity_count,
    inTourActivityCount: row.in_tour_activity_count,
    afterTourActivityCount: row.after_tour_activity_count,
    tourRepeatCount: row.tour_repeat_count,
  });
  const estimatedDurationSeconds = computeEstimatedDurationSeconds({
    beforeTourDurationSeconds: row.before_tour_duration_seconds,
    inTourDurationSeconds: row.in_tour_duration_seconds,
    afterTourDurationSeconds: row.after_tour_duration_seconds,
    tourRepeatCount: row.tour_repeat_count,
    isLowerBoundEstimate: row.has_repetition_activity === 1,
  });

  return {
    id: row.id,
    name: row.name,
    color: (row.label_color as SessionColor | null) ?? DEFAULT_SESSION_COLOR,
    labelId: row.label_id,
    activityCount,
    estimatedDurationSeconds,
    isEstimatedDurationApproximate: row.has_repetition_activity === 1,
    tourRepeatCount: row.tour_repeat_count,
    updatedAt: row.updated_at,
    categoryNames: [],
    bodyZoneNames,
  };
}

const STRUCTURAL_POSITIONS: readonly string[] = ["BEFORE_TOUR", "IN_TOUR", "AFTER_TOUR"];

/**
 * Défense en profondeur au ré-assemblage (T01-S10) : reflète les `CHECK` de
 * `migration001`/`migration003`. Le Cycle reste unique (`position`/
 * `repeat_count` = 1) ; le Tour est `1..99` ; la position structurelle est
 * l'une des trois ; un Exercice porte une cible cohérente avec son mode
 * (aucune en `TO_FAILURE`) ; une Récupération est chronométrée, sans Séries.
 */
function assertSessionAggregateRow(row: SessionAggregateRow): void {
  if (
    row.status !== "ACTIVE" ||
    row.cycle_position !== 1 ||
    row.cycle_repeat_count !== FIXED_CYCLE_REPEAT_COUNT ||
    row.tour_position !== 1 ||
    row.tour_repeat_count < 1 ||
    row.tour_repeat_count > 99 ||
    !STRUCTURAL_POSITIONS.includes(row.structural_position) ||
    // V2-BILAT-01 : reflète le `CHECK` de `migration005` sur `tours.side_mode`/`activities.side_mode`.
    !SIDE_MODES.includes(row.tour_side_mode) ||
    !SIDE_MODES.includes(row.activity_side_mode)
  ) {
    throw new Error("Persisted session does not satisfy the aggregate contract.");
  }

  if (row.activity_type === "RECOVERY") {
    if (
      row.duration_seconds === null ||
      row.repetition_count !== null ||
      row.series_count !== null
    ) {
      throw new Error("Persisted session does not satisfy the aggregate contract.");
    }
    return;
  }

  if (row.series_count === null || row.series_count < 1) {
    throw new Error("Persisted session does not satisfy the aggregate contract.");
  }
  if (row.execution_mode === "DURATION") {
    if (row.duration_seconds === null || row.repetition_count !== null) {
      throw new Error("Persisted session does not satisfy the aggregate contract.");
    }
  } else if (row.execution_mode === "REPETITIONS") {
    if (row.repetition_count === null || row.duration_seconds !== null) {
      throw new Error("Persisted session does not satisfy the aggregate contract.");
    }
  } else if (row.execution_mode === "TO_FAILURE") {
    if (row.duration_seconds !== null || row.repetition_count !== null) {
      throw new Error("Persisted session does not satisfy the aggregate contract.");
    }
  } else {
    throw new Error("Persisted session does not satisfy the aggregate contract.");
  }
}
