import * as Crypto from "expo-crypto";

import { canonicalCategoryKey } from "@/domain/categories/validation";
import {
  computeActivityCount,
  computeEstimatedDurationSeconds,
} from "@/domain/sessions/calculations";
import {
  FIXED_ACTIVITY_STRUCTURAL_POSITION,
  FIXED_CYCLE_REPEAT_COUNT,
  FIXED_TOUR_REPEAT_COUNT,
} from "@/domain/sessions/defaults";
import { SessionValidationError } from "@/domain/sessions/errors";
import {
  SESSION_COLORS,
  type Activity,
  type Category,
  type CreateSessionCategoryInput,
  type CreateSessionInput,
  type Session,
  type SessionColor,
  type SessionSummary,
  type UpdateSessionActivityInput,
  type UpdateSessionInput,
} from "@/domain/sessions/Session";
import type {
  SessionRepository,
  UpdateSessionOutcome,
} from "@/domain/sessions/SessionRepository";
import {
  validateCreateSessionInput,
  validateUpdateSessionInput,
} from "@/domain/sessions/validation";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";
import { LOCAL_USER_SINGLETON_KEY } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import { mapCategoryRow } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import type {
  ActivityBodyZoneRow,
  SessionAggregateRow,
  SessionCategoryRow,
} from "@/infrastructure/database/types/DatabaseRows";

type LocalUserRow = { id: string };
type CategoryIdRow = { id: string };
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
 */
const AGGREGATE_QUERY = `
SELECT
  sessions.id AS session_id,
  sessions.owner_id,
  sessions.name AS session_name,
  sessions.color,
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
  activities.instruction
FROM sessions
JOIN cycles ON cycles.session_id = sessions.id
JOIN tours ON tours.cycle_id = cycles.id AND tours.session_id = sessions.id
JOIN activities
  ON activities.session_id = sessions.id
  AND activities.cycle_id = cycles.id
WHERE sessions.id = ? AND sessions.owner_id = ?
ORDER BY ${STRUCTURAL_ORDER_SQL} ASC, activities.position ASC
`;

const CATEGORIES_FOR_SESSION_QUERY = `
SELECT categories.id, categories.name, categories.canonical_key, categories.is_predefined, categories.display_order, categories.created_at
FROM session_categories
JOIN categories ON categories.id = session_categories.category_id
WHERE session_categories.session_id = ?
ORDER BY categories.is_predefined DESC, categories.display_order ASC, categories.created_at ASC
`;

export class SqliteSessionRepository implements SessionRepository {
  constructor(
    private readonly database: Database,
    private readonly uuidFactory: UuidFactory = Crypto.randomUUID,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  /**
   * Persiste, dans une UNIQUE transaction SQLite (D-107) : la Séance, le
   * Cycle, le Tour, TOUTES les Activités ordonnées du brouillon, leurs
   * Zones corporelles, les Catégories personnalisées nécessaires (créées ou
   * retrouvées par clé canonique) et les associations Séance↔Catégorie.
   * Toute erreur au sein de cette transaction annule l'intégralité de
   * l'écriture (§`withExclusiveTransactionAsync`, propagation d'exception) —
   * aucune donnée partielle n'est jamais laissée.
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
          id, owner_id, name, color, status,
          initial_countdown_seconds, final_phase_seconds,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)`,
        [
          sessionId,
          user.id,
          normalized.name,
          normalized.color,
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

      await transaction.runAsync(
        `INSERT INTO tours (id, cycle_id, session_id, position, repeat_count)
         VALUES (?, ?, ?, 1, ?)`,
        [tourId, cycleId, sessionId, FIXED_TOUR_REPEAT_COUNT],
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

      const categoryIds = await resolveCategoryIds(
        transaction,
        normalized.categories,
        this.uuidFactory,
        timestamp,
      );
      await insertSessionCategories(transaction, sessionId, categoryIds);

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
   * en cascade). Les positions structurelles, le mode `TO_FAILURE`, les
   * Récupérations, `tour.repeatCount`, les Zones corporelles et les
   * Catégories sont persistés dans la même transaction ; toute erreur annule
   * l'intégralité de l'écriture.
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
        `UPDATE sessions SET name = ?, color = ?, initial_countdown_seconds = ?,
           final_phase_seconds = ?, updated_at = ?
         WHERE id = ? AND owner_id = ?`,
        [
          normalized.name,
          normalized.color,
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

      await transaction.runAsync(`DELETE FROM session_categories WHERE session_id = ?`, [sessionId]);
      const categoryIds = await resolveCategoryIds(
        transaction,
        normalized.categories,
        this.uuidFactory,
        timestamp,
      );
      await insertSessionCategories(transaction, sessionId, categoryIds);

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
    const rows = await this.database.getAllAsync<{
      id: string;
      name: string;
      color: string;
      activity_count: number;
      initial_countdown_seconds: number;
      final_phase_seconds: number;
      activity_duration_seconds: number;
      has_repetition_activity: 0 | 1;
      tour_repeat_count: number;
      updated_at: string;
    }>(
      `SELECT
        sessions.id,
        sessions.name,
        sessions.color,
        COUNT(activities.id) AS activity_count,
        sessions.initial_countdown_seconds,
        sessions.final_phase_seconds,
        SUM(
          CASE
            WHEN activities.type = 'RECOVERY'
              THEN COALESCE(activities.duration_seconds, 0)
            ELSE COALESCE(activities.series_count, 0) * COALESCE(activities.duration_seconds, 0)
               + COALESCE(activities.series_count, 0) * activities.pause_seconds
          END
        ) AS activity_duration_seconds,
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
    const [categoryNamesBySession, bodyZoneNamesBySession] = await Promise.all([
      getCategoryNamesBySession(this.database, sessionIds),
      getBodyZoneNamesBySession(this.database, sessionIds),
    ]);

    return rows.map((row) =>
      mapSummaryRow(
        row,
        categoryNamesBySession.get(row.id) ?? [],
        bodyZoneNamesBySession.get(row.id) ?? [],
      ),
    );
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
 * Insère, dans l'ORDRE, une Activité par élément de `exercises` — `position`
 * suit l'index de la collection (0-indexé), exactement l'ordre du brouillon
 * (`SessionDraft.exercises`) — puis ses Zones corporelles associées.
 */
async function insertActivities(
  transaction: Database,
  sessionId: string,
  cycleId: string,
  tourId: string,
  exercises: CreateSessionInput["exercises"],
  uuidFactory: UuidFactory,
  timestamp: string,
): Promise<void> {
  for (const [position, exercise] of exercises.entries()) {
    const activityId = uuidFactory();

    await transaction.runAsync(
      `INSERT INTO activities (
        id, session_id, cycle_id, tour_id, type, structural_position,
        position, name, execution_mode, duration_seconds,
        repetition_count, series_count, pause_seconds, instruction,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, 'EXERCISE', ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )`,
      [
        activityId,
        sessionId,
        cycleId,
        tourId,
        FIXED_ACTIVITY_STRUCTURAL_POSITION,
        position,
        exercise.name,
        exercise.executionMode,
        exercise.durationSeconds,
        exercise.repetitionCount,
        exercise.seriesCount,
        exercise.pauseSeconds,
        exercise.instruction ?? null,
        timestamp,
        timestamp,
      ],
    );

    for (const bodyZoneId of exercise.bodyZoneIds) {
      await transaction.runAsync(
        `INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES (?, ?)`,
        [activityId, bodyZoneId],
      );
    }
  }
}

const ACTIVITY_ROW_COLUMNS = `
  id, session_id, cycle_id, tour_id, type, structural_position,
  position, name, execution_mode, duration_seconds,
  repetition_count, series_count, pause_seconds, instruction,
  created_at, updated_at
`;

/** Colonne SQL `tour_id` d'une Activité selon sa zone (T01-S10) : le Tour pour `IN_TOUR`, `NULL` sinon (contrainte `migration001`). */
function activityTourIdFor(structuralPosition: string, tourId: string): string | null {
  return structuralPosition === "IN_TOUR" ? tourId : null;
}

/**
 * Valeurs SQL d'une `UpdateSessionActivityInput` (T01-S10). `execution_mode`
 * est une colonne `NOT NULL` : une Récupération y stocke `'DURATION'` (imposé
 * par le `CHECK` de `migration001`), tandis que le Domaine réexpose `null`.
 * Une Récupération n'a ni Séries, ni pause, ni Zones corporelles (D-041).
 */
function toActivitySqlValues(activity: UpdateSessionActivityInput): {
  executionMode: string;
  seriesCount: number | null;
  pauseSeconds: number;
  bodyZoneIds: readonly string[];
} {
  const isRecovery = activity.type === "RECOVERY";
  return {
    executionMode: isRecovery ? "DURATION" : (activity.executionMode ?? "DURATION"),
    seriesCount: isRecovery ? null : activity.seriesCount,
    pauseSeconds: isRecovery ? 0 : activity.pauseSeconds,
    bodyZoneIds: isRecovery ? [] : activity.bodyZoneIds,
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
    const { executionMode, seriesCount, pauseSeconds, bodyZoneIds } = toActivitySqlValues(activity);
    const instruction = activity.instruction ?? null;

    if (existing.has(activity.id)) {
      await transaction.runAsync(
        `UPDATE activities SET
           type = ?, structural_position = ?, position = ?, name = ?,
           execution_mode = ?, duration_seconds = ?, repetition_count = ?,
           series_count = ?, pause_seconds = ?, instruction = ?,
           tour_id = ?, cycle_id = ?, updated_at = ?
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
          instruction,
          activityTourId,
          cycleId,
          timestamp,
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
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          instruction,
          timestamp,
          timestamp,
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
 * Résout chaque `CreateSessionCategoryInput` vers un identifiant de
 * Catégorie réellement persisté (D-107) : `EXISTING` doit référencer une
 * Catégorie déjà présente (défense en profondeur — une entrée orpheline
 * échoue explicitement plutôt que de silencieusement créer une association
 * vers rien) ; `NEW` retrouve la Catégorie existante de même clé canonique
 * si elle existe déjà (jamais de doublon, D-106) ou la crée sinon. Les
 * identifiants retournés sont dédupliqués (une même Catégorie ne peut être
 * associée qu'une fois à la Séance, `session_categories` porte une clé
 * primaire composite) tout en conservant l'ordre de première apparition.
 */
async function resolveCategoryIds(
  transaction: Database,
  categories: readonly CreateSessionCategoryInput[],
  uuidFactory: UuidFactory,
  timestamp: string,
): Promise<readonly string[]> {
  const resolved: string[] = [];
  const seen = new Set<string>();

  for (const category of categories) {
    let categoryId: string;

    if (category.kind === "EXISTING") {
      const row = await transaction.getFirstAsync<CategoryIdRow>(
        "SELECT id FROM categories WHERE id = ?",
        [category.categoryId],
      );
      if (!row) {
        throw new Error("Referenced category does not exist.");
      }
      categoryId = row.id;
    } else {
      const canonicalKey = canonicalCategoryKey(category.name);
      const existing = await transaction.getFirstAsync<CategoryIdRow>(
        "SELECT id FROM categories WHERE canonical_key = ?",
        [canonicalKey],
      );
      if (existing) {
        categoryId = existing.id;
      } else {
        categoryId = uuidFactory();
        await transaction.runAsync(
          `INSERT INTO categories (id, name, canonical_key, is_predefined, display_order, created_at)
           VALUES (?, ?, ?, 0, NULL, ?)`,
          [categoryId, category.name, canonicalKey, timestamp],
        );
      }
    }

    if (!seen.has(categoryId)) {
      seen.add(categoryId);
      resolved.push(categoryId);
    }
  }

  return resolved;
}

async function insertSessionCategories(
  transaction: Database,
  sessionId: string,
  categoryIds: readonly string[],
): Promise<void> {
  for (const categoryId of categoryIds) {
    await transaction.runAsync(
      `INSERT INTO session_categories (session_id, category_id) VALUES (?, ?)`,
      [sessionId, categoryId],
    );
  }
}

/**
 * Relit et assemble l'agrégat complet d'une Séance : lignes d'Activités
 * (une par Activité, déjà ordonnées par `AGGREGATE_QUERY`), leurs Zones
 * corporelles et les Catégories associées. `null` si la Séance n'existe pas
 * (ou n'appartient pas à `ownerId`) — jamais une exception pour ce cas
 * attendu.
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

  const categoryRows = await database.getAllAsync<SessionCategoryRow>(
    CATEGORIES_FOR_SESSION_QUERY,
    [sessionId],
  );

  return assembleSession(rows, bodyZonesByActivity, categoryRows.map(mapCategoryRow));
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
 * Noms de Catégories associées à chacune des Séances données (T01-S09,
 * correction VISUAL tentative 2, point B — ligne manquante du contrat
 * d'écran CE-T01-03 sous le nom de la Séance), déjà ordonnés par Séance
 * (prédéfinies par `display_order`, puis personnalisées par `created_at`,
 * D-107) — même ordre que `CATEGORIES_FOR_SESSION_QUERY`, jamais un ordre
 * distinct recalculé côté application. Une seule requête groupée (jamais
 * une requête par Séance) pour les identifiants demandés.
 */
async function getCategoryNamesBySession(
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
  const rows = await database.getAllAsync<{ session_id: string; name: string }>(
    `SELECT session_categories.session_id AS session_id, categories.name AS name
     FROM session_categories
     JOIN categories ON categories.id = session_categories.category_id
     WHERE session_categories.session_id IN (${placeholders})
     ORDER BY
       session_categories.session_id ASC,
       categories.is_predefined DESC,
       categories.display_order ASC,
       categories.created_at ASC`,
    sessionIds,
  );

  const namesBySession = new Map<string, string[]>();
  for (const row of rows) {
    const names = namesBySession.get(row.session_id) ?? [];
    names.push(row.name);
    namesBySession.set(row.session_id, names);
  }
  return namesBySession;
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
    instruction: row.instruction,
    bodyZoneIds: isRecovery ? [] : (bodyZonesByActivity.get(row.activity_id) ?? []),
  };
}

export function assembleSession(
  rows: readonly SessionAggregateRow[],
  bodyZonesByActivity: ReadonlyMap<string, readonly string[]>,
  categories: readonly Category[],
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
    color: first.color as SessionColor,
    status: "ACTIVE",
    initialCountdownSeconds: first.initial_countdown_seconds,
    finalPhaseSeconds: first.final_phase_seconds,
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
    categories,
  };
}

/** @deprecated Conservé pour compatibilité de test direct (une seule ligne) — voir `assembleSession` pour l'assemblage réel multi-lignes. */
export function mapSessionRow(row: SessionAggregateRow): Session {
  return assembleSession([row], new Map(), []);
}

function mapSummaryRow(
  row: {
    id: string;
    name: string;
    color: string;
    activity_count: number;
    initial_countdown_seconds: number;
    final_phase_seconds: number;
    activity_duration_seconds: number;
    has_repetition_activity: 0 | 1;
    tour_repeat_count: number;
    updated_at: string;
  },
  categoryNames: readonly string[],
  bodyZoneNames: readonly string[],
): SessionSummary {
  const activityCount = computeActivityCount({
    compositionActivityCount: row.activity_count,
    tourRepeatCount: row.tour_repeat_count,
  });
  const estimatedDurationSeconds = computeEstimatedDurationSeconds({
    initialCountdownSeconds: row.initial_countdown_seconds,
    finalPhaseSeconds: row.final_phase_seconds,
    activityDurationSeconds: row.activity_duration_seconds,
    isLowerBoundEstimate: row.has_repetition_activity === 1,
  });

  return {
    id: row.id,
    name: row.name,
    color: row.color as SessionColor,
    activityCount,
    estimatedDurationSeconds,
    isEstimatedDurationApproximate: row.has_repetition_activity === 1,
    tourRepeatCount: row.tour_repeat_count,
    updatedAt: row.updated_at,
    categoryNames,
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
  if (!SESSION_COLORS.includes(row.color as SessionColor)) {
    throw new Error("Persisted session color is invalid.");
  }
  if (
    row.status !== "ACTIVE" ||
    row.cycle_position !== 1 ||
    row.cycle_repeat_count !== FIXED_CYCLE_REPEAT_COUNT ||
    row.tour_position !== 1 ||
    row.tour_repeat_count < 1 ||
    row.tour_repeat_count > 99 ||
    !STRUCTURAL_POSITIONS.includes(row.structural_position)
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
