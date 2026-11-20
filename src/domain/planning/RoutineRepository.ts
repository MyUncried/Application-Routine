import type { Routine } from "./Routine";

/**
 * Port de persistance des Routines (API-ROU-01 à 04). Une Routine est écrite entière — créneau, liste ordonnée,
 * retraits — dans une seule transaction : jamais de Routine partielle (CE-UI-05 §15).
 */
export interface RoutineRepository {
  list(): Promise<readonly Routine[]>;
  get(routineId: string): Promise<Routine | null>;
  /** Crée ou remplace la Routine `routine.id` (liste et retraits compris). */
  save(routine: Routine): Promise<void>;
  /** Supprime la Routine ; ses sources et les Exécutions sont conservées (RM-050). */
  delete(routineId: string): Promise<boolean>;
  /** R-04 : retire une occurrence (date/heure d'origine) ; idempotent. */
  addExclusion(routineId: string, occurrenceKey: string, at: string): Promise<boolean>;
}
