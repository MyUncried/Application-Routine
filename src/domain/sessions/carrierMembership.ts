/**
 * PRE-9 C.4 — entrée dans un Circuit porteur d'un Format et sortie (référence Formats du 02/11/2026 §6,
 * §13 ; CE-FMT-03).
 *
 * **Entrée** (§6 point 1, 3, 6) : tout Exercice ajouté ou déplacé dans un Circuit porteur suit les règles
 * du Circuit d'arrivée. Il reprend ses paramètres compatibles ; les valeurs incompatibles ou ambiguës
 * restent à renseigner (cible « à compléter ») — aucune somme, moyenne, conversion de durée en
 * répétitions, ni confirmation de perte. Il reçoit la clé du Format d'origine et ses réglages de membre
 * (Passage « À chaque tour », incrément repris s'il est compatible, sinon valeur initiale ; intervalle
 * propre du Death by alterné). Séries et durée globale portées par le Circuit retirées de la saisie
 * locale ; For time : une série par tour.
 *
 * **Sortie** (§13) : « Conserver le format » rend un Exercice formaté simple (paramètres compatibles de
 * l'Exercice et ceux jusque-là portés par le Circuit) ; « Adopter un format libre » rend un Exercice
 * standard, paramètres compatibles conservés. Buy-in et buy-out sortent directement libres (§6 point 4).
 *
 * Fonctions pures.
 */

import {
  failureTarget,
  seriesRowsOf,
  unsetTarget,
  type ExecutionParametersInput,
  type SeriesTarget,
} from "@/domain/activities/ExecutionParameters";

import {
  initialFormatSettings,
  isSinglePassage,
  type ElementFormat,
} from "./formats";
import type { CircuitNature } from "./circuit";
import type { SessionDraftExercise } from "./SessionDraft";

type CarrierCircuit = { readonly nature: CircuitNature; readonly repeatCount: number; readonly format?: ElementFormat | null };

/** Cible commune des séries ; « à compléter » si les cibles diffèrent ou mêlent chiffré et échec (§6 point 1). */
function commonTarget(parameters: ExecutionParametersInput): SeriesTarget {
  const targets = seriesRowsOf(parameters).map((row) => row.target);
  const [first] = targets;
  if (first === undefined) return unsetTarget();
  const same = targets.every((item) => item.kind === first.kind && (item.kind !== "NUMBER" || (first.kind === "NUMBER" && item.value === first.value)));
  return same ? first : unsetTarget();
}

/** Charge commune ; `null` si les charges varient (reste à compléter, §6 point 1). */
function commonLoad(parameters: ExecutionParametersInput): number | null {
  const loads = seriesRowsOf(parameters).map((row) => row.loadKg);
  return loads.every((load) => load === loads[0]) ? (loads[0] ?? 0) : null;
}

function uniform(parameters: ExecutionParametersInput, mode: ExecutionParametersInput["mode"], count: number, target: SeriesTarget, pauseSeconds: number): ExecutionParametersInput {
  return {
    ...parameters,
    mode,
    series: { kind: "UNIFORM", count, target, pauseSeconds, loadKg: commonLoad(parameters) ?? 0, workPhases: parameters.series.workPhases },
  };
}

function withFormat(exercise: SessionDraftExercise, format: ElementFormat | null, executionParameters: ExecutionParametersInput, recovery?: number): SessionDraftExercise {
  const { format: _previous, ...rest } = exercise;
  return {
    ...rest,
    executionParameters,
    ...(recovery !== undefined ? { postActivityRecoverySeconds: recovery } : {}),
    ...(format !== null ? { format } : {}),
  };
}

const ownSetting = (exercise: SessionDraftExercise, id: string): number | undefined => {
  const value = exercise.format?.settings[id];
  return typeof value === "number" ? value : undefined;
};

/** Exercice entré dans le Circuit porteur `circuit` (voir l'en-tête) ; inchangé s'il en est déjà membre. */
export function enterCarrier(exercise: SessionDraftExercise, circuit: CarrierCircuit): SessionDraftExercise {
  const carried = circuit.format ?? null;
  if (carried === null || exercise.type !== "EXERCISE") return exercise;
  if (exercise.format?.key === carried.key && isMemberShaped(exercise, carried.key, circuit.nature)) return exercise;
  const parameters = exercise.executionParameters;
  const target = commonTarget(parameters);
  const numeric: SeriesTarget = target.kind === "NUMBER" ? target : unsetTarget();
  const role = { kind: "MEMBER" as const, nature: circuit.nature };
  const initial = initialFormatSettings(carried.key, role);
  const increment = ownSetting(exercise, "incrementPerRound");
  const keepIncrement = (min: number) => (increment !== undefined && increment >= min ? increment : initial.incrementPerRound);
  switch (carried.key) {
    case "AMRAP": {
      // Mode Répétitions ou Durée ; cible par passage, ou À l'échec ; Passage À chaque tour, incrément 0 sauf repris.
      const kept = target;
      const settings = { incrementPerRound: parameters.mode === "REPETITIONS" ? (keepIncrement(0) ?? 0) : 0 };
      return withFormat(exercise, { key: "AMRAP", settings }, uniform(parameters, parameters.mode, 1, kept, 0));
    }
    case "FOR_TIME": {
      // Rôle Tour, À l'objectif ; une série par tour ; cible commune chiffrée reprise, sinon à compléter. MAJ 04/11/2026
      // §6 bis 2 : Répétitions ou Durée, le Mode est conservé (sans conversion). [Passage en Répétitions — remplacé.]
      const rows = Array.from({ length: Math.max(1, circuit.repeatCount) }, () => ({
        target: numeric,
        pauseSeconds: 0,
        loadKg: commonLoad(parameters) ?? 0,
      }));
      return withFormat(exercise, { key: "FOR_TIME", settings: {} }, { ...parameters, mode: parameters.mode ?? "REPETITIONS", series: { kind: "VARIABLE", rows, workPhases: parameters.series.workPhases } }, 0);
    }
    case "EMOM": {
      // Intervalle et Durée de l'exercice portés par le Circuit ; récupération 0 s. Complément du 5 novembre 2026 (Hermann), §14 : une série par tour (S1…Sn),
      // cible commune reprise sur chaque série. [Une série jouée à chaque tour — remplacé.]
      return withFormat(exercise, { key: "EMOM", settings: {} }, uniform(parameters, parameters.mode, Math.max(1, circuit.repeatCount), target, 0), 0);
    }
    case "DEATH_BY": {
      // Départ repris s'il est chiffré ; incrément ≥ 1 ; intervalle propre en alternance. Complément du 5 novembre 2026 (Hermann), §13 : Répétitions ou Durée, le
      // Mode est conservé, sans conversion. [Répétitions imposées — remplacé.]
      const settings: Record<string, number> = { incrementPerRound: keepIncrement(1) ?? 1 };
      if (circuit.nature === "SERIES") settings.intervalSeconds = ownSetting(exercise, "intervalSeconds") ?? initial.intervalSeconds ?? 60;
      return withFormat(exercise, { key: "DEATH_BY", settings }, uniform(parameters, parameters.mode ?? "REPETITIONS", 1, numeric, 0), 0);
    }
    default: {
      const unreachable: never = carried.key;
      return unreachable;
    }
  }
}

/** Membre déjà au format de son Circuit (aucune conversion à refaire lors d'un réordonnancement). */
function isMemberShaped(exercise: SessionDraftExercise, key: ElementFormat["key"], nature: CircuitNature): boolean {
  const settings = exercise.format?.settings ?? {};
  if ("durationSeconds" in settings || "timeCapSeconds" in settings) return false;
  if (key === "DEATH_BY" && nature === "TOURS" && "intervalSeconds" in settings) return false;
  // Complément du 5 novembre 2026 (Hermann), §14 : un membre EMOM porte une série par tour (S1…Sn) ; seul le Death by garde une série unique.
  if (key === "DEATH_BY" && seriesRowsOf(exercise.executionParameters).length > 1) return false;
  return true;
}

export type CarrierExitChoice = "KEEP" | "FREE";

/**
 * Exercice sorti du Circuit porteur `circuit` selon le choix (§13). Buy-in / buy-out : toujours libres,
 * sans choix (§6 point 4) — voir `exitNeedsChoice`.
 */
export function exitCarrier(exercise: SessionDraftExercise, circuit: CarrierCircuit, choice: CarrierExitChoice): SessionDraftExercise {
  const carried = circuit.format ?? null;
  if (carried === null || exercise.type !== "EXERCISE") return exercise;
  const parameters = exercise.executionParameters;
  if (choice === "FREE" || isSinglePassage(exercise.format)) {
    // Format libre : paramètres compatibles conservés ; Passage et réglages du Format retirés.
    return withFormat(exercise, null, parameters);
  }
  const target = commonTarget(parameters);
  const numeric: SeriesTarget = target.kind === "NUMBER" ? target : unsetTarget();
  const setting = (id: string) => {
    const value = carried.settings[id];
    return typeof value === "number" ? value : undefined;
  };
  switch (carried.key) {
    case "AMRAP": {
      // AMRAP simple en Répétitions ; durée d'un bloc reprise ; aucune durée convertie en répétitions.
      const kept = parameters.mode === "REPETITIONS" ? target : target.kind === "FAILURE" ? failureTarget() : unsetTarget();
      return withFormat(
        exercise,
        { key: "AMRAP", settings: { durationSeconds: setting("blockSeconds") ?? 720, incrementPerRound: ownSetting(exercise, "incrementPerRound") ?? 0 } },
        uniform(parameters, "REPETITIONS", 1, kept, 0),
      );
    }
    case "FOR_TIME": {
      // For time simple : Séries = nombre de tours, mêmes volumes ; temps limite repris.
      const cap = setting("timeCapSeconds");
      return withFormat(exercise, { key: "FOR_TIME", settings: cap === undefined ? {} : { timeCapSeconds: cap } }, parameters);
    }
    case "EMOM": {
      // EMOM simple : Intervalle = durée de chaque tour, Séries = nombre de tours.
      // Complément du 5 novembre 2026 (Hermann), §14 : les séries effectives S1…Sn du membre sont conservées.
      const tours = Math.max(1, circuit.repeatCount);
      return withFormat(
        exercise,
        { key: "EMOM", settings: { intervalSeconds: setting("windowSeconds") ?? 60 } },
        seriesRowsOf(parameters).length === tours && tours > 1 ? parameters : uniform(parameters, parameters.mode, tours, target, 0),
      );
    }
    case "DEATH_BY": {
      // Death by simple : Jusqu'à l'échec ; départ et incrément conservés ; intervalle du Circuit, ou propre en alternance.
      const interval = circuit.nature === "SERIES" ? (ownSetting(exercise, "intervalSeconds") ?? 60) : (setting("windowSeconds") ?? 60);
      return withFormat(
        exercise,
        { key: "DEATH_BY", settings: { intervalSeconds: interval, incrementPerRound: ownSetting(exercise, "incrementPerRound") ?? 1 } },
        uniform(parameters, parameters.mode ?? "REPETITIONS", 1, numeric, 0),
      );
    }
    default: {
      const unreachable: never = carried.key;
      return unreachable;
    }
  }
}

/** Sortie d'un Circuit porteur : choix demandé, sauf buy-in / buy-out (libres d'office, §6 point 4). */
export function exitNeedsChoice(exercise: SessionDraftExercise): boolean {
  return !isSinglePassage(exercise.format);
}

