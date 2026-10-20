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
 *
 * PRE-4 (story 1.1, AD-3) : paramètres typés. Une enveloppe v1 existante est
 * relue par `readV1`, selon sa version, sans réécriture.
 *
 * PRE-5 (story 1.1, AD-18, FR-41) : un nouvel Instantané est en version 3
 * (`serializeExecutionParameters`, phases et charge comprises) ; les
 * enveloppes 2 et 3 sont relues par `readExecutionParameters`. L'Instantané
 * ne porte pas de Description (AD-22).
 */

import type { MediaAsset } from "@/domain/media/MediaAsset";

import {
  cloneExecutionParameters,
  ExecutionParametersDataError,
  readExecutionParameters,
  serializeExecutionParameters,
  type ExecutionParameters,
} from "./ExecutionParameters";
import { readV1 } from "./readV1";

export const EXERCISE_SNAPSHOT_VERSION = 3 as const;

/** Versions d'enveloppe lisibles : la v1 (PRE-3) n'est jamais réécrite. */
export type ExerciseSnapshotVersion = 1 | 2 | typeof EXERCISE_SNAPSHOT_VERSION;

export type ExerciseSnapshotMedia = {
  readonly position: number;
  readonly asset: MediaAsset;
};

export type ExerciseSnapshot = {
  readonly snapshotVersion: ExerciseSnapshotVersion;
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

/**
 * Sérialisation versionnée : paramètres canoniques, aucun champ de phrase/segment/total.
 * Toujours en version courante (v3, PRE-5 AD-18) : les paramètres écrits sont v3, y compris
 * pour un Instantané relu depuis une enveloppe v1 ou v2 (sinon illisible ensuite).
 */
export function serializeExerciseSnapshot(snapshot: ExerciseSnapshot): string {
  return JSON.stringify({
    snapshotVersion: EXERCISE_SNAPSHOT_VERSION,
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
  if (raw === null || typeof raw !== "object" || (raw.snapshotVersion !== 1 && raw.snapshotVersion !== 2 && raw.snapshotVersion !== EXERCISE_SNAPSHOT_VERSION)) {
    throw new ExerciseSnapshotDataError("Unknown exercise snapshot version.");
  }
  const snapshotVersion = raw.snapshotVersion as ExerciseSnapshotVersion;
  const parametersJson = JSON.stringify(raw.executionParameters ?? null);
  const media = Array.isArray(raw.media) ? (raw.media as ExerciseSnapshotMedia[]) : [];
  // Lecture selon la version de l'enveloppe (AD-3, AD-18) : v1 par `readV1`, v2 et v3 par `readExecutionParameters`.
  // Story 1.3 (AC9) : un v1 sans clé Bip (ou à `null`) est lu non cadencé (Bip 0), jamais illisible.
  // Des paramètres illisibles sont signalés comme une erreur de l'Instantané (message d'origine conservé).
  let executionParameters: ExecutionParameters;
  try {
    executionParameters =
      snapshotVersion === 1 ? readV1(parametersJson, { absentBeepAsZero: true }) : readExecutionParameters(parametersJson);
  } catch (error) {
    if (error instanceof ExecutionParametersDataError) {
      throw new ExerciseSnapshotDataError(error.message);
    }
    throw error;
  }
  return deepFreeze({
    snapshotVersion,
    name: String(raw.name),
    categoryId: typeof raw.categoryId === "string" ? raw.categoryId : null,
    bodyZoneIds: Array.isArray(raw.bodyZoneIds) ? (raw.bodyZoneIds as string[]).map(String) : [],
    executionParameters,
    recoverySeconds: typeof raw.recoverySeconds === "number" ? raw.recoverySeconds : 0,
    media: media.map((item, position) => ({ position, asset: { ...item.asset } })),
    actualDurationSeconds: typeof raw.actualDurationSeconds === "number" ? raw.actualDurationSeconds : null,
  });
}
