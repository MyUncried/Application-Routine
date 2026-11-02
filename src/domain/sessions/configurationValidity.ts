/**
 * PRE-9 (story D.4, ARB-21, CE-FMT-02 §14, CE-FMT-04 §14, COMP §3 ; réalignement du 02/11/2026,
 * référence Formats §1, §3, §6, §6.1, §14) — validité de configuration d'une Séance, par élément et
 * pour la Séance, distincte de la disponibilité du moteur.
 *
 * - **Validité de configuration** : `valid`, ou `invalid` avec des motifs lisibles par code, sans
 *   aucune réparation silencieuse (rien n'est corrigé ni retiré) :
 *   - `MISSING_TARGET` : une cible à renseigner (tiret, COMP §3 ; série ajoutée à compléter, A6) ;
 *   - `ZERO_VOLUME` : toutes les cibles numériques d'un Exercice valent 0 (COMP §3, ARB-10) ;
 *   - `LOCKED_CONSTANT_CHANGED` : un Exercice s'écarte d'une valeur imposée par un Format
 *     spécialisé (AMRAP autonome et For time en Répétitions, Death by en Répétitions, buy-in /
 *     buy-out en Répétitions à l'objectif, §3, §11, §12). Tabata et 30/30 n'imposent rien (FMT-10,
 *     FMT-19, CE-FMT-04 : « aucun refus fondé sur d'anciennes constantes Tabata/30/30 ») ;
 *   - `MISSING_SETTING` : un réglage obligatoire du rôle non renseigné ;
 *   - `INCOMPATIBLE_CIRCUIT` : un Exercice formaté autonome est membre d'un Circuit standard dont
 *     l'organisation est refusée (§6.1 : AMRAP, For time et Death by alternés) ;
 *   - `EMPTY_LOOP` : Circuit porteur AMRAP ou For time sans membre « À chaque tour » (§6.1, R09) ;
 *   - `INVALID_STRUCTURE` : forme de la structure, Format porté invalide (registre, nature non
 *     admise, membre d'un Circuit porteur d'une autre clé), Séance sans Exercice.
 * - **Disponibilité du moteur** (`engineAvailability`) : lue dans le descripteur de capacités
 *   (D.3), jamais déduite de la validité. Aucun affichage nouveau (« Lecture indisponible »
 *   inchangé, ARB-21).
 *
 * [Correction C.1 du 30/10 (D-02) : « le Format est porté par l'Exercice seul » — remplacée le
 * 02/11/2026 : Exercice autonome ou Circuit porteur.] Fonctions pures.
 */

import { seriesRowsOf, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";

import {
  carrierNatureAdmitted,
  circuitCompatibility,
  elementFormatViolations,
  exerciseFormatRole,
  FORMAT_CAPABILITIES,
  formatParametersOf,
  isSinglePassage,
  loopMembers,
  type ElementFormat,
  type FormatRole,
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

export type ConfigurationReason =
  | "MISSING_TARGET"
  | "ZERO_VOLUME"
  | "LOCKED_CONSTANT_CHANGED"
  | "MISSING_SETTING"
  | "INCOMPATIBLE_CIRCUIT"
  | "EMPTY_LOOP"
  | "INVALID_STRUCTURE";

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

/** Valeurs imposées par un Format spécialisé à l'Exercice qui le porte ou en est membre. */
function breaksImposedValues(exercise: ValidityExercise, format: ElementFormat, role: FormatRole): boolean {
  if (exercise.type !== "EXERCISE") {
    return false;
  }
  const parameters = exercise.executionParameters;
  const repetitionsOnly =
    (role.kind === "EXERCISE" && (format.key === "AMRAP" || format.key === "FOR_TIME" || format.key === "DEATH_BY")) ||
    (role.kind === "MEMBER" && (format.key === "FOR_TIME" || format.key === "DEATH_BY" || isSinglePassage(format)));
  if (repetitionsOnly && parameters.mode !== "REPETITIONS") {
    return true;
  }
  // For time et Passage « Une fois » : Condition d'arrêt À l'objectif (§3, §11).
  const targetOnly = format.key === "FOR_TIME" || isSinglePassage(format);
  return targetOnly && seriesRowsOf(parameters).some((row) => row.target.kind === "FAILURE");
}

function missingSetting(format: ElementFormat, role: FormatRole): boolean {
  return (formatParametersOf(format.key, role) ?? []).some(
    (parameter) => parameter.optional !== true && format.settings[parameter.id] === undefined,
  );
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

  const circuitOf = new Map<string, StructureCircuit<E>>();
  for (const circuit of structureCircuits(structure)) {
    for (const member of circuit.exercises) circuitOf.set(member.id, circuit);
    const carried = circuit.format ?? null;
    if (carried === null) continue;
    const role: FormatRole = { kind: "CIRCUIT", nature: circuit.nature };
    if (!carrierNatureAdmitted(carried.key, circuit.nature) || elementFormatViolations(carried, role).length > 0) {
      add(circuit.id, "INVALID_STRUCTURE");
      continue;
    }
    if (missingSetting(carried, role)) add(circuit.id, "MISSING_SETTING");
    if ((carried.key === "AMRAP" || carried.key === "FOR_TIME") && loopMembers(circuit.exercises).length === 0) {
      add(circuit.id, "EMPTY_LOOP");
    }
  }

  for (const exercise of exercises) {
    const circuit = circuitOf.get(exercise.id) ?? null;
    const role = exerciseFormatRole(circuit);
    const format = exercise.format ?? null;
    if (role.kind === "MEMBER") {
      // Membre d'un Circuit porteur : clé du Format d'origine, réglages de membre (§1, §6).
      if (format === null || format.key !== circuit!.format!.key || elementFormatViolations(format, role).length > 0) {
        add(exercise.id, format === null ? "MISSING_SETTING" : "INVALID_STRUCTURE");
      } else {
        if (missingSetting(format, role)) add(exercise.id, "MISSING_SETTING");
        if (breaksImposedValues(exercise, format, role)) add(exercise.id, "LOCKED_CONSTANT_CHANGED");
      }
    } else if (format !== null) {
      if (elementFormatViolations(format, role).length > 0) {
        add(exercise.id, "INVALID_STRUCTURE");
      } else {
        if (missingSetting(format, role)) add(exercise.id, "MISSING_SETTING");
        if (breaksImposedValues(exercise, format, role)) add(exercise.id, "LOCKED_CONSTANT_CHANGED");
        // Exercice formaté autonome dans un Circuit standard (§6.1).
        if (circuit !== null && circuitCompatibility(format.key, circuit).status === "REFUSED") {
          add(exercise.id, "INCOMPATIBLE_CIRCUIT");
        }
      }
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
  }

  return issues.length === 0 ? { status: "valid" } : { status: "invalid", issues };
}

/** Disponibilité du moteur pour un élément formaté ou libre, lue dans son descripteur (D.3). */
export function engineAvailability(format: ElementFormat | null | undefined): boolean {
  return FORMAT_CAPABILITIES[format?.key ?? "FREE"].executionAvailable;
}
