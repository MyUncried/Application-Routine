/**
 * PRE-9 (story B.1b, D-451, COMP §1 et §4) — présentation d'une disposition générale dans la
 * Composition : un brouillon dont la structure n'est pas représentable dans l'ancien modèle
 * (plusieurs Circuits, un Cycle — `legacyFromStructure` nul) est rendu selon sa structure, les
 * contenus des Exercices venant de `draft.exercises` (A.1).
 *
 * Fonctions pures.
 */

import type { CircuitLoss } from "@/domain/sessions/circuit";
import { circuitOfExercise, insertExerciseInLayout, settleLayoutCircuitMembership } from "@/domain/sessions/layoutOperations";
import { legacyFromStructure, computeStructureDuration, structureExercises, type SessionStructure, type StructureCycleMember, type StructureElement, type StructureStopPointLocation } from "@/domain/sessions/structure";
import type { SessionDraft, SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { formatSessionDurationEstimate } from "@/features/sessions/compositionPresentation";

export type ResolvedLayout = SessionStructure<SessionDraftExercise, StructureStopPointLocation>;
export type ResolvedLayoutElement = StructureElement<SessionDraftExercise>;

/**
 * Disposition générale du brouillon, Exercices résolus dans `draft.exercises` ; `null` si le
 * brouillon relève de l'ancien modèle (rendu historique par zones).
 *
 * Mêmes règles que l'enregistrement (`toStructuredSessionInput` / `withDraftExercises`) : un
 * identifiant absent du brouillon n'est pas rendu (un conteneur garde sa place, même vide) ; un
 * Exercice du brouillon absent de la disposition (ajouté depuis la Composition) est rendu à la fin,
 * au niveau de la Séance, là où l'enregistrement le place.
 *
 * PRE-9 B.4 : `force` — rendu selon la structure même représentable dans l'ancien modèle, le temps
 * de l'effacement d'un conteneur vidé par une dépose.
 */
export function resolveRichLayout(draft: Pick<SessionDraft, "structure" | "exercises">, force = false): ResolvedLayout | null {
  const layout = draft.structure;
  if (layout === undefined || (!force && legacyFromStructure(layout) !== null)) {
    return null;
  }
  const byId = new Map(draft.exercises.map((exercise) => [exercise.id, exercise]));
  const placed = new Set<string>();
  const resolve = (ids: readonly string[]): SessionDraftExercise[] =>
    ids.flatMap((id) => {
      const exercise = byId.get(id);
      if (exercise === undefined) return [];
      placed.add(id);
      return [exercise];
    });
  const elements = layout.elements.flatMap((element): ResolvedLayoutElement[] => {
    switch (element.kind) {
      case "EXERCISE":
        return resolve([element.exercise]).map((exercise) => ({ kind: "EXERCISE", exercise }));
      case "CIRCUIT":
        return [{ kind: "CIRCUIT", circuit: { ...element.circuit, exercises: resolve(element.circuit.exercises) } }];
      case "CYCLE":
        return [
          {
            kind: "CYCLE",
            cycle: {
              ...element.cycle,
              members: element.cycle.members.flatMap((member): StructureCycleMember<SessionDraftExercise>[] =>
                member.kind === "CIRCUIT"
                  ? [{ kind: "CIRCUIT" as const, circuit: { ...member.circuit, exercises: resolve(member.circuit.exercises) } }]
                  : resolve([member.exercise]).map((exercise) => ({ kind: "EXERCISE" as const, exercise })),
              ),
            },
          },
        ];
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  });
  const added = draft.exercises
    .filter((exercise) => !placed.has(exercise.id))
    .map((exercise): ResolvedLayoutElement => ({ kind: "EXERCISE", exercise }));
  return { elements: [...elements, ...added], stopPoints: layout.stopPoints };
}

/**
 * Durée affichée d'une partie de la disposition (Circuit, Cycle, Séance entière) : calcul de la
 * structure (`computeStructureDuration` : un Circuit développe ses Exercices selon sa nature et N ;
 * un Cycle multiplie ses Exercices directs et ses Circuits, RM-252), formateur de la Séance
 * (`formatSessionDurationEstimate`, « ≈ » / « ≥ », tranches de 15 s) — même convention que la durée
 * du Circuit de B.1a ; l'arrondi du Cycle reste à qualifier (COMP §4, ARB-11, B.7).
 */
export function formatLayoutDuration(elements: readonly ResolvedLayoutElement[]): string {
  return formatSessionDurationEstimate(computeStructureDuration({ elements }));
}

/**
 * PRE-9 B.2 (ARB-07 : « Nouvel Exercice inséré après le dernier Exercice entré, dans son conteneur,
 * comme actuellement ») — ajout de nouvelles occurrences à une disposition générale. Le repère est
 * celui de l'ancien modèle (`appendActivityAfterLastDisplayed` : le dernier Exercice affiché) ; la
 * première occurrence est insérée après lui, dans son conteneur (`insertExerciseInLayout`), les
 * suivantes chacune après la précédente. `null` : le brouillon relève de l'ancien modèle, dont
 * l'insertion existante s'applique, inchangée.
 *
 * [B.2 : « Le réglage d'une occurrence qui entre dans un Circuit alterné (N du Circuit) relève de
 * B.3 : il n'est pas appliqué ici. » — remplacé par B.3.] PRE-9 (B.3, ch10 « Ajout et sortie du
 * circuit », COMP §6, D-07, D-09) : une occurrence insérée dans un Circuit alterné est adaptée au N de
 * CE Circuit (`settleLayoutCircuitMembership`) ; `losses` non vide : l'appelant demande confirmation
 * AVANT toute écriture (Annuler : rien n'est ajouté), `targetCount` étant le N annoncé et
 * `enteringCount` le nombre d'occurrences entrées dans un Circuit alterné.
 */
export function insertIntoRichLayout(
  draft: SessionDraft,
  additions: readonly SessionDraftExercise[],
): RichLayoutInsertion | null {
  const resolved = resolveRichLayout(draft);
  if (resolved === null) {
    return null;
  }
  const displayed = structureExercises(resolved);
  let anchor = displayed[displayed.length - 1]?.id ?? null;
  let next = draft;
  for (const exercise of additions) {
    next = insertExerciseInLayout(next, exercise, anchor);
    anchor = exercise.id;
  }
  const settled = settleLayoutCircuitMembership(draft, next);
  const enteringCount = additions.filter((exercise) => circuitOfExercise(next.structure, exercise.id)?.nature === "SERIES").length;
  return { exercises: settled.exercises, structure: next.structure, losses: settled.losses, targetCount: settled.targetCount, enteringCount };
}

/** Insertion dans une disposition générale (`insertIntoRichLayout`), avec le réglage du Circuit d'arrivée (B.3). */
export type RichLayoutInsertion = Pick<SessionDraft, "exercises" | "structure"> & {
  readonly losses: readonly CircuitLoss[];
  readonly targetCount: number;
  readonly enteringCount: number;
};
