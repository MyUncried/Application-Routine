/**
 * PRE-7 (A1.3, API-SEA-05, D-188, MFN-03, MFN/AC04) — duplication d'une
 * Séance : nouvelle Séance indépendante, brouillon de CRÉATION construit
 * depuis la Séance enregistrée (`toSessionDraft`).
 *
 * - nom `{nom} (copie)`, puis le premier suffixe numéroté disponible
 *   (`nextCopyName`, mêmes bornes que les noms d'Exercice) ;
 * - copie de l'Étiquette, de la Composition (occurrences, Récupérations,
 *   Circuit, Points d'arrêt) et des paramètres ; aucune Routine ni Exécution ;
 * - nouveaux identifiants d'occurrence (`newActivityId`, fourni par
 *   l'appelant : ce module reste pur) ; les identifiants de Séance, de Points
 *   d'arrêt et de liens de médias sont créés par l'enregistrement. PRE-9
 *   (A.1) : une structure de l'ancien modèle reçoit un Circuit neuf à
 *   l'enregistrement ; une structure plus riche (Cycles, plusieurs Circuits)
 *   est copiée à l'identique avec de nouveaux identifiants de Cycle et de
 *   Circuit (`newActivityId`) ; PRE-9 (C.1, ARB-17 ; correction du 30/10) : le Format porté par
 *   un Exercice et ses réglages sont copiés avec lui, où qu'il soit (le Circuit n'en porte aucun) ;
 * - filiation (`sourceMovementId`) de chaque occurrence conservée à
 *   l'identique, jamais relue ni réécrite (MFN-03).
 *
 * Fonction pure — sans React, SQLite ni Expo.
 */

import { nextCopyName } from "./composition";
import type { Session } from "./Session";
import { toSessionDraft, type SessionDraft } from "./SessionDraft";
import type { StructuredSession } from "./SessionRepository";
import {
  isEditedAsLegacy,
  mapStructure,
  type SessionStructure,
  type StructureCircuit,
  type StructureStopPointLocation,
} from "./structure";

export function toDuplicateSessionDraft(
  session: Session | StructuredSession,
  newActivityId: () => string,
  takenSessionNames: Iterable<string>,
): SessionDraft {
  // PRE-9 (C.1) : l'origine de création n'est pas recopiée (la copie n'est pas créée depuis la grille ; À CLARIFIER, spec C.1).
  const { persistedExerciseIds: _persisted, structure: layout, origin: _origin, ...draft } = toSessionDraft(session);
  const exerciseIds = new Map(draft.exercises.map((exercise) => [exercise.id, newActivityId()]));
  const copiedLayout = layout === undefined || isEditedAsLegacy(layout) ? undefined : renewIdentities(layout, exerciseIds, newActivityId);
  return {
    ...draft,
    // Création : aucune Séance source, aucune occurrence tenue pour existante.
    sourceSessionId: null,
    name: nextCopyName(session.name, takenSessionNames),
    exercises: draft.exercises.map((exercise) => ({ ...exercise, id: exerciseIds.get(exercise.id)! })),
    ...(copiedLayout !== undefined ? { structure: copiedLayout } : {}),
  };
}

/** Disposition copiée : nouveaux identifiants d'Exercice, de Circuit et de Cycle, Points rattachés aux nouveaux conteneurs. */
function renewIdentities(
  layout: SessionStructure<string, StructureStopPointLocation>,
  exerciseIds: ReadonlyMap<string, string>,
  newId: () => string,
): SessionStructure<string, StructureStopPointLocation> {
  const containers = new Map<string, string>();
  const renewed = (id: string) => {
    const next = newId();
    containers.set(id, next);
    return next;
  };
  const renewCircuit = (circuit: StructureCircuit<string>): StructureCircuit<string> => ({ ...circuit, id: renewed(circuit.id) });
  const mapped = mapStructure(layout, (id) => exerciseIds.get(id) ?? id);
  return {
    elements: mapped.elements.map((element) => {
      switch (element.kind) {
        case "EXERCISE":
          return element;
        case "CIRCUIT":
          return { kind: "CIRCUIT", circuit: renewCircuit(element.circuit) };
        case "CYCLE":
          return {
            kind: "CYCLE",
            cycle: {
              ...element.cycle,
              id: renewed(element.cycle.id),
              members: element.cycle.members.map((member) =>
                member.kind === "CIRCUIT" ? { kind: "CIRCUIT", circuit: renewCircuit(member.circuit) } : member,
              ),
            },
          };
        default: {
          const unreachable: never = element;
          return unreachable;
        }
      }
    }),
    stopPoints: layout.stopPoints.map((point) => ({
      ...point,
      circuitId: point.circuitId === null ? null : (containers.get(point.circuitId) ?? point.circuitId),
      ...((point.cycleId ?? null) !== null ? { cycleId: containers.get(point.cycleId!) ?? point.cycleId } : {}),
    })),
  };
}
