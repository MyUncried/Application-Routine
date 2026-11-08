/**
 * PRE-9 — actions d'un Circuit replié (mise à jour consolidée des écrans Formats du 04/11/2026 §6 quinquies ;
 * décisions de Hermann du 4 novembre 2026) : Renommer | Dupliquer | Supprimer, et « Modifier le format » pour un
 * Circuit issu d'un modèle (§6 sexies, réédition : `formatReedit.ts`).
 *
 * - **Nom du Circuit** : attribut du Circuit ; par défaut, le nom de son Modèle d'origine (« Tabata »), sinon
 *   « Circuit ». Renommer ne change que le titre (ni Format, ni nature) ; un nom vide reprend le nom par défaut.
 * - **Dupliquer** : copie insérée juste après l'original, avec tous ses Exercices (copies indépendantes, Format et
 *   réglages, Rôles compris) et le Modèle d'origine ; titre « nom (C) ».
 * - **Supprimer** : le Circuit et ses Exercices quittent la Séance (confirmation par l'appelant) ; les Points
 *   d'arrêt du Circuit partent avec lui, ceux rendus interdits ou consécutifs sont réglés comme pour toute
 *   suppression (D-442).
 *
 * Fonctions pures.
 */

import { duplicateActivity } from "./composition";
import { attach, detach, layoutItemLocation, pruneEmpty, withSettledStopPoints } from "./layoutTree";
import { currentLayout, withLayout } from "./layoutOperations";
import type { SessionDraft } from "./SessionDraft";
import { structureCircuits, type StructureCircuit } from "./structure";

function visitCircuit(draft: SessionDraft, circuitId: string, change: (circuit: StructureCircuit<string>) => StructureCircuit<string>, newId: () => string): SessionDraft {
  const layout = currentLayout(draft, newId);
  const visit = (circuit: StructureCircuit<string>) => (circuit.id === circuitId ? change(circuit) : circuit);
  return withLayout(draft, {
    ...layout,
    elements: layout.elements.map((element) =>
      element.kind === "CIRCUIT"
        ? { ...element, circuit: visit(element.circuit) }
        : element.kind === "CYCLE"
          ? { ...element, cycle: { ...element.cycle, members: element.cycle.members.map((member) => (member.kind === "CIRCUIT" ? { ...member, circuit: visit(member.circuit) } : member)) } }
          : element,
    ),
  });
}

/** Renommer : un nom vide (espaces compris) reprend le nom par défaut. */
export function renameLayoutCircuit(draft: SessionDraft, circuitId: string, name: string, newId: () => string): SessionDraft {
  const trimmed = name.trim();
  return visitCircuit(
    draft,
    circuitId,
    (circuit) => {
      const { name: _previous, ...rest } = circuit;
      return trimmed.length === 0 ? rest : { ...rest, name: trimmed };
    },
    newId,
  );
}

export type CircuitDuplication = { readonly draft: SessionDraft; readonly copyId: string } | null;

/**
 * Dupliquer : copie juste après l'original (même conteneur), Exercices copiés dans le même ordre, indépendants ;
 * `defaultName` : nom affiché de l'original, suivi de « (C) » pour la copie.
 */
export function duplicateLayoutCircuit(draft: SessionDraft, circuitId: string, defaultName: string, newId: () => string): CircuitDuplication {
  const layout = currentLayout(draft, newId);
  const source = structureCircuits(layout).find((circuit) => circuit.id === circuitId);
  const location = layoutItemLocation(layout, { kind: "CIRCUIT", id: circuitId });
  if (source === undefined || location === null) return null;
  let exercises = draft.exercises;
  const copies: string[] = [];
  for (const exerciseId of source.exercises) {
    const copyId = newId();
    exercises = duplicateActivity(exercises, exerciseId, copyId);
    copies.push(copyId);
  }
  const copyId = newId();
  const copy: StructureCircuit<string> = { ...source, id: copyId, exercises: copies, name: `${(source.name ?? defaultName).trim()} (C)` };
  const attached = attach(layout, { kind: "CIRCUIT", circuit: copy }, { container: location.container, index: location.index + 1 });
  if (attached === null || attached === "NESTING") return null;
  return { draft: withLayout({ ...draft, exercises }, attached), copyId };
}

/** Supprimer : le Circuit et ses Exercices ; `null` si le Circuit est absent. */
export function removeLayoutCircuit(draft: SessionDraft, circuitId: string, newId: () => string): SessionDraft | null {
  const layout = currentLayout(draft, newId);
  const source = structureCircuits(layout).find((circuit) => circuit.id === circuitId);
  const detached = detach(layout, { kind: "CIRCUIT", id: circuitId });
  if (source === undefined || detached === null) return null;
  const { layout: pruned } = pruneEmpty(detached.layout);
  const removed = new Set(source.exercises);
  const exercises = draft.exercises.filter((exercise) => !removed.has(exercise.id));
  const outcome = withSettledStopPoints({ ...draft, exercises }, layout, pruned, (result) => ({ status: "APPLIED" as const, draft: withLayout({ ...draft, exercises }, result) }));
  // Un conflit de répétition éventuel garde le Point de début (même règle que l'effacement différé, B.5).
  return outcome.status === "CHOICE_REQUIRED" ? outcome.resolutions.HEAD.draft : outcome.draft;
}
