import type { CreateSessionInput, Session, SessionSummary } from "./Session";

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

export interface SessionRepository {
  create(input: CreateSessionInput): Promise<Session>;
  findById(sessionId: string): Promise<Session | null>;
  listActive(): Promise<readonly SessionSummary[]>;
  update(sessionId: string, input: CreateSessionInput): Promise<UpdateSessionOutcome>;
}
