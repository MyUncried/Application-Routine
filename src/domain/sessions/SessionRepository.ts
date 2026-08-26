import type { CreateSessionInput, Session, SessionSummary } from "./Session";

export interface SessionRepository {
  create(input: CreateSessionInput): Promise<Session>;
  findById(sessionId: string): Promise<Session | null>;
  listActive(): Promise<readonly SessionSummary[]>;
}
