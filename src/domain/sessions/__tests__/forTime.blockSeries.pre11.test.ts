import { describe, expect, it } from "@jest/globals";

import { seriesRowsOf, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { ElementFormat } from "@/domain/sessions/formats";
import { withForTimeSeries } from "@/domain/sessions/forTimeSeries";
import { createEmptyDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { formatSheetContextOf } from "@/features/sessions/formatSheetContext";
import { inheritsCircuitSeriesCount } from "@/features/sessions/movementExercises";

/**
 * PRE-11 — demande de Hermann du 14/11/2026 (soir) : « Pour les exercices en buy in et en buy out, je dois pouvoir ajouter ou
 * supprimer des séries dans la composition de séance ». Le nombre de séries reste commun au bloc (correction 2, règle 1) : le
 * changement fait sur un exercice vaut pour tout son bloc ; les valeurs retirées aux autres exercices sont annoncées avant.
 * [Remplacé par la recette du 14/11/2026 (m2, m3) : exercices du buy-in et du buy-out indépendants.]
 */

const BUY_IN: ElementFormat = { key: "FOR_TIME", settings: { circuitRole: 1 } };
const BUY_OUT: ElementFormat = { key: "FOR_TIME", settings: { circuitRole: 2 } };
const TOUR: ElementFormat = { key: "FOR_TIME", settings: {} };
const CIRCUIT_FORMAT: ElementFormat = { key: "FOR_TIME", settings: { restBetweenRoundsSeconds: 0 } };

const reps = (values: readonly number[]) => variableParameters({ mode: "REPETITIONS", rows: values.map((value) => [value, 0] as const) });

const exercise = (id: string, parameters: ExecutionParametersInput, format: ElementFormat): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: parameters,
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: `mv-${id}`,
  format,
});

/** Buy-in a et b (2 séries : 30-40 et 5-6), tour t (3 tours), buy-out z (1 série). */
function forTime(): SessionDraft {
  const members = [
    exercise("a", reps([30, 40]), BUY_IN),
    exercise("b", reps([5, 6]), BUY_IN),
    exercise("t", reps([10, 10, 10]), TOUR),
    exercise("z", reps([50]), BUY_OUT),
  ];
  return {
    ...createEmptyDraft(),
    exercises: members,
    structure: {
      elements: [{ kind: "CIRCUIT", circuit: { id: "f", nature: "SERIES", repeatCount: 3, format: CIRCUIT_FORMAT, exercises: members.map((item) => item.id), originModel: "FOR_TIME" } }],
      stopPoints: [],
    },
  };
}

const targets = (draft: Pick<SessionDraft, "exercises">, id: string) =>
  seriesRowsOf(draft.exercises.find((item) => item.id === id)!.executionParameters).map((row) => (row.target.kind === "NUMBER" ? row.target.value : row.target.kind));

/** Écriture comme le fournisseur du brouillon : paramètres de `id` remplacés, puis For time remis en règle d'après l'état précédent. */
function apply(draft: SessionDraft, id: string, parameters: ExecutionParametersInput): SessionDraft {
  const next = { ...draft, exercises: draft.exercises.map((item) => (item.id === id ? { ...item, executionParameters: parameters } : item)) };
  return withForTimeSeries(next, draft);
}

// Recette du 14/11/2026 (Hermann, m2 et m3 : « Les exercices de buy in (et de buy out) sont indépendants, changer le nombre de séries
// de l’un ne doit avoir aucun impact sur l’autre »). [Nombre de séries commun au bloc, pertes des autres exercices annoncées — remplacé.]
describe("buy-in et buy-out : séries ajoutées ou retirées dans la Composition, exercices indépendants (14/11/2026)", () => {
  it("la modale laisse régler le nombre de séries en buy-in et en buy-out ; en tour, il reste celui des tours", () => {
    const draft = forTime();
    const of = (id: string) => draft.exercises.find((item) => item.id === id)!;
    expect(inheritsCircuitSeriesCount(draft, of("a"))).toBe(false);
    expect(inheritsCircuitSeriesCount(draft, of("z"))).toBe(false);
    expect(inheritsCircuitSeriesCount(draft, of("t"))).toBe(true);
  });

  it("ajout d'une série à un exercice du buy-in : lui seul passe à 3 séries ; l'autre exercice du buy-in garde ses 2 séries", () => {
    const draft = forTime();
    const next = apply(draft, "a", reps([30, 40, 45]));
    expect(targets(next, "a")).toEqual([30, 40, 45]);
    expect(targets(next, "b")).toEqual([5, 6]);
    expect(targets(next, "t")).toEqual([10, 10, 10]);
    expect(targets(next, "z")).toEqual([50]);
  });

  it("retrait d'une série : lui seul passe à 1 série, aucune annonce pour les autres", () => {
    const draft = forTime();
    const next = apply(draft, "a", reps([30]));
    expect(targets(next, "a")).toEqual([30]);
    expect(targets(next, "b")).toEqual([5, 6]);
    expect(targets(next, "t")).toEqual([10, 10, 10]);
  });

  it("lecture d'une séance aux nombres différents dans un bloc : chacun garde les siens", () => {
    const draft = forTime();
    const diverging = { ...draft, exercises: draft.exercises.map((item) => (item.id === "b" ? { ...item, executionParameters: reps([5]) } : item)) };
    expect(targets(withForTimeSeries(diverging), "b")).toEqual([5]);
    expect(targets(withForTimeSeries(diverging), "a")).toEqual([30, 40]);
  });
});

// Précision de Hermann du 14/11/2026 (soir) : « si je transforme un exercice Buy In ou Buy Out en un exercice Tour, il doit héritier
// du nombre de Tours du circuit ».
describe("buy-in ou buy-out transformé en Tour : nombre de tours hérité (14/11/2026)", () => {
  // Recette du 14/11/2026 (m5 : « Il ne faut pas reprendre automatiquement la valeur de la dernière série »). [Dernière valeur reprise — remplacé.]
  it("la modale reçoit les séries du Rôle choisi : Tour → une par tour (3), séries ajoutées à renseigner (buy-in comme buy-out)", () => {
    const draft = forTime();
    const seriesForRole = formatSheetContextOf(draft, "a", () => undefined)!.seriesForRole!;
    const a = draft.exercises.find((item) => item.id === "a")!.executionParameters;
    expect(targets({ exercises: [{ ...draft.exercises[0]!, executionParameters: seriesForRole("TOUR", a) }] }, "a")).toEqual([30, 40, "UNSET"]);
    const z = draft.exercises.find((item) => item.id === "z")!.executionParameters;
    expect(targets({ exercises: [{ ...draft.exercises[3]!, executionParameters: formatSheetContextOf(draft, "z", () => undefined)!.seriesForRole!("TOUR", z) }] }, "z")).toEqual([50, "UNSET", "UNSET"]);
    expect(formatSheetContextOf(draft, "t", () => undefined)!.seriesForRole).toBeDefined();
  });

  it("✓ de la modale (Rôle enregistré, puis séries) : l'exercice passe à 3 séries en tour ; l'autre exercice du buy-in garde ses 2 séries", () => {
    const draft = forTime();
    const context = formatSheetContextOf(draft, "a", () => undefined)!;
    const shown = context.seriesForRole!("TOUR", draft.exercises[0]!.executionParameters);
    let current = draft;
    const roleSet = formatSheetContextOf(current, "a", (change) => {
      current = withForTimeSeries(change(current), current);
    })!;
    roleSet.onApply(roleSet.settings, "TOUR");
    current = apply(current, "a", shown);
    expect(targets(current, "a")).toEqual([30, 40, "UNSET"]);
    expect(targets(current, "b")).toEqual([5, 6]);
    expect(targets(current, "t")).toEqual([10, 10, 10]);
    expect(inheritsCircuitSeriesCount(current, current.exercises.find((item) => item.id === "a")!)).toBe(true);
  });
});
