import type {
  CreateSessionInput,
  Session,
  SessionSummary,
  UpdateSessionInput,
} from "./Session";

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
  | { readonly status: "ARCHIVED" };

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
