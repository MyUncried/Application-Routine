/**
 * PRE-9 — Rôle dans le circuit (mise à jour consolidée des écrans Formats du 04/11/2026 §6 bis 2 ; référence
 * Formats §3, §6 ; décisions de Hermann des 3 et 4 novembre 2026, registre ch07 « Formats — décisions du 4
 * novembre 2026 »).
 *
 * - Dans un Circuit porteur AMRAP ou For time, chaque membre porte un Rôle : Buy-in | Tour (AMRAP), Buy-in |
 *   Tour | Buy-out (For time). Le Circuit est découpé en trois zones dans cet ordre — buy-in, tour (la
 *   boucle), buy-out ; plusieurs buy-in et buy-out, exécutés une seule fois dans l'ordre.
 * - Le Rôle fixe la zone : passer en Buy-in place l'Exercice à la fin de la zone buy-in, en Buy-out à la fin
 *   de la zone buy-out ; revenir à Tour le place en tête de la boucle. Le glisser-déposer réordonne à
 *   l'intérieur d'une zone ; changer de zone passe par le Rôle.
 * - Au moins un Exercice reste en Tour : pour le dernier membre de la boucle, Buy-in et Buy-out sont
 *   indisponibles ; il ne peut ni être supprimé ni sortir du Circuit tant qu'un buy-in ou buy-out reste.
 * - For time : au moins un Exercice de l'ensemble du Circuit en Répétitions (buy-in et buy-out compris).
 * - Changer de rôle ne perd rien : Incrément et Récupération conservés, sans effet hors de la boucle ; For time,
 *   un Exercice à l'échec passé en Buy-in ou Buy-out passe À l'objectif, objectif « à renseigner ».
 *
 * [Passage « Une fois » réservé au premier ou au dernier membre, buy-in unique et non duplicable,
 * réordonnancement par la seule position — remplacés le 04/11/2026.] Fonctions pures.
 */

import { unsetTarget } from "@/domain/activities/ExecutionParameters";

import { admittedCircuitRoles, circuitRoleOf, withCircuitRole, type CircuitRole } from "./formats";
import { structureCircuits, type SessionStructure, type StructureCircuit, type StructureStopPointLocation } from "./structure";
import type { SessionDraft, SessionDraftExercise } from "./SessionDraft";

type Layout = SessionStructure<string, StructureStopPointLocation>;
type LayoutLike = Pick<Layout, "elements">;

const ZONE_RANK: Readonly<Record<CircuitRole, number>> = { BUY_IN: 0, TOUR: 1, BUY_OUT: 2 };

/** Circuit porteur AMRAP ou For time : ses membres portent un Rôle. */
export function circuitHasRoles(circuit: Pick<StructureCircuit<string>, "format">): boolean {
  const key = circuit.format?.key;
  return key === "AMRAP" || key === "FOR_TIME";
}

function exerciseById(draft: Pick<SessionDraft, "exercises">, id: string): SessionDraftExercise | undefined {
  return draft.exercises.find((exercise) => exercise.id === id);
}

/** Rôles des membres d'un Circuit, dans l'ordre (Tour pour un Circuit sans Rôle). */
export function memberRoles(draft: Pick<SessionDraft, "exercises">, circuit: StructureCircuit<string>): readonly CircuitRole[] {
  if (!circuitHasRoles(circuit)) return circuit.exercises.map(() => "TOUR");
  return circuit.exercises.map((id, index) => circuitRoleOf(exerciseById(draft, id)?.format, index));
}

/** Les Rôles d'une liste suivent l'ordre des zones (buy-in, tour, buy-out). */
export function zonesOrdered(roles: readonly CircuitRole[]): boolean {
  return roles.every((role, index) => index === 0 || ZONE_RANK[roles[index - 1]!] <= ZONE_RANK[role]);
}

function circuitOf(layout: LayoutLike | undefined, exerciseId: string): StructureCircuit<string> | undefined {
  return layout === undefined ? undefined : structureCircuits<string>(layout).find((circuit) => circuit.exercises.includes(exerciseId));
}

/** Dernier membre de la boucle, alors qu'un buy-in ou un buy-out reste : ni sortie, ni suppression, ni autre Rôle. */
export function isLastTourMember(draft: Pick<SessionDraft, "exercises">, layout: LayoutLike | undefined, exerciseId: string): boolean {
  const circuit = circuitOf(layout, exerciseId);
  if (circuit === undefined || !circuitHasRoles(circuit)) return false;
  const roles = memberRoles(draft, circuit);
  const index = circuit.exercises.indexOf(exerciseId);
  const tours = roles.filter((role) => role === "TOUR").length;
  return roles[index] === "TOUR" && tours === 1 && roles.some((role) => role !== "TOUR");
}

/**
 * For time : dernier Exercice en Répétitions de l'ensemble du Circuit (buy-in et buy-out compris) — l'option
 * Durée lui est refusée, comme sa suppression ou sa sortie quand d'autres membres restent.
 */
export function isLastRepetitionsMember(draft: Pick<SessionDraft, "exercises">, layout: LayoutLike | undefined, exerciseId: string): boolean {
  const circuit = circuitOf(layout, exerciseId);
  if (circuit === undefined || circuit.format?.key !== "FOR_TIME" || circuit.exercises.length < 2) return false;
  const inRepetitions = circuit.exercises.filter((id) => (exerciseById(draft, id)?.executionParameters.mode ?? "REPETITIONS") === "REPETITIONS");
  return inRepetitions.length === 1 && inRepetitions[0] === exerciseId;
}

/** Garde de suppression ou de sortie d'un membre (voir `isLastTourMember`, `isLastRepetitionsMember`). */
export type MemberRemovalBlock = "LAST_TOUR" | "LAST_REPETITIONS";

export function memberRemovalBlock(draft: Pick<SessionDraft, "exercises">, layout: LayoutLike | undefined, exerciseId: string): MemberRemovalBlock | null {
  if (isLastTourMember(draft, layout, exerciseId)) return "LAST_TOUR";
  if (isLastRepetitionsMember(draft, layout, exerciseId)) return "LAST_REPETITIONS";
  return null;
}

/** Rôles proposés à un membre ; Buy-in et Buy-out indisponibles pour le dernier membre de la boucle. */
export function roleChoices(
  draft: Pick<SessionDraft, "exercises">,
  layout: LayoutLike | undefined,
  exerciseId: string,
): { readonly admitted: readonly CircuitRole[]; readonly available: readonly CircuitRole[]; readonly current: CircuitRole } | null {
  const circuit = circuitOf(layout, exerciseId);
  if (circuit === undefined || !circuitHasRoles(circuit) || circuit.format === undefined || circuit.format === null) return null;
  const roles = memberRoles(draft, circuit);
  const current = roles[circuit.exercises.indexOf(exerciseId)] ?? "TOUR";
  const admitted = admittedCircuitRoles(circuit.format.key);
  const lastTour = current === "TOUR" && roles.filter((role) => role === "TOUR").length === 1;
  return { admitted, available: lastTour ? ["TOUR"] : admitted, current };
}

/**
 * Nouveau Rôle d'un membre : réglage du membre remplacé, Exercice replacé dans sa zone (fin de la zone buy-in
 * ou buy-out, tête de la boucle). For time : un Exercice à l'échec passé en Buy-in ou Buy-out passe À l'objectif
 * (cible « à renseigner »). Rien ne change si le Rôle est refusé (dernier membre de la boucle) ou identique.
 */
export function setMemberRole(draft: SessionDraft, exerciseId: string, role: CircuitRole): SessionDraft {
  const layout = draft.structure;
  const choices = roleChoices(draft, layout, exerciseId);
  if (choices === null || choices.current === role || !choices.available.includes(role) || layout === undefined) return draft;
  const circuit = circuitOf(layout, exerciseId)!;
  const exercises = draft.exercises.map((exercise) => {
    if (exercise.id !== exerciseId || exercise.format === undefined || exercise.format === null) return exercise;
    const format = withCircuitRole(exercise.format, role);
    const parameters = exercise.executionParameters;
    const series = parameters.series;
    const toTarget = circuit.format?.key === "FOR_TIME" && role !== "TOUR";
    const retargeted =
      toTarget && series.kind === "UNIFORM" && series.target.kind === "FAILURE"
        ? { ...parameters, series: { ...series, target: unsetTarget() } }
        : toTarget && series.kind === "VARIABLE" && series.rows.some((row) => row.target.kind === "FAILURE")
          ? { ...parameters, series: { ...series, rows: series.rows.map((row) => (row.target.kind === "FAILURE" ? { ...row, target: unsetTarget() } : row)) } }
          : parameters;
    return { ...exercise, format, executionParameters: retargeted };
  });
  const roles = new Map(circuit.exercises.map((id, index) => [id, id === exerciseId ? role : circuitRoleOf(exerciseById(draft, id)?.format, index)]));
  const others = circuit.exercises.filter((id) => id !== exerciseId);
  const zone = (wanted: CircuitRole) => others.filter((id) => roles.get(id) === wanted);
  const ordered =
    role === "BUY_IN"
      ? [...zone("BUY_IN"), exerciseId, ...zone("TOUR"), ...zone("BUY_OUT")]
      : role === "BUY_OUT"
        ? [...zone("BUY_IN"), ...zone("TOUR"), ...zone("BUY_OUT"), exerciseId]
        : [...zone("BUY_IN"), exerciseId, ...zone("TOUR"), ...zone("BUY_OUT")];
  return { ...draft, exercises, structure: reorderCircuit(layout, circuit.id, ordered) };
}

function reorderCircuit<L extends LayoutLike>(layout: L, circuitId: string, ordered: readonly string[]): L {
  const visit = (circuit: StructureCircuit<string>): StructureCircuit<string> => (circuit.id === circuitId ? { ...circuit, exercises: ordered } : circuit);
  return {
    ...layout,
    elements: layout.elements.map((element) =>
      element.kind === "CIRCUIT"
        ? { ...element, circuit: visit(element.circuit) }
        : element.kind === "CYCLE"
          ? { ...element, cycle: { ...element.cycle, members: element.cycle.members.map((member) => (member.kind === "CIRCUIT" ? { ...member, circuit: visit(member.circuit) } : member)) } }
          : element,
    ),
  };
}
