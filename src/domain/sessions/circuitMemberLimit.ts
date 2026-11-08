/**
 * Recette du 08/11/2026 au soir — Superset limité (Hermann : « Superset : il est possible dans le
 * circuit de la composition de séance d'ajouter un troisième exercice, ça ne doit pas être
 * autorisé. ») ; référence Formats §9.4 (« Un superset est une paire »). Registre ch07, « Recette du
 * 08/11/2026 au soir — Superset limité ».
 *
 * [Référence Formats §9.4, 05/11/2026 : « Après l'enregistrement, le Circuit est un Circuit standard :
 * un troisième Exercice peut y être ajouté depuis la Composition » — remplacé le 08/11/2026.]
 *
 * Un Circuit issu du Format Superset (Modèle d'origine `SUPERSET`) n'admet pas plus de deux membres :
 * aucune opération de la Composition (dépose, « Monter » / « Descendre », duplication, déplacement
 * vers le Circuit) n'y fait entrer un Exercice supplémentaire.
 *
 * Réponse de Hermann du 08/11/2026 (« Superset : dans la composition on limite à deux exercices aussi. ») :
 * minimum de deux aussi — aucune opération (sortie par glisser, « Monter » / « Descendre », déplacement vers
 * un autre Circuit, suppression) ne laisse un Superset avec moins de deux membres. Le réordonnancement de ses
 * membres reste permis. [« Le réordonnancement de ses membres, leur sortie et leur suppression ne sont pas
 * concernés » — remplacé le 08/11/2026 pour la sortie et la suppression.] Un Superset qui en compte déjà
 * trois (créé avant cette règle) reste tel quel : il se réduit jusqu'à deux, jamais en dessous, et ne
 * s'agrandit pas.
 *
 * Fonctions pures.
 */

import type { FormatModelKey } from "./formatModels";
import { structureCircuits, type StructureCircuit, type StructureElement } from "./structure";

/** Nombre maximal de membres d'un Circuit issu du Format Superset (« une paire »). */
export const SUPERSET_MEMBER_LIMIT = 2;

/** Nombre minimal de membres d'un Circuit issu du Format Superset (réponse de Hermann du 08/11/2026). */
export const SUPERSET_MEMBER_MINIMUM = 2;

type LimitedCircuit = { readonly originModel?: FormatModelKey | null; readonly exercises: readonly unknown[] };

/** Nombre maximal de membres du Circuit ; `null` : aucun maximum (tout Circuit autre qu'un Superset). */
export function circuitMemberLimit(circuit: Pick<LimitedCircuit, "originModel">): number | null {
  return circuit.originModel === "SUPERSET" ? SUPERSET_MEMBER_LIMIT : null;
}

/** Vrai si le Circuit a atteint (ou dépassé) son nombre maximal de membres : aucun membre de plus n'y entre. */
export function circuitAtMemberLimit(circuit: LimitedCircuit): boolean {
  const limit = circuitMemberLimit(circuit);
  return limit !== null && circuit.exercises.length >= limit;
}

/**
 * Vrai si placer l'Exercice `exerciseId` dans le Circuit `circuitId` y ferait entrer un membre de plus
 * qu'il n'en admet. Un membre déjà présent (réordonnancement) n'est jamais concerné ; un Circuit
 * inconnu non plus.
 */
export function entryExceedsMemberLimit(
  layout: { readonly elements: readonly StructureElement<string>[] } | undefined,
  exerciseId: string,
  circuitId: string,
): boolean {
  if (layout === undefined) return false;
  const circuit: StructureCircuit<string> | undefined = structureCircuits(layout).find((item) => item.id === circuitId);
  return circuit !== undefined && !circuit.exercises.includes(exerciseId) && circuitAtMemberLimit(circuit);
}

/** Nombre minimal de membres du Circuit ; `null` : aucun minimum (tout Circuit autre qu'un Superset). */
export function circuitMemberMinimum(circuit: Pick<LimitedCircuit, "originModel">): number | null {
  return circuit.originModel === "SUPERSET" ? SUPERSET_MEMBER_MINIMUM : null;
}

/** Vrai si le Circuit est à son nombre minimal de membres (ou en dessous) : aucun membre n'en sort. */
export function circuitAtMemberMinimum(circuit: LimitedCircuit): boolean {
  const minimum = circuitMemberMinimum(circuit);
  return minimum !== null && circuit.exercises.length <= minimum;
}

/**
 * Vrai si retirer l'Exercice `exerciseId` de son Circuit (sortie, suppression, déplacement vers un autre
 * Circuit) laisserait ce Circuit sous son nombre minimal de membres. Un Exercice hors de tout Circuit n'est
 * jamais concerné.
 */
export function exitBreaksMemberMinimum(layout: { readonly elements: readonly StructureElement<string>[] } | undefined, exerciseId: string): boolean {
  if (layout === undefined) return false;
  const circuit = structureCircuits(layout).find((item) => item.exercises.includes(exerciseId));
  return circuit !== undefined && circuitAtMemberMinimum(circuit);
}
