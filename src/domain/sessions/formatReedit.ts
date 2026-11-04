/**
 * PRE-9 — « Modifier le format » : réédition d'un Circuit issu d'un modèle depuis la Composition (mise à jour
 * consolidée des écrans Formats du 04/11/2026 §6 sexies ; décisions de Hermann du 4 novembre 2026).
 *
 * - **Préremplissage** (`modelStateOfCircuit`) : le questionnaire et le récapitulatif sont reconstruits depuis
 *   l'état ACTUEL du Circuit et de ses Exercices (les réponses d'origine ne sont pas stockées) — y compris les
 *   modifications faites après coup. Avec / Sans charge reprend l'état effectif (au moins un Exercice « Avec ») ;
 *   des charges conservées sous « Sans » ne le réactivent pas. Un réglage commun hétérogène est **variable**
 *   (`variable`) : jamais uniformisé, il ne bloque pas l'enregistrement ; seule une saisie explicite le remplace.
 * - **Enregistrement en place** (`applyModelReedit`) : le Circuit est mis à jour, pas recréé — mêmes identifiants
 *   d'Exercices conservés, même position, même nom ; seuls les champs effectivement modifiés changent : la
 *   structure est reconstruite deux fois (état d'ouverture, état édité) et seule leur différence est appliquée
 *   aux Exercices et au Circuit actuels (phases, cadence, côtés, réglages faits dans la modale conservés).
 *   Changement de structure : le Format d'origine suit la nouvelle structure ; le Modèle d'origine et le nom sont
 *   conservés. Fermer sans enregistrer ne change rien (aucune écriture avant l'appel).
 * - Instantanés figés, historique et records : non concernés (la Séance enregistrée seule change).
 *
 * Fonctions pures.
 */

import { seriesRowsOf, type SeriesRow } from "@/domain/activities/ExecutionParameters";

import { circuitRoleOf } from "./formats";
import {
  buildModelElements,
  initialAnswers,
  type FormatModelKey,
  type ModelAnswerKey,
  type ModelAnswers,
  type ModelMovement,
  type MovementValues,
} from "./formatModels";
import { currentLayout, withLayout } from "./layoutOperations";
import type { SessionDraft, SessionDraftExercise } from "./SessionDraft";
import { structureCircuits, type StructureCircuit, type StructureElement } from "./structure";

/** État du formulaire reconstruit depuis le Circuit. */
export type ModelReeditState = {
  readonly model: FormatModelKey;
  readonly answers: ModelAnswers;
  readonly movements: readonly ModelMovement[];
  /** Réglages communs hétérogènes, affichés « variable » (§6 sexies.7). */
  readonly variable: ReadonlySet<ModelAnswerKey>;
};

/** Valeur commune d'une liste, `undefined` si vide, `"variable"` si hétérogène. */
function common<T>(values: readonly T[]): T | undefined | "variable" {
  if (values.length === 0) return undefined;
  const [first] = values;
  return values.every((value) => JSON.stringify(value) === JSON.stringify(first)) ? first : "variable";
}

function firstNumber(rows: readonly SeriesRow[]): number | null {
  const target = rows[0]?.target;
  return target !== undefined && target.kind === "NUMBER" ? target.value : null;
}

function valuesOf(model: FormatModelKey, exercise: SessionDraftExercise): MovementValues {
  const parameters = exercise.executionParameters;
  const rows = seriesRowsOf(parameters);
  const mode = parameters.mode ?? "REPETITIONS";
  const loads = rows.map((row) => row.loadKg);
  const loadOf = (load: number | undefined) => (parameters.loadEnabled && load !== undefined && load > 0 ? load : null);
  const settings = exercise.format?.settings ?? {};
  const failure = rows.length > 0 && rows.every((row) => row.target.kind === "FAILURE");
  switch (model) {
    case "AMRAP":
      return {
        mode,
        repetitions: firstNumber(rows),
        max: failure,
        increment: typeof settings.incrementPerRound === "number" ? settings.incrementPerRound : 0,
        loadKg: loadOf(loads[0]),
      };
    case "EMOM": {
      const start = loadOf(loads[0]);
      const steps = loads.slice(1).map((load, index) => load - loads[index]!);
      const step = common(steps);
      return {
        mode,
        repetitions: firstNumber(rows),
        loadKg: start,
        ...(step === "variable" ? { loadIncrement: null, seriesLoads: loads } : { loadIncrement: step ?? 0 }),
      };
    }
    case "DEATH_BY":
      return { start: firstNumber(rows), startIncrement: typeof settings.incrementPerRound === "number" ? settings.incrementPerRound : 1 };
    case "FOR_TIME":
      return {
        mode,
        volumes: rows.map((row) => (row.target.kind === "NUMBER" ? row.target.value : null)),
        loads: rows.map((row) => loadOf(row.loadKg)),
      };
    case "PROGRESSION":
      return { mode, cells: rows.map((row) => ({ repetitions: row.target.kind === "NUMBER" ? row.target.value : null, loadKg: loadOf(row.loadKg) })) };
    default:
      return {};
  }
}

/** Questionnaire et récapitulatif reconstruits depuis l'état actuel du Circuit (§6 sexies.3, §6 sexies.7). */
export function modelStateOfCircuit(model: FormatModelKey, circuit: StructureCircuit<SessionDraftExercise>): ModelReeditState {
  const exercises = circuit.exercises;
  const variable = new Set<ModelAnswerKey>();
  const answers: Record<string, unknown> = { ...initialAnswers(model) };
  const set = (key: ModelAnswerKey, value: unknown) => {
    if (value === "variable") {
      variable.add(key);
      delete answers[key];
    } else if (value !== undefined) answers[key] = value;
  };
  const rowsOf = (exercise: SessionDraftExercise) => seriesRowsOf(exercise.executionParameters);
  const format = circuit.format ?? null;
  const roles = exercises.map((exercise, index) => circuitRoleOf(exercise.format, index));
  const tours = exercises.filter((_, index) => roles[index] === "TOUR");
  const recovery = exercises.map((exercise) => exercise.postActivityRecoverySeconds ?? 0);
  // Exécution : nature et Format du Circuit.
  if (format !== null && (model === "EMOM" || model === "DEATH_BY")) answers.execution = circuit.nature === "SERIES" ? "ALTERNATED" : "EACH_INTERVAL";
  else if (circuit.nature === "SERIES") answers.execution = "ALTERNATED";
  else answers.execution = "SEQUENCE";
  switch (model) {
    case "TABATA":
    case "INTERVALS_30_30":
      set("seriesCount", circuit.nature === "SERIES" ? circuit.repeatCount : common(exercises.map((exercise) => rowsOf(exercise).length)));
      set("workSeconds", common(exercises.map((exercise) => firstNumber(rowsOf(exercise)))));
      set("pauseSeconds", common(exercises.map((exercise) => rowsOf(exercise)[0]?.pauseSeconds ?? 0)));
      if (answers.execution === "SEQUENCE" && exercises.length > 1) set("recoveryBetweenSeconds", common(recovery.slice(0, -1)));
      break;
    case "STRENGTH":
    case "UNTIL_FAILURE":
    case "PROGRESSION":
      set("seriesCount", circuit.nature === "SERIES" ? circuit.repeatCount : common(exercises.map((exercise) => rowsOf(exercise).length)));
      set("pauseSeconds", common(exercises.map((exercise) => rowsOf(exercise)[0]?.pauseSeconds ?? 0)));
      if (model === "STRENGTH") set("repetitions", common(exercises.map((exercise) => firstNumber(rowsOf(exercise)))));
      if (model === "PROGRESSION") answers.withLoad = exercises.some((exercise) => exercise.executionParameters.loadEnabled);
      break;
    case "SUPERSET":
      answers.roundCount = circuit.repeatCount;
      set("recoveryBetweenSeconds", recovery.at(-1));
      break;
    case "EMOM":
      set("seriesCount", format !== null ? circuit.repeatCount : common(exercises.map((exercise) => rowsOf(exercise).length)));
      set(
        "intervalSeconds",
        format !== null && typeof format.settings.windowSeconds === "number" ? format.settings.windowSeconds : common(exercises.map((exercise) => exercise.format?.settings.intervalSeconds)),
      );
      answers.withLoad = exercises.some((exercise) => exercise.executionParameters.loadEnabled);
      if (answers.execution === "SEQUENCE" && exercises.length > 1) set("recoveryBetweenSeconds", common(recovery.slice(0, -1)));
      break;
    case "DEATH_BY":
      set(
        "intervalSeconds",
        format !== null && typeof format.settings.windowSeconds === "number" ? format.settings.windowSeconds : common(exercises.map((exercise) => exercise.format?.settings.intervalSeconds)),
      );
      if (answers.execution === "SEQUENCE" && exercises.length > 1) set("recoveryBetweenSeconds", common(recovery.slice(0, -1)));
      break;
    case "AMRAP":
      if (format !== null) {
        set("durationSeconds", format.settings.blockSeconds);
        answers.blockCount = circuit.repeatCount;
        set("restBetweenBlocksSeconds", format.settings.restBetweenBlocksSeconds);
      }
      answers.loopRestSeconds = tours.at(-1)?.postActivityRecoverySeconds ?? 0;
      answers.buyIn = roles.includes("BUY_IN");
      answers.increasingVolume = tours.some((exercise) => (exercise.format?.settings.incrementPerRound ?? 0) !== 0);
      answers.withLoad = exercises.some((exercise) => exercise.executionParameters.loadEnabled);
      break;
    case "FOR_TIME":
      answers.roundCount = circuit.repeatCount;
      answers.restBetweenRoundsSeconds = typeof format?.settings.restBetweenRoundsSeconds === "number" ? format.settings.restBetweenRoundsSeconds : 0;
      answers.timeCapSeconds = typeof format?.settings.timeCapSeconds === "number" ? format.settings.timeCapSeconds : null;
      // Interrupteurs Buy-in / Buy-out du questionnaire (recette du 04/11/2026) : déduits des Rôles.
      answers.buyIn = roles.includes("BUY_IN");
      answers.buyOut = roles.includes("BUY_OUT");
      answers.withLoad = exercises.some((exercise) => exercise.executionParameters.loadEnabled);
      break;
    default:
      break;
  }
  const movements = exercises.map((exercise, index): ModelMovement => ({
    exercise,
    values: valuesOf(model, exercise),
    ...(roles[index] === "BUY_IN" ? { buyIn: true as const } : roles[index] === "BUY_OUT" ? { buyOut: true as const } : {}),
  }));
  return { model, answers: answers as ModelAnswers, movements, variable };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Applique à `current` la différence entre `before` et `after` (objets imbriqués ; listes remplacées entières). */
export function applyDelta<T>(current: T, before: T, after: T): T {
  if (same(before, after)) return current;
  if (!isPlainObject(before) || !isPlainObject(after) || !isPlainObject(current)) return after;
  const result: Record<string, unknown> = { ...current };
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const was = before[key];
    const now = after[key];
    if (same(was, now)) continue;
    if (now === undefined) delete result[key];
    else result[key] = isPlainObject(was) && isPlainObject(now) && isPlainObject(current[key]) ? applyDelta(current[key], was, now) : now;
  }
  return result as T;
}

/**
 * « Enregistrer les modifications » : le Circuit `circuitId` est mis à jour en place (voir l'en-tête). `opened` :
 * état reconstruit à l'ouverture ; `edited` : état du formulaire au moment de l'enregistrement.
 */
export function applyModelReedit(draft: SessionDraft, circuitId: string, opened: ModelReeditState, edited: ModelReeditState, newId: () => string): SessionDraft {
  const layout = currentLayout(draft, newId);
  const circuit = structureCircuits(layout).find((item) => item.id === circuitId);
  if (circuit === undefined) return draft;
  const fixedId = () => "reedit";
  const before = buildModelElements(opened.model, opened.answers, opened.movements, fixedId);
  const after = buildModelElements(edited.model, edited.answers, edited.movements, fixedId);
  const builtExercises = (elements: readonly StructureElement<SessionDraftExercise>[]) =>
    new Map(elements.flatMap((element) => (element.kind === "CIRCUIT" ? element.circuit.exercises : element.kind === "EXERCISE" ? [element.exercise] : [])).map((exercise) => [exercise.id, exercise]));
  const beforeById = builtExercises(before);
  const afterById = builtExercises(after);
  const currentById = new Map(draft.exercises.map((exercise) => [exercise.id, exercise]));
  // Exercices du Circuit après édition, dans l'ordre produit (zones comprises) ; identifiants conservés.
  const afterOrder = [...afterById.keys()];
  const updated = afterOrder.map((id) => {
    const now = afterById.get(id)!;
    const current = currentById.get(id);
    const was = beforeById.get(id);
    return current !== undefined && was !== undefined ? applyDelta(current, was, now) : now;
  });
  const removed = new Set(circuit.exercises.filter((id) => !afterById.has(id)));
  const builtCircuit = (elements: readonly StructureElement<SessionDraftExercise>[]) => (elements[0]?.kind === "CIRCUIT" ? elements[0].circuit : null);
  const beforeCircuit = builtCircuit(before);
  const afterCircuit = builtCircuit(after);
  const shape = (item: StructureCircuit<unknown> | null) => (item === null ? null : { nature: item.nature, repeatCount: item.repeatCount, format: item.format ?? null });
  const circuitPatch = applyDelta(shape(circuit as StructureCircuit<unknown>), shape(beforeCircuit), shape(afterCircuit));
  const nextCircuit: StructureCircuit<string> = {
    ...circuit,
    ...(circuitPatch === null ? {} : { nature: circuitPatch.nature, repeatCount: circuitPatch.repeatCount }),
    exercises: afterOrder,
  };
  const { format: _format, ...withoutFormat } = nextCircuit;
  const withFormat: StructureCircuit<string> = circuitPatch?.format ? { ...withoutFormat, format: circuitPatch.format } : withoutFormat;
  const visit = (item: StructureCircuit<string>) => (item.id === circuitId ? withFormat : item);
  const exercises = [
    ...draft.exercises.filter((exercise) => !removed.has(exercise.id) && !afterById.has(exercise.id)),
    ...updated.map((exercise) => ({ ...exercise, structuralPosition: "BEFORE_TOUR" as const })),
  ];
  // Ordre des Exercices du brouillon : celui d'origine, les nouveaux à la fin.
  const rank = new Map(draft.exercises.map((exercise, index) => [exercise.id, index]));
  exercises.sort((left, right) => (rank.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(right.id) ?? Number.MAX_SAFE_INTEGER));
  return withLayout(
    { ...draft, exercises },
    {
      ...layout,
      elements: layout.elements.map((element) =>
        element.kind === "CIRCUIT"
          ? { ...element, circuit: visit(element.circuit) }
          : element.kind === "CYCLE"
            ? { ...element, cycle: { ...element.cycle, members: element.cycle.members.map((member) => (member.kind === "CIRCUIT" ? { ...member, circuit: visit(member.circuit) } : member)) } }
            : element,
      ),
    },
  );
}
