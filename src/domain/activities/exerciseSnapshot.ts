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
 *
 * PRE-7 (A1.3, D-437, MFN-03, MFN-11 ; précision de Hermann du 24/10/2026) :
 * l'Instantané porte la FILIATION de l'occurrence (`sourceMovementId`),
 * copiée depuis l'occurrence, jamais relue dans le Catalogue ni utilisée pour
 * charger un contenu ; aucun champ de rang ni de total de niveaux. Le format
 * de l'enveloppe reste la version 3 (aucun Instantané n'est stocké en base,
 * H11) : la clé est ajoutée, et une enveloppe relue sans filiation (antérieure
 * à MFN) donne `null`. Un nouvel Instantané exige une filiation non vide et
 * refuse les paramètres d'un Exercice frère incomplet (ch11 « Exécuter :
 * refuser les exercices incomplets ») — aucun moteur d'exécution ni historique dans PRE-7.
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
  /**
   * PRE-7 (A1.3, MFN-03) : filiation copiée de l'occurrence, non nulle pour
   * tout Instantané créé ; `null` seulement pour une enveloppe relue sans
   * filiation (antérieure au modèle MFN).
   */
  readonly sourceMovementId: string | null;
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
  /** PRE-7 (A1.3, MFN-03) : filiation de l'occurrence (`Activity.sourceMovementId`), non vide. */
  readonly sourceMovementId: string;
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

/**
 * PRE-7 (A1.3, MFN-08) : état d'un Exercice frère INCOMPLET (séries identiques
 * à Cible à renseigner, ou durée de phase manquante < 1 s) — jamais
 * exécutable. Une Cible `UNSET` dans une ligne de séries variables reste
 * admise comme avant (PRE-4, story 2.1 AC8).
 */
function isIncompleteSibling(parameters: ExecutionParameters): boolean {
  const { series } = parameters;
  // PRE-7 (D-446) : une durée de phase manquante rend incomplet quel que soit le régime.
  return series.workPhases.some((phase) => phase.durationSeconds < 1) || (series.kind === "UNIFORM" && series.target.kind === "UNSET");
}

/**
 * Copie profonde gelée de la source — les médias gardent leur ordre et le même fichier physique (même `assetId`/URI).
 * Entrée invalide (lève) : filiation vide, ou paramètres d'un Exercice frère incomplet (PRE-7, A1.3).
 */
export function createExerciseSnapshot(source: ExerciseSnapshotSource): ExerciseSnapshot {
  if (typeof source.sourceMovementId !== "string" || source.sourceMovementId.trim().length === 0) {
    throw new ExerciseSnapshotDataError("An exercise snapshot requires a non-empty source movement id (MFN-03).");
  }
  if (isIncompleteSibling(source.executionParameters)) {
    throw new ExerciseSnapshotDataError("An incomplete exercise cannot be snapshotted for execution (MFN-08).");
  }
  return deepFreeze({
    snapshotVersion: EXERCISE_SNAPSHOT_VERSION,
    sourceMovementId: source.sourceMovementId.trim(),
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
    sourceMovementId: snapshot.sourceMovementId,
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
    // PRE-7 (A1.3) : filiation relue (rognée, même règle qu'à la création) ; absente ou blanche → `null` (enveloppe antérieure à MFN).
    sourceMovementId:
      typeof raw.sourceMovementId === "string" && raw.sourceMovementId.trim().length > 0 ? raw.sourceMovementId.trim() : null,
    name: String(raw.name),
    categoryId: typeof raw.categoryId === "string" ? raw.categoryId : null,
    bodyZoneIds: Array.isArray(raw.bodyZoneIds) ? (raw.bodyZoneIds as string[]).map(String) : [],
    executionParameters,
    recoverySeconds: typeof raw.recoverySeconds === "number" ? raw.recoverySeconds : 0,
    media: media.map((item, position) => ({ position, asset: { ...item.asset } })),
    actualDurationSeconds: typeof raw.actualDurationSeconds === "number" ? raw.actualDurationSeconds : null,
  });
}
