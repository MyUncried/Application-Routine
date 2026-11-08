/**
 * Tests seulement — PRE-9 (A.1) : le service renvoie la Séance dans sa structure générale
 * (`StructuredSession`). Ces aides lisent ses Exercices dans l'ordre d'affichage et joignent à une
 * fixture de l'ancien modèle sa structure exactement équivalente (`structureFromLegacy`).
 */

import { DEFAULT_CIRCUIT_NATURE } from "../circuit";
import type { Activity, Session } from "../Session";
import type { StructuredSession } from "../SessionRepository";
import { structureExercises, structureFromLegacy, type SessionStructure } from "../structure";

/** Exercices de la Séance, chacun une fois, dans l'ordre d'affichage (avant, Circuit, après pour l'ancien modèle). */
export function occurrencesOf(session: { readonly structure?: SessionStructure<Activity> } & Partial<Pick<Session, "cycle">>): readonly Activity[] {
  if (session.structure !== undefined) {
    return structureExercises(session.structure);
  }
  const cycle = session.cycle!;
  return [...(cycle.beforeTour ?? []), ...cycle.tour.exercises, ...(cycle.afterTour ?? [])];
}

/** Fixture de l'ancien modèle complétée de sa structure générale équivalente. */
export function withStructure(session: Session): Session & StructuredSession {
  return {
    ...session,
    structure:
      session.structure ??
      structureFromLegacy(
        {
          beforeTour: session.cycle.beforeTour ?? [],
          tour: { ...session.cycle.tour, nature: session.cycle.tour.nature ?? DEFAULT_CIRCUIT_NATURE },
          afterTour: session.cycle.afterTour ?? [],
        },
        session.stopPoints ?? [],
      ),
  };
}
