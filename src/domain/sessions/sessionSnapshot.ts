/**
 * PRE-9 (story D.2, SU-07, ch09 l.593-598, ARB-03) — instantané de Séance : copie profonde gelée,
 * versionnée, de tout ce dont l'exécution aura besoin, indépendante des modifications ultérieures
 * de la Séance et des Mouvements (FMT-06 : modifier la Séance ne modifie pas rétroactivement une
 * exécution).
 *
 * Contenu : identité, nom et origine de la Séance ; Compte à rebours initial et Fin ; structure
 * complète avec ses identifiants stables (Exercices, Circuits, Cycles, Points d'arrêt) ; pour
 * chaque Exercice, l'instantané d'Exercice existant (`createExerciseSnapshot` v3 : contenu du
 * Mouvement résolu — nom, Catégorie, Zones, médias, phases —, paramètres, récupération) ; **par
 * Exercice formaté** (où qu'il soit, Circuit compris) : Format, réglages effectifs et version de
 * règle. Correction C.1 du 30/10 (D-02) : un Circuit de l'instantané ne porte que son identité, son
 * organisation, son compte et ses Exercices — jamais de Format.
 *
 * Aucune phrase, aucun total, aucun plan développé n'y est stocké : le plan se développe depuis
 * l'instantané (`expandStructure`, D.1), dont les Exercices en sont directement lisibles. La
 * sérialisation et la persistance sont reportées à PRE-10, premier consommateur (architecture
 * §6) ; aucun moteur.
 *
 * Fonction pure, sans React ni SQLite. Entrée invalide (lève `ExerciseSnapshotDataError`) : un
 * Exercice sans filiation ou incomplet, comme pour l'instantané d'Exercice (MFN-08) — la validité
 * de configuration se contrôle avant (D.4).
 */

import { createExerciseSnapshot, type ExerciseSnapshot } from "@/domain/activities/exerciseSnapshot";
import { cloneExecutionParameters, type ExecutionParameters } from "@/domain/activities/ExecutionParameters";

import type { Activity, ActivityType } from "./Session";
import type { StructuredSession } from "./SessionRepository";
import { cloneElementFormat, FORMAT_RULES_VERSION, type ElementFormat, type SessionOrigin } from "./formats";
import { mapStructure, type SessionStructure, type StructureCircuit, type StructureElement } from "./structure";

export const SESSION_SNAPSHOT_VERSION = 1 as const;

/** Format figé d'un élément : clé, réglages effectifs et version des règles appliquées. */
export type SnapshotFormat = ElementFormat & { readonly ruleVersion: number };

/** Exercice de l'instantané : lisible par le développement du plan (`PlanExercise`). */
export type SessionSnapshotExercise = {
  readonly id: string;
  readonly type: ActivityType;
  readonly executionParameters: ExecutionParameters;
  readonly postActivityRecoverySeconds: number | null;
  readonly format: SnapshotFormat | null;
  /** Instantané d'Exercice (contenu du Mouvement résolu) ; `null` pour une ancienne Récupération autonome. */
  readonly exercise: ExerciseSnapshot | null;
};

export type SessionSnapshot = {
  readonly snapshotVersion: typeof SESSION_SNAPSHOT_VERSION;
  readonly sessionId: string;
  readonly name: string;
  readonly origin: SessionOrigin | null;
  readonly initialCountdownSeconds: number;
  readonly finalPhaseSeconds: number;
  readonly structure: SessionStructure<SessionSnapshotExercise>;
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

function snapshotFormat(format: ElementFormat | null | undefined): SnapshotFormat | null {
  return format === undefined || format === null ? null : { ...cloneElementFormat(format), ruleVersion: FORMAT_RULES_VERSION };
}

function snapshotExercise(activity: Activity): SessionSnapshotExercise {
  return {
    id: activity.id,
    type: activity.type,
    executionParameters: cloneExecutionParameters(activity.executionParameters),
    postActivityRecoverySeconds: activity.postActivityRecoverySeconds ?? null,
    format: snapshotFormat(activity.format),
    exercise:
      activity.type === "RECOVERY"
        ? null
        : createExerciseSnapshot({
            sourceMovementId: activity.sourceMovementId ?? "",
            name: activity.name,
            categoryId: activity.categoryId ?? null,
            bodyZoneIds: activity.bodyZoneIds,
            executionParameters: activity.executionParameters,
            recoverySeconds: activity.postActivityRecoverySeconds ?? 0,
            media: activity.media ?? [],
          }),
  };
}

/** Instantané gelé d'une Séance relue dans sa structure générale (voir l'en-tête). */
export function createSessionSnapshot(session: StructuredSession): SessionSnapshot {
  const mapped = mapStructure(session.structure, snapshotExercise);
  // Champs du Circuit recopiés un à un. Réalignement du 02/11/2026 : le Format d'origine d'un Circuit
  // porteur entre dans l'instantané avec sa version de règle (ch09 « Instantané »).
  const circuitOf = (circuit: StructureCircuit<SessionSnapshotExercise>): StructureCircuit<SessionSnapshotExercise> => {
    const format = snapshotFormat(circuit.format);
    return {
      id: circuit.id,
      repeatCount: circuit.repeatCount,
      nature: circuit.nature,
      ...(format !== null ? { format } : {}),
      // Recette iPhone n° 3 du 03/11/2026 : modèle d'origine (nom affiché), sans effet sur l'exécution.
      ...((circuit.originModel ?? null) !== null ? { originModel: circuit.originModel } : {}),
      // MAJ 04/11/2026 §6 quinquies : nom du Circuit figé avec la Séance.
      ...((circuit.name ?? null) !== null ? { name: circuit.name } : {}),
      exercises: circuit.exercises,
    };
  };
  const elements = mapped.elements.map((element): StructureElement<SessionSnapshotExercise> => {
    switch (element.kind) {
      case "EXERCISE":
        return element;
      case "CIRCUIT":
        return { kind: "CIRCUIT", circuit: circuitOf(element.circuit) };
      case "CYCLE":
        return {
          kind: "CYCLE",
          cycle: {
            ...element.cycle,
            members: element.cycle.members.map((member) => (member.kind === "CIRCUIT" ? { kind: "CIRCUIT", circuit: circuitOf(member.circuit) } : member)),
          },
        };
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  });
  return deepFreeze({
    snapshotVersion: SESSION_SNAPSHOT_VERSION,
    sessionId: session.id,
    name: session.name,
    origin: session.origin ?? null,
    initialCountdownSeconds: session.initialCountdownSeconds,
    finalPhaseSeconds: session.finalPhaseSeconds,
    structure: { elements, stopPoints: mapped.stopPoints.map((point) => ({ ...point })) },
  });
}
