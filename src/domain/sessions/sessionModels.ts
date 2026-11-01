/**
 * PRE-9 C.3 — paramètres d'un modèle de Séance (Format ou départ rapide) et Exercices produits
 * (CE-FMT-02 ; ch07 « Défauts validés » ; consolidation du 30/10, D-02, D-05, D-13 à D-17, D-22 à D-25).
 *
 * - Le Format appartient à chaque Exercice, jamais au Circuit (D-02) ; un départ rapide ne porte
 *   aucun Format (ses réglages sont des paramètres ordinaires, D-22/D-23).
 * - Valeurs initiales validées (ch07 l.1414) : Tabata 8×20 s/10 s imposés ; 30/30 6 séries,
 *   30 s/30 s imposés ; EMOM fenêtre 60 s, N 6 ; AMRAP 12:00 réglable ; For time 21·15·9 ;
 *   Death by départ 1, incrément 1, fenêtre 1 min ; Renforcement 3×15 ; Progression 10/12/14 ;
 *   À l'échec 3 séries ; Superset Circuit groupé 1 passage. Aucune autre valeur de maquette.
 * - Organisation (D-13) : proposée pour Tabata, EMOM et Progression à partir du deuxième
 *   Exercice ; « À la suite » = Exercices enchaînés, « En alternance » = Circuit alterné (Tabata :
 *   N = 8, FMT-13 ; EMOM : N = nombre de tours, D-16 ; Progression : N = nombre de séries). Le
 *   segment change l'ordre, jamais le volume (CE-FMT-02 §12).
 */

import {
  failureTarget,
  numberTarget,
  seriesCountOf,
  type ExecutionMode,
  type ExecutionParametersInput,
  type ExecutionSeries,
  type SeriesTarget,
} from "@/domain/activities/ExecutionParameters";

import { DEFAULT_CIRCUIT_NATURE, type CircuitNature } from "./circuit";
import type { ElementFormat, ElementFormatKey, QuickStartKey } from "./formats";
import type { StructuralPosition } from "./Session";

/** Modèle paramétrable : un des six Formats ou un départ rapide actif (Gainage · Mobilité retiré, D-25). */
export type ParametrizedModelKey = ElementFormatKey | Exclude<QuickStartKey, "CORE_MOBILITY">;

/** Réglages d'un modèle : nombres, ou liste (échelle For time, répétitions de Progression). */
export type ModelSettings = Readonly<Record<string, number | readonly number[]>>;

export type ModelOrganisation = "SEQUENCE" | "ALTERNATED";

export type ModelParameter = {
  readonly id: string;
  /** Constante imposée (affichée grisée avec sa raison), réglage, ou valeur calculée. */
  readonly lock: "LOCKED" | "ADJUSTABLE" | "CALCULATED";
  readonly unit: "SECONDS" | "SERIES" | "ROUNDS" | "REPETITIONS" | "PASSAGES";
  readonly min: number;
  /** Pas des réglages en secondes. */
  readonly step?: number;
  readonly list?: true;
};

type ModelDefinition = {
  readonly parameters: readonly ModelParameter[];
  readonly initial: ModelSettings;
  /** D-13 : organisation proposée à partir du deuxième Exercice. */
  readonly organisation: boolean;
};

const MODELS: Readonly<Record<ParametrizedModelKey, ModelDefinition>> = {
  TABATA: {
    parameters: [
      { id: "seriesPerExercise", lock: "LOCKED", unit: "SERIES", min: 8 },
      { id: "workSeconds", lock: "LOCKED", unit: "SECONDS", min: 20 },
      { id: "pauseSeconds", lock: "LOCKED", unit: "SECONDS", min: 10 },
    ],
    initial: { seriesPerExercise: 8, workSeconds: 20, pauseSeconds: 10 },
    organisation: true,
  },
  INTERVALS_30_30: {
    parameters: [
      { id: "seriesCount", lock: "ADJUSTABLE", unit: "SERIES", min: 1 },
      { id: "workSeconds", lock: "LOCKED", unit: "SECONDS", min: 30 },
      { id: "pauseSeconds", lock: "LOCKED", unit: "SECONDS", min: 30 },
    ],
    initial: { seriesCount: 6, workSeconds: 30, pauseSeconds: 30 },
    organisation: false,
  },
  EMOM: {
    parameters: [
      { id: "roundCount", lock: "ADJUSTABLE", unit: "ROUNDS", min: 1 },
      { id: "windowSeconds", lock: "ADJUSTABLE", unit: "SECONDS", min: 5, step: 5 },
    ],
    initial: { roundCount: 6, windowSeconds: 60 },
    organisation: true,
  },
  AMRAP: {
    parameters: [{ id: "durationSeconds", lock: "ADJUSTABLE", unit: "SECONDS", min: 60, step: 60 }],
    initial: { durationSeconds: 12 * 60 },
    organisation: false,
  },
  FOR_TIME: {
    parameters: [{ id: "volumePerRound", lock: "ADJUSTABLE", unit: "REPETITIONS", min: 0, list: true }],
    initial: { volumePerRound: [21, 15, 9] },
    organisation: false,
  },
  DEATH_BY: {
    parameters: [
      { id: "startRepetitions", lock: "ADJUSTABLE", unit: "REPETITIONS", min: 0 },
      { id: "incrementRepetitions", lock: "ADJUSTABLE", unit: "REPETITIONS", min: 0 },
      { id: "windowSeconds", lock: "ADJUSTABLE", unit: "SECONDS", min: 5, step: 5 },
    ],
    initial: { startRepetitions: 1, incrementRepetitions: 1, windowSeconds: 60 },
    organisation: false,
  },
  STRENGTH: {
    parameters: [
      { id: "seriesCount", lock: "ADJUSTABLE", unit: "SERIES", min: 1 },
      { id: "repetitions", lock: "ADJUSTABLE", unit: "REPETITIONS", min: 1 },
    ],
    initial: { seriesCount: 3, repetitions: 15 },
    organisation: false,
  },
  PROGRESSION: {
    parameters: [{ id: "repetitionsPerSeries", lock: "ADJUSTABLE", unit: "REPETITIONS", min: 1, list: true }],
    initial: { repetitionsPerSeries: [10, 12, 14] },
    organisation: true,
  },
  UNTIL_FAILURE: {
    parameters: [{ id: "seriesCount", lock: "ADJUSTABLE", unit: "SERIES", min: 1 }],
    initial: { seriesCount: 3 },
    organisation: false,
  },
  SUPERSET: {
    parameters: [{ id: "passages", lock: "ADJUSTABLE", unit: "PASSAGES", min: 1 }],
    initial: { passages: 1 },
    organisation: false,
  },
};

const FORMAT_KEYS: ReadonlySet<string> = new Set(["TABATA", "INTERVALS_30_30", "EMOM", "AMRAP", "FOR_TIME", "DEATH_BY"]);

export function isFormatModel(key: ParametrizedModelKey): key is ElementFormatKey {
  return FORMAT_KEYS.has(key);
}

export function modelParameters(key: ParametrizedModelKey): readonly ModelParameter[] {
  return MODELS[key].parameters;
}

export function initialModelSettings(key: ParametrizedModelKey): ModelSettings {
  return MODELS[key].initial;
}

/** D-13 : le choix « À la suite / En alternance » n'est proposé qu'à partir du deuxième Exercice. */
export function proposesOrganisation(key: ParametrizedModelKey, exerciseCount: number): boolean {
  return MODELS[key].organisation && exerciseCount >= 2;
}

function numberSetting(settings: ModelSettings, id: string): number {
  const value = settings[id];
  return typeof value === "number" ? value : 0;
}

function listSetting(settings: ModelSettings, id: string): readonly number[] {
  const value = settings[id];
  return Array.isArray(value) ? value : [];
}

/** Réglage borné (aucune borne nouvelle : le minimum structurel du paramètre). */
export function withModelSetting(key: ParametrizedModelKey, settings: ModelSettings, id: string, value: number | readonly number[]): ModelSettings {
  const parameter = MODELS[key].parameters.find((candidate) => candidate.id === id);
  if (parameter === undefined || parameter.lock !== "ADJUSTABLE") return settings;
  const clamp = (item: number) => Math.max(parameter.min, Math.round(item));
  const next = Array.isArray(value) ? (value as readonly number[]).map(clamp) : clamp(value as number);
  if (parameter.list === true && Array.isArray(next) && (next.length === 0 || next.every((item) => item === 0))) {
    // For time : zéro admis dans une position si le volume total n'est pas nul (ARB-18b).
    return settings;
  }
  return { ...settings, [id]: next };
}

/** Format porté par chaque Exercice (D-02) ; `null` pour un départ rapide. */
export function modelFormat(key: ParametrizedModelKey, settings: ModelSettings): ElementFormat | null {
  if (!isFormatModel(key)) return null;
  const own = MODELS[key].parameters.filter((parameter) => parameter.lock === "ADJUSTABLE").map((parameter) => parameter.id);
  return { key, settings: Object.fromEntries(own.map((id) => [id, settings[id]!])) as ElementFormat["settings"] };
}

function uniform(count: number, target: SeriesTarget, pauseSeconds: number, base: ExecutionParametersInput): ExecutionSeries {
  const loadKg = base.series.kind === "UNIFORM" ? base.series.loadKg : 0;
  return { kind: "UNIFORM", count, target, pauseSeconds, loadKg, workPhases: base.series.workPhases };
}

function basePause(base: ExecutionParametersInput): number {
  return base.series.kind === "UNIFORM" ? base.series.pauseSeconds : (base.series.rows[0]?.pauseSeconds ?? 0);
}

/**
 * Paramètres d'exécution d'un Exercice issu du modèle : constantes et valeurs initiales du modèle,
 * le reste (côtés, phases, charge, comptes à rebours) repris du Mouvement. Les Formats progressifs
 * (AMRAP, Death by) et For time gardent les paramètres du Mouvement : leur bloc est décrit par les
 * réglages du Format (D.1).
 */
export function modelExecutionParameters(
  key: ParametrizedModelKey,
  settings: ModelSettings,
  base: ExecutionParametersInput,
): ExecutionParametersInput {
  const withSeries = (mode: ExecutionMode, series: ExecutionSeries): ExecutionParametersInput => ({ ...base, mode, series });
  switch (key) {
    case "TABATA":
      return withSeries("DURATION", uniform(8, numberTarget(20), 10, base));
    case "INTERVALS_30_30":
      return withSeries("DURATION", uniform(numberSetting(settings, "seriesCount"), numberTarget(30), 30, base));
    case "EMOM": {
      // N fenêtres : une série par fenêtre, le travail du Mouvement inchangé (repos jusqu'à la cadence).
      const rounds = numberSetting(settings, "roundCount");
      if (base.series.kind !== "UNIFORM" || base.mode === null) return base;
      return withSeries(base.mode, uniform(rounds, base.series.target, 0, base));
    }
    case "STRENGTH":
      return withSeries("REPETITIONS", uniform(numberSetting(settings, "seriesCount"), numberTarget(numberSetting(settings, "repetitions")), basePause(base), base));
    case "PROGRESSION": {
      const pause = basePause(base);
      return withSeries("REPETITIONS", {
        kind: "VARIABLE",
        rows: listSetting(settings, "repetitionsPerSeries").map((repetitions) => ({ target: numberTarget(repetitions), pauseSeconds: pause, loadKg: 0 })),
        workPhases: base.series.workPhases,
      });
    }
    case "UNTIL_FAILURE":
      return withSeries("REPETITIONS", uniform(numberSetting(settings, "seriesCount"), failureTarget(), basePause(base), base));
    case "AMRAP":
    case "FOR_TIME":
    case "DEATH_BY":
    case "SUPERSET":
      return base;
    default: {
      const unreachable: never = key;
      return unreachable;
    }
  }
}

/** Disposition produite : Exercices enchaînés, ou un Circuit (nature, compte). */
export type ModelArrangement =
  | { readonly kind: "SEQUENCE" }
  | { readonly kind: "CIRCUIT"; readonly nature: CircuitNature; readonly repeatCount: number };

/**
 * Disposition des Exercices : Superset — Circuit groupé de son nombre de passages (D-24) ; « En
 * alternance » — Circuit alterné dont le compte est le nombre de séries de ses membres (N commun,
 * D-07, D-16) ; sinon Exercices enchaînés.
 */
export function modelArrangement(
  key: ParametrizedModelKey,
  settings: ModelSettings,
  organisation: ModelOrganisation,
  exercises: readonly { readonly executionParameters: ExecutionParametersInput }[],
): ModelArrangement {
  if (key === "SUPERSET") return { kind: "CIRCUIT", nature: DEFAULT_CIRCUIT_NATURE, repeatCount: numberSetting(settings, "passages") };
  if (organisation === "ALTERNATED" && proposesOrganisation(key, exercises.length)) {
    const count = Math.max(1, ...exercises.map((exercise) => seriesCountOf(exercise.executionParameters)));
    return { kind: "CIRCUIT", nature: "SERIES", repeatCount: count };
  }
  return { kind: "SEQUENCE" };
}

/**
 * Contenu de la Séance préremplie (C.4, ARB-15) dans le modèle à Circuit unique : Exercices enchaînés
 * avant le Circuit (vide, non rendu), ou membres du seul Circuit avec sa nature et son compte.
 */
export function modelDraftPatch<E extends { readonly structuralPosition: StructuralPosition }>(
  exercises: readonly E[],
  arrangement: ModelArrangement,
): { readonly exercises: readonly E[]; readonly tourRepeatCount?: number; readonly circuitNature?: CircuitNature } {
  if (arrangement.kind === "SEQUENCE") {
    return { exercises: exercises.map((exercise) => ({ ...exercise, structuralPosition: "BEFORE_TOUR" as const })) };
  }
  return {
    exercises: exercises.map((exercise) => ({ ...exercise, structuralPosition: "IN_TOUR" as const })),
    tourRepeatCount: arrangement.repeatCount,
    circuitNature: arrangement.nature,
  };
}
