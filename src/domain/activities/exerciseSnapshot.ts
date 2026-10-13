/**
 * PRE-3 — frontière de sérialisation IMMUABLE d'un Exercice (P3-18).
 *
 * Prépare les données dont la future Exécution aura besoin (paramètres
 * canoniques, Récupération de l'occurrence, médias ordonnés et leurs
 * métadonnées immuables) sans introduire de moteur, de chronomètre ni de
 * Repository d'historique. Un instantané est une copie profonde gelée :
 * aucune mutation de la définition, de l'occurrence ou du Profil ne peut
 * l'atteindre. Aucune phrase, aucun segment, aucun total dérivé n'y est
 * stocké — ils se régénèrent depuis les paramètres à l'affichage.
 */

import type { MediaAsset } from "@/domain/media/MediaAsset";

import {
  cloneExecutionParameters,
  parseExecutionParameters,
  serializeExecutionParameters,
  type ExecutionParameters,
} from "./ExecutionParameters";

export const EXERCISE_SNAPSHOT_VERSION = 1 as const;

export type ExerciseSnapshotMedia = {
  readonly position: number;
  readonly asset: MediaAsset;
};

export type ExerciseSnapshot = {
  readonly snapshotVersion: typeof EXERCISE_SNAPSHOT_VERSION;
  readonly name: string;
  readonly categoryId: string | null;
  readonly bodyZoneIds: readonly string[];
  readonly executionParameters: ExecutionParameters;
  /** Récupération explicite de l'occurrence (0 = aucune) — jamais portée par la définition. */
  readonly recoverySeconds: number;
  readonly media: readonly ExerciseSnapshotMedia[];
  /** Durée réellement réalisée, si l'instantané provient d'une exécution — jamais recalculée. */
  readonly actualDurationSeconds: number | null;
};

export type ExerciseSnapshotSource = {
  readonly name: string;
  readonly categoryId: string | null;
  readonly bodyZoneIds: readonly string[];
  readonly executionParameters: ExecutionParameters;
  readonly recoverySeconds: number;
  readonly media: readonly { readonly asset: MediaAsset }[];
  readonly actualDurationSeconds?: number | null;
};

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value as object)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}

/** Copie profonde gelée de la source — les médias gardent leur ordre et le même fichier physique (même `assetId`/URI). */
export function createExerciseSnapshot(source: ExerciseSnapshotSource): ExerciseSnapshot {
  return deepFreeze({
    snapshotVersion: EXERCISE_SNAPSHOT_VERSION,
    name: source.name,
    categoryId: source.categoryId,
    bodyZoneIds: [...source.bodyZoneIds],
    executionParameters: cloneExecutionParameters(source.executionParameters),
    recoverySeconds: source.recoverySeconds,
    media: source.media.map((item, position) => ({ position, asset: { ...item.asset } })),
    actualDurationSeconds: source.actualDurationSeconds ?? null,
  });
}

/** Sérialisation versionnée : paramètres canoniques, aucun champ de phrase/segment/total. */
export function serializeExerciseSnapshot(snapshot: ExerciseSnapshot): string {
  return JSON.stringify({
    snapshotVersion: snapshot.snapshotVersion,
    name: snapshot.name,
    categoryId: snapshot.categoryId,
    bodyZoneIds: snapshot.bodyZoneIds,
    executionParameters: JSON.parse(serializeExecutionParameters(snapshot.executionParameters)),
    recoverySeconds: snapshot.recoverySeconds,
    media: snapshot.media,
    actualDurationSeconds: snapshot.actualDurationSeconds,
  });
}

export class ExerciseSnapshotDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExerciseSnapshotDataError";
  }
}

/**
 * Relecture d'un instantané. Les champs inconnus (par exemple une phrase
 * historique injectée) sont IGNORÉS, jamais réutilisés : la phrase se
 * régénère depuis `executionParameters` sous la grammaire courante.
 */
export function parseExerciseSnapshot(json: string): ExerciseSnapshot {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(json) as Record<string, unknown>;
  } catch {
    throw new ExerciseSnapshotDataError("Exercise snapshot JSON is malformed.");
  }
  if (raw === null || typeof raw !== "object" || raw.snapshotVersion !== EXERCISE_SNAPSHOT_VERSION) {
    throw new ExerciseSnapshotDataError("Unknown exercise snapshot version.");
  }
  const media = Array.isArray(raw.media) ? (raw.media as ExerciseSnapshotMedia[]) : [];
  return deepFreeze({
    snapshotVersion: EXERCISE_SNAPSHOT_VERSION,
    name: String(raw.name),
    categoryId: typeof raw.categoryId === "string" ? raw.categoryId : null,
    bodyZoneIds: Array.isArray(raw.bodyZoneIds) ? (raw.bodyZoneIds as string[]).map(String) : [],
    executionParameters: parseExecutionParameters(JSON.stringify(raw.executionParameters)),
    recoverySeconds: typeof raw.recoverySeconds === "number" ? raw.recoverySeconds : 0,
    media: media.map((item, position) => ({ position, asset: { ...item.asset } })),
    actualDurationSeconds: typeof raw.actualDurationSeconds === "number" ? raw.actualDurationSeconds : null,
  });
}
