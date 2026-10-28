import * as Crypto from "expo-crypto";

import {
  ACTIVITY_STORAGE_BOUNDS,
  EXECUTION_PARAMETERS_VERSION,
  numberTarget,
  projectScalars,
  readCatalogExecutionParameters,
  serializeCatalogExecutionParameters,
  unsetTarget,
  type ExecutionParameters,
} from "@/domain/activities/ExecutionParameters";
import { resolveCatalogParameters, splitResolvedParameters } from "@/domain/activities/Movement";
import { MovementNotFoundError } from "@/domain/activities/MovementRepository";
import { DEFAULT_CIRCUIT_NATURE, isCircuitNature, type CircuitNature } from "@/domain/sessions/circuit";
import { SessionValidationError } from "@/domain/sessions/errors";
import {
  DEFAULT_SESSION_COLOR,
  type Activity,
  type ActivityType,
  type CreateSessionActivityInput,
  type CreateSessionInput,
  type CreateStopPointInput,
  type Session,
  type SessionColor,
  type SessionMovementInput,
  type SessionSummary,
  type StructuralPosition,
  type UpdateSessionActivityInput,
  type UpdateSessionInput,
} from "@/domain/sessions/Session";
import type { StopPoint } from "@/domain/sessions/StopPoint";
import type {
  CatalogueSessionRecord,
  SessionCatalogueRepository,
  SessionRepository,
  StructuredSession,
  StructuredSessionRepository,
  UpdateSessionOutcome,
  UpdateStructuredSessionOutcome,
} from "@/domain/sessions/SessionRepository";
import { SIDE_MODES, type SideMode } from "@/domain/sessions/sideMode";
import {
  CIRCUIT_REPEAT_COUNT_MAX,
  CIRCUIT_REPEAT_COUNT_MIN,
  CYCLE_REPEAT_COUNT_MIN,
  computeStructureDuration,
  countStructureExercises,
  legacyFromStructure,
  structureCircuits,
  structureExercises,
  structureFromLegacy,
  type SessionStructure,
  type StructureCircuit,
  type StructureElement,
  type StructureStopPoint,
} from "@/domain/sessions/structure";
import {
  validateStructuredSessionInput,
  type StructureExerciseInput,
  type StructureInput,
  type StructuredSessionInput,
} from "@/domain/sessions/structuredInput";
import {
  validateCreateSessionInput,
  validateUpdateSessionInput,
} from "@/domain/sessions/validation";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";
import { LOCAL_USER_SINGLETON_KEY } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import type {
  ActivityRow,
  CircuitRow,
  CycleRow,
  SessionHeaderRow,
  StopPointRow,
} from "@/infrastructure/database/types/DatabaseRows";

import {
  insertMovement,
  joinMovementGroup,
  readMovementRecords,
  updateMovementContent,
  type MovementRecord,
} from "./SqliteMovementRepository";

type LocalUserRow = { id: string };
type UuidFactory = () => string;

/**
 * Garde « valeur retirée » côté stockage (T16, D-210, requirement
 * référentiels Étiquette/Catégorie/Zone), côté Étiquette de Séance : une
 * nouvelle affectation (différente de celle déjà persistée) vers une
 * Étiquette RETIRÉE est refusée ; l'affectation déjà en place reste permise
 * même si l'Étiquette a été retirée entre-temps. Même patron que
 * `RetiredCategoryError` (`SqliteActivityDefinitionRepository.ts`).
 */
export class RetiredLabelError extends Error {
  constructor() {
    super("The referenced label has been retired and cannot be newly assigned.");
    this.name = "RetiredLabelError";
  }
}

/**
 * PRE-3 : même garde (T16, D-210) pour la Catégorie transportée par une
 * copie — la Catégorie déjà affectée reste permise même retirée ; une
 * NOUVELLE affectation vers une Catégorie retirée est refusée. PRE-7 (R-3,
 * C05) : la Catégorie appartient au Mouvement ; la garde s'applique aux
 * Mouvements nouveaux ou corrigés depuis la Séance.
 */
export class RetiredOccurrenceCategoryError extends Error {
  constructor() {
    super("The referenced category has been retired and cannot be newly assigned to an occurrence.");
    this.name = "RetiredOccurrenceCategoryError";
  }
}

/**
 * PRE-4, décision Q53 (8) de Hermann (2026-10-18) : même règle que les Zones — une
 * occurrence NOUVELLE (`inheritable`) garde une Catégorie retirée déjà affectée à au moins
 * une Définition ou une occurrence (affectation héritée de sa source) ; une Catégorie
 * retirée affectée nulle part reste refusée (D-210). Occurrence conservée : seule sa propre
 * affectation compte.
 */
async function assertOccurrenceCategoryAssignable(
  transaction: Database,
  categoryId: string | null | undefined,
  currentCategoryId: string | null,
  inheritable = false,
): Promise<void> {
  if (categoryId === undefined || categoryId === null || categoryId === currentCategoryId) {
    return;
  }
  const row = await transaction.getFirstAsync<ReferentialIdRow>(
    "SELECT id, is_active FROM categories WHERE id = ?",
    [categoryId],
  );
  if (!row) {
    throw new Error("Referenced category does not exist.");
  }
  if (row.is_active === 0) {
    if (inheritable && (await isCategoryAssignedAnywhere(transaction, row.id))) {
      return;
    }
    throw new RetiredOccurrenceCategoryError();
  }
}

/** Même garde (T16, D-210), côté Zones corporelles d'une Activité — une Zone déjà affectée reste permise même retirée ; une NOUVELLE affectation à une Zone retirée est refusée. */
export class RetiredBodyZoneError extends Error {
  constructor() {
    super("A referenced body zone has been retired and cannot be newly assigned.");
    this.name = "RetiredBodyZoneError";
  }
}

type ReferentialIdRow = { id: string; is_active: 0 | 1 };

/**
 * Refuse une NOUVELLE affectation d'Étiquette vers une entrée RETIRÉE —
 * `currentLabelId` est l'affectation déjà persistée avant la modification
 * (`null` à la création, où aucune affectation existante ne peut donc
 * jamais être "conservée").
 */
async function assertLabelAssignable(
  transaction: Database,
  labelId: string | null,
  currentLabelId: string | null,
  /**
   * Q53 (8) : vrai pour une Séance NOUVELLE (création, duplication) — une Étiquette retirée
   * déjà affectée à une autre Séance est héritée de sa source et acceptée ; affectée nulle
   * part, elle reste refusée (D-210). Modification : seule l'affectation déjà en place compte.
   */
  inheritable = false,
): Promise<void> {
  if (labelId === null || labelId === currentLabelId) {
    return;
  }
  const row = await transaction.getFirstAsync<ReferentialIdRow>(
    "SELECT id, is_active FROM labels WHERE id = ?",
    [labelId],
  );
  if (!row) {
    throw new Error("Referenced label does not exist.");
  }
  if (row.is_active === 0) {
    if (inheritable) {
      const used = await transaction.getFirstAsync<{ id: string }>(
        "SELECT id FROM sessions WHERE label_id = ? LIMIT 1",
        [row.id],
      );
      if (used) return;
    }
    throw new RetiredLabelError();
  }
}

/**
 * Refuse une NOUVELLE affectation de Zone corporelle vers une entrée
 * RETIRÉE — `currentBodyZoneIds` porte les Zones déjà affectées à CETTE
 * Activité avant la modification (ensemble vide pour une Activité
 * nouvellement créée).
 *
 * PRE-4, décision Q53 de Hermann (2026-10-18, remplace Q49 b pour les
 * Zones) : une Zone retirée ne bloque pas l'utilisation d'un Exercice auquel
 * elle est déjà affectée — la Copie d'une Définition (ou la duplication d'une
 * occurrence) conserve l'affectation. Une occurrence nouvellement créée n'a
 * aucun lien persistant vers sa source : `inheritedBodyZoneIds` porte donc les
 * Zones déjà affectées, AVANT l'écriture, à au moins une Définition ou une
 * occurrence existante. Une Zone retirée y figurant est acceptée pour une
 * occurrence NOUVELLE (affectation héritée de sa source) ; une Zone retirée
 * affectée nulle part reste refusée (D-210). L'interface ne propose jamais une
 * Zone retirée pour une nouvelle affectation (`BodyZonePickerModal` : seules
 * les Zones retirées déjà affectées à CET Exercice y figurent), ce qui ferme
 * le cas résiduel d'une Zone retirée affectée ailleurs. Pour une occurrence
 * CONSERVÉE, seule sa propre affectation compte (`inheritedBodyZoneIds` vide).
 */
async function assertBodyZonesAssignable(
  transaction: Database,
  bodyZoneIds: readonly string[],
  currentBodyZoneIds: ReadonlySet<string>,
  inheritedBodyZoneIds: ReadonlySet<string> = new Set(),
): Promise<void> {
  const newIds = bodyZoneIds.filter((id) => !currentBodyZoneIds.has(id));
  if (newIds.length === 0) {
    return;
  }
  const placeholders = newIds.map(() => "?").join(", ");
  const rows = await transaction.getAllAsync<ReferentialIdRow>(
    `SELECT id, is_active FROM body_zones WHERE id IN (${placeholders})`,
    newIds,
  );
  const foundIds = new Set(rows.map((row) => row.id));
  for (const id of newIds) {
    if (!foundIds.has(id)) {
      throw new Error("Referenced body zone does not exist.");
    }
  }
  if (rows.some((row) => row.is_active === 0 && !inheritedBodyZoneIds.has(row.id))) {
    throw new RetiredBodyZoneError();
  }
}

/** Q53 (8) : la Catégorie est-elle affectée à au moins un Mouvement (R-3 : seul porteur de la Catégorie) ? */
async function isCategoryAssignedAnywhere(transaction: Database, categoryId: string): Promise<boolean> {
  const row = await transaction.getFirstAsync<{ id: string }>("SELECT id FROM movements WHERE category_id = ? LIMIT 1", [
    categoryId,
  ]);
  return row !== null && row !== undefined;
}

/**
 * Q53 : Zones affectées à au moins un Mouvement (R-3, C05 : seul porteur des
 * Zones), lues AVANT toute écriture de la transaction (voir
 * `assertBodyZonesAssignable`).
 */
async function getInheritableBodyZoneIds(transaction: Database): Promise<ReadonlySet<string>> {
  const rows = await transaction.getAllAsync<{ body_zone_id: string }>("SELECT DISTINCT body_zone_id FROM movement_body_zones");
  return new Set(rows.map((row) => row.body_zone_id));
}

/** Message unique des contrôles de contrat de lecture et d'écriture. */
const AGGREGATE_CONTRACT_ERROR = "Persisted session does not satisfy the aggregate contract.";

function contractError(): Error {
  return new Error(AGGREGATE_CONTRACT_ERROR);
}

/**
 * PRE-8 (A.4) : la Séance persistée a une structure plus riche que l'ancien modèle à Circuit
 * unique (plusieurs Circuits, aucun Circuit ou des Cycles) ; l'interface actuelle ne peut ni
 * l'afficher ni la modifier sans perte. Lue par `findStructuredById`.
 */
export class SessionStructureNotRepresentableError extends Error {
  constructor(readonly sessionId: string) {
    super(`Session ${sessionId} has a structure that the single-circuit model cannot represent.`);
    this.name = "SessionStructureNotRepresentableError";
  }
}

export class SqliteSessionRepository implements SessionRepository, StructuredSessionRepository, SessionCatalogueRepository {
  constructor(
    private readonly database: Database,
    private readonly uuidFactory: UuidFactory = Crypto.randomUUID,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  /**
   * Persiste, dans une UNIQUE transaction SQLite (D-107) : la Séance, son Circuit et TOUS les
   * Exercices ordonnés du brouillon. Toute erreur au sein de cette transaction annule
   * l'intégralité de l'écriture — aucune donnée partielle n'est jamais laissée.
   *
   * PRE-8 (A.4) : l'entrée de l'ancien modèle (zones avant, dans et après le Circuit) est écrite
   * comme la structure `[avant…, Circuit, après…]` (`structureFromLegacy`) ; validation
   * inchangée (`validateCreateSessionInput`).
   */
  async create(input: CreateSessionInput): Promise<Session> {
    const validated = validateCreateSessionInput(input);
    if (!validated.ok) {
      throw new SessionValidationError(validated.violations);
    }
    const normalized = validated.value;
    const sessionId = this.uuidFactory();
    const circuitId = this.uuidFactory();
    const structure = structureInputFromLegacy(normalized.exercises, normalized.stopPoints ?? [], {
      id: circuitId,
      repeatCount: normalized.tourRepeatCount,
      nature: normalized.circuitNature ?? DEFAULT_CIRCUIT_NATURE,
    }, this.uuidFactory);
    const stored = await this.insertSession(sessionId, { ...normalized, structure });
    return toLegacySession(stored);
  }

  /** PRE-8 (A.4) : création d'une Séance à structure générale (`validateStructuredSessionInput`). */
  async createStructured(input: StructuredSessionInput): Promise<StructuredSession> {
    const validated = validateStructuredSessionInput(input);
    if (!validated.ok) {
      throw new SessionValidationError(validated.violations);
    }
    return toStructuredSession(await this.insertSession(this.uuidFactory(), validated.value));
  }

  private async insertSession(sessionId: string, input: StructuredSessionInput): Promise<AssembledSession> {
    let created: AssembledSession | null = null;
    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const timestamp = this.now();
      const user = await getLocalUser(transaction);
      await assertLabelAssignable(transaction, input.labelId ?? null, null, true);
      await transaction.runAsync(
        `INSERT INTO sessions (
          id, owner_id, name, label_id, status,
          initial_countdown_seconds, final_phase_seconds,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)`,
        [
          sessionId,
          user.id,
          input.name,
          input.labelId ?? null,
          input.initialCountdownSeconds,
          input.finalPhaseSeconds,
          timestamp,
          timestamp,
        ],
      );
      await writeSessionMovements(transaction, input.movements ?? [], timestamp, this.uuidFactory);
      await writeStructure(transaction, sessionId, input.structure, null, timestamp, this.uuidFactory);
      created = await readAssembledSession(transaction, sessionId, user.id);
    });
    if (!created) {
      throw new Error("The created session could not be read back.");
    }
    return created;
  }

  /**
   * Modification bout en bout d'une Séance persistée (T01-S10, plan §5.2 ; Q3-A). Même
   * transaction exclusive et mêmes issues métier `UPDATED` / `NOT_FOUND` / `ARCHIVED` /
   * `ACTIVITY_NOT_FOUND`. Les Exercices sont fusionnés par identité (identifiant, `created_at`
   * et référence au Mouvement conservés) ; le Circuit garde son identité ; une nature absente
   * de l'entrée conserve la nature persistée (PRE-6). Une Séance dont la structure n'est pas
   * représentable dans l'ancien modèle n'est jamais réécrite par ce chemin (A.4).
   */
  async update(sessionId: string, input: UpdateSessionInput): Promise<UpdateSessionOutcome> {
    const validated = validateUpdateSessionInput(input);
    if (!validated.ok) {
      throw new SessionValidationError(validated.violations);
    }
    const normalized = validated.value;
    const outcome = await this.replaceSession(sessionId, normalized.persistedActivityIds, (existing) => {
      const legacy = legacyFromStructure(existing.structure);
      if (legacy === null) {
        throw new SessionStructureNotRepresentableError(sessionId);
      }
      const tour = legacy.composition.tour;
      return {
        ...normalized,
        structure: structureInputFromLegacy(normalized.activities, normalized.stopPoints ?? [], {
          id: tour.id,
          repeatCount: normalized.tourRepeatCount,
          nature: normalized.circuitNature ?? tour.nature,
        }, this.uuidFactory),
      };
    });
    return outcome.status === "UPDATED" ? { status: "UPDATED", session: toLegacySession(outcome.session) } : outcome;
  }

  /** PRE-8 (A.4) : modification d'une Séance à structure générale, fusion par identité. */
  async updateStructured(
    sessionId: string,
    input: StructuredSessionInput & { readonly persistedActivityIds?: readonly string[] },
  ): Promise<UpdateStructuredSessionOutcome> {
    const validated = validateStructuredSessionInput(input);
    if (!validated.ok) {
      throw new SessionValidationError(validated.violations);
    }
    const outcome = await this.replaceSession(sessionId, input.persistedActivityIds, () => validated.value);
    return outcome.status === "UPDATED" ? { status: "UPDATED", session: toStructuredSession(outcome.session) } : outcome;
  }

  private async replaceSession(
    sessionId: string,
    persistedActivityIds: readonly string[] | undefined,
    build: (existing: AssembledSession) => StructuredSessionInput,
  ): Promise<
    | { readonly status: "UPDATED"; readonly session: AssembledSession }
    | { readonly status: "NOT_FOUND" | "ARCHIVED" | "ACTIVITY_NOT_FOUND" }
  > {
    let outcome:
      | { readonly status: "UPDATED"; readonly session: AssembledSession }
      | { readonly status: "NOT_FOUND" | "ARCHIVED" | "ACTIVITY_NOT_FOUND" } = { status: "NOT_FOUND" };

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const timestamp = this.now();
      const user = await getLocalUser(transaction);
      const header = await transaction.getFirstAsync<SessionHeaderRow>(`${HEADER_SELECT} WHERE sessions.id = ? AND sessions.owner_id = ?`, [
        sessionId,
        user.id,
      ]);
      if (!header) {
        return;
      }
      if (header.status !== "ACTIVE") {
        outcome = { status: "ARCHIVED" };
        return;
      }
      const existing = (await readAssembledSessions(transaction, [header]))[0]!;
      // PRE-4 story 4.1 (AC13, FR-01-10) : un Exercice chargé à l'ouverture et supprimé depuis
      // n'est jamais recréé. Vérifié AVANT toute écriture.
      const existingActivityIds = new Set(existing.stored.activities.map((row) => row.id));
      const persisted = new Set(persistedActivityIds ?? []);
      const input = build(existing);
      if (structureExercises(input.structure).some((exercise) => persisted.has(exercise.id) && !existingActivityIds.has(exercise.id))) {
        outcome = { status: "ACTIVITY_NOT_FOUND" };
        return;
      }

      await assertLabelAssignable(transaction, input.labelId ?? null, header.label_id);
      const sessionUpdate = await transaction.runAsync(
        `UPDATE sessions SET name = ?, label_id = ?, initial_countdown_seconds = ?,
           final_phase_seconds = ?, updated_at = ?
         WHERE id = ? AND owner_id = ?`,
        [
          input.name,
          input.labelId ?? null,
          input.initialCountdownSeconds,
          input.finalPhaseSeconds,
          timestamp,
          sessionId,
          user.id,
        ],
      );
      if (sessionUpdate.changes !== 1) {
        throw new Error("Expected exactly one session row to be updated.");
      }
      await writeSessionMovements(transaction, input.movements ?? [], timestamp, this.uuidFactory);
      await writeStructure(
        transaction,
        sessionId,
        input.structure,
        {
          cycles: new Set(existing.stored.cycles.map((row) => row.id)),
          circuits: new Set(existing.stored.circuits.map((row) => row.id)),
          activities: existingActivityIds,
        },
        timestamp,
        this.uuidFactory,
      );
      const session = await readAssembledSession(transaction, sessionId, user.id);
      if (!session) {
        throw new Error("The updated session could not be read back coherently.");
      }
      outcome = { status: "UPDATED", session };
    });
    return outcome;
  }

  /**
   * Projection de la Séance dans l'ancien modèle à Circuit unique, lue par l'interface actuelle.
   * PRE-8 (A.4) : une Séance plus riche lève `SessionStructureNotRepresentableError` (lecture
   * par `findStructuredById`) plutôt que d'être tronquée.
   */
  async findById(sessionId: string): Promise<Session | null> {
    const user = await getLocalUser(this.database);
    const assembled = await readAssembledSession(this.database, sessionId, user.id);
    return assembled ? toLegacySession(assembled) : null;
  }

  async findStructuredById(sessionId: string): Promise<StructuredSession | null> {
    const user = await getLocalUser(this.database);
    const assembled = await readAssembledSession(this.database, sessionId, user.id);
    return assembled ? toStructuredSession(assembled) : null;
  }

  async findSessionStatus(sessionId: string): Promise<"ACTIVE" | "ARCHIVED" | null> {
    const user = await getLocalUser(this.database);
    const row = await this.database.getFirstAsync<{ status: "ACTIVE" | "ARCHIVED" }>(
      "SELECT status FROM sessions WHERE id = ? AND owner_id = ?",
      [sessionId, user.id],
    );
    return row?.status ?? null;
  }

  /**
   * Résumés des Séances actives, les plus récentes d'abord. PRE-8 (A.4, D-449 §6) : le nombre
   * d'Exercices est celui de la composition (chaque Exercice une fois, sans multiplier par
   * séries, tours ni répétitions de Cycle) ; la durée est celle de la structure, par l'autorité
   * unique du Domaine (`computeStructureDuration`), identique à l'ancien calcul sur une Séance à
   * Circuit unique. Lecture groupée par table, sans N+1.
   */
  async listActive(): Promise<readonly SessionSummary[]> {
    const user = await getLocalUser(this.database);
    const headers = await this.database.getAllAsync<SessionHeaderRow>(
      `${HEADER_SELECT} WHERE sessions.owner_id = ? AND sessions.status = 'ACTIVE' ORDER BY sessions.updated_at DESC`,
      [user.id],
    );
    const assembled = await readAssembledSessions(this.database, headers);
    const bodyZoneNamesBySession = await getBodyZoneNamesBySession(
      this.database,
      headers.map((header) => header.session_id),
    );
    return assembled.map((session) => toSummary(session, bodyZoneNamesBySession.get(session.stored.header.session_id) ?? []));
  }

  /**
   * PRE-8 (epic E, story E.1) : Séances actives et archivées du Catalogue unifié, avec leur
   * structure générale, les plus récemment modifiées d'abord (même ordre que `listActive`). Lecture
   * groupée par table, sans N+1 ; contrat de structure contrôlé comme à l'édition, statut archivé
   * admis (consultation seule).
   */
  async listCatalogue(): Promise<readonly CatalogueSessionRecord[]> {
    const user = await getLocalUser(this.database);
    const headers = await this.database.getAllAsync<SessionHeaderRow>(
      `${HEADER_SELECT} WHERE sessions.owner_id = ? ORDER BY sessions.updated_at DESC`,
      [user.id],
    );
    const assembled = await readAssembledSessions(this.database, headers, { allowArchived: true });
    return assembled.map(({ stored, structure }) => ({
      id: stored.header.session_id,
      name: stored.header.session_name,
      color: (stored.header.label_color as SessionColor | null) ?? DEFAULT_SESSION_COLOR,
      labelId: stored.header.label_id,
      status: stored.header.status,
      archivedAt: stored.header.archived_at ?? null,
      updatedAt: stored.header.session_updated_at,
      structure,
    }));
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
 * PRE-7 (R-3, D-445 C05, arbitrage de Hermann du 26/10/2026) : écrit les
 * Mouvements NOUVEAUX (création locale en Séance, identifiant pré-alloué par
 * le brouillon) et CORRIGÉS du brouillon, dans la transaction de la Séance et
 * AVANT les occurrences qui les référencent. Un échec annule la Séance entière :
 * une création annulée ne laisse aucun Mouvement. Un nom déjà pris lève
 * `DuplicateMovementNameError` (C01).
 *
 * Garde des référentiels retirés (T16, D-210, Q53) : un Mouvement nouveau peut
 * garder une Catégorie ou une Zone retirée déjà affectée à un Mouvement ; un
 * Mouvement corrigé garde ses propres affectations. Les liens de médias d'un
 * Mouvement nouveau dérivent leur identité du Mouvement (aucun identifiant
 * supplémentaire consommé) ; un Mouvement corrigé garde son groupe de niveaux.
 */
async function writeSessionMovements(
  transaction: Database,
  movements: readonly SessionMovementInput[],
  timestamp: string,
  uuidFactory: UuidFactory,
): Promise<void> {
  if (movements.length === 0) {
    return;
  }
  const inheritedBodyZoneIds = await getInheritableBodyZoneIds(transaction);
  const edited = await readMovementRecords(
    transaction,
    movements.filter((movement) => movement.change === "EDITED").map((movement) => movement.id),
  );
  // PRE-7 (R-5, C01) : corrections (`EDITED`) avant créations (`NEW`) — un renommage A → B libère A
  // avant qu'une création nommée A ne l'occupe, quel que soit l'ordre des occurrences.
  const ordered = [
    ...movements.filter((movement) => movement.change === "EDITED"),
    ...movements.filter((movement) => movement.change !== "EDITED"),
  ];
  for (const movement of ordered) {
    const mediaId = (position: number) => `${movement.id}:${position}:${timestamp}`;
    const content = {
      id: movement.id,
      name: movement.name,
      description: movement.description,
      media: movement.media,
      categoryId: movement.categoryId,
      bodyZoneIds: movement.bodyZoneIds,
      phases: movement.phases,
      nextPhaseId: movement.nextPhaseId,
      aliases: movement.aliases,
    };
    if (movement.change === "NEW") {
      await assertOccurrenceCategoryAssignable(transaction, movement.categoryId, null, true);
      await assertBodyZonesAssignable(transaction, movement.bodyZoneIds, new Set(), inheritedBodyZoneIds);
      await insertMovement(transaction, { ...content, levelGroup: null }, timestamp, mediaId);
      if (movement.levelOrigin !== undefined) {
        // PRE-7 (R-5, D-445 C02, MFN-07 l.371) : variante choisie en Séance — insérée avant (Plus
        // facile) ou après (Plus difficile) son origine, groupe créé au besoin. Un refus (origine
        // supprimée entre-temps) annule toute la Séance.
        const joined = await joinMovementGroup(
          transaction,
          movement.id,
          movement.levelOrigin.movementId,
          movement.levelOrigin.placement,
          uuidFactory,
          timestamp,
        );
        if (joined.status !== "OK") {
          throw new Error(`The variant could not join the origin level group (${joined.status}).`);
        }
      }
      continue;
    }
    const current = edited.get(movement.id);
    if (!current) {
      throw new MovementNotFoundError(movement.id);
    }
    await assertOccurrenceCategoryAssignable(transaction, movement.categoryId, current.movement.categoryId);
    await assertBodyZonesAssignable(transaction, movement.bodyZoneIds, new Set(current.movement.bodyZoneIds));
    await updateMovementContent(transaction, { ...content, levelGroup: current.movement.levelGroup }, timestamp, mediaId);
  }
}

/**
 * PRE-7 (R-3, C05) : le Mouvement référencé par une occurrence d'Exercice doit
 * exister (clé étrangère RESTRICT) ; un identifiant inconnu lève
 * `MovementNotFoundError`, la Séance entière est annulée.
 */
async function assertOccurrenceMovement(transaction: Database, type: ActivityType, movementId: string | undefined): Promise<string> {
  const id = movementId ?? "";
  const row = id.length > 0 ? await transaction.getFirstAsync<{ id: string }>("SELECT id FROM movements WHERE id = ?", [id]) : null;
  if (!row) {
    if (type === "RECOVERY") {
      throw new Error("A standalone recovery has no movement and cannot be written (D-041).");
    }
    throw new MovementNotFoundError(id);
  }
  return row.id;
}

// ---------------------------------------------------------------------------
// Ancien modèle → structure écrite
// ---------------------------------------------------------------------------

/**
 * PRE-8 (A.4) : entrée de l'ancien modèle (zones, dans l'ordre reçu de chaque zone) → structure
 * `[avant…, Circuit, après…]`. L'identifiant d'un Exercice est conservé lorsqu'il est fourni,
 * généré sinon (dans l'ordre de l'entrée, comme auparavant).
 */
function structureInputFromLegacy(
  activities: readonly (CreateSessionActivityInput | UpdateSessionActivityInput)[],
  stopPoints: readonly CreateStopPointInput[],
  circuit: { readonly id: string; readonly repeatCount: number; readonly nature: CircuitNature },
  uuidFactory: UuidFactory,
): StructureInput {
  const zones: Record<StructuralPosition, StructureExerciseInput[]> = { BEFORE_TOUR: [], IN_TOUR: [], AFTER_TOUR: [] };
  for (const activity of activities) {
    const { structuralPosition, ...rest } = activity;
    const { position: _position, ...exercise } = rest as typeof rest & { position?: number };
    zones[structuralPosition].push({ ...exercise, id: activity.id ?? uuidFactory() });
  }
  return structureFromLegacy(
    { beforeTour: zones.BEFORE_TOUR, tour: { ...circuit, exercises: zones.IN_TOUR }, afterTour: zones.AFTER_TOUR },
    stopPoints,
  );
}

// ---------------------------------------------------------------------------
// Écriture de la structure
// ---------------------------------------------------------------------------

type ExistingStructureIds = {
  readonly cycles: ReadonlySet<string>;
  readonly circuits: ReadonlySet<string>;
  readonly activities: ReadonlySet<string>;
};

/** Début de la plage des rangs de transit, hors de toute position réelle. */
const STAGING_POSITION = 1_000_000;

/**
 * PRE-8 (A.4) : écrit la structure validée d'une Séance, à la création (`existing = null`) ou
 * par fusion PAR IDENTITÉ à la modification :
 *
 * 1. les Exercices et Circuits conservés passent d'abord au niveau principal, à des rangs de
 *    transit, pour ne jamais violer l'unicité d'un rang dans un conteneur pendant une
 *    réorganisation ;
 * 2. les Exercices, Points d'arrêt, Circuits puis Cycles retirés sont supprimés (aucun
 *    Exercice conservé n'est plus rattaché à un conteneur supprimé : aucune cascade implicite) ;
 * 3. Cycles, Circuits puis Exercices sont écrits à leur rang final, dans l'ordre de la
 *    structure : un élément conservé est mis à jour en place (identité, `created_at` et
 *    référence au Mouvement inchangés), un nouvel élément est inséré ;
 * 4. les Points d'arrêt reçus sont insérés.
 *
 * Rang au niveau principal : index de l'élément ; dans un Cycle : index du Circuit ; dans un
 * Circuit : index de l'Exercice. PRE-7 (R-3, C05) : aucune donnée de contenu n'est écrite dans
 * l'Exercice.
 */
async function writeStructure(
  transaction: Database,
  sessionId: string,
  structure: StructureInput,
  existing: ExistingStructureIds | null,
  timestamp: string,
  uuidFactory: UuidFactory,
): Promise<void> {
  const incomingCycles = new Set<string>();
  const incomingCircuits = new Set<string>();
  for (const element of structure.elements) {
    if (element.kind === "CYCLE") {
      incomingCycles.add(element.cycle.id);
    }
  }
  for (const circuit of structureCircuits(structure)) {
    incomingCircuits.add(circuit.id);
  }
  const incomingActivities = new Set(structureExercises(structure).map((exercise) => exercise.id));

  if (existing !== null) {
    let staging = STAGING_POSITION;
    for (const id of existing.activities) {
      if (incomingActivities.has(id)) {
        await transaction.runAsync("UPDATE activities SET tour_id = NULL, position = ? WHERE id = ? AND session_id = ?", [
          staging++,
          id,
          sessionId,
        ]);
      } else {
        await transaction.runAsync("DELETE FROM activities WHERE id = ? AND session_id = ?", [id, sessionId]);
      }
    }
    // Les Points d'arrêt n'exposent aucune identité à l'appelant : remplacés intégralement par
    // ceux du brouillon (V2-PRE-1, PRE-6 story 1.2).
    await transaction.runAsync("DELETE FROM session_stop_points WHERE session_id = ?", [sessionId]);
    for (const id of existing.circuits) {
      if (incomingCircuits.has(id)) {
        await transaction.runAsync("UPDATE tours SET cycle_id = NULL, position = ? WHERE id = ? AND session_id = ?", [
          staging++,
          id,
          sessionId,
        ]);
      } else {
        await transaction.runAsync("DELETE FROM tours WHERE id = ? AND session_id = ?", [id, sessionId]);
      }
    }
    for (const id of existing.cycles) {
      if (!incomingCycles.has(id)) {
        await transaction.runAsync("DELETE FROM cycles WHERE id = ? AND session_id = ?", [id, sessionId]);
      }
    }
  }

  const writeCircuit = async (circuit: StructureCircuitInput, cycleId: string | null, position: number) => {
    if (existing?.circuits.has(circuit.id)) {
      await transaction.runAsync(
        "UPDATE tours SET cycle_id = ?, position = ?, repeat_count = ?, nature = ? WHERE id = ? AND session_id = ?",
        [cycleId, position, circuit.repeatCount, circuit.nature, circuit.id, sessionId],
      );
    } else {
      // V2-PRE-1 : le Circuit n'a plus de direction propre — toujours `'UNILATERAL'` en base.
      await transaction.runAsync(
        `INSERT INTO tours (id, session_id, cycle_id, position, repeat_count, side_mode, nature)
         VALUES (?, ?, ?, ?, ?, 'UNILATERAL', ?)`,
        [circuit.id, sessionId, cycleId, position, circuit.repeatCount, circuit.nature],
      );
    }
    for (const [index, exercise] of circuit.exercises.entries()) {
      await writeActivity(transaction, sessionId, exercise, circuit.id, index, existing, timestamp);
    }
  };

  for (const [position, element] of structure.elements.entries()) {
    switch (element.kind) {
      case "EXERCISE":
        await writeActivity(transaction, sessionId, element.exercise, null, position, existing, timestamp);
        break;
      case "CIRCUIT":
        await writeCircuit(element.circuit, null, position);
        break;
      case "CYCLE":
        if (existing?.cycles.has(element.cycle.id)) {
          await transaction.runAsync("UPDATE cycles SET position = ?, repeat_count = ? WHERE id = ? AND session_id = ?", [
            position,
            element.cycle.repeatCount,
            element.cycle.id,
            sessionId,
          ]);
        } else {
          await transaction.runAsync("INSERT INTO cycles (id, session_id, position, repeat_count) VALUES (?, ?, ?, ?)", [
            element.cycle.id,
            sessionId,
            position,
            element.cycle.repeatCount,
          ]);
        }
        for (const [index, circuit] of element.cycle.circuits.entries()) {
          await writeCircuit(circuit, element.cycle.id, index);
        }
        break;
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  }

  // PRE-6 (story 1.2, AD-36) : emplacement reçu, déjà validé, enregistré tel quel.
  for (const point of structure.stopPoints) {
    await transaction.runAsync("INSERT INTO session_stop_points (id, session_id, tour_id, position) VALUES (?, ?, ?, ?)", [
      uuidFactory(),
      sessionId,
      point.circuitId,
      point.position,
    ]);
  }
}

type StructureCircuitInput = StructureCircuit<StructureExerciseInput>;

/** Un Exercice à son rang final : mise à jour en place s'il existe, insertion sinon. */
async function writeActivity(
  transaction: Database,
  sessionId: string,
  exercise: StructureExerciseInput,
  tourId: string | null,
  position: number,
  existing: ExistingStructureIds | null,
  timestamp: string,
): Promise<void> {
  const values = toActivitySqlValues(exercise);
  if (existing?.activities.has(exercise.id)) {
    // PRE-4 : un Exercice existant reçoit ses paramètres (forme Catalogue v5, R-3) et la
    // projection scalaire unique (AD-3) ; sa référence au Mouvement est conservée.
    await transaction.runAsync(
      `UPDATE activities SET
         type = ?, tour_id = ?, position = ?,
         execution_mode = ?, duration_seconds = ?, repetition_count = ?,
         series_count = ?, pause_seconds = ?, post_activity_recovery_seconds = ?,
         post_activity_recovery_present = ?, updated_at = ?, side_mode = ?,
         execution_parameters = ?, copy_number = ?
       WHERE id = ? AND session_id = ?`,
      [
        exercise.type,
        tourId,
        position,
        values.executionMode,
        values.durationSeconds,
        values.repetitionCount,
        values.seriesCount,
        values.pauseSeconds,
        values.postActivityRecoverySeconds,
        values.postActivityRecoveryPresent,
        timestamp,
        values.sideMode,
        values.executionParameters,
        exercise.copyNumber ?? null,
        exercise.id,
        sessionId,
      ],
    );
    return;
  }
  const movementId = await assertOccurrenceMovement(transaction, exercise.type, exercise.sourceMovementId);
  await transaction.runAsync(
    `INSERT INTO activities (${ACTIVITY_ROW_COLUMNS})
     VALUES (${ACTIVITY_ROW_PLACEHOLDERS})`,
    [
      exercise.id,
      sessionId,
      tourId,
      exercise.type,
      position,
      values.executionMode,
      values.durationSeconds,
      values.repetitionCount,
      values.seriesCount,
      values.pauseSeconds,
      values.postActivityRecoverySeconds,
      values.postActivityRecoveryPresent,
      timestamp,
      timestamp,
      values.sideMode,
      values.executionParameters,
      movementId,
      exercise.copyNumber ?? null,
    ],
  );
}

const ACTIVITY_ROW_COLUMNS = `
  id, session_id, tour_id, type,
  position, execution_mode, duration_seconds,
  repetition_count, series_count, pause_seconds, post_activity_recovery_seconds,
  post_activity_recovery_present,
  created_at, updated_at, side_mode, execution_parameters,
  source_movement_id, copy_number
`;

/**
 * Liste de paramètres liés DÉRIVÉE de `ACTIVITY_ROW_COLUMNS` — jamais une
 * suite de `?` recopiée à la main.
 */
const ACTIVITY_ROW_PLACEHOLDERS = ACTIVITY_ROW_COLUMNS.split(",")
  .map(() => "?")
  .join(", ");

/** Valeurs SQL d'une Activité (colonnes du CHECK composite d'`activities` et JSON). */
type ActivitySqlValues = {
  readonly executionMode: ActivityRow["execution_mode"];
  readonly durationSeconds: number | null;
  readonly repetitionCount: number | null;
  readonly seriesCount: number | null;
  readonly pauseSeconds: number;
  /** PRE-6 (AD-35) : `value ?? 0` — 0 quand la récupération est absente. */
  readonly postActivityRecoverySeconds: number;
  /** PRE-6 (AD-35) : `value === null ? 0 : 1`. */
  readonly postActivityRecoveryPresent: 0 | 1;
  readonly sideMode: SideMode;
  readonly executionParameters: string | null;
};

/**
 * Ancienne Récupération autonome (D-041, convertie par `migration004`, plus
 * jamais produite) : lue défensivement comme une seule Série chronométrée de
 * sa durée, sans Pause — sa colonne `duration_seconds` est sa seule donnée.
 */
function recoveryExecutionParameters(durationSeconds: number | null): ExecutionParameters {
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: "DURATION",
    series: {
      kind: "UNIFORM",
      count: 1,
      target: durationSeconds !== null && durationSeconds >= 1 ? numberTarget(durationSeconds) : unsetTarget(),
      pauseSeconds: 0,
      // PRE-5 (AD-19, AD-20) : sans charge, aucune phase.
      loadKg: 0,
      workPhases: [],
    },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
    loadEnabled: false,
  };
}

/**
 * Valeurs SQL d'une Activité, à la création comme à la modification
 * (T01-S10 ; T02-S01 : partagée avec `insertActivities`).
 *
 * PRE-4 (story 1.1, AD-3) : les paramètres ont déjà été validés au niveau
 * structurel par `validateCreateSessionInput`/`validateUpdateSessionInput` ;
 * les colonnes historiques reçoivent la projection scalaire UNIQUE
 * (`projectScalars`) et `execution_parameters` la forme Catalogue v5 (PRE-7, R-3 :
 * durées de phase par `phaseId`, sans libellé ; la structure est celle du Mouvement). Les colonnes du
 * CHECK composite sont contrôlées AVANT l'écriture (`assertActivityColumns`,
 * miroir du CHECK de `migration010`) : une Copie dont la projection violerait
 * le CHECK est refusée sans écriture (AC5).
 *
 * Une ancienne Récupération autonome (défense en profondeur, jamais produite
 * par le Domaine — D-041) garde `execution_mode = 'DURATION'`, sans Séries,
 * pause, Récupération attachée, ni JSON, et n'est jamais côtée.
 */
function toActivitySqlValues(activity: {
  readonly type: ActivityType;
  readonly executionParameters: CreateSessionActivityInput["executionParameters"];
  readonly postActivityRecoverySeconds: number | null;
}): ActivitySqlValues {
  const parameters = activity.executionParameters as ExecutionParameters;
  let values: ActivitySqlValues;
  if (activity.type === "RECOVERY") {
    const first = parameters.series.kind === "UNIFORM" ? parameters.series.target : parameters.series.rows[0]!.target;
    values = {
      executionMode: "DURATION",
      durationSeconds: first.kind === "NUMBER" ? first.value : null,
      repetitionCount: null,
      seriesCount: null,
      pauseSeconds: 0,
      postActivityRecoverySeconds: 0,
      postActivityRecoveryPresent: 0,
      sideMode: "UNILATERAL",
      executionParameters: null,
    };
  } else {
    const projection = projectScalars(parameters);
    values = {
      executionMode: projection.executionMode,
      durationSeconds: projection.durationSeconds,
      repetitionCount: projection.repetitionCount,
      seriesCount: projection.seriesCount,
      pauseSeconds: projection.pauseSeconds,
      // PRE-6 (story 1.1, AD-35) : absente → secondes 0, présence 0.
      postActivityRecoverySeconds: activity.postActivityRecoverySeconds ?? 0,
      postActivityRecoveryPresent: activity.postActivityRecoverySeconds === null ? 0 : 1,
      sideMode: projection.sideMode,
      executionParameters: serializeCatalogExecutionParameters(splitResolvedParameters(parameters).parameters),
    };
  }
  assertActivityColumns({
    activity_type: activity.type,
    execution_mode: values.executionMode,
    duration_seconds: values.durationSeconds,
    repetition_count: values.repetitionCount,
    series_count: values.seriesCount,
    pause_seconds: values.pauseSeconds,
    post_activity_recovery_seconds: values.postActivityRecoverySeconds,
  });
  return values;
}

// ---------------------------------------------------------------------------
// Lecture de la structure
// ---------------------------------------------------------------------------

/**
 * En-tête de Séance. V2-PRE-1 (plan §3.3) : la couleur est DÉRIVÉE de l'Étiquette jointe
 * (`label_color`, `NULL` sans Étiquette).
 */
const HEADER_SELECT = `
SELECT
  sessions.id AS session_id,
  sessions.owner_id,
  sessions.name AS session_name,
  sessions.label_id AS label_id,
  labels.color AS label_color,
  sessions.status,
  sessions.archived_at,
  sessions.initial_countdown_seconds,
  sessions.final_phase_seconds,
  sessions.created_at AS session_created_at,
  sessions.updated_at AS session_updated_at
FROM sessions
LEFT JOIN labels ON labels.id = sessions.label_id`;

/**
 * PRE-8 (E.1) : `allowArchived` — lecture du Catalogue unifié, où une Séance archivée reste
 * consultable. Les lectures d'édition gardent la garde « Séance active » (défense en profondeur).
 */
export type AssembleOptions = { readonly allowArchived?: boolean };

/** Lignes persistées d'une Séance, une requête par table pour toutes les Séances lues. */
export type StoredSession = {
  readonly header: SessionHeaderRow;
  readonly cycles: readonly CycleRow[];
  readonly circuits: readonly CircuitRow[];
  readonly activities: readonly ActivityRow[];
  readonly stopPoints: readonly StopPointRow[];
};

type AssembledSession = {
  readonly stored: StoredSession;
  readonly structure: SessionStructure<Activity>;
};

async function readAssembledSession(database: Database, sessionId: string, ownerId: string): Promise<AssembledSession | null> {
  const header = await database.getFirstAsync<SessionHeaderRow>(`${HEADER_SELECT} WHERE sessions.id = ? AND sessions.owner_id = ?`, [
    sessionId,
    ownerId,
  ]);
  return header ? (await readAssembledSessions(database, [header]))[0]! : null;
}

/**
 * Relit et assemble les Séances des en-têtes donnés, dans leur ordre. PRE-7 (R-3, C05) : le
 * contenu courant des Mouvements référencés est lu en une requête par table
 * (`readMovementRecords`).
 */
async function readAssembledSessions(
  database: Database,
  headers: readonly SessionHeaderRow[],
  options: AssembleOptions = {},
): Promise<AssembledSession[]> {
  if (headers.length === 0) {
    return [];
  }
  // Identifiants relus depuis SQLite, jamais une saisie utilisateur : liste de paramètres sûre.
  const ids = headers.map((header) => header.session_id);
  const placeholders = ids.map(() => "?").join(", ");
  const cycles = await database.getAllAsync<CycleRow>(
    `SELECT id, session_id, position, repeat_count FROM cycles WHERE session_id IN (${placeholders})`,
    ids,
  );
  const circuits = await database.getAllAsync<CircuitRow>(
    `SELECT id, session_id, cycle_id, position, repeat_count, side_mode, nature FROM tours WHERE session_id IN (${placeholders})`,
    ids,
  );
  const activities = await database.getAllAsync<ActivityRow>(
    `SELECT ${ACTIVITY_ROW_COLUMNS} FROM activities WHERE session_id IN (${placeholders})`,
    ids,
  );
  const stopPoints = await database.getAllAsync<StopPointRow>(
    `SELECT id, session_id, tour_id, position FROM session_stop_points WHERE session_id IN (${placeholders})`,
    ids,
  );
  const movements = await readMovementRecords(
    database,
    activities.map((row) => row.source_movement_id),
  );
  const bySession = <T extends { readonly session_id: string }>(rows: readonly T[]) => {
    const grouped = new Map<string, T[]>();
    for (const row of rows) {
      grouped.set(row.session_id, [...(grouped.get(row.session_id) ?? []), row]);
    }
    return grouped;
  };
  const cyclesBySession = bySession(cycles);
  const circuitsBySession = bySession(circuits);
  const activitiesBySession = bySession(activities);
  const stopPointsBySession = bySession(stopPoints);
  return headers.map((header) => {
    const stored: StoredSession = {
      header,
      cycles: cyclesBySession.get(header.session_id) ?? [],
      circuits: circuitsBySession.get(header.session_id) ?? [],
      activities: activitiesBySession.get(header.session_id) ?? [],
      stopPoints: stopPointsBySession.get(header.session_id) ?? [],
    };
    return { stored, structure: assembleStructure(stored, movements, options) };
  });
}

/**
 * Rangs d'un conteneur, dans l'ordre. Un rang en double viole le contrat ; un trou (lignes
 * retirées hors repository, cas P39 de PRE-4) est toléré comme auparavant : l'ordre relatif est
 * conservé et les rangs relus sont ceux de cet ordre.
 */
function inRankOrder<T extends { readonly position: number }>(rows: readonly T[]): T[] {
  const ordered = [...rows].sort((a, b) => a.position - b.position);
  ordered.forEach((row, index) => {
    if (index > 0 && ordered[index - 1]!.position === row.position) {
      throw contractError();
    }
  });
  return ordered;
}

/**
 * PRE-8 (A.4) : assemble la structure persistée d'une Séance et contrôle son contrat (défense
 * en profondeur, reflet des CHECK de `migration014`) : Séance active ; Circuit de compte
 * 1..99, direction et nature connues ; Cycle d'au moins un Circuit ; rangs contigus dans chaque
 * conteneur, y compris le niveau principal partagé par Exercices, Circuits et Cycles ;
 * colonnes de chaque Exercice conformes au CHECK composite ; Points d'arrêt dans un conteneur
 * connu.
 *
 * Champs hérités de l'Exercice : `structuralPosition` et `position` sont ceux de l'ancien
 * modèle lorsque la structure y est représentable (avant, dans, après le Circuit ; rang dans la
 * zone) ; sinon `BEFORE_TOUR` au niveau principal et `IN_TOUR` dans un Circuit, avec le rang
 * dans le conteneur.
 */
export function assembleStructure(
  stored: StoredSession,
  movements: ReadonlyMap<string, MovementRecord>,
  options: AssembleOptions = {},
): SessionStructure<Activity> {
  if (stored.header.status !== "ACTIVE" && !(options.allowArchived === true && stored.header.status === "ARCHIVED")) {
    throw contractError();
  }
  for (const circuit of stored.circuits) {
    if (
      !Number.isInteger(circuit.repeat_count) ||
      circuit.repeat_count < CIRCUIT_REPEAT_COUNT_MIN ||
      circuit.repeat_count > CIRCUIT_REPEAT_COUNT_MAX ||
      // V2-BILAT-01 : reflète le `CHECK` de `migration005` sur `tours.side_mode`.
      !SIDE_MODES.includes(circuit.side_mode) ||
      // PRE-6 (AD-34) : une nature inconnue n'est jamais lue comme `TOURS`.
      !isCircuitNature(circuit.nature)
    ) {
      throw contractError();
    }
  }
  for (const cycle of stored.cycles) {
    if (!Number.isInteger(cycle.repeat_count) || cycle.repeat_count < CYCLE_REPEAT_COUNT_MIN) {
      throw contractError();
    }
  }

  const activitiesByContainer = new Map<string | null, ActivityRow[]>();
  for (const row of stored.activities) {
    assertActivityRow(row);
    activitiesByContainer.set(row.tour_id, [...(activitiesByContainer.get(row.tour_id) ?? []), row]);
  }
  const circuitsByCycle = new Map<string | null, CircuitRow[]>();
  for (const row of stored.circuits) {
    circuitsByCycle.set(row.cycle_id, [...(circuitsByCycle.get(row.cycle_id) ?? []), row]);
  }
  const knownCircuits = new Set(stored.circuits.map((row) => row.id));
  const knownCycles = new Set(stored.cycles.map((row) => row.id));
  if (
    stored.activities.some((row) => row.tour_id !== null && !knownCircuits.has(row.tour_id)) ||
    stored.circuits.some((row) => row.cycle_id !== null && !knownCycles.has(row.cycle_id))
  ) {
    throw contractError();
  }

  const circuitOf = (row: CircuitRow): StructureCircuit<Activity> => ({
    id: row.id,
    repeatCount: row.repeat_count,
    nature: row.nature,
    exercises: inRankOrder(activitiesByContainer.get(row.id) ?? []).map((activity, rank) =>
      toActivity(activity, movements, "IN_TOUR", rank),
    ),
  });

  type Ranked = { readonly position: number; readonly element: StructureElement<Activity> };
  const main: Ranked[] = [
    ...(activitiesByContainer.get(null) ?? []).map((row) => ({
      position: row.position,
      element: { kind: "EXERCISE" as const, exercise: toActivity(row, movements, "BEFORE_TOUR", row.position) },
    })),
    ...(circuitsByCycle.get(null) ?? []).map((row) => ({
      position: row.position,
      element: { kind: "CIRCUIT" as const, circuit: circuitOf(row) },
    })),
    ...stored.cycles.map((row) => {
      const circuits = inRankOrder(circuitsByCycle.get(row.id) ?? []).map(circuitOf);
      if (circuits.length === 0) {
        throw contractError();
      }
      return { position: row.position, element: { kind: "CYCLE" as const, cycle: { id: row.id, repeatCount: row.repeat_count, circuits } } };
    }),
  ];
  // Rang relu d'un Exercice du niveau principal : son index (voir `inRankOrder`).
  const elements = inRankOrder(main).map((ranked, index): StructureElement<Activity> =>
    ranked.element.kind === "EXERCISE" ? { kind: "EXERCISE", exercise: { ...ranked.element.exercise, position: index } } : ranked.element,
  );

  for (const point of stored.stopPoints) {
    if (point.tour_id !== null && !knownCircuits.has(point.tour_id)) {
      throw contractError();
    }
  }
  const circuitOrder = new Map(structureCircuits({ elements }).map((circuit, index) => [circuit.id, index]));
  const stopPoints: StructureStopPoint[] = [...stored.stopPoints]
    .sort(
      (a, b) =>
        (a.tour_id === null ? -1 : circuitOrder.get(a.tour_id)!) - (b.tour_id === null ? -1 : circuitOrder.get(b.tour_id)!) ||
        a.position - b.position,
    )
    .map((point) => ({ id: point.id, circuitId: point.tour_id, position: point.position }));

  return withLegacyZones({ elements, stopPoints });
}

/**
 * Structure représentable dans l'ancien modèle : les Exercices après le Circuit reprennent la
 * zone `AFTER_TOUR` et leur rang dans cette zone (champs hérités lus par l'interface actuelle).
 */
function withLegacyZones(structure: SessionStructure<Activity>): SessionStructure<Activity> {
  const circuitIndex = structure.elements.findIndex((element) => element.kind === "CIRCUIT");
  if (legacyFromStructure({ elements: structure.elements, stopPoints: [] }) === null) {
    return structure;
  }
  return {
    ...structure,
    elements: structure.elements.map((element, index) =>
      element.kind === "EXERCISE" && index > circuitIndex
        ? { kind: "EXERCISE", exercise: { ...element.exercise, structuralPosition: "AFTER_TOUR", position: index - circuitIndex - 1 } }
        : element,
    ),
  };
}

const STRUCTURAL_ORDER: readonly StructuralPosition[] = ["BEFORE_TOUR", "IN_TOUR", "AFTER_TOUR"];

/** Champs de Séance communs aux deux lectures. */
function sessionBase(header: SessionHeaderRow) {
  return {
    id: header.session_id,
    ownerId: header.owner_id,
    name: header.session_name,
    // V2-PRE-1 (plan §3.3) : couleur DÉRIVÉE de l'Étiquette jointe — présentation neutre sans Étiquette.
    color: (header.label_color as SessionColor | null) ?? DEFAULT_SESSION_COLOR,
    labelId: header.label_id,
    status: "ACTIVE" as const,
    initialCountdownSeconds: header.initial_countdown_seconds,
    finalPhaseSeconds: header.final_phase_seconds,
    createdAt: header.session_created_at,
    updatedAt: header.session_updated_at,
  };
}

function toStructuredSession(assembled: AssembledSession): StructuredSession {
  return { ...sessionBase(assembled.stored.header), structure: assembled.structure };
}

/**
 * Projection dans l'ancien modèle (interface actuelle) : zones avant, dans et après le Circuit,
 * Points d'arrêt par portée (ordre D-061 puis position). Le Cycle technique n'est plus persisté
 * (`migration014`) : son identifiant est celui de la Séance. Une structure plus riche lève
 * `SessionStructureNotRepresentableError`.
 */
export function toLegacySession(assembled: AssembledSession): Session {
  const header = assembled.stored.header;
  const legacy = legacyFromStructure(assembled.structure);
  if (legacy === null) {
    throw new SessionStructureNotRepresentableError(header.session_id);
  }
  const { beforeTour, tour, afterTour } = legacy.composition;
  const stopPoints: StopPoint[] = [...legacy.stopPoints]
    .sort((a, b) => STRUCTURAL_ORDER.indexOf(a.scope) - STRUCTURAL_ORDER.indexOf(b.scope) || a.position - b.position)
    .map((point) => ({ id: point.id, scope: point.scope, position: point.position }));
  return {
    ...sessionBase(header),
    // V2-PRE-1 : absent plutôt que `[]` quand la Séance ne porte aucun Point d'arrêt.
    ...(stopPoints.length > 0 ? { stopPoints } : {}),
    structure: assembled.structure,
    cycle: {
      id: header.session_id,
      position: 1,
      repeatCount: 1,
      // Champs optionnels (T01-S10) : absents quand la zone est vide.
      ...(beforeTour.length > 0 ? { beforeTour } : {}),
      ...(afterTour.length > 0 ? { afterTour } : {}),
      tour: {
        id: tour.id,
        position: 1,
        repeatCount: tour.repeatCount,
        nature: tour.nature,
        exercises: tour.exercises,
      },
    },
  };
}

function toSummary(assembled: AssembledSession, bodyZoneNames: readonly string[]): SessionSummary {
  const header = assembled.stored.header;
  const duration = computeStructureDuration(assembled.structure);
  const legacy = legacyFromStructure({ elements: assembled.structure.elements, stopPoints: [] });
  return {
    id: header.session_id,
    name: header.session_name,
    color: (header.label_color as SessionColor | null) ?? DEFAULT_SESSION_COLOR,
    labelId: header.label_id,
    // T02-S01, D-449 §6 : Exercices RÉELLEMENT COMPOSÉS, chacun une seule fois.
    activityCount: countStructureExercises(assembled.structure),
    estimatedDurationSeconds: duration.seconds,
    // `isEstimatedDurationApproximate` reste le drapeau historique « ≥ » ;
    // `durationKind` porte la nature complète (exact / ≈ / ≥).
    isEstimatedDurationApproximate: duration.kind === "lowerBound",
    durationKind: duration.kind,
    // Compte du Circuit unique de l'ancien modèle ; 1 pour une structure plus riche, dont la
    // présentation relève du Catalogue unique (Epic E).
    tourRepeatCount: legacy?.composition.tour.repeatCount ?? 1,
    updatedAt: header.session_updated_at,
    categoryNames: [],
    bodyZoneNames,
  };
}

/**
 * Noms des Zones corporelles couvertes par chacune des Séances données
 * (T01-S09, correction VISUAL tentative 2, point B) — union SANS PERTE de
 * `bodyZoneIds` de TOUTES les Activités persistées de chaque Séance (jamais
 * une seule Activité), dédupliquée puis ordonnée selon le référentiel
 * (`BODY_ZONES`, `order` croissant) — jamais l'ordre d'insertion en base.
 * PRE-7 (R-3, C05) : Zones lues dans le Mouvement de chaque occurrence.
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
    `SELECT DISTINCT activities.session_id AS session_id, movement_body_zones.body_zone_id AS body_zone_id
     FROM activities
     JOIN movement_body_zones ON movement_body_zones.movement_id = activities.source_movement_id
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

/**
 * PRE-4 (story 1.1, AD-3) : paramètres d'une ligne d'occurrence. PRE-7 (R-3,
 * D-445 C05) : forme Catalogue v5 (`readCatalogExecutionParameters`, strict :
 * NULL, JSON corrompu ou autre version → `ExecutionParametersDataError`),
 * résolue avec la structure COURANTE des phases du Mouvement
 * (`resolveCatalogParameters` : une phase sans durée reste manquante, jamais
 * inventée). Une ancienne Récupération autonome est lue défensivement depuis sa
 * durée.
 */
function rowExecutionParameters(
  type: ActivityType,
  json: string | null,
  durationSeconds: number | null,
  movement: MovementRecord | undefined,
): ExecutionParameters {
  if (type === "RECOVERY") {
    return recoveryExecutionParameters(durationSeconds);
  }
  if (!movement) {
    throw contractError();
  }
  return resolveCatalogParameters(movement.movement.phases, readCatalogExecutionParameters(json)).parameters;
}

function toActivity(
  row: ActivityRow,
  movements: ReadonlyMap<string, MovementRecord>,
  structuralPosition: StructuralPosition,
  position: number,
): Activity {
  const isRecovery = row.type === "RECOVERY";
  const record = movements.get(row.source_movement_id);
  const executionParameters = rowExecutionParameters(row.type, row.execution_parameters, row.duration_seconds, record);
  const movement = record?.movement;
  return {
    executionParameters,
    // PRE-7 (R-3, C05) : contenu courant lu dans le Mouvement, jamais dans l'occurrence.
    categoryId: movement?.categoryId ?? null,
    media: isRecovery
      ? []
      : (record?.mediaLinks ?? []).map((link) => ({
          id: link.id,
          activityId: row.id,
          assetId: link.assetId,
          position: link.position,
          asset: link.asset,
        })),
    sourceMovementId: row.source_movement_id,
    copyNumber: row.copy_number,
    id: row.id,
    type: row.type,
    structuralPosition,
    position,
    name: movement?.name ?? "",
    // PRE-6 (story 1.1, AD-35) : `null` quand elle est absente
    // (`post_activity_recovery_present = 0`, `migration011`) ; une ancienne
    // ligne `RECOVERY` n'en porte jamais (`CHECK` SQL).
    postActivityRecoverySeconds:
      !isRecovery && row.post_activity_recovery_present === 1 ? row.post_activity_recovery_seconds : null,
    instruction: movement?.description ?? null,
    bodyZoneIds: isRecovery ? [] : [...(movement?.bodyZoneIds ?? [])],
    // V2-BILAT-01 : direction relue des paramètres (AD-3) ; une Récupération
    // n'est jamais elle-même côtée (D-041).
    sideMode: executionParameters.sideMode,
  };
}

/** Colonnes du CHECK composite d'`activities` (type, Mode et scalaires projetés). */
export type ActivityCheckColumns = {
  readonly activity_type: string;
  readonly execution_mode: string;
  readonly duration_seconds: number | null;
  readonly repetition_count: number | null;
  readonly series_count: number | null;
  readonly pause_seconds: number;
  readonly post_activity_recovery_seconds: number;
};

function between(value: number | null, min: number, max: number): boolean {
  return value !== null && value >= min && value <= max;
}

/**
 * Miroir exact du CHECK composite d'`activities` posé par `migration010`
 * (PRE-4, story 1.1, AD-4) et repris à l'identique par `migration013` et `migration014` :
 * bornes de `migration004` (Durée 1..5999, Répétitions ≥ 1, Pauses et Récupération 0..5999,
 * N ≥ 1), deux Modes seulement, cible scalaire NULL admise en Durée et en Répétitions, jamais
 * les deux cibles non nulles ; branche `RECOVERY` inchangée. Sa parité avec le CHECK réel est
 * vérifiée par un test (`node:sqlite`).
 */
export function satisfiesActivityCheck(row: ActivityCheckColumns): boolean {
  const pause = ACTIVITY_STORAGE_BOUNDS.pauseSeconds;
  const recovery = ACTIVITY_STORAGE_BOUNDS.postActivityRecoverySeconds;
  const duration = ACTIVITY_STORAGE_BOUNDS.durationTarget;
  if (row.activity_type === "EXERCISE") {
    if (row.series_count === null || row.series_count < ACTIVITY_STORAGE_BOUNDS.seriesCountMin) {
      return false;
    }
    if (!between(row.pause_seconds, pause.min, pause.max) || !between(row.post_activity_recovery_seconds, recovery.min, recovery.max)) {
      return false;
    }
    if (row.execution_mode === "DURATION") {
      return row.repetition_count === null && (row.duration_seconds === null || between(row.duration_seconds, duration.min, duration.max));
    }
    if (row.execution_mode === "REPETITIONS") {
      return (
        row.duration_seconds === null &&
        (row.repetition_count === null || row.repetition_count >= ACTIVITY_STORAGE_BOUNDS.repetitionTargetMin)
      );
    }
    return false;
  }
  if (row.activity_type === "RECOVERY") {
    return (
      row.execution_mode === "DURATION" &&
      between(row.duration_seconds, duration.min, duration.max) &&
      row.repetition_count === null &&
      row.series_count === null &&
      row.pause_seconds === 0 &&
      row.post_activity_recovery_seconds === 0
    );
  }
  return false;
}

/** Contrôle avant écriture : une Activité dont les colonnes violeraient le CHECK est refusée (AC5, P44). */
function assertActivityColumns(row: ActivityCheckColumns): void {
  if (!satisfiesActivityCheck(row)) {
    throw contractError();
  }
}

/**
 * Défense en profondeur au ré-assemblage : direction connue (`migration005`), présence de la
 * récupération cohérente (`migration011`, AD-35 : absente ⇒ 0 seconde), colonnes conformes au
 * CHECK composite (`satisfiesActivityCheck`).
 */
export function assertActivityRow(row: ActivityRow): void {
  const present = row.post_activity_recovery_present;
  if (
    !SIDE_MODES.includes(row.side_mode) ||
    (present !== 0 && present !== 1) ||
    (present === 0 && row.post_activity_recovery_seconds !== 0)
  ) {
    throw contractError();
  }
  assertActivityColumns({ ...row, activity_type: row.type });
}
