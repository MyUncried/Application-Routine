import type {
  Activity,
  CreateSessionInput,
  Session,
  SessionColor,
  SessionSummary,
  UpdateSessionInput,
} from "./Session";
import type { SessionStructure } from "./structure";
import type { StructuredSessionInput } from "./structuredInput";

/**
 * Résultat métier discriminé d'une tentative de modification : succès avec
 * la Séance mise à jour, Séance introuvable, ou Séance archivée (une
 * Séance archivée ne peut être modifiée — §06). Ce sont trois issues
 * attendues, pas des anomalies : aucune n'est représentée par une
 * exception. Une entrée invalide reste, elle, signalée par une exception
 * (`SessionValidationError`), en défense en profondeur, symétrique de
 * `create`.
 */
export type UpdateSessionOutcome =
  | { readonly status: "UPDATED"; readonly session: Session }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "ARCHIVED" }
  /**
   * PRE-4 story 4.1 (AC13, FR-01-10) : une Activité déjà persistée à
   * l'ouverture (`persistedActivityIds`) a disparu de la Séance entre-temps.
   * Aucune écriture : rien n'est recréé implicitement.
   */
  | { readonly status: "ACTIVITY_NOT_FOUND" };

/** Statut de persistance d'une Séance, indépendamment de son agrégat (T01-S10). */
export type SessionStatus = "ACTIVE" | "ARCHIVED";

export interface SessionRepository {
  create(input: CreateSessionInput): Promise<Session>;
  findById(sessionId: string): Promise<Session | null>;
  /**
   * T01-S10 : statut brut d'une Séance (`null` si inconnue). Permet à la
   * couche service de distinguer `NOT_FOUND` d'`ARCHIVED` à l'ouverture d'un
   * parcours de modification, sans dépendre de `findById` (qui refuse
   * d'assembler une Séance non active — défense en profondeur).
   */
  findSessionStatus(sessionId: string): Promise<SessionStatus | null>;
  listActive(): Promise<readonly SessionSummary[]>;
  /**
   * T01-S10, Q3-A : la modification bout en bout reçoit un `UpdateSessionInput`
   * distinct de `CreateSessionInput` — il porte l'identifiant source, les
   * identifiants et positions structurelles de toutes les Activités et la
   * répétition du Tour. `create()` et `CreateSessionInput` restent
   * inchangés. Les Activités sont fusionnées par identité (jamais de
   * régénération d'identifiant pour une Activité conservée).
   */
  update(sessionId: string, input: UpdateSessionInput): Promise<UpdateSessionOutcome>;
}

/**
 * PRE-8 (A.4, D-449 §4) : Séance lue dans sa structure générale, sans projection dans l'ancien
 * modèle (qui n'existe pas pour une structure à plusieurs Circuits ou à Cycles).
 */
export type StructuredSession = Omit<Session, "cycle" | "stopPoints" | "structure"> & {
  readonly structure: SessionStructure<Activity>;
};

export type UpdateStructuredSessionOutcome =
  | { readonly status: "UPDATED"; readonly session: StructuredSession }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "ARCHIVED" }
  | { readonly status: "ACTIVITY_NOT_FOUND" };

/**
 * PRE-8 (A.4) : port d'écriture et de lecture de la structure générale, distinct de
 * `SessionRepository` (dont l'interface actuelle consomme la projection à Circuit unique). Même
 * transaction, mêmes gardes et mêmes issues que `create` / `update` : identités des Exercices,
 * Circuits et Cycles conservées par fusion, références aux Mouvements intègres. Les Exercices
 * déjà persistés à l'ouverture (`persistedActivityIds`) et disparus depuis ne sont jamais
 * recréés.
 */
export interface StructuredSessionRepository {
  createStructured(input: StructuredSessionInput): Promise<StructuredSession>;
  findStructuredById(sessionId: string): Promise<StructuredSession | null>;
  updateStructured(
    sessionId: string,
    input: StructuredSessionInput & { readonly persistedActivityIds?: readonly string[] },
  ): Promise<UpdateStructuredSessionOutcome>;
}

/**
 * PRE-8 (epic E, story E.1) : Séance lue par le Catalogue unifié des Séances, active ou archivée,
 * avec sa structure générale (D-449 §4). Aucune donnée dérivée n'est stockée : le Catalogue projette
 * cette lecture (`projectSessionForCatalogue`).
 */
export type CatalogueSessionRecord = {
  readonly id: string;
  readonly name: string;
  readonly color: SessionColor;
  readonly labelId: string | null;
  readonly status: SessionStatus;
  readonly archivedAt: string | null;
  readonly updatedAt: string;
  readonly structure: SessionStructure<Activity>;
};

/**
 * PRE-8 (epic E, story E.5) : issue d'une transition de cycle de vie. `NOT_FOUND` : Séance inconnue ;
 * `INVALID_STATE` : la Séance n'est pas dans l'état de départ attendu (déjà archivée, déjà active,
 * suppression d'une Séance active) — rien n'est écrit, une double action ne crée donc rien.
 */
export type SessionLifecycleOutcome =
  | { readonly status: "DONE" }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "INVALID_STATE" };

/** PRE-8 (epic E) : lecture du Catalogue unifié et cycle de vie d'une Séance, sans migration. */
export interface SessionCatalogueRepository {
  /** Séances actives et archivées, les plus récemment modifiées d'abord. */
  listCatalogue(): Promise<readonly CatalogueSessionRecord[]>;
}

export function isSessionCatalogueRepository(repository: unknown): repository is SessionCatalogueRepository {
  return typeof (repository as Partial<SessionCatalogueRepository> | null)?.listCatalogue === "function";
}
