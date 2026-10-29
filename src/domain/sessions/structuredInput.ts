/**
 * PRE-8 (story A.4, D-449 §4) — entrée d'écriture d'une Séance à structure générale, et sa
 * validation.
 *
 * Aucune règle n'est réécrite : l'en-tête, les Mouvements locaux et chaque Exercice passent par
 * `validateCreateSessionInput`, la forme par `validateStructureShape`. Une structure
 * représentable dans l'ancien modèle (`[Exercices…, Circuit, Exercices…]`) est validée
 * exactement comme aujourd'hui, Points d'arrêt et compte du Circuit compris (RM-219, D-442).
 * Pour une structure plus riche, chaque Exercice est validé par les mêmes règles ; les Points
 * d'arrêt y restent refusés tant que PRE-9 B.6 n'a pas généralisé leurs règles (ARB-02a/b).
 *
 * Les identifiants des Exercices, Circuits et Cycles sont fournis par l'appelant (brouillon).
 */

import {
  legacyFromStructure,
  structureCircuits,
  structureExercises,
  validateStructureShape,
  type SessionStructure,
  type StructureElement,
  type StructureStopPointLocation,
  type StructureViolationCode,
} from "./structure";
import type { ValidationErrorCode, ValidationResult, ValidationViolation } from "./errors";
import type {
  CreateSessionActivityInput,
  CreateSessionInput,
  SessionMovementInput,
  StructuralPosition,
} from "./Session";
import { validateCreateSessionInput } from "./validation";
import {
  elementFormatViolations,
  isSessionOrigin,
  type ElementFormat,
  type ElementFormatViolationCode,
  type FormatCarrierKind,
  type SessionOrigin,
} from "./formats";

/** Exercice d'une structure écrite : l'occurrence sans zone structurelle, identité obligatoire. */
export type StructureExerciseInput = Omit<CreateSessionActivityInput, "structuralPosition" | "id"> & {
  readonly id: string;
};

export type StructureInput = SessionStructure<StructureExerciseInput, StructureStopPointLocation>;

export type StructuredSessionInput = {
  readonly name: string;
  /** PRE-9 (C.1, FMT-02) : origine de création, écrite à la création seulement ; absente = `null`. */
  readonly origin?: SessionOrigin | null;
  readonly labelId?: string | null;
  readonly initialCountdownSeconds: number;
  readonly finalPhaseSeconds: number;
  readonly structure: StructureInput;
  readonly movements?: readonly SessionMovementInput[];
};

const STRUCTURE_VIOLATIONS: Record<StructureViolationCode, ValidationViolation> = {
  STRUCTURE_EMPTY_CYCLE: { code: "REQUIRED", field: "session.structure" },
  STRUCTURE_CIRCUIT_REPEAT_OUT_OF_RANGE: { code: "OUT_OF_RANGE", field: "session.structure", details: { min: 1, max: 99 } },
  STRUCTURE_CYCLE_REPEAT_OUT_OF_RANGE: { code: "OUT_OF_RANGE", field: "session.structure", details: { min: 1, max: 99 } },
  STRUCTURE_CIRCUIT_NATURE_UNRECOGNIZED: { code: "UNRECOGNIZED", field: "session.circuitNature" },
  STRUCTURE_DUPLICATE_ID: { code: "DUPLICATE", field: "session.structure" },
  STRUCTURE_STOP_POINT_UNKNOWN_CIRCUIT: { code: "UNRECOGNIZED", field: "session.stopPoints" },
  STRUCTURE_STOP_POINT_OUT_OF_RANGE: { code: "OUT_OF_RANGE", field: "session.stopPoints" },
  STRUCTURE_STOP_POINT_DUPLICATE: { code: "DUPLICATE", field: "session.stopPoints" },
  STRUCTURE_STOP_POINTS_UNSUPPORTED: { code: "FORBIDDEN_PLACEMENT" satisfies ValidationErrorCode, field: "session.stopPoints" },
};

const FORMAT_VIOLATIONS: Record<ElementFormatViolationCode, ValidationViolation> = {
  FORMAT_UNKNOWN: { code: "UNRECOGNIZED", field: "element.format" },
  FORMAT_CARRIER_RESERVED: { code: "FORBIDDEN_PLACEMENT", field: "element.format" },
  FORMAT_SETTING_UNKNOWN: { code: "UNRECOGNIZED", field: "element.formatSettings" },
  FORMAT_SETTING_NOT_ADJUSTABLE: { code: "MUST_BE_ABSENT", field: "element.formatSettings" },
  FORMAT_SETTING_INVALID: { code: "OUT_OF_RANGE", field: "element.formatSettings" },
};

/** PRE-9 (C.1) : Formats portés par les Circuits et les Exercices de la structure, à tout niveau. */
function formatsOf(structure: StructureInput): readonly { readonly format: ElementFormat; readonly carrier: FormatCarrierKind }[] {
  const carried: { format: ElementFormat; carrier: FormatCarrierKind }[] = [];
  const visit = (format: ElementFormat | null | undefined, carrier: FormatCarrierKind) => {
    if (format !== undefined && format !== null) {
      carried.push({ format, carrier });
    }
  };
  for (const circuit of structureCircuits(structure)) {
    visit(circuit.format, "CIRCUIT");
  }
  for (const exercise of structureExercises(structure)) {
    visit(exercise.format, "EXERCISE");
  }
  return carried;
}

function asActivity(exercise: StructureExerciseInput, structuralPosition: StructuralPosition): CreateSessionActivityInput {
  return { ...exercise, structuralPosition };
}

/**
 * Entrée de l'ancien chemin équivalente à la structure : zones et Circuit si elle est
 * représentable, sinon tous les Exercices dans une seule zone (règles de l'Exercice seules).
 */
function equivalentLegacyInput(input: StructuredSessionInput): CreateSessionInput {
  const header = {
    name: input.name,
    labelId: input.labelId ?? null,
    initialCountdownSeconds: input.initialCountdownSeconds,
    finalPhaseSeconds: input.finalPhaseSeconds,
    movements: input.movements,
  };
  const legacy = legacyFromStructure(input.structure);
  if (legacy === null) {
    return {
      ...header,
      tourRepeatCount: 1,
      exercises: structureExercises(input.structure).map((exercise) => asActivity(exercise, "BEFORE_TOUR")),
      stopPoints: [],
    };
  }
  return {
    ...header,
    tourRepeatCount: legacy.composition.tour.repeatCount,
    circuitNature: legacy.composition.tour.nature,
    exercises: [
      ...legacy.composition.beforeTour.map((exercise) => asActivity(exercise, "BEFORE_TOUR")),
      ...legacy.composition.tour.exercises.map((exercise) => asActivity(exercise, "IN_TOUR")),
      ...legacy.composition.afterTour.map((exercise) => asActivity(exercise, "AFTER_TOUR")),
    ],
    stopPoints: legacy.stopPoints.map(({ scope, position }) => ({ scope, position })),
  };
}

function mapElements(
  elements: readonly StructureElement<StructureExerciseInput>[],
  normalize: (exercise: StructureExerciseInput) => StructureExerciseInput,
): StructureElement<StructureExerciseInput>[] {
  return elements.map((element) => {
    switch (element.kind) {
      case "EXERCISE":
        return { kind: "EXERCISE", exercise: normalize(element.exercise) };
      case "CIRCUIT":
        return { kind: "CIRCUIT", circuit: { ...element.circuit, exercises: element.circuit.exercises.map(normalize) } };
      case "CYCLE":
        return {
          kind: "CYCLE",
          cycle: {
            ...element.cycle,
            members: element.cycle.members.map((member) =>
              member.kind === "CIRCUIT"
                ? { kind: "CIRCUIT", circuit: { ...member.circuit, exercises: member.circuit.exercises.map(normalize) } }
                : { kind: "EXERCISE", exercise: normalize(member.exercise) },
            ),
          },
        };
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  });
}

/**
 * Valide et normalise une Séance à structure générale. Toutes les violations sont agrégées,
 * jamais d'exception. Les Exercices normalisés (paramètres, récupération, côté) reprennent leur
 * place dans la structure.
 */
export function validateStructuredSessionInput(input: StructuredSessionInput): ValidationResult<StructuredSessionInput> {
  const violations: ValidationViolation[] = [];
  const missingId = structureExercises(input.structure).some((exercise) => exercise.id.trim().length === 0);
  if (missingId) {
    violations.push({ code: "REQUIRED", field: "activity.id" });
  }
  for (const violation of validateStructureShape(input.structure, (exercise) => exercise.id)) {
    violations.push(STRUCTURE_VIOLATIONS[violation.code]);
  }
  // PRE-9 (C.1) : contrôle structurel de chaque Format porté (registre) ; règles propres : C.3.
  for (const { format, carrier } of formatsOf(input.structure)) {
    for (const code of elementFormatViolations(format, carrier)) {
      if (!violations.includes(FORMAT_VIOLATIONS[code])) {
        violations.push(FORMAT_VIOLATIONS[code]);
      }
    }
  }
  const origin = input.origin ?? null;
  if (origin !== null && !isSessionOrigin(origin)) {
    violations.push({ code: "UNRECOGNIZED", field: "session.origin" });
  }

  const legacy = validateCreateSessionInput(equivalentLegacyInput(input));
  if (!legacy.ok) {
    violations.push(...legacy.violations);
  }
  if (violations.length > 0 || !legacy.ok) {
    return { ok: false, violations };
  }

  const normalizedById = new Map(legacy.value.exercises.map((exercise) => [exercise.id!, exercise]));
  const normalize = (exercise: StructureExerciseInput): StructureExerciseInput => {
    const { structuralPosition: _zone, ...rest } = normalizedById.get(exercise.id.trim())!;
    // PRE-9 (C.1) : le Format porté, hors des règles de l'occurrence, reste celui de l'entrée.
    return { ...rest, id: exercise.id.trim(), ...(exercise.format !== undefined && exercise.format !== null ? { format: exercise.format } : {}) };
  };
  return {
    ok: true,
    value: {
      name: legacy.value.name,
      ...(origin !== null ? { origin } : {}),
      labelId: legacy.value.labelId ?? null,
      initialCountdownSeconds: legacy.value.initialCountdownSeconds,
      finalPhaseSeconds: legacy.value.finalPhaseSeconds,
      movements: legacy.value.movements,
      structure: { elements: mapElements(input.structure.elements, normalize), stopPoints: input.structure.stopPoints },
    },
  };
}
