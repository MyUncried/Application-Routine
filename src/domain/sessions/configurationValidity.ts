/**
 * PRE-9 (story D.4, ARB-21, CE-FMT-02 §14, CE-FMT-04 §14, COMP §3) — validité de configuration
 * d'une Séance, par élément et pour la Séance, distincte de la disponibilité du moteur.
 *
 * - **Validité de configuration** : `valid`, ou `invalid` avec des motifs lisibles par code, sans
 *   aucune réparation silencieuse (rien n'est corrigé ni retiré) :
 *   - `MISSING_TARGET` : une cible à renseigner (tiret, COMP §3) ;
 *   - `ZERO_VOLUME` : toutes les cibles numériques d'un Exercice valent 0 (COMP §3, ARB-10), ou
 *     l'échelle « Volume par tour » d'un For time est entièrement nulle (ARB-18b) ;
 *   - `LOCKED_CONSTANT_CHANGED` : un Exercice d'un élément formaté s'écarte d'une constante imposée
 *     par son Format (FMT-03, FMT-17, CE-FMT-04 §14 : refus métier d'une constante modifiée) ;
 *   - `MISSING_SETTING` : un réglage du Format non renseigné ;
 *   - `INVALID_STRUCTURE` : forme de la structure, Format porté (registre), organisation du Circuit
 *     porteur non admise par son Format, compte du Circuit différent de celui que le Format
 *     gouverne (Tabata, FMT-12/13), Séance sans Exercice.
 * - **Disponibilité du moteur** (`engineAvailability`) : lue dans le descripteur de capacités
 *   (D.3), jamais déduite de la validité. Aucun affichage nouveau (« Lecture indisponible »
 *   inchangé, ARB-21).
 *
 * Les règles propres aux réglages de chaque Format (bornes fonctionnelles, compte commun) relèvent
 * de C.3, qui complétera cette fonction sans changer son contrat. Fonctions pures.
 */

import { seriesRowsOf, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";

import {
  elementFormatViolations,
  FORMAT_CAPABILITIES,
  FORMAT_REGISTRY,
  type ElementFormat,
  type FormatCarrierKind,
} from "./formats";
import type { ActivityType } from "./Session";
import {
  structureCircuits,
  structureExercises,
  validateStructureShape,
  type SessionStructure,
  type StructureCircuit,
  type StructureStopPointLocation,
} from "./structure";

export type ConfigurationReason = "MISSING_TARGET" | "ZERO_VOLUME" | "LOCKED_CONSTANT_CHANGED" | "MISSING_SETTING" | "INVALID_STRUCTURE";

/** Motif rattaché à un élément (Exercice, Circuit) ou à la Séance (`elementId` nul). */
export type ConfigurationIssue = { readonly elementId: string | null; readonly reason: ConfigurationReason };

export type ConfigurationValidity =
  | { readonly status: "valid" }
  | { readonly status: "invalid"; readonly issues: readonly ConfigurationIssue[] };

export type ValidityExercise = {
  readonly id: string;
  readonly type: ActivityType;
  readonly executionParameters: ExecutionParametersInput;
  readonly format?: ElementFormat | null;
};

/** Écarts de l'Exercice aux constantes d'un Format (paramètres `LOCKED` du registre). */
function breaksLockedConstants(exercise: ValidityExercise, format: ElementFormat): boolean {
  const constants = Object.fromEntries(
    FORMAT_REGISTRY[format.key].parameters.filter((parameter) => parameter.lock === "LOCKED").map((parameter) => [parameter.id, parameter.value]),
  );
  if (Object.keys(constants).length === 0 || exercise.type !== "EXERCISE") {
    return false;
  }
  const parameters = exercise.executionParameters;
  const rows = seriesRowsOf(parameters);
  if (constants.workSeconds !== undefined || constants.pauseSeconds !== undefined) {
    // Les constantes de travail et de pause sont des durées : mode Durée imposé (FMT-17).
    if (parameters.mode !== "DURATION") {
      return true;
    }
  }
  if (constants.seriesPerExercise !== undefined && rows.length !== constants.seriesPerExercise) {
    return true;
  }
  return rows.some(
    (row) =>
      (constants.workSeconds !== undefined && !(row.target.kind === "NUMBER" && row.target.value === constants.workSeconds)) ||
      (constants.pauseSeconds !== undefined && row.pauseSeconds !== constants.pauseSeconds),
  );
}

function missingSetting(format: ElementFormat): boolean {
  return FORMAT_REGISTRY[format.key].parameters.some((parameter) => parameter.lock === "ADJUSTABLE" && format.settings[parameter.id] === undefined);
}

function zeroLadder(format: ElementFormat): boolean {
  const ladder = format.settings.volumePerRound;
  return Array.isArray(ladder) && ladder.length > 0 && ladder.every((value) => value === 0);
}

function circuitOrganisationAdmitted(circuit: StructureCircuit<unknown>, format: ElementFormat): boolean {
  const carrier = FORMAT_REGISTRY[format.key].carriers.CIRCUIT;
  if (carrier.status !== "ALLOWED" || !carrier.natures.includes(circuit.nature)) {
    return false;
  }
  const governed = carrier.countByNature?.[circuit.nature];
  return governed === undefined || governed === circuit.repeatCount;
}

/** Validité de configuration de la Séance et de chacun de ses éléments (voir l'en-tête). */
export function configurationValidity<E extends ValidityExercise>(
  structure: SessionStructure<E, StructureStopPointLocation>,
): ConfigurationValidity {
  const issues: ConfigurationIssue[] = [];
  const add = (elementId: string | null, reason: ConfigurationReason) => {
    if (!issues.some((issue) => issue.elementId === elementId && issue.reason === reason)) {
      issues.push({ elementId, reason });
    }
  };

  if (validateStructureShape(structure, (exercise) => exercise.id).length > 0) {
    add(null, "INVALID_STRUCTURE");
  }
  const exercises = structureExercises(structure);
  if (!exercises.some((exercise) => exercise.type === "EXERCISE")) {
    add(null, "INVALID_STRUCTURE");
  }

  const checkFormat = (elementId: string, format: ElementFormat, carrier: FormatCarrierKind) => {
    if (elementFormatViolations(format, carrier).length > 0) {
      add(elementId, "INVALID_STRUCTURE");
      return false;
    }
    if (missingSetting(format)) {
      add(elementId, "MISSING_SETTING");
    }
    if (zeroLadder(format)) {
      add(elementId, "ZERO_VOLUME");
    }
    return true;
  };

  const formatOfExercise = new Map<string, ElementFormat>();
  for (const circuit of structureCircuits(structure)) {
    const format = circuit.format ?? null;
    if (format === null || !checkFormat(circuit.id, format, "CIRCUIT")) {
      continue;
    }
    if (!circuitOrganisationAdmitted(circuit, format)) {
      add(circuit.id, "INVALID_STRUCTURE");
    }
    for (const exercise of circuit.exercises) {
      formatOfExercise.set(exercise.id, format);
    }
  }

  for (const exercise of exercises) {
    const own = exercise.format ?? null;
    if (own !== null && checkFormat(exercise.id, own, "EXERCISE")) {
      formatOfExercise.set(exercise.id, own);
    }
    if (exercise.type !== "EXERCISE" || exercise.executionParameters.mode === null) {
      continue;
    }
    const targets = seriesRowsOf(exercise.executionParameters).map((row) => row.target);
    if (targets.some((target) => target.kind === "UNSET")) {
      add(exercise.id, "MISSING_TARGET");
    }
    const numeric = targets.filter((target) => target.kind === "NUMBER");
    if (numeric.length === targets.length && numeric.every((target) => target.kind === "NUMBER" && target.value === 0)) {
      add(exercise.id, "ZERO_VOLUME");
    }
    const format = formatOfExercise.get(exercise.id);
    if (format !== undefined && breaksLockedConstants(exercise, format)) {
      add(exercise.id, "LOCKED_CONSTANT_CHANGED");
    }
  }

  return issues.length === 0 ? { status: "valid" } : { status: "invalid", issues };
}

/** Disponibilité du moteur pour un élément formaté ou libre, lue dans son descripteur (D.3). */
export function engineAvailability(format: ElementFormat | null | undefined): boolean {
  return FORMAT_CAPABILITIES[format?.key ?? "FREE"].executionAvailable;
}
