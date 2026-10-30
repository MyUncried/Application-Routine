/**
 * PRE-9 (story D.4, ARB-21, CE-FMT-02 §14, CE-FMT-04 §14, COMP §3) — validité de configuration
 * d'une Séance, par élément et pour la Séance, distincte de la disponibilité du moteur.
 *
 * - **Validité de configuration** : `valid`, ou `invalid` avec des motifs lisibles par code, sans
 *   aucune réparation silencieuse (rien n'est corrigé ni retiré) :
 *   - `MISSING_TARGET` : une cible à renseigner (tiret, COMP §3) ;
 *   - `ZERO_VOLUME` : toutes les cibles numériques d'un Exercice valent 0 (COMP §3, ARB-10), ou
 *     l'échelle « Volume par tour » d'un For time est entièrement nulle (ARB-18b) ;
 *   - `LOCKED_CONSTANT_CHANGED` : un Exercice formaté s'écarte d'une constante imposée
 *     par son Format (FMT-03, FMT-17, CE-FMT-04 §14 : refus métier d'une constante modifiée) ;
 *   - `MISSING_SETTING` : un réglage du Format non renseigné ;
 *   - `INCOMPATIBLE_CIRCUIT` : un Exercice formaté est membre d'un Circuit dont l'organisation ou
 *     le compte est refusé par la matrice §2.2 pour son Format (D-16 : 30/30 et AMRAP alternés ;
 *     Tabata alterné si N ≠ 8) ;
 *   - `INVALID_STRUCTURE` : forme de la structure, Format porté invalide (registre), Séance sans
 *     Exercice.
 * - **Questions ouvertes** (`openQuestions`) : combinaison non décidée (`UNDECIDED` du registre,
 *   For time alterné) — jamais bloquante, signalée, présente seulement lorsqu'elle existe.
 * - **Disponibilité du moteur** (`engineAvailability`) : lue dans le descripteur de capacités
 *   (D.3), jamais déduite de la validité. Aucun affichage nouveau (« Lecture indisponible »
 *   inchangé, ARB-21).
 *
 * Correction C.1 du 30/10 (D-02, D-26, D-27) : le Format est porté par l'Exercice seul ; aucun
 * Format n'est transmis par le Circuit à ses membres. Chaque Exercice formaté est contrôlé avec ses
 * propres constantes et contre l'organisation et le compte de son propre Circuit.
 *
 * Les règles propres aux réglages de chaque Format (bornes fonctionnelles, compte commun) relèvent
 * de C.3, qui complétera cette fonction sans changer son contrat. Fonctions pures.
 */

import { seriesRowsOf, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";

import { circuitCompatibility, elementFormatViolations, FORMAT_CAPABILITIES, FORMAT_REGISTRY, type ElementFormat } from "./formats";
import type { ActivityType } from "./Session";
import { structureCircuits, structureExercises, validateStructureShape, type SessionStructure, type StructureStopPointLocation } from "./structure";

export type ConfigurationReason =
  | "MISSING_TARGET"
  | "ZERO_VOLUME"
  | "LOCKED_CONSTANT_CHANGED"
  | "MISSING_SETTING"
  | "INCOMPATIBLE_CIRCUIT"
  | "INVALID_STRUCTURE";

/** Motif rattaché à un élément (Exercice, Circuit) ou à la Séance (`elementId` nul). */
export type ConfigurationIssue = { readonly elementId: string | null; readonly reason: ConfigurationReason };

/** Combinaison non décidée (registre `UNDECIDED`) : signalée, jamais bloquante. */
export type ConfigurationOpenQuestion = { readonly elementId: string; readonly circuitId: string; readonly question: string };

/** `openQuestions` n'est présent que lorsqu'au moins une question ouverte existe. */
export type ConfigurationValidity =
  | { readonly status: "valid"; readonly openQuestions?: readonly ConfigurationOpenQuestion[] }
  | { readonly status: "invalid"; readonly issues: readonly ConfigurationIssue[]; readonly openQuestions?: readonly ConfigurationOpenQuestion[] };

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

  const openQuestions: ConfigurationOpenQuestion[] = [];

  const checkFormat = (elementId: string, format: ElementFormat) => {
    if (elementFormatViolations(format).length > 0) {
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

  // Format propre de chaque Exercice, contrôlé ; jamais hérité d'un Circuit ni d'un autre membre.
  const formatOfExercise = new Map<string, ElementFormat>();
  for (const exercise of exercises) {
    const own = exercise.format ?? null;
    if (own !== null && checkFormat(exercise.id, own)) {
      formatOfExercise.set(exercise.id, own);
    }
  }

  // Exercice formaté membre d'un Circuit : organisation et compte de son Circuit (matrice §2.2).
  for (const circuit of structureCircuits(structure)) {
    for (const member of circuit.exercises) {
      const format = formatOfExercise.get(member.id);
      if (format === undefined) {
        continue;
      }
      const compatibility = circuitCompatibility(format.key, circuit);
      if (compatibility.status === "REFUSED") {
        add(member.id, "INCOMPATIBLE_CIRCUIT");
      } else if (compatibility.status === "UNDECIDED") {
        openQuestions.push({ elementId: member.id, circuitId: circuit.id, question: compatibility.question });
      }
    }
  }

  for (const exercise of exercises) {
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

  const open = openQuestions.length > 0 ? { openQuestions } : {};
  return issues.length === 0 ? { status: "valid", ...open } : { status: "invalid", issues, ...open };
}

/** Disponibilité du moteur pour un élément formaté ou libre, lue dans son descripteur (D.3). */
export function engineAvailability(format: ElementFormat | null | undefined): boolean {
  return FORMAT_CAPABILITIES[format?.key ?? "FREE"].executionAvailable;
}
