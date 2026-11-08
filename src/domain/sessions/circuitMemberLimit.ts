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
 * vers le Circuit) n'y fait entrer un Exercice supplémentaire. Le réordonnancement de ses membres, leur
 * sortie et leur suppression ne sont pas concernés. Un Superset qui en compte déjà plus (créé avant
 * cette règle) n'est ni modifié ni signalé (À CLARIFIER, rapport 2026-11-08_PRE9-SUPERSET-LIMITE).
 *
 * Fonctions pures.
 */

import type { FormatModelKey } from "./formatModels";
import { structureCircuits, type StructureCircuit, type StructureElement } from "./structure";

/** Nombre maximal de membres d'un Circuit issu du Format Superset (« une paire »). */
export const SUPERSET_MEMBER_LIMIT = 2;

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
