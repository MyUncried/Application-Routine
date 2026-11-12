/**
 * PRE-10.2 — contrat de persistance d'une Exécution (conception §15.1, §15.2 ; ch09 ; ch12 §12.33).
 *
 * Une transition métier sauvegarde **atomiquement** le nouveau checkpoint et les changements de résultats
 * correspondants. La sauvegarde est conditionnée par la révision attendue : une sauvegarde ancienne ne peut
 * pas écraser une plus récente. Les résultats sont mis à jour par clé logique (idempotence à la
 * réémission). Implémenté par l'infrastructure (`SqliteExecutionRepository`).
 */

import type { EngineState, ResultChange } from "./kernel";
import type { BusinessStatus } from "./results";

export type ExecutionRecord = {
  readonly id: string;
  readonly origin: "SESSION";
  readonly sessionId: string | null;
  /** Instantané de Séance (JSON immuable, D.2) et versions de lecture (§15.4). */
  readonly snapshotJson: string;
  readonly snapshotVersion: number;
  readonly planVersion: number;
  readonly engineVersion: number;
  readonly state: EngineState;
  readonly revision: number;
  readonly businessStatus: BusinessStatus | null;
  readonly startedAt: string;
  readonly endedAt: string | null;
  /** Heure murale de la dernière évaluation sauvegardée (contrôle de continuité, Q6). */
  readonly clockWallMs: number;
};

export type StoredResult = ResultChange;

export type ExecutionSave = {
  readonly executionId: string;
  readonly expectedRevision: number;
  readonly state: EngineState;
  readonly results: readonly ResultChange[];
  readonly businessStatus: BusinessStatus | null;
  readonly endedAt: string | null;
  readonly savedAt: string;
  readonly clockWallMs: number;
};

export class ExecutionRevisionConflictError extends Error {}

export interface ExecutionRepository {
  /** Crée l'Exécution et son premier checkpoint (révision 1). */
  create(record: Omit<ExecutionRecord, "revision" | "businessStatus" | "endedAt">, results: readonly ResultChange[]): Promise<void>;
  /** Sauvegarde atomique checkpoint + résultats ; lève `ExecutionRevisionConflictError` si la révision a changé. */
  save(save: ExecutionSave): Promise<number>;
  findById(executionId: string): Promise<ExecutionRecord | null>;
  /** Exécution non terminée (au plus une, ch09 « Une seule exécution peut être en cours simultanément »). */
  findUnfinished(): Promise<ExecutionRecord | null>;
  listResults(executionId: string): Promise<readonly StoredResult[]>;
}
